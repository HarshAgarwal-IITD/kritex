import { randomUUID } from "node:crypto";
import type { APIRequestContext } from "@playwright/test";
import { ADMIN_EMAIL, ADMIN_PASSWORD, API, adminApi, apiContext, createRetailProduct, expect, firstLink, json, readMail, stamp, test, type CreatedProduct } from "./fixtures";

/**
 * QA-5: RFQ → quote → accept → order.
 * Both the API flow (server B2B-1) and the UI flow (quote cart, admin respond, account accept: B2B-2, B2B-5) run.
 */
let admin: APIRequestContext;
let product: CreatedProduct;

test.beforeAll(async () => {
  admin = await adminApi();
  product = await createRetailProduct(admin, { name: "Quote Boot", sizes: ["8", "9"], stock: 200 });
});

test.afterAll(async () => {
  if (product) await admin.delete(`${API}/admin/products/${product.id}`, { failOnStatusCode: false });
  await admin?.dispose();
});

const address = {
  name: "E2E Procurement",
  phone: "9876543210",
  line1: "1 Depot Road",
  city: "Pune",
  state: "Maharashtra",
  stateCode: "27",
  pincode: "411001",
};

test("API: customer RFQ → admin quotes per line → customer accepts → order at the quoted prices → paid", async () => {
  const email = `e2e-rfq-${stamp()}@example.com`;
  const customer = await apiContext();
  await json(await customer.post(`${API}/auth/sign-up/email`, { data: { name: "E2E Buyer", email, password: "Sup3r-secret-pass" } }));
  await customer.get(firstLink(await readMail(email, "verify-email")));

  const detail = await json<{ variants: { id: string; title: string }[] }>(await customer.get(`${API}/products/${product.slug}`));
  const rfq = await customer.post(`${API}/quotes`, {
    data: {
      contactName: "E2E Buyer",
      email,
      phone: "9876543210",
      organization: "E2E Regiment Supplies",
      notes: "Delivery to Pune depot",
      items: [
        { productId: product.id, variantId: detail.variants[0].id, quantity: 50 },
        { productId: product.id, variantId: detail.variants[1].id, quantity: 30 },
      ],
    },
  });
  test.skip(rfq.status() === 501, "quotes API not implemented on this server (B2B-1)");
  const { number, status } = await json<{ number: string; status: string }>(rfq);
  expect(number).toMatch(/^KTQ-\d+$/);
  expect(status).toBe("REQUESTED");

  // Admin inbox → respond with per-line prices below list (₹499).
  const inbox = await json<{ items: { id: string; number: string }[] }>(await admin.get(`${API}/admin/quotes?q=${number}`));
  const quoteId = inbox.items.find((q) => q.number === number)!.id;
  const adminDetail = await json<{ items: { id: string }[] }>(await admin.get(`${API}/admin/quotes/${quoteId}`));
  const validUntil = new Date(Date.now() + 7 * 24 * 3600_000).toISOString();
  await json(
    await admin.post(`${API}/admin/quotes/${quoteId}/respond`, {
      data: {
        items: adminDetail.items.map((i) => ({ itemId: i.id, quotedUnitPrice: 39900 })),
        validUntil,
        message: "Volume price for 80 pairs.",
      },
    }),
  );

  // Customer sees QUOTED with the price and message, then accepts.
  const mine = await json<{ status: string; quotedTotal: number; responseMessage: string }>(
    await customer.get(`${API}/me/quotes/${number}`),
  );
  expect(mine).toMatchObject({ status: "QUOTED", quotedTotal: 80 * 39900, responseMessage: "Volume price for 80 pairs." });

  const placed = await json<{ orderNumber: string; totals: { subtotal: number; total: number }; razorpay: { orderId: string } }>(
    await customer.post(`${API}/me/quotes/${number}/accept`, {
      headers: { "Idempotency-Key": randomUUID() },
      data: { paymentMethod: "RAZORPAY", shippingAddress: address },
    }),
  );
  expect(placed.totals.subtotal).toBe(80 * 39900);

  // Fake gateway payment (dev/test only).
  await json(
    await customer.post(`${API}/checkout/verify`, {
      data: { razorpay_order_id: placed.razorpay.orderId, razorpay_payment_id: `pay_fake_${stamp()}`, razorpay_signature: "fake" },
    }),
  );
  const order = await json<{ status: string; quoteNumber: string | null }>(await customer.get(`${API}/me/orders/${placed.orderNumber}`));
  expect(order).toMatchObject({ status: "PAID", quoteNumber: number });
  const converted = await json<{ status: string; orderNumber: string }>(await customer.get(`${API}/me/quotes/${number}`));
  expect(converted).toMatchObject({ status: "CONVERTED", orderNumber: placed.orderNumber });

  // Accepting again is refused.
  const again = await customer.post(`${API}/me/quotes/${number}/accept`, {
    headers: { "Idempotency-Key": randomUUID() },
    data: { paymentMethod: "RAZORPAY", shippingAddress: address },
  });
  expect(again.status()).toBeGreaterThanOrEqual(400);
  await customer.dispose();
});

