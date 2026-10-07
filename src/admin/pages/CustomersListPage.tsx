import { Link, useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useCustomers, type CustomerFilters } from "../api/customers";
import type { BusinessStatus } from "../api/types";
import { formatPaise } from "../lib/money";
import { formatDate } from "../lib/format";
import { useUrlFilters } from "../lib/hooks";
import { adminPaths } from "../paths";
import { ErrorState, PageHeader } from "../components/PageState";
import { BusinessStatusBadge } from "../components/Badges";
import { Pager } from "../components/Pager";
import { TableStates } from "../components/TableStates";

const PAGE_SIZE = 20;
const ALL = "all";

export default function CustomersListPage() {
  const navigate = useNavigate();
  const { get, setParam, page, search, setSearch } = useUrlFilters();
  const filters: CustomerFilters = {
    q: get("q"),
    role: get("role") as CustomerFilters["role"],
    businessStatus: get("business") as BusinessStatus | undefined,
    page,
    limit: PAGE_SIZE,
  };
  const customers = useCustomers(filters);

  return (
    <div>
      <PageHeader title="Customers" description="Registered shoppers and B2B buyers. Totals count paid orders only." />

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 min-w-[220px] max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            aria-label="Search customers"
            placeholder="Name, email or phone"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filters.role ?? ALL} onValueChange={(v) => setParam("role", v === ALL ? undefined : v)}>
          <SelectTrigger className="w-[160px]" aria-label="Filter by type">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All customers</SelectItem>
            <SelectItem value="CUSTOMER">Retail</SelectItem>
            <SelectItem value="B2B_CUSTOMER">B2B</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filters.businessStatus ?? ALL} onValueChange={(v) => setParam("business", v === ALL ? undefined : v)}>
          <SelectTrigger className="w-[190px]" aria-label="Filter by B2B application">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Any B2B application</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="APPROVED">Approved</SelectItem>
            <SelectItem value="REJECTED">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {customers.isError ? (
        <ErrorState message={customers.error.message} onRetry={() => customers.refetch()} />
      ) : (
        <div className="border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Orders</TableHead>
                <TableHead className="text-right">Total spent</TableHead>
                <TableHead className="text-right">Joined</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableStates loading={customers.isPending} empty={customers.data?.items.length === 0} colSpan={6} message="No customers match." />
              {customers.data?.items.map((c) => (
                <TableRow key={c.id} className="cursor-pointer" onClick={() => navigate(adminPaths.customer(c.id))}>
                  <TableCell>
                    <Link to={adminPaths.customer(c.id)} className="font-medium text-foreground hover:text-primary" onClick={(e) => e.stopPropagation()}>
                      {c.name}
                    </Link>
                    <div className="text-xs text-muted-foreground">
                      {c.email}
                      {!c.emailVerified && " · unverified"}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground tabular">{c.phone ?? "—"}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Badge variant={c.role === "B2B_CUSTOMER" ? "default" : "outline"} className="font-normal">
                        {c.role === "B2B_CUSTOMER" ? "B2B" : "Retail"}
                      </Badge>
                      {c.businessStatus && c.businessStatus !== "APPROVED" && <BusinessStatusBadge status={c.businessStatus} />}
                    </div>
                  </TableCell>
                  <TableCell className="text-right tabular">{c.orderCount}</TableCell>
                  <TableCell className="text-right tabular">{formatPaise(c.totalSpent)}</TableCell>
                  <TableCell className="text-right text-xs text-muted-foreground tabular">{formatDate(c.createdAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Pager
        total={customers.data?.total ?? 0}
        page={customers.data?.page ?? page}
        limit={customers.data?.limit ?? PAGE_SIZE}
        noun={["customer", "customers"]}
        loaded={!!customers.data}
        onPage={(p) => setParam("page", String(p))}
      />
    </div>
  );
}
