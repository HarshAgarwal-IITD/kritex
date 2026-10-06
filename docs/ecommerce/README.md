# Kritex → Ecommerce: Planning Hub

This folder is the single source of truth for turning the Kritex marketing/catalog site
into a full ecommerce platform. Update these files as decisions are made and work lands.

| File | Purpose |
|---|---|
| [PLAN.md](PLAN.md) | Master plan: goals, scope, phases, milestones, exit criteria |
| [DECISIONS.md](DECISIONS.md) | Decision log (ADR-style) + open questions awaiting the business |
| [ARCHITECTURE.md](ARCHITECTURE.md) | System design, data model, API contract, folder layout |
| [EXECUTION.md](EXECUTION.md) | **Stage-by-stage execution plan**: which agents run in which repo, gates, human checkpoints |
| [TASKS.md](TASKS.md) | Task inventory per stage, IDs, dependencies, status |

**Repos:** `kritex-website` (this repo: storefront, admin, planning hub) · `../kritex-server` (NestJS API). See ADR-013.

## Current status (2026-10-06)

- **Stage:** pre-Stage 0 (planning done, backend repo created locally). No ecommerce code written yet.
- **Blocking:** open questions Q1–Q6 in [DECISIONS.md](DECISIONS.md#open-questions). Q1 (who can buy what) and Q2 (pricing data) block launch, not the start of the build.
- **Next step:** confirm the proposed decisions, create the GitHub remote for `kritex-server`, then run Stage 0 (see [EXECUTION.md](EXECUTION.md)).

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
