/* eslint-disable react-refresh/only-export-components -- build-time SSR entry, never hot-reloaded */
/**
 * SSR entry for the build-time prerender (scripts/prerender.mjs). Built with `vite build --ssr`, so
 * it sees the same env (VITE_SITE_URL, VITE_ASSET_BASE_URL, VITE_API_URL) and code as the client bundle.
 */
import { renderToPipeableStream, renderToString } from "react-dom/server";
import { StaticRouter } from "react-router-dom/server";
import { HelmetProvider, type HelmetServerState } from "react-helmet-async";
import { dehydrate, QueryClient, type DehydratedState, type Query } from "@tanstack/react-query";
import Seo, { SITE_URL, type SeoProps } from "@/components/Seo";
import { AppProviders, AppRoutes } from "@/App";
import { PrerenderedContext } from "@/lib/first-view";

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

/**
 * Public catalog data, the same for every visitor: the only queries fetched and embedded in the HTML.
 * Session, cart and account queries stay pending, so the page renders as for a signed-out visitor
 * with an empty cart, and the browser fetches those itself after hydrating.
 */
const isPublicQuery = (query: Query) => {
  const [scope, kind, arg] = query.queryKey;
  if (scope !== "catalog") return false;
  if (kind === "categories" || kind === "products") return true;
  return kind === "product" && typeof arg === "string" && arg !== "";
};

/** The page's body HTML (the contents of #root) and the catalog data it was rendered from. */
export async function renderPage(path: string): Promise<{ html: string; state: DehydratedState }> {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const render = () =>
    renderToHtml(
      <PrerenderedContext.Provider value={true}>
        <AppProviders client={client}>
          <StaticRouter location={path}>
            <AppRoutes />
          </StaticRouter>
        </AppProviders>
      </PrerenderedContext.Provider>,
    );

  // useQuery doesn't fetch during SSR, but each render registers its queries in the cache. Fetch the
  // public ones and render again until nothing new is waiting (a page can depend on loaded data).
  let html = await render();
  for (let pass = 0; pass < 4; pass++) {
    const waiting = client
      .getQueryCache()
      .getAll()
      .filter((q) => isPublicQuery(q) && q.state.status === "pending");
    if (waiting.length === 0) break;
    await Promise.all(
      waiting.map((q) =>
        q.fetch().catch((e: unknown) => {
          throw new Error(`${JSON.stringify(q.queryKey)}: ${e instanceof Error ? e.message : String(e)}`);
        }),
      ),
    );
    html = await render();
  }

  return {
    html,
    state: dehydrate(client, { shouldDehydrateQuery: (q) => isPublicQuery(q) && q.state.status === "success" }),
  };
}

/** Renders to a string once every lazy route chunk has loaded (renderToString would emit their fallback). */
function renderToHtml(element: JSX.Element): Promise<string> {
  return new Promise((resolve, reject) => {
    let html = "";
    const decoder = new TextDecoder();
    // The few Writable methods React's pipe() uses (this file is typechecked without Node's types).
    const sink = {
      write(chunk: string | Uint8Array) {
        html += typeof chunk === "string" ? chunk : decoder.decode(chunk, { stream: true });
        return true;
      },
      end() {
        resolve(html + decoder.decode());
      },
      on() {
        return sink;
      },
    };
    const stream = renderToPipeableStream(element, {
      onAllReady: () => stream.pipe(sink as unknown as Parameters<typeof stream.pipe>[0]),
      onShellError: reject,
      onError: reject,
    });
  });
}
