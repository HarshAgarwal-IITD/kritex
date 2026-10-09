import { createHmac, randomUUID } from "node:crypto";
import type { APIRequestContext } from "@playwright/test";
import {
  API,
  BASE,
  adminApi,
  apiContext,
  createRetailProduct,
  expect,
  firstLink,
  json,
  readMail,
  stamp,
  test,
  type CreatedProduct,
} from "./fixtures";

/**
 * QA-6: security checks against the running stack. Each test is a finding's proof (or proof of its absence);
 * IDs refer to docs/ecommerce/SECURITY-REVIEW.md. Tests marked `test.fail()` document an OPEN finding: they assert the
 * secure behaviour and are expected to fail until the server is fixed (Playwright then reports them as passing
 * unexpectedly, which is the signal to drop the annotation).
 */
test.describe.configure({ mode: "serial" });

const PASSWORD = "Sup3r-secret-pass";
const ORIGIN = new URL(BASE).origin;
/** The API itself, not through the Vite proxy (whose own CORS middleware answers preflights in dev). */
const DIRECT_API = process.env.E2E_API_URL ? `${process.env.E2E_API_URL}/api/v1` : API;

let admin: APIRequestContext;
let product: CreatedProduct;
let variantId = "";

test.beforeAll(async () => {
  admin = await adminApi();
  product = await createRetailProduct(admin, { name: "Sec Probe", sizes: ["M"], stock: 50 });
  const detail = await json<{ variants: { id: string }[] }>(await admin.get(`${API}/products/${product.slug}`));
  variantId = detail.variants[0].id;
});

test.afterAll(async () => {
  if (product) await admin.delete(`${API}/admin/products/${product.id}`, { failOnStatusCode: false });
  await admin?.dispose();
});

// ---------------------------------------------------------------------------------------------- helpers

/** Signs up, follows the emailed verification link (which signs in), returns the signed-in context. */
async function newCustomer(email = `e2e-sec-${stamp()}@example.com`) {
  const ctx = await apiContext();
  await json(await ctx.post(`${API}/auth/sign-up/email`, { data: { name: "Sec Customer", email, password: PASSWORD } }));
  const res = await ctx.get(firstLink(await readMail(email, "verify-email")));
  expect(res.ok()).toBe(true);
  const me = await json<{ email: string; role: string }>(await ctx.get(`${API}/me`));
  expect(me).toMatchObject({ email, role: "CUSTOMER" });
  return ctx;
}

/** Admin invites a STAFF user; the invite link → set password → sign in. */
async function newStaff() {
  const email = `e2e-staff-${stamp()}@example.com`;
  await json(await admin.post(`${API}/admin/users`, { data: { email, name: "Sec Staff", role: "STAFF" } }));
  const ctx = await apiContext();
  const invite = await ctx.get(firstLink(await readMail(email, "staff-invite")), { maxRedirects: 0 });
  const token = new URL(invite.headers().location, BASE).searchParams.get("token");
  expect(token).toBeTruthy();
  await json(await ctx.post(`${API}/auth/reset-password`, { data: { token, newPassword: PASSWORD } }));
  await json(await ctx.post(`${API}/auth/sign-in/email`, { data: { email, password: PASSWORD } }));
  return ctx;
}

const address = (name = "Sec Buyer") => ({
  name,
  phone: "9876543210",
  line1: "1 Test Street",
  city: "Mumbai",
  state: "Maharashtra",
  stateCode: "27",
  pincode: "400001",
});

type Placed = { orderNumber: string; totals: { total: number }; razorpay: { orderId: string; amount: number } | null };

/** A guest cart with `quantity` of the probe product (+ optional coupon), then POST /checkout. */
async function guestCheckout(
  opts: { email?: string; quantity?: number; coupon?: string; body?: Record<string, unknown>; name?: string } = {},
) {
  const ctx = await apiContext();
  await json(await ctx.post(`${API}/cart/items`, { data: { variantId, quantity: opts.quantity ?? 1 } }));
  if (opts.coupon) await json(await ctx.post(`${API}/cart/coupon`, { data: { code: opts.coupon } }));
  const res = await ctx.post(`${API}/checkout`, {
    headers: { "Idempotency-Key": randomUUID() },
    data: {
      email: opts.email ?? `e2e-sec-guest-${stamp()}@example.com`,
      phone: "9876543210",
      shippingAddress: address(opts.name),
      paymentMethod: "RAZORPAY",
      ...opts.body,
    },
  });
  return { ctx, res };
}

