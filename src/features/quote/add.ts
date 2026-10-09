import { toast } from "sonner";
import { quoteCart } from "./store";
import type { QuoteCartLine } from "./types";

/** What the quote cart needs to know about a product (PDP detail or listing card). */
export interface QuoteProduct {
  id: string;
  slug: string;
  name: string;
  image: string | null;
}

export interface QuoteVariant {
  id: string;
  title: string;
  sku: string;
}

export const toQuoteLine = (product: QuoteProduct, quantity: number, variant?: QuoteVariant): QuoteCartLine => ({
  productId: product.id,
  productSlug: product.slug,
  productName: product.name,
  image: product.image,
  ...(variant ? { variantId: variant.id, variantTitle: variant.title, sku: variant.sku } : {}),
  quantity,
});

export const addToQuote = (line: QuoteCartLine) => {
  quoteCart.add(line);
  toast.success(`${line.productName} added to your quote`, {
    description: `${line.quantity} × ${line.variantTitle && line.variantTitle !== "Default" ? line.variantTitle : "any option"}`,
  });
};

