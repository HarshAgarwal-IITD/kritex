import type { APIRequestContext, Page } from "@playwright/test";
import {
  ADMIN_EMAIL,
  ADMIN_PASSWORD,
  API,
  adminApi,
  adminOrderByNumber,
  addSizesToCart,
  checkoutWithFakeGateway,
  createRetailProduct,
  expect,
  stamp,
  test,
} from "./fixtures";

/**
 * QA-4: the admin creates a product with variants (and an uploaded image) in the admin UI, it shows up on the
 * storefront and can be bought; then the admin works the order (status change, full refund on the fake gateway).
 */
const PNG_1PX = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
  "base64",
);

let admin: APIRequestContext;
const cleanup: string[] = [];

test.beforeAll(async () => {
  admin = await adminApi();
});

test.afterAll(async () => {
  for (const id of cleanup) await admin.delete(`${API}/admin/products/${id}`, { failOnStatusCode: false });
  await admin?.dispose();
});

async function adminLogin(page: Page) {
  await page.goto("/admin/login");
  await page.getByLabel("Email").fill(ADMIN_EMAIL);
  await page.getByLabel("Password").fill(ADMIN_PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/admin\/products$/);
}

async function pick(page: Page, label: string, option: string) {
  await page.getByRole("combobox", { name: label, exact: true }).click();
  await page.getByRole("option", { name: option, exact: true }).click();
}

