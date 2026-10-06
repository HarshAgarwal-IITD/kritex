import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ImageOff, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { useAdminProducts, type AdminProductFilters } from "../api/products";
import { useAdminCategories } from "../api/categories";
import {
  PRODUCT_STATUSES,
  SALE_CHANNELS,
  SALE_CHANNEL_LABELS,
  STATUS_LABELS,
  type ProductStatus,
  type SaleChannel,
} from "../api/types";
import { formatPaise } from "../lib/money";
import { adminPaths } from "../paths";
import { ErrorState, PageHeader } from "../components/PageState";
import { StatusBadge } from "../components/StatusBadge";

const PAGE_SIZE = 20;
const ALL = "all";

function useDebounced<T>(value: T, ms: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return debounced;
}

export default function ProductsListPage() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState(params.get("q") ?? "");
  const debouncedSearch = useDebounced(search.trim(), 300);

  const status = (params.get("status") as ProductStatus | null) ?? undefined;
  const saleChannel = (params.get("channel") as SaleChannel | null) ?? undefined;
  const category = params.get("category") ?? undefined;
  const page = Math.max(1, Number(params.get("page") ?? 1) || 1);

  const setParam = (key: string, value: string | undefined) =>
    setParams(
      (prev) => {
        const nextParams = new URLSearchParams(prev);
        if (value) nextParams.set(key, value);
        else nextParams.delete(key);
        if (key !== "page") nextParams.delete("page");
        return nextParams;
      },
      { replace: true },
    );

  // Keep ?q in sync with the debounced search box.
  useEffect(() => {
    if ((params.get("q") ?? "") !== debouncedSearch) setParam("q", debouncedSearch || undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  const filters: AdminProductFilters = {
    q: params.get("q") || undefined,
    status,
    saleChannel,
    category,
    page,
    limit: PAGE_SIZE,
  };
  const products = useAdminProducts(filters);
  const categories = useAdminCategories();
  // Use the page the data belongs to (not the URL) so the footer matches the rows while the next page loads.
  const total = products.data?.total ?? 0;
  const shownPage = products.data?.page ?? page;
  const pageCount = Math.max(1, Math.ceil(total / (products.data?.limit ?? PAGE_SIZE)));

  return (
    <div>
      <PageHeader
        title="Products"
        description="All products, including drafts and archived ones."
        actions={
          <Button asChild className="font-display text-xs">
            <Link to={adminPaths.newProduct}>
              <Plus className="h-4 w-4" /> New product
            </Link>
          </Button>
        }
      />

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 min-w-[220px] max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            aria-label="Search products"
            placeholder="Search name, slug or SKU"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={status ?? ALL} onValueChange={(v) => setParam("status", v === ALL ? undefined : v)}>
          <SelectTrigger className="w-[150px]" aria-label="Filter by status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All statuses</SelectItem>
            {PRODUCT_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {STATUS_LABELS[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={saleChannel ?? ALL} onValueChange={(v) => setParam("channel", v === ALL ? undefined : v)}>
          <SelectTrigger className="w-[160px]" aria-label="Filter by sale channel">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All channels</SelectItem>
            {SALE_CHANNELS.map((c) => (
              <SelectItem key={c} value={c}>
                {SALE_CHANNEL_LABELS[c]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={category ?? ALL} onValueChange={(v) => setParam("category", v === ALL ? undefined : v)}>
          <SelectTrigger className="w-[180px]" aria-label="Filter by category">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All categories</SelectItem>
            {categories.data?.map((c) => (
              <SelectItem key={c.id} value={c.slug}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {products.isError ? (
        <ErrorState message={products.error.message} onRetry={() => products.refetch()} />
      ) : (
        <div className="border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-14" />
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Channel</TableHead>
                <TableHead className="text-right">Base price</TableHead>
                <TableHead className="text-right">Variants</TableHead>
                <TableHead className="text-right">Available</TableHead>
                <TableHead className="text-right">Updated</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.isPending &&
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={9}>
                      <Skeleton className="h-8 w-full" />
                    </TableCell>
                  </TableRow>
                ))}
              {products.data?.items.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="py-10 text-center text-sm text-muted-foreground">
                    No products match these filters.
                  </TableCell>
                </TableRow>
              )}
              {products.data?.items.map((p) => (
                <TableRow
                  key={p.id}
                  className="cursor-pointer"
                  onClick={() => navigate(adminPaths.product(p.id))}
                >
                  <TableCell>
                    {p.image ? (
                      <img src={p.image} alt="" className="h-10 w-10 object-cover border border-border" />
                    ) : (
                      <div className="h-10 w-10 flex items-center justify-center border border-border text-muted-foreground">
                        <ImageOff className="h-4 w-4" />
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Link
                      to={adminPaths.product(p.id)}
                      className="font-medium text-foreground hover:text-primary"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {p.name}
                    </Link>
                    <div className="text-xs text-muted-foreground">{p.slug}</div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{p.category.name}</TableCell>
                  <TableCell>
                    <StatusBadge status={p.status} />
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-normal">
                      {SALE_CHANNEL_LABELS[p.saleChannel]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right tabular">{formatPaise(p.basePrice)}</TableCell>
                  <TableCell className="text-right tabular">{p.variantCount}</TableCell>
                  <TableCell className="text-right tabular">{p.totalAvailable}</TableCell>
                  <TableCell className="text-right text-xs text-muted-foreground tabular">
                    {new Date(p.updatedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 mt-4">
        <p className="text-xs text-muted-foreground tabular" aria-live="polite">
          {products.data ? `${total} product${total === 1 ? "" : "s"} · page ${shownPage} of ${pageCount}` : ""}
        </p>
        {pageCount > 1 && (
          <Pagination className="mx-0 w-auto justify-end">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  aria-disabled={page <= 1}
                  className={page <= 1 ? "pointer-events-none opacity-50" : undefined}
                  onClick={(e) => {
                    e.preventDefault();
                    if (page > 1) setParam("page", String(page - 1));
                  }}
                />
              </PaginationItem>
              <PaginationItem>
                <PaginationNext
                  href="#"
                  aria-disabled={page >= pageCount}
                  className={page >= pageCount ? "pointer-events-none opacity-50" : undefined}
                  onClick={(e) => {
                    e.preventDefault();
                    if (page < pageCount) setParam("page", String(page + 1));
                  }}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}
      </div>
    </div>
  );
}
