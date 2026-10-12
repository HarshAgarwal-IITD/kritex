/**
 * Business facts the policy pages need but that are not yet known.
 * Kritex must replace every "[...]" value below before launch; the pages pick the values up from here.
 * Values still wrapped in [square brackets] are highlighted on the page so they are easy to spot.
 */
export const PLACEHOLDERS = {
  legalEntityName: "Harsh Agarwal, proprietor of M/s Garg Sales Corporation",
  registeredAddress: "Second Floor, Hotel Niladrii Galaxy, Bidhan Market, Ward No. 11, Siliguri, Dist. Darjeeling, West Bengal 734001, India",
  gstin: "19FAEPA3026H1Z1",
  cin: "GST registration (Proprietorship), Form GST REG-06 issued 20/06/2024",
  jurisdictionCity: "Siliguri, West Bengal",
  businessHours: "Monday–Saturday, 10:00–19:00 IST",
  grievanceOfficerName: "Harsh Agarwal",
  grievanceOfficerDesignation: "Proprietor",
  grievanceOfficerEmail: "jankii.international@gmail.com",
  grievanceOfficerPhone: "+91 74774 59459",
  returnsAddress: "M/s Garg Sales Corporation, Second Floor, Hotel Niladrii Galaxy, Bidhan Market, Ward No. 11, Siliguri, Dist. Darjeeling, West Bengal 734001",
  flatShippingFee: "₹99",
  freeShippingThreshold: "₹999",
  dispatchTime: "1–2 business days",
  deliveryTime: "3–7 business days",
  exchangeShippingPayer: "Kritex",
  emailProvider: "Resend",
  hostingProvider: "Render, Neon, Vercel and Cloudflare",
} as const;

export type PlaceholderKey = keyof typeof PLACEHOLDERS;

export const isUnfilled = (value: string): boolean => value.includes("[");
