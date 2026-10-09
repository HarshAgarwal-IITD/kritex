import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, toApiError, type ApiError } from "@/lib/api/client";
import type { PlacedOrder } from "@/features/checkout/types";
import type { AcceptQuoteInput, CreatedQuote, CreateQuoteInput, OrderTracking, QuoteDetail, QuoteList, QuoteStatus } from "./types";

export const quoteKeys = {
  mine: ["me", "quotes"] as const,
  list: (page: number, status?: QuoteStatus) => ["me", "quotes", "list", page, status ?? null] as const,
  detail: (number: string) => ["me", "quotes", "detail", number] as const,
  tracking: (number: string, email: string) => ["tracking", number, email] as const,
};

/** Sends the RFQ (`POST /quotes`, public). */
export function useCreateQuote() {
  const qc = useQueryClient();
  return useMutation<CreatedQuote, ApiError, CreateQuoteInput>({
    mutationFn: async (body) => {
      const { data, error, response } = await api.POST("/api/v1/quotes", { body });
      if (error || !data) throw toApiError(error, response);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: quoteKeys.mine }),
  });
}

export function useMyQuotes(page = 1, status?: QuoteStatus) {
  return useQuery<QuoteList, ApiError>({
    queryKey: quoteKeys.list(page, status),
    placeholderData: keepPreviousData,
    queryFn: async ({ signal }) => {
      const { data, error, response } = await api.GET("/api/v1/me/quotes", {
        params: { query: { page, limit: 20, ...(status ? { status } : {}) } },
        signal,
      });
      if (error || !data) throw toApiError(error, response);
      return data;
    },
  });
}

export function useMyQuote(number: string) {
  return useQuery<QuoteDetail, ApiError>({
    queryKey: quoteKeys.detail(number),
    retry: (count, err) => err.status >= 500 && count < 2,
    queryFn: async ({ signal }) => {
      const { data, error, response } = await api.GET("/api/v1/me/quotes/{number}", { params: { path: { number } }, signal });
      if (error || !data) throw toApiError(error, response);
      return data;
    },
  });
}

/** Accepts a quote: creates the order. The caller owns the Idempotency-Key (same semantics as POST /checkout). */
export function useAcceptQuote(number: string) {
  const qc = useQueryClient();
  return useMutation<PlacedOrder, ApiError, { body: AcceptQuoteInput; idempotencyKey: string }>({
    mutationFn: async ({ body, idempotencyKey }) => {
      const { data, error, response } = await api.POST("/api/v1/me/quotes/{number}/accept", {
        params: { path: { number }, header: { "Idempotency-Key": idempotencyKey } },
        body,
      });
      if (error || !data) throw toApiError(error, response);
      return data;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: quoteKeys.mine });
      void qc.invalidateQueries({ queryKey: ["me", "orders"] });
    },
  });
}

/** Public order tracking (`GET /orders/:number/tracking?email=`). Disabled until both are known. */
export function useOrderTracking(number: string, email: string | null) {
  return useQuery<OrderTracking, ApiError>({
    queryKey: quoteKeys.tracking(number, email ?? ""),
    enabled: !!number && !!email,
    retry: (count, err) => err.status >= 500 && count < 2,
    queryFn: async ({ signal }) => {
      const { data, error, response } = await api.GET("/api/v1/orders/{number}/tracking", {
        params: { path: { number }, query: { email: email! } },
        signal,
      });
      if (error || !data) throw toApiError(error, response);
      return data;
    },
  });
}

export function quoteErrorMessage(err: ApiError): string {
  switch (err.code) {
    case "QUOTE_NOT_ACCEPTABLE":
      return "This quote can no longer be accepted (it may have expired). Contact us for a fresh quote.";
    case "OUT_OF_STOCK":
      return "Some quoted items are out of stock right now. Contact us and we'll sort it out.";
    case "PAYMENT_METHOD_NOT_ALLOWED":
      return "Bank transfer is only available to approved business accounts.";
    case "IDEMPOTENCY_KEY_REUSED":
      return "This attempt was already used. Please try again.";
    case "TOO_MANY_REQUESTS":
      return "Too many attempts. Please wait a minute and try again.";
    case "NOT_FOUND":
      return "One of the products is no longer available. Remove it and try again.";
    case "NETWORK_ERROR":
      return "Network error. Check your connection and try again.";
    default:
      return err.message || "Something went wrong. Please try again.";
  }
}

/** One Idempotency-Key per attempt. */
export const newIdempotencyKey = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
