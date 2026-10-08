import { useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, Lock } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import ShopPage from "@/components/shop/ShopPage";
import { FormError } from "@/components/shop/Field";
import { primaryButtonClass } from "@/components/shop/styles";
import QueryError from "@/features/catalog/components/QueryError";
import { formatPaise } from "@/features/catalog/format";
import { cartKeys, useCart } from "@/features/cart/hooks";
import { appliedCoupon } from "@/features/cart/types";
import { useAddresses, useCurrentUser } from "@/features/account/hooks";
import { addressLines, type AddressInput } from "@/features/checkout/address";
import { formatPhone } from "@/features/checkout/india";
import { checkoutErrorMessage, useCheckoutQuote, usePlaceOrder } from "@/features/checkout/hooks";
import { usePayment } from "@/features/checkout/usePayment";
import type { CheckoutQuoteRequest, PaymentMethod, PlaceOrderInput } from "@/features/checkout/types";
import StepCard from "@/features/checkout/components/StepCard";
import ContactStep, { type ContactValues } from "@/features/checkout/components/ContactStep";
import AddressStep from "@/features/checkout/components/AddressStep";
import GstInvoiceSection, { type GstDetails } from "@/features/checkout/components/GstInvoiceSection";
import OrderSummary, { type SummaryLine } from "@/features/checkout/components/OrderSummary";
import FakePaymentDialog from "@/features/checkout/components/FakePaymentDialog";
import { cn } from "@/lib/utils";

type Step = "contact" | "address" | "review";

const CRUMBS = [{ label: "Home", to: "/" }, { label: "Cart", to: "/cart" }, { label: "Checkout" }];

const newKey = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;

const PAYMENT_LABELS: Record<PaymentMethod, { title: string; detail: string }> = {
  RAZORPAY: { title: "Pay online", detail: "UPI, cards, net banking and wallets via Razorpay." },
  BANK_TRANSFER: { title: "Bank transfer / PO", detail: "Approved business accounts. We reserve stock while you transfer." },
};

