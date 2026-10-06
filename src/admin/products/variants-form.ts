import { z } from "zod";
import type { VariantChange } from "../api/products";
import type { AdjustStockInput, AdminProduct, UpdateVariantInput } from "../api/types";
import { RUPEES_PATTERN, normaliseRupees, rupeesToPaise } from "../lib/money";

export const SKU_PATTERN = /^[A-Z0-9][A-Z0-9._-]{1,63}$/;
export const STOCK_REASONS: AdjustStockInput["reason"][] = ["RESTOCK", "ADJUST", "RETURN"];
export const REASON_LABELS: Record<AdjustStockInput["reason"], string> = { RESTOCK: "Restock", ADJUST: "Adjustment", RETURN: "Return" };

export const priceString = z.string().refine((s) => {
  const n = normaliseRupees(s);
  return n === "" || RUPEES_PATTERN.test(n);
}, "Invalid amount");

export const variantsFormSchema = z.object({
  rows: z.array(
    z.object({
      id: z.string(),
      sku: z.string().trim().toUpperCase().pipe(z.string().regex(SKU_PATTERN, "A-Z, 0-9, . _ -")),
      price: priceString,
      stock: z.string().refine((s) => /^\d+$/.test(s.trim()), "Whole number"),
      isActive: z.boolean(),
    }),
  ),
  reason: z.enum(["RESTOCK", "ADJUST", "RETURN"]),
  note: z.string().max(500),
});
export type VariantsFormInput = z.input<typeof variantsFormSchema>;
export type VariantsFormValues = z.output<typeof variantsFormSchema>;

/** Diffs the edited rows against the saved variants. */
export function variantChanges(product: AdminProduct, values: VariantsFormValues): VariantChange[] {
  const changes: VariantChange[] = [];
  for (const row of values.rows) {
    const original = product.variants.find((v) => v.id === row.id);
    if (!original) continue;
    const patch: UpdateVariantInput = {};
    if (row.sku !== original.sku) patch.sku = row.sku;
    const price = rupeesToPaise(row.price);
    if (price !== original.price) patch.price = price;
    if (row.isActive !== original.isActive) patch.isActive = row.isActive;
    const delta = Number(row.stock) - original.stock;
    const change: VariantChange = { id: row.id };
    if (Object.keys(patch).length) change.patch = patch;
    if (delta !== 0) change.stock = { delta, reason: values.reason, ...(values.note.trim() ? { note: values.note.trim() } : {}) };
    if (change.patch || change.stock) changes.push(change);
  }
  return changes;
}

