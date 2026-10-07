import { useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { api, toApiError, type ApiError } from "@/lib/api/client";
import type { Cart } from "./types";

export const cartKeys = {
  cart: ["cart"] as const,
};

/** Every cart mutation shares this key so concurrent ones can tell whether they are the last in flight. */
const CART_MUTATION_KEY = ["cart", "mutation"] as const;

export async function fetchCart(signal?: AbortSignal): Promise<Cart> {
  const { data, error, response } = await api.GET("/api/v1/cart", { signal });
  if (error || !data) throw toApiError(error, response);
  return data;
}

/** The current cart (guest cookie or signed-in user). The server creates an empty one on first read. */
export function useCart() {
  return useQuery({
    queryKey: cartKeys.cart,
    queryFn: ({ signal }) => fetchCart(signal),
    staleTime: 30_000,
  });
}

export function useCartCount(): number {
  return useCart().data?.itemCount ?? 0;
}

/** Writes a server cart into the cache unless another cart mutation is still running (it will write its own). */
function settleCart(qc: QueryClient, cart: Cart | undefined) {
  const inFlight = qc.isMutating({ mutationKey: CART_MUTATION_KEY });
  if (inFlight <= 1) {
    if (cart) qc.setQueryData(cartKeys.cart, cart);
    else void qc.invalidateQueries({ queryKey: cartKeys.cart });
  }
}

export function useAddToCart() {
  const qc = useQueryClient();
  return useMutation<Cart, ApiError, { variantId: string; quantity?: number }>({
    mutationKey: CART_MUTATION_KEY,
    mutationFn: async ({ variantId, quantity = 1 }) => {
      const { data, error, response } = await api.POST("/api/v1/cart/items", { body: { variantId, quantity } });
      if (error || !data) throw toApiError(error, response);
      return data;
    },
    onSuccess: (cart) => settleCart(qc, cart),
  });
}

/** Applies a quantity change to a cached cart (0 removes the line). Totals are server-computed; only the subtotal/total move by the delta. */
export function withQuantity(cart: Cart, variantId: string, quantity: number): Cart {
  const line = cart.items.find((l) => l.variantId === variantId);
  if (!line) return cart;
  // Lines with an issue are excluded from the server's totals, so they don't move them.
  const delta = line.issue ? 0 : (quantity - line.quantity) * line.unitPrice;
  const items =
    quantity <= 0
      ? cart.items.filter((l) => l.variantId !== variantId)
      : cart.items.map((l) => (l.variantId === variantId ? { ...l, quantity, lineTotal: l.unitPrice * quantity } : l));
  return {
    ...cart,
    items,
    itemCount: items.reduce((n, l) => n + l.quantity, 0),
    totals: { ...cart.totals, subtotal: cart.totals.subtotal + delta, total: cart.totals.total + delta },
  };
}

interface OptimisticContext {
  previous?: Cart;
}

/** Sets a line's quantity (0 removes it) with an optimistic update and rollback. */
export function useUpdateCartItem() {
  const qc = useQueryClient();
  return useMutation<Cart, ApiError, { variantId: string; quantity: number }, OptimisticContext>({
    mutationKey: CART_MUTATION_KEY,
    mutationFn: async ({ variantId, quantity }) => {
      const { data, error, response } = await api.PATCH("/api/v1/cart/items/{variantId}", {
        params: { path: { variantId } },
        body: { quantity },
      });
      if (error || !data) throw toApiError(error, response);
      return data;
    },
    onMutate: async ({ variantId, quantity }) => {
      await qc.cancelQueries({ queryKey: cartKeys.cart });
      const previous = qc.getQueryData<Cart>(cartKeys.cart);
      if (previous) qc.setQueryData(cartKeys.cart, withQuantity(previous, variantId, quantity));
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) qc.setQueryData(cartKeys.cart, ctx.previous);
      settleCart(qc, undefined);
    },
    onSuccess: (cart) => settleCart(qc, cart),
  });
}

/** Removes a line, optimistically. */
export function useRemoveCartItem() {
  const qc = useQueryClient();
  return useMutation<Cart, ApiError, { variantId: string }, OptimisticContext>({
    mutationKey: CART_MUTATION_KEY,
    mutationFn: async ({ variantId }) => {
      const { data, error, response } = await api.DELETE("/api/v1/cart/items/{variantId}", {
        params: { path: { variantId } },
      });
      if (error || !data) throw toApiError(error, response);
      return data;
    },
    onMutate: async ({ variantId }) => {
      await qc.cancelQueries({ queryKey: cartKeys.cart });
      const previous = qc.getQueryData<Cart>(cartKeys.cart);
      if (previous) qc.setQueryData(cartKeys.cart, withQuantity(previous, variantId, 0));
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) qc.setQueryData(cartKeys.cart, ctx.previous);
      settleCart(qc, undefined);
    },
    onSuccess: (cart) => settleCart(qc, cart),
  });
}

export function useApplyCoupon() {
  const qc = useQueryClient();
  return useMutation<Cart, ApiError, string>({
    mutationKey: CART_MUTATION_KEY,
    mutationFn: async (code) => {
      const { data, error, response } = await api.POST("/api/v1/cart/coupon", { body: { code: code.trim().toUpperCase() } });
      if (error || !data) throw toApiError(error, response);
      return data;
    },
    onSuccess: (cart) => settleCart(qc, cart),
  });
}

export function useRemoveCoupon() {
  const qc = useQueryClient();
  return useMutation<Cart, ApiError, void>({
    mutationKey: CART_MUTATION_KEY,
    mutationFn: async () => {
      const { data, error, response } = await api.DELETE("/api/v1/cart/coupon");
      if (error || !data) throw toApiError(error, response);
      return data;
    },
    onSuccess: (cart) => settleCart(qc, cart),
  });
}
