import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  FiArrowRight, FiCheck, FiChevronRight, FiCpu, FiDownload,
  FiFileText, FiActivity, FiSearch, FiTrendingUp, FiUpload, FiZap,
} from "react-icons/fi";
import LandingHeader from "../../../../components/LandingHeader";
import LandingFooter from "../../../../components/LandingFooter";
import "./ResumeQualityScore.css";

const FAQItem = ({ q, a }) => (
  <details className="svc-faq__item">
    <summary>
      {q}
      <FiChevronRight />
    </summary>
    <p>{a}</p>
  </details>
);

const ResumeQualityScore = () => {
  const [uploaded, setUploaded] = useState(false);
  const [fileName, setFileName] = useState("");

  const onFile = (e) => {
    const f = e.target.files?.[0];
    if (f) {
      setFileName(f.name);
      setUploaded(true);
    }
  };

  const criteria = [
    { icon: FiFileText, title: "ATS Compatibility", desc: "Does your layout parse cleanly through applicant tracking systems?", pct: "30%" },
    { icon: FiSearch, title: "Keyword Match", desc: "Are the right keywords present for your target role and industry?", pct: "25%" },
    { icon: FiActivity, title: "Impact & Achievements", desc: "Do your bullets show measurable outcomes, not just duties?", pct: "20%" },
    { icon: FiTrendingUp, title: "Format & Structure", desc: "Clear hierarchy, correct length and consistent styling?", pct: "15%" },
    { icon: FiCpu, title: "Action Verbs & Tone", desc: "Strong, active language that recruiters skim-read well?", pct: "10%" },
  ];

  const faqs = [
    { q: "Is the quality score free?", a: "Yes, completely free. Upload your resume and get an instant score with a breakdown — no sign-up required for the first scan." },
    { q: "What file formats are supported?", a: "PDF, DOC and DOCX are supported. A text or PDF version of your resume scores the most accurately." },
    { q: "Is my resume stored after scoring?", a: "No. Your file is analysed in memory and deleted immediately after scoring. We never keep a copy." },
    { q: "What score should I aim for?", a: "Above 75 is a good baseline for most roles. If you score lower, the report lists the exact sections to fix first." },
  ];

  return (
    <div className="svc-root">
      <LandingHeader />
      <main className="svc-main responsive-container">
        <nav className="svc-crumbs">
          <Link to="/services" className="svc-crumbs__link">Services</Link>
          <FiChevronRight className="svc-crumbs__sep" />
          <span className="svc-crumbs__cur">Resume Quality Score</span>
        </nav>

        <section className="svc-hero">
          <span className="svc-badge">
            <FiActivity /> Free Resume Resources
          </span>
          <h1 className="svc-title">
            How Strong Is Your Resume?<br />Find Out in 10 Seconds
          </h1>
          <p className="svc-sub">
            Upload your resume and the Maven Jobs engine scores it out of 100
            across ATS compatibility, keywords, impact and formatting — with a
            fix-it list you can use right away. Free forever.
          </p>
        </section>

        <section className="svc-upload">
          {!uploaded ? (
            <>
              <span className="svc-upload__icon"><FiUpload size={26} /></span>
              <h2 className="svc-upload__title">Upload your resume</h2>
              <p className="svc-upload__sub">PDF, DOC or DOCX · Max 5 MB</p>
              <label className="svc-upload__btn">
                Choose File <FiArrowRight />
                <input type="file" accept=".pdf,.doc,.docx" className="svc-upload__input" onChange={onFile} />
              </label>
              <p className="svc-upload__note">Your file is analysed &amp; deleted instantly</p>
            </>
          ) : (
            <div className="svc-upload__result">
              <div
                className="svc-ring"
                style={{ background: "conic-gradient(#10b981 0% 78%, #e2e8f0 78% 100%)" }}
              >
                <div className="svc-ring__inner">
                  <span className="svc-score__num">78</span>
                  <span className="svc-score__label">good score</span>
                </div>
              </div>
              <h3 className="svc-upload__title">{fileName} scored!</h3>
              <p className="svc-upload__sub">
                Solid foundation. Fix the gaps below to cross the 85 mark and
                beat most applicants.
              </p>
              <div className="svc-tips">
                {["Add 2-3 more quantified achievements", "Weave in 4+ keywords from your target job description", "Cut the summary to 2 punchy lines"].map((tip) => (
                  <div key={tip} className="svc-tip">
                    <span className="svc-feats__check"><FiCheck size={12} strokeWidth={3} /></span>
                    {tip}
                  </div>
                ))}
              </div>
              <button
                onClick={() => { setUploaded(false); setFileName(""); }}
                className="svc-upload__again"
              >
                Score Another Resume
              </button>
            </div>
          )}
        </section>

        <section className="svc-section">
          <div className="svc-sechead">
            <span className="svc-eyebrow">What we measure</span>
            <h2 className="svc-sechead__title">Five factors, one honest number</h2>
          </div>
          <div className="svc-grid">
            {criteria.map(({ icon: Icon, title, desc, pct }) => (
              <article key={title} className="svc-card svc-card--criteria">
                <div className="svc-criteria__head">
                  <span className="svc-card__icon"><Icon size={22} /></span>
                  <span className="svc-criteria__pct">{pct}</span>
                </div>
                <h3>{title}</h3>
                <p>{desc}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="svc-section">
          <div className="svc-sechead">
            <span className="svc-eyebrow">How it works</span>
            <h2 className="svc-sechead__title">Three steps to a stronger resume</h2>
          </div>
          <div className="svc-steps svc-steps--3">
            {[
              { num: "01", title: "Upload", desc: "Drop your resume file into the scorer." },
              { num: "02", title: "Instant score", desc: "Get a 0-100 score with a factor breakdown." },
              { num: "03", title: "Fix & re-upload", desc: "Apply the tips, re-scan and watch your score climb." },
            ].map((s) => (
              <div key={s.num} className="svc-step svc-step--center">
                <span className="svc-step__num">{s.num}</span>
                <h3>{s.title}</h3>
                <p>{s.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="svc-banner">
          <div className="svc-glow svc-glow--a" />
          <div className="svc-banner__inner">
            <div className="svc-banner__text">
              <span className="svc-banner__chip">
                <FiZap size={13} /> Low score? We&apos;ll fix it for you
              </span>
              <h2>Want a 90+ resume without the effort?</h2>
              <p>
                Let a Maven Jobs expert write it — critique first, or straight
                to a professional text resume.
              </p>
            </div>
            <div className="svc-banner__actions">
              <Link to="/services/resume-critique" className="svc-banner__btn">
                Get a Critique <FiArrowRight />
              </Link>
              <Link to="/services/text-resume" className="svc-banner__btn svc-banner__btn--ghost">
                Text Resume Service
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
          <p className="svc-faq__note svc-faq__note--center">
            <FiDownload className="svc-faq__icon" />
            Need a resume first?{" "}
            <Link to="/services/resume-maker" className="svc-faq__link">Use the free Resume Maker</Link>
          </p>
        </section>
      </main>
      <LandingFooter />
    </div>
  );
};

export default ResumeQualityScore;