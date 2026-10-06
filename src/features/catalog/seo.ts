import { SITE_URL } from "@/components/Seo";
import type { ProductDetail } from "./types";

const absoluteUrl = (src: string) => (/^https?:\/\//i.test(src) ? src : `${SITE_URL}${src}`);

/** schema.org Product, with an offer when the product has a public price. */
export function productJsonLd(product: ProductDetail, images: string[]): Record<string, unknown> {
  const ld: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description ?? undefined,
    image: images.map(absoluteUrl),
    category: [product.category.name, product.subCategory].filter(Boolean).join(" > "),
    brand: { "@type": "Brand", name: "Kritex" },
  };
  if (product.price && product.saleChannel !== "ENQUIRY_ONLY") {
    const availability = product.inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock";
    const url = `${SITE_URL}/product/${product.slug}`;
    ld.offers =
      product.price.min === product.price.max
        ? { "@type": "Offer", priceCurrency: "INR", price: (product.price.min / 100).toFixed(2), availability, url }
        : {
            "@type": "AggregateOffer",
            priceCurrency: "INR",
            lowPrice: (product.price.min / 100).toFixed(2),
            highPrice: (product.price.max / 100).toFixed(2),
            offerCount: product.variants.length,
            availability,
            url,
          };
  }
  return ld;
}
