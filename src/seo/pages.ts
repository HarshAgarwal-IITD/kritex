import { DEFAULT_OG_IMAGE, SITE_URL, type SeoProps } from "@/components/Seo";
import type { Category, ProductDetail } from "@/features/catalog/types";
import { productJsonLd } from "@/features/catalog/seo";
import { assetUrl, galleryImages } from "@/features/catalog/view";
import { policies, policyByPath } from "@/pages/legal/policies";
import { PLACEHOLDERS } from "@/pages/legal/placeholders";
import { descriptionSummary } from "@/features/catalog/description";

/**
 * SEO props for every indexable page. The pages render them with <Seo>, and the build-time prerender
 * (src/seo/prerender.tsx) renders the same props into static HTML, so crawlers and link previews that
 * don't run JS see the same tags.
 */

export const metaDescription = (text: string) => (text.length > 160 ? `${text.slice(0, 157).trimEnd()}...` : text);

const HOME_DESCRIPTION =
  "Kritex engineers defence-grade apparel, tactical footwear and field equipment for the armed forces of India and Bhutan since 1976.";

/** schema.org BreadcrumbList for a trail of { name, path } (the same trail the page's <Breadcrumbs> shows). */
export const breadcrumbJsonLd = (items: { name: string; path: string }[]): Record<string, unknown> => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: items.map((item, i) => ({
    "@type": "ListItem",
    position: i + 1,
    name: item.name,
    item: `${SITE_URL}${item.path === "/" ? "/" : item.path}`,
  })),
});

const HOME_CRUMB = { name: "Home", path: "/" };
const PRODUCTS_CRUMB = { name: "All Products", path: "/products" };

/** Who sells on the site: the brand, its registered address and contact points (src/pages/legal/Contact.tsx). */
const organizationJsonLd = (): Record<string, unknown> => ({
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": `${SITE_URL}/#organization`,
  name: "Kritex",
  legalName: "Garg Sales Corporation",
  url: SITE_URL,
  logo: `${SITE_URL}/brand/logo_flower.png`,
  image: `${SITE_URL}${DEFAULT_OG_IMAGE}`,
  description: HOME_DESCRIPTION,
  email: "procurement@kritex.in",
  telephone: PLACEHOLDERS.grievanceOfficerPhone,
  foundingDate: "1976",
  taxID: PLACEHOLDERS.gstin,
  address: {
    "@type": "PostalAddress",
    streetAddress: "Second Floor, Hotel Niladrii Galaxy, Bidhan Market, Ward No. 11",
    addressLocality: "Siliguri",
    addressRegion: "West Bengal",
    postalCode: "734001",
    addressCountry: "IN",
  },
  contactPoint: [
    {
      "@type": "ContactPoint",
      contactType: "customer service",
      email: "procurement@kritex.in",
      telephone: PLACEHOLDERS.grievanceOfficerPhone,
      areaServed: "IN",
    },
  ],
});

export const homeSeo = (): SeoProps => ({
  title: "Defence & Industrial Supply",
  description: HOME_DESCRIPTION,
  path: "/",
  jsonLd: [
    organizationJsonLd(),
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      name: "Kritex",
      url: `${SITE_URL}/`,
      publisher: { "@id": `${SITE_URL}/#organization` },
      inLanguage: "en-IN",
    },
  ],
});

export const productsSeo = (): SeoProps => ({
  title: "All Products",
  description:
    "Browse Kritex's complete catalog of tactical footwear, combat apparel and load-bearing equipment for defence and industrial use.",
  path: "/products",
  jsonLd: breadcrumbJsonLd([HOME_CRUMB, PRODUCTS_CRUMB]),
});

export const categorySeo = (category: Pick<Category, "name" | "slug" | "description" | "image">): SeoProps => ({
  title: category.name,
  description: metaDescription(category.description ?? `${category.name} from Kritex.`),
  path: `/products/${category.slug}`,
  image: category.image ? assetUrl(category.image) : undefined,
  jsonLd: breadcrumbJsonLd([HOME_CRUMB, PRODUCTS_CRUMB, { name: category.name, path: `/products/${category.slug}` }]),
});

export const productSeo = (product: ProductDetail): SeoProps => {
  const images = galleryImages(product);
  return {
    title: product.seo.title ?? product.name,
    description: product.seo.description ?? metaDescription(descriptionSummary(product.description ?? "")),
    path: `/product/${product.slug}`,
    image: images[0],
    type: "product",
    jsonLd: [
      productJsonLd(product, images),
      breadcrumbJsonLd([
        HOME_CRUMB,
        PRODUCTS_CRUMB,
        { name: product.category.name, path: `/products/${product.category.slug}` },
        { name: product.name, path: `/product/${product.slug}` },
      ]),
    ],
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
