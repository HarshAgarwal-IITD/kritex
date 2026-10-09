#!/usr/bin/env node
/**
 * Full-stack e2e harness (QA-1). Boots a throwaway copy of the real stack and runs a command against it:
 *
 *   1. compiles kritex-server (from KRITEX_SERVER_DIR) into a temp dir (never touches the server's own dist/),
 *   2. `prisma migrate deploy` + `prisma db seed` on a dedicated database: catalog with placeholder prices and an
 *      ADMIN user with a password (both idempotent; E2E_RESET=1 wipes the DB first with `prisma migrate reset --force`),
 *   3. starts the API on E2E_API_PORT (no Razorpay keys → fake gateway; dev mail log → links/OTPs in the server log),
 *   4. starts Vite on E2E_WEB_PORT, proxying /api to that API (VITE_API_PROXY_TARGET),
 *   5. runs the command (default: `playwright test e2e/fullstack`) with E2E_* env, then stops everything.
 *
 * Usage:
 *   npm run test:e2e                                   # whole full-stack suite
 *   npm run test:e2e -- e2e/fullstack/account.spec.ts  # extra args go to `playwright test` (e.g. --headed, -g …)
 *   node scripts/e2e-stack.mjs --serve                 # boot only; Ctrl-C to stop (then e.g. `npx playwright test --ui`
 *                                                      #   with the printed E2E_* env)
 *   node scripts/e2e-stack.mjs -- <command...>         # run something else against the stack
 *
 * Env (all optional):
 *   KRITEX_SERVER_DIR   kritex-server checkout (default ../kritex-server). Needs `npm ci` + `npx prisma generate` done.
 *   E2E_DATABASE_URL    dedicated e2e DB (never the dev/prod one)
 *                       (default postgresql://kritex:kritex@localhost:5434/kritex_e2e?schema=public)
 *   E2E_API_PORT=4007   E2E_WEB_PORT=8087
 *   E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD   seeded admin (defaults below)
 *   E2E_LOG_DIR         where server.log / web.log go (default <tmp>/kritex-e2e/logs)
 *   E2E_ALLOW_REMOTE_DB=1  allow a non-localhost E2E_DATABASE_URL (refused by default)
 *   E2E_RESET=1         wipe the DB first (`prisma migrate reset --force`; Prisma refuses this when run by an AI agent)
 *   E2E_RAZORPAY=1      pass RAZORPAY_KEY_ID/KEY_SECRET/WEBHOOK_SECRET (test mode) through to the API instead of the fake gateway
 *
 * Specs receive: E2E_BASE_URL, E2E_API_URL (direct API origin), E2E_ADMIN_EMAIL, E2E_ADMIN_PASSWORD, E2E_SERVER_LOG.
 */
