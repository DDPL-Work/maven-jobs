import { FiShield, FiUserCheck, FiBriefcase, FiAlertOctagon, FiInfo, FiFileText } from "react-icons/fi";
import CandidateHeader from "../../../components/common/CandidateHeader";
import LandingFooter from "../../../components/LandingFooter";
import "./TermsOfService.css";

const SECTIONS = [
  { id: "acceptance", label: "1. Acceptance" },
  { id: "job-seekers", label: "2. Job Seekers" },
  { id: "employers", label: "3. Employers" },
  { id: "conduct", label: "4. Conduct" },
  { id: "service", label: "5. Service & Liability" },
  { id: "law", label: "6. Governing Law" },
];

export default function TermsOfService() {
  return (
    <main className="tos-page">
      <CandidateHeader />

      <header className="tos-hero">
        <div className="tos-hero-inner">
          <span className="tos-hero-kicker"><FiFileText /> LEGAL DOCUMENT · REV. 4.0</span>
          <h1>Terms of Service</h1>
          <p>
            The binding agreement between you and Maven Jobs for the use of our platform,
            products, and services.
          </p>
          <div className="tos-hero-meta">
            <span>Effective: 1 August 2026</span>
            <span>Jurisdiction: Bengaluru, India</span>
          </div>
        </div>
      </header>

      <div className="tos-toc">
        {SECTIONS.map((s) => (
          <a key={s.id} href={`#${s.id}`}>{s.label}</a>
        ))}
      </div>

      <div className="tos-sheet">
        <section className="tos-article" id="acceptance">
          <span className="tos-num">1</span>
          <div className="tos-body">
            <h2><FiInfo /> Acceptance of Terms</h2>
            <p>
              By registering, browsing, or otherwise using the Platform, you confirm that you have read, understood,
              and agree to these Terms along with our <a href="/maven-jobs/privacy">Privacy Policy</a> and{" "}
              <a href="/maven-jobs/cookies">Cookie Policy</a>. If you do not agree, please discontinue use of the Platform.
            </p>
            <p>
              Maven Jobs may revise these Terms from time to time. Material changes will be communicated through the
              Platform or by email, and continued use after the change constitutes acceptance of the revised Terms.
            </p>
          </div>
        </section>

        <section className="tos-article" id="job-seekers">
          <span className="tos-num">2</span>
          <div className="tos-body">
            <h2><FiUserCheck /> Terms for Job Seekers</h2>
            <h3>2.1 Accurate Profile Information</h3>
            <p>
              You agree to provide true, accurate, current, and complete information in your profile, resume, and
              application submissions. Misrepresentation of qualifications, experience, salary history, or identity
              may lead to suspension or removal from the Platform and disqualification from active applications.
            </p>
            <h3>2.2 No Guarantee of Employment</h3>
            <p>
              Maven Jobs is an intermediary platform that connects candidates with employers. We do not guarantee
              that you will receive interview calls, job offers, or employment as a result of using the Platform. All
              hiring decisions are made solely by employers.
            </p>
            <h3>2.3 Account Responsibility</h3>
            <p>
              You are responsible for maintaining the confidentiality of your login credentials and for all activity
              performed under your account. Notify us immediately at{" "}
              <a href="mailto:help@mavenjobs.in">help@mavenjobs.in</a> if you suspect unauthorised access.
            </p>
            <div className="tos-clause">
              Never share your password, OTP, or login details with anyone claiming to be a recruiter, employer, or
              Maven Jobs representative.
            </div>
          </div>
        </section>

        <section className="tos-article" id="employers">
          <span className="tos-num">3</span>
          <div className="tos-body">
            <h2><FiBriefcase /> Terms for Employers</h2>
            <h3>3.1 No Fake or Misleading Job Postings</h3>
            <p>
              Employers agree to post only genuine, currently open positions with accurate job titles, descriptions,
              compensation, and work locations. Posting fictitious roles, collecting resumes without intent to hire,
              or using the Platform to harvest candidate data is strictly prohibited and will result in account
              termination.
            </p>
            <h3>3.2 Proper Use of Candidate Data</h3>
            <p>
              Candidate profiles, resumes, and contact details accessed through the Platform may be used solely for
              recruitment and hiring purposes in connection with your posted roles. You may not sell, rent, share, or
              repurpose candidate data for marketing, research, or any purpose other than hiring without explicit
              consent.
            </p>
            <h3>3.3 No Fee to Candidates</h3>
            <p>
              Employers and their representatives must never ask candidates to pay any fee — for applications,
              interviews, training, or job offers. Any such request is a violation of these Terms and applicable law.
            </p>
          </div>
        </section>

        <section className="tos-article" id="conduct">
          <span className="tos-num">4</span>
          <div className="tos-body">
            <h2><FiShield /> Acceptable Use &amp; Conduct</h2>
            <ul className="tos-list">
              <li><strong>No unlawful activity:</strong> You may not use the Platform for any fraudulent, harmful, or unlawful purpose.</li>
              <li><strong>No scraping:</strong> Automated scraping, crawling, or bulk extraction of data from the Platform is prohibited.</li>
              <li><strong>No abuse:</strong> Harassment of other users, spamming, or uploading malicious content is strictly prohibited.</li>
              <li><strong>No impersonation:</strong> Creating accounts that impersonate other individuals or organisations is prohibited.</li>
            </ul>
          </div>
        </section>

        <section className="tos-article" id="service">
          <span className="tos-num">5</span>
          <div className="tos-body">
            <h2><FiAlertOctagon /> Service Availability, Termination &amp; Liability</h2>
            <p>
              The Platform is provided on an "as is" and "as available" basis. While we aim for high availability, we
              do not warrant uninterrupted or error-free service. We may suspend or terminate accounts that violate
              these Terms.
            </p>
            <p>
              To the maximum extent permitted by law, Maven Jobs shall not be liable for indirect, incidental, or
              consequential damages arising from your use of the Platform, including lost opportunities or employment
              outcomes.
            </p>
          </div>
        </section>

        <section className="tos-article" id="law">
          <span className="tos-num">6</span>
          <div className="tos-body">
            <h2><FiShield /> Governing Law</h2>
            <p>
              These Terms are governed by the laws of India. Any disputes arising out of these Terms shall be subject
              to the exclusive jurisdiction of the courts of Bengaluru, Karnataka.
            </p>
            <div className="tos-signoff">
              Questions about these Terms? Write to <a href="mailto:help@mavenjobs.in">help@mavenjobs.in</a>
            </div>
          </div>
        </section>
      </div>

      <LandingFooter />
    </main>
  );
}