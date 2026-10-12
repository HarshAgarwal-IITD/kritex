import { createContext, useContext } from "react";
import { useLocation } from "react-router-dom";

/**
 * True when this page's HTML was prerendered at build time (scripts/prerender.mjs) and the app is
 * hydrating it. Provided by src/main.tsx and the SSR entry (src/seo/prerender.tsx).
 */
export const PrerenderedContext = createContext(false);

/** Key of the location the app first rendered; entrance animations are skipped only there. */
let firstLocationKey: string | undefined;

/**
 * Whether to skip an entrance animation (`initial={skip ? false : {...}}`). On the first view of a
 * prerendered page the content is already in the HTML: starting it at opacity 0 would hide it until the
 * JS loads (and would not match the HTML React hydrates). Pages reached by navigation animate as before.
 */
export function useSkipEntrance(): boolean {
  const prerendered = useContext(PrerenderedContext);
  const { key } = useLocation();
  firstLocationKey ??= key;
  return prerendered && key === firstLocationKey;
}
