import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, toApiError, type ApiError } from "@/lib/api/client";
import { adminKeys } from "./keys";
import type { AdjustStockInput, AdminVariant, InventoryList } from "./types";

export interface InventoryFilters {
  q?: string;
  lowStock?: "true" | "false";
  threshold?: number;
  productId?: string;
  page?: number;
  limit?: number;
}

export function useInventory(filters: InventoryFilters) {
  return useQuery<InventoryList, ApiError>({
    queryKey: adminKeys.inventoryList(filters),
    queryFn: async () => {
      const { data, error, response } = await api.GET("/api/v1/admin/inventory", { params: { query: filters } });
      if (error || !data) throw toApiError(error, response);
      return data;
    },
    placeholderData: keepPreviousData,
  });
}

/** `PATCH /admin/variants/:id/stock` with a delta; refreshes inventory, products and the dashboard. */
export function useAdjustStock() {
  const qc = useQueryClient();
  return useMutation<AdminVariant, ApiError, { variantId: string; body: AdjustStockInput }>({
    mutationFn: async ({ variantId, body }) => {
      const { data, error, response } = await api.PATCH("/api/v1/admin/variants/{id}/stock", {
        params: { path: { id: variantId } },
        body,
      });
      if (error || !data) throw toApiError(error, response);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: adminKeys.inventory });
      qc.invalidateQueries({ queryKey: adminKeys.products });
      qc.invalidateQueries({ queryKey: adminKeys.dashboard });
    },
  });
}
