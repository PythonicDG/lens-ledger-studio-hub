import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import hero from "@/assets/hero-wedding.jpg";
import { Logo } from "@/components/site";
import { getStudio, PLANS, type Studio } from "@/lib/flow";

export const Route = createFileRoute("/welcome")({
  head: () => ({ meta: [{ title: "Welcome to FrameFlow" }, { name: "description", content: "Your studio's getting-started checklist." }, { property: "og:title", content: "Welcome to FrameFlow" }, { property: "og:description", content: "Get your studio running in a few steps." }] }),
  component: Welcome,
});

const TASKS: [string, string, string, string][] = [
  ["profile", "Add your studio logo & brand colours", "Shows on quotations, invoices and galleries.", "2 min"],
  ["package", "Create your first package", "e.g. “Royal Wedding — 3 days, 2 photographers, 1 cinematographer — ₹3,50,000”", "4 min"],
  ["import", "Import existing clients", "Upload your Excel or Google Sheet of past clients.", "3 min"],
  ["team", "Invite your team", "Photographers, editors and freelancers get their own logins.", "2 min"],
  ["whatsapp", "Connect WhatsApp Business", "Send quotes and payment reminders from FrameFlow.", "3 min"],
  ["enquiry", "Log your first enquiry", "Try it: Sneha & Varun, wedding, 12 Dec, Lonavala.", "1 min"],
];

function Welcome() {
  const [s, setS] = useState<Studio>({});
  const [done, setDone] = useState<string[]>([]);
  useEffect(() => {
    setS(getStudio());
    try { setDone(JSON.parse(localStorage.getItem("frameflow.checklist") || "[]")); } catch { /* ignore */ }
  }, []);
  const toggle = (id: string) => {
    const next = done.includes(id) ? done.filter((d) => d !== id) : [...done, id];
    setDone(next);
    localStorage.setItem("frameflow.checklist", JSON.stringify(next));
  };
  const pct = Math.round((done.length / TASKS.length) * 100);
  const plan = PLANS.find((p) => p.id === s.plan);
  const first = s.ownerName?.split(" ")[0] || "there";

  return (
    <div className="min-h-screen">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
        <Logo />
        <span className="rounded-full bg-olive-soft px-3 py-1 text-xs text-olive">{plan?.name ?? "Studio"} trial · 14 days left</span>
      </div>
      <div className="mx-auto grid max-w-7xl gap-12 px-6 pb-20 pt-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="animate-rise">
          <p className="eyebrow text-olive">Step 4 of 4 · You're in</p>
          <h1 className="mt-3 text-5xl leading-tight sm:text-6xl">Namaste, {first}.<br /><em className="text-ember">Let's get {s.studioName || "your studio"} rolling.</em></h1>
          <div className="mt-10 flex items-center gap-4">
            <div className="h-2 flex-1 rounded-full bg-muted"><div className="h-2 rounded-full bg-olive transition-all" style={{ width: `${pct}%` }} /></div>
            <span className="text-sm font-medium">{done.length}/{TASKS.length} done</span>
          </div>
          <ol className="mt-8 divide-y divide-border border-y border-border">
            {TASKS.map(([id, t, d, time], i) => {
              const on = done.includes(id);
              return (
                <li key={id}>
                  <button onClick={() => toggle(id)} className="flex w-full items-start gap-5 py-5 text-left transition hover:bg-secondary/60">
                    <span className={`mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border ${on ? "border-olive bg-olive text-accent-foreground" : "border-foreground/30 font-display text-sm italic"}`}>
                      {on ? <Check className="h-4 w-4" /> : i + 1}
                    </span>
                    <span className="flex-1">
                      <span className={`block font-medium ${on ? "text-muted-foreground line-through" : ""}`}>{t}</span>
                      <span className="mt-1 block text-sm text-muted-foreground">{d}</span>
                    </span>
                    <span className="text-xs text-muted-foreground">{time}</span>
                  </button>
                </li>
              );
            })}
          </ol>
        </div>
        <aside className="relative">
          <img src={hero} alt="" width={1024} height={1280} className="aspect-[4/5] w-full rounded-sm object-cover shadow-print" />
          <div className="absolute -bottom-6 left-6 right-6 rounded-md bg-card p-5 shadow-print">
            <p className="eyebrow text-muted-foreground">Your studio</p>
            <p className="mt-1 font-display text-2xl">{s.studioName || "Lenscraft Studio"}</p>
            <p className="text-sm text-muted-foreground">{s.city || "Pune"} · {(s.specialities || ["Wedding"]).join(", ")} · Team {s.teamSize || "2–5"}</p>
            {s.gstin && <p className="mt-1 text-xs text-muted-foreground">GSTIN {s.gstin}</p>}
          </div>
        </aside>
      </div>
    </div>
  );
}
