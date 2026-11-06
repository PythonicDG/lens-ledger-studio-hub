import { CalendarDays, IndianRupee, FileText, Users, LayoutGrid } from "lucide-react";

const bookings = [
  {
    c: "Aditi & Rohan",
    t: "Wedding · Udaipur",
    d: "14 Nov",
    s: "Advance paid",
    tone: "bg-olive-soft text-olive",
  },
  {
    c: "Meera Iyer",
    t: "Maternity · Studio",
    d: "16 Nov",
    s: "Quote sent",
    tone: "bg-gold/25 text-wine",
  },
  {
    c: "Kapoor Family",
    t: "Pre-wedding · Goa",
    d: "21 Nov",
    s: "Balance due",
    tone: "bg-ember/15 text-ember",
  },
  {
    c: "Tata Elxsi",
    t: "Corporate · Pune",
    d: "24 Nov",
    s: "Confirmed",
    tone: "bg-olive-soft text-olive",
  },
];

export function DashboardMock() {
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card text-card-foreground shadow-print">
      <div className="flex items-center gap-1.5 border-b border-border bg-muted px-4 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-ember/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-gold/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-olive/70" />
        <span className="ml-3 text-[11px] text-muted-foreground">
          app.frameflow.in / lenscraft-studio
        </span>
      </div>
      <div className="grid grid-cols-[52px_1fr] sm:grid-cols-[160px_1fr]">
        <aside className="bg-sidebar p-3 text-sidebar-foreground">
          <p className="hidden font-display text-sm sm:block">Lenscraft</p>
          <ul className="mt-4 space-y-1 text-xs">
            {[
              [LayoutGrid, "Overview"],
              [FileText, "Quotations"],
              [CalendarDays, "Shoots"],
              [IndianRupee, "Billing"],
              [Users, "Team"],
            ].map(([I, l], i) => {
              const Icon = I as typeof FileText;
              return (
                <li
                  key={l as string}
                  className={`flex items-center gap-2 rounded px-2 py-1.5 ${i === 0 ? "bg-sidebar-accent text-sidebar-primary" : ""}`}
                >
                  <Icon className="h-3.5 w-3.5 shrink-0" />{" "}
                  <span className="hidden sm:inline">{l as string}</span>
                </li>
              );
            })}
          </ul>
        </aside>
        <div className="p-4 sm:p-5">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-[11px] text-muted-foreground">Wedding season · November</p>
              <p className="font-display text-lg">Good evening, Arjun</p>
            </div>
            <span className="rounded-full bg-primary px-3 py-1 text-[11px] text-primary-foreground">
              + New quotation
            </span>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2">
            {[
              ["Revenue", "₹18.4L", "+22%"],
              ["Pending dues", "₹3.2L", "6 clients"],
              ["Profit margin", "41%", "+5 pts"],
            ].map(([a, b, c]) => (
              <div key={a} className="rounded border border-border p-2.5">
                <p className="text-[10px] text-muted-foreground">{a}</p>
                <p className="font-display text-base sm:text-xl">{b}</p>
                <p className="text-[10px] text-olive">{c}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 flex h-16 items-end gap-1">
            {[30, 45, 38, 60, 52, 75, 68, 90, 82, 70, 95, 88].map((h, i) => (
              <div
                key={i}
                className={`flex-1 rounded-t-sm ${i > 8 ? "bg-ember" : "bg-olive/60"}`}
                style={{ height: `${h}%` }}
              />
            ))}
          </div>
          <p className="mt-4 eyebrow text-muted-foreground">Upcoming shoots</p>
          <ul className="mt-2 divide-y divide-border text-xs">
            {bookings.map((b) => (
              <li key={b.c} className="flex items-center justify-between py-2">
                <div>
                  <p className="font-medium">{b.c}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {b.t} · {b.d}
                  </p>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-[10px] ${b.tone}`}>{b.s}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
