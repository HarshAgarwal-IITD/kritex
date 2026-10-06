import { Controller, useFieldArray, useFormContext, useWatch } from "react-hook-form";
import { ArrowLeft, ArrowRight, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { ProductFormValues } from "./form";
import { FileUploadButton } from "./FileUploadButton";

const NONE = "__none";

export function ImagesField() {
  const { control, register } = useFormContext<ProductFormValues>();
  const { fields, append, remove, move } = useFieldArray({ control, name: "images" });
  const options = useWatch({ control, name: "options" }) ?? [];
  const optionValues = Array.from(new Set(options.flatMap((o) => o.values)));

  return (
    <div className="space-y-4">
      {fields.length === 0 && <p className="text-sm text-muted-foreground">No images yet. The first image is the main one.</p>}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {fields.map((field, index) => (
          <div key={field.id} className="border border-border p-3 space-y-2">
            <div className="relative aspect-square bg-secondary/40 overflow-hidden">
              <img src={field.url} alt={field.alt || ""} className="h-full w-full object-contain" />
              {index === 0 && (
                <span className="absolute left-2 top-2 bg-primary px-2 py-0.5 font-display text-[10px] text-primary-foreground">
                  Main
                </span>
              )}
            </div>
            <Input aria-label={`Image ${index + 1} alt text`} placeholder="Alt text" {...register(`images.${index}.alt`)} />
            {optionValues.length > 0 && (
              <Controller
                control={control}
                name={`images.${index}.variantOptionValue`}
                render={({ field: f }) => (
                  <Select value={f.value || NONE} onValueChange={(v) => f.onChange(v === NONE ? "" : v)}>
                    <SelectTrigger aria-label={`Image ${index + 1} option value`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NONE}>All variants</SelectItem>
                      {optionValues.map((v) => (
                        <SelectItem key={v} value={v}>
                          {v}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            )}
            <div className="flex justify-between">
              <div className="flex gap-1">
                <Button type="button" variant="ghost" size="icon" aria-label="Move image left" disabled={index === 0} onClick={() => move(index, index - 1)}>
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="Move image right"
                  disabled={index === fields.length - 1}
                  onClick={() => move(index, index + 1)}
                >
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
              <Button type="button" variant="ghost" size="icon" aria-label={`Remove image ${index + 1}`} onClick={() => remove(index)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
      <FileUploadButton
        purpose="PRODUCT_IMAGE"
        label="Upload images"
        multiple
        disabled={fields.length >= 50}
        onUploaded={(file, url) => append({ url, alt: "", variantOptionValue: "" })}
      />
    </div>
  );
}
