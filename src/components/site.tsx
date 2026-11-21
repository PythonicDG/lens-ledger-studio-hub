import { Link } from "@tanstack/react-router";
import { BUSINESS } from "@/lib/business";

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
          <Link to="/contact" className={c}>Contact</Link>
          <Link to="/login" className={c}>Log in</Link>
        </nav>
        <Link to="/register" className="rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition hover:bg-olive">
          Start free trial
        </Link>
      </div>
    </header>
  );
}

const FOOTER_COLUMNS: { heading: string; links: { label: string; href: string }[] }[] = [
  {
    heading: "Product",
    links: [
      { label: "Features", href: "/#features" },
      { label: "Workflow", href: "/#workflow" },
      { label: "Pricing", href: "/pricing" },
      { label: "Start free trial", href: "/register" },
    ],
  },
  {
    heading: "Support",
    links: [
      { label: "Contact us", href: "/contact" },
      { label: "Log in", href: "/login" },
    ],
  },
  {
    heading: "Legal",
    links: [
      { label: "Terms & Conditions", href: "/terms" },
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Refund & Cancellation", href: "/refund-policy" },
      { label: "Service Delivery", href: "/delivery-policy" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="bg-ink text-ivory">
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-16 md:grid-cols-[2fr_1fr_1fr_1fr]">
        <div>
          <Logo light />
          <p className="mt-4 max-w-xs text-sm text-ivory/60">Studio management software for India's photographers. Made in Pune.</p>
          <address className="mt-6 space-y-1 text-sm not-italic text-ivory/60">
            <p>{BUSINESS.address}</p>
            <p>
              <a href={`mailto:${BUSINESS.supportEmail}`} className="hover:text-ivory">{BUSINESS.supportEmail}</a>
              {" · "}
              <a href={`tel:${BUSINESS.phone.replace(/[^\d+]/g, "")}`} className="hover:text-ivory">{BUSINESS.phone}</a>
            </p>
          </address>
        </div>
        {FOOTER_COLUMNS.map((column) => (
          <nav key={column.heading} aria-label={column.heading}>
            <p className="eyebrow text-gold">{column.heading}</p>
            <ul className="mt-4 space-y-2 text-sm text-ivory/70">
              {column.links.map((link) => (
                <li key={link.href}>
                  <a href={link.href} className="transition hover:text-ivory">{link.label}</a>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="border-t border-ivory/10 py-6 text-center text-xs text-ivory/40">
        © {new Date().getFullYear()} {BUSINESS.legalName}. {BUSINESS.brand} is a brand of {BUSINESS.legalName}.
        {BUSINESS.gstin && <> GSTIN {BUSINESS.gstin}.</>}
      </div>
    </footer>
  );
}
