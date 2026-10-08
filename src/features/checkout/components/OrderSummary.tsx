import { Link } from "react-router-dom";
import { formatPaise } from "@/features/catalog/format";
import { assetUrl } from "@/features/catalog/view";
import TotalsSummary from "@/features/cart/components/TotalsSummary";
import type { Totals } from "@/features/cart/types";
import { panelClass, sectionTitleClass } from "@/components/shop/styles";

export interface SummaryLine {
  variantId: string;
  productName: string;
  variantTitle: string;
  quantity: number;
  lineTotal: number;
  image: string | null;
  /** GST rate (%) once quoted. */
  gstRate?: number;
}

interface OrderSummaryProps {
  lines: SummaryLine[];
  totals: Totals;
  couponCode?: string | null;
  final: boolean;
  updating?: boolean;
}

/** Right-hand checkout summary: lines + totals (cart preview until an address is quoted). */
const OrderSummary = ({ lines, totals, couponCode, final, updating }: OrderSummaryProps) => (
  <aside className={panelClass} aria-label="Order summary" aria-busy={updating || undefined}>
    <div className="flex items-baseline justify-between">
      <h2 className={sectionTitleClass}>Order Summary</h2>
      <Link to="/cart" className="font-display text-[10px] uppercase tracking-wider text-primary hover:text-primary/80">
        Edit cart
      </Link>
    </div>
    <ul className="space-y-4 border-b border-border pb-5 mb-5">
      {lines.map((l) => (
        <li key={l.variantId} className="flex gap-3">
          <div className="relative h-14 w-14 shrink-0 border border-border bg-neutral-100 p-1">
            {l.image && <img src={assetUrl(l.image)} alt="" className="h-full w-full object-contain" />}
            <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 font-display text-[9px] text-primary-foreground tabular">
              {l.quantity}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-display text-[11px] uppercase tracking-wider text-foreground">{l.productName}</p>
            {l.variantTitle && l.variantTitle !== "Default" && (
              <p className="font-body text-xs text-muted-foreground">{l.variantTitle}</p>
            )}
            {l.gstRate !== undefined && <p className="font-body text-[11px] text-muted-foreground/70">GST {l.gstRate}%</p>}
          </div>
          <p className="font-display text-xs text-foreground tabular">{formatPaise(l.lineTotal)}</p>
        </li>
      ))}
    </ul>
    <TotalsSummary totals={totals} couponCode={couponCode} mode={final ? "final" : "preview"} className={updating ? "opacity-60" : undefined} />
  </aside>
);

export default OrderSummary;
