import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Logo } from "@/components/site";
import { PlanGrid, BillingToggle } from "@/components/plan-grid";
import { getStudio, saveStudio, PLANS } from "@/lib/flow";

export const Route = createFileRoute("/plan")({
  head: () => ({ meta: [{ title: "Choose your plan — FrameFlow" }, { name: "description", content: "Pick the FrameFlow plan that fits your studio." }, { property: "og:title", content: "Choose a FrameFlow plan" }, { property: "og:description", content: "Start your trial on any plan." }] }),
  component: PlanPage,
});

function PlanPage() {
  const nav = useNavigate();
  const [billing, setBilling] = useState<"monthly" | "yearly">("yearly");
  const [plan, setPlan] = useState("studio");
  const [studio, setStudio] = useState("");
  useEffect(() => {
    const s = getStudio();
    if (s.plan) setPlan(s.plan);
    if (s.billing) setBilling(s.billing);
    setStudio(s.studioName || "");
  }, []);
  const go = () => {
    saveStudio({ plan, billing });
    toast.success(`${PLANS.find((p) => p.id === plan)?.name} trial started`);
    nav({ to: "/welcome" });
  };
  return (
    <div className="min-h-screen">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
        <Logo />
        <div className="flex items-center gap-2">
          {[1, 2, 3, 4].map((s) => <span key={s} className={`h-1 w-8 rounded-full ${s <= 3 ? "bg-olive" : "bg-border"}`} />)}
          <span className="ml-2 text-xs text-muted-foreground">Step 3 of 4</span>
        </div>
      </div>
      <div className="mx-auto max-w-7xl px-6 pb-20 pt-8 animate-rise">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="eyebrow text-olive">Free for 14 days · cancel anytime</p>
            <h1 className="mt-3 text-4xl sm:text-5xl">Pick a plan for {studio ? <em>{studio}</em> : "your studio"}.</h1>
          </div>
          <BillingToggle value={billing} onChange={setBilling} />
        </div>
        <div className="mt-14"><PlanGrid billing={billing} selected={plan} onSelect={setPlan} cta="Choose plan" /></div>
        <div className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-border pt-8">
          <p className="text-sm text-muted-foreground">You won't be charged until your trial ends. Switch plans anytime.</p>
          <button onClick={go} className="rounded-full bg-primary px-8 py-3.5 text-sm font-medium text-primary-foreground transition hover:bg-olive">Start free trial →</button>
        </div>
      </div>
    </div>
  );
}
