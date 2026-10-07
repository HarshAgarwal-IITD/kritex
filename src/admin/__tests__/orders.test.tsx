import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { resetAdminMockDb, setMockSession } from "@/mocks/admin-handlers";
import { getAdminCommerceDb } from "@/mocks/admin-commerce";
import { chooseOption, renderAdmin, stubPointerApis } from "./render";

beforeEach(() => {
  resetAdminMockDb();
  stubPointerApis();
  setMockSession("staff@kritex.in");
});
afterEach(() => vi.restoreAllMocks());

const type = (el: HTMLElement, value: string) => fireEvent.change(el, { target: { value } });
const order = (id: string) => getAdminCommerceDb().orders.find((o) => o.id === id)!;

describe("admin orders list", () => {
  it("lists orders and filters by status and search", async () => {
    renderAdmin("/admin/orders");
    expect(await screen.findByText("KTX-100006")).toBeInTheDocument();
    expect(screen.getByText("6 orders · page 1 of 1")).toBeInTheDocument();

    await chooseOption(screen.getByRole("combobox", { name: "Filter by status" }), "Awaiting payment");
    await waitFor(() => expect(screen.queryByText("KTX-100006")).not.toBeInTheDocument());
    expect(screen.getByText("KTX-100005")).toBeInTheDocument();
    expect(screen.getByTestId("location")).toHaveTextContent("status=AWAITING_PAYMENT");

    await chooseOption(screen.getByRole("combobox", { name: "Filter by status" }), "All statuses");
    type(screen.getByLabelText("Search orders"), "meera@");
    await waitFor(() => expect(screen.getByText("2 orders · page 1 of 1")).toBeInTheDocument());
    expect(screen.getByText("KTX-100004")).toBeInTheDocument();
    expect(screen.getByText("KTX-100001")).toBeInTheDocument();
  });

  it("filters by date range (inclusive 'to' day)", async () => {
    renderAdmin("/admin/orders");
    await screen.findByText("KTX-100006");
    const today = new Date();
    const day = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    type(screen.getByLabelText("From"), day);
    type(screen.getByLabelText("To"), day);
    await waitFor(() => expect(screen.getByText("2 orders · page 1 of 1")).toBeInTheDocument());
    expect(screen.getByText("KTX-100006")).toBeInTheDocument();
    expect(screen.getByText("KTX-100003")).toBeInTheDocument();
  });

  it("exports the filtered orders as CSV", async () => {
    let saved: Blob | undefined;
    URL.createObjectURL = vi.fn((b: Blob) => {
      saved = b;
      return "blob:orders";
    });
    URL.revokeObjectURL = vi.fn();
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});

    renderAdmin("/admin/orders?status=PAID");
    await screen.findByText("KTX-100006");
    fireEvent.click(screen.getByRole("button", { name: "Export CSV" }));

    await waitFor(() => expect(click).toHaveBeenCalled());
    const csv = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.readAsText(saved!);
    });
    const lines = csv.trim().split("\n");
    expect(lines[0]).toMatch(/^order_number,created_at,status/);
    expect(lines).toHaveLength(3); // header + 2 items of the one PAID order
    expect(lines[1]).toMatch(/^KTX-100006,.*,PAID,/);
  });
});

