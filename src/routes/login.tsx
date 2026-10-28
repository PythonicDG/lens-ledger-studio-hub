import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import portrait from "@/assets/portrait.jpg";
import { AuthShell, Field, SubmitButton, type Errs } from "@/components/auth-shell";
import { ApiError, fetchStudio, loginAccount } from "@/lib/auth";
import { replaceStudio } from "@/lib/flow";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Log in — FrameFlow" }, { name: "description", content: "Log in to your FrameFlow studio." }, { property: "og:title", content: "Log in to FrameFlow" }, { property: "og:description", content: "Access your studio dashboard." }] }),
  component: Login,
});

function Login() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [e, setE] = useState<Errs>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const verification = new URLSearchParams(window.location.search).get("verification");
    if (verification === "success") toast.success("Email verified. Log in to set up your studio.");
    if (verification === "invalid") toast.error("Verification link is invalid or expired.");
  }, []);

  const submit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    const err: Errs = {};
    if (!/^\S+@\S+\.\S+$/.test(email)) err.email = "Enter a valid email";
    if (!pw) err.password = "Enter your password";
    setE(err);
    if (Object.keys(err).length) return;
    setLoading(true);
    try {
      const user = await loginAccount(email.trim(), pw);
      let studio;
      try { studio = await fetchStudio(); }
      catch (error) {
        if (!(error instanceof ApiError) || error.status !== 404) throw error;
        replaceStudio({ ownerName: user.full_name, email: user.email, phone: user.phone });
        toast.success(`Welcome, ${user.full_name.split(" ")[0]}`);
        nav({ to: "/setup" });
        return;
      }
      replaceStudio({ ownerName: user.full_name, email: user.email, phone: user.phone, studioName: studio.name, logo: studio.logo, city: studio.city, state: studio.state, businessType: studio.business_type, gstin: studio.gstin, ...(studio.trial_started_at ? { trialStartedAt: studio.trial_started_at } : {}) });
      toast.success(`Welcome back, ${user.full_name.split(" ")[0]}`);
      setPw("");
      nav({ to: studio.trial_started_at ? "/welcome" : "/setup" });
    } catch (error) {
      if (error instanceof ApiError) {
        const fields: Errs = {};
        if (error.fields["email"]) fields.email = error.fields["email"];
        if (error.fields["password"]) fields.password = error.fields["password"];
        setE(fields);
        toast.error(error.message);
      } else toast.error("Something went wrong.");
    } finally {
      setLoading(false);
    }
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
