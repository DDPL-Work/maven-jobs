import React from "react";
import { Link } from "react-router-dom";
import {
  FiArrowRight, FiCheck, FiChevronRight, FiClock, FiCpu,
  FiEdit3, FiFileText, FiLayers, FiMessageSquare, FiRefreshCw,
  FiSearch, FiShield, FiUsers, FiZap,
} from "react-icons/fi";
import LandingHeader from "../../../../components/LandingHeader";
import LandingFooter from "../../../../components/LandingFooter";
import "./TextResume.css";

const FAQItem = ({ q, a }) => (
  <details className="svc-faq__item">
    <summary>
      {q}
      <FiChevronRight />
    </summary>
    <p>{a}</p>
  </details>
);

const TextResume = () => {
  const features = [
    { icon: FiFileText, title: "ATS-Friendly Format", desc: "Structured, machine-readable layout that sails past applicant tracking systems and reaches human eyes." },
    { icon: FiSearch, title: "Keyword Optimized", desc: "Role-specific keywords and phrases mapped to the job descriptions you are targeting." },
    { icon: FiUsers, title: "Expert Consultation", desc: "A 30-minute discovery call with a Maven Jobs resume expert before drafting begins." },
    { icon: FiRefreshCw, title: "2 Revision Rounds", desc: "Two rounds of free revisions until your resume reads exactly the way you want it." },
    { icon: FiLayers, title: "Word + PDF Delivery", desc: "Editable Word file plus a print-ready PDF, delivered straight to your inbox." },
    { icon: FiShield, title: "Recruiter-Approved", desc: "Written to the standards recruiters on the Maven Jobs network actually look for." },
  ];

  const steps = [
    { num: "01", title: "Share your details", desc: "Fill a quick questionnaire covering your experience, skills and career goals." },
    { num: "02", title: "Expert writes your resume", desc: "A certified Maven Jobs writer drafts your resume in 48 hours or less." },
    { num: "03", title: "Review & request changes", desc: "You get two revision rounds to fine-tune every section with your writer." },
    { num: "04", title: "Download & apply", desc: "Receive the final Word and PDF files, ready to apply on Maven Jobs." },
  ];

  const faqs = [
    { q: "How long does it take to get my text resume?", a: "Your first draft is delivered within 48 hours of your consultation call. Revisions take up to 24 hours each, so you will usually have the final resume within a week." },
    { q: "Will my resume pass ATS screening?", a: "Yes. Every Maven Jobs text resume is built on a tested ATS-safe structure with standard headings, clean typography and role-specific keywords." },
    { q: "What information do I need to provide?", a: "A filled questionnaire with your work history, education, skills and target roles. Your writer may ask a few follow-up questions during the consultation call." },
    { q: "Can I get a refund?", a: "If your final resume does not meet the quality bar, contact support@mavenjobs.com within 7 days of delivery for a full refund." },
    { q: "Do you write resumes for freshers too?", a: "Absolutely. Our writers craft strong, achievement-led resumes for freshers, career switchers and senior professionals alike." },
  ];

  return (
    <div className="svc-root">
      <LandingHeader />
      <main className="svc-main responsive-container">
        <nav className="svc-crumbs">
          <Link to="/services" className="svc-crumbs__link">Services</Link>
          <FiChevronRight className="svc-crumbs__sep" />
          <span className="svc-crumbs__cur">Text Resume</span>
        </nav>

        <section className="svc-hero">
          <span className="svc-badge">
            <FiFileText /> Resume Writing
          </span>
          <h1 className="svc-title">
            Professional Text Resume,<br />Crafted by Experts
          </h1>
          <p className="svc-sub">
            An ATS-friendly, keyword-optimized text resume written by Maven Jobs
            career experts — built to get you past screening and onto the
            recruiter&apos;s shortlist.
          </p>
          <div className="svc-actions">
            <Link to="/services/contact-us" className="svc-btn svc-btn--primary">
              Order My Resume <FiArrowRight />
            </Link>
            <a href="#pricing" className="svc-btn svc-btn--ghost">
              View Pricing <FiChevronRight />
            </a>
          </div>
        </section>

        <section className="svc-stats">
          {[
            { num: "94%", label: "Interview Success Rate" },
            { num: "48 hrs", label: "Average Delivery" },
            { num: "5,000+", label: "Resumes Written" },
            { num: "2", label: "Free Revisions" },
          ].map((s) => (
            <div key={s.label} className="svc-stat">
              <div className="svc-stat__num">{s.num}</div>
              <div className="svc-stat__label">{s.label}</div>
            </div>
          ))}
        </section>

        <section className="svc-section">
          <div className="svc-sechead">
            <span className="svc-eyebrow">What&apos;s included</span>
            <h2 className="svc-sechead__title">Everything your resume needs</h2>
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
            <h2 className="svc-sechead__title">Your resume in 4 easy steps</h2>
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
                <div className="svc-price__tag">Text Resume</div>
                <div className="svc-price__amt">
                  <span className="svc-price__cur">₹</span>1,653
                  <span className="svc-price__per">/ one-time</span>
                </div>
                <p className="svc-price__sub">No hidden charges. GST included.</p>
              </div>
              <div className="svc-price__body">
                <ul className="svc-feats">
                  {[
                    "ATS-friendly professional format",
                    "Keyword optimization for your target role",
                    "30-min expert consultation call",
                    "2 free revision rounds",
                    "Word + PDF delivery in 48 hours",
                    "7-day money-back guarantee",
                  ].map((f) => (
                    <li key={f}>
                      <span className="svc-feats__check"><FiCheck size={12} strokeWidth={3} /></span>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link to="/services/contact-us" className="svc-price__cta">
                  Get My Text Resume <FiArrowRight />
                </Link>
                <p className="svc-guarantee">30-day money-back guarantee</p>
              </div>
            </div>
          </div>
        </section>

        <section className="svc-banner">
          <div className="svc-glow svc-glow--a" />
          <div className="svc-glow svc-glow--c" />
          <div className="svc-banner__inner">
            <div className="svc-banner__text">
              <span className="svc-banner__chip">
                <FiZap size={13} /> Limited-time offer
              </span>
              <h2>Ready to impress recruiters within 48 hours?</h2>
              <p>
                Join 5,000+ job seekers who landed interviews with a Maven Jobs
                professional text resume.
              </p>
            </div>
            <div className="svc-banner__actions">
              <Link to="/services/contact-us" className="svc-banner__btn">
                Order Now <FiArrowRight />
              </Link>
              <Link to="/services/resume-maker" className="svc-banner__btn svc-banner__btn--ghost">
                Try Free Resume Maker
              </Link>
            </div>
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
          <p className="svc-faq__note">
            Still have questions?{" "}
            <Link to="/services/contact-us" className="svc-faq__link">
              Talk to a career expert <FiMessageSquare className="svc-faq__icon" size={13} />
            </Link>
          </p>
        </section>
      </main>
      <LandingFooter />
    </div>
  );
};

export default TextResume;