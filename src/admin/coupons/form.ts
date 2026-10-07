import { z } from "zod";
import type { Coupon, CreateCouponInput } from "../api/types";
import { formatPaise, normaliseRupees, paiseToRupees, RUPEES_PATTERN, rupeesToPaise } from "../lib/money";
import { isoToLocalInput, localInputToIso } from "../lib/format";

export const describeCouponValue = (c: Pick<Coupon, "type" | "value" | "maxDiscount">) =>
  c.type === "PERCENT"
    ? `${c.value}% off${c.maxDiscount != null ? ` (max ${formatPaise(c.maxDiscount)})` : ""}`
    : c.type === "FLAT"
      ? `${formatPaise(c.value)} off`
      : "Free shipping";

const CODE_PATTERN = /^[A-Z0-9_-]{3,32}$/;
const optionalRupees = z.string().refine((s) => s.trim() === "" || RUPEES_PATTERN.test(normaliseRupees(s)), "Enter an amount like 999 or 999.50");
const optionalCount = z.string().refine((s) => s.trim() === "" || (/^\d{1,7}$/.test(s.trim()) && Number(s) > 0), "Whole number above zero");

export const couponSchema = z
  .object({
    code: z.string().trim().regex(CODE_PATTERN, "3–32 characters: A–Z, 0–9, dash or underscore"),
    type: z.enum(["PERCENT", "FLAT", "FREE_SHIPPING"]),
    value: z.string(),
    minSubtotal: optionalRupees,
    maxDiscount: optionalRupees,
    startsAt: z.string(),
    endsAt: z.string(),
    usageLimit: optionalCount,
    perUserLimit: optionalCount,
    isActive: z.boolean(),
  })
  .superRefine((v, ctx) => {
    const value = v.value.trim();
    if (v.type === "PERCENT" && !(/^\d{1,3}$/.test(value) && Number(value) >= 1 && Number(value) <= 100)) {
      ctx.addIssue({ code: "custom", path: ["value"], message: "Whole percent from 1 to 100" });
    }
    if (v.type === "FLAT") {
      if (!RUPEES_PATTERN.test(normaliseRupees(value))) ctx.addIssue({ code: "custom", path: ["value"], message: "Enter an amount like 500 or 499.50" });
      else if ((rupeesToPaise(value) ?? 0) <= 0) ctx.addIssue({ code: "custom", path: ["value"], message: "Must be above zero" });
    }
    if (v.startsAt && v.endsAt && new Date(v.endsAt) <= new Date(v.startsAt)) {
      ctx.addIssue({ code: "custom", path: ["endsAt"], message: "Must be after the start" });
    }
    if (v.usageLimit.trim() && v.perUserLimit.trim() && Number(v.perUserLimit) > Number(v.usageLimit)) {
      ctx.addIssue({ code: "custom", path: ["perUserLimit"], message: "Can't exceed the total limit" });
    }
  });
export type CouponValues = z.infer<typeof couponSchema>;

export const couponToValues = (c?: Coupon): CouponValues => ({
  code: c?.code ?? "",
  type: c?.type ?? "PERCENT",
  value: !c ? "" : c.type === "FLAT" ? paiseToRupees(c.value) : c.type === "PERCENT" ? String(c.value) : "",
  minSubtotal: paiseToRupees(c?.minSubtotal),
  maxDiscount: paiseToRupees(c?.maxDiscount),
  startsAt: isoToLocalInput(c?.startsAt),
  endsAt: isoToLocalInput(c?.endsAt),
  usageLimit: c?.usageLimit != null ? String(c.usageLimit) : "",
  perUserLimit: c?.perUserLimit != null ? String(c.perUserLimit) : "",
  isActive: c?.isActive ?? true,
});

/** Form values -> request body. Rupee inputs become integer paise; percent stays a whole number. */
export function toCouponPayload(v: CouponValues): CreateCouponInput {
  const count = (s: string) => (s.trim() ? Number(s) : null);
  return {
    code: v.code.trim().toUpperCase(),
    type: v.type,
    value: v.type === "PERCENT" ? Number(v.value) : v.type === "FLAT" ? (rupeesToPaise(v.value) ?? 0) : 0,
    minSubtotal: rupeesToPaise(v.minSubtotal),
    maxDiscount: v.type === "PERCENT" ? rupeesToPaise(v.maxDiscount) : null,
    startsAt: localInputToIso(v.startsAt),
    endsAt: localInputToIso(v.endsAt),
    usageLimit: count(v.usageLimit),
    perUserLimit: count(v.perUserLimit),
    isActive: v.isActive,
  };
}

