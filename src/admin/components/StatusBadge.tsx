import { Badge } from "@/components/ui/badge";
import { STATUS_LABELS, type ProductStatus } from "../api/types";

const VARIANT: Record<ProductStatus, "default" | "secondary" | "outline"> = {
  ACTIVE: "default",
  DRAFT: "secondary",
  ARCHIVED: "outline",
};

export const StatusBadge = ({ status }: { status: ProductStatus }) => (
  <Badge variant={VARIANT[status]} className="font-normal">
    {STATUS_LABELS[status]}
  </Badge>
);
