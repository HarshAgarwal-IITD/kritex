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
};
