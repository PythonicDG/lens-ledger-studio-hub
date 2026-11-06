import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteNav, SiteFooter } from "@/components/site";
import { PlanGrid, BillingToggle } from "@/components/plan-grid";
import { fetchPlanCatalog, yearlySavingPercent, type PlanCatalog } from "@/lib/billing";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing — FrameFlow" },
      { name: "description", content: "Simple INR pricing for solo photographers, wedding studios and production houses. 15-day free trial." },
      { property: "og:title", content: "FrameFlow pricing" },
      { property: "og:description", content: "Simple monthly or yearly plans. 15-day free trial, no card required." },
    ],
  }),
  component: Pricing,
});

const faqs = [
  ["Do invoices include GST?", "Yes. Add your GSTIN and every quotation and invoice is GST-compliant, with CGST/SGST/IGST split automatically."],
  ["Can I import my existing clients?", "Upload an Excel or Google Sheet and we'll map it for you. Our team helps on Studio and Collective plans."],
  ["Can I pay via UPI?", "Yes — UPI, cards, net banking and wallets, securely through Razorpay."],
  ["What happens when my plan ends?", "Nothing is deleted. Your workspace becomes read-only until you renew, and you can still view all your data."],
];

function Pricing() {
  const [billing, setBilling] = useState<"monthly" | "yearly">("yearly");
  const [catalog, setCatalog] = useState<PlanCatalog | null>(null);
  const [failed, setFailed] = useState(false);
  const nav = useNavigate();
  useEffect(() => {
    fetchPlanCatalog().then(setCatalog).catch(() => setFailed(true));
  }, []);
  const trialDays = catalog?.trial_days ?? 15;
  const questions = [["Is there a free trial?", `Yes — start with ${trialDays} days free and no card. Choose a plan when the trial ends.`], ...faqs];
  return (
    <div>
      <SiteNav />
      <section className="mx-auto max-w-7xl px-6 pb-24 pt-36">
        <div className="grid gap-8 lg:grid-cols-2 lg:items-end">
          <h1 className="text-5xl leading-tight sm:text-7xl">Priced for studios,<br /><em className="text-olive">not enterprises.</em></h1>
          <div className="lg:text-right">
            <p className="text-muted-foreground">One missed wedding enquiry costs more than a year of FrameFlow.</p>
            <div className="mt-6"><BillingToggle value={billing} onChange={setBilling} saving={catalog ? yearlySavingPercent(catalog.plans) : 0} /></div>
          </div>
        </div>
        <div className="mt-20">
          {catalog ? (
            <PlanGrid plans={catalog.plans} billing={billing} cta="Start free trial" onSelect={() => nav({ to: "/register" })} />
          ) : (
            <p className="text-center text-muted-foreground">{failed ? "Plans could not be loaded right now. Please refresh the page." : "Loading plans…"}</p>
          )}
        </div>
      </section>
      <section className="border-t border-border bg-secondary py-24">
        <div className="mx-auto grid max-w-6xl gap-12 px-6 md:grid-cols-[1fr_2fr]">
          <h2 className="text-4xl">Questions, answered.</h2>
          <dl className="divide-y divide-border">
            {questions.map(([q, a]) => (
              <div key={q} className="py-5"><dt className="font-medium">{q}</dt><dd className="mt-2 text-sm text-muted-foreground">{a}</dd></div>
            ))}
          </dl>
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}
