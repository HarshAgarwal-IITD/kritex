# Architecture

> The API contract (section 4) is the handshake between frontend and backend agents. Change it here
> **before** changing code. The backend's zod DTOs then implement it, `openapi.json` is regenerated,
> and the website regenerates its types (ADR-013).

## 1. System overview

```
 Browser ──► Storefront + /admin (Vite SPA, repo: kritex)  kritex.in  [Cloudflare Pages/Vercel]
    │                    │  fetch (cookies, credentials: include)
    │                    ▼
    │          API  (NestJS, repo: kritex-server)  api.kritex.in  [Railway/Render, ap-south-1]
    │            ├── Postgres (Prisma)                      managed, daily backups
    │            ├── Cloudflare R2                          product images, invoices (PDF)
    │            ├── Razorpay  ◄── webhooks: payment.*, refund.*
    │            ├── Shiprocket ◄── webhooks: tracking updates
    │            ├── Resend (email)
    │            └── Sentry
    └──► Razorpay Checkout.js (payment modal, loaded client-side)
```

## 2. Repository layout (target): two repos (ADR-013)

```
projects/kritex/
├── kritex-website/        repo: kritex (frontend + planning hub)
│   ├── src/
│   │   ├── admin/              Admin app (lazy-loaded at /admin)       [WS-WEB-ADMIN]
│   │   ├── features/
│   │   │   ├── catalog/        listing, filters, PDP hooks
│   │   │   ├── cart/           cart drawer, hooks
│   │   │   ├── checkout/       checkout steps, Razorpay loader
│   │   │   ├── account/        login, signup, orders, addresses
│   │   │   └── quote/          B2B RFQ cart
│   │   ├── pages/legal/        terms, privacy, refund, shipping
│   │   ├── lib/api/            schema.d.ts (GENERATED from openapi.json), client.ts (openapi-fetch), hooks
│   │   └── mocks/              MSW handlers for building UI before the API is implemented
│   ├── e2e/                    Playwright (boots ../kritex-server for full-stack runs)
│   └── docs/ecommerce/         ← planning hub for BOTH repos
│
└── kritex-server/         repo: kritex-server (NestJS, ADR-012)
    ├── openapi.json            GENERATED + committed: the contract artifact the website consumes
    ├── docker-compose.yml      Postgres (dev :5433, test :5434)
    ├── prisma/
    │   ├── schema.prisma, migrations/
    │   └── seed/               seed.ts + data/catalog.json (one-time export of website src/data/*.ts) + pricing CSV importer
    ├── src/
    │   ├── main.ts             bootstrap: rawBody, helmet, CORS (credentials), prefix /api/v1, swagger
    │   ├── app.module.ts       registers all modules (only shared file; one line per module)
    │   ├── common/             AuthGuard, @Public/@Roles/@CurrentUser, AppException + filter,
    │   │                       ZodValidationPipe, idempotency interceptor, money utils
    │   ├── config/             @nestjs/config + zod env schema
    │   ├── prisma/             PrismaModule (global) + PrismaService
    │   ├── catalog/            catalog.module.ts, catalog.controller.ts, catalog.service.ts,
    │   │                       admin/ (admin controllers), dto/ (zod schemas → createZodDto), *.spec.ts
    │   └── auth/ customers/ cart/ tax/ coupons/ checkout/ orders/ payments/
    │       shipping/ notifications/ invoices/ quotes/ queries/ dashboard/   (same shape)
    ├── test/                   Jest e2e (supertest) against the test DB
    └── CLAUDE.md               conventions + link to ../kritex-website/docs/ecommerce
```

**Local dev:** run `docker compose up -d && npm run start:dev` in `kritex-server` (:4000) and `npm run dev` in
`kritex-website` (:8080). Vite proxies `/api` to `:4000`, so cookies are same-origin in dev.
**Production:** `kritex.in` and `api.kritex.in` are same-site, so the session cookie uses `Domain=.kritex.in; SameSite=Lax; Secure`.

## 3. Data model (Prisma sketch)

