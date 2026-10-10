import type { paths } from "@/lib/api/schema";
import type { CreateQuoteInput } from "@/features/quote/types";

type CreateQueryInput = paths["/api/v1/queries"]["post"]["requestBody"]["content"]["application/json"];

/**
 * An enquiry a guest filled in before logging in (ADR-018). It is kept in localStorage while they
 * sign in (password, email code, Google, or sign-up + email verification in the same browser) and
 * sent by `PendingEnquirySender` as soon as a verified session exists.
 */
export type PendingEnquiry =
  | { kind: "contact"; body: CreateQueryInput; savedAt: number }
  | { kind: "quote"; body: CreateQuoteInput; savedAt: number };

export const PENDING_ENQUIRY_STORAGE_KEY = "kritex_pending_enquiry";
/** Drafts older than this are dropped rather than sent out of the blue. */
const MAX_AGE_MS = 24 * 60 * 60 * 1000;

export function savePendingEnquiry(enquiry: Omit<PendingEnquiry, "savedAt">): void {
  try {
    localStorage.setItem(PENDING_ENQUIRY_STORAGE_KEY, JSON.stringify({ ...enquiry, savedAt: Date.now() }));
  } catch {
    // Storage unavailable (private mode): the user just re-sends after logging in.
  }
}

export function loadPendingEnquiry(): PendingEnquiry | null {
  try {
    const raw = localStorage.getItem(PENDING_ENQUIRY_STORAGE_KEY);
    if (!raw) return null;
    const value = JSON.parse(raw) as PendingEnquiry;
    if ((value?.kind !== "contact" && value?.kind !== "quote") || typeof value.savedAt !== "number") {
      clearPendingEnquiry();
      return null;
    }
    if (Date.now() - value.savedAt > MAX_AGE_MS) {
      clearPendingEnquiry();
      return null;
    }
    return value;
  } catch {
    clearPendingEnquiry();
    return null;
  }
}

export function clearPendingEnquiry(): void {
  try {
    localStorage.removeItem(PENDING_ENQUIRY_STORAGE_KEY);
  } catch {
    // ignore
  }
}
