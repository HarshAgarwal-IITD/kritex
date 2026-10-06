# Master Plan: Kritex Ecommerce

## 1. Goal

Turn kritex.in from a catalog with mailto enquiries into a store where:

1. **Retail (B2C) customers** browse, pick size/colour, pay online (UPI/cards/netbanking, optional COD),
   get a GST invoice and track delivery.
2. **Institutional/bulk (B2B) buyers** (forces, PSUs, security agencies, distributors) can request
   quotes for large quantities, get tiered pricing, check out with a GSTIN, or pay by bank transfer/PO.
3. **Kritex staff** run everything from an admin panel: products, prices, stock, orders, shipping,
   quotes, enquiries, customers.

The look and feel of the current site (military/heritage brand) stays. We add commerce to it; we don't redesign it.

## 2. Scope

### In scope (v1 launch)
- Product catalog backed by a database (categories, products, variants = size × colour, SKUs, stock, images, spec sheets)
- Search, filters (category, size, colour, price), sorting
- Cart (guest + logged-in, persists across devices after login)
- Customer accounts: signup/login (email + OTP or password), addresses, order history
- Checkout: address, shipping estimate, GST calculation, Razorpay payment, COD (optional)
- Orders: lifecycle, confirmation emails, GST invoice PDF, cancellation/returns request
- Shipping: Shiprocket integration (rates, AWB, tracking), plus manual fallback
- B2B: "Request a Quote" cart, GSTIN capture, tier pricing, quote → order conversion
- Admin panel: products/variants/stock, orders, quotes, enquiries, customers, coupons, basic dashboard
- Coupons/discount codes
- Legal and policy pages (Terms, Privacy, Refund/Return, Shipping, Contact). **Razorpay requires these before activation.**
- SEO (per-product meta, sitemap, structured data), analytics, error monitoring
- Production deployment, backups, CI

### Out of scope for v1 (backlog)
- Wishlist, product reviews/ratings
- Multi-currency / international shipping (Bhutan is a likely early ask, see Q5)
- Marketplace sync (Amazon/Flipkart), ERP/Tally sync
- Loyalty points, gift cards, abandoned-cart automation beyond a basic email
- Mobile app

## 3. Phases & milestones

Phases describe *what* the product gains. They're delivered through the 7 execution **stages** in [EXECUTION.md](EXECUTION.md), which describe *how* agents build it. Mapping: Phase 0 → Stage 0 · Phase 1 → Stages 1–2 · Phases 2–4 → Stages 2–3 · Phases 5–6 → Stage 4 · Phase 7 → Stages 5–6.

| Phase | Name | Outcome | Exit criteria |
|---|---|---|---|
| 0 | Foundation | Repo hygiene, monorepo layout, CI, env, decisions locked | `npm run dev` starts web + api + db with one command; CI runs lint/typecheck/test on PRs |
| 1 | Catalog on the backend | Products live in Postgres; site reads from the API | All current product pages render from the API with no visual regression; `src/data/*.ts` only used by the seed script |
| 2 | Accounts + Cart | Customer auth, cart, addresses | Guest cart merges into user cart on login; add/update/remove works on mobile |
| 3 | Checkout + Payments + Orders | Real money flows | Test-mode Razorpay order paid end-to-end, webhook-verified, stock decremented, email + invoice sent |
| 4 | Admin panel | Staff can operate the store without devs | Staff can create a product with variants, set stock and fulfil an order with no code changes |
| 5 | Shipping & post-purchase | Shiprocket, tracking, returns | Order → AWB generated → tracking visible to the customer → return request flow |
| 6 | B2B | Quotes, tier pricing, GSTIN invoices | Bulk buyer submits an RFQ, admin responds with a quote, buyer converts it to an order |
| 7 | Launch hardening | SEO, legal, perf, security, monitoring, deploy | Lighthouse ≥ 90 on mobile PDP; security review passed; Razorpay live keys activated; backups verified |

Execution is 7 stages (EXECUTION.md), each running 2–5 agents in parallel followed by an integration step and a gate.
The real-world critical path is **business inputs**, not code: prices/HSN/stock (Q2), Razorpay KYC
(takes days), and legal pages.

## 4. Workstreams (for parallel agents)

Each workstream owns a set of files/dirs in one repo (**server** = `kritex-server`, **web** = `kritex-website`) so agents don't collide. See TASKS.md for task-level detail.

| ID | Workstream | Owns |
|---|---|---|
| WS-INFRA | Repo, tooling, CI, deploy, Nest bootstrap | **server:** `main.ts`, `app.module.ts`, `common/`, `config/`, `.github/`, docker files · **web:** root configs, `.github/`, `src/lib/api/client.ts`, `src/mocks/` setup |
| WS-DB | Data model, migrations, seed | **server:** `prisma/**` |
| WS-API-CAT | Catalog + search API | **server:** `src/catalog/**` |
| WS-API-AUTH | Auth, customers, addresses | **server:** `src/{auth,customers}/**` |
| WS-API-COMMERCE | Cart, checkout, orders, payments, coupons, tax | **server:** `src/{cart,checkout,orders,payments,coupons,tax}/**` |
| WS-API-OPS | Shipping, email, invoices, quotes, admin APIs | **server:** `src/{shipping,notifications,invoices,quotes,queries,dashboard}/**` |
| WS-WEB-STORE | Storefront UI | **web:** `src/pages/**` (non-admin), `src/features/{catalog,cart,checkout,account}/**`, `src/components/**` |
| WS-WEB-ADMIN | Admin UI | **web:** `src/admin/**` |
| WS-QA | Tests, E2E, security review | **web:** `e2e/**` · cross-repo review |
| WS-CONTENT | Legal pages, SEO copy, product data entry | `src/pages/legal/**`, seed data |

## 5. Key risks

| Risk | Impact | Mitigation |
|---|---|---|
| Some products legally can't be sold to civilians (uniform/camouflage patterns, govt-only items) | Legal exposure, Razorpay account suspension | Q1: per-product `saleChannel` flag (RETAIL / B2B_ONLY / ENQUIRY_ONLY), decided before launch |
| No price/HSN/stock data exists today | Can't launch payments | Q2: spreadsheet template for the business to fill; seed script imports it |
| Razorpay KYC and website review delays | Launch slips | Start the KYC application in Phase 0. Legal pages and a live domain are needed for review. |
| Parallel agents create merge conflicts | Wasted effort | File-ownership map (above), contract-first Stage 1, one integration agent per stage |
| Frontend and backend drift apart across two repos | Runtime errors | Generated types from committed `openapi.json`, CI staleness check, additive-only `/api/v1`, full-stack Playwright in website CI |
| SPA hurts SEO for product pages | Lower organic traffic | ADR-007: prerender product/category pages at build time; revisit SSR later |
| Overselling at checkout | Angry customers | Stock reserved inside a DB transaction at order creation; released on payment failure/timeout |

## 6. Changelog
- 2026-10-06: Initial plan drafted.
- 2026-10-06: Backend framework changed from Express to **NestJS** (ADR-012). Workstream paths updated to Nest module folders.
- 2026-10-06: Backend moved to a **separate repo** `kritex-server` (ADR-013); contract via committed OpenAPI. Waves replaced by 7 execution stages (EXECUTION.md).
- 2026-10-06: Stage 0 and Stage 1 completed (defaults accepted for all open questions). Paused before Stage 2.
