import { ApiError } from "@/lib/api/client";

/**
 * Tiny typed client for the Better Auth routes mounted at `/api/v1/auth/*` on kritex-server.
 * These routes are not part of the OpenAPI contract, so they are called with fetch directly.
 * The session lives in the httpOnly `better-auth.session_token` cookie, hence `credentials: "include"`.
 * The user's role comes from `GET /me` (generated client), not from here.
 */

const AUTH_BASE = `${import.meta.env.VITE_API_URL ?? ""}/api/v1/auth`;

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  emailVerified: boolean;
  image?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthSession {
  session: { id: string; userId: string; expiresAt: string };
  user: AuthUser;
}

export interface SignInEmailInput {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface SignUpEmailInput {
  name: string;
  email: string;
  password: string;
  /** Where the emailed verification link lands after verifying. */
  callbackURL?: string;
}

export type EmailOtpType = "sign-in" | "email-verification" | "forget-password";

export interface SignInEmailResult {
  redirect?: boolean;
  token: string;
  user: AuthUser;
}

/** Better Auth errors are `{ code?, message }`; our API uses `{ error: { code, message } }`. Accept both. */
async function toAuthError(res: Response): Promise<ApiError> {
  let body: unknown = null;
  try {
    body = await res.json();
  } catch {
    // empty or non-JSON body
  }
  if (body && typeof body === "object") {
    const b = body as { code?: unknown; message?: unknown; error?: { code?: unknown; message?: unknown } };
    const src = b.error && typeof b.error === "object" ? b.error : b;
    if (typeof src.message === "string") {
      return new ApiError(typeof src.code === "string" ? src.code : `HTTP_${res.status}`, src.message, res.status, body);
    }
  }
  return new ApiError(`HTTP_${res.status}`, res.statusText || "Request failed", res.status, body);
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${AUTH_BASE}${path}`, {
      credentials: "include",
      ...init,
      headers: { ...(init?.body ? { "Content-Type": "application/json" } : {}), ...init?.headers },
    });
  } catch (cause) {
    throw new ApiError("NETWORK_ERROR", "Network error", 0, cause);
  }
  if (!res.ok) throw await toAuthError(res);
  const text = await res.text();
  return (text ? JSON.parse(text) : null) as T;
}

export const authClient = {
  signInEmail(input: SignInEmailInput) {
    return request<SignInEmailResult>("/sign-in/email", { method: "POST", body: JSON.stringify(input) });
  },
  /** Returns null when there is no session (Better Auth answers 200 with a `null` body). */
  async getSession(): Promise<AuthSession | null> {
    return (await request<AuthSession | null>("/get-session")) ?? null;
  },
  signOut() {
    return request<{ success: boolean }>("/sign-out", { method: "POST", body: "{}" });
  },

  // ---- Storefront account flows (Stage 3). Additive; the admin only uses the methods above. ----

  /** Creates the account and emails a verification link. No session until the email is verified. */
  signUpEmail(input: SignUpEmailInput) {
    return request<{ token: string | null; user: AuthUser }>("/sign-up/email", { method: "POST", body: JSON.stringify(input) });
  },
  /** Re-sends the verification link (e.g. after sign-in fails with EMAIL_NOT_VERIFIED). */
  sendVerificationEmail(input: { email: string; callbackURL?: string }) {
    return request<{ status: boolean }>("/send-verification-email", { method: "POST", body: JSON.stringify(input) });
  },
  /** Emails a reset link; the server redirects it to `redirectTo?token=...`. */
  requestPasswordReset(input: { email: string; redirectTo: string }) {
    return request<{ status: boolean }>("/request-password-reset", { method: "POST", body: JSON.stringify(input) });
  },
  resetPassword(input: { token: string; newPassword: string }) {
    return request<{ status: boolean }>("/reset-password", { method: "POST", body: JSON.stringify(input) });
  },
  /** Sends a 6-digit one-time code by email. */
  sendEmailOtp(input: { email: string; type: EmailOtpType }) {
    return request<{ success: boolean }>("/email-otp/send-verification-otp", { method: "POST", body: JSON.stringify(input) });
  },
  signInEmailOtp(input: { email: string; otp: string }) {
    return request<SignInEmailResult>("/sign-in/email-otp", { method: "POST", body: JSON.stringify(input) });
  },
};
