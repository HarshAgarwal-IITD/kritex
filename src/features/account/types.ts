import type { paths } from "@/lib/api/schema";

type Ok<T, C extends number = 200> = T extends { responses: { [K in C]: { content: { "application/json": infer R } } } } ? R : never;
type Body<T> = T extends { requestBody?: { content: { "application/json": infer B } } } ? B : never;

export type Me = Ok<paths["/api/v1/me"]["get"]>;
export type BusinessProfile = NonNullable<Me["businessProfile"]>;
export type UpdateMeInput = Body<paths["/api/v1/me"]["patch"]>;

export type SavedAddress = Ok<paths["/api/v1/me/addresses"]["get"]>["items"][number];
export type CreateAddressInput = Body<paths["/api/v1/me/addresses"]["post"]>;
export type UpdateAddressInput = Body<paths["/api/v1/me/addresses/{id}"]["patch"]>;

export type OrderList = Ok<paths["/api/v1/me/orders"]["get"]>;
export type OrderSummary = OrderList["items"][number];
export type OrderStatus = OrderSummary["status"];
export type OrderDetail = Ok<paths["/api/v1/me/orders/{number}"]["get"]>;
export type ReturnRequestInput = Body<paths["/api/v1/me/orders/{number}/return"]["post"]>;
export type InvoiceLink = Ok<paths["/api/v1/orders/{number}/invoice"]["get"]>;
export type ApplyBusinessProfileInput = Body<paths["/api/v1/me/business-profile"]["post"]>;
