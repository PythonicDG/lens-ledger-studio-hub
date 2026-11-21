import { createFileRoute, Link } from "@tanstack/react-router";
import { ContactBlock, LegalPage, legalHead } from "@/components/legal-page";
import { BUSINESS } from "@/lib/business";

export const Route = createFileRoute("/refund-policy")({
  head: () =>
    legalHead(
      "Refund & Cancellation Policy",
      `How cancellations and refunds work for ${BUSINESS.brand} plans.`,
    ),
  component: RefundPolicy,
});

function RefundPolicy() {
  const b = BUSINESS;
  return (
    <LegalPage
      title="Refund & Cancellation Policy"
      intro={
        <p>
          {b.brand} plans are prepaid and never renew automatically, so you are only charged when
          you choose to pay. This page explains when you can get your money back and how long it
          takes.
        </p>
      }
    >
      <h2>1. Free trial</h2>
      <p>
        The free trial needs no card and no payment. Nothing is charged when it ends, so there is
        nothing to cancel.
      </p>

      <h2>2. Cancelling a paid plan</h2>
      <p>
        There is no automatic renewal and no mandate on your card or UPI. To cancel, simply don’t
        renew: your plan stays active until the end of the period you paid for, after which the
        workspace becomes read-only. You will not be charged again. If you also want your account
        deleted, email us at <a href={`mailto:${b.supportEmail}`}>{b.supportEmail}</a>.
      </p>

      <h2>3. When you get a full refund</h2>
      <ul>
        <li>
          <strong>Duplicate payment:</strong> you were charged twice for the same purchase.
        </li>
        <li>
          <strong>Payment taken but plan not activated:</strong> money left your account but your
          plan did not become active and we cannot activate it within 2 working days.
        </li>
        <li>
          <strong>Paid during the trial:</strong> you bought a plan while your free trial was still
          running and ask for a refund before the paid period starts (paid time begins only when the
          trial ends).
        </li>
        <li>
          <strong>Service discontinued:</strong> if we permanently discontinue {b.brand}, we refund
          the unused part of any paid period on a pro-rata basis.
        </li>
      </ul>
      <p>Refunds are for the full amount you paid for the eligible purchase.</p>

      <h2>4. What is not refundable</h2>
      <ul>
        <li>
          A paid period that has already started, in whole or in part, except as listed above.
        </li>
        <li>
          Unused days of a previous plan when you switch to a different plan (the app tells you this
          before you pay).
        </li>
        <li>
          Periods during which your account was suspended for breaching our{" "}
          <Link to="/terms">Terms</Link>.
        </li>
      </ul>

      <h2>5. How to request a refund</h2>
      <ol>
        <li>
          Email <a href={`mailto:${b.supportEmail}`}>{b.supportEmail}</a> from your registered email
          address within 30 days of the payment.
        </li>
        <li>
          Include your studio name and the payment reference shown in Settings → Subscription →
          Billing history (it starts with <code>pay_</code>).
        </li>
        <li>We confirm whether the refund is approved within 2 working days.</li>
      </ol>

      <h2>6. Refund timelines</h2>
      <table>
        <thead>
          <tr>
            <th>Step</th>
            <th>Time</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>We initiate an approved refund</td>
            <td>Within 2 working days of approval</td>
          </tr>
          <tr>
            <td>Money reaches your original payment method (UPI, card, net banking or wallet)</td>
            <td>Usually 5–7 working days after initiation, depending on your bank</td>
          </tr>
        </tbody>
      </table>
      <p>
        Refunds are always made to the original payment method. We cannot refund to a different
        account or in cash.
      </p>

      <h2>7. Failed payments</h2>
      <p>
        If a payment fails but money was debited from your account, it is normally reversed
        automatically by your bank or Razorpay within 5–7 working days. If it is not, contact us
        with the payment reference and we will follow it up for you.
      </p>

      <h2>8. Contact</h2>
      <ContactBlock />
    </LegalPage>
  );
}
