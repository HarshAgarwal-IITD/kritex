import ProductCard from "@/components/ProductCard";
import { AddToQuoteLink } from "@/features/quote/components/AddToQuote";
import { formatPaise, formatPriceRange } from "../format";
import type { ProductCardDto, SaleChannel } from "../types";
import { assetUrl, colourVariants, galleryImages } from "../view";

const CTA: Record<SaleChannel, string> = {
  RETAIL: "View Details",
  B2B_ONLY: "View Details",
  ENQUIRY_ONLY: "View Details",
};

/** A product card fed by the API: the list's card DTO carries the gallery and colour swatches. */
const CatalogProductCard = ({ product, index }: { product: ProductCardDto; index: number }) => {
  const gallery = galleryImages(product);
  // Products whose photos are all colour-specific still show their primary image.
  const images = gallery.length > 0 ? gallery : product.image ? [assetUrl(product.image.url)] : [];

  return (
    <ProductCard
      id={product.slug}
      name={product.name}
      category={product.subCategory ?? product.category.name}
      images={images}
      colorVariants={colourVariants(product)}
      price={formatPriceRange(product.price)}
      compareAtPrice={product.price && product.compareAtPrice ? formatPaise(product.compareAtPrice) : null}
      ctaLabel={CTA[product.saleChannel]}
      // Enquiry-only and B2B-only products can go straight into the quote cart (quantity is set on /quote).
      action={
        product.saleChannel === "RETAIL" ? undefined : (
          <AddToQuoteLink
            className="uppercase tracking-wider"
            product={{ id: product.id, slug: product.slug, name: product.name, image: product.image?.url ?? null }}
          />
        )
      }
      index={index}
    />
  );
};

export default CatalogProductCard;
