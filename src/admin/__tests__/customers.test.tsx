import { beforeEach, describe, expect, it } from "vitest";
import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { resetAdminMockDb, setMockSession } from "@/mocks/admin-handlers";
import { getAdminCommerceDb } from "@/mocks/admin-commerce";
import { renderAdmin, stubPointerApis } from "./render";

beforeEach(() => {
  resetAdminMockDb();
  stubPointerApis();
  setMockSession("staff@kritex.in");
});

const type = (el: HTMLElement, value: string) => fireEvent.change(el, { target: { value } });
const profile = (id: string) => getAdminCommerceDb().businessProfiles.find((b) => b.id === id)!;

describe("admin customers", () => {
  it("lists customers with order count and total spent, and opens the detail", async () => {
    renderAdmin("/admin/customers");
    const row = (await screen.findByRole("link", { name: "Chris Customer" })).closest("tr")!;
    expect(within(row).getByText("2")).toBeInTheDocument(); // two orders
    expect(within(row).getByText("₹11,094.00")).toBeInTheDocument(); // 7197 + 3897, both paid

    fireEvent.click(screen.getByRole("link", { name: "Chris Customer" }));
    expect(await screen.findByRole("heading", { name: "Chris Customer" })).toBeInTheDocument();
    const recent = screen.getByRole("region", { name: "Recent orders" });
    expect(within(recent).getByRole("link", { name: "KTX-100006" })).toHaveAttribute("href", "/admin/orders/ord_1006");
    expect(screen.getByText("Pune, Maharashtra 411001", { exact: false })).toBeInTheDocument();
  });
});

describe("admin B2B approvals", () => {
  it("approves a pending application after confirmation", async () => {
    renderAdmin("/admin/b2b-approvals");
    fireEvent.click(await screen.findByRole("button", { name: "Approve Vikram Security Services Pvt Ltd" }));
    const confirm = await screen.findByRole("alertdialog");
    expect(within(confirm).getByText(/29ABCDE1234F1Z5/)).toBeInTheDocument();
    fireEvent.click(within(confirm).getByRole("button", { name: "Approve" }));

    await waitFor(() => expect(profile("bp_vikram").status).toBe("APPROVED"));
    expect(profile("bp_vikram").reviewedBy).toEqual({ id: "usr_staff", name: "Sam Staff" });
    expect(getAdminCommerceDb().customers.find((c) => c.id === "usr_vikram")!.role).toBe("B2B_CUSTOMER");
    expect(await screen.findByText("No applications waiting for review.")).toBeInTheDocument();
  });

  it("requires a reason to reject", async () => {
    renderAdmin("/admin/b2b-approvals");
    fireEvent.click(await screen.findByRole("button", { name: "Reject Vikram Security Services Pvt Ltd" }));
    const dialog = await screen.findByRole("dialog");
    fireEvent.click(within(dialog).getByRole("button", { name: "Reject" }));
    expect(await within(dialog).findByText("Tell the customer why (at least 5 characters)")).toBeInTheDocument();
    expect(profile("bp_vikram").status).toBe("PENDING");

    type(within(dialog).getByLabelText("Reason"), "GSTIN does not match the legal name");
    fireEvent.click(within(dialog).getByRole("button", { name: "Reject" }));
    await waitFor(() => expect(profile("bp_vikram").status).toBe("REJECTED"));
    expect(profile("bp_vikram").rejectionReason).toBe("GSTIN does not match the legal name");

    fireEvent.mouseDown(screen.getByRole("tab", { name: "Rejected" }), { button: 0 });
    expect(await screen.findByText("GSTIN does not match the legal name")).toBeInTheDocument();
  });
});
