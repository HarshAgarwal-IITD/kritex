import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export const MAX_LINE_QUANTITY = 999;

interface QuantityStepperProps {
  value: number;
  onChange: (next: number) => void;
  label: string;
  min?: number;
  max?: number;
  disabled?: boolean;
  className?: string;
}

const btn =
  "flex h-8 w-8 items-center justify-center text-muted-foreground hover:text-primary transition-colors duration-200 disabled:opacity-30 disabled:hover:text-muted-foreground";

/** − qty + control in the storefront style. */
const QuantityStepper = ({ value, onChange, label, min = 1, max = MAX_LINE_QUANTITY, disabled, className }: QuantityStepperProps) => (
  <div className={cn("inline-flex items-center border border-border", className)} role="group" aria-label={`Quantity for ${label}`}>
    <button
      type="button"
      className={btn}
      onClick={() => onChange(value - 1)}
      disabled={disabled || value <= min}
      aria-label={`Decrease quantity of ${label}`}
    >
      <Minus size={12} />
    </button>
    <span className="min-w-8 px-1 text-center font-display text-xs text-foreground tabular" aria-live="polite" data-testid="quantity">
      {value}
    </span>
    <button
      type="button"
      className={btn}
      onClick={() => onChange(value + 1)}
      disabled={disabled || value >= max}
      aria-label={`Increase quantity of ${label}`}
    >
      <Plus size={12} />
    </button>
  </div>
);

export default QuantityStepper;
