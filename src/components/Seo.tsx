import { Helmet } from "react-helmet-async";

export const SITE_NAME = "Kritex";
export const DEFAULT_OG_IMAGE = "/brand/logo_flower.png";

/** Public site origin used for canonical/OG URLs. No trailing slash. */
export const SITE_URL: string = (import.meta.env.VITE_SITE_URL || "https://kritex.in").replace(/\/+$/, "");

const absolute = (pathOrUrl: string): string =>
  /^https?:\/\//i.test(pathOrUrl)
    ? pathOrUrl
    : `${SITE_URL}${pathOrUrl.startsWith("/") ? "" : "/"}${pathOrUrl}`;

export interface SeoProps {
  /** Page title without the site suffix; rendered as "<title> | Kritex". */
  title: string;
  description: string;
  /** Route path, e.g. "/products". Used for the canonical and og:url. */
  path: string;
  /** Absolute URL or site-relative path. Defaults to the brand image. */
  image?: string;
  noindex?: boolean;
  /** One or more JSON-LD objects, rendered as application/ld+json scripts. */
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
  /** og:type, defaults to "website". */
  type?: string;
}

const Seo = ({ title, description, path, image, noindex, jsonLd, type = "website" }: SeoProps) => {
  const fullTitle = `${title} | ${SITE_NAME}`;
  const url = absolute(path);
  const imageUrl = absolute(image ?? DEFAULT_OG_IMAGE);
  const ldBlocks = jsonLd ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]) : [];

  return (
    <Helmet prioritizeSeoTags>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      {noindex && <meta name="robots" content="noindex, nofollow" />}

      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:type" content={type} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={imageUrl} />
      <meta property="og:locale" content="en_IN" />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={imageUrl} />

      {ldBlocks.map((block, i) => (
        <script key={i} type="application/ld+json">
          {JSON.stringify(block)}
        </script>
      ))}
    </Helmet>
  );
};

export default Seo;
