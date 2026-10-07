import { ApiError } from "@/lib/api/client";
import { formatPaise } from "@/features/catalog/format";
import type { CartIssue, CartLine } from "./types";

/** Customer-facing text for a cart line's `issue`. */
export function issueMessage(line: Pick<CartLine, "issue">): string | null {
  switch (line.issue as CartIssue | null) {
    case "OUT_OF_STOCK":
      return "Out of stock. Remove it to continue.";
    case "INSUFFICIENT_STOCK":
      return "Only a few left. Reduce the quantity to continue.";
    case "UNAVAILABLE":
      return "No longer available. Remove it to continue.";
    case "NOT_PURCHASABLE":
      return "Can't be bought online. Remove it and send us an enquiry instead.";
    default:
      return null;
  }
}

/** Friendly text for the 422 `COUPON_*` codes from `POST /cart/coupon` (and checkout). */
export function couponErrorMessage(err: unknown): string {
  if (!(err instanceof ApiError)) return "Couldn't apply this code. Please try again.";
  switch (err.code) {
    case "COUPON_INVALID":
      return "This code isn't valid.";
    case "COUPON_EXPIRED":
      return "This code has expired.";
    case "COUPON_USAGE_LIMIT":
      return "This code has reached its usage limit.";
    case "COUPON_MIN_SUBTOTAL":
    case "COUPON_MIN_SUBTOTAL_NOT_MET": {
      const d = (err.details ?? {}) as { minSubtotal?: unknown; shortBy?: unknown };
      if (typeof d.shortBy === "number" && d.shortBy > 0) return `Add ${formatPaise(d.shortBy)} more to use this code.`;
      return typeof d.minSubtotal === "number"
        ? `Add items worth ${formatPaise(d.minSubtotal)} or more to use this code.`
        : "Your cart total is below the minimum for this code.";
    }
    case "COUPON_LOGIN_REQUIRED":
      return "Log in to use this code.";
    case "COUPON_NOT_STARTED":
      return "This code isn't active yet.";
    case "VALIDATION_ERROR":
      return "Enter a valid code.";
    case "TOO_MANY_REQUESTS":
      return "Too many attempts. Please wait a minute and try again.";
    default:
      return err.message || "Couldn't apply this code.";
  }
}

/** Text for errors from adding/updating cart lines. */
export function cartMutationMessage(err: unknown): string {
  if (!(err instanceof ApiError)) return "Something went wrong. Please try again.";
  switch (err.code) {
    case "INSUFFICIENT_STOCK": {
      const available = (err.details as { available?: unknown } | undefined)?.available;
      return typeof available === "number"
        ? available > 0
          ? `Only ${available} available.`
          : "This option is out of stock."
        : "Not enough stock for that quantity.";
    }
    case "QUANTITY_LIMIT_EXCEEDED":
      return "You can order up to 999 of an item online. Send an enquiry for larger quantities.";
    case "OUT_OF_STOCK":
      return "This option is out of stock.";
    case "NOT_PURCHASABLE":
      return "This product can't be bought online.";
    case "NOT_FOUND":
      return "This item is no longer available.";
    case "NETWORK_ERROR":
      return "Network error. Check your connection and try again.";
    default:
      return err.message || "Something went wrong. Please try again.";
  }
}

/** Reason text for a stored coupon that no longer applies (server sends `valid: false` + `invalidReason`/`message`). */
export function invalidCouponMessage(coupon: { invalidReason?: string | null; message?: string | null }): string {
  if (coupon.message) return coupon.message;
  switch (coupon.invalidReason) {
    case "COUPON_EXPIRED":
      return "This code has expired.";
    case "COUPON_USAGE_LIMIT":
      return "This code has reached its usage limit.";
    case "COUPON_MIN_SUBTOTAL":
    case "COUPON_MIN_SUBTOTAL_NOT_MET":
      return "Your cart total is below the minimum for this code.";
    case "COUPON_LOGIN_REQUIRED":
      return "Log in to use this code.";
    default:
      return "This code no longer applies to your cart.";
  }
}
