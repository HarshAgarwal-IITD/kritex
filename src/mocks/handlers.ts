import { http, HttpResponse } from "msw";
import type { paths } from "@/lib/api/schema";
import { adminHandlers, getMockSessionUser } from "./admin-handlers";
import { catalogHandlers } from "./catalog";
import { addMockQuery, getMockQueries, resetMockQueries } from "./queries-store";
import { commerceHandlers, resetCommerceMockDb } from "./commerce-handlers";
import { b2bOpsHandlers, resetB2bOpsMockDb } from "./b2b-ops-handlers";

// Types come from paths (not component names), so they survive server-side DTO renames.
type Query = paths["/api/v1/queries"]["get"]["responses"][200]["content"]["application/json"][number];
type CreateQueryRequest = paths["/api/v1/queries"]["post"]["requestBody"]["content"]["application/json"];
type CreateQueryResponse = paths["/api/v1/queries"]["post"]["responses"][201]["content"]["application/json"];
type Health = paths["/api/v1/health"]["get"]["responses"][200]["content"]["application/json"];
type ErrorResponse = paths["/api/v1/queries"]["post"]["responses"][400]["content"]["application/json"];

// "*" prefix matches any origin, so handlers work with or without VITE_API_URL.
export const apiPath = (path: string) => `*${path}`;

/** Mocked queries live in ./queries-store (shared with the admin inbox); reset between tests via resetMockDb. */
export const resetMockDb = () => {
  resetMockQueries();
  resetCommerceMockDb();
  resetB2bOpsMockDb();
};
export { getMockQueries };

export const handlers = [
  // Stage 4 quotes, shipping, tracking, B2B tier prices (web-b2b-ops). First: some of its handlers fall through.
  ...b2bOpsHandlers,

  // Storefront cart / checkout / account (web-commerce). First, so its sign-in handler can answer for
  // mock-created (unverified) users before the admin one; it falls through for everyone else.
  ...commerceHandlers,

  // Admin app: Better Auth, /me and /admin/* catalog routes (see admin-handlers.ts).
  ...adminHandlers,

  http.get(apiPath("/api/v1/health"), () => HttpResponse.json<Health>({ status: "ok" })),

  // "Continue with Google" (ADR-019): the mock hands back a fake consent URL.
  http.get(apiPath("/api/v1/auth-options"), () => HttpResponse.json({ google: true })),
  http.post(apiPath("/api/v1/auth/sign-in/social"), () =>
    HttpResponse.json({ url: "https://accounts.google.com/o/oauth2/v2/auth?client_id=mock", redirect: true }),
  ),

  // Enquiries need a signed-in, verified account (ADR-018); replies go to the account email.
  http.post(apiPath("/api/v1/queries"), async ({ request }) => {
    const user = getMockSessionUser();
    if (!user) {
      return HttpResponse.json({ error: { code: "UNAUTHORIZED", message: "Sign in required" } } satisfies ErrorResponse, { status: 401 });
    }
    if (!user.emailVerified) {
      return HttpResponse.json(
        { error: { code: "EMAIL_NOT_VERIFIED", message: "Verify your email address first" } } satisfies ErrorResponse,
        { status: 403 },
      );
    }
    const body = (await request.json()) as Partial<CreateQueryRequest>;
    if (!body?.name || !body?.requirements) {
      return HttpResponse.json(
        {
          error: { code: "VALIDATION_ERROR", message: "name and requirements are required" },
        } satisfies ErrorResponse,
        { status: 400 },
      );
    }
    const query: Query = {
      id: crypto.randomUUID(),
      name: body.name,
      organization: body.organization ?? null,
      email: user.email,
      requirements: body.requirements,
      status: "NEW",
      createdAt: new Date().toISOString(),
    };
    addMockQuery(query);
    return HttpResponse.json(
      { id: query.id, createdAt: query.createdAt } satisfies CreateQueryResponse,
      { status: 201 },
    );
  }),

  // GET /queries (staff session, TD-20) is mocked with the admin inbox in admin-commerce.ts.

  // ---- Storefront catalog (web-catalog): data + handlers live in ./catalog.ts ----
  ...catalogHandlers,
  // ---- end storefront catalog ----
];
