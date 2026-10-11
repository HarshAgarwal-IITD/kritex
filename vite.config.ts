import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { sentryVitePlugin } from "@sentry/vite-plugin";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ isSsrBuild }) => {
  // Sentry (src/lib/sentry.ts): tag errors with the deployed commit; with SENTRY_AUTH_TOKEN (Vercel build env),
  // build hidden source maps, upload them and delete them from dist, so stack traces show the real source.
  const release = process.env.VERCEL_GIT_COMMIT_SHA ?? "";
  const uploadSourceMaps =
    !isSsrBuild && Boolean(process.env.SENTRY_AUTH_TOKEN);
  return {
    define: {
      "import.meta.env.VITE_SENTRY_RELEASE": JSON.stringify(release),
    },
    build: {
      sourcemap: uploadSourceMaps ? ("hidden" as const) : false,
    },
    server: {
      host: "::",
      port: 8080,
      hmr: {
        overlay: false,
      },
      // Playwright writes HTML reports here mid-run; watching them reloads every open page (breaks e2e).
      watch: {
        ignored: ["**/playwright-report/**", "**/test-results/**"],
      },
      // The API client uses a relative base URL in dev, so /api is proxied to kritex-server.
      // VITE_API_PROXY_TARGET points it elsewhere (the full-stack e2e harness uses its own API port).
      proxy: {
        "/api": {
          target: process.env.VITE_API_PROXY_TARGET || "http://localhost:4000",
          changeOrigin: true,
        },
      },
    },
    plugins: [
      react(),
      uploadSourceMaps &&
        sentryVitePlugin({
          org: process.env.SENTRY_ORG,
          project: process.env.SENTRY_PROJECT ?? "kritex-website",
          authToken: process.env.SENTRY_AUTH_TOKEN,
          release: { name: release || undefined },
          sourcemaps: { filesToDeleteAfterUpload: ["./dist/**/*.map"] },
          telemetry: false,
        }),
    ],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
