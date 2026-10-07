import type { components } from "@/lib/api/schema";

/**
 * In-memory enquiries (contact / tender queries), shared by the public `POST /queries` mock (handlers.ts)
 * and the staff inbox mocks (`GET /queries`, `GET/PATCH /admin/queries*` in admin-commerce.ts).
 * Kept in its own module so neither handler file imports the other.
 */
export type MockQuery = components["schemas"]["QueryDto_Output"];

let queries: MockQuery[] = [];

export const getMockQueries = () => queries;
export const addMockQuery = (query: MockQuery) => {
  queries.push(query);
};
export const resetMockQueries = (seed: MockQuery[] = []) => {
  queries = seed;
};
