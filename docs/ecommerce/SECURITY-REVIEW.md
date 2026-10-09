# Security review (QA-6, Stage 4)

**Scope:** kritex-server `ecommerce` @ `9668c01` (Stage 3 + Stage 4 B2B-1/3/4 merged; the suite also passes on
`3e5975c`, which adds server-ops) and kritex-website `s4/qa` (Stage 3
storefront + admin). Shipping (OPS-3), invoices (OPS-2), notifications (OPS-1) and the B2B web UI were still being built,
so they are covered as **requirements** in the last section, not as reviewed code.
**Method:** code read of every controller, guard, auth config, payment/checkout/coupon/refund path, uploads, CSV export,
storefront rendering of server data. Live probes run against the full-stack harness (`npm run test:e2e`). Most findings
(or their absence) are proven by `e2e/fullstack/security.spec.ts`. In that file, a test marked `test.fail()` is an
**open** finding: it asserts the secure behaviour and is expected to fail until the fix lands.
**Server code was not changed.** Fixes are for the main session at integration.

## Summary

| Severity | Count | IDs |
| --- | --- | --- |
| Critical | 0 | |
| High | 1 | SEC-1 |
| Medium | 2 | SEC-2, SEC-3 |
| Low | 9 | SEC-4 … SEC-11, SEC-21 |
| Info | 9 | SEC-12 … SEC-20 |

The following checks all passed. Each has a test that proves it.
- **Admin authz.** Every documented operation that has a security requirement returns 401 to anonymous callers. All 46
  `/admin/*` operations return 403 to customers. `/admin/users*` returns 403 to STAFF. No admin route is `@Public()`
  (SEC-AUTHZ walks the live OpenAPI document). The global guard denies by default, and `@Roles` on a method wins over
  `@Public` on the class.
- **IDOR.**
  - Orders: `/me/orders/:number` and its cancel action return 404 for another customer's order (account.spec).
  - Addresses: SEC-IDOR.
  - Quotes: SEC-IDOR-QUOTES checks view, list and accept.
  - Carts: cart tokens are always server-minted, 32 random bytes, and httpOnly.
  - Checkout idempotency: the hash includes the owner.
- **Webhooks and payment verify.** A missing signature, a wrong signature, or a signature of a re-serialised body each
  get 400, and the order stays `PENDING_PAYMENT`. Signatures are HMAC over `req.rawBody` and compared in constant time.
  Verify checks the signature and then confirms `orderId` with the gateway (SEC-WEBHOOK).
- **Price tampering.** Client-sent `price`/`unitPrice`/`totals`/`discount` are stripped. A stale `expectedTotal` gets
  409 `PRICE_CHANGED`. Quantity bounds are 1–999, integers only (SEC-PRICE).
- **Coupons.**
  - Per-customer coupons need an account and hold per account; email case is normalised.
  - The global usage limit holds under three concurrent checkouts.
  - The per-customer limit holds under concurrent checkouts of one cart (SEC-COUPON, SEC-COUPON-RACE).
  - Coupon guessing is throttled at 10/min (SEC-THROTTLE).
- **Refunds.** Three concurrent full refunds produce exactly one refund (SEC-REFUND). The order row is locked.
- **Throttling.** Sign-in returns 429 on the 11th attempt per client within a minute. Path variants such as a trailing
  slash, `//`, a case change or `%65` return 404 and do not bypass it.
- **CSRF, CORS and Origin.**
  - Cookie writes from a foreign Origin get 403 `INVALID_ORIGIN`.
  - The CORS preflight from a foreign origin carries no ACAO header.
  - Better Auth refuses sign-in from untrusted origins and refuses off-site `callbackURL`/`redirectTo` (403).
  - All cookies (session and `kritex_cart`) are httpOnly, SameSite=Lax, and Secure in production.
- **Better Auth.**
  - Sign-up for an existing email returns the same 200 shape with no session (no enumeration).
  - An attacker who pre-registers a victim's email loses password access once the victim signs in by OTP (SEC-AUTH).
  - `role`/`phone`/`banned` are `input: false`.
  - Banned users are rejected at session creation and on every request.
  - The admin plugin (impersonation) is not installed.
  - The secret is required in production.
- **Uploads.** Tickets are HMAC-bound to key, content type, size and expiry, and server keys are random UUIDs. SVG and
  HTML are not accepted. Files are served with `nosniff` and an extension-derived type (SEC-UPLOAD).
