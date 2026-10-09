import { useState } from "react";
import { Link } from "react-router-dom";
import { ClipboardList, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { primaryButtonClass } from "@/components/shop/styles";
import QuantityStepper from "@/features/cart/components/QuantityStepper";
import { MAX_QUOTE_QUANTITY, useQuoteCount } from "../store";
import { addToQuote, toQuoteLine, type QuoteProduct, type QuoteVariant } from "../add";

/** "View quote (n)" link shown once the quote cart has something in it. */
export const QuoteCartLink = ({ className }: { className?: string }) => {
  const count = useQuoteCount();
  if (!count) return null;
  return (
    <Link to="/quote" className={cn("font-display text-xs text-primary hover:text-primary/80 transition-colors duration-200", className)}>
      View quote request ({count} {count === 1 ? "item" : "items"}) →
    </Link>
  );
};

interface AddToQuoteProps {
  product: QuoteProduct;
  /** The selected variant; undefined until every option is picked (the RFQ then quotes the product generally). */
  variant?: QuoteVariant;
  hasOptions: boolean;
  hint?: string;
}

/** PDP: quantity + "Add to Quote" for enquiry-only and B2B-only products. */
const AddToQuote = ({ product, variant, hasOptions, hint }: AddToQuoteProps) => {
  const [quantity, setQuantity] = useState(1);
  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <QuantityStepper
          value={quantity}
          onChange={setQuantity}
          label={product.name}
          max={MAX_QUOTE_QUANTITY}
          className="h-[42px] [&>button]:h-full [&>button]:w-10"
        />
        <button
          type="button"
          className={primaryButtonClass}
          onClick={() => {
            addToQuote(toQuoteLine(product, quantity, variant));
            setQuantity(1);
          }}
        >
          <ClipboardList size={14} />
          Add to Quote
        </button>
      </div>
      <p className="font-body text-[11px] text-muted-foreground mt-2">
        {hint ??
          (hasOptions && !variant
            ? "Pick options to quote a specific size or colour, or add it now and tell us in the notes."
            : "Add items with quantities, then send one request for pricing, MOQ and lead times.")}
      </p>
      <QuoteCartLink className="mt-3 inline-block" />
    </div>
  );
};

/** Small text button: adds 1 to the quote (retail PDP "ordering in bulk?" line, listing cards). */
export const AddToQuoteLink = ({
  product,
  variant,
  className,
  children = "Add to quote",
}: {
  product: QuoteProduct;
  variant?: QuoteVariant;
  className?: string;
  children?: React.ReactNode;
}) => (
  <button
    type="button"
    onClick={(e) => {
      e.preventDefault();
      e.stopPropagation();
      addToQuote(toQuoteLine(product, 1, variant));
    }}
    aria-label={`Add ${product.name} to quote`}
    className={cn("inline-flex items-center gap-1 text-primary hover:text-primary/80 transition-colors duration-200", className)}
  >
    {children === "Add to quote" && <Plus size={11} />}
    {children}
  </button>
);

export default AddToQuote;
