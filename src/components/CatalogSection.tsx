import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useCategories } from "@/features/catalog/hooks";
import { assetUrl } from "@/features/catalog/view";
import { Skeleton } from "@/components/ui/skeleton";

const CatalogSection = () => {
  const { data, isPending } = useCategories();
  const categories = (data?.items ?? []).map((c) => ({
    slug: c.slug,
    title: c.name,
    image: c.image ? assetUrl(c.image) : undefined,
    productCount: c.productCount,
    available: c.productCount > 0,
  }));

  return (
    <section id="catalog" className="py-20 md:py-32">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease: [0.19, 1, 0.22, 1] }}
          className="mb-16 flex flex-col md:flex-row md:items-end md:justify-between gap-6"
        >
          <div>
            <p className="font-display text-xs text-primary mb-3">Equipment Categories</p>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">
              Mission-Critical Gear
            </h2>
          </div>
          <Link
            to="/products"
            className="font-display text-xs text-primary hover:text-primary/80 transition-colors duration-300 shrink-0"
          >
            View All Products →
          </Link>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-border">
          {isPending &&
            Array.from({ length: 4 }, (_, i) => (
              <div key={i} data-skeleton className="bg-background">
                <Skeleton className="aspect-square w-full rounded-none bg-muted/60" />
                <div className="p-6 border-t border-border space-y-2">
                  <Skeleton className="h-3.5 w-32 rounded-none bg-muted/60" />
                  <Skeleton className="h-2.5 w-14 rounded-none bg-muted/60" />
                </div>
              </div>
            ))}
          {categories.map((cat, i) => {
            const card = (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.05, ease: [0.19, 1, 0.22, 1] }}
                className={`group relative bg-background overflow-hidden ${
                  cat.available ? "cursor-pointer" : ""
                }`}
              >
                {cat.available && (
                  <Link to={`/products/${cat.slug}`} className="absolute inset-0 z-10" aria-label={`View ${cat.title}`} />
                )}
                <div className="aspect-square overflow-hidden relative">
                  <img
                    src={cat.image}
                    alt={cat.title}
                    className={`w-full h-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.19,1,0.22,1)] ${
                      cat.available ? "group-hover:scale-105" : "opacity-60 grayscale"
                    }`}
                    loading="lazy"
                  />
                  {!cat.available && (
                    <span className="absolute top-4 right-4 font-display text-[10px] uppercase tracking-wider bg-background/80 text-muted-foreground px-2 py-1 border border-border">
                      Coming Soon
                    </span>
                  )}
                  {/* Blueprint overlay on hover */}
                  {cat.available && (
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                      <svg className="w-full h-full" viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect x="40" y="40" width="320" height="320" stroke="hsl(var(--primary))" strokeWidth="0.5" strokeDasharray="4 4" opacity="0.4" />
                        <line x1="200" y1="20" x2="200" y2="380" stroke="hsl(var(--primary))" strokeWidth="0.3" opacity="0.2" />
                        <line x1="20" y1="200" x2="380" y2="200" stroke="hsl(var(--primary))" strokeWidth="0.3" opacity="0.2" />
                        <circle cx="200" cy="200" r="80" stroke="hsl(var(--primary))" strokeWidth="0.3" opacity="0.2" />
                      </svg>
                    </div>
                  )}
                </div>

                <div className="p-6 border-t border-border">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-display text-sm text-foreground mb-1">{cat.title}</h3>
                      <p className="font-display text-[10px] text-muted-foreground tabular">
                        {cat.available ? `${cat.productCount} items` : "Coming soon"}
                      </p>
                    </div>
                    {cat.available && (
                      <span className="font-display text-xs text-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        View →
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            );

            return <div key={cat.slug}>{card}</div>;
          })}
        </div>
      </div>
    </section>
  );
};

export default CatalogSection;
