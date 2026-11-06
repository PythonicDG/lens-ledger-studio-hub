import { Children, cloneElement, isValidElement, useEffect, useState, type FormEvent, type ReactElement, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  ArrowRight,
  Bell,
  CalendarDays,
  Camera,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  Download,
  MessageCircle,
  Handshake,
  FileText,
  LayoutDashboard,
  Menu,
  Plus,
  Search,
  Settings,
  Trash2,
  Users,
  Wallet,
  X,
} from "lucide-react";
import {
  emailDocument,
  getAuthToken,
  listSharedQuotes,
  logoutAccount,
  publishQuote,
  updateStudio,
  whatsappQuotation,
} from "@/lib/auth";
import { getStudio, saveStudio } from "@/lib/flow";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { buildQuotationFor } from "@/lib/quotation-pdf";
import { QuotationPdfSettings } from "@/components/quotation-pdf-settings";
import {
  addStarterServices,
  assignmentPaid,
  blankQuotePackage,
  calcTotals,
  copyQuotePackages,
  duplicateQuotePackage,
  finalizeQuote,
  packageDetailsFrom,
  packageTotal,
  quotePackageFrom,
  quotePackagesOf,
  quoteTotals,
  validateQuote,
  assistBalance,
  assistPaid,
  assistPayStatus,
  bookingPaid,
  formatDate,
  getPlatform,
  hydratePlatform,
  memberStats,
  money,
  newId,
  quoteSubtotal,
  quoteTotal,
  savePlatform,
  type AssistJob,
  type Booking,
  type Client,
  type Package,
  type PackageDetails,
  type Platform,
  type Quote,
  type QuotePackage,
  type QuoteValidation,
  type Service,
  type TeamAssignment,
  type TeamMember,
  type TeamPayment,
} from "@/lib/platform";

type Section =
  | "dashboard"
  | "clients"
  | "services"
  | "packages"
  | "quotations"
  | "bookings"
  | "calendar"
  | "payments"
  | "assists"
  | "team"
  | "studio"
  | "settings";
const sections: { id: Section; label: string; icon: typeof LayoutDashboard; group: string }[] = [
  { id: "dashboard", label: "Overview", icon: LayoutDashboard, group: "WORKSPACE" },
  { id: "clients", label: "Clients", icon: Users, group: "WORKSPACE" },
  { id: "quotations", label: "Quotations", icon: FileText, group: "WORKSPACE" },
  { id: "bookings", label: "Bookings & shoots", icon: Camera, group: "OPERATIONS" },
  { id: "calendar", label: "Calendar", icon: CalendarDays, group: "OPERATIONS" },
  { id: "payments", label: "Payments", icon: Wallet, group: "OPERATIONS" },
  { id: "assists", label: "Assist log", icon: Handshake, group: "OPERATIONS" },
  { id: "services", label: "Services", icon: Plus, group: "CATALOGUE" },
  { id: "packages", label: "Packages", icon: FileText, group: "CATALOGUE" },
  { id: "team", label: "Team", icon: Users, group: "STUDIO" },
  { id: "studio", label: "Studio profile", icon: Camera, group: "STUDIO" },
  { id: "settings", label: "Settings", icon: Settings, group: "STUDIO" },
];
const title: Record<Section, string> = {
  dashboard: "Studio overview",
  clients: "Clients",
  services: "Services",
  packages: "Packages",
  quotations: "Quotations",
  bookings: "Bookings & shoots",
  calendar: "Shoot calendar",
  payments: "Payments",
  assists: "Assist log",
  team: "Team",
  studio: "Studio profile",
  settings: "General settings",
};
const subtitle: Record<Section, string> = {
  dashboard: "A clear view of what needs your attention.",
  clients: "The people behind every project.",
  services: "Build the foundation for accurate quotations.",
  packages: "Bundle services into easy choices for clients.",
  quotations: "Price, share and close your work.",
  bookings: "Turn confirmed work into a smooth shoot.",
  calendar: "See your upcoming commitments.",
  payments: "Know what has arrived and what is due.",
  assists: "Shoots you did for other photographers: fees, payments and what is still owed.",
  team: "The people who make each shoot happen.",
  studio: "Your brand and business details.",
  settings: "Defaults for documents and billing.",
};
const today = () => {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};
const fieldClass =
  "w-full rounded-xl border border-border bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-olive focus:ring-2 focus:ring-olive/10";
const btn =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-foreground px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-olive disabled:cursor-not-allowed disabled:opacity-40";
const secondary =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-white px-4 py-2.5 text-sm font-medium transition hover:border-olive hover:text-olive";
const tableAction =
  "inline-flex min-h-9 items-center justify-center rounded-lg border border-olive/50 bg-olive-soft/40 px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:border-olive hover:bg-olive hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-olive focus-visible:ring-offset-2 active:bg-foreground";
const card = "rounded-2xl border border-border/80 bg-white shadow-[0_5px_30px_rgba(30,34,25,.035)]";
const link = (s: Section) => (s === "dashboard" ? "/welcome" : `/app/${s}`);

