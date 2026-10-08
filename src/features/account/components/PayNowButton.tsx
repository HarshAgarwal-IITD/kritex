import { useState } from "react";
import { Loader2 } from "lucide-react";
import { ApiError } from "@/lib/api/client";
import { FormError } from "@/components/shop/Field";
import { primaryButtonClass } from "@/components/shop/styles";
import { formatPaise } from "@/features/catalog/format";
import FakePaymentDialog from "@/features/checkout/components/FakePaymentDialog";
import { payMyOrder } from "@/features/checkout/hooks";
import type { PlacedOrder } from "@/features/checkout/types";
import { usePayment } from "@/features/checkout/usePayment";

/** "Pay now" for an unpaid order: asks the server for a fresh payment order, then runs the usual payment flow. */
const PayNowButton = ({ orderNumber, total }: { orderNumber: string; total: number }) => {
  const payment = usePayment();
  const [placed, setPlaced] = useState<PlacedOrder | null>(null);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const start = async () => {
    setError(null);
    setStarting(true);
    try {
      const order = await payMyOrder(orderNumber);
      setPlaced(order);
      await payment.pay(order);
    } catch (err) {
      setError(
        err instanceof ApiError && err.code === "ORDER_NOT_PAYABLE"
          ? "This order can no longer be paid. Please place a new order."
          : "Couldn't start the payment. Please try again.",
      );
    } finally {
      setStarting(false);
    }
  };

  const busy = starting || payment.busy;
  return (
    <>
      <button type="button" onClick={start} disabled={busy} className={primaryButtonClass}>
        {busy && <Loader2 size={14} className="animate-spin" />}
        Pay now · {formatPaise(total)}
      </button>
      {(error ?? payment.error) && <FormError className="mt-3">{error ?? payment.error}</FormError>}
      {placed?.razorpay && (
        <FakePaymentDialog
          open={payment.fakeOpen}
          amount={placed.razorpay.amount}
          orderNumber={orderNumber}
          onChoose={payment.simulate}
        />
      )}
    </>
  );
};

export default PayNowButton;
