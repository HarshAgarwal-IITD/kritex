import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, toApiError, type ApiError } from "@/lib/api/client";
import { adminKeys } from "./keys";
import type {
  AddOrderNoteInput,
  AdminOrder,
  AdminOrderList,
  CancelOrderInput,
  MarkOrderPaidInput,
  OrderStatus,
  PaymentMethod,
  RefundOrderInput,
  UpdateOrderStatusInput,
} from "./types";

export interface AdminOrderFilters {
  status?: OrderStatus;
  paymentMethod?: PaymentMethod;
  /** Order number, email, phone or customer name */
  q?: string;
  /** ISO datetime, createdAt >= from */
  from?: string;
  /** ISO datetime, createdAt < to */
  to?: string;
  sort?: "newest" | "oldest" | "total_desc";
  page?: number;
  limit?: number;
}

export function useAdminOrders(filters: AdminOrderFilters) {
  return useQuery<AdminOrderList, ApiError>({
    queryKey: adminKeys.orderList(filters),
    queryFn: async () => {
      const { data, error, response } = await api.GET("/api/v1/admin/orders", { params: { query: filters } });
      if (error || !data) throw toApiError(error, response);
      return data;
    },
    placeholderData: keepPreviousData,
  });
}

export function useAdminOrder(id: string | undefined) {
  return useQuery<AdminOrder, ApiError>({
    queryKey: adminKeys.order(id ?? ""),
    enabled: !!id,
    queryFn: async () => {
      const { data, error, response } = await api.GET("/api/v1/admin/orders/{id}", { params: { path: { id: id! } } });
      if (error || !data) throw toApiError(error, response);
      return data;
    },
  });
}

/** Downloads `GET /admin/orders/export.csv` for the list filters (pagination is ignored by the server). */
export function useExportOrders() {
  return useMutation<Blob, ApiError, AdminOrderFilters>({
    mutationFn: async ({ page: _page, limit: _limit, sort: _sort, ...filters }) => {
      const { data, error, response } = await api.GET("/api/v1/admin/orders/export.csv", {
        params: { query: filters },
        parseAs: "blob",
      });
      if (error || !data) throw toApiError(error, response);
      return data;
    },
  });
}

type OrderAction =
  | { kind: "status"; body: UpdateOrderStatusInput }
  | { kind: "mark-paid"; body: MarkOrderPaidInput }
  | { kind: "refund"; body: RefundOrderInput }
  | { kind: "cancel"; body: CancelOrderInput }
  | { kind: "note"; body: AddOrderNoteInput };

async function runAction(id: string, action: OrderAction): Promise<AdminOrder> {
  const path = { params: { path: { id } } };
  const result =
    action.kind === "status"
      ? await api.POST("/api/v1/admin/orders/{id}/status", { ...path, body: action.body })
      : action.kind === "mark-paid"
        ? await api.POST("/api/v1/admin/orders/{id}/mark-paid", { ...path, body: action.body })
        : action.kind === "refund"
          ? await api.POST("/api/v1/admin/orders/{id}/refund", { ...path, body: action.body })
          : action.kind === "cancel"
            ? await api.POST("/api/v1/admin/orders/{id}/cancel", { ...path, body: action.body })
            : await api.POST("/api/v1/admin/orders/{id}/note", { ...path, body: action.body });
  const { data, error, response } = result;
  if (error || !data) throw toApiError(error, response);
  return data;
}

/** Every order action returns the updated order detail; it replaces the cached detail and refreshes lists. */
export function useOrderAction(id: string) {
  const qc = useQueryClient();
  return useMutation<AdminOrder, ApiError, OrderAction>({
    mutationFn: (action) => runAction(id, action),
    onSuccess: (order) => {
      qc.setQueryData(adminKeys.order(id), order);
      qc.invalidateQueries({ queryKey: [...adminKeys.orders, "list"] });
      qc.invalidateQueries({ queryKey: adminKeys.dashboard });
      qc.invalidateQueries({ queryKey: adminKeys.customers });
    },
  });
}

/** Paise still refundable: captured payments minus refunds that haven't failed. */
/** What can still be refunded (paise), as computed by the server. */
export const refundableAmount = (order: AdminOrder): number => order.refundableAmount;

/** Statuses offered in "Change status": the server's allowed transitions, minus CANCELLED (it has its own dialog). */
export const statusTargets = (order: AdminOrder) => order.allowedTransitions.filter((s) => s !== "CANCELLED");
