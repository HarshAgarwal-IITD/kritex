# Progress Log

This is the running record of what has been built, where it lives, how to run it, and what's still open.
Add a new section at the end of each stage.

**Status as of 2026-10-08:** Stages 0–3 are complete (Stage 3 gate passed on the fake payment gateway; the real Razorpay test payment waits for keys). **Stage 4 (Fulfilment + B2B + QA) in progress** (started 2026-10-09).

| Stage | Status | Integration commit |
|---|---|---|
| Planning | ✅ | `c05c73e` (docs) |
| 0 Foundation | ✅ gate passed | server `6a900da` · web `782488e` |
| 1 Contract + Data | ✅ gate passed | server `bfd1d38` · web `428f63c` |
| 2 Catalog + Identity | ✅ gate passed | server `9a4aa64` · web `6520bbf` |
| 3 Commerce core | ✅ gate passed (fake gateway; real Razorpay check pending keys) | server `7f8882f` · web `f7b4f93` |
| 4 Fulfilment + B2B + QA | 🔄 in progress | — |
| 5–6 | not started | — |

---

## Repos & branches

| Repo | Path | Branch | Remote |
|---|---|---|---|
| Website (storefront + admin + planning hub) | `projects/kritex/kritex-website` | `ecommerce` (from `main` @ `c438f81`) | `github.com/HarshAgarwal-IITD/kritex`. `ecommerce` pushed 2026-10-06 |
| Backend API | `projects/kritex/kritex-server` | `ecommerce` (from `main` @ `117f8cc`) | `github.com/HarshAgarwal-IITD/kritex-server`. `main` + `ecommerce` pushed 2026-10-06 |

`main` is untouched in both repos. All work is on `ecommerce`, and each stage's agent branches were merged into it and then deleted. No worktrees are left open.

## How to run it locally

```bash
# Backend (needs Docker Desktop running)
cd projects/kritex/kritex-server
cp .env.example .env              # first time; set SEED_PLACEHOLDER_PRICES=true for dev prices
docker compose up -d              # Postgres dev :5433, test :5434
npx prisma migrate deploy
npm run db:seed                   # 4 categories, 26 products, 165 variants; admin login from SEED_ADMIN_EMAIL + SEED_ADMIN_PASSWORD
npm run start:dev                 # http://localhost:4000/api/v1, Swagger at /api/docs

# Website
cd projects/kritex/kritex-website
npm install
npm run dev                       # http://localhost:8080, proxies /api → :4000
# or without the backend:  VITE_USE_MOCKS=true npm run dev   (MSW mock API)
```

Checks: **server** `npm run lint && npm run typecheck && npm test && npm run test:e2e && npm run build && npm run openapi:check`
· **web** `npm run lint && npm run typecheck && npm test && npm run build && npm run test:visual`.
Auth emails (verification/reset/OTP links) are printed to the server log in dev unless `SMTP_HOST` is set (e.g. Mailpit).
After any backend API change: `npm run openapi:export` in the server, then `npm run api:gen` in the website.

---

## Planning (2026-10-06)

- Wrote the planning hub: README, PLAN, DECISIONS, ARCHITECTURE, EXECUTION, TASKS, and now CONTRACT-NOTES and PROGRESS.
- Owner decisions:
  - **NestJS** backend (ADR-012)
  - **separate backend repo** with the contract shared via OpenAPI (ADR-013)
  - **accept all defaults** for the open questions Q1–Q9
- All ADRs are Accepted.
- Defaults now in effect:
  - every product starts `ENQUIRY_ONLY` until marked retail
  - both B2C and B2B
  - no COD
  - India only
  - 7-day size exchange, no cash refunds except for defects
  - no ERP integration (CSV export instead)
  - 1 admin plus a staff role
  - GSTIN and business state are config placeholders
