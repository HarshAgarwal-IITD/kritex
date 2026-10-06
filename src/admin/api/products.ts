import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, toApiError, type ApiError } from "@/lib/api/client";
import { adminKeys } from "./keys";
import type {
  AdjustStockInput,
  AdminProduct,
  AdminProductList,
  AdminVariant,
  CreateProductInput,
  GenerateVariantsInput,
  ProductStatus,
  SaleChannel,
  UpdateProductInput,
  UpdateVariantInput,
} from "./types";

export interface AdminProductFilters {
  q?: string;
  status?: ProductStatus;
  saleChannel?: SaleChannel;
  category?: string;
  page?: number;
  limit?: number;
}

export function useAdminProducts(filters: AdminProductFilters) {
  return useQuery<AdminProductList, ApiError>({
    queryKey: adminKeys.productList(filters),
    queryFn: async () => {
      const { data, error, response } = await api.GET("/api/v1/admin/products", { params: { query: filters } });
      if (error || !data) throw toApiError(error, response);
      return data;
    },
    placeholderData: keepPreviousData,
  });
}

export function useAdminProduct(id: string | undefined) {
  return useQuery<AdminProduct, ApiError>({
    queryKey: adminKeys.product(id ?? ""),
    enabled: !!id,
    queryFn: async () => {
      const { data, error, response } = await api.GET("/api/v1/admin/products/{id}", {
        params: { path: { id: id! } },
      });
      if (error || !data) throw toApiError(error, response);
      return data;
    },
  });
}

export function useCreateProduct() {
  const qc = useQueryClient();
  return useMutation<AdminProduct, ApiError, CreateProductInput>({
    mutationFn: async (body) => {
      const { data, error, response } = await api.POST("/api/v1/admin/products", { body });
      if (error || !data) throw toApiError(error, response);
      return data;
    },
    onSuccess: (product) => {
      qc.setQueryData(adminKeys.product(product.id), product);
      qc.invalidateQueries({ queryKey: [...adminKeys.products, "list"] });
    },
  });
}

export function useUpdateProduct(id: string) {
  const qc = useQueryClient();
  return useMutation<AdminProduct, ApiError, UpdateProductInput>({
    mutationFn: async (body) => {
      const { data, error, response } = await api.PATCH("/api/v1/admin/products/{id}", {
        params: { path: { id } },
        body,
      });
      if (error || !data) throw toApiError(error, response);
      return data;
    },
    onSuccess: (product) => {
      qc.setQueryData(adminKeys.product(id), product);
      qc.invalidateQueries({ queryKey: [...adminKeys.products, "list"] });
    },
  });
}

export function useDeleteProduct() {
  const qc = useQueryClient();
  return useMutation<void, ApiError, string>({
    mutationFn: async (id) => {
      const { error, response } = await api.DELETE("/api/v1/admin/products/{id}", { params: { path: { id } } });
      if (!response.ok) throw toApiError(error, response);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: adminKeys.products }),
  });
}

export async function generateVariants(productId: string, body: GenerateVariantsInput): Promise<AdminVariant[]> {
  const { data, error, response } = await api.POST("/api/v1/admin/products/{id}/variants", {
    params: { path: { id: productId } },
    body,
  });
  if (error || !data) throw toApiError(error, response);
  return data.items;
}

export function useGenerateVariants(productId: string) {
  const qc = useQueryClient();
  return useMutation<AdminVariant[], ApiError, GenerateVariantsInput>({
    mutationFn: (body) => generateVariants(productId, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: adminKeys.product(productId) }),
  });
}

export interface VariantChange {
  id: string;
  patch?: UpdateVariantInput;
  stock?: AdjustStockInput;
}

/** Applies per-variant edits (PATCH variant, then PATCH stock with a delta) and refreshes the product. */
export function useSaveVariants(productId: string) {
  const qc = useQueryClient();
  return useMutation<void, ApiError, VariantChange[]>({
    mutationFn: async (changes) => {
      for (const change of changes) {
        if (change.patch && Object.keys(change.patch).length > 0) {
          const { error, response } = await api.PATCH("/api/v1/admin/variants/{id}", {
            params: { path: { id: change.id } },
            body: change.patch,
          });
          if (!response.ok) throw toApiError(error, response);
        }
        if (change.stock && change.stock.delta !== 0) {
          const { error, response } = await api.PATCH("/api/v1/admin/variants/{id}/stock", {
            params: { path: { id: change.id } },
            body: change.stock,
          });
          if (!response.ok) throw toApiError(error, response);
        }
      }
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: adminKeys.product(productId) });
      qc.invalidateQueries({ queryKey: [...adminKeys.products, "list"] });
    },
  });
}
