import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, toApiError, type ApiError } from "@/lib/api/client";
import { adminKeys } from "./keys";
import type { Dashboard, Enquiry, EnquiryStatus } from "./types";

export function useDashboard() {
  return useQuery<Dashboard, ApiError>({
    queryKey: adminKeys.dashboard,
    queryFn: async () => {
      const { data, error, response } = await api.GET("/api/v1/admin/dashboard");
      if (error || !data) throw toApiError(error, response);
      return data;
    },
    refetchInterval: 60_000,
  });
}

/** `GET /admin/queries` returns every enquiry (bare array, not paginated). */
export function useEnquiries() {
  return useQuery<Enquiry[], ApiError>({
    queryKey: adminKeys.enquiries,
    queryFn: async () => {
      const { data, error, response } = await api.GET("/api/v1/admin/queries");
      if (error || !data) throw toApiError(error, response);
      return [...data].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    },
  });
}

export function useUpdateEnquiry() {
  const qc = useQueryClient();
  return useMutation<Enquiry, ApiError, { id: string; status: EnquiryStatus }>({
    mutationFn: async ({ id, status }) => {
      const { data, error, response } = await api.PATCH("/api/v1/admin/queries/{id}", {
        params: { path: { id } },
        body: { status },
      });
      if (error || !data) throw toApiError(error, response);
      return data;
    },
    onSuccess: (updated) => {
      qc.setQueryData<Enquiry[]>(adminKeys.enquiries, (prev) => prev?.map((q) => (q.id === updated.id ? updated : q)));
      qc.invalidateQueries({ queryKey: adminKeys.dashboard });
    },
  });
}
