import React from "react";
import { Link } from "react-router-dom";
import {
  FiArrowRight, FiBookOpen, FiCheck, FiChevronRight, FiDownload,
  FiEye, FiFileText, FiTag, FiZap,
} from "react-icons/fi";
import LandingHeader from "../../../../components/LandingHeader";
import LandingFooter from "../../../../components/LandingFooter";
import "./ResumeSamples.css";

const FAQItem = ({ q, a }) => (
  <details className="svc-faq__item">
    <summary>
      {q}
      <FiChevronRight />
    </summary>
    <p>{a}</p>
  </details>
);

const ResumeSamples = () => {
  const samples = [
    { role: "Fresher", area: "Across all streams", level: "0-1 years", cls: "svc-sample__head--emerald" },
    { role: "Software Engineer", area: "IT & product companies", level: "1-6 years", cls: "svc-sample__head--blue" },
    { role: "Data Analyst", area: "Analytics & BI teams", level: "1-8 years", cls: "svc-sample__head--indigo" },
    { role: "Sales Executive", area: "Retail, B2B & field sales", level: "1-8 years", cls: "svc-sample__head--amber" },
    { role: "Marketing Manager", area: "Brand, digital & growth", level: "4-12 years", cls: "svc-sample__head--rose" },
    { role: "HR Executive", area: "Recruitment & people ops", level: "1-8 years", cls: "svc-sample__head--cyan" },
    { role: "Accountant", area: "Finance & taxation", level: "1-10 years", cls: "svc-sample__head--slate" },
    { role: "Project Manager", area: "Delivery & program mgmt", level: "5-15 years", cls: "svc-sample__head--fuchsia" },
    { role: "Customer Support", area: "Voice, chat & email ops", level: "0-5 years", cls: "svc-sample__head--lime" },
  ];

  const faqs = [
    { q: "Are these samples free to use?", a: "Yes. Every sample is free to view and download. Use them as a reference, or copy the structure into the free Resume Maker." },
    { q: "Will copying a sample get me noticed?", a: "Samples work best as skeletons — they show structure, sections and language. Customize the facts, keywords and achievements to your own experience." },
    { q: "Do you have samples for other roles?", a: "This library covers the most in-demand roles on Maven Jobs. Need something specific? Write to support@mavenjobs.com and we may add it." },
    { q: "How do these differ from paid resume services?", a: "Samples give you a self-serve starting point. Our paid services have experts write or critique a resume tailored to your exact profile." },
  ];

  return (
    <div className="svc-root">
      <LandingHeader />
      <main className="svc-main responsive-container">
        <nav className="svc-crumbs">
          <Link to="/services" className="svc-crumbs__link">Services</Link>
          <FiChevronRight className="svc-crumbs__sep" />
          <span className="svc-crumbs__cur">Resume Samples</span>
        </nav>

        <section className="svc-hero">
          <span className="svc-badge">
            <FiBookOpen /> Free Resume Resources
          </span>
          <h1 className="svc-title">
            Resume Samples That<br />Show You How It&apos;s Done
          </h1>
          <p className="svc-sub">
            Role-specific resume examples written the way Maven Jobs recruiters
            expect — free to view, download and adapt for your own search.
          </p>
          <div className="svc-actions">
            <a href="#samples" className="svc-btn svc-btn--primary">
              Browse All Samples <FiArrowRight />
            </a>
          </div>
        </section>

        <section id="samples" className="svc-section">
          <div className="svc-sechead">
            <span className="svc-eyebrow">Sample library</span>
            <h2 className="svc-sechead__title">By role &amp; experience level</h2>
          </div>
          <div className="svc-sample-grid">
            {samples.map(({ role, area, level, cls }) => (
              <article key={role} className="svc-sample">
                <div className={`svc-sample__head ${cls}`}>
                  <h3>{role}</h3>
                  <FiFileText size={20} />
                </div>
                <div className="svc-sample__body">
                  <p>{area}</p>
                  <div className="svc-sample__tag-wrap">
                    <span className="svc-sample__tag">
                      <FiTag size={10} /> {level}
                    </span>
                  </div>
                  <div className="svc-sample__actions">
                    <button className="svc-sample__view">
                      View Sample <FiEye size={14} />
                    </button>
                    <button className="svc-sample__pdf">
                      <FiDownload size={14} /> PDF
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
            <h2 className="svc-sechead__title">Make any sample your own</h2>
          </div>
          <div className="svc-grid svc-grid--4">
            {[
              { title: "Keep the structure", desc: "Headings, order and section names are battle-tested." },
              { title: "Swap in real numbers", desc: "Replace placeholders with your actual achievements." },
              { title: "Match the job ad", desc: "Mirror the keywords from each job you apply to." },
              { title: "Stay under 2 pages", desc: "Freshers: 1 page. Experienced: 2 pages max." },
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
                <FiZap size={13} /> Don&apos;t copy — customize
              </span>
              <h2>Turn a sample into your resume in minutes</h2>
              <p>
                Paste the structure into the free Resume Maker and make it yours.
              </p>
            </div>
            <Link to="/resume-builder" className="svc-banner__btn">
              Open Resume Maker <FiArrowRight />
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
            Want a cover letter to go with it?{" "}
            <Link to="/services/job-letter-samples" className="svc-faq__link">
              Browse Job Letter Samples
            </Link>
          </p>
        </section>
      </main>
      <LandingFooter />
    </div>
  );
};

export default ResumeSamples;