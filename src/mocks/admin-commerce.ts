import { http, HttpResponse } from "msw";
import type { components } from "@/lib/api/schema";
import { getMockQueries, resetMockQueries, type MockQuery } from "./queries-store";

/**
 * MSW handlers for the Stage 3 admin routes: orders (+ actions, CSV export), inventory, coupons,
 * customers, B2B approvals, dashboard and the enquiries inbox (`/admin/queries`, plus the session-guarded
 * `GET /queries`, TD-20). Shapes follow src/lib/api/schema.d.ts exactly.
 *
 * Built by admin-handlers.ts with its session + catalog state injected (no circular import), and reset
 * from `resetAdminMockDb()`. Tests read state through `getAdminCommerceDb()`.
 */

type S = components["schemas"];
export type MockOrder = S["AdminOrderDetailDto_Output"];
type OrderStatus = MockOrder["status"];
type OrderItem = MockOrder["items"][number];
type Address = MockOrder["shippingAddress"];
type OrderListItem = S["AdminOrderListDto_Output"]["items"][number];
export type MockCoupon = S["CouponDto_Output"];
export type MockBusinessProfile = S["AdminBusinessProfileDto_Output"];
type CustomerListItem = S["AdminCustomerListDto_Output"]["items"][number];
type CustomerDetail = S["AdminCustomerDetailDto_Output"];
type Me = S["MeDto_Output"];
type Product = S["AdminProductDto_Output"];
type ErrorBody = S["ErrorResponseDto"];

export interface CommerceDeps {
  requireStaff: () => Response | null;
  currentUser: () => Me | null;
  products: () => Product[];
}

export interface MockCustomer {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  role: "CUSTOMER" | "B2B_CUSTOMER";
  emailVerified: boolean;
  createdAt: string;
  addresses: CustomerDetail["addresses"];
}

const apiPath = (path: string) => `*${path}`;
const err = (status: number, code: string, message: string): Response =>
  HttpResponse.json<ErrorBody>({ error: { code, message } }, { status });

let seq = 0;
const cuid = (prefix: string) => `${prefix}${Date.now().toString(36)}${(seq++).toString(36)}`;
const now = () => new Date().toISOString();
const daysAgo = (d: number, hour = 11) => {
  const t = new Date();
  t.setDate(t.getDate() - d);
  t.setHours(hour, 0, 0, 0);
  return t.toISOString();
};

export const ORDER_STATUSES: OrderStatus[] = [
  "PENDING_PAYMENT",
  "AWAITING_PAYMENT",
  "PAID",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "RETURN_REQUESTED",
  "RETURNED",
  "REFUNDED",
];

/** Mock order state machine. PAID is reached through payment (Razorpay / mark-paid), not /status. */
const TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING_PAYMENT: ["CANCELLED"],
  AWAITING_PAYMENT: ["CANCELLED"],
  PAID: ["PROCESSING", "CANCELLED"],
  PROCESSING: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["DELIVERED"],
  DELIVERED: ["RETURN_REQUESTED"],
  RETURN_REQUESTED: ["RETURNED", "DELIVERED"],
  RETURNED: ["REFUNDED"],
  CANCELLED: [],
  REFUNDED: [],
};
const PAID_STATUSES: OrderStatus[] = ["PAID", "PROCESSING", "SHIPPED", "DELIVERED", "RETURN_REQUESTED", "RETURNED"];

// ---------------------------------------------------------------------------------------------
// Seed data

const addr = (name: string, phone: string, city: string, state: string, stateCode: Address["stateCode"], pincode: string): Address => ({
  name,
  phone,
  line1: "12, Defence Colony",
  line2: null,
  city,
  state,
  stateCode,
  pincode,
  country: "IN",
});

const seedCustomers = (): MockCustomer[] => [
  {
    id: "usr_customer",
    email: "customer@example.com",
    name: "Chris Customer",
    phone: "9876543210",
    role: "CUSTOMER",
    emailVerified: true,
    createdAt: "2026-01-01T00:00:00.000Z",
    addresses: [{ id: "adr_chris", isDefault: true, ...addr("Chris Customer", "9876543210", "Pune", "Maharashtra", "27", "411001") }],
  },
  {
    id: "usr_meera",
    email: "meera@example.com",
    name: "Meera Iyer",
    phone: "9812345678",
    role: "CUSTOMER",
    emailVerified: true,
    createdAt: "2026-03-14T00:00:00.000Z",
    addresses: [],
  },
  {
    id: "usr_vikram",
    email: "procurement@vikramsecurity.in",
    name: "Vikram Rao",
    phone: "9900112233",
    role: "CUSTOMER",
    emailVerified: true,
    createdAt: "2026-09-30T00:00:00.000Z",
    addresses: [],
  },
  {
    id: "usr_ranbir",
    email: "orders@ranbirtraders.in",
    name: "Ranbir Singh",
    phone: null,
    role: "B2B_CUSTOMER",
    emailVerified: true,
    createdAt: "2026-05-02T00:00:00.000Z",
    addresses: [],
  },
];

