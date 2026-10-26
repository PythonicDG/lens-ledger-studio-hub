import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { SiteNav, SiteFooter } from "@/components/site";
import { PlanGrid, BillingToggle } from "@/components/plan-grid";
import { saveStudio } from "@/lib/flow";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing — FrameFlow" },
      { name: "description", content: "Simple INR pricing for solo photographers, wedding studios and production houses. 14-day free trial." },
      { property: "og:title", content: "FrameFlow pricing" },
      { property: "og:description", content: "Plans from ₹799/month. 14-day free trial, no card required." },
    ],
  }),
  component: Pricing,
});

const faqs = [
  ["Is there a free trial?", "Yes — 14 days on any plan, no card needed."],
  ["Do invoices include GST?", "Yes. Add your GSTIN and every quotation and invoice is GST-compliant, with CGST/SGST/IGST split automatically."],
  ["Can I import my existing clients?", "Upload an Excel or Google Sheet and we'll map it for you. Our team helps on Studio and Collective plans."],
  ["Can I pay via UPI?", "Yes — UPI, cards, net banking and annual invoices for businesses."],
];

function Pricing() {
  const [billing, setBilling] = useState<"monthly" | "yearly">("yearly");
  const nav = useNavigate();
  return (
    <div>
      <SiteNav />
      <section className="mx-auto max-w-7xl px-6 pb-24 pt-36">
        <div className="grid gap-8 lg:grid-cols-2 lg:items-end">
          <h1 className="text-5xl leading-tight sm:text-7xl">Priced for studios,<br /><em className="text-olive">not enterprises.</em></h1>
          <div className="lg:text-right">
            <p className="text-muted-foreground">One missed wedding enquiry costs more than a year of FrameFlow.</p>
            <div className="mt-6"><BillingToggle value={billing} onChange={setBilling} /></div>
          </div>
        </div>
        <div className="mt-20">
          <PlanGrid billing={billing} cta="Start free trial" onSelect={(id) => { saveStudio({ plan: id, billing }); nav({ to: "/register" }); }} />
        </div>
      </section>
      <section className="border-t border-border bg-secondary py-24">
        <div className="mx-auto grid max-w-6xl gap-12 px-6 md:grid-cols-[1fr_2fr]">
          <h2 className="text-4xl">Questions, answered.</h2>
          <dl className="divide-y divide-border">
            {faqs.map(([q, a]) => (
              <div key={q} className="py-5"><dt className="font-medium">{q}</dt><dd className="mt-2 text-sm text-muted-foreground">{a}</dd></div>
            ))}
          </dl>
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}
