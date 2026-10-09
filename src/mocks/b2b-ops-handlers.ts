/**
 * MSW mocks for Stage 4 web-b2b-ops (B2B-2/3/5, OPS-4/5). Shapes follow src/lib/api/schema.d.ts exactly.
 *
 *   POST /quotes, GET /me/quotes, GET /me/quotes/:number, POST /me/quotes/:number/accept (Idempotency-Key)
 *   GET /admin/quotes, GET /admin/quotes/:id, POST /admin/quotes/:id/respond, POST /admin/quotes/:id/reject
 *   POST /admin/orders/:id/ship (manual), POST /admin/orders/:id/shiprocket
 *   GET /orders/:number/tracking?email= (public)
 *   GET /products/:slug for an approved B2B viewer: adds `priceTiers` and makes B2B_ONLY purchasable
 *     (everyone else falls through to catalog.ts).
 *
 * Mock B2B buyer: buyer@b2b.example / password123 (role B2B_CUSTOMER, APPROVED). Call `ensureMockB2BUser()`
 * in tests before `setMockSession(MOCK_B2B_EMAIL)` (resetAdminMockDb() re-seeds the users without it).
 * Seed quotes: KTQ-100001 QUOTED for customer@example.com, KTQ-100002 + KTQ-100003 REQUESTED (guests),
 * KTQ-100004 REJECTED. Accepting a quote creates an order through commerce-handlers (fake gateway).
 * Shiprocket mock: `weightGrams > 50000` fails with 422 SHIPROCKET_ERROR.
 */
import { http, HttpResponse } from "msw";
import type { components } from "@/lib/api/schema";
import { mockProducts } from "./catalog";
import { getAdminMockDb, getMockSessionUser } from "./admin-handlers";
import { getAdminCommerceDb, setMockAdminOrderStatus, setPendingQuotesSource, type MockOrder } from "./admin-commerce";
import { getCommerceMockDb, isApprovedB2B, MOCK_PRICE_TIERS, placeMockOrder } from "./commerce-handlers";

type S = components["schemas"];
type Me = S["MeDto_Output"];
type AdminQuote = S["AdminQuoteDetailDto_Output"];
type QuoteStatus = AdminQuote["status"];
type CustomerQuote = S["QuoteDetailDto_Output"];
type Placed = S["PlacedOrderDto_Output"];
type Shipment = S["AdminShipmentDto_Output"];
type Tracking = S["OrderTrackingDto_Output"];
type ProductDetail = (typeof mockProducts)[number];

const apiPath = (path: string) => `*${path}`;
const err = (status: number, code: string, message: string, details?: unknown): Response =>
  HttpResponse.json({ error: { code, message, ...(details !== undefined ? { details } : {}) } }, { status });
const now = () => new Date().toISOString();
const days = (d: number) => new Date(Date.now() + d * 86400_000).toISOString();
let seq = 0;
const cuid = (prefix: string) => `${prefix}${Date.now().toString(36)}${(seq++).toString(36)}`;

const GSTIN_RE = /^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;
const PHONE_RE = /^(?:\+91)?[6-9]\d{9}$/;
const QUOTE_STATUSES: QuoteStatus[] = ["REQUESTED", "QUOTED", "ACCEPTED", "EXPIRED", "REJECTED", "CONVERTED"];

// ---------------------------------------------------------------------------------------------
// Mock approved B2B buyer

export const MOCK_B2B_EMAIL = "buyer@b2b.example";

/** Adds the approved B2B buyer to the mock users (idempotent). */
export function ensureMockB2BUser(): Me {
  const users = getAdminMockDb().users;
  let user = users.find((u) => u.email === MOCK_B2B_EMAIL);
  if (!user) {
    user = {
      id: "usr_b2b",
      email: MOCK_B2B_EMAIL,
      name: "Bina Buyer",
      role: "B2B_CUSTOMER",
      emailVerified: true,
      phone: "+919820012345",
      businessProfile: {
        id: "bp_b2b",
        gstin: "27AAPFU0939F1ZV",
        legalName: "Bina Uniforms Pvt Ltd",
        status: "APPROVED",
        rejectionReason: null,
        reviewedAt: "2026-06-01T10:00:00.000Z",
        createdAt: "2026-05-30T10:00:00.000Z",
      },
      createdAt: "2026-05-30T10:00:00.000Z",
    };
    users.push(user);
  }
  return user;
}

