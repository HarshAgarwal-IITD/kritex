import type { APIRequestContext } from "@playwright/test";
import { apiContext, expect, test } from "./fixtures";

/**
 * Stage 3 gate, full stack: real kritex-server (fake payment gateway, i.e. no RAZORPAY_KEY_ID) behind the
 * Vite dev server. `npm run test:e2e` boots both (scripts/e2e-stack.mjs). Against an already running stack:
 *   E2E_BASE_URL=http://localhost:8080 E2E_ADMIN_EMAIL=admin@kritex.in E2E_ADMIN_PASSWORD=... \
 *     npx playwright test -c e2e/fullstack/playwright.config.ts checkout
 * Creates its own RETAIL product (2 sizes × 3 units) and a 10% coupon, so it never depends on catalog data.
 */
const BASE = process.env.E2E_BASE_URL ?? "http://localhost:8080";
const API = `${BASE}/api/v1`;

let admin: APIRequestContext;
let productId = "";
let slug = "";
let code = "";

const json = async <T>(res: { ok(): boolean; status(): number; json(): Promise<unknown>; text(): Promise<string> }) => {
  if (!res.ok()) throw new Error(`${res.status()} ${await res.text()}`);
  return (await res.json()) as T;
};

type Variant = { id: string; sku: string; stock: number; reserved: number };
const variants = async () => {
  const body = await json<Variant[] | { items: Variant[] }>(await admin.get(`${API}/admin/products/${productId}/variants`));
  return (Array.isArray(body) ? body : body.items).sort((a, b) => a.sku.localeCompare(b.sku));
};

test.beforeAll(async () => {
  const email = process.env.E2E_ADMIN_EMAIL ?? "admin@kritex.in";
  const password = process.env.E2E_ADMIN_PASSWORD;
  test.skip(!password, "E2E_ADMIN_PASSWORD is not set");
  admin = await apiContext();
  await json(await admin.post(`${API}/auth/sign-in/email`, { data: { email, password } }));

  const stamp = Date.now().toString(36);
  slug = `e2e-field-cap-${stamp}`;
  code = `E2E${stamp.toUpperCase()}`;
  const categories = await json<{ items: { id: string; slug: string }[] }>(await admin.get(`${API}/categories`));
  const product = await json<{ id: string }>(
    await admin.post(`${API}/admin/products`, {
      data: {
        slug,
        name: `E2E Field Cap ${stamp}`,
        categoryId: categories.items.find((c) => c.slug === "combat-apparel")!.id,
        saleChannel: "RETAIL",
        basePrice: 49900,
        hsnCode: "6505",
        gstRate: 5,
        images: [{ url: "/products/og-polo-tshirt/og-polo-tshirt-black.png", alt: "Cap" }],
        options: [{ name: "Size", values: ["M", "L"] }],
      },
    }),
  );
  productId = product.id;
  await json(await admin.post(`${API}/admin/products/${productId}/variants`, { data: { defaultStock: 3 } }));
  await json(await admin.patch(`${API}/admin/products/${productId}`, { data: { status: "ACTIVE" } }));
  await json(await admin.post(`${API}/admin/coupons`, { data: { code, type: "PERCENT", value: 10 } }));
});

test.afterAll(async () => {
  if (!admin) return;
  // Archives (it has an order now), so it disappears from the storefront.
  if (productId) await admin.delete(`${API}/admin/products/${productId}`);
  await admin.dispose();
});

test("guest buys 2 variants with a coupon, pays, and the order is PAID with stock decremented", async ({ page }) => {
  await page.goto(`${BASE}/product/${slug}`);
  for (const size of ["M", "L"]) {
    await page.getByRole("button", { name: size, exact: true }).click();
    await page.getByRole("button", { name: /Add to Cart/ }).click();
    // The cart drawer opens once the line is added; close it before picking the next size.
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toBeHidden();
  }

  await page.goto(`${BASE}/cart`);
  await expect(page.getByTestId("cart-line")).toHaveCount(2);
  await page.getByLabel("Coupon code").fill(code);
  await page.getByRole("button", { name: "Apply" }).click();
  await expect(page.getByTestId("applied-coupon")).toBeVisible();
  await page.getByRole("button", { name: "Checkout" }).click();

  await page.getByLabel("Email").fill("e2e-guest@example.com");
  await page.getByLabel("Mobile number").fill("98765 43210");
  await page.getByRole("button", { name: "Continue to Address" }).click();
  await page.getByLabel("Full name").fill("E2E Guest");
  await page.getByLabel("Mobile number").fill("+91 98765 43210");
  await page.getByLabel("Address", { exact: true }).fill("1 Test Street");
  await page.getByLabel("PIN code").fill("400001");
  await page.getByRole("button", { name: "Deliver Here" }).click();

  const summary = page.getByRole("complementary", { name: "Order summary" });
  await expect(summary.getByTestId("gst-note")).toHaveText(/CGST .* \+ SGST/);
  await page.getByRole("button", { name: /^Pay ₹/ }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Success" }).click();

  await expect(page).toHaveURL(/\/checkout\/success\/KTX-\d+$/);
  const number = page.url().split("/").pop()!;
  await expect(page.getByTestId("order-number")).toHaveText(number);

  const list = await json<{ items: { id: string }[] }>(await admin.get(`${API}/admin/orders?q=${number}`));
  const order = await json<{ status: string; couponCode: string | null; totals: { discount: number } }>(
    await admin.get(`${API}/admin/orders/${list.items[0].id}`),
  );
  expect(order.status).toBe("PAID");
  expect(order.couponCode).toBe(code);
  expect(order.totals.discount).toBeGreaterThan(0);
  for (const v of await variants()) {
    expect(v).toMatchObject({ stock: 2, reserved: 0 });
  }
});
