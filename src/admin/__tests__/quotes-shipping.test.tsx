import { beforeEach, describe, expect, it } from "vitest";
import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { resetAdminMockDb, setMockSession } from "@/mocks/admin-handlers";
import { getAdminCommerceDb } from "@/mocks/admin-commerce";
import { getB2bOpsMockDb, resetB2bOpsMockDb } from "@/mocks/b2b-ops-handlers";
import { renderAdmin, stubPointerApis } from "./render";

beforeEach(() => {
  resetAdminMockDb();
  resetB2bOpsMockDb();
  stubPointerApis();
  setMockSession("staff@kritex.in");
});

const type = (el: HTMLElement, value: string) => fireEvent.change(el, { target: { value } });
const quote = (id: string) => getB2bOpsMockDb().quotes.find((q) => q.id === id)!;
/** Opens a line's variant Select once the product's variants have loaded and picks the first option. */
async function pickFirstVariant(product: string) {
  const trigger = await screen.findByRole("combobox", { name: `Variant for ${product}` });
  await waitFor(() => expect(trigger).not.toBeDisabled());
  trigger.focus();
  fireEvent.keyDown(trigger, { key: "Enter" });
  fireEvent.click((await screen.findAllByRole("option"))[0]);
}
const order = (id: string) => getAdminCommerceDb().orders.find((o) => o.id === id)!;

describe("admin quotes inbox", () => {
  it("defaults to requests waiting for a response and filters by status", async () => {
    renderAdmin("/admin/quotes");
    expect(await screen.findByText("KTQ-100002")).toBeInTheDocument();
    expect(screen.getByText("KTQ-100003")).toBeInTheDocument();
    expect(screen.queryByText("KTQ-100001")).not.toBeInTheDocument();
    expect(screen.getByText("2 quotes · page 1 of 1")).toBeInTheDocument();

    fireEvent.mouseDown(screen.getByRole("tab", { name: "Quoted" }));
    expect(await screen.findByText("KTQ-100001")).toBeInTheDocument();
    expect(screen.queryByText("KTQ-100002")).not.toBeInTheDocument();
    expect(screen.getByTestId("location")).toHaveTextContent("status=QUOTED");
  });
});