- Repo prep:
  - moved the untracked `server/` folder into its own repo, `kritex-server` (`117f8cc`)
  - committed the earlier work-in-progress (contact form → API, lazy images) as `c05c73e`
  - moved the raw catalogue PDFs out of `public/` into gitignored `assets-source/`

## Stage 0: Foundation ✅

**Backend (`server-foundation` agent):** the Express prototype was replaced with **NestJS 11**:
- **Config and data access:** env validated by zod at boot, and a global Prisma service.
- **Logging:** pino with request ids, and auth headers redacted.
- **Protection:** helmet, CORS with credentials, and rate limiting (100 requests/min globally, 5/min on the contact form).
- **Errors:** one standard error format, `{error:{code,message,details}}`.
- **Validation:** request bodies are checked with zod via nestjs-zod.
- **Endpoints:**
  - `GET /api/v1/health` (checks the DB)
  - `POST /api/v1/queries`
  - `GET /api/v1/queries` (temporary admin API key)
- **API spec:** `openapi.json` is generated and committed, and CI fails if it's stale.
- **Tooling:** Jest unit tests and supertest e2e tests against a dockerised test DB, ESLint and Prettier, GitHub Actions CI, README, and `CLAUDE.md`.
- **Docker:** compose project renamed to `kritex-server`. The old prototype container was removed; its volume is kept.

**Website (`web-foundation` agent):**
- **Dev proxy:** Vite proxies `/api` to `:4000`.
- **Typed API client:** `openapi-fetch` plus types generated from the server's `openapi.json` with `npm run api:gen`. ContactSection now uses it.
- **Mock API:** MSW for dev (`VITE_USE_MOCKS=true`) and for tests.
- **Tests:** real tests replace the placeholder.
- **CI and conventions:** CI added, plus a `CLAUDE.md`. `bun.lock` removed (npm only).

**Integration fixes (main session):**
- The mocks had used guessed schema names, which broke when the types were regenerated from the real spec. They now take their types from the endpoint paths (ADR-014).
- ESLint now ignores agent worktrees.

**Version pins (ADR-014):** Nest 11 rather than 12, zod `~4.4.3`, TS 5.9. All three are blocked by tooling support, and an upgrade task is tracked as TD-2.

**Gate:** everything green. Server: 49 unit + 18 e2e tests. Web: 10 tests. A live run through the Vite proxy behaved correctly:
- health returns ok
- a contact query is saved
- invalid input gets the standard error format
- listing queries without the key returns 401

## Stage 1: Contract + Data ✅

**Database (`server-db` agent):**
- **Full Prisma schema:**
  - catalog: categories, products, options, variants/SKUs, images, spec sheets, price tiers, inventory movements
  - users with the Better Auth tables, business profiles and addresses
  - cart, orders, order items, payments, refunds, shipments, order events, invoices and invoice counters
  - coupons and quotes
- **Migration `…_catalog_commerce_auth`:**
  - money is stored as integer paise
  - fuzzy name search uses pg_trgm with a GIN index
  - CHECK constraints stop stock and quantities going negative
- **Seed:**
  - `prisma/seed/data/catalog.json` is exported from the website's `src/data/*.ts`, storing the plain `/products/...` paths (the website applies `asset()` when it renders)
  - the seed is idempotent and loads **4 categories, 26 products, 165 variants (size × colour), 62 images and 33 spec sheets**
  - SKUs look like `KTX-CPT-M-OLIVEGREEN`
  - `SEED_PLACEHOLDER_PRICES=true` fills dev prices, stock 25, placeholder HSN/GST and weights
  - it also creates an ADMIN user from `SEED_ADMIN_EMAIL`
- **Your real data:**
  - `prisma/seed/product-data-template.csv` has one row per SKU
  - `npm run import:products -- <csv> [--dry-run]` validates every row and applies the file in one transaction, logging stock changes

