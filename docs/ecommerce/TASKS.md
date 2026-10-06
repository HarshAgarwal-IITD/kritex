# Tasks

Legend: `[ ]` todo · `[~]` in progress · `[x]` done (add commit hash) · **→** depends on.
Repo tag: **[S]** = `kritex-server` · **[W]** = `kritex-website`.
Stages, agents, gates and checkpoints: [EXECUTION.md](EXECUTION.md).

## Done
- [x] R-2 Integration branches: `ecommerce` in both repos; stage branches merge into it (2026-10-06)
- [x] R-3 Open questions: owner accepted all defaults; ADRs Accepted (2026-10-06)
- [x] R-1 [S] Extract `server/` into its own repo `projects/kritex/kritex-server`, initial commit `117f8cc` (2026-10-06)

---

## Stage 0: Foundation ✅ (2026-10-06)

Merged: server `ecommerce` @ `6a900da` (commits 70c466f…74146b4) · web `ecommerce` @ `1d84390` (commits a548d8c…9c14e6e) + integration fixes.
Gate passed: both repos' lint/typecheck/tests/build green (server 49 unit + 18 e2e, web 10); `openapi:check` clean; live run through the Vite proxy OK.

### Agent `server-foundation` [S]
- [x] F-S1 Scaffold NestJS in place of the Express prototype (keep `prisma/` + migration, docker-compose): `main.ts` (rawBody, helmet, CORS w/ credentials, prefix `/api/v1`, swagger at `/api/docs`), `ConfigModule` + zod env, `PrismaModule`, `nestjs-pino`, `ThrottlerModule`, `ScheduleModule`, `EventEmitterModule`, global `ZodValidationPipe` (nestjs-zod), `AppException` + global filter, `/api/v1/health`
- [x] F-S2 Port `queries` to `QueriesModule` (same request/response; keep admin API-key guard until AUTH-2)
- [x] F-S3 Jest unit + supertest e2e setup (`test/`), test DB service in docker-compose (:5434), reset helper
- [x] F-S4 `npm run openapi:export` → `openapi.json` (committed); CI check that it's up to date
- [x] F-S5 ESLint + Prettier; GitHub Actions: install, lint, typecheck, unit, e2e (Postgres service), build, openapi staleness
- [x] F-S6 `.env.example` complete; README (setup, scripts)
- [x] F-S7 `CLAUDE.md`: conventions (ARCHITECTURE.md §5, ADR-012), module ownership, link to `../kritex-website/docs/ecommerce`

### Agent `web-foundation` [W]
- [x] F-W1 Commit the current WIP: `c05c73e` on integration branch `ecommerce`
- [x] F-W2 Cleanup: delete `venv/`, `venv2/`, `bun.lock`; move `public/Product Catalogue zip file/` out of `public/` → `assets-source/` (gitignored); `.gitignore` for `.env*` except `.env.example`
- [x] F-W3 Vite dev proxy `/api` → `http://localhost:4000`; `VITE_API_URL` only for prod builds
- [x] F-W4 API client: `openapi-typescript` (`npm run api:gen`, from `../kritex-server/openapi.json` or `$API_SPEC_URL`) + `openapi-fetch` client in `src/lib/api/client.ts` (credentials: include); migrate ContactSection to it
- [x] F-W5 MSW setup for dev/tests (`src/mocks/`), toggled by `VITE_USE_MOCKS`
- [x] F-W6 GitHub Actions: lint, typecheck, vitest, build. Root `CLAUDE.md` with frontend conventions

---

## Stage 1: Contract + Data ✅ (2026-10-06)

Merged: server `ecommerce` @ `bfd1d38` · web `ecommerce` (types regenerated from 81-operation `openapi.json`).
Gate passed: migrations apply cleanly (`…_catalog_commerce_auth`, `…_contract_followups`); seed idempotent (4 categories, 26 products, 165 variants); `openapi.json` covers every §4 endpoint (81 ops, stubs → 501); website regenerates types with no errors; policy pages live at `/legal/*`.
Checks: server lint/typecheck/build OK, 83 unit + 193 e2e tests; web 0 lint errors, typecheck OK, 23 tests, build OK.