/**
 * UI flow: enable when B2B-2 (quote cart on PDP/listing → RFQ form), B2B-5 (admin quotes inbox + respond, customer quote
 * list + accept) land on the storefront. Intended steps:
 *   1. Signed-in customer: PDP → "Request Quote" → add sizes 8 (50) and 9 (30) to the quote cart → RFQ form
 *      (organisation, phone, notes) → submit → confirmation shows KTQ-….
 *   2. Admin: /admin/quotes → open KTQ-… → price each line (₹399) + validity + message → "Send quote".
 *   3. Customer: /account/quotes → KTQ-… shows Quoted, ₹31,920 and the message → "Accept" → address → Pay (fake gateway
 *      Success) → /checkout/success/KTX-…; order detail shows the quote number.
 *   4. Approved B2B customer with BANK_TRANSFER_* configured: accept with "Bank transfer / PO" → AWAITING_PAYMENT →
 *      admin "Mark paid" with a UTR → PAID.
 */
test("UI: customer requests a quote, admin responds, customer accepts → paid order", async ({ page, browser }) => {
  // An enquiry-only product shows "Add to Quote" on the PDP (B2B-2).
  const rfqProduct = await createRetailProduct(admin, { name: "Quote Cap", sizes: ["M", "L"], stock: 100 });
  await json(await admin.patch(`${API}/admin/products/${rfqProduct.id}`, { data: { saleChannel: "ENQUIRY_ONLY" } }));

  // Verified customer, signed in through the UI.
  const email = `e2e-rfq-ui-${stamp()}@example.com`;
  const password = "Sup3r-secret-pass";
  const customer = await apiContext();
  await json(await customer.post(`${API}/auth/sign-up/email`, { data: { name: "E2E Buyer", email, password } }));
  await customer.get(firstLink(await readMail(email, "verify-email")));
  await customer.dispose();
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Log In" }).click();
  await expect(page).not.toHaveURL(/\/login/);

  // 1. Quote cart → RFQ form.
  await page.goto(`/product/${rfqProduct.slug}`);
  await page.getByRole("button", { name: "L", exact: true }).click();
  await page.getByRole("button", { name: /Add to Quote/ }).click();
  await page.goto("/quote");
  await page.getByLabel("Your name").fill("E2E Buyer");
  await page.getByLabel("Company / organisation").fill("E2E Security Pvt Ltd");
  // The quote goes to the account email (ADR-018); there is no email field.
  await expect(page.getByText(email)).toBeVisible();
  await page.getByLabel("Mobile number").fill("98200 12345");
  await page.getByRole("button", { name: "Send Quote Request" }).click();
  const quoteNumber = (await page.getByTestId("quote-number").textContent())!.trim();
  expect(quoteNumber).toMatch(/^KTQ-\d+$/);

  // 2. Admin responds with a unit price.
  const staff = await browser.newPage();
  await staff.goto("/admin/login");
  await staff.getByLabel("Email").fill(ADMIN_EMAIL);
  await staff.getByLabel("Password").fill(ADMIN_PASSWORD);
  await staff.getByRole("button", { name: "Sign in" }).click();
  await expect(staff).not.toHaveURL(/\/admin\/login/);
  await staff.goto("/admin/quotes");
  await staff.getByText(quoteNumber).click();
  await staff.getByLabel(`Unit price for ${rfqProduct.name}`).fill("399");
  await staff.getByRole("button", { name: "Send quote" }).click();
  await expect.poll(async () => {
    const list = await json<{ items: { number: string; status: string }[] }>(await admin.get(`${API}/admin/quotes?q=${quoteNumber}`));
    return list.items.find((q) => q.number === quoteNumber)?.status;
  }).toBe("QUOTED");
  await staff.close();

  // 3. Customer accepts → fake gateway → success.
  await page.goto(`/account/quotes/${quoteNumber}`);
  await page.getByLabel("Full name").fill("E2E Buyer");
  await page.getByLabel("Mobile number").fill("9820012345");
  await page.getByLabel("Address", { exact: true }).fill("5 Dock Road");
  await page.getByLabel("PIN code").fill("400001");
  await page.getByRole("button", { name: "Deliver Here" }).click();
  await page.getByRole("button", { name: /^Accept & (Pay|Place Order)/ }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Success" }).click();
  await expect(page).toHaveURL(/\/checkout\/success\/KTX-\d+$/);

  await admin.delete(`${API}/admin/products/${rfqProduct.id}`, { failOnStatusCode: false });
});
