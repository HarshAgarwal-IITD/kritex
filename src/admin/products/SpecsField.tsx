import { useFieldArray, useFormContext } from "react-hook-form";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ProductFormValues } from "./form";

export function SpecsField() {
  const { control, register, formState } = useFormContext<ProductFormValues>();
  const { fields, append, remove } = useFieldArray({ control, name: "specs" });
  const errors = formState.errors.specs;

  return (
    <div className="space-y-3">
      {fields.map((field, index) => (
        <div key={field.id} className="grid grid-cols-[1fr_2fr_auto] items-start gap-2">
          <div>
            <Input aria-label={`Spec ${index + 1} label`} placeholder="Label (e.g. Material)" {...register(`specs.${index}.label`)} />
            {errors?.[index]?.label && <p className="mt-1 text-sm text-destructive">{errors[index]?.label?.message}</p>}
          </div>
          <Input aria-label={`Spec ${index + 1} value`} placeholder="Value" {...register(`specs.${index}.value`)} />
          <Button type="button" variant="ghost" size="icon" aria-label={`Remove spec ${index + 1}`} onClick={() => remove(index)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={() => append({ label: "", value: "" })}>
        <Plus className="h-4 w-4" /> Add spec
      </Button>
    </div>
  );
}
