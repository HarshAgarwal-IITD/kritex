import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api, toApiError, type ApiError } from "@/lib/api/client";
import { adminKeys } from "./keys";
import type { AdminOrder, AdminShipment, CreateShiprocketShipmentInput, ShipOrderInput } from "./types";

/** Both ship actions change the order (status, shipments, events): refresh its detail and the lists. */
function useRefreshOrder(id: string) {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: adminKeys.order(id) });
    qc.invalidateQueries({ queryKey: [...adminKeys.orders, "list"] });
    qc.invalidateQueries({ queryKey: adminKeys.dashboard });
  };
}

/** Shiprocket: create the order there, generate the AWB + label and (optionally) request pickup. */
export function useCreateShiprocketShipment(orderId: string) {
  const refresh = useRefreshOrder(orderId);
  return useMutation<AdminShipment, ApiError, CreateShiprocketShipmentInput>({
    mutationFn: async (body) => {
      const { data, error, response } = await api.POST("/api/v1/admin/orders/{id}/shiprocket", {
        params: { path: { id: orderId } },
        body,
      });
      if (error || !data) throw toApiError(error, response);
      return data;
    },
    onSuccess: refresh,
  });
}

/** Manual fallback: record the courier + AWB and mark the order shipped. Returns the updated order. */
export function useShipOrder(orderId: string) {
  const qc = useQueryClient();
  const refresh = useRefreshOrder(orderId);
  return useMutation<AdminOrder, ApiError, ShipOrderInput>({
    mutationFn: async (body) => {
      const { data, error, response } = await api.POST("/api/v1/admin/orders/{id}/ship", {
        params: { path: { id: orderId } },
        body,
      });
      if (error || !data) throw toApiError(error, response);
      return data;
    },
    onSuccess: (order) => {
      qc.setQueryData(adminKeys.order(orderId), order);
      refresh();
    },
  });
}

/** Orders that can be shipped (the server's precondition for both ship routes). */
export const canShip = (order: AdminOrder) => order.status === "PAID" || order.status === "PROCESSING";

/** The open (not cancelled) shipment, if any. */
export const activeShipment = (order: AdminOrder) => order.shipments.find((s) => s.status !== "CANCELLED");
