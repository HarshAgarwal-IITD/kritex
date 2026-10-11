import { useState } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { Field, FormError } from "@/components/shop/Field";
import { primaryButtonClass } from "@/components/shop/styles";
import AuthShell from "@/features/account/components/AuthShell";
import { loadPendingEnquiry, SAVED_ENQUIRY_INTRO } from "@/features/enquiry/pending";
import GoogleSignIn from "@/features/account/components/GoogleSignIn";
import VerifyEmailCode from "@/features/account/components/VerifyEmailCode";
import { authErrorMessage, passwordRules, safeNext } from "@/features/account/auth-messages";
import { useCurrentUser, useSignup } from "@/features/account/hooks";

const signupSchema = z
  .object({
    name: z.string().trim().min(2, "Enter your name").max(100),
    email: z.string().trim().toLowerCase().email("Enter a valid email"),
    password: passwordRules,
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, { path: ["confirm"], message: "Passwords don't match" });
type SignupValues = z.infer<typeof signupSchema>;

/**
 * `/signup?next=` — creates the account, then asks for the 6-digit code we emailed. The code signs
 * the customer in and they go straight back to `next` (e.g. the enquiry form they were filling in).
 */
const Signup = () => {
  const [params] = useSearchParams();
  const next = safeNext(params.get("next"));
  const { isSignedIn, isPending } = useCurrentUser();
  const navigate = useNavigate();
  const signup = useSignup();
  const [justVerified, setJustVerified] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const form = useForm<SignupValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: { name: "", email: "", password: "", confirm: "" },
  });
  const { errors } = form.formState;

  if (!isPending && isSignedIn && !justVerified) return <Navigate to={next} replace />;

  if (sentTo) {
    return (
      <AuthShell title="Verify your email" intro={null}>
        <VerifyEmailCode email={sentTo} onVerified={() => {
            setJustVerified(true);
            navigate(next, { replace: true });
          }} onBack={() => setSentTo(null)} />
      </AuthShell>
    );
  }

  const onSubmit = ({ name, email, password }: SignupValues) =>
    signup.mutate({ name, email, password }, { onSuccess: () => setSentTo(email) });

  return (
    <AuthShell
      title="Create Account"
      intro={loadPendingEnquiry() ? SAVED_ENQUIRY_INTRO : "One account for orders, saved addresses and business pricing."}
      footer={
        <>
          Already have an account?{" "}
          <Link to={`/login?next=${encodeURIComponent(next)}`} className="text-primary hover:text-primary/80">
            Log in
          </Link>
        </>
      }
    >
      <GoogleSignIn next={next} />
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
