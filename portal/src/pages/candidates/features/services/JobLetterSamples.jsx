import React from "react";
import { Link } from "react-router-dom";
import {
  FiArrowRight, FiBookOpen, FiCheck, FiChevronRight, FiDownload,
  FiEdit3, FiEye, FiFile, FiMail, FiSend, FiThumbsUp, FiZap,
} from "react-icons/fi";
import LandingHeader from "../../../../components/LandingHeader";
import LandingFooter from "../../../../components/LandingFooter";
import "./JobLetterSamples.css";

const FAQItem = ({ q, a }) => (
  <details className="svc-faq__item">
    <summary>
      {q}
      <FiChevronRight />
    </summary>
    <p>{a}</p>
  </details>
);

const JobLetterSamples = () => {
  const letters = [
    {
      type: "Cover Letter",
      icon: FiSend,
      use: "Attach with every application",
      cls: "svc-letter__head--blue",
      preview: "Dear Hiring Manager,\nI am writing to apply for the Software Engineer role at your company. With 4 years of experience building scalable backend systems, I have consistently delivered features that moved core business metrics...",
    },
    {
      type: "Follow-Up Letter",
      icon: FiMail,
      use: "7 days after applying",
      cls: "svc-letter__head--emerald",
      preview: "Dear Hiring Manager,\nI recently applied for the Data Analyst position and wanted to touch base. I remain very interested in the role and would be glad to share any additional examples of my work...",
    },
    {
      type: "Thank-You Letter",
      icon: FiThumbsUp,
      use: "Within 24h of an interview",
      cls: "svc-letter__head--amber",
      preview: "Dear [Interviewer],\nThank you for the opportunity to discuss the role today. I especially enjoyed learning about your team's roadmap, and I am confident my experience with...",
    },
    {
      type: "Application Letter",
      icon: FiEdit3,
      use: "Jobs that request a letter",
      cls: "svc-letter__head--indigo",
      preview: "Dear Sir/Madam,\nI wish to express my keen interest in the position advertised on Maven Jobs. My background in digital marketing, combined with a track record of growing organic reach by...",
    },
  ];

  const faqs = [
    { q: "Can I use these letters as-is?", a: "They work best as a strong starting point. Personalize the company, role and at least one specific achievement before sending — recruiters can spot boilerplate instantly." },
    { q: "Which letter do I actually need?", a: "Cover letters accompany applications. Follow-up and thank-you letters strengthen an in-flight application. Application letters are only needed when an employer asks for one." },
    { q: "Should letters be formal in tone?", a: "Professional but human. Short sentences, active voice and warmth beat stiff corporate language in most Indian companies today." },
    { q: "Is there a limit on length?", a: "Keep it under 200 words — roughly one page. Recruiters skim letters in under a minute." },
  ];

  return (
    <div className="svc-root">
      <LandingHeader />
      <main className="svc-main responsive-container">
        <nav className="svc-crumbs">
          <Link to="/services" className="svc-crumbs__link">Services</Link>
          <FiChevronRight className="svc-crumbs__sep" />
          <span className="svc-crumbs__cur">Job Letter Samples</span>
        </nav>

        <section className="svc-hero">
          <span className="svc-badge">
            <FiFile /> Free Resume Resources
          </span>
          <h1 className="svc-title">
            Cover Letters That Open<br />Doors, Not Doors-Straight-To-Rejections
          </h1>
          <p className="svc-sub">
            Professionally drafted cover, follow-up, thank-you and application
            letter templates from Maven Jobs — free to view, download and
            personalize.
          </p>
          <div className="svc-actions">
            <a href="#letters" className="svc-btn svc-btn--primary">
              View All Letters <FiArrowRight />
            </a>
          </div>
        </section>

        <section id="letters" className="svc-section">
          <div className="svc-sechead">
            <span className="svc-eyebrow">Letter library</span>
            <h2 className="svc-sechead__title">Four letters for every stage</h2>
          </div>
          <div className="svc-letter-grid">
            {letters.map(({ type, icon: Icon, use, cls, preview }) => (
              <article key={type} className="svc-letter">
                <div className={`svc-letter__head ${cls}`}>
                  <div className="svc-letter__who">
                    <span className="svc-letter__head-icon"><Icon size={20} /></span>
                    <div>
                      <h3>{type}</h3>
                      <p>{use}</p>
                    </div>
                  </div>
                </div>
                <div className="svc-letter__body">
                  <div className="svc-letter__preview">
                    <pre>{preview}</pre>
                  </div>
                  <div className="svc-letter__actions">
                    <button className="svc-letter__view">
                      Full Sample <FiEye size={14} />
                    </button>
                    <button className="svc-letter__doc">
                      <FiDownload size={14} /> Word Doc
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="svc-section">
          <div className="svc-sechead">
            <span className="svc-eyebrow">Tips</span>
            <h2 className="svc-sechead__title">Letters recruiters finish reading</h2>
          </div>
          <div className="svc-grid svc-grid--4">
            {[
              { title: "Name the company", desc: "Never send a letter addressed to 'Hiring Team'." },
              { title: "Lead with impact", desc: "Open with your best, most relevant achievement." },
              { title: "Mirror the JD", desc: "Reflect the exact skills the role asks for." },
              { title: "End with a call", desc: "Ask for the interview — politely and directly." },
            ].map(({ title, desc }) => (
              <article key={title} className="svc-card svc-card--center">
                <span className="svc-check-circle"><FiCheck size={18} strokeWidth={3} /></span>
                <h3>{title}</h3>
                <p>{desc}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="svc-banner">
          <div className="svc-glow svc-glow--a" />
          <div className="svc-banner__inner">
            <div className="svc-banner__text">
              <span className="svc-banner__chip">
                <FiBookOpen size={13} /> A resume gets you the interview — a letter can help you get in
              </span>
              <h2>Pair your letter with a strong resume</h2>
              <p>Build a matching resume in minutes with the free Resume Maker.</p>
            </div>
            <Link to="/services/resume-maker" className="svc-banner__btn">
              Build My Resume <FiArrowRight />
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
          <p className="svc-faq__note">
            Prefer a written-for-you resume?{" "}
            <Link to="/services/text-resume" className="svc-faq__link">
              Explore Text Resume
            </Link>
          </p>
        </section>
      </main>
      <LandingFooter />
    </div>
  );
};

export default JobLetterSamples;