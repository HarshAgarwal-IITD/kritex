/**
 * Class strings shared by the storefront commerce pages (cart, checkout, account), lifted from the
 * existing patterns (ContactSection form fields, PDP buttons) so new UI matches the current design.
 */
export const fieldClass =
  "w-full bg-secondary border border-border px-4 py-3 text-sm text-foreground font-body placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors disabled:opacity-60 aria-[invalid=true]:border-destructive";

export const labelClass = "font-display text-[10px] uppercase tracking-wider text-muted-foreground block mb-2";

export const primaryButtonClass =
  "inline-flex items-center justify-center gap-2 font-display text-xs bg-primary text-primary-foreground px-6 py-3 hover:bg-primary/90 transition-colors duration-300 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-primary disabled:active:translate-y-0";

export const secondaryButtonClass =
  "inline-flex items-center justify-center gap-2 font-display text-xs border border-border text-foreground px-6 py-3 hover:border-primary/60 hover:text-primary transition-colors duration-300 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-50";

export const linkButtonClass =
  "font-display text-xs text-primary hover:text-primary/80 transition-colors duration-200 disabled:opacity-50";

export const eyebrowClass = "font-display text-xs text-primary mb-3";

export const panelClass = "border border-border bg-card/40 p-6";

export const sectionTitleClass = "font-display text-[11px] uppercase tracking-wider text-foreground mb-4";
