import { beforeEach, describe, expect, it } from "vitest";
import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { resetAdminMockDb, setMockSession } from "@/mocks/admin-handlers";
import { getAdminCommerceDb } from "@/mocks/admin-commerce";
import { couponSchema, toCouponPayload, type CouponValues } from "../coupons/form";
import { chooseOption, renderAdmin, stubPointerApis } from "./render";

beforeEach(() => {
  resetAdminMockDb();
  stubPointerApis();
  setMockSession("admin@kritex.in");
});

const type = (el: HTMLElement, value: string) => fireEvent.change(el, { target: { value } });
const coupon = (code: string) => getAdminCommerceDb().coupons.find((c) => c.code === code);

const base: CouponValues = {
  code: "SAVE10",
  type: "PERCENT",
  value: "10",
  minSubtotal: "",
  maxDiscount: "",
  startsAt: "",
  endsAt: "",
  usageLimit: "",
  perUserLimit: "",
  isActive: true,
};
const issues = (v: Partial<CouponValues>) => {
  const r = couponSchema.safeParse({ ...base, ...v });
  return r.success ? {} : Object.fromEntries(r.error.issues.map((i) => [i.path.join("."), i.message]));
};

describe("coupon form schema", () => {
  it("validates per type", () => {
    expect(issues({})).toEqual({});
    expect(issues({ value: "0" })).toEqual({ value: "Whole percent from 1 to 100" });
    expect(issues({ value: "101" })).toEqual({ value: "Whole percent from 1 to 100" });
    expect(issues({ value: "12.5" })).toEqual({ value: "Whole percent from 1 to 100" });
    expect(issues({ type: "FLAT", value: "abc" })).toEqual({ value: "Enter an amount like 500 or 499.50" });
    expect(issues({ type: "FLAT", value: "0" })).toEqual({ value: "Must be above zero" });
    expect(issues({ type: "FREE_SHIPPING", value: "" })).toEqual({});
    expect(issues({ code: "ab" })).toHaveProperty("code");
    expect(issues({ code: "HAS SPACE" })).toHaveProperty("code");
    expect(issues({ startsAt: "2026-10-10T10:00", endsAt: "2026-10-09T10:00" })).toEqual({ endsAt: "Must be after the start" });
    expect(issues({ usageLimit: "5", perUserLimit: "6" })).toEqual({ perUserLimit: "Can't exceed the total limit" });
    expect(issues({ usageLimit: "0" })).toEqual({ usageLimit: "Whole number above zero" });
  });

  it("converts rupees to exact paise and drops the cap for non-percent coupons", () => {
    expect(toCouponPayload({ ...base, type: "FLAT", value: "499.50", minSubtotal: "1,999.99", maxDiscount: "100" })).toMatchObject({
      type: "FLAT",
      value: 49950,
      minSubtotal: 199999,
      maxDiscount: null,
    });
    expect(toCouponPayload({ ...base, value: "15", maxDiscount: "250.05" })).toMatchObject({ value: 15, maxDiscount: 25005, minSubtotal: null });
    expect(toCouponPayload({ ...base, type: "FREE_SHIPPING", value: "" })).toMatchObject({ value: 0 });
  });
});

describe("admin coupons", () => {
  it("lists coupons", async () => {
    renderAdmin("/admin/coupons");
    expect(await screen.findByText("WELCOME10")).toBeInTheDocument();
    expect(screen.getByText("10% off (max ₹500.00)")).toBeInTheDocument();
    expect(screen.getByText("₹500.00 off")).toBeInTheDocument();
    expect(screen.getByText("Free shipping")).toBeInTheDocument();
  });

  it("shows validation errors, then creates a flat coupon in paise", async () => {
    renderAdmin("/admin/coupons");
    fireEvent.click(await screen.findByRole("button", { name: "New coupon" }));
    const dialog = await screen.findByRole("dialog");
    type(within(dialog).getByLabelText("Code"), "x");
    type(within(dialog).getByLabelText("Percent off"), "150");
    fireEvent.click(within(dialog).getByRole("button", { name: "Create" }));
    expect(await within(dialog).findByText("3–32 characters: A–Z, 0–9, dash or underscore")).toBeInTheDocument();
    expect(within(dialog).getByText("Whole percent from 1 to 100")).toBeInTheDocument();
    expect(within(dialog).getByLabelText("Maximum discount (₹)")).toBeInTheDocument();

    type(within(dialog).getByLabelText("Code"), "diwali-250");
    expect(within(dialog).getByLabelText("Code")).toHaveValue("DIWALI-250");
    await chooseOption(within(dialog).getByRole("combobox", { name: "Type" }), "Flat amount off");
    expect(within(dialog).queryByLabelText("Maximum discount (₹)")).not.toBeInTheDocument();
    type(within(dialog).getByLabelText("Amount off (₹)"), "249.99");
    type(within(dialog).getByLabelText("Minimum subtotal (₹)"), "1999");
    type(within(dialog).getByLabelText("Total uses"), "100");
    fireEvent.click(within(dialog).getByRole("button", { name: "Create" }));

    await waitFor(() => expect(coupon("DIWALI-250")).toBeDefined());
    expect(coupon("DIWALI-250")).toMatchObject({ type: "FLAT", value: 24999, minSubtotal: 199900, maxDiscount: null, usageLimit: 100, isActive: true });
    expect(await screen.findByText("₹249.99 off")).toBeInTheDocument();
  });

  it("shows a taken code on the field", async () => {
    renderAdmin("/admin/coupons");
    fireEvent.click(await screen.findByRole("button", { name: "New coupon" }));
    const dialog = await screen.findByRole("dialog");
    type(within(dialog).getByLabelText("Code"), "FLAT500");
    type(within(dialog).getByLabelText("Percent off"), "5");
    fireEvent.click(within(dialog).getByRole("button", { name: "Create" }));
    expect(await within(dialog).findByText("Code FLAT500 is already used")).toBeInTheDocument();
  });

  it("edits, toggles and deletes", async () => {
    renderAdmin("/admin/coupons");
    fireEvent.click(await screen.findByRole("button", { name: "Edit WELCOME10" }));
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByLabelText("Minimum subtotal (₹)")).toHaveValue("999");
    type(within(dialog).getByLabelText("Percent off"), "12");
    fireEvent.click(within(dialog).getByRole("button", { name: "Save" }));
    await waitFor(() => expect(coupon("WELCOME10")!.value).toBe(12));
    expect(coupon("WELCOME10")!.maxDiscount).toBe(50000);

    fireEvent.click(await screen.findByRole("switch", { name: "FREESHIP active" }));
    await waitFor(() => expect(coupon("FREESHIP")!.isActive).toBe(true));

    fireEvent.click(screen.getByRole("button", { name: "Delete FLAT500" }));
    fireEvent.click(within(await screen.findByRole("alertdialog")).getByRole("button", { name: "Delete" }));
    await waitFor(() => expect(coupon("FLAT500")).toBeUndefined());

    // A used coupon is deactivated instead.
    fireEvent.click(await screen.findByRole("button", { name: "Delete WELCOME10" }));
    fireEvent.click(within(await screen.findByRole("alertdialog")).getByRole("button", { name: "Deactivate" }));
    await waitFor(() => expect(coupon("WELCOME10")!.isActive).toBe(false));
  });
});
