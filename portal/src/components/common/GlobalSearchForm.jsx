import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { FiSearch, FiBriefcase, FiChevronDown } from "react-icons/fi";
import authService from "../../services/authService";
import LocationAutocomplete from "../LocationAutocomplete";
import "./GlobalSearchForm.css";

const EXPERIENCE_OPTIONS = [
  "Fresher (less than 1 year)",
  "1 year",
  "2 years",
  "3 years",
  "4 years",
  "5+ years",
];

// Converts the experience dropdown label ("Fresher (less than 1 year)", "3 years", "5+ years")
// into the job-listing sidebar range bucket ("0-1", "1-2", "2-5", "5-8", "8-12", "12+")
const expLabelToRange = (value = "") => {
  const s = String(value || "").trim();
  if (/^\d+(\.\d+)?-\d+(\.\d+)?$/.test(s) || /^\d+(\.\d+)?\+$/.test(s))
    return s;
  const m = /(\d+(?:\.\d+)?)/.exec(s);
  if (!m) return "";
  const n = parseFloat(m[1]);
  if (s.toLowerCase().includes("fresher")) return "0-1";
  if (n <= 1) return "0-1";
  if (n === 2) return "1-2";
  if (n <= 4) return "2-5";
  if (n <= 8) return "5-8";
  if (n <= 12) return "8-12";
  return "12+";
};

const RANGE_TO_LABEL = {
  "0-1": "Fresher (less than 1 year)",
  "1-2": "1 year",
  "2-5": "2 years",
  "5-8": "5+ years",
  "8-12": "8+ years",
  "12+": "12+ years",
};

const toLabel = (range = "") => RANGE_TO_LABEL[String(range).split(";")[0]] || "";

const SUGGESTION_DELAY = 250;