describe("admin order detail", () => {
  it("shows items with the tax snapshot, totals, customer and timeline", async () => {
    renderAdmin("/admin/orders/ord_1006");
    expect(await screen.findByRole("heading", { name: "KTX-100006" })).toBeInTheDocument();
    const items = screen.getByRole("region", { name: "Items" });
    expect(within(items).getByText("Combat Performance T-Shirt")).toBeInTheDocument();
    expect(within(items).getByText(/M \/ Olive Green · KTX-CPT-1 · HSN 6109/)).toBeInTheDocument();
    expect(within(items).getByText("12%")).toBeInTheDocument();
    expect(within(items).getAllByText("₹7,197.00")).toHaveLength(2); // subtotal = total: 2 × 1299 + 4599
    expect(within(items).getByText(/CGST .* \+ SGST/)).toBeInTheDocument();
    const customer = screen.getByRole("region", { name: "Customer" });
    expect(within(customer).getByText("customer@example.com")).toBeInTheDocument();
    expect(within(customer).getByRole("link", { name: "View customer" })).toHaveAttribute("href", "/admin/customers/usr_customer");
    expect(within(screen.getByRole("list", { name: "Order events" })).getByText("Payment received")).toBeInTheDocument();
  });

  it("changes status through the allowed transitions only", async () => {
    renderAdmin("/admin/orders/ord_1006");
    fireEvent.click(await screen.findByRole("button", { name: "Change status" }));
    const dialog = await screen.findByRole("dialog");
    within(dialog).getByRole("combobox", { name: "New status" }).focus();
    fireEvent.keyDown(within(dialog).getByRole("combobox", { name: "New status" }), { key: "Enter" });
    const options = await screen.findAllByRole("option");
    expect(options.map((o) => o.textContent)).toEqual(["Processing"]); // CANCELLED has its own dialog
    fireEvent.click(options[0]);
    type(within(dialog).getByLabelText("Note (optional)"), "Packing today");
    fireEvent.click(within(dialog).getByRole("button", { name: "Update status" }));

    await waitFor(() => expect(order("ord_1006").status).toBe("PROCESSING"));
    expect(await screen.findByText("Status changed to PROCESSING: Packing today")).toBeInTheDocument();
    expect(order("ord_1006").events.slice(-1)[0].actor).toEqual({ id: "usr_staff", name: "Sam Staff" });
  });

  it("marks a bank-transfer order paid with a reference", async () => {
    renderAdmin("/admin/orders/ord_1005");
    fireEvent.click(await screen.findByRole("button", { name: "Mark paid" }));
    const dialog = await screen.findByRole("dialog");
    fireEvent.click(within(dialog).getByRole("button", { name: "Mark paid" }));
    expect(await within(dialog).findByText("Enter the UTR, cheque or PO number")).toBeInTheDocument();

    type(within(dialog).getByLabelText("Reference"), "UTR998877");
    expect(within(dialog).getByLabelText("Amount received (₹)")).toHaveValue("54950");
    type(within(dialog).getByLabelText("Amount received (₹)"), "54,000.50");
    fireEvent.click(within(dialog).getByRole("button", { name: "Mark paid" }));

    await waitFor(() => expect(order("ord_1005").status).toBe("PAID"));
    expect(order("ord_1005").payments[0]).toMatchObject({ provider: "BANK_TRANSFER", reference: "UTR998877", amount: 5400050 });
    await waitFor(() => expect(screen.queryByRole("button", { name: "Mark paid" })).not.toBeInTheDocument());
  });

  it("refunds part of a payment after confirmation", async () => {
    renderAdmin("/admin/orders/ord_1006");
    fireEvent.click(await screen.findByRole("button", { name: "Refund" }));
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByLabelText("Refund amount (₹)")).toHaveValue("7197");

    type(within(dialog).getByLabelText("Refund amount (₹)"), "8000");
    fireEvent.click(within(dialog).getByRole("button", { name: "Review refund" }));
    expect(await within(dialog).findByText("At most ₹7,197.00 can be refunded")).toBeInTheDocument();
    expect(within(dialog).getByText("Enter a reason")).toBeInTheDocument();

    type(within(dialog).getByLabelText("Refund amount (₹)"), "1299.50");
    type(within(dialog).getByLabelText("Reason"), "One shirt returned");
    type(within(dialog).getByLabelText("Restock KTX-CPT-1"), "1");
    fireEvent.click(within(dialog).getByRole("button", { name: "Review refund" }));

    const confirm = await screen.findByRole("alertdialog");
    expect(within(confirm).getByText("Refund ₹1,299.50?")).toBeInTheDocument();
    expect(within(confirm).getByText(/This is a partial refund of order KTX-100006/)).toBeInTheDocument();
    expect(order("ord_1006").refunds).toHaveLength(0); // nothing sent before confirming

    fireEvent.click(within(confirm).getByRole("button", { name: "Confirm refund" }));
    await waitFor(() => expect(order("ord_1006").refunds).toHaveLength(1));
    expect(order("ord_1006").refunds[0]).toMatchObject({ amount: 129950, reason: "One shirt returned", status: "PENDING" });
    await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
    expect(await screen.findByText("₹5,897.50 refundable")).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("goes back to the form when the refund is not confirmed", async () => {
    renderAdmin("/admin/orders/ord_1006");
    fireEvent.click(await screen.findByRole("button", { name: "Refund" }));
    const dialog = await screen.findByRole("dialog");
    type(within(dialog).getByLabelText("Reason"), "Goodwill");
    fireEvent.click(within(dialog).getByRole("button", { name: "Review refund" }));
    const confirm = await screen.findByRole("alertdialog");
    expect(within(confirm).getByText(/This is a full refund/)).toBeInTheDocument();
    fireEvent.click(within(confirm).getByRole("button", { name: "Back" }));
    expect(await screen.findByRole("button", { name: "Review refund" })).toBeInTheDocument();
    expect(order("ord_1006").refunds).toHaveLength(0);
  });

  it("adds an internal note", async () => {
    renderAdmin("/admin/orders/ord_1004");
    const form = await screen.findByRole("form", { name: "Add note" });
    fireEvent.click(within(form).getByRole("button", { name: "Add note" }));
    expect(await within(form).findByText("Write a note first")).toBeInTheDocument();

    type(within(form).getByLabelText("Add a note"), "Customer asked for an invoice copy");
    fireEvent.click(within(form).getByRole("button", { name: "Add note" }));
    const events = screen.getByRole("list", { name: "Order events" });
    expect(await within(events).findByText("Customer asked for an invoice copy")).toBeInTheDocument();
    expect(order("ord_1004").events.slice(-1)[0]).toMatchObject({ type: "NOTE", internal: true });
    expect(within(events).getAllByText("Internal").length).toBeGreaterThan(0);
  });

  it("cancels with a reason", async () => {
    renderAdmin("/admin/orders/ord_1003");
    fireEvent.click(await screen.findByRole("button", { name: "Cancel order" }));
    const dialog = await screen.findByRole("dialog");
    type(within(dialog).getByLabelText("Reason"), "Customer asked to cancel");
    fireEvent.click(within(dialog).getByRole("button", { name: "Cancel order" }));
    await waitFor(() => expect(order("ord_1003").status).toBe("CANCELLED"));
    expect(screen.queryByRole("button", { name: "Refund" })).not.toBeInTheDocument(); // nothing captured
  });

  it("shows not found for an unknown order", async () => {
    renderAdmin("/admin/orders/ord_nope");
    expect(await screen.findByText("This order doesn't exist.")).toBeInTheDocument();
  });
});
