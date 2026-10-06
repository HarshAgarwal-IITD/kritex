/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Base URL of kritex-server. Empty/unset = same origin (Vite proxies /api in dev). */
  readonly VITE_API_URL?: string;
  /** "true" starts the MSW mock worker in dev. */
  readonly VITE_USE_MOCKS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
