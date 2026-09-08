import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { FiSearch, FiTrendingUp, FiCode, FiBriefcase } from "react-icons/fi";
import authService from "../../services/authService";

const C = {
    navy: "#002366",
    s50: "#f8fafc", s100: "#f1f5f9", s200: "#e2e8f0",
    s300: "#cbd5e1", s400: "#94a3b8", s500: "#64748b",
    s600: "#475569", s700: "#334155", s800: "#1e293b", s900: "#0f172a",
    blue: "#1e5eff",
};

export default function CandidateSearchBar({ initialQuery = "" }) {
    const navigate = useNavigate();
    const [query, setQuery] = useState(initialQuery);
    const [suggestions, setSuggestions] = useState([]);
    const [focused, setFocused] = useState(false);
    const [loading, setLoading] = useState(false);
    const inputRef = useRef(null);
    const containerRef = useRef(null);
    const timerRef = useRef(null);

    const fetchSuggestions = useCallback(async (q) => {
        if (q.trim().length < 1) { setSuggestions([]); return; }
        setLoading(true);
        try {
            const res = await authService.getSearchSuggestions(q);
            const items = res?.data?.suggestions || [];
            setSuggestions(items.slice(0, 3));
        } catch { setSuggestions([]); }
        setLoading(false);
    }, []);

    const handleChange = (e) => {
        const val = e.target.value;
        setQuery(val);
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => fetchSuggestions(val), 200);
    };

    const handleSelect = (term) => {
        setQuery(term);
        setSuggestions([]);
        setFocused(false);
        inputRef.current?.blur();
        navigate(`/jobs?search=${encodeURIComponent(term)}`);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!query.trim()) return;
        const term = query.trim();
        setSuggestions([]);
        setFocused(false);
        inputRef.current?.blur();
        navigate(`/jobs?search=${encodeURIComponent(term)}`);
    };

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setFocused(false);
                setSuggestions([]);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const isOpen = focused && suggestions.length > 0;

    return (
        <form ref={containerRef} onSubmit={handleSubmit} style={{ position: "relative", width: 230 }}>
            <div style={{
                display: "flex", alignItems: "center", gap: 8,
                background: focused ? "#fff" : C.s50,
                border: `1.5px solid ${focused ? C.blue : C.s200}`,
                borderRadius: 10, padding: "8px 13px",
                transition: "all 0.2s",
            }}>
                <FiSearch size={14} color={C.s400} style={{ flexShrink: 0 }} />
                <input
                    ref={inputRef}
                    type="text"
                    placeholder="Search jobs..."
                    value={query}
                    onChange={handleChange}
                    onFocus={() => setFocused(true)}
                    style={{
                        border: "none", outline: "none", background: "transparent",
                        fontFamily: "inherit", fontSize: "0.85rem", color: C.s900,
                        width: "100%",
                    }}
                />
                {loading && (
                    <span style={{
                        width: 14, height: 14, borderRadius: "50%",
                        border: `2px solid ${C.s200}`, borderTopColor: C.blue,
                        animation: "csb-spin 0.6s linear infinite", flexShrink: 0,
                    }} />
                )}
            </div>
            <style>{`
                @keyframes csb-spin { to { transform: rotate(360deg); } }
            `}</style>

            {isOpen && (
                <div style={{
                    position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0,
                    background: "#fff", borderRadius: 12,
                    border: `1px solid ${C.s200}`, boxShadow: "0 12px 32px rgba(15,23,42,0.1)",
                    zIndex: 9999, overflow: "hidden", animation: "csb-fadeIn 0.15s ease",
                }}>
                    <style>{`@keyframes csb-fadeIn { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }`}</style>
                    <div style={{ padding: "6px 0" }}>
                        {suggestions.map((item, i) => {
                            const icon = item.length > 15 ? <FiBriefcase size={12} /> : item.length > 8 ? <FiCode size={12} /> : <FiTrendingUp size={12} />;
                            return (
                                <button
                                    key={i}
                                    type="button"
                                    onClick={() => handleSelect(item)}
                                    style={{
                                        display: "flex", alignItems: "center", gap: 9,
                                        width: "100%", padding: "8px 14px",
                                        border: "none", background: "transparent",
                                        cursor: "pointer", fontSize: "0.82rem", color: C.s700,
                                        fontFamily: "inherit", textAlign: "left", transition: "background 0.1s",
                                    }}
                                    onMouseOver={e => e.currentTarget.style.background = C.s50}
                                    onMouseOut={e => e.currentTarget.style.background = "transparent"}
                                >
                                    <span style={{ color: C.s400, flexShrink: 0, display: "flex" }}>{icon}</span>
                                    <span style={{ fontWeight: 600 }}>{item}</span>
                                </button>
                            );
                        })}
                    </div>
                    <div style={{
                        borderTop: `1px solid ${C.s100}`, padding: "6px 14px",
                        display: "flex", justifyContent: "space-between", alignItems: "center",
                    }}>
                        <button
                            type="submit"
                            style={{
                                border: "none", background: "transparent",
                                color: C.blue, fontSize: "0.75rem", fontWeight: 700,
                                cursor: "pointer", fontFamily: "inherit", padding: 0,
                            }}
                        >
                            Search "{query}"
                        </button>
                        <span style={{ fontSize: "0.7rem", color: C.s400 }}>
                            {suggestions.length} result{suggestions.length !== 1 ? 's' : ''}
                        </span>
                    </div>
                </div>
            )}
        </form>
    );
}
