/**
 * MSW mocks for the storefront commerce routes (web-commerce, Stage 3):
 *   /cart*, /checkout/quote, /checkout, /checkout/verify (fake gateway), /me (PATCH), /me/addresses*,
 *   /me/business-profile, /me/orders*, /orders/:number/invoice, and the Better Auth sign-up / OTP / reset routes.
 * The session and users come from admin-handlers.ts (`getMockSessionUser`, `setMockSession`, `getAdminMockDb`).
 *
 * Behaviour mirrors kritex-server: one guest cart (cookie not modelled), line issues with precedence
 * UNAVAILABLE > NOT_PURCHASABLE > OUT_OF_STOCK > INSUFFICIENT_STOCK, issue lines excluded from totals, stored
 * coupons that stop applying come back with `valid: false`, and payments use the **fake gateway**
 * (`keyId: "rzp_fake"`; verify with signature "fake", payment ids `pay_fake_*` succeed, `pay_fake_fail_*` fail).
 *
 * Coupons: WELCOME10 (10%), FLAT200 (₹200 off, min ₹1,500), FREESHIP, OLD10 (expired), MEMBER5 (login required).
 * Email OTP in mocks is always 123456; the reset-password token "valid-token" works.
 * Seed: customer@example.com has one saved address and two orders (KTX-100001 delivered + invoice, KTX-100002 paid).
 */
import { http, HttpResponse } from "msw";
import type { components, paths } from "@/lib/api/schema";
import { mockProducts } from "./catalog";
import { getAdminMockDb, getMockSessionUser, setMockSession } from "./admin-handlers";

type S = components["schemas"];
type Cart = paths["/api/v1/cart"]["get"]["responses"][200]["content"]["application/json"];
type CartLine = Cart["items"][number];
type Totals = Cart["totals"];
type Quote = paths["/api/v1/checkout/quote"]["post"]["responses"][200]["content"]["application/json"];
type QuoteBody = paths["/api/v1/checkout/quote"]["post"]["requestBody"]["content"]["application/json"];
type PlaceBody = paths["/api/v1/checkout"]["post"]["requestBody"]["content"]["application/json"];
type Placed = paths["/api/v1/checkout"]["post"]["responses"][201]["content"]["application/json"];
type Address = PlaceBody["shippingAddress"];
type SavedAddress = paths["/api/v1/me/addresses"]["get"]["responses"][200]["content"]["application/json"]["items"][number];
type OrderDetail = paths["/api/v1/me/orders/{number}"]["get"]["responses"][200]["content"]["application/json"];
type OrderList = paths["/api/v1/me/orders"]["get"]["responses"][200]["content"]["application/json"];
type Me = S["MeDto_Output"];

const apiPath = (path: string) => `*${path}`;
const err = (status: number, code: string, message: string, details?: unknown): Response =>
  HttpResponse.json({ error: { code, message, ...(details !== undefined ? { details } : {}) } }, { status });

export const MOCK_OTP = "123456";
export const MOCK_RESET_TOKEN = "valid-token";
const SELLER_STATE = "27"; // placeholder BUSINESS_STATE_CODE (Maharashtra)
const SHIPPING_FEE = 9900;
const FREE_SHIPPING_ABOVE = 99900;
const GST_RATE = 12;

// ---------------------------------------------------------------------------------------------
// Coupons

interface MockCoupon {
  code: string;
  type: "PERCENT" | "FLAT" | "FREE_SHIPPING";
  value: number;
  minSubtotal?: number;
  expired?: boolean;
  loginRequired?: boolean;
}
const COUPONS: MockCoupon[] = [
  { code: "WELCOME10", type: "PERCENT", value: 10 },
  { code: "FLAT200", type: "FLAT", value: 20000, minSubtotal: 150000 },
  { code: "FREESHIP", type: "FREE_SHIPPING", value: 0 },
  { code: "OLD10", type: "PERCENT", value: 10, expired: true },
  { code: "MEMBER5", type: "PERCENT", value: 5, loginRequired: true },
];

// ---------------------------------------------------------------------------------------------
// State

interface Line {
  variantId: string;
  quantity: number;
}

let cartLines: Line[] = [];
let cartCoupon: string | null = null;
let cartId = "";
let stock = new Map<string, number>();
let orders: (OrderDetail & { userId: string | null; razorpayOrderId: string | null })[] = [];
let addresses = new Map<string, SavedAddress[]>();
let passwords = new Map<string, string>(); // email -> password, for users created/reset through these mocks
let idempotency = new Map<string, { body: string; response: Placed }>();
let orderSeq = 100002;
let seq = 0;
const id = (p: string) => `${p}${Date.now().toString(36)}${(seq++).toString(36)}`;
const now = () => new Date().toISOString();

