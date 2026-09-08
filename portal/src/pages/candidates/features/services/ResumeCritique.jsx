import React from "react";
import { Link } from "react-router-dom";
import {
  FiArrowRight, FiBarChart2, FiCheck, FiChevronRight, FiClock,
  FiEdit3, FiFileText, FiMessageSquare, FiSearch, FiTarget, FiZap,
} from "react-icons/fi";
import LandingHeader from "../../../../components/LandingHeader";
import LandingFooter from "../../../../components/LandingFooter";
import "./ResumeCritique.css";

const FAQItem = ({ q, a }) => (
  <details className="svc-faq__item">
    <summary>
      {q}
      <FiChevronRight />
    </summary>
    <p>{a}</p>
  </details>
);

const ResumeCritique = () => {
  const features = [
    { icon: FiSearch, title: "Gap Analysis Report", desc: "Every weakness flagged — from missing keywords to weak bullet points — with proof." },
    { icon: FiBarChart2, title: "Score Breakdown", desc: "A 100-point score across content, format, keywords and impact, section by section." },
    { icon: FiTarget, title: "Actionable Feedback", desc: "Line-level, prioritised fixes you can apply yourself, starting with the highest impact." },
    { icon: FiMessageSquare, title: "15-Min Expert Call", desc: "A personal call with a Maven Jobs expert to walk through your scorecard." },
    { icon: FiEdit3, title: "Rewrite Suggestions", desc: "Before-and-after examples for your weakest sections, ready to copy." },
    { icon: FiClock, title: "48-Hour Turnaround", desc: "Your full critique report lands in your inbox within 48 hours." },
  ];

  const steps = [
    { num: "01", title: "Upload your resume", desc: "Drop in your current resume (PDF or Word) along with your target role." },
    { num: "02", title: "Experts review it", desc: "A Maven Jobs career expert analyses content, keywords, format and impact." },
    { num: "03", title: "Get your scorecard", desc: "Receive a 100-point score with a detailed breakdown within 48 hours." },
    { num: "04", title: "Talk it through", desc: "Book your 15-minute call to turn feedback into a concrete action plan." },
  ];

  const faqs = [
    { q: "What does the critique cover?", a: "Everything recruiters and ATS software check: headline and summary, keywords, bullet-point impact, quantifiable achievements, formatting, length and common red flags." },
    { q: "Do I need to buy a new resume after the critique?", a: "Not necessarily. Most candidates can apply the fixes themselves. If you would rather hand it over, our text resume service uses your critique as the starting brief." },
    { q: "How is the score calculated?", a: "Your resume is scored on five weighted parameters: content quality, keyword relevance, format and structure, achievement impact and ATS compatibility — out of 100." },
    { q: "Can I use this before applying to a specific company?", a: "Yes. Mention the company and role when you upload, and your reviewer will tailor keyword and content suggestions to that exact job description." },
    { q: "What if I'm not happy with the feedback?", a: "Your critique includes a free 15-minute call. If the feedback isn't useful, contact support@mavenjobs.com within 7 days for a refund." },
  ];

  return (
    <div className="svc-root">
      <LandingHeader />
      <main className="svc-main responsive-container">
        <nav className="svc-crumbs">
          <Link to="/services" className="svc-crumbs__link">Services</Link>
          <FiChevronRight className="svc-crumbs__sep" />
          <span className="svc-crumbs__cur">Resume Critique</span>
        </nav>

        <section className="svc-hero">
          <span className="svc-badge">
            <FiFileText /> Resume Writing
          </span>
          <h1 className="svc-title">
            Get Your Resume<br />Scientifically Critiqued
          </h1>
          <p className="svc-sub">
            Upload your resume and get a 100-point score, a gap analysis and a
            personal 15-minute call with a Maven Jobs career expert — before
            recruiters ever see it.
          </p>
          <div className="svc-actions">
            <Link to="/services/contact-us" className="svc-btn svc-btn--primary">
              Get My Critique <FiArrowRight />
            </Link>
            <a href="#pricing" className="svc-btn svc-btn--ghost">
              View Pricing <FiChevronRight />
            </a>
          </div>
        </section>

        <section className="svc-score">
          <div
            className="svc-ring"
            style={{ background: "conic-gradient(#10b981 0% 62%, #e2e8f0 62% 100%)" }}
          >
            <div className="svc-ring__inner">
              <span className="svc-score__num">62</span>
              <span className="svc-score__label">avg. score</span>
            </div>
          </div>
          <h2 className="svc-score__title">The average resume scores 62/100</h2>
          <p className="svc-score__desc">
            Most resumes lose points on weak achievement bullets, missing
            keywords and formatting issues. Top-scoring resumes move through
            Maven Jobs&apos; recruiter shortlists up to 3x faster.
          </p>
          <div className="svc-score__chip">
            <FiZap size={13} /> Know your score before you apply
          </div>
        </section>

        <section className="svc-section">
          <div className="svc-sechead">
            <span className="svc-eyebrow">What&apos;s included</span>
            <h2 className="svc-sechead__title">A complete health check for your resume</h2>
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
            <h2 className="svc-sechead__title">Know your score in 48 hours</h2>
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
                <div className="svc-price__tag">Resume Critique</div>
                <div className="svc-price__amt">
                  <span className="svc-price__cur">₹</span>1,017
                  <span className="svc-price__per">/ one-time</span>
                </div>
                <p className="svc-price__sub">No hidden charges. GST included.</p>
              </div>
              <div className="svc-price__body">
                <ul className="svc-feats">
                  {[
                    "100-point score with section breakdown",
                    "Gap analysis and line-level feedback",
                    "Keyword and ATS compatibility check",
                    "Rewrite suggestions for weak sections",
                    "15-minute expert call included",
                    "Delivered within 48 hours",
                  ].map((f) => (
                    <li key={f}>
                      <span className="svc-feats__check"><FiCheck size={12} strokeWidth={3} /></span>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link to="/services/contact-us" className="svc-price__cta">
                  Get My Critique <FiArrowRight />
                </Link>
                <p className="svc-guarantee">7-day money-back guarantee</p>
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
                <FiZap size={13} /> Fix it before recruiters see it
              </span>
              <h2>One critique call could change your interview count</h2>
              <p>Get your 100-point score and a personal action plan in 48 hours.</p>
            </div>
            <Link to="/services/contact-us" className="svc-banner__btn">
              Get Started <FiArrowRight />
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

export default ResumeCritique;