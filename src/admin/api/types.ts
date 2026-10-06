import type { components } from "@/lib/api/schema";

type S = components["schemas"];

export type Me = S["MeDto_Output"];
export type Role = Me["role"];
export type AdminCategory = S["AdminCategoryDto_Output"];
export type AdminCategoryList = S["AdminCategoryListDto_Output"];
export type CreateCategoryInput = S["CreateCategoryDto"];
export type UpdateCategoryInput = S["UpdateCategoryDto"];
export type AdminProduct = S["AdminProductDto_Output"];
export type AdminProductList = S["AdminProductListDto_Output"];
export type AdminProductListItem = AdminProductList["items"][number];
export type CreateProductInput = S["CreateProductDto"];
export type UpdateProductInput = S["UpdateProductDto"];
export type AdminVariant = S["AdminVariantDto_Output"];
export type AdminVariantList = S["AdminVariantListDto_Output"];
export type GenerateVariantsInput = S["GenerateVariantsDto"];
export type UpdateVariantInput = S["UpdateVariantDto"];
export type AdjustStockInput = S["AdjustStockDto"];
export type CreateUploadInput = S["CreateUploadDto"];
export type UploadTicket = S["UploadTicketDto_Output"];
export type ProductStatus = AdminProduct["status"];
export type SaleChannel = AdminProduct["saleChannel"];
export type UploadPurpose = CreateUploadInput["purpose"];
export type UploadContentType = CreateUploadInput["contentType"];

export const PRODUCT_STATUSES: ProductStatus[] = ["DRAFT", "ACTIVE", "ARCHIVED"];
export const SALE_CHANNELS: SaleChannel[] = ["RETAIL", "B2B_ONLY", "ENQUIRY_ONLY"];
export const STAFF_ROLES: Role[] = ["STAFF", "ADMIN"];

export const SALE_CHANNEL_LABELS: Record<SaleChannel, string> = {
  RETAIL: "Retail",
  B2B_ONLY: "B2B only",
  ENQUIRY_ONLY: "Enquiry only",
};
export const STATUS_LABELS: Record<ProductStatus, string> = {
  DRAFT: "Draft",
  ACTIVE: "Active",
  ARCHIVED: "Archived",
};