const findVariant = (variantId: string) => {
  for (const p of mockProducts) {
    const v = p.variants.find((x) => x.id === variantId);
    if (v) return { product: p, variant: v };
  }
  return null;
};
const stockOf = (variantId: string) => stock.get(variantId) ?? (findVariant(variantId)?.variant.inStock ? 10 : 0);

/** Test helper: set available stock for a variant. */
export const setMockStock = (variantId: string, available: number) => stock.set(variantId, available);
/** Test helper: inspect state. */
export const getCommerceMockDb = () => ({ cartLines, cartCoupon, orders, addresses, idempotency });
/** Test helper: put lines straight into the cart. */
export const seedMockCart = (lines: Line[], coupon: string | null = null) => {
  cartLines = lines.map((l) => ({ ...l }));
  cartCoupon = coupon;
  cartId = lines.length ? "cart_mock" : "";
};

function seedAddresses() {
  addresses = new Map([
    [
      "usr_customer",
      [
        {
          id: "adr_home",
          name: "Chris Customer",
          phone: "+919876543210",
          line1: "12 Marine Drive",
          line2: "Near Churchgate",
          city: "Mumbai",
          state: "Maharashtra",
          stateCode: "27",
          pincode: "400020",
          country: "IN",
          isDefault: true,
        },
      ],
    ],
  ]);
}

const SHIRT = "var_full-sleeve-combat-tshirt_M";

function seedOrders() {
  const v = findVariant(SHIRT)!;
  const addr = { ...addresses.get("usr_customer")![0], line2: "Near Churchgate" };
  const { id: _id, isDefault: _d, ...shipping } = addr;
  void _id;
  void _d;
  const item = (oid: string, qty: number): OrderDetail["items"][number] => {
    const lineTotal = (v.variant.price ?? 0) * qty;
    return {
      id: oid,
      productName: v.product.name,
      productSlug: v.product.slug,
      variantId: v.variant.id,
      variantTitle: v.variant.title,
      sku: v.variant.sku,
      image: v.product.images[0]?.url ?? null,
      quantity: qty,
      unitPrice: v.variant.price ?? 0,
      lineTotal,
      gstRate: GST_RATE,
      taxAmount: taxIn(lineTotal),
      hsnCode: "6109",
    };
  };
  const base = (number: string, status: OrderDetail["status"], qty: number, createdAt: string): OrderDetail & { userId: string; razorpayOrderId: string } => {
    const items = [item(`oi_${number}`, qty)];
    const subtotal = items.reduce((n, i) => n + i.lineTotal, 0);
    return {
      number,
      status,
      paymentMethod: "RAZORPAY",
      paymentStatus: "CAPTURED",
      email: "customer@example.com",
      phone: "+919876543210",
      shippingAddress: shipping,
      billingAddress: shipping,
      gstin: null,
      businessName: null,
      couponCode: null,
      items,
      totals: computeTotals(subtotal, 0, subtotal >= FREE_SHIPPING_ABOVE ? 0 : SHIPPING_FEE, false),
      timeline: [
        { type: "CREATED", message: "Order placed", createdAt },
        { type: "PAID", message: "Payment received", createdAt },
      ],
      shipments: [],
      invoice: null,
      quoteNumber: null,
      reservedUntil: null,
      canCancel: status === "PAID",
      canRequestReturn: status === "DELIVERED",
      createdAt,
      updatedAt: createdAt,
      userId: "usr_customer",
      razorpayOrderId: `order_fake_${number}`,
    };
  };
  const delivered = base("KTX-100001", "DELIVERED", 1, "2026-09-20T10:00:00.000Z");
  delivered.timeline.push(
    { type: "SHIPPED", message: "Shipped via Delhivery", createdAt: "2026-09-21T10:00:00.000Z" },
    { type: "DELIVERED", message: "Delivered", createdAt: "2026-09-24T10:00:00.000Z" },
  );
  delivered.shipments = [
    {
      id: "shp_1",
      carrier: "Delhivery",
      awb: "1234567890",
      status: "DELIVERED",
      trackingUrl: "https://www.delhivery.com/track/package/1234567890",
      shippedAt: "2026-09-21T10:00:00.000Z",
      deliveredAt: "2026-09-24T10:00:00.000Z",
      events: [],
    },
  ];
  delivered.invoice = { number: "KTX/2026-27/00001", issuedAt: "2026-09-20T10:05:00.000Z" };
  const paid = base("KTX-100002", "PAID", 2, "2026-10-05T10:00:00.000Z");
  orders = [paid, delivered];
}

export function resetCommerceMockDb() {
  cartLines = [];
  cartCoupon = null;
  cartId = "";
  stock = new Map();
  passwords = new Map();
  idempotency = new Map();
  orderSeq = 100002;
  seedAddresses();
  seedOrders();
}

// ---------------------------------------------------------------------------------------------
// Pricing (simplified TotalsService: GST-inclusive prices, flat shipping with a free threshold)