- **CSV export.** Formula-looking cells are prefixed with `'` (SEC-CSV).
- **Headers.** helmet adds HSTS, `nosniff` and `X-Frame-Options`, and there is no `X-Powered-By`. Swagger is off in
  production. Unknown errors become a generic 500.
- **Secrets.** No secrets in either repo, including git history. The only key-like strings are the AWS SigV4
  documentation test vector (`AKIAIOSFODNN7EXAMPLE`) and placeholders. `.env` is gitignored in both repos. The frontend
  only uses `VITE_API_URL`, `VITE_USE_MOCKS`, `VITE_ASSET_BASE_URL` and `VITE_SITE_URL`. MSW is only loaded when
  `import.meta.env.DEV`.

---

## Findings

### SEC-1 (High): behind the Vercel `/api` rewrite, every client shares a rate-limit bucket

**Location:**
- `kritex-website/vercel.json:4`: `/api/:path*` is rewritten to `kritex-server.onrender.com`.
- `kritex-server/render.yaml:16`: `TRUST_PROXY=1`.
- `kritex-server/src/main.ts`: `app.set('trust proxy', …)`.
- Related backlog item: TD-10.

**Problem:** The request chain is browser → Vercel edge → Render proxy → app. With `trust proxy = 1`, Express sets
`req.ip` to the address appended by the last hop, which is Vercel's egress IP, not the customer's. The throttler keys on
`req.ip`. As a result:
- all storefront users share the global 100/min limit, so the site returns 429s at modest traffic;
- the per-IP auth limits become global. One attacker sending 10 bad sign-ins per minute locks **every** customer out of
  sign-in, and 5 emails per minute does the same for sign-up and password reset.

**Reverse risk:** setting `TRUST_PROXY` higher than the real hop count lets clients spoof `X-Forwarded-For` and get a
fresh bucket per request. The e2e harness does this on purpose (`TRUST_PROXY=1` with no real proxy in front) to give
each spec its own bucket.

**Repro:** in staging, run 11 bad sign-ins from one machine through `https://<site>/api/v1/auth/sign-in/email`, then
sign in from another network. You also get 429.

**Fix:**
- Either call the API directly at `api.kritex.in` (DEP-2) and keep `TRUST_PROXY=1`,
- or keep the rewrite and set `TRUST_PROXY=2`. Vercel overwrites `X-Forwarded-For` with the real client IP, so the second
  hop is trustworthy. Per Vercel's docs, the edge sets this header from the connecting IP; verify it in staging.
- In both cases, log `req.ip` once in staging to confirm. Add a test or health check that asserts it.

### SEC-2 (Medium): product media URLs accept `javascript:`, so staff can plant stored XSS on the PDP

**Location:**
- `kritex-server/src/catalog/dto/admin-catalog.dto.ts:208`: `imageInputSchema.url` is free text.
- `…/admin-catalog.dto.ts:220`: `specSheetInputSchema.url` is free text.
- `kritex-website/src/pages/ProductDetail.tsx:329`: `<a href={assetUrl(sheet.url)}>`.
- `src/features/catalog/view.ts:15`: `assetUrl` passes non-http strings through unchanged.

**Problem:** A STAFF user saves a product with `specSheets[].url = "javascript:…"`. React 18 still renders
`javascript:` hrefs; it only warns. A shopper or admin who clicks the spec sheet runs script on the storefront origin.
With `AUTH_COOKIE_DOMAIN=.kritex.in` and credentialed CORS, that script can call the API as the victim. If the victim is
an ADMIN, it can call `PATCH /admin/users/:id {role:'ADMIN'}`, so this is a STAFF → ADMIN escalation. Swatch URLs
(`options[].swatches`) are also free text.

**Repro:** `SEC-XSS-URL` (open). `POST /admin/products` with that spec sheet returns 201.

**Fix:**
- Server: restrict every media URL to `https://…` or a root-relative `/…` path, for example with
  `z.string().regex(/^(https:\/\/|\/(?!\/))/)`. This covers images, spec sheets and swatches.
- Web, defence in depth: in `assetUrl`, return `""` for anything that is not `http(s):` or `/`.

### SEC-3 (Medium): anyone can hoard stock with unpaid orders

