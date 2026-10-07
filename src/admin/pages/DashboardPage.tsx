import { Link } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useDashboard } from "../api/dashboard";
import { ORDER_STATUS_LABELS } from "../api/types";
import { formatPaise } from "../lib/money";
import { formatDateTime } from "../lib/format";
import { adminPaths } from "../paths";
import { ErrorState, PageHeader } from "../components/PageState";
import { Section } from "../components/Section";

const Tile = ({ label, value, hint, to }: { label: string; value: string; hint?: string; to?: string }) => {
  const body = (
    <>
      <p className="font-display text-[11px] text-muted-foreground">{label}</p>
      <p className="font-display text-2xl text-foreground tabular mt-1">{value}</p>
      {hint && <p className="text-xs text-muted-foreground mt-1">{hint}</p>}
    </>
  );
  return to ? (
    <Link to={to} className="block border border-border bg-card/50 p-4 transition-colors hover:border-primary" aria-label={`${label}: ${value}`}>
      {body}
    </Link>
  ) : (
    <div className="border border-border bg-card/50 p-4" role="group" aria-label={`${label}: ${value}`}>
      {body}
    </div>
  );
};

export default function DashboardPage() {
  const dashboard = useDashboard();

  if (dashboard.isError) {
    return (
      <div>
        <PageHeader title="Dashboard" />
        <ErrorState message={dashboard.error.message} onRetry={() => dashboard.refetch()} />
      </div>
    );
  }
  const d = dashboard.data;

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" description={d ? `Updated ${formatDateTime(d.generatedAt)}` : undefined} />

      {!d ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-busy="true">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Tile label="Revenue today" value={formatPaise(d.revenue.today)} hint="Paid orders since midnight IST" />
            <Tile label="Revenue, last 7 days" value={formatPaise(d.revenue.last7Days)} hint="Paid orders" />
            <Tile label="Orders today" value={String(d.orders.today)} to={adminPaths.orders} />
            <Tile label="Orders, last 7 days" value={String(d.orders.last7Days)} to={adminPaths.orders} />
            <Tile
              label="Awaiting payment"
              value={String(d.awaitingPaymentOrders)}
              hint="Bank transfers to mark paid"
              to={`${adminPaths.orders}?status=AWAITING_PAYMENT`}
            />
            <Tile label="B2B applications" value={String(d.pendingBusinessProfiles)} hint="Waiting for review" to={adminPaths.b2bApprovals} />
            <Tile label="New enquiries" value={String(d.newEnquiries)} to={adminPaths.enquiries} />
            <Tile label="Quote requests" value={String(d.pendingQuotes)} hint="Waiting for a response" />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Section title="Orders by status">
              <div className="border border-border">
                <Table>
                  <TableBody>
                    {d.orders.byStatus.map((s) => (
                      <TableRow key={s.status}>
                        <TableCell>
                          <Link to={`${adminPaths.orders}?status=${s.status}`} className="hover:text-primary">
                            {ORDER_STATUS_LABELS[s.status]}
                          </Link>
                        </TableCell>
                        <TableCell className={`text-right tabular ${s.count === 0 ? "text-muted-foreground" : ""}`}>{s.count}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Section>
            <Section
              title="Low stock"
              description="Active variants at or below 5 available."
              actions={
                <Link to={`${adminPaths.inventory}?low=1`} className="text-xs text-primary hover:underline">
                  Inventory
                </Link>
              }
            >
              {d.lowStock.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nothing is running low.</p>
              ) : (
                <div className="border border-border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Variant</TableHead>
                        <TableHead className="text-right">Available</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {d.lowStock.map((v) => (
                        <TableRow key={v.variantId}>
                          <TableCell>
                            <Link to={adminPaths.product(v.productId)} className="hover:text-primary">
                              {v.productName}
                            </Link>
                            <div className="text-xs text-muted-foreground">
                              {v.title} · {v.sku}
                            </div>
                          </TableCell>
                          <TableCell className="text-right tabular">{v.available}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </Section>
          </div>
        </>
      )}
    </div>
  );
}
