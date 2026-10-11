import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { HelmetProvider } from "react-helmet-async";
import { mockCategories, mockProducts } from "@/mocks/catalog";
import { categorySeo, homeSeo, legalPaths, policySeo, productSeo, renderHead, SITE_URL } from "./prerender";

describe("prerender head", () => {
  // Helmet only produces server output without a DOM, as in the real (Node) build.
  beforeAll(() => {
    HelmetProvider.canUseDOM = false;
  });
  afterAll(() => {
    HelmetProvider.canUseDOM = true;
  });

  it("renders a product's title, canonical, preview image and Product JSON-LD as Helmet tags", () => {
    const product = mockProducts[0];
    const head = renderHead(productSeo(product));

    expect(head).toContain(`<title data-rh="true">${product.name} | Kritex</title>`);
    expect(head).toContain(`<link data-rh="true" rel="canonical" href="${SITE_URL}/product/${product.slug}"/>`);
    expect(head).toContain('property="og:type" content="product"');
    expect(head).toMatch(/property="og:image" content="[^"]+"/);
    const ld = JSON.parse(head.match(/<script data-rh="true" type="application\/ld\+json">(.*?)<\/script>/)![1]);
    expect(ld).toMatchObject({ "@type": "Product", name: product.name });
    expect(head.match(/data-rh="true"/g)!.length).toBeGreaterThan(10);
  });

  it("covers the home, category and every policy page", () => {
    expect(renderHead(homeSeo())).toContain('"@type":"Organization"');
    expect(renderHead(categorySeo(mockCategories[0]))).toContain(`${SITE_URL}/products/${mockCategories[0].slug}`);
    expect(legalPaths()).toContain("/legal/privacy");
    for (const path of legalPaths()) expect(renderHead(policySeo(path))).toContain(`href="${SITE_URL}${path}"`);
  });

  it("uses the www origin, which is where kritex.in redirects", () => {
    expect(SITE_URL).toBe("https://www.kritex.in");
  });
});
