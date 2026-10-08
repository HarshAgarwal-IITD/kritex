import { useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { api, toApiError, type ApiError } from "@/lib/api/client";
import { authClient, type AuthSession, type SignUpEmailInput } from "@/lib/auth/client";
import { cartKeys } from "@/features/cart/hooks";
import type {
  ApplyBusinessProfileInput,
  BusinessProfile,
  CreateAddressInput,
  InvoiceLink,
  Me,
  OrderDetail,
  OrderList,
  ReturnRequestInput,
  SavedAddress,
  UpdateAddressInput,
  UpdateMeInput,
} from "./types";

/** `session` and `me` share their keys with the admin app (src/admin/api/keys.ts) so both read one cache. */
export const accountKeys = {
  session: ["auth", "session"] as const,
  me: ["me"] as const,
  addresses: ["me", "addresses"] as const,
  orders: (page: number) => ["me", "orders", "list", page] as const,
  order: (number: string) => ["me", "orders", "detail", number] as const,
};

// ---------------------------------------------------------------------------------------------
// Session

export function useSession() {
  return useQuery<AuthSession | null, ApiError>({
    queryKey: accountKeys.session,
    queryFn: () => authClient.getSession(),
    staleTime: 60_000,
    retry: false,
  });
}

export async function fetchMe(): Promise<Me | null> {
  const { data, error, response } = await api.GET("/api/v1/me");
  if (response.status === 401) return null;
  if (error || !data) throw toApiError(error, response);
  return data;
}

export function useMe(enabled = true) {
  return useQuery<Me | null, ApiError>({ queryKey: accountKeys.me, queryFn: fetchMe, enabled, staleTime: 60_000, retry: false });
}

/** Session + profile for storefront pages. `user` is null for guests. */
export function useCurrentUser() {
  const session = useSession();
  const signedIn = !!session.data;
  const me = useMe(signedIn);
  return {
    user: signedIn ? (me.data ?? null) : null,
    isSignedIn: signedIn,
    isPending: session.isPending || (signedIn && me.isPending),
    isError: session.isError || me.isError,
    refetch: () => {
      void session.refetch();
      if (signedIn) void me.refetch();
    },
  };
}

/** After any sign-in: reload session + profile, and refetch the cart (the server merges the guest cart into the user's). */
async function afterSignIn(qc: QueryClient) {
  const [session, me] = await Promise.all([authClient.getSession(), fetchMe()]);
  qc.setQueryData(accountKeys.session, session);
  qc.setQueryData(accountKeys.me, me);
  await qc.invalidateQueries({ queryKey: cartKeys.cart });
  return me;
}

export function useLogin() {
  const qc = useQueryClient();
  return useMutation<Me | null, ApiError, { email: string; password: string }>({
    mutationFn: async ({ email, password }) => {
      await authClient.signInEmail({ email, password, rememberMe: true });
      return afterSignIn(qc);
    },
  });
}

export function useSendLoginOtp() {
  return useMutation<unknown, ApiError, { email: string }>({
    mutationFn: ({ email }) => authClient.sendEmailOtp({ email, type: "sign-in" }),
  });
}

export function useOtpLogin() {
  const qc = useQueryClient();
  return useMutation<Me | null, ApiError, { email: string; otp: string }>({
    mutationFn: async (input) => {
      await authClient.signInEmailOtp(input);
      return afterSignIn(qc);
    },
  });
}

export function useLogout() {
  const qc = useQueryClient();
  return useMutation<unknown, ApiError, void>({
    mutationFn: () => authClient.signOut(),
    onSettled: async () => {
      qc.setQueryData(accountKeys.session, null);
      qc.setQueryData(accountKeys.me, null);
      qc.removeQueries({ queryKey: ["me"], exact: false, predicate: (q) => q.queryKey.length > 1 });
      qc.removeQueries({ queryKey: ["checkout"] });
      // Signed out → the cart cookie no longer points at the user's cart.
      await qc.invalidateQueries({ queryKey: cartKeys.cart });
    },
  });
}

/** Where the emailed links land. Absolute URLs on this site. */
export const siteUrl = (path: string) => `${window.location.origin}${path}`;

export function useSignup() {
  return useMutation<unknown, ApiError, Omit<SignUpEmailInput, "callbackURL">>({
    mutationFn: (input) => authClient.signUpEmail({ ...input, callbackURL: siteUrl("/account") }),
  });
}

export function useResendVerification() {
  return useMutation<unknown, ApiError, { email: string }>({
    mutationFn: ({ email }) => authClient.sendVerificationEmail({ email, callbackURL: siteUrl("/account") }),
  });
}

export function useRequestPasswordReset() {
  return useMutation<unknown, ApiError, { email: string }>({
    mutationFn: ({ email }) => authClient.requestPasswordReset({ email, redirectTo: siteUrl("/reset-password") }),
  });
}

export function useResetPassword() {
  return useMutation<unknown, ApiError, { token: string; newPassword: string }>({
    mutationFn: (input) => authClient.resetPassword(input),
  });
}

// ---------------------------------------------------------------------------------------------
// Profile

export function useUpdateMe() {
  const qc = useQueryClient();
  return useMutation<Me, ApiError, UpdateMeInput>({
    mutationFn: async (body) => {
      const { data, error, response } = await api.PATCH("/api/v1/me", { body });
      if (error || !data) throw toApiError(error, response);
      return data;
    },
    onSuccess: (me) => qc.setQueryData(accountKeys.me, me),
  });
}

export function useApplyBusinessProfile() {
  const qc = useQueryClient();
  return useMutation<BusinessProfile, ApiError, ApplyBusinessProfileInput>({
    mutationFn: async (body) => {
      const { data, error, response } = await api.POST("/api/v1/me/business-profile", { body });
      if (error || !data) throw toApiError(error, response);
      return data;
    },
    onSuccess: (profile) => {
      qc.setQueryData<Me | null>(accountKeys.me, (me) => (me ? { ...me, businessProfile: profile } : me));
      void qc.invalidateQueries({ queryKey: accountKeys.me, exact: true });
    },
  });
}

// ---------------------------------------------------------------------------------------------
// Addresses

export function useAddresses(enabled = true) {
  return useQuery<SavedAddress[], ApiError>({
    queryKey: accountKeys.addresses,
    enabled,
    queryFn: async ({ signal }) => {
      const { data, error, response } = await api.GET("/api/v1/me/addresses", { signal });
      if (error || !data) throw toApiError(error, response);
      return data.items;
    },
  });
}

export function useCreateAddress() {
  const qc = useQueryClient();
  return useMutation<SavedAddress, ApiError, CreateAddressInput>({
    mutationFn: async (body) => {
      const { data, error, response } = await api.POST("/api/v1/me/addresses", { body });
      if (error || !data) throw toApiError(error, response);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: accountKeys.addresses }),
  });
}

