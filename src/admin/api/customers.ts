import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, toApiError, type ApiError } from "@/lib/api/client";
import { adminKeys } from "./keys";
import type { AdminCustomer, AdminCustomerList, BusinessProfile, BusinessProfileList, BusinessStatus } from "./types";

export interface CustomerFilters {
  q?: string;
  role?: "CUSTOMER" | "B2B_CUSTOMER";
  businessStatus?: BusinessStatus;
  page?: number;
  limit?: number;
}

export interface BusinessProfileFilters {
  status?: BusinessStatus;
  q?: string;
  page?: number;
  limit?: number;
}

export function useCustomers(filters: CustomerFilters) {
  return useQuery<AdminCustomerList, ApiError>({
    queryKey: adminKeys.customerList(filters),
    queryFn: async () => {
      const { data, error, response } = await api.GET("/api/v1/admin/customers", { params: { query: filters } });
      if (error || !data) throw toApiError(error, response);
      return data;
    },
    placeholderData: keepPreviousData,
  });
}

export function useCustomer(id: string | undefined) {
  return useQuery<AdminCustomer, ApiError>({
    queryKey: adminKeys.customer(id ?? ""),
    enabled: !!id,
    queryFn: async () => {
      const { data, error, response } = await api.GET("/api/v1/admin/customers/{id}", { params: { path: { id: id! } } });
      if (error || !data) throw toApiError(error, response);
      return data;
    },
  });
}

export function useBusinessProfiles(filters: BusinessProfileFilters) {
  return useQuery<BusinessProfileList, ApiError>({
    queryKey: adminKeys.businessProfileList(filters),
    queryFn: async () => {
      const { data, error, response } = await api.GET("/api/v1/admin/business-profiles", { params: { query: filters } });
      if (error || !data) throw toApiError(error, response);
      return data;
    },
    placeholderData: keepPreviousData,
  });
}

type Review = { id: string; decision: "approve" } | { id: string; decision: "reject"; reason: string };

/** Approves or rejects a PENDING B2B application. */
export function useReviewBusinessProfile() {
  const qc = useQueryClient();
  return useMutation<BusinessProfile, ApiError, Review>({
    mutationFn: async (review) => {
      const path = { params: { path: { id: review.id } } };
      const { data, error, response } =
        review.decision === "approve"
          ? await api.POST("/api/v1/admin/business-profiles/{id}/approve", path)
          : await api.POST("/api/v1/admin/business-profiles/{id}/reject", { ...path, body: { reason: review.reason } });
      if (error || !data) throw toApiError(error, response);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: adminKeys.businessProfiles });
      qc.invalidateQueries({ queryKey: adminKeys.customers });
      qc.invalidateQueries({ queryKey: adminKeys.dashboard });
    },
  });
}
