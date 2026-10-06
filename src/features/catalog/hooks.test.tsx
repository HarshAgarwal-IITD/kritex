import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClientProvider } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";
import { server } from "@/mocks/server";
import { apiPath } from "@/mocks/handlers";
import { ApiError } from "@/lib/api/client";
import { useCategories, useProduct, useProducts, useSearchSuggest } from "./hooks";
import { newQueryClient } from "./test-utils";

const wrapper = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={newQueryClient()}>{children}</QueryClientProvider>
);

describe("catalog hooks", () => {
  it("useCategories returns categories in sort order with product counts", async () => {
    const { result } = renderHook(() => useCategories(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    const items = result.current.data!.items;
    expect(items.map((c) => c.slug)).toEqual(["tactical-footwear", "combat-apparel", "load-bearing", "base-layers"]);
    expect(items.find((c) => c.slug === "combat-apparel")?.productCount).toBe(6);
    expect(items.find((c) => c.slug === "base-layers")?.productCount).toBe(0);
  });

  it("useProducts sends filters as query params and omits empty ones", async () => {
    let url: URL | undefined;
    server.events.on("request:start", ({ request }) => {
      if (request.url.includes("/api/v1/products")) url = new URL(request.url);
    });
    const { result } = renderHook(() => useProducts({ category: "combat-apparel", q: "", sort: "price_asc" }), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    server.events.removeAllListeners();

    expect(url?.searchParams.get("category")).toBe("combat-apparel");
    expect(url?.searchParams.get("sort")).toBe("price_asc");
    expect(url?.searchParams.has("q")).toBe(false);
    expect(result.current.data!.total).toBe(6);
    // Priced products first for price_asc.
    expect(result.current.data!.items[0].price).not.toBeNull();
  });

  it("useProduct returns the product detail", async () => {
    const { result } = renderHook(() => useProduct("combat-performance-tshirt"), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    const p = result.current.data!;
    expect(p.category.slug).toBe("combat-apparel");
    expect(p.options.map((o) => o.name)).toEqual(["Size", "Colour"]);
    expect(p.variants).toHaveLength(25);
  });

  it("useProduct surfaces a 404 as an ApiError without retrying", async () => {
    let calls = 0;
    server.events.on("request:start", ({ request }) => {
      if (request.url.includes("/products/nope")) calls++;
    });
    const { result } = renderHook(() => useProduct("nope"), { wrapper });
    await waitFor(() => expect(result.current.isError).toBe(true));
    server.events.removeAllListeners();
    expect(result.current.error).toBeInstanceOf(ApiError);
    expect((result.current.error as ApiError).code).toBe("NOT_FOUND");
    expect((result.current.error as ApiError).status).toBe(404);
    expect(calls).toBe(1);
  });

  it("useProduct is idle without a slug", () => {
    const { result } = renderHook(() => useProduct(undefined), { wrapper });
    expect(result.current.fetchStatus).toBe("idle");
  });

  it("useSearchSuggest waits for 2+ characters, then returns suggestions", async () => {
    const { result, rerender } = renderHook(({ q }) => useSearchSuggest(q), { wrapper, initialProps: { q: "j" } });
    expect(result.current.fetchStatus).toBe("idle");
    rerender({ q: "jungle" });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data!.items.length).toBeGreaterThan(0);
    expect(result.current.data!.items.every((i) => i.type === "product" && i.categorySlug === "tactical-footwear")).toBe(true);
  });

  it("converts error bodies into ApiError", async () => {
    server.use(
      http.get(apiPath("/api/v1/categories"), () =>
        HttpResponse.json({ error: { code: "INTERNAL", message: "boom" } }, { status: 500 }),
      ),
    );
    const { result } = renderHook(() => useCategories(), { wrapper });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect((result.current.error as ApiError).code).toBe("INTERNAL");
  });
});
