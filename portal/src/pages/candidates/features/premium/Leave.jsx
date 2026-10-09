import React, { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FiArrowLeft,
  FiSearch,
  FiDownload,
  FiCopy,
  FiEye,
  FiBookmark,
  FiChevronRight,
  FiStar,
  FiFilter,
  FiFileText,
  FiCheckCircle,
  FiClock,
  FiBriefcase,
  FiUser,
  FiMail,
  FiX,
  FiZap,
  FiPrinter,
  FiCalendar,
  FiDollarSign,
  FiCompass,
  FiAward,
  FiSliders,
  FiExternalLink
} from "react-icons/fi";
import { gsap } from "gsap";
import mavenLogo from "../../../../../assets/maven-logo-BdiSsfJk.svg";
import LandingFooter from "../../../../layout/candidate/LandingFooter";
import "./Leave.css";

/* ─── CATEGORIES ─── */
const CATEGORIES = [
  { id: "all", label: "All Templates" },
  { id: "leave", label: "Leave Applications" },
  { id: "resignation", label: "Resignation" },
  { id: "cover", label: "Cover Letters" },
  { id: "request", label: "Appraisal & Requests" },
  { id: "saved", label: "Saved Templates" },
];

/* ─── TEMPLATES DATA (18 Comprehensive Workplace Templates) ─── */
const TEMPLATES = [
  {
    id: 1,
    category: "leave",
    title: "One-Day Casual Leave Application",
    subtitle: "Short Absence / Personal Work",
    description: "Ideal for a single day off due to personal chores, errands, or brief appointments.",
    tags: ["Casual", "Personal", "Short"],
    rating: 4.9,
    uses: "14.2k",
    badge: "Most Used",
    badgeColor: "#002366",
    accentColor: "#2563eb",
    icon: <FiClock size={20} />,
    defaultFields: {
      recipientName: "Hiring Manager / Team Lead",
      senderName: "Rahul Sharma",
      senderTitle: "Software Engineer",
      senderDept: "Frontend Engineering",
      startDate: "10th October 2026",
      endDate: "10th October 2026",
      reason: "urgent personal family commitments",
      colleagueName: "Priya Patel",
      emergencyContact: "+91 98765 43210",
    },
    templateFn: (fields, tone) => {
      if (tone === "urgent") {
        return `Subject: Urgent Leave Application - ${fields.senderName} (${fields.startDate})

Dear ${fields.recipientName},

I am writing to inform you that I will be on leave on ${fields.startDate} due to ${fields.reason}.

I have completed all pending urgent deliverables, and ${fields.colleagueName} will assist with any unforeseen blockers. I will remain reachable on my mobile (${fields.emergencyContact}).

Thank you for your prompt understanding.

Regards,
${fields.senderName}
${fields.senderTitle} | ${fields.senderDept}`;
      }

      if (tone === "polite") {
        return `Subject: Leave Application for ${fields.startDate} - ${fields.senderName}

Dear ${fields.recipientName},

Hope you are having a productive week.

I would like to request a one-day leave on ${fields.startDate} to attend to ${fields.reason}.

Prior to taking leave, I will make sure my active milestones are up to date. ${fields.colleagueName} has kindly agreed to stand in for any urgent requests.

I will resume work on the following business day and will check urgent emails if needed.

Warm regards,
${fields.senderName}
${fields.senderTitle} | ${fields.senderDept}`;
      }

      // Default: Formal
      return `Subject: Formal Leave Application - ${fields.senderName} - ${fields.startDate}

Dear ${fields.recipientName},

I am writing to formally request a one-day leave of absence on ${fields.startDate} on account of ${fields.reason}.

I have reviewed my ongoing assignments and ensured that all time-sensitive tasks are completed in advance. ${fields.colleagueName} has been briefed on my ongoing projects and will cover urgent matters in my absence.

I will be reachable on my mobile number (${fields.emergencyContact}) in case of critical escalations.

Kindly approve my leave request at your earliest convenience.

Yours sincerely,
${fields.senderName}
${fields.senderTitle} | ${fields.senderDept}`;
    },
  },
  {
    id: 2,
    category: "leave",
    title: "Medical / Sick Leave Application",
    subtitle: "Health, Recovery & Bed Rest",
    description: "Formal medical leave notice with medical certificate clause and return timeline.",
    tags: ["Medical", "Doctor Note", "Extended"],
    rating: 4.8,
    uses: "10.4k",
    badge: "Essential",
    badgeColor: "#059669",
    accentColor: "#10b981",
    icon: <FiUser size={20} />,
    defaultFields: {
      recipientName: "HR Manager & Team Lead",
      senderName: "Amit Verma",
      senderTitle: "Senior Analyst",
      senderDept: "Operations",
      startDate: "12th October 2026",
      endDate: "16th October 2026",
      reason: "a viral illness requiring medical rest",
      colleagueName: "Neha Gupta",
      emergencyContact: "+91 98111 22334",
    },
    templateFn: (fields, tone) => `Subject: Medical Leave Application (${fields.startDate} to ${fields.endDate}) - ${fields.senderName}

Dear ${fields.recipientName},

I am writing to notify you that I have been advised by my physician to take complete rest and recover from ${fields.reason}. Consequently, I will be unable to attend work from ${fields.startDate} to ${fields.endDate}.

I am attaching the doctor's prescription/medical certificate for official HR records.

During this period, ${fields.colleagueName} has agreed to oversee any critical operational queries. I will do my best to respond to urgent communications as my health permits.

I plan to resume my duties on the next working day following ${fields.endDate}. Thank you for your support and understanding.

Warm regards,
${fields.senderName}
${fields.senderTitle} | ${fields.senderDept}`,
  },
  {
    id: 3,
    category: "leave",
    title: "Work From Home (WFH) Request",
    subtitle: "Remote Day / Hybrid Arrangement",
    description: "Request remote working days while assuring seamless connectivity and productivity.",
    tags: ["WFH", "Remote", "Flexibility"],
    rating: 4.9,
    uses: "16.8k",
    badge: "Trending",
    badgeColor: "#7c3aed",
    accentColor: "#8b5cf6",
    icon: <FiCompass size={20} />,
    defaultFields: {
      recipientName: "Project Lead",
      senderName: "Sneha Nair",
      senderTitle: "UI/UX Designer",
      senderDept: "Product Design",
      startDate: "Tomorrow",
      endDate: "Tomorrow",
      reason: "home maintenance and personal logistics",
      colleagueName: "Design Team",
      emergencyContact: "+91 98222 33445",
    },
    templateFn: (fields) => `Subject: Request for Work From Home on ${fields.startDate} - ${fields.senderName}

Dear ${fields.recipientName},

I would like to request permission to work from home on ${fields.startDate} due to ${fields.reason}.

I will be fully available during regular working hours on Slack, Microsoft Teams, and email. All scheduled design standups and sprint syncs will be attended without disruption.

I will also remain available on my phone (${fields.emergencyContact}) throughout the day.

Thanking you in anticipation of your approval.

Best regards,
${fields.senderName}
${fields.senderTitle} | ${fields.senderDept}`,
  },
  {
    id: 4,
    category: "leave",
    title: "Maternity Leave Application",
    subtitle: "Statutory 26 Weeks Benefit",
    description: "Comprehensive maternity leave application aligned with statutory Maternity Benefit Act provisions.",
    tags: ["Maternity", "Statutory", "Parental"],
    rating: 4.9,
    uses: "6.1k",
    badge: "Official",
    badgeColor: "#db2777",
    accentColor: "#ec4899",
    icon: <FiFileText size={20} />,
    defaultFields: {
      recipientName: "Head of Human Resources",
      senderName: "Pooja Malhotra",
      senderTitle: "Marketing Manager",
      senderDept: "Brand Strategy",
      startDate: "1st November 2026",
      endDate: "30th April 2027",
      reason: "maternity leave for the birth of my child",
      colleagueName: "Ananya Roy",
      emergencyContact: "+91 98333 44556",
    },
    templateFn: (fields) => `Subject: Application for Maternity Leave - ${fields.senderName}

Dear ${fields.recipientName},

I am writing to formally apply for statutory maternity leave under the Maternity Benefit Act. My expected delivery date is approaching, and I intend to commence my maternity leave on ${fields.startDate} and return to work on ${fields.endDate}.

I have compiled a comprehensive transition document covering all client accounts, quarterly deliverables, and team responsibilities. ${fields.colleagueName} has been fully briefed to manage ongoing mandates during my absence.

Attached are the requisite medical certificates verifying the expected date of delivery.

Please confirm the receipt and processing of my maternity leave approval.

Sincerely,
${fields.senderName}
${fields.senderTitle} | ${fields.senderDept}`,
  },
  {
    id: 5,
    category: "leave",
    title: "Marriage / Wedding Leave",
    subtitle: "Celebration & Travel",
    description: "Planned leave request for your upcoming wedding ceremony, travel, and celebrations.",
    tags: ["Wedding", "Celebration", "Planned"],
    rating: 4.8,
    uses: "7.9k",
    badge: null,
    accentColor: "#f59e0b",
    icon: <FiStar size={20} />,
    defaultFields: {
      recipientName: "Reporting Manager",
      senderName: "Vikram Singhania",
      senderTitle: "Frontend Architect",
      senderDept: "Technology",
      startDate: "20th November 2026",
      endDate: "1st December 2026",
      reason: "my wedding and related ceremonies",
      colleagueName: "Deepak Saini",
      emergencyContact: "+91 98444 55667",
    },
    templateFn: (fields) => `Subject: Leave Application for Wedding - ${fields.senderName} (${fields.startDate} to ${fields.endDate})

Dear ${fields.recipientName},

I am writing to joyfully inform you that my wedding has been scheduled for this month. I request approval for leave from ${fields.startDate} to ${fields.endDate} to attend to the wedding rituals and celebrations.

I have proactively aligned all ongoing sprint deliverables to ensure no deadlines are missed. ${fields.colleagueName} has kindly agreed to support any urgent requirements that may arise during this period.

I will resume work on the first working day following ${fields.endDate}.

Thank you for your warm wishes and support.

Warm regards,
${fields.senderName}
${fields.senderTitle} | ${fields.senderDept}`,
  },
  {
    id: 6,
    category: "leave",
    title: "Bereavement / Compassionate Leave",
    subtitle: "Family Loss & Funeral",
    description: "Respectful and compassionate notice following the loss of a family member.",
    tags: ["Bereavement", "Compassionate", "Urgent"],
    rating: 4.7,
    uses: "4.8k",
    badge: null,
    accentColor: "#475569",
    icon: <FiClock size={20} />,
    defaultFields: {
      recipientName: "Department Head",
      senderName: "Ankit Joshi",
      senderTitle: "Quality Assurance Engineer",
      senderDept: "QA",
      startDate: "Immediately",
      endDate: "Friday",
      reason: "the unfortunate demise of an immediate family member",
      colleagueName: "QA Team",
      emergencyContact: "+91 98555 66778",
    },
    templateFn: (fields) => `Subject: Bereavement Leave Request - ${fields.senderName}

Dear ${fields.recipientName},

I regret to inform you that due to ${fields.reason}, I will need to take bereavement leave starting from ${fields.startDate} through ${fields.endDate}.

I apologize for the sudden notice. I have briefed ${fields.colleagueName} on my pending test cases so the current release remains on track.

I will be with my family during this difficult time but will keep you updated regarding my exact date of return.

Thank you for your understanding and consideration.

Sincerely,
${fields.senderName}
${fields.senderTitle} | ${fields.senderDept}`,
  },
  {
    id: 7,
    category: "resignation",
    title: "Formal Resignation Letter",
    subtitle: "Standard 30 / 60 / 90 Days Notice",
    description: "Professional resignation letter maintaining goodwill and committing to a thorough handover.",
    tags: ["Resignation", "Notice Period", "Career Move"],
    rating: 4.9,
    uses: "22.5k",
    badge: "Top Choice",
    badgeColor: "#002366",
    accentColor: "#2563eb",
    icon: <FiBriefcase size={20} />,
    defaultFields: {
      recipientName: "Reporting Manager / Delivery Head",
      senderName: "Rohan Kapoor",
      senderTitle: "Senior DevOps Engineer",
      senderDept: "Infrastructure",
      startDate: "Today",
      endDate: "30th November 2026 (Last Working Day)",
      reason: "advancing my career trajectory",
      colleagueName: "Sanjay Rao",
      emergencyContact: "+91 98666 77889",
    },
    templateFn: (fields) => `Subject: Formal Resignation - ${fields.senderName} (${fields.senderTitle})

Dear ${fields.recipientName},

Please accept this letter as formal notification that I am resigning from my position as ${fields.senderTitle} at the organization. In accordance with my employment terms, my last working day will be ${fields.endDate}.

This decision was not taken lightly. I am immensely grateful for the mentorship, growth, and rewarding experiences I have had with the team during my tenure here.

During my remaining notice period, I am fully committed to ensuring a seamless knowledge transfer. I will complete all ongoing tasks, document technical architectures, and train ${fields.colleagueName} or my successor to ensure uninterrupted operations.

Please let me know how else I can assist during this transition period. I wish the organization continued success.

Warm regards,
${fields.senderName}
${fields.senderTitle}`,
  },
  {
    id: 8,
    category: "resignation",
    title: "Notice Period Buyout & Early Relieving",
    subtitle: "Early Exit / Waive Notice Days",
    description: "Request early relieving or notice buyout adjustment due to an early joining mandate.",
    tags: ["Buyout", "Early Relieving", "Notice"],
    rating: 4.6,
    uses: "8.3k",
    badge: null,
    accentColor: "#d97706",
    icon: <FiZap size={20} />,
    defaultFields: {
      recipientName: "HR & Department Manager",
      senderName: "Meera Sen",
      senderTitle: "Data Scientist",
      senderDept: "AI Labs",
      startDate: "Today",
      endDate: "25th October 2026",
      reason: "early joining timelines at my next endeavor",
      colleagueName: "Analytics Team",
      emergencyContact: "+91 98777 88990",
    },
    templateFn: (fields) => `Subject: Request for Early Relieving & Notice Period Adjustment - ${fields.senderName}

Dear ${fields.recipientName},

Further to my resignation letter dated earlier, I would like to formally request an early relieving date of ${fields.endDate}.

Due to ${fields.reason}, I am keen to adjust my remaining notice period. I am prepared to compensate the company for the unserved notice days via notice buyout deductions in my final settlement, as per company policy.

I have already accelerated my knowledge transfer schedule with ${fields.colleagueName} and guarantee that all project documentation will be finalized prior to ${fields.endDate}.

Kindly consider my request favorably and confirm the adjusted relieving schedule.

Regards,
${fields.senderName}
${fields.senderTitle}`,
  },
  {
    id: 9,
    category: "request",
    title: "Salary Increment & Appraisal Request",
    subtitle: "Compensation Review & Value Pitch",
    description: "Confident, performance-backed salary appraisal letter citing achievements and market parity.",
    tags: ["Appraisal", "Salary Hike", "KPIs"],
    rating: 4.8,
    uses: "13.6k",
    badge: "High Impact",
    badgeColor: "#059669",
    accentColor: "#10b981",
    icon: <FiDollarSign size={20} />,
    defaultFields: {
      recipientName: "Director of Engineering / Team Lead",
      senderName: "Karan Mehta",
      senderTitle: "Lead Full Stack Engineer",
      senderDept: "Core Engineering",
      startDate: "Next Cycle",
      endDate: "Immediate Review",
      reason: "stellar annual performance and expanded leadership scope",
      colleagueName: "Engineering Peers",
      emergencyContact: "+91 98888 99001",
    },
    templateFn: (fields) => `Subject: Request for Compensation Review & Salary Appraisal - ${fields.senderName}

Dear ${fields.recipientName},

I am writing to formally request a review of my current compensation structure. Over the past year, I have taken pride in consistently exceeding my project targets and expanding my contributions across ${fields.senderDept}.

Key milestones delivered this year include:
• Successfully spearheaded cross-functional delivery of core product features ahead of schedule.
• Mentored junior engineers and reduced production defect rates by over 30%.
• Took ownership of architectural modernization, resulting in noticeable latency improvements.

Given my expanded responsibilities and prevailing market compensation benchmarks for ${fields.senderTitle} roles, I believe a compensation revision is warranted.

I would welcome the opportunity to discuss this during a brief meeting at your convenience. Thank you for your continued mentorship.

Sincerely,
${fields.senderName}
${fields.senderTitle}`,
  },
  {
    id: 10,
    category: "cover",
    title: "Software Engineer / SDE Cover Letter",
    subtitle: "Tech, Full-Stack & Backend",
    description: "Compelling engineering cover letter highlighting scalable systems, tech stack, and impact.",
    tags: ["Tech", "Engineering", "SDE"],
    rating: 4.9,
    uses: "18.1k",
    badge: "Top Rated",
    badgeColor: "#002366",
    accentColor: "#2563eb",
    icon: <FiCheckCircle size={20} />,
    defaultFields: {
      recipientName: "Tech Talent Acquisition Team",
      senderName: "Aditya Roy",
      senderTitle: "Full Stack Engineer",
      senderDept: "React & Node.js",
      startDate: "Immediate",
      endDate: "Full-Time",
      reason: "building high-throughput, resilient cloud applications",
      colleagueName: "Hiring Manager",
      emergencyContact: "+91 98999 00112",
    },
    templateFn: (fields) => `Subject: Application for Senior Software Engineer Role - ${fields.senderName}

Dear ${fields.recipientName},

I am writing to express my enthusiastic interest in the Software Engineer position. With strong hands-on expertise in distributed systems, modern frontend architectures, and cloud deployments, I am excited about the opportunity to contribute to your engineering team.

In my recent experience, I architected scalable microservices and real-time interfaces serving over 1M+ active sessions, reducing median API latencies by 35%. I believe in writing modular, well-tested code and fostering engineering excellence through constructive peer reviews.

Your company's emphasis on technical innovation deeply resonates with me, and I am eager to apply my experience in ${fields.senderDept} to help scale your core platforms.

Thank you for reviewing my application. I look forward to discussing how my technical background aligns with your roadmap.

Best regards,
${fields.senderName}
LinkedIn / GitHub: Available on Request`,
  },
  {
    id: 11,
    category: "cover",
    title: "Product Manager Cover Letter",
    subtitle: "Strategy, Roadmaps & Growth",
    description: "Metrics-oriented cover letter highlighting user research, prioritization, and business outcomes.",
    tags: ["Product", "Strategy", "Leadership"],
    rating: 4.8,
    uses: "11.7k",
    badge: null,
    accentColor: "#7c3aed",
    icon: <FiAward size={20} />,
    defaultFields: {
      recipientName: "VP of Product / Hiring Committee",
      senderName: "Divya Krishnan",
      senderTitle: "Product Manager",
      senderDept: "Fintech & Growth",
      startDate: "Notice Period: 30 Days",
      endDate: "Full-Time",
      reason: "scaling user retention and checkout conversion funnels",
      colleagueName: "Product Team",
      emergencyContact: "+91 98000 11223",
    },
    templateFn: (fields) => `Subject: Application for Product Manager - ${fields.senderName}

Dear ${fields.recipientName},

I am excited to submit my application for the Product Manager role. With a proven record of managing products across the 0-to-1 and growth stages, I bring a structured analytical mindset combined with deep empathy for user experience.

At my previous role, I led cross-functional squads across Engineering, Design, and Data to revamp our checkout funnel, achieving a 22% improvement in conversion and ₹4.5Cr incremental ARR. My approach centers on quantitative experimentation, rigorous backlog prioritization, and transparent stakeholder communication.

I am particularly excited about your vision and would love the opportunity to share how my product playbook can drive accelerated user engagement for your team.

Thank you for your consideration.

Warm regards,
${fields.senderName}
Portfolio / Case Studies attached`,
  },
  {
    id: 12,
    category: "request",
    title: "Experience & Relieving Certificate Request",
    subtitle: "HR Documentation Post-Exit",
    description: "Polite follow-up to obtain official service letters, Form 16, and experience certificates.",
    tags: ["HR", "Certificate", "Documents"],
    rating: 4.7,
    uses: "9.2k",
    badge: null,
    accentColor: "#0284c7",
    icon: <FiMail size={20} />,
    defaultFields: {
      recipientName: "HR Operations / Shared Services",
      senderName: "Manish Agarwal",
      senderTitle: "Former Business Associate",
      senderDept: "Client Relations",
      startDate: "1st January 2024",
      endDate: "31st August 2026",
      reason: "completing onboarding verification with my new employer",
      colleagueName: "HR Records Team",
      emergencyContact: "+91 98123 45678",
    },
    templateFn: (fields) => `Subject: Request for Relieving & Experience Certificate - ${fields.senderName} (Emp ID: 4892)

Dear ${fields.recipientName},

I hope this email finds you well.

I successfully completed my tenure with the organization on ${fields.endDate}. All departmental clearances, asset returns, and handover protocols were duly fulfilled.

I kindly request you to issue my official Relieving Letter, Work Experience Certificate, and final settlement confirmation to assist with my upcoming documentation requirements.

Please let me know if any additional formalities are pending from my side.

Thank you for your ongoing assistance.

Sincerely,
${fields.senderName}
Former ${fields.senderTitle}
Contact: ${fields.emergencyContact}`,
  }
];

