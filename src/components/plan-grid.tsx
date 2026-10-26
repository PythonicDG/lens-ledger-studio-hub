import { Check } from "lucide-react";
import { PLANS, inr } from "@/lib/flow";

export function PlanGrid({ billing, selected, onSelect, cta }: { billing: "monthly" | "yearly"; selected?: string; onSelect: (id: string) => void; cta: string }) {
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {PLANS.map((p) => {
        const featured = "featured" in p && p.featured;
        const active = selected === p.id;
        return (
          <div key={p.id} className={`relative flex flex-col rounded-md border p-8 transition ${featured ? "bg-ink text-ivory lg:-translate-y-4 border-ink" : "bg-card border-border"} ${active ? "ring-2 ring-olive" : ""}`}>
            {featured && <span className="absolute -top-3 left-8 rounded-full bg-ember px-3 py-1 text-[10px] uppercase tracking-widest text-ivory">Most studios pick this</span>}
            <p className="font-display text-3xl">{p.name}</p>
            <p className={`mt-1 text-sm ${featured ? "text-ivory/60" : "text-muted-foreground"}`}>{p.tagline}</p>
            <p className="mt-8 font-display text-5xl">{inr(billing === "yearly" ? p.yearly : p.monthly)}<span className="font-sans text-sm opacity-60"> /month</span></p>
            <p className="mt-1 text-xs opacity-60">{billing === "yearly" ? "billed annually · + GST" : "billed monthly · + GST"}</p>
            <ul className="mt-8 flex-1 space-y-3 text-sm">
              {p.features.map((f) => <li key={f} className="flex gap-2"><Check className={`mt-0.5 h-4 w-4 shrink-0 ${featured ? "text-gold" : "text-olive"}`} />{f}</li>)}
            </ul>
            <button onClick={() => onSelect(p.id)} className={`mt-8 rounded-full px-5 py-3 text-sm font-medium transition ${featured ? "bg-ivory text-ink hover:bg-gold" : "bg-primary text-primary-foreground hover:bg-olive"}`}>
              {active ? "Selected ✓" : cta}
            </button>
          </div>
        );
      })}
    </div>
  );
}

export function BillingToggle({ value, onChange }: { value: "monthly" | "yearly"; onChange: (v: "monthly" | "yearly") => void }) {
  return (
    <div className="inline-flex rounded-full border border-border bg-card p-1 text-sm">
      {(["monthly", "yearly"] as const).map((v) => (
        <button key={v} onClick={() => onChange(v)} className={`rounded-full px-5 py-2 capitalize transition ${value === v ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>
          {v}{v === "yearly" && <span className="ml-1 text-xs text-ember">−20%</span>}
        </button>
      ))}
    </div>
  );
}
