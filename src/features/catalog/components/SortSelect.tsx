import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { ProductSort } from "../types";
import { SORT_OPTIONS } from "../view";

const SortSelect = ({ value, onChange }: { value: ProductSort; onChange: (v: ProductSort) => void }) => (
  <Select value={value} onValueChange={(v) => onChange(v as ProductSort)}>
    <SelectTrigger
      aria-label="Sort products"
      className="w-full sm:w-52 h-[38px] justify-start gap-1 rounded-none bg-card border-border py-0 font-display [&>svg]:ml-auto text-xs text-muted-foreground focus:ring-0 focus:border-primary/50"
    >
      <span className="text-muted-foreground/60 mr-1">Sort:</span>
      <SelectValue />
    </SelectTrigger>
    <SelectContent className="rounded-none border-border bg-[#1c1f16]">
      {SORT_OPTIONS.map((o) => (
        <SelectItem key={o.value} value={o.value} className="rounded-none font-display text-xs">
          {o.label}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
);

export default SortSelect;
