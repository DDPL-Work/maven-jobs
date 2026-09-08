import React from "react";
import { Link } from "react-router-dom";
import {
  FiArrowRight, FiAward, FiBarChart2, FiBell, FiCheck, FiChevronRight,
  FiMail, FiSearch, FiSend, FiStar, FiTrendingUp, FiZap,
} from "react-icons/fi";
import LandingHeader from "../../../../components/LandingHeader";
import LandingFooter from "../../../../components/LandingFooter";
import "./PriorityApplicant.css";

const FAQItem = ({ q, a }) => (
  <details className="svc-faq__item">
    <summary>
      {q}
      <FiChevronRight />
    </summary>
    <p>{a}</p>
  </details>
);

const PriorityApplicant = () => {
  const features = [
    { icon: FiBell, title: "Early Job Access", desc: "See and apply to new roles hours before they appear in general search results." },
    { icon: FiTrendingUp, title: "Top Search Placement", desc: "Your profile surfaces near the top of recruiter search results in your field." },
    { icon: FiSend, title: "Direct Recruiter Messaging", desc: "Reach out to recruiters directly and get your questions answered faster." },
    { icon: FiBarChart2, title: "Application Tracking", desc: "Know exactly where every application stands with live status updates." },
    { icon: FiAward, title: "Priority Badge", desc: "A visible 'Priority Applicant' marker that signals your intent and profile quality." },
    { icon: FiMail, title: "Instant Notifications", desc: "Get pinged the second a recruiter views, shortlists or opens your resume." },
  ];

  const steps = [
    { num: "01", title: "Activate priority", desc: "Enable Priority Applicant on any Maven Jobs plan you already have." },
    { num: "02", title: "Get flagged", desc: "Our matching engine tags your profile for the roles you qualify for." },
    { num: "03", title: "Recruiters see you first", desc: "Your application moves to the top of the recruiter's applicant list." },
    { num: "04", title: "Interview invites", desc: "With early access and higher placement, interviews come faster." },
  ];

  const faqs = [
    { q: "Does priority guarantee an interview?", a: "No service can guarantee interviews. Priority Applicant significantly increases your visibility and application read-rate, which measurably improves response times and interview invites." },
    { q: "Can recruiters tell I'm a priority applicant?", a: "Yes — and that's the point. The badge signals you are serious, actively searching and profile-verified, which builds trust with recruiters." },
    { q: "Is it available for all roles?", a: "It works best for active searches across IT, sales, marketing, HR and operations. Support is limited for certain leadership or compliance-heavy roles." },
    { q: "Can I cancel anytime?", a: "Yes. Priority Applicant renews monthly and can be turned off anytime from your dashboard with no cancellation fees." },
  ];

  return (
    <div className="svc-root">
      <LandingHeader />
      <main className="svc-main responsive-container">
        <nav className="svc-crumbs">
          <Link to="/services" className="svc-crumbs__link">Services</Link>
          <FiChevronRight className="svc-crumbs__sep" />
          <span className="svc-crumbs__cur">Priority Applicant</span>
        </nav>

        <section className="svc-hero">
          <span className="svc-badge">
            <FiAward /> Find Jobs
          </span>
          <h1 className="svc-title">
            Skip the Queue.<br />Become a Priority Applicant
          </h1>
          <p className="svc-sub">
            Your applications deserve more than a 30-second skim. With Priority
            Applicant, Maven Jobs places your profile first in line — earlier
            job access, top placement and direct access to recruiters.
          </p>
          <div className="svc-actions">
            <Link to="/services/contact-us" className="svc-btn svc-btn--primary">
              Become Priority <FiArrowRight />
            </Link>
            <a href="#pricing" className="svc-btn svc-btn--ghost">
              View Pricing <FiChevronRight />
            </a>
          </div>
        </section>

        <section className="svc-banner-stats">
          {[
            { num: "5x", label: "More profile views" },
            { num: "2.4x", label: "Faster recruiter responses" },
            { num: "68%", label: "See early-posted jobs" },
          ].map((s) => (
            <div key={s.label}>
              <div className="svc-banner-stats__num">{s.num}</div>
              <div className="svc-banner-stats__label">{s.label}</div>
            </div>
          ))}
        </section>

        <section className="svc-section">
          <div className="svc-sechead">
            <span className="svc-eyebrow">What&apos;s included</span>
            <h2 className="svc-sechead__title">Move to the front of every list</h2>
          </div>
          <div className="svc-grid">
            {features.map(({ icon: Icon, title, desc }) => (
              <article key={title} className="svc-card">
                <span className="svc-card__icon"><Icon size={22} /></span>
                <h3>{title}</h3>
                <p>{desc}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="svc-section">
          <div className="svc-sechead">
            <span className="svc-eyebrow">How it works</span>
            <h2 className="svc-sechead__title">From flagged to shortlisted</h2>
          </div>
          <div className="svc-steps">
            {steps.map((s) => (
              <div key={s.num} className="svc-step">
                <span className="svc-step__num">{s.num}</span>
                <h3>{s.title}</h3>
                <p>{s.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="pricing" className="svc-section">
          <div className="svc-single-price">
            <div className="svc-price">
              <div className="svc-price__head">
                <div className="svc-price__tag">Priority Applicant</div>
                <div className="svc-price__amt">
                  <span className="svc-price__cur">₹</span>971
                  <span className="svc-price__per">/ 3 months</span>
                </div>
                <p className="svc-price__sub">No hidden charges. GST included.</p>
              </div>
              <div className="svc-price__body">
                <ul className="svc-feats">
                  {[
                    "Early access to new job postings",
                    "Top placement in recruiter searches",
                    "Priority Applicant badge on your profile",
                    "Direct recruiter messaging unlocked",
                    "Live application status tracking",
                    "Cancel anytime, no questions asked",
                  ].map((f) => (
                    <li key={f}>
                      <span className="svc-feats__check"><FiCheck size={12} strokeWidth={3} /></span>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link to="/services/contact-us" className="svc-price__cta">
                  Get Priority Applicant <FiArrowRight />
                </Link>
                <p className="svc-guarantee">7-day money-back guarantee</p>
              </div>
            </div>
          </div>
        </section>

        <section className="svc-banner">
          <div className="svc-glow svc-glow--a" />
          <div className="svc-glow svc-glow--d" />
          <div className="svc-banner__inner">
            <div className="svc-banner__text">
              <span className="svc-banner__chip">
                <FiStar size={13} /> Recruiters shortlist what they see first
              </span>
              <h2>Stop competing. Start leading the list.</h2>
              <p>
                Join candidates who get their applications read — and their
                careers moving — faster.
              </p>
            </div>
            <Link to="/services/contact-us" className="svc-banner__btn">
              Go Priority <FiArrowRight />
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

export default PriorityApplicant;