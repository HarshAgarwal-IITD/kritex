import { cn } from "@/lib/utils";
import { isQuoteExpired, QUOTE_STATUS_LABEL, quoteStatusTone } from "../status";
import type { QuoteStatus } from "../types";

const TONE = {
  ok: "border-primary/50 text-primary",
  warn: "border-accent/50 text-accent",
  bad: "border-destructive/50 text-destructive",
  muted: "border-border text-muted-foreground",
};

/** Same chip as the order StatusBadge. A QUOTED quote past its validity shows as expired. */
const QuoteStatusBadge = ({ status, validUntil = null }: { status: QuoteStatus; validUntil?: string | null }) => {
  const shown: QuoteStatus = isQuoteExpired({ status, validUntil }) ? "EXPIRED" : status;
  return (
    <span
      className={cn("inline-block border px-2 py-1 font-display text-[9px] uppercase tracking-wider", TONE[quoteStatusTone(shown)])}
      data-testid="quote-status"
    >
      {QUOTE_STATUS_LABEL[shown]}
    </span>
  );
};

export default QuoteStatusBadge;
