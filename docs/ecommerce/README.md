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

## Current status (2026-10-07)

- **Stage:** ✅ Stages 0, 1 and 2 complete (Stage 2 gate passed 2026-10-07). 🔄 **Stage 3 (Commerce core) in progress** (started 2026-10-07).
- **Now:** Stage 3's 4 agents are running: `server-cart`, `server-checkout` (worktrees in `../kritex-server-wt/s3-*`, branches `s3/server-*`), `web-commerce`, `web-admin-orders` (worktrees in `.claude/worktrees/s3-*`).
- **Decisions:** all ADRs Accepted (latest ADR-015). Open questions run on defaults (owner, 2026-10-06). Q1/Q2 real data is still needed before launch.
- **Human checkpoint (Stage 2):** click through the storefront (`/products`, a PDP) and the admin product editor (`/admin`, seeded admin from `SEED_ADMIN_EMAIL`/`SEED_ADMIN_PASSWORD` in `kritex-server/.env`). Send the GST questions in PROGRESS.md to the CA (ADR-006).
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