const seedBusinessProfiles = (): MockBusinessProfile[] => [
  {
    id: "bp_vikram",
    legalName: "Vikram Security Services Pvt Ltd",
    gstin: "29ABCDE1234F1Z5",
    status: "PENDING",
    rejectionReason: null,
    reviewedAt: null,
    reviewedBy: null,
    createdAt: daysAgo(2),
    user: { id: "usr_vikram", email: "procurement@vikramsecurity.in", name: "Vikram Rao" },
  },
  {
    id: "bp_ranbir",
    legalName: "Ranbir Traders",
    gstin: "03AAACR5055K1Z8",
    status: "APPROVED",
    rejectionReason: null,
    reviewedAt: "2026-05-03T10:00:00.000Z",
    reviewedBy: { id: "usr_admin", name: "Asha Admin" },
    createdAt: "2026-05-02T00:00:00.000Z",
    user: { id: "usr_ranbir", email: "orders@ranbirtraders.in", name: "Ranbir Singh" },
  },
];

function item(id: string, name: string, sku: string, variantTitle: string, unitPrice: number, quantity: number, gstRate: number): OrderItem {
  const lineTotal = unitPrice * quantity;
  return {
    id,
    productName: name,
    productSlug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    sku,
    variantId: null,
    variantTitle,
    image: null,
    unitPrice,
    quantity,
    lineTotal,
    gstRate,
    hsnCode: gstRate === 12 ? "6109" : "6403",
    // GST-inclusive: tax = A·r/(100+r), half up.
    taxAmount: Math.round((lineTotal * gstRate) / (100 + gstRate)),
  };
}

function totalsFor(items: OrderItem[], shipping: number, discount: number, interState: boolean): MockOrder["totals"] {
  const subtotal = items.reduce((n, i) => n + i.lineTotal, 0);
  const taxTotal = items.reduce((n, i) => n + i.taxAmount, 0);
  const cgst = interState ? 0 : Math.ceil(taxTotal / 2);
  const sgst = interState ? 0 : taxTotal - cgst;
  return { subtotal, discount, shipping, taxTotal, cgst, sgst, igst: interState ? taxTotal : 0, total: subtotal - discount + shipping, currency: "INR" };
}

interface OrderSeed {
  id: string;
  number: string;
  status: OrderStatus;
  createdAt: string;
  customer: { userId: string | null; name: string; email: string; phone: string };
  address: Address;
  items: OrderItem[];
  paymentMethod: MockOrder["paymentMethod"];
  paid: boolean;
  gstin?: string;
  businessName?: string;
  couponCode?: string;
  discount?: number;
}

function mkOrder(seed: OrderSeed): MockOrder {
  const totals = totalsFor(seed.items, 0, seed.discount ?? 0, seed.address.stateCode !== "27");
  const payments: MockOrder["payments"] = [];
  if (seed.paymentMethod === "RAZORPAY") {
    payments.push({
      id: `pay_${seed.id}`,
      provider: "RAZORPAY",
      status: seed.paid ? "CAPTURED" : "CREATED",
      amount: totals.total,
      providerOrderId: `order_${seed.id}`,
      providerPaymentId: seed.paid ? `pay_rzp_${seed.id}` : null,
      reference: null,
      createdAt: seed.createdAt,
    });
  } else if (seed.paid) {
    payments.push({
      id: `pay_${seed.id}`,
      provider: "BANK_TRANSFER",
      status: "CAPTURED",
      amount: totals.total,
      providerOrderId: null,
      providerPaymentId: null,
      reference: "UTR000123",
      createdAt: seed.createdAt,
    });
  }
  const events: MockOrder["events"] = [
    { id: `evt_${seed.id}_1`, type: "ORDER_PLACED", message: "Order placed", internal: false, actor: null, createdAt: seed.createdAt },
  ];
  if (seed.paid) {
    events.push({ id: `evt_${seed.id}_2`, type: "PAYMENT_CAPTURED", message: "Payment received", internal: false, actor: null, createdAt: seed.createdAt });
  }
  return {
    id: seed.id,
    number: seed.number,
    userId: seed.customer.userId,
    status: seed.status,
    paymentMethod: seed.paymentMethod,
    paymentStatus: payments[payments.length - 1]?.status ?? null,
    email: seed.customer.email,
    phone: seed.customer.phone,
    shippingAddress: seed.address,
    billingAddress: seed.address,
    gstin: seed.gstin ?? null,
    businessName: seed.businessName ?? null,
    couponCode: seed.couponCode ?? null,
    quoteNumber: null,
    items: seed.items,
    totals,
    payments,
    refunds: [],
    events,
    shipments: [],
    invoice: seed.paid ? { number: `KTX/26-27/${seed.number.slice(-4)}`, issuedAt: seed.createdAt } : null,
    reservedUntil: seed.status === "PENDING_PAYMENT" ? new Date(Date.now() + 30 * 60_000).toISOString() : null,
    allowedTransitions: TRANSITIONS[seed.status],
    canCancel: ["PENDING_PAYMENT", "AWAITING_PAYMENT", "PAID"].includes(seed.status),
    canRequestReturn: seed.status === "DELIVERED",
    createdAt: seed.createdAt,
    updatedAt: seed.createdAt,
  };
}

