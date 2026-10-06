import { beforeEach, describe, expect, it } from "vitest";
import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { server } from "@/mocks/server";
import { getAdminMockDb, resetAdminMockDb, setMockSession } from "@/mocks/admin-handlers";
import { chooseOption, renderAdmin, stubPointerApis } from "./render";

beforeEach(() => {
  resetAdminMockDb();
  stubPointerApis();
  setMockSession("staff@kritex.in");
});

const rowNames = () =>
  screen
    .getAllByRole("row")
    .slice(1)
    .map((r) => within(r).queryByRole("link")?.textContent)
    .filter(Boolean);

describe("admin products list", () => {
  it("lists all products with formatted prices and stock", async () => {
    renderAdmin("/admin/products");
    expect(await screen.findByRole("link", { name: "Combat Performance T-Shirt" })).toBeInTheDocument();
    expect(rowNames()).toEqual(["Combat Performance T-Shirt", "Desert Assault Boot", "Rapid 20 Tactical Backpack"]);

    const shirtRow = screen.getByRole("link", { name: "Combat Performance T-Shirt" }).closest("tr")!;
    expect(within(shirtRow).getByText("₹1,299.00")).toBeInTheDocument();
    expect(within(shirtRow).getByText("Active")).toBeInTheDocument();
    expect(within(shirtRow).getByText("Retail")).toBeInTheDocument();
    expect(within(shirtRow).getByText("40")).toBeInTheDocument(); // 4 variants × 10 available
    expect(screen.getByText("3 products · page 1 of 1")).toBeInTheDocument();
  });

  it("searches by name (debounced, reflected in the URL)", async () => {
    renderAdmin("/admin/products");
    await screen.findByRole("link", { name: "Desert Assault Boot" });

    fireEvent.change(screen.getByLabelText("Search products"), { target: { value: "boot" } });

    await waitFor(() => expect(rowNames()).toEqual(["Desert Assault Boot"]));
    expect(screen.getByTestId("location")).toHaveTextContent("q=boot");
  });

  it("filters by status", async () => {
    renderAdmin("/admin/products");
    await screen.findByRole("link", { name: "Desert Assault Boot" });

    await chooseOption(screen.getByLabelText("Filter by status"), "Archived");

    await waitFor(() => expect(rowNames()).toEqual(["Rapid 20 Tactical Backpack"]));
    expect(screen.getByTestId("location")).toHaveTextContent("status=ARCHIVED");
  });

  it("reads filters from the URL and shows an empty state", async () => {
    renderAdmin("/admin/products?q=nothing-matches");
    expect(await screen.findByText("No products match these filters.")).toBeInTheDocument();
  });

  it("paginates", async () => {
    const { products } = getAdminMockDb();
    const template = products[1];
    for (let i = 0; i < 22; i++) {
      products.push({ ...template, id: `prd_extra_${i}`, slug: `extra-${i}`, name: `Extra ${i}`, updatedAt: "2026-01-01T00:00:00.000Z" });
    }
    renderAdmin("/admin/products");
    expect(await screen.findByText("25 products · page 1 of 2")).toBeInTheDocument();
    expect(rowNames()).toHaveLength(20);

    fireEvent.click(screen.getByRole("link", { name: /next/i }));
    expect(await screen.findByText("25 products · page 2 of 2")).toBeInTheDocument();
    expect(rowNames()).toHaveLength(5);
  });

  it("shows API errors", async () => {
    server.use(
      http.get("*/api/v1/admin/products", () =>
        HttpResponse.json({ error: { code: "INTERNAL", message: "Database unavailable" } }, { status: 500 }),
      ),
    );
    renderAdmin("/admin/products");
    expect(await screen.findByText("Database unavailable")).toBeInTheDocument();
  });
});
