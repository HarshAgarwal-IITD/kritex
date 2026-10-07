import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

export function useDebounced<T>(value: T, ms: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return debounced;
}

/**
 * List filters kept in the URL (`?status=…&page=2`). Changing any filter other than `page` resets to page 1.
 * `search` is a debounced text box mirrored into `?q`.
 */
export function useUrlFilters() {
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState(params.get("q") ?? "");
  const debouncedSearch = useDebounced(search.trim(), 300);

  const setParam = (key: string, value: string | undefined) =>
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (value) next.set(key, value);
        else next.delete(key);
        if (key !== "page") next.delete("page");
        return next;
      },
      { replace: true },
    );

  useEffect(() => {
    if ((params.get("q") ?? "") !== debouncedSearch) setParam("q", debouncedSearch || undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  const get = (key: string) => params.get(key) || undefined;
  const page = Math.max(1, Number(params.get("page") ?? 1) || 1);
  return { get, setParam, page, search, setSearch };
}
