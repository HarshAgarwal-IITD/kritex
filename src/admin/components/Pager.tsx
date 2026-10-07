import { Pagination, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";

/** List footer: "N things · page x of y" plus previous/next links. */
export function Pager({
  total,
  page,
  limit,
  noun,
  loaded,
  onPage,
}: {
  total: number;
  page: number;
  limit: number;
  noun: [string, string];
  loaded: boolean;
  onPage: (page: number) => void;
}) {
  const pageCount = Math.max(1, Math.ceil(total / limit));
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 mt-4">
      <p className="text-xs text-muted-foreground tabular" aria-live="polite">
        {loaded ? `${total} ${total === 1 ? noun[0] : noun[1]} · page ${page} of ${pageCount}` : ""}
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
                  if (page > 1) onPage(page - 1);
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
                  if (page < pageCount) onPage(page + 1);
                }}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
}
