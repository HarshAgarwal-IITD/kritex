import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FormError } from "@/components/shop/Field";
import { fieldClass, labelClass, primaryButtonClass, secondaryButtonClass } from "@/components/shop/styles";
import { useCancelOrder, useRequestReturn } from "../hooks";
import type { OrderDetail } from "../types";

const dialogClass = "border-border bg-background sm:max-w-lg";
const titleClass = "font-display text-base uppercase text-foreground";

/** Cancel an order before it ships. */
export const CancelOrderDialog = ({ order }: { order: OrderDetail }) => {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const cancel = useCancelOrder(order.number);

  return (
    <>
      <button type="button" className={secondaryButtonClass} onClick={() => setOpen(true)}>
        Cancel Order
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className={dialogClass}>
          <DialogHeader>
            <DialogTitle className={titleClass}>Cancel order {order.number}?</DialogTitle>
            <DialogDescription className="font-body text-sm text-muted-foreground">
              {order.status === "PENDING_PAYMENT"
                ? "The reserved stock will be released."
                : "If you've paid, the amount will be refunded to your original payment method in 5–7 working days."}
            </DialogDescription>
          </DialogHeader>
          <div>
            <label htmlFor="cancel-reason" className={labelClass}>
              Reason (optional)
            </label>
            <textarea id="cancel-reason" rows={3} className={`${fieldClass} resize-none`} value={reason} onChange={(e) => setReason(e.target.value)} maxLength={500} />
          </div>
          {cancel.isError && <FormError>{cancel.error.code === "ORDER_NOT_CANCELLABLE" ? "This order can no longer be cancelled." : cancel.error.message}</FormError>}
          <DialogFooter className="gap-3 sm:gap-3">
            <button type="button" className={secondaryButtonClass} onClick={() => setOpen(false)}>
              Keep Order
            </button>
            <button
              type="button"
              className={primaryButtonClass}
              disabled={cancel.isPending}
              onClick={() =>
                cancel.mutate(reason.trim() ? { reason: reason.trim() } : {}, {
                  onSuccess: () => {
                    setOpen(false);
                    toast.success("Order cancelled");
                  },
                })
              }
            >
              {cancel.isPending && <Loader2 size={14} className="animate-spin" />}
              Cancel Order
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

const REASONS = [
  { value: "SIZE_ISSUE", label: "Size doesn't fit" },
  { value: "DEFECTIVE", label: "Defective / damaged" },
  { value: "WRONG_ITEM", label: "Wrong item received" },
  { value: "OTHER", label: "Other" },
] as const;

const returnSchema = z.object({
  type: z.enum(["RETURN", "EXCHANGE"]),
  reason: z.enum(["SIZE_ISSUE", "DEFECTIVE", "WRONG_ITEM", "OTHER"]),
  notes: z.string().trim().max(1000).optional(),
  quantities: z.record(z.string(), z.coerce.number().int().min(0)),
});
type ReturnInput = z.input<typeof returnSchema>;
type ReturnValues = z.output<typeof returnSchema>;

/** Return / size-exchange request for a delivered order. */
export const ReturnRequestDialog = ({ order }: { order: OrderDetail }) => {
  const [open, setOpen] = useState(false);
  const request = useRequestReturn(order.number);
  const [itemsError, setItemsError] = useState<string | null>(null);
  const form = useForm<ReturnInput, unknown, ReturnValues>({
    resolver: zodResolver(returnSchema),
    defaultValues: {
      type: "EXCHANGE",
      reason: "SIZE_ISSUE",
      notes: "",
      quantities: Object.fromEntries(order.items.map((i) => [i.id, order.items.length === 1 ? i.quantity : 0])),
    },
  });

  const onSubmit = (v: ReturnValues) => {
    const items = order.items
      .map((i) => ({ orderItemId: i.id, quantity: Math.min(v.quantities[i.id] ?? 0, i.quantity) }))
      .filter((i) => i.quantity > 0);
    if (items.length === 0) {
      setItemsError("Choose at least one item.");
      return;
    }
    setItemsError(null);
    request.mutate(
      { type: v.type, reason: v.reason, items, ...(v.notes ? { notes: v.notes } : {}) },
      {
        onSuccess: () => {
          setOpen(false);
          toast.success("Return request sent");
        },
      },
    );
  };

  return (
    <>
      <button type="button" className={secondaryButtonClass} onClick={() => setOpen(true)}>
        Return / Exchange
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className={dialogClass}>
          <DialogHeader>
            <DialogTitle className={titleClass}>Return or exchange</DialogTitle>
            <DialogDescription className="font-body text-sm text-muted-foreground">
              We'll review your request and email you pickup details. See our returns policy for what's eligible.
            </DialogDescription>
          </DialogHeader>
          <form id="return-form" onSubmit={form.handleSubmit(onSubmit)} noValidate className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="return-type" className={labelClass}>
                  Request
                </label>
                <select id="return-type" className={fieldClass} {...form.register("type")}>
                  <option value="EXCHANGE">Size exchange</option>
                  <option value="RETURN">Return</option>
                </select>
              </div>
              <div>
                <label htmlFor="return-reason" className={labelClass}>
                  Reason
                </label>
                <select id="return-reason" className={fieldClass} {...form.register("reason")}>
                  {REASONS.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <fieldset>
              <legend className={labelClass}>Items</legend>
              <ul className="space-y-2">
                {order.items.map((i) => (
                  <li key={i.id} className="flex items-center justify-between gap-4">
                    <label htmlFor={`qty-${i.id}`} className="font-body text-sm text-foreground">
                      {i.productName}
                      {i.variantTitle && i.variantTitle !== "Default" && <span className="text-muted-foreground"> · {i.variantTitle}</span>}
                    </label>
                    <select id={`qty-${i.id}`} className={`${fieldClass} w-20 py-2`} {...form.register(`quantities.${i.id}`)}>
                      {Array.from({ length: i.quantity + 1 }, (_, n) => (
                        <option key={n} value={n}>
                          {n}
                        </option>
                      ))}
                    </select>
                  </li>
                ))}
              </ul>
              {itemsError && <p className="font-body text-[11px] text-destructive mt-1.5">{itemsError}</p>}
            </fieldset>
            <div>
              <label htmlFor="return-notes" className={labelClass}>
                Notes (optional)
              </label>
              <textarea
                id="return-notes"
                rows={3}
                className={`${fieldClass} resize-none`}
                placeholder="For exchanges, tell us the size you need."
                {...form.register("notes")}
              />
            </div>
            {request.isError && (
              <FormError>
                {request.error.code === "RETURN_NOT_ALLOWED" ? "This order is outside the return window." : request.error.message}
              </FormError>
            )}
          </form>
          <DialogFooter className="gap-3 sm:gap-3">
            <button type="button" className={secondaryButtonClass} onClick={() => setOpen(false)}>
              Close
            </button>
            <button type="submit" form="return-form" className={primaryButtonClass} disabled={request.isPending}>
              {request.isPending && <Loader2 size={14} className="animate-spin" />}
              Send Request
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
