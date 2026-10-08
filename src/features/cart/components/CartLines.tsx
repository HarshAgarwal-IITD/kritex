import { Link } from "react-router-dom";
import { AlertTriangle, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { formatPaise } from "@/features/catalog/format";
import { assetUrl } from "@/features/catalog/view";
import { useRemoveCartItem, useUpdateCartItem } from "../hooks";
import { cartMutationMessage, issueMessage } from "../messages";
import type { CartLine } from "../types";
import QuantityStepper from "./QuantityStepper";

interface CartLinesProps {
  lines: CartLine[];
  /** Smaller layout for the drawer. */
  compact?: boolean;
  onNavigate?: () => void;
}

const CartLineRow = ({ line, compact, onNavigate }: { line: CartLine; compact?: boolean; onNavigate?: () => void }) => {
  const update = useUpdateCartItem();
  const remove = useRemoveCartItem();
  const issue = issueMessage(line);
  const blocked = line.issue === "OUT_OF_STOCK" || line.issue === "UNAVAILABLE" || line.issue === "NOT_PURCHASABLE";
  const label = `${line.productName}${line.variantTitle && line.variantTitle !== "Default" ? ` (${line.variantTitle})` : ""}`;

  const setQuantity = (quantity: number) =>
    update.mutate({ variantId: line.variantId, quantity }, { onError: (err) => toast.error(cartMutationMessage(err)) });
  const removeLine = () =>
    remove.mutate({ variantId: line.variantId }, { onError: (err) => toast.error(cartMutationMessage(err)) });

  return (
    <li className={cn("flex gap-4 border-b border-border", compact ? "py-4" : "py-6")} data-testid="cart-line">
      <Link
        to={`/product/${line.productSlug}`}
        onClick={onNavigate}
        className={cn("shrink-0 border border-border bg-neutral-100 p-1.5", compact ? "h-16 w-16" : "h-24 w-24")}
      >
        {line.image ? (
          <img src={assetUrl(line.image.url)} alt={line.image.alt ?? line.productName} className="h-full w-full object-contain" />
        ) : (
          <span className="block h-full w-full bg-muted" aria-hidden />
        )}
      </Link>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <Link
              to={`/product/${line.productSlug}`}
              onClick={onNavigate}
              className="font-display text-xs uppercase tracking-wider text-foreground hover:text-primary transition-colors duration-200"
            >
              {line.productName}
            </Link>
            {line.variantTitle && line.variantTitle !== "Default" && (
              <p className="font-body text-xs text-muted-foreground mt-1">{line.variantTitle}</p>
            )}
            {!compact && <p className="font-body text-[11px] text-muted-foreground/60 mt-1">SKU {line.sku}</p>}
          </div>
          <button
            type="button"
            onClick={removeLine}
            aria-label={`Remove ${label}`}
            className="text-muted-foreground hover:text-destructive transition-colors duration-200"
          >
            <X size={14} />
          </button>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <QuantityStepper
            value={line.quantity}
            onChange={setQuantity}
            label={label}
            disabled={blocked}
          />
          <div className="text-right">
            <p className="font-display text-sm text-foreground tabular" data-testid="line-total">
              {formatPaise(line.lineTotal)}
            </p>
            {line.quantity > 1 && (
              <p className="font-body text-[11px] text-muted-foreground tabular">{formatPaise(line.unitPrice)} each</p>
            )}
          </div>
        </div>

        {issue && (
          <p role="alert" className="mt-3 flex items-start gap-2 font-body text-[11px] text-destructive" data-testid="line-issue">
            <AlertTriangle size={12} className="mt-0.5 shrink-0" />
            {issue}
          </p>
        )}
      </div>
    </li>
  );
};

/** Cart lines with steppers, remove buttons and per-line issue messages (shared by the drawer and /cart). */
const CartLines = ({ lines, compact, onNavigate }: CartLinesProps) => (
  <ul aria-label="Cart items" className="border-t border-border">
    {lines.map((line) => (
      <CartLineRow key={line.variantId} line={line} compact={compact} onNavigate={onNavigate} />
    ))}
  </ul>
);

export default CartLines;
