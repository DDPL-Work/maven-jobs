import CandidateHeader from "../../../components/common/CandidateHeader";
import LandingFooter from "../../../components/LandingFooter";
import "./LegalPages.css";

export default function LegalLayout({ icon: Icon, title, intro, updated, children }) {
  return (
    <main className="legal-page">
      <CandidateHeader />

      <div className="legal-container">
        <div className="legal-head">
          <div className="legal-badge">
            <Icon size={18} />
            <span>Maven Jobs</span>
          </div>
          <h1 className="legal-title">{title}</h1>
          {updated && <span className="legal-updated">Last updated: {updated}</span>}
          {intro && <p className="legal-intro">{intro}</p>}
        </div>

        <div className="legal-body">{children}</div>
      </div>

      <LandingFooter />
    </main>
  );
}