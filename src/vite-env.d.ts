/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Base URL of kritex-server. Empty/unset = same origin (Vite proxies /api in dev). */
  readonly VITE_API_URL?: string;
  /** "true" starts the MSW mock worker in dev. */
  readonly VITE_USE_MOCKS?: string;
  /** Object store origin for images (e.g. https://assets.kritex.in). Unset = serve from /public. */
  readonly VITE_ASSET_BASE_URL?: string;
  /** "cloudflare" = serve resized photos through Cloudflare Image Transformations (src/lib/image.ts). */
  readonly VITE_IMAGE_RESIZE?: string;
  /** Public storefront origin for canonical/OG URLs (no trailing slash). Defaults to https://www.kritex.in. */
  readonly VITE_SITE_URL?: string;
  /** Sentry DSN for browser error reports (public by design). Unset = off. */
  readonly VITE_SENTRY_DSN?: string;
  /** Sentry environment tag; defaults to the Vite mode ("production"). */
  readonly VITE_SENTRY_ENVIRONMENT?: string;
  /** Release tag: the Vercel commit SHA, injected by vite.config.ts. */
  readonly VITE_SENTRY_RELEASE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
