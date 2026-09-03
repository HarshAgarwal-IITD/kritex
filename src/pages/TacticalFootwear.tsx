import { useMemo, useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Breadcrumbs from "@/components/Breadcrumbs";
import ProductCard from "@/components/ProductCard";
import { motion } from "framer-motion";
import { tacticalFootwearProducts } from "@/data/tacticalFootwear";

const TacticalFootwear = () => {
  const [activeType, setActiveType] = useState<string>("all");

  const types = useMemo(() => {
    const unique = Array.from(new Set(tacticalFootwearProducts.map((p) => p.category)));
    return unique;
  }, []);

  const filtered = useMemo(() => {
    if (activeType === "all") return tacticalFootwearProducts;
    return tacticalFootwearProducts.filter((p) => p.category === activeType);
  }, [activeType]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <main className="flex-grow pt-32 pb-20">
        <div className="container">
          <Breadcrumbs
            items={[{ label: "Home", to: "/" }, { label: "All Products", to: "/products" }, { label: "Tactical Footwear" }]}
          />

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.19, 1, 0.22, 1] }}
            className="mb-12"
          >
            <p className="font-display text-xs text-primary mb-3">Equipment / Products</p>
            <h1 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
              Tactical Footwear
            </h1>
            <p className="font-body text-muted-foreground text-sm max-w-lg">
              Explore our complete range of tactical and combat footwear. Engineered for durability, comfort, and performance in all environments.
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
              All ({tacticalFootwearProducts.length})
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
                {type} ({tacticalFootwearProducts.filter((p) => p.category === type).length})
              </button>
            ))}
          </div>

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
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default TacticalFootwear;