const errorCode = async (res: { json(): Promise<unknown> }) => ((await res.json()) as { error?: { code?: string } }).error?.code;

// ---------------------------------------------------------------------------------------------- authz

test("SEC-AUTHZ: every protected route rejects anonymous users; /admin/* rejects customers; /admin/users is ADMIN-only", async () => {
  test.setTimeout(120_000);
  const spec = await json<{ paths: Record<string, Record<string, { security?: unknown[] }>> }>(
    await admin.get(`${BASE}/api/docs-json`),
  );
  const anon = await apiContext();
  const customer = await newCustomer();
  const staff = await newStaff();
  const call = (ctx: APIRequestContext, method: string, url: string) =>
    ctx.fetch(url, { method, data: method === "get" || method === "delete" ? undefined : {}, maxRedirects: 0 });

  const problems: string[] = [];
  let checked = 0;
  for (const [path, ops] of Object.entries(spec.paths)) {
    const url = `${BASE}${path.replace(/\{[^}]+\}/g, "KTX-000000")}`;
    for (const [method, op] of Object.entries(ops)) {
      const isAdmin = path.startsWith("/api/v1/admin");
      if (!op.security?.length) {
        if (isAdmin) problems.push(`${method} ${path} is admin but documented as public`);
        continue;
      }
      checked++;
      const a = await call(anon, method, url);
      if (a.status() !== 401) problems.push(`anonymous ${method} ${path} → ${a.status()}`);
      if (isAdmin) {
        const c = await call(customer, method, url);
        if (c.status() !== 403) problems.push(`customer ${method} ${path} → ${c.status()}`);
        const s = await call(staff, method, url);
        const adminOnly = path.startsWith("/api/v1/admin/users");
        if (adminOnly && s.status() !== 403) problems.push(`staff ${method} ${path} → ${s.status()} (ADMIN only)`);
        if (!adminOnly && [401, 403].includes(s.status())) problems.push(`staff ${method} ${path} → ${s.status()}`);
      }
    }
  }
  expect(problems).toEqual([]);
  expect(checked).toBeGreaterThan(50);
  await Promise.all([anon.dispose(), customer.dispose(), staff.dispose()]);
});

test("SEC-IDOR: saved addresses are scoped to their owner", async () => {
  const a = await newCustomer();
  const b = await newCustomer();
  const created = await json<{ id: string }>(await a.post(`${API}/me/addresses`, { data: address("Owner A") }));
  const list = await json<{ items: { id: string }[] }>(await b.get(`${API}/me/addresses`));
  expect(list.items.map((x) => x.id)).not.toContain(created.id);
  expect((await b.patch(`${API}/me/addresses/${created.id}`, { data: { name: "Hijacked" } })).status()).toBe(404);
  expect((await b.delete(`${API}/me/addresses/${created.id}`)).status()).toBe(404);
  const still = await json<{ items: { id: string; name: string }[] }>(await a.get(`${API}/me/addresses`));
  expect(still.items.find((x) => x.id === created.id)?.name).toBe("Owner A");
  await Promise.all([a.dispose(), b.dispose()]);
});

test("SEC-IDOR-QUOTES: a quote is visible only to its creator / the verified owner of its email", async () => {
  const emailA = `e2e-sec-quote-${stamp()}@example.com`;
  const a = await newCustomer(emailA);
  const created = await a.post(`${API}/quotes`, {
    data: {
      contactName: "Quote Owner",
      email: emailA,
      phone: "9876543210",
      organization: "E2E Org",
      items: [{ productId: product.id, quantity: 25 }],
    },
  });
  test.skip(created.status() === 501, "quotes API not implemented on this server (B2B-1)");
  const { number } = await json<{ number: string }>(created);
  expect((await a.get(`${API}/me/quotes/${number}`)).status()).toBe(200);

  const b = await newCustomer();
  expect((await b.get(`${API}/me/quotes/${number}`)).status()).toBe(404);
  const listB = await json<{ items: { number: string }[] }>(await b.get(`${API}/me/quotes`));
  expect(listB.items.map((q) => q.number)).not.toContain(number);
  const accept = await b.post(`${API}/me/quotes/${number}/accept`, {
    headers: { "Idempotency-Key": randomUUID() },
    data: { paymentMethod: "RAZORPAY", shippingAddress: address() },
  });
  expect(accept.status()).toBe(404);
  const anon = await apiContext();
  expect((await anon.get(`${API}/me/quotes/${number}`)).status()).toBe(401);
  await Promise.all([a.dispose(), b.dispose(), anon.dispose()]);
});

