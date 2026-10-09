import { useEffect, useState } from "react";
import { Controller, useForm, type Control, type FieldValues, type Path } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { refundableAmount, statusTargets, useOrderAction } from "../api/orders";
import { ORDER_STATUS_LABELS, type AdminOrder, type OrderStatus } from "../api/types";
import { formatPaise, normaliseRupees, paiseToRupees, RUPEES_PATTERN, rupeesToPaise } from "../lib/money";
import { localInputToIso } from "../lib/format";

export type OrderDialog = "status" | "mark-paid" | "refund" | "cancel" | null;

interface DialogProps {
  order: AdminOrder;
  open: boolean;
  onClose: () => void;
}

const rupeeString = (msg = "Enter an amount like 1299 or 1299.50") =>
  z.string().refine((s) => RUPEES_PATTERN.test(normaliseRupees(s)), msg);

export const FormDialog = ({
  open,
  onClose,
  title,
  description,
  formId,
  submitLabel,
  pending,
  destructive,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description: string;
  formId: string;
  submitLabel: string;
  pending: boolean;
  destructive?: boolean;
  children: React.ReactNode;
}) => (
  <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
    <DialogContent className="rounded-none">
      <DialogHeader>
        <DialogTitle className="font-display text-base">{title}</DialogTitle>
        <DialogDescription>{description}</DialogDescription>
      </DialogHeader>
      {children}
      <DialogFooter>
        <Button type="button" variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button
          type="submit"
          form={formId}
          disabled={pending}
          variant={destructive ? "destructive" : "default"}
          className="font-display text-xs"
        >
          {pending && <Loader2 className="h-4 w-4 animate-spin" />}
          {submitLabel}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);

// ---------------------------------------------------------------------------------------------
// Change status

const statusSchema = z.object({
  status: z.string().min(1, "Choose a status"),
  note: z.string().max(1000),
  notifyCustomer: z.boolean(),
});
type StatusValues = z.infer<typeof statusSchema>;

