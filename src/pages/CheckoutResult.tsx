import { Link, useLocation, useParams } from "react-router-dom";
import { CheckCircle2, Clock, Loader2, XCircle } from "lucide-react";
import ShopPage from "@/components/shop/ShopPage";
import { FormError } from "@/components/shop/Field";
import { panelClass, primaryButtonClass, secondaryButtonClass } from "@/components/shop/styles";
import { formatPaise } from "@/features/catalog/format";
import { useCurrentUser, useMyOrder } from "@/features/account/hooks";
import TotalsSummary from "@/features/cart/components/TotalsSummary";
import FakePaymentDialog from "@/features/checkout/components/FakePaymentDialog";
import { usePayment, type CheckoutResultState } from "@/features/checkout/usePayment";

const crumbs = (label: string) => [{ label: "Home", to: "/" }, { label: "Checkout" }, { label }];

const useResult = () => {
  const { number = "" } = useParams<{ number: string }>();
  const state = (useLocation().state ?? {}) as CheckoutResultState;
  const placed = state.placed?.orderNumber === number ? state.placed : undefined;
  return { number, placed, reason: state.reason };
};

const OrderLink = ({ number }: { number: string }) => {
  const { isSignedIn } = useCurrentUser();
  return isSignedIn ? (
    <Link to={`/account/orders/${encodeURIComponent(number)}`} className={secondaryButtonClass}>
      View Order
    </Link>
  ) : null;
};

const Heading = ({ icon, eyebrow, title, children }: { icon: React.ReactNode; eyebrow: string; title: string; children?: React.ReactNode }) => (
  <div className="max-w-2xl">
    <div className="flex items-center gap-3 mb-3">
      {icon}
      <p className="font-display text-xs text-primary">{eyebrow}</p>
    </div>
    <h1 className="text-3xl md:text-5xl font-bold text-foreground mb-4">{title}</h1>
    {children}
  </div>
);

/** `/checkout/success/:number` */
export const CheckoutSuccess = () => {
  const { number, placed } = useResult();
  return (
    <ShopPage title="Order confirmed" crumbs={crumbs("Confirmed")} hideHeading>
      <Heading icon={<CheckCircle2 size={18} className="text-primary" />} eyebrow="Payment received" title="Thank you for your order">
        <p className="font-body text-sm text-muted-foreground">
          Your order <span className="font-display text-foreground" data-testid="order-number">{number}</span> is confirmed. We've emailed
          the confirmation{placed?.razorpay?.prefill.email ? ` to ${placed.razorpay.prefill.email}` : ""} and will let you know when it ships.
        </p>
      </Heading>
      {placed && (
        <div className={`${panelClass} mt-10 max-w-md`}>
          <TotalsSummary totals={placed.totals} mode="final" />
        </div>
      )}
      <div className="mt-10 flex flex-wrap gap-3">
        <OrderLink number={number} />
        <Link
          to={`/track/${encodeURIComponent(number)}`}
          state={placed?.razorpay?.prefill.email ? { email: placed.razorpay.prefill.email } : undefined}
          className={secondaryButtonClass}
        >
          Track Order
        </Link>
        <Link to="/products" className={primaryButtonClass}>
          Continue Shopping
        </Link>
      </div>
    </ShopPage>
  );
};

/** `/checkout/failure/:number` — payment failed or was cancelled; retry while the Razorpay order is known. */
export const CheckoutFailure = () => {
  const { number, placed, reason } = useResult();
  const payment = usePayment();
  const canRetry = !!placed?.razorpay;
  return (
    <ShopPage title="Payment failed" crumbs={crumbs("Payment failed")} hideHeading>
      <Heading icon={<XCircle size={18} className="text-destructive" />} eyebrow="Payment not completed" title="Payment failed">
        <p className="font-body text-sm text-muted-foreground">
          {reason ?? "Your payment didn't go through."} No money was taken, or if it was, it will be refunded automatically. Your order{" "}
          <span className="font-display text-foreground" data-testid="order-number">{number}</span> is held for a short time so you can try
          again.
        </p>
      </Heading>
      {payment.error && <FormError className="mt-6 max-w-2xl">{payment.error}</FormError>}
      <div className="mt-10 flex flex-wrap gap-3">
        {canRetry && (
          <button type="button" className={primaryButtonClass} disabled={payment.busy} onClick={() => payment.pay(placed!)}>
            {payment.busy && <Loader2 size={14} className="animate-spin" />}
            Try Payment Again{placed ? ` · ${formatPaise(placed.totals.total)}` : ""}
          </button>
        )}
        <OrderLink number={number} />
        <Link to="/cart" className={secondaryButtonClass}>
          Back to Cart
        </Link>
      </div>
      {!canRetry && (
        <p className="mt-6 font-body text-xs text-muted-foreground max-w-2xl">
          To pay for this order later, contact us at procurement@kritex.in with the order number.
        </p>
      )}
      {placed?.razorpay && (
        <FakePaymentDialog open={payment.fakeOpen} amount={placed.razorpay.amount} orderNumber={number} onChoose={payment.simulate} />
      )}
    </ShopPage>
  );
};

/** `/checkout/pending/:number` — outcome not known yet (verify didn't answer) or bank transfer awaiting payment. */
export const CheckoutPending = () => {
  const { number, placed } = useResult();
  const { isSignedIn } = useCurrentUser();
  // Signed-in customers: poll the order until the webhook settles it.
  const order = useMyOrder(isSignedIn && !placed?.bankTransfer ? number : undefined, { refetchInterval: 5000 });
  const bank = placed?.bankTransfer;
  const status = order.data?.status;

  if (status && status !== "PENDING_PAYMENT" && status !== "AWAITING_PAYMENT" && status !== "CANCELLED") {
    return <CheckoutSuccess />;
  }

  return (
    <ShopPage title={bank ? "Awaiting payment" : "Payment pending"} crumbs={crumbs("Pending")} hideHeading>
      <Heading
        icon={<Clock size={18} className="text-accent" />}
        eyebrow={bank ? "Bank transfer" : "Confirming payment"}
        title={bank ? "Order placed" : "We're confirming your payment"}
      >
        <p className="font-body text-sm text-muted-foreground">
          {bank
            ? "Transfer the amount below and quote the reference. We'll confirm your order once the payment arrives."
            : "This can take a minute. If money left your account, your order will be confirmed automatically and you'll get an email."}{" "}
          Order <span className="font-display text-foreground" data-testid="order-number">{number}</span>.
        </p>
      </Heading>
      {bank && (
        <dl className={`${panelClass} mt-10 max-w-md space-y-3`}>
          {[
            ["Amount", formatPaise(bank.amount)],
            ["Account name", bank.accountName],
            ["Account number", bank.accountNumber],
            ["IFSC", bank.ifsc],
            ["Bank", bank.bankName],
            ["Reference", bank.reference],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between gap-4">
              <dt className="font-body text-sm text-muted-foreground">{k}</dt>
              <dd className="font-display text-sm text-foreground">{v}</dd>
            </div>
          ))}
        </dl>
      )}
      <div className="mt-10 flex flex-wrap gap-3">
        <OrderLink number={number} />
        <Link to="/products" className={primaryButtonClass}>
          Continue Shopping
        </Link>
      </div>
    </ShopPage>
  );
};
