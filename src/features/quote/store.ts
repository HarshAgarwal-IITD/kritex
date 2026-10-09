import { useSyncExternalStore } from "react";
import type { QuoteCartLine } from "./types";

/**
 * The quote cart: products the visitor wants priced, kept client-side until the RFQ is sent (`POST /quotes`).
 * Persisted in localStorage (best effort: private windows / blocked storage just keep it in memory).
 */
export const QUOTE_CART_STORAGE_KEY = "kritex.quoteCart";
export const MAX_QUOTE_QUANTITY = 99999;
const MAX_LINES = 50;

type Listener = () => void;
const listeners = new Set<Listener>();
let lines: QuoteCartLine[] = load();

function isLine(v: unknown): v is QuoteCartLine {
  const l = v as QuoteCartLine;
  return !!l && typeof l.productId === "string" && typeof l.productName === "string" && Number.isInteger(l.quantity) && l.quantity > 0;
}

function load(): QuoteCartLine[] {
  try {
    const raw = globalThis.localStorage?.getItem(QUOTE_CART_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.filter(isLine).slice(0, MAX_LINES) : [];
  } catch {
    return [];
  }
}

function save() {
  try {
    if (lines.length) globalThis.localStorage?.setItem(QUOTE_CART_STORAGE_KEY, JSON.stringify(lines));
    else globalThis.localStorage?.removeItem(QUOTE_CART_STORAGE_KEY);
  } catch {
    // Storage unavailable: the quote cart lives for this page session only.
  }
}

function commit(next: QuoteCartLine[]) {
  lines = next;
  save();
  listeners.forEach((l) => l());
}

const sameLine = (a: Pick<QuoteCartLine, "productId" | "variantId">, b: Pick<QuoteCartLine, "productId" | "variantId">) =>
  a.productId === b.productId && (a.variantId ?? null) === (b.variantId ?? null);

const clampQty = (q: number) => Math.min(MAX_QUOTE_QUANTITY, Math.max(1, Math.round(q)));

export const quoteCart = {
  get: () => lines,
  /** Adds a line, or adds to the quantity of the same product/variant. */
  add(line: QuoteCartLine) {
    const existing = lines.find((l) => sameLine(l, line));
    if (existing) {
      commit(lines.map((l) => (l === existing ? { ...l, quantity: clampQty(l.quantity + line.quantity) } : l)));
    } else if (lines.length < MAX_LINES) {
      commit([...lines, { ...line, quantity: clampQty(line.quantity) }]);
    }
  },
  update(key: Pick<QuoteCartLine, "productId" | "variantId">, patch: Partial<Pick<QuoteCartLine, "quantity" | "notes">>) {
    commit(
      lines.map((l) =>
        sameLine(l, key) ? { ...l, ...patch, ...(patch.quantity !== undefined ? { quantity: clampQty(patch.quantity) } : {}) } : l,
      ),
    );
  },
  remove(key: Pick<QuoteCartLine, "productId" | "variantId">) {
    commit(lines.filter((l) => !sameLine(l, key)));
  },
  clear() {
    commit([]);
  },
  subscribe(listener: Listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  /** Tests: reload from storage. */
  reload() {
    lines = load();
    listeners.forEach((l) => l());
  },
};

// Keep tabs in sync.
if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.key === QUOTE_CART_STORAGE_KEY || e.key === null) quoteCart.reload();
  });
}

export const lineKey = (l: Pick<QuoteCartLine, "productId" | "variantId">) => `${l.productId}:${l.variantId ?? ""}`;

/** The quote cart's lines (re-renders on change). */
export function useQuoteCart(): QuoteCartLine[] {
  return useSyncExternalStore(quoteCart.subscribe, quoteCart.get, quoteCart.get);
}

export function useQuoteCount(): number {
  return useQuoteCart().length;
}
