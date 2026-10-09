import { readFileSync } from "node:fs";
import { randomInt } from "node:crypto";
import { test as base, expect, request, type APIRequestContext, type APIResponse, type Page } from "@playwright/test";

/**
 * Shared helpers for the full-stack suite (run via `npm run test:e2e`, see scripts/e2e-stack.mjs).
 *
 * Rate limits are per client IP (global 100/min, sign-in 10/min, checkout 10/min). The harness runs the API with
 * TRUST_PROXY=1 behind Vite, so every test (and every API context made here) sends its own random
 * X-Forwarded-For and gets its own bucket. Against a stack without TRUST_PROXY the header is simply ignored.
 */
export const BASE = process.env.E2E_BASE_URL ?? "http://localhost:8080";
export const API = `${BASE}/api/v1`;
export const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL ?? "admin@kritex.in";
export const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD ?? "";
export const SERVER_LOG = process.env.E2E_SERVER_LOG;

export const randomIp = () => `10.${randomInt(256)}.${randomInt(256)}.${randomInt(1, 255)}`;
export const stamp = () => `${Date.now().toString(36)}${randomInt(1296).toString(36)}`;

export const test = base.extend({
  extraHTTPHeaders: async ({ extraHTTPHeaders }, provide) => {
    await provide({ ...extraHTTPHeaders, "X-Forwarded-For": randomIp() });
  },
});
export { expect };

export async function json<T>(res: APIResponse): Promise<T> {
  if (!res.ok()) throw new Error(`${res.url()} → ${res.status()} ${await res.text()}`);
  return (await res.json()) as T;
}

/** A request context that looks like the storefront (Origin header, own rate-limit bucket). */
export const apiContext = () =>
  request.newContext({ extraHTTPHeaders: { Origin: BASE, "X-Forwarded-For": randomIp() } });

/** Signed-in API context (cookie session) for the seeded admin. */
export async function adminApi(): Promise<APIRequestContext> {
  if (!ADMIN_PASSWORD) throw new Error("E2E_ADMIN_PASSWORD is not set (run through `npm run test:e2e`)");
  const ctx = await apiContext();
  await json(await ctx.post(`${API}/auth/sign-in/email`, { data: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD } }));
  return ctx;
}

export type CreatedProduct = { id: string; slug: string; name: string; subCategory: string };

/**
 * Creates an ACTIVE RETAIL product with one variant per size (each `stock` units) through the admin API.
 * The seeded catalog is all ENQUIRY_ONLY until C-6, so purchasable products are always made by the spec.
 */
export async function createRetailProduct(
  admin: APIRequestContext,
  opts: { name: string; sizes?: string[]; stock?: number; basePrice?: number; category?: string; subCategory?: string },
): Promise<CreatedProduct> {
  const id = stamp();
  const slug = `e2e-${opts.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${id}`;
  const name = `${opts.name} ${id.toUpperCase()}`;
  const subCategory = opts.subCategory ?? `E2E Kit ${id.toUpperCase()}`;
  const categories = await json<{ items: { id: string; slug: string }[] }>(await admin.get(`${API}/categories`));
  const category = categories.items.find((c) => c.slug === (opts.category ?? "combat-apparel"));
  if (!category) throw new Error(`category ${opts.category ?? "combat-apparel"} not found`);
  const product = await json<{ id: string }>(
    await admin.post(`${API}/admin/products`, {
      data: {
        slug,
        name,
        categoryId: category.id,
        subCategory,
        saleChannel: "RETAIL",
        basePrice: opts.basePrice ?? 49900,
        hsnCode: "6505",
        gstRate: 5,
        images: [{ url: "/products/og-polo-tshirt/og-polo-tshirt-black.png", alt: name }],
        options: [{ name: "Size", values: opts.sizes ?? ["M", "L"] }],
      },
    }),
  );
  await json(await admin.post(`${API}/admin/products/${product.id}/variants`, { data: { defaultStock: opts.stock ?? 5 } }));
  await json(await admin.patch(`${API}/admin/products/${product.id}`, { data: { status: "ACTIVE" } }));
  return { id: product.id, slug, name, subCategory };
}

