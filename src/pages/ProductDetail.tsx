import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { m } from "framer-motion";
import { useSkipEntrance } from "@/lib/first-view";
import { ChevronLeft, ChevronRight, Maximize2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Breadcrumbs from "@/components/Breadcrumbs";
import Seo from "@/components/Seo";
import { cn } from "@/lib/utils";
import { resized, srcSet } from "@/lib/image";
import { SwatchFill } from "@/components/ProductCard";
import { useProduct } from "@/features/catalog/hooks";
import type { ProductDetail as ProductDetailDto } from "@/features/catalog/types";
import {
  assetUrl,
  colourOption,
  colourVariants,
  ctaKind,
  findVariant,
  galleryImages,
  isValueAvailable,
  textOptions,
  type Selection,
} from "@/features/catalog/view";
import { PriceBlock, PurchaseCta, StockState } from "@/features/catalog/components/PurchasePanel";
import { productSeo } from "@/seo/pages";
import { ProductDetailSkeleton } from "@/features/catalog/components/Skeletons";
import QueryError from "@/features/catalog/components/QueryError";
import { DescriptionBody } from "@/features/catalog/components/DescriptionBody";
import { splitDescription } from "@/features/catalog/description";

const ProductDetail = () => {
  const { id = "" } = useParams<{ id: string }>();
  const { data: product, isPending, isError, error, refetch } = useProduct(id);
  const notFound = isError && (error as { status?: number }).status === 404;

  if (isPending || (isError && !notFound)) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <main className="flex-grow pt-32 pb-20">
          <div className="container">
            <Breadcrumbs items={[{ label: "Home", to: "/" }, { label: "All Products", to: "/products" }, { label: "\u2026" }]} />
            {isPending ? <ProductDetailSkeleton /> : <QueryError message="Couldn't load this product." onRetry={() => refetch()} />}
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Seo title="Product Not Found" description="The product you are looking for could not be found." path={`/product/${id}`} noindex />
        <Navbar />
        <main className="flex-grow pt-32 pb-20">
          <div className="container">
            <Breadcrumbs items={[{ label: "Home", to: "/" }, { label: "All Products", to: "/products" }, { label: "Not Found" }]} />
            <p className="font-display text-sm text-muted-foreground">
              Product not found. <Link to="/products" className="text-primary hover:text-primary/80">Return to all products →</Link>
            </p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return <ProductView key={product.slug} product={product} />;
};

const ProductView = ({ product }: { product: ProductDetailDto }) => {
  const skipEntrance = useSkipEntrance();
  const [activeImage, setActiveImage] = useState(0);
  const [selection, setSelection] = useState<Selection>({});

  const colorVariants = colourVariants(product);
  const colourName = colourOption(product)?.name;
  const selectedColor = colourName && selection[colourName] ? colorVariants.findIndex((v) => v.label === selection[colourName]) : -1;
  const sizeOptions = textOptions(product);
  const variant = findVariant(product, selection);
  const kind = ctaKind(product);
  const sellable = product.saleChannel !== "ENQUIRY_ONLY";
  const pick = (name: string, value: string) => setSelection((s) => ({ ...s, [name]: value }));
  const { intro, body: descriptionBody } = splitDescription(product.description ?? "");
  const sheets = product.specSheets ?? [];

  const displayImages = galleryImages(product);
  const currentImage =
    selectedColor >= 0 && colorVariants[selectedColor]?.image
      ? colorVariants[selectedColor].image!
      : displayImages[activeImage];

  const showPrev = () => setActiveImage((c) => (c - 1 + displayImages.length) % displayImages.length);
  const showNext = () => setActiveImage((c) => (c + 1) % displayImages.length);

  const selectedColorLabel = selectedColor >= 0 ? colorVariants[selectedColor]?.label : null;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Seo {...productSeo(product)} />
      <Navbar />

      <main className="flex-grow pt-32 pb-20">
        <div className="container">
          <Breadcrumbs
            items={[
              { label: "Home", to: "/" },
              { label: "All Products", to: "/products" },
              { label: product.category.name, to: `/products/${product.category.slug}` },
              { label: product.name },
            ]}
          />

          <m.div
            initial={skipEntrance ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.19, 1, 0.22, 1] }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-12"
          >
            {/* Gallery */}
            <div>
              <div className="relative aspect-square overflow-hidden bg-neutral-100 p-8 border border-border">
                <img
                  src={currentImage}
                  srcSet={srcSet(currentImage)}
                  sizes="(min-width: 1024px) 45vw, 92vw"
                  alt={`${product.name}${selectedColorLabel ? ` — ${selectedColorLabel}` : ""}`}
                  className="w-full h-full object-contain"
                  // LCP element; lowercase because React 18 doesn't know `fetchPriority`.
                  {...{ fetchpriority: "high" }}
                />
                {displayImages.length > 1 && selectedColor < 0 && (
                  <>
                    <button
                      type="button"
                      onClick={showPrev}
                      aria-label="Previous image"
                      className="absolute left-3 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-background/60 backdrop-blur-md text-foreground shadow-sm hover:bg-background/90 hover:text-primary transition-colors duration-200"
                    >
                      <ChevronLeft size={18} />
                    </button>
                    <button
                      type="button"
                      onClick={showNext}
                      aria-label="Next image"
                      className="absolute right-3 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-background/60 backdrop-blur-md text-foreground shadow-sm hover:bg-background/90 hover:text-primary transition-colors duration-200"
                    >
                      <ChevronRight size={18} />
                    </button>
                  </>
                )}
              </div>

              {displayImages.length > 1 && (
                <div className="flex gap-2 mt-3">
                  {displayImages.map((image, i) => (
                    <button
                      key={image}
                      type="button"
                      onClick={() => {
                        setActiveImage(i);
                        if (colourName) setSelection((s) => ({ ...s, [colourName]: undefined }));
                      }}
                      aria-label={`Show view ${i + 1}`}
                      aria-current={i === activeImage && selectedColor < 0}
                      className={cn(
                        "h-16 w-16 shrink-0 overflow-hidden border bg-neutral-100 p-1.5 transition-opacity duration-200",
                        i === activeImage && selectedColor < 0
                          ? "border-primary opacity-100"
                          : "border-border opacity-50 hover:opacity-90"
                      )}
                    >
                      <img src={resized(image, 128)} alt="" className="h-full w-full object-contain" loading="lazy" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Info */}
            <div>
              <p className="font-display text-xs text-primary mb-3">
                {product.category.name}
                {product.subCategory && <> / {product.subCategory}</>}
              </p>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">{product.name}</h1>
              <PriceBlock product={product} variant={variant} />
              {intro && (
                <p className="font-body text-muted-foreground text-sm leading-relaxed max-w-lg mb-8">{intro}</p>
              )}

              {/* Color variants */}
              {colorVariants.length > 0 && (
                <div className="mb-8">
                  <p className="font-display text-[10px] uppercase tracking-wider text-muted-foreground mb-3">
                    Colour{selectedColorLabel ? `: ${selectedColorLabel}` : ""}
                  </p>
                  <div className="flex gap-3 flex-wrap">
                    {colorVariants.map((colour, i) => (
                      <button
                        key={colour.label}
                        type="button"
                        onClick={() => colourName && pick(colourName, colour.label)}
                        aria-label={colour.label}
                        aria-current={selectedColor === i}
                        className={cn(
                          "h-11 w-11 rounded-full overflow-hidden border-2 transition-colors duration-200 bg-muted",
                          selectedColor === i ? "border-primary" : "border-border hover:border-primary/50",
                          sellable &&
                            colourName &&
                            !isValueAvailable(product.variants, selection, colourName, colour.label) &&
                            "opacity-40",
                        )}
                      >
                        <SwatchFill variant={colour} />
                      </button>
                    ))}
                  </div>
                  {!colorVariants.some((v) => v.image) && (
                    <p className="font-body text-[11px] text-muted-foreground mt-2">
                      Colour shown is indicative — product photo may vary by colourway.
                    </p>
                  )}
                </div>
              )}

              {/* Size and other text options */}
              {sizeOptions.map((option) => {
                const selected = selection[option.name];
                return (
                  <div key={option.name} className="mb-8">
                    <p className="font-display text-[10px] uppercase tracking-wider text-muted-foreground mb-3">
                      {option.name}
                      {selected ? `: ${selected}` : ""}
                    </p>
                    <div className="flex gap-2 flex-wrap">
                      {option.values.map((value) => {
                        const unavailable =
                          sellable && !isValueAvailable(product.variants, selection, option.name, value);
                        return (
                          <button
                            key={value}
                            type="button"
                            onClick={() => pick(option.name, value)}
                            aria-current={selected === value}
                            aria-label={unavailable ? `${value} (out of stock)` : undefined}
                            className={cn(
                              "font-display text-xs uppercase tracking-wider px-4 py-2 border transition-colors duration-200 min-w-[3rem]",
                              selected === value
                                ? "bg-primary text-primary-foreground border-primary"
                                : "border-border text-muted-foreground hover:border-primary/50",
                              unavailable && "line-through opacity-50",
                            )}
                          >
                            {value}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              {/* Specs */}
              {product.specs.length > 0 && (
                <dl className="grid grid-cols-2 gap-x-6 gap-y-4 border-t border-border pt-6 mb-8">
                  {product.specs.map((spec) => (
                    <div key={spec.label}>
                      <dt className="font-display text-[9px] uppercase tracking-wider text-muted-foreground">
                        {spec.label}
                      </dt>
                      <dd className="font-body text-sm text-foreground mt-1">{spec.value}</dd>
                    </div>
                  ))}
                </dl>
              )}

              <StockState product={product} variant={variant} needsSelection={product.options.length > 0} />
              <PurchaseCta kind={kind} product={product} variant={variant} />
            </div>
          </m.div>

          {/* Product details — long-form description and the catalogue's detail imagery */}
          {(descriptionBody.length > 0 || sheets.length > 0) && (
            <m.section
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6, ease: [0.19, 1, 0.22, 1] }}
              className="mt-24"
              aria-labelledby="product-details-heading"
            >
              <div className="flex items-center gap-4 mb-12">
                <span className="h-px flex-1 bg-border" />
                <h2 id="product-details-heading" className="font-display text-xs uppercase tracking-wider text-primary">
                  Product Details
                </h2>
                <span className="h-px flex-1 bg-border" />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                {descriptionBody.length > 0 && (
                  <DescriptionBody
                    blocks={descriptionBody}
                    className={sheets.length > 0 ? "lg:col-span-5" : "lg:col-span-8 lg:col-start-3"}
                  />
                )}

                {sheets.length > 0 && (
                  <div
                    className={cn(
                      "grid grid-cols-1 sm:grid-cols-2 gap-6 content-start",
                      descriptionBody.length > 0 ? "lg:col-span-7" : "lg:col-span-12 md:grid-cols-2 lg:grid-cols-3",
                    )}
                  >
                    {sheets.map((sheet) => (
                      <a
                        key={sheet.id}
                        href={assetUrl(sheet.url)}
                        target="_blank"
                        rel="noreferrer"
                        className="group relative block border border-border bg-neutral-100 overflow-hidden hover:border-primary/50 transition-colors duration-300"
                      >
                        <div className="relative aspect-[4/3] p-4">
                          <img
                            src={assetUrl(sheet.url)}
                            alt={`${product.name} — ${sheet.title}`}
                            className="w-full h-full object-contain transition-transform duration-700 ease-[cubic-bezier(0.19,1,0.22,1)] group-hover:scale-[1.03]"
                            loading="lazy"
                          />
                          <span className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-background/80 text-foreground opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <Maximize2 size={12} />
                          </span>
                        </div>
                        <div className="px-4 py-3 border-t border-border bg-card">
                          <p className="font-display text-[11px] uppercase tracking-wider text-foreground">{sheet.title}</p>
                        </div>
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </m.section>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ProductDetail;