// ---------------------------------------------------------------------------------------------- payments

test("SEC-WEBHOOK: forged Razorpay webhooks and verify calls can't mark an order paid", async () => {
  const { ctx, res } = await guestCheckout();
  const placed = await json<Placed & { razorpay: { keyId: string } }>(res);
  // The harness must never let the API pick up real Razorpay keys (e.g. from kritex-server/.env via Prisma's dotenv).
  if (process.env.E2E_RAZORPAY !== "1") expect(placed.razorpay.keyId).toBe("rzp_fake");
  const providerOrderId = placed.razorpay!.orderId;
  const body = JSON.stringify({
    event: "payment.captured",
    payload: { payment: { entity: { id: `pay_forged_${stamp()}`, order_id: providerOrderId, amount: placed.totals.total, method: "upi" } } },
  });
  const hook = (headers: Record<string, string>, data = body) =>
    ctx.post(`${API}/webhooks/razorpay`, { headers: { "content-type": "application/json", ...headers }, data });

  expect((await hook({})).status()).toBe(400);
  expect((await hook({ "x-razorpay-signature": "0".repeat(64) })).status()).toBe(400);
  const wrongSecret = createHmac("sha256", "not-the-secret").update(body).digest("hex");
  expect((await hook({ "x-razorpay-signature": wrongSecret })).status()).toBe(400);
  // Signature of a differently-serialised body (raw body is what's signed, not the parsed JSON).
  const reserialised = createHmac("sha256", "not-the-secret").update(JSON.stringify(JSON.parse(body), null, 2)).digest("hex");
  expect((await hook({ "x-razorpay-signature": reserialised })).status()).toBe(400);

  // Client-side verify with a made-up signature (the real gateway's HMAC; the fake gateway only accepts "fake").
  const verify = await ctx.post(`${API}/checkout/verify`, {
    data: { razorpay_order_id: providerOrderId, razorpay_payment_id: "pay_ABCDEFGHIJKLMN", razorpay_signature: "0".repeat(64) },
  });
  expect(verify.status()).toBe(400);
  expect(await errorCode(verify)).toBe("SIGNATURE_INVALID");

  const order = await json<{ items: { number: string; status: string }[] }>(
    await admin.get(`${API}/admin/orders?q=${placed.orderNumber}`),
  );
  expect(order.items[0].status).toBe("PENDING_PAYMENT");
  await ctx.dispose();
});

test("SEC-PRICE: client-sent prices and totals are ignored; a stale expectedTotal gets 409 PRICE_CHANGED", async () => {
  const ctx = await apiContext();
  const cart = await json<{ items: { unitPrice: number; lineTotal: number }[] }>(
    await ctx.post(`${API}/cart/items`, { data: { variantId, quantity: 2, price: 1, unitPrice: 1, lineTotal: 2 } }),
  );
  expect(cart.items[0].unitPrice).toBe(49900);
  expect(cart.items[0].lineTotal).toBe(99800);

  const body = {
    email: `e2e-sec-price-${stamp()}@example.com`,
    phone: "9876543210",
    shippingAddress: address(),
    paymentMethod: "RAZORPAY",
    totals: { total: 100, subtotal: 100 },
    items: [{ variantId, quantity: 2, unitPrice: 1 }],
    discount: 99800,
    shipping: 0,
  };
  const stale = await ctx.post(`${API}/checkout`, { headers: { "Idempotency-Key": randomUUID() }, data: { ...body, expectedTotal: 100 } });
  expect(stale.status()).toBe(409);
  expect(await errorCode(stale)).toBe("PRICE_CHANGED");

  const placed = await json<Placed>(await ctx.post(`${API}/checkout`, { headers: { "Idempotency-Key": randomUUID() }, data: body }));
  // 2 × ₹499 + ₹99 shipping, whatever the client said.
  expect(placed.totals.total).toBe(2 * 49900 + 9900);
  expect(placed.razorpay!.amount).toBe(placed.totals.total);

  for (const quantity of [0, -1, 1000, 1.5]) {
    expect((await ctx.post(`${API}/cart/items`, { data: { variantId, quantity } })).status(), `quantity ${quantity}`).toBe(400);
  }
  await ctx.dispose();
});

