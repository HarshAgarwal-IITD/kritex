import { describe, expect, it, vi } from "vitest";
import { fireEvent, screen } from "@testing-library/react";
import { renderRoute } from "@/features/catalog/test-utils";
import Navbar from "./Navbar";

// jsdom has no scrollTo (used by the expanding mobile menu).
window.scrollTo = vi.fn() as unknown as typeof window.scrollTo;

describe("Navbar", () => {
  it("links to account and cart", () => {
    renderRoute(<Navbar />);
    expect(screen.getAllByRole("link", { name: "Account" })[0]).toHaveAttribute("href", "/account");
    expect(screen.getAllByRole("link", { name: "Cart" })[0]).toHaveAttribute("href", "/cart");
  });

  it("lists API categories in the mobile products menu, marking empty ones as coming soon", async () => {
    renderRoute(<Navbar />);
    fireEvent.click(screen.getByRole("button", { name: "Toggle menu" }));
    fireEvent.click(screen.getByRole("button", { name: "Products" }));
    expect(await screen.findByRole("link", { name: "Tactical Footwear" })).toHaveAttribute("href", "/products/tactical-footwear");
    expect(screen.getByText("Base Layers (Soon)")).toBeInTheDocument();
  });
});
