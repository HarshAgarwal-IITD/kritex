import { type ReactNode } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, MailCheck } from "lucide-react";
import { Field, FormError, FormNotice } from "@/components/shop/Field";
import { linkButtonClass, primaryButtonClass } from "@/components/shop/styles";
import { authErrorMessage } from "@/features/account/auth-messages";
import { useResendVerification, useVerifyEmailOtp } from "@/features/account/hooks";

const codeSchema = z.object({ otp: z.string().trim().regex(/^\d{6}$/, "Enter the 6-digit code") });

/**
 * "Enter the code we emailed you": verifies the address and signs the user in (the server emails the
 * code on sign-up and on a password sign-in while unverified). `onVerified` runs once signed in.
 */
const VerifyEmailCode = ({ email, onVerified, onBack, intro }: { email: string; onVerified: () => void; onBack?: () => void; intro?: ReactNode }) => {
  const verify = useVerifyEmailOtp();
  const resend = useResendVerification();
  const form = useForm<{ otp: string }>({ resolver: zodResolver(codeSchema), defaultValues: { otp: "" } });

  return (
    <form
      onSubmit={form.handleSubmit((v) => verify.mutate({ email, otp: v.otp }, { onSuccess: onVerified }))}
      noValidate
      className="space-y-5"
      data-testid="check-email"
    >
      <MailCheck size={24} className="text-primary" />
      <p className="font-body text-sm text-muted-foreground">
        {intro ?? "We sent a 6-digit verification code to"} <span className="font-display text-foreground">{email}</span>. Enter it
        below to verify your email. It expires in 5 minutes.
      </p>
      <Field
        label="Verification code"
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={6}
        autoFocus
        error={form.formState.errors.otp?.message}
        {...form.register("otp")}
      />
      {verify.isError && <FormError>{authErrorMessage(verify.error)}</FormError>}
      {resend.isSuccess && !verify.isError && <FormNotice>We've sent a new code.</FormNotice>}
      {resend.isError && <FormError>{authErrorMessage(resend.error)}</FormError>}
      <button type="submit" className={`${primaryButtonClass} w-full`} disabled={verify.isPending}>
        {verify.isPending && <Loader2 size={14} className="animate-spin" />}
        Verify &amp; Continue
      </button>
      <div className="flex justify-between">
        {onBack ? (
          <button type="button" className={linkButtonClass} onClick={onBack}>
            Use another email
          </button>
        ) : (
          <span />
        )}
        <button
          type="button"
          className={linkButtonClass}
          disabled={resend.isPending}
          onClick={() => {
            verify.reset();
            resend.mutate({ email });
          }}
        >
          Resend code
        </button>
      </div>
    </form>
  );
};

export default VerifyEmailCode;
