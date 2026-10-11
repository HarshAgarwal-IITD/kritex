/* eslint-disable react-refresh/only-export-components -- build-time SSR entry, never hot-reloaded */
/**
 * SSR entry for the build-time prerender (scripts/prerender.mjs). Built with `vite build --ssr`, so
 * it sees the same env (VITE_SITE_URL, VITE_ASSET_BASE_URL) and code as the client bundle.
 */
import { renderToString } from "react-dom/server";
import { HelmetProvider, type HelmetServerState } from "react-helmet-async";
import Seo, { SITE_URL, type SeoProps } from "@/components/Seo";

export { SITE_URL };
export { categorySeo, homeSeo, legalPaths, policySeo, productSeo, productsSeo } from "./pages";

/** The <head> tags <Seo> renders for these props (marked data-rh, so Helmet replaces them on load). */
export function renderHead(props: SeoProps): string {
  const context: { helmet?: HelmetServerState } = {};
  renderToString(
    <HelmetProvider context={context}>
      <Seo {...props} />
    </HelmetProvider>,
  );
  const h = context.helmet!;
  return [h.title, h.priority, h.meta, h.link, h.script].map((part) => part.toString()).filter(Boolean).join("\n    ");
}
