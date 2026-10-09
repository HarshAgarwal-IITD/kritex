import ProductCard from "@/components/ProductCard";
import { AddToQuoteLink } from "@/features/quote/components/AddToQuote";
import { formatPaise, formatPriceRange } from "../format";
import { useProduct } from "../hooks";
import type { ProductCardDto, SaleChannel } from "../types";
import { assetUrl, colourVariants, galleryImages } from "../view";

const CTA: Record<SaleChannel, string> = {
  RETAIL: "View Details",
  B2B_ONLY: "View Details",
  ENQUIRY_ONLY: "View Details",
};

/**
 * A product card fed by the API.
 *
 * The list endpoint's card DTO only carries the primary image, but the card shows every view plus
 * colour swatches. Until the contract adds `images[]`/swatches to the card (additive change, see
 * the web-catalog report), the full gallery comes from the PDP query, which also warms the cache
 * for the product page. The card renders immediately with the primary image.
 */
const CatalogProductCard = ({ product, index }: { product: ProductCardDto; index: number }) => {
  const { data: detail } = useProduct(product.slug);
  const images = detail ? galleryImages(detail) : product.image ? [assetUrl(product.image.url)] : [];

  return (
    <ProductCard
      id={product.slug}
      name={product.name}
      category={product.subCategory ?? product.category.name}
      images={images}
      colorVariants={detail ? colourVariants(detail) : undefined}
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
