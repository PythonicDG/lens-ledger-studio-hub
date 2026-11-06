import { ApiError, fetchPlatformData, getAuthToken, savePlatformData } from "./auth";
import { getStudio } from "./flow";
import type { PdfFormat } from "./quotation-pdf";

export type Service = {
  id: string;
  name: string;
  category: string;
  description: string;
  price: number;
  active: boolean;
};
export type Package = {
  id: string;
  name: string;
  category: string;
  description: string;
  serviceIds: string[];
  /** Crew that is covered, e.g. "1 Traditional Photographer". */
  team: string[];
  /** What the client receives, e.g. "25 Page Album with mini book & calendar". */
  deliverables: string[];
  /** Free text shown beneath the package, e.g. gifts or add-on prices. */
  notes: string;
  price: number;
  active: boolean;
};
/** Copy of a package stored on a quotation, so it can be edited per client without touching the catalogue. */
export type PackageDetails = {
  name: string;
  category: string;
  team: string[];
  deliverables: string[];
  notes: string;
};
export type QuoteTeamLine = { qty: number; role: string };
/** A private copy of a package stored on a quotation. Never linked back to the catalogue. */
export type QuotePackage = {
  id: string;
  /** Catalogue package this was copied from (informational only). */
  sourceId: string;
  title: string;
  price: number;
  /** Unticked packages are shown in the PDF as options but left out of the total. */
  countInTotal: boolean;
  team: QuoteTeamLine[];
  materials: string[];
  gift: string;
};
export type Client = {
  id: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  notes: string;
};
export type Enquiry = {
  id: string;
  clientId: string;
  event: string;
  date: string;
  location: string;
  budget: number;
  source: string;
  followUp: string;
  notes: string;
  status: "New" | "Contacted" | "Quoted" | "Closed";
};
export type Quote = {
  id: string;
  number: string;
  enquiryId: string;
  clientId: string;
  packageId: string;
  event: string;
  date: string;
  location: string;
  items: { name: string; price: number }[];
  packageDetails?: PackageDetails | undefined;
  /** Multi-package quotations. Absent on quotations created before packages were editable per quote. */
  packages?: QuotePackage[] | undefined;
  /** Rupee discount. */
  discount: number;
  advance: number;
  terms: string;
  status: "Draft" | "Pending" | "Accepted" | "Rejected" | "Changes requested" | "Superseded";
  rootId?: string;
  version?: number;
  feedback?: string;
  createdAt: string;
};
export type TeamAssignment = { id: string; memberId: string; date: string; fee: number };
export type TeamPayment = {
  id: string;
  bookingId: string;
  assignmentId: string;
  memberId: string;
  amount: number;
  date: string;
  method: string;
  note: string;
};
export type Booking = {
  id: string;
  quoteId: string;
  clientId: string;
  event: string;
  date: string;
  endDate: string;
  location: string;
  serviceNames: string[];
  assignments: TeamAssignment[];
  checklist: string[];
  notes: string;
};
export type Payment = {
  id: string;
  bookingId: string;
  amount: number;
  date: string;
  method: string;
  reference: string;
  note: string;
};
export type TeamMember = { id: string; name: string; role: string; phone: string };
export type AssistPayment = {
  id: string;
  amount: number;
  date: string;
  method: string;
  note: string;
};
// A shoot where the studio helped another photographer (second shooter, assistant, etc.).
export type AssistJob = {
  id: string;
  photographer: string;
  phone: string;
  event: string;
  date: string;
  endDate: string;
  location: string;
  role: string;
  fee: number;
  dueDate: string;
  notes: string;
  payments: AssistPayment[];
};
export const DEFAULT_SERVICE_CATEGORIES = ["Photography", "Video", "Add-on", "Deliverable", "Other"];
export const DEFAULT_PACKAGE_CATEGORIES = ["Wedding", "Pre-wedding", "Engagement", "Birthday", "Other"];
export type Platform = {
  categories: { services: string[]; packages: string[] };
  services: Service[];
  packages: Package[];
  clients: Client[];
  enquiries: Enquiry[];
  quotes: Quote[];
  bookings: Booking[];
  payments: Payment[];
  teamPayments: TeamPayment[];
  team: TeamMember[];
  assists: AssistJob[];
  settings: { currency: string; quoteTerms: string; invoicePrefix: string; pdfFormat?: Partial<PdfFormat> };
};

