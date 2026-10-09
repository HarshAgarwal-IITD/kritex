import type { APIRequestContext } from "@playwright/test";
import { API, adminApi, adminOrderByNumber, checkoutWithFakeGateway, createRetailProduct, expect, test, type CreatedProduct } from "./fixtures";

/**
 * QA-2: browse → filter → PDP → cart → guest checkout → confirmation, against the real API.
 * The product lives in "Load Bearing" under its own sub-category, so the Refine chips show it and nothing else.
 */
let admin: APIRequestContext;
let product: CreatedProduct;

test.beforeAll(async () => {
  admin = await adminApi();
  product = await createRetailProduct(admin, { name: "Field Pouch", category: "load-bearing", sizes: ["S", "M"], stock: 4 });
});

test.afterAll(async () => {
  if (product) await admin.delete(`${API}/admin/products/${product.id}`, { failOnStatusCode: false });
  await admin?.dispose();
});

test("guest browses, filters, buys from the PDP and lands on the confirmation page", async ({ page }) => {
  // Browse: all products → Load Bearing department → our sub-category chip.
  await page.goto("/products");
  await page.getByRole("button", { name: /Load Bearing/ }).click();
  await expect(page).toHaveURL(/category=load-bearing/);
  const chip = page.getByRole("button", { name: new RegExp(`^${product.subCategory} \\(1\\)$`, "i") });
  await chip.click();
  await expect(page).toHaveURL(/type=/);
  const cards = page.getByRole("link", { name: /^View details for / });
  await expect(cards).toHaveCount(1);
  await expect(cards.first()).toHaveAccessibleName(`View details for ${product.name}`);

  // Search narrows to the same product (debounced; URL carries ?q=).
  await page.getByRole("combobox", { name: "Search products" }).fill(product.name.split(" ").pop()!);
  await expect(page).toHaveURL(/q=/);
  await expect(cards).toHaveCount(1);

  // PDP: price shown, options required before adding.
  await cards.first().click();
  await expect(page).toHaveURL(new RegExp(`/product/${product.slug}$`));
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(product.name);
  await expect(page.getByTestId("price")).toContainText("₹499");
  await expect(page.getByRole("button", { name: /Add to Cart/ })).toBeDisabled();
  await page.getByRole("button", { name: "M", exact: true }).click();
  await expect(page.getByTestId("stock-state")).toContainText("In stock");
  // (The PDP labels its stepper "this product": PurchaseCta isn't given productName. Follow-up for web.)
  await page.getByRole("button", { name: /^Increase quantity of / }).click();
  await page.getByRole("button", { name: /Add to Cart/ }).click();

  // Drawer → cart page.
  const drawer = page.getByRole("dialog");
  await expect(drawer.getByTestId("cart-line")).toHaveCount(1);
  await drawer.getByRole("button", { name: "View Cart" }).click();
  await expect(page).toHaveURL(/\/cart$/);
  await expect(page.getByTestId("cart-line")).toHaveCount(1);
  await expect(page.getByTestId("cart-line").getByTestId("quantity")).toHaveText("2");
  await page.getByRole("button", { name: "Checkout" }).click();

  // Guest checkout → fake gateway → confirmation.
  const number = await checkoutWithFakeGateway(page, { guestEmail: "e2e-browse@example.com" });
  await expect(page.getByRole("heading", { name: "Thank you for your order" })).toBeVisible();
  await expect(page.getByTestId("order-number")).toHaveText(number);
  // Guests get no "View Order" link (no account to view it in).
  await expect(page.getByRole("link", { name: "View Order" })).toHaveCount(0);

  const order = await adminOrderByNumber(admin, number);
  expect(order.status).toBe("PAID");
  expect(order.paymentStatus).toBe("CAPTURED");
  // 2 × ₹499 = ₹998, under the free-shipping threshold (₹999) → + ₹99 shipping.
  expect(order.totals.total).toBe(2 * 49900 + 9900);

  // The cart is emptied once the order is paid.
  await page.goto("/cart");
  await expect(page.getByTestId("cart-line")).toHaveCount(0);
});

/**
 * Same flow through real Razorpay Checkout (test mode). Needs the API booted with test keys:
 *   E2E_RAZORPAY=1 RAZORPAY_KEY_ID=rzp_test_… RAZORPAY_KEY_SECRET=… RAZORPAY_WEBHOOK_SECRET=… npm run test:e2e -- storefront.spec.ts
 * Razorpay's hosted UI changes without notice; the selectors below follow the 2026 standard checkout (card → OTP "Success").
 */
test("guest pays through Razorpay test mode", async ({ page }) => {
  test.skip(process.env.E2E_RAZORPAY !== "1", "set E2E_RAZORPAY=1 and Razorpay test keys to run against real Checkout.js");
  test.setTimeout(120_000);

  await page.goto(`/product/${product.slug}`);
  await page.getByRole("button", { name: "S", exact: true }).click();
  await page.getByRole("button", { name: /Add to Cart/ }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Checkout" }).click();

  await page.getByLabel("Email").fill("e2e-razorpay@example.com");
  await page.getByLabel("Mobile number").fill("98765 43210");
  await page.getByRole("button", { name: "Continue to Address" }).click();
  await page.getByLabel("Full name").fill("E2E Razorpay");
  await page.getByLabel("Mobile number").fill("+91 98765 43210");
  await page.getByLabel("Address", { exact: true }).fill("1 Test Street");
  await page.getByLabel("PIN code").fill("400001");
  await page.getByRole("button", { name: "Deliver Here" }).click();
  await page.getByRole("button", { name: /^Pay ₹/ }).click();

  const rzp = page.frameLocator("iframe.razorpay-checkout-frame");
  await rzp.getByText(/^Cards?$/).first().click();
  await rzp.getByPlaceholder(/Card Number/i).fill("4111 1111 1111 1111");
  await rzp.getByPlaceholder(/MM ?\/ ?YY/i).fill("12/30");
  await rzp.getByPlaceholder(/CVV/i).fill("123");
  await rzp.getByRole("button", { name: /Pay|Continue/ }).first().click();
  // Test-mode bank page opens in a popup: choose Success.
  const popup = await page.waitForEvent("popup");
  await popup.getByRole("button", { name: "Success" }).click();

  await expect(page).toHaveURL(/\/checkout\/(success|pending)\/KTX-\d+$/, { timeout: 60_000 });
  const number = page.url().split("/").pop()!;
  await expect.poll(async () => (await adminOrderByNumber(admin, number)).status, { timeout: 60_000 }).toBe("PAID");
});
