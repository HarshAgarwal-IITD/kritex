import { beforeEach, describe, expect, it } from "vitest";
import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { delay, http, HttpResponse } from "msw";
import { server } from "@/mocks/server";
import { apiPath } from "@/mocks/handlers";
import { getCommerceMockDb, seedMockCart, setMockStock } from "@/mocks/commerce-handlers";
import { renderApp, resetMocks, SHIRT_L, SHIRT_M, SHIRT_PRICE, SHIRT_XXL } from "@/test/render-app";
import { withQuantity } from "./hooks";
import type { Cart } from "./types";

beforeEach(() => resetMocks());

const lines = () => screen.findAllByTestId("cart-line");

describe("withQuantity (optimistic cart update)", () => {
  const cart = {
    id: "c",
    itemCount: 3,
    hasIssues: false,
    coupon: null,
    updatedAt: "",
    items: [
      { variantId: "a", quantity: 1, unitPrice: 100, lineTotal: 100, issue: null },
      { variantId: "b", quantity: 2, unitPrice: 50, lineTotal: 100, issue: "INSUFFICIENT_STOCK" },
    ],
    totals: { subtotal: 100, discount: 0, shipping: 0, taxTotal: 0, cgst: 0, sgst: 0, igst: 0, total: 100, currency: "INR" },
  } as unknown as Cart;

  it("updates the line, count and subtotal/total by the delta", () => {
    const next = withQuantity(cart, "a", 3);
    expect(next.items[0]).toMatchObject({ quantity: 3, lineTotal: 300 });
    expect(next.itemCount).toBe(5);
    expect(next.totals).toMatchObject({ subtotal: 300, total: 300 });
  });

  it("removes the line at 0 and leaves totals alone for lines with issues (excluded server-side)", () => {
    const next = withQuantity(cart, "b", 0);
    expect(next.items.map((l) => l.variantId)).toEqual(["a"]);
    expect(next.totals.total).toBe(100);
  });
});

describe("PDP add to cart", () => {
  it("adds the selected variant, opens the drawer and updates the navbar count", async () => {
    renderApp("/product/full-sleeve-combat-tshirt");
    await screen.findByRole("heading", { name: "Tactical Combat Full Sleeve T-Shirt", level: 1 });
    const add = screen.getByRole("button", { name: /Add to Cart/ });
    expect(add).toBeDisabled();
    expect(screen.getByTestId("select-options-hint")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "M" }));
    fireEvent.click(screen.getByRole("button", { name: /Increase quantity/ }));
    fireEvent.click(screen.getByRole("button", { name: /Add to Cart/ }));

    const drawer = await screen.findByRole("dialog");
    expect(within(drawer).getByText(/Your Cart \(2\)/)).toBeInTheDocument();
    expect(within(drawer).getAllByTestId("cart-line")).toHaveLength(1);
    expect(getCommerceMockDb().cartLines).toEqual([{ variantId: SHIRT_M, quantity: 2 }]);
    await waitFor(() => expect(screen.getAllByRole("link", { name: "Cart (2 items)", hidden: true }).length).toBeGreaterThan(0));
  });

  it("shows an error toast-worthy failure without adding when stock is short", async () => {
    setMockStock(SHIRT_M, 0);
    renderApp("/product/full-sleeve-combat-tshirt");
    await screen.findByRole("heading", { name: "Tactical Combat Full Sleeve T-Shirt", level: 1 });
    fireEvent.click(screen.getByRole("button", { name: "M" }));
    fireEvent.click(screen.getByRole("button", { name: /Add to Cart/ }));
    await waitFor(() => expect(screen.getByRole("button", { name: /Add to Cart/ })).not.toBeDisabled());
    expect(getCommerceMockDb().cartLines).toEqual([]);
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});

