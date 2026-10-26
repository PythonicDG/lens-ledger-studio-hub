import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { MailCheck } from "lucide-react";
import editing from "@/assets/editing.jpg";
import { AuthShell, Field, SubmitButton } from "@/components/auth-shell";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({ meta: [{ title: "Reset password — FrameFlow" }, { name: "description", content: "Reset your FrameFlow password." }, { property: "og:title", content: "Reset your FrameFlow password" }, { property: "og:description", content: "Get a reset link by email." }] }),
  component: Forgot,
});

function Forgot() {
  const [email, setEmail] = useState("");
  const [err, setErr] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const submit = (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email)) return setErr("Enter a valid email");
    setErr("");
    setLoading(true);
    setTimeout(() => { setLoading(false); setSent(true); }, 600);
  };
  return (
    <AuthShell image={editing} quote="Deadlines used to live in my head. Now the whole team can see them." credit="Neha Kulkarni · Saffron Stories, Mumbai">
      {sent ? (
        <div>
          <MailCheck className="h-10 w-10 text-olive" />
          <h1 className="mt-6 text-4xl">Check your inbox.</h1>
          <p className="mt-3 text-muted-foreground">We've sent a reset link to <span className="font-medium text-foreground">{email}</span>. It expires in 30 minutes.</p>
          <button onClick={() => setSent(false)} className="mt-8 text-sm underline underline-offset-4">Use a different email</button>
          <div className="mt-4"><Link to="/login" className="text-sm text-olive">← Back to log in</Link></div>
        </div>
      ) : (
        <>
          <h1 className="text-4xl">Forgot your password?</h1>
          <p className="mt-2 text-sm text-muted-foreground">Enter your account email and we'll send you a reset link.</p>
          <form onSubmit={submit} className="mt-8 space-y-4" noValidate>
            <Field label="Email" type="email" placeholder="arjun@lenscraft.in" value={email} onChange={(x) => setEmail(x.target.value)} error={err} />
            <SubmitButton loading={loading}>Send reset link</SubmitButton>
          </form>
          <Link to="/login" className="mt-6 inline-block text-sm text-olive">← Back to log in</Link>
        </>
      )}
    </AuthShell>
  );
}
