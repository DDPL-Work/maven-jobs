import {
  FiAlertTriangle,
  FiShield,
  FiEyeOff,
  FiMail,
  FiLock,
  FiDollarSign,
  FiCheckCircle,
  FiPhone,
  FiChevronRight,
} from "react-icons/fi";
import CandidateHeader from "../../../components/common/CandidateHeader";
import LandingFooter from "../../../components/LandingFooter";
import "./FraudAlert.css";

const NEVER_ITEMS = [
  "Application or registration fees",
  "Interview scheduling or 'interview guarantee' fees",
  "Background verification charges",
  "Training, certification, or onboarding fees",
  "Security deposits or 'refundable' advances",
];

const SCAMS = [
  {
    icon: FiDollarSign,
    title: "Fake offer letters",
    desc: "Fraudsters send convincing offer letters from well-known companies and demand a 'processing fee' to release the offer.",
  },
  {
    icon: FiPhone,
    title: "Fake interview calls",
    desc: "An informal 'interview', an instant selection, then a demand to pay for training or joining formalities.",
  },
  {
    icon: FiLock,
    title: "OTP & password phishing",
    desc: "Scammers posing as recruiters ask for your OTP, login credentials, or bank details 'for verification'.",
  },
  {
    icon: FiMail,
    title: "Fraudulent emails",
    desc: "Emails impersonating Maven Jobs contain phishing links or attachments designed to steal your data.",
  },
];

const RED_FLAGS = [
  "Too good to be true — very high salary with no interview",
  "Pressure to 'pay today' or lose the offer",
  "Any payment demand — transfer, UPI, or gift cards",
  "Free email domains and sloppy, unprofessional communication",
  "No verifiable company record or LinkedIn presence",
  "Requests for bank details or OTPs before an offer is made",
];

export default function FraudAlert() {
  return (
    <main className="fa-page">
      <CandidateHeader />

      <header className="fa-hero">
        <div className="fa-alert-icon">
          <FiAlertTriangle size={34} />
        </div>
        <span className="fa-kicker">SECURITY ADVISORY</span>
        <h1>Stop. Read this before your next application.</h1>
        <p>
          Recruitment scams are on the rise. If anyone asks you to pay for a job opportunity in the name of Maven
          Jobs — stop, do not transfer money, and report it to us immediately.
        </p>
        <div className="fa-scroll-hint">
          <FiChevronRight size={16} />
          Scroll to stay safe
        </div>
      </header>

      <section className="fa-never">
        <h2><FiShield /> Maven Jobs NEVER asks you for money</h2>
        <div className="fa-never-grid">
          {NEVER_ITEMS.map((item) => (
            <div className="fa-never-item" key={item}>
              <span className="fa-cross">✕</span>
              {item}
            </div>
          ))}
        </div>
      </section>

      <section className="fa-scams">
        <h2>How the scams work</h2>
        <p className="fa-sub">The four most common recruitment fraud patterns in India:</p>
        <div className="fa-scam-grid">
          {SCAMS.map((s) => (
            <div className="fa-scam-card" key={s.title}>
              <span className="fa-scam-icon"><s.icon size={20} /></span>
              <h3>{s.title}</h3>
              <p>{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="fa-flags">
        <div className="fa-flags-head">
          <FiEyeOff size={22} />
          <div>
            <h2>Spot a fake job. Six red flags.</h2>
            <p>If any of these apply, walk away — it is not a genuine opportunity.</p>
          </div>
        </div>
        <ul className="fa-flags-list">
          {RED_FLAGS.map((flag, i) => (
            <li key={flag}>
              <span className="fa-flag-num">{i + 1}</span>
              {flag}
            </li>
          ))}
        </ul>
      </section>

      <section className="fa-report">
        <div className="fa-report-card">
          <h2><FiMail /> See a scam? Report it.</h2>
          <p>
            Email us at <a href="mailto:safety@mavenjobs.in">safety@mavenjobs.in</a> with the job title, company
            name, and any communication you received. You can also use the Hide / report option on suspicious job
            cards within the platform.
          </p>
          <p>
            Already made a payment? Contact your bank immediately, file a complaint with your local police / cyber
            cell, and report it on the Indian Cyber Crime portal (cybercrime.gov.in).
          </p>
          <div className="fa-pledge">
            <FiCheckCircle size={18} />
            Legitimate interviews arranged through Maven Jobs are always free of cost.
          </div>
        </div>
      </section>

      <LandingFooter />
    </main>
  );
}