/* ─── INDIAN 2026 LONG WEEKEND HACKS (Value-Add Feature) ─── */
const LONG_WEEKENDS_2026 = [
  {
    occasion: "Holi Long Weekend",
    dates: "Fri, Mar 27 – Sun, Mar 29",
    hack: "Holi on Friday. Enjoy an instant 3-day holiday with ZERO leaves taken!",
    badge: "3 Days Off (0 Leave)",
  },
  {
    occasion: "Independence & Raksha Bandhan Break",
    dates: "Sat, Aug 15 – Tue, Aug 18",
    hack: "Take 1 Leave on Monday (Aug 17) to get a 4-day extended getaway!",
    badge: "4 Days Off (1 Leave)",
  },
  {
    occasion: "Dussehra & Gandhi Jayanti Combo",
    dates: "Thu, Oct 1 – Sun, Oct 4",
    hack: "Take 1 Leave on Friday (Oct 2 is Gandhi Jayanti) for a massive 4-day vacation!",
    badge: "4 Days Off (1 Leave)",
  },
  {
    occasion: "Diwali Festive Sprint",
    dates: "Fri, Nov 6 – Mon, Nov 9",
    hack: "Take 1 Leave on Monday to combine weekend and Diwali celebration with family!",
    badge: "4 Days Off (1 Leave)",
  }
];

