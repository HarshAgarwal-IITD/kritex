import type { paths } from "@/lib/api/schema";

type Ok<T, C extends number = 200> = T extends { responses: { [K in C]: { content: { "application/json": infer R } } } } ? R : never;
type Body<T> = T extends { requestBody?: { content: { "application/json": infer B } } } ? B : never;

export type CreateQuoteInput = Body<paths["/api/v1/quotes"]["post"]>;
export type CreatedQuote = Ok<paths["/api/v1/quotes"]["post"], 201>;
export type QuoteList = Ok<paths["/api/v1/me/quotes"]["get"]>;
export type QuoteSummary = QuoteList["items"][number];
export type QuoteDetail = Ok<paths["/api/v1/me/quotes/{number}"]["get"]>;
export type QuoteItem = QuoteDetail["items"][number];
export type QuoteStatus = QuoteDetail["status"];
export type AcceptQuoteInput = Body<paths["/api/v1/me/quotes/{number}/accept"]["post"]>;
export type OrderTracking = Ok<paths["/api/v1/orders/{number}/tracking"]["get"]>;
export type TrackedShipment = OrderTracking["shipments"][number];
export type ShipmentStatus = TrackedShipment["status"];

/** One line of the client-side quote cart (before the RFQ is sent). */
export interface QuoteCartLine {
  productId: string;
  productSlug: string;
  productName: string;
  image: string | null;
  /** Set when the visitor picked every option; otherwise the RFQ quotes the product generally. */
  variantId?: string;
  variantTitle?: string;
  sku?: string;
  quantity: number;
  notes?: string;
}
