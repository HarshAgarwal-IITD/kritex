import { cn } from "@/lib/utils";
import { ORDER_STATUS_LABEL, orderStatusTone } from "../orders";
import type { OrderStatus } from "../types";

const TONE = {
  ok: "border-primary/50 text-primary",
  warn: "border-accent/50 text-accent",
  bad: "border-destructive/50 text-destructive",
  muted: "border-border text-muted-foreground",
};

const StatusBadge = ({ status }: { status: OrderStatus }) => (
  <span
    className={cn("inline-block border px-2 py-1 font-display text-[9px] uppercase tracking-wider", TONE[orderStatusTone(status)])}
    data-testid="order-status"
  >
    {ORDER_STATUS_LABEL[status]}
  </span>
);

export default StatusBadge;
