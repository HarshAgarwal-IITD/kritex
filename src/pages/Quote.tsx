import { useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CheckCircle2, Loader2, Send, X } from "lucide-react";
import ShopPage from "@/components/shop/ShopPage";
import { Field, FormError } from "@/components/shop/Field";
import { fieldClass, labelClass, panelClass, primaryButtonClass, secondaryButtonClass, sectionTitleClass } from "@/components/shop/styles";
import { assetUrl } from "@/features/catalog/view";
import { useCurrentUser } from "@/features/account/hooks";
import { gstinSchema, phoneSchema } from "@/features/checkout/address";
import { lineKey, MAX_QUOTE_QUANTITY, quoteCart, useQuoteCart } from "@/features/quote/store";
import { quoteErrorMessage, useCreateQuote } from "@/features/quote/hooks";
import type { CreatedQuote, CreateQuoteInput, QuoteCartLine } from "@/features/quote/types";

const CRUMBS = [{ label: "Home", to: "/" }, { label: "Products", to: "/products" }, { label: "Request a Quote" }];

const rfqSchema = z.object({
  contactName: z.string().trim().min(2, "Enter your name").max(100),
  organization: z.string().trim().min(2, "Enter your company or organisation").max(200),
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  phone: phoneSchema,
  gstin: z.union([z.literal(""), gstinSchema]),
  notes: z.string().trim().max(2000),
  /** Honeypot: hidden from people; bots fill it. */
  website: z.string(),
});
type RfqInput = z.input<typeof rfqSchema>;
type RfqValues = z.output<typeof rfqSchema>;

/** `/quote`: the quote cart + RFQ form → `POST /quotes` → confirmation. */
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
          <RfqForm lines={lines} onSent={(quote, email) => setSent({ quote, email })} />
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

const RfqForm = ({ lines, onSent }: { lines: QuoteCartLine[]; onSent: (quote: CreatedQuote, email: string) => void }) => {
  const { user } = useCurrentUser();
  const create = useCreateQuote();
  const form = useForm<RfqInput, unknown, RfqValues>({
    resolver: zodResolver(rfqSchema),
    values: {
      contactName: user?.name ?? "",
      organization: user?.businessProfile?.legalName ?? "",
      email: user?.email ?? "",
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
      email: v.email,
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
    create.mutate(body, {
      onSuccess: (quote) => {
        quoteCart.clear();
        onSent(quote, v.email);
      },
    });
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate className={`${panelClass} relative space-y-5`} aria-label="Quote request">
      <h2 className={sectionTitleClass}>Your details</h2>
      {!user && (
        <p className="font-body text-xs text-muted-foreground -mt-2">
          Have an account?{" "}
          <Link to="/login?next=%2Fquote" className="text-primary hover:text-primary/80">
            Log in
          </Link>{" "}
          to follow your quotes online.
        </p>
      )}
      <Field label="Your name" autoComplete="name" error={errors.contactName?.message} {...form.register("contactName")} />
      <Field label="Company / organisation" autoComplete="organization" error={errors.organization?.message} {...form.register("organization")} />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <Field label="Email" type="email" autoComplete="email" error={errors.email?.message} {...form.register("email")} />
        <Field
          label="Mobile number"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="98765 43210"
          error={errors.phone?.message}
          {...form.register("phone")}
        />
      </div>
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
        {create.isPending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
        Send Quote Request
      </button>
    </form>
  );
};

const QuoteSent = ({ quote, email }: { quote: CreatedQuote; email: string }) => {
  const { isSignedIn } = useCurrentUser();
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
        {!isSignedIn && (
          <p className="font-body text-sm text-muted-foreground mt-4">
            To accept the quote and pay online, <Link to="/signup" className="text-primary">create an account</Link> or{" "}
            <Link to="/login?next=%2Faccount%2Fquotes" className="text-primary">log in</Link> with this email.
          </p>
        )}
      </div>
      <div className="mt-10 flex flex-wrap gap-3">
        {isSignedIn && (
          <Link to={`/account/quotes/${encodeURIComponent(quote.number)}`} className={secondaryButtonClass}>
            View Quote
          </Link>
        )}
        <Link to="/products" className={primaryButtonClass}>
          Continue Browsing
        </Link>
      </div>
    </ShopPage>
  );
};

export default QuotePage;