export default function GlobalSearchForm({
  variant = "landing",
  hero = false,
  raised = false,
  autoFocusKeyword = false,
  initialKeyword = "",
  style,
  className = "",
  onSubmitted,
}) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isHeader = variant === "header";
  const base = isHeader ? "jlp-search" : "lp-search";
  const textBase = isHeader ? "jlp" : "lp";

  const [keyword, setKeyword] = useState("");
  const [location, setLocation] = useState("");
  const [experienceValue, setExperienceValue] = useState("");
  const [isExpDropdownOpen, setIsExpDropdownOpen] = useState(false);
  const [showKeywordSugs, setShowKeywordSugs] = useState(false);
  const [keywordSuggestions, setKeywordSuggestions] = useState([]);
  const [mobileExpanded, setMobileExpanded] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Initialize / sync inputs from URL params (q, location, experience)
  const qParam = searchParams.get("q");
  const locParam = searchParams.get("location");
  const expParam = searchParams.get("experience");
  useEffect(() => {
    setKeyword(qParam || initialKeyword);
    setLocation(locParam || "");
    setExperienceValue(toLabel(expParam));
  }, [qParam, locParam, expParam, initialKeyword]);

  // Keyword autocomplete
  useEffect(() => {
    const timer = setTimeout(async () => {
      const term = keyword.trim();
      if (term.length < 1) {
        setKeywordSuggestions([]);
        return;
      }
      const res = await authService.getSearchSuggestions(term);
      if (res?.success) setKeywordSuggestions(res.data?.suggestions || []);
    }, SUGGESTION_DELAY);
    return () => clearTimeout(timer);
  }, [keyword]);

  // Click outside to close experience dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest(`.${base}__field--exp`)) {
        setIsExpDropdownOpen(false);
      }
    };
    if (isExpDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isExpDropdownOpen, base]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const kw = String(keyword || "").trim();
    const loc = String(location || "").trim();
    const exp = expLabelToRange(experienceValue);

    const params = new URLSearchParams();
    if (kw) params.set("q", kw);
    // Location is overwritten (never appended) — single-location search
    if (loc) params.set("location", loc);
    if (exp) params.set("experience", exp);

    if (!kw && !loc && !exp) {
      setErrorMsg("Please enter something to search jobs.");
      return;
    }

    setIsExpDropdownOpen(false);
    setShowKeywordSugs(false);
    setMobileExpanded(false);

    const qs = params.toString();
    navigate(qs ? `/jobs?${qs}` : "/jobs");
    onSubmitted?.();
  };

  return (
    <form
      className={[
        base,
        "gsf",
        `gsf--${variant}`,
        raised ? "gsf--raised" : "",
        isHeader && mobileExpanded ? `${base}--mobile-expanded` : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      style={{ position: "relative", ...style }}
      onSubmit={handleSubmit}
      {...(hero ? { "data-hero-intro": "" } : {})}
    >
      <div
        className={`${base}__field`}
        style={{ position: "relative" }}
        onClick={() => {
          if (isHeader && window.innerWidth <= 768) setMobileExpanded(true);
        }}
      >
        <FiSearch />
        <input
          type="text"
          placeholder="Job title, skills or company"
          value={keyword}
          autoFocus={autoFocusKeyword}
          onChange={(e) => {
            setKeyword(e.target.value);
            setShowKeywordSugs(true);
            setIsExpDropdownOpen(false);
            if (errorMsg) setErrorMsg("");
          }}
          onFocus={() => {
            setShowKeywordSugs(true);
            setIsExpDropdownOpen(false);
          }}
          onBlur={() => setTimeout(() => setShowKeywordSugs(false), 200)}
        />
        {showKeywordSugs && keywordSuggestions.length > 0 && (
          <div className={`${textBase}-suggestions`}>
            {keywordSuggestions.map((s) => (
              <div
                key={s}
                className={`${textBase}-suggestions__item`}
                onClick={() => {
                  setKeyword(s);
                  setShowKeywordSugs(false);
                }}
              >
                <FiSearch size={13} />
                <span>{s}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className={`${base}__divider`} />

      <div 
        className={`${base}__field`} 
        style={{ position: "relative" }}
        onFocusCapture={() => {
          setShowKeywordSugs(false);
          setIsExpDropdownOpen(false);
        }}
        onClickCapture={() => {
          setShowKeywordSugs(false);
          setIsExpDropdownOpen(false);
        }}
      >
        <LocationAutocomplete
          value={location}
          onChange={(val) => {
            setLocation(val);
            if (errorMsg) setErrorMsg("");
          }}
          onSelect={(item) => {
            setLocation(item.label || item.city);
            if (errorMsg) setErrorMsg("");
          }}
          placeholder="City, state or remote"
          id={isHeader ? "jlp-location-search" : "lp-location-search"}
          aria-label="Location search"
        />
      </div>

      <div className={`${base}__divider`} />

      <div
        className={`${base}__field ${base}__field--exp`}
        onClick={() => {
          setIsExpDropdownOpen((o) => !o);
          setShowKeywordSugs(false);
        }}
        style={{ cursor: "pointer", position: "relative" }}
      >
        <FiBriefcase />
        <span
          style={{
            flex: 1,
            color: experienceValue
              ? "var(--text-primary, var(--lp-text, #0f172a))"
              : "#94a3b8",
            fontSize: "0.93rem",
            userSelect: "none",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {experienceValue || "Experience"}
        </span>
        <FiChevronDown
          style={{
            color: "#94a3b8",
            fontSize: "0.85rem",
            transition: "transform 0.25s",
            transform: isExpDropdownOpen ? "rotate(180deg)" : "none",
          }}
        />
        {isExpDropdownOpen && (
          <div className={`${textBase}-exp-drop`}>
            {EXPERIENCE_OPTIONS.map((opt) => (
              <div
                key={opt}
                className={`${textBase}-exp-drop__item`}
                onClick={(e) => {
                  e.stopPropagation();
                  setExperienceValue(opt);
                  setIsExpDropdownOpen(false);
                  if (errorMsg) setErrorMsg("");
                }}
              >
                {opt}
              </div>
            ))}
          </div>
        )}
      </div>

      <button type="submit" className={`${base}__btn`}>
        <FiSearch />
        <span className="gsf-btn-text">{isHeader ? "Search Jobs" : " Search Jobs"}</span>
      </button>
      {errorMsg && (
        <div style={{ position: "absolute", top: "100%", marginTop: "8px", left: "16px", color: "#ef4444", fontSize: "0.85rem", fontWeight: "500", zIndex: 10 }}>
          {errorMsg}
        </div>
      )}
    </form>
  );
}