**Location:**
- `src/checkout/checkout.controller.ts:55`: throttle of 10/min per IP.
- `src/cart/dto/cart.dto.ts:8`: `MAX_LINE_QUANTITY = 999`.
- `src/config/env.schema.ts:118`: `ORDER_PAYMENT_TIMEOUT_MINUTES` defaults to 30.

**Problem:** A guest can add up to 999 units per line, then `POST /checkout` without paying. The stock stays reserved
for 30 minutes. One request per product per half hour empties the sellable catalog for everyone. IP rotation, or SEC-1,
makes this trivial. Bank-transfer orders hold stock for `BANK_TRANSFER_HOLD_DAYS`, but only approved B2B users can place
them.

**Repro (verified live):** create a product with stock 3. Guest A runs `POST /cart/items {quantity: 3}` and then
`POST /checkout`, and never pays. Guest B's `POST /cart/items {quantity: 1}` then gets 409 `INSUFFICIENT_STOCK`
("This item is out of stock") for the next 30 minutes.

**Fix:**
- Cap the quantity per line and per order for guests and non-B2B users (for example 10 per variant; larger quantities go
  through RFQ).
- Cap open unpaid orders per email, device and IP.
- Shorten the hold to about 15 minutes, and only reserve once the Razorpay order exists.
- Alert on a high reserved-to-stock ratio.

### SEC-4 (Low): verification and reset tokens are written to the request log

**Location:** `src/app.module.ts:59-63`. The pino `req` serializer logs `req.url` with the query string.

**Problem:** Production logs on Render, and any log drain or Sentry later, contain:
- `GET /api/v1/auth/verify-email?token=<JWT>`;
- `GET /api/v1/auth/reset-password/<token>?callbackURL=…`, used for password resets and for staff invites (valid 3 days).

The reset and invite tokens are normally consumed within seconds of being logged. A verify token, once used, is refused
on replay (probed: 403). That leaves a short window.

**Fix:** redact these in the serializer. Strip query strings, and replace path segments after `/reset-password/` and
`/uploads/local/` with `[redacted]`.

### SEC-5 (Low): `POST /checkout` and `/checkout/quote` skip the guest-cookie Origin check that `/cart` does

**Location:** `src/checkout/checkout.controller.ts:30-33`, compared with `src/cart/cart.controller.ts:194-206`.

**Problem:** The AuthGuard's Origin check only runs when a session cookie is present. A guest's `kritex_cart` cookie is
protected by SameSite=Lax only. Lax still sends the cookie from same-site origins, which includes any `*.kritex.in`
subdomain (previews, marketing pages).

**Fix:** reuse the cart controller's `context()` Origin check in the checkout controller, or move it into a small guard
applied to both.

### SEC-6 (Low): exchange requests accept any active variant

**Location:** `src/orders/orders.service.ts:97-110`.

**Problem:** `exchangeVariantId` only has to be an active variant. It can belong to another product, including a more
expensive one. Staff must catch this by hand.

**Fix:** require the exchange variant to belong to the same product as the returned item, and to have the same price or
be within an allowed difference.

### SEC-7 (Low): the captured amount is not checked against the order total

**Location:**
- `src/orders/order-lifecycle.service.ts:245-300` (`confirmGatewayPayment`).
- `src/payments/payments.service.ts:81`.

**Problem:** A captured payment marks the order PAID whatever `amount` the gateway or webhook reports. Razorpay orders
have a fixed amount, so this is defence in depth only. It would matter if partial payments were enabled on the Razorpay
account, or if the payment row were linked to the wrong gateway order.

**Fix:**
- When `amount !== order.totals.total` or `currency !== 'INR'`, record the payment but do not mark the order PAID. Add an
  internal event and an alert.
- Keep partial payments disabled on the Razorpay dashboard.

### SEC-8 (Low): staff permissions are broad

**Location:** every `@Roles('STAFF','ADMIN')` controller (`orders/admin`, `coupons/admin`, `customers/admin`).

**Problem:** STAFF can:
- refund and cancel any order;
- create coupons, including 100% off;
- approve B2B profiles, which grants tier pricing and bank-transfer checkout;
- export every order with PII (`/admin/orders/export.csv`, no row limit).

A compromised or malicious STAFF account can move money and give away goods. This overlaps TD-26.

**Fix:** make refunds above a threshold, coupon creation and B2B approval ADMIN-only. Add an audit trail on coupons and
approvals; `OrderEvent` already covers orders. Rate-limit or page the CSV export.