test("SEC-REFUND: concurrent full refunds can't refund more than was paid", async () => {
  const { ctx, res } = await guestCheckout({ quantity: 1 });
  const placed = await json<Placed>(res);
  // Fake gateway (dev/test only): payment ids `pay_fake_*` with signature "fake" are captured.
  await json(
    await ctx.post(`${API}/checkout/verify`, {
      data: { razorpay_order_id: placed.razorpay!.orderId, razorpay_payment_id: `pay_fake_${stamp()}`, razorpay_signature: "fake" },
    }),
  );
  const list = await json<{ items: { id: string; number: string }[] }>(await admin.get(`${API}/admin/orders?q=${placed.orderNumber}`));
  const id = list.items.find((o) => o.number === placed.orderNumber)!.id;
  const attempts = await Promise.all(
    [0, 1, 2].map(() =>
      admin.post(`${API}/admin/orders/${id}/refund`, { data: { amount: placed.totals.total, reason: "race", restockItems: [] } }),
    ),
  );
  expect(attempts.filter((r) => r.ok())).toHaveLength(1);
  const order = await json<{ refunds: { amount: number }[] }>(await admin.get(`${API}/admin/orders/${id}`));
  expect(order.refunds.reduce((sum, r) => sum + r.amount, 0)).toBe(placed.totals.total);
  await ctx.dispose();
});

// ---------------------------------------------------------------------------------------------- coupons

const checkoutAs = (ctx: APIRequestContext) =>
  ctx.post(`${API}/checkout`, {
    headers: { "Idempotency-Key": randomUUID() },
    data: { email: "ignored@example.com", phone: "9876543210", shippingAddress: address(), paymentMethod: "RAZORPAY" },
  });

test("SEC-COUPON: per-customer coupons need an account and hold per account; the global usage limit holds under concurrency", async () => {
  const code = `E2ESEC${stamp().toUpperCase()}`;
  await json(await admin.post(`${API}/admin/coupons`, { data: { code, type: "PERCENT", value: 10, perUserLimit: 1 } }));

  // Guests can't use a per-customer coupon at all (no stable identity).
  const guest = await apiContext();
  await json(await guest.post(`${API}/cart/items`, { data: { variantId, quantity: 1 } }));
  const guestApply = await guest.post(`${API}/cart/coupon`, { data: { code } });
  expect(guestApply.status()).toBe(422);
  expect(await errorCode(guestApply)).toBe("COUPON_LOGIN_REQUIRED");

  // A customer uses it once; the next checkout (cart still holds the coupon) is refused.
  const customer = await newCustomer();
  await json(await customer.post(`${API}/cart/items`, { data: { variantId, quantity: 1 } }));
  await json(await customer.post(`${API}/cart/coupon`, { data: { code: code.toLowerCase() } }));
  expect((await checkoutAs(customer)).status()).toBe(201);
  const second = await checkoutAs(customer);
  expect(second.status()).toBe(422);
  expect(await errorCode(second)).toBe("COUPON_PER_CUSTOMER_LIMIT_REACHED");

  // usageLimit 1, three guests at once: exactly one order gets it.
  const limited = `E2ESECL${stamp().toUpperCase()}`;
  await json(await admin.post(`${API}/admin/coupons`, { data: { code: limited, type: "FLAT", value: 5000, usageLimit: 1 } }));
  const results = await Promise.all([0, 1, 2].map(() => guestCheckout({ coupon: limited })));
  expect(results.map((r) => r.res.status()).filter((s) => s === 201)).toHaveLength(1);
  for (const r of results) await r.ctx.dispose();
  await Promise.all([guest.dispose(), customer.dispose()]);
});

