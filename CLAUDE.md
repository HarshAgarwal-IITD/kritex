# Kritex website

Storefront (and later `/admin`) for Kritex. The backend is a separate repo, `../kritex-server` (NestJS).
Planning docs for **both** repos live in `docs/ecommerce/` (PLAN, ARCHITECTURE, DECISIONS, TASKS). Read them before feature work.

## Stack
- Vite + React 18 + TypeScript, Tailwind + shadcn/ui (`src/components/ui`), framer-motion
- React Router, TanStack Query for **all** server state (no Redux, no ad-hoc fetch in components)
- Forms: react-hook-form + zod (frontend keeps its own small schemas; the server re-validates)
- API: `openapi-fetch` client typed from the backend's OpenAPI spec (`src/lib/api`)
- Tests: vitest + Testing Library + MSW. Playwright for E2E.
- Package manager: **npm** only (`package-lock.json`). Node 22.

## Commands
```
npm run dev          # :8080, proxies /api -> http://localhost:4000 (kritex-server)
VITE_USE_MOCKS=true npm run dev   # run against MSW mocks instead of the backend
npm run lint
npm run typecheck
npm test             # vitest run
npm run build
npm run api:gen      # regenerate src/lib/api/schema.d.ts from $API_SPEC
                     # (default ../kritex-server/openapi.json; may be a URL like
                     #  http://localhost:4000/api/docs-json)
```
CI (`.github/workflows/ci.yml`) runs lint, typecheck, test, build.

## Folder conventions (see docs/ecommerce/ARCHITECTURE.md §2)
- `src/features/<domain>/` - catalog, cart, checkout, account, quote: components + hooks per domain
- `src/admin/` - admin app, lazy-loaded at `/admin`
- `src/pages/` - route pages (`src/pages/legal/` for policy pages)
- `src/lib/api/` - `schema.d.ts` (GENERATED), `client.ts` (openapi-fetch `api` + `ApiError`/`toApiError`), query hooks
- `src/mocks/` - MSW handlers (`handlers.ts`), browser worker (`browser.ts`, dev), node server (`server.ts`, vitest)
- `src/components/ui/` - shadcn primitives; don't restyle them

## Rules
- **Never hand-edit `src/lib/api/schema.d.ts`** - run `npm run api:gen`. The generated file is committed so builds never need the server.
  Until kritex-server publishes `openapi.json`, it is generated from `scripts/bootstrap-openapi.json`.
- Call the API only through `api` from `@/lib/api/client` (wrapped in TanStack Query hooks). Base URL is
  `import.meta.env.VITE_API_URL ?? ""`; leave it unset in dev (same origin via the Vite proxy).
  Errors follow `{ error: { code, message, details? } }`; convert with `toApiError(error, response)`.
- When adding an endpoint usage, add/update its MSW handler in `src/mocks/handlers.ts` and test against it.
- **Money is integer paise** end-to-end. Format only in the UI with
  `new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" })` (divide by 100). Never send prices to the server.
- **Keep the existing visual design** (typography, colours, spacing, motion). New UI reuses existing patterns and shadcn components.
- `/api/v1` is additive-only; an API change starts with a backend PR that updates `openapi.json`, then `npm run api:gen` here.
- Env: copy `.env.example`; never commit `.env*` (except `.env.example`) or secrets.
