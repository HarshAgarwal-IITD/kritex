import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { asset } from "@/lib/asset";
import { resized } from "@/lib/image";
import { cn } from "@/lib/utils";

/**
 * Loading states shaped like the real layouts (same look as the catalog skeletons). Every root
 * carries `data-skeleton` + `aria-busy` + an `aria-label` (tests and the visual suite wait for
 * `data-skeleton` to disappear).
 */
const block = "rounded-none bg-muted/60";

const Bar = ({ className }: { className: string }) => <Skeleton className={cn(block, className)} />;

/**
 * Full-screen loader while a page's code downloads (route-level Suspense fallback). Shown only
 * after 250 ms, so fast navigations don't flash it.
 */
export const PageLoader = () => {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 250);
    return () => clearTimeout(t);
  }, []);
  if (!visible) return <div data-skeleton aria-busy="true" aria-label="Loading page" className="min-h-screen bg-background" />;
  return <PageLoaderView />;
};

const PageLoaderView = () => (
  <div
    data-skeleton
    aria-busy="true"
    aria-label="Loading page"
    className="fixed inset-0 z-40 flex flex-col items-center justify-center gap-6 bg-background"
  >
    <img src={resized(asset("/brand/yellow_full.png"), 360)} alt="" className="h-12 object-contain opacity-90 motion-safe:animate-pulse" />
    <div className="h-px w-40 overflow-hidden bg-border">
      <div className="h-full w-1/3 bg-primary motion-safe:animate-[loader-slide_1.1s_ease-in-out_infinite]" />
    </div>
  </div>
);

/** Rows of thumbnail + two lines + an amount (cart lines, orders, quotes, addresses). */
export const ListSkeleton = ({
  rows = 3,
  label,
  thumbnail = true,
  className,
}: {
  rows?: number;
  label: string;
  thumbnail?: boolean;
  className?: string;
}) => (
  <div data-skeleton aria-busy="true" aria-label={label} className={cn("divide-y divide-border border-y border-border", className)}>
    {Array.from({ length: rows }, (_, i) => (
      <div key={i} className="flex items-center gap-4 py-5">
        {thumbnail && <Bar className="h-16 w-16 shrink-0" />}
        <div className="min-w-0 flex-1 space-y-2.5">
          <Bar className="h-3 w-2/5" />
          <Bar className="h-2.5 w-1/4" />
        </div>
        <Bar className="h-3 w-16" />
      </div>
    ))}
  </div>
);

/** Two columns: content on the left, a summary panel on the right (checkout, cart, order/quote detail). */
export const DetailSkeleton = ({ label, rows = 3 }: { label: string; rows?: number }) => (
  <div data-skeleton aria-busy="true" aria-label={label} className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-10 items-start">
    <div className="space-y-6">
      <Bar className="h-3 w-32" />
      <ListSkeleton rows={rows} label={`${label}: items`} />
    </div>
    <div className="border border-border p-6 space-y-4">
      <Bar className="h-3 w-28" />
      {Array.from({ length: 4 }, (_, i) => (
        <div key={i} className="flex justify-between">
          <Bar className="h-2.5 w-24" />
          <Bar className="h-2.5 w-14" />
        </div>
      ))}
      <Bar className="h-10 w-full mt-4" />
    </div>
  </div>
);

/** A form: label + input pairs and a submit button. */
export const FormSkeleton = ({ label, fields = 4, className }: { label: string; fields?: number; className?: string }) => (
  <div data-skeleton aria-busy="true" aria-label={label} className={cn("space-y-5", className)}>
    {Array.from({ length: fields }, (_, i) => (
      <div key={i} className="space-y-2">
        <Bar className="h-2 w-20" />
        <Bar className="h-11 w-full" />
      </div>
    ))}
    <Bar className="h-11 w-full" />
  </div>
);
