import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { primaryButtonClass, secondaryButtonClass } from "@/components/shop/styles";
import { formatPaise } from "@/features/catalog/format";

interface FakePaymentDialogProps {
  open: boolean;
  amount: number;
  orderNumber: string;
  onChoose: (outcome: "success" | "fail" | null) => void;
}

/** Dev-only stand-in for Razorpay Checkout when the server runs the fake gateway (`keyId === "rzp_fake"`). */
const FakePaymentDialog = ({ open, amount, orderNumber, onChoose }: FakePaymentDialogProps) => (
  <Dialog open={open} onOpenChange={(o) => !o && onChoose(null)}>
    <DialogContent className="border-border bg-background sm:max-w-md">
      <DialogHeader>
        <p className="font-display text-[10px] uppercase tracking-wider text-accent">Test mode · fake gateway</p>
        <DialogTitle className="font-display text-base uppercase text-foreground">Simulate payment</DialogTitle>
        <DialogDescription className="font-body text-sm text-muted-foreground">
          Order {orderNumber} · {formatPaise(amount)}. No real payment is taken; pick an outcome.
        </DialogDescription>
      </DialogHeader>
      <DialogFooter className="gap-3 sm:gap-3">
        <button type="button" className={secondaryButtonClass} onClick={() => onChoose("fail")}>
          Fail
        </button>
        <button type="button" className={primaryButtonClass} onClick={() => onChoose("success")}>
          Success
        </button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);

export default FakePaymentDialog;
