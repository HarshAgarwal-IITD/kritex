import type { OrderStatus } from "./types";

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  PENDING_PAYMENT: "Payment pending",
  AWAITING_PAYMENT: "Awaiting payment",
  PAID: "Confirmed",
  PROCESSING: "Processing",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
  RETURN_REQUESTED: "Return requested",
  RETURNED: "Returned",
  REFUNDED: "Refunded",
};

/** Tone for the status chip. */
export const orderStatusTone = (s: OrderStatus): "ok" | "warn" | "bad" | "muted" =>
  s === "CANCELLED" ? "bad" : s === "PENDING_PAYMENT" || s === "AWAITING_PAYMENT" || s === "RETURN_REQUESTED" ? "warn" : s === "RETURNED" || s === "REFUNDED" ? "muted" : "ok";

const dateFmt = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" });
const dateTimeFmt = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" });

export const formatDate = (iso: string) => dateFmt.format(new Date(iso));
export const formatDateTime = (iso: string) => dateTimeFmt.format(new Date(iso));
