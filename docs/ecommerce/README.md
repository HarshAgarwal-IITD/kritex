# Kritex → Ecommerce: Planning Hub

This folder is the single source of truth for turning the Kritex marketing/catalog site
into a full ecommerce platform. Update these files as decisions are made and work lands.

| File | Purpose |
|---|---|
| [PROGRESS.md](PROGRESS.md) | **What has been built so far**: per-stage log, how to run, owner to-dos |
| [PLAN.md](PLAN.md) | Master plan: goals, scope, phases, milestones, exit criteria |
| [DECISIONS.md](DECISIONS.md) | Decision log (ADR-style) + open questions awaiting the business |
| [ARCHITECTURE.md](ARCHITECTURE.md) | System design, data model, API contract, folder layout |
| [EXECUTION.md](EXECUTION.md) | **Stage-by-stage execution plan**: which agents run in which repo, gates, human checkpoints |
| [CONTRACT-NOTES.md](CONTRACT-NOTES.md) | Judgment calls made while writing the v1 API contract (Stage 1) |
| [TASKS.md](TASKS.md) | Task inventory per stage, IDs, dependencies, status |

**Repos:** `kritex-website` (this repo: storefront, admin, planning hub; github.com/HarshAgarwal-IITD/kritex) · `../kritex-server` (NestJS API; github.com/HarshAgarwal-IITD/kritex-server). See ADR-013.

## Current status (2026-10-11)

- **Live:** stages 0–4 are in production since 2026-10-10: API `https://api.kritex.in` (Render, Neon), storefront `https://www.kritex.in` (Vercel). `main` = `ecommerce` in both repos; both hosts auto-deploy `main`.
- **Since the release:** verified-login enquiries (ADR-018), Google sign-in + fill-then-log-in enquiries + navbar (ADR-019), no guest orders (ADR-020), login-only tracking + failed-payment stock release + quote alerts (ADR-021), RL-2 limits + enquiry alerts + legal pages final (ADR-022). Seller: M/s Garg Sales Corporation (`kritex-server/src/config/seller.ts`). Test purchase, shipping, Razorpay webhook/KYC, Resend and Google sign-in are done by the owner.
- **Owner to-dos:** [PROGRESS.md → What's needed from the owner](PROGRESS.md#whats-needed-from-the-owner-updated-2026-10-11). Next engineering stage: Stage 5 (Launch prep).
- **Run locally:** `cd ../kritex-server && docker compose up -d && npm run start:dev` (API :4000, docs at /api/docs), then `npm run dev` here (:8080, proxies /api).

## Where we're starting from

- **Frontend:** Vite + React 18 + TS + Tailwind + shadcn/ui + React Router + TanStack Query (installed, unused).
- **Catalog:** about 25 products hardcoded in `src/data/{tacticalFootwear,combatApparel,loadBearing}.ts`,
  images in `public/products/`. No prices, SKUs or stock.
- **Conversion:** the "Enquiry" button opens `mailto:procurement@kritex.in`.
- **Backend:** moved out to its own repo `../kritex-server` (commit `117f8cc`). Still the Express prototype (Prisma + Postgres,
  `POST/GET /api/queries` with a static admin API key). It will be **rewritten in NestJS** (ADR-012) in Stage 0.
- **Ops:** no CI, no deploy config, no tests beyond the example. Stray `venv/`, `venv2/` and
  `public/Product Catalogue zip file/` (raw PDFs, publicly served) are in the working tree.

## How to update these docs

- New decision → add an entry to DECISIONS.md (don't rewrite history; mark superseded entries).
- Task done → tick it in TASKS.md and add the PR/commit hash.
- Scope change → edit PLAN.md and note it in the changelog at the bottom of PLAN.md.