### SEC-9 (Low): JSON-LD is not escaped for HTML; this becomes stored XSS once pages are prerendered (SEO-1)

**Location:** `kritex-website/src/components/Seo.tsx:55-58`. The script contains `{JSON.stringify(block)}`, which holds
product names and descriptions.

**Problem:** At runtime, Helmet sets the script text through the DOM, so this is safe today. Once SEO-1 prerenders PDPs
to static HTML, a product name containing `</script><script>…` breaks out of the tag. Writing product names needs STAFF.

**Fix:** serialise with `JSON.stringify(block).replace(/</g, "\\u003c")`.

### SEC-10 (Low): the storefront sends no CSP and no frame-ancestors

**Location:** `kritex-website/vercel.json` has no `headers` block. Related: TD-30.

**Problem:**
- Account, checkout and cancel pages can be framed, which allows clickjacking, for example "Cancel order".
- There is no CSP to limit the damage from SEC-2 or SEC-9.

**Fix:** add these headers in `vercel.json`:
- `X-Frame-Options: DENY`, or CSP `frame-ancestors 'none'`;
- a CSP allowing `self`, `checkout.razorpay.com` (script and frame), `api.razorpay.com`, the asset CDN and Google Fonts;
- `Referrer-Policy: strict-origin-when-cross-origin`.

### SEC-11 (Low): production dependency advisories (`npm audit --omit=dev`)

**Server:** 6 advisories (4 high, 2 moderate).
- `nodemailer` ≤10.0.5, high, several advisories. It is only used when `SMTP_HOST` is set. OPS-1 replaces it with
  Resend; otherwise upgrade to ≥10.0.16.
- `deepmerge-ts`, high, reached through the `prisma` CLI. Only used at deploy and migrate time.
- `js-yaml`, moderate, reached through `@nestjs/swagger`. Swagger is disabled in production; this is TD-2.

**Web:** 15 advisories (11 high, 4 moderate).
- Nearly all are in the **build-time** chain: tailwind, postcss, fast-glob, picomatch, braces, nanoid, source-map-js.
  These are not shipped to browsers. `npm audit fix` clears most of them.
