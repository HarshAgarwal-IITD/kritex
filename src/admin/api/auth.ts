import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, toApiError, ApiError } from "@/lib/api/client";
import { authClient, type SignInEmailInput } from "@/lib/auth/client";
import { adminKeys } from "./keys";
import { STAFF_ROLES, type Me } from "./types";

export const isStaff = (me: Me | null | undefined) => !!me && STAFF_ROLES.includes(me.role);

export async function fetchMe(): Promise<Me | null> {
  const { data, error, response } = await api.GET("/api/v1/me");
  if (response.status === 401) return null;
  if (error || !data) throw toApiError(error, response);
  return data;
}

export function useSession() {
  return useQuery({ queryKey: adminKeys.session, queryFn: () => authClient.getSession(), staleTime: 60_000, retry: false });
}

export function useMe(enabled = true) {
  return useQuery({ queryKey: adminKeys.me, queryFn: fetchMe, enabled, staleTime: 60_000, retry: false });
}

/** Signs in, then loads `/me` so the caller can check the role. */
export function useSignIn() {
  const qc = useQueryClient();
  return useMutation<Me | null, ApiError, SignInEmailInput>({
    mutationFn: async (input) => {
      await authClient.signInEmail(input);
      const [session, me] = await Promise.all([authClient.getSession(), fetchMe()]);
      qc.setQueryData(adminKeys.session, session);
      qc.setQueryData(adminKeys.me, me);
      return me;
    },
  });
}

export function useSignOut() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => authClient.signOut(),
    onSettled: () => {
      qc.setQueryData(adminKeys.session, null);
      qc.setQueryData(adminKeys.me, null);
      qc.removeQueries({ queryKey: ["admin"] });
    },
  });
}