**API contract (`server-contract` agent):** stubs for every v1 endpoint, **81 operations** in total.
- **Modules:** catalog, customers, cart, coupons, checkout, orders, payments, shipping, invoices, quotes, dashboard, users, plus admin controllers.
- **Shared DTOs:** enums matching Prisma, money/totals, pagination `{items,page,limit,total}`, and Indian formats (PIN code, GST state code, GSTIN, phone).
- **Auth decorators:** `@Public`, `@Roles`, `@Authenticated` and `@CurrentUser`. They only label routes for now; enforcement arrives in Stage 2.
- **Docs:** a session-cookie security scheme in the spec, and a required `Idempotency-Key` on checkout and quote acceptance.
- **Tests:** `test/contract.e2e-spec.ts` checks the exact set of operationIds and the auth/security setup, and that every stub returns 501 (or 400) rather than 404.
- **Write-up:** the judgment calls are in [CONTRACT-NOTES.md](CONTRACT-NOTES.md).

**Policies and SEO (`web-content` agent):**
- **Policy pages:** `/legal` index plus terms, privacy (DPDP Act), returns, shipping, cancellation and contact/grievance, built on the accepted defaults. Each shows a "Draft — pending legal review" banner; turn it off with `LEGAL_DRAFT` in `src/pages/legal/policies.ts`.
- **Placeholders:** the business details still to fill are in `src/pages/legal/placeholders.ts`.
- **Footer:** a "Policies" link group.
- **SEO:** a `<Seo>` component (react-helmet-async) on every page, with title, description, canonical, OG and Twitter tags. Product pages also get Product JSON-LD, the home page gets Organization JSON-LD, and 404s are noindex.
- **Founding year:** `index.html` said 1994; it now says 1976, matching the rest of the site.

**Owner's own work, committed during integration (`12cfbeb`):** WebP conversion (`npm run images:convert` with sharp → `r2-upload/`) and the `asset()` helper, which points images at `VITE_ASSET_BASE_URL`. It was merged alongside web-content; the conflicts were all "keep both".

**Integration (main session):**
- Merged all three branches and regenerated the website types from the 81-operation spec.
- Added migration `…_contract_followups` for fields the contract needed: `OrderStatus.AWAITING_PAYMENT`, `BusinessProfile.rejectionReason`, `Quote.respondedAt`, `Shipment.labelUrl`, `Payment.reference`, `OrderEvent.internal`.

**Gate:**
- migrations apply cleanly and the seed is idempotent
- the spec covers every planned endpoint
- the website regenerates its types without errors
- the policy pages render

Final checks:
- **Server:** lint, typecheck and build OK; **83 unit + 193 e2e tests** pass.
- **Web:** 0 lint errors, typecheck OK, **23 tests**, build OK.

## Stage 2: Catalog + Identity ✅

Started 2026-10-06; the first launch of the 5 agents stopped without committing anything (only the auth deps were installed), so they were relaunched 2026-10-07 in the same worktrees, with per-agent test DBs (`kritex_test_{catalog,auth,pricing}`) so e2e runs didn't collide.

**Catalog API (`server-catalog`):**
- Public: `GET /categories` (with ACTIVE product counts), `GET /products` (category slug or id, q, size/colour, price range, saleChannel, new optional `inStock`; newest / price sorts; paginated), `GET /products/:slug` (no stock counts, ENQUIRY_ONLY hides prices, `priceTiers` only for approved B2B, `purchasable` flag), `GET /search/suggest` (pg_trgm, typo-tolerant).
- Admin: products CRUD (delete archives if orders/quotes reference it), idempotent variant generation from options (one "Default" variant when there are none), variant updates, stock adjustments with row lock + InventoryMovement (409 below reserved, concurrency-tested), inventory list, categories CRUD.
- Uploads: `StorageDriver` with a local-disk driver (dev) and R2 presigned PUT.

