import createClient from "openapi-fetch";
import type { components, paths } from "./schema";

/**
 * Typed API client (openapi-fetch) for kritex-server.
 * Base URL is empty in dev (same origin; Vite proxies /api to :4000).
 * Types come from ./schema.d.ts, which is GENERATED: run `npm run api:gen`, never edit it by hand.
 */
export const api = createClient<paths>({
  baseUrl: import.meta.env.VITE_API_URL ?? "",
  credentials: "include",
});

export type ApiErrorBody = components["schemas"]["ErrorResponse"];

/** Error thrown/returned for failed API calls, carrying the contract's `{ error: { code, message } }`. */
export class ApiError extends Error {
  readonly code: string;
  readonly status: number;
  readonly details?: unknown;

  constructor(code: string, message: string, status: number, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

function isApiErrorBody(value: unknown): value is ApiErrorBody {
  if (typeof value !== "object" || value === null || !("error" in value)) return false;
  const err = (value as { error: unknown }).error;
  return (
    typeof err === "object" &&
    err !== null &&
    typeof (err as { code?: unknown }).code === "string" &&
    typeof (err as { message?: unknown }).message === "string"
  );
}

/**
 * Builds an ApiError from an openapi-fetch failure (`error` body + `response`).
 * Falls back to a generic code/message when the body doesn't match the contract shape.
 */
export function toApiError(error: unknown, response?: Response): ApiError {
  const status = response?.status ?? 0;
  if (isApiErrorBody(error)) {
    return new ApiError(error.error.code, error.error.message, status, error.error.details);
  }
  return new ApiError(
    status ? `HTTP_${status}` : "NETWORK_ERROR",
    response?.statusText || "Request failed",
    status,
    error,
  );
}
