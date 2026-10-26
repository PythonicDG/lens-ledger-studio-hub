import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import portrait from "@/assets/portrait.jpg";
import { AuthShell, Field, SubmitButton } from "@/components/auth-shell";
import { getStudio } from "@/lib/flow";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Log in — FrameFlow" }, { name: "description", content: "Log in to your FrameFlow studio." }, { property: "og:title", content: "Log in to FrameFlow" }, { property: "og:description", content: "Access your studio dashboard." }] }),
  component: Login,
});

function Login() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [e, setE] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const submit = (ev: React.FormEvent) => {
    ev.preventDefault();
    const err: Record<string, string> = {};
    if (!/^\S+@\S+\.\S+$/.test(email)) err.email = "Enter a valid email";
    if (!pw) err.password = "Enter your password";
    setE(err);
    if (Object.keys(err).length) return;
    setLoading(true);
    setTimeout(() => {
      const s = getStudio();
      toast.success(`Welcome back${s.ownerName ? ", " + s.ownerName.split(" ")[0] : ""}`);
      nav({ to: s.studioName ? "/welcome" : "/setup" });
    }, 500);
  };

  return (
    <AuthShell image={portrait} quote="I used to spend Sunday nights on invoices. Now I spend them with my family." credit="Imran Shaikh · Lightbox Portraits, Hyderabad">
      <h1 className="text-4xl">Welcome back.</h1>
      <p className="mt-2 text-sm text-muted-foreground">New to FrameFlow? <Link to="/register" className="text-foreground underline underline-offset-4">Start free trial</Link></p>
      <form onSubmit={submit} className="mt-8 space-y-4" noValidate>
        <Field label="Email" type="email" placeholder="arjun@lenscraft.in" value={email} onChange={(x) => setEmail(x.target.value)} error={e.email} />
        <Field label="Password" type="password" value={pw} onChange={(x) => setPw(x.target.value)} error={e.password} />
        <div className="text-right"><Link to="/forgot-password" className="text-sm text-olive underline-offset-4 hover:underline">Forgot password?</Link></div>
        <SubmitButton loading={loading}>Log in</SubmitButton>
      </form>
    </AuthShell>
  );
}
