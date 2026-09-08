import React, { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { FiSearch, FiArrowRight, FiBriefcase, FiMapPin } from "react-icons/fi";
import authService from "../services/authService";

function useDebounce(value, delay) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

export default function SearchAutocomplete() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef(null);
  const containerRef = useRef(null);
  const debouncedQuery = useDebounce(query, 250);

  const fetchSuggestions = useCallback(async (q) => {
    if (!q || q.length < 1) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }
    setLoading(true);
    try {
      const res = await authService.suggestJobs(q);
      const jobs = res?.data?.jobs || [];
      setSuggestions(jobs);
      setIsOpen(jobs.length > 0);
      setActiveIndex(-1);
    } catch {
      setSuggestions([]);
      setIsOpen(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSuggestions(debouncedQuery);
  }, [debouncedQuery, fetchSuggestions]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleInputChange = (e) => {
    setQuery(e.target.value);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;
    setIsOpen(false);
    navigate(`/jobs?search=${encodeURIComponent(trimmed)}`);
  };

  const handleSelect = (job) => {
    setIsOpen(false);
    setQuery("");
    navigate(`/job/${job.id}`);
  };

  const handleKeyDown = (e) => {
    if (!isOpen) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      handleSelect(suggestions[activeIndex]);
    } else if (e.key === "Escape") {
      setIsOpen(false);
      inputRef.current?.blur();
    }
  };

  return (
    <div className="search-autocomplete" ref={containerRef}>
      <form className="search-autocomplete-form" onSubmit={handleSubmit}>
        <FiSearch className="search-autocomplete-icon" size={16} />
        <input
          ref={inputRef}
          type="text"
          placeholder="Search jobs, skills..."
          className="search-autocomplete-input"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => { if (suggestions.length > 0) setIsOpen(true); }}
          autoComplete="off"
        />
        <button type="submit" className="search-autocomplete-arrow" aria-label="Search">
          {loading ? (
            <span className="search-autocomplete-spinner" />
          ) : (
            <FiArrowRight size={16} />
          )}
        </button>
      </form>

      {isOpen && suggestions.length > 0 && (
        <ul className="search-autocomplete-dropdown" role="listbox">
          {suggestions.map((job, index) => (
            <li
              key={job.id}
              role="option"
              aria-selected={index === activeIndex}
              className={`search-autocomplete-item ${index === activeIndex ? "active" : ""}`}
              onMouseDown={() => handleSelect(job)}
              onMouseEnter={() => setActiveIndex(index)}
            >
              <div className="search-autocomplete-item-content">
                <span className="search-autocomplete-item-title">
                  <FiBriefcase size={13} className="search-autocomplete-item-icon" />
                  {job.title}
                </span>
                <span className="search-autocomplete-item-company">{job.company}</span>
              </div>
              <div className="search-autocomplete-item-meta">
                {job.location && (
                  <span className="search-autocomplete-item-location">
                    <FiMapPin size={11} /> {job.location}
                  </span>
                )}
                {job.salary && (
                  <span className="search-autocomplete-item-salary">{job.salary}</span>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
