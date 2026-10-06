import { beforeEach, describe, expect, it } from "vitest";
import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { getAdminMockDb, resetAdminMockDb, setMockSession } from "@/mocks/admin-handlers";
import { renderAdmin, stubPointerApis } from "./render";

beforeEach(() => {
  resetAdminMockDb();
  stubPointerApis();
  setMockSession("staff@kritex.in");
});

const type = (el: HTMLElement, value: string) => fireEvent.change(el, { target: { value } });

describe("admin categories", () => {
  it("creates, edits and deletes an empty category", async () => {
    renderAdmin("/admin/categories");
    expect(await screen.findByText("Tactical Footwear")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "New category" }));
    const dialog = await screen.findByRole("dialog");
    type(within(dialog).getByLabelText("Name"), "Eyewear & Optics");
    expect(within(dialog).getByLabelText("Slug")).toHaveValue("eyewear-optics");
    expect(within(dialog).getByLabelText("Sort order")).toHaveValue("3");
    fireEvent.click(within(dialog).getByRole("button", { name: "Create" }));

    expect(await screen.findByText("Eyewear & Optics")).toBeInTheDocument();
    const created = getAdminMockDb().categories.find((c) => c.slug === "eyewear-optics")!;
    expect(created).toMatchObject({ name: "Eyewear & Optics", sortOrder: 3, isActive: true, description: null });

    fireEvent.click(screen.getByRole("button", { name: "Edit Eyewear & Optics" }));
    const editDialog = await screen.findByRole("dialog");
    expect(within(editDialog).getByLabelText("Slug")).toHaveValue("eyewear-optics");
    type(within(editDialog).getByLabelText("Name"), "Optics");
    expect(within(editDialog).getByLabelText("Slug")).toHaveValue("eyewear-optics"); // slug is not regenerated on edit
    fireEvent.click(within(editDialog).getByRole("switch"));
    fireEvent.click(within(editDialog).getByRole("button", { name: "Save" }));
    await waitFor(() => expect(getAdminMockDb().categories.find((c) => c.id === created.id)).toMatchObject({ name: "Optics", isActive: false }));

    fireEvent.click(await screen.findByRole("button", { name: "Delete Optics" }));
    fireEvent.click(within(await screen.findByRole("alertdialog")).getByRole("button", { name: "Delete" }));
    await waitFor(() => expect(screen.queryByText("Optics")).not.toBeInTheDocument());
    expect(getAdminMockDb().categories.some((c) => c.id === created.id)).toBe(false);
  });

  it("shows a slug conflict on the field", async () => {
    renderAdmin("/admin/categories");
    fireEvent.click(await screen.findByRole("button", { name: "New category" }));
    const dialog = await screen.findByRole("dialog");
    type(within(dialog).getByLabelText("Name"), "Load Bearing");
    fireEvent.click(within(dialog).getByRole("button", { name: "Create" }));
    expect(await within(dialog).findByText('Slug "load-bearing" is already used')).toBeInTheDocument();
  });

  it("warns before deleting a category that has products", async () => {
    renderAdmin("/admin/categories");
    fireEvent.click(await screen.findByRole("button", { name: "Delete Combat Apparel" }));
    expect(await screen.findByText(/This category has 1 product\./)).toBeInTheDocument();
  });
});