export const newId = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
const empty = (): Platform => ({
  categories: {
    services: [...DEFAULT_SERVICE_CATEGORIES],
    packages: [...DEFAULT_PACKAGE_CATEGORIES],
  },
  services: [],
  packages: [],
  clients: [],
  enquiries: [],
  quotes: [],
  bookings: [],
  payments: [],
  teamPayments: [],
  team: [],
  assists: [],
  settings: {
    currency: "INR",
    quoteTerms:
      "Booking is confirmed after the advance payment. Final deliverables and timeline will be agreed before the shoot.",
    invoicePrefix: "FF",
  },
});
const key = () => `frameflow.platform.${getStudio().email?.toLowerCase() || "local"}`;

export function getPlatform(): Platform {
  if (typeof window === "undefined") return empty();
  try {
    const stored = JSON.parse(localStorage.getItem(key()) || "null") as Partial<Platform> | null;
    if (!stored) return empty();
    const quotes = (stored.quotes || []).map(({ gst: _gst, ...quote }: Quote & { gst?: number }) => quote);
    const legacySettings: Platform["settings"] & { defaultGst?: number } = {
      ...empty().settings,
      ...stored.settings,
    };
    const { defaultGst: _defaultGst, ...settings } = legacySettings;
    const bookings = (stored.bookings || []).map((booking) => {
      const {
        editingStatus: _editingStatus,
        deliveryLink: _deliveryLink,
        deliveryStatus: _deliveryStatus,
        teamIds,
        ...rest
      } = booking as Omit<Booking, "assignments"> & {
        assignments?: TeamAssignment[];
        teamIds?: string[];
        editingStatus?: string;
        deliveryLink?: string;
        deliveryStatus?: string;
      };
      // Older bookings assigned people to the whole shoot; expand to one assignment per day.
      const assignments =
        rest.assignments ||
        (teamIds || []).flatMap((memberId) =>
          shootDays(rest.date, rest.endDate).map((date) => ({ id: newId(), memberId, date, fee: 0 })),
        );
      return { ...rest, assignments };
    });
    const packages = (stored.packages || []).map((p) => ({
      ...p,
      category: p.category || "Other",
      team: p.team || [],
      deliverables: p.deliverables || [],
      notes: p.notes || "",
    }));
    const services = stored.services || [];
    const merge = (base: string[], saved: string[] | undefined, used: string[]) => [
      ...new Set([...base, ...(saved || []), ...used].filter(Boolean)),
    ];
    const categories = {
      services: merge(DEFAULT_SERVICE_CATEGORIES, stored.categories?.services, services.map((s) => s.category)),
      packages: merge(DEFAULT_PACKAGE_CATEGORIES, stored.categories?.packages, packages.map((p) => p.category)),
    };
    return {
      ...empty(),
      ...stored,
      categories,
      services,
      packages,
      quotes,
      bookings,
      settings: { ...empty().settings, ...settings },
    };
  } catch {
    return empty();
  }
}

export function savePlatform(data: Platform) {
  localStorage.setItem(key(), JSON.stringify(data));
  window.dispatchEvent(new Event("frameflow:platform"));
  schedulePush();
}

// localStorage stays the fast working copy; the Django backend is the source of truth across sessions and devices.
// Nothing is pushed until this login session has loaded (or created) the server copy, so an empty device never wipes it.
let syncedToken: string | null = null;
let pushTimer: ReturnType<typeof setTimeout> | undefined;
let pushing = false;
let pushAgain = false;

function schedulePush(delay = 600) {
  if (typeof window === "undefined") return;
  const token = getAuthToken();
  if (!token || token !== syncedToken) return;
  clearTimeout(pushTimer);
  pushTimer = setTimeout(() => void pushPlatform(token), delay);
}

async function pushPlatform(token: string) {
  if (pushing) {
    pushAgain = true;
    return;
  }
  pushing = true;
  try {
    await savePlatformData(getPlatform());
  } catch (error) {
    // Network failures are retried; the server rejecting the data is not.
    if (!(error instanceof ApiError) || error.status === undefined) {
      pushAgain = false;
      schedulePush(10000);
    }
  } finally {
    pushing = false;
    if (pushAgain && getAuthToken() === token) {
      pushAgain = false;
      schedulePush();
    }
  }
}

/** Loads this studio's data from the server into the local copy, or uploads the local copy on the very first sync. */
export async function hydratePlatform(): Promise<void> {
  const token = getAuthToken();
  if (typeof window === "undefined" || !token || syncedToken === token) return;
  try {
    const remote = await fetchPlatformData<Partial<Platform>>();
    if (getAuthToken() !== token) return;
    if (remote.initialized) {
      localStorage.setItem(key(), JSON.stringify(remote.data));
      syncedToken = token;
      window.dispatchEvent(new Event("frameflow:platform"));
    } else {
      syncedToken = token;
      await savePlatformData(getPlatform());
    }
  } catch {
    // Offline or server error: keep working from the local copy and try again on the next load.
  }
}