Money is stored as **integer paise** (`Int`), never floats.

```prisma
// ---------- Catalog ----------
model Category      { id, slug @unique, name, description, image, sortOrder, isActive, products Product[] }
model Product {
  id, slug @unique, name, description, subCategory   // e.g. "T-Shirts"
  categoryId
  saleChannel   SaleChannel  @default(ENQUIRY_ONLY)  // RETAIL | B2B_ONLY | ENQUIRY_ONLY
  status        ProductStatus @default(DRAFT)        // DRAFT | ACTIVE | ARCHIVED
  basePrice     Int?          // paise, GST-inclusive
  compareAtPrice Int?
  hsnCode       String?
  gstRate       Decimal?      // or derived by tax module from price slab
  specs         Json          // [{label, value}] (existing shape)
  weightGrams   Int?  lengthCm/widthCm/heightCm Int?
  seoTitle, seoDescription
  images        ProductImage[]
  options       ProductOption[]   // "Size", "Colour"
  variants      Variant[]
  specSheets    SpecSheet[]
  priceTiers    PriceTier[]       // B2B: minQty → unitPrice
  createdAt, updatedAt
}
model ProductImage  { id, productId, url, alt, sortOrder, variantOptionValue String? } // colour-linked images
model ProductOption { id, productId, name, values String[] , swatches Json? }
model Variant {
  id, productId, sku @unique, title          // "M / Olive Green"
  options    Json                            // {"Size":"M","Colour":"Olive Green"}
  price      Int?                            // overrides basePrice
  stock      Int @default(0)
  reserved   Int @default(0)
  isActive   Boolean @default(true)
}
model SpecSheet     { id, productId, title, url, sortOrder }
model PriceTier     { id, productId, minQty, unitPrice }
model InventoryMovement { id, variantId, delta, reason (ORDER|RELEASE|RESTOCK|ADJUST|RETURN), refId?, actorId?, createdAt }

// ---------- Users ----------
model User {
  id, email @unique, emailVerified, name, phone?
  role   Role @default(CUSTOMER)            // CUSTOMER | B2B_CUSTOMER | STAFF | ADMIN
  businessProfile BusinessProfile?
  addresses Address[]  orders Order[]  sessions Session[]  accounts Account[] // Better Auth tables
}
model BusinessProfile { id, userId @unique, legalName, gstin, status (PENDING|APPROVED|REJECTED), approvedById? }
model Address { id, userId?, name, phone, line1, line2?, city, state, stateCode, pincode, country @default("IN"), isDefault }

// ---------- Cart ----------
model Cart     { id, userId? @unique, guestToken? @unique, couponCode?, updatedAt, items CartItem[] }
model CartItem { id, cartId, variantId, quantity, @@unique([cartId, variantId]) }

// ---------- Orders ----------
model Order {
  id, number @unique                 // KTX-100001
  userId?, email, phone
  status  OrderStatus                // PENDING_PAYMENT | PAID | PROCESSING | SHIPPED | DELIVERED | CANCELLED | RETURN_REQUESTED | RETURNED | REFUNDED
  paymentMethod (RAZORPAY|COD|BANK_TRANSFER)
  shippingAddress Json  billingAddress Json   // snapshot, not FK
  gstin?, businessName?
  subtotal, discount, shipping, taxTotal, cgst, sgst, igst, total   // all Int paise
  couponCode?
  reservedUntil DateTime?
  items OrderItem[]  payments Payment[]  shipments Shipment[]  events OrderEvent[]  invoice Invoice?
  quoteId?
  createdAt, updatedAt
}
model OrderItem  { id, orderId, variantId, productName, variantTitle, sku, hsnCode, unitPrice, quantity, gstRate, taxAmount, lineTotal } // snapshot
model Payment    { id, orderId, provider, providerOrderId, providerPaymentId?, amount, status (CREATED|CAPTURED|FAILED|REFUNDED), raw Json, createdAt }
model Refund     { id, paymentId, amount, reason, providerRefundId?, status }
model Shipment   { id, orderId, carrier, awb?, trackingUrl?, status, shiprocketOrderId?, events Json, shippedAt?, deliveredAt? }
model OrderEvent { id, orderId, type, message, actorId?, createdAt }   // timeline for admin + customer
model Invoice    { id, orderId @unique, number @unique, fy, pdfUrl, issuedAt }
model InvoiceCounter { fy @id, last Int }

// ---------- Promotions ----------
model Coupon { id, code @unique, type (PERCENT|FLAT|FREE_SHIPPING), value, minSubtotal?, maxDiscount?, startsAt?, endsAt?, usageLimit?, perUserLimit?, usedCount, isActive }

// ---------- B2B ----------
model Quote     { id, number @unique, userId?, contactName, email, phone, organization, gstin?, status (REQUESTED|QUOTED|ACCEPTED|EXPIRED|REJECTED|CONVERTED), notes, validUntil?, items QuoteItem[], adminNotes, createdAt }
model QuoteItem { id, quoteId, productId, variantId?, quantity, requestedNotes?, quotedUnitPrice? }

// ---------- Existing ----------
model Query     { (unchanged: contact/tender enquiries) }
```

