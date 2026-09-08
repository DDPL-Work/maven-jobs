import React from "react";
import { Link } from "react-router-dom";
import {
  FiArrowRight, FiCheck, FiChevronRight, FiMinus, FiStar, FiZap,
} from "react-icons/fi";
import LandingHeader from "../../../../components/LandingHeader";
import LandingFooter from "../../../../components/LandingFooter";
import "./BasicPremiumPlans.css";

const FAQItem = ({ q, a }) => (
  <details className="svc-faq__item">
    <summary>
      {q}
      <FiChevronRight />
    </summary>
    <p>{a}</p>
  </details>
);

const BasicPremiumPlans = () => {
  const rows = [
    { label: "Job search & filters", basic: true, premium: true },
    { label: "Daily job alerts", basic: true, premium: true },
    { label: "Free resume maker & samples", basic: true, premium: true },
    { label: "Resume quality score", basic: true, premium: true },
    { label: "Priority Applicant placement", basic: false, premium: true },
    { label: "Resume Display (3x visibility)", basic: false, premium: true },
    { label: "Featured profile badge", basic: false, premium: true },
    { label: "Direct recruiter messaging", basic: false, premium: true },
    { label: "Recruiter analytics & visibility report", basic: false, premium: true },
    { label: "Priority 24x7 support", basic: false, premium: true },
  ];

  const Cell = ({ on }) =>
    on ? (
      <span className="svc-cell svc-cell--yes">
        <FiCheck size={15} strokeWidth={3} />
      </span>
    ) : (
      <span className="svc-cell svc-cell--no">
        <FiMinus size={15} strokeWidth={3} />
      </span>
    );

  const faqs = [
    { q: "Is the Basic plan really free?", a: "Yes. Basic is free forever and includes job search, alerts, our resume maker and resume quality score. There is no trial clock and no credit card required." },
    { q: "What happens when I upgrade to Premium?", a: "Your visibility boosters switch on instantly: priority placement, resume display, recruiter messaging and analytics. Everything from Basic keeps working." },
    { q: "Can I start Basic and upgrade later?", a: "Anytime. Your profile, saved jobs and resume data carry over automatically when you upgrade, so you never lose progress." },
    { q: "Is Premium worth it for freshers?", a: "Yes — early job access and higher visibility matter most when you have no work experience to rely on. Many freshers subscribe for their first 3 months." },
  ];

  return (
    <div className="svc-root">
      <LandingHeader />
      <main className="svc-main responsive-container">
        <nav className="svc-crumbs">
          <Link to="/services" className="svc-crumbs__link">Services</Link>
          <FiChevronRight className="svc-crumbs__sep" />
          <span className="svc-crumbs__cur">Basic &amp; Premium Plans</span>
        </nav>

        <section className="svc-hero">
          <span className="svc-badge">
            <FiStar /> Get Recruiter&apos;s Attention
          </span>
          <h1 className="svc-title">
            Basic vs Premium.<br />Everything, Side by Side
          </h1>
          <p className="svc-sub">
            Start free with Basic. Upgrade to Premium when you want recruiters
            to see you first. No fine print — just a clear comparison of every
            feature on Maven Jobs.
          </p>
        </section>

        <section className="svc-section">
          <div className="svc-plans">
            <div className="svc-price svc-price--slate">
              <div className="svc-price__head svc-price__head--slate">
                <div className="svc-price__tag">Basic</div>
                <div className="svc-price__amt">
                  <span className="svc-price__cur">₹</span>0
                  <span className="svc-price__per">/ forever</span>
                </div>
                <p className="svc-price__sub">Everything you need to start searching</p>
              </div>
              <div className="svc-price__body">
                <ul className="svc-feats">
                  {[
                    "Unlimited job search & filters",
                    "Daily job alerts",
                    "Free resume maker & templates",
                    "Resume quality score tool",
                    "Save & track applications",
                  ].map((f) => (
                    <li key={f}>
                      <span className="svc-feats__check"><FiCheck size={12} strokeWidth={3} /></span>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link to="/" className="svc-price__cta svc-price__cta--slate">
                  Start Free <FiArrowRight />
                </Link>
              </div>
            </div>

            <div className="svc-price svc-price--green">
              <span className="svc-rec-badge">Recommended</span>
              <div className="svc-price__head">
                <div className="svc-price__tag">Premium</div>
                <div className="svc-price__amt">
                  <span className="svc-price__cur">₹</span>999
                  <span className="svc-price__per">/ month</span>
                </div>
                <p className="svc-price__sub">All of Basic + full visibility stack</p>
              </div>
              <div className="svc-price__body">
                <ul className="svc-feats">
                  {[
                    "Everything in Basic",
                    "Priority Applicant placement",
                    "Resume Display with 3x visibility",
                    "Featured profile badge",
                    "Direct recruiter messaging",
                    "Recruiter analytics & reports",
                    "Priority 24x7 support",
                  ].map((f) => (
                    <li key={f}>
                      <span className="svc-feats__check"><FiCheck size={12} strokeWidth={3} /></span>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link to="/services/contact-us" className="svc-price__cta">
                  Go Premium <FiArrowRight />
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="svc-section">
          <div className="svc-sechead">
            <span className="svc-eyebrow">Feature comparison</span>
            <h2 className="svc-sechead__title">Every feature, in one table</h2>
          </div>
          <div className="svc-table-wrap">
            <table className="svc-table">
              <thead>
                <tr>
                  <th className="svc-table__th">Feature</th>
                  <th className="svc-table__th svc-table__th--center">Basic</th>
                  <th className="svc-table__th svc-table__th--center svc-table__th--premium">Premium</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={r.label} className={i % 2 === 1 ? "svc-table__row--zebra" : ""}>
                    <td className="svc-table__feature">{r.label}</td>
                    <td className="svc-table__cell"><Cell on={r.basic} /></td>
                    <td className="svc-table__cell"><Cell on={r.premium} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="svc-table-note">
            Premium also bundles Jobs4U starter matching and interview prep support on quarterly plans.
          </p>
        </section>

        <section className="svc-banner">
          <div className="svc-glow svc-glow--a" />
          <div className="svc-banner__inner">
            <div className="svc-banner__text">
              <span className="svc-banner__chip">
                <FiZap size={13} /> Try Premium risk-free
              </span>
              <h2>30-day money-back guarantee on Premium</h2>
              <p>
                Upgrade, measure the difference in your profile views, and keep
                your money if you&apos;re not convinced.
              </p>
            </div>
            <Link to="/services/contact-us" className="svc-banner__btn">
              Start Premium Trial <FiArrowRight />
            </Link>
          </div>
        </section>

        <section className="svc-faq">
          <div className="svc-sechead">
            <span className="svc-eyebrow">FAQ</span>
            <h2 className="svc-sechead__title">Questions, answered</h2>
          </div>
          <div className="svc-faq__list">
            {faqs.map((f) => (
              <FAQItem key={f.q} q={f.q} a={f.a} />
            ))}
          </div>
        </section>
      </main>
      <LandingFooter />
    </div>
  );
};

export default BasicPremiumPlans;