// ---------------------------------------------------------------------------------------------
// Quotes state

type MockQuote = AdminQuote;
let quotes: MockQuote[] = [];
let quoteSeq = 100004;
let acceptKeys = new Map<string, { body: string; response: Placed }>();

const product = (slug: string) => mockProducts.find((p) => p.slug === slug)!;
const primaryImage = (p: ProductDetail) => (p.images.find((i) => i.variantOptionValue === null) ?? p.images[0])?.url ?? null;

function quoteItem(id: string, p: ProductDetail, quantity: number, opts: { variantIndex?: number; price?: number; notes?: string } = {}): AdminQuote["items"][number] {
  const v = opts.variantIndex !== undefined ? p.variants[opts.variantIndex] : undefined;
  return {
    id,
    productId: p.id,
    productName: p.name,
    productSlug: p.slug,
    image: primaryImage(p),
    variantId: v?.id ?? null,
    variantTitle: v?.title ?? null,
    sku: v?.sku ?? null,
    quantity,
    quotedUnitPrice: opts.price ?? null,
    lineTotal: opts.price != null ? opts.price * quantity : null,
    requestedNotes: opts.notes ?? null,
  };
}

function seedQuotes(): MockQuote[] {
  const base = {
    gstin: null,
    notes: null,
    orderId: null,
    orderNumber: null,
    quotedTotal: null,
    respondedAt: null,
    responseMessage: null,
    validUntil: null,
  };
  const quoted: MockQuote = {
    ...base,
    id: "qt_1",
    number: "KTQ-100001",
    status: "QUOTED",
    userId: "usr_customer",
    contactName: "Chris Customer",
    organization: "Customer Security Services",
    email: "customer@example.com",
    phone: "+919876543210",
    notes: "Delivery to our Mumbai office.",
    createdAt: days(-5),
    respondedAt: days(-3),
    validUntil: days(14),
    responseMessage: "Prices include GST. Dispatch within 7 working days of payment.",
    items: [
      quoteItem("qti_1a", product("og-polo-tshirt"), 50, { variantIndex: 1, price: 64900 }),
      quoteItem("qti_1b", product("tactical-cargo-shorts"), 20, { variantIndex: 0, price: 95000, notes: "Mixed sizes, list to follow" }),
    ],
  };
  quoted.quotedTotal = quoted.items.reduce((n, i) => n + (i.lineTotal ?? 0), 0);
  const requested: MockQuote = {
    ...base,
    id: "qt_2",
    number: "KTQ-100002",
    status: "REQUESTED",
    userId: null,
    contactName: "Vikram Rao",
    organization: "Vikram Security Services Pvt Ltd",
    email: "procurement@vikramsecurity.in",
    phone: "+919900112233",
    gstin: "29ABCDE1234F1Z5",
    notes: "Tender closes on the 30th; please quote your best price.",
    createdAt: days(-1),
    items: [
      quoteItem("qti_2a", product("combat-performance-tshirt"), 200, { notes: "Olive, sizes S–XXL" }),
      quoteItem("qti_2b", product("liberty-jungle-boot"), 40),
    ],
  };
  const requested2: MockQuote = {
    ...base,
    id: "qt_3",
    number: "KTQ-100003",
    status: "REQUESTED",
    userId: null,
    contactName: "Anita Desai",
    organization: "Desai Facility Management",
    email: "anita@desaifm.in",
    phone: "+919811100022",
    createdAt: days(-2),
    items: [quoteItem("qti_3a", product("rapid-20-tactical-backpack"), 25)],
  };
  const rejected: MockQuote = {
    ...base,
    id: "qt_4",
    number: "KTQ-100004",
    status: "REJECTED",
    userId: null,
    contactName: "Rohit Jain",
    organization: "Jain Traders",
    email: "rohit@jaintraders.in",
    phone: "+919822200033",
    createdAt: days(-20),
    respondedAt: days(-19),
    responseMessage: "Below our minimum order quantity.",
    items: [quoteItem("qti_4a", product("og-polo-tshirt"), 2)],
  };
  return [quoted, requested, requested2, rejected];
}

