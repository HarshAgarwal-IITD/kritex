import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Field } from "@/components/shop/Field";
import { primaryButtonClass } from "@/components/shop/styles";
import type { Me } from "@/features/account/types";
import { phoneSchema } from "../address";

const contactSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  phone: phoneSchema,
});
type ContactInput = z.input<typeof contactSchema>;
export type ContactValues = z.output<typeof contactSchema>;

interface ContactStepProps {
  user: Me | null;
  defaultValues?: Partial<ContactValues>;
  onSubmit: (values: ContactValues) => void;
}

/** Step 1: contact. Signed-in users only confirm a phone; guests give email + phone or log in. */
const ContactStep = ({ user, defaultValues, onSubmit }: ContactStepProps) => {
  const form = useForm<ContactInput, unknown, ContactValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      email: user?.email ?? defaultValues?.email ?? "",
      phone: defaultValues?.phone ?? user?.phone ?? "",
    },
  });
  const { errors } = form.formState;

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="space-y-5">
      {user ? (
        <p className="font-body text-sm text-muted-foreground">
          Signed in as <span className="text-foreground">{user.email}</span>
        </p>
      ) : (
        <p className="font-body text-sm text-muted-foreground">
          Checking out as a guest.{" "}
          <Link to="/login?next=%2Fcheckout" className="text-primary hover:text-primary/80 transition-colors duration-200">
            Log in
          </Link>{" "}
          to use saved addresses and track orders.
        </p>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {!user && (
          <Field label="Email" type="email" autoComplete="email" error={errors.email?.message} {...form.register("email")} />
        )}
        <Field
          label="Mobile number"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="98765 43210"
          hint="For delivery updates."
          error={errors.phone?.message}
          {...form.register("phone")}
        />
      </div>
      <button type="submit" className={primaryButtonClass}>
        Continue to Address
      </button>
    </form>
  );
};

export default ContactStep;
