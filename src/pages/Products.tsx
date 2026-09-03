import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Search } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Breadcrumbs from "@/components/Breadcrumbs";
import ProductCard from "@/components/ProductCard";
import { productCategories } from "@/data/productCategories";
import { tacticalFootwearProducts } from "@/data/tacticalFootwear";

type CatalogEntry = {
  id: string;
  name: string;
  category: string;
  categorySlug: string;
  description: string;
  images: string[];
  specs: { label: string; value: string }[];
};

const allProducts: CatalogEntry[] = tacticalFootwearProducts.map((p) => ({
  ...p,
  categorySlug: "tactical-footwear",
}));

const Products = () => {
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    return allProducts.filter((p) => {
      const matchesCategory = activeCategory === "all" || p.categorySlug === activeCategory;
      const matchesQuery =
        query.trim().length === 0 ||
        p.name.toLowerCase().includes(query.toLowerCase()) ||
        p.category.toLowerCase().includes(query.toLowerCase());
      return matchesCategory && matchesQuery;
    });
  }, [activeCategory, query]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-border mb-12">
            {productCategories.map((cat) => {
              const isActive = activeCategory === cat.slug;
              const content = (
                <div
                  className={`group relative bg-background p-4 md:p-5 h-full transition-colors duration-300 ${
                    cat.available ? "cursor-pointer" : "cursor-default"
                  } ${isActive ? "bg-muted" : ""}`}
                >
                  <p className="font-display text-xs md:text-sm text-foreground mb-1">{cat.title}</p>
                  {cat.available ? (
                    <p className="font-display text-[10px] text-primary">{cat.productCount} items</p>
                  ) : (
                    <p className="font-display text-[10px] text-muted-foreground">Coming Soon</p>
                  )}
                </div>
              );
              return cat.available ? (
                <button
                  key={cat.slug}
                  type="button"
                  onClick={() => setActiveCategory(isActive ? "all" : cat.slug)}
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

          {/* Search + filter row */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-10">
            <div className="flex gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => setActiveCategory("all")}
                className={`font-display text-xs uppercase tracking-wider px-4 py-2 border transition-colors duration-200 ${
                  activeCategory === "all"
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border text-muted-foreground hover:border-primary/50"
                }`}
              >
                All
              </button>
              {productCategories
                .filter((c) => c.available)
                .map((cat) => (
                  <button
                    key={cat.slug}
                    type="button"
                    onClick={() => setActiveCategory(cat.slug)}
                    className={`font-display text-xs uppercase tracking-wider px-4 py-2 border transition-colors duration-200 ${
                      activeCategory === cat.slug
                        ? "bg-primary text-primary-foreground border-primary"
                        : "border-border text-muted-foreground hover:border-primary/50"
                    }`}
                  >
                    {cat.title}
                  </button>
                ))}
            </div>

            <div className="relative w-full sm:w-64">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search products..."
                className="w-full bg-card border border-border pl-9 pr-3 py-2 font-body text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-colors duration-200"
              />
            </div>
          </div>

          {filtered.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filtered.map((product, i) => (
                <ProductCard
                  key={product.id}
                  name={product.name}
                  category={product.category}
                  description={product.description}
                  images={product.images}
                  specs={product.specs}
                  index={i}
                />
              ))}
            </div>
          ) : (
            <div className="border border-dashed border-border py-20 text-center">
              <p className="font-display text-sm text-muted-foreground">No products match your search.</p>
            </div>
          )}

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
