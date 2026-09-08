import React, { useState } from "react";
import {
  FaArrowRight, FaBriefcase, FaBullhorn, FaChartBar, FaLaptopCode,
  FaLightbulb, FaSearch, FaStar, FaUsers
} from "react-icons/fa";
import LandingHeader from "../../../../components/LandingHeader";
import LandingFooter from "../../../../components/LandingFooter";
import "./CompanyResearch.css";

const interviewCategories = [
  { name: "Software Engineer", count: 320, icon: FaLaptopCode, color: "#6366f1" },
  { name: "Data Analyst", count: 140, icon: FaChartBar, color: "#10b981" },
  { name: "Product Manager", count: 95, icon: FaLightbulb, color: "#f59e0b" },
  { name: "HR Executive", count: 78, icon: FaUsers, color: "#ef4444" },
  { name: "Business Analyst", count: 110, icon: FaBriefcase, color: "#0ea5e9" },
  { name: "Marketing Manager", count: 64, icon: FaBullhorn, color: "#8b5cf6" },
];

const topCompanies = [
  { name: "Sukuna Technologies", rating: 4.3, reviews: 3, role: "Software Engineer" },
  { name: "Arata Industries", rating: 4.1, reviews: 12, role: "Data Scientist" },
  { name: "Zenith Labs", rating: 4.5, reviews: 28, role: "Product Designer" },
];

const InterviewQuestions = () => {
  const [search, setSearch] = useState("");

  const filtered = interviewCategories.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="cr-root">
      <LandingHeader />
      <main className="cr-main">
        <section className="cr-hero">
          <div className="cr-hero__badge">
            <FaStar /> Interview Questions
          </div>
          <h1>Interview Questions</h1>
          <p>
            Real interview questions asked at top companies - curated from the
            actual candidate experiences. Practice, prepare and crack your next
            interview with Maven Jobs.
          </p>
          <div className="cr-search">
            <FaSearch className="cr-search__icon" />
            <input
              type="text"
              placeholder="Search interview questions by role, e.g. Software Engineer"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </section>

        <section className="cr-section">
          <div className="cr-section__head">
            <h2>Popular interview categories</h2>
            <span>{filtered.length} categories</span>
          </div>
          <div className="cr-grid">
            {filtered.map(({ name, count, icon: Icon, color }) => (
              <article key={name} className="cr-card">
                <span className="cr-card__icon" style={{ background: `${color}1a`, color }}>
                  <Icon />
                </span>
                <h3>{name}</h3>
                <p>{count} questions & experiences</p>
                <button className="cr-card__cta">
                  View questions <FaArrowRight />
                </button>
              </article>
            ))}
          </div>
          {filtered.length === 0 && (
            <p className="cr-empty">No categories match "{search}". Try another role.</p>
          )}
        </section>

        <section className="cr-section">
          <div className="cr-section__head">
            <h2>Most discussed companies</h2>
            <span>Updated this week</span>
          </div>
          <div className="cr-list">
            {topCompanies.map(({ name, rating, posts, role }) => (
              <article key={name} className="cr-list__item">
                <span className="cr-list__logo">{name[0]}</span>
                <div>
                  <h3>{name}</h3>
                  <p>{role} &bull; {posts}K interview posts</p>
                </div>
                <span className="cr-list__rating">
                  <FaStar /> {rating.toFixed(1)}
                </span>
              </article>
            ))}
          </div>
        </section>
      </main>
      <LandingFooter />
    </div>
  );
};

export default InterviewQuestions;