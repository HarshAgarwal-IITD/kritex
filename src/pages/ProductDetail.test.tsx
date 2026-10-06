import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { server } from "@/mocks/server";
import { apiPath } from "@/mocks/handlers";
import { mockProducts } from "@/mocks/catalog";
import { renderRoute } from "@/features/catalog/test-utils";
import ProductDetail from "./ProductDetail";

const renderPdp = (slug: string) => renderRoute(<ProductDetail />, { route: `/product/${slug}`, path: "/product/:id" });

const originalLocation = window.location;
let hrefs: string[];
beforeEach(() => {
  hrefs = [];
  // Capture the mailto: navigation from the enquiry/quote buttons.
  Object.defineProperty(window, "location", {
    configurable: true,
    value: {
      ...originalLocation,
      set href(v: string) {
        hrefs.push(v);
      },
    },
  });
});
afterEach(() => {
  Object.defineProperty(window, "location", { configurable: true, value: originalLocation });
});

const ldJson = () =>
  Array.from(document.head.querySelectorAll('script[type="application/ld+json"]')).map((s) => JSON.parse(s.textContent!));

describe("ProductDetail", () => {
  it("shows a skeleton, then an enquiry-only product without price or stock", async () => {
    renderPdp("og-polo-tshirt");
    expect(screen.getByLabelText("Loading product")).toBeInTheDocument();

    expect(await screen.findByRole("heading", { name: "Tactical Combat OG Polo T-Shirt" })).toBeInTheDocument();
    expect(screen.queryByTestId("price")).toBeNull();
    expect(screen.queryByTestId("stock-state")).toBeNull();
    const crumbs = screen.getByRole("navigation", { name: "Breadcrumb" });
    expect(within(crumbs).getByRole("link", { name: "Combat Apparel" })).toHaveAttribute("href", "/products/combat-apparel");

    fireEvent.click(screen.getByRole("button", { name: "M" }));
    fireEvent.click(screen.getByRole("button", { name: /Send Enquiry/ }));
    const mail = decodeURIComponent(hrefs[0]);
    expect(mail).toContain("mailto:procurement@kritex.in?subject=Procurement Enquiry: Tactical Combat OG Polo T-Shirt");
    expect(mail).toContain("Size: M");
    expect(mail).toContain("SKU: KTX-OPT-M");

    await waitFor(() => expect(document.title).toBe("Tactical Combat OG Polo T-Shirt | Kritex"));
    const ld = ldJson().find((b) => b["@type"] === "Product");
    expect(ld.name).toBe("Tactical Combat OG Polo T-Shirt");
    expect(ld.offers).toBeUndefined();
  });

  it("swaps the gallery image when a colour is picked", async () => {
    renderPdp("combat-performance-tshirt");
    await screen.findByRole("heading", { name: "Combat Performance T-Shirt" });
    fireEvent.click(screen.getByRole("button", { name: "Navy Blue" }));
    expect(screen.getByAltText("Combat Performance T-Shirt — Navy Blue")).toHaveAttribute(
      "src",
      "/products/combat-performance-tshirt/combat-performance-tshirt-navy-blue.png",
    );
    expect(screen.getByText("Colour: Navy Blue")).toBeInTheDocument();
  });

  it("RETAIL: shows price, resolves the SKU and stock, and stubs Add to Cart", async () => {
    renderPdp("full-sleeve-combat-tshirt");
    await screen.findByRole("heading", { name: "Tactical Combat Full Sleeve T-Shirt" });

    expect(screen.getByTestId("price")).toHaveTextContent("₹1,299.00");
    expect(screen.getByTestId("price")).toHaveTextContent("₹1,499.00");
    expect(screen.getByTestId("stock-state")).toHaveTextContent(/select options/i);
    expect(screen.getByRole("button", { name: /Add to Cart/ })).toBeDisabled();

    fireEvent.click(screen.getByRole("button", { name: "M" }));
    expect(screen.getByTestId("stock-state")).toHaveTextContent("In stock");
    expect(screen.getByTestId("stock-state")).toHaveTextContent("SKU KTX-FSCT-M");

    fireEvent.click(screen.getByRole("button", { name: "XXL (out of stock)" }));
    expect(screen.getByTestId("stock-state")).toHaveTextContent(/out of stock/i);
    expect(screen.getByRole("button", { name: /Out of Stock/ })).toBeDisabled();

    await waitFor(() => expect(ldJson().find((b) => b["@type"] === "Product")?.offers?.price).toBe("1299.00"));
  });

  it("B2B_ONLY for a regular visitor: Request Quote", async () => {
    renderPdp("tactical-cargo-shorts");
    await screen.findByRole("heading", { name: "Tactical Cargo Shorts" });
    expect(screen.getByTestId("price")).toHaveTextContent("₹1,099.00");
    expect(screen.queryByRole("button", { name: /Add to Cart/ })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /Request Quote/ }));
    expect(decodeURIComponent(hrefs[0])).toContain("subject=Quote Request: Tactical Cargo Shorts");
  });

  it("B2B_ONLY for an approved B2B viewer: Add to Cart and tier prices", async () => {
    const base = mockProducts.find((p) => p.slug === "tactical-cargo-shorts")!;
    server.use(
      http.get(apiPath("/api/v1/products/tactical-cargo-shorts"), () =>
        HttpResponse.json({ ...base, purchasable: true, priceTiers: [{ minQty: 50, unitPrice: 89900 }] }),
      ),
    );
    renderPdp("tactical-cargo-shorts");
    await screen.findByRole("heading", { name: "Tactical Cargo Shorts" });
    expect(screen.getByRole("button", { name: /Add to Cart/ })).toBeInTheDocument();
    expect(screen.getByLabelText("Volume pricing")).toHaveTextContent("50+ units · ₹899.00");
  });

  it("renders the not-found state for an unknown product", async () => {
    renderPdp("does-not-exist");
    expect(await screen.findByText(/Product not found/)).toBeInTheDocument();
    await waitFor(() => expect(document.head.querySelector('meta[name="robots"]')).not.toBeNull());
  });
});
