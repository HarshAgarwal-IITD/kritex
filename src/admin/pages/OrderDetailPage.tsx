import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Ban, Banknote, ExternalLink, Loader2, RefreshCcw, Undo2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { refundableAmount, statusTargets, useAdminOrder, useOrderAction } from "../api/orders";
import { PAYMENT_METHOD_LABELS, PAYMENT_STATUS_LABELS, type AdminOrder, type OrderAddress } from "../api/types";
import { formatPaise } from "../lib/money";
import { formatDateTime } from "../lib/format";
import { adminPaths } from "../paths";
import { ErrorState, PageHeader } from "../components/PageState";
import { Section } from "../components/Section";
import { OrderStatusBadge, PaymentStatusBadge } from "../components/Badges";
import {
  CancelDialog,
  MarkPaidDialog,
  RefundDialog,
  StatusDialog,
  type OrderDialog,
} from "../orders/OrderActionDialogs";

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const order = useAdminOrder(id);

  if (order.isError) {
    return (
      <div className="space-y-4">
        <BackLink />
        <ErrorState
          message={order.error.status === 404 ? "This order doesn't exist." : order.error.message}
          onRetry={order.error.status === 404 ? undefined : () => order.refetch()}
        />
      </div>
    );
  }
  if (!order.data) {
    return (
      <div className="space-y-4" aria-busy="true">
        <BackLink />
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }
  return <OrderDetail order={order.data} />;
}

const BackLink = () => (
  <Link to={adminPaths.orders} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
    <ArrowLeft className="h-3 w-3" /> Orders
  </Link>
);

