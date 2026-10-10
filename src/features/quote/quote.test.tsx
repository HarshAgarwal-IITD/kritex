import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { MOCK_PASSWORD, setMockSession } from "@/mocks/admin-handlers";
import { getCommerceMockDb, seedMockCart } from "@/mocks/commerce-handlers";
import { ensureMockB2BUser, getB2bOpsMockDb, MOCK_B2B_EMAIL } from "@/mocks/b2b-ops-handlers";
import { renderApp, resetMocks, SHIRT_M } from "@/test/render-app";
import { QUOTE_CART_STORAGE_KEY, quoteCart } from "./store";

beforeEach(() => {
  resetMocks();
  quoteCart.clear();
});

const type = (label: string | RegExp, value: string) => fireEvent.change(screen.getByLabelText(label), { target: { value } });
const location = () => screen.getByTestId("location").textContent;

describe("quote cart store", () => {
  it("merges the same product/variant, persists to localStorage and survives corrupt storage", () => {
    // Node's own (file-less) localStorage global shadows jsdom's here; give the store a working one.
    const mem = new Map<string, string>();
    vi.stubGlobal("localStorage", {
      getItem: (k: string) => mem.get(k) ?? null,
      setItem: (k: string, v: string) => void mem.set(k, v),
      removeItem: (k: string) => void mem.delete(k),
    });
    const line = { productId: "p1", productSlug: "p", productName: "P", image: null, quantity: 2 };
    quoteCart.add(line);
    quoteCart.add({ ...line, quantity: 3 });
    quoteCart.add({ ...line, variantId: "v1", quantity: 1 });
    expect(quoteCart.get().map((l) => [l.variantId, l.quantity])).toEqual([
      [undefined, 5],
      ["v1", 1],
    ]);
    expect(JSON.parse(localStorage.getItem(QUOTE_CART_STORAGE_KEY)!)).toHaveLength(2);

    localStorage.setItem(QUOTE_CART_STORAGE_KEY, "{not json");
    quoteCart.reload();
    expect(quoteCart.get()).toEqual([]);
    vi.unstubAllGlobals();
  });
});

