import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { fieldClass, labelClass } from "./styles";

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: ReactNode;
}

/** Labelled text input in the storefront style; works with react-hook-form's `register()`. */
export const Field = forwardRef<HTMLInputElement, FieldProps>(({ label, error, hint, className, id, ...props }, ref) => {
  const autoId = useId();
  const inputId = id ?? autoId;
  const errorId = `${inputId}-error`;
  return (
    <div className={className}>
      <label htmlFor={inputId} className={labelClass}>
        {label}
      </label>
      <input
        ref={ref}
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className={fieldClass}
        {...props}
      />
      {error ? (
        <p id={errorId} className="font-body text-[11px] text-destructive mt-1.5">
          {error}
        </p>
      ) : (
        hint && <p className="font-body text-[11px] text-muted-foreground mt-1.5">{hint}</p>
      )}
    </div>
  );
});
Field.displayName = "Field";

/** Form-level error banner. */
export const FormError = ({ children, className }: { children?: ReactNode; className?: string }) =>
  children ? (
    <div role="alert" className={cn("border border-destructive/40 bg-destructive/10 px-4 py-3 font-body text-xs text-destructive", className)}>
      {children}
    </div>
  ) : null;

/** Success / info banner. */
export const FormNotice = ({ children, className }: { children?: ReactNode; className?: string }) =>
  children ? (
    <div role="status" className={cn("border border-primary/40 bg-primary/10 px-4 py-3 font-body text-xs text-foreground", className)}>
      {children}
    </div>
  ) : null;
