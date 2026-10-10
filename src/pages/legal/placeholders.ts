/**
 * Business facts the policy pages need but that are not yet known.
 * Kritex must replace every "[...]" value below before launch; the pages pick the values up from here.
 * Values still wrapped in [square brackets] are highlighted on the page so they are easy to spot.
 */
export const PLACEHOLDERS = {
  legalEntityName: "M/s Janki International",
  registeredAddress: "Gairkata Road, Binnaguri, Dist. Jalpaiguri, West Bengal 735203, India",
  gstin: "19EBNPA4275F1ZI",
  cin: "Import Export Code (IEC) EPNPA4275F",
  jurisdictionCity: "Jalpaiguri, West Bengal",
  businessHours: "[BUSINESS HOURS, e.g. Monday–Saturday, 10:00–18:00 IST]",
  grievanceOfficerName: "Aditya Agarwal",
  grievanceOfficerDesignation: "Proprietor",
  grievanceOfficerEmail: "jankii.international@gmail.com",
  grievanceOfficerPhone: "+91 74774 59459",
  returnsAddress: "M/s Janki International, Gairkata Road, Binnaguri, Dist. Jalpaiguri, West Bengal 735203",
  flatShippingFee: "₹99",
  freeShippingThreshold: "₹999",
  dispatchTime: "[N] business days",
  deliveryTime: "[N–M] business days",
  exchangeShippingPayer: "[WHO PAYS RETURN SHIPPING FOR SIZE EXCHANGES]",
  emailProvider: "Resend",
  hostingProvider: "Render, Neon, Vercel and Cloudflare",
} as const;

export type PlaceholderKey = keyof typeof PLACEHOLDERS;

export const isUnfilled = (value: string): boolean => value.includes("[");
