/**
 * MSW catalog mocks (GET /categories, /products, /products/:slug, /search/suggest).
 *
 * Seeded from src/data/*.ts the same way kritex-server's prisma seed maps them
 * (Size x Colour variants, colour images tagged with `variantOptionValue`), so the storefront
 * renders identically against the mocks and the real API. Everything defaults to ENQUIRY_ONLY
 * like the seed; a couple of products get prices/channels so RETAIL and B2B flows can be exercised.
 */
import { http, HttpResponse } from "msw";
import type { paths } from "@/lib/api/schema";
import { productCategories } from "@/data/productCategories";
import { tacticalFootwearProducts, type ColorVariant, type SpecSheet } from "@/data/tacticalFootwear";
import { combatApparelProducts } from "@/data/combatApparel";
import { loadBearingProducts } from "@/data/loadBearing";

type Json<P extends keyof paths, M extends "get"> = paths[P][M] extends {
  responses: { 200: { content: { "application/json": infer T } } };
}
  ? T
  : never;

export type MockCategoryList = Json<"/api/v1/categories", "get">;
export type MockCategory = MockCategoryList["items"][number];
export type MockProductList = Json<"/api/v1/products", "get">;
export type MockProductCard = MockProductList["items"][number];
export type MockProductDetail = Json<"/api/v1/products/{slug}", "get">;
export type MockSuggest = Json<"/api/v1/search/suggest", "get">;
type SaleChannel = MockProductDetail["saleChannel"];

const apiPath = (path: string) => `*${path}`;

/** The data files already ran asset(); the API returns plain site paths. */
const plain = (url: string) => (/^https?:\/\//i.test(url) ? new URL(url).pathname : url);

/** Long-form category copy (the category page header). */
const CATEGORY_COPY: Record<string, string> = {
  "tactical-footwear":
    "Explore our complete range of tactical and combat footwear. Engineered for durability, comfort, and performance in all environments.",
  "combat-apparel":
    "Explore our complete range of combat apparel — t-shirts, cargo trousers and tactical outerwear engineered for durability, comfort, and performance in the field.",
  "load-bearing":
    "Rucksacks, packs and carrying equipment engineered for organized, modular gear storage in the field.",
};

/** Demo commerce data layered on top of the static catalog (the real seed leaves all ENQUIRY_ONLY). */
const COMMERCE: Record<
  string,
  { saleChannel: SaleChannel; price: number; compareAtPrice?: number; outOfStock?: string[]; purchasable?: boolean }
> = {
  "full-sleeve-combat-tshirt": { saleChannel: "RETAIL", price: 129900, compareAtPrice: 149900, outOfStock: ["XXL"] },
  "tactical-cargo-shorts": { saleChannel: "B2B_ONLY", price: 109900 },
};

interface SourceProduct {
  id: string;
  name: string;
  category: string;
  description: string;
  images: string[];
  specs: { label: string; value: string }[];
  sizes?: string[];
  colorVariants?: ColorVariant[];
  specSheets?: SpecSheet[];
}

const sources: { categorySlug: string; products: SourceProduct[] }[] = [
  { categorySlug: "tactical-footwear", products: tacticalFootwearProducts },
  { categorySlug: "combat-apparel", products: combatApparelProducts },
  { categorySlug: "load-bearing", products: loadBearingProducts },
];

const skuCode = (slug: string) =>
  slug
    .split("-")
    .map((w) => w[0])
    .join("")
    .toUpperCase();

function buildDetail(p: SourceProduct, categorySlug: string): MockProductDetail {
  const cat = productCategories.find((c) => c.slug === categorySlug)!;
  const commerce = COMMERCE[p.id];
  const colours = p.colorVariants ?? [];
  const sizes = p.sizes ?? [];

  const options: MockProductDetail["options"] = [];
  if (sizes.length) options.push({ name: "Size", values: sizes, swatches: null });
  if (colours.length) {
    const swatches = Object.fromEntries(colours.filter((c) => c.swatch).map((c) => [c.label, plain(c.swatch!)]));
    options.push({ name: "Colour", values: colours.map((c) => c.label), swatches: Object.keys(swatches).length ? swatches : null });
  }

  const combos: Record<string, string>[] = [];
  const sizeList = sizes.length ? sizes : [undefined];
  const colourList = colours.length ? colours.map((c) => c.label) : [undefined];
  for (const s of sizeList)
    for (const c of colourList) {
      const o: Record<string, string> = {};
      if (s) o.Size = s;
      if (c) o.Colour = c;
      combos.push(o);
    }

  const variants: MockProductDetail["variants"] = combos.map((o) => {
    const parts = [o.Size, o.Colour].filter(Boolean) as string[];
    return {
      id: `var_${p.id}_${parts.join("_").replace(/\W+/g, "") || "default"}`,
      sku: ["KTX", skuCode(p.id), ...parts.map((v) => v.replace(/\W+/g, "").toUpperCase())].join("-"),
      title: parts.join(" / ") || "Default",
      options: o,
      price: commerce?.price ?? null,
      inStock: !(o.Size && commerce?.outOfStock?.includes(o.Size)),
    };
  });

  const images: MockProductDetail["images"] = [
    ...p.images.map((url) => ({ url: plain(url), alt: p.name, variantOptionValue: null })),
    ...colours
      .filter((c) => c.image)
      .map((c) => ({ url: plain(c.image!), alt: `${p.name} - ${c.label}`, variantOptionValue: c.label })),
  ].map((img, i) => ({ ...img, id: `img_${p.id}_${i}`, sortOrder: i }));

  const saleChannel = commerce?.saleChannel ?? "ENQUIRY_ONLY";
  const price = commerce && saleChannel !== "ENQUIRY_ONLY" ? { min: commerce.price, max: commerce.price } : null;

  return {
    id: `prd_${p.id}`,
    slug: p.id,
    name: p.name,
    description: p.description,
    subCategory: p.category,
    category: { id: `cat_${cat.slug}`, slug: cat.slug, name: cat.title },
    images,
    options,
    variants,
    specs: p.specs,
    specSheets: (p.specSheets ?? []).map((s, i) => ({ id: `sheet_${p.id}_${i}`, title: s.title, url: plain(s.image) })),
    saleChannel,
    purchasable: commerce?.purchasable ?? saleChannel === "RETAIL",
    price,
    compareAtPrice: price ? (commerce?.compareAtPrice ?? null) : null,
    inStock: variants.some((v) => v.inStock),
    seo: { title: null, description: null },
  };
}

/** All mock products in "newest" order (= the website's original display order). */
export const mockProducts: MockProductDetail[] = sources.flatMap(({ categorySlug, products }) =>
  products.map((p) => buildDetail(p, categorySlug)),
);

export const mockCategories: MockCategory[] = productCategories.map((c, i) => ({
  id: `cat_${c.slug}`,
  slug: c.slug,
  name: c.title,
  description: CATEGORY_COPY[c.slug] ?? c.description,
  // Bundled image URL in dev; the real API returns a site path.
  image: c.image,
  sortOrder: i,
  productCount: c.available ? mockProducts.filter((p) => p.category.slug === c.slug).length : 0,
}));

export function toCard(p: MockProductDetail): MockProductCard {
  const primary = p.images.find((i) => i.variantOptionValue === null) ?? p.images[0];
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    category: p.category,
    subCategory: p.subCategory,
    image: primary ? { url: primary.url, alt: primary.alt } : null,
    price: p.price,
    compareAtPrice: p.compareAtPrice,
    saleChannel: p.saleChannel,
    inStock: p.inStock,
  };
}

