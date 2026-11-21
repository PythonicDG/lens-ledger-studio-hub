import { createFileRoute, Link } from "@tanstack/react-router";
import { ContactBlock, LegalPage, legalHead } from "@/components/legal-page";
import { BUSINESS } from "@/lib/business";

export const Route = createFileRoute("/terms")({
  head: () =>
    legalHead("Terms & Conditions", `The terms that apply when you use ${BUSINESS.brand}.`),
  component: Terms,
});

function Terms() {
  const b = BUSINESS;
  return (
    <LegalPage
      title="Terms & Conditions"
      intro={
        <p>
          These terms are an agreement between you and {b.legalName} (“{b.brand}”, “we”, “us”).
          Please read them carefully. By creating an account or using {b.brand} you agree to them.
        </p>
      }
    >
      <h2>1. Who we are</h2>
      <p>
        {b.brand} is an online studio-management service for photographers and photography studios,
        operated by {b.legalName}, a {b.entityType.toLowerCase()} with its address at {b.address}.
        {b.gstin && <> GSTIN: {b.gstin}.</>}
      </p>

      <h2>2. Your account</h2>
      <ul>
        <li>
          You must be at least 18 years old and use {b.brand} for your business or profession.
        </li>
        <li>Give accurate details when you register and keep them up to date.</li>
        <li>
          Keep your password confidential. You are responsible for everything done through your
          account. Tell us immediately at <a href={`mailto:${b.supportEmail}`}>{b.supportEmail}</a>{" "}
          if you suspect unauthorised use.
        </li>
        <li>
          One free trial is allowed per business. We may refuse or close accounts created to obtain
          repeat trials.
        </li>
      </ul>

      <h2>3. The service</h2>
      <p>
        {b.brand} lets you manage clients, quotations, bookings, shoots, team members and payment
        records, and send quotations, invoices and receipts to your clients by link, email or
        WhatsApp. We continually improve the service and may add, change or remove features. We will
        give reasonable notice before removing a feature that is central to a paid plan.
      </p>
      <p>
        We aim to keep {b.brand} available at all times but do not guarantee uninterrupted or
        error-free operation. Planned maintenance will, where possible, be done outside Indian
        business hours.
      </p>

      <h2>4. Free trial</h2>
      <p>
        New studios get a free trial (currently 15 days) with full access. No card or payment
        details are needed to start it and you are never charged automatically when it ends. After
        the trial, your workspace becomes read-only: you can still sign in and view your data, but
        you need a paid plan to add or change anything.
      </p>

      <h2>5. Plans, prices and payment</h2>
      <ul>
        <li>
          Current plans and prices are listed on our <Link to="/pricing">pricing page</Link> and
          inside the app under Settings → Subscription. Prices are in Indian Rupees (₹).
          {b.gstin
            ? " GST is charged in addition at the applicable rate and shown before you pay."
            : ""}
        </li>
        <li>
          Plans are <strong>prepaid</strong> for one month or one year. Payments are processed
          securely by our payment partner, Razorpay; we never see or store your card, UPI or bank
          login details.
        </li>
        <li>
          <strong>There is no automatic renewal.</strong> We will remind you by email before your
          plan ends, and you renew only if you choose to pay again. Renewing the same plan early
          adds the new period after the current one ends.
        </li>
        <li>
          If you switch to a different plan while a paid period is still running, the new plan
          starts immediately and the unused days of the previous plan are not carried over. The app
          shows this before you pay.
        </li>
        <li>
          We may change prices for future purchases. A change never affects a period you have
          already paid for.
        </li>
      </ul>

      <h2>6. When a plan ends</h2>
      <p>
        If you do not renew, your paid features continue for a short grace period (currently 3 days)
        after the end date. After that your workspace becomes read-only until you renew. Your data
        is not deleted because a plan ends.
      </p>

      <h2>7. Cancellation and refunds</h2>
      <p>
        Because plans do not renew automatically, you can stop at any time simply by not renewing.
        Refunds are governed by our <Link to="/refund-policy">Refund & Cancellation Policy</Link>.
      </p>

      <h2>8. Your content and your clients’ data</h2>
      <ul>
        <li>
          You own the information you put into {b.brand} (“your content”), including your clients’
          details. You give us permission to store, process and transmit it only as needed to
          provide the service to you.
        </li>
        <li>
          For the personal data of your clients, you decide why and how it is used, and we process
          it on your behalf. You are responsible for having a lawful basis, including any consent
          required, to store your clients’ data and to contact them by email or WhatsApp.
        </li>
        <li>
          Quotation links you share can be opened by anyone who has the link. Share them only with
          the intended client.
        </li>
        <li>You can ask us at any time for a copy of your content or to delete your account.</li>
      </ul>

      <h2>9. Acceptable use</h2>
      <p>You agree not to:</p>
      <ul>
        <li>use {b.brand} for anything unlawful, fraudulent or misleading;</li>
        <li>send spam or unsolicited messages to people who have not dealt with your business;</li>
        <li>upload content that infringes someone else’s rights or contains malware;</li>
        <li>
          attempt to access other users’ data, probe or disrupt our systems, or bypass usage or
          payment limits;
        </li>
        <li>copy, resell or reverse-engineer the service except as allowed by law.</li>
      </ul>

      <h2>10. Third-party services</h2>
      <p>
        Some features rely on third parties, such as Razorpay for payments, Meta’s WhatsApp Business
        Platform for WhatsApp messages and email providers for email delivery. Their own terms and
        policies also apply to those parts. We are not responsible for outages or decisions of those
        providers, though we will help you resolve any issue.
      </p>

      <h2>11. Our intellectual property</h2>
      <p>
        The {b.brand} software, design, name and logo belong to {b.legalName}. These terms give you
        a limited, non-exclusive, non-transferable right to use the service for your business while
        your account is in good standing.
      </p>

      <h2>12. Suspension and termination</h2>
      <p>
        You may close your account at any time by writing to us. We may suspend or close an account
        that breaches these terms, is used for fraud or abuse, or where required by law. Where
        reasonable, we will warn you first and give you a chance to fix the issue and export your
        data.
      </p>

      <h2>13. Disclaimers</h2>
      <p>
        {b.brand} is provided “as is” and “as available”. Tax and GST figures in quotations and
        invoices are calculated from the information you enter; you remain responsible for checking
        them and for your own tax compliance. {b.brand} does not give legal, tax or accounting
        advice.
      </p>

      <h2>14. Limitation of liability</h2>
      <p>
        To the extent permitted by law, we are not liable for indirect or consequential losses such
        as lost profits, lost bookings or lost data that could have been avoided by keeping your own
        copies. Our total liability for any claim relating to the service is limited to the amount
        you paid us in the 12 months before the claim arose. Nothing in these terms limits liability
        that cannot be limited under Indian law.
      </p>

      <h2>15. Indemnity</h2>
      <p>
        You agree to compensate us for losses caused by your breach of these terms or by content you
        upload, including claims by your clients about how you used their data.
      </p>

      <h2>16. Changes to these terms</h2>
      <p>
        We may update these terms. We will post the new version here with a new “Last updated” date
        and, for significant changes, notify you by email or in the app at least 15 days in advance.
        Continuing to use {b.brand} after the change means you accept the updated terms.
      </p>

      <h2>17. Governing law and disputes</h2>
      <p>
        These terms are governed by the laws of India. We encourage you to contact us first so we
        can try to resolve any issue informally. Courts in {b.jurisdiction} have exclusive
        jurisdiction over disputes.
      </p>

      <h2>18. Contact</h2>
      <ContactBlock />
    </LegalPage>
  );
}
