import { useState } from "react";
import { Link, Navigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, MailCheck } from "lucide-react";
import { Field, FormError, FormNotice } from "@/components/shop/Field";
import { linkButtonClass, primaryButtonClass } from "@/components/shop/styles";
import AuthShell from "@/features/account/components/AuthShell";
import { authErrorMessage, passwordRules, safeNext } from "@/features/account/auth-messages";
import { useCurrentUser, useResendVerification, useSignup } from "@/features/account/hooks";

const signupSchema = z
  .object({
    name: z.string().trim().min(2, "Enter your name").max(100),
    email: z.string().trim().toLowerCase().email("Enter a valid email"),
    password: passwordRules,
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, { path: ["confirm"], message: "Passwords don't match" });
type SignupValues = z.infer<typeof signupSchema>;

/** `/signup` — creates the account, then asks the customer to verify their email (no session until verified). */
const Signup = () => {
  const [params] = useSearchParams();
  const next = safeNext(params.get("next"));
  const { isSignedIn, isPending } = useCurrentUser();
  const signup = useSignup();
  const resend = useResendVerification();
  const [sentTo, setSentTo] = useState<string | null>(null);
  const form = useForm<SignupValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: { name: "", email: "", password: "", confirm: "" },
  });
  const { errors } = form.formState;

  if (!isPending && isSignedIn) return <Navigate to={next} replace />;

  if (sentTo) {
    return (
      <AuthShell title="Check your email" intro={null}>
        <div className="space-y-5" data-testid="check-email">
          <MailCheck size={24} className="text-primary" />
          <p className="font-body text-sm text-muted-foreground">
            We sent a verification link to <span className="font-display text-foreground">{sentTo}</span>. Open it to activate your
            account, then log in.
          </p>
          {resend.isSuccess && <FormNotice>Verification email sent again.</FormNotice>}
          {resend.isError && <FormError>{authErrorMessage(resend.error)}</FormError>}
          <div className="flex justify-between">
            <button type="button" className={linkButtonClass} disabled={resend.isPending} onClick={() => resend.mutate({ email: sentTo })}>
              Resend email
            </button>
            <Link to={`/login?next=${encodeURIComponent(next)}`} className={linkButtonClass}>
              Go to log in →
            </Link>
          </div>
        </div>
      </AuthShell>
    );
  }

  const onSubmit = ({ name, email, password }: SignupValues) =>
    signup.mutate({ name, email, password }, { onSuccess: () => setSentTo(email) });

  return (
    <AuthShell
      title="Create Account"
      intro="One account for orders, saved addresses and business pricing."
      footer={
        <>
          Already have an account?{" "}
          <Link to={`/login?next=${encodeURIComponent(next)}`} className="text-primary hover:text-primary/80">
            Log in
          </Link>
        </>
      }
    >
      <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="space-y-5">
        <Field label="Full name" autoComplete="name" error={errors.name?.message} {...form.register("name")} />
        <Field label="Email" type="email" autoComplete="email" error={errors.email?.message} {...form.register("email")} />
        <Field
          label="Password"
          type="password"
          autoComplete="new-password"
          hint="At least 8 characters."
          error={errors.password?.message}
          {...form.register("password")}
        />
        <Field label="Confirm password" type="password" autoComplete="new-password" error={errors.confirm?.message} {...form.register("confirm")} />
        {signup.isError && <FormError>{authErrorMessage(signup.error)}</FormError>}
        <button type="submit" className={`${primaryButtonClass} w-full`} disabled={signup.isPending}>
          {signup.isPending && <Loader2 size={14} className="animate-spin" />}
          Create Account
        </button>
        <p className="font-body text-[11px] text-muted-foreground">
          By creating an account you agree to our{" "}
          <Link to="/legal/terms" className="text-primary">
            terms
          </Link>{" "}
          and{" "}
          <Link to="/legal/privacy" className="text-primary">
            privacy policy
          </Link>
          .
        </p>
      </form>
    </AuthShell>
  );
};

export default Signup;
