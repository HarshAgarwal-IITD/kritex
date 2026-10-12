import { useMemo, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { m } from "framer-motion";
import { useSkipEntrance } from "@/lib/first-view";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Seo from "@/components/Seo";
import { categorySeo } from "@/seo/pages";
import Breadcrumbs from "@/components/Breadcrumbs";
import { useCategories, useProducts } from "@/features/catalog/hooks";
import { LIST_LIMIT } from "@/features/catalog/constants";
import ProductGrid from "@/features/catalog/components/ProductGrid";
import { TextSkeleton } from "@/features/catalog/components/Skeletons";
import NotFound from "./NotFound";


/** `/products/:categorySlug`: one page for every category (replaces the per-category pages). */
const CategoryPage = ({ categorySlug }: { categorySlug: string }) => {
  const skipEntrance = useSkipEntrance();
  const [activeType, setType] = useState<string>("all");
  const [, setParams] = useSearchParams();
  // A new sub-category starts again at page 1.
  const setActiveType = (type: string) => {
    setType(type);
    setParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete("page");
      return next;
    });
  };

  const categoriesQuery = useCategories();
  const category = categoriesQuery.data?.items.find((c) => c.slug === categorySlug);
  const productsQuery = useProducts({ category: categorySlug, limit: LIST_LIMIT });
  const products = productsQuery.data?.items;

  const types = useMemo(
    () => Array.from(new Set((products ?? []).map((p) => p.subCategory).filter((t): t is string => !!t))),
    [products],
  );
  const filtered = useMemo(
    () => products?.filter((p) => activeType === "all" || p.subCategory === activeType),
    [products, activeType],
  );

  if (categoriesQuery.isSuccess && !category) return <NotFound />;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {category && (
        <Seo {...categorySeo(category)} />
      )}
      <Navbar />

      <main className="flex-grow pt-32 pb-20">
        <div className="container">
          <Breadcrumbs
            items={[
              { label: "Home", to: "/" },
              { label: "All Products", to: "/products" },
              { label: category?.name ?? "…" },
            ]}
          />

          <m.div
            initial={skipEntrance ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.19, 1, 0.22, 1] }}
            className="mb-12"
          >
            <p className="font-display text-xs text-primary mb-3">Equipment / Products</p>
            <h1 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
              {category ? category.name : <TextSkeleton className="h-10 md:h-12 w-72" />}
            </h1>
            <p className="font-body text-muted-foreground text-sm max-w-lg">
              {category ? category.description : <TextSkeleton className="h-4 w-full max-w-lg" />}
            </p>
          </m.div>

          {products && types.length > 1 && (
            <div className="flex gap-2 flex-wrap mb-10">
              <button
                type="button"
                onClick={() => setActiveType("all")}
                className={`font-display text-xs uppercase tracking-wider px-4 py-2 border transition-colors duration-200 ${
                  activeType === "all"
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border text-muted-foreground hover:border-primary/50"
                }`}
              >
                All ({products.length})
              </button>
              {types.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setActiveType(type)}
                  className={`font-display text-xs uppercase tracking-wider px-4 py-2 border transition-colors duration-200 ${
                    activeType === type
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border text-muted-foreground hover:border-primary/50"
                  }`}
                >
                  {type} ({products.filter((p) => p.subCategory === type).length})
                </button>
              ))}
            </div>
          )}

          <ProductGrid
            products={filtered}
            isLoading={productsQuery.isPending}
            isError={productsQuery.isError}
            onRetry={() => productsQuery.refetch()}
            emptyMessage="No products in this category yet."
          />
        </div>
      </main>

      <Footer />
    </div>
  );
};

// Keyed by slug so the sub-category filter resets when moving between categories.
const Category = () => {
  const { categorySlug = "" } = useParams<{ categorySlug: string }>();
  return <CategoryPage key={categorySlug} categorySlug={categorySlug} />;
};

export default Category;
