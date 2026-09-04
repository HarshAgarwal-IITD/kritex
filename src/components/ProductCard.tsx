import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ColorVariant } from "@/data/tacticalFootwear";

export interface ProductSpec {
  label: string;
  value: string;
}

export interface ProductCardProps {
  id?: string;
  name: string;
  category: string;
  description: string;
  images: string[];
  specs?: ProductSpec[];
  colorVariants?: ColorVariant[];
  index?: number;
}

const ProductCard = ({
  id,
  name,
  category,
  description,
  images,
  specs = [],
  colorVariants = [],
  index = 0,
}: ProductCardProps) => {
  const [activeImage, setActiveImage] = useState(0);
  const [selectedColor, setSelectedColor] = useState<number | null>(null);
  const hasMultipleImages = images.length > 1;

  const currentImage =
    selectedColor !== null && colorVariants[selectedColor]?.image
      ? colorVariants[selectedColor].image!
      : images[activeImage];
  const selectedColorLabel = selectedColor !== null ? colorVariants[selectedColor]?.label : null;

  const showPrevImage = () => {
    setSelectedColor(null);
    setActiveImage((current) => (current - 1 + images.length) % images.length);
  };
  const showNextImage = () => {
    setSelectedColor(null);
    setActiveImage((current) => (current + 1) % images.length);
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.08, ease: [0.19, 1, 0.22, 1] }}
      className={cn(
        "group relative border border-border bg-card overflow-hidden hover:border-primary/50 transition-colors duration-300",
        id && "cursor-pointer"
      )}
    >
      <div className="relative aspect-square overflow-hidden bg-neutral-100 p-6">
        <img
          src={currentImage}
          alt={`${name}${selectedColorLabel ? ` — ${selectedColorLabel}` : ` — view ${activeImage + 1}`}`}
          className="w-full h-full object-contain transition-transform duration-700 ease-[cubic-bezier(0.19,1,0.22,1)] group-hover:scale-105"
          loading="lazy"
        />

        {hasMultipleImages && selectedColor === null && (
          <>
            <button
              type="button"
              onClick={showPrevImage}
              aria-label={`Show previous ${name} view`}
              className="absolute left-2 top-1/2 z-20 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-background/50 backdrop-blur-md text-foreground opacity-0 shadow-sm transition-all duration-300 hover:bg-background/80 hover:text-primary group-hover:opacity-100"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={showNextImage}
              aria-label={`Show next ${name} view`}
              className="absolute right-2 top-1/2 z-20 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-background/50 backdrop-blur-md text-foreground opacity-0 shadow-sm transition-all duration-300 hover:bg-background/80 hover:text-primary group-hover:opacity-100"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}
      </div>

      {images.length > 1 && (
        <div className="relative z-20 flex gap-2 border-t border-border bg-muted/30 p-2">
          {images.map((image, i) => (
            <button
              key={image}
              type="button"
              onClick={() => {
                setActiveImage(i);
                setSelectedColor(null);
              }}
              aria-label={`Show ${name} view ${i + 1}`}
              aria-current={i === activeImage && selectedColor === null}
              className={cn(
                "h-12 w-12 shrink-0 overflow-hidden border bg-neutral-100 p-1 transition-opacity duration-200",
                i === activeImage && selectedColor === null
                  ? "border-primary opacity-100"
                  : "border-transparent opacity-50 hover:opacity-90"
              )}
            >
              <img src={image} alt="" className="h-full w-full object-contain" loading="lazy" />
            </button>
          ))}
        </div>
      )}

      {colorVariants.length > 0 && (
        <div className="relative z-20 flex items-center gap-2 border-t border-border bg-muted/30 p-2">
          {colorVariants.map((variant, i) => (
            <button
              key={variant.label}
              type="button"
              onClick={() => setSelectedColor(i)}
              title={variant.label}
              aria-label={`View ${name} in ${variant.label}`}
              aria-current={selectedColor === i}
              className={cn(
                "h-6 w-6 shrink-0 rounded-full overflow-hidden border-2 transition-colors duration-200 bg-background",
                selectedColor === i ? "border-primary" : "border-border hover:border-primary/50"
              )}
            >
              <img
                src={variant.swatch ?? variant.image}
                alt={variant.label}
                className={cn("h-full w-full", variant.swatch ? "object-cover" : "object-contain p-0.5")}
              />
            </button>
          ))}
        </div>
      )}

      <div className="p-6">
        <p className="font-display text-[10px] uppercase tracking-wider text-primary mb-2">{category}</p>
        <h3 className="font-display text-lg text-foreground transition-colors duration-200 group-hover:text-primary">
          {name}
        </h3>

        {id && (
          <div className="mt-4 pt-4 border-t border-border flex items-center justify-between font-display text-[10px] uppercase tracking-wider text-primary">
            View Details & Enquire
            <ChevronRight size={12} className="transition-transform duration-200 group-hover:translate-x-1" />
          </div>
        )}
      </div>

      {id && (
        <Link
          to={`/product/${id}`}
          className="absolute inset-0 z-10"
          aria-label={`View details for ${name}`}
        />
      )}
    </motion.article>
  );
};

export default ProductCard;
