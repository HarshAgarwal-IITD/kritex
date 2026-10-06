import { useMemo } from "react";
import { motion } from "framer-motion";
import { Link, useSearchParams } from "react-router-dom";
import { X } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Seo from "@/components/Seo";
import Breadcrumbs from "@/components/Breadcrumbs";
import { useCategories, useProducts } from "@/features/catalog/hooks";
import { LIST_LIMIT } from "@/features/catalog/constants";
import ProductGrid from "@/features/catalog/components/ProductGrid";
import SearchBox from "@/features/catalog/components/SearchBox";
import SortSelect from "@/features/catalog/components/SortSelect";
import { SORT_OPTIONS } from "@/features/catalog/view";
import { TextSkeleton } from "@/features/catalog/components/Skeletons";
import type { ProductSort } from "@/features/catalog/types";

/** Filters live in the URL so results are linkable and survive back/forward. */
type FilterKey = "category" | "type" | "q" | "sort" | "size" | "colour";

const isSort = (v: string | null): v is ProductSort => SORT_OPTIONS.some((o) => o.value === v);

const Products = () => {
  const [params, setParams] = useSearchParams();
  const activeCategory = params.get("category") ?? "all";
  const activeType = params.get("type") ?? "all";
  const query = params.get("q") ?? "";
  const sortParam = params.get("sort");
  const sort: ProductSort = isSort(sortParam) ? sortParam : "newest";
  const size = params.get("size") ?? undefined;
  const colour = params.get("colour") ?? undefined;

  const setFilters = (patch: Partial<Record<FilterKey, string | null>>) => {
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        for (const [key, value] of Object.entries(patch)) {
          if (!value || value === "all" || (key === "sort" && value === "newest")) next.delete(key);
          else next.set(key, value);
        }
        return next;
      },
      { replace: true },
    );
  };

  const setCategory = (slug: string) => setFilters({ category: slug, type: null });

  const categoriesQuery = useCategories();
  const categories = categoriesQuery.data?.items;
  const totalProducts = categories?.reduce((sum, c) => sum + c.productCount, 0);

  const category = activeCategory === "all" ? undefined : activeCategory;
  // Unsearched products of the selected department: drives the "Refine" chips and their counts.
  const departmentQuery = useProducts({ category, limit: LIST_LIMIT });
  const resultsQuery = useProducts({ category, q: query, sort, size, colour, limit: LIST_LIMIT });

  const productsInCategory = departmentQuery.data?.items;
  const types = useMemo(
    () => Array.from(new Set((productsInCategory ?? []).map((p) => p.subCategory).filter((t): t is string => !!t))),
    [productsInCategory],
  );

  const filtered = useMemo(
    () => resultsQuery.data?.items.filter((p) => activeType === "all" || p.subCategory === activeType),
    [resultsQuery.data, activeType],
  );

  const activeOptionFilters = [
    size ? { key: "size" as const, label: `Size: ${size}` } : null,
    colour ? { key: "colour" as const, label: `Colour: ${colour}` } : null,
  ].filter((f): f is { key: "size" | "colour"; label: string } => f !== null);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Seo
        title="All Products"
        description="Browse Kritex's complete catalog of tactical footwear, combat apparel and load-bearing equipment for defence and industrial use."
        path="/products"
      />
      <Navbar />

      <main className="flex-grow pt-32 pb-20">
        <div className="container">
          <Breadcrumbs items={[{ label: "Home", to: "/" }, { label: "All Products" }]} />

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.19, 1, 0.22, 1] }}
            className="mb-12"
          >
            <p className="font-display text-xs text-primary mb-3">Equipment / Full Catalog</p>
            <h1 className="text-3xl md:text-5xl font-bold text-foreground mb-4">All Products</h1>
            <p className="font-body text-muted-foreground text-sm max-w-lg">
              Browse Kritex's complete equipment catalog by category, or search for a specific item.
            </p>
          </motion.div>

          {/* Category tiles */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-border mb-6">
            <button
              type="button"
              onClick={() => setCategory("all")}
              className="text-left"
            >
              <div
                className={`group relative bg-background p-4 md:p-5 h-full transition-colors duration-300 cursor-pointer ${
                  activeCategory === "all" ? "bg-muted" : ""
                }`}
              >
                <p className="font-display text-xs md:text-sm text-foreground mb-1">All Products</p>
                <p className="font-display text-[10px] text-primary">
                  {totalProducts === undefined ? <TextSkeleton /> : `${totalProducts} items`}
                </p>
              </div>
            </button>
            {categories?.map((cat) => {
              const isActive = activeCategory === cat.slug;
              const available = cat.productCount > 0;
              const content = (
                <div
                  className={`group relative bg-background p-4 md:p-5 h-full transition-colors duration-300 ${
                    available ? "cursor-pointer" : "cursor-default"
                  } ${isActive ? "bg-muted" : ""}`}
                >
                  <p className="font-display text-xs md:text-sm text-foreground mb-1">{cat.name}</p>
                  {available ? (
                    <p className="font-display text-[10px] text-primary">{cat.productCount} items</p>
                  ) : (
                    <p className="font-display text-[10px] text-muted-foreground">Coming Soon</p>
                  )}
                </div>
              );
              return available ? (
                <button
                  key={cat.slug}
                  type="button"
                  onClick={() => setCategory(isActive ? "all" : cat.slug)}
                  className="text-left"
                >
                  {content}
                </button>
              ) : (
                <div key={cat.slug} aria-disabled className="opacity-50">
                  {content}
                </div>
              );
            })}
          </div>

          {/* Subcategory refinement — appears once a department is selected, mirrors the dedicated category pages */}
          {activeCategory !== "all" && types.length > 1 && productsInCategory && (
            <div className="flex items-center gap-2 flex-wrap mb-6 pl-1">
              <span className="font-display text-[10px] uppercase tracking-wider text-muted-foreground mr-1">
                Refine:
              </span>
              <button
                type="button"
                onClick={() => setFilters({ type: null })}
                className={`font-display text-[11px] uppercase tracking-wider px-3 py-1.5 border transition-colors duration-200 ${
                  activeType === "all"
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border text-muted-foreground hover:border-primary/50"
                }`}
              >
                All ({productsInCategory.length})
              </button>
              {types.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setFilters({ type })}
                  className={`font-display text-[11px] uppercase tracking-wider px-3 py-1.5 border transition-colors duration-200 ${
                    activeType === type
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border text-muted-foreground hover:border-primary/50"
                  }`}
                >
                  {type} ({productsInCategory.filter((p) => p.subCategory === type).length})
                </button>
              ))}
            </div>
          )}

          {/* Search + sort */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-end mb-10">
            {activeOptionFilters.length > 0 && (
              <div className="flex gap-2 flex-wrap sm:mr-auto">
                {activeOptionFilters.map((f) => (
                  <button
                    key={f.key}
                    type="button"
                    onClick={() => setFilters({ [f.key]: null })}
                    aria-label={`Remove filter ${f.label}`}
                    className="inline-flex items-center gap-1.5 font-display text-[11px] uppercase tracking-wider px-3 py-1.5 border border-primary text-primary hover:bg-primary/10 transition-colors duration-200"
                  >
                    {f.label}
                    <X size={10} />
                  </button>
                ))}
              </div>
            )}
            <SortSelect value={sort} onChange={(v) => setFilters({ sort: v })} />
            <SearchBox value={query} onSearch={(q) => setFilters({ q })} />
          </div>

          <ProductGrid
            products={filtered}
            isLoading={resultsQuery.isPending}
            isError={resultsQuery.isError}
            onRetry={() => resultsQuery.refetch()}
          />

          <div className="mt-16 pt-8 border-t border-border">
            <p className="font-display text-xs text-muted-foreground mb-3">Looking for something specific?</p>
            <Link
              to="/#contact"
              className="font-display text-xs bg-primary text-primary-foreground px-4 py-2 inline-block hover:bg-primary/90 transition-colors duration-300"
            >
              Send a Procurement Inquiry
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Products;
