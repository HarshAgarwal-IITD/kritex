import { useFieldArray, useFormContext } from "react-hook-form";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ProductFormValues } from "./form";

export function PriceTiersField() {
  const { control, register, formState } = useFormContext<ProductFormValues>();
  const { fields, append, remove } = useFieldArray({ control, name: "priceTiers" });
  const errors = formState.errors.priceTiers;

  return (
    <div className="space-y-3">
      {fields.length > 0 && (
        <div className="grid grid-cols-[1fr_1fr_auto] gap-2">
          <Label>Minimum quantity</Label>
          <Label>Unit price (₹)</Label>
          <span className="w-10" />
        </div>
      )}
      {fields.map((field, index) => (
        <div key={field.id} className="grid grid-cols-[1fr_1fr_auto] items-start gap-2">
          <div>
            <Input inputMode="numeric" aria-label={`Tier ${index + 1} minimum quantity`} {...register(`priceTiers.${index}.minQty`)} />
            {errors?.[index]?.minQty && <p className="mt-1 text-sm text-destructive">{errors[index]?.minQty?.message}</p>}
          </div>
          <div>
            <Input inputMode="decimal" aria-label={`Tier ${index + 1} unit price`} {...register(`priceTiers.${index}.unitPrice`)} />
            {errors?.[index]?.unitPrice && <p className="mt-1 text-sm text-destructive">{errors[index]?.unitPrice?.message}</p>}
          </div>
          <Button type="button" variant="ghost" size="icon" aria-label={`Remove tier ${index + 1}`} onClick={() => remove(index)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
      {errors?.root?.message && <p className="text-sm text-destructive">{errors.root.message}</p>}
      <Button type="button" variant="outline" size="sm" disabled={fields.length >= 20} onClick={() => append({ minQty: "", unitPrice: "" })}>
        <Plus className="h-4 w-4" /> Add tier
      </Button>
    </div>
  );
}
