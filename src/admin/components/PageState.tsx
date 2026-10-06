import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export const FullPageSpinner = ({ label = "Loading" }: { label?: string }) => (
  <div className="min-h-screen flex items-center justify-center bg-background" role="status" aria-label={label}>
    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
  </div>
);

export const ErrorState = ({ message, onRetry }: { message: string; onRetry?: () => void }) => (
  <div className="flex flex-col items-start gap-3 border border-border p-6" role="alert">
    <p className="font-body text-sm text-muted-foreground">{message}</p>
    {onRetry && (
      <Button variant="outline" size="sm" onClick={onRetry}>
        Try again
      </Button>
    )}
  </div>
);

export const PageHeader = ({ title, description, actions }: { title: string; description?: string; actions?: React.ReactNode }) => (
  <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
    <div>
      <h1 className="font-display text-2xl text-foreground">{title}</h1>
      {description && <p className="font-body text-sm text-muted-foreground mt-1">{description}</p>}
    </div>
    {actions && <div className="flex items-center gap-2">{actions}</div>}
  </div>
);