test("SEC-COUPON-RACE: per-customer limit holds under concurrent checkouts of the same cart", async () => {
  // Holds today only because the cart's variant rows are locked (FOR UPDATE) before the usage count is read.
  const code = `E2ERACE${stamp().toUpperCase()}`;
  await json(await admin.post(`${API}/admin/coupons`, { data: { code, type: "PERCENT", value: 10, perUserLimit: 1 } }));
  const customer = await newCustomer();
  await json(await customer.post(`${API}/cart/items`, { data: { variantId, quantity: 1 } }));
  await json(await customer.post(`${API}/cart/coupon`, { data: { code } }));
  const results = await Promise.all([0, 1, 2, 3].map(() => checkoutAs(customer)));
  const statuses = results.map((r) => r.status());
  await customer.dispose();
  expect(statuses.filter((s) => s === 201), `statuses ${statuses.join(",")}`).toHaveLength(1);
});

// ---------------------------------------------------------------------------------------------- auth

test("SEC-THROTTLE: sign-in and coupon guessing are rate limited per client", async () => {
  const ctx = await apiContext();
  const codes: number[] = [];
  for (let i = 0; i < 11; i++) {
    const r = await ctx.post(`${API}/auth/sign-in/email`, { data: { email: "nobody@example.com", password: "wrong-password" } });
    codes.push(r.status());
  }
  expect(codes.slice(0, 10).every((c) => c === 401)).toBe(true);
  expect(codes[10]).toBe(429);

  const guesses: number[] = [];
  for (let i = 0; i < 11; i++) {
    guesses.push((await ctx.post(`${API}/cart/coupon`, { data: { code: `GUESS${i}X` } })).status());
  }
  expect(guesses[10]).toBe(429);
  await ctx.dispose();
});

test("SEC-AUTH: sign-up doesn't reveal existing accounts; a squatted unverified account can't be taken over via OTP", async () => {
  const anon = await apiContext();
  // Existing (seeded admin) email: same 200 shape as a new one, no session.
  const existing = await anon.post(`${API}/auth/sign-up/email`, {
    data: { name: "X", email: process.env.E2E_ADMIN_EMAIL, password: "Another-pass-1" },
  });
  expect(existing.status()).toBe(200);
  expect(((await existing.json()) as { token: unknown }).token).toBeNull();

  // Attacker pre-registers the victim's email with their own password (unverified)…
  const victim = `e2e-victim-${stamp()}@example.com`;
  await json(await anon.post(`${API}/auth/sign-up/email`, { data: { name: "Attacker", email: victim, password: "Attacker-pass-1" } }));
  // …the victim later signs in with an emailed code…
  const v = await apiContext();
  await json(await v.post(`${API}/auth/email-otp/send-verification-otp`, { data: { email: victim, type: "sign-in" } }));
  const otp = (await readMail(victim, "otp-sign-in")).match(/\b\d{6}\b/)![0];
  await json(await v.post(`${API}/auth/sign-in/email-otp`, { data: { email: victim, otp } }));
  // …and the attacker's password no longer opens the (now verified) account.
  const attacker = await apiContext();
  const login = await attacker.post(`${API}/auth/sign-in/email`, { data: { email: victim, password: "Attacker-pass-1" } });
  expect(login.status()).toBe(401);
  await Promise.all([anon.dispose(), v.dispose(), attacker.dispose()]);
});

test("SEC-CSRF/CORS: cookie writes from a foreign Origin are refused; CORS doesn't allow foreign origins", async () => {
  const customer = await newCustomer();
  const evil = await customer.post(`${API}/me/addresses`, { headers: { Origin: "https://evil.example" }, data: address() });
  expect(evil.status()).toBe(403);
  expect(await errorCode(evil)).toBe("INVALID_ORIGIN");

  const preflight = await customer.fetch(`${DIRECT_API}/me/addresses`, {
    method: "OPTIONS",
    headers: { Origin: "https://evil.example", "Access-Control-Request-Method": "POST" },
  });
  expect(preflight.headers()["access-control-allow-origin"]).toBeUndefined();
  const ok = await customer.fetch(`${DIRECT_API}/me/addresses`, {
    method: "OPTIONS",
    headers: { Origin: ORIGIN, "Access-Control-Request-Method": "POST" },
  });
  expect(ok.headers()["access-control-allow-origin"]).toBe(ORIGIN);
  expect(ok.headers()["access-control-allow-credentials"]).toBe("true");

  // Better Auth refuses sign-in from untrusted origins and off-site redirect targets.
  const anon = await apiContext();
  const foreign = await anon.post(`${API}/auth/sign-in/email`, {
    headers: { Origin: "https://evil.example" },
    data: { email: "x@example.com", password: "whatever-123" },
  });
  expect(foreign.status()).toBe(403);
  const verify = await anon.get(`${API}/auth/verify-email?token=bad&callbackURL=https://evil.example/x`, { maxRedirects: 0 });
  expect(verify.status()).toBe(403);
  const reset = await anon.post(`${API}/auth/request-password-reset`, {
    data: { email: "x@example.com", redirectTo: "https://evil.example/reset" },
  });
  expect(reset.status()).toBe(403);
  await Promise.all([customer.dispose(), anon.dispose()]);
});

