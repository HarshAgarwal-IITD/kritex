import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Tag, X } from "lucide-react";
import { fieldClass, labelClass, secondaryButtonClass } from "@/components/shop/styles";
import { useApplyCoupon, useRemoveCoupon } from "../hooks";
import { couponErrorMessage, invalidCouponMessage } from "../messages";
import type { AppliedCoupon } from "../types";

const couponSchema = z.object({
  code: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z0-9_-]{3,32}$/, "Enter a valid code"),
});
type CouponValues = z.infer<typeof couponSchema>;

/** Apply / remove a coupon code. */
const CouponForm = ({ coupon }: { coupon: AppliedCoupon | null }) => {
  const apply = useApplyCoupon();
  const remove = useRemoveCoupon();
  const form = useForm<CouponValues>({ resolver: zodResolver(couponSchema), defaultValues: { code: "" } });

  if (coupon) {
    const invalid = coupon.valid === false;
    return (
      <div>
        <div
          className={`flex items-center justify-between gap-3 border px-4 py-3 ${
            invalid ? "border-destructive/40 bg-destructive/10" : "border-primary/40 bg-primary/10"
          }`}
        >
          <p className="flex items-center gap-2 font-display text-xs text-foreground">
            <Tag size={12} className={invalid ? "text-destructive" : "text-primary"} />
            <span data-testid="applied-coupon" className={invalid ? "line-through" : undefined}>
              {coupon.code}
            </span>
            <span className="text-muted-foreground normal-case">{invalid ? "not applied" : "applied"}</span>
          </p>
          <button
            type="button"
            onClick={() => remove.mutate()}
            disabled={remove.isPending}
            aria-label={`Remove coupon ${coupon.code}`}
            className="text-muted-foreground hover:text-destructive transition-colors duration-200"
          >
            <X size={14} />
          </button>
        </div>
        {invalid && (
          <p role="alert" className="font-body text-[11px] text-destructive mt-1.5" data-testid="coupon-invalid">
            {invalidCouponMessage(coupon)} Remove it to try another code.
          </p>
        )}
      </div>
    );
  }

  const onSubmit = (values: CouponValues) =>
    apply.mutate(values.code, {
      onSuccess: () => form.reset({ code: "" }),
    });

  const error = form.formState.errors.code?.message ?? (apply.isError ? couponErrorMessage(apply.error) : undefined);

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
      <label htmlFor="coupon-code" className={labelClass}>
        Coupon code
      </label>
      <div className="flex gap-2">
        <input
          id="coupon-code"
          className={`${fieldClass} uppercase`}
          placeholder="Enter code"
          autoComplete="off"
          aria-invalid={error ? true : undefined}
          {...form.register("code", { onChange: () => apply.isError && apply.reset() })}
        />
        <button type="submit" className={secondaryButtonClass} disabled={apply.isPending}>
          {apply.isPending ? "Applying…" : "Apply"}
        </button>
      </div>
      {error && (
        <p role="alert" className="font-body text-[11px] text-destructive mt-1.5">
          {error}
        </p>
      )}
    </form>
  );
};

export default CouponForm;
