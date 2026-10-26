import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import hero from "@/assets/hero-wedding.jpg";
import { AuthShell, Field, SubmitButton } from "@/components/auth-shell";
import { saveStudio } from "@/lib/flow";

export const Route = createFileRoute("/register")({
  head: () => ({ meta: [{ title: "Create your studio account — FrameFlow" }, { name: "description", content: "Start your 14-day FrameFlow free trial." }, { property: "og:title", content: "Join FrameFlow" }, { property: "og:description", content: "Start your 14-day free trial." }] }),
  component: Register,
});

function Register() {
  const nav = useNavigate();
  const [f, setF] = useState({ name: "", email: "", phone: "", password: "" });
  const [e, setE] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const set = (k: string) => (ev: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: ev.target.value });

  const submit = (ev: React.FormEvent) => {
    ev.preventDefault();
    const err: Record<string, string> = {};
    if (f.name.trim().length < 2) err.name = "Please enter your full name";
    if (!/^\S+@\S+\.\S+$/.test(f.email)) err.email = "Enter a valid email";
    if (!/^[6-9]\d{9}$/.test(f.phone.replace(/\D/g, "").slice(-10))) err.phone = "Enter a 10-digit Indian mobile number";
    if (f.password.length < 8) err.password = "At least 8 characters";
    setE(err);
    if (Object.keys(err).length) return;
    setLoading(true);
    setTimeout(() => {
      saveStudio({ ownerName: f.name, email: f.email, phone: f.phone });
      toast.success("Account created — let's set up your studio");
      nav({ to: "/setup" });
    }, 600);
  };

  return (
    <AuthShell image={hero} quote="Our enquiries finally have a home. We closed 9 extra weddings in our first season." credit="Priya Nair · Kochi Frames, Kerala" step={1}>
      <p className="eyebrow text-olive">14-day free trial</p>
      <h1 className="mt-3 text-4xl">Create your studio account</h1>
      <p className="mt-2 text-sm text-muted-foreground">Already have one? <Link to="/login" className="text-foreground underline underline-offset-4">Log in</Link></p>
      <form onSubmit={submit} className="mt-8 space-y-4" noValidate>
        <Field label="Full name" placeholder="Arjun Mehta" value={f.name} onChange={set("name")} error={e.name} />
        <Field label="Work email" type="email" placeholder="arjun@lenscraft.in" value={f.email} onChange={set("email")} error={e.email} />
        <Field label="Mobile (WhatsApp)" type="tel" placeholder="98220 41567" value={f.phone} onChange={set("phone")} error={e.phone} />
        <Field label="Password" type="password" placeholder="Min. 8 characters" value={f.password} onChange={set("password")} error={e.password} />
        <SubmitButton loading={loading}>Create account</SubmitButton>
        <p className="text-center text-xs text-muted-foreground">By continuing you agree to our Terms and Privacy Policy.</p>
      </form>
    </AuthShell>
  );
}