describe("admin quote respond / decline", () => {
  it("requires a price and a pinned variant per line, then sends the quote", async () => {
    renderAdmin("/admin/quotes/qt_2");
    expect(await screen.findByRole("heading", { name: "KTQ-100002" })).toBeInTheDocument();
    expect(screen.getByText("Vikram Security Services Pvt Ltd")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Send quote" }));
    expect(await screen.findAllByText("Enter a unit price like 1299 or 1299.50")).toHaveLength(2);
    expect(screen.getAllByText("Pick the variant to supply")).toHaveLength(2);

    type(screen.getByLabelText("Unit price for Combat Performance T-Shirt"), "1,149.50");
    type(screen.getByLabelText("Unit price for Liberty Warrior Jungle Boot"), "2999");
    await pickFirstVariant("Combat Performance T-Shirt");
    await pickFirstVariant("Liberty Warrior Jungle Boot");
    // 200 × 1149.50 + 40 × 2999 = 229,900 + 119,960
    expect(screen.getByTestId("respond-total")).toHaveTextContent("₹3,49,860.00");
    type(screen.getByLabelText("Message to the customer (optional)"), "Lead time 3 weeks.");
    fireEvent.click(screen.getByRole("button", { name: "Send quote" }));

    await waitFor(() => expect(quote("qt_2").status).toBe("QUOTED"));
    const q = quote("qt_2");
    expect(q.items.map((i) => i.quotedUnitPrice)).toEqual([114950, 299900]);
    expect(q.items.every((i) => i.variantId)).toBe(true);
    expect(q.items[0].variantId).toMatch(/^var_combat-performance-tshirt_/);
    expect(q.quotedTotal).toBe(34986000);
    expect(q.responseMessage).toBe("Lead time 3 weeks.");
    expect(new Date(q.validUntil!).getTime()).toBeGreaterThan(Date.now() + 13 * 86400_000);
    expect(await screen.findByRole("button", { name: "Update quote" })).toBeInTheDocument();
  });

  it("declines with a reason", async () => {
    renderAdmin("/admin/quotes/qt_3");
    fireEvent.click(await screen.findByRole("button", { name: "Decline" }));
    const dialog = await screen.findByRole("dialog");
    type(within(dialog).getByLabelText("Reason"), "Out of stock until next quarter.");
    fireEvent.click(within(dialog).getByRole("button", { name: "Decline" }));
    await waitFor(() => expect(quote("qt_3").status).toBe("REJECTED"));
    expect(quote("qt_3").responseMessage).toBe("Out of stock until next quarter.");
    expect(await screen.findByText("Reason given")).toBeInTheDocument();
  });
});

describe("admin order shipping (OPS-4)", () => {
  it("ships via Shiprocket (AWB, label, pickup) then marks it shipped", async () => {
    renderAdmin("/admin/orders/ord_1006");
    const shipping = await screen.findByRole("region", { name: "Shipping" });
    fireEvent.click(within(shipping).getByRole("button", { name: "Ship via Shiprocket" }));
    let dialog = await screen.findByRole("dialog");
    type(within(dialog).getByLabelText("Weight (g)"), "1.5");
    fireEvent.click(within(dialog).getByRole("button", { name: "Create shipment" }));
    expect(await within(dialog).findByText("Weight must be a whole number above 0")).toBeInTheDocument();
    type(within(dialog).getByLabelText("Weight (g)"), "1500");
    fireEvent.click(within(dialog).getByRole("button", { name: "Create shipment" }));

    await waitFor(() => expect(order("ord_1006").shipments).toHaveLength(1));
    expect(order("ord_1006").status).toBe("PROCESSING");
    const awb = order("ord_1006").shipments[0].awb!;
    const group = await screen.findByRole("group", { name: `Shipment ${awb}` });
    expect(within(group).getByText("Ready to ship")).toBeInTheDocument();
    expect(within(group).getByRole("link", { name: /Print label/ })).toHaveAttribute("href", `/__mock-labels/${awb}.pdf`);
    expect(within(group).getByText("Pickup requested")).toBeInTheDocument();
    expect(within(screen.getByRole("region", { name: "Shipping" })).queryByRole("button", { name: "Ship via Shiprocket" })).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Mark shipped" }));
    dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByLabelText("AWB / tracking number")).toHaveValue(awb);
    fireEvent.click(within(dialog).getByRole("button", { name: "Mark shipped" }));
    await waitFor(() => expect(order("ord_1006").status).toBe("SHIPPED"));
    expect(order("ord_1006").shipments).toHaveLength(1);
  });

  it("manual ship: courier + AWB + tracking URL", async () => {
    renderAdmin("/admin/orders/ord_1006");
    fireEvent.click(await screen.findByRole("button", { name: "Ship manually" }));
    const dialog = await screen.findByRole("dialog");
    fireEvent.click(within(dialog).getByRole("button", { name: "Mark shipped" }));
    expect(await within(dialog).findByText("Enter the courier")).toBeInTheDocument();
    type(within(dialog).getByLabelText("Courier"), "Blue Dart");
    type(within(dialog).getByLabelText("AWB / tracking number"), "BD123456");
    type(within(dialog).getByLabelText("Tracking URL (optional)"), "bluedart.com/x");
    fireEvent.click(within(dialog).getByRole("button", { name: "Mark shipped" }));
    expect(await within(dialog).findByText("Enter a full URL starting with https://")).toBeInTheDocument();
    type(within(dialog).getByLabelText("Tracking URL (optional)"), "https://bluedart.com/track/BD123456");
    fireEvent.click(within(dialog).getByRole("button", { name: "Mark shipped" }));

    await waitFor(() => expect(order("ord_1006").status).toBe("SHIPPED"));
    expect(order("ord_1006").shipments[0]).toMatchObject({ manual: true, carrier: "Blue Dart", awb: "BD123456", status: "SHIPPED" });
    const group = await screen.findByRole("group", { name: "Shipment BD123456" });
    expect(within(group).getByText("Manual shipment", { exact: false })).toBeInTheDocument();
    expect(within(group).getByRole("link", { name: /Track/ })).toHaveAttribute("href", "https://bluedart.com/track/BD123456");
  });

  it("shows an existing Shiprocket shipment with its tracking timeline; no ship actions once shipped", async () => {
    renderAdmin("/admin/orders/ord_1004");
    const group = await screen.findByRole("group", { name: "Shipment DLV1004556677" });
    expect(within(group).getByText("In transit")).toBeInTheDocument();
    const events = within(within(group).getByRole("list", { name: "Tracking events" })).getAllByRole("listitem");
    expect(events[0]).toHaveTextContent("Arrived at hub");
    expect(events[0]).toHaveTextContent("Bengaluru");
    expect(screen.queryByRole("button", { name: /Ship via Shiprocket|Ship manually|Mark shipped/ })).toBeNull();
  });
});
