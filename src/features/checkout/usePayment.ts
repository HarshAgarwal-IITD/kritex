import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { ApiError } from "@/lib/api/client";
import { fakeVerifyPayload, isFakeGateway, openRazorpayCheckout } from "./razorpay";
import { verifyPayment } from "./hooks";
import type { PaymentVerification, PlacedOrder, VerifyPaymentInput } from "./types";

/** Router state handed to the success / failure / pending pages. */
export interface CheckoutResultState {
  placed?: PlacedOrder;
  reason?: string;
}

export const resultPath = (kind: "success" | "failure" | "pending", orderNumber: string) =>
  `/checkout/${kind}/${encodeURIComponent(orderNumber)}`;

type Phase = "idle" | "opening" | "fake" | "verifying";

/**
 * Runs payment for a placed order: Razorpay Checkout.js (lazy-loaded) or, when the server uses the fake gateway
 * (`keyId === "rzp_fake"`), a dev dialog. Then `POST /checkout/verify` and navigate to the result page.
 */
export function usePayment() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [phase, setPhase] = useState<Phase>("idle");
  const [placed, setPlaced] = useState<PlacedOrder | null>(null);
  const [error, setError] = useState<string | null>(null);

  const go = useCallback(
    (kind: "success" | "failure" | "pending", order: PlacedOrder, reason?: string) => {
      setPhase("idle");
      // Orders lists/details may now show the new status.
      void qc.invalidateQueries({ queryKey: ["me", "orders"] });
      navigate(resultPath(kind, order.orderNumber), { state: { placed: order, reason } satisfies CheckoutResultState });
    },
    [navigate, qc],
  );

  const verify = useCallback(
    async (order: PlacedOrder, payload: VerifyPaymentInput) => {
      setPhase("verifying");
      let result: PaymentVerification;
      try {
        result = await verifyPayment(payload);
      } catch (err) {
        // A rejected signature is a definite failure; anything else (network, 5xx) leaves the outcome unknown.
        if (err instanceof ApiError && err.status === 400) return go("failure", order, "Your payment couldn't be verified.");
        return go("pending", order);
      }
      if (result.paid) return go("success", order);
      if (result.status === "PENDING_PAYMENT") return go("failure", order, "Your payment didn't go through.");
      return go("pending", order);
    },
    [go],
  );

  const pay = useCallback(
    async (order: PlacedOrder) => {
      setError(null);
      setPlaced(order);
      if (order.paymentMethod === "BANK_TRANSFER" || order.bankTransfer) return go("pending", order);
      const rp = order.razorpay;
      if (!rp) {
        setError("Payment details are missing for this order. Please contact us.");
        return;
      }
      if (isFakeGateway(rp)) {
        setPhase("fake");
        return;
      }
      setPhase("opening");
      try {
        const outcome = await openRazorpayCheckout(rp);
        if (outcome.kind === "authorized") return verify(order, outcome.payload);
        return go("failure", order, outcome.kind === "failed" ? outcome.reason : "Payment was cancelled.");
      } catch (err) {
        setPhase("idle");
        setError(err instanceof Error ? err.message : "Couldn't open the payment window.");
      }
    },
    [go, verify],
  );

  /** Fake gateway: the dev dialog's choice. `null` = dialog dismissed. */
  const simulate = useCallback(
    (outcome: "success" | "fail" | null) => {
      if (!placed?.razorpay) return;
      if (outcome === null) return go("failure", placed, "Payment was cancelled.");
      return verify(placed, fakeVerifyPayload(placed.razorpay.orderId, outcome));
    },
    [placed, go, verify],
  );

  return { pay, simulate, phase, error, busy: phase !== "idle", fakeOpen: phase === "fake" };
}