### Agent `server-db` [S] → F-S1 ✅ merged `1201d3f` (26 products, 165 variants seeded; migration `20261006095902_catalog_commerce_auth`)
- [x] D-1 Prisma schema per ARCHITECTURE.md §3 (catalog, users + Better Auth tables, cart, orders, promotions, B2B, existing Query)
- [x] D-2 Migration + `pg_trgm` + indexes (slug, sku, status, createdAt, trigram on name)
- [x] D-3 One-time export of website `src/data/*.ts` → `prisma/seed/data/catalog.json`; `prisma db seed` creates categories/products/options/variants (size × colour)/images/specSheets; placeholder prices behind `SEED_PLACEHOLDER_PRICES`
- [x] D-4 Product-data CSV template (`prisma/seed/product-data-template.csv`: sku, price, hsn, gstRate, stock, weightGrams, dims, saleChannel) + `npm run import:products <csv>`
- [x] D-5 Seed admin user from env

### Agent `server-contract` [S] → F-S1 ✅ merged `e97fcda` (judgment calls in [CONTRACT-NOTES.md](CONTRACT-NOTES.md))
- [x] K-1 Module skeletons for every domain (ARCHITECTURE.md §2) registered in `app.module.ts`
- [x] K-2 zod DTOs for every request/response in ARCHITECTURE.md §4, incl. shared enums (OrderStatus, SaleChannel, Role…) and the error shape
- [x] K-3 Stub controllers for every route (correct guards/decorators, `@ApiResponse` types), returning 501
- [x] K-4 `openapi.json` regenerated; contract review notes for anything ambiguous in §4

### Agent `web-content` [W] ✅ merged `819c649` (/legal/* drafts; placeholders in `src/pages/legal/placeholders.ts`)
- [x] C-1 Pages: Terms, Privacy (DPDP-aware), Refund & Returns, Shipping, Cancellation, Contact/Grievance officer. Banner: **draft, needs legal review**.
- [x] C-2 Footer links to the policy pages
- [x] C-3 `react-helmet-async` + `<Seo>` component; titles/descriptions on existing pages
- [ ] C-4 Consent banner: deferred (no analytics yet; revisit with SEO-4)

---

## Stage 2: Catalog + Identity (in progress, started 2026-10-06)

### Agent `server-catalog` [S] → D-*, K-*
- [~] CAT-1 `GET /categories`
- [~] CAT-2 `GET /products` (filters, sort, pagination, price range, inStock, saleChannel)
- [~] CAT-3 `GET /products/:slug` (no raw stock counts; priceTiers only for B2B)
- [~] CAT-4 `GET /search/suggest` (pg_trgm)
- [~] CAT-5 Admin: products CRUD, generate variants from options, variant price/stock (writes InventoryMovement), categories CRUD
- [~] CAT-6 Admin: R2 presigned upload endpoint (local disk driver in dev)
- [~] CAT-7 Unit + e2e tests

### Agent `server-auth` [S] → D-*, K-*
- [~] AUTH-1 Better Auth in `AuthModule` (email+password, verification, reset, email OTP), Prisma adapter, cookie config, mounted at `/api/v1/auth/*`
- [~] AUTH-2 Global `AuthGuard` + `@Public()`, `@Roles()`, `@CurrentUser()`; replace `ADMIN_API_KEY` on queries
- [~] AUTH-3 `/me`, addresses CRUD, business-profile apply; admin approve/reject
- [~] AUTH-4 Dev email transport (log/Mailpit) until OPS-1
- [~] AUTH-5 Throttling + tests (incl. IDOR tests on addresses)
- [~] AUTH-6 Contract follow-ups: confirm Better Auth cookie name (`better-auth.session_token`) + email-OTP paths and update the OpenAPI description; replace temporary `user?.id ?? ''` in customer handlers with `user.id`; if using the admin plugin, run `npx auth generate` and diff (adds `banned`… used for `User.disabled` in the users DTO); implement `/admin/queries` once the guard is enforced

### Agent `server-pricing` [S] → D-1
- [~] PR-1 `TaxService`: GST slab rule (config-driven), CGST+SGST vs IGST by state code, GSTIN format + state-code validation
- [~] PR-2 `ShippingFeeService`: flat + free-above threshold (config)
- [~] PR-3 `CouponService.validate()`: percent/flat/free-shipping, min subtotal, cap, dates, limits
- [~] PR-4 `TotalsService.compute(lines, address, coupon, customer)`: the single function used by cart, checkout quote and order creation; applies B2B price tiers
- [~] PR-5 Exhaustive unit tests (boundaries, rounding to paise, inter/intra-state)

