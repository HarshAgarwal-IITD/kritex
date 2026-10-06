import { Controller, useFieldArray, useFormContext, useWatch } from "react-hook-form";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { combinations, type ProductFormValues } from "./form";
import { OptionValuesInput } from "./OptionValuesInput";

const SUGGESTED = ["Size", "Colour"];

export function OptionsField() {
  const { control, register, formState } = useFormContext<ProductFormValues>();
  const { fields, append, remove } = useFieldArray({ control, name: "options" });
  const options = useWatch({ control, name: "options" });
  const combos = combinations(options ?? []);
  const errors = formState.errors.options;

  const addOption = () => {
    const used = new Set((options ?? []).map((o) => o.name.toLowerCase()));
    const name = SUGGESTED.find((s) => !used.has(s.toLowerCase())) ?? "";
    append({ name, values: [], swatches: null });
  };

  return (
    <div className="space-y-4">
      {fields.map((field, index) => (
        <div key={field.id} className="grid gap-3 border border-border p-4 md:grid-cols-[180px_1fr_auto]">
          <div className="space-y-2">
            <Label htmlFor={`option-${index}-name`}>Option name</Label>
            <Input id={`option-${index}-name`} {...register(`options.${index}.name`)} />
            {errors?.[index]?.name && <p className="text-sm text-destructive">{errors[index]?.name?.message}</p>}
          </div>
          <div className="space-y-2">
            <Label>Values</Label>
            <Controller
              control={control}
              name={`options.${index}.values`}
              render={({ field: f, fieldState }) => (
                <OptionValuesInput
                  label={`${options?.[index]?.name || `Option ${index + 1}`} values`}
                  value={f.value}
                  onChange={f.onChange}
                  invalid={!!fieldState.error}
                />
              )}
            />
            {errors?.[index]?.values && (
              <p className="text-sm text-destructive">
                {errors[index]?.values?.message ?? errors[index]?.values?.root?.message}
              </p>
            )}
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="self-start md:mt-7"
            aria-label={`Remove option ${options?.[index]?.name || index + 1}`}
            onClick={() => remove(index)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
      {errors?.root?.message && <p className="text-sm text-destructive">{errors.root.message}</p>}
      {errors?.message && <p className="text-sm text-destructive">{errors.message}</p>}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button type="button" variant="outline" size="sm" onClick={addOption} disabled={fields.length >= 5}>
          <Plus className="h-4 w-4" /> Add option
        </Button>
        <p className="text-xs text-muted-foreground tabular">
          {combos.length
            ? `${combos.length} combination${combos.length === 1 ? "" : "s"}`
            : "No options: one default variant."}
        </p>
      </div>
    </div>
  );
}
