import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import hero from "@/assets/hero-wedding.jpg";
import { AuthShell } from "@/components/auth-shell";
import { ApiError, getAuthToken, startTrial } from "@/lib/auth";
import { getStudio, saveStudio } from "@/lib/flow";

export const Route = createFileRoute("/trial")({
  head: () => ({ meta: [{ title: "Start your free trial — FrameFlow" }, { name: "description", content: "Start your 14-day trial with no card required." }] }),
  component: Trial,
});

function Trial() {
  const nav = useNavigate();
  const [studioName, setStudioName] = useState("");
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    const studio = getStudio();
    if (!getAuthToken()) { nav({ to: "/login" }); return; }
    if (!studio.studioName) { nav({ to: "/setup" }); return; }
    setStudioName(studio.studioName);
  }, [nav]);

  const begin = async () => {
    setLoading(true);
    try {
      const result = await startTrial();
      saveStudio({ trialStartedAt: result.trial_started_at });
      toast.success("Your free trial has started");
      nav({ to: "/welcome" });
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Could not start your trial.");
    } finally { setLoading(false); }
  };

  return (
    <AuthShell image={hero} quote="Our enquiries finally have a home. We closed 9 extra weddings in our first season." credit="Priya Nair · Kochi Frames, Kerala" step={3}>
      <p className="eyebrow text-olive">Step 3 · free trial</p>
      <h1 className="mt-3 text-4xl">Your studio is ready.</h1>
      <p className="mt-4 text-muted-foreground">Start a 14-day free trial for {studioName || "your studio"}. No card required.</p>
      <p className="mt-3 text-sm text-muted-foreground">Choose a plan and add payment details when the trial ends.</p>
      <button type="button" onClick={begin} disabled={loading} className="mt-8 w-full rounded-full bg-primary px-5 py-3 text-sm font-medium text-primary-foreground transition hover:bg-olive disabled:opacity-60">{loading ? "Starting trial…" : "Start free trial"}</button>
    </AuthShell>
  );
}