export type AdminOrder = {
  id: string;
  number: string;
  status: string;
  paymentStatus: string | null;
  totals: { total: number; discount: number };
  refunds: { amount: number; status: string }[];
  allowedTransitions: string[];
};

export async function adminOrderByNumber(admin: APIRequestContext, number: string): Promise<AdminOrder> {
  const list = await json<{ items: { id: string; number: string }[] }>(await admin.get(`${API}/admin/orders?q=${number}`));
  const hit = list.items.find((o) => o.number === number);
  if (!hit) throw new Error(`order ${number} not found`);
  return json<AdminOrder>(await admin.get(`${API}/admin/orders/${hit.id}`));
}

// ---- Dev mail log (NODE_ENV=development prints every email, links included, to the server log) ----

// eslint-disable-next-line no-control-regex -- ANSI colour codes from pino-pretty
const stripAnsi = (s: string) => s.replace(/\x1b\[[0-9;]*m/g, "");

/** Latest email of `tag` (e.g. `verify-email`, `sign-in`) to `to` from the server log; polls until it appears. */
export async function readMail(to: string, tag: string, timeoutMs = 10_000): Promise<string> {
  if (!SERVER_LOG) throw new Error("E2E_SERVER_LOG is not set (run through `npm run test:e2e`)");
  const marker = `[${tag}] to=${to.toLowerCase()} `;
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    const log = stripAnsi(readFileSync(SERVER_LOG, "utf8"));
    const at = log.toLowerCase().lastIndexOf(marker);
    if (at >= 0) {
      const rest = log.slice(at);
      // The message ends where pino appends the request context (`{"req":…`) or the next log line starts.
      const end = rest.search(/ \{"req"|\n\[\d\d:\d\d:\d\d/);
      return end > 0 ? rest.slice(0, end) : rest;
    }
    if (Date.now() > deadline) throw new Error(`no "${tag}" email to ${to} in ${SERVER_LOG}`);
    await new Promise((r) => setTimeout(r, 250));
  }
}

export const firstLink = (mail: string) => {
  const m = mail.match(/https?:\/\/\S+/);
  if (!m) throw new Error(`no link in email:\n${mail}`);
  return m[0];
};

// ---- UI flows shared by several specs ----

/** PDP → pick each size → add to cart, closing the drawer each time. */
export async function addSizesToCart(page: Page, slug: string, sizes: string[]) {
  await page.goto(`/product/${slug}`);
  for (const size of sizes) {
    await page.getByRole("button", { name: size, exact: true }).click();
    await page.getByRole("button", { name: /Add to Cart/ }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toBeHidden();
  }
}

/** /checkout as a guest or a signed-in user (new address), through to the fake gateway's Success. Returns the order number. */
export async function checkoutWithFakeGateway(page: Page, opts: { guestEmail?: string; outcome?: "Success" | "Fail" } = {}) {
  if (opts.guestEmail) await page.getByLabel("Email").fill(opts.guestEmail);
  await page.getByLabel("Mobile number").fill("98765 43210");
  await page.getByRole("button", { name: "Continue to Address" }).click();
  await page.getByLabel("Full name").fill("E2E Buyer");
  await page.getByLabel("Mobile number").fill("+91 98765 43210");
  await page.getByLabel("Address", { exact: true }).fill("1 Test Street");
  await page.getByLabel("PIN code").fill("400001");
  await page.getByRole("button", { name: "Deliver Here" }).click();
  await page.getByRole("button", { name: /^Pay ₹/ }).click();
  await page.getByRole("dialog").getByRole("button", { name: opts.outcome ?? "Success" }).click();
  if ((opts.outcome ?? "Success") === "Success") {
    await expect(page).toHaveURL(/\/checkout\/success\/KTX-\d+$/);
  } else {
    await expect(page).toHaveURL(/\/checkout\/failure\/KTX-\d+$/);
  }
  return page.url().split("/").pop()!;
}
