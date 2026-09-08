import React from "react";
import { Link } from "react-router-dom";
import {
  FiArrowRight, FiCheck, FiChevronRight, FiDownload, FiEdit3,
  FiFileText, FiLayout, FiMousePointer, FiShield, FiZap,
} from "react-icons/fi";
import LandingHeader from "../../../../components/LandingHeader";
import LandingFooter from "../../../../components/LandingFooter";
import "./ResumeMaker.css";

const FAQItem = ({ q, a }) => (
  <details className="svc-faq__item">
    <summary>
      {q}
      <FiChevronRight />
    </summary>
    <p>{a}</p>
  </details>
);

const ResumeMaker = () => {
  const templates = [
    { name: "Classic Professional", level: "All experience", cls: "svc-tpl__preview--blue" },
    { name: "Modern Minimal", level: "Freshers & interns", cls: "svc-tpl__preview--slate" },
    { name: "Creative Studio", level: "Design & marketing", cls: "svc-tpl__preview--rose" },
    { name: "Executive Bold", level: "Managers & leads", cls: "svc-tpl__preview--emerald" },
    { name: "Tech Focus", level: "Engineers & analysts", cls: "svc-tpl__preview--indigo" },
    { name: "Elegant Serif", level: "HR, admin & finance", cls: "svc-tpl__preview--amber" },
  ];

  const steps = [
    { num: "01", title: "Pick a template", desc: "Start from a recruiter-approved layout in seconds." },
    { num: "02", title: "Fill in your details", desc: "Smart fields guide you section by section." },
    { num: "03", title: "Get live tips", desc: "Real-time suggestions fix weak bullets as you type." },
    { num: "04", title: "Download for free", desc: "Export as PDF or Word in one click — 100% free." },
  ];

  const faqs = [
    { q: "Is the Resume Maker really free?", a: "Yes — build, edit and download your resume at no cost. Premium plans only add visibility features like Priority Applicant and Resume Display." },
    { q: "Are the templates ATS-friendly?", a: "Every template is built on an ATS-safe structure with clean headings and machine-readable layouts." },
    { q: "Can I export to both PDF and Word?", a: "Absolutely. Download a print-ready PDF or an editable Word file and keep tailoring it as you apply." },
    { q: "Do I need to create an account?", a: "An account lets you save your resume and come back later. Building and downloading works for logged-in Maven Jobs users." },
  ];

  return (
    <div className="svc-root">
      <LandingHeader />
      <main className="svc-main responsive-container">
        <nav className="svc-crumbs">
          <Link to="/services" className="svc-crumbs__link">Services</Link>
          <FiChevronRight className="svc-crumbs__sep" />
          <span className="svc-crumbs__cur">Resume Maker</span>
        </nav>

        <section className="svc-hero">
          <span className="svc-badge">
            <FiZap /> Free Resume Resources
          </span>
          <h1 className="svc-title">
            Build a Resume Recruiters<br />Actually Read — For Free
          </h1>
          <p className="svc-sub">
            The Maven Jobs Resume Maker gives you recruiter-approved templates,
            live writing tips and one-click PDF/Word export. No cost, no
            limits, no credit card.
          </p>
          <div className="svc-actions">
            <Link to="/resume-builder" className="svc-btn svc-btn--primary">
              Start Building Free <FiArrowRight />
            </Link>
            <a href="#templates" className="svc-btn svc-btn--ghost">
              Browse Templates <FiChevronRight />
            </a>
          </div>
        </section>

        <section className="svc-banner-stats">
          {[
            { num: "100+", label: "Recruiter-approved templates" },
            { num: "2 min", label: "Average time to a first draft" },
            { num: "100%", label: "Free to build & download" },
          ].map((s) => (
            <div key={s.label}>
              <div className="svc-banner-stats__num">{s.num}</div>
              <div className="svc-banner-stats__label">{s.label}</div>
            </div>
          ))}
        </section>

        <section id="templates" className="svc-section">
          <div className="svc-sechead">
            <span className="svc-eyebrow">Template gallery</span>
            <h2 className="svc-sechead__title">Start with a look you love</h2>
          </div>
          <div className="svc-tpl-grid">
            {templates.map(({ name, level, cls }) => (
              <article key={name} className="svc-tpl">
                <div className={`svc-tpl__preview ${cls}`}>
                  <div className="svc-tpl__stripes" />
                  <div className="svc-tpl__sheet">
                    <div className="svc-tpl__bar svc-tpl__bar--name" />
                    <div className="svc-tpl__bar svc-tpl__bar--full" />
                    <div className="svc-tpl__bar svc-tpl__bar--wide" />
                  </div>
                </div>
                <div className="svc-tpl__body">
                  <h3>{name}</h3>
                  <p>{level}</p>
                  <Link to="/resume-builder" className="svc-tpl__link">
                    Use this template <FiArrowRight size={14} />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="svc-section">
          <div className="svc-sechead">
            <span className="svc-eyebrow">How it works</span>
            <h2 className="svc-sechead__title">From blank page to polished PDF</h2>
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

        <section className="svc-section">
          <div className="svc-sechead">
            <span className="svc-eyebrow">Why use it</span>
            <h2 className="svc-sechead__title">Built by people who read resumes all day</h2>
          </div>
          <div className="svc-grid svc-grid--4">
            {[
              { icon: FiLayout, title: "Smart formatting", desc: "Perfect spacing and alignment, automatically." },
              { icon: FiEdit3, title: "Live writing coach", desc: "Real-time tips improve every section." },
              { icon: FiFileText, title: "ATS-safe output", desc: "Structured to survive any applicant tracking system." },
              { icon: FiShield, title: "Private by default", desc: "Your resume is visible only to you." },
            ].map(({ icon: Icon, title, desc }) => (
              <article key={title} className="svc-card svc-card--center">
                <span className="svc-card__icon"><Icon size={22} /></span>
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
                <FiMousePointer size={13} /> It takes less time than reading this page
              </span>
              <h2>Your new resume is minutes away</h2>
              <p>Open the Resume Builder and download your first draft today.</p>
            </div>
            <Link to="/resume-builder" className="svc-banner__btn">
              Open Resume Builder <FiArrowRight />
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
          <p className="svc-faq__note svc-faq__note--center">
            <FiDownload className="svc-faq__icon" />
            Want it written by an expert instead?{" "}
            <Link to="/services/text-resume" className="svc-faq__link">Try Text Resume</Link>
          </p>
        </section>
      </main>
      <LandingFooter />
    </div>
  );
};

export default ResumeMaker;