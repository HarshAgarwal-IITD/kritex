import { Link, useNavigate } from "react-router-dom";
import { Lock, ShoppingBag } from "lucide-react";
import ShopPage from "@/components/shop/ShopPage";
import { FormError } from "@/components/shop/Field";
import { panelClass, primaryButtonClass, sectionTitleClass } from "@/components/shop/styles";
import QueryError from "@/features/catalog/components/QueryError";
import { useCart } from "@/features/cart/hooks";
import { appliedCoupon } from "@/features/cart/types";
import CartLines from "@/features/cart/components/CartLines";
import CouponForm from "@/features/cart/components/CouponForm";
import TotalsSummary from "@/features/cart/components/TotalsSummary";

const CartPage = () => {
  const { data: cart, isPending, isError, refetch } = useCart();
  const navigate = useNavigate();

  return (
    <ShopPage title="Your Cart" eyebrow="Cart">
      {isPending ? (
        <div className="space-y-4" data-skeleton aria-label="Loading cart">
          {[0, 1].map((i) => (
            <div key={i} className="h-24 animate-pulse bg-muted/40" />
          ))}
        </div>
      ) : isError ? (
        <QueryError message="Couldn't load your cart." onRetry={() => refetch()} />
      ) : cart.items.length === 0 ? (
        <div className="border border-dashed border-border py-20 text-center">
          <ShoppingBag size={24} className="mx-auto text-muted-foreground/60" />
          <p className="mt-4 font-display text-sm text-muted-foreground">Your cart is empty.</p>
          <Link
            to="/products"
            className="mt-6 inline-block font-display text-xs bg-primary text-primary-foreground px-4 py-2 hover:bg-primary/90 transition-colors duration-300"
          >
            Browse All Products
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-10 items-start">
          <div>
            <CartLines lines={cart.items} />
            <Link to="/products" className="mt-6 inline-block font-display text-xs text-primary hover:text-primary/80 transition-colors">
              ← Continue shopping
            </Link>
          </div>
          <aside className={`${panelClass} space-y-6`} aria-label="Cart summary">
            <h2 className={sectionTitleClass}>Summary</h2>
            <CouponForm coupon={appliedCoupon(cart)} />
            <TotalsSummary totals={cart.totals} couponCode={appliedCoupon(cart)?.valid === false ? null : appliedCoupon(cart)?.code} />
            {cart.hasIssues && <FormError>Some items need attention before you can check out.</FormError>}
            <button
              type="button"
              className={`${primaryButtonClass} w-full`}
              disabled={cart.hasIssues}
              onClick={() => navigate("/checkout")}
            >
              <Lock size={14} />
              Checkout
            </button>
          </aside>
        </div>
      )}
    </ShopPage>
  );
};

export default CartPage;
