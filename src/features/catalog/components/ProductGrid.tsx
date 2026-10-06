import CatalogProductCard from "./CatalogProductCard";
import QueryError from "./QueryError";
import { ProductGridSkeleton } from "./Skeletons";
import type { ProductCardDto } from "../types";

interface ProductGridProps {
  products: ProductCardDto[] | undefined;
  isLoading: boolean;
  isError?: boolean;
  onRetry?: () => void;
  emptyMessage?: string;
}

/** The 1/2/3-column product grid with loading, error and empty states. */
const ProductGrid = ({ products, isLoading, isError, onRetry, emptyMessage = "No products match your search." }: ProductGridProps) => {
  if (isLoading) return <ProductGridSkeleton />;
  if (isError || !products) return <QueryError onRetry={onRetry} />;
  if (products.length === 0) {
    return (
      <div className="border border-dashed border-border py-20 text-center">
        <p className="font-display text-sm text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {products.map((product, i) => (
        <CatalogProductCard key={product.id} product={product} index={i} />
      ))}
    </div>
  );
};

export default ProductGrid;
