import { useMemo, useState, type ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ShoppingBag } from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { primaryButtonClass, secondaryButtonClass } from "@/components/shop/styles";
import { formatPaise } from "@/features/catalog/format";
import { CartDrawerContext, type CartDrawerState } from "../drawer-context";
import { useCart } from "../hooks";
import CartLines from "./CartLines";

/** Slide-over cart, opened after "Add to cart". The full cart (coupon, totals) lives at /cart. */
const CartDrawer = ({ open, setOpen }: CartDrawerState) => (
  <Sheet open={open} onOpenChange={setOpen}>
    <SheetContent side="right" className="flex w-full flex-col border-border bg-background p-0 sm:max-w-md">
      {/* Mounted only while open, so pages that never open the drawer (e.g. /admin) don't fetch the cart for it. */}
      <DrawerBody close={() => setOpen(false)} />
    </SheetContent>
  </Sheet>
);

const DrawerBody = ({ close }: { close: () => void }) => {
  const { data: cart, isPending, isError, refetch } = useCart();
  const navigate = useNavigate();
  const go = (to: string) => {
    close();
    navigate(to);
  };

  return (
    <>
        <SheetHeader className="border-b border-border px-6 py-5 text-left">
          <SheetTitle className="font-display text-sm uppercase tracking-wider text-foreground">
            Your Cart{cart && cart.itemCount > 0 ? ` (${cart.itemCount})` : ""}
          </SheetTitle>
          <SheetDescription className="sr-only">Items in your cart</SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6">
          {isPending ? (
            <p className="py-10 font-display text-xs text-muted-foreground">Loading…</p>
          ) : isError ? (
            <div className="py-10">
              <p className="font-display text-xs text-muted-foreground">Couldn't load your cart.</p>
              <button type="button" onClick={() => refetch()} className="mt-3 font-display text-xs text-primary">
                Try again →
              </button>
            </div>
          ) : cart.items.length === 0 ? (
            <div className="py-16 text-center">
              <ShoppingBag size={24} className="mx-auto text-muted-foreground/60" />
              <p className="mt-4 font-display text-xs text-muted-foreground">Your cart is empty.</p>
              <Link to="/products" onClick={close} className="mt-4 inline-block font-display text-xs text-primary">
                Browse products →
              </Link>
            </div>
          ) : (
            <CartLines lines={cart.items} compact onNavigate={close} />
          )}
        </div>

        {cart && cart.items.length > 0 && (
          <div className="border-t border-border px-6 py-5">
            <div className="flex items-baseline justify-between">
              <span className="font-display text-xs uppercase tracking-wider text-muted-foreground">Subtotal</span>
              <span className="font-display text-lg text-foreground tabular">{formatPaise(cart.totals.subtotal)}</span>
            </div>
            <p className="mt-1 font-body text-[11px] text-muted-foreground">Inclusive of GST. Coupons and shipping on the next step.</p>
            {cart.hasIssues && (
              <p role="alert" className="mt-3 font-body text-[11px] text-destructive">
                Some items need attention before checkout.
              </p>
            )}
            <div className="mt-4 grid grid-cols-2 gap-3">
              <button type="button" onClick={() => go("/cart")} className={secondaryButtonClass}>
                View Cart
              </button>
              <button type="button" onClick={() => go("/checkout")} className={primaryButtonClass} disabled={cart.hasIssues}>
                Checkout
              </button>
            </div>
          </div>
        )}
    </>
  );
};

/** Provides the drawer's open state to the app (PDP add-to-cart opens it) and renders the drawer once. */
export const CartDrawerProvider = ({ children }: { children: ReactNode }) => {
  const [open, setOpen] = useState(false);
  const value = useMemo(() => ({ open, setOpen }), [open]);
  return (
    <CartDrawerContext.Provider value={value}>
      {children}
      <CartDrawer open={open} setOpen={setOpen} />
    </CartDrawerContext.Provider>
  );
};

export default CartDrawer;
