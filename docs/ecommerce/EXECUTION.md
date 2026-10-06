# Execution Plan: Stages

The build runs in **7 stages**. Each stage has:
- **parallel agents**, each in its own git worktree of the repo it owns, on branch `s<N>/<agent-name>`
- an **integration step** (run by the main session): merge branches, regenerate the contract, run all checks, update docs
- a **gate**: objective checks that must pass before the next stage
- a **human checkpoint**: what the owner reviews or decides, plus real-world tasks to start

Repos: **server** = `projects/kritex/kritex-server` · **web** = `projects/kritex/kritex-website` (ADR-013).
Task IDs refer to [TASKS.md](TASKS.md).

```
Stage 0  Foundation            ██ 2 agents   (server-foundation, web-foundation)
Stage 1  Contract + Data       ███ 3 agents  (server-db, server-contract, web-content)
Stage 2  Catalog + Identity    █████ 5 agents (server-catalog, server-auth, server-pricing, web-catalog, web-admin-catalog)
Stage 3  Commerce core         ████ 4 agents (server-cart, server-checkout, web-commerce, web-admin-orders)
Stage 4  Fulfilment + B2B + QA ████ 4 agents (server-ops, server-b2b, web-b2b-ops, qa)
Stage 5  Launch prep           ███ 3 agents  (deploy, web-seo-perf, data-import)
Stage 6  Go-live               main session + owner (soft launch → public launch)
```

---

## Stage 0: Foundation
**Goal:** both repos boot, lint, typecheck, test and build in CI. Nest replaces Express. Nothing user-visible changes.

| Agent | Repo | Tasks |
|---|---|---|
| `server-foundation` | server | F-S1…F-S7 |
| `web-foundation` | web | F-W1…F-W6 |

**Gate**
- `kritex-server`: `docker compose up -d && npm run start:dev` serves `/api/v1/health` and `/api/v1/queries`. Jest unit + e2e pass. `openapi.json` exported. CI green.
- `kritex-website`: `npm run dev` works, the contact form still submits through the Vite proxy, `npm run api:gen` produces `schema.d.ts`, CI green.

**Human checkpoint**
- [ ] Create the GitHub repo for `kritex-server` and push (`git remote add origin … && git push -u origin main`)
- [ ] Answer open questions Q1–Q9 (DECISIONS.md), or accept the defaults
- [ ] **Start Razorpay KYC** and Shiprocket signup (long lead time)
- [ ] Start collecting prices / HSN / stock / weights (Q2)

---

## Stage 1: Contract + Data
**Goal:** the full v1 API exists *on paper and as stubs*, and the database holds the real catalog.
After this stage, frontend and backend agents can work fully in parallel.

| Agent | Repo | Tasks |
|---|---|---|
| `server-db` | server | D-1…D-5 |
| `server-contract` | server | K-1…K-4: zod DTOs for **every** endpoint in ARCHITECTURE.md §4, stub controllers returning 501, module skeletons registered, `openapi.json` |
| `web-content` | web | C-1…C-4: policy pages, footer links, `<Seo>` component |

File ownership: `server-db` owns `prisma/**`. `server-contract` owns `src/*/dto/**`, `src/*/*.controller.ts` and `src/*/*.module.ts`. Neither touches the other's files.

**Gate**
- `prisma migrate dev` applies cleanly. The seed loads every product currently on the site, with variants per size × colour.
- `openapi.json` covers every endpoint in ARCHITECTURE.md §4. The website regenerates types without errors.
- Policy pages render and are linked from the footer.

**Human checkpoint:** review the generated API docs (`/api/docs`) and policy drafts; send the policy drafts to legal.

---

## Stage 2: Catalog + Identity
**Goal:** the site reads its catalog from the API (no visual regression), customers and staff can log in,
staff can manage products, and the pricing/tax engine exists as tested pure logic.

| Agent | Repo | Tasks |
|---|---|---|
| `server-catalog` | server | CAT-1…CAT-7 (public catalog + admin product/category/upload endpoints) |
| `server-auth` | server | AUTH-1…AUTH-5 |
| `server-pricing` | server | PR-1…PR-5: tax, shipping fee, coupons validation, totals calculator. **Pure services, no HTTP**, exhaustive unit tests |
| `web-catalog` | web | WEB-CAT-1…WEB-CAT-6 (builds against MSW, then switches to the real API) |
| `web-admin-catalog` | web | ADM-1…ADM-4 |

**Gate**
- Every existing product URL renders from the API. Before/after screenshots match on desktop + mobile (Playwright screenshot diff).
- `src/data/*.ts` is no longer imported by any page.
- Signup → verify email → login → `/me` works. Admin can log in, create a product with variants and see it on the storefront.
- Pricing engine unit tests cover intra/inter-state GST, slab boundaries, coupons and free-shipping threshold.

**Human checkpoint:** click through the storefront and the admin product editor. Confirm the GST rules with your CA (ADR-006).

---

