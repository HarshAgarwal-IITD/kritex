import { http, HttpResponse } from "msw";
import type { paths } from "@/lib/api/schema";

// Types come from paths (not component names), so they survive server-side DTO renames.
type Query = paths["/api/v1/queries"]["get"]["responses"][200]["content"]["application/json"][number];
type CreateQueryRequest = paths["/api/v1/queries"]["post"]["requestBody"]["content"]["application/json"];
type CreateQueryResponse = paths["/api/v1/queries"]["post"]["responses"][201]["content"]["application/json"];
type Health = paths["/api/v1/health"]["get"]["responses"][200]["content"]["application/json"];
type ErrorResponse = paths["/api/v1/queries"]["post"]["responses"][400]["content"]["application/json"];

// "*" prefix matches any origin, so handlers work with or without VITE_API_URL.
export const apiPath = (path: string) => `*${path}`;

/** In-memory store for mocked queries (reset between tests via resetMockDb). */
let queries: Query[] = [];
export const resetMockDb = () => {
  queries = [];
};
export const getMockQueries = () => queries;

export const handlers = [
  http.get(apiPath("/api/v1/health"), () => HttpResponse.json<Health>({ status: "ok" })),

  http.post(apiPath("/api/v1/queries"), async ({ request }) => {
    const body = (await request.json()) as Partial<CreateQueryRequest>;
    if (!body?.name || !body?.email || !body?.requirements) {
      return HttpResponse.json(
        {
          error: { code: "VALIDATION_ERROR", message: "name, email and requirements are required" },
        } satisfies ErrorResponse,
        { status: 400 },
      );
    }
    const query: Query = {
      id: crypto.randomUUID(),
      name: body.name,
      organization: body.organization ?? null,
      email: body.email,
      requirements: body.requirements,
      status: "NEW",
      createdAt: new Date().toISOString(),
    };
    queries.push(query);
    return HttpResponse.json(
      { id: query.id, createdAt: query.createdAt } satisfies CreateQueryResponse,
      { status: 201 },
    );
  }),

  http.get(apiPath("/api/v1/queries"), ({ request }) => {
    if (!request.headers.get("authorization")?.startsWith("Bearer ")) {
      return HttpResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Missing bearer token" } } satisfies ErrorResponse,
        { status: 401 },
      );
    }
    return HttpResponse.json(queries satisfies Query[]);
  }),
];
