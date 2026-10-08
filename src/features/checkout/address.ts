import { z } from "zod";
import type { paths } from "@/lib/api/schema";
import { GSTIN_RE, normalizePhone, PINCODE_RE, STATE_CODES, stateName } from "./india";

export type AddressInput = paths["/api/v1/checkout"]["post"]["requestBody"]["content"]["application/json"]["shippingAddress"];

/** Phone field: accepts spaces/dashes/+91/0 prefixes, outputs `+91XXXXXXXXXX`. */
export const phoneSchema = z
  .string()
  .trim()
  .min(1, "Enter a mobile number")
  .transform((v, ctx) => {
    const n = normalizePhone(v);
    if (!n) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Enter a valid 10-digit Indian mobile number" });
      return z.NEVER;
    }
    return n;
  });

export const addressFormSchema = z.object({
  name: z.string().trim().min(2, "Enter the recipient's name").max(100),
  phone: phoneSchema,
  line1: z.string().trim().min(3, "Enter the address").max(200),
  line2: z.string().trim().max(200).optional(),
  city: z.string().trim().min(2, "Enter the city").max(100),
  pincode: z.string().trim().regex(PINCODE_RE, "Enter a valid 6-digit PIN code"),
  stateCode: z.enum(STATE_CODES, { errorMap: () => ({ message: "Select the state" }) }),
});

export type AddressFormInput = z.input<typeof addressFormSchema>;
export type AddressFormValues = z.output<typeof addressFormSchema>;

export const emptyAddress: AddressFormInput = {
  name: "",
  phone: "",
  line1: "",
  line2: "",
  city: "",
  pincode: "",
  stateCode: "" as AddressFormInput["stateCode"],
};

/** Form values → the contract's address object. */
export function toAddressInput(v: AddressFormValues): AddressInput {
  return {
    name: v.name,
    phone: v.phone,
    line1: v.line1,
    ...(v.line2 ? { line2: v.line2 } : {}),
    city: v.city,
    pincode: v.pincode,
    stateCode: v.stateCode,
    state: stateName(v.stateCode),
    country: "IN",
  };
}

/** A saved/returned address (line2 may be null) → form defaults. */
export function toFormDefaults(a: { name: string; phone: string; line1: string; line2?: string | null; city: string; pincode: string; stateCode: AddressInput["stateCode"] }): AddressFormInput {
  return { name: a.name, phone: a.phone, line1: a.line1, line2: a.line2 ?? "", city: a.city, pincode: a.pincode, stateCode: a.stateCode };
}

export const gstinSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(GSTIN_RE, "Enter a valid 15-character GSTIN (e.g. 27AAPFU0939F1ZV)");

/** One-line address for summaries. */
export const addressLines = (a: { line1: string; line2?: string | null; city: string; state: string; pincode: string }) => [
  a.line1,
  a.line2,
  `${a.city}, ${a.state} ${a.pincode}`,
].filter(Boolean) as string[];