## 4. API contract (v1)

Base: `/api/v1` (Nest global prefix). JSON in and out. Swagger at `/api/docs` in dev. Errors use `{ error: { code, message, details? } }`. Auth via session cookie.
`🔓` public · `👤` logged-in customer · `🏢` approved B2B · `🛠` STAFF/ADMIN.

### Catalog 🔓
| Method | Path | Notes |
|---|---|---|
| GET | `/categories` | active categories + product counts |
| GET | `/products` | `?category=&q=&size=&colour=&minPrice=&maxPrice=&sort=price_asc\|price_desc\|newest&page=&limit=`. Returns cards: id, slug, name, primary image, price range, saleChannel, inStock |
| GET | `/products/:slug` | full PDP: images, options, variants (price, inStock, never raw stock count), specs, specSheets, priceTiers (only for 🏢) |
| GET | `/search/suggest?q=` | typeahead (Postgres `pg_trgm` / full-text) |

### Auth & account
| Method | Path | |
|---|---|---|
| * | `/auth/*` | Better Auth handler: sign-up, sign-in, sign-out, verify email, reset password, email OTP |
| GET | `/me` 👤 | profile + role + businessProfile status |
| PATCH | `/me` 👤 | name, phone |
| GET/POST/PATCH/DELETE | `/me/addresses[/:id]` 👤 | |
| POST | `/me/business-profile` 👤 | apply for B2B (GSTIN, legal name). Admin approves. |
| GET | `/me/orders`, `/me/orders/:number` 👤 | |
| POST | `/me/orders/:number/cancel` 👤 | only before SHIPPED |
| POST | `/me/orders/:number/return` 👤 | return/exchange request |

### Cart 🔓 (guest cookie or user)
| Method | Path | |
|---|---|---|
| GET | `/cart` | items with live price/stock, totals preview (subtotal, discount, estimated shipping, tax breakdown) |
| POST | `/cart/items` | `{variantId, quantity}` |
| PATCH | `/cart/items/:variantId` | `{quantity}` (0 = remove) |
| DELETE | `/cart/items/:variantId` | |
| POST/DELETE | `/cart/coupon` | apply/remove code |
| (auto) | on login | guest cart merged into user cart |

### Checkout & payments
| Method | Path | |
|---|---|---|
| POST | `/checkout/quote` | `{shippingAddress, billingAddress?, gstin?}` → final totals incl. tax split. No side effects. |
| POST | `/checkout` | creates Order (`PENDING_PAYMENT`), reserves stock, creates Razorpay order → `{orderNumber, razorpay:{keyId, orderId, amount}}`. Idempotency-Key header required. |
| POST | `/checkout/verify` | `{razorpay_order_id, razorpay_payment_id, razorpay_signature}` → verifies HMAC, marks PAID (idempotent) |
| POST | `/webhooks/razorpay` | raw body, signature-verified; source of truth for `payment.captured/failed`, `refund.processed` |
| POST | `/webhooks/shiprocket` | tracking updates |
| GET | `/orders/:number/invoice` 👤 | signed URL to the PDF |