describe("/cart", () => {
  it("shows an empty state", async () => {
    renderApp("/cart");
    expect(await screen.findByText("Your cart is empty.")).toBeInTheDocument();
  });

  it("steps quantities optimistically and rolls back on error", async () => {
    seedMockCart([{ variantId: SHIRT_M, quantity: 1 }]);
    renderApp("/cart");
    const [line] = await lines();
    fireEvent.click(within(line).getByRole("button", { name: /Increase quantity/ }));
    await waitFor(() => expect(within(line).getByTestId("quantity")).toHaveTextContent("2"));
    await waitFor(() => expect(getCommerceMockDb().cartLines[0].quantity).toBe(2));
    expect(screen.getByTestId("totals-subtotal")).toHaveTextContent("2,598.00");

    server.use(
      http.patch(apiPath("/api/v1/cart/items/:variantId"), async () => {
        await delay(100);
        return HttpResponse.json({ error: { code: "INSUFFICIENT_STOCK", message: "no", details: { available: 2, requested: 3 } } }, { status: 409 });
      }),
    );
    fireEvent.click(within(line).getByRole("button", { name: /Increase quantity/ }));
    // Optimistic: shown while the request is still in flight…
    await waitFor(() => expect(within(line).getByTestId("quantity")).toHaveTextContent("3"));
    // …then rolled back when it fails.
    await waitFor(() => expect(within(line).getByTestId("quantity")).toHaveTextContent("2"));
  });

  it("shows per-line issues and blocks checkout until fixed", async () => {
    seedMockCart([
      { variantId: SHIRT_M, quantity: 1 },
      { variantId: SHIRT_XXL, quantity: 1 },
      { variantId: "var_gone", quantity: 1 },
    ]);
    setMockStock(SHIRT_M, 1);
    renderApp("/cart");
    await lines();
    const issues = screen.getAllByTestId("line-issue").map((e) => e.textContent);
    expect(issues).toEqual([expect.stringMatching(/Out of stock/), expect.stringMatching(/No longer available/)]);
    expect(screen.getByRole("button", { name: "Checkout" })).toBeDisabled();
    // Issue lines are excluded from the totals.
    expect(screen.getByTestId("totals-subtotal")).toHaveTextContent("1,299.00");

    fireEvent.click(screen.getByRole("button", { name: /Remove Tactical Combat Full Sleeve T-Shirt \(XXL\)/ }));
    await waitFor(() => expect(screen.getAllByTestId("cart-line")).toHaveLength(2));
    fireEvent.click(screen.getByRole("button", { name: /Remove Unavailable item/ }));
    await waitFor(() => expect(screen.getByRole("button", { name: "Checkout" })).not.toBeDisabled());
  });

  it("flags insufficient stock on a line", async () => {
    seedMockCart([{ variantId: SHIRT_L, quantity: 5 }]);
    setMockStock(SHIRT_L, 2);
    renderApp("/cart");
    await lines();
    expect(screen.getByTestId("line-issue")).toHaveTextContent(/Only a few left/);
  });

  it("applies a coupon and maps COUPON_* errors to friendly messages", async () => {
    seedMockCart([{ variantId: SHIRT_M, quantity: 1 }]);
    renderApp("/cart");
    await lines();
    const input = screen.getByLabelText("Coupon code");

    fireEvent.change(input, { target: { value: "old10" } });
    fireEvent.click(screen.getByRole("button", { name: "Apply" }));
    expect(await screen.findByText("This code has expired.")).toBeInTheDocument();

    fireEvent.change(input, { target: { value: "FLAT200" } });
    fireEvent.click(screen.getByRole("button", { name: "Apply" }));
    expect(await screen.findByText("Add ₹201.00 more to use this code.")).toBeInTheDocument();

    fireEvent.change(input, { target: { value: "NOPE" } });
    fireEvent.click(screen.getByRole("button", { name: "Apply" }));
    expect(await screen.findByText("This code isn't valid.")).toBeInTheDocument();

    fireEvent.change(input, { target: { value: "welcome10" } });
    fireEvent.click(screen.getByRole("button", { name: "Apply" }));
    expect(await screen.findByTestId("applied-coupon")).toHaveTextContent("WELCOME10");
    expect(screen.getByTestId("totals-discount")).toHaveTextContent("129.90");
    expect(screen.getByTestId("totals-total")).toHaveTextContent("1,169.10");
    expect(screen.getByTestId("gst-note")).toHaveTextContent(/Inclusive of GST/);

    fireEvent.click(screen.getByRole("button", { name: "Remove coupon WELCOME10" }));
    await waitFor(() => expect(screen.queryByTestId("applied-coupon")).toBeNull());
  });

  it("shows a stored coupon that no longer applies, with its reason", async () => {
    seedMockCart([{ variantId: SHIRT_M, quantity: 1 }], "FLAT200");
    renderApp("/cart");
    expect(await screen.findByTestId("coupon-invalid")).toHaveTextContent(/below the minimum/);
    expect(screen.queryByTestId("totals-discount")).toBeNull();
    expect(screen.getByTestId("totals-total")).toHaveTextContent(new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format((SHIRT_PRICE) / 100));
  });
});
