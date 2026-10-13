/**
 * Resized copies of object-store photos via Cloudflare Image Transformations
 * (`<asset origin>/cdn-cgi/image/<options>/<path>`), so a 48 px thumbnail doesn't download the
 * full ~750×1000 photo. Needs Images → Transformations enabled for the kritex.in zone (Cloudflare
 * account → Images → Transformations; on since 2026-10-13). VITE_IMAGE_RESIZE=off turns it off.
 * Only photos under VITE_ASSET_BASE_URL are resized; with it unset (dev, tests) URLs are unchanged.
 */
const ENABLED = import.meta.env.VITE_IMAGE_RESIZE !== "off";
const ASSET_ORIGIN = (() => {
  try {
    return new URL(import.meta.env.VITE_ASSET_BASE_URL ?? "").origin;
  } catch {
    return null;
  }
})();

/** Widths offered in srcset; the browser picks one from `sizes` and the screen's pixel density. */
const SRCSET_WIDTHS = [320, 480, 640, 960];

const resizable = (src: string) => ENABLED && ASSET_ORIGIN !== null && src.startsWith(`${ASSET_ORIGIN}/`);

/** `src` scaled down to at most `width` pixels wide (never up), as WebP/AVIF when the browser accepts it. */
export function resized(src: string, width: number): string {
  if (!resizable(src)) return src;
  const path = src.slice(ASSET_ORIGIN!.length);
  return `${ASSET_ORIGIN}/cdn-cgi/image/width=${width},fit=scale-down,quality=80,format=auto${path}`;
}

/** `srcSet` for an object-store photo, or undefined when resizing is off (the plain `src` is used). */
export function srcSet(src: string): string | undefined {
  if (!resizable(src)) return undefined;
  return SRCSET_WIDTHS.map((w) => `${resized(src, w)} ${w}w`).join(", ");
}
