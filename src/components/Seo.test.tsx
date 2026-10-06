import type { ReactElement } from "react";
import { describe, it, expect } from "vitest";
import { render, waitFor } from "@testing-library/react";
import { HelmetProvider } from "react-helmet-async";
import Seo from "./Seo";

const meta = (selector: string) => document.head.querySelector(selector)?.getAttribute("content");
const canonical = () => document.head.querySelector('link[rel="canonical"]')?.getAttribute("href");

function renderSeo(ui: ReactElement) {
  const helmetContext = {};
  return render(<HelmetProvider context={helmetContext}>{ui}</HelmetProvider>);
}

describe("Seo", () => {
  it("renders title, description, canonical, Open Graph and Twitter tags", async () => {
    renderSeo(<Seo title="All Products" description="Browse the catalog." path="/products" />);

    await waitFor(() => expect(document.title).toBe("All Products | Kritex"));
    expect(meta('meta[name="description"]')).toBe("Browse the catalog.");
    expect(canonical()).toBe("https://kritex.in/products");
    expect(meta('meta[property="og:title"]')).toBe("All Products | Kritex");
    expect(meta('meta[property="og:description"]')).toBe("Browse the catalog.");
    expect(meta('meta[property="og:url"]')).toBe("https://kritex.in/products");
    expect(meta('meta[property="og:type"]')).toBe("website");
    expect(meta('meta[property="og:image"]')).toBe("https://kritex.in/brand/logo_flower.png");
    expect(meta('meta[name="twitter:card"]')).toBe("summary_large_image");
    expect(meta('meta[name="twitter:title"]')).toBe("All Products | Kritex");
    expect(meta('meta[name="twitter:image"]')).toBe("https://kritex.in/brand/logo_flower.png");
    expect(document.head.querySelector('meta[name="robots"]')).toBeNull();
  });

  it("supports a custom image, noindex and JSON-LD", async () => {
    renderSeo(
      <Seo
        title="Combat Boot"
        description="A boot."
        path="/product/boot"
        image="/products/boot.png"
        noindex
        jsonLd={{ "@context": "https://schema.org", "@type": "Product", name: "Combat Boot" }}
      />,
    );

    await waitFor(() => expect(document.title).toBe("Combat Boot | Kritex"));
    expect(meta('meta[property="og:image"]')).toBe("https://kritex.in/products/boot.png");
    expect(meta('meta[name="robots"]')).toBe("noindex, nofollow");
    const ld = document.head.querySelector('script[type="application/ld+json"]');
    expect(JSON.parse(ld?.textContent ?? "{}")).toMatchObject({ "@type": "Product", name: "Combat Boot" });
  });

  it("leaves absolute image URLs untouched", async () => {
    renderSeo(<Seo title="X" description="Y" path="/" image="https://cdn.example.com/a.png" />);
    await waitFor(() => expect(meta('meta[property="og:image"]')).toBe("https://cdn.example.com/a.png"));
    expect(canonical()).toBe("https://kritex.in/");
  });
});
