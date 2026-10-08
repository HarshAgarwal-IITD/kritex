import type { ReactNode } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { linkButtonClass } from "@/components/shop/styles";

interface StepCardProps {
  index: number;
  title: string;
  state: "active" | "done" | "upcoming";
  /** Shown when the step is done (collapsed). */
  summary?: ReactNode;
  onEdit?: () => void;
  children?: ReactNode;
}

/** One checkout step: numbered header, body when active, summary + "Edit" when done. */
const StepCard = ({ index, title, state, summary, onEdit, children }: StepCardProps) => (
  <section
    aria-labelledby={`step-${index}-title`}
    className={cn("border border-border p-6", state === "active" ? "bg-card/40" : "bg-transparent", state === "upcoming" && "opacity-50")}
    data-testid={`step-${index}`}
  >
    <div className="flex items-center justify-between gap-4">
      <h2 id={`step-${index}-title`} className="flex items-center gap-3 font-display text-xs uppercase tracking-wider text-foreground">
        <span
          className={cn(
            "flex h-6 w-6 items-center justify-center border font-display text-[10px]",
            state === "done" ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground",
            state === "active" && "border-primary text-primary",
          )}
          aria-hidden
        >
          {state === "done" ? <Check size={12} /> : index}
        </span>
        {title}
      </h2>
      {state === "done" && onEdit && (
        <button type="button" onClick={onEdit} className={linkButtonClass} aria-label={`Edit ${title.toLowerCase()}`}>
          Edit
        </button>
      )}
    </div>
    {state === "done" && summary && <div className="mt-4 pl-9 font-body text-sm text-muted-foreground">{summary}</div>}
    {state === "active" && <div className="mt-6">{children}</div>}
  </section>
);

export default StepCard;