test("SEC-HEADERS: API responses carry helmet's hardening headers and no framework banner", async () => {
  const anon = await apiContext();
  const res = await anon.get(`${API}/health`);
  const h = res.headers();
  expect(h["x-content-type-options"]).toBe("nosniff");
  expect(h["strict-transport-security"]).toBeTruthy();
  expect(h["x-frame-options"]).toBeTruthy();
  expect(h["x-powered-by"]).toBeUndefined();
  await anon.dispose();
});

// ---------------------------------------------------------------------------------------------- uploads / exports / content

test("SEC-UPLOAD: upload tickets are bound to content type and size; no SVG/HTML uploads", async () => {
  const svg = await admin.post(`${API}/admin/uploads`, {
    data: { purpose: "PRODUCT_IMAGE", filename: "x.svg", contentType: "image/svg+xml", size: 10 },
  });
  expect(svg.status()).toBe(400);
  const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==", "base64");
  const ticket = await json<{ uploadUrl: string; publicUrl: string }>(
    await admin.post(`${API}/admin/uploads`, { data: { purpose: "PRODUCT_IMAGE", filename: "x.png", contentType: "image/png", size: png.length } }),
  );
  const anon = await apiContext();
  const url = new URL(ticket.uploadUrl, BASE).toString();
  expect((await anon.put(url, { headers: { "content-type": "text/html" }, data: png })).status()).toBe(403);
  const bigger = url.replace(/size=\d+/, "size=99999");
  expect((await anon.put(bigger, { headers: { "content-type": "image/png" }, data: png })).status()).toBe(403);
  expect((await anon.put(url, { headers: { "content-type": "image/png" }, data: png })).status()).toBe(200);
  const served = await anon.get(new URL(ticket.publicUrl, BASE).toString());
  expect(served.headers()["content-type"]).toMatch(/^image\/png/);
  expect(served.headers()["x-content-type-options"]).toBe("nosniff");
  await anon.dispose();
});

test("SEC-CSV: formula-looking customer input is neutralised in the orders CSV export", async () => {
  const payload = '=HYPERLINK("https://evil.example","x")';
  const { ctx, res } = await guestCheckout({ name: payload });
  const placed = await json<Placed>(res);
  const csv = await (await admin.get(`${API}/admin/orders/export.csv?q=${placed.orderNumber}`)).text();
  const row = csv.split("\n").find((l) => l.includes(placed.orderNumber))!;
  expect(row).toContain(`'=HYPERLINK`);
  expect(row).not.toMatch(/(^|,)"?=HYPERLINK/);
  await ctx.dispose();
});

test("SEC-XSS-URL (open, medium): product media URLs accept javascript: (rendered as <a href> on the PDP)", async () => {
  test.fail(true, "SEC-XSS-URL: image/spec-sheet URLs are free text; should be https:// or /path only");
  const res = await admin.post(`${API}/admin/products`, {
    data: {
      slug: `e2e-xss-${stamp()}`,
      name: "XSS probe",
      categoryId: (await json<{ items: { id: string }[] }>(await admin.get(`${API}/categories`))).items[0].id,
      saleChannel: "ENQUIRY_ONLY",
      specSheets: [{ title: "Sheet", url: "javascript:alert(document.domain)" }],
    },
  });
  const created = res.ok() ? ((await res.json()) as { id: string }) : null;
  if (created) await admin.delete(`${API}/admin/products/${created.id}`);
  expect(res.status()).toBe(400);
});
