import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { api, toApiError } from "@/lib/api/client";
import type { ProductListParams } from "./types";

export const catalogKeys = {
  all: ["catalog"] as const,
  categories: () => [...catalogKeys.all, "categories"] as const,
  products: (params: ProductListParams) => [...catalogKeys.all, "products", params] as const,
  product: (slug: string) => [...catalogKeys.all, "product", slug] as const,
  suggest: (q: string, limit?: number) => [...catalogKeys.all, "suggest", q, limit] as const,
};

/** The catalog changes rarely; avoid refetching on every mount/focus. */
const CATALOG_STALE_MS = 5 * 60 * 1000;

/** Drops empty values so `{ q: "" }` and `{}` share a cache entry and aren't sent as `?q=`. */
const compact = <T extends object>(params: T): T =>
  Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== "")) as T;

export function useCategories() {
  return useQuery({
    queryKey: catalogKeys.categories(),
    staleTime: CATALOG_STALE_MS,
    queryFn: async ({ signal }) => {
      const { data, error, response } = await api.GET("/api/v1/categories", { signal });
      if (error || !data) throw toApiError(error, response);
      return data;
    },
  });
}

export function useProducts(params: ProductListParams = {}) {
  const query = compact(params);
  return useQuery({
    queryKey: catalogKeys.products(query),
    staleTime: CATALOG_STALE_MS,
    // Keep showing the previous results while a filter/search change loads (no skeleton flash).
    placeholderData: keepPreviousData,
    queryFn: async ({ signal }) => {
      const { data, error, response } = await api.GET("/api/v1/products", { params: { query }, signal });
      if (error || !data) throw toApiError(error, response);
      return data;
    },
  });
}

export function useProduct(slug: string | undefined) {
  return useQuery({
    queryKey: catalogKeys.product(slug ?? ""),
    enabled: !!slug,
    staleTime: CATALOG_STALE_MS,
    // A 404 won't fix itself; don't retry it.
    retry: (count, err) => (err as { status?: number }).status !== 404 && count < 2,
    queryFn: async ({ signal }) => {
      const { data, error, response } = await api.GET("/api/v1/products/{slug}", {
        params: { path: { slug: slug! } },
        signal,
      });
      if (error || !data) throw toApiError(error, response);
      return data;
    },
  });
}

export const SUGGEST_MIN_CHARS = 2;

/** Search-as-you-type suggestions. Pass an already-debounced query. */
export function useSearchSuggest(q: string, limit = 8) {
  const term = q.trim();
  return useQuery({
    queryKey: catalogKeys.suggest(term, limit),
    enabled: term.length >= SUGGEST_MIN_CHARS,
    staleTime: CATALOG_STALE_MS,
    placeholderData: keepPreviousData,
    queryFn: async ({ signal }) => {
      const { data, error, response } = await api.GET("/api/v1/search/suggest", {
        params: { query: { q: term, limit } },
        signal,
      });
      if (error || !data) throw toApiError(error, response);
      return data;
    },
  });
}