describe("RFQ (B2B-2)", () => {
  it("a guest fills the RFQ, logs in, and it is sent automatically", async () => {
    quoteCart.add({ productId: "prd_rapid-20-tactical-backpack", productSlug: "rapid-20-tactical-backpack", productName: "Rapid 20", image: null, quantity: 5 });
    renderApp("/quote");
    const send = await screen.findByRole("button", { name: "Log In & Send Request" });
    type("Your name", "Gita Guest");
    type("Company / organisation", "Guest Traders");
    type("Mobile number", "9876543210");
    fireEvent.click(send);

    await waitFor(() => expect(location()).toBe("/login?next=%2Faccount%2Fquotes"));
    expect(getB2bOpsMockDb().quotes.find((q) => q.contactName === "Gita Guest")).toBeUndefined();

    await screen.findByRole("heading", { name: "Log In" });
    type("Email", "customer@example.com");
    type("Password", MOCK_PASSWORD);
    fireEvent.click(screen.getByRole("button", { name: "Log In" }));

    await waitFor(() => expect(getB2bOpsMockDb().quotes.find((q) => q.contactName === "Gita Guest")).toBeDefined());
    expect(getB2bOpsMockDb().quotes.find((q) => q.contactName === "Gita Guest")).toMatchObject({
      userId: "usr_customer",
      email: "customer@example.com",
      organization: "Guest Traders",
    });
    await waitFor(() => expect(location()).toBe("/account/quotes"));
    expect(quoteCart.get()).toEqual([]);
    expect(localStorage.getItem("kritex_pending_enquiry")).toBeNull();
  });

  it("PDP → add to quote → /quote → send RFQ signed in → confirmation", async () => {
    resetMocks("customer@example.com");
    renderApp("/product/og-polo-tshirt");
    await screen.findByRole("heading", { name: "Tactical Combat OG Polo T-Shirt" });
    fireEvent.click(screen.getByRole("button", { name: "L" }));
    fireEvent.click(screen.getByRole("button", { name: /Add to Quote/ }));
    // The navbar shows the quote request once it has items.
    expect(screen.getAllByRole("link", { name: "Quote request (1 items)" }).length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole("link", { name: /View quote request \(1 item\)/ }));

    expect(await screen.findByRole("heading", { name: "Request a Quote" })).toBeInTheDocument();
    const line = screen.getByTestId("quote-line");
    expect(within(line).getByText(/SKU KTX-OPT-L/)).toBeInTheDocument();
    const qty = screen.getByLabelText("Quantity for Tactical Combat OG Polo T-Shirt");
    fireEvent.change(qty, { target: { value: "250" } });
    fireEvent.blur(qty);
    const notes = screen.getByLabelText("Notes for Tactical Combat OG Polo T-Shirt");
    fireEvent.change(notes, { target: { value: "Embroidered logo" } });
    fireEvent.blur(notes);

    // Client-side validation first.
    await waitFor(() => expect(screen.getByLabelText("Your name")).toHaveValue("Chris Customer"));
    type("Your name", "");
    type("GSTIN (optional)", "NOT-A-GSTIN");
    fireEvent.click(screen.getByRole("button", { name: "Send Quote Request" }));
    expect(await screen.findByText(/Enter your name/)).toBeInTheDocument();
    expect(screen.getByText(/valid 15-character GSTIN/)).toBeInTheDocument();

    type("Your name", "Priya Shah");
    type("Company / organisation", "Shah Security Pvt Ltd");
    type("Mobile number", "98200 12345");
    type("GSTIN (optional)", "27aapfu0939f1zv");
    type("Notes (optional)", "Need by month end");
    fireEvent.click(screen.getByRole("button", { name: "Send Quote Request" }));

    expect(await screen.findByTestId("quote-number")).toHaveTextContent("KTQ-100005");
    expect(screen.getByText("customer@example.com")).toBeInTheDocument();
    const sent = getB2bOpsMockDb().quotes[0];
    expect(sent).toMatchObject({
      number: "KTQ-100005",
      status: "REQUESTED",
      userId: "usr_customer",
      contactName: "Priya Shah",
      email: "customer@example.com",
      phone: "+919820012345",
      gstin: "27AAPFU0939F1ZV",
      notes: "Need by month end",
    });
    expect(sent.items).toEqual([
      expect.objectContaining({ productId: "prd_og-polo-tshirt", variantId: "var_og-polo-tshirt_L", quantity: 250, requestedNotes: "Embroidered logo" }),
    ]);
    expect(quoteCart.get()).toEqual([]);
  });

  it("listing card 'Add to quote' adds the product without leaving the page", async () => {
    renderApp("/products/load-bearing");
    fireEvent.click(await screen.findByRole("button", { name: "Add Rapid 20 Tactical Backpack to quote" }));
    expect(location()).toBe("/products/load-bearing");
    expect(quoteCart.get()).toEqual([expect.objectContaining({ productId: "prd_rapid-20-tactical-backpack", quantity: 1 })]);
  });

  it("links a signed-in user's RFQ to the account", async () => {
    resetMocks("customer@example.com");
    quoteCart.add({ productId: "prd_rapid-20-tactical-backpack", productSlug: "rapid-20-tactical-backpack", productName: "Rapid 20", image: null, quantity: 5 });
    renderApp("/quote");
    expect(await screen.findByText("customer@example.com")).toBeInTheDocument();
    type("Company / organisation", "Chris Co");
    type("Mobile number", "9876543210");
    fireEvent.click(screen.getByRole("button", { name: "Send Quote Request" }));
    fireEvent.click(await screen.findByRole("link", { name: "View Quote" }));
    expect(await screen.findByText("We're preparing your quote. You'll get an email as soon as it's ready.")).toBeInTheDocument();
    expect(getB2bOpsMockDb().quotes[0].userId).toBe("usr_customer");
  });
});

describe("customer quotes (B2B-5)", () => {
  it("lists quotes, shows per-line prices + validity, accepts → fake payment success", async () => {
    resetMocks("customer@example.com");
    renderApp("/account/quotes");
    const list = await screen.findByRole("list", { name: "Quotes" });
    expect(within(list).getByText("KTQ-100001")).toBeInTheDocument();
    expect(within(list).getByText("Quote ready")).toBeInTheDocument();
    fireEvent.click(within(list).getByText("KTQ-100001"));

    expect(await screen.findByRole("heading", { name: "Quote KTQ-100001" })).toBeInTheDocument();
    const items = await screen.findAllByTestId("quote-item");
    expect(items[0]).toHaveTextContent("50 × ₹649.00");
    expect(items[0]).toHaveTextContent("₹32,450.00");
    expect(screen.getByTestId("quoted-total")).toHaveTextContent("₹51,450.00");
    expect(screen.getByText(/Dispatch within 7 working days/)).toBeInTheDocument();
    expect(screen.getByText(/valid until/)).toBeInTheDocument();

    // Saved address → Deliver Here → Accept & Pay.
    fireEvent.click(await screen.findByRole("button", { name: "Deliver Here" }));
    fireEvent.click(await screen.findByRole("button", { name: "Accept & Pay" }));
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText(/KTX-100003/)).toBeInTheDocument();
    fireEvent.click(within(dialog).getByRole("button", { name: "Success" }));

    await waitFor(() => expect(location()).toBe("/checkout/success/KTX-100003"));
    const order = getCommerceMockDb().orders.find((o) => o.number === "KTX-100003")!;
    expect(order).toMatchObject({ status: "PAID", quoteNumber: "KTQ-100001", userId: "usr_customer" });
    expect(order.items.map((i) => [i.quantity, i.unitPrice])).toEqual([
      [50, 64900],
      [20, 95000],
    ]);
    expect(getB2bOpsMockDb().quotes.find((q) => q.number === "KTQ-100001")).toMatchObject({ status: "CONVERTED", orderNumber: "KTX-100003" });
  });

  it("an approved B2B buyer can accept by bank transfer → pay-by instructions", async () => {
    resetMocks();
    ensureMockB2BUser();
    setMockSession(MOCK_B2B_EMAIL);
    const q = getB2bOpsMockDb().quotes.find((x) => x.number === "KTQ-100001")!;
    q.userId = "usr_b2b";
    q.gstin = "27AAPFU0939F1ZV";
    renderApp("/account/quotes/KTQ-100001");
    await screen.findByLabelText("Full name");
    type("Full name", "Bina Buyer");
    type("Mobile number", "9820012345");
    type("Address", "5 Dock Road");
    type("PIN code", "400001");
    fireEvent.click(screen.getByRole("button", { name: "Deliver Here" }));
    fireEvent.click(await screen.findByRole("radio", { name: /Bank transfer/ }));
    fireEvent.click(screen.getByRole("button", { name: "Accept & Place Order" }));
    await waitFor(() => expect(location()).toBe("/checkout/pending/KTX-100003"));
    expect(await screen.findByText("HDFC0000000")).toBeInTheDocument();
    expect(screen.getByText("Pay by")).toBeInTheDocument();
  });
});