function OrderDetail({ order }: { order: AdminOrder }) {
  const [dialog, setDialog] = useState<OrderDialog>(null);
  const close = () => setDialog(null);
  const refundable = refundableAmount(order);
  const canChangeStatus = statusTargets(order).length > 0;
  const canCancel = order.allowedTransitions.includes("CANCELLED");
  const canMarkPaid = order.status === "AWAITING_PAYMENT";

  return (
    <div className="space-y-6">
      <BackLink />
      <PageHeader
        title={order.number}
        description={`Placed ${formatDateTime(order.createdAt)} · ${PAYMENT_METHOD_LABELS[order.paymentMethod]}`}
        actions={
          <div className="flex flex-wrap gap-2">
            {canMarkPaid && (
              <Button className="font-display text-xs" onClick={() => setDialog("mark-paid")}>
                <Banknote className="h-4 w-4" /> Mark paid
              </Button>
            )}
            {canChangeStatus && (
              <Button variant="outline" className="font-display text-xs" onClick={() => setDialog("status")}>
                <RefreshCcw className="h-4 w-4" /> Change status
              </Button>
            )}
            {refundable > 0 && (
              <Button variant="outline" className="font-display text-xs" onClick={() => setDialog("refund")}>
                <Undo2 className="h-4 w-4" /> Refund
              </Button>
            )}
            {canCancel && (
              <Button variant="outline" className="font-display text-xs text-destructive" onClick={() => setDialog("cancel")}>
                <Ban className="h-4 w-4" /> Cancel order
              </Button>
            )}
          </div>
        }
      />
      <div className="flex flex-wrap items-center gap-2 -mt-4">
        <OrderStatusBadge status={order.status} />
        <PaymentStatusBadge status={order.paymentStatus} />
        {order.gstin && (
          <Badge variant="outline" className="font-normal">
            B2B
          </Badge>
        )}
        {order.reservedUntil && (
          <span className="text-xs text-muted-foreground">Stock reserved until {formatDateTime(order.reservedUntil)}</span>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <ItemsSection order={order} />
          <PaymentsSection order={order} refundable={refundable} />
          <TimelineSection order={order} />
        </div>
        <div className="space-y-6">
          <CustomerSection order={order} />
          {order.shipments.length > 0 && <ShipmentsSection order={order} />}
        </div>
      </div>

      <StatusDialog order={order} open={dialog === "status"} onClose={close} />
      <MarkPaidDialog order={order} open={dialog === "mark-paid"} onClose={close} />
      <RefundDialog order={order} open={dialog === "refund"} onClose={close} />
      <CancelDialog order={order} open={dialog === "cancel"} onClose={close} />
    </div>
  );
}

function ItemsSection({ order }: { order: AdminOrder }) {
  const t = order.totals;
  const rows: [string, number, boolean?][] = [
    ["Subtotal", t.subtotal],
    ...(t.discount ? [[`Discount${order.couponCode ? ` (${order.couponCode})` : ""}`, -t.discount] as [string, number]] : []),
    ["Shipping", t.shipping],
    ["Total", t.total, true],
  ];
  const taxRows: [string, number][] = [
    ["CGST", t.cgst],
    ["SGST", t.sgst],
    ["IGST", t.igst],
  ].filter(([, v]) => (v as number) > 0) as [string, number][];

  return (
    <Section title="Items" description="Prices are GST-inclusive. Tax is the snapshot taken when the order was placed.">
      <div className="border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead className="text-right">Unit</TableHead>
              <TableHead className="text-right">Qty</TableHead>
              <TableHead className="text-right">GST</TableHead>
              <TableHead className="text-right">Tax</TableHead>
              <TableHead className="text-right">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {order.items.map((i) => (
              <TableRow key={i.id}>
                <TableCell>
                  <div className="font-medium">{i.productName}</div>
                  <div className="text-xs text-muted-foreground">
                    {i.variantTitle} · {i.sku}
                    {i.hsnCode ? ` · HSN ${i.hsnCode}` : ""}
                  </div>
                </TableCell>
                <TableCell className="text-right tabular">{formatPaise(i.unitPrice)}</TableCell>
                <TableCell className="text-right tabular">{i.quantity}</TableCell>
                <TableCell className="text-right tabular">{i.gstRate}%</TableCell>
                <TableCell className="text-right tabular text-muted-foreground">{formatPaise(i.taxAmount)}</TableCell>
                <TableCell className="text-right tabular">{formatPaise(i.lineTotal)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooter className="bg-transparent">
            {rows.map(([label, value, strong]) => (
              <TableRow key={label}>
                <TableCell colSpan={5} className={`text-right ${strong ? "font-medium" : "text-muted-foreground"}`}>
                  {label}
                </TableCell>
                <TableCell className={`text-right tabular ${strong ? "font-medium" : ""}`}>
                  {value < 0 ? `−${formatPaise(-value)}` : formatPaise(value)}
                </TableCell>
              </TableRow>
            ))}
            <TableRow>
              <TableCell colSpan={5} className="text-right text-xs text-muted-foreground">
                GST included{taxRows.length ? ` (${taxRows.map(([l, v]) => `${l} ${formatPaise(v)}`).join(" + ")})` : ""}
              </TableCell>
              <TableCell className="text-right tabular text-xs text-muted-foreground">{formatPaise(t.taxTotal)}</TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </div>
    </Section>
  );
}

function PaymentsSection({ order, refundable }: { order: AdminOrder; refundable: number }) {
  return (
    <Section title="Payments" description={refundable > 0 ? `${formatPaise(refundable)} refundable` : undefined}>
      {order.payments.length === 0 ? (
        <p className="text-sm text-muted-foreground">No payment recorded yet.</p>
      ) : (
        <div className="border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {order.payments.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="text-xs tabular">{formatDateTime(p.createdAt)}</TableCell>
                  <TableCell>{PAYMENT_METHOD_LABELS[p.provider]}</TableCell>
                  <TableCell className="text-xs text-muted-foreground break-all">
                    {p.reference ?? p.providerPaymentId ?? p.providerOrderId ?? "—"}
                  </TableCell>
                  <TableCell>{PAYMENT_STATUS_LABELS[p.status]}</TableCell>
                  <TableCell className="text-right tabular">{formatPaise(p.amount)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      {order.refunds.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-display text-xs text-muted-foreground">Refunds</h3>
          <div className="border border-border">
            <Table>
              <TableBody>
                {order.refunds.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="text-xs tabular">{formatDateTime(r.createdAt)}</TableCell>
                    <TableCell className="text-xs">{r.reason ?? "—"}</TableCell>
                    <TableCell>
                      <Badge variant={r.status === "FAILED" ? "destructive" : r.status === "PROCESSED" ? "default" : "secondary"} className="font-normal">
                        {r.status === "PENDING" ? "Pending" : r.status === "PROCESSED" ? "Processed" : "Failed"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right tabular">{formatPaise(r.amount)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </Section>
  );
}

const noteSchema = z.object({ message: z.string().trim().min(1, "Write a note first").max(2000), visible: z.boolean() });
type NoteValues = z.infer<typeof noteSchema>;

function TimelineSection({ order }: { order: AdminOrder }) {
  const action = useOrderAction(order.id);
  const form = useForm<NoteValues>({ resolver: zodResolver(noteSchema), defaultValues: { message: "", visible: false } });
  const events = [...order.events].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const onSubmit = (v: NoteValues) =>
    action.mutate(
      { kind: "note", body: { message: v.message.trim(), internal: !v.visible } },
      {
        onSuccess: () => {
          toast.success("Note added.");
          form.reset({ message: "", visible: false });
        },
        onError: (e) => toast.error(e.message),
      },
    );

  return (
    <Section title="Timeline" description="Internal events and notes are hidden from the customer.">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-2" noValidate aria-label="Add note">
          <FormField
            control={form.control}
            name="message"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Add a note</FormLabel>
                <FormControl>
                  <Textarea rows={2} placeholder="Called the customer, confirmed the address…" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="flex items-center justify-between gap-3">
            <FormField
              control={form.control}
              name="visible"
              render={({ field }) => (
                <div className="flex items-center gap-2">
                  <Checkbox id="note-visible" checked={field.value} onCheckedChange={(c) => field.onChange(c === true)} />
                  <Label htmlFor="note-visible" className="font-normal text-xs">
                    Visible to the customer
                  </Label>
                </div>
              )}
            />
            <Button type="submit" size="sm" variant="outline" className="font-display text-xs" disabled={action.isPending}>
              {action.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Add note
            </Button>
          </div>
        </form>
      </Form>
      <Separator />
      <ol className="space-y-4" aria-label="Order events">
        {events.map((e) => (
          <li key={e.id} className="flex gap-3">
            <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${e.internal ? "bg-muted-foreground" : "bg-primary"}`} aria-hidden />
            <div className="min-w-0 space-y-0.5">
              <p className="text-sm text-foreground break-words">{e.message}</p>
              <p className="text-xs text-muted-foreground">
                {formatDateTime(e.createdAt)}
                {e.actor ? ` · ${e.actor.name}` : " · System"}
                {e.internal && (
                  <Badge variant="outline" className="ml-2 font-normal py-0">
                    Internal
                  </Badge>
                )}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </Section>
  );
}

function AddressBlock({ title, address }: { title: string; address: OrderAddress }) {
  return (
    <div className="space-y-1">
      <h3 className="font-display text-xs text-muted-foreground">{title}</h3>
      <address className="not-italic text-sm leading-relaxed">
        {address.name}
        <br />
        {address.line1}
        {address.line2 && (
          <>
            <br />
            {address.line2}
          </>
        )}
        <br />
        {address.city}, {address.state} {address.pincode}
        <br />
        <span className="text-muted-foreground">{address.phone}</span>
      </address>
    </div>
  );
}

const sameAddress = (a: OrderAddress, b: OrderAddress) => JSON.stringify(a) === JSON.stringify(b);

function CustomerSection({ order }: { order: AdminOrder }) {
  return (
    <Section title="Customer">
      <div className="space-y-1 text-sm">
        <p className="font-medium">{order.shippingAddress.name}</p>
        <p className="break-all">{order.email}</p>
        <p className="text-muted-foreground">{order.phone}</p>
        {order.userId ? (
          <Link to={adminPaths.customer(order.userId)} className="text-xs text-primary hover:underline">
            View customer
          </Link>
        ) : (
          <p className="text-xs text-muted-foreground">Guest checkout</p>
        )}
      </div>
      {order.gstin && (
        <div className="space-y-1 text-sm">
          <h3 className="font-display text-xs text-muted-foreground">Business</h3>
          <p>{order.businessName}</p>
          <p className="tabular">GSTIN {order.gstin}</p>
        </div>
      )}
      <AddressBlock title="Ship to" address={order.shippingAddress} />
      {sameAddress(order.shippingAddress, order.billingAddress) ? (
        <p className="text-xs text-muted-foreground">Billing address is the same.</p>
      ) : (
        <AddressBlock title="Bill to" address={order.billingAddress} />
      )}
      {(order.invoice || order.quoteNumber || order.couponCode) && (
        <div className="space-y-1 text-xs text-muted-foreground">
          {order.invoice && (
            <p>
              Invoice {order.invoice.number} · {formatDateTime(order.invoice.issuedAt)}
            </p>
          )}
          {order.quoteNumber && <p>From quote {order.quoteNumber}</p>}
          {order.couponCode && <p>Coupon {order.couponCode}</p>}
        </div>
      )}
    </Section>
  );
}

function ShipmentsSection({ order }: { order: AdminOrder }) {
  return (
    <Section title="Shipments">
      {order.shipments.map((s) => (
        <div key={s.id} className="space-y-1 text-sm">
          <p>
            {s.carrier ?? "Carrier pending"} {s.awb && <span className="tabular">· AWB {s.awb}</span>}
          </p>
          <p className="text-xs text-muted-foreground">
            {s.status.replace(/_/g, " ").toLowerCase()}
            {s.shippedAt ? ` · shipped ${formatDateTime(s.shippedAt)}` : ""}
          </p>
          {s.trackingUrl && (
            <a href={s.trackingUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
              Track <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
      ))}
    </Section>
  );
}