### B2B quotes
| Method | Path | |
|---|---|---|
| POST | `/quotes` 🔓 | RFQ: contact + items[{productId, variantId?, quantity, notes}] |
| GET | `/me/quotes[/:number]` 👤 | |
| POST | `/me/quotes/:number/accept` 👤 | converts to an Order at the quoted prices → checkout or bank-transfer |

### Enquiries (existing, moved under v1)
`POST /queries` 🔓 (rate-limited + honeypot), `GET /admin/queries` 🛠

### Admin 🛠 (`/admin/...`)
- `GET /admin/dashboard`: today's/7-day revenue, orders by status, low-stock variants, pending quotes, new enquiries
- Products: CRUD `/admin/products`, `/admin/products/:id/variants` (bulk generate from options), `/admin/uploads` (presigned R2 URL), `/admin/products/import` (CSV)
- Inventory: `PATCH /admin/variants/:id/stock` (writes InventoryMovement), `GET /admin/inventory?lowStock=`
- Orders: list/filter/search, detail, `POST /admin/orders/:id/{status,ship,cancel,refund,mark-paid,note}`, `GET /admin/orders/export.csv`
- Shipping: `POST /admin/orders/:id/shiprocket` (create shipment + AWB + label)
- Quotes: list, detail, `POST /admin/quotes/:id/respond` (prices, validUntil)
- Customers: list, detail, `POST /admin/business-profiles/:id/{approve,reject}`
- Coupons: CRUD
- Queries: list, update status
- Users (ADMIN only): staff accounts, roles

## 5. Cross-cutting rules (all agents)

- **NestJS conventions:** one module per domain; controllers stay thin (parse → call service → return); business logic lives in services; cross-module side effects go through `EventEmitter2` events (`order.paid`, `order.shipped`, `quote.responded`), not direct imports, wherever possible. Admin routes are guarded with `@Roles('STAFF','ADMIN')`. Every route is authenticated unless marked `@Public()`.
- **Validation:** every body/query/param uses a `createZodDto` built from the module's zod schema in `dto/`, with a global `ZodValidationPipe`. No unvalidated input.
- **Contract:** any API change regenerates and commits `openapi.json` in the same backend PR. `/api/v1` changes are additive only.
- **Money:** integer paise end-to-end. Format only in the UI (`Intl.NumberFormat('en-IN', {style:'currency', currency:'INR'})`).
- **Prices are computed on the server.** The client never sends prices. Checkout recomputes everything.
- **Idempotency:** checkout and webhooks are idempotent (Idempotency-Key header; unique providerPaymentId).
- **Transactions:** stock reservation, order creation and coupon usage happen in a single Prisma `$transaction` with `SELECT … FOR UPDATE` on variants.
- **Security:** helmet, `@nestjs/throttler`, CORS allowlist with credentials, stricter throttles on auth/checkout/queries/quotes, CSRF protection (SameSite=Lax + Origin check on mutating routes), webhook signature checks on `req.rawBody`, no secrets in the frontend, env validated at boot.
- **Logging:** `nestjs-pino` structured logs with a request id. Sentry for errors. Never log card/payment payloads beyond provider IDs.
- **Errors:** throw `AppException(code, status)`; a global exception filter maps it (and Prisma/zod errors) to the contract error shape.
- **Testing (server):** Jest unit specs with `@nestjs/testing` for tax, pricing, coupons and stock; Jest + supertest e2e in `kritex-server/test/` against a test DB. **Testing (web):** vitest + MSW. Playwright E2E (website repo, boots both apps) for browse → cart → checkout (Razorpay test mode) and admin fulfil.
- **Emails:** React Email templates: order confirmation, payment failed, shipped (tracking), delivered, quote responded, verify email, reset password.
