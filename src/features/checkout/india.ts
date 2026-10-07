import type { paths } from "@/lib/api/schema";

type AddressInput = paths["/api/v1/checkout"]["post"]["requestBody"]["content"]["application/json"]["shippingAddress"];
export type StateCode = AddressInput["stateCode"];

/** GST state codes (the contract's `stateCode` enum) with display names. */
export const INDIAN_STATES: { code: StateCode; name: string }[] = [
  { code: "35", name: "Andaman and Nicobar Islands" },
  { code: "37", name: "Andhra Pradesh" },
  { code: "12", name: "Arunachal Pradesh" },
  { code: "18", name: "Assam" },
  { code: "10", name: "Bihar" },
  { code: "04", name: "Chandigarh" },
  { code: "22", name: "Chhattisgarh" },
  { code: "26", name: "Dadra and Nagar Haveli and Daman and Diu" },
  { code: "07", name: "Delhi" },
  { code: "30", name: "Goa" },
  { code: "24", name: "Gujarat" },
  { code: "06", name: "Haryana" },
  { code: "02", name: "Himachal Pradesh" },
  { code: "01", name: "Jammu and Kashmir" },
  { code: "20", name: "Jharkhand" },
  { code: "29", name: "Karnataka" },
  { code: "32", name: "Kerala" },
  { code: "38", name: "Ladakh" },
  { code: "31", name: "Lakshadweep" },
  { code: "23", name: "Madhya Pradesh" },
  { code: "27", name: "Maharashtra" },
  { code: "14", name: "Manipur" },
  { code: "17", name: "Meghalaya" },
  { code: "15", name: "Mizoram" },
  { code: "13", name: "Nagaland" },
  { code: "21", name: "Odisha" },
  { code: "34", name: "Puducherry" },
  { code: "03", name: "Punjab" },
  { code: "08", name: "Rajasthan" },
  { code: "11", name: "Sikkim" },
  { code: "33", name: "Tamil Nadu" },
  { code: "36", name: "Telangana" },
  { code: "16", name: "Tripura" },
  { code: "09", name: "Uttar Pradesh" },
  { code: "05", name: "Uttarakhand" },
  { code: "19", name: "West Bengal" },
];

export const STATE_CODES = INDIAN_STATES.map((s) => s.code) as [StateCode, ...StateCode[]];

export const stateName = (code: string): string => INDIAN_STATES.find((s) => s.code === code)?.name ?? "";

export const PINCODE_RE = /^[1-9]\d{5}$/;

/** Postal circles by the first two PIN digits (India Post). Ambiguous prefixes are refined by PREFIX3 below. */
const PREFIX2: Record<string, StateCode> = {
  "11": "07",
  "12": "06",
  "13": "06",
  "14": "03",
  "15": "03",
  "16": "03",
  "17": "02",
  "18": "01",
  "19": "01",
  "20": "09", "21": "09", "22": "09", "23": "09", "24": "09", "25": "09", "26": "09", "27": "09", "28": "09",
  "30": "08", "31": "08", "32": "08", "33": "08", "34": "08",
  "36": "24", "37": "24", "38": "24", "39": "24",
  "40": "27", "41": "27", "42": "27", "43": "27", "44": "27",
  "45": "23", "46": "23", "47": "23", "48": "23",
  "49": "22",
  "50": "36",
  "51": "37", "52": "37", "53": "37",
  "56": "29", "57": "29", "58": "29", "59": "29",
  "60": "33", "61": "33", "62": "33", "63": "33", "64": "33",
  "67": "32", "68": "32", "69": "32",
  "70": "19", "71": "19", "72": "19", "73": "19", "74": "19",
  "75": "21", "76": "21", "77": "21",
  "78": "18",
  "80": "10", "81": "10", "82": "10", "83": "10", "84": "10", "85": "10",
};

const PREFIX3: Record<string, StateCode> = {
  "160": "04",
  "194": "38",
  "246": "05", "247": "05", "248": "05", "249": "05", "262": "05", "263": "05",
  "403": "30",
  "605": "34",
  "737": "11",
  "744": "35",
  "790": "12", "791": "12", "792": "12",
  "793": "17", "794": "17",
  "795": "14",
  "796": "15",
  "797": "13", "798": "13",
  "799": "16",
  "814": "20", "815": "20", "816": "20", "822": "20", "825": "20", "826": "20", "827": "20", "828": "20", "829": "20",
  "831": "20", "832": "20", "833": "20", "834": "20", "835": "20",
};

/** Main city for a few common PIN prefixes; anything else is left for the customer to type. */
const CITY3: Record<string, string> = {
  "110": "New Delhi",
  "122": "Gurugram",
  "160": "Chandigarh",
  "226": "Lucknow",
  "248": "Dehradun",
  "302": "Jaipur",
  "380": "Ahmedabad",
  "395": "Surat",
  "400": "Mumbai",
  "411": "Pune",
  "440": "Nagpur",
  "452": "Indore",
  "462": "Bhopal",
  "500": "Hyderabad",
  "560": "Bengaluru",
  "600": "Chennai",
  "641": "Coimbatore",
  "682": "Kochi",
  "700": "Kolkata",
  "751": "Bhubaneswar",
  "781": "Guwahati",
  "800": "Patna",
  "834": "Ranchi",
};

/** Best-effort state (and sometimes city) for a 6-digit PIN code, from a small local table. */
export function lookupPincode(pincode: string): { stateCode: StateCode; state: string; city?: string } | null {
  if (!PINCODE_RE.test(pincode)) return null;
  const p3 = pincode.slice(0, 3);
  const stateCode = PREFIX3[p3] ?? PREFIX2[pincode.slice(0, 2)];
  if (!stateCode) return null;
  return { stateCode, state: stateName(stateCode), city: CITY3[p3] };
}

/** Normalises an Indian mobile number to `+91XXXXXXXXXX` (the contract's format), or null if invalid. */
export function normalizePhone(input: string): string | null {
  let digits = input.replace(/[\s\-().]/g, "");
  if (digits.startsWith("+91")) digits = digits.slice(3);
  else if (digits.length === 12 && digits.startsWith("91")) digits = digits.slice(2);
  else if (digits.length === 11 && digits.startsWith("0")) digits = digits.slice(1);
  return /^[6-9]\d{9}$/.test(digits) ? `+91${digits}` : null;
}

/** Formats `+919876543210` as `+91 98765 43210` for display. */
export const formatPhone = (phone: string): string => {
  const n = normalizePhone(phone);
  return n ? `+91 ${n.slice(3, 8)} ${n.slice(8)}` : phone;
};

export const GSTIN_RE = /^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;