## Stage 3: Commerce core
**Goal:** real money flow in test mode: cart → checkout → Razorpay → order → admin sees and manages it.

| Agent | Repo | Tasks |
|---|---|---|
| `server-cart` | server | COM-1, COM-2, COM-5 (cart, merge, coupon endpoints) |
| `server-checkout` | server | COM-7…COM-14 (checkout, Razorpay, webhook, reservations, order state machine, customer + admin order endpoints) |
| `web-commerce` | web | WEB-CART-1, WEB-CHK-1, WEB-CHK-2, WEB-ACC-1…3 |
| `web-admin-orders` | web | ADM-5…ADM-9 |

**Gate**
- Playwright full-stack: guest adds 2 variants → applies coupon → checks out → pays with Razorpay test card/UPI → confirmation page → order PAID in admin → stock decremented.
- Webhook replay is idempotent. An unpaid order releases stock after the timeout.
- Concurrency test: 2 buyers race for the last unit, exactly one succeeds.

**Human checkpoint:** place test orders yourself (desktop + phone). Review the checkout UX and the admin order screen.

---

## Stage 4: Fulfilment + B2B + QA
**Goal:** orders get shipped, invoiced and emailed. Bulk buyers can request and accept quotes. The whole system is tested and security-reviewed.

| Agent | Repo | Tasks |
|---|---|---|
| `server-ops` | server | OPS-1…OPS-3 (notifications, GST invoice PDF, Shiprocket) |
| `server-b2b` | server | B2B-1, B2B-3 (server side), B2B-4 |
| `web-b2b-ops` | web | B2B-2, B2B-3 (UI), B2B-5, OPS-4, OPS-5 |
| `qa` | both (read-mostly; writes `web/e2e/**` and test files) | QA-1…QA-6 |

**Gate**
- Paid order → confirmation email + invoice PDF → admin generates AWB → tracking page updates from the webhook (Shiprocket staging/mock).
- RFQ → admin quote → buyer accepts → order (online or bank transfer).
- Full E2E suite green in website CI (boots kritex-server). Security review has no open high/critical findings.

**Human checkpoint:** CA approves the invoice format. Staff walk-through of fulfilment. Decide the launch catalog (which products are `RETAIL`).

---

## Stage 5: Launch prep
**Goal:** production infrastructure, real data, SEO and performance.

| Agent | Repo | Tasks |
|---|---|---|
| `deploy` | both | DEP-1…DEP-5 |
| `web-seo-perf` | web | SEO-1…SEO-4 |
| `data-import` | server | C-5, C-6: import the real pricing CSV, set saleChannel, verify every product |

**Gate**
- Staging environment (`staging.kritex.in` / `api-staging.kritex.in`) passes the full E2E suite.
- Lighthouse mobile ≥ 90 on home, listing and PDP. Sitemap and JSON-LD validate.
- Backup restore drill done. Sentry receives errors from both apps.

**Human checkpoint:** final legal sign-off on policies (C-7). Razorpay live activation. Staff accounts created.

---

## Stage 6: Go-live
1. **Soft launch:** production deploy with live keys, store open only to staff/friends. Place real ₹1-level orders, refund them, ship one real parcel.
2. **Public launch:** remove the soft-launch gate, submit the sitemap to Search Console, announce.
3. **Hypercare (2 weeks):** daily check of Sentry, failed payments, stuck orders (`PENDING_PAYMENT` > 1h), low stock.
4. **Retro:** update the docs and groom the post-v1 backlog (PLAN.md §2 out-of-scope).

---

## How each stage is run (protocol)

1. **Kick-off:** the main session confirms the previous gate passed, updates README status, and marks the stage's tasks `[~]` in TASKS.md.
2. **Spawn:** one agent per row, `isolation: worktree` in its repo, all launched in a single message so they run in parallel.
3. **Integration:** when all agents finish, the main session:
   - merges backend branches → regenerates `openapi.json` → merges frontend branches → `npm run api:gen`
   - runs lint, typecheck, unit tests, e2e in both repos and fixes conflicts (usually `app.module.ts`, `App.tsx` routes)
   - ticks tasks in TASKS.md with commit hashes, records any new decisions in DECISIONS.md
4. **Gate check:** run the gate checks; anything failing becomes a fix-up task before moving on.
5. **Checkpoint:** report to the owner: what shipped, how to try it, what's needed from them.

### Agent prompt template
```
You are the <agent-name> agent for Stage <N> of the Kritex ecommerce build.
Repo: <absolute path>. Work only in this repo, on branch s<N>/<agent-name>.
Read first: <repo>/CLAUDE.md, kritex-website/docs/ecommerce/{ARCHITECTURE,DECISIONS}.md.
Your tasks (from TASKS.md): <IDs + text>.
You own ONLY these paths: <paths>. Do not edit anything else; if you need a change elsewhere,
note it in your final report instead.
Definition of done: <task-specific checks>; lint + typecheck + tests pass; commit with clear messages.
Final report: what you built, files touched, commands to verify, deviations from the contract, follow-ups.
```