function taxIn(amount: number, rate = GST_RATE) {
  return Math.round((amount * rate) / (100 + rate));
}

function computeTotals(subtotal: number, discount: number, shipping: number, interState: boolean): Totals {
  const tax = taxIn(subtotal - discount) + taxIn(shipping);
  const half = Math.floor(tax / 2);
  return {
    subtotal,
    discount,
    shipping,
    taxTotal: tax,
    cgst: interState ? 0 : tax - half,
    sgst: interState ? 0 : half,
    igst: interState ? tax : 0,
    total: subtotal - discount + shipping,
    currency: "INR",
  };
}

function lineIssue(line: Line): CartLine["issue"] {
  const found = findVariant(line.variantId);
  if (!found) return "UNAVAILABLE";
  if (!found.product.purchasable) return "NOT_PURCHASABLE";
  const available = stockOf(line.variantId);
  if (available <= 0) return "OUT_OF_STOCK";
  if (available < line.quantity) return "INSUFFICIENT_STOCK";
  return null;
}

function couponCheck(c: MockCoupon, subtotal: number): { code: string; details?: unknown } | null {
  if (c.expired) return { code: "COUPON_EXPIRED" };
  if (c.loginRequired && !getMockSessionUser()) return { code: "COUPON_LOGIN_REQUIRED" };
  if (c.minSubtotal && subtotal < c.minSubtotal)
    return { code: "COUPON_MIN_SUBTOTAL_NOT_MET", details: { minSubtotal: c.minSubtotal, shortBy: c.minSubtotal - subtotal } };
  return null;
}

const COUPON_TEXT: Record<string, string> = {
  COUPON_EXPIRED: "This code has expired.",
  COUPON_LOGIN_REQUIRED: "Log in to use this code.",
  COUPON_MIN_SUBTOTAL_NOT_MET: "Your cart total is below the minimum for this code.",
};

function priceCart(interState = false) {
  const items: CartLine[] = cartLines.map((l) => {
    const found = findVariant(l.variantId);
    const issue = lineIssue(l);
    const p = found?.product;
    const v = found?.variant;
    const unitPrice = p?.saleChannel === "ENQUIRY_ONLY" ? 0 : (v?.price ?? 0);
    const img = p?.images.find((i) => i.variantOptionValue === null) ?? p?.images[0];
    return {
      variantId: l.variantId,
      productId: p?.id ?? "",
      productName: p?.name ?? "Unavailable item",
      productSlug: p?.slug ?? "",
      variantTitle: v?.title ?? "",
      sku: v?.sku ?? "",
      options: v?.options ?? {},
      image: img ? { url: img.url, alt: img.alt } : null,
      saleChannel: p?.saleChannel ?? "ENQUIRY_ONLY",
      inStock: stockOf(l.variantId) > 0,
      quantity: l.quantity,
      unitPrice,
      lineTotal: unitPrice * l.quantity,
      issue,
    };
  });
  const subtotal = items.filter((i) => !i.issue).reduce((n, i) => n + i.lineTotal, 0);
  const coupon = cartCoupon ? COUPONS.find((c) => c.code === cartCoupon) : undefined;
  const problem = coupon ? couponCheck(coupon, subtotal) : null;
  const valid = !!coupon && !problem;
  let discount = 0;
  if (valid && coupon!.type === "PERCENT") discount = Math.round((subtotal * coupon!.value) / 100);
  if (valid && coupon!.type === "FLAT") discount = Math.min(coupon!.value, subtotal);
  const freeShip = valid && coupon!.type === "FREE_SHIPPING";
  const shipping = subtotal === 0 || freeShip || subtotal - discount >= FREE_SHIPPING_ABOVE ? 0 : SHIPPING_FEE;
  return {
    items,
    subtotal,
    discount,
    shipping,
    totals: computeTotals(subtotal, discount, shipping, interState),
    coupon: coupon
      ? {
          code: coupon.code,
          type: coupon.type,
          valid,
          invalidReason: problem?.code ?? null,
          message: problem ? COUPON_TEXT[problem.code] ?? null : null,
        }
      : null,
  };
}

function cartDto(): Cart {
  const priced = priceCart();
  return {
    id: cartId,
    items: priced.items,
    itemCount: priced.items.reduce((n, i) => n + i.quantity, 0),
    hasIssues: priced.items.some((i) => i.issue),
    // Extra fields (valid/invalidReason/message) match the finished server DTO.
    coupon: priced.coupon as Cart["coupon"],
    totals: priced.totals,
    updatedAt: now(),
  };
}

const ensureCart = () => {
  if (!cartId) cartId = "cart_mock";
};

// ---------------------------------------------------------------------------------------------
// Helpers for /me

function requireUser(): Me | Response {
  const user = getMockSessionUser();
  return user ?? err(401, "UNAUTHORIZED", "Not signed in");
}

