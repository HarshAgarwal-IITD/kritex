import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, toApiError, type ApiError } from "@/lib/api/client";
import { adminKeys } from "./keys";
import type { Coupon, CouponList, CreateCouponInput, UpdateCouponInput } from "./types";

export interface CouponFilters {
  q?: string;
  isActive?: "true" | "false";
  page?: number;
  limit?: number;
}

export function useCoupons(filters: CouponFilters) {
  return useQuery<CouponList, ApiError>({
    queryKey: adminKeys.couponList(filters),
    queryFn: async () => {
      const { data, error, response } = await api.GET("/api/v1/admin/coupons", { params: { query: filters } });
      if (error || !data) throw toApiError(error, response);
      return data;
    },
    placeholderData: keepPreviousData,
  });
}

export function useCreateCoupon() {
  const qc = useQueryClient();
  return useMutation<Coupon, ApiError, CreateCouponInput>({
    mutationFn: async (body) => {
      const { data, error, response } = await api.POST("/api/v1/admin/coupons", { body });
      if (error || !data) throw toApiError(error, response);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: adminKeys.coupons }),
  });
}

export function useUpdateCoupon() {
  const qc = useQueryClient();
  return useMutation<Coupon, ApiError, { id: string; body: UpdateCouponInput }>({
    mutationFn: async ({ id, body }) => {
      const { data, error, response } = await api.PATCH("/api/v1/admin/coupons/{id}", { params: { path: { id } }, body });
      if (error || !data) throw toApiError(error, response);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: adminKeys.coupons }),
  });
}

/** Deletes an unused coupon; the server deactivates it instead once it has been used. */
export function useDeleteCoupon() {
  const qc = useQueryClient();
  return useMutation<void, ApiError, string>({
    mutationFn: async (id) => {
      const { error, response } = await api.DELETE("/api/v1/admin/coupons/{id}", { params: { path: { id } } });
      if (!response.ok) throw toApiError(error, response);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: adminKeys.coupons }),
  });
}
