import type { AdminProductFilters } from "./products";
import type { AdminOrderFilters } from "./orders";
import type { InventoryFilters } from "./inventory";
import type { CouponFilters } from "./coupons";
import type { BusinessProfileFilters, CustomerFilters } from "./customers";

export const adminKeys = {
  session: ["auth", "session"] as const,
  me: ["me"] as const,
  categories: ["admin", "categories"] as const,
  products: ["admin", "products"] as const,
  productList: (filters: AdminProductFilters) => ["admin", "products", "list", filters] as const,
  product: (id: string) => ["admin", "products", "detail", id] as const,
  orders: ["admin", "orders"] as const,
  orderList: (filters: AdminOrderFilters) => ["admin", "orders", "list", filters] as const,
  order: (id: string) => ["admin", "orders", "detail", id] as const,
  inventory: ["admin", "inventory"] as const,
  inventoryList: (filters: InventoryFilters) => ["admin", "inventory", "list", filters] as const,
  coupons: ["admin", "coupons"] as const,
  couponList: (filters: CouponFilters) => ["admin", "coupons", "list", filters] as const,
  customers: ["admin", "customers"] as const,
  customerList: (filters: CustomerFilters) => ["admin", "customers", "list", filters] as const,
  customer: (id: string) => ["admin", "customers", "detail", id] as const,
  businessProfiles: ["admin", "business-profiles"] as const,
  businessProfileList: (filters: BusinessProfileFilters) => ["admin", "business-profiles", "list", filters] as const,
  dashboard: ["admin", "dashboard"] as const,
  enquiries: ["admin", "enquiries"] as const,
};
