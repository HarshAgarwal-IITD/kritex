import { useState } from "react";
import { cn } from "@/lib/utils";
import { primaryButtonClass } from "@/components/shop/styles";
import type { SavedAddress } from "@/features/account/types";
import { addressLines, toAddressInput, toFormDefaults, type AddressInput } from "../address";
import { formatPhone } from "../india";
import AddressForm from "./AddressForm";

interface AddressStepProps {
  signedIn: boolean;
  saved: SavedAddress[];
  /** The address chosen earlier (when editing this step again). */
  current?: AddressInput;
  /** Prefill for a new address (e.g. the contact phone). */
  prefill?: { phone?: string; name?: string };
  onSubmit: (address: AddressInput, saveAddress: boolean) => void;
}

const NEW = "new";

const savedToInput = (a: SavedAddress): AddressInput => ({
  name: a.name,
  phone: a.phone,
  line1: a.line1,
  ...(a.line2 ? { line2: a.line2 } : {}),
  city: a.city,
  pincode: a.pincode,
  state: a.state,
  stateCode: a.stateCode,
  country: "IN",
});

const sameAddress = (a: SavedAddress, b?: AddressInput) =>
  !!b && a.line1 === b.line1 && a.pincode === b.pincode && a.name === b.name;

/** Step 2: pick a saved address (signed in) or enter a new one. */
const AddressStep = ({ signedIn, saved, current, prefill, onSubmit }: AddressStepProps) => {
  const initial = current
    ? (saved.find((a) => sameAddress(a, current))?.id ?? NEW)
    : (saved.find((a) => a.isDefault)?.id ?? saved[0]?.id ?? NEW);
  const [choice, setChoice] = useState<string>(initial);
  const [saveAddress, setSaveAddress] = useState(signedIn);
  const selected = saved.find((a) => a.id === choice);

  return (
    <div className="space-y-5">
      {saved.length > 0 && (
        <fieldset>
          <legend className="sr-only">Saved addresses</legend>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {saved.map((a) => (
              <label
                key={a.id}
                className={cn(
                  "cursor-pointer border p-4 transition-colors duration-200",
                  choice === a.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/50",
                )}
              >
                <input
                  type="radio"
                  name="address-choice"
                  value={a.id}
                  checked={choice === a.id}
                  onChange={() => setChoice(a.id)}
                  className="sr-only"
                />
                <span className="flex items-center justify-between font-display text-xs uppercase tracking-wider text-foreground">
                  {a.name}
                  {a.isDefault && <span className="text-[9px] text-primary">Default</span>}
                </span>
                {addressLines(a).map((l) => (
                  <span key={l} className="block font-body text-xs text-muted-foreground mt-1">
                    {l}
                  </span>
                ))}
                <span className="block font-body text-xs text-muted-foreground mt-1">{formatPhone(a.phone)}</span>
              </label>
            ))}
            <label
              className={cn(
                "flex cursor-pointer items-center justify-center border border-dashed p-4 font-display text-xs transition-colors duration-200",
                choice === NEW ? "border-primary text-primary" : "border-border text-muted-foreground hover:border-primary/50",
              )}
            >
              <input type="radio" name="address-choice" value={NEW} checked={choice === NEW} onChange={() => setChoice(NEW)} className="sr-only" />+
              Use a new address
            </label>
          </div>
        </fieldset>
      )}

      {selected ? (
        <button type="button" className={primaryButtonClass} onClick={() => onSubmit(savedToInput(selected), false)}>
          Deliver Here
        </button>
      ) : (
        <AddressForm
          idPrefix="ship"
          defaultValues={current && choice === NEW ? toFormDefaults(current) : { phone: prefill?.phone ?? "", name: prefill?.name ?? "" }}
          onSubmit={(v) => onSubmit(toAddressInput(v), signedIn && saveAddress)}
        >
          {signedIn && (
            <label className="flex items-center gap-3 font-body text-sm text-muted-foreground">
              <input
                type="checkbox"
                checked={saveAddress}
                onChange={(e) => setSaveAddress(e.target.checked)}
                className="h-4 w-4 accent-[hsl(var(--primary))]"
              />
              Save this address to my account
            </label>
          )}
          <button type="submit" className={primaryButtonClass}>
            Deliver Here
          </button>
        </AddressForm>
      )}
    </div>
  );
};

export default AddressStep;
