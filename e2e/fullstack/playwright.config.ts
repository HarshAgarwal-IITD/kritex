import { defineConfig, devices } from "@playwright/test";

/**
 * Full-stack suite: real kritex-server + Vite. Run it through the harness, which boots both and sets E2E_*:
 *
 *   npm run test:e2e                               # everything (scripts/e2e-stack.mjs)
 *   npm run test:e2e -- account.spec.ts --headed   # args go to `playwright test`
 *
 * Specs read E2E_BASE_URL (default http://localhost:8080), E2E_ADMIN_EMAIL/PASSWORD and E2E_SERVER_LOG.
 */
export default defineConfig({
  testDir: ".",
  // Specs create their own products/coupons/users, so files can run in parallel against one stack.
  fullyParallel: false,
  workers: process.env.CI ? 2 : 3,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: [["list"], ["html", { outputFolder: "../../playwright-report/fullstack", open: "never" }]],
  outputDir: "../../test-results/fullstack",
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:8080",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
