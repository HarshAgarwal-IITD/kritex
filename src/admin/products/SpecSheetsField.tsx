import { useFieldArray, useFormContext } from "react-hook-form";
import { ExternalLink, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ProductFormValues } from "./form";
import { FileUploadButton } from "./FileUploadButton";

export function SpecSheetsField() {
  const { control, register, formState } = useFormContext<ProductFormValues>();
  const { fields, append, remove } = useFieldArray({ control, name: "specSheets" });
  const errors = formState.errors.specSheets;

  return (
    <div className="space-y-3">
      {fields.length === 0 && <p className="text-sm text-muted-foreground">No spec sheets.</p>}
      {fields.map((field, index) => (
        <div key={field.id} className="flex items-start gap-2">
          <div className="flex-1">
            <Input aria-label={`Spec sheet ${index + 1} title`} {...register(`specSheets.${index}.title`)} />
            {errors?.[index]?.title && <p className="mt-1 text-sm text-destructive">{errors[index]?.title?.message}</p>}
          </div>
          <Button type="button" variant="ghost" size="icon" asChild aria-label="Open spec sheet">
            <a href={field.url} target="_blank" rel="noreferrer">
              <ExternalLink className="h-4 w-4" />
            </a>
          </Button>
          <Button type="button" variant="ghost" size="icon" aria-label={`Remove spec sheet ${index + 1}`} onClick={() => remove(index)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
      <FileUploadButton
        purpose="SPEC_SHEET"
        label="Upload spec sheet"
        multiple
        disabled={fields.length >= 20}
        onUploaded={(file, url) => append({ title: file.name.replace(/\.[^.]+$/, ""), url })}
      />
    </div>
  );
}
