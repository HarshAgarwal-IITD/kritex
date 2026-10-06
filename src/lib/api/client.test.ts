import { describe, it, expect } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "@/mocks/server";
import { apiPath } from "@/mocks/handlers";
import { api, ApiError, toApiError } from "./client";

describe("toApiError", () => {
  it("extracts code, message and details from the contract error body", () => {
    const err = toApiError(
      { error: { code: "VALIDATION_ERROR", message: "email is invalid", details: { field: "email" } } },
      new Response(null, { status: 400 }),
    );
    expect(err).toBeInstanceOf(ApiError);
    expect(err).toBeInstanceOf(Error);
    expect(err.code).toBe("VALIDATION_ERROR");
    expect(err.message).toBe("email is invalid");
    expect(err.status).toBe(400);
    expect(err.details).toEqual({ field: "email" });
  });

  it("falls back to an HTTP_<status> code for non-contract bodies", () => {
    const err = toApiError("<html>Bad gateway</html>", new Response(null, { status: 502, statusText: "Bad Gateway" }));
    expect(err.code).toBe("HTTP_502");
    expect(err.message).toBe("Bad Gateway");
    expect(err.status).toBe(502);
  });

  it("uses NETWORK_ERROR when there is no response", () => {
    const err = toApiError(undefined);
    expect(err.code).toBe("NETWORK_ERROR");
    expect(err.status).toBe(0);
  });
});

describe("api client (against MSW)", () => {
  it("GET /api/v1/health returns ok", async () => {
    const { data, error } = await api.GET("/api/v1/health");
    expect(error).toBeUndefined();
    expect(data).toEqual({ status: "ok" });
  });

  it("POST /api/v1/queries returns 201 with id + createdAt", async () => {
    const { data, response } = await api.POST("/api/v1/queries", {
      body: { name: "A", email: "a@b.in", requirements: "x" },
    });
    expect(response.status).toBe(201);
    expect(data?.id).toEqual(expect.any(String));
    expect(data?.createdAt).toEqual(expect.any(String));
  });

  it("surfaces 429 errors through toApiError", async () => {
    server.use(
      http.post(apiPath("/api/v1/queries"), () =>
        HttpResponse.json({ error: { code: "RATE_LIMITED", message: "Too many requests" } }, { status: 429 }),
      ),
    );
    const { error, response } = await api.POST("/api/v1/queries", {
      body: { name: "A", email: "a@b.in", requirements: "x" },
    });
    const err = toApiError(error, response);
    expect(err.status).toBe(429);
    expect(err.code).toBe("RATE_LIMITED");
  });
});
