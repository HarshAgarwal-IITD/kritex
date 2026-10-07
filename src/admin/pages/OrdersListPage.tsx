import { Link, useNavigate } from "react-router-dom";
import { Download, Loader2, Search } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAdminOrders, useExportOrders, type AdminOrderFilters } from "../api/orders";
import {
  ORDER_STATUSES,
  ORDER_STATUS_LABELS,
  PAYMENT_METHODS,
  PAYMENT_METHOD_LABELS,
  type OrderStatus,
  type PaymentMethod,
} from "../api/types";
import { formatPaise } from "../lib/money";
import { dayEndExclusiveIso, dayStartIso, downloadBlob, formatDateTime } from "../lib/format";
import { useUrlFilters } from "../lib/hooks";
import { adminPaths } from "../paths";
import { ErrorState, PageHeader } from "../components/PageState";
import { OrderStatusBadge, PaymentStatusBadge } from "../components/Badges";
import { Pager } from "../components/Pager";
import { TableStates } from "../components/TableStates";

const PAGE_SIZE = 20;
const ALL = "all";
const SORTS = { newest: "Newest first", oldest: "Oldest first", total_desc: "Highest total" } as const;
type Sort = keyof typeof SORTS;

export default function OrdersListPage() {
  const navigate = useNavigate();
  const { get, setParam, page, search, setSearch } = useUrlFilters();
  const fromDay = get("from");
  const toDay = get("to");

  const filters: AdminOrderFilters = {
    q: get("q"),
    status: get("status") as OrderStatus | undefined,
    paymentMethod: get("payment") as PaymentMethod | undefined,
    from: fromDay ? dayStartIso(fromDay) : undefined,
    to: toDay ? dayEndExclusiveIso(toDay) : undefined,
    sort: (get("sort") as Sort | undefined) ?? "newest",
    page,
    limit: PAGE_SIZE,
  };
  const orders = useAdminOrders(filters);
  const exportCsv = useExportOrders();

  const onExport = () =>
    exportCsv.mutate(filters, {
      onSuccess: (blob) => {
        const stamp = new Date().toISOString().slice(0, 10);
        downloadBlob(blob, `kritex-orders-${stamp}.csv`);
        toast.success("Orders exported.");
      },
      onError: (e) => toast.error(e.message),
    });

  return (
    <div>
      <PageHeader
        title="Orders"
        description="Search by order number, email, phone or customer name."
        actions={
          <Button variant="outline" className="font-display text-xs" onClick={onExport} disabled={exportCsv.isPending}>
            {exportCsv.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            Export CSV
          </Button>
        }
      />

      <div className="flex flex-wrap items-end gap-3 mb-4">
        <div className="relative flex-1 min-w-[220px] max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            aria-label="Search orders"
            placeholder="KTX-100001, email or phone"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filters.status ?? ALL} onValueChange={(v) => setParam("status", v === ALL ? undefined : v)}>
          <SelectTrigger className="w-[170px]" aria-label="Filter by status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All statuses</SelectItem>
            {ORDER_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {ORDER_STATUS_LABELS[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filters.paymentMethod ?? ALL} onValueChange={(v) => setParam("payment", v === ALL ? undefined : v)}>
          <SelectTrigger className="w-[170px]" aria-label="Filter by payment method">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All payment methods</SelectItem>
            {PAYMENT_METHODS.map((m) => (
              <SelectItem key={m} value={m}>
                {PAYMENT_METHOD_LABELS[m]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex items-end gap-2">
          <div className="space-y-1">
            <Label htmlFor="orders-from" className="text-xs text-muted-foreground font-normal">
              From
            </Label>
            <Input
              id="orders-from"
              type="date"
              className="w-[150px]"
              value={fromDay ?? ""}
              max={toDay}
              onChange={(e) => setParam("from", e.target.value || undefined)}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="orders-to" className="text-xs text-muted-foreground font-normal">
              To
            </Label>
            <Input
              id="orders-to"
              type="date"
              className="w-[150px]"
              value={toDay ?? ""}
              min={fromDay}
              onChange={(e) => setParam("to", e.target.value || undefined)}
            />
          </div>
        </div>
        <Select value={filters.sort} onValueChange={(v) => setParam("sort", v === "newest" ? undefined : v)}>
          <SelectTrigger className="w-[150px]" aria-label="Sort orders">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(SORTS) as Sort[]).map((s) => (
              <SelectItem key={s} value={s}>
                {SORTS[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {orders.isError ? (
        <ErrorState message={orders.error.message} onRetry={() => orders.refetch()} />
      ) : (
        <div className="border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order</TableHead>
                <TableHead>Placed</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead className="text-right">Items</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableStates
                loading={orders.isPending}
                empty={orders.data?.items.length === 0}
                colSpan={7}
                message="No orders match these filters."
              />
              {orders.data?.items.map((o) => (
                <TableRow key={o.id} className="cursor-pointer" onClick={() => navigate(adminPaths.order(o.id))}>
                  <TableCell>
                    <Link
                      to={adminPaths.order(o.id)}
                      className="font-medium text-foreground hover:text-primary tabular"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {o.number}
                    </Link>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground tabular whitespace-nowrap">{formatDateTime(o.createdAt)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span>{o.customerName}</span>
                      {o.isB2B && (
                        <Badge variant="outline" className="font-normal">
                          B2B
                        </Badge>
                      )}
                      {o.isGuest && <span className="text-xs text-muted-foreground">guest</span>}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {o.email} · {o.phone}
                    </div>
                  </TableCell>
                  <TableCell>
                    <OrderStatusBadge status={o.status} />
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col items-start gap-1">
                      <PaymentStatusBadge status={o.paymentStatus} />
                      <span className="text-xs text-muted-foreground">{PAYMENT_METHOD_LABELS[o.paymentMethod]}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right tabular">{o.itemCount}</TableCell>
                  <TableCell className="text-right tabular">{formatPaise(o.total)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Pager
        total={orders.data?.total ?? 0}
        page={orders.data?.page ?? page}
        limit={orders.data?.limit ?? PAGE_SIZE}
        noun={["order", "orders"]}
        loaded={!!orders.data}
        onPage={(p) => setParam("page", String(p))}
      />
    </div>
  );
}
