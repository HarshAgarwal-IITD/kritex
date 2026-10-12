import { createRoot, hydrateRoot } from "react-dom/client";
import { hydrate, type DehydratedState } from "@tanstack/react-query";
import App, { preloadRoute } from "./App.tsx";
import { queryClient } from "./lib/query-client";
import "./index.css";
import { initSentry } from "./lib/sentry";
import { PrerenderedContext } from "./lib/first-view";

declare global {
  interface Window {
    /** Catalog data the prerendered HTML was rendered from (scripts/prerender.mjs). */
    __KRITEX_QUERY_STATE__?: DehydratedState;
  }
}

async function enableMocks() {
  // Dynamic import keeps MSW out of the production bundle.
  if (import.meta.env.DEV && import.meta.env.VITE_USE_MOCKS === "true") {
    const { worker } = await import("./mocks/browser");
    await worker.start({ onUnhandledRequest: "bypass" });
  }
}

const trimSlash = (path: string) => path.replace(/(.)\/+$/, "$1");

/**
 * Public pages are prerendered at build time: #root already holds the page for `data-prerendered`, and
 * React hydrates it (attaches to that HTML) instead of rendering from scratch. Any other URL for the same
 * file (e.g. /products?page=2, which Vercel serves from /products/index.html) renders client-side.
 */
async function start() {
  const root = document.getElementById("root")!;
  const prerendered = root.dataset.prerendered;
  const state = window.__KRITEX_QUERY_STATE__;
  if (prerendered && state && !location.search && trimSlash(location.pathname) === prerendered) {
    // The page's lazy chunks first: hydration must not suspend (see src/lib/lazy-page.ts).
    await preloadRoute(prerendered).catch(() => undefined);
    hydrate(queryClient, state);
    hydrateRoot(
      root,
      <PrerenderedContext.Provider value={true}>
        <App />
      </PrerenderedContext.Provider>,
    );
  } else {
    createRoot(root).render(<App />); // replaces any prerendered HTML on its first commit
  }
}

enableMocks()
  .then(start)
  .finally(initSentry);
