import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import bts from "@/assets/bts.jpg";
import { AuthShell, Field, SubmitButton, type Errs } from "@/components/auth-shell";
import { getAuthToken, createStudio, updateStudio, ApiError } from "@/lib/auth";
import { getStudio, saveStudio } from "@/lib/flow";

export const Route = createFileRoute("/setup")({
  head: () => ({ meta: [{ title: "Set up your studio — FrameFlow" }, { name: "description", content: "Add the finishing details for your studio." }] }),
  component: Setup,
});

const BUSINESS_TYPES = ["Wedding", "Portrait", "Commercial", "Events", "Other"];

function Setup() {
  const nav = useNavigate();
  const [studioName, setStudioName] = useState("");
  const [existingStudio, setExistingStudio] = useState(false);
  const [logo, setLogo] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [gstin, setGstin] = useState("");
  const [e, setE] = useState<Errs>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const s = getStudio();
    if (!getAuthToken()) { nav({ to: "/login" }); return; }
    setStudioName(s.studioName || "");
    setExistingStudio(Boolean(s.studioName));
    setLogo(s.logo || "");
    setCity(s.city || "");
    setState(s.state || "");
    setBusinessType(s.businessType || "");
    setGstin(s.gstin || "");
  }, [nav]);

  const chooseLogo = (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/") || file.size > 2_000_000) { toast.error("Choose an image under 2 MB."); return; }
    const reader = new FileReader();
    reader.onload = () => setLogo(String(reader.result));
    reader.readAsDataURL(file);
  };

  const continueToTrial = async (skipOptional = false) => {
    const err: Errs = {};
    if (studioName.trim().length < 2) err.studioName = "Please enter your studio name";
    if (!skipOptional && gstin && !/^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(gstin.trim().toUpperCase())) err.gstin = "Enter a valid GSTIN";
    setE(err);
    if (Object.keys(err).length) return;
    setLoading(true);
    try {
      const details = skipOptional ? { name: studioName.trim() } : { name: studioName.trim(), logo, city: city.trim(), state: state.trim(), business_type: businessType, gstin: gstin.trim().toUpperCase() };
      if (existingStudio) await updateStudio(details);
      else await createStudio(details);
      saveStudio(skipOptional ? { studioName: studioName.trim() } : { studioName: studioName.trim(), logo, city: city.trim(), state: state.trim(), businessType, gstin: gstin.trim().toUpperCase() });
      nav({ to: "/trial" });
    } catch (error) {
      if (error instanceof ApiError) { setE({ ...(error.fields["name"] ? { studioName: error.fields["name"] } : {}), ...(error.fields["gstin"] ? { gstin: error.fields["gstin"] } : {}) }); toast.error(error.message); }
      else toast.error("Could not save studio details.");
    } finally { setLoading(false); }
  };

  return (
    <AuthShell image={bts} quote="We onboarded our team of twelve in an afternoon." credit="Karan Sethi · Golden Hour Films, Jaipur" step={2}>
      <p className="eyebrow text-olive">Studio setup</p>
      <h1 className="mt-3 text-4xl">Make it yours.</h1>
      <p className="mt-2 text-sm text-muted-foreground">Name your studio. The other details can wait.</p>
      <form onSubmit={(ev) => { ev.preventDefault(); void continueToTrial(); }} className="mt-8 space-y-6" noValidate>
        <Field label="Studio name" placeholder="Lenscraft Studio" value={studioName} onChange={(ev) => setStudioName(ev.target.value)} error={e.studioName} />
        <label className="block">
          <span className="text-sm font-medium">Studio logo</span>
          <input type="file" accept="image/*" onChange={(ev) => chooseLogo(ev.target.files?.[0])} className="mt-2 block w-full max-w-full text-sm text-muted-foreground" />
          {logo && <img src={logo} alt="Studio logo preview" className="mt-3 h-20 w-20 rounded-md border border-border object-contain" />}
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="City" placeholder="Pune" value={city} onChange={(ev) => setCity(ev.target.value)} />
          <Field label="State" placeholder="Maharashtra" value={state} onChange={(ev) => setState(ev.target.value)} />
        </div>
        <div>
          <span className="text-sm font-medium">Business type</span>
          <div className="mt-2 flex flex-wrap gap-2">{BUSINESS_TYPES.map((type) => <button type="button" key={type} onClick={() => setBusinessType(type)} className={`rounded-full border px-4 py-2 text-sm transition ${businessType === type ? "border-olive bg-olive text-accent-foreground" : "border-border bg-card hover:border-foreground"}`}>{type}</button>)}</div>
        </div>
        <Field label="GSTIN (optional)" placeholder="27AAPFL1234C1Z5" value={gstin} onChange={(ev) => setGstin(ev.target.value)} error={e.gstin} />
        <SubmitButton loading={loading}>Continue to free trial</SubmitButton>
        <button type="button" disabled={loading} onClick={() => { void continueToTrial(true); }} className="w-full text-sm text-muted-foreground underline-offset-4 hover:underline">Skip optional details</button>
      </form>
    </AuthShell>
  );
}
