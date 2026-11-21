import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { SiteFooter, SiteNav } from "@/components/site";
import { BUSINESS, unfilledBusinessFields } from "@/lib/business";

export const LEGAL_LINKS = [
  { to: "/terms", label: "Terms & Conditions" },
  { to: "/privacy", label: "Privacy Policy" },
  { to: "/refund-policy", label: "Refund & Cancellation" },
  { to: "/delivery-policy", label: "Service Delivery" },
  { to: "/contact", label: "Contact us" },
] as const;

/** Readable long-form typography for policy text, without a typography plugin. */
const prose =
  "max-w-none text-[15px] leading-7 text-foreground/85 " +
  "[&_h2]:mt-12 [&_h2]:scroll-mt-28 [&_h2]:font-display [&_h2]:text-2xl [&_h2]:text-foreground " +
  "[&_h3]:mt-6 [&_h3]:font-semibold [&_h3]:text-foreground " +
  "[&_p]:mt-4 [&_ul]:mt-4 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-6 [&_ol]:mt-4 [&_ol]:list-decimal [&_ol]:space-y-2 [&_ol]:pl-6 " +
  "[&_a]:text-olive [&_a]:underline [&_a]:underline-offset-4 [&_strong]:text-foreground " +
  "[&_table]:mt-4 [&_table]:w-full [&_table]:text-sm [&_th]:border-b [&_th]:border-border [&_th]:py-2 [&_th]:pr-4 [&_th]:text-left [&_th]:font-semibold [&_td]:border-b [&_td]:border-border/60 [&_td]:py-2 [&_td]:pr-4 [&_td]:align-top";

export function LegalPage({
  title,
  intro,
  updated = true,
  children,
}: {
  title: string;
  intro?: ReactNode;
  updated?: boolean;
  children: ReactNode;
}) {
  const missing = import.meta.env.DEV ? unfilledBusinessFields() : [];
  return (
    <div className="bg-background">
      <SiteNav />
      <main className="mx-auto max-w-6xl px-6 pb-24 pt-32 sm:pt-36">
        {missing.length > 0 && (
          <div
            role="alert"
            className="mb-8 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900"
          >
            <strong>Development notice:</strong> fill these business details in{" "}
            <code>src/lib/business.ts</code> before going live: {missing.join(", ")}. This notice is
            not shown in production builds.
          </div>
        )}
        <div className="grid gap-12 lg:grid-cols-[220px_1fr]">
          <nav aria-label="Legal pages" className="order-2 lg:order-1">
            <p className="eyebrow text-muted-foreground">Legal & support</p>
            <ul className="mt-4 space-y-2 text-sm">
              {LEGAL_LINKS.map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="text-muted-foreground transition hover:text-foreground"
                    activeProps={{ className: "font-semibold text-foreground" }}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <article className="order-1 min-w-0 lg:order-2">
            <h1 className="text-4xl leading-tight sm:text-5xl">{title}</h1>
            {updated && (
              <p className="mt-3 text-sm text-muted-foreground">
                Last updated: {BUSINESS.policiesUpdated}
              </p>
            )}
            {intro && <div className="mt-6 max-w-3xl text-lg text-muted-foreground">{intro}</div>}
            <div className={`${prose} mt-8 max-w-3xl`}>{children}</div>
          </article>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

/** Contact block reused at the end of every policy. */
export function ContactBlock() {
  return (
    <ul>
      <li>
        <strong>Business:</strong> {BUSINESS.legalName} ({BUSINESS.entityType}), trading as{" "}
        {BUSINESS.brand}
      </li>
      <li>
        <strong>Address:</strong> {BUSINESS.address}
      </li>
      <li>
        <strong>Email:</strong>{" "}
        <a href={`mailto:${BUSINESS.supportEmail}`}>{BUSINESS.supportEmail}</a>
      </li>
      <li>
        <strong>Phone:</strong>{" "}
        <a href={`tel:${BUSINESS.phone.replace(/[^\d+]/g, "")}`}>{BUSINESS.phone}</a>
      </li>
    </ul>
  );
}

export const legalHead = (title: string, description: string) => ({
  meta: [
    { title: `${title} — ${BUSINESS.brand}` },
    { name: "description", content: description },
    { property: "og:title", content: `${title} — ${BUSINESS.brand}` },
    { property: "og:description", content: description },
  ],
});
