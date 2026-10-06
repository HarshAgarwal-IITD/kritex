import { expect, test, type Page } from "@playwright/test";

/** Pages covered by the WEB-CAT-2 "no visual regression" gate. */
const PAGES: { name: string; path: string }[] = [
  { name: "home", path: "/" },
  { name: "products", path: "/products" },
  { name: "category-tactical-footwear", path: "/products/tactical-footwear" },
  { name: "category-combat-apparel", path: "/products/combat-apparel" },
  { name: "category-load-bearing", path: "/products/load-bearing" },
  { name: "pdp-combat-performance-tshirt", path: "/product/combat-performance-tshirt" },
  { name: "pdp-og-polo-tshirt", path: "/product/og-polo-tshirt" },
  { name: "pdp-tactical-cargo-pants", path: "/product/tactical-cargo-pants" },
  { name: "pdp-kritex-pt-shoe-white", path: "/product/kritex-pt-shoe-white" },
  { name: "pdp-liberty-jungle-boot", path: "/product/liberty-jungle-boot" },
  { name: "pdp-rapid-20-tactical-backpack", path: "/product/rapid-20-tactical-backpack" },
];

/**
 * framer-motion reveals content on scroll (whileInView) and images are lazy, so walk the page
 * top to bottom before taking a full-page shot, then wait for images and settle animations.
 */
async function settle(page: Page) {
  await page.waitForLoadState("networkidle");
  // Wait for skeletons (data loading) to disappear.
  await expect(page.locator("[data-skeleton]")).toHaveCount(0, { timeout: 15_000 });
  await page.evaluate(async () => {
    const step = window.innerHeight / 2;
    for (let y = 0; y < document.body.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 120));
    }
    window.scrollTo(0, 0);
  });
  await page.waitForLoadState("networkidle");
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all(
      Array.from(document.images).map((img) =>
        img.complete
          ? null
          : new Promise((resolve) => {
              img.addEventListener("load", resolve);
              img.addEventListener("error", resolve);
            }),
      ),
    );
  });
  // Cards stagger in (index * 80ms), so the last of ~26 needs ~2.5s to finish.
  await page.waitForTimeout(3000);
}

for (const { name, path } of PAGES) {
  test(name, async ({ page }) => {
    await page.goto(path);
    await settle(page);
    await expect(page).toHaveScreenshot(`${name}.png`, { fullPage: true });
  });
}
