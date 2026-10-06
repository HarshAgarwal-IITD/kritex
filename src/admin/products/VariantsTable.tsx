import { useEffect, useState } from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AlertTriangle, Loader2, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useGenerateVariants, useSaveVariants } from "../api/products";
import type { AdminProduct } from "../api/types";
import { formatPaise, paiseToRupees, rupeesToPaise } from "../lib/money";
import {
  REASON_LABELS,
  STOCK_REASONS,
  priceString,
  variantChanges,
  variantsFormSchema,
  type VariantsFormInput,
  type VariantsFormValues,
} from "./variants-form";

const toRows = (product: AdminProduct): VariantsFormInput["rows"] =>
  product.variants.map((v) => ({
    id: v.id,
    sku: v.sku,
    price: paiseToRupees(v.price),
    stock: String(v.stock),
    isActive: v.isActive,
  }));

export function VariantsTable({ product, optionsDirty }: { product: AdminProduct; optionsDirty: boolean }) {
  const save = useSaveVariants(product.id);
  const [generateOpen, setGenerateOpen] = useState(false);
  const form = useForm<VariantsFormInput, unknown, VariantsFormValues>({
    resolver: zodResolver(variantsFormSchema),
    defaultValues: { rows: toRows(product), reason: "ADJUST", note: "" },
  });
  // keyName: our rows carry the variant `id`, which RHF would otherwise overwrite with its own key.
  const { fields } = useFieldArray({ control: form.control, name: "rows", keyName: "key" });

  // Refresh rows whenever the saved variants change (after save or generation).
  useEffect(() => {
    form.reset({ rows: toRows(product), reason: form.getValues("reason"), note: "" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product.variants]);

  const onSubmit = (values: VariantsFormValues) => {
    const changes = variantChanges(product, values);
    if (!changes.length) {
      toast.info("No variant changes to save.");
      return;
    }
    save.mutate(changes, {
      onSuccess: () => toast.success(`Saved ${changes.length} variant${changes.length === 1 ? "" : "s"}.`),
      onError: (e) => toast.error(e.message),
    });
  };

  const rowErrors = form.formState.errors.rows;
  const stockChanged = (form.watch("rows") ?? []).some((r) => {
    const original = product.variants.find((v) => v.id === r.id);
    return original && String(original.stock) !== r.stock.trim();
  });

  return (
    <div className="space-y-4">
      {optionsDirty && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>Options changed. Save the product, then regenerate variants.</AlertDescription>
        </Alert>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">
          Leave a variant&apos;s price blank to use the base price ({formatPaise(product.basePrice)}).
        </p>
        <Button type="button" variant="outline" size="sm" onClick={() => setGenerateOpen(true)} disabled={optionsDirty}>
          <Wand2 className="h-4 w-4" /> {product.variants.length ? "Regenerate variants" : "Generate variants"}
        </Button>
      </div>

      {product.variants.length === 0 ? (
        <p className="text-sm text-muted-foreground">No variants yet. Generate them from the options.</p>
      ) : (
        // Not a <form>: this sits inside the product editor's form. Enter must not submit the product.
        <div
          role="group"
          aria-label="Variants"
          className="space-y-4"
          onKeyDown={(e) => {
            if (e.key === "Enter" && e.target instanceof HTMLInputElement) e.preventDefault();
          }}
        >
          <div className="border border-border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Variant</TableHead>
                  <TableHead className="min-w-[160px]">SKU</TableHead>
                  <TableHead className="min-w-[120px]">Price (₹)</TableHead>
                  <TableHead className="min-w-[100px]">On hand</TableHead>
                  <TableHead className="text-right">Reserved</TableHead>
                  <TableHead className="text-right">Available</TableHead>
                  <TableHead>Active</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fields.map((field, index) => {
                  const v = product.variants.find((x) => x.id === field.id);
                  if (!v) return null;
                  const errs = rowErrors?.[index];
                  return (
                    <TableRow key={field.key} className={v.isActive ? undefined : "opacity-60"}>
                      <TableCell className="font-medium whitespace-nowrap">{v.title}</TableCell>
                      <TableCell>
                        <Input aria-label={`${v.title} SKU`} className="h-8 uppercase" {...form.register(`rows.${index}.sku`)} />
                        {errs?.sku && <p className="mt-1 text-xs text-destructive">{errs.sku.message}</p>}
                      </TableCell>
                      <TableCell>
                        <Input
                          aria-label={`${v.title} price`}
                          inputMode="decimal"
                          className="h-8"
                          placeholder={paiseToRupees(product.basePrice) || "—"}
                          {...form.register(`rows.${index}.price`)}
                        />
                        {errs?.price && <p className="mt-1 text-xs text-destructive">{errs.price.message}</p>}
                      </TableCell>
                      <TableCell>
                        <Input aria-label={`${v.title} stock`} inputMode="numeric" className="h-8" {...form.register(`rows.${index}.stock`)} />
                        {errs?.stock && <p className="mt-1 text-xs text-destructive">{errs.stock.message}</p>}
                      </TableCell>
                      <TableCell className="text-right tabular">{v.reserved}</TableCell>
                      <TableCell className="text-right tabular">{v.available}</TableCell>
                      <TableCell>
                        <Controller
                          control={form.control}
                          name={`rows.${index}.isActive`}
                          render={({ field: f }) => (
                            <Switch aria-label={`${v.title} active`} checked={f.value} onCheckedChange={f.onChange} />
                          )}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          <div className="flex flex-wrap items-end gap-3">
            {stockChanged && (
              <>
                <div className="space-y-1.5">
                  <Label>Stock change reason</Label>
                  <Controller
                    control={form.control}
                    name="reason"
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger className="w-[160px]" aria-label="Stock change reason">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {STOCK_REASONS.map((r) => (
                            <SelectItem key={r} value={r}>
                              {REASON_LABELS[r]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
                <div className="space-y-1.5 flex-1 min-w-[200px]">
                  <Label htmlFor="stock-note">Note (optional)</Label>
                  <Input id="stock-note" {...form.register("note")} />
                </div>
              </>
            )}
            <Button
              type="button"
              className="ml-auto font-display text-xs"
              disabled={save.isPending || !form.formState.isDirty}
              onClick={form.handleSubmit(onSubmit)}
            >
              {save.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Save variants
            </Button>
          </div>
        </div>
      )}

      <GenerateVariantsDialog product={product} open={generateOpen} onOpenChange={setGenerateOpen} />
    </div>
  );
}

const generateSchema = z.object({
  defaultPrice: priceString,
  defaultStock: z.string().refine((s) => /^\d+$/.test(s.trim()), "Whole number"),
  skuPrefix: z.string().refine((s) => s.trim() === "" || /^[A-Z0-9-]{1,24}$/.test(s.trim().toUpperCase()), "A-Z, 0-9 and dashes, max 24"),
  deactivateMissing: z.boolean(),
});
type GenerateValues = z.infer<typeof generateSchema>;

function GenerateVariantsDialog({
  product,
  open,
  onOpenChange,
}: {
  product: AdminProduct;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const generate = useGenerateVariants(product.id);
  const form = useForm<GenerateValues>({
    resolver: zodResolver(generateSchema),
    defaultValues: { defaultPrice: "", defaultStock: "0", skuPrefix: "", deactivateMissing: true },
  });
  const errors = form.formState.errors;

  const onSubmit = (v: GenerateValues) =>
    generate.mutate(
      {
        defaultPrice: rupeesToPaise(v.defaultPrice),
        defaultStock: Number(v.defaultStock),
        deactivateMissing: v.deactivateMissing,
        ...(v.skuPrefix.trim() ? { skuPrefix: v.skuPrefix.trim().toUpperCase() } : {}),
      },
      {
        onSuccess: (variants) => {
          toast.success(`${variants.length} variant${variants.length === 1 ? "" : "s"} ready.`);
          onOpenChange(false);
        },
        onError: (e) => toast.error(e.message),
      },
    );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-none">
        <DialogHeader>
          <DialogTitle className="font-display text-base">Generate variants</DialogTitle>
          <DialogDescription>
            Creates one variant per option combination. Existing variants keep their SKU, price and stock.
          </DialogDescription>
        </DialogHeader>
        <form
          id="generate-variants"
          className="space-y-4"
          onSubmit={(e) => {
            // React events bubble through the portal into the product form; keep this submit local.
            e.stopPropagation();
            form.handleSubmit(onSubmit)(e);
          }}
        >
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="gen-price">Price for new variants (₹)</Label>
              <Input id="gen-price" inputMode="decimal" placeholder="Base price" {...form.register("defaultPrice")} />
              {errors.defaultPrice && <p className="text-xs text-destructive">{errors.defaultPrice.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="gen-stock">Stock for new variants</Label>
              <Input id="gen-stock" inputMode="numeric" {...form.register("defaultStock")} />
              {errors.defaultStock && <p className="text-xs text-destructive">{errors.defaultStock.message}</p>}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="gen-prefix">SKU prefix</Label>
            <Input id="gen-prefix" className="uppercase" placeholder="Derived from the slug" {...form.register("skuPrefix")} />
            {errors.skuPrefix && <p className="text-xs text-destructive">{errors.skuPrefix.message}</p>}
          </div>
          <Controller
            control={form.control}
            name="deactivateMissing"
            render={({ field }) => (
              <div className="flex items-center gap-2">
                <Checkbox id="gen-deactivate" checked={field.value} onCheckedChange={(c) => field.onChange(c === true)} />
                <Label htmlFor="gen-deactivate" className="font-normal">
                  Deactivate variants whose combination no longer exists
                </Label>
              </div>
            )}
          />
        </form>
        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" form="generate-variants" disabled={generate.isPending} className="font-display text-xs">
            {generate.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Generate
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
