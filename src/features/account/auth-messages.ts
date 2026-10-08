import { z } from "zod";
import type { ApiError } from "@/lib/api/client";

/** Better Auth's default password length bounds. */
export const passwordRules = z.string().min(8, "Use at least 8 characters").max(128, "Use at most 128 characters");

/** Only redirect back into this site (no open redirects, no auth-page loops). */
export function safeNext(next: string | null | undefined, fallback = "/account"): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return fallback;
  if (/^\/(login|signup|forgot-password|reset-password)(\/|\?|$)/.test(next)) return fallback;
  return next;
}

/** Better Auth error codes → customer-facing text. */
export function authErrorMessage(err: ApiError): string {
  switch (err.code) {
    case "INVALID_EMAIL_OR_PASSWORD":
      return "Invalid email or password.";
    case "EMAIL_NOT_VERIFIED":
      return "Please verify your email first. Check your inbox for the link we sent.";
    case "ACCOUNT_DISABLED":
    case "BANNED_USER":
      return "This account has been disabled. Contact us for help.";
    case "USER_ALREADY_EXISTS":
    case "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL":
      return "An account with this email already exists. Log in instead.";
    case "PASSWORD_TOO_SHORT":
      return "Password is too short.";
    case "PASSWORD_TOO_LONG":
      return "Password is too long.";
    case "INVALID_OTP":
      return "That code isn't right. Check it and try again.";
    case "OTP_EXPIRED":
      return "That code has expired. Request a new one.";
    case "TOO_MANY_ATTEMPTS":
      return "Too many wrong attempts. Request a new code.";
    case "INVALID_TOKEN":
      return "This reset link is invalid or has expired. Request a new one.";
    case "TOO_MANY_REQUESTS":
    case "HTTP_429":
      return "Too many attempts. Please wait a minute and try again.";
    case "NETWORK_ERROR":
      return "Network error. Check your connection and try again.";
    default:
      if (err.status === 401) return "Invalid email or password.";
      return err.message || "Something went wrong. Please try again.";
  }
}