test("admin creates a product with variants in the admin UI and it sells on the storefront", async ({ page, browser }) => {
  const id = stamp().toUpperCase();
  const name = `E2E Admin Jacket ${id}`;
  const slug = `e2e-admin-jacket-${id.toLowerCase()}`;

  await adminLogin(page);
  await page.goto("/admin/products/new");
  const form = page.getByRole("form", { name: "New product" });
  await form.getByLabel("Name", { exact: true }).fill(name);
  await expect(form.getByLabel("Slug", { exact: true })).toHaveValue(slug);
  await form.getByLabel("Description", { exact: true }).fill("Created by the e2e suite through the admin UI.");
  await pick(page, "Status", "Active");
  await pick(page, "Sale channel", "Retail");
  await pick(page, "Category", "Combat Apparel");
  await form.getByLabel("Sub-category").fill("Tactical Outerwear");
  await form.getByLabel("Base price (₹)").fill("799");
  await form.getByLabel("HSN code").fill("6201");

  // Image through the signed upload flow (local driver in the harness).
  await form.getByLabel("Upload images").setInputFiles({ name: "e2e-jacket.png", mimeType: "image/png", buffer: PNG_1PX });
  await expect(form.locator("img[src*='/uploads/']")).toHaveCount(1);
  await expect(form.getByLabel("Image 1 alt text")).toBeVisible();

  // Size option with two values → two variants with 3 units each.
  await form.getByRole("button", { name: "Add option" }).click();
  await expect(form.getByLabel("Option name")).toHaveValue("Size");
  const values = form.getByLabel("Size values");
  await values.fill("S");
  await values.press("Enter");
  await values.fill("M");
  await values.press("Enter");
  await expect(form.getByText("2 combinations")).toBeVisible();
  await form.getByLabel("Starting stock per variant").fill("3");
  await page.getByRole("button", { name: "Create product" }).click();

  await expect(page).toHaveURL(/\/admin\/products\/(?!new)[^/]+$/);
  const productId = page.url().split("/").pop()!;
  cleanup.push(productId);
  const variants = page.getByRole("group", { name: "Variants" }).getByRole("row");
  await expect(variants).toHaveCount(3); // header + S + M
  await expect(page.getByLabel("S stock")).toHaveValue("3");

  // Storefront (fresh guest context): PDP shows it, priced, with both sizes and the uploaded image.
  const shopper = await browser.newContext({ baseURL: process.env.E2E_BASE_URL });
  const shop = await shopper.newPage();
  await shop.goto(`/product/${slug}`);
  await expect(shop.getByRole("heading", { level: 1 })).toHaveText(name);
  await expect(shop.getByTestId("price")).toContainText("₹799");
  await expect(shop.getByRole("button", { name: "S", exact: true })).toBeVisible();
  await expect(shop.getByRole("button", { name: "M", exact: true })).toBeVisible();
  await expect(shop.locator("img[src*='/uploads/']").first()).toBeVisible();

  // …and in its category listing.
  await shop.goto("/products/combat-apparel");
  await expect(shop.getByRole("link", { name: `View details for ${name}` })).toBeVisible();

  // Buy one, so the admin has an order to work.
  await addSizesToCart(shop, slug, ["M"]);
  await shop.goto("/checkout");
  const number = await checkoutWithFakeGateway(shop, { guestEmail: "e2e-admin-flow@example.com" });
  await shopper.close();

  // Stock decremented in the admin variants table.
  await page.reload();
  await expect(page.getByLabel("M stock")).toHaveValue("2");

  // ---- Admin order actions: PAID → PROCESSING, then a full refund.
  const order = await adminOrderByNumber(admin, number);
  await page.goto(`/admin/orders/${order.id}`);
  await expect(page.getByRole("heading", { name: number })).toBeVisible();

  await page.getByRole("button", { name: "Change status" }).click();
  let dialog = page.getByRole("dialog");
  await dialog.getByLabel("New status").click();
  await page.getByRole("option", { name: "Processing" }).click();
  await dialog.getByRole("button", { name: "Update status" }).click();
  await expect(dialog).toBeHidden();
  await expect.poll(async () => (await adminOrderByNumber(admin, number)).status).toBe("PROCESSING");

  await page.getByRole("button", { name: "Refund" }).click();
  dialog = page.getByRole("dialog");
  await dialog.getByRole("button", { name: "Full" }).click();
  await dialog.getByLabel("Reason").fill("E2E full refund");
  await dialog.getByRole("button", { name: "Review refund" }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Confirm refund" }).click();
  await expect(page.getByRole("alertdialog")).toBeHidden();

  await expect
    .poll(async () => {
      const o = await adminOrderByNumber(admin, number);
      return o.refunds.filter((r) => r.status === "PROCESSED").reduce((s, r) => s + r.amount, 0) === o.totals.total;
    })
    .toBe(true);
  await expect(page.getByRole("button", { name: "Refund" })).toHaveCount(0);
});

test("non-staff users are kept out of /admin and the admin API", async ({ page }) => {
  // A guest session gets the admin login page; the admin API answers 401 without a session.
  await page.goto("/admin/orders");
  await expect(page).toHaveURL(/\/admin\/login/);
  const anon = await page.request.get(`${API}/admin/orders`);
  expect(anon.status()).toBe(401);
});

/**
 * OPS-3/OPS-4 (in progress): enable once the ship action lands in the admin UI.
 * Intended steps:
 *   1. createRetailProduct + guest buys one (fake gateway) → order PAID.
 *   2. Admin opens /admin/orders/:id → "Ship" → manual ship dialog: carrier "Delhivery", AWB "E2E123456", notify on → submit.
 *      (With Shiprocket configured: "Create shipment" → AWB + label link shown → "Print label" opens the PDF.)
 *   3. Order status SHIPPED; shipment card shows carrier + AWB + tracking link; OrderEvent "shipped" on the timeline.
 *   4. Dev mail log has a "shipped" email to the customer (OPS-1).
 *   5. Public /track/KTX-…?email=… (OPS-5) shows SHIPPED with the AWB; wrong email → not found.
 *   6. Admin marks DELIVERED → customer order detail shows "Return / Exchange".
 */
test.fixme("admin fulfils an order (ship → tracking → delivered)", async ({ page }) => {
  const product = await createRetailProduct(admin, { name: "Ship Me", sizes: ["M"], stock: 2 });
  cleanup.push(product.id);
  await addSizesToCart(page, product.slug, ["M"]);
  await page.goto("/checkout");
  const number = await checkoutWithFakeGateway(page, { guestEmail: "e2e-ship@example.com" });
  const order = await adminOrderByNumber(admin, number);

  await adminLogin(page);
  await page.goto(`/admin/orders/${order.id}`);
  await page.getByRole("button", { name: /^Ship/ }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Carrier").fill("Delhivery");
  await dialog.getByLabel(/AWB/).fill("E2E123456");
  await dialog.getByRole("button", { name: /Ship|Mark shipped/ }).click();
  await expect.poll(async () => (await adminOrderByNumber(admin, number)).status).toBe("SHIPPED");
  await expect(page.getByText("E2E123456")).toBeVisible();

  await page.goto(`/track/${number}?email=e2e-ship@example.com`);
  await expect(page.getByText("E2E123456")).toBeVisible();
});
