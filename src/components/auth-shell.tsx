import type { ReactNode } from "react";
import { Logo } from "./site";

export function AuthShell({ image, quote, credit, step, children }: { image: string; quote: string; credit: string; step?: number; children: ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[1fr_1.1fr]">
      <div className="relative hidden overflow-hidden bg-ink lg:block">
        <img src={image} alt="" className="absolute inset-0 h-full w-full object-cover opacity-90" />
        <div className="absolute inset-0 bg-fade" />
        <div className="relative flex h-full flex-col justify-between p-10">
          <Logo light />
          <blockquote className="max-w-md text-ivory">
            <p className="font-display text-3xl italic leading-snug">“{quote}”</p>
            <footer className="mt-4 text-sm text-ivory/70">{credit}</footer>
          </blockquote>
        </div>
      </div>
      <div className="flex flex-col px-6 py-8 sm:px-12">
        <div className="flex items-center justify-between lg:justify-end">
          <div className="lg:hidden"><Logo /></div>
          {step && (
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4].map((s) => (
                <span key={s} className={`h-1 w-8 rounded-full ${s <= step ? "bg-olive" : "bg-border"}`} />
              ))}
              <span className="ml-2 text-xs text-muted-foreground">Step {step} of 4</span>
            </div>
          )}
        </div>
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-10 animate-rise">{children}</div>
      </div>
    </div>
  );
}

export function Field({ label, error, ...props }: { label: string; error?: string | undefined } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="text-sm font-medium">{label}</span>
      <input
        {...props}
        className={`mt-1.5 w-full rounded-md border bg-card px-3.5 py-2.5 text-sm outline-none transition focus:border-olive focus:ring-2 focus:ring-ring/30 ${error ? "border-destructive" : "border-input"}`}
      />
      {error && <span className="mt-1 block text-xs text-destructive">{error}</span>}
    </label>
  );
}

export function SubmitButton({ children, loading }: { children: ReactNode; loading?: boolean }) {
  return (
    <button type="submit" disabled={loading} className="w-full rounded-full bg-primary px-5 py-3 text-sm font-medium text-primary-foreground transition hover:bg-olive disabled:opacity-60">
      {loading ? "Please wait…" : children}
    </button>
  );
}
export type Errs = Partial<Record<"name" | "email" | "phone" | "password" | "gstin" | "specs", string>>;
