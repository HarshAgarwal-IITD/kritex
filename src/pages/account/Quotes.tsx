import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { linkButtonClass } from "@/components/shop/styles";
import QueryError from "@/features/catalog/components/QueryError";
import { formatPaise } from "@/features/catalog/format";
import AccountLayout from "@/features/account/components/AccountLayout";
import { formatDate } from "@/features/account/orders";
import QuoteStatusBadge from "@/features/quote/components/QuoteStatusBadge";
import { useMyQuotes } from "@/features/quote/hooks";

const PAGE_SIZE = 20;

/** `/account/quotes` */
const Quotes = () => {
  const [page, setPage] = useState(1);
  const { data, isPending, isError, refetch } = useMyQuotes(page);
  const pages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1;

  return (
    <AccountLayout title="Quotes">
      {isPending ? (
        <div className="space-y-3" data-skeleton aria-label="Loading quotes">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-20 animate-pulse bg-muted/40" />
          ))}
        </div>
      ) : isError ? (
        <QueryError message="Couldn't load your quotes." onRetry={() => refetch()} />
      ) : data.items.length === 0 ? (
        <div className="border border-dashed border-border py-16 text-center">
          <p className="font-display text-sm text-muted-foreground">No quote requests yet.</p>
          <Link to="/products" className="mt-4 inline-block font-display text-xs text-primary">
            Browse products and add them to a quote →
          </Link>
        </div>
      ) : (
        <>
          <ul className="border-t border-border" aria-label="Quotes">
            {data.items.map((q) => (
              <li key={q.number} className="border-b border-border">
                <Link
                  to={`/account/quotes/${encodeURIComponent(q.number)}`}
                  className="group flex items-center gap-4 py-4 hover:bg-white/[0.02] transition-colors duration-200"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-display text-xs uppercase tracking-wider text-foreground">{q.number}</p>
                    <p className="font-body text-xs text-muted-foreground mt-1">
                      {formatDate(q.createdAt)} · {q.organization} · {q.itemCount} {q.itemCount === 1 ? "item" : "items"}
                      {q.validUntil && q.status === "QUOTED" ? ` · valid until ${formatDate(q.validUntil)}` : ""}
                    </p>
                  </div>
                  <QuoteStatusBadge status={q.status} validUntil={q.validUntil} />
                  <p className="hidden sm:block w-28 text-right font-display text-sm text-foreground tabular">
                    {q.quotedTotal != null ? formatPaise(q.quotedTotal) : "—"}
                  </p>
                  <ChevronRight size={14} className="text-muted-foreground group-hover:text-primary" />
                </Link>
              </li>
            ))}
          </ul>
          {pages > 1 && (
            <div className="mt-6 flex items-center justify-between">
              <button type="button" className={linkButtonClass} disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                ← Newer
              </button>
              <span className="font-display text-[10px] text-muted-foreground">
                Page {page} of {pages}
              </span>
              <button type="button" className={linkButtonClass} disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>
                Older →
              </button>
            </div>
          )}
        </>
      )}
    </AccountLayout>
  );
};

export default Quotes;
