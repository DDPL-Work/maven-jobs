import { FiRefreshCcw, FiCreditCard, FiCheckCircle, FiXCircle, FiMail } from "react-icons/fi";
import LegalLayout from "./LegalLayout";

export default function RefundPolicy() {
  return (
    <LegalLayout
      icon={FiRefreshCcw}
      title="Refund & Cancellation Policy"
      updated="1 August 2026"
      intro="This policy outlines the refund and cancellation terms applicable to premium services purchased on the Maven Jobs Platform by candidates and employers."
    >
      <section className="legal-section">
        <h2 className="legal-h2"><FiCreditCard /> 1. General Principles</h2>
        <ul className="legal-list">
          <li>All premium products are billed in advance, at the prices displayed at the time of purchase.</li>
          <li>Refunds are processed only through the original payment method, within 7–10 business days of approval.</li>
          <li>Refund eligibility is determined by the specific product terms in this policy and the date of purchase.</li>
          <li>Taxes and applicable charges are non-refundable once a transaction has been completed.</li>
        </ul>
      </section>

      <section className="legal-section">
        <h2 className="legal-h2"><FiCheckCircle /> 2. Candidate Premium Services</h2>
        <h3 className="legal-h3">2.1 Resume & career services (Resume Builder, Resume Critiques, Resume Display)</h3>
        <ul className="legal-list">
          <li><strong>Full refund:</strong> Within 7 days of purchase, if the service has not been delivered or initiated.</li>
          <li><strong>No refund:</strong> After the service has been delivered (e.g., resume document generated, critique report delivered, or visibility window activated).</li>
        </ul>
        <h3 className="legal-h3">2.2 Subscriptions (Maven Pro & Premium plans)</h3>
        <ul className="legal-list">
          <li><strong>Cancellation:</strong> You may cancel auto-renewal at any time from your account settings; the plan remains active until the end of the current billing period.</li>
          <li><strong>Refund:</strong> Unused portions of a subscription are not refundable after the start of the billing period, except where required by applicable law.</li>
        </ul>
      </section>

      <section className="legal-section">
        <h2 className="legal-h2"><FiCreditCard /> 3. Employer Products</h2>
        <ul className="legal-list">
          <li><strong>Job postings:</strong> Refundable within 48 hours of purchase if the job posting has not gone live. Once live, no refunds are available; unused posting slots cannot be transferred.</li>
          <li><strong>Resdex / talent search subscriptions:</strong> Refundable within 7 days of purchase if no searches or contact unlocks have been used.</li>
          <li><strong>Hiring automation & specialist services:</strong> Custom engagements are billed as per the signed agreement; refunds for such services are governed by the agreement terms.</li>
        </ul>
      </section>

      <section className="legal-section">
        <h2 className="legal-h2"><FiXCircle /> 4. Non-Refundable Cases</h2>
        <ul className="legal-list">
          <li>Services that have been fully or partially delivered, including generated documents and activated visibility.</li>
          <li>Transactions disputed due to buyer's remorse after the free-cancellation window has lapsed.</li>
          <li>Discounts, credits, or promotional vouchers, once applied.</li>
          <li>Duplicate payments will, however, always be refunded in full upon verification.</li>
        </ul>
      </section>

      <section className="legal-section">
        <h2 className="legal-h2"><FiMail /> 5. How to Request a Refund</h2>
        <ul className="legal-list">
          <li>Email us at <a href="mailto:billing@mavenjobs.in">billing@mavenjobs.in</a> with your registered email, order/transaction ID, and the reason for the request.</li>
          <li>Claims must be raised within the timelines specified above; requests raised later will be reviewed on a case-by-case basis.</li>
          <li>We will respond within 2 business days and process eligible refunds within 7–10 business days of approval.</li>
        </ul>
        <div className="legal-note">
          For complaints that are not resolved to your satisfaction, you may escalate using the process described on
          our <a href="/maven-jobs/grievance">Grievance Redressal</a> page.
        </div>
      </section>
    </LegalLayout>
  );
}