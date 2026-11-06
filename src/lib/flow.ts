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

export const inr = (n: number) => "₹" + n.toLocaleString("en-IN");
