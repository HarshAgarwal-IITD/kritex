import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { HelmetProvider } from "react-helmet-async";
import { mockCategories, mockProducts } from "@/mocks/catalog";
import { categorySeo, homeSeo, legalPaths, policySeo, productSeo, renderHead, renderPage, SITE_URL } from "./prerender";

type CatalogList = { items: { name: string; slug: string }[] };

const listFrom = (state: Awaited<ReturnType<typeof renderPage>>["state"]) =>
  state.queries.find((q) => q.queryKey[1] === "products")?.state.data as CatalogList;

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
    const lds = [...head.matchAll(/<script data-rh="true" type="application\/ld\+json">(.*?)<\/script>/g)].map((m) => JSON.parse(m[1]));
    expect(lds[0]).toMatchObject({ "@type": "Product", name: product.name });
    expect(lds[1]).toMatchObject({ "@type": "BreadcrumbList" });
    expect(lds[1].itemListElement.at(-1)).toMatchObject({ position: 4, item: `${SITE_URL}/product/${product.slug}` });
    expect(head.match(/data-rh="true"/g)!.length).toBeGreaterThan(10);
  });

  it("covers the home, category and every policy page", () => {
    const home = renderHead(homeSeo());
    expect(home).toContain('"@type":"Organization"');
    expect(home).toContain('"@type":"WebSite"');
    expect(home).toContain(`content="${SITE_URL}/brand/og-default.jpg"`);
    expect(renderHead(categorySeo(mockCategories[0]))).toContain('"@type":"BreadcrumbList"');
    expect(renderHead(categorySeo(mockCategories[0]))).toContain(`${SITE_URL}/products/${mockCategories[0].slug}`);
    expect(legalPaths()).toContain("/legal/privacy");
    for (const path of legalPaths()) expect(renderHead(policySeo(path))).toContain(`href="${SITE_URL}${path}"`);
  });

  it("escapes product text inside JSON-LD, so it can't close the script tag (SEC-9)", () => {
    const product = { ...mockProducts[0], name: 'Boot </script><script>alert(1)</script>' };
    const head = renderHead(productSeo(product));
    const ld = head.match(/<script data-rh="true" type="application\/ld\+json">(.*?)<\/script>/)![1];
    expect(ld).not.toContain("<");
    expect(JSON.parse(ld)).toMatchObject({ name: product.name });
  });

  it("uses the www origin, which is where kritex.in redirects", () => {
    expect(SITE_URL).toBe("https://www.kritex.in");
  });
});

describe("renderPage (build-time prerender)", () => {
  it("renders /products with its catalog data, visible without JS", async () => {
    const { html, state } = await renderPage("/products");

    expect(html).toContain("All Products");
    const first = listFrom(state).items[0];
    expect(html).toContain(first.name);
    // Only public catalog data is embedded: no session, cart or account queries.
    expect(state.queries.length).toBeGreaterThan(0);
    for (const q of state.queries) expect(q.queryKey[0]).toBe("catalog");
    // The heading and cards start visible (no entrance animation on a prerendered first view).
    expect(html).not.toContain("opacity:0");
  });

  it("renders a product page", async () => {
    const { state } = await renderPage("/products");
    const { slug, name } = listFrom(state).items[0];

    const page = await renderPage(`/product/${slug}`);

    expect(page.html).toMatch(new RegExp(`<h1[^>]*>${name}</h1>`));
    expect(page.state.queries.map((q) => q.queryKey)).toContainEqual(["catalog", "product", slug]);
  });

  it("fails for a product the API doesn't have, so the build keeps the client-rendered shell", async () => {
    await expect(renderPage("/product/no-such-product")).rejects.toThrow(/"product","no-such-product"/);
  });
});
