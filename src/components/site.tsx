import { Link } from "@tanstack/react-router";

export function Logo({ light = false }: { light?: boolean }) {
  return (
    <Link to="/" className={`flex items-baseline gap-1 font-display text-2xl tracking-tight ${light ? "text-ivory" : "text-foreground"}`}>
      Frame<span className="italic text-olive">flow</span>
      <span className="ml-1 h-1.5 w-1.5 rounded-full bg-ember" />
    </Link>
  );
}

export function SiteNav({ light = false }: { light?: boolean }) {
  const c = light ? "text-ivory/80 hover:text-ivory" : "text-muted-foreground hover:text-foreground";
  return (
    <header className="absolute inset-x-0 top-0 z-30">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
        <Logo light={light} />
        <nav className="hidden items-center gap-8 text-sm md:flex">
          <a href="/#features" className={c}>Product</a>
          <a href="/#workflow" className={c}>Workflow</a>
          <Link to="/pricing" className={c}>Pricing</Link>
          <Link to="/login" className={c}>Log in</Link>
        </nav>
        <Link to="/register" className="rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition hover:bg-olive">
          Start free trial
        </Link>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="bg-ink text-ivory">
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-16 md:grid-cols-[2fr_1fr_1fr_1fr]">
        <div>
          <Logo light />
          <p className="mt-4 max-w-xs text-sm text-ivory/60">The operating system for India's photography studios. Made in Pune.</p>
        </div>
        {[
          ["Product", ["Quotations", "Bookings", "Billing & GST"]],
          ["Studios", ["Wedding", "Maternity & baby", "Corporate", "Fashion"]],
          ["Company", ["About", "Careers", "Support", "Privacy"]],
        ].map(([h, items]) => (
          <div key={h as string}>
            <p className="eyebrow text-gold">{h as string}</p>
            <ul className="mt-4 space-y-2 text-sm text-ivory/70">
              {(items as string[]).map((i) => <li key={i}>{i}</li>)}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-ivory/10 py-6 text-center text-xs text-ivory/40">© 2026 FrameFlow Technologies Pvt. Ltd.</div>
    </footer>
  );
}
