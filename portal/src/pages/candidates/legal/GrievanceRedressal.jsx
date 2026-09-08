import { FiMail, FiMapPin, FiPhone, FiClock, FiShield, FiUserCheck } from "react-icons/fi";
import LegalLayout from "./LegalLayout";

export default function GrievanceRedressal() {
  return (
    <LegalLayout
      icon={FiShield}
      title="Grievance Redressal"
      updated="1 August 2026"
      intro="Maven Jobs is committed to addressing user concerns promptly and fairly. This page explains how to raise a complaint and provides the contact details of our Grievance Officer and Data Protection Officer, as required under the Information Technology Act, 2000 and the Digital Personal Data Protection Act, 2023."
    >
      <section className="legal-section">
        <h2 className="legal-h2"><FiUserCheck /> Grievance Officer</h2>
        <div className="legal-contact-row">
          <FiMail size={16} />
          <div>
            <strong>Email</strong>
            <span><a href="mailto:grievance@mavenjobs.in">grievance@mavenjobs.in</a></span>
          </div>
        </div>
        <div className="legal-contact-row">
          <FiPhone size={16} />
          <div>
            <strong>Phone</strong>
            <span>+91 80 1234 5678 (Mon–Fri, 10:00 AM – 6:00 PM IST)</span>
          </div>
        </div>
        <div className="legal-contact-row">
          <FiMapPin size={16} />
          <div>
            <strong>Address</strong>
            <span>
              Maven Jobs, Grievance Cell, 4th Floor, Tech Plaza, Outer Ring Road,
              Marathahalli, Bengaluru, Karnataka 560037, India
            </span>
          </div>
        </div>
      </section>

      <section className="legal-section">
        <h2 className="legal-h2"><FiShield /> Data Protection Officer</h2>
        <p className="legal-p">
          For privacy-related complaints, data access and deletion requests, or any other matter under the DPDP Act,
          2023 or the GDPR, please contact our Data Protection Officer:
        </p>
        <div className="legal-contact-row">
          <FiMail size={16} />
          <div>
            <strong>Email</strong>
            <span><a href="mailto:dpo@mavenjobs.in">dpo@mavenjobs.in</a></span>
          </div>
        </div>
        <div className="legal-contact-row">
          <FiMapPin size={16} />
          <div>
            <strong>Address</strong>
            <span>
              Maven Jobs, Data Protection Office, 4th Floor, Tech Plaza, Outer Ring Road,
              Marathahalli, Bengaluru, Karnataka 560037, India
            </span>
          </div>
        </div>
      </section>

      <section className="legal-section">
        <h2 className="legal-h2"><FiMail /> How to Raise a Grievance</h2>
        <ul className="legal-list">
          <li><strong>Step 1 – Describe the issue:</strong> Send an email with your registered name, email, and a clear description of the issue, along with any supporting details (job IDs, transaction IDs, screenshots).</li>
          <li><strong>Step 2 – First-level review:</strong> Our support team reviews your complaint and responds with an acknowledgement within 48 hours.</li>
          <li><strong>Step 3 – Investigation:</strong> The Grievance Officer investigates and provides a resolution, typically within 7 working days, and in no case longer than 30 days from receipt of the complaint.</li>
          <li><strong>Step 4 – Escalation:</strong> If you are not satisfied with the resolution, you may escalate to the Data Protection Officer for privacy matters, or to relevant regulatory authorities including the Data Protection Board of India.</li>
        </ul>
        <div className="legal-note">
          <FiClock size={14} style={{ verticalAlign: "-2px", marginRight: 6 }} />
          We aim to acknowledge every complaint within 48 hours and resolve it within 7 working days. Complaints are
          processed free of charge.
        </div>
      </section>

      <section className="legal-section">
        <h2 className="legal-h2"><FiUserCheck /> What We Handle</h2>
        <ul className="legal-list">
          <li>Account, login, and profile issues</li>
          <li>Job application and application-status issues</li>
          <li>Inappropriate or fraudulent job postings (see our <a href="/maven-jobs/fraud-alert">Fraud Alert</a> page)</li>
          <li>Billing, subscription, and refund requests</li>
          <li>Privacy and data-related requests</li>
          <li>Any other concerns regarding use of the Platform</li>
        </ul>
      </section>
    </LegalLayout>
  );
}