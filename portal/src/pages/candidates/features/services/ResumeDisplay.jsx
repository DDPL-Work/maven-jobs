import React from "react";
import { Link } from "react-router-dom";
import {
  FiArrowRight, FiBarChart2, FiCheck, FiChevronRight, FiEye,
  FiMail, FiSearch, FiStar, FiTarget, FiTrendingUp, FiUsers, FiZap,
} from "react-icons/fi";
import LandingHeader from "../../../../components/LandingHeader";
import LandingFooter from "../../../../components/LandingFooter";
import "./ResumeDisplay.css";

const FAQItem = ({ q, a }) => (
  <details className="svc-faq__item">
    <summary>
      {q}
      <FiChevronRight />
    </summary>
    <p>{a}</p>
  </details>
);

const ResumeDisplay = () => {
  const features = [
    { icon: FiEye, title: "3x Profile Visibility", desc: "Your resume is surfaced to three times more recruiters browsing in your domain." },
    { icon: FiStar, title: "Featured Profile Badge", desc: "A standout badge that flags you as a verified, actively-searching candidate." },
    { icon: FiBarChart2, title: "Recruiter Analytics", desc: "See who viewed, searched for and shortlisted your profile — in real time." },
    { icon: FiMail, title: "InMail Unlocked", desc: "Message recruiters directly, even before they reach out to you." },
    { icon: FiTarget, title: "Top-of-Search Placement", desc: "Rank higher in recruiter searches for your role, location and skills." },
    { icon: FiTrendingUp, title: "Weekly Visibility Report", desc: "A Monday digest of your profile views, searches and recruiter actions." },
  ];

  const steps = [
    { num: "01", title: "Enable Resume Display", desc: "Activate display on your current Maven Jobs plan in one click." },
    { num: "02", title: "Profile gets featured", desc: "Your badge, placement and visibility multipliers switch on instantly." },
    { num: "03", title: "Recruiters discover you", desc: "More views, more InMails and more shortlists from matching employers." },
    { num: "04", title: "Track the impact", desc: "Measure every view and message in your weekly visibility report." },
  ];

  const faqs = [
    { q: "Is my profile visible to my current employer?", a: "No. Maven Jobs gives you full control — your display settings let you block specific companies from seeing your profile at any time." },
    { q: "What does '3x visibility' actually mean?", a: "Your profile appears in three times as many recruiter search result pages for your target role and location, compared to a standard profile." },
    { q: "Do I need a perfect profile first?", a: "A complete profile helps, but display works alongside our resume services. Many candidates enable display and upgrade their resume simultaneously." },
    { q: "Can I switch it off?", a: "Yes, anytime from your dashboard. Billing stops at the end of the current billing cycle with no cancellation fees." },
  ];

  return (
    <div className="svc-root">
      <LandingHeader />
      <main className="svc-main responsive-container">
        <nav className="svc-crumbs">
          <Link to="/services" className="svc-crumbs__link">Services</Link>
          <FiChevronRight className="svc-crumbs__sep" />
          <span className="svc-crumbs__cur">Resume Display</span>
        </nav>

        <section className="svc-hero">
          <span className="svc-badge">
            <FiEye /> Get Recruiter&apos;s Attention
          </span>
          <h1 className="svc-title">
            Let Recruiters Find You —<br />Not the Other Way Around
          </h1>
          <p className="svc-sub">
            Resume Display puts your profile in front of the recruiters who
            matter: three times the visibility, a featured badge and direct
            access to their InMail.
          </p>
          <div className="svc-actions">
            <Link to="/services/contact-us" className="svc-btn svc-btn--primary">
              Boost My Visibility <FiArrowRight />
            </Link>
            <a href="#pricing" className="svc-btn svc-btn--ghost">
              View Pricing <FiChevronRight />
            </a>
          </div>
        </section>

        <section className="svc-banner-stats">
          {[
            { num: "3x", label: "Profile visibility" },
            { num: "1,200+", label: "Recruiters on the network" },
            { num: "2x", label: "InMail response rate" },
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
            <h2 className="svc-sechead__title">Be impossible to miss</h2>
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
            <h2 className="svc-sechead__title">Visible in minutes, not weeks</h2>
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
                <div className="svc-price__tag">Resume Display</div>
                <div className="svc-price__amt">
                  <span className="svc-price__cur">₹</span>890
                  <span className="svc-price__per">/ month</span>
                </div>
                <p className="svc-price__sub">No hidden charges. GST included.</p>
              </div>
              <div className="svc-price__body">
                <ul className="svc-feats">
                  {[
                    "3x visibility in recruiter searches",
                    "Featured profile badge",
                    "Real-time recruiter analytics",
                    "Direct recruiter InMail unlocked",
                    "Weekly visibility report",
                    "Block specific companies anytime",
                  ].map((f) => (
                    <li key={f}>
                      <span className="svc-feats__check"><FiCheck size={12} strokeWidth={3} /></span>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link to="/services/contact-us" className="svc-price__cta">
                  Activate Resume Display <FiArrowRight />
                </Link>
                <p className="svc-guarantee">Cancel anytime · No lock-in</p>
              </div>
            </div>
          </div>
        </section>

        <section className="svc-banner">
          <div className="svc-glow svc-glow--a" />
          <div className="svc-glow svc-glow--e" />
          <div className="svc-banner__inner">
            <div className="svc-banner__text">
              <span className="svc-banner__chip">
                <FiUsers size={13} /> Recruiters search for you every day
              </span>
              <h2>Make sure they find you at the top</h2>
              <p>
                A displayed resume is viewed 3x more often and shortlisted
                twice as fast on the Maven Jobs network.
              </p>
            </div>
            <Link to="/services/contact-us" className="svc-banner__btn">
              Get Displayed <FiArrowRight />
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
            Pair it with a professional resume?{" "}
            <Link to="/services/text-resume" className="svc-faq__link">
              Explore Text Resume <FiSearch className="svc-faq__icon" size={13} />
            </Link>
          </p>
        </section>
      </main>
      <LandingFooter />
    </div>
  );
};

export default ResumeDisplay;