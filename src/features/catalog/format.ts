import type { PriceRange } from "./types";

const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" });

/** Formats integer paise as INR, e.g. 129900 -> "₹1,299.00". */
export const formatPaise = (paise: number): string => inr.format(paise / 100);

/** "₹1,299.00" or "₹899.00 – ₹1,299.00"; null when the product has no public price. */
export const formatPriceRange = (price: PriceRange | null): string | null => {
  if (!price) return null;
  return price.min === price.max ? formatPaise(price.min) : `${formatPaise(price.min)} – ${formatPaise(price.max)}`;
};
