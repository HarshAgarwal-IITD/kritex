import type { paths } from "@/lib/api/schema";
import type { CreateQuoteInput } from "@/features/quote/types";

type CreateQueryInput = paths["/api/v1/queries"]["post"]["requestBody"]["content"]["application/json"];

/**
 * An enquiry a guest filled in before logging in (ADR-018). It is kept in localStorage while they
 * sign in (password, email code, Google, or sign-up + the emailed verification code) and the form
 * restores it when they come back (`?next=`), so they review it and press Send. It is cleared once sent.
 */
export type PendingEnquiry =
  | { kind: "contact"; body: CreateQueryInput; savedAt: number }
  | { kind: "quote"; body: CreateQuoteInput; savedAt: number };

/** Login / sign-up intro while a draft is waiting. */
export const SAVED_ENQUIRY_INTRO =
  "Your inquiry is saved. Log in or create an account (we'll email you a 6-digit code) and we'll take you back to it to send.";

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

/** The saved draft of one form, if any (kept until it is sent). */
export function loadPendingDraft(kind: "contact"): CreateQueryInput | null;
export function loadPendingDraft(kind: "quote"): CreateQuoteInput | null;
export function loadPendingDraft(kind: PendingEnquiry["kind"]): CreateQueryInput | CreateQuoteInput | null {
  const enquiry = loadPendingEnquiry();
  return enquiry?.kind === kind ? enquiry.body : null;
}

export function clearPendingEnquiry(): void {
  try {
    localStorage.removeItem(PENDING_ENQUIRY_STORAGE_KEY);
  } catch {
    // ignore
  }
}
