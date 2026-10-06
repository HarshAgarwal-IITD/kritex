import { describe, expect, it } from "vitest";
import { mockProducts } from "@/mocks/catalog";
import { formatPaise, formatPriceRange } from "./format";
import { productJsonLd } from "./seo";
import type { ProductDetail } from "./types";
import { colourVariants, ctaKind, findVariant, galleryImages, isValueAvailable, textOptions } from "./view";

const product = (slug: string) => structuredClone(mockProducts.find((p) => p.slug === slug)!) as ProductDetail;

describe("format", () => {
  it("formats paise as INR", () => {
    expect(formatPaise(129900)).toBe("₹1,299.00");
    expect(formatPaise(12345678)).toBe("₹1,23,456.78");
  });
  it("formats a price range", () => {
    expect(formatPriceRange(null)).toBeNull();
    expect(formatPriceRange({ min: 99900, max: 99900 })).toBe("₹999.00");
    expect(formatPriceRange({ min: 99900, max: 129900 })).toBe("₹999.00 – ₹1,299.00");
  });
});

describe("view mappers", () => {
  it("splits gallery images from colour images", () => {
    const p = product("combat-performance-tshirt");
    expect(galleryImages(p)).toEqual(["/products/combat-performance-tshirt/combat-performance-tshirt-1.png"]);
    const colours = colourVariants(p);
    expect(colours.map((c) => c.label)).toEqual(["Olive Green", "Black", "Navy Blue", "Desert Tan", "Steel Grey"]);
    expect(colours[0].image).toMatch(/olive-green\.png$/);
    expect(colours[0].swatch).toMatch(/swatch-olive-green\.png$/);
    expect(textOptions(p).map((o) => o.name)).toEqual(["Size"]);
  });

  it("treats non-URL swatches as CSS colours", () => {
    const p = product("combat-performance-tshirt");
    p.options[1].swatches = { "Olive Green": "#556b2f" };
    const [olive, black] = colourVariants(p);
    expect(olive.swatchColor).toBe("#556b2f");
    expect(olive.swatch).toBeUndefined();
    expect(black.swatch).toBeUndefined();
  });

  it("resolves the variant only once every option is chosen", () => {
    const p = product("combat-performance-tshirt");
    expect(findVariant(p, { Size: "M" })).toBeUndefined();
    expect(findVariant(p, { Size: "M", Colour: "Black" })?.sku).toBe("KTX-CPT-M-BLACK");
  });

  it("returns the single default variant for option-less products", () => {
    const p = product("rapid-20-tactical-backpack");
    expect(p.options).toHaveLength(0);
    expect(findVariant(p, {})?.title).toBe("Default");
  });

  it("knows which option values can still be bought", () => {
    const p = product("full-sleeve-combat-tshirt");
    expect(isValueAvailable(p.variants, {}, "Size", "XXL")).toBe(false);
    expect(isValueAvailable(p.variants, {}, "Size", "M")).toBe(true);
  });

  it("picks the CTA from the sale channel and purchasability", () => {
    expect(ctaKind({ saleChannel: "ENQUIRY_ONLY", purchasable: false })).toBe("enquiry");
    expect(ctaKind({ saleChannel: "RETAIL", purchasable: true })).toBe("cart");
    expect(ctaKind({ saleChannel: "B2B_ONLY", purchasable: false })).toBe("quote");
    expect(ctaKind({ saleChannel: "B2B_ONLY", purchasable: true })).toBe("cart");
  });
});

describe("productJsonLd", () => {
  it("omits offers for enquiry-only products", () => {
    const p = product("og-polo-tshirt");
    const ld = productJsonLd(p, galleryImages(p));
    expect(ld.offers).toBeUndefined();
    expect(ld.category).toBe("Combat Apparel > T-Shirts");
    expect((ld.image as string[])[0]).toBe("https://kritex.in/products/og-polo-tshirt/og-polo-tshirt-1.png");
  });

  it("adds an INR offer for priced products", () => {
    const p = product("full-sleeve-combat-tshirt");
    expect(productJsonLd(p, galleryImages(p)).offers).toMatchObject({
      "@type": "Offer",
      priceCurrency: "INR",
      price: "1299.00",
      availability: "https://schema.org/InStock",
    });
  });
});