**Auth + accounts (`server-auth`):**
- Better Auth: email+password with required verification, reset, email OTP; 30-day sessions; cookie `better-auth.session_token`.
- Global `AuthGuard` (deny unless `@Public()`), role checks, Origin check on cookie writes. `ADMIN_API_KEY` removed; `/queries` admin is session/role based.
- `/me`, addresses CRUD (IDOR-tested), business-profile apply + admin approve/reject (CUSTOMER → B2B_CUSTOMER), admin customers and staff users (invite, role, disable).
- Dev mail: logged to the server console (SMTP when `SMTP_HOST` set). Throttles on sign-in / email-sending routes.
- New migration `…_user_disabled` (`User.banned/banReason/banExpires`). Seed: `SEED_ADMIN_PASSWORD` gives the seeded admin a login.

**Pricing engine (`server-pricing`):** `src/pricing/` with TaxService (GST slab, CGST+SGST vs IGST, GSTIN checksum), ShippingFeeService (₹99 flat, free ≥ ₹999), CouponValidationService, TotalsService (B2B tiers, coupon allocation to the paisa, per-line tax). 149 unit tests. Pure, no HTTP; Stage 3 imports it.

**Storefront (`web-catalog`):**
- `src/features/catalog/` hooks (`useCategories`, `useProducts`, `useProduct`, `useSearchSuggest`); products, category and PDP pages read from the API with skeletons, error and empty states. No page imports `src/data/*.ts` any more (only the MSW mocks do).
- One `Category` page at `/products/:categorySlug` replaces the three hard-coded pages.
- PDP: INR price (paise), variant selection → SKU, stock state, saleChannel-aware CTA (Add to cart stub / Request quote / Enquire). Filters, sort and search suggestions on `/products`. Navbar account + cart icons (`/account`, `/cart` are "coming soon" placeholders).
- Playwright visual suite `npm run test:visual` (22 screenshots, desktop + mobile), baselined from the pre-change code.

**Admin (`web-admin-catalog`):** lazy `/admin` chunk (~54 kB gzip) with sidebar layout, login, staff/admin guard; products list (search, filters, pagination); product editor (details, SEO, sale channel, rupee → paise pricing, image/spec-sheet upload, options → variants, per-variant price/stock with reasons, specs, B2B tiers); categories CRUD.

**Integration (main session):**
- Merged server catalog → pricing → auth, web catalog → admin. Conflicts: env schema / `.env.example` / README / `contract.e2e-spec.ts` (kept everything; `IMPLEMENTED` set is the union), MSW handlers imports.
- Kept the deploy work committed separately on server `ecommerce` (`29b0eb2`: Dockerfile, `render.yaml`, `TRUST_PROXY`) and switched `render.yaml` from `ADMIN_API_KEY` to `BETTER_AUTH_SECRET` + `BETTER_AUTH_URL`/`WEB_URL`/`AUTH_COOKIE_DOMAIN`.
- Catalog admin e2e now signs in as STAFF (stock movements record the actor).
- Tests and the visual server pin `VITE_ASSET_BASE_URL=""`: the local `.env` points images at the object store, which broke 3 unit tests and every screenshot on the merged tree.
- Regenerated `src/lib/api/schema.d.ts`; migrated + re-seeded the dev DB.

**Gate (all passed, 2026-10-07):**
- All 26 existing product URLs resolve from the API; visual suite 22/22 against the pre-change baselines.
- `src/data/*.ts` is not imported by any page or component.
- Live through the Vite proxy: sign-up → login refused (`EMAIL_NOT_VERIFIED`) → verification link → login → `/me` ✔. Seeded admin logs in (role ADMIN), creates a RETAIL product, generates variants (`KTX-GTFC-M-BLACK`…), activates it, and it appears on `/products/:slug` with price and `purchasable: true` (test product deleted afterwards).
- Pricing unit tests cover intra/inter-state GST, slab boundaries, coupons, free-shipping threshold.

