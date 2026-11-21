import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import editing from "@/assets/editing.jpg";
import { AuthShell, Field, SubmitButton } from "@/components/auth-shell";
import { ApiError, confirmPasswordReset } from "@/lib/auth";

export const Route = createFileRoute("/reset-password")({
  head: () => ({ meta: [{ title: "Choose a new password — FrameFlow" }, { name: "description", content: "Set a new password for your FrameFlow account." }, { name: "robots", content: "noindex" }] }),
  component: ResetPassword,
});

function ResetPassword() {
  const nav = useNavigate();
  const [link, setLink] = useState<{ uid: string; token: string } | null>(null);
  const [linkMissing, setLinkMissing] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<{ password?: string; confirm?: string }>({});
  const [expired, setExpired] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const uid = params.get("uid");
    const token = params.get("token");
    if (uid && token) {
      setLink({ uid, token });
      // Keep the token out of the address bar, browser history and any analytics or referrer headers.
      window.history.replaceState(null, "", window.location.pathname);
    } else setLinkMissing(true);
  }, []);

  const submit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    const next: typeof errors = {};
    if (password.length < 8) next.password = "Use at least 8 characters";
    if (confirm !== password) next.confirm = "Passwords don't match";
    setErrors(next);
    if (Object.keys(next).length || !link) return;
    setLoading(true);
    try {
      await confirmPasswordReset(link.uid, link.token, password);
      toast.success("Password updated. Log in with your new password.");
      nav({ to: "/login" });
    } catch (error) {
      if (error instanceof ApiError && error.fields["password"]) setErrors({ password: error.fields["password"] });
      else if (error instanceof ApiError && error.status === 400) setExpired(true);
      else toast.error(error instanceof ApiError ? error.message : "Could not update your password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell image={editing} tagline="Back to your studio in a minute.">
      {expired || linkMissing ? (
        <div>
          <h1 className="text-4xl">{expired ? "This link has expired." : "This link is incomplete."}</h1>
          <p className="mt-3 text-muted-foreground">
            Reset links work once and expire after 1 hour. Request a new one and use the latest email we send.
          </p>
          <Link to="/forgot-password" className="mt-8 inline-flex w-full justify-center rounded-full bg-primary px-5 py-3 text-sm font-medium text-primary-foreground transition hover:bg-olive">
            Send a new link
          </Link>
          <div className="mt-4"><Link to="/login" className="text-sm text-olive">← Back to log in</Link></div>
        </div>
      ) : (
        <>
          <h1 className="text-4xl">Choose a new password.</h1>
          <p className="mt-2 text-sm text-muted-foreground">You'll be signed out on other devices after the change.</p>
          <form onSubmit={submit} className="mt-8 space-y-4" noValidate>
            <Field label="New password" type="password" autoComplete="new-password" placeholder="Min. 8 characters" value={password} onChange={(x) => setPassword(x.target.value)} error={errors.password} />
            <Field label="Confirm new password" type="password" autoComplete="new-password" value={confirm} onChange={(x) => setConfirm(x.target.value)} error={errors.confirm} />
            <SubmitButton loading={loading || !link}>Update password</SubmitButton>
          </form>
        </>
      )}
    </AuthShell>
  );
}
