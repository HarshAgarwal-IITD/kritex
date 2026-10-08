import { useEffect, useId, type ReactNode } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Field } from "@/components/shop/Field";
import { fieldClass, labelClass } from "@/components/shop/styles";
import { addressFormSchema, emptyAddress, type AddressFormInput, type AddressFormValues } from "../address";
import { INDIAN_STATES, lookupPincode } from "../india";

interface AddressFormProps {
  defaultValues?: Partial<AddressFormInput>;
  onSubmit: (values: AddressFormValues) => void;
  /** Rendered at the bottom (submit/cancel buttons, extra checkboxes). Receives nothing; buttons should be type="submit". */
  children: ReactNode;
  /** Prefix for field ids/labels when two address forms share a page (shipping + billing). */
  idPrefix?: string;
}

/** Indian address form: PIN code autofills state (and city for common PINs); state is the GST state code. */
const AddressForm = ({ defaultValues, onSubmit, children, idPrefix }: AddressFormProps) => {
  const autoId = useId();
  const prefix = idPrefix ?? autoId;
  const form = useForm<AddressFormInput, unknown, AddressFormValues>({
    resolver: zodResolver(addressFormSchema),
    defaultValues: { ...emptyAddress, ...defaultValues },
  });
  const { register, formState, watch, setValue, getValues } = form;
  const errors = formState.errors;
  const pincode = watch("pincode");

  useEffect(() => {
    const hit = lookupPincode(pincode?.trim() ?? "");
    if (!hit) return;
    if (getValues("stateCode") !== hit.stateCode) setValue("stateCode", hit.stateCode, { shouldValidate: formState.isSubmitted });
    if (hit.city && !getValues("city")) setValue("city", hit.city, { shouldValidate: formState.isSubmitted });
  }, [pincode, getValues, setValue, formState.isSubmitted]);

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Field id={`${prefix}-name`} label="Full name" autoComplete="name" error={errors.name?.message} {...register("name")} />
        <Field
          id={`${prefix}-phone`}
          label="Mobile number"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="98765 43210"
          error={errors.phone?.message}
          {...register("phone")}
        />
      </div>
      <Field
        id={`${prefix}-line1`}
        label="Address"
        autoComplete="address-line1"
        placeholder="House / flat no., building, street"
        error={errors.line1?.message}
        {...register("line1")}
      />
      <Field
        id={`${prefix}-line2`}
        label="Area / landmark (optional)"
        autoComplete="address-line2"
        error={errors.line2?.message}
        {...register("line2")}
      />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <Field
          id={`${prefix}-pincode`}
          label="PIN code"
          inputMode="numeric"
          autoComplete="postal-code"
          maxLength={6}
          error={errors.pincode?.message}
          {...register("pincode")}
        />
        <Field id={`${prefix}-city`} label="City" autoComplete="address-level2" error={errors.city?.message} {...register("city")} />
        <div>
          <label htmlFor={`${prefix}-state`} className={labelClass}>
            State
          </label>
          <select
            id={`${prefix}-state`}
            className={fieldClass}
            autoComplete="address-level1"
            aria-invalid={errors.stateCode ? true : undefined}
            {...register("stateCode")}
          >
            <option value="">Select state</option>
            {INDIAN_STATES.map((s) => (
              <option key={s.code} value={s.code}>
                {s.name}
              </option>
            ))}
          </select>
          {errors.stateCode && <p className="font-body text-[11px] text-destructive mt-1.5">{errors.stateCode.message}</p>}
        </div>
      </div>
      {children}
    </form>
  );
};

export default AddressForm;
