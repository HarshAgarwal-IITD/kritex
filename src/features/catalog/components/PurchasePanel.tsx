import AddToCart from "@/features/cart/components/AddToCart";
import AddToQuote, { AddToQuoteLink, QuoteCartLink } from "@/features/quote/components/AddToQuote";
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
      {product.priceTiers && product.priceTiers.length > 0 && <TierTable tiers={product.priceTiers} />}
    </div>
  );
};

/** Volume (tier) prices, sent only to approved B2B accounts. */
export const TierTable = ({ tiers }: { tiers: NonNullable<ProductDetail["priceTiers"]> }) => (
  <div className="mt-4 max-w-xs" data-testid="price-tiers">
    <p className="font-display text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Volume pricing · business account</p>
    <table aria-label="Volume pricing" className="w-full border border-border">
      <tbody>
        {[...tiers]
          .sort((a, b) => a.minQty - b.minQty)
          .map((t) => (
            <tr key={t.minQty} className="border-b border-border last:border-b-0">
              <th scope="row" className="px-3 py-2 text-left font-body text-xs font-normal text-muted-foreground">
                From {t.minQty} units
              </th>
              <td className="px-3 py-2 text-right font-display text-xs text-foreground tabular">{formatPaise(t.unitPrice)} each</td>
            </tr>
          ))}
      </tbody>
    </table>
  </div>
);

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

interface CtaProps {
  kind: CtaKind;
  product: ProductDetail;
  variant?: ProductVariant;
}

const quoteProduct = (p: ProductDetail) => ({
  id: p.id,
  slug: p.slug,
  name: p.name,
  image: (p.images.find((i) => i.variantOptionValue === null) ?? p.images[0])?.url ?? null,
});

/** Buy box: Add to Cart for purchasable products, otherwise Add to Quote (the quote cart → RFQ at /quote). */
export const PurchaseCta = ({ kind, product, variant }: CtaProps) => {
  const qp = quoteProduct(product);
  const hasOptions = product.options.length > 0;

  if (kind === "enquiry") return <AddToQuote product={qp} variant={variant} hasOptions={hasOptions} />;

  if (kind === "quote") {
    return (
      <AddToQuote
        product={qp}
        variant={variant}
        hasOptions={hasOptions}
        hint="Available to approved business accounts. Request a quote for volume pricing and lead times."
      />
    );
  }

  return (
    <div>
      <AddToCart variant={variant} productName={product.name} />
      <p className="font-body text-[11px] text-muted-foreground mt-2">
        Ordering in bulk?{" "}
        <AddToQuoteLink product={qp} variant={variant}>
          Add it to a quote request
        </AddToQuoteLink>{" "}
        for volume pricing.
      </p>
      <QuoteCartLink className="mt-3 inline-block" />
    </div>
  );
};
