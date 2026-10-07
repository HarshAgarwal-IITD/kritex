import { beforeEach, describe, expect, it } from "vitest";
import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { getAdminMockDb, resetAdminMockDb, setMockSession } from "@/mocks/admin-handlers";
import { getAdminCommerceDb } from "@/mocks/admin-commerce";
import { api } from "@/lib/api/client";
import { chooseOption, renderAdmin, stubPointerApis } from "./render";

beforeEach(() => {
  resetAdminMockDb();
  stubPointerApis();
  setMockSession("staff@kritex.in");
});

const type = (el: HTMLElement, value: string) => fireEvent.change(el, { target: { value } });

describe("admin dashboard", () => {
  it("is the /admin landing page with revenue, status counts and low stock", async () => {
    const shirt = getAdminMockDb().products.find((p) => p.id === "prd_shirt")!;
    shirt.variants[0] = { ...shirt.variants[0], stock: 2, available: 2 };

    renderAdmin("/admin");
    expect(await screen.findByRole("group", { name: "Revenue today: ₹7,197.00" })).toBeInTheDocument();
    // Paid in the last 7 days: KTX-100006 (7197) + KTX-100004 (1299 - 129.90).
    expect(screen.getByRole("group", { name: "Revenue, last 7 days: ₹8,366.10" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Orders today: 2" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Awaiting payment: 1" })).toHaveAttribute("href", "/admin/orders?status=AWAITING_PAYMENT");
    expect(screen.getByRole("link", { name: "B2B applications: 1" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "New enquiries: 1" })).toBeInTheDocument();

    const byStatus = screen.getByRole("region", { name: "Orders by status" });
    expect(within(byStatus).getByRole("link", { name: "Refunded" })).toBeInTheDocument();
    expect(within(byStatus).getByRole("link", { name: "Shipped" }).closest("tr")).toHaveTextContent("1");

    const low = screen.getByRole("region", { name: "Low stock" });
    expect(within(low).getByText("KTX-CPT-1", { exact: false })).toBeInTheDocument();
    expect(within(low).getByText("2")).toBeInTheDocument();
  });
});

describe("admin inventory", () => {
  it("filters low stock by threshold and adjusts stock with a reason", async () => {
    renderAdmin("/admin/inventory");
    expect(await screen.findByText("4 variants · page 1 of 1")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("switch", { name: "Low stock only" }));
    expect(await screen.findByText("Nothing is at or below the threshold.")).toBeInTheDocument();
    type(screen.getByLabelText("Threshold"), "10");
    expect(await screen.findByText("4 variants · page 1 of 1")).toBeInTheDocument();
    expect(screen.getByTestId("location")).toHaveTextContent("low=1");
    expect(screen.getByTestId("location")).toHaveTextContent("threshold=10");

    fireEvent.click(screen.getByRole("button", { name: "Adjust stock for KTX-CPT-1" }));
    const dialog = await screen.findByRole("dialog");
    type(within(dialog).getByLabelText("Change"), "0");
    fireEvent.click(within(dialog).getByRole("button", { name: "Save" }));
    expect(await within(dialog).findByText("Must not be zero")).toBeInTheDocument();

    type(within(dialog).getByLabelText("Change"), "-3");
    expect(within(dialog).getByText("New stock: 7")).toBeInTheDocument();
    await chooseOption(within(dialog).getByRole("combobox", { name: "Reason" }), "Adjustment");
    type(within(dialog).getByLabelText("Note (optional)"), "Damaged in storage");
    fireEvent.click(within(dialog).getByRole("button", { name: "Save" }));

    await waitFor(() => expect(getAdminMockDb().products[0].variants.find((v) => v.sku === "KTX-CPT-1")!.stock).toBe(7));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });
});

describe("admin enquiries", () => {
  it("lists new enquiries and updates their status", async () => {
    renderAdmin("/admin/enquiries");
    const item = await screen.findByRole("listitem", { name: "Enquiry from Maj. R. Sharma" });
    expect(within(item).getByText(/400 pairs of desert assault boots/)).toBeInTheDocument();

    await chooseOption(within(item).getByRole("combobox", { name: "Status for Maj. R. Sharma" }), "In progress");
    await waitFor(() => expect(getAdminCommerceDb().queries.find((q) => q.id === "qry_tender")!.status).toBe("IN_PROGRESS"));
    expect(await screen.findByText("No enquiries here.")).toBeInTheDocument();

    fireEvent.mouseDown(screen.getByRole("tab", { name: "In progress (2)" }), { button: 0 });
    expect(await screen.findByRole("listitem", { name: "Enquiry from Maj. R. Sharma" })).toBeInTheDocument();
  });

  it("GET /queries needs a staff session, not an API key (TD-20)", async () => {
    setMockSession(null);
    const anon = await api.GET("/api/v1/queries");
    expect(anon.response.status).toBe(401);

    setMockSession("customer@example.com");
    expect((await api.GET("/api/v1/queries")).response.status).toBe(403);

    setMockSession("staff@kritex.in");
    const staff = await api.GET("/api/v1/queries");
    expect(staff.response.status).toBe(200);
    expect(staff.data?.map((q) => q.id)).toEqual(["qry_tender", "qry_sizes", "qry_bulk"]);
  });
});
