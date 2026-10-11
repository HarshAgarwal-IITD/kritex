import { useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import CatalogProductCard from "./CatalogProductCard";
import QueryError from "./QueryError";
import { ProductGridSkeleton } from "./Skeletons";
import type { ProductCardDto } from "../types";

/** Products per page: four rows of three on desktop. */
export const PAGE_SIZE = 12;

interface ProductGridProps {
  products: ProductCardDto[] | undefined;
  isLoading: boolean;
  isError?: boolean;
  onRetry?: () => void;
  emptyMessage?: string;
}

/**
 * The 1/2/3-column product grid with loading, error and empty states, paged by `?page=` (so Back and
 * shared links keep the page). Pages that change the filters drop `page` to start again at 1.
 */
const ProductGrid = ({ products, isLoading, isError, onRetry, emptyMessage = "No products match your search." }: ProductGridProps) => {
  const [params, setParams] = useSearchParams();
  const top = useRef<HTMLDivElement>(null);

  if (isLoading) return <ProductGridSkeleton />;
  if (isError || !products) return <QueryError onRetry={onRetry} />;
  if (products.length === 0) {
    return (
      <div className="border border-dashed border-border py-20 text-center">
        <p className="font-display text-sm text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  const pageCount = Math.ceil(products.length / PAGE_SIZE);
  const page = Math.min(Math.max(1, Math.floor(Number(params.get("page")) || 1)), pageCount);
  const first = (page - 1) * PAGE_SIZE;
  const visible = products.slice(first, first + PAGE_SIZE);

  const goTo = (next: number) => {
    setParams((prev) => {
      const query = new URLSearchParams(prev);
      if (next === 1) query.delete("page");
      else query.set("page", String(next));
      return query;
    });
    top.current?.scrollIntoView?.({ behavior: "smooth", block: "start" });
  };

  return (
    <div ref={top} className="scroll-mt-32">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {visible.map((product, i) => (
          <CatalogProductCard key={product.id} product={product} index={i} />
        ))}
      </div>
      {pageCount > 1 && (
        <nav aria-label="Product pages" className="mt-12 flex flex-col items-center gap-4">
          <div className="flex items-center gap-px bg-border border border-border">
            <PageButton label="Previous page" disabled={page === 1} onClick={() => goTo(page - 1)}>
              <ChevronLeft size={14} />
            </PageButton>
            {Array.from({ length: pageCount }, (_, i) => i + 1).map((n) => (
              <PageButton key={n} label={`Page ${n}`} current={n === page} onClick={() => goTo(n)}>
                {n}
              </PageButton>
            ))}
            <PageButton label="Next page" disabled={page === pageCount} onClick={() => goTo(page + 1)}>
              <ChevronRight size={14} />
            </PageButton>
          </div>
          <p className="font-display text-[10px] uppercase tracking-wider text-muted-foreground" data-testid="page-summary">
            {first + 1}–{first + visible.length} of {products.length} products
          </p>
        </nav>
      )}
    </div>
  );
};

const PageButton = ({
  label,
  current,
  disabled,
  onClick,
  children,
}: {
  label: string;
  current?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) => (
  <button
    type="button"
    aria-label={label}
    aria-current={current ? "page" : undefined}
    disabled={disabled}
    onClick={onClick}
    className={`font-display text-xs min-w-10 h-10 px-3 inline-flex items-center justify-center transition-colors duration-200 disabled:opacity-40 disabled:cursor-not-allowed ${
      current ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground hover:text-primary"
    }`}
  >
    {children}
  </button>
);

export default ProductGrid;
