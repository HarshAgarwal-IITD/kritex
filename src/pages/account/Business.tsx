import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { BadgeCheck, Clock, Loader2, XCircle } from "lucide-react";
import { Field, FormError } from "@/components/shop/Field";
import { panelClass, primaryButtonClass, sectionTitleClass } from "@/components/shop/styles";
import AccountLayout from "@/features/account/components/AccountLayout";
import { useApplyBusinessProfile, useCurrentUser } from "@/features/account/hooks";
import { formatDate } from "@/features/account/orders";
import { gstinSchema } from "@/features/checkout/address";
import { stateName } from "@/features/checkout/india";

const schema = z
  .object({
    legalName: z.string().trim().min(2, "Enter the registered business name").max(200),
    gstin: gstinSchema,
  })
  .refine((v) => !!stateName(v.gstin.slice(0, 2)), { path: ["gstin"], message: "The first two digits must be a valid GST state code" });
type Input = z.input<typeof schema>;
type Values = z.output<typeof schema>;

/** `/account/business` — B2B application (GSTIN) and its review status. */
const Business = () => {
  const { user } = useCurrentUser();
  const apply = useApplyBusinessProfile();
  const profile = user?.businessProfile ?? null;
  const form = useForm<Input, unknown, Values>({
    resolver: zodResolver(schema),
    defaultValues: { legalName: profile?.legalName ?? "", gstin: profile?.gstin ?? "" },
  });
  const { errors } = form.formState;
  const canApply = !profile || profile.status === "REJECTED";

  return (
    <AccountLayout title="Business Account">
      <div className="max-w-xl space-y-8">
        <p className="font-body text-sm text-muted-foreground">
          Approved business accounts get volume pricing, GST invoices with input tax credit, and can pay by bank transfer or purchase order.
        </p>

        {profile && (
          <div className={panelClass} data-testid="business-status">
            {profile.status === "APPROVED" && (
              <p className="flex items-center gap-2 font-display text-xs uppercase tracking-wider text-primary">
                <BadgeCheck size={14} /> Approved{profile.reviewedAt ? ` · ${formatDate(profile.reviewedAt)}` : ""}
              </p>
            )}
            {profile.status === "PENDING" && (
              <p className="flex items-center gap-2 font-display text-xs uppercase tracking-wider text-accent">
                <Clock size={14} /> Under review
              </p>
            )}
            {profile.status === "REJECTED" && (
              <p className="flex items-center gap-2 font-display text-xs uppercase tracking-wider text-destructive">
                <XCircle size={14} /> Not approved
              </p>
            )}
            <p className="font-body text-sm text-foreground mt-3">{profile.legalName}</p>
            <p className="font-body text-xs text-muted-foreground mt-1">
              GSTIN {profile.gstin} · applied {formatDate(profile.createdAt)}
            </p>
            {profile.status === "PENDING" && (
              <p className="font-body text-xs text-muted-foreground mt-3">We usually review applications within 2 working days.</p>
            )}
            {profile.status === "REJECTED" && profile.rejectionReason && (
              <p className="font-body text-xs text-destructive mt-3">Reason: {profile.rejectionReason}</p>
            )}
          </div>
        )}

        {canApply && (
          <section>
            <h2 className={sectionTitleClass}>{profile ? "Apply again" : "Apply for a business account"}</h2>
            <form onSubmit={form.handleSubmit((v) => apply.mutate(v as Required<Values>))} noValidate className="space-y-5">
              <Field label="Registered business name" autoComplete="organization" error={errors.legalName?.message} {...form.register("legalName")} />
              <Field
                label="GSTIN"
                autoComplete="off"
                maxLength={15}
                placeholder="27AAPFU0939F1ZV"
                error={errors.gstin?.message}
                {...form.register("gstin")}
              />
              {apply.isError && (
                <FormError>
                  {apply.error.code === "BUSINESS_PROFILE_EXISTS" ? "You already have an application in review or approved." : apply.error.message}
                </FormError>
              )}
              <button type="submit" className={primaryButtonClass} disabled={apply.isPending}>
                {apply.isPending && <Loader2 size={14} className="animate-spin" />}
                Submit Application
              </button>
            </form>
          </section>
        )}
      </div>
    </AccountLayout>
  );
};

export default Business;