function Label({ children }: { children: ReactNode }) {
  return <span className="mb-1.5 block text-xs font-semibold text-foreground/75">{children}</span>;
}
function Input({
  label,
  error,
  ...props
}: { label: string; error?: string | undefined } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <Label>{label}</Label>
      <input
        className={`${fieldClass} ${error ? "border-rose-500" : ""}`}
        step={props.type === "number" ? "any" : undefined}
        aria-invalid={error ? true : undefined}
        {...props}
      />
      {error && <span className="mt-1 block text-[11px] font-medium text-rose-600">{error}</span>}
    </label>
  );
}
function Select({
  label,
  children,
  ...props
}: { label: string; children: ReactNode } & React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <label className="block">
      <Label>{label}</Label>
      <select className={fieldClass} {...props}>
        {children}
      </select>
    </label>
  );
}
function Textarea({
  label,
  ...props
}: { label: string } & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <label className="block">
      <Label>{label}</Label>
      <textarea className={`${fieldClass} min-h-24 resize-y`} {...props} />
    </label>
  );
}
function Empty({ title, body, action }: { title: string; body: string; action?: ReactNode }) {
  return (
    <div className={`${card} flex flex-col items-center px-5 py-16 text-center`}>
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-olive-soft text-olive">
        <Camera size={22} />
      </div>
      <h3 className="text-2xl">{title}</h3>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">{body}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
function Badge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "green" | "amber" | "red" | "blue";
}) {
  const styles = {
    neutral: "bg-stone-100 text-stone-600",
    green: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-700",
    red: "bg-rose-50 text-rose-700",
    blue: "bg-sky-50 text-sky-700",
  };
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${styles[tone]}`}
    >
      {children}
    </span>
  );
}
function Modal({
  title: heading,
  children,
  onClose,
  wide = false,
  xl = false,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  wide?: boolean;
  xl?: boolean;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink/55 px-2 py-3 backdrop-blur-[2px] sm:px-4 sm:py-12"
      onMouseDown={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={heading}
        className={`w-full ${xl ? "max-w-5xl" : wide ? "max-w-3xl" : "max-w-xl"} rounded-2xl bg-background p-4 shadow-2xl sm:p-8`}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <p className="eyebrow text-olive">FRAMEFLOW</p>
            <h2 className="mt-1 text-2xl">{heading}</h2>
          </div>
          <button className="rounded-lg p-2 hover:bg-muted" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
function FormActions({ onCancel, label = "Save" }: { onCancel: () => void; label?: string }) {
  return (
    <div className="mt-7 flex flex-wrap justify-end gap-2">
      <button type="button" className={secondary} onClick={onCancel}>
        Cancel
      </button>
      <button className={btn} type="submit">
        {label}
      </button>
    </div>
  );
}
function HeadAction({
  children,
  onClick,
  disabled,
}: {
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button className={btn} onClick={onClick} disabled={disabled}>
      <Plus size={16} />
      {children}
    </button>
  );
}
function Table({ heads, children, filterKey }: { heads: string[]; children: ReactNode; filterKey?: string }) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const allRows = Children.toArray(children);
  const pageCount = Math.max(1, Math.ceil(allRows.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const start = (currentPage - 1) * pageSize;
  useEffect(() => setPage(1), [filterKey]);
  useEffect(() => setPage((value) => Math.min(value, pageCount)), [pageCount]);
  const rows = Children.map(allRows.slice(start, start + pageSize), (row) => {
    if (!isValidElement<{ children?: ReactNode }>(row)) return row;
    const cells = Children.map(row.props.children, (cell, index) =>
      isValidElement(cell)
        ? cloneElement(cell as ReactElement<{ label?: string }>, { label: heads[index] || "" })
        : cell,
    );
    return cloneElement(row, { children: cells });
  });
  return (
    <div className={`${card} responsive-table overflow-x-auto`}>
      <table className="w-full min-w-[650px] text-left text-sm">
        <thead className="border-b border-border bg-[#faf9f5] text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          <tr>
            {heads.map((h) => (
              <th key={h} className="px-5 py-4">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border/70">{rows}</tbody>
      </table>
      {allRows.length === 0 && (
        <p className="px-5 py-10 text-center text-sm text-muted-foreground">No matching records found.</p>
      )}
      <div className="flex flex-col gap-3 border-t border-border px-4 py-4 text-sm sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div className="flex flex-wrap items-center gap-3 text-muted-foreground">
          <span aria-live="polite">
            {allRows.length ? `${start + 1}–${Math.min(start + pageSize, allRows.length)} of ${allRows.length}` : "0 records"}
          </span>
          <label className="flex items-center gap-2">
            Rows per page
            <select
              aria-label="Rows per page"
              className="rounded-lg border border-border bg-white px-2 py-1 text-sm text-foreground"
              value={pageSize}
              onChange={(event) => {
                setPageSize(Number(event.target.value));
                setPage(1);
              }}
            >
              {[10, 25, 50].map((size) => <option key={size} value={size}>{size}</option>)}
            </select>
          </label>
        </div>
        <nav className="flex items-center gap-2" aria-label="Table pagination">
          <button className={secondary} disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)} aria-label="Previous page">
            <ChevronLeft size={16} />
          </button>
          <span className="min-w-20 text-center text-xs font-medium" aria-live="polite">Page {currentPage} of {pageCount}</span>
          <button className={secondary} disabled={currentPage === pageCount} onClick={() => setPage(currentPage + 1)} aria-label="Next page">
            <ChevronRight size={16} />
          </button>
        </nav>
      </div>
    </div>
  );
}
function Td({ children, className = "", label }: { children: ReactNode; className?: string; label?: string }) {
  return <td data-label={label} className={`px-5 py-4 ${className}`}>{children}</td>;
}

export function PlatformApp({ section = "dashboard" }: { section?: string }) {
  const nav = useNavigate();
  const current = sections.some((s) => s.id === section) ? (section as Section) : "dashboard";
  useEffect(() => setCategoryFilter("All"), [current]);
  const [data, setData] = useState<Platform>(() => getPlatform());
  const [studio, setStudio] = useState(() => getStudio());
  const [modal, setModal] = useState("");
  const [selected, setSelected] = useState("");
  const [mobileNav, setMobileNav] = useState(false);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [calendarMonth, setCalendarMonth] = useState(() => new Date());
  useEffect(() => {
    if (!getAuthToken()) nav({ to: "/login" });
    else if (!getStudio().studioName) nav({ to: "/setup" });
    else if (!getStudio().trialStartedAt) nav({ to: "/trial" });
  }, [nav]);
  useEffect(() => {
    const refresh = () => setData(getPlatform());
    window.addEventListener("frameflow:platform", refresh);
    return () => window.removeEventListener("frameflow:platform", refresh);
  }, []);
  useEffect(() => {
    void hydratePlatform();
  }, []);
  useEffect(() => {
    if (!getAuthToken()) return;
    const refreshQuotes = () => listSharedQuotes()
      .then((shared) => {
        const currentData = getPlatform();
        let changed = false;
        const quotes = currentData.quotes.map((q) => {
          const remote = shared.find((x) => x.local_id === q.id);
          if (remote && (remote.status !== q.status || remote.feedback !== (q.feedback || "") || remote.version !== (q.version || 1))) {
            changed = true;
            return { ...q, status: remote.status, feedback: remote.feedback, version: remote.version };
          }
          return q;
        });
        if (changed) savePlatform({ ...currentData, quotes });
      })
      .catch(() => {});
    void refreshQuotes();
    window.addEventListener("focus", refreshQuotes);
    const quoteRefresh = window.setInterval(refreshQuotes, 30000);
    return () => {
      window.removeEventListener("focus", refreshQuotes);
      window.clearInterval(quoteRefresh);
    };
  }, []);
  const update = (next: Platform) => {
    setData(next);
    savePlatform(next);
  };
  const client = (id: string) => data.clients.find((c) => c.id === id);
  const quote = (id: string) => data.quotes.find((q) => q.id === id);
  const reviseQuote = (source: Quote) => {
    const rootId = source.rootId || source.id;
    const versions = data.quotes.filter((q) => (q.rootId || q.id) === rootId);
    if (versions.some((q) => q.status === "Draft" && q.id !== source.id)) {
      toast.error("Finish the existing draft revision first.");
      return;
    }
    const revision: Quote = {
      ...source,
      id: newId(),
      rootId,
      version: Math.max(...versions.map((q) => q.version || 1)) + 1,
      items: source.items.map((item) => ({ ...item })),
      packages: source.packages && copyQuotePackages(source.packages),
      packageDetails: source.packageDetails && {
        ...source.packageDetails,
        team: [...source.packageDetails.team],
        deliverables: [...source.packageDetails.deliverables],
      },
      status: "Draft",
      feedback: "",
      createdAt: new Date().toISOString(),
    };
    update({ ...data, quotes: [...data.quotes, revision] });
    open("quote", revision.id);
  };
  const open = (name: string, id = "") => {
    setSelected(id);
    setModal(name);
  };
  const close = () => {
    setModal("");
    setSelected("");
  };
  const filtered = (s: string) => s.toLowerCase().includes(search.toLowerCase());
  const acceptedQuotes = data.quotes.filter((q) => q.status === "Accepted");
  const totalBooked = data.bookings.reduce((sum, b) => {
    const q = data.quotes.find((x) => x.id === b.quoteId);
    return sum + (q ? quoteTotal(q) : 0);
  }, 0);
  const received = data.payments.reduce((sum, p) => sum + Number(p.amount), 0);
  const pending = Math.max(0, totalBooked - received);
  const upcoming = [...data.bookings]
    .filter((b) => b.date >= today())
    .sort((a, b) => a.date.localeCompare(b.date));
  const attention = [
    ...data.quotes.filter((q) => q.status === "Changes requested").map((q) => ({
      id: q.id,
      label: `${client(q.clientId)?.name || "Client"} requested changes`,
      detail: `Quotation ${q.number} needs a revision`,
      action: "quotePreview",
      category: "Quote",
      tone: "amber" as const,
    })),
    ...data.quotes.filter((q) => q.status === "Draft").map((q) => ({
      id: q.id,
      label: `Finish quotation ${q.number}`,
      detail: client(q.clientId)?.name || q.event || "Draft quotation",
      action: "quote",
      category: "Quote",
      tone: "neutral" as const,
    })),
    ...acceptedQuotes.filter((q) => !data.bookings.some((b) => b.quoteId === q.id)).map((q) => ({
      id: q.id,
      label: `Book ${q.event || "accepted work"}`,
      detail: `${client(q.clientId)?.name || "Client"} accepted quotation ${q.number}`,
      action: "booking",
      category: "Booking",
      tone: "green" as const,
    })),
  ];
  const outstandingBookings = data.bookings.map((b) => {
    const bookingQuote = quote(b.quoteId);
    const total = bookingQuote ? quoteTotal(bookingQuote) : 0;
    return { booking: b, due: Math.max(0, total - bookingPaid(data, b.id)) };
  }).filter((item) => item.due > 0).sort((a, b) => b.due - a.due);

  return (
    <div className="min-h-screen bg-[#f7f7f2] lg:flex">
      {mobileNav && (
        <button
          aria-label="Close navigation"
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={() => setMobileNav(false)}
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-[min(82vw,300px)] flex-col bg-[#222a23] text-[#edf1e7] transition-transform lg:sticky lg:top-0 lg:h-screen lg:w-[254px] ${mobileNav ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
      >
        <div className="border-b border-white/10 px-6 py-6">
          <button className="absolute right-4 top-5 rounded-lg p-2 text-white/70 hover:bg-white/10 lg:hidden" onClick={() => setMobileNav(false)} aria-label="Close menu"><X size={20} /></button>
          <a href="/welcome" className="font-display text-2xl tracking-tight">
            Frame<span className="italic text-[#a5c39e]">flow</span>
            <span className="ml-1 text-[#d5a76b]">.</span>
          </a>
          <p className="mt-1 text-[10px] uppercase tracking-[.2em] text-white/40">
            STUDIO WORKSPACE
          </p>
        </div>
        <nav className="flex-1 overflow-y-auto px-3 py-5">
          {["WORKSPACE", "OPERATIONS", "CATALOGUE", "STUDIO"].map((group) => (
            <div key={group} className="mb-5">
              <p className="px-3 pb-2 text-[10px] font-semibold tracking-[.18em] text-white/35">
                {group}
              </p>
              {sections
                .filter((s) => s.group === group)
                .map((s) => {
                  const Icon = s.icon;
                  return (
                    <a
                      key={s.id}
                      href={link(s.id)}
                      className={`mb-0.5 flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] transition ${current === s.id ? "bg-[#d9e5d3] font-semibold text-[#26352a]" : "text-white/65 hover:bg-white/8 hover:text-white"}`}
                    >
                      <Icon size={17} strokeWidth={1.8} />
                      {s.label}
                    </a>
                  );
                })}
            </div>
          ))}
        </nav>
        <div className="border-t border-white/10 p-4">
          <div className="flex items-center gap-3 rounded-xl bg-white/7 p-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#c5d5b9] text-sm font-bold text-[#233026]">
              {(studio.studioName || "S").slice(0, 1).toUpperCase()}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-xs font-semibold">
                {studio.studioName || "Your studio"}
              </span>
              <span className="block text-[11px] text-white/45">Studio account</span>
            </span>
            <CircleHelp size={15} className="text-white/35" />
          </div>
        </div>
      </aside>
      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-[#e7e9e1] bg-[#fafbf8]/95 px-3 backdrop-blur sm:h-[74px] sm:px-8">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <button
              className="rounded-lg p-2 lg:hidden"
              onClick={() => setMobileNav(true)}
              aria-label="Open menu"
            >
              <Menu size={21} />
            </button>
            <span className="hidden text-xs text-muted-foreground sm:inline">Workspace</span>
            <ChevronRight size={13} className="hidden text-muted-foreground sm:block" />
            <span className="truncate text-xs font-semibold">{title[current]}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden rounded-full bg-[#e7efe3] px-3 py-1.5 text-[11px] font-semibold text-[#527250] sm:block">
              ● Free trial
            </span>
            <span className="flex h-9 w-9 items-center justify-center rounded-full border border-[#d9dfd3] bg-white text-xs font-bold">
              {(studio.ownerName || "S").slice(0, 1)}
            </span>
          </div>
        </header>
        <main className="mx-auto max-w-[1380px] px-4 pb-20 pt-6 sm:px-8 sm:pt-8 lg:px-10">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="mb-2 text-[10px] font-bold uppercase tracking-[.18em] text-olive">
                {current === "dashboard"
                  ? "GOOD TO SEE YOU"
                  : "FRAMEFLOW / " + current.toUpperCase()}
              </p>
              <h1 className="break-words text-[1.75rem] leading-tight tracking-tight sm:text-4xl">
                {current === "dashboard"
                  ? `Welcome back, ${studio.ownerName?.split(" ")[0] || "there"}.`
                  : title[current]}
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">{subtitle[current]}</p>
            </div>
            {current === "dashboard" && (
              <HeadAction onClick={() => open("quote")}>New quotation</HeadAction>
            )}
            {current === "services" && (
              <div className="flex flex-wrap gap-2">
                <button className={secondary} onClick={() => open("categories-services")}>
                  Categories
                </button>
                <HeadAction onClick={() => open("service")}>Add service</HeadAction>
              </div>
            )}
            {current === "packages" && (
              <div className="flex flex-wrap gap-2">
                <button className={secondary} onClick={() => open("categories-packages")}>
                  Categories
                </button>
                <HeadAction onClick={() => open("package")}>Create package</HeadAction>
              </div>
            )}
            {current === "quotations" && (
              <HeadAction onClick={() => open("quote")}>New quotation</HeadAction>
            )}
            {current === "bookings" && (
              <HeadAction
                onClick={() => open("booking")}
                disabled={!acceptedQuotes.some((q) => !data.bookings.some((b) => b.quoteId === q.id))}
              >
                Create booking
              </HeadAction>
            )}
            {current === "assists" && (
              <HeadAction onClick={() => open("assist")}>Log assisted shoot</HeadAction>
            )}
            {current === "team" && (
              <HeadAction onClick={() => open("team")}>Add team member</HeadAction>
            )}
          </div>

          {current === "dashboard" && (
            <>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {[
                  ["Quotations", data.quotes.length, "Created for clients", FileText],
                  ["Confirmed bookings", data.bookings.length, "Across your studio", CalendarDays],
                  ["Payments received", money(received), "Recorded to date", Wallet],
                  ["Outstanding", money(pending), "On accepted work", FileText],
                ].map(([label, value, note, Icon]) => {
                  return (
                    <div key={String(label)} className={`${card} p-5`}>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-muted-foreground">{String(label)}</span>
                        {(() => { const I = Icon as typeof FileText; return <I size={18} className="text-olive" />; })()}
                      </div>
                      <p className="mt-5 font-display text-3xl">{String(value)}</p>
                      <p className="mt-2 text-xs text-muted-foreground">{String(note)}</p>
                    </div>
                  );
                })}
              </div>
              <div className="mt-6 grid gap-6 xl:grid-cols-[1.15fr_.85fr]">
                <div className={`${card} p-6 sm:p-7`}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="eyebrow text-olive">TO DO</p>
                      <h2 className="mt-2 text-2xl">Needs your attention</h2>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Keep quotations, bookings and deliveries moving.
                      </p>
                    </div>
                    <Badge tone={attention.length ? "amber" : "green"}>{attention.length} open</Badge>
                  </div>
                  {attention.length ? (
                    <div className="mt-5 divide-y divide-border">
                      {attention.slice(0, 4).map((item) => (
                        <button
                          key={`${item.action}-${item.id}`}
                          type="button"
                          onClick={() => open(item.action, item.id)}
                          className="group flex w-full items-center gap-4 py-4 text-left"
                        >
                          <span className="flex-1">
                            <strong className="block text-sm">{item.label}</strong>
                            <span className="mt-1 block text-xs text-muted-foreground">{item.detail}</span>
                          </span>
                          <Badge tone={item.tone}>{item.category}</Badge>
                          <ArrowRight
                            size={17}
                            className="text-muted-foreground transition group-hover:translate-x-1 group-hover:text-olive"
                          />
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-6 rounded-xl bg-[#f8f9f5] p-8 text-center text-sm text-muted-foreground">
                      All caught up. New items will appear here as work progresses.
                    </p>
                  )}
                </div>
                <div className={`${card} p-6 sm:p-7`}>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="eyebrow text-olive">COMING UP</p>
                      <h2 className="mt-2 text-2xl">Your next shoots</h2>
                    </div>
                    <a href={link("calendar")} className="text-xs font-semibold text-olive">
                      View calendar →
                    </a>
                  </div>
                  {upcoming.length ? (
                    <div className="mt-5 divide-y divide-border">
                      {upcoming.slice(0, 4).map((b) => (
                        <div key={b.id} className="flex gap-4 py-4">
                          <span className="flex h-12 w-12 flex-col items-center justify-center rounded-xl bg-olive-soft text-olive">
                            <strong className="text-lg leading-none">
                              {new Date(`${b.date}T12:00:00`).getDate()}
                            </strong>
                            <small className="mt-0.5 text-[9px] uppercase">
                              {new Date(`${b.date}T12:00:00`).toLocaleString("en-IN", { month: "short" })}
                            </small>
                          </span>
                          <span>
                            <strong className="text-sm">{b.event}</strong>
                            <span className="mt-1 block text-xs text-muted-foreground">
                              {client(b.clientId)?.name} · {b.location || "Location to confirm"}
                            </span>
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-8 rounded-xl bg-[#f8f9f5] p-8 text-center text-sm text-muted-foreground">
                      Accepted quotes become bookings here.
                    </p>
                  )}
                </div>
              </div>
              <div className={`${card} mt-6 p-6 sm:p-7`}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="eyebrow text-olive">PAYMENTS</p>
                    <h2 className="mt-2 text-2xl">Outstanding balances</h2>
                  </div>
                  <a href={link("payments")} className="text-xs font-semibold text-olive">View all payments →</a>
                </div>
                {outstandingBookings.length ? <div className="mt-5 divide-y divide-border">
                  {outstandingBookings.slice(0, 3).map(({ booking, due }) => (
                    <div key={booking.id} className="flex flex-wrap items-center justify-between gap-3 py-4">
                      <div>
                        <strong className="block text-sm">{booking.event}</strong>
                        <span className="mt-1 block text-xs text-muted-foreground">{client(booking.clientId)?.name || "Client"} · {formatDate(booking.date)}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <strong className="text-sm">{money(due)} due</strong>
                        <button className={tableAction} onClick={() => open("payment", booking.id)}>Record payment</button>
                      </div>
                    </div>
                  ))}
                </div> : <p className="mt-5 rounded-xl bg-[#f8f9f5] p-6 text-sm text-muted-foreground">No outstanding booking balances.</p>}
              </div>
            </>
          )}

          {current === "services" && (
            <>
              {data.services.length ? (
                <>
                  <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:justify-between sm:gap-4">
                    <input
                      aria-label="Search services"
                      placeholder="Search services..."
                      className={`${fieldClass} max-w-sm`}
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                    <button
                      className={secondary}
                      onClick={() => {
                        update(addStarterServices(data));
                        toast.success("Starter catalogue added");
                      }}
                      disabled={!!data.services.length && !!data.packages.length}
                    >
                      Use starter catalogue
                    </button>
                  </div>
                  <CategoryTabs
                    categories={data.categories.services}
                    value={categoryFilter}
                    onChange={setCategoryFilter}
                  />
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {data.services
                      .filter((s) => filtered(s.name))
                      .filter((s) => categoryFilter === "All" || s.category === categoryFilter)
                      .map((s) => (
                        <button
                          key={s.id}
                          onClick={() => open("service", s.id)}
                          className={`${card} p-5 text-left transition hover:border-olive`}
                        >
                          <div className="flex justify-between">
                            <Badge tone="green">{s.category}</Badge>
                            <span className="text-xs text-muted-foreground">
                              {s.active ? "Active" : "Archived"}
                            </span>
                          </div>
                          <h3 className="mt-5 text-xl">{s.name}</h3>
                          <p className="mt-1 min-h-8 text-xs text-muted-foreground">
                            {s.description || "Available for your next quotation"}
                          </p>
                          <div className="mt-4 border-t border-border pt-4 text-sm font-semibold">
                            From {money(s.price)}
                          </div>
                        </button>
                      ))}
                  </div>
                </>
              ) : (
                <Empty
                  title="Start with your services"
                  body="Add the work you offer, then combine it into packages. You can also load a starter catalogue with common photography services and wedding packages."
                  action={
                    <div className="flex flex-wrap justify-center gap-2">
                      <button className={btn} onClick={() => open("service")}>
                        Add a service
                      </button>
                      <button
                        className={secondary}
                        onClick={() => {
                          update(addStarterServices(data));
                          toast.success("Starter catalogue added");
                        }}
                      >
                        Use starter catalogue
                      </button>
                    </div>
                  }
                />
              )}
            </>
          )}

          {current === "packages" && (
            <>
              {data.packages.length ? (
                <>
                  <CategoryTabs
                    categories={data.categories.packages}
                    value={categoryFilter}
                    onChange={setCategoryFilter}
                  />
                  <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                    {data.packages
                      .filter((p) => categoryFilter === "All" || p.category === categoryFilter)
                      .map((p) => (
                        <div key={p.id} className={`${card} relative flex flex-col p-6`}>
                          <div className="flex items-center justify-between">
                            <Badge tone={p.active ? "green" : "neutral"}>
                              {p.category}
                              {p.active ? "" : " · ARCHIVED"}
                            </Badge>
                            <button
                              onClick={() => open("package", p.id)}
                              className="text-xs font-semibold text-olive hover:underline"
                            >
                              Edit
                            </button>
                          </div>
                          <h3 className="mt-6 text-2xl">{p.name}</h3>
                          {p.description && (
                            <p className="mt-2 text-sm text-muted-foreground">{p.description}</p>
                          )}
                          <p className="mt-4 font-display text-3xl">
                            {p.price ? money(p.price) : "Price on request"}
                          </p>
                          <div className="mt-2 flex-1 border-t border-border pt-1">
                            <PackageDetailsView details={packageDetailsFrom(p)} />
                          </div>
                        </div>
                      ))}
                  </div>
                </>
              ) : (
                <Empty
                  title="Create your first package"
                  body="A package lists the team, the material you deliver and one complete price. Create your own or load the starter catalogue."
                  action={
                    <div className="flex flex-wrap justify-center gap-2">
                      <button className={btn} onClick={() => open("package")}>
                        Create a package
                      </button>
                      <button
                        className={secondary}
                        onClick={() => {
                          update(addStarterServices(data));
                          toast.success("Starter catalogue added");
                        }}
                      >
                        Use starter catalogue
                      </button>
                    </div>
                  }
                />
              )}
            </>
          )}

          {current === "clients" &&
            (data.clients.length ? (
              <>
                <div className="mb-5">
                  <input
                    aria-label="Search clients"
                    placeholder="Search by name, email or phone..."
                    className={`${fieldClass} max-w-sm`}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                <Table heads={["Client", "Contact", "City", "Projects", ""]} filterKey={search}>
                  {data.clients
                    .filter((c) => filtered(`${c.name} ${c.email} ${c.phone}`))
                    .map((c) => (
                      <tr key={c.id}>
                        <Td>
                          <strong>{c.name}</strong>
                        </Td>
                        <Td>
                          <div>{c.email || "—"}</div>
                          <span className="text-xs text-muted-foreground">{c.phone}</span>
                        </Td>
                        <Td>{c.city || "—"}</Td>
                        <Td>{data.bookings.filter((b) => b.clientId === c.id).length}</Td>
                        <Td>
                          <button className={tableAction} onClick={() => open("client", c.id)}>
                            View / edit
                          </button>
                        </Td>
                      </tr>
                    ))}
                </Table>
              </>
            ) : (
              <Empty
                title="Your client book starts here"
                body="Clients are added when you create a quotation."
                action={
                  <button className={btn} onClick={() => open("quote")}>
                    New quotation
                  </button>
                }
              />
            ))}

          {current === "quotations" &&
            (data.quotes.length ? (
              <Table heads={["Quote", "Client & event", "Date", "Total", "Status", "Actions"]}>
                {[...data.quotes].reverse().map((q) => (
                  <tr key={q.id}>
                    <Td>
                      <strong>{q.number} · v{q.version || 1}</strong>
                      <span className="mt-1 block text-xs text-muted-foreground">
                        {formatDate(q.createdAt.slice(0, 10))}
                      </span>
                    </Td>
                    <Td>
                      <strong>{client(q.clientId)?.name}</strong>
                      <span className="mt-1 block text-xs text-muted-foreground">{q.event}</span>
                    </Td>
                    <Td>{formatDate(q.date)}</Td>
                    <Td className="font-semibold">{money(quoteTotal(q))}</Td>
                    <Td>
                      <Badge
                        tone={
                          q.status === "Accepted"
                            ? "green"
                            : q.status === "Rejected"
                              ? "red"
                            : q.status === "Pending" || q.status === "Changes requested"
                                ? "amber"
                                : "neutral"
                        }
                      >
                        {q.status}
                      </Badge>
                    </Td>
                    <Td>
                      <div className="flex flex-wrap gap-3">
                        <button className={tableAction} onClick={() => open("quotePreview", q.id)}>
                          View / PDF
                        </button>
                        {q.status === "Draft" && (
                          <button className={tableAction} onClick={() => open("quote", q.id)}>
                            Edit
                          </button>
                        )}
                        {(q.status === "Pending" || q.status === "Changes requested" || q.status === "Rejected") &&
                          !data.quotes.some((other) => (other.rootId || other.id) === (q.rootId || q.id) && (other.version || 1) > (q.version || 1)) && (
                            <button className={tableAction} onClick={() => reviseQuote(q)}>
                              {q.status === "Rejected" ? "Revise as new version" : "Revise"}
                            </button>
                          )}
                        {q.status === "Accepted" &&
                          !data.bookings.some((b) => b.quoteId === q.id) && (
                            <button className={tableAction} onClick={() => open("booking", q.id)}>
                              Book →
                            </button>
                          )}
                      </div>
                    </Td>
                  </tr>
                ))}
              </Table>
            ) : (
              <Empty
                title="Create a quotation"
                body="Enter client details and add priced services or a package to create your first quotation."
                action={
                  <div className="flex gap-2">
                    <button className={btn} onClick={() => open("quote")}>
                      New quotation
                    </button>
                  </div>
                }
              />
            ))}

          {current === "bookings" &&
            (data.bookings.length ? (
              <Table heads={["Booking", "Shoot date", "Team", "Progress", "Actions"]}>
                {[...data.bookings]
                  .sort((a, b) => a.date.localeCompare(b.date))
                  .map((b) => (
                    <tr key={b.id}>
                      <Td>
                        <strong>{b.event}</strong>
                        <span className="mt-1 block text-xs text-muted-foreground">
                          {client(b.clientId)?.name} · {b.location}
                        </span>
                      </Td>
                      <Td>
                        {formatDate(b.date)}
                        {b.endDate && b.endDate !== b.date ? ` – ${formatDate(b.endDate)}` : ""}
                      </Td>
                      <Td>
                        {b.assignments.length ? (
                          <>
                            {[...new Set(b.assignments.map((a) => a.memberId))]
                              .map((id) => data.team.find((t) => t.id === id)?.name)
                              .filter(Boolean)
                              .join(", ")}
                            <span className="mt-1 block text-xs text-muted-foreground">
                              {b.assignments.length} assigned {b.assignments.length === 1 ? "day" : "days"}
                            </span>
                          </>
                        ) : (
                          <span className="text-muted-foreground">Unassigned</span>
                        )}
                      </Td>
                      <Td>
                        <Badge tone={b.checklist.length >= 4 ? "green" : "amber"}>
                          {b.checklist.length}/4 ready
                        </Badge>
                      </Td>
                      <Td>
                        <button className={tableAction} onClick={() => open("shoot", b.id)}>
                          Manage shoot →
                        </button>
                      </Td>
                    </tr>
                  ))}
              </Table>
            ) : (
              <Empty
                title="Bookings start with an accepted quote"
                body="Once a client accepts, create a booking with the date, services and advance ready to go."
                action={
                  <a className={btn} href={link("quotations")}>
                    View quotations
                  </a>
                }
              />
            ))}

          {current === "calendar" && (
            <div className={`${card} p-5 sm:p-7`}>
              <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="eyebrow text-olive">SHOOT SCHEDULE</p>
                  <h2 className="mt-1 text-2xl">
                    {calendarMonth.toLocaleString("en-IN", { month: "long", year: "numeric" })}
                  </h2>
                </div>
                <div className="flex gap-2">
                  <button
                    className={secondary}
                    aria-label="Previous month"
                    onClick={() =>
                      setCalendarMonth(
                        new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1),
                      )
                    }
                  >
                    <ChevronLeft size={17} />
                  </button>
                  <button
                    className={secondary}
                    aria-label="Next month"
                    onClick={() =>
                      setCalendarMonth(
                        new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1),
                      )
                    }
                  >
                    <ChevronRight size={17} />
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-7 border-l border-t border-border text-center text-[11px] font-semibold text-muted-foreground">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                  <div key={d} className="border-b border-r border-border bg-[#faf9f5] py-3">
                    {d}
                  </div>
                ))}
                {Array.from(
                  {
                    length: new Date(
                      calendarMonth.getFullYear(),
                      calendarMonth.getMonth(),
                      1,
                    ).getDay(),
                  },
                  (_, i) => (
                    <div
                      key={`blank-${i}`}
                      className="min-h-14 border-b border-r border-border bg-[#faf9f5]/50 sm:min-h-24"
                    />
                  ),
                )}
                {Array.from(
                  {
                    length: new Date(
                      calendarMonth.getFullYear(),
                      calendarMonth.getMonth() + 1,
                      0,
                    ).getDate(),
                  },
                  (_, i) => {
                    const day = i + 1;
                    const iso = `${calendarMonth.getFullYear()}-${String(calendarMonth.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                    const shoots = data.bookings.filter(
                      (b) => b.date <= iso && (b.endDate || b.date) >= iso,
                    );
                    return (
                      <div
                        key={day}
                        className="min-h-14 min-w-0 border-b border-r border-border p-0.5 text-left sm:min-h-24 sm:p-2"
                      >
                        <span
                          className={`inline-flex h-6 w-6 items-center justify-center rounded-full ${iso === today() ? "bg-olive text-white" : ""}`}
                        >
                          {day}
                        </span>
                        {shoots.map((b) => (
                          <button
                            key={b.id}
                            onClick={() => open("shoot", b.id)}
                            className="mt-1 block w-full truncate rounded bg-[#e4eee0] px-0.5 py-1 text-left text-[9px] font-semibold text-[#3d6544] sm:px-1.5 sm:text-[10px]"
                          >
                            {b.event}
                          </button>
                        ))}
                      </div>
                    );
                  },
                )}
              </div>
            </div>
          )}

          {current === "payments" && (
            <>
              <div className="mb-6 grid gap-4 md:grid-cols-3">
                {[
                  ["Total booked", totalBooked],
                  ["Received", received],
                  ["Outstanding", pending],
                ].map(([label, value]) => (
                  <div key={String(label)} className={`${card} p-5`}>
                    <p className="text-xs text-muted-foreground">{label}</p>
                    <p className="mt-3 font-display text-3xl">{money(Number(value))}</p>
                  </div>
                ))}
              </div>
              {data.bookings.length ? (
                <Table heads={["Project", "Invoice total", "Received", "Balance", "Actions"]}>
                  {data.bookings.map((b) => {
                    const q = quote(b.quoteId);
                    const total = q ? quoteTotal(q) : 0;
                    const paid = bookingPaid(data, b.id);
                    return (
                      <tr key={b.id}>
                        <Td>
                          <strong>{b.event}</strong>
                          <span className="mt-1 block text-xs text-muted-foreground">
                            {client(b.clientId)?.name}
                          </span>
                        </Td>
                        <Td>{money(total)}</Td>
                        <Td className="text-emerald-700">{money(paid)}</Td>
                        <Td className="font-semibold">{money(Math.max(0, total - paid))}</Td>
                        <Td>
                          <div className="flex flex-wrap gap-3">
                            <button className={tableAction} onClick={() => open("payment", b.id)}>
                              Record payment
                            </button>
                            <button className={tableAction} onClick={() => open("invoice", b.id)}>
                              Invoice / receipt
                            </button>
                          </div>
                        </Td>
                      </tr>
                    );
                  })}
                </Table>
              ) : (
                <Empty
                  title="Payments will show here"
                  body="Record the advance when you book a shoot, then collect the balance and download documents."
                />
              )}
            </>
          )}

          {current === "assists" &&
            (data.assists.length ? (
              <AssistSection data={data} open={open} />
            ) : (
              <Empty
                title="Track the shoots you assist on"
                body="Log shoots you did for other photographers to keep fees, payments received and outstanding balances in one place."
                action={
                  <button className={btn} onClick={() => open("assist")}>
                    Log assisted shoot
                  </button>
                }
              />
            ))}

          {current === "team" &&
            (data.team.length ? (
              <TeamSection data={data} open={open} />
            ) : (
              <Empty
                title="Add your crew"
                body="Create team members to assign to shoots and spot date overlaps."
                action={
                  <button className={btn} onClick={() => open("team")}>
                    Add team member
                  </button>
                }
              />
            ))}

          {current === "studio" && (
            <StudioForm
              studio={studio}
              onSaved={(s) => {
                setStudio(s);
                toast.success("Studio profile updated");
              }}
            />
          )}
          {current === "settings" && (
            <Tabs defaultValue="general">
              <TabsList className="mb-5">
                <TabsTrigger value="general">General</TabsTrigger>
                <TabsTrigger value="pdf">Edit quotation PDF format</TabsTrigger>
              </TabsList>
              <TabsContent value="general">
                <SettingsForm data={data} update={update} />
              </TabsContent>
              <TabsContent value="pdf">
                <div className={`${card} p-6 sm:p-8`}>
                  <QuotationPdfSettings data={data} update={update} />
                </div>
              </TabsContent>
            </Tabs>
          )}
        </main>
      </div>
      {modal === "service" && (
        <ServiceForm
          data={data}
          update={update}
          onClose={close}
          existing={data.services.find((s) => s.id === selected)}
        />
      )}
      {(modal === "categories-services" || modal === "categories-packages") && (
        <CategoryManager
          kind={modal === "categories-services" ? "services" : "packages"}
          data={data}
          update={update}
          onClose={close}
        />
      )}
      {modal === "package" && (
        <PackageForm
          data={data}
          update={update}
          onClose={close}
          existing={data.packages.find((p) => p.id === selected)}
        />
      )}
      {modal === "client" && client(selected) && (
        <ClientForm data={data} update={update} onClose={close} existing={client(selected)!} />
      )}
      {modal === "quote" && (
        <QuoteForm
          data={data}
          update={update}
          onClose={close}
          onCreated={(id) => open("quotePreview", id)}
          existing={data.quotes.find((q) => q.id === selected)}
        />
      )}
      {modal === "quotePreview" && (
        <QuotePreview data={data} update={update} onClose={close} quote={quote(selected)!} onRevise={reviseQuote} />
      )}
      {modal === "booking" && (
        <BookingForm data={data} update={update} onClose={close} selectedQuote={quote(selected)} />
      )}
      {modal === "shoot" && (
        <ShootForm
          data={data}
          update={update}
          onClose={close}
          booking={data.bookings.find((b) => b.id === selected)!}
        />
      )}
      {modal === "payment" && (
        <PaymentForm
          data={data}
          update={update}
          onClose={close}
          booking={data.bookings.find((b) => b.id === selected)!}
        />
      )}
      {modal === "invoice" && (
        <InvoicePreview
          data={data}
          onClose={close}
          booking={data.bookings.find((b) => b.id === selected)!}
        />
      )}
      {modal === "assist" && (
        <AssistForm
          data={data}
          update={update}
          onClose={close}
          existing={data.assists.find((a) => a.id === selected)}
        />
      )}
      {modal === "assistDetail" && data.assists.find((a) => a.id === selected) && (
        <AssistDetail
          data={data}
          update={update}
          job={data.assists.find((a) => a.id === selected)!}
          onClose={close}
          onEdit={() => open("assist", selected)}
        />
      )}
      {modal === "teamDetail" && data.team.find((t) => t.id === selected) && (
        <TeamDetail
          data={data}
          update={update}
          member={data.team.find((t) => t.id === selected)!}
          onClose={close}
          onEdit={() => open("team", selected)}
        />
      )}
      {modal === "team" && (
        <TeamForm
          data={data}
          update={update}
          onClose={close}
          existing={data.team.find((t) => t.id === selected)}
        />
      )}
    </div>
  );
}