export function resetB2bOpsMockDb() {
  quotes = seedQuotes();
  quoteSeq = 100004;
  acceptKeys = new Map();
}

export const getB2bOpsMockDb = () => ({ quotes });

// The admin dashboard tile counts REQUESTED quotes live.
setPendingQuotesSource(() => quotes.filter((q) => q.status === "REQUESTED").length);

// ---------------------------------------------------------------------------------------------
// Helpers

function requireUser(): Me | Response {
  return getMockSessionUser() ?? err(401, "UNAUTHORIZED", "Not signed in");
}

function requireStaff(): Response | null {
  const user = getMockSessionUser();
  if (!user) return err(401, "UNAUTHORIZED", "Not signed in");
  if (user.role !== "STAFF" && user.role !== "ADMIN") return err(403, "FORBIDDEN", "Staff only");
  return null;
}

/** A user sees quotes created while signed in plus quotes sent with their verified email. */
const visibleTo = (q: MockQuote, user: Me) => q.userId === user.id || (user.emailVerified && q.email.toLowerCase() === user.email.toLowerCase());

/** QUOTED past its validity reads as EXPIRED (the server's expiry cron). */
function refreshExpiry(q: MockQuote) {
  if (q.status === "QUOTED" && q.validUntil && new Date(q.validUntil).getTime() < Date.now()) q.status = "EXPIRED";
  return q;
}

const toCustomer = (q: MockQuote): CustomerQuote => {
  const { id: _id, userId: _u, orderId: _o, ...rest } = q;
  void _id;
  void _u;
  void _o;
  return rest;
};

const paging = (url: URL) => ({
  page: Math.max(1, Number(url.searchParams.get("page") ?? 1) || 1),
  limit: Math.min(100, Math.max(1, Number(url.searchParams.get("limit") ?? 20) || 20)),
});

function statusParam(url: URL): QuoteStatus | undefined | Response {
  const s = url.searchParams.get("status");
  if (!s) return undefined;
  return QUOTE_STATUSES.includes(s as QuoteStatus) ? (s as QuoteStatus) : err(400, "VALIDATION_ERROR", "Invalid status");
}

function actor() {
  const u = getMockSessionUser();
  return u ? { id: u.id, name: u.name } : null;
}

function addEvent(order: MockOrder, type: string, message: string, internal = false) {
  order.events.push({ id: cuid("evt_"), type, message, internal, actor: actor(), createdAt: now() });
}

const activeShipment = (o: MockOrder) => o.shipments.find((s) => s.status !== "CANCELLED");

function toTracking(o: {
  number: string;
  status: Tracking["status"];
  createdAt: string;
  shipments: Tracking["shipments"];
  timeline: Tracking["timeline"];
}): Tracking {
  return {
    orderNumber: o.number,
    status: o.status,
    placedAt: o.createdAt,
    shipments: o.shipments.map((s) => ({
      id: s.id,
      carrier: s.carrier,
      awb: s.awb,
      status: s.status,
      trackingUrl: s.trackingUrl,
      shippedAt: s.shippedAt,
      deliveredAt: s.deliveredAt,
      events: s.events,
    })),
    timeline: o.timeline,
  };
}

// ---------------------------------------------------------------------------------------------
// Handlers

