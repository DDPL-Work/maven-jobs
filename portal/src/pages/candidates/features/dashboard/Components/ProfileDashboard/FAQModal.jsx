import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  FiX,
  FiZap,
  FiSearch,
  FiInfo,
  FiChevronDown,
  FiLayers,
  FiUsers,
  FiCheckCircle,
  FiSettings,
  FiShield,
  FiAward,
  FiBookOpen,
  FiArrowRight,
  FiMail,
  FiPhone,
  FiSend,
} from "react-icons/fi";
import "./FAQModal.css";

const QUICK_SOLUTIONS = [
  {
    q: "How do I deactivate or delete my MavenJobs account?",
    a: "To deactivate your account, go to Settings > Account > Danger Zone and click 'Deactivate Account'. This will hide your profile from all recruiters instantly.",
    topic: "Account Settings",
  },
  {
    q: "How can I update or edit my profile information?",
    a: "You can edit any section of your profile by clicking the 'Edit' icon in the Profile Dashboard or using the side-modal for specific sections like Headline, Skills, and Experience.",
    topic: "Create Profile",
  },
  {
    q: "How do I hide my profile from my current employer?",
    a: "Go to Settings > Privacy. Under 'Visibility Settings', you can search for and block specific companies or use 'Invisible Mode' to hide from all employers.",
    topic: "Privacy & Safety",
  },
  {
    q: "Do I need to pay to apply for a job on MavenJobs?",
    a: "No, applying for jobs on MavenJobs is 100% free. We never charge candidates for applications. MavenPremiumX is an optional service for advanced career growth.",
    topic: "Apply for Jobs",
  },
  {
    q: "How do I upload or update my resume?",
    a: "In the Profile Dashboard, scroll to the Resume section. You can upload a PDF/Doc file or use our Resume Builder to generate a professional resume instantly.",
    topic: "Create Profile",
  },
  {
    q: "Why am I not receiving job recommendations?",
    a: "Ensure your 'Key Skills' and 'Preferred Role' are up to date. Our AI matching engine uses these to recommend the most relevant opportunities to you.",
    topic: "Job Search",
  },
];

const FAQS = [
  {
    q: "How do I create a MavenJobs account?",
    a: "Visit mavenjobs.in and click 'Register'. Fill in your name, email, and password, then verify your email. Once verified, complete your profile with your experience, skills, and education to start receiving relevant job matches.",
    topic: "Create Profile",
  },
  {
    q: "Can recruiters see my profile without my permission?",
    a: "By default, your profile is visible to verified recruiters on MavenJobs. You can enable 'Privacy Mode' in Settings > Privacy to hide your profile from specific companies or all employers. Your current employer can be blocked individually.",
    topic: "Privacy & Safety",
  },
  {
    q: "How does MavenPremiumX improve my hiring chances?",
    a: "MavenPremiumX positions your profile in front of India's top-tier recruiters hiring for roles above Rs. 30L CTC. Your profile gets priority placement, NChecked verification, and direct outreach via WhatsApp, email, and automated calls - giving you 3x more recruiter responses.",
    topic: "PremiumX",
  },
  {
    q: "How do I track the status of my job applications?",
    a: "Go to your dashboard and click 'Job Application Status'. You'll see all applications categorised by status: Applied, Application Sent, Resume Viewed, Recruiter Actions, and more. Each card shows recruiter activity and last-active timestamps.",
    topic: "Apply for Jobs",
  },
  {
    q: "What is an NChecked Profile and how do I get one?",
    a: "An NChecked Profile means Maven's team has cross-verified 14+ critical details: your current CTC breakup, company duration, notice period, designation, location, and job-search intent. To get NChecked, go to Profile > Verification and submit your details for review. It typically takes 1-2 business days.",
    topic: "PremiumX",
  },
  {
    q: "How do I reset or change my account password?",
    a: "Go to Settings > Security > Change Password. Enter your current password, then set a new one. If you've forgotten your password, click 'Forgot Password' on the login page and follow the email link sent to your registered address.",
    topic: "Account Settings",
  },
];

