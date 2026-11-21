/**
 * Legal identity shown on the Contact, Terms, Privacy, Refund and Delivery pages and in the footer.
 *
 * ⚠️ Fill every value before applying for Razorpay live mode. Razorpay checks that the legal name,
 * address, email and phone here match your KYC documents exactly. Values still wrapped in
 * [square brackets] are treated as unfilled and flagged on the legal pages during development.
 */
export const BUSINESS = {
  /** Brand customers see. */
  brand: "FrameFlow",
  /** Exactly as on your PAN / GST certificate / bank account, e.g. "Dipak Gaikwad" or "Lenscraft Technologies Pvt. Ltd." */
  legalName: "[Registered business name]",
  /** "Sole proprietorship", "Partnership firm", "LLP", "Private limited company" … */
  entityType: "[Sole proprietorship]",
  /** Full postal address including PIN code, as on your KYC documents. */
  address: "[Building, street, area], Pune, Maharashtra [PIN code], India",
  supportEmail: "[support@yourdomain.com]",
  /** Indian number with +91, reachable during support hours. */
  phone: "[+91 XXXXX XXXXX]",
  supportHours: "Monday to Saturday, 10:00 am – 7:00 pm IST (except public holidays)",
  /** Leave empty if not GST-registered (then also set BILLING_GST_PERCENT=0 in the backend .env). */
  gstin: "",
  /** Person who handles privacy and grievance requests (required under Indian IT Rules / DPDP Act). */
  grievanceOfficer: "[Full name]",
  grievanceEmail: "[grievance@yourdomain.com]",
  /** Courts with jurisdiction over disputes; normally the city of your registered address. */
  jurisdiction: "Pune, Maharashtra",
  /** Public URL of the website, without trailing slash. */
  website: "https://[yourdomain.com]",
  /** Date the current versions of the policies take effect. Update when you change them. */
  policiesUpdated: "7 November 2026",
} as const;

export const isPlaceholder = (value: string) => /\[[^\]]+\]/.test(value);

export const unfilledBusinessFields = () =>
  Object.entries(BUSINESS)
    .filter(([, value]) => isPlaceholder(value))
    .map(([key]) => key);