- `react-router-dom` 6.30.3, moderate, open-redirect advisories. `safeNext()` already rejects `//` and `/\`, and admin
  `next` must start with `/admin`. Still upgrade to the patched 6.x.
- `lodash` via recharts, high. `_.template` and the prototype-pollution paths are not reachable with user input.

**Fix:** run `npm audit fix` in the website. Upgrade nodemailer, or drop it with OPS-1. Track the Prisma and swagger
upgrades as TD-2 and TD-8.

### SEC-12 (Info): per-account coupon limits can be farmed with plus-address aliases

Per-customer usage is counted by `userId`. Guests get `COUPON_LOGIN_REQUIRED`. New accounts such as `me+1@gmail.com`
each verify into the same inbox, so each one gets a fresh allowance. This is inherent to per-account limits. If it
matters, normalise `+tag`, and dots for Gmail, when counting, or tie usage to the phone number.

### SEC-13 (Info): requests without an Origin header pass the CSRF check

`src/common/guards/auth.guard.ts:71`. This is a deliberate choice for non-browser clients. Browsers always send Origin
on cross-site POST, and SameSite=Lax keeps the cookie off cross-site POSTs, so this is acceptable. Optionally, fall back
to checking `Sec-Fetch-Site: cross-site`.

### SEC-14 (Info): the fake gateway's public secrets are only blocked by the production check

`src/payments/gateway/fake.gateway.ts:16` sets `FAKE_WEBHOOK_SECRET = 'fake_webhook_secret'`. In addition, verify
accepts any `pay_fake_*` id with signature `fake`. `env.schema.ts` refuses to boot in production without
`RAZORPAY_KEY_ID`, which is good. Any non-production deployment that is reachable from the internet (staging with
`NODE_ENV=development`) can mark orders paid for free. Keep staging on `NODE_ENV=production` with Razorpay test keys, as
`render.yaml` already does.

### SEC-15 (Info): order numbers are sequential

`KTX-100001` and onward. Order numbers leak sales volume. Every endpoint keyed by order number must check ownership.
`/me/orders` does, and tracking requires the email. Keep that true for invoices and tracking (see requirements below).

### SEC-16 (Info): webhook events are not deduplicated by event id

TD-26. Handlers are idempotent per provider payment or refund id, and a replayed signed event is harmless. Keep it that
way for Shiprocket.

### SEC-17 (Info): the session cookie is shared with every subdomain in production

`AUTH_COOKIE_DOMAIN=.kritex.in`. A dangling or compromised subdomain receives session cookies on its own requests. Keep
the DNS inventory tight, or serve the API at the same origin and drop the domain attribute.

### SEC-18 (Info): guests can use any email address

At checkout and RFQ, a guest can enter any email. Order and quote notifications (OPS-1) will then go to an arbitrary
inbox, which allows harassment or spam. A signed-in user can also file an RFQ under someone else's email, and it shows
in that person's quote list (`quotes.service.ts:121`). Consider:
- rate-limiting per email;
- not including free text in those emails;
- for signed-in users, using the account email for the RFQ.

### SEC-19 (Info): the throttler and the upload driver keep state per instance

TD-1 (throttler) and TD-18 (upload driver) are already tracked. R2 presigned PUTs don't enforce size.

### SEC-20 (Info): a CSV injection edge case

`csvCell` covers `= + - @ \t \r`. Some guidance also prefixes cells that start with `|` or `%`, and fullwidth `＝`.
This is optional.

### SEC-21 (Low): Prisma Client loads `kritex-server/.env` at runtime, and `ConfigService.get()` falls back to `process.env`

**Location:**
- `node_modules/.prisma/client/index.js`: `relativeEnvPaths` points at the repo `.env`, which is loaded when
  `new PrismaClient()` runs.
- `src/config/config.module.ts`: `ConfigModule.forRoot({ validate })`.

**Problem:** Variables that are missing from the process env are filled from the server's `.env` *after* boot-time
validation, and `config.get()` returns them. Found live: the e2e API was started with an explicit allowlisted env and no
`RAZORPAY_*`, but it still used the real `rzp_test_…` keys from the developer `.env`.
- Risk 1: a `.env` copied into an image or deploy directory silently supplies config, such as payment keys or a second
  `DATABASE_URL_DEV`, and that config never went through the env schema.
- Risk 2: tests or tools that think they are running the fake gateway can hit real Razorpay.

**Repro:** start `dist/main.js` without `RAZORPAY_*` from a directory with no `.env` while `kritex-server/.env` has keys.
`POST /checkout` then returns `razorpay.keyId = rzp_test_…`. The harness now hides those files with
`scripts/e2e-api-preload.cjs`, and SEC-WEBHOOK asserts `keyId === "rzp_fake"`.

**Fix:**
- Make sure the Docker image never contains `.env`: add it to `.dockerignore`, and check that `COPY . .` doesn't include
  it.
- In `AppConfigService.get`, read only the validated config (`this.config.get(key, { infer: true })` with
  `ConfigModule.forRoot({ ignoreEnvVars: true })`, or keep a validated `Env` object and read from it), so late
  `process.env` writes can't change config.
- Prisma 7 / TD-8 (`prisma.config.ts`) removes the automatic dotenv loading.

---

## Requirements for Stage 4 work still in progress

Check these at integration:
- **Shiprocket webhook (OPS-3).**
  - Verify the shared token or signature in constant time, over the raw body.
  - Accept only known AWBs.
  - Make it idempotent per `(awb, status, timestamp)`.
  - Never let it move an order backwards, for example DELIVERED → SHIPPED.
  - Add it to the SEC-AUTHZ walk: it is `@Public`, so prove it with a forged-payload test like SEC-WEBHOOK.
- **Public tracking `GET /orders/:number/tracking?email=` (OPS-3/OPS-5).**
  - Return an identical 404 for a wrong email and for an unknown number.
  - Keep the 20/min throttle.
  - Return no address or phone.
- **Invoices `GET /orders/:number/invoice` (OPS-2).**
  - Allow only the owner or STAFF.
  - Use short-lived signed URLs with object keys that can't be guessed.
  - Extend SEC-IDOR to cover them.
- **Notifications (OPS-1).**
  - Escape customer-provided text in React Email templates.
  - Don't put tokens in subjects.
  - Never log full email bodies in production. `MailService` already logs only the tag outside development; keep that.
- **Quotes (B2B-1/B2B-5).** IDOR is proven (SEC-IDOR-QUOTES). When B2B-2 lands, check that quote accept ignores any
  client-sent prices or quantities, which matches the current DTO.

## How to re-run

```
npm run test:e2e -- security.spec.ts      # boots the stack, runs the security checks
```
