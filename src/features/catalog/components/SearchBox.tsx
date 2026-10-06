import { useEffect, useId, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { SUGGEST_MIN_CHARS, useSearchSuggest } from "../hooks";
import type { SearchSuggestion } from "../types";
import { useDebouncedValue } from "../useDebouncedValue";
import { assetUrl, suggestionHref } from "../view";

interface SearchBoxProps {
  /** The applied search term (e.g. from the URL). */
  value: string;
  /** Called (debounced) as the user types, and immediately on Enter. */
  onSearch: (q: string) => void;
  className?: string;
}

/** Product search input with type-ahead suggestions (products + categories). */
const SearchBox = ({ value, onSearch, className }: SearchBoxProps) => {
  const navigate = useNavigate();
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [text, setText] = useState(value);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const debounced = useDebouncedValue(text, 250);

  // Keep the box in sync when the applied term changes elsewhere (back button, cleared filter).
  useEffect(() => setText(value), [value]);

  useEffect(() => {
    if (debounced.trim() !== value.trim()) onSearch(debounced.trim());
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only react to the debounced text
  }, [debounced]);

  const { data } = useSearchSuggest(debounced);
  const suggestions = debounced.trim().length >= SUGGEST_MIN_CHARS ? (data?.items ?? []) : [];
  const showList = open && suggestions.length > 0;

  useEffect(() => setActive(-1), [debounced]);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  const go = (s: SearchSuggestion) => {
    setOpen(false);
    navigate(suggestionHref(s));
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown" && suggestions.length) {
      e.preventDefault();
      setOpen(true);
      setActive((i) => (i + 1) % suggestions.length);
    } else if (e.key === "ArrowUp" && suggestions.length) {
      e.preventDefault();
      setActive((i) => (i <= 0 ? suggestions.length - 1 : i - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (showList && active >= 0) go(suggestions[active]);
      else {
        setOpen(false);
        onSearch(text.trim());
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div ref={rootRef} className={cn("relative w-full sm:w-64", className)}>
      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
      <input
        type="text"
        role="combobox"
        aria-label="Search products"
        aria-expanded={showList}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={showList && active >= 0 ? `${listId}-${active}` : undefined}
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
        placeholder="Search products..."
        className="w-full bg-card border border-border pl-9 pr-3 py-2 font-body text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-colors duration-200"
      />
      {showList && (
        <ul
          id={listId}
          role="listbox"
          aria-label="Search suggestions"
          className="absolute right-0 top-full z-30 mt-1 w-full sm:w-96 border border-border bg-[#1c1f16] shadow-xl max-h-80 overflow-y-auto"
        >
          {suggestions.map((s, i) => (
            <li
              key={`${s.type}-${s.slug}`}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={i === active}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => go(s)}
              onMouseEnter={() => setActive(i)}
              className={cn(
                "flex cursor-pointer items-center gap-3 px-3 py-2 transition-colors duration-200",
                i === active ? "bg-white/5 text-primary" : "text-muted-foreground",
              )}
            >
              <span className="h-8 w-8 shrink-0 overflow-hidden bg-neutral-100 p-0.5">
                {s.image && <img src={assetUrl(s.image)} alt="" className="h-full w-full object-contain" loading="lazy" />}
              </span>
              <span className="min-w-0 flex-1 truncate font-display text-xs">{s.name}</span>
              <span className="shrink-0 font-display text-[9px] uppercase tracking-wider text-muted-foreground/60">
                {s.type === "category" ? "Category" : "Product"}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default SearchBox;
