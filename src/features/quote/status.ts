import type { QuoteStatus, ShipmentStatus } from "./types";

export const QUOTE_STATUS_LABEL: Record<QuoteStatus, string> = {
  REQUESTED: "Requested",
  QUOTED: "Quote ready",
  ACCEPTED: "Accepted",
  EXPIRED: "Expired",
  REJECTED: "Declined",
  CONVERTED: "Ordered",
};

export const quoteStatusTone = (s: QuoteStatus): "ok" | "warn" | "bad" | "muted" =>
  s === "QUOTED" ? "warn" : s === "REJECTED" ? "bad" : s === "EXPIRED" ? "muted" : "ok";

export const SHIPMENT_STATUS_LABEL: Record<ShipmentStatus, string> = {
  PENDING: "Preparing",
  READY_TO_SHIP: "Ready to ship",
  SHIPPED: "Shipped",
  IN_TRANSIT: "In transit",
  OUT_FOR_DELIVERY: "Out for delivery",
  DELIVERED: "Delivered",
  RTO: "Returning to sender",
  CANCELLED: "Cancelled",
};

/** A QUOTED quote whose validity date has passed (the server's expiry cron may not have run yet). */
export const isQuoteExpired = (q: { status: QuoteStatus; validUntil: string | null }, now = Date.now()) =>
  q.status === "EXPIRED" || (q.status === "QUOTED" && !!q.validUntil && new Date(q.validUntil).getTime() < now);
