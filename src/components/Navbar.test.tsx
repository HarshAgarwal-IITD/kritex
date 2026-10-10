import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, screen } from "@testing-library/react";
import { renderRoute } from "@/features/catalog/test-utils";
import { resetMocks } from "@/test/render-app";
import Navbar from "./Navbar";

// jsdom has no scrollTo (used by the expanding mobile menu).
window.scrollTo = vi.fn() as unknown as typeof window.scrollTo;

describe("Navbar", () => {
  beforeEach(() => resetMocks());

  it("links guests to log in and the cart; no Timeline link; Track Order is there", async () => {
    renderRoute(<Navbar />);
    expect(await screen.findByRole("link", { name: "Account" })).toHaveAttribute("href", "/login");
    expect(screen.getAllByRole("link", { name: "Cart" })[0]).toHaveAttribute("href", "/cart");
    expect(screen.getAllByRole("link", { name: "Track Order" })[0]).toHaveAttribute("href", "/track");
    expect(screen.queryByText("Timeline")).toBeNull();
  });

  it("shows a signed-in user's account menu with orders, quotes and log out", async () => {
    resetMocks("customer@example.com");
    renderRoute(<Navbar />);
    const trigger = await screen.findByRole("button", { name: "Account menu" });
    expect(trigger).toHaveTextContent("CC");
    fireEvent.keyDown(trigger, { key: "Enter" });
    expect(await screen.findByRole("menuitem", { name: /Orders/ })).toHaveAttribute("href", "/account/orders");
    expect(screen.getByRole("menuitem", { name: /Quotes/ })).toHaveAttribute("href", "/account/quotes");
    expect(screen.getByRole("menuitem", { name: /Log Out/ })).toBeInTheDocument();
  });

  it("lists API categories in the mobile products menu, marking empty ones as coming soon", async () => {
    renderRoute(<Navbar />);
    fireEvent.click(screen.getByRole("button", { name: "Toggle menu" }));
    fireEvent.click(screen.getByRole("button", { name: "Products" }));
    expect(await screen.findByRole("link", { name: "Tactical Footwear" })).toHaveAttribute("href", "/products/tactical-footwear");
    expect(screen.getByText("Base Layers (Soon)")).toBeInTheDocument();
  });
});