describe("tier prices (B2B-3)", () => {
  it("retail visitors see no tier table", async () => {
    renderApp("/product/full-sleeve-combat-tshirt");
    await screen.findByRole("heading", { name: "Tactical Combat Full Sleeve T-Shirt" });
    expect(screen.queryByTestId("price-tiers")).toBeNull();
  });

  it("approved B2B buyers see the tier table, and the cart prices at the tier", async () => {
    resetMocks();
    ensureMockB2BUser();
    setMockSession(MOCK_B2B_EMAIL);
    seedMockCart([{ variantId: SHIRT_M, quantity: 10 }]);
    const pdp = renderApp("/product/full-sleeve-combat-tshirt");
    const table = await screen.findByRole("table", { name: "Volume pricing" });
    const rows = within(table).getAllByRole("row");
    expect(rows.map((r) => r.textContent)).toEqual(["From 10 units₹1,199.00 each", "From 50 units₹1,099.00 each"]);

    pdp.unmount();

    // B2B-only products become purchasable for them.
    const shorts = renderApp("/product/tactical-cargo-shorts");
    expect(await screen.findByRole("button", { name: /Add to Cart/ })).toBeInTheDocument();
    shorts.unmount();

    renderApp("/cart");
    const lines = await screen.findAllByTestId("cart-line");
    expect(lines[0]).toHaveTextContent("₹1,199.00 each");
    expect(within(lines[0]).getByTestId("line-total")).toHaveTextContent("₹11,990.00");
  });
});

describe("order tracking (OPS-5)", () => {
  it("looks up an order by number + email and shows shipments and scans", async () => {
    renderApp("/track");
    await screen.findByLabelText("Order number");
    type("Order number", "ktx-100001");
    type("Email", "wrong@example.com");
    fireEvent.click(screen.getByRole("button", { name: "Track Order" }));
    expect(await screen.findByText(/couldn't find an order with that number and email/)).toBeInTheDocument();
    expect(location()).toBe("/track/KTX-100001");

    type("Email", "Customer@Example.com");
    fireEvent.click(screen.getByRole("button", { name: "Track Order" }));
    expect(await screen.findByRole("heading", { name: "Order KTX-100001" })).toBeInTheDocument();
    expect(screen.getByText("Delhivery · AWB 1234567890")).toBeInTheDocument();
    expect(screen.getByTestId("shipment-status")).toHaveTextContent("Delivered");
    const scans = within(screen.getByRole("list", { name: "Tracking history" })).getAllByRole("listitem");
    expect(scans[0]).toHaveTextContent("Delivered");
    expect(scans[2]).toHaveTextContent("Shipment picked up");
    expect(screen.getByRole("link", { name: /Track on Delhivery/ })).toHaveAttribute("href", "https://www.delhivery.com/track/package/1234567890");
  });

  it("accepts ?email= (emailed links) and says when nothing has shipped", async () => {
    renderApp("/track/KTX-100002?email=customer@example.com");
    expect(await screen.findByText(/hasn't shipped yet/)).toBeInTheDocument();
  });

  it("is linked from the account order detail", async () => {
    resetMocks("customer@example.com");
    renderApp("/account/orders/KTX-100001");
    fireEvent.click(await screen.findByRole("link", { name: "Track order" }));
    expect(await screen.findByRole("heading", { name: "Order KTX-100001" })).toBeInTheDocument();
  });
});