const chris = { userId: "usr_customer", name: "Chris Customer", email: "customer@example.com", phone: "9876543210" };
const meera = { userId: "usr_meera", name: "Meera Iyer", email: "meera@example.com", phone: "9812345678" };
const ranbir = { userId: "usr_ranbir", name: "Ranbir Singh", email: "orders@ranbirtraders.in", phone: "9811122233" };
const guest = { userId: null, name: "Arjun Mehta", email: "arjun@example.com", phone: "9123456780" };

const seedOrders = (): MockOrder[] => [
  mkOrder({
    id: "ord_1006",
    number: "KTX-100006",
    status: "PAID",
    createdAt: daysAgo(0, 9),
    customer: chris,
    address: addr("Chris Customer", "9876543210", "Pune", "Maharashtra", "27", "411001"),
    items: [
      item("oi_1006_1", "Combat Performance T-Shirt", "KTX-CPT-1", "M / Olive Green", 129900, 2, 12),
      item("oi_1006_2", "Desert Assault Boot", "KTX-DAB-9", "UK 9", 459900, 1, 18),
    ],
    paymentMethod: "RAZORPAY",
    paid: true,
  }),
  mkOrder({
    id: "ord_1005",
    number: "KTX-100005",
    status: "AWAITING_PAYMENT",
    createdAt: daysAgo(1),
    customer: ranbir,
    address: addr("Ranbir Traders", "9811122233", "Ludhiana", "Punjab", "03", "141001"),
    items: [item("oi_1005_1", "Combat Performance T-Shirt", "KTX-CPT-2", "L / Black", 109900, 50, 12)],
    paymentMethod: "BANK_TRANSFER",
    paid: false,
    gstin: "03AAACR5055K1Z8",
    businessName: "Ranbir Traders",
  }),
  mkOrder({
    id: "ord_1004",
    number: "KTX-100004",
    status: "SHIPPED",
    createdAt: daysAgo(3),
    customer: meera,
    address: addr("Meera Iyer", "9812345678", "Bengaluru", "Karnataka", "29", "560001"),
    items: [item("oi_1004_1", "Combat Performance T-Shirt", "KTX-CPT-3", "M / Black", 129900, 1, 12)],
    paymentMethod: "RAZORPAY",
    paid: true,
    couponCode: "WELCOME10",
    discount: 12990,
  }),
  mkOrder({
    id: "ord_1003",
    number: "KTX-100003",
    status: "PENDING_PAYMENT",
    createdAt: daysAgo(0, 8),
    customer: guest,
    address: addr("Arjun Mehta", "9123456780", "New Delhi", "Delhi", "07", "110001"),
    items: [item("oi_1003_1", "Desert Assault Boot", "KTX-DAB-8", "UK 8", 459900, 1, 18)],
    paymentMethod: "RAZORPAY",
    paid: false,
  }),
  mkOrder({
    id: "ord_1002",
    number: "KTX-100002",
    status: "DELIVERED",
    createdAt: daysAgo(12),
    customer: chris,
    address: addr("Chris Customer", "9876543210", "Pune", "Maharashtra", "27", "411001"),
    items: [item("oi_1002_1", "Combat Performance T-Shirt", "KTX-CPT-4", "L / Olive Green", 129900, 3, 12)],
    paymentMethod: "RAZORPAY",
    paid: true,
  }),
  mkOrder({
    id: "ord_1001",
    number: "KTX-100001",
    status: "CANCELLED",
    createdAt: daysAgo(20),
    customer: meera,
    address: addr("Meera Iyer", "9812345678", "Bengaluru", "Karnataka", "29", "560001"),
    items: [item("oi_1001_1", "Desert Assault Boot", "KTX-DAB-7", "UK 7", 459900, 1, 18)],
    paymentMethod: "RAZORPAY",
    paid: false,
  }),
];

const seedCoupons = (): MockCoupon[] => [
  {
    id: "cpn_welcome",
    code: "WELCOME10",
    type: "PERCENT",
    value: 10,
    minSubtotal: 99900,
    maxDiscount: 50000,
    startsAt: "2026-01-01T00:00:00.000Z",
    endsAt: null,
    usageLimit: null,
    perUserLimit: 1,
    usedCount: 14,
    isActive: true,
    createdAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "cpn_flat",
    code: "FLAT500",
    type: "FLAT",
    value: 50000,
    minSubtotal: 299900,
    maxDiscount: null,
    startsAt: null,
    endsAt: "2026-12-31T18:29:59.000Z",
    usageLimit: 100,
    perUserLimit: null,
    usedCount: 0,
    isActive: true,
    createdAt: "2026-08-01T00:00:00.000Z",
  },
  {
    id: "cpn_ship",
    code: "FREESHIP",
    type: "FREE_SHIPPING",
    value: 0,
    minSubtotal: null,
    maxDiscount: null,
    startsAt: null,
    endsAt: null,
    usageLimit: null,
    perUserLimit: null,
    usedCount: 3,
    isActive: false,
    createdAt: "2026-06-01T00:00:00.000Z",
  },
];