const err = (status: number, code: string, message: string) =>
  HttpResponse.json({ error: { code, message } }, { status });

const matches = (haystack: (string | null | undefined)[], q: string) =>
  haystack.some((h) => h?.toLowerCase().includes(q.toLowerCase()));

export const catalogHandlers = [
  http.get(apiPath("/api/v1/categories"), () =>
    HttpResponse.json<MockCategoryList>({ items: mockCategories }),
  ),

  http.get(apiPath("/api/v1/products"), ({ request }) => {
    const sp = new URL(request.url).searchParams;
    const page = Number(sp.get("page") ?? 1);
    const limit = Number(sp.get("limit") ?? 20);
    if (!Number.isInteger(page) || page < 1 || !Number.isInteger(limit) || limit < 1 || limit > 100) {
      return err(400, "VALIDATION_ERROR", "page must be >= 1 and limit 1..100");
    }
    const category = sp.get("category");
    const q = sp.get("q")?.trim();
    const size = sp.get("size");
    const colour = sp.get("colour");
    const saleChannel = sp.get("saleChannel");
    const minPrice = sp.get("minPrice") ? Number(sp.get("minPrice")) : null;
    const maxPrice = sp.get("maxPrice") ? Number(sp.get("maxPrice")) : null;
    const sort = sp.get("sort") ?? "newest";

    let rows = mockProducts.filter(
      (p) =>
        (!category || p.category.slug === category) &&
        (!q || matches([p.name, p.subCategory, p.category.name, p.description], q)) &&
        (!size || p.variants.some((v) => v.options.Size === size)) &&
        (!colour || p.variants.some((v) => v.options.Colour?.toLowerCase() === colour.toLowerCase())) &&
        (!saleChannel || p.saleChannel === saleChannel) &&
        (minPrice === null || (p.price !== null && p.price.max >= minPrice)) &&
        (maxPrice === null || (p.price !== null && p.price.min <= maxPrice)),
    );
    if (sort === "price_asc" || sort === "price_desc") {
      const dir = sort === "price_asc" ? 1 : -1;
      // Unpriced products sort last either way.
      rows = [...rows].sort((a, b) => {
        if (a.price === null) return b.price === null ? 0 : 1;
        if (b.price === null) return -1;
        return dir * (a.price.min - b.price.min);
      });
    }
    return HttpResponse.json<MockProductList>({
      items: rows.slice((page - 1) * limit, page * limit).map(toCard),
      page,
      limit,
      total: rows.length,
    });
  }),

  http.get(apiPath("/api/v1/products/:slug"), ({ params }) => {
    const product = mockProducts.find((p) => p.slug === params.slug);
    if (!product) return err(404, "NOT_FOUND", `Product "${String(params.slug)}" not found`);
    return HttpResponse.json<MockProductDetail>(product);
  }),

  http.get(apiPath("/api/v1/search/suggest"), ({ request }) => {
    const sp = new URL(request.url).searchParams;
    const q = sp.get("q")?.trim() ?? "";
    const limit = Math.min(Number(sp.get("limit") ?? 8), 20);
    if (!q) return err(400, "VALIDATION_ERROR", "q is required");
    const categories: MockSuggest["items"] = mockCategories
      .filter((c) => c.productCount > 0 && matches([c.name], q))
      .map((c) => ({ type: "category", slug: c.slug, name: c.name, image: c.image, categorySlug: null }));
    const products: MockSuggest["items"] = mockProducts
      .filter((p) => matches([p.name, p.subCategory], q))
      .map((p) => ({
        type: "product",
        slug: p.slug,
        name: p.name,
        image: p.images[0]?.url ?? null,
        categorySlug: p.category.slug,
      }));
    return HttpResponse.json<MockSuggest>({ items: [...categories, ...products].slice(0, limit) });
  }),
];