const TOPICS = [
  {
    icon: <FiUsers size={20} />,
    label: "Create Profile",
    bg: "#EEF2FF",
    color: "#6366f1",
  },
  {
    icon: <FiSearch size={20} />,
    label: "Job Search",
    bg: "#ecfdf5",
    color: "#10b981",
  },
  {
    icon: <FiCheckCircle size={20} />,
    label: "Apply for Jobs",
    bg: "#fffbeb",
    color: "#f59e0b",
  },
  {
    icon: <FiSettings size={20} />,
    label: "Account Settings",
    bg: "#f0f9ff",
    color: "#0ea5e9",
  },
  {
    icon: <FiShield size={20} />,
    label: "Privacy & Safety",
    bg: "#fef2f2",
    color: "#ef4444",
  },
  {
    icon: <FiAward size={20} />,
    label: "PremiumX",
    bg: "#EEF2FF",
    color: "#002366",
  },
];

export const FaqAccordionItem = ({ index, question, answer }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className={`faq-acc-item ${isOpen ? "open" : ""}`}>
      <button
        type="button"
        className="faq-acc-header"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        <div className="faq-acc-num">{index < 10 ? `0${index}` : index}</div>
        <div className="faq-acc-q">{question}</div>
        <div className="faq-acc-chevron">
          <FiChevronDown size={16} />
        </div>
      </button>
      {isOpen && <div className="faq-acc-body">{answer}</div>}
    </div>
  );
};

