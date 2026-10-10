import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CheckCircle2, Loader2, LogIn, Send, X } from "lucide-react";
import ShopPage from "@/components/shop/ShopPage";
import { Field, FormError } from "@/components/shop/Field";
import { fieldClass, labelClass, panelClass, primaryButtonClass, secondaryButtonClass, sectionTitleClass } from "@/components/shop/styles";
import { assetUrl } from "@/features/catalog/view";
import { useCurrentUser } from "@/features/account/hooks";
import { gstinSchema, phoneSchema } from "@/features/checkout/address";
import { lineKey, MAX_QUOTE_QUANTITY, quoteCart, useQuoteCart } from "@/features/quote/store";
import { quoteErrorMessage, useCreateQuote } from "@/features/quote/hooks";
import { savePendingEnquiry } from "@/features/enquiry/pending";
import type { CreatedQuote, CreateQuoteInput, QuoteCartLine } from "@/features/quote/types";

const CRUMBS = [{ label: "Home", to: "/" }, { label: "Products", to: "/products" }, { label: "Request a Quote" }];

const rfqSchema = z.object({
  contactName: z.string().trim().min(2, "Enter your name").max(100),
  organization: z.string().trim().min(2, "Enter your company or organisation").max(200),
  phone: phoneSchema,
  gstin: z.union([z.literal(""), gstinSchema]),
  notes: z.string().trim().max(2000),
  /** Honeypot: hidden from people; bots fill it. */
  website: z.string(),
});
type RfqInput = z.input<typeof rfqSchema>;
type RfqValues = z.output<typeof rfqSchema>;

/** `/quote`: the quote cart + RFQ form → `POST /quotes` → confirmation. Sending needs a signed-in account (ADR-018). */
const QuotePage = () => {
  const lines = useQuoteCart();
  const [sent, setSent] = useState<{ quote: CreatedQuote; email: string } | null>(null);

  if (sent) return <QuoteSent quote={sent.quote} email={sent.email} />;

  return (
    <ShopPage title="Request a Quote" eyebrow="Bulk & institutional orders" crumbs={CRUMBS}>
      {lines.length === 0 ? (
        <div className="border border-dashed border-border py-20 text-center">
          <p className="font-display text-sm text-muted-foreground">Your quote request is empty.</p>
          <p className="font-body text-xs text-muted-foreground mt-2">Use “Add to Quote” on any product to build a request.</p>
          <Link to="/products" className="mt-4 inline-block font-display text-xs text-primary">
            Browse products →
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-10 items-start">
          <section aria-label="Items to quote">
            <h2 className={sectionTitleClass}>Items ({lines.length})</h2>
            <ul className="border-t border-border">
              {lines.map((l) => (
                <QuoteLine key={lineKey(l)} line={l} />
              ))}
            </ul>
            <p className="font-body text-[11px] text-muted-foreground mt-4">
              Prices are quoted per unit, GST-inclusive. We usually reply within one working day.
            </p>
          </section>
          <RfqPanel lines={lines} onSent={(quote, email) => setSent({ quote, email })} />
        </div>
      )}
    </ShopPage>
  );
};

const QuoteLine = ({ line }: { line: QuoteCartLine }) => {
  const label = line.productName;
  const [qty, setQty] = useState(String(line.quantity));
  const commitQty = () => {
    const n = Number(qty);
    if (Number.isInteger(n) && n >= 1) quoteCart.update(line, { quantity: n });
    setQty(String(Number.isInteger(n) && n >= 1 ? Math.min(n, MAX_QUOTE_QUANTITY) : line.quantity));
  };
  const variantText = line.variantTitle && line.variantTitle !== "Default" ? line.variantTitle : line.variantId ? null : "Any size / colour";

  return (
    <li className="flex gap-4 border-b border-border py-5" data-testid="quote-line">
      <div className="h-20 w-20 shrink-0 border border-border bg-neutral-100 p-1.5">
        {line.image && <img src={assetUrl(line.image)} alt="" className="h-full w-full object-contain" />}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <Link to={`/product/${line.productSlug}`} className="font-display text-xs uppercase tracking-wider text-foreground hover:text-primary">
              {line.productName}
            </Link>
            <p className="font-body text-xs text-muted-foreground mt-1">
              {variantText}
              {line.sku ? `${variantText ? " · " : ""}SKU ${line.sku}` : ""}
            </p>
          </div>
          <button
            type="button"
            onClick={() => quoteCart.remove(line)}
            aria-label={`Remove ${label} from quote`}
            className="text-muted-foreground hover:text-destructive transition-colors duration-200"
          >
            <X size={14} />
          </button>
        </div>
        <div className="mt-3 grid grid-cols-[110px_1fr] gap-3">
          <div>
            <label htmlFor={`qty-${lineKey(line)}`} className={labelClass}>
              Quantity
            </label>
            <input
              id={`qty-${lineKey(line)}`}
              type="number"
              inputMode="numeric"
              min={1}
              max={MAX_QUOTE_QUANTITY}
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              onBlur={commitQty}
              onKeyDown={(e) => e.key === "Enter" && commitQty()}
              aria-label={`Quantity for ${label}`}
              className={`${fieldClass} py-2 tabular`}
            />
          </div>
          <div>
            <label htmlFor={`notes-${lineKey(line)}`} className={labelClass}>
              Notes (sizes, colours, customisation)
            </label>
            <input
              id={`notes-${lineKey(line)}`}
              type="text"
              maxLength={500}
              defaultValue={line.notes ?? ""}
              onBlur={(e) => quoteCart.update(line, { notes: e.target.value.trim() || undefined })}
              aria-label={`Notes for ${label}`}
              className={`${fieldClass} py-2`}
            />
          </div>
        </div>
      </div>
    </li>
  );
};

