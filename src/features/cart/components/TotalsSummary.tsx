import { formatPaise } from "@/features/catalog/format";
import { cn } from "@/lib/utils";
import type { Totals } from "../types";

interface TotalsSummaryProps {
  totals: Totals;
  couponCode?: string | null;
  /**
   * "preview" (cart): the tax split is an estimate until an address is given.
   * "final" (checkout review / order): show the CGST+SGST or IGST breakdown.
   */
  mode?: "preview" | "final";
  className?: string;
}

const Row = ({ label, value, muted, testId }: { label: string; value: string; muted?: boolean; testId?: string }) => (
  <div className="flex items-baseline justify-between gap-4">
    <dt className={cn("font-body text-sm", muted ? "text-muted-foreground" : "text-foreground")}>{label}</dt>
    <dd className={cn("font-display text-sm tabular", muted ? "text-muted-foreground" : "text-foreground")} data-testid={testId}>
      {value}
    </dd>
  </div>
);

/** Order totals. Prices are GST-inclusive: GST is shown as "included", never added on top. */
const TotalsSummary = ({ totals, couponCode, mode = "preview", className }: TotalsSummaryProps) => {
  const interState = totals.igst > 0;
  return (
    <div className={className}>
      <dl className="space-y-3">
        <Row label="Subtotal" value={formatPaise(totals.subtotal)} testId="totals-subtotal" />
        {totals.discount > 0 && (
          <Row
            label={couponCode ? `Discount (${couponCode})` : "Discount"}
            value={`− ${formatPaise(totals.discount)}`}
            testId="totals-discount"
          />
        )}
        <Row
          label={mode === "preview" ? "Shipping (estimate)" : "Shipping"}
          value={totals.shipping === 0 ? "Free" : formatPaise(totals.shipping)}
          testId="totals-shipping"
        />
        <div className="border-t border-border pt-3">
          <div className="flex items-baseline justify-between gap-4">
            <dt className="font-display text-xs uppercase tracking-wider text-foreground">Total</dt>
            <dd className="font-display text-xl text-foreground tabular" data-testid="totals-total">
              {formatPaise(totals.total)}
            </dd>
          </div>
        </div>
      </dl>
      <div className="mt-3 space-y-1" data-testid="gst-note">
        <p className="font-body text-[11px] text-muted-foreground">
          Inclusive of GST {formatPaise(totals.taxTotal)}
          {mode === "final" &&
            (interState
              ? ` (IGST ${formatPaise(totals.igst)})`
              : ` (CGST ${formatPaise(totals.cgst)} + SGST ${formatPaise(totals.sgst)})`)}
          .
        </p>
        {mode === "preview" && (
          <p className="font-body text-[11px] text-muted-foreground/70">
            Final tax split (CGST + SGST or IGST) and shipping are confirmed at checkout.
          </p>
        )}
      </div>
    </div>
  );
};

export default TotalsSummary;
