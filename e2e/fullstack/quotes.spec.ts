import { randomUUID } from "node:crypto";
import type { APIRequestContext } from "@playwright/test";
import { API, adminApi, apiContext, createRetailProduct, expect, firstLink, json, readMail, stamp, test, type CreatedProduct } from "./fixtures";

/**
 * QA-5: RFQ → quote → accept → order.
 * The API flow runs now (server B2B-1). The UI flow waits for the web quote cart / inboxes (B2B-2, B2B-5) and is fixme.
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
test.fixme("UI: B2B customer requests a quote, admin responds, customer accepts → order", async ({ page }) => {
  await page.goto(`/product/${product.slug}`);
  await page.getByRole("button", { name: "Request Quote" }).click();
  await page.goto("/account/quotes");
  await expect(page.getByText(/KTQ-\d+/)).toBeVisible();
});
