import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Switch } from "@/components/ui/switch";
import { Field } from "@/components/shop/Field";
import { linkButtonClass, secondaryButtonClass } from "@/components/shop/styles";
import { addressLines, gstinSchema, toAddressInput, type AddressInput } from "../address";
import { stateName } from "../india";
import AddressForm from "./AddressForm";

export interface GstDetails {
  gstin: string;
  businessName: string;
}

interface GstInvoiceSectionProps {
  gst: GstDetails | null;
  onGstChange: (gst: GstDetails | null) => void;
  shipping: AddressInput;
  billing: AddressInput | null;
  onBillingChange: (billing: AddressInput | null) => void;
}

const gstSchema = z.object({
  gstin: gstinSchema,
  businessName: z.string().trim().min(2, "Enter the registered business name").max(200),
});
type GstInput = z.input<typeof gstSchema>;

/** Optional B2B invoice: GSTIN + legal name (GSTIN state must match the billing state), and an optional billing address. */
const GstInvoiceSection = ({ gst, onGstChange, shipping, billing, onBillingChange }: GstInvoiceSectionProps) => {
  const [enabled, setEnabled] = useState(!!gst);
  const [editingBilling, setEditingBilling] = useState(false);
  const billTo = billing ?? shipping;
  const form = useForm<GstInput>({
    resolver: zodResolver(gstSchema),
    defaultValues: gst ?? { gstin: "", businessName: "" },
  });
  const { errors } = form.formState;

  const toggle = (on: boolean) => {
    setEnabled(on);
    if (!on) {
      onGstChange(null);
      onBillingChange(null);
      setEditingBilling(false);
    }
  };

  const apply = (values: GstDetails) => {
    const code = values.gstin.slice(0, 2);
    if (code !== billTo.stateCode) {
      form.setError("gstin", {
        message: `This GSTIN is registered in ${stateName(code) || `state ${code}`}, but the billing address is in ${billTo.state}. Use a billing address in the GSTIN's state.`,
      });
      return;
    }
    onGstChange(values);
  };

  return (
    <div className="border border-border p-5">
      <label className="flex items-center justify-between gap-4 cursor-pointer">
        <span>
          <span className="block font-display text-xs uppercase tracking-wider text-foreground">GST invoice</span>
          <span className="block font-body text-xs text-muted-foreground mt-1">Buying for a business? Add your GSTIN to claim input tax credit.</span>
        </span>
        <Switch checked={enabled} onCheckedChange={toggle} aria-label="I need a GST invoice" />
      </label>

      {enabled && (
        <div className="mt-5 space-y-5">
          <div>
            <p className="font-display text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Billing address</p>
            {editingBilling ? (
              <AddressForm
                idPrefix="bill"
                onSubmit={(v) => {
                  onBillingChange(toAddressInput(v));
                  setEditingBilling(false);
                  if (gst) onGstChange(null);
                }}
              >
                <div className="flex gap-3">
                  <button type="submit" className={secondaryButtonClass}>
                    Use Billing Address
                  </button>
                  <button type="button" className={linkButtonClass} onClick={() => setEditingBilling(false)}>
                    Cancel
                  </button>
                </div>
              </AddressForm>
            ) : (
              <div className="flex items-start justify-between gap-4">
                <p className="font-body text-xs text-muted-foreground" data-testid="billing-address">
                  {billing ? addressLines(billing).join(", ") : "Same as shipping address"}
                </p>
                <div className="flex shrink-0 gap-4">
                  {billing && (
                    <button type="button" className={linkButtonClass} onClick={() => onBillingChange(null)}>
                      Use shipping
                    </button>
                  )}
                  <button type="button" className={linkButtonClass} onClick={() => setEditingBilling(true)}>
                    {billing ? "Change" : "Bill to a different address"}
                  </button>
                </div>
              </div>
            )}
          </div>

          {gst ? (
            <div className="flex items-start justify-between gap-4 border border-primary/40 bg-primary/10 px-4 py-3">
              <p className="font-body text-xs text-foreground" data-testid="applied-gstin">
                {gst.businessName} · GSTIN {gst.gstin}
              </p>
              <button type="button" className={linkButtonClass} onClick={() => onGstChange(null)}>
                Change
              </button>
            </div>
          ) : (
            !editingBilling && (
              <form onSubmit={form.handleSubmit((v) => apply(v as GstDetails))} noValidate className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field label="GSTIN" className="uppercase" autoComplete="off" maxLength={15} error={errors.gstin?.message} {...form.register("gstin")} />
                  <Field label="Registered business name" autoComplete="organization" error={errors.businessName?.message} {...form.register("businessName")} />
                </div>
                <button type="submit" className={secondaryButtonClass}>
                  Add GSTIN
                </button>
              </form>
            )
          )}
        </div>
      )}
    </div>
  );
};

export default GstInvoiceSection;
