import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, toApiError, type ApiError } from "@/lib/api/client";
import { cartKeys } from "@/features/cart/hooks";
import type { CheckoutQuote, CheckoutQuoteRequest, PaymentVerification, PlacedOrder, PlaceOrderInput, VerifyPaymentInput } from "./types";

export const checkoutKeys = {
  quote: (input: CheckoutQuoteRequest | null) => ["checkout", "quote", input] as const,
};

/** Final totals (tax split by address, GSTIN). `POST` but side-effect free, so it's a query keyed by its input. */
export function useCheckoutQuote(input: CheckoutQuoteRequest | null) {
  return useQuery<CheckoutQuote, ApiError>({
    queryKey: checkoutKeys.quote(input),
    enabled: !!input,
    placeholderData: keepPreviousData,
    retry: (count, err) => err.status >= 500 && count < 2,
    queryFn: async ({ signal }) => {
      const { data, error, response } = await api.POST("/api/v1/checkout/quote", { body: input!, signal });
      if (error || !data) throw toApiError(error, response);
      return data;
    },
  });
}

/** Creates the order. The caller owns the Idempotency-Key (one per attempt; reuse it when retrying the same attempt). */
export function usePlaceOrder() {
  const qc = useQueryClient();
  return useMutation<PlacedOrder, ApiError, { body: PlaceOrderInput; idempotencyKey: string }>({
    mutationFn: async ({ body, idempotencyKey }) => {
      const { data, error, response } = await api.POST("/api/v1/checkout", {
        body,
        params: { header: { "Idempotency-Key": idempotencyKey } },
      });
      if (error || !data) throw toApiError(error, response);
      return data;
    },
    // Stock is reserved and the cart is converted into the order.
    onSuccess: () => qc.invalidateQueries({ queryKey: cartKeys.cart }),
  });
}

export async function verifyPayment(body: VerifyPaymentInput): Promise<PaymentVerification> {
  const { data, error, response } = await api.POST("/api/v1/checkout/verify", { body });
  if (error || !data) throw toApiError(error, response);
  return data;
}

/** Messages for checkout errors (`POST /checkout` and `/checkout/quote`). */
export function checkoutErrorMessage(err: ApiError): string {
  switch (err.code) {
    case "CART_EMPTY":
      return "Your cart is empty.";
    case "CART_HAS_ISSUES":
      return "Some items in your cart are no longer available in the quantity you chose. Review your cart to continue.";
    case "OUT_OF_STOCK":
      return "Sorry, an item just went out of stock. Review your cart to continue.";
    case "PRICE_CHANGED":
      return "Prices changed since you reviewed your order. Check the new total and place the order again.";
    case "INVALID_GSTIN":
      return "That GSTIN isn't valid. Check it and try again.";
    case "GSTIN_STATE_MISMATCH":
      return "The GSTIN's state code doesn't match the billing address state.";
    case "PAYMENT_METHOD_NOT_ALLOWED":
      return "This payment method isn't available for your account.";
    case "IDEMPOTENCY_KEY_REUSED":
      return "This order attempt was already used. Please try again.";
    case "TOO_MANY_REQUESTS":
      return "Too many attempts. Please wait a minute and try again.";
    case "NETWORK_ERROR":
      return "Network error. Check your connection and try again.";
    default:
      if (err.code.startsWith("COUPON_")) return "Your coupon can no longer be applied. Remove it from your cart and try again.";
      return err.message || "Something went wrong. Please try again.";
  }
}

/** New payment attempt for one of my unpaid orders (`POST /me/orders/:number/pay`). */
export async function payMyOrder(orderNumber: string): Promise<PlacedOrder> {
  const { data, error, response } = await api.POST("/api/v1/me/orders/{number}/pay", {
    params: { path: { number: orderNumber } },
  });
  if (error || !data) throw toApiError(error, response);
  return data;
}
