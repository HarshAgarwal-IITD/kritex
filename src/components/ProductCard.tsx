import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ProductSpec {
  label: string;
  value: string;
}

export interface ProductCardProps {
  name: string;
  category: string;
  description: string;
  images: string[];
  specs?: ProductSpec[];
  index?: number;
}

const ProductCard = ({ name, category, description, images, specs = [], index = 0 }: ProductCardProps) => {
  const [activeImage, setActiveImage] = useState(0);
  const hasMultipleImages = images.length > 1;

  const showPrevImage = () => setActiveImage((current) => (current - 1 + images.length) % images.length);
  const showNextImage = () => setActiveImage((current) => (current + 1) % images.length);

  return (
    <motion.article
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.08, ease: [0.19, 1, 0.22, 1] }}
      className="group border border-border bg-card overflow-hidden hover:border-primary/50 transition-colors duration-300"
    >
      <div className="relative aspect-square overflow-hidden bg-muted p-6">
        <img
          src={images[activeImage]}
          alt={`${name} — view ${activeImage + 1}`}
          className="w-full h-full object-contain transition-transform duration-700 ease-[cubic-bezier(0.19,1,0.22,1)] group-hover:scale-105"
          loading="lazy"
        />

        {hasMultipleImages && (
          <>
            <button
              type="button"
              onClick={showPrevImage}
              aria-label={`Show previous ${name} view`}
              className="absolute left-2 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-background/50 backdrop-blur-md text-foreground opacity-0 shadow-sm transition-all duration-300 hover:bg-background/80 hover:text-primary group-hover:opacity-100"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={showNextImage}
              aria-label={`Show next ${name} view`}
              className="absolute right-2 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-background/50 backdrop-blur-md text-foreground opacity-0 shadow-sm transition-all duration-300 hover:bg-background/80 hover:text-primary group-hover:opacity-100"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}
      </div>

      {images.length > 1 && (
        <div className="flex gap-2 border-t border-border bg-muted/30 p-2">
          {images.map((image, i) => (
            <button
              key={image}
              type="button"
              onClick={() => setActiveImage(i)}
              aria-label={`Show ${name} view ${i + 1}`}
              aria-current={i === activeImage}
              className={cn(
                "h-12 w-12 shrink-0 overflow-hidden border bg-muted p-1 transition-opacity duration-200",
                i === activeImage ? "border-primary opacity-100" : "border-transparent opacity-50 hover:opacity-90"
              )}
            >
              <img src={image} alt="" className="h-full w-full object-contain" loading="lazy" />
            </button>
          ))}
        </div>
      )}

      <div className="p-6">
        <p className="font-display text-[10px] uppercase tracking-wider text-primary mb-2">{category}</p>
        <h3 className="font-display text-lg text-foreground mb-2">{name}</h3>
        <p className="font-body text-sm text-muted-foreground">{description}</p>

        {specs.length > 0 && (
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 border-t border-border mt-4 pt-4">
            {specs.map((spec) => (
              <div key={spec.label}>
                <dt className="font-display text-[9px] uppercase tracking-wider text-muted-foreground">
                  {spec.label}
                </dt>
                <dd className="font-body text-xs text-foreground mt-0.5">{spec.value}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>
    </motion.article>
  );
};

export default ProductCard;
