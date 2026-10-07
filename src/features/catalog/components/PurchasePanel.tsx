import { ClipboardList, Mail } from "lucide-react";
import AddToCart from "@/features/cart/components/AddToCart";
import { cn } from "@/lib/utils";
import { formatPaise, formatPriceRange } from "../format";
import type { ProductDetail, ProductVariant } from "../types";
import type { CtaKind } from "../view";

/** Price line: the selected variant's price, else the product's range. Hidden for enquiry-only products. */
export const PriceBlock = ({ product, variant }: { product: ProductDetail; variant?: ProductVariant }) => {
  const price =
    variant?.price != null ? formatPaise(variant.price) : formatPriceRange(product.price);
  if (!price || product.saleChannel === "ENQUIRY_ONLY") return null;
  const unit = variant?.price ?? product.price?.min ?? 0;
  const compareAt = product.compareAtPrice && product.compareAtPrice > unit ? formatPaise(product.compareAtPrice) : null;

  return (
    <div className="mb-6">
      <p className="font-display text-2xl text-foreground tabular" data-testid="price">
        {price}
        {compareAt && <span className="ml-3 text-sm text-muted-foreground line-through">{compareAt}</span>}
      </p>
      <p className="font-body text-[11px] text-muted-foreground mt-1">Inclusive of GST</p>
      {product.priceTiers && product.priceTiers.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-2" aria-label="Volume pricing">
          {product.priceTiers.map((t) => (
            <li
              key={t.minQty}
              className="font-display text-[10px] uppercase tracking-wider border border-border px-3 py-1.5 text-muted-foreground"
            >
              {t.minQty}+ units · <span className="text-foreground">{formatPaise(t.unitPrice)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

/** Stock line for sellable products; enquiry-only products never show stock. */
export const StockState = ({
  product,
  variant,
  needsSelection,
}: {
  product: ProductDetail;
  variant?: ProductVariant;
  needsSelection: boolean;
}) => {
  if (product.saleChannel === "ENQUIRY_ONLY") return null;
  let label: string;
  let ok: boolean;
  if (!product.inStock) [label, ok] = ["Out of stock", false];
  else if (variant) [label, ok] = variant.inStock ? ["In stock", true] : ["Out of stock in this option", false];
  else if (needsSelection) [label, ok] = ["Select options to check availability", true];
  else [label, ok] = ["In stock", true];

  return (
    <div className="mb-6 flex items-center gap-3 font-display text-[10px] uppercase tracking-wider" data-testid="stock-state">
      <span className={cn("h-1.5 w-1.5 rounded-full", ok ? "bg-primary" : "bg-destructive")} aria-hidden />
      <span className={ok ? "text-muted-foreground" : "text-destructive"}>{label}</span>
      {variant && <span className="text-muted-foreground/60 normal-case tracking-normal">SKU {variant.sku}</span>}
    </div>
  );
};

const primaryButton =
  "inline-flex items-center gap-2 font-display text-xs bg-primary text-primary-foreground px-6 py-3 hover:bg-primary/90 transition-colors duration-300 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-primary disabled:active:translate-y-0";

interface CtaProps {
  kind: CtaKind;
  variant?: ProductVariant;
  onEnquire: () => void;
  onRequestQuote: () => void;
  /** Used for the quantity control's accessible label. */
  productName?: string;
}

export const PurchaseCta = ({ kind, variant, onEnquire, onRequestQuote, productName }: CtaProps) => {
  if (kind === "enquiry") {
    return (
      <button type="button" onClick={onEnquire} className={primaryButton}>
        <Mail size={14} />
        Send Enquiry
      </button>
    );
  }

  if (kind === "quote") {
    return (
      <div>
        <button type="button" onClick={onRequestQuote} className={primaryButton}>
          <ClipboardList size={14} />
          Request Quote
        </button>
        <p className="font-body text-[11px] text-muted-foreground mt-2">
          Available to approved business accounts. Request a quote for volume pricing and lead times.
        </p>
      </div>
    );
  }

  return (
    <div>
      <AddToCart variant={variant} productName={productName ?? "this product"} />
      <p className="font-body text-[11px] text-muted-foreground mt-2">
        Ordering in bulk?{" "}
        <button type="button" onClick={onEnquire} className="text-primary hover:text-primary/80 transition-colors duration-200">
          Send an enquiry
        </button>{" "}
        for volume pricing.
      </p>
    </div>
  );
};
