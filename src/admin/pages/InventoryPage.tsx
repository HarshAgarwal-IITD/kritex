import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Search, SlidersHorizontal } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAdjustStock, useInventory, type InventoryFilters } from "../api/inventory";
import { STOCK_REASONS, STOCK_REASON_LABELS, type InventoryRow } from "../api/types";
import { useDebounced, useUrlFilters } from "../lib/hooks";
import { adminPaths } from "../paths";
import { ErrorState, PageHeader } from "../components/PageState";
import { Pager } from "../components/Pager";
import { TableStates } from "../components/TableStates";

const PAGE_SIZE = 50;
const DEFAULT_THRESHOLD = 5;

export default function InventoryPage() {
  const { get, setParam, page, search, setSearch } = useUrlFilters();
  const lowOnly = get("low") === "1";
  const [thresholdInput, setThresholdInput] = useState(get("threshold") ?? String(DEFAULT_THRESHOLD));
  const debouncedThreshold = useDebounced(thresholdInput.trim(), 300);
  const thresholdValid = /^\d{1,6}$/.test(debouncedThreshold);
  const threshold = thresholdValid ? Number(debouncedThreshold) : DEFAULT_THRESHOLD;

  useEffect(() => {
    if (!thresholdValid) return;
    const value = threshold === DEFAULT_THRESHOLD ? undefined : String(threshold);
    if (get("threshold") !== value) setParam("threshold", value);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [threshold, thresholdValid]);

  const filters: InventoryFilters = {
    q: get("q"),
    lowStock: lowOnly ? "true" : undefined,
    threshold,
    page,
    limit: PAGE_SIZE,
  };
  const inventory = useInventory(filters);
  const [adjusting, setAdjusting] = useState<InventoryRow | null>(null);

  return (
    <div>
      <PageHeader title="Inventory" description="Stock per variant. Available = stock − reserved by unpaid orders." />

      <div className="flex flex-wrap items-center gap-4 mb-4">
        <div className="relative flex-1 min-w-[220px] max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            aria-label="Search inventory"
            placeholder="SKU or product name"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <Switch id="low-stock" checked={lowOnly} onCheckedChange={(c) => setParam("low", c ? "1" : undefined)} />
          <Label htmlFor="low-stock" className="font-normal">
            Low stock only
          </Label>
        </div>
        <div className="flex items-center gap-2">
          <Label htmlFor="threshold" className="font-normal text-muted-foreground">
            Threshold
          </Label>
          <Input
            id="threshold"
            inputMode="numeric"
            className="w-20"
            value={thresholdInput}
            aria-invalid={!/^\d{1,6}$/.test(thresholdInput.trim())}
            onChange={(e) => setThresholdInput(e.target.value)}
          />
        </div>
      </div>

      {inventory.isError ? (
        <ErrorState message={inventory.error.message} onRetry={() => inventory.refetch()} />
      ) : (
        <div className="border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead className="text-right">Stock</TableHead>
                <TableHead className="text-right">Reserved</TableHead>
                <TableHead className="text-right">Available</TableHead>
                <TableHead className="w-28" />
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableStates
                loading={inventory.isPending}
                empty={inventory.data?.items.length === 0}
                colSpan={6}
                message={lowOnly ? "Nothing is at or below the threshold." : "No variants match."}
              />
              {inventory.data?.items.map((r) => (
                <TableRow key={r.variantId}>
                  <TableCell>
                    <Link to={adminPaths.product(r.productId)} className="font-medium text-foreground hover:text-primary">
                      {r.productName}
                    </Link>
                    <div className="text-xs text-muted-foreground">
                      {r.title}
                      {!r.isActive && " · inactive"}
                    </div>
                  </TableCell>
                  <TableCell className="text-xs tabular">{r.sku}</TableCell>
                  <TableCell className="text-right tabular">{r.stock}</TableCell>
                  <TableCell className="text-right tabular text-muted-foreground">{r.reserved}</TableCell>
                  <TableCell className="text-right tabular">
                    <span className="inline-flex items-center gap-2">
                      {r.lowStock && (
                        <Badge variant="destructive" className="font-normal">
                          Low
                        </Badge>
                      )}
                      {r.available}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" aria-label={`Adjust stock for ${r.sku}`} onClick={() => setAdjusting(r)}>
                      <SlidersHorizontal className="h-4 w-4" /> Adjust
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Pager
        total={inventory.data?.total ?? 0}
        page={inventory.data?.page ?? page}
        limit={inventory.data?.limit ?? PAGE_SIZE}
        noun={["variant", "variants"]}
        loaded={!!inventory.data}
        onPage={(p) => setParam("page", String(p))}
      />

      <AdjustStockDialog row={adjusting} onClose={() => setAdjusting(null)} />
    </div>
  );
}

const adjustSchema = z.object({
  delta: z
    .string()
    .trim()
    .regex(/^[+-]?\d{1,6}$/, "Whole number, e.g. 10 or -3")
    .refine((s) => Number(s) !== 0, "Must not be zero"),
  reason: z.enum(["RESTOCK", "ADJUST", "RETURN"]),
  note: z.string().max(500),
});
type AdjustValues = z.infer<typeof adjustSchema>;

function AdjustStockDialog({ row, onClose }: { row: InventoryRow | null; onClose: () => void }) {
  const adjust = useAdjustStock();
  const form = useForm<AdjustValues>({ resolver: zodResolver(adjustSchema), defaultValues: { delta: "", reason: "RESTOCK", note: "" } });
  useEffect(() => {
    if (row) form.reset({ delta: "", reason: "RESTOCK", note: "" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [row]);
  const delta = useWatch({ control: form.control, name: "delta" });
  const parsed = /^[+-]?\d{1,6}$/.test(delta?.trim() ?? "") ? Number(delta) : 0;

  const onSubmit = (v: AdjustValues) => {
    if (!row) return;
    adjust.mutate(
      { variantId: row.variantId, body: { delta: Number(v.delta), reason: v.reason, note: v.note.trim() || undefined } },
      {
        onSuccess: (variant) => {
          toast.success(`${row.sku}: stock is now ${variant.stock}.`);
          onClose();
        },
        onError: (e) => {
          if (e.code === "INSUFFICIENT_STOCK") form.setError("delta", { message: "Stock can't drop below the reserved units." });
          else toast.error(e.message);
        },
      },
    );
  };

  return (
    <Dialog open={!!row} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="rounded-none">
        <DialogHeader>
          <DialogTitle className="font-display text-base">Adjust stock</DialogTitle>
          <DialogDescription>
            {row ? `${row.productName} · ${row.title} (${row.sku}). Current stock ${row.stock}, reserved ${row.reserved}.` : ""}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form id="adjust-stock-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <FormField
              control={form.control}
              name="delta"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Change</FormLabel>
                  <FormControl>
                    <Input inputMode="numeric" placeholder="+10 or -3" {...field} />
                  </FormControl>
                  <FormDescription>{row && parsed !== 0 ? `New stock: ${row.stock + parsed}` : "Positive adds units, negative removes them."}</FormDescription>
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
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger aria-label="Reason">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {STOCK_REASONS.map((r) => (
                        <SelectItem key={r} value={r}>
                          {STOCK_REASON_LABELS[r]}
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
          </form>
        </Form>
        <DialogFooter>
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="adjust-stock-form" disabled={adjust.isPending} className="font-display text-xs">
            {adjust.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
