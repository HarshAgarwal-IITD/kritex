import { useState } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Field, FormError, FormNotice } from "@/components/shop/Field";
import { linkButtonClass, primaryButtonClass } from "@/components/shop/styles";
import AuthShell from "@/features/account/components/AuthShell";
import GoogleSignIn from "@/features/account/components/GoogleSignIn";
import { authErrorMessage, safeNext } from "@/features/account/auth-messages";
import { useCurrentUser, useLogin, useOtpLogin, useResendVerification, useSendLoginOtp } from "@/features/account/hooks";

const emailField = z.string().trim().toLowerCase().email("Enter a valid email");

const passwordSchema = z.object({ email: emailField, password: z.string().min(1, "Enter your password") });
type PasswordValues = z.infer<typeof passwordSchema>;

const otpEmailSchema = z.object({ email: emailField });
const otpCodeSchema = z.object({ otp: z.string().trim().regex(/^\d{6}$/, "Enter the 6-digit code") });

const PasswordLogin = ({ onDone }: { onDone: () => void }) => {
  const login = useLogin();
  const resend = useResendVerification();
  const form = useForm<PasswordValues>({ resolver: zodResolver(passwordSchema), defaultValues: { email: "", password: "" } });
  const { errors } = form.formState;
  const unverified = login.error?.code === "EMAIL_NOT_VERIFIED";

  return (
    <form onSubmit={form.handleSubmit((v) => login.mutate(v as Required<PasswordValues>, { onSuccess: onDone }))} noValidate className="space-y-5">
      <Field label="Email" type="email" autoComplete="email" error={errors.email?.message} {...form.register("email")} />
      <Field
        label="Password"
        type="password"
        autoComplete="current-password"
        error={errors.password?.message}
        hint={
          <Link to="/forgot-password" className="text-primary hover:text-primary/80">
            Forgot password?
          </Link>
        }
        {...form.register("password")}
      />
      {login.isError && (
        <FormError>
          {authErrorMessage(login.error)}
          {unverified && (
            <>
              {" "}
              <button
                type="button"
                className="underline"
                disabled={resend.isPending || resend.isSuccess}
                onClick={() => resend.mutate({ email: form.getValues("email") })}
              >
                {resend.isSuccess ? "Verification email sent." : "Resend verification email"}
              </button>
            </>
          )}
        </FormError>
      )}
      <button type="submit" className={`${primaryButtonClass} w-full`} disabled={login.isPending}>
        {login.isPending && <Loader2 size={14} className="animate-spin" />}
        Log In
      </button>
    </form>
  );
};

const OtpLogin = ({ onDone }: { onDone: () => void }) => {
  const [email, setEmail] = useState<string | null>(null);
  const send = useSendLoginOtp();
  const verify = useOtpLogin();
  const emailForm = useForm<{ email: string }>({ resolver: zodResolver(otpEmailSchema), defaultValues: { email: "" } });
  const codeForm = useForm<{ otp: string }>({ resolver: zodResolver(otpCodeSchema), defaultValues: { otp: "" } });

  if (!email) {
    return (
      <form
        onSubmit={emailForm.handleSubmit((v) => send.mutate(v, { onSuccess: () => setEmail(v.email) }))}
        noValidate
        className="space-y-5"
      >
        <Field
          label="Email"
          type="email"
          autoComplete="email"
          error={emailForm.formState.errors.email?.message}
          {...emailForm.register("email")}
        />
        {send.isError && <FormError>{authErrorMessage(send.error)}</FormError>}
        <button type="submit" className={`${primaryButtonClass} w-full`} disabled={send.isPending}>
          {send.isPending && <Loader2 size={14} className="animate-spin" />}
          Email Me a Code
        </button>
      </form>
    );
  }

  return (
    <form
      onSubmit={codeForm.handleSubmit((v) => verify.mutate({ email, otp: v.otp }, { onSuccess: onDone }))}
      noValidate
      className="space-y-5"
    >
      <FormNotice>
        We sent a 6-digit code to <span className="font-display">{email}</span>. It expires in 5 minutes.
      </FormNotice>
      <Field
        label="Code"
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={6}
        error={codeForm.formState.errors.otp?.message}
        {...codeForm.register("otp")}
      />
      {verify.isError && <FormError>{authErrorMessage(verify.error)}</FormError>}
      <button type="submit" className={`${primaryButtonClass} w-full`} disabled={verify.isPending}>
        {verify.isPending && <Loader2 size={14} className="animate-spin" />}
        Log In
      </button>
      <div className="flex justify-between">
        <button type="button" className={linkButtonClass} onClick={() => setEmail(null)}>
          Use another email
        </button>
        <button type="button" className={linkButtonClass} disabled={send.isPending} onClick={() => send.mutate({ email })}>
          Resend code
        </button>
      </div>
    </form>
  );
};

const tabClass = (active: boolean) =>
  cn(
    "flex-1 border-b-2 pb-3 font-display text-[11px] uppercase tracking-wider transition-colors duration-200",
    active ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground",
  );

/** `/login?next=` — password or email-code sign-in. */
const Login = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const next = safeNext(params.get("next"));
  const [mode, setMode] = useState<"password" | "otp">("password");
  const { isSignedIn, isPending } = useCurrentUser();
  const [justSignedIn, setJustSignedIn] = useState(false);

  if (!isPending && isSignedIn && !justSignedIn) return <Navigate to={next} replace />;

  const onDone = () => {
    setJustSignedIn(true);
    navigate(next, { replace: true });
  };

  return (
    <AuthShell
      title="Log In"
      intro="Track orders, save addresses and check out faster."
      footer={
        <>
          New to Kritex?{" "}
          <Link to={`/signup${params.get("next") ? `?next=${encodeURIComponent(next)}` : ""}`} className="text-primary hover:text-primary/80">
            Create an account
          </Link>
        </>
      }
    >
      {params.get("error") && (
        <div className="mb-6">
          <FormError>Google sign-in didn't complete. Please try again, or log in with your email.</FormError>
        </div>
      )}
      <GoogleSignIn next={next} />
      <div className="mb-6 flex gap-4" role="tablist" aria-label="Sign-in method">
        <button type="button" role="tab" aria-selected={mode === "password"} className={tabClass(mode === "password")} onClick={() => setMode("password")}>
          Password
        </button>
        <button type="button" role="tab" aria-selected={mode === "otp"} className={tabClass(mode === "otp")} onClick={() => setMode("otp")}>
          Email code
        </button>
      </div>
      {mode === "password" ? <PasswordLogin onDone={onDone} /> : <OtpLogin onDone={onDone} />}
    </AuthShell>
  );
};

export default Login;
