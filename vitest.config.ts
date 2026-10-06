import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    // Node's fetch/Request reject relative URLs, so give the API client an absolute base in tests.
    // MSW handlers match any origin.
    // Asset base is pinned empty so tests don't depend on a developer's local .env.
    env: { VITE_API_URL: "http://localhost:4000", VITE_ASSET_BASE_URL: "" },
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
});
