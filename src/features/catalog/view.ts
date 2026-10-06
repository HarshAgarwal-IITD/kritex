/**
 * Pure mappers from catalog DTOs to what the existing UI components render.
 * Image URLs from the API are plain site paths (`/products/...`); asset() maps them to the CDN.
 */
import type { ColorVariant } from "@/components/ProductCard";
import { asset } from "@/lib/asset";
import type { ProductDetail, ProductOption, ProductSort, ProductVariant, SearchSuggestion } from "./types";

export const COLOUR_OPTION = "Colour";
export const SIZE_OPTION = "Size";

const isColourOption = (o: ProductOption) => /^colou?r$/i.test(o.name);

/** asset() for site paths; absolute URLs (already on a CDN) pass through. */
export const assetUrl = (url: string): string => (/^https?:\/\//i.test(url) ? url : asset(url));

const looksLikeUrl = (s: string) => /^(https?:\/\/|\/)/i.test(s);

/** Product images not tied to an option value, in display order. */
export function galleryImages(product: Pick<ProductDetail, "images">): string[] {
  return [...product.images]
    .filter((i) => i.variantOptionValue === null)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((i) => assetUrl(i.url));
}

export function colourOption(product: Pick<ProductDetail, "options">): ProductOption | undefined {
  return product.options.find(isColourOption);
}

/** Colour option values as swatches: an image swatch, a CSS colour, and/or a colour-specific photo. */
export function colourVariants(product: Pick<ProductDetail, "options" | "images">): ColorVariant[] {
  const option = colourOption(product);
  if (!option) return [];
  return option.values.map((label) => {
    const swatch = option.swatches?.[label];
    const image = product.images.find((i) => i.variantOptionValue === label)?.url;
    return {
      label,
      swatch: swatch && looksLikeUrl(swatch) ? assetUrl(swatch) : undefined,
      swatchColor: swatch && !looksLikeUrl(swatch) ? swatch : undefined,
      image: image ? assetUrl(image) : undefined,
    };
  });
}

/** Non-colour options (Size, ...) rendered as text buttons. */
export function textOptions(product: Pick<ProductDetail, "options">): ProductOption[] {
  return product.options.filter((o) => !isColourOption(o));
}

export type Selection = Record<string, string | undefined>;

/** The variant matching every option of the product, or undefined until all are chosen. */
export function findVariant(product: Pick<ProductDetail, "options" | "variants">, selection: Selection) {
  if (product.options.some((o) => !selection[o.name])) {
    // Products without options have a single "Default" variant.
    return product.options.length === 0 ? product.variants[0] : undefined;
  }
  return product.variants.find((v) => product.options.every((o) => v.options[o.name] === selection[o.name]));
}

/** Whether picking `value` for `optionName` (with the rest of the selection) can lead to an in-stock variant. */
export function isValueAvailable(
  variants: ProductVariant[],
  selection: Selection,
  optionName: string,
  value: string,
): boolean {
  return variants.some(
    (v) =>
      v.inStock &&
      v.options[optionName] === value &&
      Object.entries(selection).every(([name, sel]) => name === optionName || !sel || v.options[name] === sel),
  );
}

export type CtaKind = "cart" | "quote" | "enquiry";

/**
 * Which call to action a product gets (ADR-011 sale channels):
 * purchasable (RETAIL, or B2B_ONLY for approved B2B) -> Add to cart; other B2B_ONLY -> Request quote;
 * ENQUIRY_ONLY -> Enquire. `purchasable` is computed by the server per viewer.
 */
export const ctaKind = (product: Pick<ProductDetail, "saleChannel" | "purchasable">): CtaKind => {
  if (product.saleChannel === "ENQUIRY_ONLY") return "enquiry";
  if (product.purchasable) return "cart";
  return "quote";
};

export const suggestionHref = (s: SearchSuggestion) =>
  s.type === "category" ? `/products/${s.slug}` : `/product/${s.slug}`;

export const SORT_OPTIONS: { value: ProductSort; label: string }[] = [
  { value: "newest", label: "Newest" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
];
