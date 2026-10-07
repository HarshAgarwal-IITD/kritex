import type { paths } from "@/lib/api/schema";

// Types come from paths (not component names), so they survive server-side DTO renames.
type Ok<T> = T extends { responses: { 200: { content: { "application/json": infer R } } } } ? R : never;

export type Cart = Ok<paths["/api/v1/cart"]["get"]>;
export type CartLine = Cart["items"][number];
export type CartIssue = NonNullable<CartLine["issue"]>;
export type Totals = Cart["totals"];

/**
 * Applied coupon. The finished server adds `valid`, `invalidReason` and `message` (a stored coupon can stop
 * applying, e.g. expired); they're optional here until `npm run api:gen` picks them up. Some server builds name
 * the field `appliedCoupon`, so read it through `appliedCoupon(cart)`.
 */
export type AppliedCoupon = NonNullable<Cart["coupon"]> & {
  valid?: boolean;
  invalidReason?: string | null;
  message?: string | null;
};

export function appliedCoupon(cart: Cart): AppliedCoupon | null {
  const c = cart as Cart & { appliedCoupon?: AppliedCoupon | null };
  return (c.coupon ?? c.appliedCoupon ?? null) as AppliedCoupon | null;
}