import { spawn, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { closeSync, existsSync, mkdirSync, openSync } from "node:fs";
import { createConnection } from "node:net";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const env = process.env;

const serverDir = path.resolve(root, env.KRITEX_SERVER_DIR ?? "../kritex-server");
const databaseUrl = env.E2E_DATABASE_URL ?? "postgresql://kritex:kritex@localhost:5434/kritex_e2e?schema=public";
const apiPort = Number(env.E2E_API_PORT ?? 4007);
const webPort = Number(env.E2E_WEB_PORT ?? 8087);
const adminEmail = env.E2E_ADMIN_EMAIL ?? "e2e-admin@kritex.in";
const adminPassword = env.E2E_ADMIN_PASSWORD ?? "e2e-admin-Passw0rd!";
const webUrl = `http://localhost:${webPort}`;
const apiUrl = `http://localhost:${apiPort}`;

const work = path.join(os.tmpdir(), "kritex-e2e", createHash("sha1").update(serverDir).digest("hex").slice(0, 10));
const outDir = path.join(work, "dist");
const logDir = path.resolve(env.E2E_LOG_DIR ?? path.join(work, "logs"));
const serverLog = path.join(logDir, "server.log");
const webLog = path.join(logDir, "web.log");

const argv = process.argv.slice(2);
const serveOnly = argv.includes("--serve");
const dashDash = argv.indexOf("--");
// `-- <cmd...>` runs a custom command; any other args are passed to `playwright test`.
const command =
  dashDash >= 0
    ? argv.slice(dashDash + 1)
    : ["npx", "playwright", "test", "-c", "e2e/fullstack/playwright.config.ts", ...argv.filter((a) => a !== "--serve")];

const log = (msg) => console.log(`\x1b[36m[e2e-stack]\x1b[0m ${msg}`);
const children = [];

function fail(msg) {
  console.error(`\x1b[31m[e2e-stack] ${msg}\x1b[0m`);
  cleanup();
  process.exit(1);
}

/** Runs a command to completion with inherited output; exits on failure. */
function run(cmd, args, options) {
  const res = spawnSync(cmd, args, { stdio: "inherit", ...options });
  if (res.status !== 0) fail(`${cmd} ${args.join(" ")} failed (exit ${res.status ?? res.signal})`);
}

/**
 * Starts a long-running process in its own process group. Output goes straight to a file descriptor (not through
 * this process, which blocks in spawnSync while the tests run), so logs are written live.
 */
function start(name, cmd, args, options, file) {
  const fd = openSync(file, "w");
  const child = spawn(cmd, args, { ...options, detached: true, stdio: ["ignore", fd, fd] });
  closeSync(fd);
  child.on("exit", (code, signal) => {
    if (!child.stopping) {
      console.error(`[e2e-stack] ${name} exited early (${code ?? signal}); see ${file}`);
    }
  });
  children.push(child);
  return child;
}

function cleanup() {
  for (const child of children.reverse()) {
    if (child.exitCode !== null || child.signalCode !== null) continue;
    child.stopping = true;
    try {
      process.kill(-child.pid, "SIGTERM");
    } catch {
      /* already gone */
    }
  }
  children.length = 0;
}

const portInUse = (port) =>
  new Promise((resolve) => {
    const socket = createConnection({ port, host: "localhost" });
    socket.once("connect", () => {
      socket.destroy();
      resolve(true);
    });
    socket.once("error", () => resolve(false));
  });

async function waitFor(url, child, name, timeoutMs = 90_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) fail(`${name} exited before it was ready`);
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch {
      /* not up yet */
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  fail(`${name} not ready at ${url} after ${timeoutMs / 1000}s`);
}

/**
 * API env: an explicit allowlist, never the parent env. The server's own .env (which may hold hosted DATABASE_URLs and
 * real Razorpay keys) is never read: cwd is the temp dir, and DATABASE_URL is always the e2e DB. Without
 * E2E_RAZORPAY=1 no RAZORPAY_* var is set, so the API always runs the fake gateway.
 */
function apiEnv() {
  const e = {
    PATH: env.PATH,
    HOME: env.HOME,
    NODE_PATH: path.join(serverDir, "node_modules"),
    NODE_ENV: "development", // dev mail log prints verification links/OTPs; Swagger on
    PORT: String(apiPort),
    DATABASE_URL: databaseUrl,
    CORS_ORIGIN: webUrl,
    WEB_URL: webUrl,
    BETTER_AUTH_URL: webUrl, // auth email links go through the storefront origin (Vite proxy)
    // One proxy hop (Vite) so each spec can get its own rate-limit bucket via X-Forwarded-For
    // (e2e/fullstack/fixtures.ts); otherwise the whole suite shares one IP's 100 req/min.
    TRUST_PROXY: "1",
    UPLOADS_DIR: path.join(work, "uploads"),
    LOG_LEVEL: "info",
    // Prisma Client would load these into process.env (see scripts/e2e-api-preload.cjs).
    E2E_HIDE_ENV_FILES: [".env", "prisma/.env"].map((f) => path.join(serverDir, f)).join(path.delimiter),
  };
  if (env.E2E_RAZORPAY === "1") {
    for (const k of ["RAZORPAY_KEY_ID", "RAZORPAY_KEY_SECRET", "RAZORPAY_WEBHOOK_SECRET"]) {
      if (!env[k]) fail(`E2E_RAZORPAY=1 needs ${k}`);
      e[k] = env[k];
    }
  }
  return e;
}

process.on("SIGINT", () => {
  cleanup();
  process.exit(130);
});
process.on("SIGTERM", () => {
  cleanup();
  process.exit(143);
});
process.on("exit", cleanup);

async function main() {
  // Safety: this DB is migrated and seeded with test data. Never point it at a hosted (e.g. Neon) database.
  const dbHost = new URL(databaseUrl).hostname;
  if (!["localhost", "127.0.0.1", "::1", "[::1]"].includes(dbHost) && env.E2E_ALLOW_REMOTE_DB !== "1") {
    fail(`E2E_DATABASE_URL must be a local database (got host ${dbHost}); set E2E_ALLOW_REMOTE_DB=1 to override`);
  }
  if (existsSync(path.join(work, ".env"))) fail(`unexpected ${path.join(work, ".env")}; remove it`);
  if (!existsSync(path.join(serverDir, "package.json"))) {
    fail(`kritex-server not found at ${serverDir} (set KRITEX_SERVER_DIR)`);
  }
  for (const port of [apiPort, webPort]) {
    if (await portInUse(port)) fail(`port ${port} is already in use`);
  }
  mkdirSync(logDir, { recursive: true });

  log(`server: ${serverDir}`);
  log(`compiling kritex-server → ${outDir}`);
  run(
    process.execPath,
    [
      path.join(serverDir, "node_modules/typescript/bin/tsc"),
      "-p",
      "tsconfig.build.json",
      "--outDir",
      outDir,
      "--tsBuildInfoFile",
      path.join(work, "tsbuildinfo"),
    ],
    { cwd: serverDir },
  );

  // Prisma CLI reads the server's .env too, but explicit env vars win; DATABASE_URL is always passed.
  // RAZORPAY_* are dropped (the CLI never needs them); the server's .env may hold real keys.
  const { RAZORPAY_KEY_ID: _k, RAZORPAY_KEY_SECRET: _s, RAZORPAY_WEBHOOK_SECRET: _w, ...baseEnv } = env;
  const prismaEnv = {
    ...baseEnv,
    PATH: `${path.join(serverDir, "node_modules/.bin")}${path.delimiter}${env.PATH}`,
    DATABASE_URL: databaseUrl,
    SEED_PLACEHOLDER_PRICES: "true",
    SEED_ADMIN_EMAIL: adminEmail,
    SEED_ADMIN_NAME: "E2E Admin",
    SEED_ADMIN_PASSWORD: adminPassword,
    PRISMA_HIDE_UPDATE_MESSAGE: "1",
  };
  const prisma = path.join(serverDir, "node_modules/.bin/prisma");
  const shownUrl = databaseUrl.replace(/\/\/[^@]*@/, "//***@");
  if (env.E2E_RESET === "1") {
    log(`resetting ${shownUrl} (prisma migrate reset --force, which also seeds)`);
    run(prisma, ["migrate", "reset", "--force"], { cwd: serverDir, env: prismaEnv });
  } else {
    // Default: idempotent. A fresh DB (CI's Postgres service) gets the full schema; a reused one keeps old e2e
    // rows, which is fine because every spec creates its own uniquely named data.
    log(`migrate deploy + seed on ${shownUrl}`);
    run(prisma, ["migrate", "deploy"], { cwd: serverDir, env: prismaEnv });
    run(prisma, ["db", "seed"], { cwd: serverDir, env: prismaEnv });
  }

  log(`starting API on ${apiUrl} (log: ${serverLog})`);
  const api = start(
    "API",
    process.execPath,
    ["--enable-source-maps", "--require", path.join(root, "scripts/e2e-api-preload.cjs"), path.join(outDir, "main.js")],
    { cwd: work, env: apiEnv() },
    serverLog,
  );
  await waitFor(`${apiUrl}/api/v1/health`, api, "API");

  log(`starting Vite on ${webUrl} (log: ${webLog})`);
  const web = start(
    "Vite",
    process.execPath,
    [path.join(root, "node_modules/vite/bin/vite.js"), "--port", String(webPort), "--strictPort"],
    {
      cwd: root,
      env: {
        ...env,
        VITE_API_PROXY_TARGET: apiUrl,
        VITE_API_URL: "",
        VITE_USE_MOCKS: "false",
        VITE_ASSET_BASE_URL: "",
      },
    },
    webLog,
  );
  await waitFor(`${webUrl}/`, web, "Vite");

  const testEnv = {
    E2E_BASE_URL: webUrl,
    E2E_API_URL: apiUrl,
    E2E_ADMIN_EMAIL: adminEmail,
    E2E_ADMIN_PASSWORD: adminPassword,
    E2E_SERVER_LOG: serverLog,
  };

  if (serveOnly) {
    log("stack is up. Ctrl-C to stop. Env for specs:");
    for (const [k, v] of Object.entries(testEnv)) console.log(`  export ${k}=${JSON.stringify(v)}`);
    await new Promise(() => {});
  }

  log(`running: ${command.join(" ")}`);
  const res = spawnSync(command[0], command.slice(1), {
    cwd: root,
    stdio: "inherit",
    env: { ...env, ...testEnv },
  });
  cleanup();
  if (res.status !== 0) log(`failed; logs in ${logDir}`);
  process.exit(res.status ?? 1);
}

main().catch((err) => fail(err?.stack ?? String(err)));
