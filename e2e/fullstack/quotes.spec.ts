import { API, adminApi, expect, firstLink, readMail, stamp, test } from "./fixtures";

/**
 * QA-5 (B2B-1/B2B-2/B2B-5 in progress): RFQ → quote → accept → order. Enable at Stage 4 integration.
 *
 * Intended steps:
 *   1. Admin API: create a B2B_ONLY product (2 sizes) and approve a business profile for a new verified customer
 *      (sign up → verify link from the mail log → /account/business form → admin approves via /admin/b2b-approvals).
 *   2. Customer: PDP shows "Request Quote" → adds both sizes with quantities (e.g. 50 + 30) to the quote cart → RFQ form
 *      (company, GSTIN, notes) → submit → confirmation with KTQ-… number; dev mail log has the "quote received" email.
 *   3. Admin: /admin/quotes inbox shows the RFQ → open → set quoted unit prices per line + validity + message → "Send quote".
 *      Customer gets the "quote ready" email.
 *   4. Customer: /account/quotes → KTQ-… shows QUOTED with the admin's prices and message → "Accept" → address +
 *      payment method (Razorpay → fake gateway Success, or Bank transfer when BANK_TRANSFER_* is set → AWAITING_PAYMENT)
 *      → order KTX-… created with quoteNumber, totals = quoted prices (tier/quote price, not list price).
 *   5. Admin: order detail links the quote; for bank transfer, "Mark paid" with a UTR → PAID.
 *   6. Negative: a different customer gets 404 on /me/quotes/KTQ-…; accepting twice → 409; expired quote can't be accepted.
 */
test.fixme("B2B customer requests a quote, admin responds, customer accepts → order", async ({ page }) => {
  const admin = await adminApi();
  const email = `e2e-b2b-${stamp()}@example.com`;

  await page.goto("/signup");
  await page.getByLabel("Full name").fill("E2E Buyer");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill("Sup3r-secret-pass");
  await page.getByLabel("Confirm password").fill("Sup3r-secret-pass");
  await page.getByRole("button", { name: "Create Account" }).click();
  await page.goto(firstLink(await readMail(email, "verify-email")));

  // …business profile + approval, quote cart, RFQ, admin response, accept (see steps above)…
  await page.goto("/account/quotes");
  await expect(page.getByText(/KTQ-\d+/)).toBeVisible();
  const quotes = await admin.get(`${API}/admin/quotes`);
  expect(quotes.ok()).toBe(true);
  await admin.dispose();
});
