const dateFmt = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" });
const dateTimeFmt = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

export const formatDate = (iso: string | null | undefined) => (iso ? dateFmt.format(new Date(iso)) : "—");
export const formatDateTime = (iso: string | null | undefined) => (iso ? dateTimeFmt.format(new Date(iso)) : "—");

const pad = (n: number) => String(n).padStart(2, "0");

/** "2026-10-07" (a local calendar day from <input type="date">) -> ISO instant of local midnight that day. */
export function dayStartIso(day: string): string {
  const [y, m, d] = day.split("-").map(Number);
  return new Date(y, m - 1, d).toISOString();
}

/** Exclusive upper bound for an inclusive "to" day: local midnight of the following day. */
export function dayEndExclusiveIso(day: string): string {
  const [y, m, d] = day.split("-").map(Number);
  return new Date(y, m - 1, d + 1).toISOString();
}

/** ISO instant -> "YYYY-MM-DDTHH:mm" in local time for <input type="datetime-local">. null -> "". */
export function isoToLocalInput(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** "YYYY-MM-DDTHH:mm" (local) -> ISO instant. "" -> null. */
export function localInputToIso(value: string): string | null {
  return value ? new Date(value).toISOString() : null;
}

/** Saves a blob through a temporary object URL (used for the orders CSV export). */
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}
