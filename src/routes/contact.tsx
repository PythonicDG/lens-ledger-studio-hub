import { createFileRoute, Link } from "@tanstack/react-router";
import { Clock, Mail, MapPin, Phone, ShieldCheck } from "lucide-react";
import type { ReactNode } from "react";
import { LegalPage, legalHead } from "@/components/legal-page";
import { BUSINESS } from "@/lib/business";

export const Route = createFileRoute("/contact")({
  head: () =>
    legalHead(
      "Contact us",
      `Reach ${BUSINESS.brand} support for help with your account, billing or refunds.`,
    ),
  component: Contact,
});

function Item({ icon, label, children }: { icon: ReactNode; label: string; children: ReactNode }) {
  return (
    <div className="flex gap-4 rounded-2xl border border-border bg-card p-5">
      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary text-olive">
        {icon}
      </span>
      <div className="min-w-0">
        <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </div>
        <div className="mt-1 break-words text-[15px] text-foreground">{children}</div>
      </div>
    </div>
  );
}

function Contact() {
  const b = BUSINESS;
  const tel = b.phone.replace(/[^\d+]/g, "");
  return (
    <LegalPage
      title="Contact us"
      updated={false}
      intro={
        <p>Questions about your account, a payment or a refund? We reply within one working day.</p>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Item icon={<Mail size={17} />} label="Email support">
          <a href={`mailto:${b.supportEmail}`}>{b.supportEmail}</a>
        </Item>
        <Item icon={<Phone size={17} />} label="Phone / WhatsApp">
          <a href={`tel:${tel}`}>{b.phone}</a>
        </Item>
        <Item icon={<Clock size={17} />} label="Support hours">
          {b.supportHours}
        </Item>
        <Item icon={<MapPin size={17} />} label="Registered address">
          {b.address}
        </Item>
      </div>

      <h2>Business details</h2>
      <ul>
        <li>
          <strong>Legal name:</strong> {b.legalName}
        </li>
        <li>
          <strong>Type of business:</strong> {b.entityType}
        </li>
        <li>
          <strong>Brand:</strong> {b.brand}
        </li>
        {b.gstin && (
          <li>
            <strong>GSTIN:</strong> {b.gstin}
          </li>
        )}
      </ul>

      <h2>Billing and refunds</h2>
      <p>
        Write from your registered email address and include the payment reference from Settings →
        Subscription → Billing history (it starts with <code>pay_</code>). See our{" "}
        <Link to="/refund-policy">Refund & Cancellation Policy</Link> for what is refundable and how
        long it takes.
      </p>

      <h2>
        <span className="inline-flex items-center gap-2">
          <ShieldCheck size={20} className="text-olive" /> Privacy and grievances
        </span>
      </h2>
      <p>
        Grievance Officer: {b.grievanceOfficer},{" "}
        <a href={`mailto:${b.grievanceEmail}`}>{b.grievanceEmail}</a>. We acknowledge complaints
        within 24 hours and aim to resolve them within 15 days. See our{" "}
        <Link to="/privacy">Privacy Policy</Link>.
      </p>
    </LegalPage>
  );
}
