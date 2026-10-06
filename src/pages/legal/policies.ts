/** Shared metadata for the /legal/* policy pages (used by the index page, the footer and SEO). */

/** ISO date shown as "Last updated" on every policy page. Bump it whenever a policy changes. */
export const LEGAL_LAST_UPDATED = "2026-10-06";

/**
 * While true, every policy page shows the "Draft — pending legal review" banner.
 * Flip to false once Kritex's counsel has approved the text.
 */
export const LEGAL_DRAFT = true;

export interface PolicyMeta {
  path: string;
  /** Full page title. */
  title: string;
  /** Short label for compact link lists (footer). */
  label: string;
  description: string;
}

export const policies: PolicyMeta[] = [
  {
    path: "/legal/terms",
    title: "Terms & Conditions",
    label: "Terms",
    description:
      "The terms that govern purchases from the Kritex online store in India: eligibility, product availability, GST-inclusive pricing, order acceptance and governing law.",
  },
  {
    path: "/legal/privacy",
    title: "Privacy Policy",
    label: "Privacy",
    description:
      "How Kritex collects, uses, shares and protects your personal data under India's Digital Personal Data Protection Act, 2023, and how to exercise your rights.",
  },
  {
    path: "/legal/returns",
    title: "Refund & Returns Policy",
    label: "Returns & Refunds",
    description:
      "7-day size exchanges on unused items with tags, replacements or refunds for defective and wrong items, and refund timelines for Kritex online orders.",
  },
  {
    path: "/legal/shipping",
    title: "Shipping Policy",
    label: "Shipping",
    description:
      "Where Kritex ships, shipping charges and free-shipping threshold, dispatch and delivery timelines, and order tracking for online orders within India.",
  },
  {
    path: "/legal/cancellation",
    title: "Cancellation Policy",
    label: "Cancellation",
    description:
      "How to cancel a Kritex online order before dispatch for a full refund, and what happens once an order has shipped.",
  },
  {
    path: "/legal/contact",
    title: "Contact & Grievance Officer",
    label: "Contact & Grievances",
    description:
      "Contact Kritex for orders, procurement and support, and reach our Grievance Officer for complaints and data-protection requests.",
  },
];

export const policyByPath = (path: string): PolicyMeta => {
  const found = policies.find((p) => p.path === path);
  if (!found) throw new Error(`Unknown policy path: ${path}`);
  return found;
};
