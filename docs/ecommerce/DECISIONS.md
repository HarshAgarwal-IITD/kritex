# Decision Log

Status values: **Proposed** (Claude's recommendation, awaiting the owner's OK) · **Accepted** · **Superseded by ADR-x** · **Rejected**.
Add new entries at the bottom. Don't delete old ones; mark them superseded.

---

## ADR-001: Build a custom backend (Prisma + Postgres) rather than Medusa/Shopify
**Status:** Accepted · 2026-10-06. *Amended:* the framework is **NestJS**, not Express (owner's decision). See ADR-012.

**Context.** `server/` already existed (Express, TS, Prisma, Postgres, zod). It now lives in its own repo, `kritex-server` (ADR-013). Options considered:

| Option | Pros | Cons |
|---|---|---|
| **A. Custom backend (now NestJS, ADR-012)** | Already started; full control over the B2B quote flow, GST rules and sale-channel restrictions; small catalog (~25 products) | Cart/orders/admin all built by us |
| B. Medusa.js v2 (open-source headless commerce, Node/Postgres) | Cart, orders, promotions and admin dashboard out of the box | Learning curve; Razorpay/Shiprocket/GST via community plugins of varying quality; B2B quotes still custom; heavier to host |
| C. Shopify headless (Storefront API) | Fastest to launch, hosted, payments solved | Monthly fees + transaction fees; India GST and B2B quote customisation limited; tactical-goods policy risk; less control |

**Decision.** A. The catalog is small, the hard parts (B2B quotes, restricted-sale rules, GST invoices) are custom
in every option, and parallel agents can build CRUD-heavy modules quickly against a written contract.
The admin UI reuses the shadcn components already installed.

**Revisit if** the catalog grows past ~500 SKUs or the team wants marketplace sync, in which case Medusa is worth another look.

---

## ADR-002: Repo layout: frontend stays at root, backend in `server/`, npm workspaces
**Status:** Superseded by ADR-013 (separate backend repo) · 2026-10-06. The cleanup bullets (npm only, delete venvs, move the PDF folder) still apply to the website repo.

Moving the frontend into `web/` would churn every import and conflict with in-flight changes. Instead:
- Root `package.json` gets `"workspaces": ["server", "shared"]`.
- New `shared/` package holds **zod schemas + TS types for API requests/responses**, imported by both sides.
  This is the contract that lets frontend and backend agents work in parallel.
- Root script `npm run dev:all` runs Postgres (docker), API and Vite together (via `concurrently`).
- Standardise on **npm** and delete `bun.lock` (both lockfiles exist today).
- Delete `venv/`, `venv2/`. Move `public/Product Catalogue zip file/` out of `public/` (it's publicly served) to `assets-source/` (gitignored or LFS).

---

## ADR-003: Payments: Razorpay (primary), COD optional
**Status:** Accepted · 2026-10-06 (owner accepted defaults)

Razorpay covers UPI, cards, netbanking, wallets and EMI. It has the best India docs, webhooks and test mode. Flow:
server creates a Razorpay Order → frontend opens Checkout.js → server verifies the signature **and** the
`payment.captured` webhook is the source of truth. Cashfree is the fallback if KYC stalls.
COD on/off is a business call (Q4). If enabled, it goes through Shiprocket COD with an order-value cap.
B2B: "Bank transfer / PO" offline payment method, with admin marking the order paid.

**Action now:** start Razorpay business KYC. Website review needs live policy pages and a domain.

---

## ADR-004: Auth: Better Auth (email + password, email OTP), httpOnly cookie sessions
**Status:** Accepted · 2026-10-06 (owner accepted defaults)

- Better Auth has a Prisma adapter and mounts inside NestJS (Express adapter) via `@thallesp/nestjs-better-auth` or a thin custom module that forwards `/api/v1/auth/*` to `toNodeHandler(auth)`. It gives sessions, email verification, password reset,
  email-OTP and phone-OTP plugins, plus an admin/roles plugin.
- Sessions use **httpOnly, Secure, SameSite=Lax cookies**, not JWTs in localStorage.
- Roles: `CUSTOMER`, `B2B_CUSTOMER` (approved business account), `STAFF`, `ADMIN`.
- Replaces the static `ADMIN_API_KEY` currently used for `/api/queries`.
- Nest side: global `AuthGuard` reads the session; `@Public()`, `@Roles('ADMIN')` and `@CurrentUser()` decorators.
- Phone OTP (MSG91) is deferred to post-launch.

Alternative: hand-rolled sessions table + bcrypt. That's fine too, but more security surface for us to own.

---

## ADR-005: Shipping: Shiprocket
**Status:** Accepted · 2026-10-06 (owner accepted defaults)

An aggregator with one API for rates, serviceability by pincode, AWB generation, pickup, tracking webhooks and COD.
v1 shipping pricing is a **flat rate + free shipping above ₹X** (business sets X), so checkout never depends on a live
rate call. Shiprocket is used for fulfilment and tracking. Manual "mark shipped + tracking number" is the fallback.

---

## ADR-006: Tax: GST-inclusive prices, HSN per product, CGST+SGST vs IGST by place of supply
**Status:** Accepted · 2026-10-06 (owner accepted defaults)

- Displayed prices **include GST** (Indian B2C convention). Each product stores `hsnCode` and `gstRate`.
  Note: apparel/footwear GST rates depend on price slabs, so the rate may be computed per variant price. The tax module encodes the rule; it is not hardcoded per product.
- Tax split: seller state == shipping state → CGST + SGST, otherwise IGST.
- B2B checkout captures GSTIN + legal name for an input-tax-credit invoice.
- Invoice numbers are sequential per financial year (e.g. `KTX/2026-27/00001`). Invoices are rendered as PDF server-side.
- **Must be validated by Kritex's CA before launch.**

---

## ADR-007: Stay on Vite SPA, prerender public catalog pages for SEO
**Status:** Accepted · 2026-10-06 (owner accepted defaults)

Migrating to Next.js would mean rewriting routing and data loading across the whole app. Instead:
- Add `react-helmet-async` for per-page title, meta, OG and canonical tags.
- Add JSON-LD `Product` structured data on PDPs.
- At build time, prerender `/`, `/products`, category pages and every PDP (product list fetched from the API at build).
- Generate `sitemap.xml` at build.
- Cart, checkout, account and admin stay client-rendered.

**Revisit** if SEO results disappoint after launch. Migrating to Next.js or TanStack Start later is still possible.

---

## ADR-008: Hosting
**Status:** Accepted · 2026-10-06 (owner accepted defaults)

| Piece | Choice | Why |
|---|---|---|
| Frontend | Cloudflare Pages or Vercel | Static and prerendered, global CDN, preview deploys per PR |
| API | Railway or Render (Docker), Mumbai/Singapore region | Simple, cheap, autoscale later |
| Postgres | Managed (Railway PG / Neon / Supabase), ap-south-1 | Daily backups + PITR |
| Product images | Cloudflare R2 (S3-compatible) + CDN | Admin uploads; current `public/products` migrated by the seed |
| Email | Resend (or AWS SES) | Order emails, OTP, password reset |
| Monitoring | Sentry (web + api), uptime check on `/api/health` | |

Data stays in India regions where possible (DPDP Act alignment).

---

## ADR-009: Frontend state & data
**Status:** Accepted · 2026-10-06 (owner accepted defaults)

- Server state: **TanStack Query** (already installed), with one typed API client in `src/lib/api/` generated from the backend's OpenAPI spec (ADR-013).
- Cart: server-side cart identified by cookie (guest) or user. Optimistic updates via TanStack Query. No Redux.
- Forms: react-hook-form + zod (already installed). Frontend keeps its own small form schemas; the server re-validates everything.
- Admin lives in the same Vite app under `/admin`, lazy-loaded so it doesn't bloat the storefront bundle.

---

## ADR-010: Variants & inventory model
**Status:** Accepted · 2026-10-06 (owner accepted defaults)

Product → Variant (unique SKU per size × colour) → stock tracked **per variant**. Price lives on the variant
(defaulting from the product) so XXL can cost more. Stock is reserved in a DB transaction when an order is created
(`PENDING_PAYMENT`) and released by a job after 30 minutes if unpaid. An `InventoryMovement` table gives an audit trail.

---

## ADR-011: Sale channels per product
**Status:** Accepted · 2026-10-06 (owner accepted defaults; Q1 default applies)

Each product gets `saleChannel: RETAIL | B2B_ONLY | ENQUIRY_ONLY`:
- `RETAIL`: add to cart, anyone can buy.
- `B2B_ONLY`: visible to all, purchasable only by approved B2B accounts. Others see "Request a Quote".
- `ENQUIRY_ONLY`: today's behaviour (enquiry form, no price shown).

This lets us launch even if some items can't be sold publicly.

---

## ADR-012: Backend framework: NestJS
**Status:** Accepted · 2026-10-06 (owner's decision)

The existing Express prototype (one `queries` route), now in the `kritex-server` repo, is **rewritten as a NestJS app** in that repo. The Prisma schema and migration are kept.

| Concern | Choice |
|---|---|
| HTTP platform | `@nestjs/platform-express` (not Fastify). Simplest for Better Auth + Razorpay raw-body webhooks (`NestFactory.create(AppModule, { rawBody: true })`). |
| Structure | One Nest module per domain: `CatalogModule`, `AuthModule`, `CustomersModule`, `CartModule`, `TaxModule`, `CouponsModule`, `CheckoutModule`, `OrdersModule`, `PaymentsModule`, `ShippingModule`, `NotificationsModule`, `InvoicesModule`, `QuotesModule`, `QueriesModule`, `AdminModule` (admin controllers live inside each domain module under `admin/`), plus a global `PrismaModule` and `ConfigModule`. |
| Validation | **`nestjs-zod`**: `createZodDto(schema)` + global `ZodValidationPipe`. The zod schemas live in the backend (`src/<module>/dto/`) and are the source of truth for the OpenAPI spec (ADR-013). No class-validator. |
| API docs | `@nestjs/swagger` with nestjs-zod's OpenAPI patch → `/api/docs` (dev only). Agents can check it against the contract. |
| Config | `@nestjs/config`, env validated by a zod schema at boot |
| DB | `PrismaService extends PrismaClient` (global module); transactions via `prisma.$transaction` |
| Auth | Better Auth (ADR-004) + global `AuthGuard`, `@Public()`, `@Roles()`, `@CurrentUser()` |
| Rate limiting | `@nestjs/throttler` (stricter limits on auth, checkout, queries, quotes) |
| Security headers | `helmet`, CORS allowlist with `credentials: true` |
| Errors | Global exception filter mapping `AppException(code, status)` / Prisma errors / zod errors → `{ error: { code, message, details } }` |
| Logging | `nestjs-pino` (request-id, redaction of auth/payment fields) + Sentry |
| Jobs | `@nestjs/schedule` cron (reservation expiry, quote expiry). Move to BullMQ + Redis only if needed. |
| Events | `@nestjs/event-emitter` for side effects (`order.paid` → email, invoice, stock movement), so modules stay decoupled |
| Testing | **Jest** (Nest default, zero decorator-metadata friction) + `@nestjs/testing` + supertest e2e against a dockerised test DB. The frontend stays on vitest. |
| CLI | `nest g module/controller/service` used by agents for consistent scaffolding |

**Why it suits the parallel-agent plan:** Nest's module boundaries map one-to-one to workstreams, so each agent owns its modules and only touches `app.module.ts` to register them. The integration agent resolves those one-line conflicts.

---

## ADR-013: Separate repos for frontend and backend; contract via OpenAPI
**Status:** Accepted · 2026-10-06 (owner's decision)

**Repos**

| Repo | Local path | Contents |
|---|---|---|
| `kritex` (existing, `github.com/HarshAgarwal-IITD/kritex`) | `projects/kritex/kritex-website` | Vite storefront + `/admin`, Playwright E2E, **planning docs (`docs/ecommerce/`, the single planning hub for both repos)** |
| `kritex-server` (`github.com/HarshAgarwal-IITD/kritex-server`) | `projects/kritex/kritex-server` | NestJS API, Prisma schema/migrations/seed, docker-compose (Postgres), `openapi.json` |

Done 2026-10-06: the untracked `server/` folder was moved to `../kritex-server` and committed as its initial commit (`117f8cc`). `.env` is not committed.

**How the contract crosses the repo boundary**
1. The backend owns the zod schemas (nestjs-zod DTOs). `@nestjs/swagger` builds the OpenAPI document from them.
2. `npm run openapi:export` in `kritex-server` writes **`openapi.json` at the repo root, committed**. CI fails if it's stale.
3. The website runs `npm run api:gen`, which uses `openapi-typescript` to produce `src/lib/api/schema.d.ts` from `../kritex-server/openapi.json` (local) or `$API_URL/api/docs-json` (CI/preview). Requests go through **`openapi-fetch`**, so they're fully typed with zero hand-written types.
4. Contract-first: Stage 1 writes *every* endpoint's DTOs and stub controllers (returning 501) before any feature work. Frontend agents then build against the generated types plus **MSW** mocks while backend agents implement for real.

**Consequences**
- An API change means a backend PR (with the updated `openapi.json`), then a frontend PR that regenerates types. The backend must stay backward-compatible within `/api/v1`: add fields, don't rename or remove them.
- Deploys are independent. The backend deploys first whenever the frontend relies on new endpoints.
- E2E (Playwright, in the website repo) needs both apps: locally via `KRITEX_SERVER_DIR=../kritex-server`; in CI the website workflow checks out `kritex-server` and boots it with docker-compose.
- Agents get worktrees in **the repo they own**. A stage can have backend and frontend agents running simultaneously in different repos.
- Each repo has a `CLAUDE.md` with its conventions. The backend's points to this planning hub.

---

## ADR-014: Stage 0 version pins & contract-consumption rules
**Status:** Accepted · 2026-10-06 (recorded at Stage 0 integration)

- **NestJS 11.x, not 12.** nestjs-zod 5.5 (latest) supports Nest 10/11 and @nestjs/swagger ≤ 11 only.
- **zod pinned `~4.4.3`.** 4.5+ emits nullable schemas that nestjs-zod 5.5 converts wrongly (`organization` became an array in OpenAPI). `src/openapi.spec.ts` guards this.
- **TypeScript 5.9** (typescript-eslint doesn't support TS 7 yet). OpenAPI 3.0.0 (`nullable: true`).
- **Server Jest uses `@swc/jest`.** Type-checking is done separately by `tsc --noEmit`.
- **Generated schema names:** request DTOs keep their names (`CreateQueryDto`); response DTOs get nestjs-zod's `_Output` suffix (`QueryDto_Output`); errors use `ErrorResponseDto`.
  **Rule for the website:** derive types from `paths[...]` (endpoint + status code), not from `components["schemas"][name]`, so renames on the server don't break the frontend. (The bootstrap mocks used guessed component names and broke on the first real regen; fixed at integration.)
- Upgrade path: TD-2 in TASKS.md.

---

## Open questions

**2026-10-06: the owner chose to proceed with the defaults below.** They are now working assumptions. Revisit any of them by
adding a dated note to the row. Q1 and Q2 still need real business input before *launch* (Stage 5), not before building.

The business (Kritex) needs to answer these. Each one notes what it blocks.

| # | Question | Blocks | Default (**in effect**) |
|---|---|---|---|
| Q1 | Which products can legally be sold to the public (vs. forces/govt only)? Are any camouflage patterns or insignia restricted? | Launch | Everything `ENQUIRY_ONLY` until confirmed per product |
| Q2 | Who supplies prices, HSN codes, GST rates, stock levels, SKU codes and product weights/dimensions? | Phase 3 testing, launch | We ship a spreadsheet template; placeholder prices in dev |
| Q3 | Is the launch audience B2C, B2B or both on day one? | Phase 6 priority | Both. B2B = quote flow + GSTIN at checkout. |
| Q4 | COD: yes/no? Max order value? | Phase 3/5 | No COD at launch |
| Q5 | Ship only within India at launch? (Bhutan?) | Shipping, tax | India only |
| Q6 | Return/exchange policy (window, size exchanges, who pays return shipping)? | Legal pages, returns flow | 7-day size exchange, no cash refunds except defects |
| Q7 | Does an existing domain/email/hosting setup or ERP (Tally?) need integrating? | Deploy, Phase 5 | No ERP integration in v1; CSV export of orders |
| Q8 | Who operates the admin day-to-day, and how many staff accounts? | Admin roles | 1 admin + staff role |
| Q9 | Registered business state (for CGST/SGST vs IGST) and GSTIN | Tax module | Placeholder in config |
