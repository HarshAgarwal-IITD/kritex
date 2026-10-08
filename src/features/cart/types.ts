import type { paths } from "@/lib/api/schema";

// Types come from paths (not component names), so they survive server-side DTO renames.
type Ok<T> = T extends { responses: { 200: { content: { "application/json": infer R } } } } ? R : never;

export type Cart = Ok<paths["/api/v1/cart"]["get"]>;
export type CartLine = Cart["items"][number];
export type CartIssue = NonNullable<CartLine["issue"]>;
export type Totals = Cart["totals"];

/** Coupon stored on the cart. `valid: false` (+ `invalidReason`/`message`) when it no longer applies. */
export type AppliedCoupon = NonNullable<Cart["coupon"]>;

export const appliedCoupon = (cart: Cart): AppliedCoupon | null => cart.coupon ?? null;
