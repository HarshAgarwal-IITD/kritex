import { beforeEach, describe, expect, it } from "vitest";
import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { getAdminMockDb, resetAdminMockDb, setMockSession } from "@/mocks/admin-handlers";
import { server } from "@/mocks/server";
import { chooseOption, renderAdmin, stubPointerApis } from "./render";

beforeEach(() => {
  resetAdminMockDb();
  stubPointerApis();
  setMockSession("admin@kritex.in");
});

const type = (el: HTMLElement, value: string) => fireEvent.change(el, { target: { value } });

function addOptionValues(label: string, values: string[]) {
  const input = screen.getByLabelText(label);
  for (const v of values) {
    type(input, v);
    fireEvent.keyDown(input, { key: "Enter" });
  }
}

describe("admin product editor", () => {
  it("creates a product with options, generates variants, then saves per-variant price and stock", async () => {
    renderAdmin("/admin/products/new");
    const name = await screen.findByLabelText("Name");

    type(name, "Field Jacket");
    expect(screen.getByLabelText("Slug")).toHaveValue("field-jacket");
    await chooseOption(screen.getByRole("combobox", { name: "Category" }), "Combat Apparel");
    await chooseOption(screen.getByRole("combobox", { name: "Sale channel" }), "Retail");
    type(screen.getByLabelText("Base price (₹)"), "2499.50");
    type(screen.getByLabelText("HSN code"), "6201");

    fireEvent.click(screen.getByRole("button", { name: "Add option" }));
    expect(screen.getByLabelText("Option name")).toHaveValue("Size");
    addOptionValues("Size values", ["S", "M"]);
    fireEvent.click(screen.getByRole("button", { name: "Add option" }));
    expect(screen.getAllByLabelText("Option name")[1]).toHaveValue("Colour");
    addOptionValues("Colour values", ["Olive"]);
    expect(screen.getByText("2 combinations")).toBeInTheDocument();
    type(screen.getByLabelText("Starting stock per variant"), "5");

    fireEvent.click(screen.getByRole("button", { name: "Add tier" }));
    type(screen.getByLabelText("Tier 1 minimum quantity"), "25");
    type(screen.getByLabelText("Tier 1 unit price"), "1,999");

    fireEvent.click(screen.getByRole("button", { name: "Create product" }));

    // Lands on the edit page with the generated variants.
    expect(await screen.findByRole("heading", { name: "Field Jacket" })).toBeInTheDocument();
    const product = getAdminMockDb().products.find((p) => p.slug === "field-jacket")!;
    expect(screen.getByTestId("location")).toHaveTextContent(`/admin/products/${product.id}`);
    expect(product).toMatchObject({
      name: "Field Jacket",
      category: { id: "cat_apparel" },
      saleChannel: "RETAIL",
      status: "DRAFT",
      basePrice: 249950,
      hsnCode: "6201",
      gstRate: 12,
      options: [
        { name: "Size", values: ["S", "M"] },
        { name: "Colour", values: ["Olive"] },
      ],
      priceTiers: [{ minQty: 25, unitPrice: 199900 }],
    });
    expect(product.variants.map((v) => [v.title, v.stock, v.price, v.effectivePrice])).toEqual([
      ["S / Olive", 5, null, 249950],
      ["M / Olive", 5, null, 249950],
    ]);

    // Edit a variant: price override + stock change.
    const variants = await screen.findByRole("group", { name: "Variants" });
    type(within(variants).getByLabelText("S / Olive price"), "2599");
    type(within(variants).getByLabelText("S / Olive stock"), "8");
    await chooseOption(screen.getByRole("combobox", { name: "Stock change reason" }), "Restock");
    fireEvent.click(within(variants).getByRole("button", { name: "Save variants" }));

    await waitFor(() => {
      const s = getAdminMockDb().products.find((p) => p.id === product.id)!.variants[0];
      expect(s).toMatchObject({ price: 259900, stock: 8, effectivePrice: 259900 });
    });
    const m = getAdminMockDb().products.find((p) => p.id === product.id)!.variants[1];
    expect(m).toMatchObject({ price: null, stock: 5 });
  });

  it("blocks submit and shows field errors when required fields are missing", async () => {
    let posted = false;
    server.events.on("request:start", ({ request }) => {
      if (request.method === "POST" && request.url.endsWith("/admin/products")) posted = true;
    });
    renderAdmin("/admin/products/new");
    fireEvent.click(await screen.findByRole("button", { name: "Create product" }));

    expect(await screen.findByText("Choose a category")).toBeInTheDocument();
    expect(screen.getAllByText("Required").length).toBeGreaterThanOrEqual(2); // name + slug
    type(screen.getByLabelText("Base price (₹)"), "12.345");
    fireEvent.click(screen.getByRole("button", { name: "Create product" }));
    expect(await screen.findByText("Enter an amount like 1299 or 1299.50")).toBeInTheDocument();
    expect(posted).toBe(false);
    server.events.removeAllListeners();
  });

  it("edits an existing product: uploads an image, changes SEO and saves", async () => {
    renderAdmin("/admin/products/prd_shirt");
    expect(await screen.findByRole("heading", { name: "Combat Performance T-Shirt" })).toBeInTheDocument();
    expect(screen.getByLabelText("Base price (₹)")).toHaveValue("1299");
    expect(screen.getByLabelText("Tier 1 unit price")).toHaveValue("1099");
    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();

    const file = new File([new Uint8Array([137, 80, 78, 71])], "olive.png", { type: "image/png" });
    fireEvent.change(screen.getByLabelText("Upload images"), { target: { files: [file] } });
    expect(await screen.findByLabelText("Image 2 alt text")).toBeInTheDocument();
    type(screen.getByLabelText("Image 2 alt text"), "Olive front");
    type(screen.getByLabelText("SEO title"), "Combat T-Shirt | Kritex");

    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => {
      const p = getAdminMockDb().products.find((x) => x.id === "prd_shirt")!;
      expect(p.seoTitle).toBe("Combat T-Shirt | Kritex");
      expect(p.images).toHaveLength(2);
    });
    const p = getAdminMockDb().products.find((x) => x.id === "prd_shirt")!;
    expect(p.images[1]).toMatchObject({ alt: "Olive front", sortOrder: 1 });
    expect(p.images[1].url).toMatch(/\/__mock-uploads\/product_image\/.+olive\.png$/);
    expect(p.basePrice).toBe(129900); // unchanged round-trip
  });
});
