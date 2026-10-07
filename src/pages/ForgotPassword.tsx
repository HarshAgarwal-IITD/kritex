import { useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { Field, FormError, FormNotice } from "@/components/shop/Field";
import { primaryButtonClass } from "@/components/shop/styles";
import AuthShell from "@/features/account/components/AuthShell";
import { authErrorMessage } from "@/features/account/auth-messages";
import { useRequestPasswordReset } from "@/features/account/hooks";

const schema = z.object({ email: z.string().trim().toLowerCase().email("Enter a valid email") });
type Values = z.infer<typeof schema>;

/** `/forgot-password` — emails a reset link that lands on `/reset-password?token=`. */
const ForgotPassword = () => {
  const request = useRequestPasswordReset();
  const [sentTo, setSentTo] = useState<string | null>(null);
  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { email: "" } });

  return (
    <AuthShell
      title="Reset Password"
      intro="Enter your account email and we'll send you a link to set a new password."
      footer={
        <Link to="/login" className="text-primary hover:text-primary/80">
          ← Back to log in
        </Link>
      }
    >
      {sentTo ? (
        <FormNotice>
          If an account exists for <span className="font-display">{sentTo}</span>, a reset link is on its way. It expires in an hour.
        </FormNotice>
      ) : (
        <form
          onSubmit={form.handleSubmit((v) => request.mutate(v as Required<Values>, { onSuccess: () => setSentTo(v.email) }))}
          noValidate
          className="space-y-5"
        >
          <Field label="Email" type="email" autoComplete="email" error={form.formState.errors.email?.message} {...form.register("email")} />
          {request.isError && <FormError>{authErrorMessage(request.error)}</FormError>}
          <button type="submit" className={`${primaryButtonClass} w-full`} disabled={request.isPending}>
            {request.isPending && <Loader2 size={14} className="animate-spin" />}
            Send Reset Link
          </button>
        </form>
      )}
    </AuthShell>
  );
};

export default ForgotPassword;
