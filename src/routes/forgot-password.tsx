import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { MailCheck } from "lucide-react";
import { toast } from "sonner";
import editing from "@/assets/editing.jpg";
import { AuthShell, Field, SubmitButton } from "@/components/auth-shell";
import { ApiError, requestPasswordReset } from "@/lib/auth";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({ meta: [{ title: "Reset password — FrameFlow" }, { name: "description", content: "Reset your FrameFlow password." }, { property: "og:title", content: "Reset your FrameFlow password" }, { property: "og:description", content: "Get a reset link by email." }] }),
  component: Forgot,
});

function Forgot() {
  const [email, setEmail] = useState("");
  const [err, setErr] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email)) return setErr("Enter a valid email");
    setErr("");
    setLoading(true);
    try {
      await requestPasswordReset(email.trim());
      setSent(true);
    } catch (error) {
      if (error instanceof ApiError && error.fields["email"]) setErr(error.fields["email"]);
      else toast.error(error instanceof ApiError && error.status === 429 ? "Too many attempts. Please try again later." : error instanceof ApiError ? error.message : "Could not send the reset link.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell image={editing} tagline="Back to your studio in a minute.">
      {sent ? (
        <div>
          <MailCheck className="h-10 w-10 text-olive" />
          <h1 className="mt-6 text-4xl">Check your inbox.</h1>
          <p className="mt-3 text-muted-foreground">
            If an account exists for <span className="font-medium text-foreground">{email}</span>, we've sent a link to reset your password. It works once and expires in 1 hour.
          </p>
          <p className="mt-3 text-sm text-muted-foreground">Not there? Check your spam folder, or make sure you used the email you signed up with.</p>
          <button onClick={() => setSent(false)} className="mt-8 text-sm underline underline-offset-4">Use a different email</button>
          <div className="mt-4"><Link to="/login" className="text-sm text-olive">← Back to log in</Link></div>
        </div>
      ) : (
        <>
          <h1 className="text-4xl">Forgot your password?</h1>
          <p className="mt-2 text-sm text-muted-foreground">Enter your account email and we'll send you a reset link.</p>
          <form onSubmit={submit} className="mt-8 space-y-4" noValidate>
            <Field label="Email" type="email" autoComplete="email" placeholder="arjun@lenscraft.in" value={email} onChange={(x) => setEmail(x.target.value)} error={err} />
            <SubmitButton loading={loading}>Send reset link</SubmitButton>
          </form>
          <Link to="/login" className="mt-6 inline-block text-sm text-olive">← Back to log in</Link>
        </>
      )}
    </AuthShell>
  );
}