Final checks: **server** lint, typecheck, build, `openapi:check` OK; **272 unit + 317 e2e** tests pass. **Web** 0 lint errors, typecheck OK, **78 tests**, build OK, visual 22/22.

## Stage 3: Commerce core ✅

Started 2026-10-07 with 4 agents (worktrees `../kritex-server-wt/s3-{cart,checkout}`, `.claude/worktrees/s3-web-{commerce,admin-orders}`; test DBs `kritex_test_{cart,checkout}`). Paused mid-integration at the owner's request on 2026-10-07 (the `web-commerce` agent was stopped with its work committed as `fa554b8` plus 2 files), resumed and finished 2026-10-08. Decisions: ADR-016.

**Cart (`server-cart`, merged `6596b02`):**
- Guest carts on an httpOnly `kritex_cart` cookie (token always made by the server), user carts, live price/stock and per-line issues on every read, totals via `TotalsService`.
- Guest → user merge on the first cart request after sign-in.
- Coupon apply/remove on the cart; a stored coupon that stops applying shows `valid: false` + reason. Admin coupons CRUD. Daily guest-cart cleanup.

**Checkout, payments, orders (`server-checkout`, merged `0afe4b0`):**
- `PaymentGateway`: real Razorpay, or a fake gateway when `RAZORPAY_KEY_ID` is unset (refused in production).
- Checkout quote; `POST /checkout` with Idempotency-Key, `FOR UPDATE` stock reservation, order + item snapshots (TD-19: `discount`/`netTotal`), coupon usage; verify (HMAC / fake); Razorpay webhook (idempotent); 30-minute reservation expiry cron.
- Order state machine + timeline + `order.*` events; customer orders (cancel, return, pay again via `payMyOrder`); admin orders (filters, status, mark paid, refund, notes, CSV export); dashboard (today / 7 / 30 days, low stock).
- Migration `20261007063642_checkout_orders` (idempotency hash, cart id, item discount/netTotal, order-number sequence from `KTX-100001`).

**Storefront (`web-commerce`, merged `20364e6`):** cart drawer + `/cart` (optimistic steppers, issue messages, coupon), 3-step `/checkout` (contact → address with PIN autofill → review with CGST/SGST or IGST and optional GSTIN), Razorpay Checkout.js or the fake "Simulate payment" dialog, success / failure / pending pages; `/login` (password or email code), `/signup`, password reset; `/account` profile, orders (timeline, invoice, cancel, return, **Pay now**), addresses, B2B application. Checkout, auth and account pages are lazy-loaded: the main JS chunk fell from 638 kB to 353 kB.

**Admin (`web-admin-orders`, merged `3c207f0`):** dashboard as the `/admin` landing page, orders list + detail with actions (status, mark paid, refund with confirm, cancel, notes, CSV), inventory, coupons, customers, B2B approvals, enquiries inbox (TD-20).

**Integration (main session):**
- Server merges: env schema / `.env.example` conflicts only (kept both sides). Checkout now uses the cart's shared line-issue rules (`73ae064`); cart loading stays inside the checkout transaction.
- Website: regenerated API types; admin mocks and UI updated for the new fields (`refundableAmount`, 30-day dashboard figures, item `discount`/`netTotal`); commerce mocks aligned (`ORDER_NOT_PAYABLE`); removed the temporary coupon-field casts; added **Pay now** for unpaid orders.
- `render.yaml` declares the Razorpay variables (TD-23); the values still have to be entered on Render.
- New full-stack Playwright gate test `e2e/fullstack/checkout.spec.ts` (`npm run test:e2e`, needs the API + dev server running and `E2E_ADMIN_PASSWORD`).
- Note: the owner's `kritex-server/.env` now has `DATABASE_URL` pointing at Neon, and the value starts with a doubled quote (`""postgresql://…`), so it doesn't parse. It was left untouched; local runs passed the local URL on the command line (`DATABASE_URL=postgresql://kritex:kritex@localhost:5433/kritex?schema=public npm run start:dev`).