export function StatusDialog({ order, open, onClose }: DialogProps) {
  const action = useOrderAction(order.id);
  const targets = statusTargets(order);
  const form = useForm<StatusValues>({
    resolver: zodResolver(statusSchema),
    defaultValues: { status: "", note: "", notifyCustomer: true },
  });
  useEffect(() => {
    if (open) form.reset({ status: targets.length === 1 ? targets[0] : "", note: "", notifyCustomer: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const onSubmit = (v: StatusValues) =>
    action.mutate(
      {
        kind: "status",
        body: { status: v.status as OrderStatus, note: v.note.trim() || undefined, notifyCustomer: !!v.notifyCustomer },
      },
      {
        onSuccess: (o) => {
          toast.success(`Order moved to ${ORDER_STATUS_LABELS[o.status]}.`);
          onClose();
        },
        onError: (e) => toast.error(e.message),
      },
    );

  return (
    <FormDialog
      open={open}
      onClose={onClose}
      title="Change status"
      description={`Currently ${ORDER_STATUS_LABELS[order.status]}. Only valid next steps are listed.`}
      formId="order-status-form"
      submitLabel="Update status"
      pending={action.isPending}
    >
      <Form {...form}>
        <form id="order-status-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>New status</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger aria-label="New status">
                      <SelectValue placeholder="Choose…" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {targets.map((s) => (
                      <SelectItem key={s} value={s}>
                        {ORDER_STATUS_LABELS[s]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="note"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Note (optional)</FormLabel>
                <FormControl>
                  <Textarea rows={2} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <CheckboxField control={form.control} name="notifyCustomer" id="status-notify" label="Email the customer" />
        </form>
      </Form>
    </FormDialog>
  );
}

// ---------------------------------------------------------------------------------------------
// Mark paid (bank transfer / PO)

const markPaidSchema = z.object({
  reference: z.string().trim().min(1, "Enter the UTR, cheque or PO number").max(100),
  amount: z.string().refine((s) => s.trim() === "" || RUPEES_PATTERN.test(normaliseRupees(s)), "Enter an amount like 1299 or 1299.50"),
  paidAt: z.string(),
  note: z.string().max(1000),
});
type MarkPaidValues = z.infer<typeof markPaidSchema>;

export function MarkPaidDialog({ order, open, onClose }: DialogProps) {
  const action = useOrderAction(order.id);
  const form = useForm<MarkPaidValues>({
    resolver: zodResolver(markPaidSchema),
    defaultValues: { reference: "", amount: "", paidAt: "", note: "" },
  });
  useEffect(() => {
    if (open) form.reset({ reference: "", amount: paiseToRupees(order.totals.total), paidAt: "", note: "" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const onSubmit = (v: MarkPaidValues) => {
    const amount = rupeesToPaise(v.amount);
    action.mutate(
      {
        kind: "mark-paid",
        body: {
          reference: v.reference.trim(),
          amount: amount ?? undefined,
          paidAt: localInputToIso(v.paidAt) ?? undefined,
          note: v.note.trim() || undefined,
        },
      },
      {
        onSuccess: () => {
          toast.success("Payment recorded. Order marked paid.");
          onClose();
        },
        onError: (e) => toast.error(e.message),
      },
    );
  };

  return (
    <FormDialog
      open={open}
      onClose={onClose}
      title="Mark as paid"
      description="Record a bank transfer or PO payment. The order moves to Paid."
      formId="mark-paid-form"
      submitLabel="Mark paid"
      pending={action.isPending}
    >
      <Form {...form}>
        <form id="mark-paid-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <FormField
            control={form.control}
            name="reference"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Reference</FormLabel>
                <FormControl>
                  <Input placeholder="UTR / cheque / PO number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount received (₹)</FormLabel>
                  <FormControl>
                    <Input inputMode="decimal" {...field} />
                  </FormControl>
                  <FormDescription>Order total {formatPaise(order.totals.total)}</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="paidAt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Received on (optional)</FormLabel>
                  <FormControl>
                    <Input type="datetime-local" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={form.control}
            name="note"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Internal note (optional)</FormLabel>
                <FormControl>
                  <Textarea rows={2} {...field} />
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

// ---------------------------------------------------------------------------------------------
// Refund (full or partial), with a confirmation step

const refundSchema = (max: number) =>
  z.object({
    amount: rupeeString().superRefine((s, ctx) => {
      if (!RUPEES_PATTERN.test(normaliseRupees(s))) return;
      const paise = rupeesToPaise(s) ?? 0;
      if (paise <= 0) ctx.addIssue({ code: "custom", message: "Enter an amount above zero" });
      else if (paise > max) ctx.addIssue({ code: "custom", message: `At most ${formatPaise(max)} can be refunded` });
    }),
    reason: z.string().trim().min(1, "Enter a reason").max(500),
    restock: z.record(z.string()),
  });
type RefundValues = z.infer<ReturnType<typeof refundSchema>>;

export function RefundDialog({ order, open, onClose }: DialogProps) {
  const action = useOrderAction(order.id);
  const max = refundableAmount(order);
  const [pending, setPending] = useState<{ amount: number; values: RefundValues } | null>(null);
  const form = useForm<RefundValues>({
    resolver: zodResolver(refundSchema(max)),
    defaultValues: { amount: "", reason: "", restock: {} },
  });
  useEffect(() => {
    if (open) {
      form.reset({ amount: paiseToRupees(max), reason: "", restock: Object.fromEntries(order.items.map((i) => [i.id, "0"])) });
      setPending(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const onSubmit = (v: RefundValues) => {
    for (const item of order.items) {
      const raw = v.restock[item.id]?.trim() || "0";
      if (!/^\d+$/.test(raw) || Number(raw) > item.quantity) {
        form.setError(`restock.${item.id}`, { message: `0 to ${item.quantity}` });
        return;
      }
    }
    setPending({ amount: rupeesToPaise(v.amount) ?? 0, values: v });
  };

  const confirm = () => {
    if (!pending) return;
    const restockItems = order.items
      .map((i) => ({ orderItemId: i.id, quantity: Number(pending.values.restock[i.id] || 0), reason: "RETURN" as const }))
      .filter((r) => r.quantity > 0);
    action.mutate(
      { kind: "refund", body: { amount: pending.amount, reason: pending.values.reason.trim(), restockItems } },
      {
        onSuccess: () => {
          toast.success(`Refund of ${formatPaise(pending.amount)} initiated.`);
          setPending(null);
          onClose();
        },
        onError: (e) => {
          setPending(null);
          if (e.code === "REFUND_EXCEEDS_CAPTURED") form.setError("amount", { message: e.message });
          else toast.error(e.message);
        },
      },
    );
  };

  const isFull = pending?.amount === max;

  return (
    <>
      <FormDialog
        open={open && !pending}
        onClose={onClose}
        title="Refund"
        description={`Up to ${formatPaise(max)} can be refunded to the original payment method.`}
        formId="refund-form"
        submitLabel="Review refund"
        pending={false}
      >
        <Form {...form}>
          <form id="refund-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Refund amount (₹)</FormLabel>
                  <div className="flex gap-2">
                    <FormControl>
                      <Input inputMode="decimal" {...field} />
                    </FormControl>
                    <Button type="button" variant="outline" size="sm" className="h-10" onClick={() => form.setValue("amount", paiseToRupees(max))}>
                      Full
                    </Button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason</FormLabel>
                  <FormControl>
                    <Textarea rows={2} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="space-y-2">
              <Label>Return items to stock (optional)</Label>
              <div className="border border-border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead className="text-right">Ordered</TableHead>
                      <TableHead className="w-24 text-right">Restock</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {order.items.map((i) => (
                      <TableRow key={i.id}>
                        <TableCell className="text-xs">
                          {i.productName}
                          <div className="text-muted-foreground">{i.sku}</div>
                        </TableCell>
                        <TableCell className="text-right tabular">{i.quantity}</TableCell>
                        <TableCell>
                          <FormField
                            control={form.control}
                            name={`restock.${i.id}`}
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Input inputMode="numeric" aria-label={`Restock ${i.sku}`} className="h-8 text-right" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </form>
        </Form>
      </FormDialog>

      <AlertDialog open={open && !!pending} onOpenChange={(o) => !o && setPending(null)}>
        <AlertDialogContent className="rounded-none">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display text-base">
              Refund {pending ? formatPaise(pending.amount) : ""}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isFull ? "This is a full refund" : "This is a partial refund"} of order {order.number} to the customer's original
              payment method. It can't be undone once the payment provider processes it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={action.isPending}>Back</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={action.isPending}
              onClick={(e) => {
                e.preventDefault();
                confirm();
              }}
            >
              {action.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Confirm refund
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// ---------------------------------------------------------------------------------------------
// Cancel

const cancelSchema = z.object({
  reason: z.string().trim().min(1, "Enter a reason").max(500),
  restock: z.boolean(),
  refund: z.boolean(),
  notifyCustomer: z.boolean(),
});
type CancelValues = z.infer<typeof cancelSchema>;

export function CancelDialog({ order, open, onClose }: DialogProps) {
  const action = useOrderAction(order.id);
  const form = useForm<CancelValues>({
    resolver: zodResolver(cancelSchema),
    defaultValues: { reason: "", restock: true, refund: true, notifyCustomer: true },
  });
  useEffect(() => {
    if (open) form.reset({ reason: "", restock: true, refund: true, notifyCustomer: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);
  const captured = refundableAmount(order);

  const onSubmit = (v: CancelValues) =>
    action.mutate(
      {
        kind: "cancel",
        body: { reason: v.reason.trim(), restock: !!v.restock, refund: !!v.refund, notifyCustomer: !!v.notifyCustomer },
      },
      {
        onSuccess: () => {
          toast.success(`Order ${order.number} cancelled.`);
          onClose();
        },
        onError: (e) => toast.error(e.message),
      },
    );

  return (
    <FormDialog
      open={open}
      onClose={onClose}
      title={`Cancel ${order.number}?`}
      description="The customer sees the reason in their order history."
      formId="cancel-form"
      submitLabel="Cancel order"
      pending={action.isPending}
      destructive
    >
      <Form {...form}>
        <form id="cancel-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <FormField
            control={form.control}
            name="reason"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Reason</FormLabel>
                <FormControl>
                  <Textarea rows={2} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <CheckboxField control={form.control} name="restock" id="cancel-restock" label="Return items to stock" />
          {captured > 0 && (
            <CheckboxField control={form.control} name="refund" id="cancel-refund" label={`Refund ${formatPaise(captured)} in full`} />
          )}
          <CheckboxField control={form.control} name="notifyCustomer" id="cancel-notify" label="Email the customer" />
        </form>
      </Form>
    </FormDialog>
  );
}

// ---------------------------------------------------------------------------------------------

export function CheckboxField<T extends FieldValues>({
  control,
  name,
  id,
  label,
}: {
  control: Control<T>;
  name: Path<T>;
  id: string;
  label: string;
}) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <div className="flex items-center gap-2">
          <Checkbox id={id} checked={!!field.value} onCheckedChange={(c) => field.onChange(c === true)} />
          <Label htmlFor={id} className="font-normal">
            {label}
          </Label>
        </div>
      )}
    />
  );
}