type RfqProps = { lines: QuoteCartLine[]; onSent: (quote: CreatedQuote, email: string) => void };

/** Waits for the session check, then shows the form (guests fill it in and log in on submit). */
const RfqPanel = (props: RfqProps) => {
  const { user, isPending } = useCurrentUser();
  if (isPending) {
    return (
      <div className={panelClass} aria-busy="true">
        <p className="font-display text-xs text-muted-foreground">Loading…</p>
      </div>
    );
  }
  return <RfqForm {...props} email={user?.email ?? null} />;
};

/**
 * Signed in: sends straight away. Guest: saves the request and goes to log in; PendingEnquirySender
 * sends it once they're signed in (ADR-018) and they land on their quotes.
 */
const RfqForm = ({ lines, onSent, email }: RfqProps & { email: string | null }) => {
  const { user } = useCurrentUser();
  const navigate = useNavigate();
  const create = useCreateQuote();
  const form = useForm<RfqInput, unknown, RfqValues>({
    resolver: zodResolver(rfqSchema),
    values: {
      contactName: user?.name ?? "",
      organization: user?.businessProfile?.legalName ?? "",
      phone: user?.phone ?? "",
      gstin: user?.businessProfile?.gstin ?? "",
      notes: "",
      website: "",
    },
    resetOptions: { keepDirtyValues: true },
  });
  const { errors } = form.formState;

  const onSubmit = (v: RfqValues) => {
    // Pick up a quantity/note still being typed (inputs commit on blur).
    (document.activeElement as HTMLElement | null)?.blur?.();
    const current = quoteCart.get();
    const body: CreateQuoteInput = {
      contactName: v.contactName,
      organization: v.organization,
      phone: v.phone,
      ...(v.gstin ? { gstin: v.gstin } : {}),
      ...(v.notes ? { notes: v.notes } : {}),
      ...(v.website ? { website: v.website } : {}),
      items: (current.length ? current : lines).map((l) => ({
        productId: l.productId,
        quantity: l.quantity,
        ...(l.variantId ? { variantId: l.variantId } : {}),
        ...(l.notes ? { notes: l.notes } : {}),
      })),
    };
    if (!email) {
      savePendingEnquiry({ kind: "quote", body });
      navigate(`/login?next=${encodeURIComponent("/account/quotes")}`);
      return;
    }
    create.mutate(body, {
      onSuccess: (quote) => {
        quoteCart.clear();
        onSent(quote, email);
      },
    });
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate className={`${panelClass} relative space-y-5`} aria-label="Quote request">
      <h2 className={sectionTitleClass}>Your details</h2>
      <p className="font-body text-xs text-muted-foreground -mt-2">
        {email ? (
          <>
            We'll send the quote to <span className="text-foreground">{email}</span>.
          </>
        ) : (
          "You'll log in or create an account next. Your request is sent as soon as you're signed in, and the quote goes to your account email."
        )}
      </p>
      <Field label="Your name" autoComplete="name" error={errors.contactName?.message} {...form.register("contactName")} />
      <Field label="Company / organisation" autoComplete="organization" error={errors.organization?.message} {...form.register("organization")} />
      <Field
        label="Mobile number"
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        placeholder="98765 43210"
        error={errors.phone?.message}
        {...form.register("phone")}
      />
      <Field
        label="GSTIN (optional)"
        placeholder="27AAPFU0939F1ZV"
        hint="For a GST invoice in your company's name."
        error={errors.gstin?.message}
        {...form.register("gstin")}
      />
      <div>
        <label htmlFor="rfq-notes" className={labelClass}>
          Notes (optional)
        </label>
        <textarea
          id="rfq-notes"
          rows={4}
          maxLength={2000}
          placeholder="Delivery location, deadline, branding, tender reference…"
          className={`${fieldClass} resize-none`}
          {...form.register("notes")}
        />
      </div>
      {/* Honeypot (bots only). */}
      <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>
          Website
          <input type="text" tabIndex={-1} autoComplete="off" {...form.register("website")} />
        </label>
      </div>
      {create.isError && <FormError>{quoteErrorMessage(create.error)}</FormError>}
      <button type="submit" className={`${primaryButtonClass} w-full`} disabled={create.isPending}>
        {create.isPending ? <Loader2 size={14} className="animate-spin" /> : email ? <Send size={14} /> : <LogIn size={14} />}
        {email ? "Send Quote Request" : "Log In & Send Request"}
      </button>
    </form>
  );
};

const QuoteSent = ({ quote, email }: { quote: CreatedQuote; email: string }) => {
  return (
    <ShopPage title="Quote request sent" crumbs={CRUMBS} hideHeading>
      <div className="max-w-2xl">
        <div className="flex items-center gap-3 mb-3">
          <CheckCircle2 size={18} className="text-primary" />
          <p className="font-display text-xs text-primary">Request received</p>
        </div>
        <h1 className="text-3xl md:text-5xl font-bold text-foreground mb-4">Thank you</h1>
        <p className="font-body text-sm text-muted-foreground">
          Your quote request <span className="font-display text-foreground" data-testid="quote-number">{quote.number}</span> is with our
          procurement team. We'll email the quote to <span className="text-foreground">{email}</span>, usually within one working day.
        </p>
      </div>
      <div className="mt-10 flex flex-wrap gap-3">
        <Link to={`/account/quotes/${encodeURIComponent(quote.number)}`} className={secondaryButtonClass}>
          View Quote
        </Link>
        <Link to="/products" className={primaryButtonClass}>
          Continue Browsing
        </Link>
      </div>
    </ShopPage>
  );
};

export default QuotePage;
