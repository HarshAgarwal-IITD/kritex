const ASSET_BASE_URL = import.meta.env.VITE_ASSET_BASE_URL?.replace(/\/+$/, "") ?? "";

/**
 * Bump when objects are re-uploaded under the same keys: they're served `immutable`, so browsers
 * only refetch when the URL changes. 2 = product photos switched from bg-removed to originals.
 */
const ASSET_VERSION = "2";

/**
 * Resolves a public asset path. With VITE_ASSET_BASE_URL set, points at the object
 * store copy (rasters are stored there as .webp); unset, serves from /public as before.
 */
export function asset(path: string): string {
  if (!ASSET_BASE_URL) return path;
  return `${ASSET_BASE_URL}${path.replace(/\.(png|jpe?g)$/i, ".webp")}?v=${ASSET_VERSION}`;
}