const toPublicOrder = (o: (typeof orders)[number]): OrderDetail => {
  const { userId: _u, razorpayOrderId: _r, ...rest } = o;
  void _u;
  void _r;
  return rest;
};

function validateAddress(a: Partial<Address> | undefined): string | null {
  if (!a) return "address is required";
  if (!a.name || !a.line1 || !a.city || !a.state || !a.stateCode) return "address is incomplete";
  if (!/^[1-9]\d{5}$/.test(a.pincode ?? "")) return "pincode is invalid";
  if (!/^(?:\+91)?[6-9]\d{9}$/.test(a.phone ?? "")) return "phone is invalid";
  return null;
}

function checkoutChecks(body: QuoteBody): Response | null {
  const addrError = validateAddress(body?.shippingAddress) ?? (body.billingAddress ? validateAddress(body.billingAddress) : null);
  if (addrError) return err(400, "VALIDATION_ERROR", addrError);
  if (cartLines.length === 0) return err(422, "CART_EMPTY", "Cart is empty");
  const priced = priceCart();
  if (priced.items.some((i) => i.issue)) {
    return err(422, "CART_HAS_ISSUES", "Cart has issues", { lines: priced.items.filter((i) => i.issue).map((i) => i.variantId) });
  }
  if (body.gstin) {
    if (!body.businessName) return err(400, "VALIDATION_ERROR", "businessName is required with gstin");
    const billState = (body.billingAddress ?? body.shippingAddress).stateCode;
    if (body.gstin.slice(0, 2) !== billState) return err(422, "GSTIN_STATE_MISMATCH", "GSTIN state does not match the billing state");
  }
  return null;
}

function quoteFor(body: QuoteBody): Quote {
  const interState = body.shippingAddress.stateCode !== SELLER_STATE;
  const priced = priceCart(interState);
  const user = getMockSessionUser();
  const b2b = user?.businessProfile?.status === "APPROVED";
  return {
    items: priced.items.map((i) => {
      // Prorate the discount for the per-line tax (display only).
      const net = priced.subtotal ? i.lineTotal - Math.round((priced.discount * i.lineTotal) / priced.subtotal) : i.lineTotal;
      return {
        variantId: i.variantId,
        productName: i.productName,
        variantTitle: i.variantTitle,
        sku: i.sku,
        image: i.image?.url ?? null,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        lineTotal: i.lineTotal,
        gstRate: GST_RATE,
        taxAmount: taxIn(net),
      };
    }),
    totals: priced.totals,
    couponCode: priced.coupon?.valid ? priced.coupon.code : null,
    interState,
    paymentMethods: b2b ? ["RAZORPAY", "BANK_TRANSFER"] : ["RAZORPAY"],
  };
}

const findOrder = (number: string) => orders.find((o) => o.number === number.toUpperCase());

// ---------------------------------------------------------------------------------------------
// Handlers

