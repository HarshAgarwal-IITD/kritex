import { SITE_URL } from "@/components/Seo";
import { descriptionSummary } from "./description";
import type { ProductDetail } from "./types";

const absoluteUrl = (src: string) => (/^https?:\/\//i.test(src) ? src : `${SITE_URL}${src}`);

/**
 * Shipping and returns as the policy pages state them (src/pages/legal/placeholders.ts, Shipping.tsx,
 * Returns.tsx) and the server charges them (SHIPPING_FLAT_FEE_PAISE, free-shipping threshold). Keep in step.
 */
const FLAT_SHIPPING_PAISE = 9900;
const FREE_SHIPPING_FROM_PAISE = 99900;
const EXCHANGE_DAYS = 7;

const rupees = (paise: number) => (paise / 100).toFixed(2);

/** India-only delivery: dispatch in 1–2 business days, delivered in 3–7. */
function shippingDetails(minPricePaise: number): Record<string, unknown> {
  return {
    "@type": "OfferShippingDetails",
    shippingRate: {
      "@type": "MonetaryAmount",
      value: rupees(minPricePaise >= FREE_SHIPPING_FROM_PAISE ? 0 : FLAT_SHIPPING_PAISE),
      currency: "INR",
    },
    shippingDestination: { "@type": "DefinedRegion", addressCountry: "IN" },
    deliveryTime: {
      "@type": "ShippingDeliveryTime",
      handlingTime: { "@type": "QuantitativeValue", minValue: 1, maxValue: 2, unitCode: "DAY" },
      transitTime: { "@type": "QuantitativeValue", minValue: 3, maxValue: 7, unitCode: "DAY" },
    },
  };
}

/** 7-day size exchange by courier; Kritex pays the return shipping. */
const returnPolicy = {
  "@type": "MerchantReturnPolicy",
  applicableCountry: "IN",
  returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
  merchantReturnDays: EXCHANGE_DAYS,
  returnMethod: "https://schema.org/ReturnByMail",
  returnFees: "https://schema.org/FreeReturn",
  merchantReturnLink: `${SITE_URL}/legal/returns`,
};

/** schema.org Product, with an offer when the product has a public price. */
export function productJsonLd(product: ProductDetail, images: string[]): Record<string, unknown> {
  const url = `${SITE_URL}/product/${product.slug}`;
  const ld: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `${url}#product`,
    name: product.name,
    url,
    description: product.description ? descriptionSummary(product.description) : undefined,
    image: images.map(absoluteUrl),
    category: [product.category.name, product.subCategory].filter(Boolean).join(" > "),
    brand: { "@type": "Brand", name: "Kritex" },
    sku: product.variants.length === 1 ? product.variants[0].sku : undefined,
  };
  if (product.price && product.saleChannel !== "ENQUIRY_ONLY") {
    const availability = product.inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock";
    const common = {
      priceCurrency: "INR",
      availability,
      itemCondition: "https://schema.org/NewCondition",
      url,
      seller: { "@type": "Organization", name: "Kritex", url: SITE_URL },
      shippingDetails: shippingDetails(product.price.min),
      hasMerchantReturnPolicy: returnPolicy,
    };
    ld.offers =
      product.price.min === product.price.max
        ? { "@type": "Offer", price: rupees(product.price.min), ...common }
        : {
            "@type": "AggregateOffer",
            lowPrice: rupees(product.price.min),
            highPrice: rupees(product.price.max),
            offerCount: product.variants.length,
            ...common,
          };
  }
  return ld;
}
