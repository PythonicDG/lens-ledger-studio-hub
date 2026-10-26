import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import bts from "@/assets/bts.jpg";
import { AuthShell, Field, SubmitButton } from "@/components/auth-shell";
import { getStudio, saveStudio } from "@/lib/flow";

export const Route = createFileRoute("/setup")({
  head: () => ({ meta: [{ title: "Set up your studio — FrameFlow" }, { name: "description", content: "Tell us about your photography studio." }, { property: "og:title", content: "Studio setup — FrameFlow" }, { property: "og:description", content: "Set up your studio in minutes." }] }),
  component: Setup,
});

const SPECS = ["Wedding", "Pre-wedding", "Maternity & baby", "Portraits", "Corporate", "Fashion", "Product", "Events"];
const TEAMS = ["Just me", "2–5", "6–15", "16+"];
const CITIES = ["Mumbai", "Pune", "Delhi NCR", "Bengaluru", "Hyderabad", "Chennai", "Kolkata", "Jaipur", "Ahmedabad", "Kochi"];

function Setup() {
  const nav = useNavigate();
  const [name, setName] = useState("");
  const [city, setCity] = useState("Pune");
  const [gstin, setGstin] = useState("");
  const [specs, setSpecs] = useState<string[]>(["Wedding"]);
  const [team, setTeam] = useState("2–5");
  const [e, setE] = useState<Record<string, string>>({});

  useEffect(() => {
    const s = getStudio();
    if (s.studioName) setName(s.studioName);
    if (s.city) setCity(s.city);
  }, []);

  const toggle = (s: string) => setSpecs(specs.includes(s) ? specs.filter((x) => x !== s) : [...specs, s]);
  const submit = (ev: React.FormEvent) => {
    ev.preventDefault();
    const err: Record<string, string> = {};
    if (name.trim().length < 2) err.name = "Enter your studio name";
    if (gstin && !/^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(gstin.toUpperCase())) err.gstin = "GSTIN looks invalid (e.g. 27AAPFL1234C1Z5)";
    if (!specs.length) err.specs = "Pick at least one";
    setE(err);
    if (Object.keys(err).length) return;
    saveStudio({ studioName: name, city, gstin: gstin.toUpperCase(), specialities: specs, teamSize: team });
    nav({ to: "/plan" });
  };

  const chip = (on: boolean) => `rounded-full border px-4 py-2 text-sm transition ${on ? "border-olive bg-olive text-accent-foreground" : "border-border bg-card hover:border-foreground"}`;

  return (
    <AuthShell image={bts} quote="We onboarded our team of twelve in an afternoon." credit="Karan Sethi · Golden Hour Films, Jaipur" step={2}>
      <p className="eyebrow text-olive">Studio setup</p>
      <h1 className="mt-3 text-4xl">Tell us about your studio.</h1>
      <form onSubmit={submit} className="mt-8 space-y-6" noValidate>
        <Field label="Studio name" placeholder="Lenscraft Studio" value={name} onChange={(x) => setName(x.target.value)} error={e.name} />
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm font-medium">City</span>
            <select value={city} onChange={(x) => setCity(x.target.value)} className="mt-1.5 w-full rounded-md border border-input bg-card px-3.5 py-2.5 text-sm outline-none focus:border-olive">
              {CITIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </label>
          <Field label="GSTIN (optional)" placeholder="27AAPFL1234C1Z5" value={gstin} onChange={(x) => setGstin(x.target.value)} error={e.gstin} />
        </div>
        <div>
          <span className="text-sm font-medium">What do you shoot?</span>
          <div className="mt-2 flex flex-wrap gap-2">{SPECS.map((s) => <button type="button" key={s} onClick={() => toggle(s)} className={chip(specs.includes(s))}>{s}</button>)}</div>
          {e.specs && <span className="mt-1 block text-xs text-destructive">{e.specs}</span>}
        </div>
        <div>
          <span className="text-sm font-medium">Team size</span>
          <div className="mt-2 flex flex-wrap gap-2">{TEAMS.map((t) => <button type="button" key={t} onClick={() => setTeam(t)} className={chip(team === t)}>{t}</button>)}</div>
        </div>
        <SubmitButton>Continue</SubmitButton>
      </form>
    </AuthShell>
  );
}