const seedQueries = (): MockQuery[] => [
  {
    id: "qry_tender",
    name: "Maj. R. Sharma",
    organization: "Assam Rifles, 12 Bn",
    email: "procurement@assamrifles.example",
    requirements: "Tender enquiry: 400 pairs of desert assault boots, sizes 6-11, delivery by December.",
    status: "NEW",
    createdAt: daysAgo(0, 10),
  },
  {
    id: "qry_sizes",
    name: "Priya Nair",
    organization: null,
    email: "priya@example.com",
    requirements: "Do the combat t-shirts run true to size? I usually wear M.",
    status: "IN_PROGRESS",
    createdAt: daysAgo(2),
  },
  {
    id: "qry_bulk",
    name: "Karan Patel",
    organization: "Patel Security Agency",
    email: "karan@patelsecurity.example",
    requirements: "Need 120 olive t-shirts with our logo. Can you quote?",
    status: "RESOLVED",
    createdAt: daysAgo(9),
  },
];

// ---------------------------------------------------------------------------------------------
// State

let orders: MockOrder[] = seedOrders();
let coupons: MockCoupon[] = seedCoupons();
let customers: MockCustomer[] = seedCustomers();
let businessProfiles: MockBusinessProfile[] = seedBusinessProfiles();
// Seed the inbox for the dev browser; vitest starts empty (the contact form tests read getMockQueries()[0]).
if (import.meta.env.MODE !== "test") resetMockQueries(seedQueries());

/** Resets commerce state. `resetAdminMockDb()` calls this (and seeds the enquiries inbox). */
export function resetAdminCommerceDb() {
  orders = seedOrders();
  coupons = seedCoupons();
  customers = seedCustomers();
  businessProfiles = seedBusinessProfiles();
  resetMockQueries(seedQueries());
}

export const getAdminCommerceDb = () => ({ orders, coupons, customers, businessProfiles, queries: getMockQueries() });

// ---------------------------------------------------------------------------------------------
// Helpers

const paging = (url: URL) => ({
  page: Math.max(1, Number(url.searchParams.get("page") ?? 1) || 1),
  limit: Math.min(100, Math.max(1, Number(url.searchParams.get("limit") ?? 20) || 20)),
});
function paginate<T>(rows: T[], url: URL) {
  const { page, limit } = paging(url);
  return { items: rows.slice((page - 1) * limit, page * limit), page, limit, total: rows.length };
}

function actorOf(deps: CommerceDeps) {
  const u = deps.currentUser();
  return u ? { id: u.id, name: u.name } : null;
}

function addEvent(order: MockOrder, deps: CommerceDeps, type: string, message: string, internal = false) {
  order.events.push({ id: cuid("evt_"), type, message, internal, actor: actorOf(deps), createdAt: now() });
}

function setStatus(order: MockOrder, status: OrderStatus) {
  order.status = status;
  order.allowedTransitions = TRANSITIONS[status];
  order.canCancel = ["PENDING_PAYMENT", "AWAITING_PAYMENT", "PAID"].includes(status);
  order.canRequestReturn = status === "DELIVERED";
  order.reservedUntil = status === "PENDING_PAYMENT" ? order.reservedUntil : null;
  order.updatedAt = now();
}

const captured = (o: MockOrder) => o.payments.filter((p) => p.status === "CAPTURED" || p.status === "REFUNDED").reduce((n, p) => n + p.amount, 0);
const refunded = (o: MockOrder) => o.refunds.filter((r) => r.status !== "FAILED").reduce((n, r) => n + r.amount, 0);

