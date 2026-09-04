import { useMemo, useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Breadcrumbs from "@/components/Breadcrumbs";
import ProductCard from "@/components/ProductCard";
import { motion } from "framer-motion";
import { combatApparelProducts } from "@/data/combatApparel";

const CombatApparel = () => {
  const [activeType, setActiveType] = useState<string>("all");

  const types = useMemo(() => {
    const unique = Array.from(new Set(combatApparelProducts.map((p) => p.category)));
    return unique;
  }, []);

  const filtered = useMemo(() => {
    if (activeType === "all") return combatApparelProducts;
    return combatApparelProducts.filter((p) => p.category === activeType);
  }, [activeType]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <main className="flex-grow pt-32 pb-20">
        <div className="container">
          <Breadcrumbs
            items={[{ label: "Home", to: "/" }, { label: "All Products", to: "/products" }, { label: "Combat Apparel" }]}
          />

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.19, 1, 0.22, 1] }}
            className="mb-12"
          >
            <p className="font-display text-xs text-primary mb-3">Equipment / Products</p>
            <h1 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
              Combat Apparel
            </h1>
            <p className="font-body text-muted-foreground text-sm max-w-lg">
              Explore our complete range of combat apparel — t-shirts, cargo trousers and tactical outerwear engineered for durability, comfort, and performance in the field.
            </p>
          </motion.div>

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
              All ({combatApparelProducts.length})
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
                {type} ({combatApparelProducts.filter((p) => p.category === type).length})
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filtered.map((product, i) => (
              <ProductCard
                key={product.id}
                id={product.id}
                name={product.name}
                category={product.category}
                description={product.description}
                images={product.images}
                specs={product.specs}
                colorVariants={product.colorVariants}
                index={i}
              />
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default CombatApparel;
