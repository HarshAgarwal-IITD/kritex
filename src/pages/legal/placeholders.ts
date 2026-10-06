/**
 * Business facts the policy pages need but that are not yet known.
 * Kritex must replace every "[...]" value below before launch; the pages pick the values up from here.
 * Values still wrapped in [square brackets] are highlighted on the page so they are easy to spot.
 */
export const PLACEHOLDERS = {
  legalEntityName: "[LEGAL ENTITY NAME]",
  registeredAddress: "[REGISTERED ADDRESS]",
  gstin: "[GSTIN]",
  cin: "[CIN / REGISTRATION NUMBER, IF APPLICABLE]",
  jurisdictionCity: "[CITY]",
  businessHours: "[BUSINESS HOURS, e.g. Monday–Saturday, 10:00–18:00 IST]",
  grievanceOfficerName: "[GRIEVANCE OFFICER NAME]",
  grievanceOfficerDesignation: "[DESIGNATION]",
  grievanceOfficerEmail: "[GRIEVANCE OFFICER EMAIL]",
  grievanceOfficerPhone: "[GRIEVANCE OFFICER PHONE]",
  returnsAddress: "[RETURNS / WAREHOUSE ADDRESS]",
  flatShippingFee: "[₹Y]",
  freeShippingThreshold: "[₹X]",
  dispatchTime: "[N] business days",
  deliveryTime: "[N–M] business days",
  exchangeShippingPayer: "[WHO PAYS RETURN SHIPPING FOR SIZE EXCHANGES]",
  emailProvider: "[EMAIL PROVIDER]",
  hostingProvider: "[HOSTING / CLOUD PROVIDER]",
} as const;

export type PlaceholderKey = keyof typeof PLACEHOLDERS;

export const isUnfilled = (value: string): boolean => value.includes("[");
