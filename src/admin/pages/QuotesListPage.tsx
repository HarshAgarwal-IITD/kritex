import { Link, useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAdminQuotes, type AdminQuoteFilters } from "../api/quotes";
import type { QuoteStatus } from "../api/types";
import { formatPaise } from "../lib/money";
import { formatDate, formatDateTime } from "../lib/format";
import { useUrlFilters } from "../lib/hooks";
import { adminPaths } from "../paths";
import { ErrorState, PageHeader } from "../components/PageState";
import { QuoteStatusBadge } from "../components/Badges";
import { Pager } from "../components/Pager";
import { TableStates } from "../components/TableStates";

const PAGE_SIZE = 20;
const TABS: { value: string; label: string }[] = [
  { value: "REQUESTED", label: "To respond" },
  { value: "QUOTED", label: "Quoted" },
  { value: "CONVERTED", label: "Converted" },
  { value: "EXPIRED", label: "Expired" },
  { value: "REJECTED", label: "Declined" },
  { value: "all", label: "All" },
];

/** `/admin/quotes`: RFQ inbox. Defaults to the ones waiting for a response. */
export default function QuotesListPage() {
  const navigate = useNavigate();
  const { get, setParam, page, search, setSearch } = useUrlFilters();
  const tab = get("status") ?? "REQUESTED";
  const filters: AdminQuoteFilters = {
    status: tab === "all" ? undefined : (tab as QuoteStatus),
    q: get("q"),
    page,
    limit: PAGE_SIZE,
  };
  const quotes = useAdminQuotes(filters);

  return (
    <div>
      <PageHeader title="Quotes" description="Requests for quotation from the storefront. Price every line, set a validity date and send." />

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <Tabs value={tab} onValueChange={(v) => setParam("status", v === "REQUESTED" ? undefined : v)}>
          <TabsList className="rounded-none flex-wrap h-auto">
            {TABS.map((t) => (
              <TabsTrigger key={t.value} value={t.value} className="rounded-none">
                {t.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <div className="relative flex-1 min-w-[220px] max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            aria-label="Search quotes"
            placeholder="KTQ-100001, email or organisation"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {quotes.isError ? (
        <ErrorState message={quotes.error.message} onRetry={() => quotes.refetch()} />
      ) : (
        <div className="border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Quote</TableHead>
                <TableHead>Requested</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Lines</TableHead>
                <TableHead className="text-right">Quoted total</TableHead>
                <TableHead>Valid until</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableStates
                loading={quotes.isPending}
                empty={quotes.data?.items.length === 0}
                colSpan={7}
                message={tab === "REQUESTED" ? "No quote requests waiting." : "No quotes match these filters."}
              />
              {quotes.data?.items.map((q) => (
                <TableRow key={q.id} className="cursor-pointer" onClick={() => navigate(adminPaths.quote(q.id))}>
                  <TableCell>
                    <Link
                      to={adminPaths.quote(q.id)}
                      className="font-medium text-foreground hover:text-primary tabular"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {q.number}
                    </Link>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground tabular whitespace-nowrap">{formatDateTime(q.createdAt)}</TableCell>
                  <TableCell>
                    <div>{q.organization}</div>
                    <div className="text-xs text-muted-foreground">
                      {q.contactName} · {q.email}
                    </div>
                  </TableCell>
                  <TableCell>
                    <QuoteStatusBadge status={q.status} />
                  </TableCell>
                  <TableCell className="text-right tabular">{q.itemCount}</TableCell>
                  <TableCell className="text-right tabular">{formatPaise(q.quotedTotal)}</TableCell>
                  <TableCell className="text-xs text-muted-foreground tabular">{formatDate(q.validUntil)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Pager
        total={quotes.data?.total ?? 0}
        page={quotes.data?.page ?? page}
        limit={quotes.data?.limit ?? PAGE_SIZE}
        noun={["quote", "quotes"]}
        loaded={!!quotes.data}
        onPage={(p) => setParam("page", String(p))}
      />
    </div>
  );
}
