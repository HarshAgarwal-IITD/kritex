import { Link, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useCustomer } from "../api/customers";
import { formatPaise } from "../lib/money";
import { formatDate, formatDateTime } from "../lib/format";
import { adminPaths } from "../paths";
import { ErrorState, PageHeader } from "../components/PageState";
import { Section } from "../components/Section";
import { BusinessStatusBadge, OrderStatusBadge } from "../components/Badges";

const BackLink = () => (
  <Link to={adminPaths.customers} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
    <ArrowLeft className="h-3 w-3" /> Customers
  </Link>
);

const Stat = ({ label, value }: { label: string; value: string }) => (
  <div className="border border-border p-4">
    <p className="font-display text-[11px] text-muted-foreground">{label}</p>
    <p className="font-display text-xl text-foreground tabular mt-1">{value}</p>
  </div>
);

export default function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const customer = useCustomer(id);

  if (customer.isError) {
    return (
      <div className="space-y-4">
        <BackLink />
        <ErrorState
          message={customer.error.status === 404 ? "This customer doesn't exist." : customer.error.message}
          onRetry={customer.error.status === 404 ? undefined : () => customer.refetch()}
        />
      </div>
    );
  }
  if (!customer.data) {
    return (
      <div className="space-y-4" aria-busy="true">
        <BackLink />
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }
  const c = customer.data;
  const bp = c.businessProfile;

  return (
    <div className="space-y-6">
      <BackLink />
      <PageHeader title={c.name} description={`${c.email}${c.phone ? ` · ${c.phone}` : ""} · joined ${formatDate(c.createdAt)}`} />
      <div className="flex flex-wrap items-center gap-2 -mt-4">
        <Badge variant={c.role === "B2B_CUSTOMER" ? "default" : "outline"} className="font-normal">
          {c.role === "B2B_CUSTOMER" ? "B2B" : c.role === "CUSTOMER" ? "Retail" : c.role}
        </Badge>
        {!c.emailVerified && (
          <Badge variant="secondary" className="font-normal">
            Email unverified
          </Badge>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 max-w-xl">
        <Stat label="Orders" value={String(c.orderCount)} />
        <Stat label="Total spent" value={formatPaise(c.totalSpent)} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Section
            title="Recent orders"
            actions={
              <Link to={`${adminPaths.orders}?q=${encodeURIComponent(c.email)}`} className="text-xs text-primary hover:underline">
                All orders
              </Link>
            }
          >
            {c.recentOrders.length === 0 ? (
              <p className="text-sm text-muted-foreground">No orders yet.</p>
            ) : (
              <div className="border border-border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order</TableHead>
                      <TableHead>Placed</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {c.recentOrders.map((o) => (
                      <TableRow key={o.id}>
                        <TableCell>
                          <Link to={adminPaths.order(o.id)} className="font-medium hover:text-primary tabular">
                            {o.number}
                          </Link>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground tabular">{formatDateTime(o.createdAt)}</TableCell>
                        <TableCell>
                          <OrderStatusBadge status={o.status} />
                        </TableCell>
                        <TableCell className="text-right tabular">{formatPaise(o.total)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </Section>
        </div>
        <div className="space-y-6">
          <Section title="Business profile">
            {bp ? (
              <div className="space-y-1 text-sm">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{bp.legalName}</span>
                  <BusinessStatusBadge status={bp.status} />
                </div>
                <p className="tabular">GSTIN {bp.gstin}</p>
                <p className="text-xs text-muted-foreground">Applied {formatDate(bp.createdAt)}</p>
                {bp.reviewedAt && <p className="text-xs text-muted-foreground">Reviewed {formatDate(bp.reviewedAt)}</p>}
                {bp.rejectionReason && <p className="text-xs text-muted-foreground">Reason: {bp.rejectionReason}</p>}
                {bp.status === "PENDING" && (
                  <Link to={adminPaths.b2bApprovals} className="text-xs text-primary hover:underline">
                    Review in B2B approvals
                  </Link>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No B2B application.</p>
            )}
          </Section>
          <Section title="Addresses">
            {c.addresses.length === 0 ? (
              <p className="text-sm text-muted-foreground">No saved addresses.</p>
            ) : (
              c.addresses.map((a) => (
                <address key={a.id} className="not-italic text-sm leading-relaxed">
                  {a.name}
                  {a.isDefault && (
                    <Badge variant="outline" className="ml-2 font-normal py-0">
                      Default
                    </Badge>
                  )}
                  <br />
                  {a.line1}
                  {a.line2 ? `, ${a.line2}` : ""}
                  <br />
                  {a.city}, {a.state} {a.pincode}
                  <br />
                  <span className="text-muted-foreground">{a.phone}</span>
                </address>
              ))
            )}
          </Section>
        </div>
      </div>
    </div>
  );
}
