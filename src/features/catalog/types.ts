import type { paths } from "@/lib/api/schema";

// Types come from paths (not component names), so they survive server-side DTO renames.
type Ok<T> = T extends { responses: { 200: { content: { "application/json": infer R } } } } ? R : never;

export type CategoryList = Ok<paths["/api/v1/categories"]["get"]>;
export type Category = CategoryList["items"][number];

export type ProductList = Ok<paths["/api/v1/products"]["get"]>;
export type ProductCardDto = ProductList["items"][number];
export type ProductListParams = NonNullable<paths["/api/v1/products"]["get"]["parameters"]["query"]>;
export type ProductSort = NonNullable<ProductListParams["sort"]>;

export type ProductDetail = Ok<paths["/api/v1/products/{slug}"]["get"]>;
export type ProductVariant = ProductDetail["variants"][number];
export type ProductOption = ProductDetail["options"][number];
export type SaleChannel = ProductDetail["saleChannel"];
export type PriceRange = NonNullable<ProductDetail["price"]>;

export type SearchSuggestions = Ok<paths["/api/v1/search/suggest"]["get"]>;
export type SearchSuggestion = SearchSuggestions["items"][number];
