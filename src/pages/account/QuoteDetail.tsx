import { useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Loader2, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Field, FormError, FormNotice } from "@/components/shop/Field";
import { panelClass, primaryButtonClass, secondaryButtonClass, sectionTitleClass } from "@/components/shop/styles";
import QueryError from "@/features/catalog/components/QueryError";
import { formatPaise } from "@/features/catalog/format";
import { assetUrl } from "@/features/catalog/view";
import AccountLayout from "@/features/account/components/AccountLayout";
import { useAddresses, useCurrentUser } from "@/features/account/hooks";
import { formatDate } from "@/features/account/orders";
import { addressLines, type AddressInput } from "@/features/checkout/address";
import AddressStep from "@/features/checkout/components/AddressStep";
import FakePaymentDialog from "@/features/checkout/components/FakePaymentDialog";
import { usePayment } from "@/features/checkout/usePayment";
import type { PaymentMethod } from "@/features/checkout/types";
import QuoteStatusBadge from "@/features/quote/components/QuoteStatusBadge";
import { newIdempotencyKey, quoteErrorMessage, useAcceptQuote, useMyQuote } from "@/features/quote/hooks";
import { isQuoteExpired } from "@/features/quote/status";
import type { AcceptQuoteInput, QuoteDetail as QuoteDetailDto } from "@/features/quote/types";

const PAYMENT_LABELS: Record<PaymentMethod, { title: string; detail: string }> = {
  RAZORPAY: { title: "Pay online", detail: "UPI, cards, net banking and wallets via Razorpay." },
  BANK_TRANSFER: { title: "Bank transfer / PO", detail: "Approved business accounts. We'll share bank details; the order ships once paid." },
};