### Agent `web-catalog` [W] → K-* (MSW until CAT lands)
- [~] WEB-CAT-1 TanStack Query hooks (`useProducts`, `useProduct`, `useCategories`) on the generated client
- [~] WEB-CAT-2 Products, category and PDP pages read from the API; skeletons; **no visual regression** (Playwright screenshots before/after)
- [~] WEB-CAT-3 Collapse the 3 category pages into `/products/:categorySlug`
- [~] WEB-CAT-4 PDP: price, variant selection → SKU, stock state, saleChannel-aware CTA (Add to cart / Request quote / Enquire)
- [~] WEB-CAT-5 Filters, sort, search box with suggestions
- [~] WEB-CAT-6 Navbar: account + cart icons (cart count wired in Stage 3)

### Agent `web-admin-catalog` [W] → K-*
- [~] ADM-1 `/admin` lazy route, shadcn sidebar layout, login, role guard
- [~] ADM-2 Products list (search, status filter)
- [~] ADM-3 Product editor: details, SEO, saleChannel, images upload, options → variants table (price/stock), spec sheets, price tiers
- [~] ADM-4 Categories CRUD

---

## Stage 3: Commerce core

### Agent `server-cart` [S] → PR-*, AUTH-*, CAT-*
- [ ] COM-1 Cart service + endpoints: guest token cookie, add/update/remove, live price/stock, totals preview via `TotalsService`
- [ ] COM-2 Merge guest cart on login
- [ ] COM-5 Coupon apply/remove endpoints; admin coupons CRUD

### Agent `server-checkout` [S] → PR-*, AUTH-*, CAT-*
- [ ] COM-7 `POST /checkout/quote`
- [ ] COM-8 `POST /checkout`: one transaction (lock variants FOR UPDATE, reserve stock, order + item snapshots, coupon usage) + Razorpay order; Idempotency-Key
- [ ] COM-9 `POST /checkout/verify` (HMAC)
- [ ] COM-10 Razorpay webhook (`req.rawBody`, signature, idempotent transitions)
- [ ] COM-11 `@Cron` reservation expiry (release stock, cancel after 30 min unpaid)
- [ ] COM-12 Order state machine + OrderEvent timeline; emits `order.paid`, `order.cancelled`, `order.shipped`
- [ ] COM-13 Customer order endpoints (list, detail, cancel, return request)
- [ ] COM-14 Admin order endpoints (filters, status, mark-paid, Razorpay refund, notes, CSV export); dashboard endpoint
- [ ] COM-15 Concurrency test: last-unit race
- [ ] COM-16 Payment retry for an unpaid order (`POST /me/orders/:number/pay`, additive contract change)

### Agent `web-commerce` [W] → K-* (MSW until server lands)
- [ ] WEB-CART-1 Cart drawer + cart page, quantity steppers, optimistic updates, coupon input, navbar count
- [ ] WEB-CHK-1 Checkout: contact (login or guest) → address (saved/new, pincode autofill) → review (tax breakdown, GSTIN toggle) → pay
- [ ] WEB-CHK-2 Razorpay Checkout.js + verify + success/failure/pending pages
- [ ] WEB-ACC-1 Login, signup, OTP, reset pages
- [ ] WEB-ACC-2 Account: profile, addresses, orders + timeline, invoice download, cancel/return
- [ ] WEB-ACC-3 B2B application form + status

### Agent `web-admin-orders` [W]
- [ ] ADM-5 Orders list (filters, search, export) + detail (timeline, items, payment, actions)
- [ ] ADM-6 Inventory view (low stock, adjust with reason)
- [ ] ADM-7 Coupons CRUD
- [ ] ADM-8 Customers + B2B approvals
- [ ] ADM-9 Dashboard tiles + enquiries inbox

---

## Stage 4: Fulfilment + B2B + QA

### Agent `server-ops` [S]
- [ ] OPS-1 `NotificationsModule` listening to order/quote events; Resend + React Email templates (confirmation, failed, shipped, delivered, verify, reset, quote)
- [ ] OPS-2 GST invoice PDF (FY-sequential numbers, CGST/SGST/IGST, HSN summary) → R2; `/orders/:number/invoice`
- [ ] OPS-3 Shiprocket: auth, create order, AWB, label, pickup; tracking webhook → Shipment + OrderEvent; manual-ship fallback; public tracking endpoint

### Agent `server-b2b` [S]
- [ ] B2B-1 Quotes API (create RFQ, list, admin respond, accept → order)
- [ ] B2B-3 Tier pricing applied in `TotalsService` for approved B2B users
- [ ] B2B-4 Bank transfer / PO payment method (AWAITING_PAYMENT; admin mark-paid)

