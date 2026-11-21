import { createFileRoute } from "@tanstack/react-router";
import { ContactBlock, LegalPage, legalHead } from "@/components/legal-page";
import { BUSINESS } from "@/lib/business";

export const Route = createFileRoute("/delivery-policy")({
  head: () =>
    legalHead(
      "Service Delivery Policy",
      `${BUSINESS.brand} is an online service. How and when your plan is delivered.`,
    ),
  component: DeliveryPolicy,
});

function DeliveryPolicy() {
  const b = BUSINESS;
  return (
    <LegalPage
      title="Service Delivery Policy"
      intro={
        <p>
          {b.brand} is an online software service (SaaS). There are no physical goods and nothing is
          shipped. This page explains how and when you get access to what you pay for.
        </p>
      }
    >
      <h2>1. What is delivered</h2>
      <p>
        Access to the {b.brand} web application for your studio, with the features of your chosen
        plan, for the period you paid for (one month or one year). You use it in any modern web
        browser at <a href={b.website}>{b.website.replace(/^https?:\/\//, "")}</a>.
      </p>

      <h2>2. When access starts</h2>
      <ul>
        <li>
          <strong>Free trial:</strong> immediately after you verify your email address and set up
          your studio.
        </li>
        <li>
          <strong>Paid plans:</strong> instantly, as soon as your payment is confirmed. The plan and
          its dates appear in Settings → Subscription and the payment appears in Billing history. If
          you pay during your free trial, the paid period begins when the trial ends, so you lose no
          trial days.
        </li>
      </ul>

      <h2>3. Confirmation</h2>
      <p>
        Your payment confirmation and Razorpay payment reference are shown in the app straight after
        payment. Your bank or UPI app will also show the transaction.
      </p>

      <h2>4. If your plan does not activate</h2>
      <p>
        In rare cases (for example a bank delay) activation can take a few minutes. If your plan is
        still not active 30 minutes after a successful payment, contact us with the payment
        reference. We will activate it within 2 working days or refund you in full, as set out in
        our Refund & Cancellation Policy.
      </p>

      <h2>5. Delivery area</h2>
      <p>
        The service is offered to businesses in India and payments are accepted in Indian Rupees
        (₹).
      </p>

      <h2>6. Contact</h2>
      <ContactBlock />
    </LegalPage>
  );
}