const Checkout = () => {
  const cart = useCart();
  const account = useCurrentUser();
  const user = account.user;
  const addresses = useAddresses(account.isSignedIn);
  const qc = useQueryClient();

  const [step, setStep] = useState<Step>("contact");
  const [contact, setContact] = useState<ContactValues | null>(null);
  const [shipping, setShipping] = useState<AddressInput | null>(null);
  const [saveAddress, setSaveAddress] = useState(false);
  const [billing, setBilling] = useState<AddressInput | null>(null);
  const [gst, setGst] = useState<GstDetails | null>(null);
  const [method, setMethod] = useState<PaymentMethod>("RAZORPAY");

  const quoteInput = useMemo<CheckoutQuoteRequest | null>(
    () =>
      shipping && step === "review"
        ? {
            shippingAddress: shipping,
            ...(billing ? { billingAddress: billing } : {}),
            ...(gst ? { gstin: gst.gstin, businessName: gst.businessName } : {}),
          }
        : null,
    [shipping, billing, gst, step],
  );
  const quote = useCheckoutQuote(quoteInput);
  const placeOrder = usePlaceOrder();
  const payment = usePayment();

  // One Idempotency-Key per order attempt: reused when the same body is retried (e.g. after a network error),
  // replaced once the server has answered or the body changes.
  const attempt = useRef<{ key: string; body: string } | null>(null);

  if (cart.isPending || account.isPending) {
    return (
      <ShopPage title="Checkout" eyebrow="Secure checkout" crumbs={CRUMBS}>
        <p className="font-display text-xs text-muted-foreground" data-skeleton>
          Loading…
        </p>
      </ShopPage>
    );
  }
  if (cart.isError) {
    return (
      <ShopPage title="Checkout" eyebrow="Secure checkout" crumbs={CRUMBS}>
        <QueryError message="Couldn't load your cart." onRetry={() => cart.refetch()} />
      </ShopPage>
    );
  }

  const c = cart.data;
  if (c.items.length === 0 && !payment.busy && !placeOrder.isSuccess) {
    return (
      <ShopPage title="Checkout" eyebrow="Secure checkout" crumbs={CRUMBS}>
        <div className="border border-dashed border-border py-20 text-center">
          <p className="font-display text-sm text-muted-foreground">Your cart is empty.</p>
          <Link to="/products" className="mt-4 inline-block font-display text-xs text-primary">
            Browse products →
          </Link>
        </div>
      </ShopPage>
    );
  }

  const q = quote.data;
  const quoted = step === "review" && !!q && !quote.isPlaceholderData;
  const summaryLines: SummaryLine[] = quoted
    ? q.items.map((i) => ({
        variantId: i.variantId,
        productName: i.productName,
        variantTitle: i.variantTitle,
        quantity: i.quantity,
        lineTotal: i.lineTotal,
        image: i.image,
        gstRate: i.gstRate,
      }))
    : c.items.map((i) => ({
        variantId: i.variantId,
        productName: i.productName,
        variantTitle: i.variantTitle,
        quantity: i.quantity,
        lineTotal: i.lineTotal,
        image: i.image?.url ?? null,
      }));
  const totals = quoted ? q.totals : c.totals;
  const methods = q?.paymentMethods ?? ["RAZORPAY"];
  const chosenMethod: PaymentMethod = methods.includes(method) ? method : "RAZORPAY";

  const stepState = (s: Step): "active" | "done" | "upcoming" => {
    const order: Step[] = ["contact", "address", "review"];
    const i = order.indexOf(s);
    const cur = order.indexOf(step);
    return i === cur ? "active" : i < cur ? "done" : "upcoming";
  };

  const onPlace = () => {
    if (!contact || !shipping || !q) return;
    const body: PlaceOrderInput = {
      email: user?.email ?? contact.email,
      phone: contact.phone,
      shippingAddress: shipping,
      ...(billing ? { billingAddress: billing } : {}),
      ...(gst ? { gstin: gst.gstin, businessName: gst.businessName } : {}),
      paymentMethod: chosenMethod,
      saveAddress,
      expectedTotal: q.totals.total,
    };
    const json = JSON.stringify(body);
    if (!attempt.current || attempt.current.body !== json) attempt.current = { key: newKey(), body: json };
    placeOrder.mutate(
      { body, idempotencyKey: attempt.current.key },
      {
        onSuccess: (placed) => {
          attempt.current = null;
          void payment.pay(placed);
        },
        onError: (err) => {
          if (err.status > 0 && err.status < 500) attempt.current = null;
          if (err.code === "PRICE_CHANGED") void quote.refetch();
          if (["OUT_OF_STOCK", "CART_HAS_ISSUES", "CART_EMPTY"].includes(err.code) || err.code.startsWith("COUPON_")) {
            void qc.invalidateQueries({ queryKey: cartKeys.cart });
          }
        },
      },
    );
  };

  const busy = placeOrder.isPending || payment.busy;
  const placedOrder = placeOrder.data;

  return (
    <ShopPage title="Checkout" eyebrow="Secure checkout" crumbs={CRUMBS}>
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-10 items-start">
        <div className="space-y-4">
          {c.hasIssues && (
            <FormError>
              Some items in your cart need attention.{" "}
              <Link to="/cart" className="underline">
                Review your cart
              </Link>{" "}
              before placing the order.
            </FormError>
          )}

          <StepCard
            index={1}
            title="Contact"
            state={stepState("contact")}
            onEdit={() => setStep("contact")}
            summary={
              contact && (
                <>
                  <p>{user?.email ?? contact.email}</p>
                  <p>{formatPhone(contact.phone)}</p>
                </>
              )
            }
          >
            <ContactStep
              user={user}
              defaultValues={contact ?? undefined}
              onSubmit={(v) => {
                setContact(v);
                setStep("address");
              }}
            />
          </StepCard>

          <StepCard
            index={2}
            title="Delivery address"
            state={stepState("address")}
            onEdit={() => setStep("address")}
            summary={
              shipping && (
                <>
                  <p className="text-foreground">{shipping.name}</p>
                  {addressLines(shipping).map((l) => (
                    <p key={l}>{l}</p>
                  ))}
                </>
              )
            }
          >
            {account.isSignedIn && addresses.isPending ? (
              <p className="font-display text-xs text-muted-foreground">Loading saved addresses…</p>
            ) : (
              <AddressStep
                signedIn={account.isSignedIn}
                saved={addresses.data ?? []}
                current={shipping ?? undefined}
                prefill={{ phone: contact?.phone, name: user?.name }}
                onSubmit={(address, save) => {
                  setShipping(address);
                  setSaveAddress(save);
                  // A new shipping state can invalidate a GSTIN check made against it.
                  if (!billing && gst && gst.gstin.slice(0, 2) !== address.stateCode) setGst(null);
                  setStep("review");
                }}
              />
            )}
          </StepCard>

          <StepCard index={3} title="Review & pay" state={stepState("review")}>
            {shipping && (
              <div className="space-y-6">
                <GstInvoiceSection gst={gst} onGstChange={setGst} shipping={shipping} billing={billing} onBillingChange={setBilling} />

                {methods.length > 1 && (
                  <fieldset className="space-y-3">
                    <legend className="font-display text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Payment method</legend>
                    {methods.map((m) => (
                      <label
                        key={m}
                        className={cn(
                          "flex cursor-pointer gap-3 border p-4 transition-colors duration-200",
                          chosenMethod === m ? "border-primary bg-primary/5" : "border-border hover:border-primary/50",
                        )}
                      >
                        <input
                          type="radio"
                          name="payment-method"
                          value={m}
                          checked={chosenMethod === m}
                          onChange={() => setMethod(m)}
                          className="mt-0.5 accent-[hsl(var(--primary))]"
                        />
                        <span>
                          <span className="block font-display text-xs uppercase tracking-wider text-foreground">{PAYMENT_LABELS[m].title}</span>
                          <span className="block font-body text-xs text-muted-foreground mt-1">{PAYMENT_LABELS[m].detail}</span>
                        </span>
                      </label>
                    ))}
                  </fieldset>
                )}

                {quote.isError && <FormError>{checkoutErrorMessage(quote.error)}</FormError>}
                {placeOrder.isError && (
                  <FormError>
                    {checkoutErrorMessage(placeOrder.error)}
                    {["OUT_OF_STOCK", "CART_HAS_ISSUES"].includes(placeOrder.error.code) && (
                      <>
                        {" "}
                        <Link to="/cart" className="underline">
                          Go to cart
                        </Link>
                      </>
                    )}
                  </FormError>
                )}
                {payment.error && <FormError>{payment.error}</FormError>}

                <div className="flex flex-wrap items-center gap-4">
                  <button
                    type="button"
                    onClick={onPlace}
                    disabled={busy || !quoted || quote.isFetching || c.hasIssues}
                    className={primaryButtonClass}
                  >
                    {busy ? <Loader2 size={14} className="animate-spin" /> : <Lock size={14} />}
                    {payment.phase === "verifying"
                      ? "Confirming payment…"
                      : chosenMethod === "BANK_TRANSFER"
                        ? "Place Order"
                        : `Pay ${quoted ? formatPaise(q.totals.total) : ""}`.trim()}
                  </button>
                  <p className="font-body text-[11px] text-muted-foreground max-w-xs">
                    By placing this order you agree to our{" "}
                    <Link to="/legal/terms" className="text-primary">
                      terms
                    </Link>{" "}
                    and{" "}
                    <Link to="/legal/returns" className="text-primary">
                      returns policy
                    </Link>
                    .
                  </p>
                </div>
              </div>
            )}
          </StepCard>
        </div>

        <OrderSummary
          lines={summaryLines}
          totals={totals}
          couponCode={quoted ? q.couponCode : appliedCoupon(c)?.code}
          final={quoted}
          updating={step === "review" && quote.isFetching}
        />
      </div>

      {placedOrder?.razorpay && (
        <FakePaymentDialog
          open={payment.fakeOpen}
          amount={placedOrder.razorpay.amount}
          orderNumber={placedOrder.orderNumber}
          onChoose={payment.simulate}
        />
      )}
    </ShopPage>
  );
};

export default Checkout;
