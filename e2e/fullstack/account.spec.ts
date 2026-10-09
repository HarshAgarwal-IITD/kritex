import type { APIRequestContext } from "@playwright/test";
import {
  API,
  addSizesToCart,
  adminApi,
  adminOrderByNumber,
  checkoutWithFakeGateway,
  createRetailProduct,
  expect,
  firstLink,
  readMail,
  stamp,
  test,
  type CreatedProduct,
} from "./fixtures";

/**
 * QA-3: sign up → verify via the emailed link (read from the dev mail log) → signed in; guest cart merges into the
 * user's cart on login; account order list + detail; customer cancels a paid order (fake gateway refunds it).
 */
let admin: APIRequestContext;
let product: CreatedProduct;

test.beforeAll(async () => {
  admin = await adminApi();
  product = await createRetailProduct(admin, { name: "Account Tee", sizes: ["M", "L"], stock: 5 });
});

test.afterAll(async () => {
  if (product) await admin.delete(`${API}/admin/products/${product.id}`, { failOnStatusCode: false });
  await admin?.dispose();
});

test("sign up, verify, cart merge on login, orders list/detail, cancel", async ({ page }) => {
  const email = `e2e-user-${stamp()}@example.com`;
  const password = "Sup3r-secret-pass";

  // ---- Sign up → "check your email" (no session until verified).
  await page.goto("/signup");
  await page.getByLabel("Full name").fill("E2E Customer");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByLabel("Confirm password").fill(password);
  await page.getByRole("button", { name: "Create Account" }).click();
  await expect(page.getByTestId("check-email")).toContainText(email);

  // Unverified login is refused.
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Log In" }).click();
  await expect(page.getByRole("button", { name: "Resend verification email" })).toBeVisible();

  // ---- Verify via the emailed link: Better Auth signs the user in and redirects to /account (TD-29).
  const link = firstLink(await readMail(email, "verify-email"));
  expect(new URL(link).origin).toBe(new URL(page.url()).origin);
  await page.goto(link);
  await expect(page).toHaveURL(/\/account$/);
  await expect(page.getByRole("button", { name: "Log out" })).toBeVisible();

  // ---- Signed-in cart line (L), log out, guest cart line (M), log in → both lines.
  await addSizesToCart(page, product.slug, ["L"]);
  await page.goto("/account");
  // The UI leaves /account first, then signs out; wait for the sign-out response before reading the cart.
  await Promise.all([
    page.waitForResponse((r) => r.url().includes("/auth/sign-out")),
    page.getByRole("button", { name: "Log out" }).click(),
  ]);
  await expect(page).not.toHaveURL(/\/account$/);
  await page.goto("/cart");
  await expect(page.getByTestId("cart-line")).toHaveCount(0);

  await addSizesToCart(page, product.slug, ["M"]);
  await page.goto("/cart");
  await expect(page.getByTestId("cart-line")).toHaveCount(1);

  await page.goto("/login?next=%2Fcart");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Log In" }).click();
  await expect(page).toHaveURL(/\/cart$/);
  await expect(page.getByTestId("cart-line")).toHaveCount(2);

  // ---- Checkout as the signed-in user (email comes from the account).
  await page.getByRole("button", { name: "Checkout" }).click();
  await expect(page.getByText(`Signed in as ${email}`)).toBeVisible();
  const number = await checkoutWithFakeGateway(page);
  await expect(page.getByRole("link", { name: "View Order" })).toBeVisible();

  // ---- Orders list → detail.
  await page.goto("/account/orders");
  const row = page.getByRole("list", { name: "Orders" }).getByRole("link").filter({ has: page.getByText(number, { exact: true }) });
  await expect(row).toContainText("2 items");
  await expect(row).toContainText("Confirmed"); // PAID
  await row.click();
  await expect(page).toHaveURL(new RegExp(`/account/orders/${number}$`));
  await expect(page.getByRole("heading", { name: `Order ${number}` })).toBeVisible();
  await expect(page.getByRole("link", { name: product.name })).toHaveCount(2);

  // ---- Cancel the paid order: refunded through the (fake) gateway, stock returned.
  await page.getByRole("button", { name: "Cancel Order" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Reason (optional)").fill("Ordered by mistake");
  await dialog.getByRole("button", { name: "Cancel Order" }).click();
  await expect(dialog).toBeHidden();
  await expect(page.getByText(/Cancelled/i).first()).toBeVisible();
  await expect(page.getByRole("button", { name: "Cancel Order" })).toHaveCount(0);

  const order = await adminOrderByNumber(admin, number);
  expect(order.status).toBe("CANCELLED");
  expect(order.refunds.reduce((s, r) => s + r.amount, 0)).toBe(order.totals.total);
});

test("a customer can't read another customer's order (IDOR)", async ({ page, browser }) => {
  // Order placed by customer A (through the API session the UI uses).
  const a = `e2e-idor-a-${stamp()}@example.com`;
  const b = `e2e-idor-b-${stamp()}@example.com`;
  const password = "Sup3r-secret-pass";
  const verify = async (ctxPage: typeof page, email: string) => {
    await ctxPage.goto("/signup");
    await ctxPage.getByLabel("Full name").fill("E2E Idor");
    await ctxPage.getByLabel("Email").fill(email);
    await ctxPage.getByLabel("Password", { exact: true }).fill(password);
    await ctxPage.getByLabel("Confirm password").fill(password);
    await ctxPage.getByRole("button", { name: "Create Account" }).click();
    await expect(ctxPage.getByTestId("check-email")).toBeVisible();
    await ctxPage.goto(firstLink(await readMail(email, "verify-email")));
    await expect(ctxPage).toHaveURL(/\/account$/);
  };

  await verify(page, a);
  await addSizesToCart(page, product.slug, ["M"]);
  await page.goto("/checkout");
  const number = await checkoutWithFakeGateway(page);

  const other = await browser.newContext({ baseURL: process.env.E2E_BASE_URL, extraHTTPHeaders: { "X-Forwarded-For": "10.9.9.9" } });
  const pageB = await other.newPage();
  await verify(pageB, b);
  await pageB.goto(`/account/orders/${number}`);
  await expect(pageB.getByText("Order not found.")).toBeVisible();
  const res = await pageB.request.get(`${API}/me/orders/${number}`);
  expect(res.status()).toBe(404);
  const cancel = await pageB.request.post(`${API}/me/orders/${number}/cancel`, { data: {}, headers: { Origin: new URL(API).origin } });
  expect(cancel.status()).toBe(404);
  await other.close();
});
