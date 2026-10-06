import { describe, expect, it } from "vitest";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import { renderRoute } from "@/features/catalog/test-utils";
import Category from "./Category";

const renderCategory = (slug: string) => renderRoute(<Category />, { route: `/products/${slug}`, path: "/products/:categorySlug" });
const cardNames = () => screen.getAllByRole("heading", { level: 3 }).map((h) => h.textContent);

describe("Category page", () => {
  it("renders the category header and its products from the API", async () => {
    renderCategory("combat-apparel");
    expect(await screen.findByRole("heading", { level: 1, name: "Combat Apparel" })).toBeInTheDocument();
    expect(screen.getByText(/Explore our complete range of combat apparel/)).toBeInTheDocument();
    await waitFor(() => expect(cardNames()).toHaveLength(6));

    fireEvent.click(screen.getByRole("button", { name: "Tactical Outerwear (1)" }));
    expect(cardNames()).toEqual(["Field Duty Tactical Jacket"]);
    await waitFor(() => expect(document.title).toBe("Combat Apparel | Kritex"));
  });

  it("hides sub-category chips when there is only one", async () => {
    renderCategory("load-bearing");
    await waitFor(() => expect(cardNames()).toEqual(["Rapid 20 Tactical Backpack"]));
    expect(screen.queryByRole("button", { name: /^All \(/ })).toBeNull();
  });

  it("shows prices on priced product cards", async () => {
    renderCategory("combat-apparel");
    expect(await screen.findByText("₹1,299.00")).toBeInTheDocument();
    expect(screen.getByText("View Details & Request Quote")).toBeInTheDocument();
  });

  it("404s for an unknown category", async () => {
    renderCategory("nope");
    expect(await screen.findByText("Oops! Page not found")).toBeInTheDocument();
  });
});
