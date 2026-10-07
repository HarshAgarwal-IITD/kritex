# Progress Log

This is the running record of what has been built, where it lives, how to run it, and what's still open.
Add a new section at the end of each stage.

**Status as of 2026-10-07:** Stages 0, 1 and 2 are complete. **Stage 3 (Commerce core) in progress** (started 2026-10-07).

| Stage | Status | Integration commit |
|---|---|---|
| Planning | ✅ | `c05c73e` (docs) |
| 0 Foundation | ✅ gate passed | server `6a900da` · web `782488e` |
| 1 Contract + Data | ✅ gate passed | server `bfd1d38` · web `428f63c` |
| 2 Catalog + Identity | ✅ gate passed | server `9a4aa64` · web `6520bbf` |
| 3 Commerce core | 🔄 in progress | — |
| 4–6 | not started | — |

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
| 8 | Stage 2 checkpoint: click through the storefront and `/admin` product editor. Copy the dev admin password from `kritex-server/.env` (`SEED_ADMIN_PASSWORD`) | Before Stage 3 |
| 9 | Decide which categories are "coming soon" (Base Layers) and confirm category page copy (TD-13, TD-14) | Stage 3 |
| 7 | Confirm the field duty jacket size "XX" (probably a typo) | Any time |
| 8 | **Hosting (ADR-008, free tier):** (a) Neon: create project `kritex` in AWS Singapore and copy the connection string. (b) Render: New → Blueprint → `kritex-server`, then enter `DATABASE_URL` and `CORS_ORIGIN`. (c) If the service URL is not `kritex-api.onrender.com`, update `vercel.json`. (d) Seed: `DATABASE_URL=<neon> npm run import:products` in kritex-server. (e) UptimeRobot on `https://kritex.in/api/v1/health` every 10 min. Full steps: kritex-server README → Deploy | Now (staging) |

## Hosting (2026-10-07)
Render (free, Singapore, Docker) + Neon (free, Singapore) + Vercel for the site. Details in ADR-008.
- kritex-server `29b0eb2`: `Dockerfile` (runs `prisma migrate deploy` on boot), `render.yaml`, `TRUST_PROXY` env,
  prisma CLI moved to dependencies, README deploy guide. Image built and health-checked locally.
- kritex-website: `vercel.json` proxies `/api/*` → `https://kritex-api.onrender.com`.

## Open follow-ups / tech debt
Tracked in [TASKS.md](TASKS.md) → "Tech-debt / follow-ups" (TD-1…TD-22), plus AUTH-6 and COM-16 added to Stages 2–3.

## Next: Stage 3 (Commerce core)
4 parallel agents: `server-cart`, `server-checkout`, `web-commerce`, `web-admin-orders`.
See [EXECUTION.md](EXECUTION.md#stage-3-commerce-core) for the gate and prompts. Before kick-off: TD-19 (checkout line tax fields) and the owner checkpoint above.