**Gate (2026-10-08, fake gateway):**
- Browser, full stack (`npm run test:e2e`, run twice): a guest adds 2 variants → applies a 10% coupon → checks out (CGST + SGST) → simulates payment → success page; admin API shows the order PAID with the coupon, and both variants' stock went 3 → 2 with nothing left reserved.
- API script: same flow plus idempotent `POST /checkout` (same key → same order), a failed payment leaving the order payable, idempotent verify replay, and the guest cart cleared after payment.
- Server e2e (on the merged code): webhook replay idempotent (`payment.captured` and `refund.processed` twice), unpaid order releases stock after the timeout, last-unit race (exactly one 201 and one 409), an 8-buyer oversell test.
- **Not yet done:** paying with a real Razorpay test card / UPI. Needs Razorpay test keys (owner to-do 10).

Final checks: **server** lint, typecheck, build, `openapi:check` OK; **313 unit + 337 e2e** tests pass. **Web** 0 lint errors, typecheck OK, **135 tests**, build OK, visual 22/22, full-stack e2e 1/1.

## Deployment (as of 2026-10-09)

- **Live:** the API runs on **Render** (`https://kritex-server.onrender.com`) with Postgres on **Neon** (Singapore). The website on Vercel proxies `/api/*` to it (`vercel.json`).
- **Production deploys `main` in both repos** (owner decision 2026-10-09, ADR-008). `ecommerce` is never deployed. What is live today is the Express prototype on `main` (`117f8cc`: `GET /api/health`, `POST/GET /api/queries`, `x-powered-by: Express`), matching the live website on `main`. `render.yaml` on `ecommerce` now also says `branch: main`.
- **Migrations are compatible:** `ecommerce` keeps the prototype's `20260922093957_init`, and the Docker image runs `prisma migrate deploy` on boot, so the release adds the 5 newer migrations on top of the existing Neon data.
- **Release = merge `ecommerce` into `main`** (owner approval required). Before merging:
  1. Render env: `NODE_ENV=production`, `DATABASE_URL` (Neon, direct not pooled), `CORS_ORIGIN`, `TRUST_PROXY=1`, `BETTER_AUTH_SECRET` (≥ 32 chars), `BETTER_AUTH_URL` (public API origin), `WEB_URL`, `AUTH_COOKIE_DOMAIN`, and **`RAZORPAY_KEY_ID/KEY_SECRET/WEBHOOK_SECRET`** (test keys are fine). Without Razorpay keys the API refuses to boot in production (the fake gateway is dev-only). Remove `ADMIN_API_KEY`.
  2. Back up / branch the Neon database.
  3. Merge the server first, wait for `/api/v1/health`, then merge the website (the new site calls `/api/v1/*`; the contact form moves to `/api/v1/queries`).
  4. Seed the catalog once (`DATABASE_URL=<neon> npx prisma db seed`, with `SEED_ADMIN_EMAIL` + `SEED_ADMIN_PASSWORD`), or import real data with `npm run import:products`.
  5. Smoke test: `/api/v1/health`, `/products`, admin login, a test order.
- **Local dev (2026-10-09):** `kritex-server/.env` has `DATABASE_URL` = **production** Neon and `DATABASE_URL_DEV` = a separate **dev** Neon database (migrated + seeded with placeholder prices). Run the API with `DATABASE_URL="$DATABASE_URL_DEV" npm run start:dev`; migrate/seed the dev DB through the direct (non-`-pooler`) host. Never run migrations, seeds or tests against `DATABASE_URL` from a dev machine. Razorpay **test** keys are in the same `.env`; `RAZORPAY_WEBHOOK_SECRET` is a local placeholder until a dashboard webhook exists. Tests and the QA harness always use the fake gateway.

---

## What's needed from the owner

