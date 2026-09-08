import {
  FiBriefcase,
  FiHome,
  FiMail,
  FiMapPin,
  FiStar,
  FiFileText,
} from "react-icons/fi";

/* ===============================
   INDUSTRIES
================================= */
export const INDUSTRIES = Object.freeze([
  "Technology",
  "Finance",
  "Healthcare",
  "Education",
  "Retail",
  "Manufacturing",
  "Logistics",
  "Real Estate",
  "Media",
  "Consulting",
  "E-Commerce",
  "Hospitality",
  "Automotive",
  "Energy",
  "Other",
]);

/* ===============================
   COMPANY SIZES
================================= */
export const COMPANY_SIZES = Object.freeze([
  "1–10 (Startup)",
  "11–50 (Small)",
  "51–200 (Mid-size)",
  "201–500 (Large)",
  "500+ (Enterprise)",
]);

/* ===============================
   JOB TYPES
================================= */
export const JOB_TYPES = Object.freeze([
  "Full-time",
  "Part-time",
  "Contract",
  "Internship",
  "Remote",
  "Hybrid",
]);

/* ===============================
   PACKAGES
================================= */
export const PACKAGES = Object.freeze([
  { value: "STANDARD", label: "Standard", jobs: 2, icon: "🥈" },
  { value: "PREMIUM", label: "Premium", jobs: 5, icon: "🥇" },
  { value: "ELITE", label: "Elite", jobs: 10, icon: "💎" },
]);

/* ===============================
   FORM SECTIONS
================================= */
export const SECTIONS = Object.freeze([
  { title: "Company Info", icon: FiHome },
  { title: "Contact", icon: FiMail },
  { title: "Location", icon: FiMapPin },
  { title: "About", icon: FiFileText },
  { title: "Job Details", icon: FiBriefcase },
  { title: "Why Join Us", icon: FiStar },
]);
