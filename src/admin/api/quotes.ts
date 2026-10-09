import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, toApiError, type ApiError } from "@/lib/api/client";
import { adminKeys } from "./keys";
import type { AdminQuote, AdminQuoteList, QuoteStatus, RejectQuoteInput, RespondQuoteInput } from "./types";

export interface AdminQuoteFilters {
  status?: QuoteStatus;
  /** Number, email, organization */
  q?: string;
  page?: number;
  limit?: number;
}

export function useAdminQuotes(filters: AdminQuoteFilters) {
  return useQuery<AdminQuoteList, ApiError>({
    queryKey: adminKeys.quoteList(filters),
    queryFn: async () => {
      const { data, error, response } = await api.GET("/api/v1/admin/quotes", { params: { query: filters } });
      if (error || !data) throw toApiError(error, response);
      return data;
    },
    placeholderData: keepPreviousData,
  });
}

export function useAdminQuote(id: string | undefined) {
  return useQuery<AdminQuote, ApiError>({
    queryKey: adminKeys.quote(id ?? ""),
    enabled: !!id,
    queryFn: async () => {
      const { data, error, response } = await api.GET("/api/v1/admin/quotes/{id}", { params: { path: { id: id! } } });
      if (error || !data) throw toApiError(error, response);
      return data;
    },
  });
}

type QuoteAction = { kind: "respond"; body: RespondQuoteInput } | { kind: "reject"; body: RejectQuoteInput };

/** Respond (price every line + validity) or decline. Both return the updated quote. */
export function useQuoteAction(id: string) {
  const qc = useQueryClient();
  return useMutation<AdminQuote, ApiError, QuoteAction>({
    mutationFn: async (action) => {
      const path = { params: { path: { id } } };
      const { data, error, response } =
        action.kind === "respond"
          ? await api.POST("/api/v1/admin/quotes/{id}/respond", { ...path, body: action.body })
          : await api.POST("/api/v1/admin/quotes/{id}/reject", { ...path, body: action.body });
      if (error || !data) throw toApiError(error, response);
      return data;
    },
    onSuccess: (quote) => {
      qc.setQueryData(adminKeys.quote(id), quote);
      qc.invalidateQueries({ queryKey: [...adminKeys.quotes, "list"] });
      qc.invalidateQueries({ queryKey: adminKeys.dashboard });
    },
  });
}
