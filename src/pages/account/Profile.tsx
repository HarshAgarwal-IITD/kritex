import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { Field, FormError, FormNotice } from "@/components/shop/Field";
import { labelClass, primaryButtonClass, sectionTitleClass } from "@/components/shop/styles";
import AccountLayout from "@/features/account/components/AccountLayout";
import { useCurrentUser, useUpdateMe } from "@/features/account/hooks";
import { normalizePhone } from "@/features/checkout/india";

const profileSchema = z.object({
  name: z.string().trim().min(2, "Enter your name").max(100),
  phone: z
    .string()
    .trim()
    .transform((v, ctx) => {
      if (!v) return null;
      const n = normalizePhone(v);
      if (!n) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Enter a valid 10-digit Indian mobile number" });
        return z.NEVER;
      }
      return n;
    }),
});
type ProfileInput = z.input<typeof profileSchema>;
type ProfileValues = z.output<typeof profileSchema>;

/** `/account` — name, phone, email. */
const Profile = () => {
  const { user } = useCurrentUser();
  const update = useUpdateMe();
  const form = useForm<ProfileInput, unknown, ProfileValues>({
    resolver: zodResolver(profileSchema),
    values: { name: user?.name ?? "", phone: user?.phone ?? "" },
  });
  const { errors, isDirty } = form.formState;
  if (!user) return null;

  return (
    <AccountLayout title="Your Account" crumbs={[{ label: "Home", to: "/" }, { label: "Account" }]}>
      <section className="max-w-xl">
        <h2 className={sectionTitleClass}>Profile</h2>
        <form onSubmit={form.handleSubmit((v) => update.mutate(v))} noValidate className="space-y-5">
          <div>
            <p className={labelClass}>Email</p>
            <p className="font-body text-sm text-foreground">
              {user.email}{" "}
              <span className="font-display text-[9px] uppercase tracking-wider text-muted-foreground">
                {user.emailVerified ? "· Verified" : "· Not verified"}
              </span>
            </p>
          </div>
          <Field label="Full name" autoComplete="name" error={errors.name?.message} {...form.register("name")} />
          <Field
            label="Mobile number"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="98765 43210"
            error={errors.phone?.message}
            {...form.register("phone")}
          />
          {update.isError && <FormError>{update.error.message}</FormError>}
          {update.isSuccess && !isDirty && <FormNotice>Profile saved.</FormNotice>}
          <button type="submit" className={primaryButtonClass} disabled={update.isPending || !isDirty}>
            {update.isPending && <Loader2 size={14} className="animate-spin" />}
            Save Changes
          </button>
        </form>
      </section>
    </AccountLayout>
  );
};

export default Profile;
