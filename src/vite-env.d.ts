/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Base URL of kritex-server. Empty/unset = same origin (Vite proxies /api in dev). */
  readonly VITE_API_URL?: string;
  /** "true" starts the MSW mock worker in dev. */
  readonly VITE_USE_MOCKS?: string;
  /** Object store origin for images (e.g. https://assets.kritex.in). Unset = serve from /public. */
  readonly VITE_ASSET_BASE_URL?: string;
  /** Public storefront origin for canonical/OG URLs (no trailing slash). Defaults to https://kritex.in. */
  readonly VITE_SITE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