export const b2bOpsHandlers = [
  // Make sure the mock B2B buyer exists before any sign-in; then fall through to the real sign-in mocks.
  http.post(apiPath("/api/v1/auth/sign-in/email"), () => {
    ensureMockB2BUser();
    return undefined;
  }),

  // ---- B2B-3: tier prices for approved B2B viewers ----
  http.get(apiPath("/api/v1/products/:slug"), ({ params }) => {
    if (!isApprovedB2B()) return undefined;
    const p = mockProducts.find((x) => x.slug === params.slug);
    if (!p || p.saleChannel === "ENQUIRY_ONLY") return undefined;
    return HttpResponse.json<ProductDetail>({
      ...p,
      purchasable: p.purchasable || p.saleChannel === "B2B_ONLY",
      priceTiers: MOCK_PRICE_TIERS[p.slug] ?? [],
    });
  }),

  // ---- B2B-2: RFQ ----
  http.post(apiPath("/api/v1/quotes"), async ({ request }) => {
    const body = (await request.json()) as Partial<S["CreateQuoteDto"]>;
    if (body.website) {
      // Honeypot: pretend it worked.
      return HttpResponse.json<S["CreateQuoteResponseDto_Output"]>({ number: "KTQ-000000", status: "REQUESTED", createdAt: now() }, { status: 201 });
    }
    const email = body.email?.trim().toLowerCase() ?? "";
    if (!body.contactName?.trim() || !body.organization?.trim() || !email.includes("@") || !PHONE_RE.test(body.phone ?? "")) {
      return err(400, "VALIDATION_ERROR", "contactName, organization, email and a valid phone are required");
    }
    if (body.gstin && !GSTIN_RE.test(body.gstin)) return err(400, "VALIDATION_ERROR", "gstin is invalid");
    if (!body.items?.length || body.items.length > 50) return err(400, "VALIDATION_ERROR", "1–50 items required");
    const items: AdminQuote["items"] = [];
    for (const [n, i] of body.items.entries()) {
      if (!Number.isInteger(i.quantity) || i.quantity < 1) return err(400, "VALIDATION_ERROR", "quantity must be a positive integer");
      const p = mockProducts.find((x) => x.id === i.productId);
      if (!p) return err(404, "NOT_FOUND", `Product ${i.productId} not found`);
      const variantIndex = i.variantId ? p.variants.findIndex((v) => v.id === i.variantId) : undefined;
      if (variantIndex === -1) return err(404, "NOT_FOUND", `Variant ${i.variantId} not found`);
      items.push(quoteItem(cuid(`qti_${n}_`), p, i.quantity, { variantIndex, notes: i.notes }));
    }
    const user = getMockSessionUser();
    const quote: MockQuote = {
      id: cuid("qt_"),
      number: `KTQ-${++quoteSeq}`,
      status: "REQUESTED",
      userId: user?.id ?? null,
      contactName: body.contactName.trim(),
      organization: body.organization.trim(),
      email,
      phone: body.phone!,
      gstin: body.gstin ?? null,
      notes: body.notes?.trim() || null,
      items,
      quotedTotal: null,
      respondedAt: null,
      responseMessage: null,
      validUntil: null,
      orderId: null,
      orderNumber: null,
      createdAt: now(),
    };
    quotes.unshift(quote);
    return HttpResponse.json<S["CreateQuoteResponseDto_Output"]>({ number: quote.number, status: quote.status, createdAt: quote.createdAt }, { status: 201 });
  }),

  // ---- B2B-5: customer quotes ----
  http.get(apiPath("/api/v1/me/quotes"), ({ request }) => {
    const user = requireUser();
    if (user instanceof Response) return user;
    const url = new URL(request.url);
    const status = statusParam(url);
    if (status instanceof Response) return status;
    const { page, limit } = paging(url);
    const mine = quotes.map(refreshExpiry).filter((q) => visibleTo(q, user) && (!status || q.status === status));
    return HttpResponse.json<S["QuoteListDto_Output"]>({
      items: mine.slice((page - 1) * limit, page * limit).map((q) => ({
        number: q.number,
        status: q.status,
        organization: q.organization,
        itemCount: q.items.length,
        quotedTotal: q.quotedTotal,
        validUntil: q.validUntil,
        createdAt: q.createdAt,
      })),
      page,
      limit,
      total: mine.length,
    });
  }),

  http.get(apiPath("/api/v1/me/quotes/:number"), ({ params }) => {
    const user = requireUser();
    if (user instanceof Response) return user;
    const q = quotes.find((x) => x.number === String(params.number).toUpperCase());
    if (!q || !visibleTo(q, user)) return err(404, "NOT_FOUND", "Quote not found");
    return HttpResponse.json<CustomerQuote>(toCustomer(refreshExpiry(q)));
  }),

  http.post(apiPath("/api/v1/me/quotes/:number/accept"), async ({ request, params }) => {
    const user = requireUser();
    if (user instanceof Response) return user;
    const key = request.headers.get("Idempotency-Key");
    if (!key || !/^[A-Za-z0-9_-]{8,128}$/.test(key)) return err(400, "IDEMPOTENCY_KEY_REQUIRED", "Idempotency-Key header is required");
    const raw = await request.text();
    const prior = acceptKeys.get(key);
    if (prior) {
      if (prior.body !== raw) return err(409, "IDEMPOTENCY_KEY_REUSED", "Idempotency-Key was used with a different request");
      return HttpResponse.json<Placed>(prior.response, { status: 201 });
    }
    const q = quotes.find((x) => x.number === String(params.number).toUpperCase());
    if (!q || !visibleTo(q, user)) return err(404, "NOT_FOUND", "Quote not found");
    refreshExpiry(q);
    if (q.status !== "QUOTED") return err(409, "QUOTE_NOT_ACCEPTABLE", `Quote is ${q.status}`);
    const body = JSON.parse(raw) as S["AcceptQuoteDto"];
    const a = body.shippingAddress;
    if (!a?.name || !a.line1 || !a.city || !a.stateCode || !/^[1-9]\d{5}$/.test(a.pincode ?? "") || !PHONE_RE.test(a.phone ?? "")) {
      return err(400, "VALIDATION_ERROR", "shippingAddress is invalid");
    }
    if (body.paymentMethod !== "RAZORPAY" && body.paymentMethod !== "BANK_TRANSFER") return err(400, "VALIDATION_ERROR", "paymentMethod is invalid");
    if (body.paymentMethod === "BANK_TRANSFER" && !isApprovedB2B(user)) {
      return err(403, "PAYMENT_METHOD_NOT_ALLOWED", "Bank transfer needs an approved business account");
    }
    const placed = placeMockOrder({
      lines: q.items.map((i) => {
        const p = mockProducts.find((x) => x.id === i.productId);
        return {
          variantId: i.variantId,
          productName: i.productName,
          productSlug: i.productSlug,
          variantTitle: i.variantTitle ?? "Default",
          sku: i.sku ?? p?.variants[0]?.sku ?? "",
          image: i.image,
          unitPrice: i.quotedUnitPrice ?? 0,
          quantity: i.quantity,
        };
      }),
      email: user.email,
      phone: body.phone ?? q.phone,
      shippingAddress: a,
      billingAddress: body.billingAddress,
      gstin: body.gstin ?? q.gstin,
      businessName: body.businessName ?? (q.gstin ? q.organization : null),
      method: body.paymentMethod,
      userId: user.id,
      quoteNumber: q.number,
    });
    q.status = "CONVERTED";
    q.orderNumber = placed.orderNumber;
    q.orderId = `ord_${placed.orderNumber}`;
    acceptKeys.set(key, { body: raw, response: placed });
    return HttpResponse.json<Placed>(placed, { status: 201 });
  }),

  // ---- B2B-5: admin quotes ----
  http.get(apiPath("/api/v1/admin/quotes"), ({ request }) => {
    const denied = requireStaff();
    if (denied) return denied;
    const url = new URL(request.url);
    const status = statusParam(url);
    if (status instanceof Response) return status;
    const q = url.searchParams.get("q")?.trim().toLowerCase();
    const rows = quotes
      .map(refreshExpiry)
      .filter((x) => (!status || x.status === status) && (!q || [x.number, x.email, x.organization].some((f) => f.toLowerCase().includes(q))));
    const { page, limit } = paging(url);
    return HttpResponse.json<S["AdminQuoteListDto_Output"]>({
      items: rows.slice((page - 1) * limit, page * limit).map((x) => ({
        id: x.id,
        number: x.number,
        status: x.status,
        contactName: x.contactName,
        organization: x.organization,
        email: x.email,
        itemCount: x.items.length,
        quotedTotal: x.quotedTotal,
        validUntil: x.validUntil,
        createdAt: x.createdAt,
      })),
      page,
      limit,
      total: rows.length,
    });
  }),

  http.get(apiPath("/api/v1/admin/quotes/:id"), ({ params }) => {
    const denied = requireStaff();
    if (denied) return denied;
    const q = quotes.find((x) => x.id === params.id);
    if (!q) return err(404, "NOT_FOUND", "Quote not found");
    return HttpResponse.json<AdminQuote>(refreshExpiry(q));
  }),

  http.post(apiPath("/api/v1/admin/quotes/:id/respond"), async ({ request, params }) => {
    const denied = requireStaff();
    if (denied) return denied;
    const q = quotes.find((x) => x.id === params.id);
    if (!q) return err(404, "NOT_FOUND", "Quote not found");
    if (q.status !== "REQUESTED" && q.status !== "QUOTED") return err(409, "INVALID_STATUS", `Quote is ${q.status}`);
    const body = (await request.json()) as S["RespondQuoteDto"];
    if (!body.validUntil || Number.isNaN(Date.parse(body.validUntil))) return err(400, "VALIDATION_ERROR", "validUntil is required");
    if (new Date(body.validUntil).getTime() <= Date.now()) return err(400, "VALIDATION_ERROR", "validUntil must be in the future");
    for (const line of body.items ?? []) {
      if (!Number.isInteger(line.quotedUnitPrice) || line.quotedUnitPrice < 1) return err(400, "VALIDATION_ERROR", "quotedUnitPrice must be positive paise");
      if (!q.items.some((i) => i.id === line.itemId)) return err(400, "VALIDATION_ERROR", `Unknown item ${line.itemId}`);
    }
    if (q.items.some((i) => !body.items?.some((l) => l.itemId === i.id))) return err(422, "QUOTE_ITEMS_UNPRICED", "Every quote item must be priced");
    q.items = q.items.map((i) => {
      const line = body.items.find((l) => l.itemId === i.id)!;
      const p = mockProducts.find((x) => x.id === i.productId);
      const pinned = line.variantId ? p?.variants.find((v) => v.id === line.variantId) : undefined;
      return {
        ...i,
        ...(pinned && !i.variantId ? { variantId: pinned.id, variantTitle: pinned.title, sku: pinned.sku } : {}),
        quotedUnitPrice: line.quotedUnitPrice,
        lineTotal: line.quotedUnitPrice * i.quantity,
      };
    });
    q.quotedTotal = q.items.reduce((n, i) => n + (i.lineTotal ?? 0), 0);
    q.validUntil = body.validUntil;
    q.responseMessage = body.message?.trim() || null;
    q.respondedAt = now();
    q.status = "QUOTED";
    return HttpResponse.json<AdminQuote>(q);
  }),

  http.post(apiPath("/api/v1/admin/quotes/:id/reject"), async ({ request, params }) => {
    const denied = requireStaff();
    if (denied) return denied;
    const q = quotes.find((x) => x.id === params.id);
    if (!q) return err(404, "NOT_FOUND", "Quote not found");
    if (q.status !== "REQUESTED" && q.status !== "QUOTED") return err(409, "INVALID_STATUS", `Quote is ${q.status}`);
    const body = (await request.json()) as Partial<S["RejectQuoteDto"]>;
    if (!body.reason?.trim()) return err(400, "VALIDATION_ERROR", "reason is required");
    q.status = "REJECTED";
    q.responseMessage = body.reason.trim();
    q.respondedAt = now();
    return HttpResponse.json<AdminQuote>(q);
  }),

  // ---- OPS-4: shipping ----
  http.post(apiPath("/api/v1/admin/orders/:id/ship"), async ({ request, params }) => {
    const denied = requireStaff();
    if (denied) return denied;
    const order = getAdminCommerceDb().orders.find((o) => o.id === params.id);
    if (!order) return err(404, "NOT_FOUND", "Order not found");
    const body = (await request.json()) as Partial<S["ShipOrderDto"]>;
    if (!body.carrier?.trim()) return err(400, "VALIDATION_ERROR", "carrier is required");
    if (body.trackingUrl && !/^https?:\/\//.test(body.trackingUrl)) return err(400, "VALIDATION_ERROR", "trackingUrl must be a URL");
    if (order.status !== "PAID" && order.status !== "PROCESSING") return err(409, "INVALID_TRANSITION", "Order is not PAID/PROCESSING");
    const shippedAt = now();
    const existing = activeShipment(order);
    const shipment: Shipment = {
      id: existing?.id ?? cuid("shp_"),
      carrier: body.carrier.trim(),
      awb: body.awb?.trim() || null,
      status: "SHIPPED",
      trackingUrl: body.trackingUrl || null,
      labelUrl: existing?.labelUrl ?? null,
      manual: !existing,
      shiprocketOrderId: existing?.shiprocketOrderId ?? null,
      shiprocketShipmentId: existing?.shiprocketShipmentId ?? null,
      shippedAt,
      deliveredAt: null,
      events: [...(existing?.events ?? []), { at: shippedAt, status: "SHIPPED", description: `Handed to ${body.carrier.trim()}`, location: null }],
    };
    order.shipments = existing ? order.shipments.map((s) => (s === existing ? shipment : s)) : [...order.shipments, shipment];
    setMockAdminOrderStatus(order, "SHIPPED");
    addEvent(order, "SHIPPED", `Shipped via ${shipment.carrier}${shipment.awb ? ` (AWB ${shipment.awb})` : ""}${body.notifyCustomer === false ? "" : " · customer notified"}`);
    return HttpResponse.json<MockOrder>(order);
  }),

  http.post(apiPath("/api/v1/admin/orders/:id/shiprocket"), async ({ request, params }) => {
    const denied = requireStaff();
    if (denied) return denied;
    const order = getAdminCommerceDb().orders.find((o) => o.id === params.id);
    if (!order) return err(404, "NOT_FOUND", "Order not found");
    const body = (await request.json()) as Partial<S["CreateShiprocketShipmentDto"]>;
    for (const k of ["weightGrams", "lengthCm", "widthCm", "heightCm", "courierId"] as const) {
      const v = body[k];
      if (v !== undefined && (!Number.isInteger(v) || v < 1)) return err(400, "VALIDATION_ERROR", `${k} must be a positive integer`);
    }
    if (order.status !== "PAID" && order.status !== "PROCESSING") return err(409, "INVALID_TRANSITION", "Order is not PAID/PROCESSING");
    if (activeShipment(order)) return err(409, "SHIPMENT_EXISTS", "This order already has a shipment");
    if ((body.weightGrams ?? 0) > 50000) {
      return err(422, "SHIPROCKET_ERROR", "Shiprocket: weight exceeds the courier limit", { shiprocket: { message: "Weight should be less than 50 kg" } });
    }
    const at = now();
    const awb = `SR${Date.now().toString().slice(-9)}`;
    const schedule = body.schedulePickup ?? true;
    const shipment: Shipment = {
      id: cuid("shp_"),
      carrier: body.courierId ? `Courier #${body.courierId}` : "Delhivery",
      awb,
      status: "READY_TO_SHIP",
      trackingUrl: `https://shiprocket.co/tracking/${awb}`,
      labelUrl: `/__mock-labels/${awb}.pdf`,
      manual: false,
      shiprocketOrderId: `SR-${Date.now().toString().slice(-6)}`,
      shiprocketShipmentId: `SRS-${Date.now().toString().slice(-6)}`,
      shippedAt: null,
      deliveredAt: null,
      events: [
        { at, status: "AWB ASSIGNED", description: `AWB ${awb} generated`, location: null },
        ...(schedule ? [{ at, status: "PICKUP SCHEDULED", description: "Pickup requested", location: body.pickupLocation ?? "Primary warehouse" }] : []),
      ],
    };
    order.shipments = [...order.shipments, shipment];
    if (order.status === "PAID") setMockAdminOrderStatus(order, "PROCESSING");
    addEvent(order, "SHIPMENT_CREATED", `Shiprocket shipment created (AWB ${awb})${schedule ? ", pickup requested" : ""}`, true);
    return HttpResponse.json<Shipment>(shipment, { status: 201 });
  }),

  // ---- OPS-5: public tracking ----
  http.get(apiPath("/api/v1/orders/:number/tracking"), ({ request, params }) => {
    const email = new URL(request.url).searchParams.get("email")?.trim().toLowerCase();
    if (!email) return err(400, "VALIDATION_ERROR", "email is required");
    const number = String(params.number).toUpperCase();
    const storefront = getCommerceMockDb().orders.find((o) => o.number === number && o.email.toLowerCase() === email);
    if (storefront) return HttpResponse.json<Tracking>(toTracking({ ...storefront, timeline: storefront.timeline }));
    const admin = getAdminCommerceDb().orders.find((o) => o.number === number && o.email.toLowerCase() === email);
    if (admin) {
      return HttpResponse.json<Tracking>(
        toTracking({
          ...admin,
          timeline: admin.events.filter((e) => !e.internal).map((e) => ({ type: e.type, message: e.message, createdAt: e.createdAt })),
        }),
      );
    }
    return err(404, "NOT_FOUND", "No order with this number and email");
  }),
];

resetB2bOpsMockDb();
ensureMockB2BUser();
