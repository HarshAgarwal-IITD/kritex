import { AlertTriangle } from "lucide-react";

/**
 * Shown on every policy page while LEGAL_DRAFT is true (see ./policies.ts).
 * Remove by flipping LEGAL_DRAFT once counsel has approved the text.
 */
const DraftBanner = () => (
  <div
    role="note"
    data-testid="legal-draft-banner"
    className="mb-10 flex items-start gap-3 border border-accent/40 bg-accent/10 px-4 py-3"
  >
    <AlertTriangle size={16} className="mt-0.5 shrink-0 text-accent" aria-hidden="true" />
    <p className="font-display text-xs leading-relaxed text-accent">
      <span className="uppercase tracking-wider">Draft — pending legal review.</span>{" "}
      <span className="text-muted-foreground normal-case">
        This policy is a working draft and may change before the Kritex online store launches.
      </span>
    </p>
  </div>
);

export default DraftBanner;