const rupees = (paise: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(paise / 100);

function toListItem(o: MockOrder): OrderListItem {
  return {
    id: o.id,
    number: o.number,
    status: o.status,
    paymentMethod: o.paymentMethod,
    paymentStatus: o.paymentStatus,
    customerName: o.shippingAddress.name,
    email: o.email,
    phone: o.phone,
    isGuest: o.userId === null,
    isB2B: o.gstin !== null,
    itemCount: o.items.reduce((n, i) => n + i.quantity, 0),
    total: o.totals.total,
    createdAt: o.createdAt,
  };
}

function filterOrders(url: URL): MockOrder[] | Response {
  const sp = url.searchParams;
  const status = sp.get("status");
  const paymentMethod = sp.get("paymentMethod");
  const q = sp.get("q")?.trim().toLowerCase();
  const from = sp.get("from");
  const to = sp.get("to");
  for (const d of [from, to]) if (d && Number.isNaN(Date.parse(d))) return err(400, "VALIDATION_ERROR", "from/to must be ISO dates");
  if (status && !ORDER_STATUSES.includes(status as OrderStatus)) return err(400, "VALIDATION_ERROR", "Invalid status");
  const sort = sp.get("sort") ?? "newest";
  return orders
    .filter((o) => !status || o.status === status)
    .filter((o) => !paymentMethod || o.paymentMethod === paymentMethod)
    .filter((o) => !from || o.createdAt >= new Date(from).toISOString())
    .filter((o) => !to || o.createdAt < new Date(to).toISOString())
    .filter(
      (o) =>
        !q ||
        o.number.toLowerCase().includes(q) ||
        o.email.toLowerCase().includes(q) ||
        o.phone.includes(q) ||
        o.shippingAddress.name.toLowerCase().includes(q),
    )
    .sort((a, b) =>
      sort === "oldest"
        ? a.createdAt.localeCompare(b.createdAt)
        : sort === "total_desc"
          ? b.totals.total - a.totals.total
          : b.createdAt.localeCompare(a.createdAt),
    );
}

const csvCell = (v: string | number | null) => {
  const s = v == null ? "" : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

function customerStats(id: string) {
  const own = orders.filter((o) => o.userId === id);
  return {
    orderCount: own.length,
    totalSpent: own.filter((o) => PAID_STATUSES.includes(o.status)).reduce((n, o) => n + o.totals.total, 0),
  };
}

function toCustomerListItem(c: MockCustomer): CustomerListItem {
  return {
    id: c.id,
    email: c.email,
    name: c.name,
    phone: c.phone,
    role: c.role,
    emailVerified: c.emailVerified,
    businessStatus: businessProfiles.find((b) => b.user.id === c.id)?.status ?? null,
    createdAt: c.createdAt,
    ...customerStats(c.id),
  };
}

function inventoryRows(deps: CommerceDeps, threshold: number) {
  return deps.products().flatMap((p) =>
    p.variants.map((v) => ({
      variantId: v.id,
      productId: p.id,
      productName: p.name,
      sku: v.sku,
      title: v.title,
      stock: v.stock,
      reserved: v.reserved,
      available: v.available,
      isActive: v.isActive,
      lowStock: v.available <= threshold,
    })),
  );
}

const COUPON_CODE = /^[A-Z0-9_-]{3,32}$/;

function validateCoupon(c: Omit<MockCoupon, "id" | "usedCount" | "createdAt">): Response | null {
  if (!COUPON_CODE.test(c.code)) return err(400, "VALIDATION_ERROR", "code must match [A-Z0-9_-]{3,32}");
  if (!Number.isInteger(c.value)) return err(400, "VALIDATION_ERROR", "value must be an integer");
  if (c.type === "PERCENT" && (c.value < 1 || c.value > 100)) return err(400, "VALIDATION_ERROR", "PERCENT value must be 1-100");
  if (c.type === "FLAT" && c.value < 1) return err(400, "VALIDATION_ERROR", "FLAT value must be positive paise");
  if (c.type === "FREE_SHIPPING" && c.value !== 0) return err(400, "VALIDATION_ERROR", "FREE_SHIPPING value must be 0");
  if (c.startsAt && c.endsAt && c.endsAt <= c.startsAt) return err(400, "VALIDATION_ERROR", "endsAt must be after startsAt");
  return null;
}

// ---------------------------------------------------------------------------------------------
// Handlers

export function createAdminCommerceHandlers(deps: CommerceDeps) {
  const guard = deps.requireStaff;
  const findOrder = (id: unknown) => orders.find((o) => o.id === id);

  /** Wraps an order action: auth, lookup, then the action (which returns an error or mutates the order). */
  const orderAction = <B>(path: string, run: (order: MockOrder, body: B) => Response | void) =>
    http.post(apiPath(`/api/v1/admin/orders/:id/${path}`), async ({ request, params }) => {
      const denied = guard();
      if (denied) return denied;
      const order = findOrder(params.id);
      if (!order) return err(404, "NOT_FOUND", "Order not found");
      const body = (await request.json()) as B;
      const result = run(order, body);
      if (result) return result;
      order.updatedAt = now();
      return HttpResponse.json<MockOrder>(order);
    });

  return [
    // ---- Orders ----
    http.get(apiPath("/api/v1/admin/orders"), ({ request }) => {
      const denied = guard();
      if (denied) return denied;
      const url = new URL(request.url);
      const rows = filterOrders(url);
      if (rows instanceof Response) return rows;
      const page = paginate(rows, url);
      return HttpResponse.json<S["AdminOrderListDto_Output"]>({ ...page, items: page.items.map(toListItem) });
    }),

    http.get(apiPath("/api/v1/admin/orders/export.csv"), ({ request }) => {
      const denied = guard();
      if (denied) return denied;
      const rows = filterOrders(new URL(request.url));
      if (rows instanceof Response) return rows;
      const header = ["order_number", "created_at", "status", "payment_method", "payment_status", "customer", "email", "phone", "gstin", "sku", "product", "variant", "quantity", "unit_price", "line_total", "gst_rate", "tax_amount", "order_total"];
      const lines = rows.flatMap((o) =>
        o.items.map((i) =>
          [o.number, o.createdAt, o.status, o.paymentMethod, o.paymentStatus, o.shippingAddress.name, o.email, o.phone, o.gstin, i.sku, i.productName, i.variantTitle, i.quantity, (i.unitPrice / 100).toFixed(2), (i.lineTotal / 100).toFixed(2), i.gstRate, (i.taxAmount / 100).toFixed(2), (o.totals.total / 100).toFixed(2)]
            .map(csvCell)
            .join(","),
        ),
      );
      return new HttpResponse([header.join(","), ...lines].join("\n") + "\n", {
        headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": 'attachment; filename="orders.csv"' },
      });
    }),

    http.get(apiPath("/api/v1/admin/orders/:id"), ({ params }) => {
      const denied = guard();
      if (denied) return denied;
      const order = findOrder(params.id);
      if (!order) return err(404, "NOT_FOUND", "Order not found");
      return HttpResponse.json<MockOrder>(order);
    }),

    orderAction<S["UpdateOrderStatusDto"]>("status", (order, body) => {
      if (!ORDER_STATUSES.includes(body.status)) return err(400, "VALIDATION_ERROR", "Invalid status");
      if (!order.allowedTransitions.includes(body.status)) {
        return err(409, "INVALID_TRANSITION", `Cannot move an order from ${order.status} to ${body.status}`);
      }
      setStatus(order, body.status);
      addEvent(order, deps, "STATUS_CHANGED", `Status changed to ${body.status}${body.note ? `: ${body.note}` : ""}`);
    }),

    orderAction<S["MarkOrderPaidDto"]>("mark-paid", (order, body) => {
      if (!body.reference?.trim()) return err(400, "VALIDATION_ERROR", "reference is required");
      if (order.status !== "AWAITING_PAYMENT") return err(409, "INVALID_TRANSITION", "Order is not awaiting payment");
      const amount = body.amount ?? order.totals.total;
      order.payments.push({
        id: cuid("pay_"),
        provider: "BANK_TRANSFER",
        status: "CAPTURED",
        amount,
        providerOrderId: null,
        providerPaymentId: null,
        reference: body.reference.trim(),
        createdAt: body.paidAt ?? now(),
      });
      order.paymentStatus = "CAPTURED";
      setStatus(order, "PAID");
      addEvent(order, deps, "PAYMENT_CAPTURED", `Marked paid (${rupees(amount)}, ref ${body.reference.trim()})`);
      if (body.note) addEvent(order, deps, "NOTE", body.note, true);
    }),

    orderAction<S["RefundOrderDto"]>("refund", (order, body) => {
      if (!Number.isInteger(body.amount) || body.amount < 1) return err(400, "VALIDATION_ERROR", "amount must be positive paise");
      if (!body.reason?.trim()) return err(400, "VALIDATION_ERROR", "reason is required");
      const payment = order.payments.find((p) => p.status === "CAPTURED");
      if (!payment) return err(409, "NOT_REFUNDABLE", "This order has no captured payment");
      const refundable = captured(order) - refunded(order);
      if (body.amount > refundable) return err(409, "REFUND_EXCEEDS_CAPTURED", `At most ${rupees(refundable)} can be refunded`);
      order.refunds.push({
        id: cuid("rfd_"),
        paymentId: payment.id,
        amount: body.amount,
        reason: body.reason.trim(),
        status: "PENDING",
        providerRefundId: null,
        createdAt: now(),
      });
      const restocked = (body.restockItems ?? []).filter((r) => r.quantity > 0);
      addEvent(
        order,
        deps,
        "REFUND_INITIATED",
        `Refund of ${rupees(body.amount)} initiated: ${body.reason.trim()}${restocked.length ? ` (restocked ${restocked.reduce((n, r) => n + r.quantity, 0)} units)` : ""}`,
        true,
      );
    }),

    orderAction<S["AdminCancelOrderDto"]>("cancel", (order, body) => {
      if (!body.reason?.trim()) return err(400, "VALIDATION_ERROR", "reason is required");
      if (!order.allowedTransitions.includes("CANCELLED")) return err(409, "INVALID_TRANSITION", "This order can no longer be cancelled");
      const payment = order.payments.find((p) => p.status === "CAPTURED");
      if ((body.refund ?? true) && payment) {
        const amount = captured(order) - refunded(order);
        if (amount > 0) {
          order.refunds.push({ id: cuid("rfd_"), paymentId: payment.id, amount, reason: body.reason, status: "PENDING", providerRefundId: null, createdAt: now() });
        }
      }
      setStatus(order, "CANCELLED");
      addEvent(order, deps, "CANCELLED", `Cancelled by staff: ${body.reason.trim()}`);
    }),

    orderAction<S["AddOrderNoteDto"]>("note", (order, body) => {
      if (!body.message?.trim()) return err(400, "VALIDATION_ERROR", "message is required");
      addEvent(order, deps, "NOTE", body.message.trim(), body.internal ?? true);
    }),

    // ---- Inventory ----
    http.get(apiPath("/api/v1/admin/inventory"), ({ request }) => {
      const denied = guard();
      if (denied) return denied;
      const url = new URL(request.url);
      const threshold = Number(url.searchParams.get("threshold") ?? 5);
      if (!Number.isInteger(threshold) || threshold < 0) return err(400, "VALIDATION_ERROR", "threshold must be a non-negative integer");
      const q = url.searchParams.get("q")?.trim().toLowerCase();
      const lowOnly = url.searchParams.get("lowStock") === "true";
      const productId = url.searchParams.get("productId");
      const rows = inventoryRows(deps, threshold)
        .filter((r) => !q || r.sku.toLowerCase().includes(q) || r.productName.toLowerCase().includes(q))
        .filter((r) => !lowOnly || r.lowStock)
        .filter((r) => !productId || r.productId === productId)
        .sort((a, b) => a.available - b.available || a.sku.localeCompare(b.sku));
      return HttpResponse.json<S["InventoryListDto_Output"]>(paginate(rows, url));
    }),

    // ---- Coupons ----
    http.get(apiPath("/api/v1/admin/coupons"), ({ request }) => {
      const denied = guard();
      if (denied) return denied;
      const url = new URL(request.url);
      const q = url.searchParams.get("q")?.trim().toUpperCase();
      const isActive = url.searchParams.get("isActive");
      const rows = coupons
        .filter((c) => !q || c.code.includes(q))
        .filter((c) => isActive == null || String(c.isActive) === isActive)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      return HttpResponse.json<S["CouponListDto_Output"]>(paginate(rows, url));
    }),

    http.post(apiPath("/api/v1/admin/coupons"), async ({ request }) => {
      const denied = guard();
      if (denied) return denied;
      const body = (await request.json()) as S["CreateCouponDto"];
      const coupon: MockCoupon = {
        id: cuid("cpn_"),
        code: String(body.code ?? "").toUpperCase(),
        type: body.type,
        value: body.value,
        minSubtotal: body.minSubtotal ?? null,
        maxDiscount: body.maxDiscount ?? null,
        startsAt: body.startsAt ?? null,
        endsAt: body.endsAt ?? null,
        usageLimit: body.usageLimit ?? null,
        perUserLimit: body.perUserLimit ?? null,
        isActive: body.isActive ?? true,
        usedCount: 0,
        createdAt: now(),
      };
      const invalid = validateCoupon(coupon);
      if (invalid) return invalid;
      if (coupons.some((c) => c.code === coupon.code)) return err(409, "CODE_TAKEN", `Code ${coupon.code} is already used`);
      coupons.push(coupon);
      return HttpResponse.json<MockCoupon>(coupon, { status: 201 });
    }),

    http.get(apiPath("/api/v1/admin/coupons/:id"), ({ params }) => {
      const denied = guard();
      if (denied) return denied;
      const coupon = coupons.find((c) => c.id === params.id);
      if (!coupon) return err(404, "NOT_FOUND", "Coupon not found");
      return HttpResponse.json<MockCoupon>(coupon);
    }),

    http.patch(apiPath("/api/v1/admin/coupons/:id"), async ({ request, params }) => {
      const denied = guard();
      if (denied) return denied;
      const coupon = coupons.find((c) => c.id === params.id);
      if (!coupon) return err(404, "NOT_FOUND", "Coupon not found");
      const body = (await request.json()) as S["UpdateCouponDto"];
      const next = { ...coupon, ...body, code: (body.code ?? coupon.code).toUpperCase() };
      const invalid = validateCoupon(next);
      if (invalid) return invalid;
      if (coupons.some((c) => c.code === next.code && c.id !== coupon.id)) return err(409, "CODE_TAKEN", `Code ${next.code} is already used`);
      Object.assign(coupon, next);
      return HttpResponse.json<MockCoupon>(coupon);
    }),

    http.delete(apiPath("/api/v1/admin/coupons/:id"), ({ params }) => {
      const denied = guard();
      if (denied) return denied;
      const coupon = coupons.find((c) => c.id === params.id);
      if (!coupon) return err(404, "NOT_FOUND", "Coupon not found");
      if (coupon.usedCount > 0) coupon.isActive = false;
      else coupons = coupons.filter((c) => c.id !== coupon.id);
      return new HttpResponse(null, { status: 204 });
    }),

    // ---- Customers ----
    http.get(apiPath("/api/v1/admin/customers"), ({ request }) => {
      const denied = guard();
      if (denied) return denied;
      const url = new URL(request.url);
      const q = url.searchParams.get("q")?.trim().toLowerCase();
      const role = url.searchParams.get("role");
      const businessStatus = url.searchParams.get("businessStatus");
      const rows = customers
        .map(toCustomerListItem)
        .filter((c) => !q || c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q) || (c.phone ?? "").includes(q))
        .filter((c) => !role || c.role === role)
        .filter((c) => !businessStatus || c.businessStatus === businessStatus)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      return HttpResponse.json<S["AdminCustomerListDto_Output"]>(paginate(rows, url));
    }),

    http.get(apiPath("/api/v1/admin/customers/:id"), ({ params }) => {
      const denied = guard();
      if (denied) return denied;
      const c = customers.find((x) => x.id === params.id);
      if (!c) return err(404, "NOT_FOUND", "Customer not found");
      const bp = businessProfiles.find((b) => b.user.id === c.id);
      return HttpResponse.json<CustomerDetail>({
        ...toCustomerListItem(c),
        addresses: c.addresses,
        businessProfile: bp
          ? { id: bp.id, legalName: bp.legalName, gstin: bp.gstin, status: bp.status, rejectionReason: bp.rejectionReason, reviewedAt: bp.reviewedAt, createdAt: bp.createdAt }
          : null,
        recentOrders: orders
          .filter((o) => o.userId === c.id)
          .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
          .slice(0, 10)
          .map((o) => ({ id: o.id, number: o.number, status: o.status, total: o.totals.total, createdAt: o.createdAt })),
      });
    }),

    // ---- B2B approvals ----
    http.get(apiPath("/api/v1/admin/business-profiles"), ({ request }) => {
      const denied = guard();
      if (denied) return denied;
      const url = new URL(request.url);
      const status = url.searchParams.get("status");
      const q = url.searchParams.get("q")?.trim().toLowerCase();
      const rows = businessProfiles
        .filter((b) => !status || b.status === status)
        .filter((b) => !q || b.legalName.toLowerCase().includes(q) || b.gstin.toLowerCase().includes(q) || b.user.email.toLowerCase().includes(q))
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
      return HttpResponse.json<S["AdminBusinessProfileListDto_Output"]>(paginate(rows, url));
    }),

    http.post(apiPath("/api/v1/admin/business-profiles/:id/approve"), ({ params }) => {
      const denied = guard();
      if (denied) return denied;
      const bp = businessProfiles.find((b) => b.id === params.id);
      if (!bp) return err(404, "NOT_FOUND", "Business profile not found");
      if (bp.status !== "PENDING") return err(409, "INVALID_STATUS", "Only pending applications can be approved");
      Object.assign(bp, { status: "APPROVED", reviewedAt: now(), reviewedBy: actorOf(deps), rejectionReason: null });
      const customer = customers.find((c) => c.id === bp.user.id);
      if (customer) customer.role = "B2B_CUSTOMER";
      return HttpResponse.json<MockBusinessProfile>(bp);
    }),

    http.post(apiPath("/api/v1/admin/business-profiles/:id/reject"), async ({ request, params }) => {
      const denied = guard();
      if (denied) return denied;
      const bp = businessProfiles.find((b) => b.id === params.id);
      if (!bp) return err(404, "NOT_FOUND", "Business profile not found");
      const body = (await request.json()) as S["RejectBusinessProfileDto"];
      if (!body.reason?.trim()) return err(400, "VALIDATION_ERROR", "reason is required");
      if (bp.status !== "PENDING") return err(409, "INVALID_STATUS", "Only pending applications can be rejected");
      Object.assign(bp, { status: "REJECTED", reviewedAt: now(), reviewedBy: actorOf(deps), rejectionReason: body.reason.trim() });
      return HttpResponse.json<MockBusinessProfile>(bp);
    }),

    // ---- Dashboard ----
    http.get(apiPath("/api/v1/admin/dashboard"), () => {
      const denied = guard();
      if (denied) return denied;
      const midnight = new Date();
      midnight.setHours(0, 0, 0, 0);
      const today = midnight.toISOString();
      const weekAgo = new Date(Date.now() - 7 * 86400_000).toISOString();
      const paid = orders.filter((o) => PAID_STATUSES.includes(o.status));
      const sum = (rows: MockOrder[]) => rows.reduce((n, o) => n + o.totals.total, 0);
      return HttpResponse.json<S["DashboardDto_Output"]>({
        revenue: { today: sum(paid.filter((o) => o.createdAt >= today)), last7Days: sum(paid.filter((o) => o.createdAt >= weekAgo)) },
        orders: {
          today: orders.filter((o) => o.createdAt >= today).length,
          last7Days: orders.filter((o) => o.createdAt >= weekAgo).length,
          byStatus: ORDER_STATUSES.map((status) => ({ status, count: orders.filter((o) => o.status === status).length })),
        },
        lowStock: inventoryRows(deps, 5)
          .filter((r) => r.isActive && r.lowStock)
          .sort((a, b) => a.available - b.available)
          .slice(0, 20)
          .map(({ variantId, productId, productName, sku, title, available }) => ({ variantId, productId, productName, sku, title, available })),
        pendingQuotes: 2,
        newEnquiries: getMockQueries().filter((q) => q.status === "NEW").length,
        pendingBusinessProfiles: businessProfiles.filter((b) => b.status === "PENDING").length,
        awaitingPaymentOrders: orders.filter((o) => o.status === "AWAITING_PAYMENT").length,
        generatedAt: now(),
      });
    }),

    // ---- Enquiries inbox (session, STAFF/ADMIN). GET /queries is the legacy alias (TD-20). ----
    ...["/api/v1/admin/queries", "/api/v1/queries"].map((path) =>
      http.get(apiPath(path), () => {
        const denied = guard();
        if (denied) return denied;
        return HttpResponse.json<MockQuery[]>([...getMockQueries()].sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
      }),
    ),

    http.patch(apiPath("/api/v1/admin/queries/:id"), async ({ request, params }) => {
      const denied = guard();
      if (denied) return denied;
      const query = getMockQueries().find((q) => q.id === params.id);
      if (!query) return err(404, "NOT_FOUND", "Query not found");
      const body = (await request.json()) as S["UpdateQueryStatusDto"];
      if (!["NEW", "IN_PROGRESS", "RESOLVED"].includes(body.status)) return err(400, "VALIDATION_ERROR", "Invalid status");
      query.status = body.status;
      return HttpResponse.json<MockQuery>(query);
    }),
  ];
}