export const commerceHandlers = [
  // ---- Better Auth additions (sign-in for users created/reset here falls through to admin-handlers otherwise) ----
  http.post(apiPath("/api/v1/auth/sign-in/email"), async ({ request }) => {
    const body = (await request.clone().json()) as { email?: string; password?: string };
    const email = body.email?.trim().toLowerCase() ?? "";
    const user = getAdminMockDb().users.find((u) => u.email === email);
    if (!user) return undefined;
    if (!passwords.has(email) && user.emailVerified) return undefined; // seeded accounts: admin-handlers answers
    const expected = passwords.get(email) ?? "password123";
    if (body.password !== expected) {
      return HttpResponse.json({ code: "INVALID_EMAIL_OR_PASSWORD", message: "Invalid email or password" }, { status: 401 });
    }
    if (!user.emailVerified) {
      return HttpResponse.json({ code: "EMAIL_NOT_VERIFIED", message: "Email not verified" }, { status: 403 });
    }
    setMockSession(user.email);
    return HttpResponse.json({ redirect: false, token: `tok_${user.id}`, user: { id: user.id, email: user.email, name: user.name, emailVerified: true } });
  }),

  http.post(apiPath("/api/v1/auth/sign-up/email"), async ({ request }) => {
    const body = (await request.json()) as { name?: string; email?: string; password?: string };
    const email = body.email?.trim().toLowerCase() ?? "";
    if (!email || !body.name || !body.password) return HttpResponse.json({ code: "VALIDATION_ERROR", message: "Missing fields" }, { status: 400 });
    if ((body.password ?? "").length < 8) return HttpResponse.json({ code: "PASSWORD_TOO_SHORT", message: "Password too short" }, { status: 400 });
    const db = getAdminMockDb();
    if (db.users.some((u) => u.email === email)) {
      return HttpResponse.json({ code: "USER_ALREADY_EXISTS", message: "User already exists" }, { status: 422 });
    }
    const user: Me = {
      id: id("usr_"),
      email,
      name: body.name,
      role: "CUSTOMER",
      emailVerified: false,
      phone: null,
      businessProfile: null,
      createdAt: now(),
    };
    db.users.push(user);
    passwords.set(email, body.password);
    return HttpResponse.json({ token: null, user: { id: user.id, email, name: user.name, emailVerified: false } });
  }),

  http.post(apiPath("/api/v1/auth/send-verification-email"), () => HttpResponse.json({ status: true })),
  http.post(apiPath("/api/v1/auth/request-password-reset"), () => HttpResponse.json({ status: true })),

  http.post(apiPath("/api/v1/auth/reset-password"), async ({ request }) => {
    const body = (await request.json()) as { token?: string; newPassword?: string };
    if (body.token !== MOCK_RESET_TOKEN) return HttpResponse.json({ code: "INVALID_TOKEN", message: "Invalid token" }, { status: 400 });
    if ((body.newPassword ?? "").length < 8) return HttpResponse.json({ code: "PASSWORD_TOO_SHORT", message: "Password too short" }, { status: 400 });
    return HttpResponse.json({ status: true });
  }),

  http.post(apiPath("/api/v1/auth/email-otp/send-verification-otp"), async ({ request }) => {
    const body = (await request.json()) as { email?: string };
    if (!body.email?.includes("@")) return HttpResponse.json({ code: "INVALID_EMAIL", message: "Invalid email" }, { status: 400 });
    return HttpResponse.json({ success: true });
  }),

  http.post(apiPath("/api/v1/auth/sign-in/email-otp"), async ({ request }) => {
    const body = (await request.json()) as { email?: string; otp?: string };
    const email = body.email?.trim().toLowerCase() ?? "";
    if (body.otp !== MOCK_OTP) return HttpResponse.json({ code: "INVALID_OTP", message: "Invalid OTP" }, { status: 400 });
    const db = getAdminMockDb();
    let user = db.users.find((u) => u.email === email);
    if (!user) {
      // Better Auth's email-OTP sign-in creates the account on first use.
      user = { id: id("usr_"), email, name: email.split("@")[0], role: "CUSTOMER", emailVerified: true, phone: null, businessProfile: null, createdAt: now() };
      db.users.push(user);
    }
    user.emailVerified = true;
    setMockSession(user.email);
    return HttpResponse.json({ token: `tok_${user.id}`, user: { id: user.id, email: user.email, name: user.name, emailVerified: true } });
  }),

  // ---- Cart ----
  http.get(apiPath("/api/v1/cart"), () => HttpResponse.json<Cart>(cartDto())),

  http.post(apiPath("/api/v1/cart/items"), async ({ request }) => {
    const body = (await request.json()) as { variantId?: string; quantity?: number };
    const quantity = body.quantity ?? 1;
    if (!body.variantId || !Number.isInteger(quantity) || quantity < 1) return err(400, "VALIDATION_ERROR", "variantId and quantity >= 1 required");
    const found = findVariant(body.variantId);
    if (!found) return err(404, "NOT_FOUND", "Variant not found");
    if (!found.product.purchasable) return err(422, "NOT_PURCHASABLE", "This product can't be bought online");
    const existing = cartLines.find((l) => l.variantId === body.variantId);
    const next = (existing?.quantity ?? 0) + quantity;
    if (next > 999) return err(422, "QUANTITY_LIMIT_EXCEEDED", "Max 999 per line");
    const available = stockOf(body.variantId);
    if (next > available) return err(409, "INSUFFICIENT_STOCK", "Not enough stock", { available, requested: next });
    ensureCart();
    if (existing) existing.quantity = next;
    else cartLines.push({ variantId: body.variantId, quantity });
    return HttpResponse.json<Cart>(cartDto());
  }),

  http.patch(apiPath("/api/v1/cart/items/:variantId"), async ({ request, params }) => {
    const body = (await request.json()) as { quantity?: number };
    const line = cartLines.find((l) => l.variantId === params.variantId);
    if (!line) return err(404, "NOT_FOUND", "Line not found");
    const quantity = body.quantity ?? -1;
    if (!Number.isInteger(quantity) || quantity < 0) return err(400, "VALIDATION_ERROR", "quantity must be >= 0");
    if (quantity > 999) return err(422, "QUANTITY_LIMIT_EXCEEDED", "Max 999 per line");
    if (quantity === 0) cartLines = cartLines.filter((l) => l !== line);
    else {
      // Lowering a quantity is always allowed; raising it is checked against stock.
      const available = stockOf(line.variantId);
      if (quantity > line.quantity && quantity > available) {
        return err(409, "INSUFFICIENT_STOCK", "Not enough stock", { available, requested: quantity });
      }
      line.quantity = quantity;
    }
    return HttpResponse.json<Cart>(cartDto());
  }),

  http.delete(apiPath("/api/v1/cart/items/:variantId"), ({ params }) => {
    if (!cartLines.some((l) => l.variantId === params.variantId)) return err(404, "NOT_FOUND", "Line not found");
    cartLines = cartLines.filter((l) => l.variantId !== params.variantId);
    return HttpResponse.json<Cart>(cartDto());
  }),

  http.post(apiPath("/api/v1/cart/coupon"), async ({ request }) => {
    const body = (await request.json()) as { code?: string };
    const code = body.code?.trim().toUpperCase() ?? "";
    if (!/^[A-Z0-9_-]{3,32}$/.test(code)) return err(400, "VALIDATION_ERROR", "Invalid code");
    const coupon = COUPONS.find((c) => c.code === code);
    if (!coupon) return err(422, "COUPON_INVALID", "Coupon not found");
    const problem = couponCheck(coupon, priceCart().subtotal);
    if (problem) return err(422, problem.code, COUPON_TEXT[problem.code] ?? problem.code, problem.details);
    ensureCart();
    cartCoupon = coupon.code;
    return HttpResponse.json<Cart>(cartDto());
  }),

  http.delete(apiPath("/api/v1/cart/coupon"), () => {
    cartCoupon = null;
    return HttpResponse.json<Cart>(cartDto());
  }),

  // ---- Checkout ----
  http.post(apiPath("/api/v1/checkout/quote"), async ({ request }) => {
    const body = (await request.json()) as QuoteBody;
    const problem = checkoutChecks(body);
    if (problem) return problem;
    return HttpResponse.json<Quote>(quoteFor(body));
  }),

  http.post(apiPath("/api/v1/checkout"), async ({ request }) => {
    const key = request.headers.get("Idempotency-Key");
    if (!key || !/^[A-Za-z0-9_-]{8,128}$/.test(key)) return err(400, "IDEMPOTENCY_KEY_REQUIRED", "Idempotency-Key header is required");
    const raw = await request.text();
    const prior = idempotency.get(key);
    if (prior) {
      if (prior.body !== raw) return err(409, "IDEMPOTENCY_KEY_REUSED", "Idempotency-Key was used with a different request");
      return HttpResponse.json<Placed>(prior.response, { status: 201 });
    }
    const body = JSON.parse(raw) as PlaceBody;
    if (!body.email?.includes("@") || !/^(?:\+91)?[6-9]\d{9}$/.test(body.phone ?? "")) return err(400, "VALIDATION_ERROR", "email and phone are required");
    const problem = checkoutChecks(body);
    if (problem) return problem;
    const user = getMockSessionUser();
    const method = body.paymentMethod ?? "RAZORPAY";
    if (method === "BANK_TRANSFER" && user?.businessProfile?.status !== "APPROVED") {
      return err(403, "PAYMENT_METHOD_NOT_ALLOWED", "Bank transfer needs an approved business account");
    }
    const quote = quoteFor(body);
    if (body.expectedTotal !== undefined && body.expectedTotal !== quote.totals.total) {
      return err(409, "PRICE_CHANGED", "Prices changed", { expectedTotal: body.expectedTotal, total: quote.totals.total });
    }

    const number = `KTX-${++orderSeq}`;
    const createdAt = now();
    const reservedUntil = new Date(Date.now() + 30 * 60_000).toISOString();
    const email = user?.email ?? body.email.toLowerCase();
    const shipping = { ...body.shippingAddress, line2: body.shippingAddress.line2 ?? null };
    const razorpayOrderId = method === "RAZORPAY" ? `order_fake_${number.replace("-", "")}` : null;
    const order: (typeof orders)[number] = {
      number,
      status: method === "RAZORPAY" ? "PENDING_PAYMENT" : "AWAITING_PAYMENT",
      paymentMethod: method,
      paymentStatus: method === "RAZORPAY" ? "CREATED" : null,
      email,
      phone: body.phone,
      shippingAddress: shipping,
      billingAddress: body.billingAddress ? { ...body.billingAddress, line2: body.billingAddress.line2 ?? null } : shipping,
      gstin: body.gstin ?? null,
      businessName: body.businessName ?? null,
      couponCode: quote.couponCode,
      items: quote.items.map((i, n) => {
        const found = findVariant(i.variantId);
        return { ...i, id: `oi_${number}_${n}`, productSlug: found?.product.slug ?? null, hsnCode: null };
      }),
      totals: quote.totals,
      timeline: [{ type: "CREATED", message: "Order placed", createdAt }],
      shipments: [],
      invoice: null,
      quoteNumber: null,
      reservedUntil,
      canCancel: true,
      canRequestReturn: false,
      createdAt,
      updatedAt: createdAt,
      userId: user?.id ?? null,
      razorpayOrderId,
    };
    orders.unshift(order);
    for (const l of cartLines) stock.set(l.variantId, stockOf(l.variantId) - l.quantity);
    cartLines = [];
    cartCoupon = null;
    if (user && body.saveAddress) {
      const list = addresses.get(user.id) ?? [];
      list.push({ ...body.shippingAddress, line2: body.shippingAddress.line2 ?? null, id: id("adr_"), isDefault: list.length === 0 });
      addresses.set(user.id, list);
    }

    const response: Placed = {
      orderNumber: number,
      status: order.status,
      paymentMethod: method,
      totals: quote.totals,
      reservedUntil,
      razorpay: razorpayOrderId
        ? {
            keyId: "rzp_fake",
            orderId: razorpayOrderId,
            amount: quote.totals.total,
            currency: "INR",
            name: "Kritex",
            description: `Order ${number}`,
            prefill: { name: body.shippingAddress.name, email, contact: body.phone },
          }
        : null,
      bankTransfer:
        method === "BANK_TRANSFER"
          ? { accountName: "Kritex Pvt Ltd", accountNumber: "000000000000", ifsc: "HDFC0000000", bankName: "HDFC Bank", amount: quote.totals.total, reference: number }
          : null,
    };
    idempotency.set(key, { body: raw, response });
    return HttpResponse.json<Placed>(response, { status: 201 });
  }),

  http.post(apiPath("/api/v1/checkout/verify"), async ({ request }) => {
    const body = (await request.json()) as { razorpay_order_id?: string; razorpay_payment_id?: string; razorpay_signature?: string };
    const order = orders.find((o) => o.razorpayOrderId && o.razorpayOrderId === body.razorpay_order_id);
    if (!order) return err(404, "NOT_FOUND", "Unknown order");
    if (body.razorpay_signature !== "fake" || !body.razorpay_payment_id?.startsWith("pay_fake_")) {
      return err(400, "SIGNATURE_INVALID", "Signature verification failed");
    }
    if (order.status === "PENDING_PAYMENT") {
      if (body.razorpay_payment_id.startsWith("pay_fake_fail_")) {
        order.paymentStatus = "FAILED";
        order.timeline.push({ type: "PAYMENT_FAILED", message: "Payment failed", createdAt: now() });
      } else {
        order.status = "PAID";
        order.paymentStatus = "CAPTURED";
        order.reservedUntil = null;
        order.timeline.push({ type: "PAID", message: "Payment received", createdAt: now() });
      }
    }
    return HttpResponse.json({ orderNumber: order.number, status: order.status, paid: order.status === "PAID" });
  }),

  // ---- Profile, addresses, business profile ----
  http.patch(apiPath("/api/v1/me"), async ({ request }) => {
    const user = requireUser();
    if (user instanceof Response) return user;
    const body = (await request.json()) as { name?: string; phone?: string | null };
    if (body.phone && !/^(?:\+91)?[6-9]\d{9}$/.test(body.phone)) return err(400, "VALIDATION_ERROR", "phone is invalid");
    if (body.name !== undefined) user.name = body.name;
    if (body.phone !== undefined) user.phone = body.phone;
    return HttpResponse.json<Me>(user);
  }),

  http.get(apiPath("/api/v1/me/addresses"), () => {
    const user = requireUser();
    if (user instanceof Response) return user;
    const list = [...(addresses.get(user.id) ?? [])].sort((a, b) => Number(b.isDefault) - Number(a.isDefault));
    return HttpResponse.json({ items: list });
  }),

  http.post(apiPath("/api/v1/me/addresses"), async ({ request }) => {
    const user = requireUser();
    if (user instanceof Response) return user;
    const body = (await request.json()) as Address & { isDefault?: boolean };
    const problem = validateAddress(body);
    if (problem) return err(400, "VALIDATION_ERROR", problem);
    const list = addresses.get(user.id) ?? [];
    if (list.length >= 10) return err(422, "ADDRESS_LIMIT_REACHED", "Max 10 addresses");
    const isDefault = !!body.isDefault || list.length === 0;
    if (isDefault) list.forEach((a) => (a.isDefault = false));
    const saved: SavedAddress = { ...body, line2: body.line2 ?? null, country: "IN", id: id("adr_"), isDefault };
    list.push(saved);
    addresses.set(user.id, list);
    return HttpResponse.json(saved, { status: 201 });
  }),

  http.patch(apiPath("/api/v1/me/addresses/:id"), async ({ request, params }) => {
    const user = requireUser();
    if (user instanceof Response) return user;
    const list = addresses.get(user.id) ?? [];
    const found = list.find((a) => a.id === params.id);
    if (!found) return err(404, "NOT_FOUND", "Address not found");
    const body = (await request.json()) as Partial<SavedAddress>;
    if (body.isDefault) list.forEach((a) => (a.isDefault = false));
    Object.assign(found, body, { id: found.id });
    return HttpResponse.json(found);
  }),

  http.delete(apiPath("/api/v1/me/addresses/:id"), ({ params }) => {
    const user = requireUser();
    if (user instanceof Response) return user;
    const list = addresses.get(user.id) ?? [];
    const found = list.find((a) => a.id === params.id);
    if (!found) return err(404, "NOT_FOUND", "Address not found");
    const rest = list.filter((a) => a !== found);
    if (found.isDefault && rest[0]) rest[0].isDefault = true;
    addresses.set(user.id, rest);
    return new HttpResponse(null, { status: 204 });
  }),

  http.post(apiPath("/api/v1/me/business-profile"), async ({ request }) => {
    const user = requireUser();
    if (user instanceof Response) return user;
    const body = (await request.json()) as { gstin?: string; legalName?: string };
    const gstin = body.gstin?.trim().toUpperCase() ?? "";
    if (!/^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(gstin) || !body.legalName) return err(400, "VALIDATION_ERROR", "Invalid GSTIN or legal name");
    if (user.businessProfile && user.businessProfile.status !== "REJECTED") return err(409, "BUSINESS_PROFILE_EXISTS", "Already applied");
    const profile = { id: id("bp_"), gstin, legalName: body.legalName, status: "PENDING" as const, rejectionReason: null, reviewedAt: null, createdAt: now() };
    user.businessProfile = profile;
    return HttpResponse.json(profile, { status: 201 });
  }),

  // ---- Orders ----
  http.get(apiPath("/api/v1/me/orders"), ({ request }) => {
    const user = requireUser();
    if (user instanceof Response) return user;
    const sp = new URL(request.url).searchParams;
    const page = Number(sp.get("page") ?? 1);
    const limit = Number(sp.get("limit") ?? 20);
    const mine = orders.filter((o) => o.userId === user.id);
    const body: OrderList = {
      items: mine.slice((page - 1) * limit, page * limit).map((o) => ({
        number: o.number,
        status: o.status,
        paymentMethod: o.paymentMethod,
        total: o.totals.total,
        itemCount: o.items.reduce((n, i) => n + i.quantity, 0),
        image: o.items[0]?.image ?? null,
        createdAt: o.createdAt,
      })),
      page,
      limit,
      total: mine.length,
    };
    return HttpResponse.json(body);
  }),

  http.get(apiPath("/api/v1/me/orders/:number"), ({ params }) => {
    const user = requireUser();
    if (user instanceof Response) return user;
    const order = findOrder(String(params.number));
    if (!order || order.userId !== user.id) return err(404, "NOT_FOUND", "Order not found");
    return HttpResponse.json<OrderDetail>(toPublicOrder(order));
  }),

  http.post(apiPath("/api/v1/me/orders/:number/cancel"), async ({ params, request }) => {
    const user = requireUser();
    if (user instanceof Response) return user;
    const order = findOrder(String(params.number));
    if (!order || order.userId !== user.id) return err(404, "NOT_FOUND", "Order not found");
    if (!order.canCancel) return err(409, "ORDER_NOT_CANCELLABLE", "Order can no longer be cancelled");
    const body = (await request.json().catch(() => ({}))) as { reason?: string };
    order.status = "CANCELLED";
    order.canCancel = false;
    order.timeline.push({ type: "CANCELLED", message: body.reason ? `Cancelled by you: ${body.reason}` : "Cancelled by you", createdAt: now() });
    return HttpResponse.json<OrderDetail>(toPublicOrder(order));
  }),

  http.post(apiPath("/api/v1/me/orders/:number/return"), async ({ params, request }) => {
    const user = requireUser();
    if (user instanceof Response) return user;
    const order = findOrder(String(params.number));
    if (!order || order.userId !== user.id) return err(404, "NOT_FOUND", "Order not found");
    if (!order.canRequestReturn) return err(409, "RETURN_NOT_ALLOWED", "Return not allowed");
    const body = (await request.json()) as { items?: { orderItemId: string; quantity: number }[]; type?: string };
    if (!body.items?.length) return err(400, "VALIDATION_ERROR", "items required");
    order.status = "RETURN_REQUESTED";
    order.canRequestReturn = false;
    order.timeline.push({ type: "RETURN_REQUESTED", message: body.type === "EXCHANGE" ? "Exchange requested" : "Return requested", createdAt: now() });
    return HttpResponse.json<OrderDetail>(toPublicOrder(order));
  }),

  http.get(apiPath("/api/v1/orders/:number/invoice"), ({ params }) => {
    const user = requireUser();
    if (user instanceof Response) return user;
    const order = findOrder(String(params.number));
    if (!order || order.userId !== user.id || !order.invoice) return err(404, "NOT_FOUND", "No invoice");
    return HttpResponse.json({
      number: order.invoice.number,
      issuedAt: order.invoice.issuedAt,
      url: `/__mock-invoices/${order.number}.pdf`,
      expiresAt: new Date(Date.now() + 5 * 60_000).toISOString(),
    });
  }),
];

resetCommerceMockDb();
