import React from "react";
import { Link } from "react-router-dom";
import {
  FiArrowRight, FiBarChart2, FiCheck, FiChevronRight, FiDroplet,
  FiImage, FiLayers, FiLink, FiPenTool, FiPrinter, FiRefreshCw, FiZap,
} from "react-icons/fi";
import LandingHeader from "../../../../components/LandingHeader";
import LandingFooter from "../../../../components/LandingFooter";
import "./VisualResume.css";

const FAQItem = ({ q, a }) => (
  <details className="svc-faq__item">
    <summary>
      {q}
      <FiChevronRight />
    </summary>
    <p>{a}</p>
  </details>
);

const VisualResume = () => {
  const features = [
    { icon: FiDroplet, title: "Modern Infographic Design", desc: "A visually rich, creative layout that tells your career story at a glance." },
    { icon: FiLink, title: "Portfolio Link Included", desc: "Your live portfolio, GitHub or LinkedIn is woven into the design for instant access." },
    { icon: FiBarChart2, title: "High-Impact Visuals", desc: "Skill meters, timeline graphics and achievement callouts that recruiters remember." },
    { icon: FiPrinter, title: "Print-Ready PDF", desc: "A crisp, print-ready PDF plus an editable source file for future tweaks." },
    { icon: FiImage, title: "Brand-Matched Colors", desc: "Palette tuned to your industry, role and personal brand." },
    { icon: FiRefreshCw, title: "3 Revision Rounds", desc: "Three rounds of revisions until every pixel is perfect." },
  ];

  const steps = [
    { num: "01", title: "Pick your style", desc: "Choose from signature visual templates or brief us on your own vision." },
    { num: "02", title: "Designer drafts it", desc: "A Maven Jobs designer builds your visual resume within 4 working days." },
    { num: "03", title: "Collaborate & refine", desc: "Iterate through 3 revision rounds with your dedicated designer." },
    { num: "04", title: "Share everywhere", desc: "Download your print-ready PDF and digital files for every platform." },
  ];

  const faqs = [
    { q: "Will a visual resume work with ATS systems?", a: "Visual resumes are best shared directly with recruiters, on social profiles, or as a PDF attachment. We also include a plain-text ATS version with every visual resume at no extra cost." },
    { q: "Which roles suit a visual resume best?", a: "Design, marketing, product, creative and leadership roles benefit the most. If your role is very process-driven, we can recommend a text resume instead." },
    { q: "How is this different from the text resume service?", a: "A text resume prioritises ATS parsing and keyword density. A visual resume prioritises design impact and brand storytelling. Both are crafted by Maven Jobs experts." },
    { q: "Can I reuse the design for LinkedIn or a portfolio site?", a: "Yes. You receive layered digital files that you can adapt for LinkedIn banners, portfolio thumbnails and other online profiles." },
    { q: "What if I don't like the final design?", a: "You get 3 revision rounds. If you are still not satisfied, contact support@mavenjobs.com within 7 days for a full refund." },
  ];

  return (
    <div className="svc-root">
      <LandingHeader />
      <main className="svc-main responsive-container">
        <nav className="svc-crumbs">
          <Link to="/services" className="svc-crumbs__link">Services</Link>
          <FiChevronRight className="svc-crumbs__sep" />
          <span className="svc-crumbs__cur">Visual Resume</span>
        </nav>

        <section className="svc-hero">
          <span className="svc-badge">
            <FiPenTool /> Resume Writing
          </span>
          <h1 className="svc-title">
            Visual Resume That<br />Makes Recruiters Stop &amp; Look
          </h1>
          <p className="svc-sub">
            A stunning infographic-style resume designed by Maven Jobs creative
            experts — pairing your story with visuals, timelines and a portfolio
            link recruiters can&apos;t ignore.
          </p>
          <div className="svc-actions">
            <Link to="/services/contact-us" className="svc-btn svc-btn--primary">
              Design My Visual Resume <FiArrowRight />
            </Link>
            <a href="#pricing" className="svc-btn svc-btn--ghost">
              View Pricing <FiChevronRight />
            </a>
          </div>
        </section>

        <section className="svc-showcase">
          {[
            { tag: "CREATIVE CHOICE", title: "Design roles love it", cls: "svc-tag--rose" },
            { tag: "3× RECALL", title: "Recruiters remember visuals", cls: "svc-tag--indigo" },
            { tag: "100% YOUR BRAND", title: "Colors, fonts & voice matched", cls: "svc-tag--green" },
          ].map((b) => (
            <div key={b.tag} className="svc-card svc-card--center">
              <span className={`svc-tag ${b.cls}`}>{b.tag}</span>
              <p className="svc-showcase__title">{b.title}</p>
            </div>
          ))}
        </section>

        <section className="svc-section">
          <div className="svc-sechead">
            <span className="svc-eyebrow">What&apos;s included</span>
            <h2 className="svc-sechead__title">Design that works as hard as you do</h2>
          </div>
          <div className="svc-grid svc-grid--3">
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
            <h2 className="svc-sechead__title">From brief to brilliant in 4 steps</h2>
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
                <div className="svc-price__tag">Visual Resume</div>
                <div className="svc-price__amt">
                  <span className="svc-price__cur">₹</span>2,499
                  <span className="svc-price__per">/ one-time</span>
                </div>
                <p className="svc-price__sub">No hidden charges. GST included.</p>
              </div>
              <div className="svc-price__body">
                <ul className="svc-feats">
                  {[
                    "Custom infographic resume design",
                    "Portfolio & social links integrated",
                    "Skill meters & career timeline graphics",
                    "3 free revision rounds",
                    "Print-ready PDF + editable files",
                    "Free plain-text ATS version included",
                  ].map((f) => (
                    <li key={f}>
                      <span className="svc-feats__check"><FiCheck size={12} strokeWidth={3} /></span>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link to="/services/contact-us" className="svc-price__cta">
                  Get My Visual Resume <FiArrowRight />
                </Link>
                <p className="svc-guarantee">30-day money-back guarantee</p>
              </div>
            </div>
          </div>
        </section>

        <section className="svc-banner">
          <div className="svc-glow svc-glow--a" />
          <div className="svc-glow svc-glow--b" />
          <div className="svc-banner__inner">
            <div className="svc-banner__text">
              <span className="svc-banner__chip">
                <FiZap size={13} /> Stand out in design-led teams
              </span>
              <h2>Your career deserves better than a plain template</h2>
              <p>
                Get a visual resume that turns your experience into a story
                recruiters remember.
              </p>
            </div>
            <div className="svc-banner__actions">
              <Link to="/services/contact-us" className="svc-banner__btn">
                Start My Design <FiArrowRight />
              </Link>
              <Link to="/services/text-resume" className="svc-banner__btn svc-banner__btn--ghost">
                Compare Text Resume
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
            Not sure which resume type fits you?{" "}
            <Link to="/services/contact-us" className="svc-faq__link">
              Ask our experts
            </Link>
          </p>
        </section>
      </main>
      <LandingFooter />
    </div>
  );
};

export default VisualResume;