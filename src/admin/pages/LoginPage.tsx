import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { asset } from "@/lib/asset";
import { isStaff, useMe, useSession, useSignIn } from "../api/auth";
import { adminPaths } from "../paths";
import { FullPageSpinner } from "../components/PageState";

const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email"),
  password: z.string().min(1, "Enter your password"),
});
type LoginValues = z.infer<typeof loginSchema>;

/** Only allow redirects back into the admin app (no open redirects). */
function safeNext(next: string | null): string {
  return next && next.startsWith("/admin") && !next.startsWith("/admin/login") ? next : adminPaths.products;
}

export default function LoginPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const next = safeNext(params.get("next"));
  const session = useSession();
  const me = useMe(!!session.data);
  const signIn = useSignIn();
  const form = useForm<LoginValues>({ resolver: zodResolver(loginSchema), defaultValues: { email: "", password: "" } });

  if (session.isPending || (session.data && me.isPending)) return <FullPageSpinner />;
  if (isStaff(me.data) && !signIn.isPending) return <Navigate to={next} replace />;

  const onSubmit = (values: LoginValues) =>
    signIn.mutate({ email: values.email, password: values.password }, {
      onSuccess: (user) => {
        if (isStaff(user)) navigate(next, { replace: true });
      },
    });

  const signedInNonStaff = signIn.isSuccess && !isStaff(signIn.data);
  const errorMessage = signIn.isError
    ? signIn.error.status === 401
      ? "Invalid email or password."
      : signIn.error.message
    : signedInNonStaff
      ? "This account doesn't have admin access."
      : null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm border border-border bg-card/50 p-8">
        <div className="flex items-center gap-3 mb-8">
          <img src={asset("/brand/flower_yellow.png")} alt="" className="h-8 w-8 object-contain" />
          <h1 className="font-display text-lg text-foreground">Kritex Admin</h1>
        </div>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" autoComplete="username" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input type="password" autoComplete="current-password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {errorMessage && (
              <Alert variant="destructive">
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>
            )}
            <Button type="submit" className="w-full font-display text-xs" disabled={signIn.isPending}>
              {signIn.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Sign in
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}
