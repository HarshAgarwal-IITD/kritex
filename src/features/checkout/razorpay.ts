import type { RazorpayOrder, VerifyPaymentInput } from "./types";

/** `POST /checkout` returns this key id when the server runs the fake gateway (dev, no Razorpay keys). */
export const FAKE_RAZORPAY_KEY = "rzp_fake";

export const isFakeGateway = (rp: Pick<RazorpayOrder, "keyId">) => rp.keyId === FAKE_RAZORPAY_KEY;

const CHECKOUT_JS = "https://checkout.razorpay.com/v1/checkout.js";

interface RazorpaySuccess {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

interface RazorpayInstance {
  open(): void;
  on(event: "payment.failed", cb: (resp: { error?: { description?: string; reason?: string } }) => void): void;
}

type RazorpayCtor = new (options: Record<string, unknown>) => RazorpayInstance;

declare global {
  interface Window {
    Razorpay?: RazorpayCtor;
  }
}

let scriptPromise: Promise<RazorpayCtor> | null = null;

/** Loads Checkout.js once, on demand (never for the fake gateway). */
export function loadRazorpay(): Promise<RazorpayCtor> {
  if (window.Razorpay) return Promise.resolve(window.Razorpay);
  if (!scriptPromise) {
    scriptPromise = new Promise<RazorpayCtor>((resolve, reject) => {
      const script = document.createElement("script");
      script.src = CHECKOUT_JS;
      script.async = true;
      script.onload = () => (window.Razorpay ? resolve(window.Razorpay) : reject(new Error("Razorpay failed to initialise")));
      script.onerror = () => {
        scriptPromise = null;
        script.remove();
        reject(new Error("Couldn't load the payment window. Check your connection and try again."));
      };
      document.body.appendChild(script);
    });
  }
  return scriptPromise;
}

export type CheckoutOutcome =
  | { kind: "authorized"; payload: VerifyPaymentInput }
  | { kind: "failed"; reason: string }
  | { kind: "dismissed" };

/**
 * Opens Razorpay Checkout for an order and resolves with what happened. A `payment.failed` event doesn't close the
 * modal (the customer may retry inside it), so we only settle on success or dismissal, remembering the last failure.
 */
export async function openRazorpayCheckout(rp: RazorpayOrder): Promise<CheckoutOutcome> {
  const Razorpay = await loadRazorpay();
  return new Promise<CheckoutOutcome>((resolve) => {
    let lastFailure: string | null = null;
    const instance = new Razorpay({
      key: rp.keyId,
      order_id: rp.orderId,
      amount: rp.amount,
      currency: rp.currency,
      name: rp.name,
      description: rp.description,
      prefill: rp.prefill,
      theme: { color: "#476b57" },
      handler: (resp: RazorpaySuccess) =>
        resolve({
          kind: "authorized",
          payload: {
            razorpay_order_id: resp.razorpay_order_id,
            razorpay_payment_id: resp.razorpay_payment_id,
            razorpay_signature: resp.razorpay_signature,
          },
        }),
      modal: {
        ondismiss: () => resolve(lastFailure ? { kind: "failed", reason: lastFailure } : { kind: "dismissed" }),
      },
    });
    instance.on("payment.failed", (resp) => {
      lastFailure = resp.error?.description ?? "Payment failed";
    });
    instance.open();
  });
}

const randomId = () => Math.random().toString(36).slice(2, 12);

/** The verify payload the fake gateway expects (see the server's fake Razorpay driver). */
export function fakeVerifyPayload(orderId: string, outcome: "success" | "fail"): VerifyPaymentInput {
  return {
    razorpay_order_id: orderId,
    razorpay_payment_id: outcome === "success" ? `pay_fake_${randomId()}` : `pay_fake_fail_${randomId()}`,
    razorpay_signature: "fake",
  };
}
