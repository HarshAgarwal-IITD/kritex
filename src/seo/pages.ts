import { SITE_URL, type SeoProps } from "@/components/Seo";
import type { Category, ProductDetail } from "@/features/catalog/types";
import { productJsonLd } from "@/features/catalog/seo";
import { assetUrl, galleryImages } from "@/features/catalog/view";
import { policies, policyByPath } from "@/pages/legal/policies";
import { descriptionSummary } from "@/features/catalog/description";

/**
 * SEO props for every indexable page. The pages render them with <Seo>, and the build-time prerender
 * (src/seo/prerender.tsx) renders the same props into static HTML, so crawlers and link previews that
 * don't run JS see the same tags.
 */

export const metaDescription = (text: string) => (text.length > 160 ? `${text.slice(0, 157).trimEnd()}...` : text);

const HOME_DESCRIPTION =
  "Kritex engineers defence-grade apparel, tactical footwear and field equipment for the armed forces of India and Bhutan since 1976.";

export const homeSeo = (): SeoProps => ({
  title: "Defence & Industrial Supply",
  description: HOME_DESCRIPTION,
  path: "/",
  jsonLd: {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Kritex",
    url: SITE_URL,
    logo: `${SITE_URL}/brand/logo_flower.png`,
    email: "procurement@kritex.in",
    foundingDate: "1976",
  },
});

export const productsSeo = (): SeoProps => ({
  title: "All Products",
  description:
    "Browse Kritex's complete catalog of tactical footwear, combat apparel and load-bearing equipment for defence and industrial use.",
  path: "/products",
});

export const categorySeo = (category: Pick<Category, "name" | "slug" | "description" | "image">): SeoProps => ({
  title: category.name,
  description: metaDescription(category.description ?? `${category.name} from Kritex.`),
  path: `/products/${category.slug}`,
  image: category.image ? assetUrl(category.image) : undefined,
});

export const productSeo = (product: ProductDetail): SeoProps => {
  const images = galleryImages(product);
  return {
    title: product.seo.title ?? product.name,
    description: product.seo.description ?? metaDescription(descriptionSummary(product.description ?? "")),
    path: `/product/${product.slug}`,
    image: images[0],
    type: "product",
    jsonLd: productJsonLd(product, images),
  };
};

export const LEGAL_INDEX_META = {
  title: "Policies",
  description:
    "Kritex store policies: terms and conditions, privacy, refunds and returns, shipping, cancellation, and grievance contact.",
};

export const policySeo = (path: string): SeoProps =>
  path === "/legal" ? { ...LEGAL_INDEX_META, path } : { ...pick(policyByPath(path)), path };

const pick = ({ title, description }: { title: string; description: string }) => ({ title, description });

/** Every /legal route, index first. */
export const legalPaths = (): string[] => ["/legal", ...policies.map((p) => p.path)];