export default function FAQModal({
  isOpen,
  onClose,
  onSelectQuickAnswer,
  setShowQuickAnswer,
  latestBlogs = [],
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [supportForm, setSupportForm] = useState({
    name: "",
    phone: "",
    email: "",
    area: "",
    message: "",
  });
  const [supportSubmitted, setSupportSubmitted] = useState(false);

  // Dispatch quick answer click
  const handleQuickClick = (sol) => {
    if (typeof onSelectQuickAnswer === "function") {
      onSelectQuickAnswer(sol);
    } else if (typeof setShowQuickAnswer === "function") {
      setShowQuickAnswer(sol);
    }
  };

  // Filter solutions based on search query or selected topic
  const filteredSolutions = useMemo(() => {
    let list = QUICK_SOLUTIONS;
    if (selectedTopic) {
      list = list.filter((s) => s.topic === selectedTopic);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (s) => s.q.toLowerCase().includes(q) || s.a.toLowerCase().includes(q)
      );
    }
    return list;
  }, [searchQuery, selectedTopic]);

  // Filter FAQs based on search query or selected topic
  const filteredFaqs = useMemo(() => {
    let list = FAQS;
    if (selectedTopic) {
      list = list.filter((f) => f.topic === selectedTopic);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (f) => f.q.toLowerCase().includes(q) || f.a.toLowerCase().includes(q)
      );
    }
    return list;
  }, [searchQuery, selectedTopic]);

  const handleTopicClick = (topicLabel) => {
    if (selectedTopic === topicLabel) {
      setSelectedTopic(null);
    } else {
      setSelectedTopic(topicLabel);
    }
  };

  const handleClearFilters = () => {
    setSearchQuery("");
    setSelectedTopic(null);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setSupportForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    setSupportSubmitted(true);
    setTimeout(() => {
      setSupportSubmitted(false);
      setSupportForm({
        name: "",
        phone: "",
        email: "",
        area: "",
        message: "",
      });
    }, 4000);
  };

  if (!isOpen) return null;

  const hasFilter = searchQuery.trim() || selectedTopic;

  return (
    <div
      className="pd-modal-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="pd-modal-box faq-modal-v2"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close / Cancel Button */}
        <button
          type="button"
          className="faq-close-btn pd-modal-close"
          onClick={onClose}
          aria-label="Close FAQ Modal"
          title="Close / Cancel"
        >
          <FiX size={20} />
        </button>

        <div className="faq-scroll-container">
          {/* HERO SECTION */}
          <div className="faq-hero">
            <div className="faq-hero-dots" />
            <div className="faq-hero-glow" />
            <div className="faq-hero-tag">
              <FiZap size={10} fill="currentColor" /> Help Center
            </div>
            <h1>
              Hi, how can we <span>help you?</span>
            </h1>
            <p className="faq-hero-sub">
              Search our knowledge base or browse topics below
            </p>

            <form
              className="faq-search-wrap"
              onSubmit={(e) => e.preventDefault()}
            >
              <div className="faq-search-icon">
                <FiSearch size={15} />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for answers... e.g. 'update profile', 'apply to job'"
                aria-label="Search FAQ"
              />
              {searchQuery && (
                <button
                  type="button"
                  className="faq-search-clear-btn"
                  onClick={() => setSearchQuery("")}
                  title="Clear search"
                >
                  <FiX size={14} />
                </button>
              )}
              <button
                type="button"
                className="faq-search-btn"
                onClick={(e) => e.preventDefault()}
              >
                Search
              </button>
            </form>
          </div>

          <div className="faq-body">
            {/* Filter Active Feedback Banner */}
            {hasFilter && (
              <div className="faq-filter-banner">
                <span>
                  Showing results for{" "}
                  <strong>
                    {selectedTopic ? `Topic: ${selectedTopic}` : ""}
                    {selectedTopic && searchQuery ? " & " : ""}
                    {searchQuery ? `"${searchQuery}"` : ""}
                  </strong>
                </span>
                <button
                  type="button"
                  className="faq-filter-clear-btn"
                  onClick={handleClearFilters}
                  title="Clear all filters"
                >
                  <FiX size={12} /> Clear filter
                </button>
              </div>
            )}

            {/* QUICK SOLUTIONS */}
            <div className="faq-section-label">
              <div className="faq-section-icon">
                <FiZap size={13} />
              </div>
              Quick Solutions
            </div>

            <div className="faq-quick-grid">
              {filteredSolutions.map((sol, i) => (
                <div
                  className="faq-quick-card"
                  key={i}
                  onClick={() => handleQuickClick(sol)}
                >
                  <span className="faq-q-prefix">Q.</span>
                  <p>{sol.q}</p>
                </div>
              ))}
              {filteredSolutions.length === 0 && (
                <div
                  style={{
                    gridColumn: "1 / -1",
                    padding: "20px",
                    textAlign: "center",
                    color: "#64748b",
                    fontSize: "13px",
                  }}
                >
                  No quick solutions match your search.
                </div>
              )}
            </div>

            {/* FAQ ACCORDION */}
            <div className="faq-section-label" style={{ marginTop: 4 }}>
              <div className="faq-section-icon">
                <FiInfo size={13} />
              </div>
              Frequently Asked Questions
            </div>

            <div className="faq-accordion">
              {filteredFaqs.map((item, i) => (
                <FaqAccordionItem
                  key={i}
                  index={i + 1}
                  question={item.q}
                  answer={item.a}
                />
              ))}
              {filteredFaqs.length === 0 && (
                <div
                  style={{
                    padding: "20px",
                    textAlign: "center",
                    color: "#64748b",
                    fontSize: "13px",
                  }}
                >
                  No FAQs match your search.
                </div>
              )}
            </div>

            {/* BROWSE BY TOPIC */}
            <div className="faq-section-label">
              <div className="faq-section-icon">
                <FiLayers size={13} />
              </div>
              Browse by Topic
            </div>

            <div className="faq-topic-grid">
              {TOPICS.map((t, i) => {
                const isSelected = selectedTopic === t.label;
                return (
                  <div
                    className="faq-topic-card"
                    key={i}
                    onClick={() => handleTopicClick(t.label)}
                    style={
                      isSelected
                        ? {
                            borderColor: "#002366",
                            boxShadow: "0 8px 24px rgba(0, 35, 102, 0.12)",
                            background: "#fafcff",
                          }
                        : {}
                    }
                  >
                    <div
                      className="faq-topic-icon"
                      style={{ background: t.bg, color: t.color }}
                    >
                      {t.icon}
                    </div>
                    <span className="faq-topic-label">{t.label}</span>
                  </div>
                );
              })}
            </div>

            {/* BLOGS / CAREER RESOURCES */}
            <div className="faq-section-label">
              <div className="faq-section-icon">
                <FiBookOpen size={13} />
              </div>
              Career Resources
            </div>

            <div className="faq-blog-grid">
              {latestBlogs.slice(0, 3).map((blog) => (
                <Link
                  to={`/blogs/${blog.slug}`}
                  className="faq-blog-card"
                  key={blog._id || blog.id}
                  onClick={onClose}
                >
                  <div
                    className="faq-blog-img"
                    style={{
                      background: blog.coverImage?.url
                        ? `url(${blog.coverImage.url}) center/cover`
                        : "linear-gradient(135deg, #1E40AF 0%, #3B82F6 40%, #06B6D4 100%)",
                    }}
                  />
                  <div className="faq-blog-info">
                    <span className="faq-blog-tag">{blog.category}</span>
                    <h4>{blog.title}</h4>
                    <p>{blog.excerpt || "Click to read more..."}</p>
                    <div className="faq-blog-read">
                      Read Article <FiArrowRight size={12} />
                    </div>
                  </div>
                </Link>
              ))}
              {latestBlogs.length === 0 ? (
                <p
                  style={{
                    color: "#94a3b8",
                    fontSize: 13,
                    gridColumn: "1 / -1",
                    textAlign: "center",
                    margin: "12px 0",
                  }}
                >
                  No resources yet. Check back soon.
                </p>
              ) : null}
            </div>

            {/* CONTACT SUPPORT */}
            <div className="faq-section-label">
              <div className="faq-section-icon">
                <FiMail size={13} />
              </div>
              Contact Support
            </div>

            <div className="faq-support">
              {/* Left Side Info */}
              <div className="support-left">
                <div>
                  <div className="support-brand">
                    <div className="support-brand-icon">
                      <FiMail size={16} />
                    </div>
                    MavenJobs Support
                  </div>

                  {[
                    {
                      icon: <FiPhone size={13} />,
                      label: "Toll Free",
                      val: "1800-102-5557",
                    },
                    {
                      icon: <FiMail size={13} />,
                      label: "Email",
                      val: "support@mavenjobs.com",
                    },
                  ].map((s, i) => (
                    <div className="support-info-item" key={i}>
                      <div className="support-info-icon">{s.icon}</div>
                      <div>
                        <span className="support-info-label">{s.label}</span>
                        <div className="support-info-val">{s.val}</div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="support-hours">
                  <span className="support-hours-label">Working Hours</span>
                  <div className="support-hours-val">
                    Mon - Sat &middot; 9:30 AM to 6:30 PM IST
                  </div>
                </div>
              </div>

              {/* Right Side Form */}
              <div className="support-right">
                <h3>Report a Problem or Get Assistance</h3>
                {supportSubmitted ? (
                  <div className="support-success-msg">
                    Thank you! Your request has been submitted. Our support team
                    will contact you shortly.
                  </div>
                ) : (
                  <form className="support-form" onSubmit={handleFormSubmit}>
                    <div className="support-form-row">
                      <input
                        className="sf-field"
                        type="text"
                        name="name"
                        value={supportForm.name}
                        onChange={handleFormChange}
                        placeholder="Your Full Name"
                        required
                      />
                      <input
                        className="sf-field"
                        type="tel"
                        name="phone"
                        value={supportForm.phone}
                        onChange={handleFormChange}
                        placeholder="Contact Number"
                      />
                    </div>
                    <input
                      className="sf-field"
                      type="email"
                      name="email"
                      value={supportForm.email}
                      onChange={handleFormChange}
                      placeholder="Registered Email Address"
                      required
                    />
                    <select
                      className="sf-field sf-select"
                      name="area"
                      value={supportForm.area}
                      onChange={handleFormChange}
                    >
                      <option value="">Select Area of Concern</option>
                      <option>Profile Update</option>
                      <option>Subscription / PremiumX</option>
                      <option>Job Applications</option>
                      <option>Account & Login</option>
                      <option>Resume Upload</option>
                      <option>Recruiter Outreach</option>
                      <option>Other</option>
                    </select>
                    <textarea
                      className="sf-field sf-textarea"
                      name="message"
                      value={supportForm.message}
                      onChange={handleFormChange}
                      placeholder="Describe your issue in detail..."
                      rows={3}
                      required
                    />
                    <div className="support-actions-row">
                      <button
                        type="button"
                        className="support-cancel-btn"
                        onClick={onClose}
                      >
                        Cancel
                      </button>
                      <button type="submit" className="support-submit">
                        <FiSend size={14} /> Submit Request
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
          {/* /faq-body */}
        </div>
        {/* /scroll */}
      </div>
    </div>
  );
}