export function shootDays(start: string, end: string): string[] {
  if (!start) return [];
  const days: string[] = [];
  const cursor = new Date(`${start}T12:00:00`);
  const last = new Date(`${end || start}T12:00:00`);
  for (let i = 0; i < 62 && cursor <= last; i++) {
    days.push(
      `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}-${String(cursor.getDate()).padStart(2, "0")}`,
    );
    cursor.setDate(cursor.getDate() + 1);
  }
  return days;
}

export const money = (value: number) =>
  `₹${(Number(value) || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;
const num = (n: unknown) => (Number.isFinite(Number(n)) ? Number(n) : 0);

export const packageTotal = (p: Pick<QuotePackage, "price">) => round2(num(p.price));

export type QuoteTotals = { subtotal: number; discount: number; total: number; balance: number };
/** Single source of truth for the amounts on a multi-package quotation (mirrored on the server). */
export function calcTotals(input: {
  packages: QuotePackage[];
  discount?: number | undefined;
  advance?: number | undefined;
}): QuoteTotals {
  const subtotal = round2(
    input.packages.reduce((sum, p) => sum + (p.countInTotal ? packageTotal(p) : 0), 0),
  );
  const discount = round2(Math.min(Math.max(0, num(input.discount)), subtotal));
  const total = round2(subtotal - discount);
  return { subtotal, discount, total, balance: round2(total - num(input.advance)) };
}
const legacySubtotal = (q: Quote) => q.items.reduce((sum, item) => sum + (Number(item.price) || 0), 0);
export const quoteTotals = (q: Quote): QuoteTotals => {
  if (q.packages) return calcTotals({ ...q, packages: q.packages });
  const subtotal = legacySubtotal(q);
  const discount = Number(q.discount) || 0;
  const total = Math.max(0, subtotal - discount);
  return { subtotal, discount, total, balance: total - (Number(q.advance) || 0) };
};
export const quoteSubtotal = (q: Quote) => quoteTotals(q).subtotal;
export const quoteTotal = (q: Quote) => quoteTotals(q).total;
export const bookingPaid = (data: Platform, bookingId: string) =>
  data.payments
    .filter((p) => p.bookingId === bookingId)
    .reduce((sum, p) => sum + Number(p.amount), 0);
export const assignmentPaid = (data: Platform, assignmentId: string) =>
  data.teamPayments
    .filter((p) => p.assignmentId === assignmentId)
    .reduce((sum, p) => sum + Number(p.amount), 0);

export const assistPaid = (job: AssistJob) =>
  job.payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
export const assistBalance = (job: AssistJob) => Math.max(0, (Number(job.fee) || 0) - assistPaid(job));
export type AssistPayStatus = "Unpaid" | "Partially paid" | "Paid" | "Overdue";
export function assistPayStatus(job: AssistJob, todayStr: string): AssistPayStatus {
  const balance = assistBalance(job);
  if (balance <= 0) return "Paid";
  if (job.dueDate && job.dueDate < todayStr) return "Overdue";
  return assistPaid(job) > 0 ? "Partially paid" : "Unpaid";
}

export function memberStats(data: Platform, memberId: string, range?: { from?: string; to?: string }) {
  const filtered = !!(range?.from || range?.to);
  const rows = data.bookings
    .flatMap((booking) =>
      booking.assignments
        .filter((a) => a.memberId === memberId)
        .map((assignment) => {
          const fee = Number(assignment.fee) || 0;
          const paid = assignmentPaid(data, assignment.id);
          return { booking, assignment, fee, paid, balance: Math.max(0, fee - paid) };
        }),
    )
    .filter(
      (r) =>
        (!range?.from || r.assignment.date >= range.from) &&
        (!range?.to || r.assignment.date <= range.to),
    )
    .sort((x, y) => x.assignment.date.localeCompare(y.assignment.date));
  const payments = data.teamPayments
    .filter((p) => p.memberId === memberId)
    .sort((x, y) => y.date.localeCompare(x.date));
  // Payments whose assignment was later removed stay on record as unallocated credit.
  const known = new Set(data.bookings.flatMap((b) => b.assignments.map((a) => a.id)));
  const credit = filtered
    ? 0
    : payments.filter((p) => !known.has(p.assignmentId)).reduce((sum, p) => sum + Number(p.amount), 0);
  const total = rows.reduce((sum, r) => sum + r.fee, 0);
  const paid = rows.reduce((sum, r) => sum + r.paid, 0) + credit;
  const due = rows.reduce((sum, r) => sum + r.balance, 0);
  return {
    rows,
    payments,
    total,
    paid,
    remaining: Math.max(0, due - credit),
    shoots: new Set(rows.map((r) => r.booking.id)).size,
    days: rows.length,
  };
}

export const formatDate = (date: string) =>
  date
    ? new Date(`${date}T12:00:00`).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "—";

const STARTER_SERVICES: [string, string, number][] = [
  ["Traditional photographer", "Photography", 15000],
  ["Candid photographer", "Photography", 20000],
  ["Traditional videographer", "Video", 15000],
  ["Cinematic videographer", "Video", 20000],
  ["Drone pilot", "Add-on", 5000],
  ["Assistant", "Add-on", 3000],
  ["Album (25 pages) with mini book & calendar", "Deliverable", 12000],
];

type StarterPackage = Pick<Package, "name" | "category" | "team" | "deliverables" | "notes" | "price">;
export const STARTER_PACKAGES: StarterPackage[] = [
  {
    name: "Wedding Bronze",
    category: "Wedding",
    team: ["1 Traditional Photographer", "1 Traditional Videographer"],
    deliverables: [
      "Full traditional video edit",
      "25 page album with mini book & calendar",
      "All couple photos edited",
      "All raw data in 32 GB pendrive",
    ],
    notes: "",
    price: 35000,
  },
  {
    name: "Wedding Silver",
    category: "Wedding",
    team: ["1 Traditional Photographer", "1 Candid Photographer", "1 Cinematic Videographer", "1 Assistant"],
    deliverables: [
      "3.30–4 min full video edit",
      "1.30 min wedding teaser/reel",
      "25 page album with mini book & calendar",
      "All couple photos edited",
      "All raw data in 32 GB pendrive",
    ],
    notes: "Additional drone pilot: ₹5,000",
    price: 50000,
  },
  {
    name: "Wedding Gold",
    category: "Wedding",
    team: [
      "1 Traditional Photographer",
      "1 Traditional Videographer",
      "1 Cinematic Videographer",
      "1 Candid Photographer",
      "1 Drone Pilot",
    ],
    deliverables: [
      "3.30–4 min full cinematic highlight video",
      "1.30–2 min teaser / 1 reel",
      "Full traditional video edit",
      "30 page album with mini book, calendar and box bag",
      "All couple photos edited",
      "All raw data in 64 GB pendrive",
    ],
    notes: "12x18 frame gift from us",
    price: 85000,
  },
  {
    name: "Prewedding",
    category: "Pre-wedding",
    team: ["1 Photographer", "1 Videographer", "1 Drone Pilot", "1 Assistant"],
    deliverables: [
      "3.30–4 min full cinematic highlight video",
      "1.30–2 min teaser / reels",
      "50–60 couple photos edited",
      "All raw data in 32 GB pendrive",
    ],
    notes: "",
    price: 0,
  },
];

export function addStarterServices(data: Platform): Platform {
  const services = data.services.length
    ? data.services
    : STARTER_SERVICES.map(([name, category, price]) => ({
        id: newId(),
        name,
        category,
        description: "",
        price,
        active: true,
      }));
  const packages = data.packages.length
    ? data.packages
    : STARTER_PACKAGES.map((p) => ({ ...p, id: newId(), description: "", serviceIds: [], active: true }));
  return { ...data, services, packages };
}

export const blankPackageDetails = (): PackageDetails => ({
  name: "",
  category: "",
  team: [],
  deliverables: [],
  notes: "",
});
export const packageDetailsFrom = (p: Package): PackageDetails => ({
  name: p.name,
  category: p.category,
  team: [...p.team],
  deliverables: [...p.deliverables],
  notes: p.notes,
});

const parseTeamLine = (line: string): QuoteTeamLine => {
  const m = line.trim().match(/^(\d+)\s*[x×]?\s+(.*)$/i);
  return m ? { qty: Number(m[1]), role: m[2]!.trim() } : { qty: 1, role: line.trim() };
};
export const blankQuotePackage = (): QuotePackage => ({
  id: newId(),
  sourceId: "",
  title: "Custom package",
  price: 0,
  countInTotal: true,
  team: [],
  materials: [],
  gift: "",
});
/** Deep copy of a catalogue package for a quotation. Later catalogue edits never reach it. */
export const quotePackageFrom = (p: Package): QuotePackage => ({
  id: newId(),
  sourceId: p.id,
  title: p.name,
  price: p.price,
  countInTotal: true,
  team: p.team.map(parseTeamLine),
  materials: [...p.deliverables],
  gift: p.notes,
});
export const duplicateQuotePackage = (p: QuotePackage): QuotePackage => ({
  ...p,
  id: newId(),
  title: `${p.title} (copy)`,
  team: p.team.map((t) => ({ ...t })),
  materials: [...p.materials],
});
/** Packages of a quotation; quotations saved before multi-package support are converted on the fly. */
export function quotePackagesOf(q: Quote): QuotePackage[] {
  if (q.packages) return q.packages;
  if (!q.items.length && !q.packageDetails) return [];
  const d = q.packageDetails;
  return [
    {
      ...blankQuotePackage(),
      sourceId: q.packageId,
      title: d?.name || q.items[0]?.name || "Package",
      // All priced lines of the old quotation become the one package price.
      price: q.items.reduce((sum, item) => sum + num(item.price), 0),
      team: (d?.team || []).map(parseTeamLine),
      materials: [...(d?.deliverables || [])],
      gift: d?.notes || "",
    },
  ];
}
/** Flat priced lines (counted packages only) for invoices and the public page. */
export const itemsFromPackages = (packages: QuotePackage[]) =>
  packages.filter((p) => p.countInTotal).map((p) => ({ name: p.title, price: num(p.price) }));

export type QuoteValidation = {
  clientName?: string;
  phone?: string;
  date?: string;
  venue?: string;
  packages?: string;
  discount?: string;
  advance?: string;
  /** Per-package problems, keyed `title:<id>`, `price:<id>` and `team:<id>`. */
  [key: string]: string | undefined;
};
/** Field-level problems; an empty object means the quotation can be saved. */
export function validateQuote(input: {
  clientName: string;
  phone: string;
  date: string;
  venue: string;
  packages: QuotePackage[];
  discount?: number | undefined;
  advance?: number | undefined;
}): QuoteValidation {
  const e: QuoteValidation = {};
  if (!input.clientName.trim()) e.clientName = "Enter the client name";
  const digits = input.phone.replace(/\D/g, "");
  if (!input.phone.trim()) e.phone = "Enter a phone number";
  else if (digits.length < 10 || digits.length > 13) e.phone = "Enter a valid phone number";
  if (!input.date) e.date = "Pick the event date";
  if (!input.venue.trim()) e.venue = "Enter the venue";
  if (!input.packages.length) e.packages = "Add at least one package";
  input.packages.forEach((p) => {
    if (!p.title.trim()) e[`title:${p.id}`] = "Package title is required";
    if (num(p.price) < 0) e[`price:${p.id}`] = "Price cannot be negative";
    if (p.team.some((t) => !t.role.trim() || num(t.qty) < 1))
      e[`team:${p.id}`] = "Every team row needs a role and a quantity of 1 or more";
  });
  const discount = num(input.discount);
  if (discount < 0) e.discount = "Discount cannot be negative";
  else if (discount > calcTotals(input).subtotal) e.discount = "Discount cannot exceed the subtotal";
  if (num(input.advance) < 0) e.advance = "Advance cannot be negative";
  return e;
}

const cleanPackage = (p: QuotePackage): QuotePackage => ({
  id: p.id,
  sourceId: p.sourceId,
  countInTotal: p.countInTotal,
  title: p.title.trim(),
  price: Math.max(0, num(p.price)),
  team: p.team.map((t) => ({ qty: Math.max(1, Math.floor(num(t.qty))), role: t.role.trim() })).filter((t) => t.role),
  materials: p.materials.map((m) => m.trim()).filter(Boolean),
  gift: p.gift.trim(),
});
/** Cleans the packages and recomputes every derived amount, ignoring whatever totals the caller held. */
export function finalizeQuote(q: Quote): Quote {
  const packages = (q.packages || []).map(cleanPackage);
  return {
    ...q,
    packages,
    items: itemsFromPackages(packages),
    discount: calcTotals({ packages, discount: q.discount }).discount,
  };
}
export const copyQuotePackages = (packages: QuotePackage[]): QuotePackage[] =>
  packages.map((p) => ({
    id: p.id,
    sourceId: p.sourceId,
    title: p.title,
    price: p.price,
    countInTotal: p.countInTotal,
    gift: p.gift,
    team: p.team.map((t) => ({ ...t })),
    materials: [...p.materials],
  }));
