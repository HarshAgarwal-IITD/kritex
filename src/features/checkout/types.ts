import type { paths } from "@/lib/api/schema";

type Body<T> = T extends { requestBody?: { content: { "application/json": infer B } } } ? B : never;

export type CheckoutQuoteRequest = Body<paths["/api/v1/checkout/quote"]["post"]>;
export type CheckoutQuote = paths["/api/v1/checkout/quote"]["post"]["responses"][200]["content"]["application/json"];
export type PlaceOrderInput = Body<paths["/api/v1/checkout"]["post"]>;
export type PlacedOrder = paths["/api/v1/checkout"]["post"]["responses"][201]["content"]["application/json"];
export type RazorpayOrder = NonNullable<PlacedOrder["razorpay"]>;
export type VerifyPaymentInput = Body<paths["/api/v1/checkout/verify"]["post"]>;
export type PaymentVerification = paths["/api/v1/checkout/verify"]["post"]["responses"][200]["content"]["application/json"];
export type PaymentMethod = PlaceOrderInput["paymentMethod"];
