import { Skeleton } from "@/components/ui/skeleton";

/**
 * Loading placeholders shaped like the real layouts. Each root carries `data-skeleton`
 * (the visual-regression suite waits for these to disappear).
 */
const block = "rounded-none bg-muted/60";

export const ProductCardSkeleton = () => (
  <div data-skeleton className="border border-border bg-card overflow-hidden">
    <Skeleton className={`aspect-square w-full ${block}`} />
    <div className="p-6 space-y-3">
      <Skeleton className={`h-2.5 w-24 ${block}`} />
      <Skeleton className={`h-5 w-3/4 ${block}`} />
      <Skeleton className={`h-2.5 w-40 mt-6 ${block}`} />
    </div>
  </div>
);

export const ProductGridSkeleton = ({ count = 6 }: { count?: number }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8" aria-busy="true" aria-label="Loading products">
    {Array.from({ length: count }, (_, i) => (
      <ProductCardSkeleton key={i} />
    ))}
  </div>
);

export const ProductDetailSkeleton = () => (
  <div data-skeleton className="grid grid-cols-1 lg:grid-cols-2 gap-12" aria-busy="true" aria-label="Loading product">
    <Skeleton className={`aspect-square w-full border border-border ${block}`} />
    <div className="space-y-4">
      <Skeleton className={`h-3 w-40 ${block}`} />
      <Skeleton className={`h-9 w-3/4 ${block}`} />
      <Skeleton className={`h-4 w-full max-w-lg ${block}`} />
      <Skeleton className={`h-4 w-5/6 max-w-lg ${block}`} />
      <div className="flex gap-2 pt-6">
        {Array.from({ length: 5 }, (_, i) => (
          <Skeleton key={i} className={`h-9 w-12 ${block}`} />
        ))}
      </div>
      <Skeleton className={`h-10 w-40 mt-8 ${block}`} />
    </div>
  </div>
);

/** Inline text placeholder (e.g. an "N items" count). */
export const TextSkeleton = ({ className = "h-2.5 w-12" }: { className?: string }) => (
  <Skeleton data-skeleton className={`inline-block align-middle ${block} ${className}`} />
);
