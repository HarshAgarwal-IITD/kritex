import { forwardRef, useId, useState, type InputHTMLAttributes, type ReactNode } from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { fieldClass, labelClass } from "./styles";

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: ReactNode;
}

/**
 * Labelled text input in the storefront style; works with react-hook-form's `register()`.
 * `type="password"` gets a show / hide toggle.
 */
export const Field = forwardRef<HTMLInputElement, FieldProps>(({ label, error, hint, className, id, type, ...props }, ref) => {
  const autoId = useId();
  const inputId = id ?? autoId;
  const errorId = `${inputId}-error`;
  const isPassword = type === "password";
  const [shown, setShown] = useState(false);
  return (
    <div className={className}>
      <label htmlFor={inputId} className={labelClass}>
        {label}
      </label>
      <div className="relative">
        <input
          ref={ref}
          id={inputId}
          type={isPassword && shown ? "text" : type}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className={cn(fieldClass, isPassword && "pr-11")}
          {...props}
        />
        {isPassword && <RevealToggle shown={shown} onToggle={() => setShown((v) => !v)} />}
      </div>
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

/** Eye button inside a password input: shows / hides what was typed. */
export const RevealToggle = ({ shown, onToggle, className }: { shown: boolean; onToggle: () => void; className?: string }) => (
  <button
    type="button"
    onClick={onToggle}
    aria-label={shown ? "Hide password" : "Show password"}
    aria-pressed={shown}
    className={cn(
      "absolute inset-y-0 right-0 flex w-11 items-center justify-center text-muted-foreground hover:text-primary transition-colors duration-200 focus-visible:outline-none focus-visible:text-primary",
      className,
    )}
  >
    {shown ? <EyeOff size={15} /> : <Eye size={15} />}
  </button>
);

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
