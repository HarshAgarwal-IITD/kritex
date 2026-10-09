import { Link, useParams } from "react-router-dom";
import { ExternalLink, FileText, Loader2, Truck } from "lucide-react";
import { cn } from "@/lib/utils";
import { FormError } from "@/components/shop/Field";
import { panelClass, secondaryButtonClass, sectionTitleClass } from "@/components/shop/styles";
import QueryError from "@/features/catalog/components/QueryError";
import { formatPaise } from "@/features/catalog/format";
import { assetUrl } from "@/features/catalog/view";
import TotalsSummary from "@/features/cart/components/TotalsSummary";
import { addressLines } from "@/features/checkout/address";
import { formatPhone } from "@/features/checkout/india";
import AccountLayout from "@/features/account/components/AccountLayout";
import StatusBadge from "@/features/account/components/StatusBadge";
import { CancelOrderDialog, ReturnRequestDialog } from "@/features/account/components/OrderActions";
import PayNowButton from "@/features/account/components/PayNowButton";
import { useInvoiceLink, useMyOrder } from "@/features/account/hooks";
import { formatDate, formatDateTime } from "@/features/account/orders";

/** `/account/orders/:number` — items, totals, addresses, timeline, shipments, invoice, cancel / return. */
const OrderDetail = () => {
  const { number = "" } = useParams<{ number: string }>();
  const { data: order, isPending, isError, error, refetch } = useMyOrder(number);
  const invoice = useInvoiceLink();
  const crumbs = [
    { label: "Home", to: "/" },
    { label: "Account", to: "/account" },
    { label: "Orders", to: "/account/orders" },
    { label: number },
  ];

  if (isPending || isError) {
    return (
      <AccountLayout title={`Order ${number}`} crumbs={crumbs}>
        {isPending ? (
          <div className="h-64 animate-pulse bg-muted/40" data-skeleton aria-label="Loading order" />
        ) : error.status === 404 ? (
          <QueryError message="Order not found." />
        ) : (
          <QueryError message="Couldn't load this order." onRetry={() => refetch()} />
        )}
      </AccountLayout>
    );
  }

  const openInvoice = () =>
    invoice.mutate(order.number, {
      // The signed URL is short-lived, so fetch it on click and go straight to it (a popup opened after an await gets blocked).
      onSuccess: (link) => window.location.assign(link.url),
    });

  return (
    <AccountLayout title={`Order ${order.number}`} crumbs={crumbs}>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <StatusBadge status={order.status} />
          <span className="font-body text-xs text-muted-foreground">Placed {formatDate(order.createdAt)}</span>
        </div>
        <div className="flex flex-wrap gap-3">
          {order.invoice && (
            <button type="button" className={secondaryButtonClass} onClick={openInvoice} disabled={invoice.isPending}>
              {invoice.isPending ? <Loader2 size={14} className="animate-spin" /> : <FileText size={14} />}
              Invoice {order.invoice.number}
            </button>
          )}
          {!["PENDING_PAYMENT", "AWAITING_PAYMENT", "CANCELLED"].includes(order.status) && (
            <Link to={`/track/${encodeURIComponent(order.number)}`} state={{ email: order.email }} className={secondaryButtonClass}>
              <Truck size={14} />
              Track order
            </Link>
          )}
          {order.canCancel && <CancelOrderDialog order={order} />}
          {order.canRequestReturn && <ReturnRequestDialog order={order} />}
        </div>
      </div>
      {invoice.isError && <FormError className="mb-6">Couldn't get the invoice. Please try again.</FormError>}
      {order.status === "PENDING_PAYMENT" && (
        <FormError className="mb-6">
          This order hasn't been paid
          {order.reservedUntil ? ` and will be cancelled automatically after ${formatDateTime(order.reservedUntil)}` : ""}.
        </FormError>
      )}
      {order.status === "AWAITING_PAYMENT" && (
        <FormError className="mb-6">
          Awaiting your bank transfer (quote {order.number} as the reference)
          {order.reservedUntil ? `. Pay by ${formatDateTime(order.reservedUntil)} or the order is cancelled automatically` : ""}.
        </FormError>
      )}
      {order.status === "PENDING_PAYMENT" && order.paymentMethod === "RAZORPAY" && (
        <div className="mb-6">
          <PayNowButton orderNumber={order.number} total={order.totals.total} />
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-10 items-start">
        <div className="space-y-10">
          <section>
            <h2 className={sectionTitleClass}>Items</h2>
            <ul className="border-t border-border">
              {order.items.map((i) => (
                <li key={i.id} className="flex gap-4 border-b border-border py-4">
                  <div className="h-16 w-16 shrink-0 border border-border bg-neutral-100 p-1">
                    {i.image && <img src={assetUrl(i.image)} alt="" className="h-full w-full object-contain" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    {i.productSlug ? (
                      <Link to={`/product/${i.productSlug}`} className="font-display text-xs uppercase tracking-wider text-foreground hover:text-primary">
                        {i.productName}
                      </Link>
                    ) : (
                      <p className="font-display text-xs uppercase tracking-wider text-foreground">{i.productName}</p>
                    )}
                    <p className="font-body text-xs text-muted-foreground mt-1">
                      {i.variantTitle && i.variantTitle !== "Default" ? `${i.variantTitle} · ` : ""}
                      {i.quantity} × {formatPaise(i.unitPrice)}
                    </p>
                    <p className="font-body text-[11px] text-muted-foreground/60 mt-1">
                      SKU {i.sku}
                      {i.hsnCode ? ` · HSN ${i.hsnCode}` : ""} · GST {i.gstRate}% ({formatPaise(i.taxAmount)} incl.)
                    </p>
                  </div>
                  <p className="font-display text-sm text-foreground tabular">{formatPaise(i.lineTotal)}</p>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className={sectionTitleClass}>Timeline</h2>
            <ol className="relative ml-1 border-l border-border" aria-label="Order timeline">
              {order.timeline.map((e, idx) => (
                <li key={`${e.type}-${e.createdAt}-${idx}`} className="relative pb-6 pl-6 last:pb-0">
                  <span
                    className={cn(
                      "absolute -left-[5px] top-1 h-2.5 w-2.5 rounded-full border border-background",
                      idx === order.timeline.length - 1 ? "bg-primary" : "bg-muted-foreground/50",
                    )}
                    aria-hidden
                  />
                  <p className="font-body text-sm text-foreground">{e.message}</p>
                  <p className="font-display text-[10px] text-muted-foreground mt-1">{formatDateTime(e.createdAt)}</p>
                </li>
              ))}
            </ol>
          </section>

          {order.shipments.length > 0 && (
            <section>
              <h2 className={sectionTitleClass}>Shipments</h2>
              <ul className="space-y-4">
                {order.shipments.map((s) => (
                  <li key={s.id} className="border border-border p-4">
                    <p className="font-display text-xs uppercase tracking-wider text-foreground">
                      {s.carrier ?? "Courier"} {s.awb ? `· AWB ${s.awb}` : ""}
                    </p>
                    <p className="font-body text-xs text-muted-foreground mt-1">
                      {s.status.replace(/_/g, " ").toLowerCase()}
                      {s.shippedAt ? ` · shipped ${formatDate(s.shippedAt)}` : ""}
                      {s.deliveredAt ? ` · delivered ${formatDate(s.deliveredAt)}` : ""}
                    </p>
                    {s.trackingUrl && (
                      <a
                        href={s.trackingUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-2 inline-flex items-center gap-1 font-display text-xs text-primary hover:text-primary/80"
                      >
                        Track shipment <ExternalLink size={12} />
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        <aside className="space-y-6">
          <div className={panelClass}>
            <h2 className={sectionTitleClass}>Payment</h2>
            <TotalsSummary totals={order.totals} couponCode={order.couponCode} mode="final" />
          </div>
          <div className={panelClass}>
            <h2 className={sectionTitleClass}>Delivery</h2>
            <p className="font-body text-sm text-foreground">{order.shippingAddress.name}</p>
            {addressLines(order.shippingAddress).map((l) => (
              <p key={l} className="font-body text-xs text-muted-foreground">
                {l}
              </p>
            ))}
            <p className="font-body text-xs text-muted-foreground mt-1">{formatPhone(order.shippingAddress.phone)}</p>
            {order.gstin && (
              <p className="font-body text-xs text-muted-foreground mt-4">
                GST invoice to {order.businessName} · {order.gstin}
              </p>
            )}
          </div>
        </aside>
      </div>
    </AccountLayout>
  );
};

export default OrderDetail;