| # | Item | Needed by |
|---|---|---|
| 1 | ~~Create the GitHub repo for `kritex-server` and push~~ ✅ done 2026-10-06. Check that the CI runs are green on GitHub | — |
| 2 | Start **Razorpay KYC** (needs live policy pages + domain) and the Shiprocket signup | Stage 3–5 (long lead time) |
| 3 | Prices, HSN, GST rates, stock, weights: fill `kritex-server/prisma/seed/product-data-template.csv` | Stage 5 |
| 4 | Which products are RETAIL vs B2B-only vs enquiry-only (Q1) | Stage 5 |
| 5 | Legal review of `/legal/*`; fill `src/pages/legal/placeholders.ts` (entity name, address, GSTIN, grievance officer, shipping fee/threshold, dispatch times…) | Stage 5 |
| 6 | CA review of the GST rules (ADR-006, ADR-015) and placeholder HSN/GST values. Specific questions: (a) seller state code (placeholder 27, Maharashtra); (b) apparel/footwear slab ₹2,500 / 5% / 18% and HSN chapters 61–64; (c) slab judged on the post-discount per-unit value (inclusive prices ₹2,625–₹2,950 are borderline); (d) GST on shipping at the highest line rate; (e) per-line rounding, odd paisa to CGST; (f) place of supply = shipping state, also for B2B with GSTIN | Stage 3–4 |
| 8 | Stage 3 checkpoint: place test orders yourself (desktop + phone) and review checkout + the admin order screen. (Stage 2: click through the storefront and `/admin` product editor.) Copy the dev admin password from `kritex-server/.env` (`SEED_ADMIN_PASSWORD`) | Before Stage 4 |
| 10 | Razorpay test keys are in `kritex-server/.env` (2026-10-09). Still to do: create the dashboard webhook (gives the real webhook secret) and set all three on Render before the release (TD-23). Needed for the real-payment part of the Stage 3 gate, and before the staging API can boot | Now |
| 11 | Fix `DATABASE_URL` in `kritex-server/.env` (starts with `""`), and decide whether local dev should use Neon or the docker Postgres on :5433 | Now |
| 9 | Decide which categories are "coming soon" (Base Layers) and confirm category page copy (TD-13, TD-14) | Stage 3 |
| 7 | Confirm the field duty jacket size "XX" (probably a typo) | Any time |
| 8 | **Hosting (ADR-008, free tier):** (a) Neon: create project `kritex` in AWS Singapore and copy the connection string. (b) Render: New → Blueprint → `kritex-server`, then enter `DATABASE_URL` and `CORS_ORIGIN`. (c) If the service URL is not `kritex-server.onrender.com`, update `vercel.json`. (d) Seed: `DATABASE_URL=<neon> npm run import:products` in kritex-server. (e) UptimeRobot on `https://kritex.in/api/v1/health` every 10 min. Full steps: kritex-server README → Deploy | Now (staging) |

## Hosting (2026-10-07)
Render (free, Singapore, Docker) + Neon (free, Singapore) + Vercel for the site. Details in ADR-008.
- kritex-server `29b0eb2`: `Dockerfile` (runs `prisma migrate deploy` on boot), `render.yaml`, `TRUST_PROXY` env,
  prisma CLI moved to dependencies, README deploy guide. Image built and health-checked locally.
- kritex-website: `vercel.json` proxies `/api/*` → `https://kritex-server.onrender.com`.

## Open follow-ups / tech debt
Tracked in [TASKS.md](TASKS.md) → "Tech-debt / follow-ups" (TD-1…TD-30), plus AUTH-6 and COM-16 added to Stages 2–3.

## Next: Stage 4 (Fulfilment + B2B + QA)
4 parallel agents: `server-ops`, `server-b2b`, `web-b2b-ops`, `qa`. See [EXECUTION.md](EXECUTION.md#stage-4-fulfilment--b2b--qa).
Before kick-off: the owner's Stage 3 checkpoint and, ideally, a real Razorpay test payment.
