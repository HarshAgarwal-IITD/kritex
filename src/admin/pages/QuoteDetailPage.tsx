import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useFieldArray, useForm, useWatch, type Control } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Ban, Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useProduct } from "@/features/catalog/hooks";
import { useAdminQuote, useQuoteAction } from "../api/quotes";
import type { AdminQuote, AdminQuoteItem } from "../api/types";
import { formatPaise, normaliseRupees, paiseToRupees, RUPEES_PATTERN, rupeesToPaise } from "../lib/money";
import { formatDate, formatDateTime } from "../lib/format";
import { adminPaths } from "../paths";
import { ErrorState, PageHeader } from "../components/PageState";
import { Section } from "../components/Section";
import { QuoteStatusBadge } from "../components/Badges";
import { FormDialog } from "../orders/OrderActionDialogs";

export default function QuoteDetailPage() {
  const { id } = useParams<{ id: string }>();
  const quote = useAdminQuote(id);

  if (quote.isError) {
    return (
      <div className="space-y-4">
        <BackLink />
        <ErrorState
          message={quote.error.status === 404 ? "This quote doesn't exist." : quote.error.message}
          onRetry={quote.error.status === 404 ? undefined : () => quote.refetch()}
        />
      </div>
    );
  }
  if (!quote.data) {
    return (
      <div className="space-y-4" aria-busy="true">
        <BackLink />
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }
  return <QuoteDetail quote={quote.data} />;
}

const BackLink = () => (
  <Link to={adminPaths.quotes} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
    <ArrowLeft className="h-3 w-3" /> Quotes
  </Link>
);

const canRespond = (q: AdminQuote) => q.status === "REQUESTED" || q.status === "QUOTED";

function QuoteDetail({ quote }: { quote: AdminQuote }) {
  const [rejecting, setRejecting] = useState(false);
  return (
    <div className="space-y-6">
      <BackLink />
      <PageHeader
        title={quote.number}
        description={`Requested ${formatDateTime(quote.createdAt)}${quote.respondedAt ? ` · responded ${formatDateTime(quote.respondedAt)}` : ""}`}
        actions={
          canRespond(quote) && (
            <Button variant="outline" className="font-display text-xs text-destructive" onClick={() => setRejecting(true)}>
              <Ban className="h-4 w-4" /> Decline
            </Button>
          )
        }
      />
      <div className="flex flex-wrap items-center gap-2 -mt-4">
        <QuoteStatusBadge status={quote.status} />
        {quote.validUntil && <span className="text-xs text-muted-foreground">Valid until {formatDate(quote.validUntil)}</span>}
        {quote.orderNumber && quote.orderId && (
          <Link to={adminPaths.order(quote.orderId)} className="text-xs text-primary hover:underline">
            Order {quote.orderNumber}
          </Link>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {canRespond(quote) ? <RespondForm quote={quote} /> : <ItemsSection quote={quote} />}
          {quote.responseMessage && !canRespond(quote) && (
            <Section title={quote.status === "REJECTED" ? "Reason given" : "Message sent"}>
              <p className="text-sm whitespace-pre-line">{quote.responseMessage}</p>
            </Section>
          )}
        </div>
        <CustomerSection quote={quote} />
      </div>

      <RejectDialog quote={quote} open={rejecting} onClose={() => setRejecting(false)} />
    </div>
  );
}

function CustomerSection({ quote }: { quote: AdminQuote }) {
  return (
    <Section title="Customer">
      <div className="space-y-1 text-sm">
        <p className="font-medium">{quote.organization}</p>
        <p>{quote.contactName}</p>
        <p className="break-all">{quote.email}</p>
        <p className="text-muted-foreground">{quote.phone}</p>
        {quote.gstin && <p className="tabular">GSTIN {quote.gstin}</p>}
        {quote.userId ? (
          <Link to={adminPaths.customer(quote.userId)} className="text-xs text-primary hover:underline">
            View customer
          </Link>
        ) : (
          <p className="text-xs text-muted-foreground">Guest request (accepting needs an account with this email)</p>
        )}
      </div>
      {quote.notes && (
        <div className="space-y-1">
          <h3 className="font-display text-xs text-muted-foreground">Customer notes</h3>
          <p className="text-sm whitespace-pre-line">{quote.notes}</p>
        </div>
      )}
    </Section>
  );
}

const variantText = (i: AdminQuoteItem) => (i.variantTitle ? `${i.variantTitle}${i.sku ? ` · ${i.sku}` : ""}` : "Any variant");

function ItemsSection({ quote }: { quote: AdminQuote }) {
  return (
    <Section title="Items" description="Unit prices are GST-inclusive.">
      <div className="border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead className="text-right">Qty</TableHead>
              <TableHead className="text-right">Unit</TableHead>
              <TableHead className="text-right">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {quote.items.map((i) => (
              <TableRow key={i.id}>
                <TableCell>
                  <div className="font-medium">{i.productName}</div>
                  <div className="text-xs text-muted-foreground">{variantText(i)}</div>
                  {i.requestedNotes && <div className="text-xs text-muted-foreground">“{i.requestedNotes}”</div>}
                </TableCell>
                <TableCell className="text-right tabular">{i.quantity}</TableCell>
                <TableCell className="text-right tabular">{formatPaise(i.quotedUnitPrice)}</TableCell>
                <TableCell className="text-right tabular">{formatPaise(i.lineTotal)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooter className="bg-transparent">
            <TableRow>
              <TableCell colSpan={3} className="text-right font-medium">
                Quoted total (excl. shipping)
              </TableCell>
              <TableCell className="text-right tabular font-medium">{formatPaise(quote.quotedTotal)}</TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </div>
    </Section>
  );
}

// ---------------------------------------------------------------------------------------------
// Respond

const pad = (n: number) => String(n).padStart(2, "0");
const toDay = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
/** "YYYY-MM-DD" → the last instant of that local day (a quote is valid through the chosen day). */
const endOfDayIso = (day: string) => {
  const [y, m, d] = day.split("-").map(Number);
  return new Date(y, m - 1, d, 23, 59, 59, 999).toISOString();
};

const respondSchema = z.object({
  lines: z.array(
    z
      .object({
        itemId: z.string(),
        needsVariant: z.boolean(),
        variantId: z.string(),
        price: z
          .string()
          .refine((s) => RUPEES_PATTERN.test(normaliseRupees(s)), "Enter a unit price like 1299 or 1299.50")
          .refine((s) => !RUPEES_PATTERN.test(normaliseRupees(s)) || (rupeesToPaise(s) ?? 0) >= 1, "Price must be above ₹0"),
      })
      .refine((l) => !l.needsVariant || l.variantId !== "", { path: ["variantId"], message: "Pick the variant to supply" }),
  ),
  validUntil: z
    .string()
    .min(1, "Choose a validity date")
    .refine((d) => d >= toDay(new Date()), "Validity must be today or later"),
  message: z.string().max(2000),
});
type RespondValues = z.infer<typeof respondSchema>;

const defaultsFor = (q: AdminQuote): RespondValues => {
  const in14 = new Date();
  in14.setDate(in14.getDate() + 14);
  return {
    lines: q.items.map((i) => ({ itemId: i.id, needsVariant: !i.variantId, variantId: "", price: paiseToRupees(i.quotedUnitPrice) })),
    validUntil: q.validUntil && q.status === "QUOTED" ? toDay(new Date(q.validUntil)) : toDay(in14),
    message: q.responseMessage ?? "",
  };
};

function RespondForm({ quote }: { quote: AdminQuote }) {
  const action = useQuoteAction(quote.id);
  const form = useForm<RespondValues>({ resolver: zodResolver(respondSchema), defaultValues: defaultsFor(quote) });
  const { fields } = useFieldArray({ control: form.control, name: "lines" });
  const lines = useWatch({ control: form.control, name: "lines" });
  useEffect(() => {
    form.reset(defaultsFor(quote));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quote.id, quote.status]);

  const paise = (s: string | undefined) => (s && RUPEES_PATTERN.test(normaliseRupees(s)) ? rupeesToPaise(s) : null);
  const total = quote.items.reduce<number | null>((sum, item, idx) => {
    const p = paise(lines?.[idx]?.price);
    return sum == null || p == null ? null : sum + p * item.quantity;
  }, 0);

  const onSubmit = (v: RespondValues) =>
    action.mutate(
      {
        kind: "respond",
        body: {
          items: v.lines.map((l) => ({
            itemId: l.itemId,
            quotedUnitPrice: rupeesToPaise(l.price)!,
            ...(l.needsVariant && l.variantId ? { variantId: l.variantId } : {}),
          })),
          validUntil: endOfDayIso(v.validUntil),
          message: v.message.trim() || undefined,
        },
      },
      {
        onSuccess: () => toast.success(quote.status === "QUOTED" ? "Quote updated and re-sent." : "Quote sent to the customer."),
        onError: (e) =>
          toast.error(
            e.code === "QUOTE_ITEMS_UNPRICED"
              ? "Every line needs a price and a variant."
              : e.code === "INVALID_VARIANT"
                ? "One of the chosen variants doesn't belong to its product."
                : e.message,
          ),
      },
    );

  return (
    <Section
      title={quote.status === "QUOTED" ? "Update quote" : "Respond"}
      description="Unit prices in rupees, GST-inclusive. Shipping is added at checkout. Pin a variant for lines the customer left open."
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6" noValidate aria-label="Respond to quote">
          <div className="border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead className="w-40">Unit price (₹)</TableHead>
                  <TableHead className="text-right">Line total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fields.map((f, idx) => {
                  const item = quote.items[idx];
                  const unit = paise(lines?.[idx]?.price);
                  return (
                    <TableRow key={f.id}>
                      <TableCell className="align-top">
                        <div className="font-medium">{item.productName}</div>
                        {item.variantId ? (
                          <div className="text-xs text-muted-foreground">{variantText(item)}</div>
                        ) : (
                          <VariantPicker control={form.control} index={idx} item={item} />
                        )}
                        {item.requestedNotes && <div className="text-xs text-muted-foreground mt-1">“{item.requestedNotes}”</div>}
                      </TableCell>
                      <TableCell className="text-right tabular align-top">{item.quantity}</TableCell>
                      <TableCell className="align-top">
                        <FormField
                          control={form.control}
                          name={`lines.${idx}.price`}
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input inputMode="decimal" aria-label={`Unit price for ${item.productName}`} {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </TableCell>
                      <TableCell className="text-right tabular align-top">{unit != null ? formatPaise(unit * item.quantity) : "—"}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
              <TableFooter className="bg-transparent">
                <TableRow>
                  <TableCell colSpan={3} className="text-right font-medium">
                    Quoted total (excl. shipping)
                  </TableCell>
                  <TableCell className="text-right tabular font-medium" data-testid="respond-total">
                    {formatPaise(total)}
                  </TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </div>

          <div className="grid gap-4 sm:grid-cols-[200px_1fr]">
            <FormField
              control={form.control}
              name="validUntil"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valid until</FormLabel>
                  <FormControl>
                    <Input type="date" min={toDay(new Date())} {...field} />
                  </FormControl>
                  <FormDescription>Through the end of this day.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Message to the customer (optional)</FormLabel>
                  <FormControl>
                    <Textarea rows={3} placeholder="Lead time, delivery terms, MOQ…" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="flex justify-end">
            <Button type="submit" className="font-display text-xs" disabled={action.isPending}>
              {action.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {quote.status === "QUOTED" ? "Update quote" : "Send quote"}
            </Button>
          </div>
        </form>
      </Form>
    </Section>
  );
}

/** Variant select for an RFQ line without one (variants come from the public product page data). */
function VariantPicker({ control, index, item }: { control: Control<RespondValues>; index: number; item: AdminQuoteItem }) {
  const product = useProduct(item.productSlug ?? undefined);
  const variants = product.data?.variants ?? [];
  return (
    <FormField
      control={control}
      name={`lines.${index}.variantId`}
      render={({ field }) => (
        <FormItem className="mt-2 max-w-xs">
          <Select value={field.value} onValueChange={field.onChange} disabled={!variants.length}>
            <FormControl>
              <SelectTrigger aria-label={`Variant for ${item.productName}`} className="h-8 text-xs">
                <SelectValue placeholder={product.isPending && item.productSlug ? "Loading variants…" : "Pick a variant"} />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {variants.map((v) => (
                <SelectItem key={v.id} value={v.id}>
                  {v.title} · {v.sku}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

// ---------------------------------------------------------------------------------------------
// Decline

const rejectSchema = z.object({ reason: z.string().trim().min(3, "Give the customer a short reason").max(1000) });
type RejectValues = z.infer<typeof rejectSchema>;

function RejectDialog({ quote, open, onClose }: { quote: AdminQuote; open: boolean; onClose: () => void }) {
  const action = useQuoteAction(quote.id);
  const form = useForm<RejectValues>({ resolver: zodResolver(rejectSchema), defaultValues: { reason: "" } });
  useEffect(() => {
    if (open) form.reset({ reason: "" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const onSubmit = (v: RejectValues) =>
    action.mutate(
      { kind: "reject", body: { reason: v.reason.trim() } },
      {
        onSuccess: () => {
          toast.success("Quote declined.");
          onClose();
        },
        onError: (e) => toast.error(e.message),
      },
    );

  return (
    <FormDialog
      open={open}
      onClose={onClose}
      title="Decline quote request"
      description="The customer sees this reason on their quote."
      formId="reject-quote-form"
      submitLabel="Decline"
      pending={action.isPending}
      destructive
    >
      <Form {...form}>
        <form id="reject-quote-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <FormField
            control={form.control}
            name="reason"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Reason</FormLabel>
                <FormControl>
                  <Textarea rows={3} placeholder="Below our minimum order quantity…" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </form>
      </Form>
    </FormDialog>
  );
}
