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

// ---- Stage 3: orders, inventory, coupons, customers, B2B, dashboard, enquiries ----
export type AdminOrderList = S["AdminOrderListDto_Output"];
export type AdminOrderListItem = AdminOrderList["items"][number];
export type AdminOrder = S["AdminOrderDetailDto_Output"];
export type OrderStatus = AdminOrder["status"];
export type PaymentMethod = AdminOrder["paymentMethod"];
export type PaymentStatus = NonNullable<AdminOrder["paymentStatus"]>;
export type RefundStatus = AdminOrder["refunds"][number]["status"];
export type OrderAddress = AdminOrder["shippingAddress"];
export type UpdateOrderStatusInput = S["UpdateOrderStatusDto"];
export type MarkOrderPaidInput = S["MarkOrderPaidDto"];
export type RefundOrderInput = S["RefundOrderDto"];
export type CancelOrderInput = S["AdminCancelOrderDto"];
export type AddOrderNoteInput = S["AddOrderNoteDto"];
export type InventoryList = S["InventoryListDto_Output"];
export type InventoryRow = InventoryList["items"][number];
export type StockReason = AdjustStockInput["reason"];
export type Coupon = S["CouponDto_Output"];
export type CouponList = S["CouponListDto_Output"];
export type CouponType = Coupon["type"];
export type CreateCouponInput = S["CreateCouponDto"];
export type UpdateCouponInput = S["UpdateCouponDto"];
export type AdminCustomerList = S["AdminCustomerListDto_Output"];
export type AdminCustomerListItem = AdminCustomerList["items"][number];
export type AdminCustomer = S["AdminCustomerDetailDto_Output"];
export type BusinessProfile = S["AdminBusinessProfileDto_Output"];
export type BusinessProfileList = S["AdminBusinessProfileListDto_Output"];
export type BusinessStatus = BusinessProfile["status"];
export type Dashboard = S["DashboardDto_Output"];
export type Enquiry = S["QueryDto_Output"];
export type EnquiryStatus = Enquiry["status"];

export const ORDER_STATUSES: OrderStatus[] = [
  "PENDING_PAYMENT",
  "AWAITING_PAYMENT",
  "PAID",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "RETURN_REQUESTED",
  "RETURNED",
  "REFUNDED",
];
export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING_PAYMENT: "Pending payment",
  AWAITING_PAYMENT: "Awaiting payment",
  PAID: "Paid",
  PROCESSING: "Processing",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
  RETURN_REQUESTED: "Return requested",
  RETURNED: "Returned",
  REFUNDED: "Refunded",
};
export const PAYMENT_METHODS: PaymentMethod[] = ["RAZORPAY", "BANK_TRANSFER", "COD"];
export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  RAZORPAY: "Razorpay",
  BANK_TRANSFER: "Bank transfer",
  COD: "Cash on delivery",
};
export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  CREATED: "Created",
  CAPTURED: "Captured",
  FAILED: "Failed",
  REFUNDED: "Refunded",
};
export const STOCK_REASONS: StockReason[] = ["RESTOCK", "ADJUST", "RETURN"];
export const STOCK_REASON_LABELS: Record<StockReason, string> = {
  RESTOCK: "Restock",
  ADJUST: "Adjustment",
  RETURN: "Customer return",
};
export const COUPON_TYPES: CouponType[] = ["PERCENT", "FLAT", "FREE_SHIPPING"];
export const COUPON_TYPE_LABELS: Record<CouponType, string> = {
  PERCENT: "Percent off",
  FLAT: "Flat amount off",
  FREE_SHIPPING: "Free shipping",
};
export const BUSINESS_STATUS_LABELS: Record<BusinessStatus, string> = {
  PENDING: "Pending",
  APPROVED: "Approved",
  REJECTED: "Rejected",
};
export const ENQUIRY_STATUSES: EnquiryStatus[] = ["NEW", "IN_PROGRESS", "RESOLVED"];
export const ENQUIRY_STATUS_LABELS: Record<EnquiryStatus, string> = {
  NEW: "New",
  IN_PROGRESS: "In progress",
  RESOLVED: "Resolved",
};

// ---- Stage 4: quotes (B2B-5) + shipping (OPS-4) ----
export type AdminQuoteList = S["AdminQuoteListDto_Output"];
export type AdminQuoteListItem = AdminQuoteList["items"][number];
export type AdminQuote = S["AdminQuoteDetailDto_Output"];
export type AdminQuoteItem = AdminQuote["items"][number];
export type QuoteStatus = AdminQuote["status"];
export type RespondQuoteInput = S["RespondQuoteDto"];
export type RejectQuoteInput = S["RejectQuoteDto"];
export type AdminShipment = S["AdminShipmentDto_Output"];
export type ShipmentStatus = AdminShipment["status"];
export type ShipOrderInput = S["ShipOrderDto"];
export type CreateShiprocketShipmentInput = S["CreateShiprocketShipmentDto"];

export const QUOTE_STATUSES: QuoteStatus[] = ["REQUESTED", "QUOTED", "ACCEPTED", "CONVERTED", "EXPIRED", "REJECTED"];
export const QUOTE_STATUS_LABELS: Record<QuoteStatus, string> = {
  REQUESTED: "Requested",
  QUOTED: "Quoted",
  ACCEPTED: "Accepted",
  CONVERTED: "Converted to order",
  EXPIRED: "Expired",
  REJECTED: "Declined",
};
export const SHIPMENT_STATUS_LABELS: Record<ShipmentStatus, string> = {
  PENDING: "Pending",
  READY_TO_SHIP: "Ready to ship",
  SHIPPED: "Shipped",
  IN_TRANSIT: "In transit",
  OUT_FOR_DELIVERY: "Out for delivery",
  DELIVERED: "Delivered",
  RTO: "RTO",
  CANCELLED: "Cancelled",
};
