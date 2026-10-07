import { Link, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { Field, FormError, FormNotice } from "@/components/shop/Field";
import { primaryButtonClass } from "@/components/shop/styles";
import AuthShell from "@/features/account/components/AuthShell";
import { authErrorMessage, passwordRules } from "@/features/account/auth-messages";
import { useResetPassword } from "@/features/account/hooks";

const schema = z
  .object({ password: passwordRules, confirm: z.string() })
  .refine((v) => v.password === v.confirm, { path: ["confirm"], message: "Passwords don't match" });
type Values = z.infer<typeof schema>;

/** `/reset-password?token=` — the emailed link lands here (Better Auth appends `?error=INVALID_TOKEN` for bad links). */
const ResetPassword = () => {
  const [params] = useSearchParams();
  const token = params.get("token");
  const linkError = params.get("error");
  const reset = useResetPassword();
  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { password: "", confirm: "" } });
  const { errors } = form.formState;

  const footer = (
    <Link to="/login" className="text-primary hover:text-primary/80">
      ← Back to log in
    </Link>
  );

  if (!token || linkError) {
    return (
      <AuthShell title="Reset Password" footer={footer}>
        <FormError>
          This reset link is invalid or has expired.{" "}
          <Link to="/forgot-password" className="underline">
            Request a new one
          </Link>
          .
        </FormError>
      </AuthShell>
    );
  }

  if (reset.isSuccess) {
    return (
      <AuthShell title="Password Updated" footer={footer}>
        <FormNotice>Your password has been changed and other devices were signed out.</FormNotice>
        <Link to="/login" className={`${primaryButtonClass} mt-6 w-full`}>
          Log In
        </Link>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Set a New Password" footer={footer}>
      <form onSubmit={form.handleSubmit((v) => reset.mutate({ token, newPassword: v.password }))} noValidate className="space-y-5">
        <Field
          label="New password"
          type="password"
          autoComplete="new-password"
          hint="At least 8 characters."
          error={errors.password?.message}
          {...form.register("password")}
        />
        <Field label="Confirm password" type="password" autoComplete="new-password" error={errors.confirm?.message} {...form.register("confirm")} />
        {reset.isError && <FormError>{authErrorMessage(reset.error)}</FormError>}
        <button type="submit" className={`${primaryButtonClass} w-full`} disabled={reset.isPending}>
          {reset.isPending && <Loader2 size={14} className="animate-spin" />}
          Update Password
        </button>
      </form>
    </AuthShell>
  );
};

export default ResetPassword;
