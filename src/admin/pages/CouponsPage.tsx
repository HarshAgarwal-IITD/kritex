import { useEffect, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
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
import type { ApiError } from "@/lib/api/client";
import { useCoupons, useCreateCoupon, useDeleteCoupon, useUpdateCoupon, type CouponFilters } from "../api/coupons";
import { COUPON_TYPES, COUPON_TYPE_LABELS, type Coupon } from "../api/types";
import { couponSchema, couponToValues, describeCouponValue, toCouponPayload, type CouponValues } from "../coupons/form";
import { formatPaise } from "../lib/money";
import { formatDate } from "../lib/format";
import { useUrlFilters } from "../lib/hooks";
import { ErrorState, PageHeader } from "../components/PageState";
import { Pager } from "../components/Pager";
import { TableStates } from "../components/TableStates";

const PAGE_SIZE = 20;
const ALL = "all";

const describeWindow = (c: Coupon) =>
  !c.startsAt && !c.endsAt ? "Always" : `${c.startsAt ? formatDate(c.startsAt) : "Now"} – ${c.endsAt ? formatDate(c.endsAt) : "no end"}`;

type EditorState = { mode: "create" } | { mode: "edit"; coupon: Coupon } | null;

export default function CouponsPage() {
  const { get, setParam, page, search, setSearch } = useUrlFilters();
  const filters: CouponFilters = { q: get("q"), isActive: get("active") as CouponFilters["isActive"], page, limit: PAGE_SIZE };
  const coupons = useCoupons(filters);
  const update = useUpdateCoupon();
  const del = useDeleteCoupon();
  const [editor, setEditor] = useState<EditorState>(null);
  const [toDelete, setToDelete] = useState<Coupon | null>(null);

  return (
    <div>
      <PageHeader
        title="Coupons"
        description="Discount codes customers enter in the cart."
        actions={
          <Button className="font-display text-xs" onClick={() => setEditor({ mode: "create" })}>
            <Plus className="h-4 w-4" /> New coupon
          </Button>
        }
      />

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 min-w-[220px] max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            aria-label="Search coupons"
            placeholder="Code"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filters.isActive ?? ALL} onValueChange={(v) => setParam("active", v === ALL ? undefined : v)}>
          <SelectTrigger className="w-[150px]" aria-label="Filter by state">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All coupons</SelectItem>
            <SelectItem value="true">Active</SelectItem>
            <SelectItem value="false">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {coupons.isError ? (
        <ErrorState message={coupons.error.message} onRetry={() => coupons.refetch()} />
      ) : (
        <div className="border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Discount</TableHead>
                <TableHead className="text-right">Min. subtotal</TableHead>
                <TableHead>Valid</TableHead>
                <TableHead className="text-right">Used</TableHead>
                <TableHead>Active</TableHead>
                <TableHead className="w-24" />
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableStates loading={coupons.isPending} empty={coupons.data?.items.length === 0} colSpan={7} message="No coupons yet." />
              {coupons.data?.items.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium tabular">{c.code}</TableCell>
                  <TableCell>{describeCouponValue(c)}</TableCell>
                  <TableCell className="text-right tabular">{formatPaise(c.minSubtotal)}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{describeWindow(c)}</TableCell>
                  <TableCell className="text-right tabular">
                    {c.usedCount}
                    {c.usageLimit != null && <span className="text-muted-foreground"> / {c.usageLimit}</span>}
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={c.isActive}
                      aria-label={`${c.code} active`}
                      disabled={update.isPending}
                      onCheckedChange={(isActive) =>
                        update.mutate(
                          { id: c.id, body: { isActive } },
                          { onSuccess: () => toast.success(`${c.code} ${isActive ? "activated" : "deactivated"}.`), onError: (e) => toast.error(e.message) },
                        )
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" aria-label={`Edit ${c.code}`} onClick={() => setEditor({ mode: "edit", coupon: c })}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" aria-label={`Delete ${c.code}`} onClick={() => setToDelete(c)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Pager
        total={coupons.data?.total ?? 0}
        page={coupons.data?.page ?? page}
        limit={coupons.data?.limit ?? PAGE_SIZE}
        noun={["coupon", "coupons"]}
        loaded={!!coupons.data}
        onPage={(p) => setParam("page", String(p))}
      />

      <CouponDialog state={editor} onClose={() => setEditor(null)} />

      <AlertDialog open={!!toDelete} onOpenChange={(open) => !open && setToDelete(null)}>
        <AlertDialogContent className="rounded-none">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display text-base">Delete {toDelete?.code}?</AlertDialogTitle>
            <AlertDialogDescription>
              {toDelete && toDelete.usedCount > 0
                ? `This code has been used ${toDelete.usedCount} time${toDelete.usedCount === 1 ? "" : "s"}, so it will be deactivated instead of deleted.`
                : "Customers will no longer be able to use this code."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={!toDelete || del.isPending}
              onClick={() =>
                toDelete &&
                del.mutate(toDelete.id, {
                  onSuccess: () => toast.success(toDelete.usedCount > 0 ? `${toDelete.code} deactivated.` : `${toDelete.code} deleted.`),
                  onError: (e) => toast.error(e.message),
                })
              }
            >
              {toDelete && toDelete.usedCount > 0 ? "Deactivate" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function CouponDialog({ state, onClose }: { state: EditorState; onClose: () => void }) {
  const editing = state?.mode === "edit" ? state.coupon : undefined;
  const create = useCreateCoupon();
  const update = useUpdateCoupon();
  const form = useForm<CouponValues>({ resolver: zodResolver(couponSchema), defaultValues: couponToValues() });
  useEffect(() => {
    if (state) form.reset(couponToValues(editing));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);
  const type = useWatch({ control: form.control, name: "type" });

  const onError = (e: ApiError) => {
    if (e.status === 409) form.setError("code", { message: e.message || "This code is already used" });
    else toast.error(e.message);
  };
  const onSubmit = (v: CouponValues) => {
    const body = toCouponPayload(v);
    const done = (verb: string) => () => {
      toast.success(`${verb} ${body.code}.`);
      onClose();
    };
    if (editing) update.mutate({ id: editing.id, body }, { onSuccess: done("Saved"), onError });
    else create.mutate(body, { onSuccess: done("Created"), onError });
  };
  const pending = create.isPending || update.isPending;

  const text = (name: keyof CouponValues, label: string, opts: { placeholder?: string; description?: string; inputMode?: "numeric" | "decimal"; type?: string } = {}) => (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Input
              type={opts.type}
              inputMode={opts.inputMode}
              placeholder={opts.placeholder}
              {...field}
              value={field.value as string}
              onChange={name === "code" ? (e) => field.onChange(e.target.value.toUpperCase()) : field.onChange}
            />
          </FormControl>
          {opts.description && <FormDescription>{opts.description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );

  return (
    <Dialog open={!!state} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="rounded-none max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-base">{editing ? `Edit ${editing.code}` : "New coupon"}</DialogTitle>
          <DialogDescription>Amounts are in rupees and include GST.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form id="coupon-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
            {text("code", "Code", { placeholder: "WELCOME10" })}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger aria-label="Type">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {COUPON_TYPES.map((t) => (
                          <SelectItem key={t} value={t}>
                            {COUPON_TYPE_LABELS[t]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {type === "PERCENT" && text("value", "Percent off", { inputMode: "numeric", placeholder: "10" })}
              {type === "FLAT" && text("value", "Amount off (₹)", { inputMode: "decimal", placeholder: "500" })}
            </div>
            <div className="grid grid-cols-2 gap-4">
              {text("minSubtotal", "Minimum subtotal (₹)", { inputMode: "decimal", description: "Optional" })}
              {type === "PERCENT" && text("maxDiscount", "Maximum discount (₹)", { inputMode: "decimal", description: "Optional cap" })}
            </div>
            <div className="grid grid-cols-2 gap-4">
              {text("startsAt", "Starts", { type: "datetime-local", description: "Empty = immediately" })}
              {text("endsAt", "Ends", { type: "datetime-local", description: "Empty = never" })}
            </div>
            <div className="grid grid-cols-2 gap-4">
              {text("usageLimit", "Total uses", { inputMode: "numeric", description: "Empty = unlimited" })}
              {text("perUserLimit", "Uses per customer", { inputMode: "numeric", description: "Empty = unlimited" })}
            </div>
            <Controller
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <div className="flex items-center gap-2">
                  <Switch id="coupon-active" checked={field.value} onCheckedChange={field.onChange} />
                  <Label htmlFor="coupon-active" className="font-normal">
                    Active
                  </Label>
                </div>
              )}
            />
          </form>
        </Form>
        <DialogFooter>
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="coupon-form" disabled={pending} className="font-display text-xs">
            {pending && <Loader2 className="h-4 w-4 animate-spin" />}
            {editing ? "Save" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
