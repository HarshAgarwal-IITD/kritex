import { Badge } from "@/components/ui/badge";
import {
  BUSINESS_STATUS_LABELS,
  ENQUIRY_STATUS_LABELS,
  ORDER_STATUS_LABELS,
  PAYMENT_STATUS_LABELS,
  type BusinessStatus,
  type EnquiryStatus,
  type OrderStatus,
  type PaymentStatus,
} from "../api/types";

type Variant = "default" | "secondary" | "outline" | "destructive";

const ORDER_VARIANT: Record<OrderStatus, Variant> = {
  PENDING_PAYMENT: "outline",
  AWAITING_PAYMENT: "secondary",
  PAID: "default",
  PROCESSING: "default",
  SHIPPED: "secondary",
  DELIVERED: "secondary",
  CANCELLED: "outline",
  RETURN_REQUESTED: "destructive",
  RETURNED: "outline",
  REFUNDED: "outline",
};

const PAYMENT_VARIANT: Record<PaymentStatus, Variant> = {
  CREATED: "outline",
  CAPTURED: "default",
  FAILED: "destructive",
  REFUNDED: "secondary",
};

const BUSINESS_VARIANT: Record<BusinessStatus, Variant> = { PENDING: "secondary", APPROVED: "default", REJECTED: "outline" };
const ENQUIRY_VARIANT: Record<EnquiryStatus, Variant> = { NEW: "default", IN_PROGRESS: "secondary", RESOLVED: "outline" };

export const OrderStatusBadge = ({ status }: { status: OrderStatus }) => (
  <Badge variant={ORDER_VARIANT[status]} className="font-normal whitespace-nowrap">
    {ORDER_STATUS_LABELS[status]}
  </Badge>
);

export const PaymentStatusBadge = ({ status }: { status: PaymentStatus | null }) =>
  status ? (
    <Badge variant={PAYMENT_VARIANT[status]} className="font-normal">
      {PAYMENT_STATUS_LABELS[status]}
    </Badge>
  ) : (
    <span className="text-xs text-muted-foreground">No payment</span>
  );

export const BusinessStatusBadge = ({ status }: { status: BusinessStatus }) => (
  <Badge variant={BUSINESS_VARIANT[status]} className="font-normal">
    {BUSINESS_STATUS_LABELS[status]}
  </Badge>
);

export const EnquiryStatusBadge = ({ status }: { status: EnquiryStatus }) => (
  <Badge variant={ENQUIRY_VARIANT[status]} className="font-normal">
    {ENQUIRY_STATUS_LABELS[status]}
  </Badge>
);
