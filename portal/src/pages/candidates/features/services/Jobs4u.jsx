import React from "react";
import { Link } from "react-router-dom";
import {
  FiArrowRight, FiBell, FiCheck, FiChevronRight, FiClock,
  FiHeadphones, FiList, FiSearch, FiSend, FiTarget, FiUsers,
} from "react-icons/fi";
import LandingHeader from "../../../../components/LandingHeader";
import LandingFooter from "../../../../components/LandingFooter";
import "./Jobs4u.css";

const FAQItem = ({ q, a }) => (
  <details className="svc-faq__item">
    <summary>
      {q}
      <FiChevronRight />
    </summary>
    <p>{a}</p>
  </details>
);

const Jobs4u = () => {
  const features = [
    { icon: FiTarget, title: "Profile-Matched Jobs", desc: "Your specialist matches your profile against new openings across the Maven Jobs network every single day." },
    { icon: FiList, title: "Weekly Curated Shortlist", desc: "Every Monday, receive a hand-picked list of best-fit roles — zero spam, zero irrelevant alerts." },
    { icon: FiSend, title: "Application Tracking", desc: "Follow every application from one dashboard, with smart nudges when recruiters go quiet." },
    { icon: FiBell, title: "Interview Alerts", desc: "Instant notification the moment an employer shortlists you, with prep tips for the round." },
    { icon: FiHeadphones, title: "Dedicated Specialist", desc: "A real Maven Jobs career specialist owns your search and is a WhatsApp message away." },
    { icon: FiUsers, title: "Resume Introductions", desc: "Your resume is introduced to recruiters hiring for matching roles, before roles go public." },
  ];

  const steps = [
    { num: "01", title: "Tell us your goals", desc: "Share preferred roles, locations and salary expectations." },
    { num: "02", title: "We build the pipeline", desc: "Specialists scan thousands of openings for the best fits." },
    { num: "03", title: "Approve & apply", desc: "One-click approval for applications we submit on your behalf." },
    { num: "04", title: "Interview faster", desc: "Track responses, get alerts and land the offer sooner." },
  ];

  const faqs = [
    { q: "How is Jobs4U different from job alerts?", a: "Alerts only notify you. Jobs4U matches you, applies on your behalf and tracks every application until you get an interview or a clear answer." },
    { q: "Do I lose control over my applications?", a: "Never. Every application is sent for your approval first — batch-approve or review each role manually." },
    { q: "Who benefits the most?", a: "Busy professionals, freshers and experienced candidates who find filtering thousands of listings time-consuming." },
    { q: "Is there a refund guarantee?", a: "If you receive zero interview invites within 60 days of activation, contact support@mavenjobs.com for a full refund." },
  ];

  return (
    <div className="svc-root">
      <LandingHeader />
      <main className="svc-main responsive-container">
        <nav className="svc-crumbs">
          <Link to="/services" className="svc-crumbs__link">Services</Link>
          <FiChevronRight className="svc-crumbs__sep" />
          <span className="svc-crumbs__cur">Jobs4U</span>
        </nav>

        <section className="svc-hero">
          <span className="svc-badge">
            <FiSearch /> Find Jobs
          </span>
          <h1 className="svc-title">
            Jobs4U — We Hunt,<br />You Get Hired
          </h1>
          <p className="svc-sub">
            A personal job-search team that matches your profile, applies on
            your behalf and chases every application until you land an
            interview with Maven Jobs&apos; partner companies.
          </p>
          <div className="svc-actions">
            <Link to="/services/contact-us" className="svc-btn svc-btn--primary">
              Start My Job Hunt <FiArrowRight />
            </Link>
            <a href="#pricing" className="svc-btn svc-btn--ghost">
              View Plans <FiChevronRight />
            </a>
          </div>
        </section>

        <section className="svc-stats">
          {[
            { num: "1,200+", label: "Partner Companies" },
            { num: "12,000+", label: "Jobs Matched / Month" },
            { num: "3.2x", label: "More Interview Invites" },
            { num: "6 wks", label: "Avg. Time to Offer" },
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
            <h2 className="svc-sechead__title">A dedicated job-search engine, for you</h2>
          </div>
          <div className="svc-grid">
            {features.map(({ icon: Icon, title, desc }) => (
              <article key={title} className="svc-card">
                <span className="svc-card__icon">
                  <Icon size={22} />
                </span>
                <h3>{title}</h3>
                <p>{desc}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="svc-section">
          <div className="svc-sechead">
            <span className="svc-eyebrow">How it works</span>
            <h2 className="svc-sechead__title">Your search, on autopilot</h2>
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
          <div className="svc-plans">
            <div className="svc-price">
              <div className="svc-price__head">
                <div className="svc-price__tag">Starter</div>
                <div className="svc-price__amt">
                  <span className="svc-price__cur">₹</span>649
                  <span className="svc-price__per">/ month</span>
                </div>
              </div>
              <div className="svc-price__body">
                <ul className="svc-feats">
                  {["Weekly curated job shortlist", "One-click application approvals", "Application status tracking", "WhatsApp interview alerts"].map((f) => (
                    <li key={f}>
                      <span className="svc-feats__check"><FiCheck size={12} strokeWidth={3} /></span>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link to="/services/contact-us" className="svc-price__cta svc-price__cta--navy">
                  Choose Starter <FiArrowRight />
                </Link>
              </div>
            </div>

            <div className="svc-price svc-price--green">
              <span className="svc-rec-badge">Recommended</span>
              <div className="svc-price__head svc-price__head--green">
                <div className="svc-price__tag">Pro</div>
                <div className="svc-price__amt">
                  <span className="svc-price__cur">₹</span>1,599
                  <span className="svc-price__per">/ 3 months</span>
                </div>
              </div>
              <div className="svc-price__body">
                <ul className="svc-feats">
                  {["Everything in Starter", "Dedicated career specialist", "Auto-applications with your approval", "Resume introductions to recruiters", "Priority interview prep support"].map((f) => (
                    <li key={f}>
                      <span className="svc-feats__check"><FiCheck size={12} strokeWidth={3} /></span>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link to="/services/contact-us" className="svc-price__cta">
                  Choose Pro <FiArrowRight />
                </Link>
              </div>
            </div>
          </div>
          <p className="svc-guarantee">
            60-day no-interview money-back guarantee
          </p>
        </section>

        <section className="svc-banner">
          <div className="svc-glow svc-glow--a" />
          <div className="svc-banner__inner">
            <div className="svc-banner__text">
              <span className="svc-banner__chip">
                <FiClock size={13} /> Stop scrolling job boards at midnight
              </span>
              <h2>Let a specialist do the searching for you</h2>
              <p>
                Members save an average of 11 hours a week on their job search.
              </p>
            </div>
            <Link to="/services/contact-us" className="svc-banner__btn">
              Activate Jobs4U <FiArrowRight />
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

export default Jobs4u;