import { useState } from "react";
import { Loader2, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import { primaryButtonClass } from "@/components/shop/styles";
import { useCartDrawer } from "../drawer-context";
import { useAddToCart } from "../hooks";
import { cartMutationMessage } from "../messages";
import QuantityStepper from "./QuantityStepper";

interface AddToCartProps {
  /** The selected variant; undefined until every option is picked. */
  variant?: { id: string; inStock: boolean };
  productName: string;
}

/** PDP "Add to cart": quantity + button. Opens the cart drawer on success. */
const AddToCart = ({ variant, productName }: AddToCartProps) => {
  const [quantity, setQuantity] = useState(1);
  const add = useAddToCart();
  const { setOpen } = useCartDrawer();
  const outOfStock = variant ? !variant.inStock : false;

  const onAdd = () => {
    if (!variant) return;
    add.mutate(
      { variantId: variant.id, quantity },
      {
        onSuccess: () => {
          setQuantity(1);
          setOpen(true);
        },
        onError: (err) => toast.error(cartMutationMessage(err)),
      },
    );
  };

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <QuantityStepper
          value={quantity}
          onChange={setQuantity}
          label={productName}
          disabled={!variant || outOfStock}
          className="h-[42px] [&>button]:h-full [&>button]:w-10"
        />
        <button
          type="button"
          onClick={onAdd}
          disabled={!variant || outOfStock || add.isPending}
          className={primaryButtonClass}
        >
          {add.isPending ? <Loader2 size={14} className="animate-spin" /> : <ShoppingCart size={14} />}
          {outOfStock ? "Out of Stock" : "Add to Cart"}
        </button>
      </div>
      {!variant && (
        <p className="font-body text-[11px] text-muted-foreground mt-2" data-testid="select-options-hint">
          Select your options to add this item to the cart.
        </p>
      )}
    </div>
  );
};

export default AddToCart;