function CategoryTabs({
  categories,
  value,
  onChange,
}: {
  categories: string[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="mb-5 flex flex-wrap gap-2" role="tablist" aria-label="Filter by category">
      {["All", ...categories].map((c) => (
        <button
          key={c}
          role="tab"
          aria-selected={value === c}
          onClick={() => onChange(c)}
          className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold transition ${value === c ? "border-foreground bg-foreground text-white" : "border-border bg-white hover:border-olive"}`}
        >
          {c}
        </button>
      ))}
    </div>
  );
}

function LinesEditor({
  label,
  lines,
  onChange,
  placeholder,
  suggestions = [],
}: {
  label: string;
  lines: string[];
  onChange: (lines: string[]) => void;
  placeholder: string;
  suggestions?: string[];
}) {
  const unused = suggestions.filter((x) => !lines.includes(x));
  return (
    <div className="rounded-xl border border-border bg-white p-3">
      <div className="mb-2 flex items-center justify-between">
        <Label>{label}</Label>
        <button
          type="button"
          className="text-xs font-semibold text-olive"
          onClick={() => onChange([...lines, ""])}
        >
          + Add line
        </button>
      </div>
      {lines.map((line, i) => (
        <div key={i} className="mb-2 flex gap-2">
          <input
            aria-label={`${label} ${i + 1}`}
            className={fieldClass}
            placeholder={placeholder}
            value={line}
            onChange={(e) => onChange(lines.map((x, j) => (j === i ? e.target.value : x)))}
          />
          <button
            type="button"
            className="px-2 text-muted-foreground"
            aria-label={`Remove ${label.toLowerCase()} line ${i + 1}`}
            onClick={() => onChange(lines.filter((_, j) => j !== i))}
          >
            <X size={16} />
          </button>
        </div>
      ))}
      {!lines.length && <p className="text-xs text-muted-foreground">Nothing added yet.</p>}
      {!!unused.length && (
        <div className="mt-2 flex flex-wrap gap-2">
          {unused.map((x) => (
            <button
              key={x}
              type="button"
              className="rounded-full border border-border px-2.5 py-1 text-[11px] hover:border-olive"
              onClick={() => onChange([...lines.filter((l) => l.trim()), x])}
            >
              + {x}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
const cleanLines = (lines: string[]) => lines.map((l) => l.trim()).filter(Boolean);

function PackageDetailsView({ details, compact }: { details: PackageDetails; compact?: boolean }) {
  const block = (title: string, lines: string[]) =>
    lines.length ? (
      <div className={compact ? "mt-3" : "mt-5"}>
        <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          {title}
        </p>
        {lines.map((line, i) => (
          <div key={i} className="mb-1.5 flex items-start gap-2 text-sm">
            <Check size={15} className="mt-0.5 shrink-0 text-olive" />
            <span>{line}</span>
          </div>
        ))}
      </div>
    ) : null;
  return (
    <>
      {block("Team", details.team)}
      {block("Material provided by us", details.deliverables)}
      {details.notes && (
        <p className={`${compact ? "mt-3" : "mt-5"} rounded-lg bg-olive-soft/50 px-3 py-2 text-sm`}>
          {details.notes}
        </p>
      )}
    </>
  );
}

function CategoryField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState("");
  const list = options.includes(value) || !value ? options : [...options, value];
  if (adding)
    return (
      <div>
        <Label>{label}</Label>
        <div className="flex gap-2">
          <input
            autoFocus
            aria-label="New category name"
            className={fieldClass}
            placeholder="New category"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
          />
          <button
            type="button"
            className={secondary}
            onClick={() => {
              if (draft.trim()) onChange(draft.trim());
              setAdding(false);
              setDraft("");
            }}
          >
            Add
          </button>
        </div>
      </div>
    );
  return (
    <Select
      label={label}
      value={value}
      onChange={(e) => (e.target.value === "__new" ? setAdding(true) : onChange(e.target.value))}
    >
      {list.map((x) => (
        <option key={x}>{x}</option>
      ))}
      <option value="__new">+ New category…</option>
    </Select>
  );
}

function CategoryManager({
  kind,
  data,
  update,
  onClose,
}: {
  kind: "services" | "packages";
  data: Platform;
  update: (d: Platform) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState("");
  const [names, setNames] = useState<Record<string, string>>({});
  const list = data.categories[kind];
  const itemsIn = (c: string) =>
    (kind === "services" ? data.services : data.packages).filter((x) => x.category === c).length;
  const recategorise = (from: string, to: string) => ({
    services:
      kind === "services"
        ? data.services.map((x) => (x.category === from ? { ...x, category: to } : x))
        : data.services,
    packages:
      kind === "packages"
        ? data.packages.map((x) => (x.category === from ? { ...x, category: to } : x))
        : data.packages,
  });
  const save = (categories: string[], moved = { services: data.services, packages: data.packages }) =>
    update({ ...data, ...moved, categories: { ...data.categories, [kind]: categories } });
  const rename = (from: string) => {
    const to = (names[from] ?? from).trim();
    if (!to || to === from) return;
    if (list.includes(to)) {
      toast.error("That category already exists.");
      return;
    }
    save(
      list.map((c) => (c === from ? to : c)),
      recategorise(from, to),
    );
    setNames({});
    toast.success("Category renamed");
  };
  const remove = (c: string) => {
    save([...new Set([...list.filter((x) => x !== c), "Other"])], recategorise(c, "Other"));
  };
  return (
    <Modal title={`${kind === "services" ? "Service" : "Package"} categories`} onClose={onClose}>
      <div className="space-y-2">
        {list.map((c) => (
          <div key={c} className="flex items-center gap-2">
            <input
              aria-label={`Category ${c}`}
              className={fieldClass}
              value={names[c] ?? c}
              onChange={(e) => setNames({ ...names, [c]: e.target.value })}
              onBlur={() => rename(c)}
            />
            <span className="w-16 shrink-0 text-xs text-muted-foreground">{itemsIn(c)} in use</span>
            <button
              type="button"
              className="px-2 text-muted-foreground hover:text-rose-600"
              aria-label={`Delete category ${c}`}
              onClick={() => remove(c)}
            >
              <Trash2 size={15} />
            </button>
          </div>
        ))}
      </div>
      <p className="mt-3 text-xs text-muted-foreground">
        Deleting a category moves its {kind} to “Other”. Edit a name and click away to rename.
      </p>
      <form
        className="mt-4 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          const name = draft.trim();
          if (!name || list.includes(name)) {
            toast.error(name ? "That category already exists." : "Enter a category name.");
            return;
          }
          save([...list, name]);
          setDraft("");
        }}
      >
        <input
          aria-label="New category"
          className={fieldClass}
          placeholder="New category"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
        />
        <button className={btn}>Add</button>
      </form>
      <div className="mt-5 flex justify-end">
        <button type="button" className={secondary} onClick={onClose}>
          Done
        </button>
      </div>
    </Modal>
  );
}

function ServiceForm({
  data,
  update,
  onClose,
  existing,
}: {
  data: Platform;
  update: (d: Platform) => void;
  onClose: () => void;
  existing?: Service | undefined;
}) {
  const [f, setF] = useState<Service>(
    existing || {
      id: newId(),
      name: "",
      category: data.categories.services[0] || "Photography",
      description: "",
      price: 0,
      active: true,
    },
  );
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!f.name.trim() || f.price < 0) {
      toast.error("Enter a service name and valid price.");
      return;
    }
    update({
      ...data,
      categories: {
        ...data.categories,
        services: [...new Set([...data.categories.services, f.category])],
      },
      services: existing
        ? data.services.map((s) => (s.id === f.id ? f : s))
        : [...data.services, f],
    });
    toast.success(existing ? "Service updated" : "Service added");
    onClose();
  };
  return (
    <Modal title={existing ? "Edit service" : "Add a service"} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <Input
          label="Service name *"
          placeholder="Candid photography"
          value={f.name}
          onChange={(e) => setF({ ...f, name: e.target.value })}
          required
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <CategoryField
            label="Category"
            value={f.category}
            options={data.categories.services}
            onChange={(category) => setF({ ...f, category })}
          />
          <Input
            label="Starting price (₹) *"
            type="number"
            min="0"
            value={f.price}
            onChange={(e) => setF({ ...f, price: Number(e.target.value) })}
            required
          />
        </div>
        <Textarea
          label="Description"
          placeholder="What is included?"
          value={f.description}
          onChange={(e) => setF({ ...f, description: e.target.value })}
        />
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={f.active}
            onChange={(e) => setF({ ...f, active: e.target.checked })}
          />
          Active service
        </label>
        <FormActions onCancel={onClose} label={existing ? "Save service" : "Add service"} />
      </form>
    </Modal>
  );
}
function PackageForm({
  data,
  update,
  onClose,
  existing,
}: {
  data: Platform;
  update: (d: Platform) => void;
  onClose: () => void;
  existing?: Package | undefined;
}) {
  const [f, setF] = useState<Package>(
    existing || {
      id: newId(),
      name: "",
      category: data.categories.packages[0] || "Wedding",
      description: "",
      serviceIds: [],
      team: [],
      deliverables: [],
      notes: "",
      price: 0,
      active: true,
    },
  );
  const submit = (e: FormEvent) => {
    e.preventDefault();
    const team = cleanLines(f.team);
    const deliverables = cleanLines(f.deliverables);
    if (!f.name.trim() || (!team.length && !deliverables.length)) {
      toast.error("Name the package and add the team or deliverables it includes.");
      return;
    }
    if (f.price < 0) {
      toast.error("Enter a valid package price.");
      return;
    }
    const pkg = { ...f, name: f.name.trim(), team, deliverables, notes: f.notes.trim() };
    update({
      ...data,
      categories: {
        ...data.categories,
        packages: [...new Set([...data.categories.packages, pkg.category])],
      },
      packages: existing
        ? data.packages.map((p) => (p.id === pkg.id ? pkg : p))
        : [...data.packages, pkg],
    });
    toast.success(existing ? "Package updated" : "Package created");
    onClose();
  };
  const crewServices = data.services
    .filter((s) => s.active && ["Photography", "Video", "Add-on"].includes(s.category))
    .map((s) => `1 ${s.name}`);
  return (
    <Modal title={existing ? "Edit package" : "Create package"} onClose={onClose} wide>
      <form onSubmit={submit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Package name *"
            placeholder="Wedding Silver"
            value={f.name}
            onChange={(e) => setF({ ...f, name: e.target.value })}
            required
          />
          <CategoryField
            label="Category"
            value={f.category}
            options={data.categories.packages}
            onChange={(category) => setF({ ...f, category })}
          />
        </div>
        <Textarea
          label="Short description"
          placeholder="A complete photo and video package"
          value={f.description}
          onChange={(e) => setF({ ...f, description: e.target.value })}
        />
        <LinesEditor
          label="Team"
          placeholder="1 Candid Photographer"
          lines={f.team}
          suggestions={crewServices}
          onChange={(team) => setF({ ...f, team })}
        />
        <LinesEditor
          label="Material provided by us"
          placeholder="25 page album with mini book & calendar"
          lines={f.deliverables}
          onChange={(deliverables) => setF({ ...f, deliverables })}
        />
        <Textarea
          label="Notes (gifts, add-on prices…)"
          placeholder="Additional drone pilot: ₹5,000"
          value={f.notes}
          onChange={(e) => setF({ ...f, notes: e.target.value })}
        />
        <Input
          label="Complete package price (₹) *"
          type="number"
          min="0"
          value={f.price}
          onChange={(e) => setF({ ...f, price: Number(e.target.value) })}
          required
        />
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={f.active}
            onChange={(e) => setF({ ...f, active: e.target.checked })}
          />
          Active package
        </label>
        <FormActions onCancel={onClose} label={existing ? "Save package" : "Create package"} />
      </form>
    </Modal>
  );
}
function ClientForm({
  data,
  update,
  onClose,
  existing,
}: {
  data: Platform;
  update: (d: Platform) => void;
  onClose: () => void;
  existing: Client;
}) {
  const [f, setF] = useState<Client>(existing);
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!f.name.trim() || (!f.email.trim() && !f.phone.trim())) {
      toast.error("Add a name and at least one contact detail.");
      return;
    }
    update({
      ...data,
      clients: data.clients.map((c) => (c.id === f.id ? f : c)),
    });
    toast.success("Client updated");
    onClose();
  };
  return (
    <Modal title="Client details" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <Input
          label="Client name *"
          value={f.name}
          onChange={(e) => setF({ ...f, name: e.target.value })}
          required
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Email"
            type="email"
            value={f.email}
            onChange={(e) => setF({ ...f, email: e.target.value })}
          />
          <Input
            label="Phone"
            type="tel"
            value={f.phone}
            onChange={(e) => setF({ ...f, phone: e.target.value })}
          />
        </div>
        <Input label="City" value={f.city} onChange={(e) => setF({ ...f, city: e.target.value })} />
        <Textarea
          label="Notes"
          value={f.notes}
          onChange={(e) => setF({ ...f, notes: e.target.value })}
        />
        <FormActions onCancel={onClose} label="Save client" />
      </form>
    </Modal>
  );
}
function PackageMenu({
  available,
  onPick,
}: {
  available: Package[];
  onPick: (pkg: Package | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const pick = (pkg: Package | null) => {
    setOpen(false);
    onPick(pkg);
  };
  return (
    <div className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-olive px-3 py-1.5 text-xs font-semibold text-olive transition hover:bg-olive-soft/40"
        onClick={() => setOpen(!open)}
      >
        <Plus size={14} /> Add package
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onMouseDown={() => setOpen(false)} />
          <div
            role="menu"
            className="absolute left-0 top-full z-20 mt-1 max-h-72 w-64 overflow-y-auto rounded-xl border border-border bg-white py-1 shadow-xl"
          >
            {available.map((p) => (
              <button
                key={p.id}
                type="button"
                role="menuitem"
                className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-xs hover:bg-olive-soft/40"
                onClick={() => pick(p)}
              >
                <span className="truncate font-medium">{p.name}</span>
                <span className="shrink-0 text-muted-foreground">{p.price ? money(p.price) : "on request"}</span>
              </button>
            ))}
            {!!available.length && <div className="my-1 border-t border-border" />}
            <button
              type="button"
              role="menuitem"
              className="w-full px-3 py-2 text-left text-xs font-semibold text-olive hover:bg-olive-soft/40"
              onClick={() => pick(null)}
            >
              Custom package
            </button>
          </div>
        </>
      )}
    </div>
  );
}

const miniInput =
  "box-border w-full min-w-0 rounded-lg border border-border bg-white px-2.5 py-1.5 text-sm outline-none transition focus:border-olive focus:ring-2 focus:ring-olive/10";
const miniAdd = "text-xs font-semibold text-olive";
const miniRemove = "flex h-7 w-7 items-center justify-center text-muted-foreground hover:text-rose-600";
// quantity | role | remove, always on one line inside the card
const teamRow = "mb-1.5 grid w-full min-w-0 grid-cols-[60px_minmax(0,1fr)_28px] items-center gap-1.5";
const materialRow = "mb-1.5 grid w-full min-w-0 grid-cols-[minmax(0,1fr)_28px] items-center gap-1.5";

function PackageEditor({
  pkg,
  errors,
  onChange,
  onDuplicate,
  onRemove,
}: {
  pkg: QuotePackage;
  errors: QuoteValidation;
  onChange: (patch: Partial<QuotePackage>) => void;
  onDuplicate: () => void;
  onRemove: () => void;
}) {
  const panel = "min-w-0 rounded-xl border border-border bg-white p-3";
  return (
    <div role="tabpanel" aria-label={`${pkg.title || "Package"} details`} className="space-y-3">
      <div className="grid min-w-0 grid-cols-1 items-end gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,9rem)] lg:grid-cols-[minmax(0,1fr)_minmax(0,9rem)_auto_auto] [&>*]:min-w-0">
        <Input
          label="Package title *"
          value={pkg.title}
          error={errors[`title:${pkg.id}`]}
          onChange={(e) => onChange({ title: e.target.value })}
        />
        <Input
          label="Package price (₹)"
          type="number"
          min="0"
          placeholder="0"
          value={pkg.price || ""}
          error={errors[`price:${pkg.id}`]}
          onChange={(e) => onChange({ price: Number(e.target.value) })}
        />
        <label className="flex items-center gap-2 pb-2.5 text-sm font-medium">
          <input
            type="checkbox"
            checked={pkg.countInTotal}
            onChange={(e) => onChange({ countInTotal: e.target.checked })}
          />
          Count in total
        </label>
        <div className="flex flex-wrap gap-2 pb-0.5 sm:col-span-2 lg:col-span-1">
          <button type="button" className={secondary} onClick={onDuplicate}>
            Duplicate
          </button>
          <button
            type="button"
            className={`${secondary} hover:border-rose-400 hover:text-rose-600`}
            onClick={onRemove}
          >
            <Trash2 size={14} /> Remove
          </button>
        </div>
      </div>
      {!pkg.countInTotal && (
        <p className="rounded-lg bg-amber-50 px-3 py-1.5 text-xs text-amber-900">
          Shown on the PDF as an option and left out of the total.
        </p>
      )}
      <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className={panel}>
          <div className="mb-2 flex items-center justify-between">
            <Label>Team</Label>
            <button
              type="button"
              className={miniAdd}
              onClick={() => onChange({ team: [...pkg.team, { qty: 1, role: "" }] })}
            >
              + Add member
            </button>
          </div>
          {pkg.team.map((t, i) => (
            <div key={i} className={teamRow}>
              <input
                aria-label={`Team quantity ${i + 1}`}
                className={miniInput}
                type="number"
                min="1"
                value={t.qty || ""}
                onChange={(e) =>
                  onChange({ team: pkg.team.map((x, j) => (j === i ? { ...x, qty: Number(e.target.value) } : x)) })
                }
              />
              <input
                aria-label={`Team role ${i + 1}`}
                className={miniInput}
                placeholder="Candid Photographer"
                value={t.role}
                onChange={(e) =>
                  onChange({ team: pkg.team.map((x, j) => (j === i ? { ...x, role: e.target.value } : x)) })
                }
              />
              <button
                type="button"
                className={miniRemove}
                aria-label={`Remove team row ${i + 1}`}
                onClick={() => onChange({ team: pkg.team.filter((_, j) => j !== i) })}
              >
                <X size={15} />
              </button>
            </div>
          ))}
          {!pkg.team.length && <p className="text-xs text-muted-foreground">No team added.</p>}
          {errors[`team:${pkg.id}`] && (
            <p className="text-[11px] font-medium text-rose-600">{errors[`team:${pkg.id}`]}</p>
          )}
        </div>
        <div className={panel}>
          <div className="mb-2 flex items-center justify-between">
            <Label>Material provided</Label>
            <button
              type="button"
              className={miniAdd}
              onClick={() => onChange({ materials: [...pkg.materials, ""] })}
            >
              + Add item
            </button>
          </div>
          {pkg.materials.map((m, i) => (
            <div key={i} className={materialRow}>
              <input
                aria-label={`Material ${i + 1}`}
                className={miniInput}
                placeholder="25 page album"
                value={m}
                onChange={(e) => onChange({ materials: pkg.materials.map((x, j) => (j === i ? e.target.value : x)) })}
              />
              <button
                type="button"
                className={miniRemove}
                aria-label={`Remove material ${i + 1}`}
                onClick={() => onChange({ materials: pkg.materials.filter((_, j) => j !== i) })}
              >
                <X size={15} />
              </button>
            </div>
          ))}
          {!pkg.materials.length && <p className="text-xs text-muted-foreground">No material added.</p>}
        </div>
        <div className={`${panel} sm:col-span-2`}>
          <Label>Gift / note</Label>
          <textarea
            aria-label="Gift or note"
            className={`${miniInput} min-h-20 resize-y`}
            placeholder="12x18 frame gift from us"
            value={pkg.gift}
            onChange={(e) => onChange({ gift: e.target.value })}
          />
        </div>
      </div>
    </div>
  );
}

export function QuoteForm({
  data,
  update,
  onClose,
  onCreated,
  existing,
}: {
  data: Platform;
  update: (d: Platform) => void;
  onClose: () => void;
  /** Called with the new quotation's id instead of `onClose` after a quotation is created. */
  onCreated?: (id: string) => void;
  existing?: Quote | undefined;
}) {
  const existingClient = existing && data.clients.find((c) => c.id === existing.clientId);
  const [clientId, setClientId] = useState(existing?.clientId || "");
  const [client, setClient] = useState<Client>(
    existingClient || { id: newId(), name: "", email: "", phone: "", city: "", notes: "" },
  );
  const [f, setF] = useState<Quote>(
    existing || {
      id: newId(),
      number: `${data.settings.invoicePrefix || "FF"}-Q-${String(data.quotes.length + 1).padStart(4, "0")}`,
      enquiryId: "",
      clientId: "",
      packageId: "",
      event: "",
      date: "",
      location: "",
      items: [],
      discount: 0,
      advance: 0,
      terms: data.settings.quoteTerms,
      status: "Draft",
      version: 1,
      createdAt: new Date().toISOString(),
    },
  );
  const [pkgs, setPkgs] = useState<QuotePackage[]>(() => (existing ? copyQuotePackages(quotePackagesOf(existing)) : []));
  const [activeId, setActiveId] = useState(pkgs[0]?.id || "");
  const [submitted, setSubmitted] = useState(false);

  const calcInput = { packages: pkgs, discount: f.discount, advance: f.advance };
  const totals = calcTotals(calcInput);
  const errors = validateQuote({ clientName: client.name, phone: client.phone, date: f.date, venue: f.location, ...calcInput });
  const shown: QuoteValidation = submitted ? errors : {};
  const active = pkgs.find((p) => p.id === activeId) || pkgs[0];

  const available = data.packages.filter((p) => p.active && !pkgs.some((x) => x.sourceId === p.id));
  const addPackage = (source: Package | null) => {
    const next = source ? quotePackageFrom(source) : blankQuotePackage();
    setPkgs([...pkgs, next]);
    setActiveId(next.id);
  };
  const patchPackage = (id: string, patch: Partial<QuotePackage>) =>
    setPkgs(pkgs.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  const duplicate = (p: QuotePackage) => {
    const copy = duplicateQuotePackage(p);
    const at = pkgs.findIndex((x) => x.id === p.id);
    setPkgs([...pkgs.slice(0, at + 1), copy, ...pkgs.slice(at + 1)]);
    setActiveId(copy.id);
  };
  const remove = (p: QuotePackage) => {
    const at = pkgs.findIndex((x) => x.id === p.id);
    const rest = pkgs.filter((x) => x.id !== p.id);
    setPkgs(rest);
    setActiveId(rest[Math.min(at, rest.length - 1)]?.id || "");
  };
  const chooseClient = (id: string) => {
    const picked = data.clients.find((c) => c.id === id);
    setClientId(id);
    if (picked) setClient(picked);
    else setClient({ id: newId(), name: "", email: "", phone: "", city: "", notes: "" });
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (existing && existing.status !== "Draft") {
      toast.error("Sent quotations are frozen. Revise as a new version.");
      return;
    }
    setSubmitted(true);
    const keys = Object.keys(errors);
    if (keys.length) {
      const bad = keys.map((k) => k.split(":")[1]).find((id) => id && pkgs.some((p) => p.id === id));
      if (bad && !["clientName", "phone", "date", "venue"].some((k) => k in errors)) setActiveId(bad);
      toast.error(errors[keys[0]!]!);
      return;
    }
    const quote = finalizeQuote({
      ...f,
      packages: pkgs,
      packageId: pkgs[0]?.sourceId || "",
      packageDetails: undefined,
      event: f.event.trim() || "Event",
      location: f.location.trim(),
      clientId: clientId || client.id,
    });
    const saved: Client = {
      ...client,
      id: quote.clientId,
      name: client.name.trim(),
      phone: client.phone.trim(),
      email: client.email.trim(),
    };
    const known = data.clients.some((c) => c.id === quote.clientId);
    update({
      ...data,
      clients: known ? data.clients.map((c) => (c.id === saved.id ? saved : c)) : [...data.clients, saved],
      quotes: existing ? data.quotes.map((q) => (q.id === f.id ? quote : q)) : [...data.quotes, quote],
    });
    toast.success(existing ? "Quotation updated" : "Quotation created");
    if (!existing && onCreated) onCreated(quote.id);
    else onClose();
  };

  const stat = (label: string, value: string, tone = "") => (
    <div className="min-w-0">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={`truncate text-sm font-semibold ${tone}`}>{value}</p>
    </div>
  );
  return (
    <Modal title={existing ? `Edit ${existing.number}` : "New quotation"} onClose={onClose} xl>
      <form onSubmit={submit} noValidate className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Input
            label="Client name *"
            value={client.name}
            error={shown.clientName}
            onChange={(e) => setClient({ ...client, name: e.target.value })}
          />
          <Input
            label="Phone *"
            type="tel"
            value={client.phone}
            error={shown.phone}
            onChange={(e) => setClient({ ...client, phone: e.target.value })}
          />
          <Input
            label="Event date *"
            type="date"
            value={f.date}
            error={shown.date}
            onChange={(e) => setF({ ...f, date: e.target.value })}
          />
          <Input
            label="Venue *"
            value={f.location}
            error={shown.venue}
            onChange={(e) => setF({ ...f, location: e.target.value })}
          />
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <div className="w-full sm:w-52">
            <Input
              label="Event type"
              placeholder="Wedding"
              value={f.event}
              onChange={(e) => setF({ ...f, event: e.target.value })}
            />
          </div>
          <div className="w-full sm:w-64">
            <Input
              label="Email (optional)"
              type="email"
              value={client.email}
              onChange={(e) => setClient({ ...client, email: e.target.value })}
            />
          </div>
          {!!data.clients.length && (
            <div className="w-full sm:w-56">
              <Select label="Existing client" value={clientId} onChange={(e) => chooseClient(e.target.value)}>
                <option value="">New client</option>
                {data.clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-border bg-[#faf9f5] p-3">
          <div className="flex flex-wrap items-center gap-2" role="tablist" aria-label="Packages in this quotation">
            {pkgs.map((p) => (
              <button
                key={p.id}
                type="button"
                role="tab"
                aria-selected={active?.id === p.id}
                onClick={() => setActiveId(p.id)}
                className={`flex max-w-full items-center gap-2 rounded-lg border px-3 py-1.5 text-xs transition ${
                  active?.id === p.id
                    ? "border-foreground bg-foreground text-white"
                    : "border-border bg-white hover:border-olive"
                } ${p.countInTotal ? "" : "border-dashed"}`}
              >
                <span className="max-w-40 truncate font-semibold">{p.title || "Untitled"}</span>
                <span className="opacity-75">{money(packageTotal(p))}</span>
                {!p.countInTotal && <span className="text-[10px] uppercase opacity-75">option</span>}
              </button>
            ))}
            <PackageMenu available={available} onPick={addPackage} />
          </div>
          {shown.packages && <p className="mt-2 text-[11px] font-medium text-rose-600">{shown.packages}</p>}
          <div className="mt-3">
            {active ? (
              <PackageEditor
                key={active.id}
                pkg={active}
                errors={shown}
                onChange={(patch) => patchPackage(active.id, patch)}
                onDuplicate={() => duplicate(active)}
                onRemove={() => remove(active)}
              />
            ) : (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Use “Add package” to pick a saved package or start a custom one.
              </p>
            )}
          </div>
        </div>

        <details className="rounded-xl border border-border bg-white px-3 py-2 text-sm">
          <summary className="cursor-pointer text-xs font-semibold">Terms</summary>
          <textarea
            aria-label="Terms"
            className={`${miniInput} mt-2 min-h-16 resize-y`}
            value={f.terms}
            onChange={(e) => setF({ ...f, terms: e.target.value })}
          />
        </details>

        <div className="sticky bottom-0 -mx-4 border-t border-border bg-background px-4 pb-1 pt-3 sm:-mx-8 sm:px-8">
          <div className="grid grid-cols-2 gap-3 sm:max-w-md">
            <Input
              label="Discount (₹)"
              type="number"
              min="0"
              placeholder="0"
              value={f.discount || ""}
              error={shown.discount}
              onChange={(e) => setF({ ...f, discount: Number(e.target.value) })}
            />
            <Input
              label="Advance (₹)"
              type="number"
              min="0"
              placeholder="0"
              value={f.advance || ""}
              error={shown.advance}
              onChange={(e) => setF({ ...f, advance: Number(e.target.value) })}
            />
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <div className="grid flex-1 grid-cols-2 gap-x-4 gap-y-1 sm:grid-cols-4" aria-live="polite">
              {stat("Subtotal", money(totals.subtotal))}
              {stat("Discount", `− ${money(totals.discount)}`)}
              {stat("Total", money(totals.total), "text-base font-bold")}
              {stat("Balance", money(totals.balance), totals.balance < 0 ? "text-rose-600" : "")}
            </div>
            <div className="flex gap-2">
              <button type="button" className={secondary} onClick={onClose}>
                Cancel
              </button>
              <button className={btn} type="submit">
                Save quotation
              </button>
            </div>
          </div>
        </div>
      </form>
    </Modal>
  );
}

export async function buildDocument(
  data: Platform,
  kind: "quote" | "invoice" | "receipt",
  q: Quote,
  booking?: Booking,
) {
  if (kind === "quote") return buildQuotationFor(data, q);
  const { jsPDF } = await import("jspdf");
  const pdf = new jsPDF();
  const studio = getStudio();
  const client = data.clients.find((c) => c.id === q.clientId);
  const totals = quoteTotals(q);
  const total = totals.total;
  const paid = booking ? bookingPaid(data, booking.id) : 0;
  const rs = (n: number) =>
    `Rs. ${Number(n).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
  // Built-in PDF fonts cannot draw the rupee sign or en dashes.
  const plain = (t: string) => t.replace(/₹\s?/g, "Rs. ").replace(/[–—]/g, "-");
  let y = 0;
  const room = (needed: number) => {
    if (y + needed > 270) {
      pdf.addPage();
      y = 24;
    }
  };
  pdf.setFillColor(34, 42, 35);
  pdf.rect(0, 0, 210, 46, "F");
  pdf.setTextColor(255, 255, 255);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(24);
  pdf.text(studio.studioName || "FrameFlow Studio", 18, 24);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  pdf.text([studio.city, studio.state, studio.email].filter(Boolean).join("  |  "), 18, 34);
  pdf.setTextColor(34, 42, 35);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(20);
  pdf.text(kind.toUpperCase(), 18, 64);
  pdf.setFontSize(10);
  pdf.setFont("helvetica", "normal");
  pdf.text(
    `Reference: ${q.number}-${kind === "invoice" ? "INV" : "RCT"}`,
    18,
    72,
  );
  pdf.text(`Issued: ${formatDate(today())}`, 150, 72);
  pdf.setDrawColor(220, 225, 215);
  pdf.line(18, 79, 192, 79);
  pdf.setFont("helvetica", "bold");
  pdf.text("BILL TO", 18, 90);
  pdf.setFont("helvetica", "normal");
  pdf.text(client?.name || "Client", 18, 98);
  if (client?.email) pdf.text(client.email, 18, 104);
  if (client?.phone) pdf.text(client.phone, 18, 110);
  pdf.setFont("helvetica", "bold");
  pdf.text("PROJECT", 112, 90);
  pdf.setFont("helvetica", "normal");
  pdf.text(q.event, 112, 98);
  pdf.text(formatDate(q.date), 112, 104);
  if (q.location) pdf.text(q.location, 112, 110);
  y = 126;

  // Invoices and receipts bill the counted lines only; quotations use buildQuotationFor.
  pdf.setFillColor(238, 242, 235);
  pdf.rect(18, y - 7, 174, 10, "F");
  pdf.setFont("helvetica", "bold");
  pdf.text("DESCRIPTION", 21, y);
  pdf.text("AMOUNT", 188, y, { align: "right" });
  y += 10;
  pdf.setFont("helvetica", "normal");
  q.items.forEach((item) => {
    room(12);
    pdf.text(plain(item.name).slice(0, 65), 21, y);
    pdf.text(rs(item.price), 188, y, { align: "right" });
    pdf.line(18, y + 4, 192, y + 4);
    y += 12;
  });
  const details = q.packageDetails;
  if (details) {
    // Package inclusions: heading, then wrapped bullet lines, paging as needed.
    const section = (title: string, rawLines: string[]) => {
      const lines = rawLines.map(plain);
      if (!lines.length) return;
      room(16);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(9);
      pdf.text(title.toUpperCase(), 21, y);
      y += 6;
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(10);
      lines.forEach((line) => {
        const wrapped = pdf.splitTextToSize(line, 160) as string[];
        room(wrapped.length * 5 + 2);
        pdf.text("-", 23, y);
        pdf.text(wrapped, 29, y);
        y += wrapped.length * 5 + 1.5;
      });
      y += 3;
    };
    y += 4;
    room(24);
    pdf.setFillColor(246, 249, 243);
    pdf.rect(18, y - 6, 174, 10, "F");
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(11);
    pdf.text(plain(`${details.name || "Package"}${details.category ? ` (${details.category})` : ""} - what is included`), 21, y + 1);
    y += 13;
    section("Team", details.team);
    section("Material provided by us", details.deliverables);
    if (details.notes) section("Notes", details.notes.split("\n").filter(Boolean));
    pdf.setFontSize(10);
  }

  {
    room(48);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(10);
    y += 4;
    const rows: [string, number][] = [["Subtotal", totals.subtotal], ["Discount", -totals.discount], ["Total", total]];
    rows.forEach(([label, value]) => {
      pdf.setFont("helvetica", label === "Total" ? "bold" : "normal");
      pdf.text(label, 130, y);
      pdf.text(rs(value), 188, y, { align: "right" });
      y += 8;
    });
    y += 3;
    pdf.setFont("helvetica", "bold");
    pdf.text("Received", 130, y);
    pdf.text(rs(paid), 188, y, { align: "right" });
    y += 9;
    pdf.text("Balance due", 130, y);
    pdf.text(rs(Math.max(0, total - paid)), 188, y, { align: "right" });
    y += 9;
  }
  const pages = pdf.getNumberOfPages();
  for (let page = 1; page <= pages; page++) {
    pdf.setPage(page);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);
    pdf.setTextColor(110, 120, 108);
    if (studio.gstin) pdf.text(`GSTIN: ${studio.gstin}`, 18, 282);
    pdf.text(pages > 1 ? `Page ${page} of ${pages}   |   Created with FrameFlow` : "Created with FrameFlow", 192, 282, { align: "right" });
  }
  return pdf;
}
async function downloadDocument(
  data: Platform,
  kind: "quote" | "invoice" | "receipt",
  q: Quote,
  booking?: Booking,
) {
  (await buildDocument(data, kind, q, booking)).save(`${kind}-${q.number}${kind === "quote" ? `-v${q.version || 1}` : ""}.pdf`);
}
function QuotePreview({
  data,
  update,
  onClose,
  quote: q,
  onRevise,
}: {
  data: Platform;
  update: (d: Platform) => void;
  onClose: () => void;
  quote: Quote;
  onRevise: (q: Quote) => void;
}) {
  const c = data.clients.find((x) => x.id === q.clientId);
  const versions = data.quotes.filter((x) => (x.rootId || x.id) === (q.rootId || q.id)).sort((a, b) => (a.version || 1) - (b.version || 1));
  const isLatest = versions[versions.length - 1]?.id === q.id;
  const [sendingWhatsapp, setSendingWhatsapp] = useState(false);
  const sendWhatsapp = async () => {
    if (!c?.phone) return;
    setSendingWhatsapp(true);
    try {
      const pdf = await buildDocument(data, "quote", q);
      await whatsappQuotation(
        c.phone,
        { clientName: c.name, event: q.event, number: q.number, total: money(quoteTotal(q)) },
        pdf.output("blob"),
      );
      toast.success(`Quotation sent on WhatsApp to ${c.name}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not send on WhatsApp.");
    } finally {
      setSendingWhatsapp(false);
    }
  };
  const share = async () => {
    try {
      const totals = quoteTotals(q);
      const shared = await publishQuote(q.id, q.rootId || q.id, {
        number: q.number,
        event: q.event,
        client_name: c?.name || "Client",
        date: q.date,
        location: q.location,
        items: q.items,
        ...(q.packageDetails ? { package_details: q.packageDetails } : {}),
        ...(q.packages
          ? {
              packages: q.packages.map((p) => ({
                id: p.id,
                title: p.title,
                price: p.price,
                count_in_total: p.countInTotal,
                team: p.team,
                materials: p.materials,
                gift: p.gift,
              })),
              balance: totals.balance,
            }
          : {}),
        subtotal: totals.subtotal,
        discount: totals.discount,
        total: totals.total,
        advance: q.advance,
        terms: q.terms,
      });
      const url = `${window.location.origin}/quote/${shared.id}`;
      update({
        ...data,
        quotes: data.quotes.map((x) => x.id === q.id
          ? { ...x, status: shared.status, version: shared.version }
          : x.id === versions[versions.length - 2]?.id && (x.status === "Pending" || x.status === "Changes requested")
            ? { ...x, status: "Superseded" }
            : x),
      });
      await navigator.clipboard.writeText(url);
      toast.success("Client decision link copied");
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not share quotation.");
    }
  };
  return (
    <Modal title={`Quotation ${q.number} · v${q.version || 1}`} onClose={onClose} wide>
      <div className="rounded-xl border border-border bg-white p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="font-display text-2xl">{getStudio().studioName}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {[getStudio().city, getStudio().state].filter(Boolean).join(", ")}
            </p>
          </div>
          <Badge
            tone={q.status === "Accepted" ? "green" : q.status === "Rejected" ? "red" : "amber"}
          >
            {q.status}
          </Badge>
        </div>
        <div className="mt-8 grid gap-4 border-y border-border py-5 text-sm sm:grid-cols-2">
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Prepared for</p>
            <strong className="mt-1 block">{c?.name}</strong>
            <span className="text-muted-foreground">{c?.email}</span>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Event</p>
            <strong className="mt-1 block">{q.event}</strong>
            <span className="text-muted-foreground">
              {formatDate(q.date)} · {q.location}
            </span>
          </div>
        </div>
        {q.packages ? (
          <div className="mt-5 space-y-3">
            {q.packages.map((p) => (
              <div key={p.id} className={`rounded-xl bg-[#f6f9f3] p-4 ${p.countInTotal ? "" : "border border-dashed border-olive/50"}`}>
                <div className="flex justify-between gap-3">
                  <p className="font-display text-xl">
                    {p.title}
                    {!p.countInTotal && <span className="ml-2 text-xs font-sans text-muted-foreground">Option · not in total</span>}
                  </p>
                  <strong>{money(p.price)}</strong>
                </div>
                <PackageDetailsView
                  compact
                  details={{
                    name: p.title,
                    category: "",
                    team: p.team.map((t) => `${t.qty} × ${t.role}`),
                    deliverables: p.materials,
                    notes: p.gift,
                  }}
                />
              </div>
            ))}
          </div>
        ) : (
          <>
            {q.packageDetails && (
              <div className="mt-5 rounded-xl bg-[#f6f9f3] p-4">
                <p className="font-display text-xl">{q.packageDetails.name}</p>
                <PackageDetailsView details={q.packageDetails} compact />
              </div>
            )}
            <div className="mt-5 space-y-3">
              {q.items.map((item, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span>{item.name}</span>
                  <strong>{money(item.price)}</strong>
                </div>
              ))}
            </div>
          </>
        )}
        {(!q.packages || q.packages.some((p) => p.countInTotal)) && (
          <div className="mt-5 border-t border-border pt-4 text-sm">
            <div className="flex justify-between py-1">
              <span>Subtotal</span>
              <span>{money(quoteSubtotal(q))}</span>
            </div>
            <div className="flex justify-between py-1">
              <span>Discount</span>
              <span>− {money(quoteTotals(q).discount)}</span>
            </div>
            <div className="mt-2 flex justify-between border-t border-border pt-3 text-lg font-bold">
              <span>Total</span>
              <span>{money(quoteTotal(q))}</span>
            </div>
            <div className="flex justify-between py-1 text-olive">
              <span>Advance to confirm</span>
              <span>{money(q.advance)}</span>
            </div>
          </div>
        )}
        <p className="mt-6 text-xs leading-relaxed text-muted-foreground">{q.terms}</p>
      </div>
      {q.feedback && <p className="mt-4 rounded-xl border border-border p-4 text-sm"><strong>Client requested changes:</strong> {q.feedback}</p>}
      {versions.length > 1 && (
        <div className="mt-5 rounded-xl border border-border p-4 text-sm">
          <strong>Version history</strong>
          {versions.map((version) => (
            <div key={version.id} className="mt-2 flex justify-between gap-3">
              <span>v{version.version || 1} · {version.status}</span>
              <strong>{money(quoteTotal(version))}</strong>
            </div>
          ))}
        </div>
      )}
      <div className="mt-5 flex flex-wrap justify-end gap-2">
        <button className={secondary} onClick={() => void downloadDocument(data, "quote", q)}>
          <Download size={15} /> Download PDF
        </button>
        <button
          className={secondary}
          disabled={!c?.phone || sendingWhatsapp}
          title={c?.phone ? undefined : "Add a client phone number to send on WhatsApp"}
          onClick={() => void sendWhatsapp()}
        >
          <MessageCircle size={15} /> {sendingWhatsapp ? "Sending…" : "Send on WhatsApp"}
        </button>
        {q.status === "Draft" && isLatest && (
          <button className={btn} onClick={() => void share()}>
            Publish & copy client link
          </button>
        )}
        {q.status !== "Draft" && isLatest && (
          <button className={secondary} onClick={() => void share()}>
            Copy client link
          </button>
        )}
        {isLatest && (q.status === "Pending" || q.status === "Changes requested" || q.status === "Rejected") && (
          <button className={secondary} onClick={() => onRevise(q)}>
            {q.status === "Rejected" ? "Revise as new version" : "Revise"}
          </button>
        )}
      </div>
      <p className="mt-3 text-right text-xs text-muted-foreground">
        Clients can accept, reject, or request changes from the shared link.
      </p>
    </Modal>
  );
}
function BookingForm({
  data,
  update,
  onClose,
  selectedQuote,
}: {
  data: Platform;
  update: (d: Platform) => void;
  onClose: () => void;
  selectedQuote?: Quote | undefined;
}) {
  const choices = data.quotes.filter(
    (q) => q.status === "Accepted" && !data.bookings.some((b) => b.quoteId === q.id),
  );
  const [quoteId, setQuoteId] = useState(selectedQuote?.id || choices[0]?.id || "");
  const q = data.quotes.find((x) => x.id === quoteId);
  const [date, setDate] = useState(q?.date || "");
  const [endDate, setEndDate] = useState(q?.date || "");
  const [location, setLocation] = useState(q?.location || "");
  const [advance, setAdvance] = useState(q?.advance || 0);
  const [method, setMethod] = useState("UPI");
  const [bookingId] = useState(newId);
  const [draft, setDraft] = useState<TeamDraft>({ assignments: [], payNow: {}, method: "UPI" });
  const changeQuote = (id: string) => {
    const next = data.quotes.find((x) => x.id === id);
    setQuoteId(id);
    setDate(next?.date || "");
    setEndDate(next?.date || "");
    setLocation(next?.location || "");
    setAdvance(next?.advance || 0);
  };
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!q || !date || endDate < date) {
      toast.error("Choose a quote and valid shoot dates.");
      return;
    }
    if (advance > quoteTotal(q)) {
      toast.error("Advance exceeds the quotation total.");
      return;
    }
    const teamError = validateTeam(data, draft, date, endDate || date);
    if (teamError) {
      toast.error(teamError);
      return;
    }
    const booking: Booking = {
      id: bookingId,
      quoteId: q.id,
      clientId: q.clientId,
      event: q.event,
      date,
      endDate: endDate || date,
      location,
      serviceNames: q.items.map((i) => i.name),
      assignments: draft.assignments,
      checklist: [],
      notes: "",
    };
    update({
      ...data,
      bookings: [...data.bookings, booking],
      payments:
        advance > 0
          ? [
              ...data.payments,
              {
                id: newId(),
                bookingId: booking.id,
                amount: advance,
                date: today(),
                method,
                reference: "",
                note: "Advance payment",
              },
            ]
          : data.payments,
      teamPayments: [...data.teamPayments, ...teamPaymentsFor(draft, booking)],
    });
    toast.success("Booking created");
    onClose();
  };
  return (
    <Modal title="Create booking" onClose={onClose} wide>
      <form onSubmit={submit} className="space-y-4">
        <Select
          label="Accepted quotation *"
          value={quoteId}
          onChange={(e) => changeQuote(e.target.value)}
        >
          <option value="">Select quotation</option>
          {choices.map((x) => (
            <option key={x.id} value={x.id}>
              {x.number} · {data.clients.find((c) => c.id === x.clientId)?.name} · {x.event}
            </option>
          ))}
        </Select>
        {q && (
          <div className="rounded-xl bg-olive-soft p-4 text-sm">
            <strong>{q.event}</strong>
            <p className="mt-1 text-muted-foreground">{q.items.map((i) => i.name).join(", ")}</p>
            <p className="mt-2 font-bold">Quote total {money(quoteTotal(q))}</p>
          </div>
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Shoot start date *"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
          <Input
            label="Shoot end date"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
        <Input label="Location" value={location} onChange={(e) => setLocation(e.target.value)} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Advance received (₹)"
            type="number"
            min="0"
            value={advance}
            onChange={(e) => setAdvance(Number(e.target.value))}
          />
          <Select label="Payment method" value={method} onChange={(e) => setMethod(e.target.value)}>
            {["UPI", "Bank transfer", "Cash", "Card", "Other"].map((x) => (
              <option key={x}>{x}</option>
            ))}
          </Select>
        </div>
        <p className="text-xs text-muted-foreground">
          Enter only the advance already received. It will be recorded as a payment.
        </p>
        <TeamAssignmentsEditor
          data={data}
          draft={draft}
          onChange={setDraft}
          start={date}
          end={endDate || date}
          bookingId={bookingId}
        />
        <FormActions onCancel={onClose} label="Confirm booking" />
      </form>
    </Modal>
  );
}
function ShootForm({
  data,
  update,
  onClose,
  booking: b,
}: {
  data: Platform;
  update: (d: Platform) => void;
  onClose: () => void;
  booking: Booking;
}) {
  const [f, setF] = useState(b);
  const [draft, setDraft] = useState<TeamDraft>({
    assignments: b.assignments.map((a) => ({ ...a })),
    payNow: {},
    method: "UPI",
  });
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!f.date || f.endDate < f.date) {
      toast.error("Check the shoot dates.");
      return;
    }
    const teamError = validateTeam(data, draft, f.date, f.endDate);
    if (teamError) {
      toast.error(teamError);
      return;
    }
    update({
      ...data,
      bookings: data.bookings.map((x) =>
        x.id === b.id ? { ...f, assignments: draft.assignments } : x,
      ),
      teamPayments: [...data.teamPayments, ...teamPaymentsFor(draft, b)],
    });
    toast.success("Shoot updated");
    onClose();
  };
  return (
    <Modal title={b.event} onClose={onClose} wide>
      <form onSubmit={submit} className="space-y-5">
        <div className="rounded-xl bg-white p-4 text-sm">
          <strong>{data.clients.find((c) => c.id === b.clientId)?.name}</strong>
          <span className="ml-3 text-muted-foreground">{b.serviceNames.join(" · ")}</span>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <Input
            label="Start date"
            type="date"
            value={f.date}
            onChange={(e) => setF({ ...f, date: e.target.value })}
            required
          />
          <Input
            label="End date"
            type="date"
            value={f.endDate}
            onChange={(e) => setF({ ...f, endDate: e.target.value })}
          />
          <Input
            label="Location"
            value={f.location}
            onChange={(e) => setF({ ...f, location: e.target.value })}
          />
        </div>
        <TeamAssignmentsEditor
          data={data}
          draft={draft}
          onChange={setDraft}
          start={f.date}
          end={f.endDate || f.date}
          bookingId={b.id}
        />
        <Textarea
          label="Shoot notes"
          value={f.notes}
          onChange={(e) => setF({ ...f, notes: e.target.value })}
        />
        <FormActions onCancel={onClose} label="Save shoot" />
      </form>
    </Modal>
  );
}
function PaymentForm({
  data,
  update,
  onClose,
  booking: b,
}: {
  data: Platform;
  update: (d: Platform) => void;
  onClose: () => void;
  booking: Booking;
}) {
  const q = data.quotes.find((x) => x.id === b.quoteId)!;
  const due = Math.max(0, quoteTotal(q) - bookingPaid(data, b.id));
  const [f, setF] = useState({
    amount: due,
    date: today(),
    method: "UPI",
    reference: "",
    note: "Balance payment",
  });
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (f.amount <= 0 || f.amount > due) {
      toast.error("Enter an amount up to the outstanding balance.");
      return;
    }
    update({ ...data, payments: [...data.payments, { ...f, id: newId(), bookingId: b.id }] });
    toast.success("Payment recorded");
    onClose();
  };
  return (
    <Modal title="Record payment" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <div className="rounded-xl bg-olive-soft p-4 text-sm">
          <strong>{b.event}</strong>
          <span className="ml-2 text-muted-foreground">Balance {money(due)}</span>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Amount received (₹) *"
            type="number"
            min="0.01"
            max={due}
            value={f.amount}
            onChange={(e) => setF({ ...f, amount: Number(e.target.value) })}
            required
          />
          <Input
            label="Date *"
            type="date"
            value={f.date}
            onChange={(e) => setF({ ...f, date: e.target.value })}
            required
          />
        </div>
        <Select
          label="Method"
          value={f.method}
          onChange={(e) => setF({ ...f, method: e.target.value })}
        >
          {["UPI", "Bank transfer", "Cash", "Card", "Other"].map((x) => (
            <option key={x}>{x}</option>
          ))}
        </Select>
        <Input
          label="Transaction reference"
          value={f.reference}
          onChange={(e) => setF({ ...f, reference: e.target.value })}
        />
        <Input label="Note" value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} />
        <FormActions onCancel={onClose} label="Record payment" />
      </form>
    </Modal>
  );
}
function InvoicePreview({
  data,
  onClose,
  booking: b,
}: {
  data: Platform;
  onClose: () => void;
  booking: Booking;
}) {
  const q = data.quotes.find((x) => x.id === b.quoteId)!;
  const payments = data.payments.filter((p) => p.bookingId === b.id);
  const total = quoteTotal(q);
  const paid = bookingPaid(data, b.id);
  const recipient = data.clients.find((c) => c.id === b.clientId)?.email || "";
  const [sending, setSending] = useState(false);
  const send = async (kind: "invoice" | "receipt") => {
    if (!recipient) return;
    setSending(true);
    try {
      const pdf = await buildDocument(data, kind, q, b);
      await emailDocument(recipient, kind, pdf.output("blob"));
      toast.success(`${kind === "invoice" ? "Invoice" : "Receipt"} sent to ${recipient}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not send document.");
    } finally {
      setSending(false);
    }
  };
  return (
    <Modal title="Invoice & receipt" onClose={onClose}>
      <div className="rounded-xl border border-border bg-white p-5">
        <p className="eyebrow text-olive">{getStudio().studioName}</p>
        <h3 className="mt-2 text-2xl">{b.event}</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          {data.clients.find((c) => c.id === b.clientId)?.name} · {q.number}
        </p>
        <div className="mt-5 space-y-2 border-t border-border pt-4 text-sm">
          <div className="flex justify-between">
            <span>Invoice total</span>
            <strong>{money(total)}</strong>
          </div>
          <div className="flex justify-between">
            <span>Received</span>
            <strong className="text-emerald-700">{money(paid)}</strong>
          </div>
          <div className="flex justify-between">
            <span>Outstanding</span>
            <strong>{money(Math.max(0, total - paid))}</strong>
          </div>
        </div>
        <div className="mt-5 border-t border-border pt-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Payment history
          </p>
          {payments.length ? (
            payments.map((p) => (
              <div key={p.id} className="flex justify-between py-1 text-sm">
                <span>
                  {formatDate(p.date)} · {p.method}
                </span>
                <strong>{money(p.amount)}</strong>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">No payments recorded.</p>
          )}
        </div>
      </div>
      <div className="mt-5 flex flex-wrap justify-end gap-2">
        <button className={secondary} onClick={() => void downloadDocument(data, "invoice", q, b)}>
          <Download size={15} /> Invoice PDF
        </button>
        <button
          className={btn}
          disabled={!payments.length}
          onClick={() => void downloadDocument(data, "receipt", q, b)}
        >
          <Download size={15} /> Receipt PDF
        </button>
        <button
          className={secondary}
          disabled={!recipient || sending}
          onClick={() => void send("invoice")}
        >
          Send invoice
        </button>
        <button
          className={btn}
          disabled={!recipient || !payments.length || sending}
          onClick={() => void send("receipt")}
        >
          Send receipt
        </button>
      </div>
      {!recipient && (
        <p className="mt-3 text-right text-xs text-muted-foreground">
          Add a client email to send documents.
        </p>
      )}
    </Modal>
  );
}
type TeamDraft = { assignments: TeamAssignment[]; payNow: Record<string, number>; method: string };
const payMethods = ["UPI", "Bank transfer", "Cash", "Card", "Other"];
const teamRoles = ["Photographer", "Cinematographer", "Drone operator", "Editor", "Assistant", "Other"];

function validateTeam(data: Platform, draft: TeamDraft, start: string, end: string) {
  const seen = new Set<string>();
  for (const a of draft.assignments) {
    const name = data.team.find((t) => t.id === a.memberId)?.name || "Team member";
    if (!a.date || a.date < start || a.date > (end || start)) {
      return `${name}: choose a date within the shoot dates (${formatDate(start)} – ${formatDate(end || start)}).`;
    }
    const key = `${a.memberId}|${a.date}`;
    if (seen.has(key)) return `${name} is added twice on ${formatDate(a.date)}.`;
    seen.add(key);
    if (!(Number(a.fee) >= 0)) return `${name}: enter a valid fee.`;
    const pay = Number(draft.payNow[a.id]) || 0;
    const balance = Number(a.fee) - assignmentPaid(data, a.id);
    if (pay < 0 || pay > balance) {
      return `${name}: payment on ${formatDate(a.date)} cannot exceed the balance of ${money(Math.max(0, balance))}.`;
    }
  }
  return "";
}
function teamPaymentsFor(draft: TeamDraft, booking: Booking): TeamPayment[] {
  return draft.assignments
    .filter((a) => (Number(draft.payNow[a.id]) || 0) > 0)
    .map((a) => ({
      id: newId(),
      bookingId: booking.id,
      assignmentId: a.id,
      memberId: a.memberId,
      amount: Number(draft.payNow[a.id]),
      date: today(),
      method: draft.method,
      note: Number(a.fee) === Number(draft.payNow[a.id]) ? "Full payment" : "Payment on assignment",
    }));
}

function TeamAssignmentsEditor({
  data,
  draft,
  onChange,
  start,
  end,
  bookingId,
}: {
  data: Platform;
  draft: TeamDraft;
  onChange: (d: TeamDraft) => void;
  start: string;
  end: string;
  bookingId: string;
}) {
  const [memberId, setMemberId] = useState("");
  const [query, setQuery] = useState("");
  const [date, setDate] = useState("");
  const [fee, setFee] = useState(0);
  const [advance, setAdvance] = useState(0);
  const day = date || start;
  const picked = data.team.find((t) => t.id === memberId);
  const matches = data.team.filter((t) =>
    `${t.name} ${t.role}`.toLowerCase().includes(query.trim().toLowerCase()),
  );
  const busyElsewhere = (id: string, d: string) =>
    data.bookings.some(
      (b) => b.id !== bookingId && b.assignments.some((a) => a.memberId === id && a.date === d),
    );
  const add = () => {
    const problem = !picked
      ? "Select a team member first."
      : !day || day < start || day > (end || start)
        ? "Choose a date within the shoot dates."
        : draft.assignments.some((a) => a.memberId === picked.id && a.date === day)
          ? `${picked.name} is already added on ${formatDate(day)}.`
          : advance < 0 || advance > fee
            ? "Payment cannot exceed the fee."
            : "";
    if (problem || !picked) {
      toast.error(problem);
      return;
    }
    const id = newId();
    onChange({
      ...draft,
      assignments: [...draft.assignments, { id, memberId: picked.id, date: day, fee }],
      payNow: { ...draft.payNow, [id]: advance },
    });
    setMemberId("");
    setQuery("");
    setFee(0);
    setAdvance(0);
  };
  const patch = (id: string, change: Partial<TeamAssignment>) =>
    onChange({
      ...draft,
      assignments: draft.assignments.map((a) => (a.id === id ? { ...a, ...change } : a)),
    });
  const remove = (a: TeamAssignment) => {
    const paid = assignmentPaid(data, a.id);
    if (
      paid > 0 &&
      !window.confirm(`${money(paid)} was already paid for this day and will stay on record. Remove anyway?`)
    ) {
      return;
    }
    const { [a.id]: _removed, ...payNow } = draft.payNow;
    onChange({ ...draft, assignments: draft.assignments.filter((x) => x.id !== a.id), payNow });
  };
  const sorted = [...draft.assignments].sort(
    (x, y) => x.date.localeCompare(y.date) || x.memberId.localeCompare(y.memberId),
  );
  const totalFee = draft.assignments.reduce((sum, a) => sum + (Number(a.fee) || 0), 0);
  const totalPay = draft.assignments.reduce((sum, a) => sum + (Number(draft.payNow[a.id]) || 0), 0);
  return (
    <section className="rounded-2xl border border-border bg-white p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-lg">Team &amp; payments</h3>
          <p className="text-xs text-muted-foreground">
            Assign people day by day — each assignment has its own date, fee and payment.
          </p>
        </div>
        {draft.assignments.length > 0 && (
          <div className="text-right text-xs text-muted-foreground">
            Team cost <strong className="text-foreground">{money(totalFee)}</strong> · Paying now{" "}
            <strong className="text-foreground">{money(totalPay)}</strong>
          </div>
        )}
      </div>

      {data.team.length ? (
        <div className="mt-4 rounded-xl bg-[#faf9f5] p-3 sm:p-4">
          <div className="relative">
            <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              aria-label="Search team members"
              className={`${fieldClass} pl-9`}
              placeholder="Search team member by name or role"
              value={picked && !query ? picked.name : query}
              onChange={(e) => {
                setQuery(e.target.value);
                setMemberId("");
              }}
            />
          </div>
          <div className="mt-2 flex max-h-28 flex-wrap gap-2 overflow-y-auto">
            {matches.map((t) => (
              <button
                type="button"
                key={t.id}
                onClick={() => {
                  setMemberId(t.id);
                  setQuery("");
                }}
                className={`rounded-full border px-3 py-1.5 text-xs transition ${memberId === t.id ? "border-olive bg-olive text-white" : "border-border bg-white hover:border-olive"}`}
              >
                {t.name} <span className="opacity-70">· {t.role}</span>
              </button>
            ))}
            {!matches.length && <span className="text-xs text-muted-foreground">No team member matches.</span>}
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_1fr_1fr_auto] sm:items-end">
            <Input
              label="Date"
              type="date"
              min={start}
              max={end || start}
              value={day}
              onChange={(e) => setDate(e.target.value)}
            />
            <Input
              label="Fee (₹)"
              type="number"
              min="0"
              value={fee}
              onChange={(e) => setFee(Number(e.target.value))}
            />
            <Input
              label="Paid now (₹)"
              type="number"
              min="0"
              max={fee}
              value={advance}
              onChange={(e) => setAdvance(Number(e.target.value))}
            />
            <button type="button" className={btn} onClick={add}>
              <Plus size={16} />
              Add
            </button>
          </div>
          {picked && day && busyElsewhere(picked.id, day) && (
            <p className="mt-2 text-xs text-amber-700">
              {picked.name} already has another shoot on {formatDate(day)}.
            </p>
          )}
        </div>
      ) : (
        <p className="mt-4 text-sm text-muted-foreground">
          No team members yet.{" "}
          <a href={link("team")} className="text-olive underline">
            Add team members
          </a>
        </p>
      )}

      {sorted.length > 0 && (
        <div className="mt-4 space-y-2">
          {sorted.map((a) => {
            const member = data.team.find((t) => t.id === a.memberId);
            const paid = assignmentPaid(data, a.id);
            const outside = !!a.date && (a.date < start || a.date > (end || start));
            return (
              <div
                key={a.id}
                className="grid gap-3 rounded-xl border border-border p-3 sm:grid-cols-[1.3fr_1fr_.8fr_.8fr_auto] sm:items-end"
              >
                <div className="min-w-0 text-sm">
                  <strong className="block truncate">{member?.name || "Removed member"}</strong>
                  <span className="text-xs text-muted-foreground">{member?.role}</span>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {paid > 0 && <Badge tone="green">Paid {money(paid)}</Badge>}
                    {outside && <Badge tone="red">Outside shoot dates</Badge>}
                    {member && busyElsewhere(member.id, a.date) && <Badge tone="amber">Busy elsewhere</Badge>}
                  </div>
                </div>
                <Input
                  label="Date"
                  type="date"
                  min={start}
                  max={end || start}
                  value={a.date}
                  onChange={(e) => patch(a.id, { date: e.target.value })}
                />
                <Input
                  label="Fee (₹)"
                  type="number"
                  min="0"
                  value={a.fee}
                  onChange={(e) => patch(a.id, { fee: Number(e.target.value) })}
                />
                <Input
                  label={paid > 0 ? "Pay more (₹)" : "Paid now (₹)"}
                  type="number"
                  min="0"
                  value={draft.payNow[a.id] || 0}
                  onChange={(e) => onChange({ ...draft, payNow: { ...draft.payNow, [a.id]: Number(e.target.value) } })}
                />
                <button
                  type="button"
                  className="inline-flex h-[42px] items-center justify-center rounded-xl border border-border px-3 text-rose-600 transition hover:border-rose-300 hover:bg-rose-50"
                  onClick={() => remove(a)}
                  aria-label={`Remove ${member?.name || "assignment"} on ${formatDate(a.date)}`}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            );
          })}
          <div className="max-w-xs pt-1">
            <Select
              label="Payment method for amounts paid now"
              value={draft.method}
              onChange={(e) => onChange({ ...draft, method: e.target.value })}
            >
              {payMethods.map((x) => (
                <option key={x}>{x}</option>
              ))}
            </Select>
          </div>
        </div>
      )}
    </section>
  );
}

function assignmentStatus(fee: number, paid: number): { label: string; tone: "neutral" | "green" | "amber" | "red" } {
  if (fee <= 0) return { label: "No fee set", tone: "neutral" };
  if (paid >= fee) return { label: "Paid", tone: "green" };
  if (paid > 0) return { label: "Partial", tone: "amber" };
  return { label: "Unpaid", tone: "red" };
}

function TeamSection({
  data,
  open,
}: {
  data: Platform;
  open: (name: string, id?: string) => void;
}) {
  const [q, setQ] = useState("");
  const [role, setRole] = useState("All");
  const [status, setStatus] = useState("All");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const ranged = !!(from || to);
  const all = data.team.map((t) => ({ t, s: memberStats(data, t.id, { from, to }) }));
  const rows = all.filter(({ t, s }) => {
    if (q && !`${t.name} ${t.role} ${t.phone}`.toLowerCase().includes(q.toLowerCase())) return false;
    if (role !== "All" && t.role !== role) return false;
    if (ranged && s.days === 0) return false;
    if (status === "Pending") return s.remaining > 0;
    if (status === "Settled") return s.total > 0 && s.remaining === 0;
    if (status === "No work") return s.days === 0;
    return true;
  });
  const total = rows.reduce((sum, r) => sum + r.s.total, 0);
  const paid = rows.reduce((sum, r) => sum + r.s.paid, 0);
  const remaining = rows.reduce((sum, r) => sum + r.s.remaining, 0);
  const filtersOn = q || role !== "All" || status !== "All" || ranged;
  return (
    <>
      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ["Team members", String(rows.length), `${rows.reduce((n, r) => n + r.s.days, 0)} assigned days`],
          ["Total fees", money(total), ranged ? "In selected period" : "Across all shoots"],
          ["Paid to team", money(paid), "Recorded payments"],
          ["Remaining", money(remaining), "Still to be paid"],
        ].map(([label, value, note]) => (
          <div key={label} className={`${card} p-5`}>
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="mt-3 font-display text-3xl">{value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{note}</p>
          </div>
        ))}
      </div>
      <div className={`${card} mb-4 grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-6 lg:items-end`}>
        <label className="block lg:col-span-2">
          <Label>Search</Label>
          <input
            className={fieldClass}
            placeholder="Name, role or phone"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </label>
        <Select label="Role" value={role} onChange={(e) => setRole(e.target.value)}>
          <option>All</option>
          {teamRoles.map((r) => (
            <option key={r}>{r}</option>
          ))}
        </Select>
        <Select label="Payment" value={status} onChange={(e) => setStatus(e.target.value)}>
          {["All", "Pending", "Settled", "No work"].map((r) => (
            <option key={r}>{r}</option>
          ))}
        </Select>
        <Input label="Shoot day from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        <Input label="Shoot day to" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        {filtersOn && (
          <button
            className="text-left text-xs font-semibold text-olive underline sm:col-span-2 lg:col-span-6"
            onClick={() => {
              setQ("");
              setRole("All");
              setStatus("All");
              setFrom("");
              setTo("");
            }}
          >
            Clear filters
          </button>
        )}
      </div>
      <Table
        heads={["Team member", "Role", "Shoots / days", "Total fee", "Paid", "Remaining", "Status", ""]}
        filterKey={`${q}|${role}|${status}|${from}|${to}`}
      >
        {rows.map(({ t, s }) => {
          const st = s.days === 0 ? { label: "No work", tone: "neutral" as const } : assignmentStatus(s.total, s.paid);
          return (
            <tr key={t.id}>
              <Td>
                <button className="text-left" onClick={() => open("teamDetail", t.id)}>
                  <strong className="underline-offset-2 hover:underline">{t.name}</strong>
                  <span className="mt-1 block text-xs text-muted-foreground">{t.phone || "—"}</span>
                </button>
              </Td>
              <Td>{t.role}</Td>
              <Td>
                {s.shoots} / {s.days}
              </Td>
              <Td>{money(s.total)}</Td>
              <Td className="text-emerald-700">{money(s.paid)}</Td>
              <Td className="font-semibold">{money(s.remaining)}</Td>
              <Td>
                <Badge tone={st.tone}>{st.label}</Badge>
              </Td>
              <Td>
                <button className={tableAction} onClick={() => open("teamDetail", t.id)}>
                  View details →
                </button>
              </Td>
            </tr>
          );
        })}
      </Table>
    </>
  );
}

function TeamDetail({
  data,
  update,
  member,
  onClose,
  onEdit,
}: {
  data: Platform;
  update: (d: Platform) => void;
  member: TeamMember;
  onClose: () => void;
  onEdit: () => void;
}) {
  const [status, setStatus] = useState("All");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [pay, setPay] = useState<string | null>(null);
  const s = memberStats(data, member.id, { from, to });
  const everything = memberStats(data, member.id);
  const rows = s.rows.filter((r) => status === "All" || assignmentStatus(r.fee, r.paid).label === status);
  const clientName = (id: string) => data.clients.find((c) => c.id === id)?.name || "—";
  const undo = (p: TeamPayment) => {
    if (!window.confirm(`Remove the ${money(p.amount)} payment recorded on ${formatDate(p.date)}?`)) return;
    update({ ...data, teamPayments: data.teamPayments.filter((x) => x.id !== p.id) });
    toast.success("Payment removed");
  };
  const th = "px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground";
  return (
    <>
    <Modal title={member.name} onClose={onClose} xl>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-white p-4 sm:p-5">
          <div className="flex items-center gap-4">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#c5d5b9] font-display text-2xl text-[#233026]">
              {member.name.slice(0, 1).toUpperCase()}
            </span>
            <div>
              <Badge tone="blue">{member.role}</Badge>
              <p className="mt-1.5 text-sm text-muted-foreground">{member.phone || "No phone added"}</p>
              <p className="text-xs text-muted-foreground">
                {everything.shoots} {everything.shoots === 1 ? "shoot" : "shoots"} · {everything.days} assigned{" "}
                {everything.days === 1 ? "day" : "days"}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button className={secondary} onClick={onEdit}>
              Edit profile
            </button>
            <button className={btn} onClick={() => setPay("")} disabled={everything.rows.every((r) => r.balance === 0)}>
              <Wallet size={16} />
              Record payment
            </button>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["Shoots / days", `${s.shoots} / ${s.days}`],
            ["Total fee", money(s.total)],
            ["Paid", money(s.paid)],
            ["Remaining", money(s.remaining)],
          ].map(([label, value]) => (
            <div key={label} className={`${card} p-4`}>
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="mt-2 font-display text-2xl">{value}</p>
            </div>
          ))}
        </div>

        <section>
          <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
            <h3 className="text-xl">Worked shoots</h3>
            <div className="flex flex-wrap items-end gap-2">
              <Select label="Status" value={status} onChange={(e) => setStatus(e.target.value)}>
                {["All", "Unpaid", "Partial", "Paid", "No fee set"].map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </Select>
              <Input label="From" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
              <Input label="To" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
            </div>
          </div>
          <div className={`${card} overflow-x-auto`}>
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b border-border bg-[#faf9f5]">
                <tr>
                  {["Date", "Shoot", "Fee", "Paid", "Balance", "Status", ""].map((h) => (
                    <th key={h} className={th}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/70">
                {rows.map((r) => {
                  const st = assignmentStatus(r.fee, r.paid);
                  return (
                    <tr key={r.assignment.id}>
                      <td className="px-4 py-3 whitespace-nowrap">{formatDate(r.assignment.date)}</td>
                      <td className="px-4 py-3">
                        <strong>{r.booking.event}</strong>
                        <span className="block text-xs text-muted-foreground">
                          {clientName(r.booking.clientId)}
                          {r.booking.location ? ` · ${r.booking.location}` : ""}
                        </span>
                      </td>
                      <td className="px-4 py-3">{money(r.fee)}</td>
                      <td className="px-4 py-3 text-emerald-700">{money(r.paid)}</td>
                      <td className="px-4 py-3 font-semibold">{money(r.balance)}</td>
                      <td className="px-4 py-3">
                        <Badge tone={st.tone}>{st.label}</Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {r.balance > 0 && (
                          <button className={tableAction} onClick={() => setPay(r.assignment.id)}>
                            Pay
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {rows.length === 0 && (
              <p className="px-5 py-8 text-center text-sm text-muted-foreground">
                {everything.days
                  ? "No assignments match these filters."
                  : "Not assigned to any shoot yet. Add them from a booking's Manage shoot window."}
              </p>
            )}
          </div>
        </section>

        <section>
          <h3 className="mb-3 text-xl">Payment history</h3>
          <div className={`${card} overflow-x-auto`}>
            <table className="w-full min-w-[620px] text-left text-sm">
              <thead className="border-b border-border bg-[#faf9f5]">
                <tr>
                  {["Date", "Shoot", "Amount", "Method", "Note", ""].map((h) => (
                    <th key={h} className={th}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/70">
                {s.payments.map((p) => (
                  <tr key={p.id}>
                    <td className="px-4 py-3 whitespace-nowrap">{formatDate(p.date)}</td>
                    <td className="px-4 py-3">
                      {data.bookings.find((b) => b.id === p.bookingId)?.event || "—"}
                    </td>
                    <td className="px-4 py-3 font-semibold text-emerald-700">{money(p.amount)}</td>
                    <td className="px-4 py-3">{p.method}</td>
                    <td className="px-4 py-3 text-muted-foreground">{p.note || "—"}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        className="rounded-lg p-2 text-rose-600 hover:bg-rose-50"
                        onClick={() => undo(p)}
                        aria-label={`Remove payment of ${money(p.amount)}`}
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {s.payments.length === 0 && (
              <p className="px-5 py-8 text-center text-sm text-muted-foreground">No payments recorded yet.</p>
            )}
          </div>
        </section>
      </div>
    </Modal>
    {pay !== null && (
      <TeamPayForm
        data={data}
        update={update}
        member={member}
        assignmentId={pay}
        onClose={() => setPay(null)}
      />
    )}
    </>
  );
}

function TeamPayForm({
  data,
  update,
  member,
  assignmentId,
  onClose,
}: {
  data: Platform;
  update: (d: Platform) => void;
  member: TeamMember;
  assignmentId: string;
  onClose: () => void;
}) {
  const due = memberStats(data, member.id).rows.filter((r) => r.balance > 0);
  const first = due.find((r) => r.assignment.id === assignmentId) || due[0];
  const [targetId, setTargetId] = useState(first?.assignment.id || "");
  const target = due.find((r) => r.assignment.id === targetId);
  const [f, setF] = useState({ amount: first?.balance || 0, date: today(), method: "UPI", note: "" });
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!target || f.amount <= 0 || f.amount > target.balance) {
      toast.error("Enter an amount up to the balance for that day.");
      return;
    }
    update({
      ...data,
      teamPayments: [
        ...data.teamPayments,
        {
          id: newId(),
          bookingId: target.booking.id,
          assignmentId: target.assignment.id,
          memberId: member.id,
          ...f,
        },
      ],
    });
    toast.success("Payment recorded");
    onClose();
  };
  return (
    <Modal title={`Pay ${member.name}`} onClose={onClose}>
      {due.length ? (
        <form onSubmit={submit} className="space-y-4">
          <Select
            label="Shoot day *"
            value={targetId}
            onChange={(e) => {
              setTargetId(e.target.value);
              const next = due.find((r) => r.assignment.id === e.target.value);
              setF({ ...f, amount: next?.balance || 0 });
            }}
          >
            {due.map((r) => (
              <option key={r.assignment.id} value={r.assignment.id}>
                {formatDate(r.assignment.date)} · {r.booking.event} · due {money(r.balance)}
              </option>
            ))}
          </Select>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Amount (₹) *"
              type="number"
              min="0.01"
              max={target?.balance}
              value={f.amount}
              onChange={(e) => setF({ ...f, amount: Number(e.target.value) })}
              required
            />
            <Input
              label="Date *"
              type="date"
              value={f.date}
              onChange={(e) => setF({ ...f, date: e.target.value })}
              required
            />
          </div>
          <Select label="Method" value={f.method} onChange={(e) => setF({ ...f, method: e.target.value })}>
            {payMethods.map((x) => (
              <option key={x}>{x}</option>
            ))}
          </Select>
          <Input label="Note" value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} />
          <FormActions onCancel={onClose} label="Record payment" />
        </form>
      ) : (
        <p className="text-sm text-muted-foreground">Nothing is outstanding for {member.name}.</p>
      )}
    </Modal>
  );
}

function TeamForm({
  data,
  update,
  onClose,
  existing,
}: {
  data: Platform;
  update: (d: Platform) => void;
  onClose: () => void;
  existing?: TeamMember | undefined;
}) {
  const [f, setF] = useState<TeamMember>(
    existing || { id: newId(), name: "", role: "Photographer", phone: "" },
  );
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!f.name.trim()) return;
    update({
      ...data,
      team: existing ? data.team.map((t) => (t.id === f.id ? f : t)) : [...data.team, f],
    });
    toast.success("Team member saved");
    onClose();
  };
  return (
    <Modal title={existing ? "Edit team member" : "Add team member"} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <Input
          label="Name *"
          value={f.name}
          onChange={(e) => setF({ ...f, name: e.target.value })}
          required
        />
        <Select label="Role" value={f.role} onChange={(e) => setF({ ...f, role: e.target.value })}>
          {teamRoles.map((x) => (
            <option key={x}>{x}</option>
          ))}
        </Select>
        <Input
          label="Phone"
          type="tel"
          value={f.phone}
          onChange={(e) => setF({ ...f, phone: e.target.value })}
        />
        <FormActions onCancel={onClose} label="Save member" />
      </form>
    </Modal>
  );
}
function StudioForm({
  studio,
  onSaved,
}: {
  studio: ReturnType<typeof getStudio>;
  onSaved: (s: ReturnType<typeof getStudio>) => void;
}) {
  const [f, setF] = useState(studio);
  const [saving, setSaving] = useState(false);
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!f.studioName?.trim()) {
      toast.error("Enter a studio name.");
      return;
    }
    setSaving(true);
    try {
      await updateStudio({
        name: f.studioName,
        logo: f.logo || "",
        city: f.city || "",
        state: f.state || "",
        business_type: f.businessType || "",
        gstin: f.gstin || "",
      });
      onSaved(saveStudio(f));
    } catch {
      toast.error("Could not update studio profile.");
    } finally {
      setSaving(false);
    }
  };
  return (
    <div className={`${card} max-w-3xl p-6 sm:p-8`}>
      <form onSubmit={submit} className="space-y-5">
        <div>
          <h2 className="text-2xl">Business details</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            These details appear on quotations and billing documents.
          </p>
        </div>
        <Input
          label="Studio name *"
          value={f.studioName || ""}
          onChange={(e) => setF({ ...f, studioName: e.target.value })}
          required
        />
        <label className="block">
          <Label>Studio logo</Label>
          <div className="flex flex-wrap items-center gap-4 rounded-xl border border-border bg-white p-4 sm:flex-nowrap">
            {f.logo ? (
              <img src={f.logo} alt="Studio logo" className="h-14 w-14 rounded-lg object-contain" />
            ) : (
              <span className="flex h-14 w-14 items-center justify-center rounded-lg bg-olive-soft font-display text-2xl text-olive">
                {f.studioName?.slice(0, 1) || "S"}
              </span>
            )}
            <input
              type="file"
              accept="image/*"
              className="min-w-0 flex-1 text-xs"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                if (!file.type.startsWith("image/") || file.size > 2_000_000) {
                  toast.error("Choose an image under 2 MB.");
                  return;
                }
                const reader = new FileReader();
                reader.onload = () =>
                  setF((current) => ({ ...current, logo: String(reader.result) }));
                reader.readAsDataURL(file);
              }}
            />
          </div>
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="City"
            value={f.city || ""}
            onChange={(e) => setF({ ...f, city: e.target.value })}
          />
          <Input
            label="State"
            value={f.state || ""}
            onChange={(e) => setF({ ...f, state: e.target.value })}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Select
            label="Business type"
            value={f.businessType || ""}
            onChange={(e) => setF({ ...f, businessType: e.target.value })}
          >
            <option value="">Select type</option>
            {["Wedding", "Portrait", "Commercial", "Events", "Other"].map((x) => (
              <option key={x}>{x}</option>
            ))}
          </Select>
          <Input
            label="GSTIN"
            value={f.gstin || ""}
            onChange={(e) => setF({ ...f, gstin: e.target.value.toUpperCase() })}
          />
        </div>
        <div className="rounded-xl bg-[#f7f8f4] p-4 text-sm">
          <strong>Account owner</strong>
          <p className="mt-1 text-muted-foreground">
            {f.ownerName} · {f.email}
          </p>
        </div>
        <button className={btn} disabled={saving}>
          {saving ? "Saving..." : "Save profile"}
        </button>
      </form>
    </div>
  );
}
function SettingsForm({ data, update }: { data: Platform; update: (d: Platform) => void }) {
  const [f, setF] = useState(data.settings);
  const submit = (e: FormEvent) => {
    e.preventDefault();
    update({ ...data, settings: f });
    toast.success("Settings saved");
  };
  return (
    <div className={`${card} max-w-3xl p-6 sm:p-8`}>
      <form onSubmit={submit} className="space-y-5">
        <div>
          <h2 className="text-2xl">Document defaults</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            New quotations use these values. Existing documents keep their own terms.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Select
            label="Currency"
            value={f.currency}
            onChange={(e) => setF({ ...f, currency: e.target.value })}
          >
            <option value="INR">Indian rupee (INR)</option>
          </Select>
        </div>
        <Input
          label="Document prefix"
          maxLength={8}
          value={f.invoicePrefix}
          onChange={(e) => setF({ ...f, invoicePrefix: e.target.value.toUpperCase() })}
        />
        <Textarea
          label="Default quotation terms"
          value={f.quoteTerms}
          onChange={(e) => setF({ ...f, quoteTerms: e.target.value })}
        />
        <button className={btn}>Save settings</button>
      </form>
      <div className="mt-8 border-t border-border pt-7">
        <h3 className="text-xl">Account</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          End this browser session when you are done.
        </p>
        <button
          type="button"
          className={`${secondary} mt-4`}
          onClick={() => {
            void logoutAccount().finally(() => {
              window.location.href = "/login";
            });
          }}
        >
          Log out
        </button>
      </div>
    </div>
  );
}

const assistRoles = ["Lead photographer", "Second shooter", "Videographer", "Assistant", "Editor", "Drone operator", "Other"];
const assistTone = { Paid: "green", "Partially paid": "amber", Unpaid: "neutral", Overdue: "red" } as const;
const noAssistFilters = { q: "", status: "All", role: "All", photographer: "All", from: "", to: "" };
const dateRange = (job: AssistJob) =>
  job.endDate && job.endDate !== job.date ? `${formatDate(job.date)} – ${formatDate(job.endDate)}` : formatDate(job.date);

function AssistSection({ data, open }: { data: Platform; open: (name: string, id?: string) => void }) {
  const [f, setF] = useState(noAssistFilters);
  const now = today();
  const jobs = data.assists;
  const photographers = [...new Set(jobs.map((j) => j.photographer))].sort();
  const rows = jobs
    .filter((j) => {
      const text = `${j.photographer} ${j.event} ${j.location} ${j.phone}`.toLowerCase();
      return (
        text.includes(f.q.toLowerCase()) &&
        (f.status === "All" || assistPayStatus(j, now) === f.status) &&
        (f.role === "All" || j.role === f.role) &&
        (f.photographer === "All" || j.photographer === f.photographer) &&
        (!f.from || (j.endDate || j.date) >= f.from) &&
        (!f.to || j.date <= f.to)
      );
    })
    .sort((a, b) => b.date.localeCompare(a.date));
  const sum = (list: AssistJob[], fn: (j: AssistJob) => number) => list.reduce((t, j) => t + fn(j), 0);
  const fee = (j: AssistJob) => Number(j.fee) || 0;
  const overdue = jobs.filter((j) => assistPayStatus(j, now) === "Overdue");
  const cards: [string, string, string, typeof Wallet][] = [
    ["Assisted shoots", String(jobs.length), `${jobs.filter((j) => j.date > now).length} upcoming`, Camera],
    ["Total fees", money(sum(jobs, fee)), `${photographers.length} photographers`, FileText],
    ["Received", money(sum(jobs, assistPaid)), `${jobs.filter((j) => assistBalance(j) <= 0).length} fully paid`, Wallet],
    ["Outstanding", money(sum(jobs, assistBalance)), `${jobs.filter((j) => assistBalance(j) > 0).length} shoots unpaid`, Wallet],
    ["Overdue", money(sum(overdue, assistBalance)), `${overdue.length} past due date`, CalendarDays],
  ];
  const filtering = JSON.stringify(f) !== JSON.stringify(noAssistFilters);
  return (
    <>
      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {cards.map(([label, value, note, Icon]) => (
          <div key={label} className={`${card} p-5`}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">{label}</span>
              <Icon size={18} className={label === "Overdue" && overdue.length ? "text-rose-600" : "text-olive"} />
            </div>
            <p className="mt-4 font-display text-3xl">{value}</p>
            <p className="mt-2 text-xs text-muted-foreground">{note}</p>
          </div>
        ))}
      </div>
      <div className={`${card} mb-5 p-4`}>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <label className="block sm:col-span-2 lg:col-span-3 xl:col-span-2">
            <Label>Search</Label>
            <input
              aria-label="Search assisted shoots"
              placeholder="Photographer, event or location..."
              className={fieldClass}
              value={f.q}
              onChange={(e) => setF({ ...f, q: e.target.value })}
            />
          </label>
          <Select label="Payment status" value={f.status} onChange={(e) => setF({ ...f, status: e.target.value })}>
            {["All", "Unpaid", "Partially paid", "Paid", "Overdue"].map((x) => <option key={x}>{x}</option>)}
          </Select>
          <Select label="Photographer" value={f.photographer} onChange={(e) => setF({ ...f, photographer: e.target.value })}>
            {["All", ...photographers].map((x) => <option key={x}>{x}</option>)}
          </Select>
          <Select label="Role" value={f.role} onChange={(e) => setF({ ...f, role: e.target.value })}>
            {["All", ...assistRoles].map((x) => <option key={x}>{x}</option>)}
          </Select>
          <div className="grid grid-cols-2 gap-2 sm:col-span-2 lg:col-span-3 xl:col-span-2">
            <Input label="Shoot from" type="date" value={f.from} onChange={(e) => setF({ ...f, from: e.target.value })} />
            <Input label="Shoot to" type="date" value={f.to} onChange={(e) => setF({ ...f, to: e.target.value })} />
          </div>
        </div>
        {filtering && (
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
            <span>
              {rows.length} of {jobs.length} shoots · Fees {money(sum(rows, fee))} · Received{" "}
              {money(sum(rows, assistPaid))} · Outstanding {money(sum(rows, assistBalance))}
            </span>
            <button className="font-semibold text-olive hover:underline" onClick={() => setF(noAssistFilters)}>
              Clear filters
            </button>
          </div>
        )}
      </div>
      <Table
        heads={["Shoot", "Photographer", "Dates", "Fee", "Received", "Balance", "Status", "Actions"]}
        filterKey={JSON.stringify(f)}
      >
        {rows.map((j) => {
          const status = assistPayStatus(j, now);
          return (
            <tr key={j.id}>
              <Td>
                <strong>{j.event}</strong>
                <span className="mt-1 block text-xs text-muted-foreground">
                  {j.role}
                  {j.location ? ` · ${j.location}` : ""}
                </span>
              </Td>
              <Td>
                {j.photographer}
                {j.phone && <span className="mt-1 block text-xs text-muted-foreground">{j.phone}</span>}
              </Td>
              <Td>
                {dateRange(j)}
                {j.dueDate && assistBalance(j) > 0 && (
                  <span className="mt-1 block text-xs text-muted-foreground">Due {formatDate(j.dueDate)}</span>
                )}
              </Td>
              <Td>{money(j.fee)}</Td>
              <Td className="text-emerald-700">{money(assistPaid(j))}</Td>
              <Td className="font-semibold">{money(assistBalance(j))}</Td>
              <Td>
                <Badge tone={assistTone[status]}>{status}</Badge>
              </Td>
              <Td>
                <button className={tableAction} onClick={() => open("assistDetail", j.id)}>
                  {assistBalance(j) > 0 ? "Payments" : "View"}
                </button>
              </Td>
            </tr>
          );
        })}
      </Table>
    </>
  );
}

function AssistForm({
  data,
  update,
  onClose,
  existing,
}: {
  data: Platform;
  update: (d: Platform) => void;
  onClose: () => void;
  existing?: AssistJob | undefined;
}) {
  const [f, setF] = useState({
    photographer: existing?.photographer || "",
    phone: existing?.phone || "",
    event: existing?.event || "",
    date: existing?.date || today(),
    endDate: existing?.endDate || "",
    location: existing?.location || "",
    role: existing?.role || assistRoles[1]!,
    fee: existing?.fee ?? 0,
    dueDate: existing?.dueDate || "",
    notes: existing?.notes || "",
  });
  const known = [...new Set(data.assists.map((a) => a.photographer))];
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (f.endDate && f.endDate < f.date) {
      toast.error("End date cannot be before the start date.");
      return;
    }
    if (f.fee < 0) {
      toast.error("Fee cannot be negative.");
      return;
    }
    const job: AssistJob = {
      ...f,
      photographer: f.photographer.trim(),
      event: f.event.trim(),
      id: existing?.id || newId(),
      payments: existing?.payments || [],
    };
    update({
      ...data,
      assists: existing ? data.assists.map((a) => (a.id === existing.id ? job : a)) : [...data.assists, job],
    });
    toast.success(existing ? "Shoot updated" : "Assisted shoot logged");
    onClose();
  };
  const remove = () => {
    if (!existing || !window.confirm("Delete this shoot and its payment records?")) return;
    update({ ...data, assists: data.assists.filter((a) => a.id !== existing.id) });
    toast.success("Shoot deleted");
    onClose();
  };
  return (
    <Modal title={existing ? "Edit assisted shoot" : "Log assisted shoot"} onClose={onClose} wide>
      <form onSubmit={submit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <Label>Photographer / studio *</Label>
            <input
              className={fieldClass}
              list="assist-photographers"
              value={f.photographer}
              onChange={(e) => setF({ ...f, photographer: e.target.value })}
              required
            />
            <datalist id="assist-photographers">
              {known.map((n) => <option key={n} value={n} />)}
            </datalist>
          </label>
          <Input label="Phone" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} />
          <Input label="Shoot / event *" value={f.event} onChange={(e) => setF({ ...f, event: e.target.value })} required />
          <Input label="Location" value={f.location} onChange={(e) => setF({ ...f, location: e.target.value })} />
          <Input label="Start date *" type="date" value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} required />
          <Input label="End date" type="date" value={f.endDate} min={f.date} onChange={(e) => setF({ ...f, endDate: e.target.value })} />
          <Select label="Your role" value={f.role} onChange={(e) => setF({ ...f, role: e.target.value })}>
            {assistRoles.map((x) => <option key={x}>{x}</option>)}
          </Select>
          <Input label="Agreed fee (₹) *" type="number" min="0" value={f.fee} onChange={(e) => setF({ ...f, fee: Number(e.target.value) })} required />
          <Input label="Payment due by" type="date" value={f.dueDate} onChange={(e) => setF({ ...f, dueDate: e.target.value })} />
        </div>
        <Textarea label="Notes" value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} />
        {existing && (
          <button type="button" className="inline-flex items-center gap-2 text-sm font-medium text-rose-700 hover:underline" onClick={remove}>
            <Trash2 size={15} /> Delete shoot
          </button>
        )}
        <FormActions onCancel={onClose} label={existing ? "Save changes" : "Log shoot"} />
      </form>
    </Modal>
  );
}

function AssistDetail({
  data,
  update,
  job,
  onClose,
  onEdit,
}: {
  data: Platform;
  update: (d: Platform) => void;
  job: AssistJob;
  onClose: () => void;
  onEdit: () => void;
}) {
  const balance = assistBalance(job);
  const status = assistPayStatus(job, today());
  const [p, setP] = useState({ amount: balance, date: today(), method: "UPI", note: "" });
  const save = (payments: AssistJob["payments"]) =>
    update({ ...data, assists: data.assists.map((a) => (a.id === job.id ? { ...a, payments } : a)) });
  const add = (e: FormEvent) => {
    e.preventDefault();
    if (p.amount <= 0 || p.amount > balance) {
      toast.error("Enter an amount up to the outstanding balance.");
      return;
    }
    save([...job.payments, { ...p, id: newId() }]);
    setP({ ...p, amount: Math.max(0, balance - p.amount), note: "" });
    toast.success("Payment recorded");
  };
  const history = [...job.payments].sort((a, b) => b.date.localeCompare(a.date));
  return (
    <Modal title={job.event} onClose={onClose} wide>
      <div className="space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-3 rounded-xl bg-olive-soft p-4 text-sm">
          <div>
            <strong>{job.photographer}</strong>
            {job.phone && <span className="ml-2 text-muted-foreground">{job.phone}</span>}
            <p className="mt-1 text-muted-foreground">
              {job.role} · {dateRange(job)}
              {job.location ? ` · ${job.location}` : ""}
            </p>
            {job.dueDate && <p className="text-muted-foreground">Payment due {formatDate(job.dueDate)}</p>}
          </div>
          <Badge tone={assistTone[status]}>{status}</Badge>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          {[["Fee", job.fee], ["Received", assistPaid(job)], ["Balance", balance]].map(([l, v]) => (
            <div key={String(l)} className={`${card} p-4`}>
              <p className="text-xs text-muted-foreground">{l}</p>
              <p className="mt-2 font-display text-2xl">{money(Number(v))}</p>
            </div>
          ))}
        </div>
        {job.notes && <p className="whitespace-pre-wrap text-sm text-muted-foreground">{job.notes}</p>}
        <div>
          <h3 className="mb-2 text-sm font-semibold">Payments received</h3>
          {history.length ? (
            <ul className="divide-y divide-border/70 rounded-xl border border-border bg-white text-sm">
              {history.map((x) => (
                <li key={x.id} className="flex items-center justify-between gap-3 px-4 py-3">
                  <span>
                    <strong className="text-emerald-700">{money(x.amount)}</strong>
                    <span className="ml-2 text-muted-foreground">
                      {formatDate(x.date)} · {x.method}
                      {x.note ? ` · ${x.note}` : ""}
                    </span>
                  </span>
                  <button
                    className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-rose-700"
                    aria-label="Delete payment"
                    onClick={() => {
                      if (window.confirm("Delete this payment record?")) save(job.payments.filter((y) => y.id !== x.id));
                    }}
                  >
                    <Trash2 size={15} />
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">No payments recorded yet.</p>
          )}
        </div>
        {balance > 0 && (
          <form onSubmit={add} className="space-y-3 rounded-xl border border-border bg-white p-4">
            <h3 className="text-sm font-semibold">Record payment</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <Input label="Amount (₹) *" type="number" min="0.01" max={balance} value={p.amount} onChange={(e) => setP({ ...p, amount: Number(e.target.value) })} required />
              <Input label="Date *" type="date" value={p.date} onChange={(e) => setP({ ...p, date: e.target.value })} required />
              <Select label="Method" value={p.method} onChange={(e) => setP({ ...p, method: e.target.value })}>
                {["UPI", "Bank transfer", "Cash", "Card", "Other"].map((x) => <option key={x}>{x}</option>)}
              </Select>
              <Input label="Note" value={p.note} onChange={(e) => setP({ ...p, note: e.target.value })} />
            </div>
            <button className={btn} type="submit">Record payment</button>
          </form>
        )}
        <div className="flex justify-end gap-2">
          <button className={secondary} onClick={onEdit}>Edit shoot</button>
          <button className={btn} onClick={onClose}>Done</button>
        </div>
      </div>
    </Modal>
  );
}
