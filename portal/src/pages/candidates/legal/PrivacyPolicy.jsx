import {
  FiLock,
  FiDatabase,
  FiShare2,
  FiShield,
  FiUserCheck,
  FiMail,
  FiFileText,
  FiCpu,
  FiTrash2,
} from "react-icons/fi";
import CandidateHeader from "../../../components/common/CandidateHeader";
import LandingFooter from "../../../components/LandingFooter";
import "./PrivacyPolicy.css";

const STATS = [
  { value: "3", label: "Data categories handled" },
  { value: "0", label: "Data sold — ever" },
  { value: "30", label: "Day max response time" },
];

const RIGHTS = [
  { icon: FiFileText, title: "Access", desc: "Get a copy of your data" },
  { icon: FiUserCheck, title: "Correction", desc: "Fix inaccurate details" },
  { icon: FiTrash2, title: "Deletion", desc: "Erase your account & data" },
  { icon: FiCpu, title: "Portability", desc: "Export machine-readable data" },
];

export default function PrivacyPolicy() {
  return (
    <main className="pp-page">
      <CandidateHeader />

      <header className="pp-hero">
        <div className="pp-hero-inner">
          <div className="pp-hero-icon">
            <FiLock size={30} />
          </div>
          <span className="pp-hero-kicker">PRIVACY &amp; DATA TRUST CENTER</span>
          <h1>Your data. Our responsibility.</h1>
          <p>
            This Privacy Policy explains how Maven Jobs collects, uses, stores, and protects your personal data — in
            line with the DPDP Act, 2023 of India and, where applicable, the EU GDPR.
          </p>
          <div className="pp-hero-meta">
            <span>Last updated: 1 August 2026</span>
            <a href="mailto:privacy@mavenjobs.in">privacy@mavenjobs.in</a>
          </div>
        </div>
      </header>

      <div className="pp-stats">
        {STATS.map((s) => (
          <div className="pp-stat" key={s.label}>
            <strong>{s.value}</strong>
            <span>{s.label}</span>
          </div>
        ))}
      </div>

      <div className="pp-layout">
        <div className="pp-main">
          <section className="pp-card">
            <span className="pp-card-icon"><FiDatabase /></span>
            <h2>What we collect</h2>
            <h3>Information you provide</h3>
            <ul className="pp-list">
              <li><strong>Account details:</strong> name, email, phone, and password (stored encrypted).</li>
              <li><strong>Profile:</strong> experience, education, skills, expected salary, preferred roles and locations.</li>
              <li><strong>Resumes &amp; documents:</strong> files you upload for the application process.</li>
              <li><strong>Applications:</strong> job applications, screening answers, and saved jobs.</li>
              <li><strong>Employers:</strong> company information, contact details, and job postings.</li>
            </ul>
            <h3>Information collected automatically</h3>
            <ul className="pp-list">
              <li>Usage data — pages visited, searches, and feature interactions.</li>
              <li>Device data — IP address, browser, OS, and device identifiers.</li>
              <li>Cookies — as described in our <a href="/maven-jobs/cookies">Cookie Policy</a>.</li>
            </ul>
          </section>

          <section className="pp-card pp-card-dark">
            <span className="pp-card-icon"><FiShare2 /></span>
            <h2>Who we share with</h2>
            <p className="pp-lead">Built on a "never sell, share only when needed" principle:</p>
            <ul className="pp-list">
              <li><strong>Employers</strong> — only when you apply to their posting or opt into recruiter discovery.</li>
              <li><strong>Authentication</strong> — Google sign-in for OAuth.</li>
              <li><strong>Payments</strong> — payment gateways for premium purchases.</li>
              <li><strong>Analytics &amp; infrastructure</strong> — usage insight and cloud hosting providers, contractually bound to data protection.</li>
            </ul>
          </section>

          <section className="pp-card">
            <span className="pp-card-icon"><FiShield /></span>
            <h2>Retention &amp; security</h2>
            <p>
              Data is retained only as long as needed to operate the platform, satisfy legal obligations, and resolve
              disputes. We protect data with encryption in transit and at rest, strict access controls, and regular
              security reviews. You can request full account deletion at any time.
            </p>
          </section>

          <section className="pp-card pp-card-dark">
            <span className="pp-card-icon"><FiMail /></span>
            <h2>Contact &amp; complaints</h2>
            <p>
              For privacy questions, complaints, or deletion requests, write to{" "}
              <a href="mailto:privacy@mavenjobs.in">privacy@mavenjobs.in</a>, or use the escalation process on our{" "}
              <a href="/maven-jobs/grievance">Grievance Redressal</a> page.
            </p>
          </section>
        </div>

        <aside className="pp-aside">
          <div className="pp-aside-card">
            <h3><FiUserCheck /> Your rights</h3>
            <ul>
              {RIGHTS.map((r) => (
                <li key={r.title}>
                  <r.icon size={16} />
                  <div>
                    <strong>{r.title}</strong>
                    <span>{r.desc}</span>
                  </div>
                </li>
              ))}
            </ul>
            <p className="pp-aside-note">
              Exercisable anytime under the DPDP Act &amp; GDPR. We respond within the legally mandated timelines.
            </p>
          </div>
        </aside>
      </div>

      <LandingFooter />
    </main>
  );
}