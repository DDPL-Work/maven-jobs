import React from "react";
import { Link } from "react-router-dom";
import {
  FiArrowRight, FiBell, FiCheck, FiChevronRight, FiCreditCard,
  FiEye, FiMail, FiRefreshCw, FiSearch, FiShield, FiTrendingUp, FiZap,
} from "react-icons/fi";
import LandingHeader from "../../../../components/LandingHeader";
import LandingFooter from "../../../../components/LandingFooter";
import "./MonthlySubscriptions.css";

const FAQItem = ({ q, a }) => (
  <details className="svc-faq__item">
    <summary>
      {q}
      <FiChevronRight />
    </summary>
    <p>{a}</p>
  </details>
);

const MonthlySubscriptions = () => {
  const perks = [
    { icon: FiTrendingUp, title: "Rank Higher in Searches", desc: "Your profile climbs recruiter search rankings while you stay active." },
    { icon: FiBell, title: "Priority Access to New Jobs", desc: "First-in-line visibility for the newest postings in your domain." },
    { icon: FiMail, title: "Message Recruiters Directly", desc: "Start the conversation yourself with direct recruiter messaging." },
    { icon: FiSearch, title: "Daily Job Alerts on WhatsApp", desc: "Hand-picked openings delivered to your phone every morning." },
    { icon: FiEye, title: "Resume Display Included", desc: "The full 3x-visibility display package, built into your subscription." },
    { icon: FiShield, title: "Priority Support", desc: "24x7 support with a dedicated queue for paying subscribers." },
  ];

  const plans = [
    {
      name: "Monthly",
      price: "999",
      period: "/ month",
      tag: null,
      featured: false,
      cta: "Choose Monthly",
      features: [
        "Everything in Basic, plus:",
        "Priority Applicant placement",
        "Resume Display with featured badge",
        "Direct recruiter messaging",
        "Daily job alerts on WhatsApp",
        "Weekly visibility report",
      ],
    },
    {
      name: "Quarterly",
      price: "2,497",
      period: "/ 3 months",
      tag: "SAVE 17%",
      featured: true,
      cta: "Choose Quarterly",
      features: [
        "Everything in Monthly",
        "One month free vs. monthly billing",
        "Jobs4U starter matching included",
        "Priority interview prep support",
        "15-minute expert check-in call",
        "30-day money-back guarantee",
      ],
    },
  ];

  const faqs = [
    { q: "What is included in a monthly subscription?", a: "One subscription combines Priority Applicant, Resume Display, direct recruiter messaging, daily job alerts and priority support — everything you need for an active job search." },
    { q: "Can I upgrade or downgrade later?", a: "Yes. Change plans anytime from your dashboard; we adjust billing pro-rata and you never lose access mid-cycle." },
    { q: "Is there a free alternative?", a: "Absolutely. Your free Maven Jobs account already includes job search, alerts and our free resume maker and quality-score tools." },
    { q: "How does the money-back guarantee work?", a: "If you're not satisfied within 30 days of subscribing, email support@mavenjobs.com for a full refund — no forms, no questions asked." },
  ];

  return (
    <div className="svc-root">
      <LandingHeader />
      <main className="svc-main responsive-container">
        <nav className="svc-crumbs">
          <Link to="/services" className="svc-crumbs__link">Services</Link>
          <FiChevronRight className="svc-crumbs__sep" />
          <span className="svc-crumbs__cur">Monthly Subscriptions</span>
        </nav>

        <section className="svc-hero">
          <span className="svc-badge">
            <FiRefreshCw /> Get Recruiter&apos;s Attention
          </span>
          <h1 className="svc-title">
            One Subscription.<br />Your Whole Job Search, Supercharged
          </h1>
          <p className="svc-sub">
            Monthly subscriptions bundle the Maven Jobs visibility toolkit into
            one simple plan — priority placement, resume display, recruiter
            messaging and daily alerts. Cancel anytime.
          </p>
          <div className="svc-actions">
            <a href="#pricing" className="svc-btn svc-btn--primary">
              Choose a Plan <FiArrowRight />
            </a>
            <Link to="/services/contact-us" className="svc-btn svc-btn--ghost">
              Talk to Us <FiChevronRight />
            </Link>
          </div>
        </section>

        <section className="svc-section">
          <div className="svc-sechead">
            <span className="svc-eyebrow">Included in every plan</span>
            <h2 className="svc-sechead__title">Everything, in one place</h2>
          </div>
          <div className="svc-grid">
            {perks.map(({ icon: Icon, title, desc }) => (
              <article key={title} className="svc-card">
                <span className="svc-card__icon"><Icon size={22} /></span>
                <h3>{title}</h3>
                <p>{desc}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="pricing" className="svc-section">
          <div className="svc-plans">
            {plans.map((plan) => (
              <div key={plan.name} className={`svc-price ${plan.featured ? "svc-price--green" : ""}`}>
                {plan.tag && (
                  <span className="svc-rec-badge">{plan.tag}</span>
                )}
                <div className={`svc-price__head ${plan.featured ? "svc-price__head--green" : ""}`}>
                  <div className="svc-price__tag">{plan.name} Plan</div>
                  <div className="svc-price__amt">
                    <span className="svc-price__cur">₹</span>{plan.price}
                    <span className="svc-price__per">{plan.period}</span>
                  </div>
                  <p className="svc-price__sub">Cancel anytime · No lock-in</p>
                </div>
                <div className="svc-price__body">
                  <ul className="svc-feats">
                    {plan.features.map((f, i) => (
                      <li key={f} className={i === 0 ? "svc-feats__lead" : ""}>
                        {i !== 0 && (
                          <span className="svc-feats__check"><FiCheck size={12} strokeWidth={3} /></span>
                        )}
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Link
                    to="/services/contact-us"
                    className={`svc-price__cta ${plan.featured ? "" : "svc-price__cta--navy"}`}
                  >
                    {plan.cta} <FiArrowRight />
                  </Link>
                  {plan.tag && (
                    <p className="svc-guarantee">30-day money-back guarantee</p>
                  )}
                </div>
              </div>
            ))}
          </div>
          <p className="svc-pay-note">
            <FiCreditCard className="svc-pay-note__icon" /> Secure payments · UPI · Cards · Net Banking
          </p>
        </section>

        <section className="svc-banner">
          <div className="svc-glow svc-glow--a" />
          <div className="svc-banner__inner">
            <div className="svc-banner__text">
              <span className="svc-banner__chip">
                <FiZap size={13} /> Compare features side by side?
              </span>
              <h2>See how Basic stacks up against Premium</h2>
              <p>
                A full comparison matrix is one click away — no sign-up required.
              </p>
            </div>
            <Link to="/services/basic-and-premium-plans" className="svc-banner__btn">
              View Comparison <FiArrowRight />
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

export default MonthlySubscriptions;