import { defineConfig, devices } from "@playwright/test";

/**
 * Visual regression suite (WEB-CAT-2). Runs the storefront on :8082 against the MSW mocks
 * and compares full-page screenshots with the committed baselines in ./__screenshots__.
 *
 *   npx playwright test -c e2e/visual/playwright.config.ts                    # compare
 *   npx playwright test -c e2e/visual/playwright.config.ts --update-snapshots # re-baseline
 */
const PORT = 8082;

export default defineConfig({
  testDir: ".",
  snapshotPathTemplate: "{testDir}/__screenshots__/{projectName}/{arg}{ext}",
  fullyParallel: true,
  workers: process.env.CI ? 1 : 4,
  timeout: 90_000,
  reporter: [["list"], ["html", { outputFolder: "./.report", open: "never" }]],
  outputDir: "./.results",
  expect: {
    toHaveScreenshot: { maxDiffPixelRatio: 0.01, animations: "disabled", caret: "hide" },
  },
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "retain-on-failure",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } } },
    {
      name: "mobile",
      use: { ...devices["Desktop Chrome"], viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 1 },
    },
  ],
  webServer: {
    command: `npx vite --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    env: { VITE_USE_MOCKS: "true" },
    cwd: "../..",
    timeout: 60_000,
  },
});
