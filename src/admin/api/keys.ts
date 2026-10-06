import type { AdminProductFilters } from "./products";

export const adminKeys = {
  session: ["auth", "session"] as const,
  me: ["me"] as const,
  categories: ["admin", "categories"] as const,
  products: ["admin", "products"] as const,
  productList: (filters: AdminProductFilters) => ["admin", "products", "list", filters] as const,
  product: (id: string) => ["admin", "products", "detail", id] as const,
};
