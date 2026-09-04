import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Breadcrumbs from "@/components/Breadcrumbs";
import ProductCard from "@/components/ProductCard";
import { motion } from "framer-motion";
import { loadBearingProducts } from "@/data/loadBearing";

const LoadBearing = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <main className="flex-grow pt-32 pb-20">
        <div className="container">
          <Breadcrumbs
            items={[{ label: "Home", to: "/" }, { label: "All Products", to: "/products" }, { label: "Load Bearing" }]}
          />

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.19, 1, 0.22, 1] }}
            className="mb-12"
          >
            <p className="font-display text-xs text-primary mb-3">Equipment / Products</p>
            <h1 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
              Load Bearing
            </h1>
            <p className="font-body text-muted-foreground text-sm max-w-lg">
              Rucksacks, packs and carrying equipment engineered for organized, modular gear storage in the field.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {loadBearingProducts.map((product, i) => (
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

export default LoadBearing;
