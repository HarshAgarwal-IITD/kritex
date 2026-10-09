import { Link, useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import ShopPage from "@/components/shop/ShopPage";
import { Field, FormError } from "@/components/shop/Field";
import { panelClass, primaryButtonClass, sectionTitleClass } from "@/components/shop/styles";
import StatusBadge from "@/features/account/components/StatusBadge";
import { formatDate, formatDateTime } from "@/features/account/orders";
import QueryError from "@/features/catalog/components/QueryError";
import ShipmentCard from "@/features/quote/components/ShipmentCard";
import { useOrderTracking } from "@/features/quote/hooks";

/** Router state for links into the tracking page (keeps the email out of the URL). */
export interface TrackState {
  email?: string;
}

const lookupSchema = z.object({
  number: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z0-9-]{3,32}$/, "Enter your order number, e.g. KTX-100001"),
  email: z.string().trim().toLowerCase().email("Enter the email used for the order"),
});
type LookupInput = z.input<typeof lookupSchema>;
type LookupValues = z.output<typeof lookupSchema>;

const crumbs = (last?: string) => [
  { label: "Home", to: "/" },
  ...(last ? [{ label: "Track order", to: "/track" }, { label: last }] : [{ label: "Track order" }]),
];

const LookupForm = ({ number = "", email = "", className }: { number?: string; email?: string; className?: string }) => {
  const navigate = useNavigate();
  const form = useForm<LookupInput, unknown, LookupValues>({ resolver: zodResolver(lookupSchema), defaultValues: { number, email } });
  const { errors } = form.formState;
  const onSubmit = (v: LookupValues) =>
    navigate(`/track/${encodeURIComponent(v.number)}`, { state: { email: v.email } satisfies TrackState });

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate className={cn(panelClass, "max-w-xl space-y-5", className)} aria-label="Find your order">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <Field label="Order number" placeholder="KTX-100001" autoComplete="off" error={errors.number?.message} {...form.register("number")} />
        <Field label="Email" type="email" autoComplete="email" error={errors.email?.message} {...form.register("email")} />
      </div>
      <button type="submit" className={primaryButtonClass}>
        <Search size={14} />
        Track Order
      </button>
    </form>
  );
};

/** `/track`: order number + email lookup. */
export const TrackLookup = () => (
  <ShopPage title="Track your order" eyebrow="Order status" crumbs={crumbs()}>
    <p className="font-body text-sm text-muted-foreground max-w-xl mb-8">
      Enter your order number (from the confirmation email) and the email you ordered with.
    </p>
    <LookupForm />
  </ShopPage>
);

/** `/track/:orderNumber`: public tracking. The email comes from router state, `?email=` (emailed links) or the form. */
export const TrackOrder = () => {
  const { orderNumber = "" } = useParams<{ orderNumber: string }>();
  const number = orderNumber.toUpperCase();
  const [params] = useSearchParams();
  const state = (useLocation().state ?? {}) as TrackState;
  const email = state.email ?? params.get("email");
  const tracking = useOrderTracking(number, email);

  if (!email) {
    return (
      <ShopPage title={`Track ${number}`} eyebrow="Order status" crumbs={crumbs(number)}>
        <p className="font-body text-sm text-muted-foreground max-w-xl mb-8">Confirm the email you ordered with to see this order's status.</p>
        <LookupForm number={number} />
      </ShopPage>
    );
  }

  if (tracking.isPending) {
    return (
      <ShopPage title={`Track ${number}`} eyebrow="Order status" crumbs={crumbs(number)}>
        <div className="h-64 animate-pulse bg-muted/40" data-skeleton aria-label="Loading tracking" />
      </ShopPage>
    );
  }

  if (tracking.isError) {
    const notFound = tracking.error.status === 404 || tracking.error.status === 400;
    return (
      <ShopPage title={`Track ${number}`} eyebrow="Order status" crumbs={crumbs(number)}>
        {notFound ? (
          <>
            <FormError className="max-w-xl mb-6">We couldn't find an order with that number and email. Check both and try again.</FormError>
            <LookupForm number={number} email={email} />
          </>
        ) : tracking.error.status === 429 ? (
          <FormError className="max-w-xl">Too many lookups. Please wait a minute and try again.</FormError>
        ) : (
          <QueryError message="Couldn't load tracking right now." onRetry={() => tracking.refetch()} />
        )}
      </ShopPage>
    );
  }

  const t = tracking.data;
  const timeline = [...t.timeline].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  return (
    <ShopPage title={`Order ${t.orderNumber}`} eyebrow="Order status" crumbs={crumbs(t.orderNumber)}>
      <div className="flex flex-wrap items-center gap-3 mb-10">
        <StatusBadge status={t.status} />
        <span className="font-body text-xs text-muted-foreground">Placed {formatDate(t.placedAt)}</span>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-10 items-start">
        <section>
          <h2 className={sectionTitleClass}>Shipments</h2>
          {t.shipments.length === 0 ? (
            <p className="font-body text-sm text-muted-foreground border border-dashed border-border p-6">
              Your order hasn't shipped yet. We'll email you the tracking details as soon as it leaves our warehouse.
            </p>
          ) : (
            <div className="space-y-4">
              {t.shipments.map((s) => (
                <ShipmentCard key={s.id} shipment={s} />
              ))}
            </div>
          )}
        </section>
        <aside className={panelClass}>
          <h2 className={sectionTitleClass}>Order timeline</h2>
          <ol className="relative ml-1 border-l border-border" aria-label="Order timeline">
            {timeline.map((e, idx) => (
              <li key={`${e.type}-${e.createdAt}-${idx}`} className="relative pb-5 pl-6 last:pb-0">
                <span
                  className={cn(
                    "absolute -left-[5px] top-1 h-2.5 w-2.5 rounded-full border border-background",
                    idx === timeline.length - 1 ? "bg-primary" : "bg-muted-foreground/50",
                  )}
                  aria-hidden
                />
                <p className="font-body text-sm text-foreground">{e.message}</p>
                <p className="font-display text-[10px] text-muted-foreground mt-1">{formatDateTime(e.createdAt)}</p>
              </li>
            ))}
          </ol>
        </aside>
      </div>
      <p className="font-body text-xs text-muted-foreground mt-10">
        Questions about this order? <Link to="/legal/contact" className="text-primary">Contact us</Link> with the order number.
      </p>
    </ShopPage>
  );
};