### Agent `web-b2b-ops` [W]
- [ ] B2B-2 Quote cart: add items + quantities from PDP/listing → RFQ form (replaces mailto enquiry)
- [ ] B2B-3 Tier price display for approved B2B users
- [ ] B2B-5 Admin quotes inbox + respond UI; customer quote list + accept
- [ ] OPS-4 Admin: ship action, label print, tracking display
- [ ] OPS-5 Public `/track/:orderNumber` page

### Agent `qa` [both]
- [ ] QA-1 Playwright full-stack harness (boots kritex-server + test DB; website CI checks out kritex-server)
- [ ] QA-2 E2E: browse → filter → PDP → cart → guest checkout (Razorpay test) → confirmation
- [ ] QA-3 E2E: login, cart merge, account orders, cancel
- [ ] QA-4 E2E: admin creates product → storefront; fulfil order
- [ ] QA-5 E2E: RFQ → quote → accept → order
- [ ] QA-6 Security review of both repos: authz on admin routes, IDOR (orders/addresses/quotes), webhook spoofing, price tampering, throttling, cookie/CORS config

---

## Stage 5: Launch prep

### Agent `deploy` [both]
- [ ] DEP-1 [S] Multi-stage Dockerfile; `app.set('trust proxy', …)` so throttling sees client IPs; Railway/Render service; managed Postgres (ap-south-1); `prisma migrate deploy` on release; staging + prod envs
- [ ] DEP-2 [W] Cloudflare Pages/Vercel with PR previews; domains `kritex.in`, `api.kritex.in` (+ staging); cookie domain `.kritex.in`
- [ ] DEP-3 [S] R2 bucket + CDN domain; migrate `public/products` images; update image URLs
- [ ] DEP-4 [both] Sentry (not set up yet in either repo), uptime monitor on `/api/v1/health`, DB backups + restore drill
- [ ] DEP-5 [S] Razorpay + Shiprocket live keys and webhook URLs (after activation)

### Agent `web-seo-perf` [W]
- [ ] SEO-1 Prerender catalog routes + PDPs at build (product list from API); sitemap.xml; robots.txt
- [ ] SEO-2 JSON-LD Product/Offer/BreadcrumbList; OG images
- [ ] SEO-3 Image optimisation (WebP/AVIF, srcset, lazy), code-splitting; Lighthouse mobile ≥ 90
- [ ] SEO-4 Analytics (GA4 or Plausible) + ecommerce events

### Agent `data-import` [S]
- [ ] C-5 Import real prices/HSN/stock/weights CSV (Q2); verify every product renders correctly
- [ ] C-6 Set saleChannel per product (Q1)

### Owner
- [ ] C-7 Legal sign-off on policy pages
- [ ] Razorpay live activation, CA sign-off on invoices, staff accounts

---

## Tech-debt / follow-ups (from Stage 0)
- [ ] TD-1 [S] Throttler storage is in-memory (per instance) → Redis storage before running >1 API instance
- [ ] TD-2 [S] Upgrade to Nest 12 + unpin zod once nestjs-zod supports them (ADR-014); `src/openapi.spec.ts` guards regressions
- [ ] TD-3 [both] `npm audit` advisories (server: transitive via @nestjs/swagger 11 / jest tooling; web: pre-existing) → review in QA-6
- [ ] TD-4 [S] Old prototype volume `server_kritex_postgres_data` can be deleted once not needed
- [ ] TD-6 [S] Category images seeded as `/assets/product-*.jpg`, but those are Vite-hashed `src/assets` imports, not public files → move to `public/` or R2 (with DEP-3)
- [ ] TD-7 [business] Field duty jacket size "XX" (SKU `KTX-FDTJ-XX`) is probably a typo in website data; confirm
- [ ] TD-8 [S] Prisma 7: move `package.json#prisma.seed` to `prisma.config.ts` (mind .env loading)
- [ ] TD-9 [W] Main bundle 597 kB → route-level code splitting (with SEO-3)
- [ ] TD-5 [W] Rename package.json `name` from `vite_react_shadcn_ts` to `kritex-website`

## Stage 6: Go-live (see EXECUTION.md)
- [ ] GL-1 Soft launch (staff-only gate), real order + refund + real shipment
- [ ] GL-2 Public launch, Search Console sitemap
- [ ] GL-3 Two-week hypercare; `RUNBOOK.md` for staff/on-call
- [ ] GL-4 Retro + post-v1 backlog