/** `/account/quotes/:number` — Kritex's response (per-line prices, validity) and Accept → order → payment. */
const QuoteDetail = () => {
  const { number = "" } = useParams<{ number: string }>();
  const { data: quote, isPending, isError, error, refetch } = useMyQuote(number);
  const crumbs = [
    { label: "Home", to: "/" },
    { label: "Account", to: "/account" },
    { label: "Quotes", to: "/account/quotes" },
    { label: number },
  ];

  if (isPending || isError) {
    return (
      <AccountLayout title={`Quote ${number}`} crumbs={crumbs}>
        {isPending ? (
          <div className="h-64 animate-pulse bg-muted/40" data-skeleton aria-label="Loading quote" />
        ) : error.status === 404 ? (
          <QueryError message="Quote not found." />
        ) : (
          <QueryError message="Couldn't load this quote." onRetry={() => refetch()} />
        )}
      </AccountLayout>
    );
  }

  const expired = isQuoteExpired(quote);
  const acceptable = quote.status === "QUOTED" && !expired;

  return (
    <AccountLayout title={`Quote ${quote.number}`} crumbs={crumbs}>
      <div className="flex flex-wrap items-center gap-3 mb-8">
        <QuoteStatusBadge status={quote.status} validUntil={quote.validUntil} />
        <span className="font-body text-xs text-muted-foreground">
          Requested {formatDate(quote.createdAt)}
          {quote.validUntil && quote.status === "QUOTED" ? ` · ${expired ? "expired" : "valid until"} ${formatDate(quote.validUntil)}` : ""}
        </span>
      </div>

      {quote.status === "REQUESTED" && (
        <FormNotice className="mb-8">We're preparing your quote. You'll get an email as soon as it's ready.</FormNotice>
      )}
      {quote.status === "REJECTED" && (
        <FormError className="mb-8">
          We couldn't quote this request{quote.responseMessage ? `: ${quote.responseMessage}` : "."} Contact us if you'd like to discuss it.
        </FormError>
      )}
      {expired && (
        <FormError className="mb-8">
          This quote has expired. <Link to="/legal/contact" className="underline">Contact us</Link> for an updated quote.
        </FormError>
      )}
      {quote.orderNumber && (
        <FormNotice className="mb-8">
          Ordered as{" "}
          <Link to={`/account/orders/${encodeURIComponent(quote.orderNumber)}`} className="text-primary underline">
            {quote.orderNumber}
          </Link>
          .
        </FormNotice>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-10 items-start">
        <div className="space-y-10 min-w-0">
          <QuoteItems quote={quote} />
          {quote.responseMessage && quote.status !== "REJECTED" && (
            <section>
              <h2 className={sectionTitleClass}>Message from Kritex</h2>
              <p className="font-body text-sm text-muted-foreground whitespace-pre-line">{quote.responseMessage}</p>
            </section>
          )}
          {acceptable && quote.quotedTotal != null && <AcceptQuote quote={quote} />}
        </div>

        <aside className="space-y-6">
          <div className={panelClass}>
            <h2 className={sectionTitleClass}>Quoted total</h2>
            <p className="font-display text-2xl text-foreground tabular" data-testid="quoted-total">
              {quote.quotedTotal != null ? formatPaise(quote.quotedTotal) : "Awaiting prices"}
            </p>
            <p className="font-body text-[11px] text-muted-foreground mt-1">Inclusive of GST. Delivery, if any, is added when you accept.</p>
          </div>
          <div className={panelClass}>
            <h2 className={sectionTitleClass}>Requested by</h2>
            <p className="font-body text-sm text-foreground">{quote.contactName}</p>
            <p className="font-body text-xs text-muted-foreground">{quote.organization}</p>
            <p className="font-body text-xs text-muted-foreground">{quote.email}</p>
            {quote.gstin && <p className="font-body text-xs text-muted-foreground mt-2">GSTIN {quote.gstin}</p>}
            {quote.notes && <p className="font-body text-xs text-muted-foreground mt-3 whitespace-pre-line">“{quote.notes}”</p>}
          </div>
        </aside>
      </div>
    </AccountLayout>
  );
};

const QuoteItems = ({ quote }: { quote: QuoteDetailDto }) => (
  <section>
    <h2 className={sectionTitleClass}>Items</h2>
    <ul className="border-t border-border">
      {quote.items.map((i) => (
        <li key={i.id} className="flex gap-4 border-b border-border py-4" data-testid="quote-item">
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
              {i.variantTitle && i.variantTitle !== "Default" ? `${i.variantTitle} · ` : i.variantId ? "" : "Any option · "}
              {i.quantity} × {i.quotedUnitPrice != null ? formatPaise(i.quotedUnitPrice) : "price pending"}
            </p>
            {i.requestedNotes && <p className="font-body text-[11px] text-muted-foreground/70 mt-1">Your note: {i.requestedNotes}</p>}
          </div>
          <p className="font-display text-sm text-foreground tabular">{i.lineTotal != null ? formatPaise(i.lineTotal) : "—"}</p>
        </li>
      ))}
    </ul>
  </section>
);

/** Accept: delivery address + payment method → `POST /me/quotes/:number/accept` → the usual payment flow. */
const AcceptQuote = ({ quote }: { quote: QuoteDetailDto }) => {
  const account = useCurrentUser();
  const addresses = useAddresses(account.isSignedIn);
  const accept = useAcceptQuote(quote.number);
  const payment = usePayment();
  const [shipping, setShipping] = useState<AddressInput | null>(null);
  const [method, setMethod] = useState<PaymentMethod>("RAZORPAY");
  const [poNumber, setPoNumber] = useState("");
  const attempt = useRef<{ key: string; body: string } | null>(null);
  const b2b = account.user?.businessProfile?.status === "APPROVED";
  const methods: PaymentMethod[] = b2b ? ["RAZORPAY", "BANK_TRANSFER"] : ["RAZORPAY"];

  const onAccept = () => {
    if (!shipping) return;
    const body: AcceptQuoteInput = {
      shippingAddress: shipping,
      paymentMethod: method,
      ...(poNumber.trim() ? { poNumber: poNumber.trim() } : {}),
    };
    const json = JSON.stringify(body);
    // Same key only for an identical retry (e.g. after a network error).
    if (!attempt.current || attempt.current.body !== json) attempt.current = { key: newIdempotencyKey(), body: json };
    accept.mutate(
      { body, idempotencyKey: attempt.current.key },
      {
        onSuccess: (placed) => {
          attempt.current = null;
          void payment.pay(placed);
        },
        onError: (err) => {
          if (err.status > 0 && err.status < 500) attempt.current = null;
        },
      },
    );
  };

  const busy = accept.isPending || payment.busy;
  const placed = accept.data;

  return (
    <section aria-label="Accept quote" className={cn(panelClass, "space-y-6")}>
      <div>
        <h2 className={sectionTitleClass}>Accept this quote</h2>
        <p className="font-body text-xs text-muted-foreground -mt-2">Choose where to deliver, then pay to confirm the order.</p>
      </div>

      {shipping ? (
        <div className="flex flex-wrap items-start justify-between gap-4 border border-border p-4">
          <div>
            <p className="font-display text-xs uppercase tracking-wider text-foreground">{shipping.name}</p>
            {addressLines(shipping).map((l) => (
              <p key={l} className="font-body text-xs text-muted-foreground mt-1">
                {l}
              </p>
            ))}
          </div>
          <button type="button" className="font-display text-xs text-primary" onClick={() => setShipping(null)} disabled={busy}>
            Change
          </button>
        </div>
      ) : account.isSignedIn && addresses.isPending ? (
        <p className="font-display text-xs text-muted-foreground">Loading saved addresses…</p>
      ) : (
        <AddressStep
          signedIn={false}
          saved={addresses.data ?? []}
          prefill={{ phone: quote.phone, name: quote.contactName }}
          onSubmit={(address) => setShipping(address)}
        />
      )}

      {shipping && (
        <>
          {methods.length > 1 && (
            <fieldset className="space-y-3">
              <legend className="font-display text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Payment method</legend>
              {methods.map((m) => (
                <label
                  key={m}
                  className={cn(
                    "flex cursor-pointer gap-3 border p-4 transition-colors duration-200",
                    method === m ? "border-primary bg-primary/5" : "border-border hover:border-primary/50",
                  )}
                >
                  <input
                    type="radio"
                    name="quote-payment-method"
                    value={m}
                    checked={method === m}
                    onChange={() => setMethod(m)}
                    className="mt-0.5 accent-[hsl(var(--primary))]"
                  />
                  <span>
                    <span className="block font-display text-xs uppercase tracking-wider text-foreground">{PAYMENT_LABELS[m].title}</span>
                    <span className="block font-body text-xs text-muted-foreground mt-1">{PAYMENT_LABELS[m].detail}</span>
                  </span>
                </label>
              ))}
            </fieldset>
          )}
          <Field
            label="Your PO number (optional)"
            value={poNumber}
            onChange={(e) => setPoNumber(e.target.value)}
            maxLength={64}
            className="max-w-sm"
          />
          {accept.isError && <FormError>{quoteErrorMessage(accept.error)}</FormError>}
          {payment.error && <FormError>{payment.error}</FormError>}
          <div className="flex flex-wrap items-center gap-4">
            <button type="button" onClick={onAccept} disabled={busy} className={primaryButtonClass}>
              {busy ? <Loader2 size={14} className="animate-spin" /> : <Lock size={14} />}
              {payment.phase === "verifying"
                ? "Confirming payment…"
                : method === "BANK_TRANSFER"
                  ? "Accept & Place Order"
                  : "Accept & Pay"}
            </button>
            <Link to="/legal/terms" className={cn(secondaryButtonClass, "border-0 px-0")}>
              Terms of sale
            </Link>
          </div>
        </>
      )}

      {placed?.razorpay && (
        <FakePaymentDialog
          open={payment.fakeOpen}
          amount={placed.razorpay.amount}
          orderNumber={placed.orderNumber}
          onChoose={payment.simulate}
        />
      )}
    </section>
  );
};

export default QuoteDetail;
