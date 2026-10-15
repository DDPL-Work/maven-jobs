import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  FiPhone,
  FiMail,
  FiMapPin,
  FiClock,
  FiCheckCircle,
  FiExternalLink,
  FiHelpCircle,
  FiCopy,
  FiCheck,
  FiMessageSquare,
  FiShield,
  FiZap,
} from "react-icons/fi";
import { FaWhatsapp } from "react-icons/fa";
import CandidateHeader from "../../../../layout/candidate/CandidateHeader";
import LandingFooter from "../../../../layout/candidate/LandingFooter";
import TalentCloudDemoForm from "../../../../components/employer/TalentCloudDemoForm";
import "./ContactPage.css";

export default function ContactPage() {
  const [copiedKey, setCopiedKey] = useState(null);

  const handleCopy = (text, key) => {
    navigator.clipboard?.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2200);
  };

  const FAQS = [
    {
      q: "How fast does the Maven Jobs support team respond?",
      a: "Our customer success team responds to phone calls immediately during support hours (9 AM to 7 PM IST) and answers all email inquiries within 2 to 4 business hours.",
    },
    {
      q: "I am an employer looking to hire. How can I get started?",
      a: "You can book a personalized walkthrough using the demo form on this page or call our team directly at +91 7015999431. We will set up your corporate account with instant hiring credits.",
    },
    {
      q: "Can candidates contact support for application or resume questions?",
      a: "Yes! Jobseekers can reach out to info@mavenjobs.in for profile assistance, application tracking questions, or platform guidance 100% free of charge.",
    },
    {
      q: "Where is Maven Jobs located?",
      a: "Our corporate headquarters is located at S11, Phase 2, 2nd Floor, Mittal Mega Mall, Sector 25, Panipat, Haryana 132104. In-person meetings can be scheduled with your dedicated account manager.",
    },
  ];

  return (
    <div className="mj-contact-root">
      <CandidateHeader />

      {/* ── HERO BANNER ────────────────────────────────────────────── */}
      <section className="mj-contact-hero">
        <div className="mj-contact-hero-inner">
          <div className="mj-contact-badge">
            <FiHelpCircle size={15} /> Get in Touch
          </div>
          <h1 className="mj-contact-title">
            We&apos;re Here to Help You <span>Succeed</span>
          </h1>
          <p className="mj-contact-subtitle">
            Whether you&apos;re looking to scale your hiring with verified candidates,
            require support for job postings, or have inquiries, our dedicated team is
            ready to assist you.
          </p>
        </div>
      </section>

      {/* ── MAIN CONTENT SPLIT ──────────────────────────────────────── */}
      <div className="mj-contact-container">
        <div className="mj-contact-split">
          {/* Left Column: Official Contact Channels */}
          <div className="mj-contact-cards-wrap">
            {/* Phone Card */}
            <div className="mj-info-card">
              <div className="mj-info-icon-badge mj-icon-emerald">
                <FiPhone />
              </div>
              <div className="mj-info-content">
                <div className="mj-info-label">Direct Phone Line</div>
                <h3 className="mj-info-title">+91 7015999431</h3>
                <p className="mj-info-desc">
                  Mon – Sat, 9:00 AM – 7:00 PM IST. Speak directly with our client success team.
                </p>
                <div className="mj-info-actions">
                  <a href="tel:+917015999431" className="mj-action-btn mj-btn-call">
                    <FiPhone size={14} /> Call 7015999431
                  </a>
                  <a
                    href="https://wa.me/917015999431?text=Hello%20Maven%20Jobs%20Team%2C%20I%20would%20like%20to%20inquire%20about%20your%20services."
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mj-action-btn mj-btn-whatsapp"
                  >
                    <FaWhatsapp size={15} /> WhatsApp Chat
                  </a>
                  <button
                    type="button"
                    onClick={() => handleCopy("7015999431", "phone")}
                    className="mj-action-btn mj-btn-map"
                    style={{ cursor: "pointer", background: "white" }}
                  >
                    {copiedKey === "phone" ? <FiCheck color="#059669" size={14} /> : <FiCopy size={14} />}
                    {copiedKey === "phone" ? "Copied" : "Copy"}
                  </button>
                </div>
              </div>
            </div>

            {/* Email Card */}
            <div className="mj-info-card">
              <div className="mj-info-icon-badge mj-icon-blue">
                <FiMail />
              </div>
              <div className="mj-info-content">
                <div className="mj-info-label">Official Email Support</div>
                <h3 className="mj-info-title">Email Inquiries</h3>
                <p className="mj-info-desc">
                  Drop us an email and our specialists will respond within 2 to 4 business hours.
                </p>
                <div className="mj-email-list">
                  <div className="mj-email-item">
                    <div>
                      <a href="mailto:crm@mavenjobs.in" className="mj-email-link">
                        crm@mavenjobs.in
                      </a>
                    </div>
                    <span className="mj-email-tag">Employer &amp; Sales</span>
                  </div>
                  <div className="mj-email-item">
                    <div>
                      <a href="mailto:info@mavenjobs.in" className="mj-email-link">
                        info@mavenjobs.in
                      </a>
                    </div>
                    <span className="mj-email-tag">Support &amp; General</span>
                  </div>
                </div>
                <div className="mj-info-actions">
                  <a href="mailto:crm@mavenjobs.in" className="mj-action-btn mj-btn-email">
                    <FiMail size={14} /> Write to crm@mavenjobs.in
                  </a>
                  <a href="mailto:info@mavenjobs.in" className="mj-action-btn mj-btn-email">
                    <FiMail size={14} /> Write to info@mavenjobs.in
                  </a>
                </div>
              </div>
            </div>

            {/* Address Card */}
            <div className="mj-info-card">
              <div className="mj-info-icon-badge mj-icon-indigo">
                <FiMapPin />
              </div>
              <div className="mj-info-content">
                <div className="mj-info-label">Corporate Office</div>
                <h3 className="mj-info-title">Maven Jobs HQ</h3>
                <p className="mj-address-text">
                  S11, phase 2, 2nd Floor, Mittal Mega Mall, S-11, Phase, Sector 25, Panipat, Haryana 132104
                </p>
                <div className="mj-info-actions">
                  <a
                    href="https://www.google.com/maps/search/?api=1&query=Mittal+Mega+Mall+Sector+25+Panipat+Haryana+132104"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mj-action-btn mj-btn-map"
                  >
                    <FiExternalLink size={14} /> View on Google Maps
                  </a>
                  <button
                    type="button"
                    onClick={() =>
                      handleCopy(
                        "S11, phase 2, 2nd Floor, Mittal Mega Mall, S-11, Phase, Sector 25, Panipat, Haryana 132104",
                        "address"
                      )
                    }
                    className="mj-action-btn mj-btn-map"
                    style={{ cursor: "pointer", background: "white" }}
                  >
                    {copiedKey === "address" ? <FiCheck color="#059669" size={14} /> : <FiCopy size={14} />}
                    {copiedKey === "address" ? "Copied" : "Copy Address"}
                  </button>
                </div>
              </div>
            </div>

            {/* Trust Highlights */}
            <div className="mj-trust-bar">
              <div className="mj-trust-item">
                <FiCheckCircle size={18} />
                <span>Verified Support</span>
              </div>
              <div className="mj-trust-item">
                <FiClock size={18} />
                <span>&lt; 2 Hr Avg Response</span>
              </div>
              <div className="mj-trust-item">
                <FiShield size={18} />
                <span>100% Data Confidential</span>
              </div>
            </div>
          </div>

          {/* Right Column: Embedded TalentCloudDemoForm */}
          <div className="mj-contact-form-wrapper">
            <div className="mj-contact-form-header">
              <h2>Book a Personalized Demo</h2>
              <p>
                Fill out the form below and an Enterprise Hiring Specialist will get in touch with you shortly.
              </p>
            </div>
            <TalentCloudDemoForm
              isEmbedded={true}
              showTitle={false}
              buttonText="Request Call & Demo"
              hiringForLabel="SELECT ORGANIZATION TYPE"
              placeholderName="Your Full Name"
              placeholderMobile="Mobile Number (10 digits)"
              placeholderEmail="Work / Official Email"
            />
          </div>
        </div>
      </div>

      {/* ── MAP & FAQS ────────────────────────────────────────────── */}
      <section className="mj-contact-extra-section">
        <div className="mj-contact-map-card">
          <div className="mj-map-header">
            <h3>
              <FiMapPin color="#2563eb" /> Visit Our Office in Panipat
            </h3>
            <a
              href="https://www.google.com/maps/search/?api=1&query=Mittal+Mega+Mall+Sector+25+Panipat+Haryana+132104"
              target="_blank"
              rel="noopener noreferrer"
              className="mj-action-btn mj-btn-map"
            >
              Open in Maps <FiExternalLink size={13} />
            </a>
          </div>
          <iframe
            title="Maven Jobs Corporate Location"
            className="mj-map-iframe"
            src="https://maps.google.com/maps?q=Mittal%20Mega%20Mall%20Sector%2025%20Panipat%20Haryana%20132104&t=&z=15&ie=UTF8&iwloc=&output=embed"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>

        {/* FAQs */}
        <h2 className="mj-faq-section-title">Frequently Asked Questions</h2>
        <div className="mj-faq-grid">
          {FAQS.map((faq, idx) => (
            <div key={idx} className="mj-faq-item">
              <h4 className="mj-faq-question">
                <FiHelpCircle /> {faq.q}
              </h4>
              <p className="mj-faq-answer">{faq.a}</p>
            </div>
          ))}
        </div>
      </section>

      <LandingFooter />
    </div>
  );
}