export function useUpdateAddress() {
  const qc = useQueryClient();
  return useMutation<SavedAddress, ApiError, { id: string; body: UpdateAddressInput }>({
    mutationFn: async ({ id, body }) => {
      const { data, error, response } = await api.PATCH("/api/v1/me/addresses/{id}", { params: { path: { id } }, body });
      if (error || !data) throw toApiError(error, response);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: accountKeys.addresses }),
  });
}

export function useDeleteAddress() {
  const qc = useQueryClient();
  return useMutation<void, ApiError, string>({
    mutationFn: async (id) => {
      const { error, response } = await api.DELETE("/api/v1/me/addresses/{id}", { params: { path: { id } } });
      if (!response.ok) throw toApiError(error, response);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: accountKeys.addresses }),
  });
}

// ---------------------------------------------------------------------------------------------
// Orders

export const ORDERS_PAGE_SIZE = 10;

export function useMyOrders(page = 1) {
  return useQuery<OrderList, ApiError>({
    queryKey: accountKeys.orders(page),
    queryFn: async ({ signal }) => {
      const { data, error, response } = await api.GET("/api/v1/me/orders", {
        params: { query: { page, limit: ORDERS_PAGE_SIZE } },
        signal,
      });
      if (error || !data) throw toApiError(error, response);
      return data;
    },
  });
}

export function useMyOrder(number: string | undefined, options: { refetchInterval?: number | false } = {}) {
  return useQuery<OrderDetail, ApiError>({
    queryKey: accountKeys.order(number ?? ""),
    enabled: !!number,
    retry: (count, err) => err.status !== 404 && err.status !== 401 && count < 2,
    refetchInterval: options.refetchInterval,
    queryFn: async ({ signal }) => {
      const { data, error, response } = await api.GET("/api/v1/me/orders/{number}", {
        params: { path: { number: number! } },
        signal,
      });
      if (error || !data) throw toApiError(error, response);
      return data;
    },
  });
}

function onOrderChanged(qc: QueryClient, order: OrderDetail) {
  qc.setQueryData(accountKeys.order(order.number), order);
  void qc.invalidateQueries({ queryKey: ["me", "orders", "list"] });
}

export function useCancelOrder(number: string) {
  const qc = useQueryClient();
  return useMutation<OrderDetail, ApiError, { reason?: string }>({
    mutationFn: async (body) => {
      const { data, error, response } = await api.POST("/api/v1/me/orders/{number}/cancel", {
        params: { path: { number } },
        body,
      });
      if (error || !data) throw toApiError(error, response);
      return data;
    },
    onSuccess: (order) => onOrderChanged(qc, order),
  });
}

export function useRequestReturn(number: string) {
  const qc = useQueryClient();
  return useMutation<OrderDetail, ApiError, ReturnRequestInput>({
    mutationFn: async (body) => {
      const { data, error, response } = await api.POST("/api/v1/me/orders/{number}/return", {
        params: { path: { number } },
        body,
      });
      if (error || !data) throw toApiError(error, response);
      return data;
    },
    onSuccess: (order) => onOrderChanged(qc, order),
  });
}

/** Fetches a short-lived signed invoice URL on demand (not cached: the URL expires). */
export function useInvoiceLink() {
  return useMutation<InvoiceLink, ApiError, string>({
    mutationFn: async (number) => {
      const { data, error, response } = await api.GET("/api/v1/orders/{number}/invoice", { params: { path: { number } } });
      if (error || !data) throw toApiError(error, response);
      return data;
    },
  });
}
