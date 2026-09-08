import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  FiArrowRight, FiCheck, FiChevronRight, FiClock, FiHeadphones,
  FiMail, FiMapPin, FiPhone, FiSend, FiZap,
} from "react-icons/fi";
import LandingHeader from "../../../../components/LandingHeader";
import LandingFooter from "../../../../components/LandingFooter";
import "./ContactUs.css";

const FAQItem = ({ q, a }) => (
  <details className="svc-faq__item">
    <summary>
      {q}
      <FiChevronRight />
    </summary>
    <p>{a}</p>
  </details>
);

const ContactUs = () => {
  const [form, setForm] = useState({ name: "", email: "", phone: "", subject: "Resume Writing", message: "" });
  const [submitted, setSubmitted] = useState(false);

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const channels = [
    { icon: FiPhone, title: "Call Us", info: "Toll Free: 1800-102-5557", sub: "9:00 AM - 9:00 PM IST", color: "#10b981" },
    { icon: FiMail, title: "Email Support", info: "support@mavenjobs.com", sub: "Replies within 2-4 hours", color: "#002366" },
    { icon: FiMapPin, title: "Corporate Office", info: "Level 4, Maven Tower, Bangalore", sub: "Karnataka - 560103", color: "#6366f1" },
    { icon: FiClock, title: "Support Hours", info: "Mon - Sat, 9 AM - 9 PM", sub: "24x7 priority support for subscribers", color: "#f59e0b" },
  ];

  const faqs = [
    { q: "Which service should I choose?", a: "Tell us your current stage: need a new resume, a critique of an existing one, or help standing out to recruiters. Our team will recommend the right service — or bundle." },
    { q: "How do I pay for a service?", a: "Payments are processed securely via UPI, cards or net banking. Every purchase is confirmed instantly by email with an invoice and GST receipt." },
    { q: "What is the refund policy?", a: "Each service page lists its guarantee — most offer 7 to 60-day money-back terms. Write to support@mavenjobs.com with your order ID to start a refund." },
    { q: "Can I get a callback instead of email support?", a: "Yes. Submit the form below with your phone number and preferred time, and a Maven Jobs specialist will call you back during support hours." },
  ];

  return (
    <div className="svc-root">
      <LandingHeader />
      <main className="svc-main responsive-container">
        <nav className="svc-crumbs">
          <Link to="/services" className="svc-crumbs__link">Services</Link>
          <FiChevronRight className="svc-crumbs__sep" />
          <span className="svc-crumbs__cur">Contact Us</span>
        </nav>

        <section className="svc-hero">
          <span className="svc-badge">
            <FiHeadphones /> Find Jobs
          </span>
          <h1 className="svc-title">
            We&apos;re Here to Help<br />You Move Forward
          </h1>
          <p className="svc-sub">
            Questions about a resume, a subscription or a refund? The Maven
            Jobs support team answers every query — usually within a few hours.
          </p>
          <div className="svc-actions">
            <a href="#form" className="svc-btn svc-btn--primary">
              Send a Message <FiSend />
            </a>
            <a href="tel:18001025557" className="svc-btn svc-btn--ghost">
              <FiPhone /> 1800-102-5557
            </a>
          </div>
        </section>

        <section className="svc-contact-grid">
          {channels.map(({ icon: Icon, title, info, sub, color }) => (
            <div key={title} className="svc-contact-card">
              <span className="svc-contact-card__icon" style={{ background: `${color}14`, color }}>
                <Icon size={22} />
              </span>
              <div>
                <h3>{title}</h3>
                <p>{info}</p>
                <span>{sub}</span>
              </div>
            </div>
          ))}
        </section>

        <section id="form" className="svc-contact-split">
          <div className="svc-contact-info">
            <span className="svc-eyebrow">Service inquiries</span>
            <h2 className="svc-contact-info__title">Tell us what you need —<br />we&apos;ll point you to the right service</h2>
            <p className="svc-contact-info__desc">
              Not sure whether you need a text resume, a visual resume, a
              critique or a visibility boost? Describe your situation and our
              experts will reply with a tailored recommendation — no obligation.
            </p>
            <ul className="svc-contact-points">
              {[
                { icon: FiCheck, text: "Average first response under 4 hours" },
                { icon: FiCheck, text: "Expert recommendations, not sales scripts" },
                { icon: FiCheck, text: "Order and refund support in one place" },
              ].map(({ icon: Icon, text }) => (
                <li key={text}>
                  <span className="svc-feats__check"><Icon size={13} strokeWidth={3} /></span>
                  {text}
                </li>
              ))}
            </ul>
          </div>

          <div className="svc-form">
            {submitted ? (
              <div className="svc-success">
                <span className="svc-success__icon"><FiCheck size={30} strokeWidth={3} /></span>
                <h3 className="svc-success__title">Message sent!</h3>
                <p className="svc-success__text">
                  Thanks, {form.name || "there"}. Our team will get back to you
                  at {form.email || "your email"} within a few hours.
                </p>
                <button
                  onClick={() => { setForm({ name: "", email: "", phone: "", subject: "Resume Writing", message: "" }); setSubmitted(false); }}
                  className="svc-success__btn"
                >
                  Send Another Message
                </button>
              </div>
            ) : (
              <form
                onSubmit={(e) => { e.preventDefault(); setSubmitted(true); }}
              >
                <div className="svc-form__row">
                  <div className="svc-field">
                    <label htmlFor="cu-name">Full Name</label>
                    <input id="cu-name" required value={form.name} onChange={update("name")} type="text" placeholder="John Doe" />
                  </div>
                  <div className="svc-field">
                    <label htmlFor="cu-email">Email Address</label>
                    <input id="cu-email" required value={form.email} onChange={update("email")} type="email" placeholder="john@example.com" />
                  </div>
                </div>
                <div className="svc-form__row">
                  <div className="svc-field">
                    <label htmlFor="cu-phone">Phone Number</label>
                    <input id="cu-phone" value={form.phone} onChange={update("phone")} type="tel" placeholder="98765 43210" />
                  </div>
                  <div className="svc-field">
                    <label htmlFor="cu-subject">Interested In</label>
                    <select id="cu-subject" value={form.subject} onChange={update("subject")}>
                      <option>Resume Writing</option>
                      <option>Resume Critique</option>
                      <option>Jobs4U / Priority Applicant</option>
                      <option>Subscriptions & Plans</option>
                      <option>Resume Maker & Free Tools</option>
                      <option>Order / Refund Support</option>
                      <option>Something Else</option>
                    </select>
                  </div>
                </div>
                <div className="svc-field">
                  <label htmlFor="cu-message">Message</label>
                  <textarea id="cu-message" required value={form.message} onChange={update("message")} rows={5} placeholder="Tell us about your career goals or question..." />
                </div>
                <button type="submit" className="svc-submit">
                  Send Message <FiArrowRight />
                </button>
              </form>
            )}
          </div>
        </section>

        <section className="svc-banner">
          <div className="svc-glow svc-glow--a" />
          <div className="svc-banner__inner">
            <div className="svc-banner__text">
              <span className="svc-banner__chip">
                <FiZap size={13} /> Prefer instant answers?
              </span>
              <h2>Browse the FAQ below before you reach out</h2>
              <p>
                Most common questions are answered in seconds — no wait time needed.
              </p>
            </div>
            <Link to="/services" className="svc-banner__btn">
              Explore Services <FiArrowRight />
            </Link>
          </div>
        </section>

        <section className="svc-faq">
          <div className="svc-sechead">
            <span className="svc-eyebrow">FAQ</span>
            <h2 className="svc-sechead__title">Common questions</h2>
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

export default ContactUs;