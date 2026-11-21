import { createFileRoute } from "@tanstack/react-router";
import { ContactBlock, LegalPage, legalHead } from "@/components/legal-page";
import { BUSINESS } from "@/lib/business";

export const Route = createFileRoute("/privacy")({
  head: () =>
    legalHead("Privacy Policy", `How ${BUSINESS.brand} collects, uses and protects personal data.`),
  component: Privacy,
});

function Privacy() {
  const b = BUSINESS;
  return (
    <LegalPage
      title="Privacy Policy"
      intro={
        <p>
          This policy explains what personal data {b.legalName} (“{b.brand}”, “we”) collects, why,
          who we share it with and the choices you have. It is written to comply with the Digital
          Personal Data Protection Act, 2023 and the Information Technology Act, 2000 and its rules.
        </p>
      }
    >
      <h2>1. Data we collect</h2>
      <h3>From you when you register and use {b.brand}</h3>
      <ul>
        <li>
          <strong>Account details:</strong> your name, email address, mobile number and password
          (stored only in encrypted, hashed form).
        </li>
        <li>
          <strong>Studio details:</strong> studio name, logo, city, state, business type and GSTIN
          if you add one.
        </li>
        <li>
          <strong>Workspace content:</strong> the services, packages, quotations, bookings, team
          members, payment records and notes you enter.
        </li>
        <li>
          <strong>Billing records:</strong> the plan you bought, amount, GST, dates and the order
          and payment reference numbers from Razorpay.{" "}
          <strong>We never receive or store your card number, CVV, UPI PIN or bank login.</strong>{" "}
          Those are handled entirely by Razorpay.
        </li>
        <li>
          <strong>Support messages:</strong> anything you send us by email or phone.
        </li>
      </ul>
      <h3>Collected automatically</h3>
      <ul>
        <li>
          <strong>Technical data:</strong> IP address, browser type and request logs kept by our
          servers for security and troubleshooting.
        </li>
        <li>
          <strong>Error reports:</strong> if the app crashes, technical details of the error (not
          your content) may be recorded so we can fix it.
        </li>
      </ul>
      <h3>About your clients</h3>
      <p>
        When you add your clients to {b.brand} (for example names, phone numbers, email addresses,
        event dates and venues), you decide what is collected and why. For that data we act on your
        behalf and use it only to provide the service to you. Your clients should contact you
        directly about their data; we will help you respond.
      </p>

      <h2>2. How we use data</h2>
      <ul>
        <li>to create and secure your account, including email verification;</li>
        <li>
          to run the features you use, such as generating PDFs and sending quotations by email or
          WhatsApp;
        </li>
        <li>to take payments, keep billing records and meet tax and accounting obligations;</li>
        <li>
          to send service emails such as trial-ending and renewal reminders and important changes;
        </li>
        <li>to answer support requests;</li>
        <li>to detect and prevent fraud, abuse and security incidents;</li>
        <li>to comply with law and respond to lawful requests from authorities.</li>
      </ul>
      <p>
        <strong>We do not sell personal data and do not use it for third-party advertising.</strong>
      </p>

      <h2>3. Legal basis</h2>
      <p>
        We process your data because you asked us to provide the service (by registering and using
        it), on the basis of your consent where required, and to comply with legal obligations. You
        can withdraw consent at any time by contacting us. Some features or the account itself may
        then stop working.
      </p>

      <h2>4. Who we share data with</h2>
      <p>We share only what each provider needs to perform its task for us:</p>
      <table>
        <thead>
          <tr>
            <th>Recipient</th>
            <th>Purpose</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Razorpay Software Pvt. Ltd.</td>
            <td>Processing subscription payments</td>
          </tr>
          <tr>
            <td>Meta Platforms (WhatsApp Business Platform)</td>
            <td>
              Delivering quotations to your clients on WhatsApp, only when you choose to send them
            </td>
          </tr>
          <tr>
            <td>Email delivery provider</td>
            <td>Sending verification, reminder and document emails</td>
          </tr>
          <tr>
            <td>Cloud hosting provider</td>
            <td>Storing data and running the service</td>
          </tr>
          <tr>
            <td>Government or law-enforcement authorities</td>
            <td>Only when required by law</td>
          </tr>
        </tbody>
      </table>
      <p>
        Quotation links you share with clients can be opened by anyone who has the link, and show
        the quotation details and your studio name.
      </p>

      <h2>5. Cookies and browser storage</h2>
      <p>
        {b.brand} does not use advertising or tracking cookies. To work, the app stores in your
        browser your sign-in token (removed when you close the browser or log out) and a working
        copy of your studio data so the app stays fast. The Razorpay payment window may set its own
        cookies to process payments securely.
      </p>

      <h2>6. How long we keep data</h2>
      <ul>
        <li>Account, studio and workspace data: while your account exists.</li>
        <li>
          After you ask us to delete your account: removed within 30 days, except billing records,
          which Indian tax law requires us to keep for up to 8 years.
        </li>
        <li>Server logs: up to 180 days.</li>
      </ul>

      <h2>7. Security</h2>
      <p>
        We use HTTPS encryption for all traffic, hashed passwords, access controls and signed
        verification of payment results. No system is completely secure. If a breach affects your
        personal data, we will notify you and the authorities as required by law.
      </p>

      <h2>8. Your rights</h2>
      <p>Under Indian data protection law you can ask us to:</p>
      <ul>
        <li>tell you what personal data we hold about you and how it is used;</li>
        <li>correct or complete inaccurate data;</li>
        <li>erase your data (subject to legal retention requirements);</li>
        <li>
          nominate another person to exercise these rights if you die or become incapacitated.
        </li>
      </ul>
      <p>
        Write to <a href={`mailto:${b.supportEmail}`}>{b.supportEmail}</a> from your registered
        email address. We will respond within 30 days.
      </p>

      <h2>9. Children</h2>
      <p>
        {b.brand} is a business tool for adults. We do not knowingly collect data from anyone under
        18 as a user of the service.
      </p>

      <h2>10. Changes to this policy</h2>
      <p>
        We will post any changes here with a new “Last updated” date and notify you by email or in
        the app if the changes are significant.
      </p>

      <h2>11. Grievance Officer</h2>
      <p>
        For any complaint or concern about your personal data, contact our Grievance Officer. We
        acknowledge complaints within 24 hours and aim to resolve them within 15 days.
      </p>
      <ul>
        <li>
          <strong>Name:</strong> {b.grievanceOfficer}
        </li>
        <li>
          <strong>Email:</strong> <a href={`mailto:${b.grievanceEmail}`}>{b.grievanceEmail}</a>
        </li>
        <li>
          <strong>Address:</strong> {b.address}
        </li>
      </ul>
      <p>
        If you are not satisfied with our response, you may complain to the Data Protection Board of
        India.
      </p>

      <h2>12. Contact</h2>
      <ContactBlock />
    </LegalPage>
  );
}
