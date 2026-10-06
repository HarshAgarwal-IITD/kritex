/** Inline error state for a failed catalog query, styled like the empty-results box. */
const QueryError = ({ message = "Couldn't load products.", onRetry }: { message?: string; onRetry?: () => void }) => (
  <div role="alert" className="border border-dashed border-border py-20 text-center">
    <p className="font-display text-sm text-muted-foreground">{message}</p>
    {onRetry && (
      <button
        type="button"
        onClick={onRetry}
        className="mt-4 font-display text-xs text-primary hover:text-primary/80 transition-colors duration-300"
      >
        Try again →
      </button>
    )}
  </div>
);

export default QueryError;
