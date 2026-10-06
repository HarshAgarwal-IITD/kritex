import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, toApiError, type ApiError } from "@/lib/api/client";
import { adminKeys } from "./keys";
import type { AdminCategory, CreateCategoryInput, UpdateCategoryInput } from "./types";

export function useAdminCategories() {
  return useQuery({
    queryKey: adminKeys.categories,
    queryFn: async () => {
      const { data, error, response } = await api.GET("/api/v1/admin/categories");
      if (error || !data) throw toApiError(error, response);
      return [...data.items].sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
    },
  });
}

export function useCreateCategory() {
  const qc = useQueryClient();
  return useMutation<AdminCategory, ApiError, CreateCategoryInput>({
    mutationFn: async (body) => {
      const { data, error, response } = await api.POST("/api/v1/admin/categories", { body });
      if (error || !data) throw toApiError(error, response);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: adminKeys.categories }),
  });
}

export function useUpdateCategory() {
  const qc = useQueryClient();
  return useMutation<AdminCategory, ApiError, { id: string; body: UpdateCategoryInput }>({
    mutationFn: async ({ id, body }) => {
      const { data, error, response } = await api.PATCH("/api/v1/admin/categories/{id}", {
        params: { path: { id } },
        body,
      });
      if (error || !data) throw toApiError(error, response);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: adminKeys.categories }),
  });
}

export function useDeleteCategory() {
  const qc = useQueryClient();
  return useMutation<void, ApiError, string>({
    mutationFn: async (id) => {
      const { error, response } = await api.DELETE("/api/v1/admin/categories/{id}", { params: { path: { id } } });
      if (!response.ok) throw toApiError(error, response);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: adminKeys.categories }),
  });
}
