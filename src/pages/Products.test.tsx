import { describe, expect, it } from "vitest";
import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { renderRoute } from "@/features/catalog/test-utils";
import Products from "./Products";

const cardNames = () => screen.getAllByRole("heading", { level: 3 }).map((h) => h.textContent);

describe("Products page", () => {
  it("lists every product from the API with category tiles and counts", async () => {
    renderRoute(<Products />, { route: "/products" });
    expect(screen.getByLabelText("Loading products")).toBeInTheDocument();

    await waitFor(() => expect(cardNames()).toHaveLength(26));
    expect(cardNames()[0]).toBe("Kritex PT Shoe — White");
    expect(screen.getByText("26 items")).toBeInTheDocument();
    expect(screen.getByText("Coming Soon")).toBeInTheDocument();
    // Card links go to the PDP by slug.
    expect(screen.getByRole("link", { name: "View details for Sega DMS Boot" })).toHaveAttribute("href", "/product/sega-dms-boot");
  });

  it("filters by category and sub-category, keeping filters in the URL", async () => {
    renderRoute(<Products />, { route: "/products" });
    await waitFor(() => expect(cardNames()).toHaveLength(26));

    fireEvent.click(screen.getByRole("button", { name: /Combat Apparel/ }));
    await waitFor(() => expect(cardNames()).toHaveLength(6));
    expect(screen.getByTestId("location")).toHaveTextContent("/products?category=combat-apparel");

    fireEvent.click(await screen.findByRole("button", { name: "Combat Trousers (2)" }));
    expect(cardNames()).toEqual(["Tactical Cargo Pants", "Tactical Cargo Shorts"]);
    expect(screen.getByTestId("location")).toHaveTextContent("type=Combat+Trousers");
  });

  it("restores filters from the URL and shows active option filters", async () => {
    renderRoute(<Products />, { route: "/products?category=tactical-footwear&q=gum&size=9" });
    await waitFor(() => expect(cardNames()).toHaveLength(4));
    expect(screen.getByRole("combobox", { name: "Search products" })).toHaveValue("gum");

    fireEvent.click(screen.getByRole("button", { name: "Remove filter Size: 9" }));
    await waitFor(() => expect(screen.getByTestId("location")).not.toHaveTextContent("size="));
  });

  it("searches as you type and shows suggestions", async () => {
    renderRoute(<Products />, { route: "/products" });
    await waitFor(() => expect(cardNames()).toHaveLength(26));

    const input = screen.getByRole("combobox", { name: "Search products" });
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "tactical boot" } });

    await waitFor(() => expect(screen.getByTestId("location")).toHaveTextContent("q=tactical+boot"));
    const list = await screen.findByRole("listbox", { name: "Search suggestions" });
    expect(within(list).getAllByRole("option").length).toBeGreaterThan(0);

    await waitFor(() => expect(cardNames()).not.toHaveLength(26));
  });

  it("shows the empty state when nothing matches", async () => {
    renderRoute(<Products />, { route: "/products?q=zzzz" });
    expect(await screen.findByText("No products match your search.")).toBeInTheDocument();
  });
});
