/**
 * Preloaded into the e2e API process (node --require) by scripts/e2e-stack.mjs.
 *
 * Prisma Client loads the kritex-server `.env` (next to package.json / prisma/) into process.env when it is constructed,
 * and @nestjs/config's get() falls back to process.env for keys the validated config left undefined. A developer `.env`
 * with real Razorpay keys or hosted DATABASE_URLs would therefore leak into the e2e API. This hides those files from
 * the process so the API only ever sees the harness's explicit env.
 */
const fs = require("node:fs");
const path = require("node:path");

const hidden = new Set(
  (process.env.E2E_HIDE_ENV_FILES ?? "")
    .split(path.delimiter)
    .filter(Boolean)
    .map((p) => path.resolve(p)),
);
const isHidden = (p) => {
  try {
    return hidden.has(path.resolve(String(p)));
  } catch {
    return false;
  }
};
const enoent = (p) => Object.assign(new Error(`ENOENT: no such file or directory, open '${p}'`), { code: "ENOENT" });

const { existsSync, readFileSync, statSync } = fs;
fs.existsSync = (p, ...rest) => (isHidden(p) ? false : existsSync(p, ...rest));
fs.readFileSync = (p, ...rest) => {
  if (isHidden(p)) throw enoent(p);
  return readFileSync(p, ...rest);
};
fs.statSync = (p, ...rest) => {
  if (isHidden(p)) {
    if (rest[0] && rest[0].throwIfNoEntry === false) return undefined;
    throw enoent(p);
  }
  return statSync(p, ...rest);
};
