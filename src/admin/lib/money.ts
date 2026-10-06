const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" });

/** Formats integer paise for display. `null` renders as an em dash. */
export function formatPaise(paise: number | null | undefined): string {
  if (paise == null) return "—";
  return inr.format(paise / 100);
}

/** Rupee input strings ("1299", "1299.5", "1,299.50") are valid when they have at most 2 decimals. */
export const RUPEES_PATTERN = /^\d+(\.\d{1,2})?$/;

export function normaliseRupees(input: string): string {
  return input.replace(/[,\s₹]/g, "");
}

/** "1299.50" -> 129950. Empty -> null. Throws on invalid input (validate with RUPEES_PATTERN first). */
export function rupeesToPaise(input: string): number | null {
  const s = normaliseRupees(input);
  if (s === "") return null;
  if (!RUPEES_PATTERN.test(s)) throw new Error(`Invalid rupee amount: ${input}`);
  const [whole, frac = ""] = s.split(".");
  return Number(whole) * 100 + Number(frac.padEnd(2, "0"));
}

/** 129950 -> "1299.50", 129900 -> "1299". null -> "". */
export function paiseToRupees(paise: number | null | undefined): string {
  if (paise == null) return "";
  const whole = Math.floor(paise / 100);
  const frac = paise % 100;
  return frac === 0 ? String(whole) : `${whole}.${String(frac).padStart(2, "0")}`;
}
