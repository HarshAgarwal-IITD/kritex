import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { linkButtonClass } from "@/components/shop/styles";
import QueryError from "@/features/catalog/components/QueryError";
import { formatPaise } from "@/features/catalog/format";
import { assetUrl } from "@/features/catalog/view";
import AccountLayout from "@/features/account/components/AccountLayout";
import StatusBadge from "@/features/account/components/StatusBadge";
import { ORDERS_PAGE_SIZE, useMyOrders } from "@/features/account/hooks";
import { formatDate } from "@/features/account/orders";

/** `/account/orders` */
const Orders = () => {
  const [page, setPage] = useState(1);
  const { data, isPending, isError, refetch } = useMyOrders(page);
  const pages = data ? Math.max(1, Math.ceil(data.total / ORDERS_PAGE_SIZE)) : 1;

  return (
    <AccountLayout title="Orders">
      {isPending ? (
        <div className="space-y-3" data-skeleton aria-label="Loading orders">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-20 animate-pulse bg-muted/40" />
          ))}
        </div>
      ) : isError ? (
        <QueryError message="Couldn't load your orders." onRetry={() => refetch()} />
      ) : data.items.length === 0 ? (
        <div className="border border-dashed border-border py-16 text-center">
          <p className="font-display text-sm text-muted-foreground">No orders yet.</p>
          <Link to="/products" className="mt-4 inline-block font-display text-xs text-primary">
            Browse products →
          </Link>
        </div>
      ) : (
        <>
          <ul className="border-t border-border" aria-label="Orders">
            {data.items.map((o) => (
              <li key={o.number} className="border-b border-border">
                <Link
                  to={`/account/orders/${encodeURIComponent(o.number)}`}
                  className="group flex items-center gap-4 py-4 hover:bg-white/[0.02] transition-colors duration-200"
                >
                  <div className="h-14 w-14 shrink-0 border border-border bg-neutral-100 p-1">
                    {o.image && <img src={assetUrl(o.image)} alt="" className="h-full w-full object-contain" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-display text-xs uppercase tracking-wider text-foreground">{o.number}</p>
                    <p className="font-body text-xs text-muted-foreground mt-1">
                      {formatDate(o.createdAt)} · {o.itemCount} {o.itemCount === 1 ? "item" : "items"}
                    </p>
                  </div>
                  <StatusBadge status={o.status} />
                  <p className="hidden sm:block w-28 text-right font-display text-sm text-foreground tabular">{formatPaise(o.total)}</p>
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

export default Orders;
