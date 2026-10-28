export type Studio = {
  ownerName?: string;
  email?: string;
  phone?: string;
  studioName?: string;
  city?: string;
  state?: string;
  businessType?: string;
  logo?: string;
  trialStartedAt?: string;
  specialities?: string[];
  teamSize?: string;
  gstin?: string;
  plan?: string;
  billing?: "monthly" | "yearly";
};

const KEY = "frameflow.studio";

export function getStudio(): Studio {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(KEY) || "{}");
  } catch {
    return {};
  }
}

export function saveStudio(patch: Studio) {
  const next = { ...getStudio(), ...patch };
  localStorage.setItem(KEY, JSON.stringify(next));
  return next;
}

export function replaceStudio(studio: Studio) {
  localStorage.setItem(KEY, JSON.stringify(studio));
  return studio;
}

export const PLANS = [
  {
    id: "solo",
    name: "Solo",
    monthly: 999,
    yearly: 799,
    tagline: "For freelance photographers",
    features: ["1 user", "Enquiries & client records", "Quotations & invoices with GST", "50 bookings / month", "WhatsApp reminders"],
  },
  {
    id: "studio",
    name: "Studio",
    monthly: 2499,
    yearly: 1999,
    tagline: "For growing wedding studios",
    featured: true,
    features: ["Up to 8 team members", "Everything in Solo", "Shoot calendar & crew assignment", "Editing pipeline & deadlines", "Client delivery galleries", "Profit per project"],
  },
  {
    id: "collective",
    name: "Collective",
    monthly: 5999,
    yearly: 4799,
    tagline: "For multi-city production houses",
    features: ["Unlimited team", "Everything in Studio", "Multiple branches", "Freelancer payouts", "Custom roles & approvals", "Priority onboarding"],
  },
] as const;

export const inr = (n: number) => "₹" + n.toLocaleString("en-IN");