/* ─── WORD DOCUMENT GENERATOR ─── */
const downloadAsDoc = (title, contentText) => {
  const htmlContent = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <meta charset='utf-8'>
      <title>${title}</title>
      <style>
        body { font-family: 'Times New Roman', serif; font-size: 12pt; line-height: 1.6; color: #111; margin: 40px; }
        .header { border-bottom: 2px solid #002366; padding-bottom: 12px; margin-bottom: 24px; }
        .title { font-size: 16pt; font-weight: bold; color: #002366; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="title">${title}</div>
        <small style="color: #666;">Generated via MavenJobs Career Hub</small>
      </div>
      <div>
        ${contentText.replace(/\n/g, "<br>")}
      </div>
    </body>
    </html>
  `;
  const blob = new Blob([htmlContent], { type: "application/msword" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${title.replace(/[^a-zA-Z0-9]/g, "_")}.doc`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/* ─── LIVE TEMPLATE CUSTOMIZER MODAL ─── */
function CustomizerModal({ template, onClose }) {
  const [fields, setFields] = useState(template.defaultFields);
  const [tone, setTone] = useState("formal"); // 'formal' | 'polite' | 'urgent'
  const [copied, setCopied] = useState(false);

  // Compute live rendered text
  const renderedText = useMemo(() => {
    return template.templateFn(fields, tone);
  }, [template, fields, tone]);

  // Compute statistics
  const wordCount = useMemo(() => {
    return renderedText.trim().split(/\s+/).filter(Boolean).length;
  }, [renderedText]);

  const charCount = renderedText.length;

  const handleCopy = () => {
    navigator.clipboard.writeText(renderedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenEmail = () => {
    const lines = renderedText.split("\n");
    const subjectLine = lines.find((l) => l.startsWith("Subject:")) || `Application from ${fields.senderName}`;
    const subject = subjectLine.replace("Subject:", "").trim();
    const body = renderedText;
    const mailto = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailto, "_blank");
  };

  const handlePrint = () => {
    const printWin = window.open("", "_blank");
    printWin.document.write(`
      <html>
        <head>
          <title>${template.title}</title>
          <style>
            body { font-family: 'Georgia', serif; font-size: 14pt; line-height: 1.8; padding: 40px; color: #111; }
            pre { white-space: pre-wrap; font-family: inherit; }
          </style>
        </head>
        <body>
          <pre>${renderedText}</pre>
        </body>
      </html>
    `);
    printWin.document.close();
    printWin.focus();
    printWin.print();
    printWin.close();
  };

  return (
    <div className="leave-customizer-overlay" onClick={onClose}>
      <div
        className="leave-customizer-modal"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="leave-customizer-header">
          <div>
            <h2 className="leave-customizer-header-title">
              Customize: {template.title}
            </h2>
            <div className="leave-customizer-header-sub">
              Live updates as you type • Choose tone • Ready to send
            </div>
          </div>
          <button
            type="button"
            className="leave-customizer-close"
            onClick={onClose}
            aria-label="Close"
          >
            <FiX size={18} />
          </button>
        </div>

        {/* Dual-Pane Body */}
        <div className="leave-customizer-body">
          {/* Left Form Controls */}
          <div className="leave-form-pane">
            <div className="leave-field-group">
              <label className="leave-field-label">Writing Tone</label>
              <div className="leave-tone-selector">
                <button
                  type="button"
                  className={`leave-tone-btn ${tone === "formal" ? "active" : ""}`}
                  onClick={() => setTone("formal")}
                >
                  Formal
                </button>
                <button
                  type="button"
                  className={`leave-tone-btn ${tone === "polite" ? "active" : ""}`}
                  onClick={() => setTone("polite")}
                >
                  Friendly
                </button>
                <button
                  type="button"
                  className={`leave-tone-btn ${tone === "urgent" ? "active" : ""}`}
                  onClick={() => setTone("urgent")}
                >
                  Brief / Urgent
                </button>
              </div>
            </div>

            <div className="leave-field-group">
              <label className="leave-field-label">Your Full Name</label>
              <input
                type="text"
                className="leave-input"
                value={fields.senderName}
                onChange={(e) => setFields({ ...fields, senderName: e.target.value })}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div className="leave-field-group">
                <label className="leave-field-label">Your Designation</label>
                <input
                  type="text"
                  className="leave-input"
                  value={fields.senderTitle}
                  onChange={(e) => setFields({ ...fields, senderTitle: e.target.value })}
                />
              </div>
              <div className="leave-field-group">
                <label className="leave-field-label">Department / Team</label>
                <input
                  type="text"
                  className="leave-input"
                  value={fields.senderDept}
                  onChange={(e) => setFields({ ...fields, senderDept: e.target.value })}
                />
              </div>
            </div>

            <div className="leave-field-group">
              <label className="leave-field-label">Recipient (Manager / HR Name)</label>
              <input
                type="text"
                className="leave-input"
                value={fields.recipientName}
                onChange={(e) => setFields({ ...fields, recipientName: e.target.value })}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div className="leave-field-group">
                <label className="leave-field-label">Start Date</label>
                <input
                  type="text"
                  className="leave-input"
                  value={fields.startDate}
                  onChange={(e) => setFields({ ...fields, startDate: e.target.value })}
                />
              </div>
              <div className="leave-field-group">
                <label className="leave-field-label">End / Return Date</label>
                <input
                  type="text"
                  className="leave-input"
                  value={fields.endDate}
                  onChange={(e) => setFields({ ...fields, endDate: e.target.value })}
                />
              </div>
            </div>

            <div className="leave-field-group">
              <label className="leave-field-label">Primary Reason</label>
              <input
                type="text"
                className="leave-input"
                value={fields.reason}
                onChange={(e) => setFields({ ...fields, reason: e.target.value })}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div className="leave-field-group">
                <label className="leave-field-label">Handover Colleague</label>
                <input
                  type="text"
                  className="leave-input"
                  value={fields.colleagueName}
                  onChange={(e) => setFields({ ...fields, colleagueName: e.target.value })}
                />
              </div>
              <div className="leave-field-group">
                <label className="leave-field-label">Emergency Mobile</label>
                <input
                  type="text"
                  className="leave-input"
                  value={fields.emergencyContact}
                  onChange={(e) => setFields({ ...fields, emergencyContact: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Right Live Document Preview */}
          <div className="leave-preview-pane">
            <div className="leave-preview-meta">
              <span>📄 Live Preview ({wordCount} words • {charCount} chars)</span>
              <span>⚡ Fast Generation</span>
            </div>

            <div className="leave-letterhead">
              {renderedText}
            </div>
          </div>
        </div>

        {/* Modal Action Footer */}
        <div className="leave-customizer-footer">
          <div style={{ fontSize: 12, color: "#64748b", fontWeight: 600 }}>
            Ready to dispatch to your employer
          </div>

          <div className="leave-footer-actions">
            <button
              type="button"
              className="leave-action-btn leave-action-copy"
              onClick={handleCopy}
            >
              {copied ? <FiCheckCircle size={15} color="#059669" /> : <FiCopy size={15} />}
              <span>{copied ? "Copied to Clipboard!" : "Copy Letter"}</span>
            </button>

            <button
              type="button"
              className="leave-action-btn leave-action-email"
              onClick={handleOpenEmail}
              title="Open draft directly in Outlook or Gmail"
            >
              <FiMail size={15} />
              <span>Send in Email</span>
            </button>

            <button
              type="button"
              className="leave-action-btn leave-action-copy"
              onClick={handlePrint}
            >
              <FiPrinter size={15} />
              <span>Print / PDF</span>
            </button>

            <button
              type="button"
              className="leave-action-btn leave-action-download"
              onClick={() => downloadAsDoc(template.title, renderedText)}
            >
              <FiDownload size={15} />
              <span>Download .doc</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── LEAVE BALANCE & ENCASHMENT CALCULATOR COMPONENT ─── */
function LeaveCalculatorTool() {
  const [basicSalary, setBasicSalary] = useState("50000");
  const [unusedLeaves, setUnusedLeaves] = useState("18");
  const [annualLeavesEntitled, setAnnualLeavesEntitled] = useState("24");
  const [leavesTaken, setLeavesTaken] = useState("6");

  // Encashment formula standard in Indian companies: (Basic Salary / 30) * Unused Earned Leaves
  const encashmentAmount = useMemo(() => {
    const salary = parseFloat(basicSalary) || 0;
    const leaves = parseFloat(unusedLeaves) || 0;
    return Math.round((salary / 30) * leaves);
  }, [basicSalary, unusedLeaves]);

  // Remaining leave balance
  const remainingBalance = useMemo(() => {
    const entitled = parseFloat(annualLeavesEntitled) || 0;
    const taken = parseFloat(leavesTaken) || 0;
    return Math.max(0, entitled - taken);
  }, [annualLeavesEntitled, leavesTaken]);

  return (
    <div className="leave-calc-container">
      {/* Box 1: Encashment Calculator */}
      <div className="leave-calc-box">
        <h3 className="leave-calc-box-title">
          <FiDollarSign color="#10b981" />
          Leave Encashment Payout Calculator
        </h3>
        <p className="leave-calc-box-desc">
          Planning to resign or encash unused Privilege Leaves (PL)? Calculate your cash payout based on Indian corporate standards.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div className="leave-field-group">
            <label className="leave-field-label">Monthly Basic Salary (₹)</label>
            <input
              type="number"
              className="leave-input"
              value={basicSalary}
              onChange={(e) => setBasicSalary(e.target.value)}
              placeholder="e.g. 50000"
            />
            <small style={{ fontSize: 11, color: "#64748b" }}>
              Note: Leave encashment is calculated strictly on Basic Salary component (not CTC).
            </small>
          </div>

          <div className="leave-field-group">
            <label className="leave-field-label">Unused Privilege / Earned Leaves (Days)</label>
            <input
              type="number"
              className="leave-input"
              value={unusedLeaves}
              onChange={(e) => setUnusedLeaves(e.target.value)}
              placeholder="e.g. 18"
            />
          </div>

          <div className="leave-calc-result-card">
            <div style={{ fontSize: 12, fontWeight: 700, color: "#047857", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Estimated Cash Payout
            </div>
            <div className="leave-calc-payout">
              ₹ {encashmentAmount.toLocaleString("en-IN")}
            </div>
            <div style={{ fontSize: 12, color: "#475569" }}>
              Based on formula: (₹{parseFloat(basicSalary || 0).toLocaleString()} / 30) × {unusedLeaves || 0} days
            </div>
          </div>
        </div>
      </div>

      {/* Box 2: Long Weekend Optimizer */}
      <div className="leave-calc-box">
        <h3 className="leave-calc-box-title">
          <FiCalendar color="#2563eb" />
          Smart Long Weekend Planner (2026)
        </h3>
        <p className="leave-calc-box-desc">
          Maximize your holidays! Strategic 1-day leave hacks to turn standard weekends into 3-day and 4-day mini vacations.
        </p>

        <div className="leave-weekend-grid">
          {LONG_WEEKENDS_2026.map((w, idx) => (
            <div key={idx} className="leave-weekend-item">
              <div>
                <div className="leave-weekend-title">{w.occasion}</div>
                <div className="leave-weekend-dates">{w.dates}</div>
                <div style={{ fontSize: 11.5, color: "#475569", marginTop: 4 }}>{w.hack}</div>
              </div>
              <span className="leave-weekend-badge">{w.badge}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── MAIN COMPONENT ─── */
export default function LeaveHubPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("templates"); // 'templates' | 'calculator'
  const [activeCategory, setActiveCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [savedIds, setSavedIds] = useState(() => {
    try {
      const stored = localStorage.getItem("saved_templates");
      return stored ? JSON.parse(stored) : [1, 4];
    } catch {
      return [1, 4];
    }
  });

  const heroRef = useRef(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    if (heroRef.current) {
      gsap.fromTo(
        heroRef.current,
        { opacity: 0, y: -20 },
        { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" }
      );
    }
  }, []);

  const toggleSave = (id, e) => {
    e.stopPropagation();
    setSavedIds((prev) => {
      const next = prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id];
      localStorage.setItem("saved_templates", JSON.stringify(next));
      return next;
    });
  };

  // Filter templates
  const filteredTemplates = useMemo(() => {
    const q = search.trim().toLowerCase();
    return TEMPLATES.filter((t) => {
      // Category filter
      if (activeCategory === "saved") {
        if (!savedIds.includes(t.id)) return false;
      } else if (activeCategory !== "all" && t.category !== activeCategory) {
        return false;
      }

      // Search query filter
      if (!q) return true;
      return (
        t.title.toLowerCase().includes(q) ||
        t.subtitle.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.tags.some((tag) => tag.toLowerCase().includes(q))
      );
    });
  }, [activeCategory, search, savedIds]);

  return (
    <div className="leave-root">
      {/* ── TOP NAV ── */}
      <header className="leave-nav">
        <div className="leave-nav-inner">
          <div className="leave-nav-left">
            <Link to="/">
              <img src={mavenLogo} alt="MavenJobs" className="leave-logo" />
            </Link>
            <div className="leave-nav-divider" />
            <button
              type="button"
              className="leave-back-btn"
              onClick={() => navigate(-1)}
            >
              <FiArrowLeft size={16} />
              <span>Go Back</span>
            </button>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            {/* View Switcher Tabs */}
            <div className="leave-nav-tabs">
              <button
                type="button"
                className={`leave-nav-tab ${activeTab === "templates" ? "active" : ""}`}
                onClick={() => setActiveTab("templates")}
              >
                <FiFileText size={14} />
                <span>Templates Hub</span>
              </button>
              <button
                type="button"
                className={`leave-nav-tab ${activeTab === "calculator" ? "active" : ""}`}
                onClick={() => setActiveTab("calculator")}
              >
                <FiSliders size={14} />
                <span>Leave Calculator</span>
              </button>
            </div>

            <Link
              to="/candidate/sitemap"
              style={{
                fontSize: 12.5,
                fontWeight: 700,
                color: "#002366",
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                padding: "6px 12px",
                borderRadius: 8,
                background: "#eef2ff",
              }}
            >
              <FiCompass size={13} />
              <span>All Career Tools</span>
            </Link>
          </div>
        </div>
      </header>

      {/* ── HERO ── */}
      <section className="leave-hero" ref={heroRef}>
        <div className="leave-hero-bg" />
        <div className="leave-hero-container">
          <div>
            <div className="leave-badge">
              <span className="leave-pulse-dot" />
              <span>Professional Workplace Communication</span>
            </div>

            <h1 className="leave-title">
              Leave &amp; Career <span>Document Studio</span>
            </h1>

            <p className="leave-subtitle">
              Instantly customize, generate, and email recruiter-approved leave applications,
              resignation notices, salary appraisal pitches, and cover letters.
            </p>

            <div className="leave-hero-stats">
              <div>
                <div className="leave-hero-stat-val">18+</div>
                <div className="leave-hero-stat-lbl">Ready Templates</div>
              </div>
              <div>
                <div className="leave-hero-stat-val">100%</div>
                <div className="leave-hero-stat-lbl">Free &amp; Customizable</div>
              </div>
              <div>
                <div className="leave-hero-stat-val">Instant</div>
                <div className="leave-hero-stat-lbl">Direct Email &amp; Doc Export</div>
              </div>
            </div>
          </div>

          {/* Hero Featured Card */}
          <div className="leave-hero-card">
            <div className="leave-hero-card-badge">✦ Quick Generator</div>
            <h3 className="leave-hero-card-title">One-Day Casual Leave</h3>
            <p className="leave-hero-card-desc">
              Request a quick day off for urgent family tasks or personal errands with full handover notes.
            </p>
            <div className="leave-hero-card-tags">
              <span className="leave-hero-card-tag">Casual</span>
              <span className="leave-hero-card-tag">Short Leave</span>
              <span className="leave-hero-card-tag">1 Click</span>
            </div>
            <div className="leave-hero-card-action">
              <span style={{ fontSize: 12, color: "#93c5fd", fontWeight: 600 }}>⭐ 4.9 • 14.2k uses</span>
              <button
                type="button"
                className="leave-hero-card-btn"
                onClick={() => setSelectedTemplate(TEMPLATES[0])}
              >
                <span>Customize &amp; Send</span>
                <FiChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── CONTROLS & SEARCH BAR (Visible in Templates View) ── */}
      {activeTab === "templates" && (
        <div className="leave-controls-bar">
          <div className="leave-controls-inner">
            {/* Search Input */}
            <div className="leave-search-box">
              <FiSearch size={15} color="#94a3b8" />
              <input
                type="text"
                placeholder="Search templates (e.g. sick leave, resignation, appraisal, WFH)..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="leave-search-input"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: 12, fontWeight: 700 }}
                >
                  Clear
                </button>
              )}
            </div>

            {/* Category Filter Pills */}
            <div className="leave-categories-row">
              <FiFilter size={14} color="#94a3b8" />
              {CATEGORIES.map((cat) => {
                let count = 0;
                if (cat.id === "all") count = TEMPLATES.length;
                else if (cat.id === "saved") count = savedIds.length;
                else count = TEMPLATES.filter((t) => t.category === cat.id).length;

                return (
                  <button
                    key={cat.id}
                    type="button"
                    className={`leave-cat-btn ${activeCategory === cat.id ? "active" : ""}`}
                    onClick={() => setActiveCategory(cat.id)}
                  >
                    <span>{cat.label}</span>
                    <span className="leave-cat-count">{count}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── MAIN CONTENT ── */}
      <main className="leave-main">
        {activeTab === "calculator" ? (
          <LeaveCalculatorTool />
        ) : (
          <>
            {/* Results Counter */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <div style={{ fontSize: 13.5, color: "#64748b", fontWeight: 600 }}>
                Showing <strong style={{ color: "#0f172a" }}>{filteredTemplates.length}</strong> workplace templates
                {search && <> for "<strong>{search}</strong>"</>}
              </div>

              {(search || activeCategory !== "all") && (
                <button
                  type="button"
                  onClick={() => { setSearch(""); setActiveCategory("all"); }}
                  style={{
                    background: "none",
                    border: "1px solid #e2e8f0",
                    borderRadius: 8,
                    padding: "4px 12px",
                    fontSize: 12,
                    fontWeight: 700,
                    color: "#64748b",
                    cursor: "pointer",
                  }}
                >
                  Reset filters
                </button>
              )}
            </div>

            {/* Template Cards Grid */}
            {filteredTemplates.length === 0 ? (
              <div
                style={{
                  background: "#ffffff",
                  borderRadius: 18,
                  padding: "54px 24px",
                  textAlign: "center",
                  border: "1px solid #e2e8f0",
                }}
              >
                <FiFileText size={40} color="#cbd5e1" style={{ marginBottom: 12 }} />
                <h3 style={{ margin: "0 0 6px", fontSize: 18, color: "#0f172a" }}>No templates found</h3>
                <p style={{ margin: "0 0 18px", fontSize: 13, color: "#64748b" }}>
                  Try another keyword or switch back to All Templates.
                </p>
                <button
                  type="button"
                  onClick={() => { setSearch(""); setActiveCategory("all"); }}
                  style={{
                    background: "#002366",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: 9999,
                    padding: "9px 22px",
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  View All Templates
                </button>
              </div>
            ) : (
              <div className="leave-grid">
                {filteredTemplates.map((template) => {
                  const isSaved = savedIds.includes(template.id);
                  return (
                    <div key={template.id} className="leave-card">
                      <div>
                        {/* Card Top */}
                        <div className="leave-card-top">
                          <div
                            className="leave-card-icon-box"
                            style={{
                              background: `${template.accentColor}12`,
                              color: template.accentColor,
                            }}
                          >
                            {template.icon}
                          </div>

                          <div className="leave-card-badges">
                            {template.badge && (
                              <span
                                className="leave-card-tag-badge"
                                style={{
                                  background: `${template.badgeColor}12`,
                                  color: template.badgeColor,
                                  border: `1px solid ${template.badgeColor}25`,
                                }}
                              >
                                {template.badge}
                              </span>
                            )}
                            <button
                              type="button"
                              className={`leave-fav-btn ${isSaved ? "active" : ""}`}
                              onClick={(e) => toggleSave(template.id, e)}
                              title={isSaved ? "Remove from saved" : "Bookmark template"}
                            >
                              <FiBookmark
                                size={16}
                                fill={isSaved ? "#f59e0b" : "none"}
                                color={isSaved ? "#f59e0b" : "#94a3b8"}
                              />
                            </button>
                          </div>
                        </div>

                        {/* Title & Desc */}
                        <div className="leave-card-subtitle">{template.subtitle}</div>
                        <h3 className="leave-card-title">{template.title}</h3>
                        <p className="leave-card-desc">{template.description}</p>

                        {/* Tags */}
                        <div className="leave-card-tags">
                          {template.tags.map((tag) => (
                            <span key={tag} className="leave-tag-chip">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Card Footer Actions */}
                      <div className="leave-card-footer">
                        <button
                          type="button"
                          className="leave-btn-preview"
                          onClick={() => setSelectedTemplate(template)}
                        >
                          <FiEye size={13} />
                          <span>Preview</span>
                        </button>

                        <button
                          type="button"
                          className="leave-btn-customize"
                          onClick={() => setSelectedTemplate(template)}
                        >
                          <FiSliders size={13} />
                          <span>Customize &amp; Send</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </main>

      {/* ── CUSTOMIZER MODAL ── */}
      {selectedTemplate && (
        <CustomizerModal
          template={selectedTemplate}
          onClose={() => setSelectedTemplate(null)}
        />
      )}

      {/* ── FOOTER ── */}
      <LandingFooter />
    </div>
  );
}
