import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import {
    FiBriefcase, FiUsers, FiEye, FiTrendingUp, FiBarChart2,
    FiBell, FiSearch, FiPlus, FiChevronRight, FiArrowUp,
    FiArrowDown, FiCheckCircle, FiClock, FiMapPin, FiStar,
    FiSettings, FiLogOut, FiMenu, FiX, FiMail, FiPhone,
    FiZap, FiTarget, FiCalendar, FiAward, FiActivity,
    FiEdit2, FiExternalLink, FiMoreVertical, FiMessageSquare,
    FiPieChart, FiDollarSign, FiGlobe, FiLinkedin, FiTwitter,
    FiSend, FiPaperclip, FiSmile, FiChevronDown, FiFilter,
    FiDownload, FiUpload, FiShare2, FiBookmark, FiHome, FiGrid,
    FiUserCheck, FiAlertCircle, FiLayers, FiShield,
    FiCpu, FiTool, FiFileText, FiLink, FiImage, FiVideo, FiInfo,
    FiMic, FiCamera, FiAtSign, FiHash, FiRefreshCw,
    FiArrowLeft, FiChevronLeft, FiMaximize2, FiMinimize2, FiUser,
    FiSliders, FiPercent, FiCreditCard, FiHeart, FiTrash2, FiArrowRight,
    FiSun, FiCoffee, FiMonitor, FiGift, FiHeadphones, FiThumbsUp
} from "react-icons/fi";
import mavenLogo from "../../../../../assets/maven-logo-BdiSsfJk.svg";
import authService from "../../../../services/authService";
import api from "../../../../services/api";
import { buildRtcConfig as buildWebRtcConfig, createPeerConnection as createRtcPeerConnection, flushIceCandidates, stopMediaStream } from "../../../../utils/webrtc";
import EmployerHeader from "../../../../components/employer/EmployerHeader";
import { SkeletonPage } from "../../../../components/Skeleton";
import Cropper from "react-easy-crop";

/* ── Tokens ─────────────────────────────────────────────── */
const C = {
    navy: "#002366", navyD: "#001540", navyM: "#1a3a6e",
    green: "#10b981", greenD: "#059669",
    indigo: "#6366f1", amber: "#f59e0b", sky: "#0ea5e9",
    red: "#ef4444", purple: "#8b5cf6", emerald: "#10b981",
    white: "#fff",
    s50: "#f8fafc", s100: "#f1f5f9", s200: "#e2e8f0",
    s300: "#cbd5e1", s400: "#94a3b8", s500: "#64748b",
    s600: "#475569", s700: "#334155", s800: "#1e293b", s900: "#0f172a",
    fd: "'Bricolage Grotesque',sans-serif",
    dm: "'DM Sans',sans-serif",
};

/* ── Mock Data ───────────────────────────────────────────── */
const CONVERSATION_COLORS = [C.navy, "#0D9488", C.purple, "#DC2626", C.indigo, C.amber, C.sky, C.greenD];

const getInitialsFromName = (name = "Candidate") =>
    String(name || "Candidate")
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part[0] || "")
        .join("")
        .toUpperCase() || "C";

const formatSalary = (min, max) => {
    const fmt = (n) => {
        if (!n) return '';
        if (n >= 100000) return '₹' + (n / 100000).toFixed(1) + ' L';
        if (n >= 1000) return '₹' + (n / 1000).toFixed(0) + 'K';
        return '₹' + n;
    };
    if (min && max) return fmt(min) + ' - ' + fmt(max);
    if (min) return 'From ' + fmt(min);
    if (max) return 'Upto ' + fmt(max);
    return '';
};

const PERK_ICONS = [
    { label: "Health Insurance", icon: FiShield, color: "#10b981" },
    { label: "Gym", icon: FiHeart, color: "#ef4444" },
    { label: "Food", icon: FiCoffee, color: "#f59e0b" },
    { label: "Cab", icon: FiMapPin, color: "#6366f1" },
    { label: "Bonus", icon: FiDollarSign, color: "#10b981" },
    { label: "Flexible Hours", icon: FiClock, color: "#0ea5e9" },
    { label: "Remote", icon: FiMonitor, color: "#8b5cf6" },
    { label: "Stock Options", icon: FiTrendingUp, color: "#002366" },
    { label: "Learning", icon: FiBookmark, color: "#f59e0b" },
    { label: "Vacation", icon: FiSun, color: "#0ea5e9" },
    { label: "Gifts", icon: FiGift, color: "#ef4444" },
    { label: "Headphones", icon: FiHeadphones, color: "#6366f1" },
    { label: "Wellness", icon: FiThumbsUp, color: "#10b981" },
];

const ANALYTICS_DATA = {
    profileViews: [320, 410, 380, 520, 490, 610, 580, 720, 680, 840, 800, 960],
    applications: [40, 62, 55, 78, 70, 95, 88, 112, 105, 130, 122, 148],
    hireRate: [8, 9, 7, 11, 10, 13, 12, 14, 13, 16, 15, 17],
    months: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
    topSources: [
        { label: "LinkedIn", pct: 42, color: C.navy },
        { label: "Direct Apply", pct: 28, color: C.green },
        { label: "Referrals", pct: 16, color: C.indigo },
        { label: "Job Boards", pct: 14, color: C.amber },
    ],
    funnelData: [
        { stage: "Profile Views", val: 8420, color: C.sky },
        { stage: "Job Views", val: 3240, color: C.indigo },
        { stage: "Applications", val: 1284, color: C.navy },
        { stage: "Screened", val: 487, color: C.purple },
        { stage: "Shortlisted", val: 142, color: C.amber },
        { stage: "Offers Sent", val: 12, color: C.green },
    ],
};

/* ── Tiny helpers ────────────────────────────────────────── */
const fmt = n => n >= 1000 ? (n / 1000).toFixed(1) + "K" : n;
const formatCompactNumber = (value) => {
    const num = Number(value || 0);
    if (!Number.isFinite(num)) return "0";
    if (num >= 1000) {
        return `${(num / 1000).toFixed(num >= 10000 ? 0 : 1)}K`;
    }
    return `${num}`;
};
const getMonthKey = (date) => `${date.getFullYear()}-${date.getMonth()}`;
const getTrailingMonths = (count = 12) => {
    const now = new Date();
    return Array.from({ length: count }, (_, index) => {
        const date = new Date(now.getFullYear(), now.getMonth() - (count - 1 - index), 1);
        return {
            key: getMonthKey(date),
            label: date.toLocaleString("en-US", { month: "short" }),
        };
    });
};
const buildMonthlySeries = (items, accessor) => {
    const months = getTrailingMonths();
    const monthIndex = new Map(months.map((month, index) => [month.key, index]));
    const values = Array(months.length).fill(0);

    items.forEach((item) => {
        const rawDate = accessor(item);
        const date = rawDate ? new Date(rawDate) : null;
        if (!date || Number.isNaN(date.getTime())) return;
        const idx = monthIndex.get(getMonthKey(date));
        if (idx === undefined) return;
        values[idx] += 1;
    });

    return {
        labels: months.map((month) => month.label),
        values,
    };
};
const buildStatusCounts = (applications) => {
    const statuses = ["APPLIED", "SCREENING", "SHORTLISTED", "INTERVIEW", "OFFERED", "HIRED"];
    const counts = statuses.map((status) => applications.filter((application) => application.status === status).length);
    return { statuses, counts };
};
const buildSourceBreakdown = (applications) => {
    const sourceCounts = {
        "QR Campaign": 0,
        "Job Share": 0,
        "Direct Apply": 0,
        "Other": 0,
    };

    applications.forEach((application) => {
        if (application.sourceQrToken) {
            sourceCounts["QR Campaign"] += 1;
            return;
        }

        if (application.sourceJobId) {
            sourceCounts["Job Share"] += 1;
            return;
        }

        sourceCounts["Direct Apply"] += 1;
    });

    const total = Object.values(sourceCounts).reduce((sum, value) => sum + value, 0);
    const palette = [
        { label: "QR Campaign", color: C.navy },
        { label: "Job Share", color: C.green },
        { label: "Direct Apply", color: C.indigo },
        { label: "Other", color: C.amber },
    ];

    if (total === 0) {
        return [{ label: "Direct Apply", pct: 100, color: C.indigo }];
    }

    return palette.map((entry) => ({
        ...entry,
        pct: Math.max(0, Math.round((sourceCounts[entry.label] / total) * 100)),
    })).filter((entry) => entry.pct > 0);
};

function Avatar({ initials, color, size = 38, radius = 12, fontSize = 13 }) {
    return (
        <div style={{
            width: size, height: size, borderRadius: radius, background: color,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: C.fd, fontSize, fontWeight: 800, color: "#fff", flexShrink: 0
        }}>
            {initials}
        </div>
    );
}

function Tag({ children, color = C.navy }) {
    return (
        <span style={{
            display: "inline-flex", alignItems: "center", padding: "4px 12px",
            borderRadius: 100, background: color + "14", border: `1px solid ${color}28`,
            fontSize: 12, fontWeight: 700, color, fontFamily: C.fd, whiteSpace: "nowrap"
        }}>
            {children}
        </span>
    );
}

function Btn({ onClick, children, variant = "ghost", style = {} }) {
    const base = {
        display: "inline-flex", alignItems: "center", gap: 7, padding: "8px 16px",
        borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer",
        fontFamily: C.fd, transition: "all .18s", border: "none", ...style
    };
    const variants = {
        primary: { background: C.navy, color: "#fff" },
        green: { background: C.green, color: "#fff" },
        ghost: { background: "transparent", color: C.s600, border: `1.5px solid ${C.s200}` },
        danger: { background: "transparent", color: "#ef4444", border: `1.5px solid #fecaca` },
    };
    return (
        <button onClick={onClick} style={{ ...base, ...variants[variant] }}
            onMouseEnter={e => {
                if (variant === "primary") { e.currentTarget.style.background = C.navyD; e.currentTarget.style.boxShadow = `0 6px 18px rgba(0,35,102,.28)`; }
                if (variant === "green") { e.currentTarget.style.background = C.greenD; }
                if (variant === "ghost") { e.currentTarget.style.borderColor = "rgba(0,35,102,.3)"; e.currentTarget.style.color = C.navy; e.currentTarget.style.background = "rgba(0,35,102,.04)"; }
                if (variant === "danger") { e.currentTarget.style.background = "#fef2f2"; }
                e.currentTarget.style.transform = "translateY(-1px)";
            }}
            onMouseLeave={e => {
                Object.assign(e.currentTarget.style, variants[variant]);
                e.currentTarget.style.transform = "";
                e.currentTarget.style.boxShadow = "";
            }}>
            {children}
        </button>
    );
}

/* ── Line Chart SVG ──────────────────────────────────────── */
function LineChart({ data, color, label, height = 120, showGrid = true }) {
    const W = 440, H = height, PAD = 30;
    const max = Math.max(...data), min = Math.min(...data) * 0.85;
    const pts = data.map((v, i) => ({
        x: PAD + (i / (data.length - 1)) * (W - PAD * 2),
        y: H - PAD - ((v - min) / (max - min)) * (H - PAD * 2),
    }));
    const path = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
    const area = `${path} L${pts[pts.length - 1].x},${H - PAD} L${pts[0].x},${H - PAD} Z`;
    const gridLines = showGrid ? [0, .25, .5, .75, 1] : [];
    return (
        <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ overflow: "visible" }}>
            <defs>
                <linearGradient id={`lc${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity=".2" />
                    <stop offset="100%" stopColor={color} stopOpacity="0" />
                </linearGradient>
            </defs>
            {gridLines.map((g, i) => {
                const y = H - PAD - (g * (H - PAD * 2));
                return <line key={i} x1={PAD} y1={y} x2={W - PAD} y2={y} stroke={C.s100} strokeWidth="1" />;
            })}
            <path d={area} fill={`url(#lc${color.replace("#", "")})`} />
            <path d={path} fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            {pts.map((p, i) => (
                <circle key={i} cx={p.x} cy={p.y} r="3.5" fill="#fff" stroke={color} strokeWidth="2" />
            ))}
        </svg>
    );
}

/* ── Bar Chart SVG ───────────────────────────────────────── */
function BarChart({ data, colors, labels, height = 120 }) {
    const W = 440, H = height, PAD = 30;
    const max = Math.max(...data);
    const bw = (W - PAD * 2) / data.length * 0.55;
    const gap = (W - PAD * 2) / data.length;
    return (
        <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ overflow: "visible" }}>
            {data.map((v, i) => {
                const x = PAD + i * gap + gap * 0.225;
                const bh = ((v / max) * (H - PAD * 2));
                const y = H - PAD - bh;
                const col = Array.isArray(colors) ? colors[i % colors.length] : colors;
                return (
                    <g key={i}>
                        <rect x={x} y={y} width={bw} height={bh} fill={col} rx="4" opacity=".85" />
                        <text x={x + bw / 2} y={H - PAD + 13} textAnchor="middle" fill={C.s400} fontSize="9" fontFamily={C.dm}>{labels[i]}</text>
                        <text x={x + bw / 2} y={y - 5} textAnchor="middle" fill={col} fontSize="9.5" fontWeight="700" fontFamily={C.fd}>{fmt(v)}</text>
                    </g>
                );
            })}
        </svg>
    );
}

/* ── Funnel Chart ────────────────────────────────────────── */
function FunnelChart({ data }) {
    const max = Math.max(data[0]?.val || 0, 1);
    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {data.map((d, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 90, fontSize: 11.5, fontWeight: 600, color: C.s600, textAlign: "right", flexShrink: 0 }}>{d.stage}</div>
                    <div style={{ flex: 1, height: 24, borderRadius: 6, background: C.s100, overflow: "hidden", position: "relative" }}>
                        <div style={{ height: "100%", borderRadius: 6, background: d.color, width: `${(d.val / max) * 100}%`, transition: "width 1s ease", display: "flex", alignItems: "center", justifyContent: "flex-end", paddingRight: 8 }}>
                            <span style={{ fontSize: 10.5, fontWeight: 800, color: "#fff", fontFamily: C.fd }}>{fmt(d.val)}</span>
                        </div>
                    </div>
                    <div style={{ width: 36, fontSize: 11, color: C.s400, fontWeight: 600, flexShrink: 0 }}>
                        {i === 0 ? "100%" : `${((d.val / max) * 100).toFixed(1)}%`}
                    </div>
                </div>
            ))}
        </div>
    );
}

/* ── Modal Shell ─────────────────────────────────────────── */
function Modal({ open, onClose, title, width = 680, children, noPad = false }) {
    useEffect(() => {
        if (open) document.body.style.overflow = "hidden";
        else document.body.style.overflow = "";
        return () => { document.body.style.overflow = ""; };
    }, [open]);
    if (!open) return null;
    return (
        <div onClick={e => { if (e.target === e.currentTarget) onClose(); }}
            style={{
                position: "fixed", inset: 0, zIndex: 1000, background: "rgba(15,23,42,.55)",
                display: "flex", alignItems: "center", justifyContent: "center", padding: "20px",
                backdropFilter: "blur(4px)", animation: "fadeIn .18s ease"
            }}>
            <div style={{
                background: "#fff", borderRadius: 20, width: "100%", maxWidth: width,
                maxHeight: "90vh", display: "flex", flexDirection: "column", overflow: "hidden",
                boxShadow: "0 24px 48px rgba(0,0,0,.12)"
            }}>
                {/* Modal header */}
                <div style={{
                    padding: "18px 24px", borderBottom: `1px solid ${C.s100}`,
                    display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0
                }}>
                    <div style={{ fontFamily: C.fd, fontSize: 17, fontWeight: 800, color: C.s900 }}>{title}</div>
                    <button onClick={onClose}
                        style={{
                            width: 32, height: 32, borderRadius: 9, background: C.s50, border: `1px solid ${C.s200}`,
                            display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
                            color: C.s500, transition: "all .16s"
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = C.s100; e.currentTarget.style.color = C.s900; }}
                        onMouseLeave={e => { e.currentTarget.style.background = C.s50; e.currentTarget.style.color = C.s500; }}>
                        <FiX size={15} />
                    </button>
                </div>
                <div style={{ flex: 1, overflowY: "auto", ...(noPad ? {} : { padding: "24px" }) }}>
                    {children}
                </div>
            </div>
        </div>
    );
}

/* ── Card wrapper ────────────────────────────────────────── */
function Card({ children, style = {}, className = "" }) {
    return (
        <div className={className}
            style={{
                background: "#fff", border: `1px solid ${C.s200}`, borderRadius: 16,
                overflow: "hidden", ...style
            }}>
            {children}
        </div>
    );
}

/* ── Section head ────────────────────────────────────────── */
function SectionHead({ title, action }) {
    return (
        <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "16px 20px", borderBottom: `1px solid ${C.s100}`
        }}>
            <div style={{ fontFamily: C.fd, fontSize: 16, fontWeight: 800, color: C.s900 }}>{title}</div>
            {action}
        </div>
    );
}

function HelpDeskChatForm() {
    const [issue, setIssue] = useState("");
    const [desc, setDesc] = useState("");
    const [urgency, setUrgency] = useState("");
    const [file, setFile] = useState(null);
    const [email, setEmail] = useState("");
    const [contactMethod, setContactMethod] = useState("");
    const [chatStarted, setChatStarted] = useState(false);
    const [chatMessages, setChatMessages] = useState([
        { from: "system", text: "Welcome to the Help Desk Center! How can we assist you today?" }
    ]);
    const [chatInput, setChatInput] = useState("");

    function handleSubmit(e) {
        e.preventDefault();
        if (contactMethod === "Chat") {
            setChatStarted(true);
            setChatMessages((msgs) => [...msgs, { from: "user", text: desc }]);
        } else {
            alert("Your request has been submitted. Our team will contact you soon.");
        }
    }

    function handleChatSend(e) {
        e.preventDefault();
        if (!chatInput.trim()) return;
        setChatMessages((msgs) => [...msgs, { from: "user", text: chatInput }]);
        setChatInput("");
        setTimeout(() => {
            setChatMessages((msgs) => [...msgs, { from: "system", text: "Thank you for your message. We will connect with you in a short time!" }]);
        }, 800);
    }

    if (contactMethod === "Chat" && chatStarted) {
        return (
            <div style={{ display: "flex", flexDirection: "column", height: 400 }}>
                <div style={{ flex: 1, overflowY: "auto", background: "#f8fafc", borderRadius: 10, padding: 16, marginBottom: 12, border: "1px solid #e2e8f0" }}>
                    {chatMessages.map((msg, i) => (
                        <div key={i} style={{ textAlign: msg.from === "user" ? "right" : "left", margin: "8px 0" }}>
                            <span style={{ display: "inline-block", background: msg.from === "user" ? "#002366" : "#e2e8f0", color: msg.from === "user" ? "#fff" : "#222", borderRadius: 16, padding: "8px 16px", maxWidth: 320, fontSize: 15 }}>{msg.text}</span>
                        </div>
                    ))}
                </div>
                <form onSubmit={handleChatSend} style={{ display: "flex", gap: 8 }}>
                    <input value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder="Type your message..." style={{ flex: 1, padding: 10, borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 15 }} />
                    <button type="submit" style={{ background: "#002366", color: "#fff", border: "none", borderRadius: 8, padding: "0 18px", fontWeight: 700, fontSize: 15, cursor: "pointer" }}>
                        <FiSend />
                    </button>
                </form>
                <div style={{ marginTop: 10, color: "#10b981", fontWeight: 600, textAlign: "center" }}>We will connect with you in a short time!</div>
            </div>
        );
    }

    return (
        <div style={{ padding: 24 }}>
            <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 12 }}>How can we help you?</h2>
            <form style={{ display: "flex", flexDirection: "column", gap: 18 }} onSubmit={handleSubmit}>
                <label style={{ fontWeight: 600 }}>
                    What issue are you facing?
                    <select required value={issue} onChange={(e) => setIssue(e.target.value)} style={{ marginTop: 6, padding: 8, borderRadius: 6, border: "1px solid #e2e8f0", width: "100%" }}>
                        <option value="">Select an issue</option>
                        <option>Job Posting</option>
                        <option>Application</option>
                        <option>Shortlisting</option>
                        <option>Offers</option>
                        <option>Other</option>
                    </select>
                </label>
                <label style={{ fontWeight: 600 }}>
                    Please describe your issue in detail
                    <textarea required rows={4} value={desc} onChange={(e) => setDesc(e.target.value)} style={{ marginTop: 6, padding: 8, borderRadius: 6, border: "1px solid #e2e8f0", width: "100%" }} placeholder="Describe your problem..." />
                </label>
                <label style={{ fontWeight: 600 }}>
                    How urgent is your issue?
                    <select required value={urgency} onChange={(e) => setUrgency(e.target.value)} style={{ marginTop: 6, padding: 8, borderRadius: 6, border: "1px solid #e2e8f0", width: "100%" }}>
                        <option value="">Select urgency</option>
                        <option>Low</option>
                        <option>Medium</option>
                        <option>High</option>
                        <option>Critical</option>
                    </select>
                </label>
                <label style={{ fontWeight: 600 }}>
                    Attach any relevant files/screenshots
                    <input type="file" style={{ marginTop: 6 }} onChange={(e) => setFile(e.target.files[0])} />
                </label>
                <label style={{ fontWeight: 600 }}>
                    Your contact email
                    <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} style={{ marginTop: 6, padding: 8, borderRadius: 6, border: "1px solid #e2e8f0", width: "100%" }} placeholder="you@company.com" />
                </label>
                <label style={{ fontWeight: 600 }}>
                    Preferred contact method
                    <select required value={contactMethod} onChange={(e) => setContactMethod(e.target.value)} style={{ marginTop: 6, padding: 8, borderRadius: 6, border: "1px solid #e2e8f0", width: "100%" }}>
                        <option value="">Select method</option>
                        <option>Email</option>
                        <option>Phone</option>
                        <option>Chat</option>
                    </select>
                </label>
                <button type="submit" style={{ marginTop: 10, padding: "10px 0", borderRadius: 8, background: "#002366", color: "#fff", fontWeight: 700, fontSize: 16, border: "none", cursor: "pointer" }}>
                    {contactMethod === "Chat" ? "Start Chat" : "Submit Request"}
                </button>
            </form>
        </div>
    );
}

/* ── Progress Section ─────────────────────────────────────── */
const STATUS_OPTS = ["APPLIED", "SCREENING", "SHORTLISTED", "INTERVIEW", "OFFERED", "HIRED", "REJECTED"];
const prettifyStatus = (v) => v ? v[0].toUpperCase() + v.slice(1).toLowerCase() : "";
const statusColors = { APPLIED: C.navy, SCREENING: C.sky, SHORTLISTED: C.amber, INTERVIEW: C.indigo, OFFERED: C.green, HIRED: C.greenD, REJECTED: C.red };
const formatDate = (v) => { if (!v) return "-"; try { return new Date(v).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }); } catch { return "-"; } };

function ProgressSection({
    apps, filter, onFilterChange, page, onPageChange,
    draftStatuses, setDraftStatuses, updatingAppId, setUpdatingAppId,
    resumeBusyId, setResumeBusyId, progressBanner, setProgressBanner
}) {
    const PAGE_SIZE = 7;
    const scrollRef = useRef(null);
    const [isDragging, setIsDragging] = useState(false);
    const [canScrollL, setCanScrollL] = useState(false);
    const [canScrollR, setCanScrollR] = useState(false);
    const dragX = useRef(0);
    const dragScroll = useRef(0);

    const filteredApps = filter === "ALL" ? apps : apps.filter(a => a.status === filter);
    const totalFiltered = filteredApps.length;
    const totalPages = Math.max(1, Math.ceil(totalFiltered / PAGE_SIZE));
    const safePage = Math.min(page, totalPages);
    const paginatedApps = filteredApps.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

    const statusCounts = useMemo(() => {
        const sc = { total: apps.length };
        for (const s of STATUS_OPTS) sc[s] = apps.filter(a => a.status === s).length;
        return sc;
    }, [apps]);

    const checkScroll = useCallback(() => {
        const el = scrollRef.current;
        if (!el) return;
        setCanScrollL(el.scrollLeft > 4);
        setCanScrollR(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
    }, []);

    useEffect(() => {
        const el = scrollRef.current;
        if (!el) return;
        checkScroll();
        el.addEventListener("scroll", checkScroll, { passive: true });
        const ro = new ResizeObserver(checkScroll);
        ro.observe(el);
        return () => { el.removeEventListener("scroll", checkScroll); ro.disconnect(); };
    }, [paginatedApps, checkScroll]);

    const scrollBy = (dir) => {
        scrollRef.current?.scrollBy({ left: dir * 360, behavior: "smooth" });
    };

    const onMouseDown = (e) => {
        setIsDragging(true);
        const el = scrollRef.current;
        dragX.current = e.pageX - el.getBoundingClientRect().left;
        dragScroll.current = el.scrollLeft;
        el.style.cursor = "grabbing";
    };
    const onMouseMove = (e) => {
        if (!isDragging) return;
        e.preventDefault();
        const el = scrollRef.current;
        const x = e.pageX - el.getBoundingClientRect().left;
        el.scrollLeft = dragScroll.current - (x - dragX.current);
    };
    const onMouseUp = () => {
        if (!isDragging) return;
        setIsDragging(false);
        if (scrollRef.current) scrollRef.current.style.cursor = "";
    };

    const handleUpdate = async (app) => {
        const newStatus = draftStatuses[app.id] || app.status;
        if (newStatus === app.status) return;
        setUpdatingAppId(app.id);
        setProgressBanner(null);
        try { await authService.updateApplicationStatus(app.id, newStatus); setProgressBanner({ type: "success", message: "Status updated successfully" }); }
        catch { setProgressBanner({ type: "error", message: "Failed to update status" }); }
        setUpdatingAppId(null);
    };

    const handleResume = async (app) => {
        if (!app.resumeUrl && !app.resumeFileName) return;
        if (app.resumeUrl) { window.open(app.resumeUrl, "_blank"); return; }
        setResumeBusyId(app.id);
        try { const blob = await authService.previewApplicationResume(app.id); const url = URL.createObjectURL(blob); window.open(url, "_blank"); }
        catch { setProgressBanner({ type: "error", message: "Failed to open resume" }); }
        setResumeBusyId(null);
    };

    const pageNumbers = useMemo(() => {
        if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
        const p = [];
        p.push(1);
        if (safePage > 3) p.push("...");
        for (let i = Math.max(2, safePage - 1); i <= Math.min(totalPages - 1, safePage + 1); i++) p.push(i);
        if (safePage < totalPages - 2) p.push("...");
        p.push(totalPages);
        return p;
    }, [totalPages, safePage]);

    return (
        <Card className="ep-card" style={{ padding: 0, overflow: "visible" }}>
            {/* ─ Title + Filter ─ */}
            <div style={{ padding: "20px 24px", borderBottom: `1px solid ${C.s100}`, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
                <div style={{ fontFamily: C.fd, fontSize: 18, fontWeight: 800, color: C.s900 }}>Applications</div>
                <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 600, color: C.s500 }}>
                    <FiFilter size={14} /> Status
                    <select value={filter} onChange={(e) => { onFilterChange(e.target.value); onPageChange(1); }} style={{ padding: "6px 10px", borderRadius: 8, border: `1px solid ${C.s200}`, fontSize: 13, fontWeight: 600, color: C.s700, background: "#fff", cursor: "pointer", outline: "none" }}>
                        <option value="ALL">All statuses</option>
                        {STATUS_OPTS.map(s => <option key={s} value={s}>{prettifyStatus(s)}</option>)}
                    </select>
                </label>
            </div>

            {/* ─ Summary cards ─ */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 0, borderBottom: `1px solid ${C.s100}` }}>
                {[
                    { label: "Total applications", val: statusCounts.total, color: C.navy },
                    { label: "Shortlisted", val: statusCounts.SHORTLISTED, color: C.amber },
                    { label: "Interview", val: statusCounts.INTERVIEW, color: C.indigo },
                    { label: "Rejected", val: statusCounts.REJECTED, color: C.red },
                ].map((s, i) => (
                    <div key={i} style={{ padding: "16px 20px", borderRight: i < 3 ? `1px solid ${C.s100}` : "none", background: s.color + "04" }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: s.color, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 4 }}>{s.label}</div>
                        <div style={{ fontFamily: C.fd, fontSize: 26, fontWeight: 800, color: C.s900 }}>{s.val}</div>
                    </div>
                ))}
            </div>

            {/* ─ Banner ─ */}
            {progressBanner && (
                <div style={{ padding: "10px 20px", background: progressBanner.type === "success" ? "#ECFDF5" : "#FEF2F2", color: progressBanner.type === "success" ? "#065F46" : "#991B1B", fontSize: 13, fontWeight: 600, borderBottom: `1px solid ${C.s100}` }}>
                    {progressBanner.message}
                </div>
            )}

            {/* ─ Scrollable Table with nav buttons ─ */}
            <div style={{ position: "relative" }}>
                {canScrollL && (
                    <button aria-label="Scroll table left" onClick={() => scrollBy(-1)}
                        style={{ position: "absolute", left: 6, top: "50%", zIndex: 10, transform: "translateY(-50%)", width: 32, height: 32, borderRadius: "50%", border: `1px solid ${C.s200}`, background: "#fff", color: C.s600, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: "0 2px 8px rgba(0,0,0,.1)", transition: "all .15s", fontSize: 16, lineHeight: 1 }}
                        onMouseEnter={e => { e.currentTarget.style.background = C.navy; e.currentTarget.style.color = "#fff"; e.currentTarget.style.borderColor = C.navy; }}
                        onMouseLeave={e => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.color = C.s600; e.currentTarget.style.borderColor = C.s200; }}>
                        <FiChevronLeft size={16} />
                    </button>
                )}
                {canScrollR && (
                    <button aria-label="Scroll table right" onClick={() => scrollBy(1)}
                        style={{ position: "absolute", right: 6, top: "50%", zIndex: 10, transform: "translateY(-50%)", width: 32, height: 32, borderRadius: "50%", border: `1px solid ${C.s200}`, background: "#fff", color: C.s600, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: "0 2px 8px rgba(0,0,0,.1)", transition: "all .15s", fontSize: 16, lineHeight: 1 }}
                        onMouseEnter={e => { e.currentTarget.style.background = C.navy; e.currentTarget.style.color = "#fff"; e.currentTarget.style.borderColor = C.navy; }}
                        onMouseLeave={e => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.color = C.s600; e.currentTarget.style.borderColor = C.s200; }}>
                        <FiChevronRight size={16} />
                    </button>
                )}
                <div ref={scrollRef} className="ep-progress-scroll"
                    style={{ overflowX: "auto", overflowY: "hidden", maxWidth: "100%", width: "100%", userSelect: "none", WebkitOverflowScrolling: "touch", cursor: isDragging ? "grabbing" : "grab" }}
                    onMouseDown={onMouseDown} onMouseMove={onMouseMove}
                    onMouseUp={onMouseUp} onMouseLeave={onMouseUp}>
                    <table style={{ minWidth: 960, borderCollapse: "collapse", fontSize: 13 }}>
                        <thead>
                            <tr style={{ background: C.s50, borderBottom: `1px solid ${C.s100}`, position: "sticky", top: 0, zIndex: 2 }}>
                                {["", "Candidate", "Applied role", "Status", "Update status", "Contact", "Applied on", "Resume"].map(h => (
                                    <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontWeight: 700, color: C.s500, fontSize: 11, textTransform: "uppercase", letterSpacing: ".06em", whiteSpace: "nowrap", background: C.s50 }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedApps.length ? paginatedApps.map(app => {
                                const draftVal = draftStatuses[app.id] || app.status || "APPLIED";
                                const hasChange = draftVal !== (app.status || "APPLIED");
                                const sc = statusColors[app.status] || C.s500;
                                return (
                                    <tr key={app.id} style={{ borderBottom: `1px solid ${C.s100}`, transition: "background .15s" }}
                                        onMouseEnter={e => { e.currentTarget.style.background = C.s50; }}
                                        onMouseLeave={e => { e.currentTarget.style.background = "none"; }}>
                                        <td style={{ padding: "12px 16px", whiteSpace: "nowrap", verticalAlign: "middle" }}>
                                            <div style={{ width: 34, height: 34, borderRadius: "50%", background: app.candidateLogoUrl ? `url("${app.candidateLogoUrl}") center/cover no-repeat` : C.navy + "12", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, color: C.navy, border: `1px solid ${C.s200}`, flexShrink: 0 }}>
                                                {!app.candidateLogoUrl && (app.candidateName ? app.candidateName.slice(0, 2).toUpperCase() : "CA")}
                                            </div>
                                        </td>
                                        <td style={{ padding: "12px 16px", whiteSpace: "nowrap" }}>
                                            <div style={{ fontWeight: 700, color: C.s900 }}>{app.candidateName || "Candidate"}</div>
                                            <div style={{ fontSize: 12, color: C.s400 }}>{app.candidateCurrentTitle || "Role not set"}</div>
                                        </td>
                                        <td style={{ padding: "12px 16px", whiteSpace: "nowrap" }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 600, color: C.s800 }}>
                                                <FiUsers size={13} color={C.s400} /> {app.jobTitle || "Unknown role"}
                                            </div>
                                        </td>
                                        <td style={{ padding: "12px 16px" }}>
                                            <span style={{ display: "inline-block", padding: "4px 10px", borderRadius: 100, fontSize: 12, fontWeight: 700, background: sc + "12", color: sc, border: `1px solid ${sc}30`, whiteSpace: "nowrap" }}>
                                                {prettifyStatus(app.status || "APPLIED")}
                                            </span>
                                        </td>
                                        <td style={{ padding: "12px 16px" }}>
                                            <div style={{ display: "flex", gap: 8, alignItems: "center", whiteSpace: "nowrap" }}>
                                                <select value={draftVal} onChange={(e) => setDraftStatuses(prev => ({ ...prev, [app.id]: e.target.value }))} style={{ padding: "5px 8px", borderRadius: 8, border: `1px solid ${C.s200}`, fontSize: 12, fontWeight: 600, color: C.s700, background: "#fff", cursor: "pointer", outline: "none", minWidth: 100 }}>
                                                    {STATUS_OPTS.map(s => <option key={s} value={s}>{prettifyStatus(s)}</option>)}
                                                </select>
                                                <button onClick={() => handleUpdate(app)} disabled={!hasChange || updatingAppId === app.id} style={{ padding: "5px 10px", borderRadius: 8, border: "none", background: hasChange ? C.navy : C.s200, color: "#fff", fontSize: 12, fontWeight: 700, cursor: hasChange ? "pointer" : "default", opacity: updatingAppId === app.id ? 0.6 : 1, whiteSpace: "nowrap" }}>
                                                    {updatingAppId === app.id ? "..." : "Update"}
                                                </button>
                                            </div>
                                        </td>
                                        <td style={{ padding: "12px 16px", whiteSpace: "nowrap" }}>
                                            <div style={{ fontSize: 12, color: C.s600 }}>{app.candidateEmail || "-"}</div>
                                            <div style={{ fontSize: 12, color: C.s400 }}>{app.candidatePhone || "-"}</div>
                                        </td>
                                        <td style={{ padding: "12px 16px", fontSize: 12, color: C.s500, whiteSpace: "nowrap" }}>{formatDate(app.appliedAt)}</td>
                                        <td style={{ padding: "12px 16px", whiteSpace: "nowrap" }}>
                                            {app.resumeUrl || app.resumeFileName ? (
                                                <button onClick={() => handleResume(app)} disabled={resumeBusyId === app.id} style={{ background: "none", border: "none", padding: 0, cursor: "pointer", color: C.navy, fontWeight: 700, fontSize: 12, display: "flex", alignItems: "center", gap: 4, whiteSpace: "nowrap" }}>
                                                    {resumeBusyId === app.id ? "Opening..." : "Open resume"} <FiExternalLink size={12} />
                                                </button>
                                            ) : (
                                                <span style={{ fontSize: 12, color: C.s400 }}>Not uploaded</span>
                                            )}
                                        </td>
                                    </tr>
                                );
                            }) : (
                                <tr><td colSpan={7} style={{ padding: "40px 16px", textAlign: "center", color: C.s400, fontSize: 13 }}>No applications found for this filter.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ─ Pagination ─ */}
            {totalFiltered > 0 && (
                <div style={{ padding: "14px 20px", borderTop: `1px solid ${C.s100}`, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, background: C.s50 + "80" }}>
                    <div style={{ fontSize: 12.5, color: C.s500, fontWeight: 600 }}>
                        Showing <strong>{(safePage - 1) * PAGE_SIZE + 1}-{Math.min(safePage * PAGE_SIZE, totalFiltered)}</strong> of <strong>{totalFiltered}</strong> applications
                    </div>
                    <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                        <button onClick={() => onPageChange(Math.max(1, safePage - 1))} disabled={safePage <= 1}
                            style={{ width: 34, height: 34, borderRadius: 9, border: `1px solid ${C.s200}`, background: safePage <= 1 ? C.s50 : "#fff", color: safePage <= 1 ? C.s300 : C.s700, display: "flex", alignItems: "center", justifyContent: "center", cursor: safePage <= 1 ? "default" : "pointer", fontSize: 14, transition: "all .15s", outline: "none" }}
                            onMouseEnter={e => { if (safePage > 1) { e.currentTarget.style.borderColor = C.navy; e.currentTarget.style.color = C.navy; } }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = C.s200; e.currentTarget.style.color = safePage <= 1 ? C.s300 : C.s700; }}>
                            <FiChevronLeft size={15} />
                        </button>
                        {pageNumbers.map((n, i) => n === "..." ? (
                            <span key={`e${i}`} style={{ width: 28, textAlign: "center", fontSize: 12, color: C.s400, fontWeight: 600 }}>...</span>
                        ) : (
                            <button key={n} onClick={() => onPageChange(n)}
                                style={{ width: 34, height: 34, borderRadius: 9, border: `1px solid ${safePage === n ? C.navy : C.s200}`, background: safePage === n ? C.navy : "#fff", color: safePage === n ? "#fff" : C.s700, fontWeight: 700, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all .15s", outline: "none" }}
                                onMouseEnter={e => { if (safePage !== n) { e.currentTarget.style.borderColor = C.navy; e.currentTarget.style.color = C.navy; } }}
                                onMouseLeave={e => { if (safePage !== n) { e.currentTarget.style.borderColor = C.s200; e.currentTarget.style.color = C.s700; } }}>
                                {n}
                            </button>
                        ))}
                        <button onClick={() => onPageChange(Math.min(totalPages, safePage + 1))} disabled={safePage >= totalPages}
                            style={{ width: 34, height: 34, borderRadius: 9, border: `1px solid ${C.s200}`, background: safePage >= totalPages ? C.s50 : "#fff", color: safePage >= totalPages ? C.s300 : C.s700, display: "flex", alignItems: "center", justifyContent: "center", cursor: safePage >= totalPages ? "default" : "pointer", fontSize: 14, transition: "all .15s", outline: "none" }}
                            onMouseEnter={e => { if (safePage < totalPages) { e.currentTarget.style.borderColor = C.navy; e.currentTarget.style.color = C.navy; } }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = C.s200; e.currentTarget.style.color = safePage >= totalPages ? C.s300 : C.s700; }}>
                            <FiChevronRight size={15} />
                        </button>
                    </div>
                </div>
            )}
        </Card>
    );
}

/* ══════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════ */
export default function EmployerProfile() {
    const navigate = useNavigate();
    const [topNavTab, setTopNavTab] = useState("home");
    const [activeTab, setActiveTab] = useState("Overview");
    const [dashboard, setDashboard] = useState(null);
    const [dashboardLoading, setDashboardLoading] = useState(true);
    const [aiTopCandidates, setAiTopCandidates] = useState(null);
    const [aiCandidatesLoading, setAiCandidatesLoading] = useState(false);
    const [mediaLoading, setMediaLoading] = useState({ logo: false, cover: false });
    const logoInputRef = useRef(null);
    const coverInputRef = useRef(null);
    const [cropModal, setCropModal] = useState({ open: false, kind: "logo" });
    const [cropFile, setCropFile] = useState(null);
    const [cropImageUrl, setCropImageUrl] = useState("");
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedPixels, setCroppedPixels] = useState(null);
    const [cropSaving, setCropSaving] = useState(false);
    const [showMsg, setShowMsg] = useState(false);
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);
    const [requestedCandidateId, setRequestedCandidateId] = useState(null);
    const [showAna, setShowAna] = useState(false);
    const [showHelpDesk, setShowHelpDesk] = useState(false);
    const [showPro, setShowPro] = useState(false);
    const [showPost, setShowPost] = useState(false);
    const [activeConv, setActiveConv] = useState(0);
    const [msgInput, setMsgInput] = useState("");
    const [messages, setMessages] = useState([]);
    const [liked, setLiked] = useState({});
    const [following, setFollowing] = useState(false);
    const [jobFilter, setJobFilter] = useState("all");
    const [jobPage, setJobPage] = useState(0);
    const [anaTab, setAnaTab] = useState("overview");
    const [showNotifications, setShowNotifications] = useState(false);
    const [notificationsLoading, setNotificationsLoading] = useState(false);
    const [employerNotifications, setEmployerNotifications] = useState([]);
    const [notificationsError, setNotificationsError] = useState("");
    const [showViewJob, setShowViewJob] = useState(false);
    const [showEditJob, setShowEditJob] = useState(false);
    const [selectedJob, setSelectedJob] = useState(null);
    const [editJobTab, setEditJobTab] = useState("basic");
    const [editFormData, setEditFormData] = useState({ title: "", department: "", location: "", description: "", jobType: "Full-time", isActive: true, screeningQuestions: [], salaryMin: 0, salaryMax: 0 });
    const [editSaving, setEditSaving] = useState(false);
    const [editError, setEditError] = useState("");
    const [uploadingResumeAppId, setUploadingResumeAppId] = useState(null);
    const [reviewPage, setReviewPage] = useState(0);
    const [showCandidateModal, setShowCandidateModal] = useState(false);
    const [selectedCandidateApp, setSelectedCandidateApp] = useState(null);
    const [showAboutEditor, setShowAboutEditor] = useState(false);
    const [aboutDraft, setAboutDraft] = useState({ about: "", website: "", companySize: "", industry: "", founded: "", tagline: "", type: "", linkedIn: "", specialties: [], locationCity: "", locationRegion: "", locationZone: "", perks: [] });
    const [specInput, setSpecInput] = useState("");
    const [perkInput, setPerkInput] = useState("");
    const [showPerkPicker, setShowPerkPicker] = useState(false);
    const [savingAbout, setSavingAbout] = useState(false);
    const [likedReviews, setLikedReviews] = useState({});
    const [showReactionFor, setShowReactionFor] = useState(null);
    const [candidatePage, setCandidatePage] = useState(1);
    const prevCandidatesRef = useRef(0);
    const [progressFilter, setProgressFilter] = useState("ALL");
    const [progressPage, setProgressPage] = useState(1);
    const [draftStatuses, setDraftStatuses] = useState({});
    const [updatingAppId, setUpdatingAppId] = useState(null);
    const [resumeBusyId, setResumeBusyId] = useState(null);
    const [progressBanner, setProgressBanner] = useState(null);
    const [shareMessage, setShareMessage] = useState("");
    const [showHeaderMenu, setShowHeaderMenu] = useState(false);
    const headerMenuRef = useRef(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deletePassStep, setDeletePassStep] = useState(0);
    const [deletePassword, setDeletePassword] = useState("");
    const [deletePassword2, setDeletePassword2] = useState("");
    const [deleteError, setDeleteError] = useState("");
    const [deleting, setDeleting] = useState(false);
    const [showCall, setShowCall] = useState(false);
    const [callMode, setCallMode] = useState("AUDIO");
    const [callStatus, setCallStatus] = useState("idle");
    const CALLS_ENABLED = false;
    const [localCallStream, setLocalCallStream] = useState(null);
    const [remoteCallStream, setRemoteCallStream] = useState(null);
    const [isCallConnected, setIsCallConnected] = useState(false);
    const callPreviewRef = useRef(null);
    const remoteVideoRef = useRef(null);
    const peerConnectionRef = useRef(null);
    const localCallStreamRef = useRef(null);
    const pendingIceCandidatesRef = useRef([]);
    const rtcConfig = useMemo(() => buildWebRtcConfig(), []);
    const chatEndRef = useRef(null);
    const chatSocketRef = useRef(null);

    const hasPremiumX = () => {
        const plan = (dashboard?.company?.packageType || dashboard?.company?.plan || "").toString().toLowerCase();
        return plan.includes("premium");
    };

    const handleRequestChat = (candidateId = null) => {
        if (hasPremiumX()) {
            setShowMsg(true);
            setRequestedCandidateId(null);
        } else {
            setRequestedCandidateId(candidateId);
            setShowUpgradeModal(true);
        }
    };
    const activeConversationIdRef = useRef("");
    const employerSession = useRef(null);

    useEffect(() => {
        if (!dashboard?.company) return;
        setAboutDraft({
            about: dashboard.company.about || "",
            website: dashboard.company.website || "",
            companySize: dashboard.company.companySize || dashboard.company.size || "",
            industry: dashboard.company.industry || "",
            perks: Array.isArray(dashboard.company.perks) ? [...dashboard.company.perks] : [],
        });
    }, [dashboard?.company]);

    useEffect(() => {
        setMessages([]);
        setActiveConv(0);
    }, []);

    const activeConversation = useMemo(
        () => messages[activeConv] || messages[0] || null,
        [messages, activeConv],
    );

    useEffect(() => {
        activeConversationIdRef.current = activeConversation?.id || "";
    }, [activeConversation?.id]);

    useEffect(() => {
        if (!showMsg) {
            return;
        }

        const hydrateThreads = async () => {
            try {
                const response = await authService.getEmployerChats();
                const backendThreads = response?.data?.threads || [];
                if (!backendThreads.length) {
                    return;
                }

                setMessages((current) => {
                    const currentById = new Map(current.map((conversation) => [String(conversation.id), conversation]));
                    return backendThreads.map((thread, index) => {
                        const previous = currentById.get(String(thread.id));
                        const color = previous?.color || CONVERSATION_COLORS[index % CONVERSATION_COLORS.length];
                        const avatar = thread.candidateAvatar || previous?.avatar || getInitialsFromName(thread.candidateName);
                        return {
                            ...previous,
                            ...thread,
                            avatar,
                            color,
                            from: thread.candidateName || previous?.from || "Candidate",
                            role: thread.candidateTitle || previous?.role || thread.jobTitle || "Candidate",
                            preview: previous?.preview || thread.lastMessageText || "No messages yet",
                            time: thread.time || previous?.time || "Just now",
                            messages: previous?.messages || [],
                        };
                    });
                });
            } catch {
                // Keep the locally derived list when the chat endpoint is unavailable.
            }
        };

        hydrateThreads();
    }, [showMsg]);

    useEffect(() => {
        let active = true;

        const loadDashboard = async () => {
            const savedSession = (() => {
                try {
                    return JSON.parse(localStorage.getItem("employerUser") || "null");
                } catch {
                    return null;
                }
            })();

            employerSession.current = savedSession;

            if (!localStorage.getItem("employerToken")) {
                if (active) setDashboardLoading(false);
                return;
            }

            try {
                const response = await authService.getEmployerDashboard();
                if (!active) return;
                let dashboardData = response?.data || null;

                try {
                    const hasApps = (dashboardData && Array.isArray(dashboardData.applications) && dashboardData.applications.length > 0);
                    if (!hasApps) {
                        const appsResp = await authService.getEmployerApplications();
                        const apps = appsResp?.data || appsResp?.applications || [];
                        dashboardData = { ...(dashboardData || {}), applications: apps };
                    }
                } catch (err) {
                    // ignore; keep whatever dashboard data we already have
                }

                setDashboard(dashboardData || null);

                const nextSession = {
                    ...(savedSession || {}),
                    companyName: response?.data?.company?.name || savedSession?.companyName || "",
                    companyId: response?.data?.company?.id || savedSession?.companyId || "",
                };
                employerSession.current = nextSession;
                localStorage.setItem("employerUser", JSON.stringify(nextSession));
            } catch (error) {
                if (active) {
                    const cached = savedSession || {};
                    setDashboard({
                        company: {
                            id: cached.companyId || "",
                            name: cached.companyName || "",
                            logoUrl: cached.logoUrl || "",
                            coverImageUrl: cached.coverImageUrl || "",
                        },
                        tracking: {
                            activeApprovedJobs: Number(cached.activeJobCount ?? 0),
                            totalApplications: Number(cached.totalApplications ?? 0),
                        },
                    });
                }
                if ((error?.statusCode || error?.response?.status) === 401) {
                    localStorage.removeItem("employerToken");
                    localStorage.removeItem("candidateToken");
                    localStorage.removeItem("token");
                    localStorage.removeItem("employerUser");
                }
            } finally {
                if (active) setDashboardLoading(false);
            }
        };

        loadDashboard();
        return () => {
            active = false;
        };
    }, []);

    // Populate aboutDraft when the About Editor modal opens
    useEffect(() => {
        if (showAboutEditor && dashboard?.company) {
            const c = dashboard.company;
            setAboutDraft({
                about: c.about || "",
                website: c.website || "",
                companySize: c.companySize || "",
                industry: c.industry || "",
                founded: c.foundedYear || "",
                tagline: c.tagline || "",
                type: c.type || "",
                linkedIn: c.linkedIn || "",
                specialties: Array.isArray(c.specialties) ? [...c.specialties] : [],
                perks: Array.isArray(c.perks) ? [...c.perks] : [],
                locationCity: c.location?.city || "",
                locationRegion: c.location?.region || "",
                locationZone: c.location?.zone || "",
            });
        }
    }, [showAboutEditor]);

    // Fetch AI candidate recommendations when dashboard has active jobs
    useEffect(() => {
        const jobCount = Number(dashboard?.tracking?.activeApprovedJobs ?? dashboard?.company?.activeJobCount ?? 0);
        if (!dashboard || jobCount === 0) return;
        let cancelled = false;
        const fetchAiCandidates = async () => {
            setAiCandidatesLoading(true);
            try {
                const resp = await api.get("/chatbot/recommend-candidates");
                if (cancelled) return;
                const candidates = resp?.data?.data?.candidates || resp?.data?.candidates || [];
                if (candidates.length > 0) {
                    setAiTopCandidates(candidates.slice(0, 3).map((c, i) => ({
                        id: c.id || c._id || `ai-${i}`,
                        name: c.name || c.candidateName || "Candidate",
                        role: c.currentTitle || c.title || c.role || "Professional",
                        match: c.matchScore || c.match || Math.round(80 + Math.random() * 15),
                        avatar: getInitialsFromName(c.name || c.candidateName || "Candidate"),
                        color: CONVERSATION_COLORS[i % CONVERSATION_COLORS.length],
                    })));
                }
            } catch {
                if (!cancelled) setAiTopCandidates(null);
            } finally {
                if (!cancelled) setAiCandidatesLoading(false);
            }
        };
        fetchAiCandidates();
        return () => { cancelled = true; };
    }, [dashboard]);

    useEffect(() => {
        if (!showNotifications) return;

        let active = true;
        const loadNotifications = async () => {
            setNotificationsLoading(true);
            setNotificationsError("");

            try {
                const resp = await authService.getEmployerNotifications();
                const list = resp?.data || resp?.notifications || resp || [];
                if (!active) return;
                setEmployerNotifications(Array.isArray(list) ? list : []);
            } catch (err) {
                if (!active) return;
                setNotificationsError((err?.message || err?.error || "").toString());
                setEmployerNotifications([]);
            } finally {
                if (!active) return;
                setNotificationsLoading(false);
            }
        };

        loadNotifications();

        return () => {
            active = false;
        };
    }, [showNotifications]);

    useEffect(() => {
        if (showMsg) setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    }, [showMsg, activeConv]);

    useEffect(() => {
        if (!showMsg) {
            return;
        }

        const token = localStorage.getItem("employerToken");
        if (!token) {
            return;
        }

        const socketUrl = (import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL || "http://localhost:5000")
            .replace(/\/api\/v\d+$/, "");

        if (chatSocketRef.current) {
            return;
        }

        const socket = io(socketUrl, {
            auth: { token },
            transports: ["websocket", "polling"],
            withCredentials: true,
            reconnection: true,
            reconnectionAttempts: Infinity,
            reconnectionDelay: 500,
            reconnectionDelayMax: 2000,
            timeout: 20000,
            pingInterval: 25000,
            pingTimeout: 60000,
        });

        socket.on("connect", () => {
            if (activeConversationIdRef.current) {
                socket.emit("thread:join", { threadId: activeConversationIdRef.current });
            }
        });

        socket.on("chat:message", ({ threadId, message, thread }) => {
            setMessages((current) => current.map((conversation) => {
                if (String(conversation.id) !== String(threadId)) {
                    return conversation;
                }

                const nextMessages = Array.isArray(conversation.messages) ? [...conversation.messages] : [];
                const isFromMe = message.senderRole === "COMPANY";
                if (isFromMe) {
                    const lastMsg = nextMessages[nextMessages.length - 1];
                    if (lastMsg && lastMsg.from === "me" && lastMsg.text === message.text && lastMsg.time === "Just now") {
                        nextMessages[nextMessages.length - 1] = {
                            from: "me",
                            text: message.text || "",
                            time: message.lastUpdated || "Just now",
                        };
                        return { ...conversation, ...thread, messages: nextMessages, preview: message.text || conversation.preview, time: thread?.time || conversation.time, unread: false };
                    }
                }

                nextMessages.push({
                    from: isFromMe ? "me" : "them",
                    text: message.text || "",
                    time: message.lastUpdated || "Just now",
                });

                return {
                    ...conversation,
                    ...thread,
                    messages: nextMessages,
                    preview: message.text || conversation.preview,
                    time: thread?.time || conversation.time,
                    unread: !isFromMe,
                };
            }));
        });

        socket.on("disconnect", () => {
            chatSocketRef.current = null;
        });

        chatSocketRef.current = socket;

        return () => {
            socket.disconnect();
            chatSocketRef.current = null;
        };
    }, [showMsg]);

    useEffect(() => {
        if (!showMsg || !activeConversation?.id) {
            return;
        }

        chatSocketRef.current.emit("thread:join", { threadId: activeConversation.id });
    }, [showMsg, activeConversation?.id, activeConversation?.isSynthetic]);

    useEffect(() => {
        if (callPreviewRef.current && localCallStream) {
            callPreviewRef.current.srcObject = localCallStream;
        }

        return () => {
            if (callPreviewRef.current) {
                callPreviewRef.current.srcObject = null;
            }
        };
    }, [localCallStream, showCall]);

    useEffect(() => {
        if (remoteVideoRef.current && remoteCallStream) {
            const remoteVideo = remoteVideoRef.current;
            remoteVideo.autoplay = true;
            remoteVideo.playsInline = true;
            remoteVideo.srcObject = remoteCallStream;
            const playPromise = remoteVideo.play();
            if (playPromise?.catch) {
                playPromise.catch((err) => console.warn("Remote call video autoplay failed", err));
            }
        }
    }, [remoteCallStream, showCall]);

    useEffect(() => {
        if (!showMsg || !activeConversation?.id) {
            return;
        }

        const loadThreadMessages = async () => {
            try {
                const response = await authService.getEmployerChatMessages(activeConversation.id);
                const threadMessages = response?.data?.messages || [];
                setMessages((current) => current.map((conversation) => {
                    if (String(conversation.id) !== String(activeConversation.id)) {
                        return conversation;
                    }

                    return {
                        ...conversation,
                        ...response?.data?.thread,
                        avatar: response?.data?.thread?.candidateAvatar || conversation.avatar,
                        from: response?.data?.thread?.candidateName || conversation.from,
                        role: response?.data?.thread?.candidateTitle || conversation.role,
                        messages: threadMessages.map((message) => ({
                            from: message.senderRole === "COMPANY" ? "me" : "them",
                            text: message.text || "",
                            time: message.lastUpdated || "Just now",
                        })),
                        unread: false,
                    };
                }));
                await authService.markEmployerChatRead(activeConversation.id);
            } catch {
                // Fall back to locally generated thread content if the chat endpoint is not available yet.
            }
        };

        loadThreadMessages();
    }, [activeConversation?.id, showMsg]);

    useEffect(() => {
        if (activeConv >= messages.length) {
            setActiveConv(0);
        }
    }, [activeConv, messages.length]);

    useEffect(() => {
        const loadScript = (src) => new Promise((resolve, reject) => {
            if (typeof window === 'undefined') return resolve();
            if (document.querySelector(`script[src="${src}"]`)) return resolve();
            const s = document.createElement('script');
            s.src = src;
            s.async = true;
            s.onload = () => resolve();
            s.onerror = (e) => reject(e);
            document.head.appendChild(s);
        });

        (async () => {
            try {
                await loadScript('https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js');
                await loadScript('https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js');
                const { gsap } = window;
                const { ScrollTrigger } = window || {};
                if (!gsap) return;
                try { gsap.registerPlugin && gsap.registerPlugin(ScrollTrigger); } catch { }
                gsap.fromTo(".ep-cover", { opacity: 0, y: -20 }, { opacity: 1, y: 0, duration: .6, ease: "power3.out" });
                gsap.fromTo(".ep-card", { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: .55, stagger: .07, ease: "power3.out", delay: .2 });
            } catch (err) {
                // Loading animation failed — silently ignore to avoid breaking the UI
            }
        })();
    }, []);

    const sendMessage = async () => {
        if (!msgInput.trim() || !activeConversation?.id) return;
        const outgoing = msgInput.trim();
        setMsgInput("");

        setMessages((current) => current.map((conversation, index) => {
            if (index !== activeConv) return conversation;
            return {
                ...conversation,
                messages: [
                    ...(conversation.messages || []),
                    { from: "me", text: outgoing, time: "Just now" }
                ],
                preview: outgoing,
                unread: false,
            };
        }));
        setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 60);

        try {
            await authService.sendEmployerChatMessage(activeConversation.id, { text: outgoing });
        } catch {
            // Silently ignore or implement retry
        }
    };

    const startCall = useCallback(async (mode) => {
        if (!CALLS_ENABLED) {
            alert("Calls are disabled. Chat-only mode is active.");
            return;
        }
        if (!activeConversation?.id) {
            return;
        }

        const callType = String(mode || "AUDIO").toUpperCase() === "VIDEO" ? "VIDEO" : "AUDIO";
        setCallMode(callType);
        setCallStatus("connecting");

        try {
            if (!navigator?.mediaDevices?.getUserMedia) {
                throw new Error("Media devices are not available in this browser");
            }

            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                },
                video: callType === "VIDEO",
            });

            setLocalCallStream(stream);
            localCallStreamRef.current = stream;
            setShowCall(true);

            const socket = chatSocketRef.current;
            if (socket?.connected) {
                socket.emit("call:join", { threadId: activeConversation.id, mediaType: callType }, (ack) => {
                    if (ack?.ok) {
                        setCallStatus("ringing");
                        return;
                    }
                    setCallStatus("failed");
                });
            } else {
                setCallStatus("waiting");
            }
        } catch (error) {
            setShowCall(false);
            setCallStatus("failed");
            alert(error?.message || "Unable to start the call");
        }
    }, [activeConversation?.id]);

    const acceptIncomingCall = useCallback(async () => {
        if (!CALLS_ENABLED) {
            alert("Calls are disabled. Chat-only mode is active.");
            return;
        }
        if (!activeConversation?.id) {
            return;
        }

        const callType = activeConversation?.activeCall?.mediaType || callMode || "AUDIO";
        setCallMode(callType);
        setCallStatus("connecting");

        try {
            if (!navigator?.mediaDevices?.getUserMedia) {
                throw new Error("Media devices are not available in this browser");
            }

            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                },
                video: callType === "VIDEO",
            });

            setLocalCallStream(stream);
            localCallStreamRef.current = stream;
            setShowCall(true);

            const socket = chatSocketRef.current;
            if (socket?.connected) {
                socket.emit("call:answer", { threadId: activeConversation.id, answer: { accepted: true } }, (ack) => {
                    setCallStatus(ack?.ok ? "in-call" : "failed");
                });
            } else {
                setCallStatus("waiting");
            }
        } catch (error) {
            setShowCall(false);
            setCallStatus("failed");
            alert(error?.message || "Unable to accept the call");
        }
    }, [activeConversation, callMode]);

    const endCall = useCallback(() => {
        const socket = chatSocketRef.current;
        if (socket?.connected && activeConversation?.id) {
            socket.emit("call:end", { threadId: activeConversation.id });
        }

        if (peerConnectionRef.current) {
            peerConnectionRef.current.close();
            peerConnectionRef.current = null;
        }

        if (localCallStream) {
            localCallStream.getTracks().forEach((track) => track.stop());
        }

        pendingIceCandidatesRef.current = [];
        setLocalCallStream(null);
        setShowCall(false);
        setCallStatus("idle");
        setIsCallConnected(false);
    }, [activeConversation?.id, localCallStream]);

    useEffect(() => {
        if (showEditJob && selectedJob) {
            setEditJobTab("basic");
            setEditError("");
            (async () => {
                try {
                    const res = await authService.getEmployerJob(selectedJob.id);
                    const job = res?.data || {};
                    setEditFormData({
                        title: job.title || selectedJob.title || "",
                        department: job.department || selectedJob.department || "",
                        location: job.location || selectedJob.location || "",
                        description: job.description || "",
                        jobType: job.jobType || selectedJob.type || "Full-time",
                        isActive: job.isActive !== false,
                        salaryMin: job.salaryMin || 0,
                        salaryMax: job.salaryMax || 0,
                        screeningQuestions: Array.isArray(job.screeningQuestions) ? job.screeningQuestions.map(sq => ({ ...sq, _id: sq._id || sq.id })) : [],
                    });
                } catch {
                    setEditFormData({
                        title: selectedJob.title || "",
                        department: selectedJob.department || selectedJob.dept || "",
                        location: selectedJob.location || selectedJob.loc || "",
                        description: "",
                        jobType: selectedJob.type || "Full-time",
                        isActive: selectedJob.isActive !== false,
                        salaryMin: 0,
                        salaryMax: 0,
                        screeningQuestions: [],
                    });
                }
            })();
        }
    }, [showEditJob, selectedJob?.id]);

    useEffect(() => {
        setJobPage(0);
    }, [jobFilter]);

    const normalizedJobs = Array.isArray(dashboard?.jobs) ? dashboard.jobs : (dashboard?.jobs?.data || []);
    const normalizedApplications = Array.isArray(dashboard?.applications) ? dashboard.applications : (dashboard?.applications?.data || []);
    const jobs = normalizedJobs;
    const filteredJobs = jobs.filter(
        (j) =>
            jobFilter === "all" ||
            (jobFilter === "urgent" && j.requiresPackageOverride) ||
            (j.department || "").toLowerCase() === jobFilter,
    );
    const jobPageSize = 5;
    const totalJobPages = Math.ceil(filteredJobs.length / jobPageSize);
    const paginatedJobs = filteredJobs.slice(jobPage * jobPageSize, (jobPage + 1) * jobPageSize);

    const handleEditFormChange = (field, value) => {
        setEditFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleEditQuestionChange = (qId, field, value) => {
        setEditFormData(prev => ({
            ...prev,
            screeningQuestions: prev.screeningQuestions.map(q => {
                const id = q._id || q.id;
                return id === qId ? { ...q, [field]: value } : q;
            }),
        }));
    };

    const handleAddEditQuestion = () => {
        const newQ = { id: `new_${Date.now()}`, question: "", type: "TEXT", required: true, options: [], maxLength: 500, order: editFormData.screeningQuestions.length };
        setEditFormData(prev => ({ ...prev, screeningQuestions: [...prev.screeningQuestions, newQ] }));
    };

    const handleRemoveEditQuestion = (qId) => {
        setEditFormData(prev => ({
            ...prev,
            screeningQuestions: prev.screeningQuestions.filter(q => {
                const id = q._id || q.id;
                return id !== qId;
            }),
        }));
    };

    const handleEditSave = async () => {
        if (!editFormData.title.trim()) { setEditError("Job title is required"); return; }
        setEditSaving(true);
        setEditError("");
        try {
            await authService.employerUpdateJob(selectedJob.id, {
                title: editFormData.title,
                department: editFormData.department,
                location: editFormData.location,
                description: editFormData.description,
                jobType: editFormData.jobType,
                isActive: editFormData.isActive,
                salaryMin: Number(editFormData.salaryMin) || 0,
                salaryMax: Number(editFormData.salaryMax) || 0,
                screeningQuestions: editFormData.screeningQuestions.map((q, idx) => ({
                    _id: q._id && q._id.length === 24 && !q._id.startsWith("new_") ? q._id : undefined,
                    question: q.question,
                    type: q.type || "TEXT",
                    required: q.required !== false,
                    options: Array.isArray(q.options) ? q.options : [],
                    maxLength: Number(q.maxLength) || 500,
                    order: idx,
                })),
            });
            setShowEditJob(false);
            const refetch = await authService.getEmployerDashboard();
            if (refetch?.data) setDashboard(refetch.data);
        } catch (err) {
            setEditError(err?.message || "Failed to update job");
        } finally {
            setEditSaving(false);
        }
    };

    const handleResumeUpload = async (applicationId, file) => {
        if (!file || file.type !== "application/pdf") {
            alert("Please select a PDF file");
            return;
        }
        setUploadingResumeAppId(applicationId);
        try {
            await authService.employerUploadApplicationResume(applicationId, file);
            const refetch = await authService.getEmployerDashboard();
            if (refetch?.data) setDashboard(refetch.data);
        } catch (err) {
            alert(err?.message || "Failed to upload resume");
        } finally {
            setUploadingResumeAppId(null);
        }
    };

    const handlePreviewResume = async (appId) => {
        try {
            const response = await api.get(`/company-panel/applications/${appId}/resume/preview`, { responseType: "blob" });
            const blob = new Blob([response.data], { type: "application/pdf" });
            const url = URL.createObjectURL(blob);
            window.open(url, "_blank");
            setTimeout(() => URL.revokeObjectURL(url), 60000);
        } catch {
            alert("Unable to preview resume");
        }
    };

    const NAV_TABS = ["Overview", "Jobs", "Candidates", "Comments", "Progress"];
    const company = {
        id: dashboard?.company?.id || employerSession.current?.companyId || "",
        name: dashboard?.company?.name || employerSession.current?.companyName || "",
        tagline: dashboard?.company?.tagline || "",
        location: dashboard?.company?.location?.city
            ? [dashboard.company.location.city, dashboard.company.location.region, dashboard.company.location.zone]
                .filter(Boolean)
                .join(", ")
            : "",
        website: dashboard?.company?.website || "",
        about: dashboard?.company?.about || "",
        type: dashboard?.company?.type || "",
        followers: dashboard?.company?.followers || "",
        connections: dashboard?.company?.connections || "",
        plan: dashboard?.company?.packageType || "",
        jobLimit: dashboard?.company?.jobLimit || 0,
        activeJobCount: dashboard?.company?.activeJobCount || 0,
        logoUrl: dashboard?.company?.logoUrl || "",
        coverImageUrl: dashboard?.company?.coverImageUrl || "",
        industry: dashboard?.company?.industry || "",
        size: dashboard?.company?.companySize || "",
        founded: dashboard?.company?.foundedYear || "",
        specialties: dashboard?.company?.specialties || [],
        perks: dashboard?.company?.perks || [],
    };
    const companyReviews = dashboard?.reviews || [];
    const reviewPageSize = 5;
    const totalReviewPages = Math.max(1, Math.ceil(companyReviews.length / reviewPageSize));

    const handleReviewShare = async (review) => {
        const reviewId = review?.id || review?.reviewId || review?._id || `review-${Date.now()}`;
        const shareToken = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        const shareUrl = `${window.location.origin}/review/${reviewId}?share=${shareToken}`;

        const reviewSnapshot = {
            ...review,
            reviewId,
            companyName: dashboard?.company?.name || "MavenJobs Company",
            sharedAt: new Date().toISOString(),
            helpfulCount: Math.max(1, Number(review?.helpfulCount || review?.likes || Math.round((review?.rating || 0) * 17 + 5))),
        };

        try {
            localStorage.setItem(`maven-review-share:${reviewId}:${shareToken}`, JSON.stringify(reviewSnapshot));
            localStorage.setItem(`maven-review-share:${reviewId}`, JSON.stringify(reviewSnapshot));

            if (navigator.share) {
                await navigator.share({
                    title: "Candidate Review",
                    text: `Read this verified review from ${reviewSnapshot.candidateName || "a candidate"} for ${reviewSnapshot.companyName}.`,
                    url: shareUrl,
                });
                setShareMessage("Unique review link shared successfully.");
            } else if (navigator.clipboard?.writeText) {
                await navigator.clipboard.writeText(shareUrl);
                setShareMessage("Unique review link copied to clipboard.");
            } else {
                window.prompt("Copy this unique review link", shareUrl);
                setShareMessage("Review link ready to copy.");
            }
        } catch (error) {
            console.error("Share failed:", error);
            setShareMessage("Unable to share this review right now.");
        }
        window.setTimeout(() => setShareMessage(""), 2400);
    };

    const tracking = dashboard?.tracking || {};
    const activeJobs = Number(tracking.activeApprovedJobs ?? dashboard?.company?.activeJobCount ?? 0);
    const overviewCards = [
        { label: "Active Jobs", val: Number(tracking.activeApprovedJobs ?? dashboard?.company?.activeJobCount ?? 0), icon: FiBriefcase, color: C.navy },
        { label: "Applications", val: Number(tracking.totalApplications ?? normalizedApplications.length ?? 0), icon: FiUsers, color: C.green },
        { label: "Shortlisted", val: Number(normalizedApplications.filter((application) => application.status === "SHORTLISTED").length || 0), icon: FiTarget, color: C.indigo },
        { label: "Offers Sent", val: Number(normalizedApplications.filter((application) => application.status === "OFFERED").length || 0), icon: FiAward, color: C.amber },
    ];
    const uniqueCandidateApplications = useMemo(() => {
        const seen = new Set();
        return normalizedApplications.filter((application) => {
            const candidateKey = String(application.candidateId || application.candidateEmail || application.candidateName || application.id || "");
            if (!candidateKey || seen.has(candidateKey)) return false;
            seen.add(candidateKey);
            return true;
        });
    }, [normalizedApplications]);

    const candidateMatchScore = (status = "") => {
        const normalized = String(status || "").toUpperCase();
        if (normalized === "OFFERED") return 98;
        if (normalized === "SHORTLISTED") return 94;
        if (normalized === "INTERVIEW") return 90;
        if (normalized === "SCREENING") return 86;
        return 80;
    };

    const topMatches = useMemo(
        () => {
            const mapped = uniqueCandidateApplications.map((application, index) => ({
                id: String(application.candidateId || application.id || index),
                name: application.candidateName || "Candidate",
                role: application.candidateCurrentTitle || application.jobTitle || "Candidate",
                match: candidateMatchScore(application.status),
                avatar: getInitialsFromName(application.candidateName),
                color: CONVERSATION_COLORS[index % CONVERSATION_COLORS.length],
            }));

            const fallbackRoles = [
                "Fullstack MERN Developer",
                "Frontend React Developer",
                "Backend Node.js Developer",
                "UI Engineer",
                "Product Designer",
            ];

            while (mapped.length < 5) {
                const index = mapped.length;
                const label = `Candidate ${index + 1}`;
                mapped.push({
                    id: `recommended-${index}`,
                    name: label,
                    role: fallbackRoles[index % fallbackRoles.length],
                    match: Math.max(72, 88 - index * 3),
                    avatar: getInitialsFromName(label),
                    color: CONVERSATION_COLORS[index % CONVERSATION_COLORS.length],
                    isPlaceholder: true,
                });
            }

            return mapped.slice(0, 5);
        },
        [uniqueCandidateApplications],
    );

    const CANDIDATE_PAGE_SIZE = 12;
    const candidatesTotal = uniqueCandidateApplications.length;
    const candidatesTotalPages = Math.max(1, Math.ceil(candidatesTotal / CANDIDATE_PAGE_SIZE));
    const safeCandidatePage = Math.min(candidatePage, candidatesTotalPages);
    useEffect(() => {
        if (prevCandidatesRef.current !== 0 && candidatesTotal !== prevCandidatesRef.current) setCandidatePage(1);
        prevCandidatesRef.current = candidatesTotal;
    }, [candidatesTotal]);
    const paginatedCandidateApps = uniqueCandidateApplications.slice((safeCandidatePage - 1) * CANDIDATE_PAGE_SIZE, safeCandidatePage * CANDIDATE_PAGE_SIZE);
    const people = paginatedCandidateApps.map((application, index) => ({
        id: String(application.candidateId || application.id || index),
        name: application.candidateName || "Candidate",
        role: application.candidateCurrentTitle || application.jobTitle || "Candidate",
        location: application.candidateCity || "",
        logoUrl: application.candidateLogoUrl || "",
        avatar: getInitialsFromName(application.candidateName),
        color: CONVERSATION_COLORS[index % CONVERSATION_COLORS.length],
        app: application,
    }));
    const candidatePageNumbers = useMemo(() => {
        const tp = candidatesTotalPages;
        if (tp <= 7) return Array.from({ length: tp }, (_, i) => i + 1);
        const p = []; p.push(1);
        if (safeCandidatePage > 3) p.push("...");
        for (let i = Math.max(2, safeCandidatePage - 1); i <= Math.min(tp - 1, safeCandidatePage + 1); i++) p.push(i);
        if (safeCandidatePage < tp - 2) p.push("...");
        p.push(tp);
        return p;
    }, [candidatesTotalPages, safeCandidatePage]);

    const analytics = useMemo(() => {
        const jobs = normalizedJobs;
        const applications = normalizedApplications;
        const jobSeries = buildMonthlySeries(jobs, (job) => job.createdAt || job.updatedAt);
        const applicationSeries = buildMonthlySeries(applications, (application) => application.appliedAt || application.updatedAt);
        const statusCounts = buildStatusCounts(applications);
        const sourceBreakdown = buildSourceBreakdown(applications);
        const totalApplications = Number(tracking.totalApplications ?? applications.length ?? 0);
        const activeJobs = Number(tracking.activeApprovedJobs ?? dashboard?.company?.activeJobCount ?? 0);
        const shortlisted = applications.filter((application) => application.status === "SHORTLISTED").length;
        const offersSent = applications.filter((application) => application.status === "OFFERED").length;

        return {
            monthLabels: applicationSeries.labels,
            monthlyJobs: jobSeries.values,
            monthlyApplications: applicationSeries.values,
            sourceBreakdown,
            funnelData: [
                { stage: "Applied", val: statusCounts.counts[0] || 0, color: C.navy },
                { stage: "Screening", val: statusCounts.counts[1] || 0, color: C.sky },
                { stage: "Shortlisted", val: statusCounts.counts[2] || 0, color: C.amber },
                { stage: "Interview", val: statusCounts.counts[3] || 0, color: C.indigo },
                { stage: "Offered", val: statusCounts.counts[4] || 0, color: C.green },
                { stage: "Hired", val: statusCounts.counts[5] || 0, color: C.greenD },
            ],
            kpis: [
                { label: "Active Jobs", val: activeJobs, change: `${activeJobs} live`, up: true, color: C.navy },
                { label: "Applications", val: totalApplications, change: `${totalApplications} total`, up: true, color: C.green },
                { label: "Shortlisted", val: shortlisted, change: `${shortlisted} shortlisted`, up: shortlisted > 0, color: C.amber },
                { label: "Offers Sent", val: offersSent, change: `${offersSent} offers`, up: offersSent > 0, color: C.indigo },
            ],
        };
    }, [dashboard, tracking]);

    const handleGoHome = useCallback(() => {
        window.scrollTo({ top: 0, behavior: "smooth" });
    }, []);

    const handleCompanyShare = useCallback(async () => {
        const shareUrl = company.id
            ? `${window.location.origin}/company/${company.id}`
            : window.location.href;
        try {
            if (navigator.share) {
                await navigator.share({ title: company.name, text: `Check out ${company.name} on MavenJobs`, url: shareUrl });
            } else {
                await navigator.clipboard.writeText(shareUrl);
                setShareMessage("Company link copied!");
                setTimeout(() => setShareMessage(""), 2400);
            }
        } catch {
            try {
                await navigator.clipboard.writeText(shareUrl);
                setShareMessage("Company link copied!");
                setTimeout(() => setShareMessage(""), 2400);
            } catch {
                window.prompt("Copy this link to share your company profile", shareUrl);
            }
        }
        setShowHeaderMenu(false);
    }, [company.id, company.name]);

    const handleLogout = useCallback(() => {
        localStorage.removeItem("employerToken");
        localStorage.removeItem("candidateToken");
        localStorage.removeItem("token");
        localStorage.removeItem("employerUser");
        navigate("/employer-login");
    }, [navigate]);

    const handleDeleteAccount = useCallback(async () => {
        if (deletePassStep === 0) {
            setDeletePassStep(1);
            setDeletePassword("");
            setDeletePassword2("");
            setDeleteError("");
            return;
        }
        if (deletePassStep === 1) {
            if (!deletePassword) {
                setDeleteError("Please enter your password");
                return;
            }
            setDeletePassStep(2);
            setDeletePassword2("");
            setDeleteError("");
            return;
        }
        if (deletePassStep === 2) {
            if (!deletePassword2) {
                setDeleteError("Please re-enter your password");
                return;
            }
            if (deletePassword !== deletePassword2) {
                setDeleteError("Passwords do not match. Enter the same password twice.");
                setDeletePassStep(1);
                setDeletePassword("");
                setDeletePassword2("");
                return;
            }
            setDeleteError("");
            setDeleting(true);
            try {
                await authService.employerDeleteAccount({ password: deletePassword });
                localStorage.removeItem("employerToken");
                localStorage.removeItem("candidateToken");
                localStorage.removeItem("token");
                localStorage.removeItem("employerUser");
                navigate("/employer-login");
            } catch (err) {
                setDeleteError(err?.message || "Incorrect password. Try again.");
                setDeletePassStep(1);
                setDeletePassword("");
                setDeletePassword2("");
            } finally {
                setDeleting(false);
            }
        }
    }, [deletePassStep, deletePassword, deletePassword2, navigate]);

    useEffect(() => {
        const close = (e) => { if (headerMenuRef.current && !headerMenuRef.current.contains(e.target)) setShowHeaderMenu(false); };
        if (showHeaderMenu) document.addEventListener("mousedown", close);
        return () => document.removeEventListener("mousedown", close);
    }, [showHeaderMenu]);

    const handleMediaUpload = useCallback(async (kind, file) => {
        if (!file) {
            return;
        }

        setMediaLoading((current) => ({ ...current, [kind]: true }));
        try {
            const response = await authService.uploadEmployerMedia(kind, file);
            const nextCompany = response?.data?.company || {};
            setDashboard((current) => ({
                ...(current || {}),
                company: {
                    ...(current?.company || {}),
                    ...nextCompany,
                },
            }));

            const savedSession = (() => {
                try {
                    return JSON.parse(localStorage.getItem("employerUser") || "null");
                } catch {
                    return null;
                }
            })();

            localStorage.setItem("employerUser", JSON.stringify({
                ...(savedSession || {}),
                companyName: nextCompany.name || savedSession?.companyName || "",
                companyId: nextCompany.id || savedSession?.companyId || "",
                logoUrl: nextCompany.logoUrl || savedSession?.logoUrl || "",
                coverImageUrl: nextCompany.coverImageUrl || savedSession?.coverImageUrl || "",
            }));
        } catch (error) {
            console.error(error);
        } finally {
            setMediaLoading((current) => ({ ...current, [kind]: false }));
        }
    }, []);

    /* ── Image Crop Helpers ─────────────────────────────── */
    const createImageEl = (url) => new Promise((res, rej) => {
        const img = new Image(); img.onload = () => res(img); img.onerror = rej; img.src = url;
    });
    const getCroppedBlob = async (imageSrc, pixelCrop) => {
        const image = await createImageEl(imageSrc);
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        canvas.width = pixelCrop.width;
        canvas.height = pixelCrop.height;
        ctx.drawImage(image, pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height, 0, 0, pixelCrop.width, pixelCrop.height);
        return new Promise((res) => canvas.toBlob((b) => res(b), "image/jpeg", 0.92));
    };
    const handleCropComplete = useCallback((_, pixelCrop) => {
        setCroppedPixels(pixelCrop);
    }, []);
    const handleCropSave = useCallback(async () => {
        if (!croppedPixels || !cropImageUrl || !cropFile) return;
        setCropSaving(true);
        try {
            const blob = await getCroppedBlob(cropImageUrl, croppedPixels);
            const croppedFile = new File([blob], cropFile.name.replace(/\.[^.]+$/, ".jpg"), { type: "image/jpeg" });
            await handleMediaUpload(cropModal.kind, croppedFile);
            setCropModal({ open: false, kind: "logo" });
            setCropFile(null);
            setCropImageUrl("");
            URL.revokeObjectURL(cropImageUrl);
        } catch (err) {
            console.error(err);
        } finally {
            setCropSaving(false);
        }
    }, [croppedPixels, cropImageUrl, cropFile, cropModal.kind, handleMediaUpload]);
    const handleFileForCrop = useCallback((kind, file) => {
        if (!file) return;
        const url = URL.createObjectURL(file);
        setCropFile(file);
        setCropImageUrl(url);
        setCrop({ x: 0, y: 0 });
        setZoom(1);
        setCroppedPixels(null);
        setCropModal({ open: true, kind });
    }, []);

    const handleSaveAbout = useCallback(async () => {
        setSavingAbout(true);
        try {
            const response = await authService.updateEmployerProfile({
                about: aboutDraft.about,
                website: aboutDraft.website,
                companySize: aboutDraft.companySize,
                industry: aboutDraft.industry,
                foundedYear: aboutDraft.founded,
                tagline: aboutDraft.tagline,
                type: aboutDraft.type,
                linkedIn: aboutDraft.linkedIn,
                specialties: aboutDraft.specialties,
                perks: aboutDraft.perks,
                city: aboutDraft.locationCity,
                region: aboutDraft.locationRegion,
                zone: aboutDraft.locationZone,
            });
            const nextCompany = response?.data?.company || {};
            setDashboard((current) => ({
                ...(current || {}),
                company: {
                    ...(current?.company || {}),
                    ...nextCompany,
                },
            }));
            setShowAboutEditor(false);
        } catch (error) {
            console.error(error);
        } finally {
            setSavingAbout(false);
        }
    }, [aboutDraft]);

    /* ═══ RENDER ═══ */
    return (
        <>
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,700;12..96,800&family=DM+Sans:wght@400;500;600;700&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        html{scroll-behavior:smooth}
        body{background:#f0f4fb;font-family:'DM Sans',system-ui,sans-serif;color:${C.s800}}
        .pd-notif-overlay { position: fixed; inset: 0; background: rgba(0, 35, 102, 0.35); backdrop-filter: blur(4px); z-index: 10000; opacity: 0; visibility: hidden; transition: all 0.3s; }
        .pd-notif-overlay.show { opacity: 1; visibility: visible; }
        .pd-notif-sidebar { position: fixed; top: 0; right: -400px; width: 400px; height: 100vh; background: white; z-index: 10001; box-shadow: -12px 0 40px rgba(0, 35, 102, 0.1); display: flex; flex-direction: column; transition: right 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
        .pd-notif-sidebar.show { right: 0; }
        .pd-notif-head { padding: 22px 24px; border-bottom: 1px solid ${C.s200}; display: flex; align-items: center; justify-content: space-between; }
        .pd-notif-head h3 { font-family: ${C.fd}; font-size: 18px; font-weight: 800; color: ${C.navy}; margin:0;}
        .pd-notif-close { background: ${C.s100}; border: none; width: 34px; height: 34px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: ${C.s500}; cursor: pointer; transition: all 0.2s; }
        .pd-notif-close:hover { background: #FEE2E2; color: #ef4444; transform: rotate(90deg); }
        .pd-notif-body { flex: 1; overflow-y: auto; padding: 16px 0; }
        .pd-notif-date { padding: 0 24px 10px; font-size: 11.5px; font-weight: 800; color: ${C.s400}; letter-spacing: 0.08em; text-transform: uppercase; }
        .pd-notif-item { display: flex; gap: 14px; padding: 16px 24px; border-bottom: 1px solid ${C.s100}; cursor: pointer; transition: background 0.15s; }
        .pd-notif-item:hover { background: ${C.s50}; }
        .pd-notif-icon { width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 17px; flex-shrink: 0; }
        .pd-notif-content { flex: 1; display: flex; flex-direction: column; gap: 4px; }
        .pd-notif-title { font-size: 14px; font-weight: 600; line-height: 1.4; color: ${C.s800}; }
        .pd-notif-desc { font-size: 12.5px; color: ${C.s500}; }
        .pd-notif-cta { align-self: flex-start; margin-top: 6px; background: white; color: ${C.indigo}; border: 1.5px solid ${C.indigo}; padding: 5px 14px; border-radius: 99px; font-size: 12px; font-weight: 700; cursor: pointer; transition: all 0.2s; font-family: ${C.fd}; }
        .pd-notif-cta:hover { background: ${C.indigo}; color: white; }
        .pd-notif-time { font-size: 11.5px; color: ${C.s400}; margin-top: 2px; }
        ::-webkit-scrollbar{width:5px;height:5px}
        ::-webkit-scrollbar-track{background:transparent}
        ::-webkit-scrollbar-thumb{background:${C.s200};border-radius:8px}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        @keyframes slideUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}
        @keyframes ping{75%,100%{transform:scale(2.2);opacity:0}}
        @keyframes popIn{from{opacity:0;transform:scale(0.9) translateY(5px)}to{opacity:1;transform:scale(1) translateY(0)}}
        @keyframes rmSpinEdit{to{transform:rotate(360deg)}}
        input,textarea{outline:none;font-family:'DM Sans',sans-serif}
        button{outline:none;font-family:'DM Sans',sans-serif}
        .ep-nav-link{
          padding:18px 14px;font-size:13px;font-weight:600;color:${C.s500};
          cursor:pointer;border:none;background:none;border-bottom:2.5px solid transparent;
          transition:all .16s;white-space:nowrap;font-family:'DM Sans',sans-serif;
          display:inline-flex;align-items:center;gap:6px;
        }
        .ep-nav-link:hover{color:${C.navy}}
        .ep-nav-link.active{color:${C.navy};border-bottom-color:${C.navy};font-weight:700}
        .ep-job-row{
          padding:16px 20px;border-bottom:1px solid ${C.s100};
          transition:background .14s;cursor:pointer;
        }
        .ep-job-row:last-child{border-bottom:none}
        .ep-job-row:hover{background:${C.s50}}
        .ep-msg-row{
          display:flex;gap:12px;padding:14px 18px;cursor:pointer;
          border-bottom:1px solid ${C.s50};transition:background .14s;
        }
        .ep-msg-row:hover{background:${C.s50}}
        .ep-msg-row.active{background:#EEF2FF}
        .ep-update{padding:18px 20px;border-bottom:1px solid ${C.s100}}
        .ep-update:last-child{border-bottom:none}
        .ep-tag-hover:hover{border-color:${C.navy}!important;color:${C.navy}!important;background:rgba(0,35,102,.04)!important;cursor:pointer}
        .notif-pulse{position:absolute;top:7px;right:7px;width:8px;height:8px;
          border-radius:50%;background:#ef4444;border:2px solid #fff}
        .notif-pulse::after{content:'';position:absolute;inset:-2px;border-radius:50%;
          background:#ef4444;animation:ping 1.8s ease-in-out infinite}
        .ep-progress-scroll{scrollbar-width:thin;scrollbar-color:${C.s300} transparent}
        .ep-progress-scroll::-webkit-scrollbar{height:6px}
        .ep-progress-scroll::-webkit-scrollbar-track{background:transparent}
        .ep-progress-scroll::-webkit-scrollbar-thumb{background:${C.s300};border-radius:999px}
        .ep-progress-scroll::-webkit-scrollbar-thumb:hover{background:${C.s400}}
        .ep-ana-tab{
          padding:8px 16px;border-radius:9px;font-size:12.5px;font-weight:700;
          cursor:pointer;border:1.5px solid ${C.s200};background:#fff;color:${C.s500};
          font-family:'Bricolage Grotesque',sans-serif;transition:all .16s;
        }
        .ep-ana-tab.active{background:${C.navy};color:#fff;border-color:${C.navy}}
      `}</style>

            {dashboardLoading ? (
                <SkeletonPage variant="dashboard" />
            ) : (
                <div style={{ minHeight: "100vh", background: "#f0f4fb" }}>

                    {/* ══ TOP NAVIGATION BAR (sticky) ════════════════════ */}
                    {/* EmployerHeader already has position:sticky built in */}
                    <EmployerHeader
                        company={company}
                        activeTab={topNavTab}
                        onNavigate={(tabId) => {
                            if (tabId === "home") { setTopNavTab("home"); handleGoHome(); return; }
                            setTopNavTab(tabId);
                            if (tabId === "jobs") { navigate("/post-job"); return; }
                            if (tabId === "analysis") { navigate("/employer-dashboard/analytics"); return; }
                        }}
                        onMessagesClick={handleRequestChat}
                        onNotificationsClick={() => setShowNotifications(true)}
                        onLogout={handleLogout}
                        requireAuth
                    />
                    {/* ══ PAGE BODY ════════════════════════════════════════ */}
                    <main style={{ maxWidth: 1160, margin: "0 auto", padding: "24px 20px 60px" }}>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 20, alignItems: "start" }}>

                            {/* ── LEFT COLUMN ────────────────────────────────── */}
                            <div style={{ display: "flex", flexDirection: "column", gap: 16, minWidth: 0 }}>

                                {/* ─ Profile Header Card ─ */}
                                <Card className="ep-card ep-cover">
                                    {/* Cover */}
                                    <div style={{
                                        height: 200,
                                        background: company.coverImageUrl
                                            ? `url("${company.coverImageUrl}") center/cover no-repeat`
                                            : "linear-gradient(135deg, #0f172a 0%, #1e293b 55%, #020617 100%)",
                                        position: "relative", overflow: "hidden"
                                    }}>
                                        <div style={{
                                            position: "absolute", inset: 0, opacity: .4,
                                            background: "linear-gradient(to top, rgba(0,35,102,0.8), transparent)"
                                        }} />
                                        {/* Edit cover */}
                                        <button style={{
                                            position: "absolute", top: 12, right: 12, width: 32, height: 32,
                                            borderRadius: 8, background: "rgba(255,255,255,.15)", border: "1px solid rgba(255,255,255,.25)",
                                            display: "flex", alignItems: "center", justifyContent: "center",
                                            cursor: "pointer", color: "#fff", backdropFilter: "blur(8px)"
                                        }} onClick={() => coverInputRef.current?.click()} disabled={mediaLoading.cover}>
                                            <FiEdit2 size={13} />
                                        </button>
                                        <input
                                            ref={coverInputRef}
                                            type="file"
                                            accept="image/png,image/jpeg,image/jpg,image/webp"
                                            hidden
                                            onChange={(event) => {
                                                const file = event.target.files?.[0];
                                                if (file) handleFileForCrop("cover", file);
                                                event.target.value = "";
                                            }}
                                        />
                                    </div>

                                    {/* Profile info */}
                                    <div style={{ padding: "0 24px 20px", position: "relative" }}>
                                        {/* Logo bubble */}
                                        <div style={{
                                            width: 88, height: 88, borderRadius: 18,
                                            background: company.logoUrl
                                                ? `url("${company.logoUrl}") center/cover no-repeat`
                                                : "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)",
                                            border: "4px solid #fff", display: "flex", alignItems: "center",
                                            justifyContent: "center", marginTop: -44, marginBottom: 12,
                                            boxShadow: "0 4px 16px rgba(0,35,102,.2)"
                                        }}>
                                            {!company.logoUrl && (
                                                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, color: C.s400 }}>
                                                    <FiUser size={18} />
                                                    <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: ".08em", textTransform: "uppercase" }}>Empty profile</span>
                                                </div>
                                            )}
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => logoInputRef.current?.click()}
                                            disabled={mediaLoading.logo}
                                            style={{
                                                position: "absolute",
                                                top: -28,
                                                left: 94,
                                                border: `1px solid ${C.s200}`,
                                                borderRadius: 999,
                                                background: "#fff",
                                                color: C.s600,
                                                fontSize: 11,
                                                fontWeight: 700,
                                                padding: "6px 10px",
                                                cursor: "pointer",
                                                boxShadow: "0 6px 16px rgba(15,23,42,.08)"
                                            }}
                                        >
                                            {mediaLoading.logo ? "Uploading..." : "Change logo"}
                                        </button>
                                        <input
                                            ref={logoInputRef}
                                            type="file"
                                            accept="image/png,image/jpeg,image/jpg,image/webp"
                                            hidden
                                            onChange={(event) => {
                                                const file = event.target.files?.[0];
                                                if (file) handleFileForCrop("logo", file);
                                                event.target.value = "";
                                            }}
                                        />

                                        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                                            <div>
                                                <h1 style={{
                                                    fontFamily: C.fd, fontSize: 22, fontWeight: 800,
                                                    color: C.s900, letterSpacing: "-0.01em", margin: "0 0 4px"
                                                }}>
                                                    {company.name}
                                                </h1>
                                                <p style={{ fontSize: 14, color: C.s600, fontWeight: 500, margin: "0 0 8px" }}>{company.tagline}</p>
                                                <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
                                                    <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12.5, color: C.s500 }}>
                                                        <FiMapPin size={12} />{company.location}
                                                    </span>
                                                    <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12.5, color: C.sky }}>
                                                        <FiGlobe size={12} />{company.website}
                                                    </span>
                                                    <span style={{ fontSize: 12.5, color: C.s500, fontWeight: 600 }}>
                                                        {company.followers} followers · {company.connections}
                                                    </span>
                                                </div>
                                            </div>

                                            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                                                <Btn variant="primary" onClick={() => navigate("/post-job")}><FiPlus size={13} /> Post a Job</Btn>
                                                <Btn variant="ghost" onClick={handleCompanyShare}><FiShare2 size={13} /> Share</Btn>
                                                <div ref={headerMenuRef} style={{ position: "relative" }}>
                                                    <Btn variant="ghost" style={{ padding: "8px 10px" }} onClick={() => setShowHeaderMenu(p => !p)}><FiMoreVertical size={14} /></Btn>
                                                    {showHeaderMenu && (
                                                        <div style={{
                                                            position: "absolute", right: 0, top: "calc(100% + 4px)",
                                                            minWidth: 200, background: "#fff", borderRadius: 12,
                                                            border: "1px solid #e2e8f0", boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
                                                            zIndex: 100, overflow: "hidden",
                                                        }}>
                                                            <button onClick={() => { handleLogout(); setShowHeaderMenu(false); }} style={{
                                                                width: "100%", display: "flex", alignItems: "center", gap: 10,
                                                                padding: "12px 16px", border: "none", background: "none",
                                                                fontSize: 13, fontWeight: 600, color: "#475569", cursor: "pointer",
                                                                transition: "background 0.15s",
                                                            }}
                                                                onMouseEnter={e => e.currentTarget.style.background = "#f8fafc"}
                                                                onMouseLeave={e => e.currentTarget.style.background = "none"}
                                                            >
                                                                <FiLogOut size={15} /> Log out
                                                            </button>
                                                            <button onClick={() => { setShowHeaderMenu(false); setShowDeleteConfirm(true); setDeletePassStep(0); }} style={{
                                                                width: "100%", display: "flex", alignItems: "center", gap: 10,
                                                                padding: "12px 16px", border: "none", background: "none",
                                                                fontSize: 13, fontWeight: 600, color: "#dc2626", cursor: "pointer",
                                                                transition: "background 0.15s",
                                                            }}
                                                                onMouseEnter={e => e.currentTarget.style.background = "#fef2f2"}
                                                                onMouseLeave={e => e.currentTarget.style.background = "none"}
                                                            >
                                                                <FiTrash2 size={15} /> Delete account
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Quick chips */}
                                        <div style={{ display: "flex", gap: 8, marginTop: 14, flexWrap: "wrap" }}>
                                            {[
                                                { icon: FiBriefcase, label: `${company.industry}`, color: C.navy },
                                                { icon: FiUsers, label: company.size, color: C.indigo },
                                                { icon: FiCalendar, label: `Founded ${company.founded}`, color: C.green },
                                                { icon: FiAward, label: company.plan, color: C.amber },
                                            ].map((chip, i) => (
                                                <div key={i} style={{
                                                    display: "flex", alignItems: "center", gap: 6,
                                                    padding: "5px 12px", borderRadius: 100, background: chip.color + "10",
                                                    border: `1px solid ${chip.color}22`, fontSize: 12, fontWeight: 700, color: chip.color
                                                }}>
                                                    <chip.icon size={11} />{chip.label}
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Inner nav tabs */}
                                    <div style={{
                                        borderTop: `1px solid ${C.s100}`, display: "flex",
                                        paddingLeft: 16, overflowX: "auto"
                                    }}>
                                        {NAV_TABS.map(t => (
                                            <button key={t} className={`ep-nav-link${activeTab === t ? " active" : ""}`}
                                                onClick={() => setActiveTab(t)}
                                                style={{ textTransform: "none" }}>
                                                {t}
                                            </button>
                                        ))}
                                    </div>
                                </Card>

                                {/* ─ About ─ */}
                                {activeTab === "Overview" && (
                                    <Card className="ep-card" style={{ padding: "20px" }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                                            <div style={{ fontFamily: C.fd, fontSize: 16, fontWeight: 800, color: C.s900 }}>About</div>
                                            <button
                                                onClick={() => setShowAboutEditor(true)}
                                                style={{ background: "none", border: "none", cursor: "pointer", color: C.s400, padding: 4, borderRadius: 7, display: "flex" }}
                                            >
                                                <FiEdit2 size={15} />
                                            </button>
                                        </div>
                                        <div style={{ fontSize: 14, color: C.s700, lineHeight: 1.75, whiteSpace: "pre-line" }}>{company.about}</div>
                                        <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 8 }}>
                                            {[
                                                { icon: FiGlobe, label: "Website", val: company.website, color: C.sky },
                                                { icon: FiUsers, label: "Company size", val: company.size, color: C.indigo },
                                                { icon: FiBriefcase, label: "Industry", val: company.industry, color: C.navy },
                                                { icon: FiLayers, label: "Type", val: company.type, color: C.green },
                                            ].map((r, i) => (
                                                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                                    <div style={{
                                                        width: 30, height: 30, borderRadius: 8, background: r.color + "12",
                                                        display: "flex", alignItems: "center", justifyContent: "center", color: r.color, flexShrink: 0
                                                    }}>
                                                        <r.icon size={13} />
                                                    </div>
                                                    <span style={{ fontSize: 12.5, color: C.s500, fontWeight: 600, width: 100, flexShrink: 0 }}>{r.label}</span>
                                                    <span style={{ fontSize: 13, color: C.s700, fontWeight: 600 }}>{r.val}</span>
                                                </div>
                                            ))}
                                        </div>
                                        {/* Specialties */}
                                        <div style={{ marginTop: 16 }}>
                                            <div style={{
                                                fontSize: 12, fontWeight: 800, color: C.s400, letterSpacing: ".1em",
                                                textTransform: "uppercase", marginBottom: 10
                                            }}>Specialties</div>
                                            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                                                {company.specialties.map((s, i) => (
                                                    <Tag key={i} color={[C.navy, C.green, C.indigo, C.amber, C.sky, C.purple, C.green, C.navy][i % 8]}>{s}</Tag>
                                                ))}
                                            </div>
                                        </div>
                                        {/* Perks */}
                                        <div style={{ marginTop: 16 }}>
                                            <div style={{
                                                fontSize: 12, fontWeight: 800, color: C.s400, letterSpacing: ".1em",
                                                textTransform: "uppercase", marginBottom: 12
                                            }}>Perks</div>
                                            <div style={{
                                                display: "grid",
                                                gridTemplateColumns: "repeat(auto-fill, minmax(86px, 1fr))",
                                                gap: 6
                                            }}>
                                                {(company.perks || []).map((p, i) => {
                                                    const perkIcon = PERK_ICONS.find(pi => pi.label === (p.label || p));
                                                    const IconComp = perkIcon?.icon || FiStar;
                                                    const iconColor = perkIcon?.color || C.navy;
                                                    return (
                                                        <div key={i} style={{
                                                            display: "flex", flexDirection: "column", alignItems: "center",
                                                            justifyContent: "center", gap: 5,
                                                            aspectRatio: "1", borderRadius: 12,
                                                            border: `1.5px solid ${iconColor}30`,
                                                            background: "#fff",
                                                            color: iconColor,
                                                            fontFamily: C.dm, transition: "all 0.12s"
                                                        }}
                                                            onMouseEnter={e => { e.currentTarget.style.borderColor = iconColor; e.currentTarget.style.background = iconColor + "0c"; }}
                                                            onMouseLeave={e => { e.currentTarget.style.borderColor = iconColor + "30"; e.currentTarget.style.background = "#fff"; }}
                                                        >
                                                            <IconComp size={18} />
                                                            <span style={{ fontSize: 9.5, fontWeight: 600, color: "#475569", textAlign: "center", lineHeight: 1.2 }}>
                                                                {p.label || p}
                                                            </span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </Card>
                                )}

                                {activeTab === "Candidates" && (
                                    <Card className="ep-card" style={{ padding: 0, overflow: "visible" }}>
                                        {/* ─ Header ─ */}
                                        <div style={{ padding: "18px 20px", borderBottom: `1px solid ${C.s100}`, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
                                            <div style={{ fontFamily: C.fd, fontSize: 16, fontWeight: 800, color: C.s900, display: "flex", alignItems: "center", gap: 8 }}>
                                                <FiUsers size={16} color={C.navy} /> Candidates
                                                <span style={{ fontSize: 12, fontWeight: 700, color: C.s400, background: C.s100, padding: "2px 10px", borderRadius: 100 }}>{candidatesTotal}</span>
                                            </div>
                                        </div>
                                        {/* ─ Grid ─ */}
                                        <div style={{ padding: "16px 20px" }}>
                                            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0,1fr))", gap: 12 }}>
                                                {people.length > 0 ? (
                                                    people.map((person) => (
                                                        <div key={person.id} onClick={() => { setSelectedCandidateApp(person.app); setShowCandidateModal(true); }} style={{ display: "flex", alignItems: "center", gap: 12, padding: 14, borderRadius: 14, background: C.s50, border: `1px solid ${C.s100}`, cursor: "pointer", transition: "all .15s" }}
                                                            onMouseEnter={e => { e.currentTarget.style.borderColor = C.navy + "40"; e.currentTarget.style.background = "#EEF2FF"; }}
                                                            onMouseLeave={e => { e.currentTarget.style.borderColor = C.s100; e.currentTarget.style.background = C.s50; }}>
                                                            {person.logoUrl ? (
                                                                <img src={person.logoUrl} alt="" style={{ width: 42, height: 42, borderRadius: 12, objectFit: "cover", flexShrink: 0 }} />
                                                            ) : (
                                                                <Avatar initials={person.avatar} color={person.color} size={42} radius={12} />
                                                            )}
                                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                                <div style={{ fontFamily: C.fd, fontSize: 13.5, fontWeight: 800, color: C.s900 }}>{person.name}</div>
                                                                <div style={{ fontSize: 12, color: C.s500 }}>{person.role}{person.location ? ` · ${person.location}` : ""}</div>
                                                            </div>
                                                            <button onClick={(e) => { e.stopPropagation(); handleRequestChat(); }} style={{ width: 32, height: 32, borderRadius: 9, border: "none", background: "#EEF2FF", color: C.navy, cursor: "pointer", flexShrink: 0 }}>
                                                                <FiMail size={13} />
                                                            </button>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div style={{ gridColumn: "1 / -1", color: C.s500, fontSize: 13, textAlign: "center", padding: "40px 16px" }}>No candidate conversations are available yet. Once applications arrive, they'll appear here.</div>
                                                )}
                                            </div>
                                        </div>
                                        {/* ─ Pagination ─ */}
                                        {candidatesTotal > CANDIDATE_PAGE_SIZE && (
                                            <div style={{ padding: "12px 20px", borderTop: `1px solid ${C.s100}`, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10, background: C.s50 + "80" }}>
                                                <div style={{ fontSize: 12, color: C.s500, fontWeight: 600 }}>
                                                    Showing <strong>{(safeCandidatePage - 1) * CANDIDATE_PAGE_SIZE + 1}-{Math.min(safeCandidatePage * CANDIDATE_PAGE_SIZE, candidatesTotal)}</strong> of <strong>{candidatesTotal}</strong>
                                                </div>
                                                <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                                                    <button onClick={() => setCandidatePage(p => Math.max(1, p - 1))} disabled={safeCandidatePage <= 1}
                                                        style={{ width: 34, height: 34, borderRadius: 9, border: `1px solid ${C.s200}`, background: safeCandidatePage <= 1 ? C.s50 : "#fff", color: safeCandidatePage <= 1 ? C.s300 : C.s700, display: "flex", alignItems: "center", justifyContent: "center", cursor: safeCandidatePage <= 1 ? "default" : "pointer", fontSize: 14, transition: "all .15s", outline: "none" }}
                                                        onMouseEnter={e => { if (safeCandidatePage > 1) { e.currentTarget.style.borderColor = C.navy; e.currentTarget.style.color = C.navy; } }}
                                                        onMouseLeave={e => { e.currentTarget.style.borderColor = C.s200; e.currentTarget.style.color = safeCandidatePage <= 1 ? C.s300 : C.s700; }}>
                                                        <FiChevronLeft size={15} />
                                                    </button>
                                                    {candidatePageNumbers.map((n, i) => n === "..." ? (
                                                        <span key={`e${i}`} style={{ width: 28, textAlign: "center", fontSize: 12, color: C.s400, fontWeight: 600 }}>...</span>
                                                    ) : (
                                                        <button key={n} onClick={() => setCandidatePage(n)}
                                                            style={{ width: 34, height: 34, borderRadius: 9, border: `1px solid ${safeCandidatePage === n ? C.navy : C.s200}`, background: safeCandidatePage === n ? C.navy : "#fff", color: safeCandidatePage === n ? "#fff" : C.s700, fontWeight: 700, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all .15s", outline: "none" }}
                                                            onMouseEnter={e => { if (safeCandidatePage !== n) { e.currentTarget.style.borderColor = C.navy; e.currentTarget.style.color = C.navy; } }}
                                                            onMouseLeave={e => { if (safeCandidatePage !== n) { e.currentTarget.style.borderColor = C.s200; e.currentTarget.style.color = C.s700; } }}>
                                                            {n}
                                                        </button>
                                                    ))}
                                                    <button onClick={() => setCandidatePage(p => Math.min(candidatesTotalPages, p + 1))} disabled={safeCandidatePage >= candidatesTotalPages}
                                                        style={{ width: 34, height: 34, borderRadius: 9, border: `1px solid ${C.s200}`, background: safeCandidatePage >= candidatesTotalPages ? C.s50 : "#fff", color: safeCandidatePage >= candidatesTotalPages ? C.s300 : C.s700, display: "flex", alignItems: "center", justifyContent: "center", cursor: safeCandidatePage >= candidatesTotalPages ? "default" : "pointer", fontSize: 14, transition: "all .15s", outline: "none" }}
                                                        onMouseEnter={e => { if (safeCandidatePage < candidatesTotalPages) { e.currentTarget.style.borderColor = C.navy; e.currentTarget.style.color = C.navy; } }}
                                                        onMouseLeave={e => { e.currentTarget.style.borderColor = C.s200; e.currentTarget.style.color = safeCandidatePage >= candidatesTotalPages ? C.s300 : C.s700; }}>
                                                        <FiChevronRight size={15} />
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </Card>
                                )}

                                {activeTab === "Progress" && (
                                    <ProgressSection
                                        apps={normalizedApplications}
                                        filter={progressFilter}
                                        onFilterChange={setProgressFilter}
                                        page={progressPage}
                                        onPageChange={setProgressPage}
                                        draftStatuses={draftStatuses}
                                        setDraftStatuses={setDraftStatuses}
                                        updatingAppId={updatingAppId}
                                        setUpdatingAppId={setUpdatingAppId}
                                        resumeBusyId={resumeBusyId}
                                        setResumeBusyId={setResumeBusyId}
                                        progressBanner={progressBanner}
                                        setProgressBanner={setProgressBanner}
                                    />
                                )}

                                {activeTab === "Jobs" && (
                                    <Card className="ep-card">
                                        <SectionHead title="Open Roles"
                                            action={
                                                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                                                    <div style={{ display: "flex", gap: 6 }}>
                                                        {["all", "urgent", "design", "engineering"].map(f => (
                                                            <button key={f} onClick={() => setJobFilter(f)}
                                                                style={{
                                                                    padding: "5px 12px", borderRadius: 100, fontSize: 11.5, fontWeight: 700,
                                                                    cursor: "pointer", border: `1.5px solid ${jobFilter === f ? C.navy : C.s200}`,
                                                                    background: jobFilter === f ? C.navy : "#fff",
                                                                    color: jobFilter === f ? "#fff" : C.s500,
                                                                    fontFamily: C.fd, transition: "all .14s"
                                                                }}>
                                                                {f.charAt(0).toUpperCase() + f.slice(1)}
                                                            </button>
                                                        ))}
                                                    </div>
                                                    <Btn variant="primary" onClick={() => navigate("/post-job")} style={{ padding: "7px 13px", fontSize: 12 }}>
                                                        <FiPlus size={12} /> Post
                                                    </Btn>
                                                </div>
                                            } />
                                        {paginatedJobs.length > 0 ? paginatedJobs.map((j, i) => {
                                            const sal = formatSalary(j.salaryMin, j.salaryMax);
                                            const skillSet = Array.isArray(j.skills) ? j.skills : [];
                                            const visibleSkills = skillSet.slice(0, 4);
                                            const extraSkills = skillSet.length - 4;
                                            const colors = [C.navy, C.green, C.indigo, C.amber, C.sky];
                                            const idx = jobPage * jobPageSize + i;
                                            return (
                                                <div key={j.id} className="ep-job-row">
                                                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
                                                        <div style={{ flex: 1, minWidth: 0 }}>
                                                            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                                                                <div style={{
                                                                    width: 36, height: 36, borderRadius: 10,
                                                                    background: colors[idx % 5] + "14",
                                                                    display: "flex", alignItems: "center", justifyContent: "center",
                                                                    color: colors[idx % 5], flexShrink: 0
                                                                }}>
                                                                    <FiBriefcase size={16} />
                                                                </div>
                                                                <div style={{ minWidth: 0 }}>
                                                                    <div style={{ fontFamily: C.fd, fontSize: 15, fontWeight: 800, color: C.s900, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{j.title}</div>
                                                                    <div style={{ fontSize: 12, color: C.s500, marginTop: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                                                        {[j.department, j.location, j.jobType].filter(Boolean).join(' · ') || '—'}
                                                                    </div>
                                                                </div>
                                                                {j.requiresPackageOverride && (
                                                                    <span style={{
                                                                        display: "inline-flex", alignItems: "center", gap: 3,
                                                                        height: 20, padding: "0 8px", borderRadius: 100,
                                                                        background: "#fef2f2", fontSize: 10, fontWeight: 800,
                                                                        color: "#dc2626", fontFamily: C.fd, flexShrink: 0
                                                                    }}>
                                                                        <FiAlertCircle size={9} /> Urgent
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center", paddingLeft: 44 }}>
                                                                <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11.5, color: C.s500 }}>
                                                                    <FiClock size={11} /> Posted {j.lastUpdated || '—'}
                                                                </span>
                                                                {j.experience && (
                                                                    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11.5, color: C.s500 }}>
                                                                        <FiBarChart2 size={11} /> {j.experience}
                                                                    </span>
                                                                )}
                                                                <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11.5, color: C.s500 }}>
                                                                    <FiUsers size={11} /> {j.applicantCount} applicant{j.applicantCount !== 1 ? 's' : ''}
                                                                </span>
                                                                {j.workplaceType && (
                                                                    <span style={{
                                                                        display: "inline-flex", alignItems: "center", gap: 3,
                                                                        padding: "1px 7px", borderRadius: 100, fontSize: 10, fontWeight: 700,
                                                                        background: j.workplaceType === 'Remote' ? '#ecfdf5' : j.workplaceType === 'Hybrid' ? '#eef2ff' : '#f1f5f9',
                                                                        color: j.workplaceType === 'Remote' ? '#059669' : j.workplaceType === 'Hybrid' ? '#4338ca' : C.s600,
                                                                    }}>
                                                                        {j.workplaceType === 'Remote' ? <FiMonitor size={9} /> : j.workplaceType === 'Hybrid' ? <FiGrid size={9} /> : <FiMapPin size={9} />}
                                                                        {' '}{j.workplaceType}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            {skillSet.length > 0 && (
                                                                <div style={{ display: "flex", gap: 4, flexWrap: "wrap", paddingLeft: 44, marginTop: 8 }}>
                                                                    {visibleSkills.map((s, si) => (
                                                                        <span key={si} style={{
                                                                            padding: "1px 8px", borderRadius: 100, fontSize: 10, fontWeight: 600,
                                                                            background: "#eef2ff", color: "#4338ca",
                                                                        }}>{s}</span>
                                                                    ))}
                                                                    {extraSkills > 0 && (
                                                                        <span style={{
                                                                            padding: "1px 8px", borderRadius: 100, fontSize: 10, fontWeight: 700,
                                                                            background: "#f1f5f9", color: C.s400,
                                                                        }}>+{extraSkills}</span>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8, flexShrink: 0 }}>
                                                            {sal && (
                                                                <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 13, color: C.green, fontWeight: 800, fontFamily: C.fd, whiteSpace: "nowrap" }}>
                                                                    {sal}
                                                                </span>
                                                            )}
                                                            <div style={{ display: "flex", gap: 6 }}>
                                                                <button onClick={() => { setSelectedJob(j); setShowViewJob(true); }}
                                                                    style={{
                                                                        padding: "5px 11px", borderRadius: 8, fontSize: 11, fontWeight: 700,
                                                                        border: `1.5px solid ${C.s200}`, background: "#fff", color: C.s600,
                                                                        cursor: "pointer", fontFamily: "inherit", display: "inline-flex", alignItems: "center", gap: 4,
                                                                        transition: "all .12s"
                                                                    }}
                                                                    onMouseOver={e => { e.currentTarget.style.borderColor = C.navy; e.currentTarget.style.color = C.navy; }}
                                                                    onMouseOut={e => { e.currentTarget.style.borderColor = C.s200; e.currentTarget.style.color = C.s600; }}>
                                                                    <FiEye size={11} /> View
                                                                </button>
                                                                <button onClick={() => { setSelectedJob(j); setShowEditJob(true); }}
                                                                    style={{
                                                                        padding: "5px 9px", borderRadius: 8, fontSize: 11, fontWeight: 700,
                                                                        border: `1.5px solid ${C.s200}`, background: "#fff", color: C.s400,
                                                                        cursor: "pointer", fontFamily: "inherit", display: "inline-flex", alignItems: "center",
                                                                        transition: "all .12s"
                                                                    }}
                                                                    onMouseOver={e => { e.currentTarget.style.borderColor = C.s300; e.currentTarget.style.color = C.s600; }}
                                                                    onMouseOut={e => { e.currentTarget.style.borderColor = C.s200; e.currentTarget.style.color = C.s400; }}>
                                                                    <FiEdit2 size={11} />
                                                                </button>
                                                            </div>
                                                            {!j.isActive && (
                                                                <span style={{ fontSize: 10, fontWeight: 700, color: C.s400, textTransform: "uppercase", letterSpacing: ".04em" }}>Inactive</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        }) : (
                                            <div style={{ padding: "32px 20px", textAlign: "center", color: C.s400, fontSize: 13 }}>
                                                No jobs match the current filter.
                                            </div>
                                        )}
                                        <div style={{
                                            padding: "12px 20px", borderTop: `1px solid ${C.s100}`,
                                            display: "flex", justifyContent: "space-between", alignItems: "center"
                                        }}>
                                            <span style={{ fontSize: 12, color: C.s400, fontWeight: 600 }}>
                                                {filteredJobs.length > 0
                                                    ? `Showing ${jobPage * jobPageSize + 1}–${Math.min((jobPage + 1) * jobPageSize, filteredJobs.length)} of ${filteredJobs.length} job${filteredJobs.length !== 1 ? 's' : ''}`
                                                    : 'No jobs match the current filter'}
                                            </span>
                                            <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                                                {totalJobPages > 1 && (
                                                    <>
                                                        <button disabled={jobPage === 0} onClick={() => setJobPage(p => p - 1)}
                                                            style={{
                                                                padding: "4px 9px", borderRadius: 6, fontSize: 11, fontWeight: 700,
                                                                border: `1px solid ${jobPage === 0 ? C.s100 : C.s200}`, background: "#fff",
                                                                color: jobPage === 0 ? C.s300 : C.s500, cursor: jobPage === 0 ? "default" : "pointer",
                                                                fontFamily: "inherit", opacity: jobPage === 0 ? 0.5 : 1
                                                            }}>
                                                            <FiChevronLeft size={12} />
                                                        </button>
                                                        {Array.from({ length: totalJobPages }, (_, pi) => (
                                                            <button key={pi} onClick={() => setJobPage(pi)}
                                                                style={{
                                                                    width: 26, height: 26, borderRadius: 6, fontSize: 11, fontWeight: 800,
                                                                    border: pi === jobPage ? `1.5px solid ${C.navy}` : `1px solid ${C.s200}`,
                                                                    background: pi === jobPage ? C.navy : "#fff",
                                                                    color: pi === jobPage ? "#fff" : C.s500, cursor: "pointer", fontFamily: C.fd
                                                                }}>
                                                                {pi + 1}
                                                            </button>
                                                        ))}
                                                        <button disabled={jobPage >= totalJobPages - 1} onClick={() => setJobPage(p => p + 1)}
                                                            style={{
                                                                padding: "4px 9px", borderRadius: 6, fontSize: 11, fontWeight: 700,
                                                                border: `1px solid ${jobPage >= totalJobPages - 1 ? C.s100 : C.s200}`, background: "#fff",
                                                                color: jobPage >= totalJobPages - 1 ? C.s300 : C.s500, cursor: jobPage >= totalJobPages - 1 ? "default" : "pointer",
                                                                fontFamily: "inherit", opacity: jobPage >= totalJobPages - 1 ? 0.5 : 1
                                                            }}>
                                                            <FiChevronRight size={12} />
                                                        </button>
                                                        <div style={{ width: 1, height: 20, background: C.s200, margin: "0 6px" }} />
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </Card>
                                )}

                                {/* ─ Comments ─ */}
                                {activeTab === "Comments" && (
                                    <Card className="ep-card">
                                        <SectionHead title="Comments" />
                                        {companyReviews.slice(reviewPage * reviewPageSize, (reviewPage + 1) * reviewPageSize).map((u, i) => {
                                            const isLiked = likedReviews[u.id];
                                            const reviewerName = u.candidateName || u.name || u.userName || "Verified Candidate";
                                            const reviewerTitle = u.candidateTitle || u.title || u.role || "Candidate";
                                            const totalReactions = Object.values(u.reactions || {}).reduce((s, v) => s + v, 0);
                                            return (
                                                <div key={u.id} className="ep-update" style={{ borderRadius: 14, background: "#fff", border: `1px solid ${C.s100}`, boxShadow: "0 14px 26px rgba(15,23,42,0.04)" }}>
                                                    <div style={{ display: "flex", gap: 12, marginBottom: 12, alignItems: "center" }}>
                                                        {u.candidateLogoUrl ? (
                                                            <img src={u.candidateLogoUrl} alt="" style={{ width: 42, height: 42, borderRadius: 12, objectFit: "cover", flexShrink: 0 }} />
                                                        ) : (
                                                            <Avatar initials={reviewerName.slice(0, 2).toUpperCase()} color={[C.navy, C.green, C.indigo, C.amber, C.purple][i % 5]} size={42} radius={12} />
                                                        )}
                                                        <div style={{ flex: 1 }}>
                                                            <div style={{ fontFamily: C.fd, fontSize: 13.8, fontWeight: 800, color: C.s900 }}>{reviewerName}</div>
                                                            <div style={{ fontSize: 12, color: C.s400 }}>{reviewerTitle}</div>
                                                        </div>
                                                        <span style={{ fontSize: 12, fontWeight: 700, color: C.amber, background: "#fff7ed", border: "1px solid #fed7aa", borderRadius: 999, padding: "6px 10px" }}>{(u.rating || 0)}/5 rating</span>
                                                    </div>
                                                    <p style={{ fontSize: 14, color: C.s700, lineHeight: 1.7, marginBottom: 14 }}>"{u.review}"</p>
                                                    {/* Engagement bar */}
                                                    <div style={{
                                                        display: "flex", alignItems: "center", justifyContent: "space-between",
                                                        paddingTop: 12, borderTop: `1px solid ${C.s100}`
                                                    }}>
                                                        <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                                                            {[{ icon: FiSmile, color: C.amber }, { icon: FiHeart, color: C.red }, { icon: FiAward, color: C.indigo }, { icon: FiStar, color: C.purple }].map((e, ei) => (
                                                                <span key={ei} style={{ fontSize: 13, color: e.color, display: "flex", alignItems: "center" }}><e.icon size={13} /></span>
                                                            ))}
                                                            <span style={{ fontSize: 12.5, color: C.s400, marginLeft: 6 }}>{totalReactions} helpful</span>
                                                        </div>
                                                        <div style={{ display: "flex", gap: 8, position: "relative" }}>
                                                            {/* Reaction Picker Popover */}
                                                            {showReactionFor === u.id && (
                                                                <div className="reaction-picker" style={{
                                                                    position: "absolute", bottom: "100%", left: 0, marginBottom: 8,
                                                                    background: "#fff", borderRadius: 100, padding: "6px 12px",
                                                                    boxShadow: "0 10px 25px rgba(0,0,0,.15)", display: "flex", gap: 10,
                                                                    border: `1px solid ${C.s100}`, zIndex: 10, animation: "popIn .2s ease"
                                                                }}>
                                                                    {[
                                                                        { id: 'helpful', icon: FiSmile, color: C.amber, label: "Helpful" },
                                                                        { id: 'love', icon: FiHeart, color: C.red, label: "Love" },
                                                                        { id: 'great', icon: FiAward, color: C.indigo, label: "Great" },
                                                                        { id: 'insight', icon: FiStar, color: C.purple, label: "Insight" }
                                                                    ].map((re) => (
                                                                        <button key={re.id}
                                                                            onClick={async () => {
                                                                                setLikedReviews(prev => ({ ...prev, [u.id]: re.id }));
                                                                                setShowReactionFor(null);
                                                                                try { await authService.reactToReview(u.id, re.id); } catch (_) { }
                                                                            }}
                                                                            title={re.label}
                                                                            style={{
                                                                                background: "none", border: "none", cursor: "pointer",
                                                                                padding: 6, borderRadius: "50%", display: "flex",
                                                                                transition: "all .15s", color: re.color
                                                                            }}
                                                                            onMouseEnter={e => { e.currentTarget.style.background = C.s50; e.currentTarget.style.transform = "scale(1.2)"; }}
                                                                            onMouseLeave={e => { e.currentTarget.style.background = "none"; e.currentTarget.style.transform = "scale(1)"; }}>
                                                                            <re.icon size={18} />
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                            )}

                                                            <button onClick={() => setShowReactionFor(showReactionFor === u.id ? null : u.id)}
                                                                style={{
                                                                    display: "flex", alignItems: "center", gap: 5, padding: "6px 12px",
                                                                    borderRadius: 9, background: isLiked ? "#EEF2FF" : "transparent",
                                                                    border: "none", cursor: "pointer", fontSize: 12.5, fontWeight: 600,
                                                                    color: isLiked ? C.navy : C.s500, transition: "all .15s"
                                                                }}>
                                                                {(() => {
                                                                    const active = [{ id: 'helpful', icon: FiSmile, color: C.amber }, { id: 'love', icon: FiHeart, color: C.red }, { id: 'great', icon: FiAward, color: C.indigo }, { id: 'insight', icon: FiStar, color: C.purple }].find(x => x.id === isLiked);
                                                                    return active ? <active.icon size={13} color={active.color} /> : <FiSmile size={13} />;
                                                                })()}
                                                                {isLiked ? (isLiked.charAt(0).toUpperCase() + isLiked.slice(1)) : "Helpful"}
                                                            </button>
                                                            <button
                                                                onClick={() => handleReviewShare(u)}
                                                                style={{
                                                                    display: "flex", alignItems: "center", gap: 5, padding: "6px 12px",
                                                                    borderRadius: 9, background: "transparent", border: "none",
                                                                    cursor: "pointer", fontSize: 12.5, fontWeight: 600, color: C.s500
                                                                }}
                                                            >
                                                                <FiShare2 size={13} /> Share
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}

                                        {/* Pagination & Footer */}
                                        <div style={{ padding: "16px 20px", borderTop: `1px solid ${C.s100}`, background: C.s50 + "50" }}>
                                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                                                <div style={{ fontSize: 12.5, color: C.s500, fontWeight: 600 }}>
                                                    Showing page {reviewPage + 1} of {totalReviewPages} · {companyReviews.length} total comments
                                                </div>
                                                <div style={{ display: "flex", gap: 8 }}>
                                                    <Btn variant="ghost" onClick={() => setReviewPage(p => Math.max(0, p - 1))} disabled={reviewPage === 0} style={{ padding: "5px 10px", opacity: reviewPage === 0 ? 0.5 : 1 }}>
                                                        <FiChevronDown style={{ transform: "rotate(90deg)" }} size={14} />
                                                    </Btn>
                                                    <Btn variant="ghost" onClick={() => setReviewPage(p => Math.min(totalReviewPages - 1, p + 1))} disabled={reviewPage >= totalReviewPages - 1} style={{ padding: "5px 10px", opacity: reviewPage >= totalReviewPages - 1 ? 0.5 : 1 }}>
                                                        <FiChevronDown style={{ transform: "rotate(-90deg)" }} size={14} />
                                                    </Btn>
                                                </div>
                                            </div>
                                            <div style={{
                                                padding: "10px 14px", borderRadius: 10, background: "#fff", border: `1px solid ${C.s200}`,
                                                display: "flex", alignItems: "center", gap: 8
                                            }}>
                                                <FiInfo size={14} color={C.navy} />
                                                <div style={{ fontSize: 12, color: C.s600, fontWeight: 500 }}>
                                                    For more queries, please contact us at <a href="mailto:rohan@mavenjobs.in" style={{ color: C.navy, fontWeight: 700, textDecoration: "none" }}>rohan@mavenjobs.in</a>
                                                </div>
                                            </div>
                                        </div>
                                        {shareMessage && (
                                            <div style={{ margin: "0 20px 16px", padding: "10px 12px", borderRadius: 10, background: "#ecfdf5", border: "1px solid #a7f3d0", color: "#065f46", fontSize: 12.5, fontWeight: 700 }}>
                                                {shareMessage}
                                            </div>
                                        )}
                                    </Card>
                                )}
                            </div>

                            {/* ── RIGHT SIDEBAR ───────────────────────────────── */}
                            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

                                {/* ─ Quick Stats ─ */}
                                <Card className="ep-card" style={{ padding: "18px 18px 14px" }}>
                                    <div style={{ fontFamily: C.fd, fontSize: 15, fontWeight: 800, color: C.s900, marginBottom: 14 }}>Hiring Overview</div>
                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
                                        {overviewCards.map((s, i) => (
                                            <div key={i} style={{
                                                padding: "12px 14px", borderRadius: 12, background: s.color + "08",
                                                border: `1px solid ${s.color}18`
                                            }}>
                                                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                                                    <s.icon size={13} color={s.color} />
                                                    <span style={{ fontSize: 10.5, fontWeight: 700, color: s.color, textTransform: "uppercase", letterSpacing: ".08em", fontFamily: C.fd }}>{s.label}</span>
                                                </div>
                                                <div style={{ fontFamily: C.fd, fontSize: 22, fontWeight: 800, color: C.s900, lineHeight: 1 }}>{formatCompactNumber(s.val)}</div>
                                            </div>
                                        ))}
                                    </div>
                                    <Btn variant="ghost" onClick={() => navigate("/employer-dashboard/analytics")} style={{ width: "100%", justifyContent: "center", fontSize: 12.5 }}>
                                        <FiBarChart2 size={13} /> Quota & Analysis
                                    </Btn>
                                </Card>

                                {/* ─ Suggested Candidates ─ */}
                                <Card className="ep-card" style={{ padding: "18px" }}>
                                    {activeJobs === 0 ? (
                                        <div style={{ textAlign: "center", padding: "20px 10px" }}>
                                            <div style={{ width: 48, height: 48, borderRadius: 14, background: "#FEF3C7", border: "1px solid #FDE68A", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px", color: "#D97706" }}>
                                                <FiBriefcase size={20} />
                                            </div>
                                            <div style={{ fontFamily: C.fd, fontSize: 15, fontWeight: 800, color: C.s900, marginBottom: 6 }}>You have 0 openings</div>
                                            <div style={{ fontSize: 12.5, color: C.s500, marginBottom: 16, lineHeight: 1.5 }}>Post a job to start receiving AI-matched candidate recommendations.</div>
                                            <button onClick={() => navigate("/post-job")} style={{
                                                padding: "10px 20px", borderRadius: 10, border: "none", background: C.navy, color: "#fff",
                                                fontWeight: 800, fontSize: 12.5, cursor: "pointer", fontFamily: C.fd
                                            }}>
                                                Post a Job <FiArrowRight size={13} style={{ display: "inline", verticalAlign: "middle", marginLeft: 4 }} />
                                            </button>
                                        </div>
                                    ) : (
                                        <>
                                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                                                <div style={{ fontFamily: C.fd, fontSize: 15, fontWeight: 800, color: C.s900 }}>
                                                    {aiTopCandidates ? "AI Top Matches" : "Top Matches"}
                                                </div>
                                                <span style={{
                                                    fontSize: 11, color: C.green, fontWeight: 700, background: "#ecfdf5",
                                                    padding: "3px 9px", borderRadius: 100, fontFamily: C.fd
                                                }}>{aiCandidatesLoading ? "Loading�" : aiTopCandidates ? "AI-Ranked" : "Applicants"}</span>
                                            </div>
                                            {(aiTopCandidates || topMatches).slice(0, 3).map((c, i) => (
                                                <div key={c.id} onClick={() => !c.isPlaceholder && window.open(`/candidates/${c.id}`, '_blank')}
                                                    style={{
                                                        display: "flex", alignItems: "center", gap: 12, padding: "12px 0",
                                                        borderBottom: i < (Math.min((aiTopCandidates || topMatches).length, 3) - 1) ? `1px solid ${C.s100}` : "none",
                                                        cursor: c.isPlaceholder ? "default" : "pointer", borderRadius: 8,
                                                        transition: "background .15s"
                                                    }}
                                                    onMouseEnter={(e) => { if (!c.isPlaceholder) e.currentTarget.style.background = C.s50 }}
                                                    onMouseLeave={(e) => { e.currentTarget.style.background = "transparent" }}>
                                                    <Avatar initials={c.avatar} color={c.color} size={44} radius={12} />
                                                    <div style={{ flex: 1, minWidth: 0 }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                                                            <div style={{ minWidth: 0 }}>
                                                                <div style={{ fontFamily: C.fd, fontSize: 14, fontWeight: 800, color: C.s900, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.name}</div>
                                                                <div style={{ fontSize: 12, color: C.s500, marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.role}</div>
                                                            </div>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 8 }}>
                                                                <div style={{ fontSize: 13, fontWeight: 800, color: C.green }}>{c.match}%</div>
                                                            </div>
                                                        </div>
                                                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
                                                            <div style={{ flex: 1, height: 6, borderRadius: 999, background: C.s100 }}>
                                                                <div style={{ height: "100%", borderRadius: 999, background: C.green, width: `${c.match}%` }} />
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <button onClick={(e) => { e.stopPropagation(); handleRequestChat(c.id); }}
                                                        aria-label={`Message ${c.name}`}
                                                        title={`Message ${c.name}`}
                                                        style={{
                                                            width: 36, height: 36, borderRadius: 10, background: "#EEF2FF",
                                                            border: "none", display: "flex", alignItems: "center",
                                                            justifyContent: "center", cursor: "pointer", color: C.navy, flexShrink: 0
                                                        }}>
                                                        <FiMail size={15} />
                                                    </button>
                                                </div>
                                            ))}
                                            {(aiTopCandidates || topMatches).length > 0 && (
                                                <div style={{ marginTop: 12, display: 'flex', gap: 8, alignItems: "center" }}>
                                                    <button onClick={() => navigate('/resdex')} style={{
                                                        flex: "0 0 auto", padding: '8px 12px', borderRadius: 10, border: '1px solid #D8E1EF',
                                                        background: '#fff', color: C.navy, fontWeight: 800, cursor: 'pointer',
                                                        fontSize: 12.5, lineHeight: 1.2, fontFamily: C.fd
                                                    }}>
                                                        View all candidates
                                                    </button>
                                                    <button onClick={() => handleRequestChat()} style={{
                                                        flex: 1, padding: '8px 12px', borderRadius: 10, border: 'none', background: C.green, color: '#fff',
                                                        fontWeight: 800, cursor: 'pointer', fontSize: 12.5, lineHeight: 1.2, fontFamily: C.fd,
                                                        boxShadow: "0 8px 18px rgba(16,185,129,.22)"
                                                    }}>
                                                        Message top match
                                                    </button>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </Card>

                                {/* ─ Premium X Promo ─ */}
                                <Card className="ep-card" style={{ padding: "18px", background: `linear-gradient(135deg,#002366,#1a3a6e)`, border: `1px solid #2d4a8e` }}>
                                    <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
                                        <div style={{
                                            width: 36, height: 36, borderRadius: 10, background: "rgba(255,255,255,.15)",
                                            display: "flex", alignItems: "center", justifyContent: "center"
                                        }}>
                                            <FiZap size={17} color="#fff" />
                                        </div>
                                        <div>
                                            <div style={{ fontFamily: C.fd, fontSize: 14, fontWeight: 800, color: "#fff" }}>Premium X Hiring Suite</div>
                                            <div style={{ fontSize: 11.5, color: "rgba(255,255,255,.6)" }}>Source, screen, and close roles faster</div>
                                        </div>
                                    </div>
                                    <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 6, marginBottom: 14 }}>
                                        {["Premium resume database access", "AI shortlist with fit reasons", "WhatsApp, email, and chat outreach", "Hiring funnel and source analytics", "Featured employer branding"].map((f, i) => (
                                            <li key={i} style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12.5, color: "rgba(255,255,255,.85)", fontWeight: 600 }}>
                                                <FiCheckCircle size={13} color="#10b981" />{f}
                                            </li>
                                        ))}
                                    </ul>
                                    <button onClick={() => navigate("/employer-dashboard/pricing")}
                                        style={{
                                            width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
                                            padding: "10px", borderRadius: 10, fontSize: 13, fontWeight: 700, fontFamily: C.fd,
                                            background: "rgba(255,255,255,.12)", color: "#fff", border: "1px solid rgba(255,255,255,.2)",
                                            cursor: "pointer", backdropFilter: "blur(4px)", transition: "all .18s"
                                        }}
                                        onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,.2)"; }}
                                        onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,.12)"; }}>
                                        <FiZap size={13} /> Upgrade to Premium X
                                    </button>
                                </Card>

                                {/* ─ Company Info snippet ─ */}
                                <Card className="ep-card" style={{ padding: "18px" }}>
                                    <div style={{ fontFamily: C.fd, fontSize: 14, fontWeight: 800, color: C.s900, marginBottom: 12 }}>Company Information</div>
                                    {[
                                        { label: "Founded", val: company.founded || "N/A" },
                                        { label: "Size", val: company.size || "N/A" },
                                        { label: "Type", val: company.type || "N/A" },
                                        { label: "Industry", val: company.industry || "N/A" },
                                    ].map((r, i) => (
                                        <div key={i} style={{
                                            display: "flex", justifyContent: "space-between",
                                            padding: "8px 0", borderBottom: `1px solid ${C.s100}`
                                        }}>
                                            <span style={{ fontSize: 12.5, color: C.s500, fontWeight: 600 }}>{r.label}</span>
                                            <span style={{ fontSize: 12.5, color: C.s700, fontWeight: 700, textAlign: "right", maxWidth: "60%" }}>{r.val}</span>
                                        </div>
                                    ))}
                                    <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${C.s100}` }}>
                                        <span style={{ fontSize: 12.5, color: C.s500, fontWeight: 600 }}>Plan</span>
                                        <span style={{
                                            fontSize: 12.5, fontWeight: 800, textAlign: "right",
                                            color: company.plan ? C.amber : C.s400,
                                            fontFamily: C.fd,
                                        }}>
                                            {company.plan || "STANDARD"}
                                        </span>
                                    </div>
                                    <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `none` }}>
                                        <span style={{ fontSize: 12.5, color: C.s500, fontWeight: 600 }}>Jobs Used</span>
                                        <span style={{ fontSize: 12.5, color: C.s700, fontWeight: 700, textAlign: "right" }}>
                                            {company.activeJobCount} / {company.jobLimit}
                                        </span>
                                    </div>
                                </Card>

                            </div>{/* end right sidebar */}
                        </div>
                    </main>

                    {/* Upgrade Modal for Premium X gating */}
                    {showUpgradeModal && (
                        <Modal open={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} title="Upgrade to Premium X" width={520}>
                            <div style={{ padding: 12 }}>
                                <p style={{ marginTop: 0, fontSize: 15, fontWeight: 700 }}>Access Chat with Candidates</p>
                                <p style={{ color: C.s600 }}>Messaging candidates is available to Premium X customers only. Upgrade to unlock unlimited outreach and candidate messaging.</p>
                                <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                                    <Btn variant="ghost" onClick={() => setShowUpgradeModal(false)}>Maybe later</Btn>
                                    <Btn variant="green" onClick={() => { setShowUpgradeModal(false); navigate('/employer-dashboard/pricing'); }}>Upgrade to Premium X</Btn>
                                </div>
                            </div>
                        </Modal>
                    )}

                    <Modal open={showAboutEditor} onClose={() => setShowAboutEditor(false)} title="Edit Company Profile" width={720}>
                        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                                <div>
                                    <label style={{ display: "block", fontSize: 12.5, fontWeight: 700, color: C.s700, marginBottom: 6 }}>Tagline</label>
                                    <input
                                        value={aboutDraft.tagline}
                                        onChange={(e) => setAboutDraft((current) => ({ ...current, tagline: e.target.value }))}
                                        style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: `1.5px solid ${C.s200}`, fontSize: 13, color: C.s900, fontFamily: C.dm }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: "block", fontSize: 12.5, fontWeight: 700, color: C.s700, marginBottom: 6 }}>Founded Year</label>
                                    <input
                                        value={aboutDraft.founded}
                                        onChange={(e) => setAboutDraft((current) => ({ ...current, founded: e.target.value }))}
                                        placeholder="e.g. 2015"
                                        style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: `1.5px solid ${C.s200}`, fontSize: 13, color: C.s900, fontFamily: C.dm }}
                                    />
                                </div>
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                                <div>
                                    <label style={{ display: "block", fontSize: 12.5, fontWeight: 700, color: C.s700, marginBottom: 6 }}>Website</label>
                                    <input
                                        value={aboutDraft.website}
                                        onChange={(e) => setAboutDraft((current) => ({ ...current, website: e.target.value }))}
                                        style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: `1.5px solid ${C.s200}`, fontSize: 13, color: C.s900, fontFamily: C.dm }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: "block", fontSize: 12.5, fontWeight: 700, color: C.s700, marginBottom: 6 }}>LinkedIn</label>
                                    <input
                                        value={aboutDraft.linkedIn}
                                        onChange={(e) => setAboutDraft((current) => ({ ...current, linkedIn: e.target.value }))}
                                        placeholder="https://linkedin.com/company/..."
                                        style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: `1.5px solid ${C.s200}`, fontSize: 13, color: C.s900, fontFamily: C.dm }}
                                    />
                                </div>
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                                <div>
                                    <label style={{ display: "block", fontSize: 12.5, fontWeight: 700, color: C.s700, marginBottom: 6 }}>Company Size</label>
                                    <input
                                        value={aboutDraft.companySize}
                                        onChange={(e) => setAboutDraft((current) => ({ ...current, companySize: e.target.value }))}
                                        placeholder="e.g. 51-200 employees"
                                        style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: `1.5px solid ${C.s200}`, fontSize: 13, color: C.s900, fontFamily: C.dm }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: "block", fontSize: 12.5, fontWeight: 700, color: C.s700, marginBottom: 6 }}>Industry</label>
                                    <input
                                        value={aboutDraft.industry}
                                        onChange={(e) => setAboutDraft((current) => ({ ...current, industry: e.target.value }))}
                                        style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: `1.5px solid ${C.s200}`, fontSize: 13, color: C.s900, fontFamily: C.dm }}
                                    />
                                </div>
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                                <div>
                                    <label style={{ display: "block", fontSize: 12.5, fontWeight: 700, color: C.s700, marginBottom: 6 }}>Company Type</label>
                                    <input
                                        value={aboutDraft.type}
                                        onChange={(e) => setAboutDraft((current) => ({ ...current, type: e.target.value }))}
                                        placeholder="e.g. Privately Held"
                                        style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: `1.5px solid ${C.s200}`, fontSize: 13, color: C.s900, fontFamily: C.dm }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: "block", fontSize: 12.5, fontWeight: 700, color: C.s700, marginBottom: 6 }}>Location (City)</label>
                                    <input
                                        value={aboutDraft.locationCity}
                                        onChange={(e) => setAboutDraft((current) => ({ ...current, locationCity: e.target.value }))}
                                        placeholder="e.g. Pune"
                                        style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: `1.5px solid ${C.s200}`, fontSize: 13, color: C.s900, fontFamily: C.dm }}
                                    />
                                </div>
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                                <div>
                                    <label style={{ display: "block", fontSize: 12.5, fontWeight: 700, color: C.s700, marginBottom: 6 }}>Region / State</label>
                                    <input
                                        value={aboutDraft.locationRegion}
                                        onChange={(e) => setAboutDraft((current) => ({ ...current, locationRegion: e.target.value }))}
                                        placeholder="e.g. Maharashtra"
                                        style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: `1.5px solid ${C.s200}`, fontSize: 13, color: C.s900, fontFamily: C.dm }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: "block", fontSize: 12.5, fontWeight: 700, color: C.s700, marginBottom: 6 }}>Zone</label>
                                    <input
                                        value={aboutDraft.locationZone}
                                        onChange={(e) => setAboutDraft((current) => ({ ...current, locationZone: e.target.value }))}
                                        placeholder="e.g. South"
                                        style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: `1.5px solid ${C.s200}`, fontSize: 13, color: C.s900, fontFamily: C.dm }}
                                    />
                                </div>
                            </div>
                            <div>
                                <label style={{ display: "block", fontSize: 12.5, fontWeight: 700, color: C.s700, marginBottom: 6 }}>About</label>
                                <textarea
                                    value={aboutDraft.about}
                                    onChange={(e) => setAboutDraft((current) => ({ ...current, about: e.target.value }))}
                                    rows={5}
                                    style={{
                                        width: "100%",
                                        padding: "12px 14px",
                                        borderRadius: 12,
                                        border: `1.5px solid ${C.s200}`,
                                        fontSize: 13.5,
                                        color: C.s900,
                                        fontFamily: C.dm,
                                        resize: "vertical",
                                    }}
                                />
                            </div>
                            {/* Specialties */}
                            <div>
                                <label style={{ display: "block", fontSize: 12.5, fontWeight: 700, color: C.s700, marginBottom: 6 }}>Specialties</label>
                                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
                                    {(aboutDraft.specialties || []).map((s, i) => (
                                        <span key={i} style={{
                                            display: "inline-flex", alignItems: "center", gap: 4,
                                            background: C.navy + "0c", color: C.navy, fontSize: 12, fontWeight: 600,
                                            padding: "4px 10px", borderRadius: 100,
                                            border: `1px solid ${C.navy}18`,
                                        }}>
                                            {s}
                                            <button onClick={() => {
                                                setAboutDraft((current) => ({
                                                    ...current,
                                                    specialties: current.specialties.filter((_, idx) => idx !== i),
                                                }));
                                            }} style={{ background: "none", border: "none", cursor: "pointer", color: C.s400, padding: 0, display: "flex", fontSize: 14, lineHeight: 1 }}>&times;</button>
                                        </span>
                                    ))}
                                </div>
                                <div style={{ display: "flex", gap: 8 }}>
                                    <input
                                        value={specInput}
                                        onChange={(e) => setSpecInput(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter" || e.key === ",") {
                                                e.preventDefault();
                                                const val = specInput.trim().replace(/,+$/, "");
                                                if (val && !aboutDraft.specialties.includes(val)) {
                                                    setAboutDraft((current) => ({
                                                        ...current,
                                                        specialties: [...current.specialties, val],
                                                    }));
                                                }
                                                setSpecInput("");
                                            }
                                        }}
                                        placeholder="Type a specialty and press Enter"
                                        style={{ flex: 1, padding: "10px 14px", borderRadius: 10, border: `1.5px solid ${C.s200}`, fontSize: 13, color: C.s900, fontFamily: C.dm }}
                                    />
                                    <Btn variant="primary" style={{ padding: "10px 16px", fontSize: 12, flexShrink: 0 }} onClick={() => {
                                        const val = specInput.trim();
                                        if (val && !aboutDraft.specialties.includes(val)) {
                                            setAboutDraft((current) => ({
                                                ...current,
                                                specialties: [...current.specialties, val],
                                            }));
                                        }
                                        setSpecInput("");
                                    }}>Add</Btn>
                                </div>
                            </div>
                            {/* Perks */}
                            <div style={{ marginTop: 8 }}>
                                <label style={{ display: "block", fontSize: 12.5, fontWeight: 700, color: C.s700, marginBottom: 6 }}>Perks</label>
                                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
                                    {(aboutDraft.perks || []).map((p, i) => {
                                        const perkIcon = PERK_ICONS.find(pi => pi.label === (p.label || p));
                                        const IconComp = perkIcon?.icon || FiStar;
                                        const iconColor = perkIcon?.color || C.navy;
                                        return (
                                            <span key={i} style={{
                                                display: "inline-flex", alignItems: "center", gap: 6,
                                                background: iconColor + "0c", color: C.s700, fontSize: 12, fontWeight: 600,
                                                padding: "5px 10px 5px 8px", borderRadius: 100,
                                                border: `1px solid ${iconColor}20`,
                                            }}>
                                                <IconComp size={12} color={iconColor} />
                                                {p.label || p}
                                                <button onClick={() => {
                                                    setAboutDraft((current) => ({
                                                        ...current,
                                                        perks: current.perks.filter((_, idx) => idx !== i),
                                                    }));
                                                }} style={{ background: "none", border: "none", cursor: "pointer", color: C.s400, padding: 0, display: "flex", fontSize: 14, lineHeight: 1 }}>&times;</button>
                                            </span>
                                        );
                                    })}
                                </div>
                                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                                    <input
                                        value={perkInput}
                                        onChange={e => setPerkInput(e.target.value)}
                                        onKeyDown={e => {
                                            if (e.key === "Enter") {
                                                e.preventDefault();
                                                setShowPerkPicker(true);
                                            }
                                        }}
                                        placeholder="Type a perk and pick an icon"
                                        style={{ flex: 1, padding: "10px 14px", borderRadius: 10, border: `1.5px solid ${C.s200}`, fontSize: 13, color: C.s900, fontFamily: C.dm }}
                                    />
                                    <Btn variant="primary" style={{ padding: "10px 16px", fontSize: 12, flexShrink: 0 }} onClick={() => {
                                        if (perkInput.trim()) setShowPerkPicker(true);
                                    }}>Add</Btn>
                                </div>
                            </div>

                            {/* Perk Icon Picker Modal */}
                            {showPerkPicker && (
                                <div style={{
                                    position: "fixed", inset: 0, zIndex: 99999,
                                    background: "rgba(15,23,42,0.5)",
                                    backdropFilter: "blur(8px)",
                                    WebkitBackdropFilter: "blur(8px)",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    padding: 24
                                }} onClick={() => setShowPerkPicker(false)}>
                                    <div onClick={e => e.stopPropagation()} style={{
                                        background: "rgba(255,255,255,0.97)",
                                        backdropFilter: "blur(24px)",
                                        WebkitBackdropFilter: "blur(24px)",
                                        borderRadius: 24,
                                        border: "1px solid rgba(255,255,255,0.5)",
                                        boxShadow: "0 32px 80px rgba(0,0,0,0.2)",
                                        maxWidth: 480, width: "100%",
                                        padding: "28px 24px 20px"
                                    }}>
                                        <h3 style={{ margin: "0 0 6px", fontSize: 17, fontWeight: 800, color: "#0F172A" }}>
                                            Choose an Icon
                                        </h3>
                                        <p style={{ margin: "0 0 16px", fontSize: 13, color: "#64748B", fontWeight: 500 }}>
                                            Select an icon for &ldquo;{perkInput.trim()}&rdquo;
                                        </p>
                                        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
                                            {PERK_ICONS.map((pi, idx) => {
                                                const IconComp = pi.icon;
                                                const alreadyAdded = aboutDraft.perks.some(
                                                    pp => (pp.label || pp) === pi.label
                                                );
                                                return (
                                                    <button key={idx} disabled={alreadyAdded} onClick={() => {
                                                        setAboutDraft((current) => ({
                                                            ...current,
                                                            perks: [...current.perks, {
                                                                label: perkInput.trim(),
                                                                icon: pi.label,
                                                            }],
                                                        }));
                                                        setShowPerkPicker(false);
                                                        setPerkInput("");
                                                    }} style={{
                                                        display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
                                                        padding: "14px 8px", borderRadius: 14,
                                                        border: `1.5px solid ${alreadyAdded ? "#E2E8F0" : pi.color + "30"}`,
                                                        background: alreadyAdded ? "#F8FAFC" : "#fff",
                                                        color: alreadyAdded ? "#CBD5E1" : pi.color,
                                                        cursor: alreadyAdded ? "not-allowed" : "pointer",
                                                        fontFamily: C.dm, transition: "all 0.12s", opacity: alreadyAdded ? 0.5 : 1
                                                    }}
                                                        onMouseEnter={e => { if (!alreadyAdded) { e.currentTarget.style.borderColor = pi.color; e.currentTarget.style.background = pi.color + "0c"; } }}
                                                        onMouseLeave={e => { if (!alreadyAdded) { e.currentTarget.style.borderColor = pi.color + "30"; e.currentTarget.style.background = "#fff"; } }}
                                                    >
                                                        <IconComp size={22} />
                                                        <span style={{ fontSize: 10, fontWeight: 600, color: alreadyAdded ? "#CBD5E1" : "#475569" }}>
                                                            {pi.label}
                                                        </span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 16 }}>
                                            <Btn variant="ghost" onClick={() => setShowPerkPicker(false)}>Cancel</Btn>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
                                <Btn variant="ghost" onClick={() => setShowAboutEditor(false)}>Cancel</Btn>
                                <Btn variant="primary" onClick={handleSaveAbout} disabled={savingAbout}>
                                    {savingAbout ? "Saving..." : "Save Changes"}
                                </Btn>
                            </div>
                        </div>
                    </Modal>

                    {/* MODAL: HELP DESK CENTER */}
                    <Modal open={showHelpDesk} onClose={() => setShowHelpDesk(false)} title="Help Desk Center" width={600}>
                        <HelpDeskChatForm />
                    </Modal>

                    {/* MODAL: MESSAGES */}
                    <Modal open={showMsg} onClose={() => setShowMsg(false)} title="Messages" width={780} noPad>
                        <div style={{ display: "flex", height: 520 }}>
                            {/* Conv list */}
                            <div style={{ width: 260, borderRight: `1px solid ${C.s100}`, overflowY: "auto", flexShrink: 0 }}>
                                <div style={{ padding: "12px 16px", borderBottom: `1px solid ${C.s100}` }}>
                                    <div style={{
                                        display: "flex", alignItems: "center", gap: 8, background: C.s50,
                                        border: `1px solid ${C.s200}`, borderRadius: 9, padding: "7px 12px"
                                    }}>
                                        <FiSearch size={13} color={C.s400} />
                                        <input style={{ background: "none", border: "none", fontSize: 12.5, color: C.s900, width: "100%", fontFamily: C.dm }} placeholder="Search messages…" />
                                    </div>
                                </div>
                                {messages.map((conv, i) => (
                                    <div key={conv.id} className={`ep-msg-row${i === activeConv ? " active" : ""}`}
                                        onClick={() => {
                                            setActiveConv(i);
                                            setMessages((current) => current.map((conversation, index) => (
                                                index === i ? { ...conversation, unread: false } : conversation
                                            )));
                                            if (chatSocketRef.current?.connected) {
                                                chatSocketRef.current.emit("thread:join", { threadId: conv.id });
                                            }
                                            authService.markEmployerChatRead(conv.id).catch(() => { });
                                        }}>
                                        <div style={{ position: "relative" }}>
                                            <Avatar initials={conv.avatar} color={conv.color} size={40} radius={12} />
                                            {conv.unread && (
                                                <div style={{
                                                    position: "absolute", top: 0, right: 0, width: 10, height: 10,
                                                    borderRadius: "50%", background: C.navy, border: "2px solid #fff"
                                                }} />
                                            )}
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                                                <span style={{ fontFamily: C.fd, fontSize: 13, fontWeight: 800, color: C.s900 }}>{conv.from}</span>
                                                <span style={{ fontSize: 11, color: C.s400 }}>{conv.time}</span>
                                            </div>
                                            <div style={{ fontSize: 11.5, color: C.s500, marginBottom: 2 }}>{conv.role}</div>
                                            <div style={{
                                                fontSize: 12, color: conv.unread ? C.s700 : C.s400, fontWeight: conv.unread ? 600 : 400,
                                                whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis"
                                            }}>{conv.preview}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Chat window */}
                            <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
                                {/* Chat header */}
                                <div style={{
                                    padding: "14px 18px", borderBottom: `1px solid ${C.s100}`,
                                    display: "flex", alignItems: "center", gap: 12
                                }}>
                                    <Avatar initials={activeConversation?.avatar || "C"} color={activeConversation?.color || C.navy} size={38} radius={11} />
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontFamily: C.fd, fontSize: 14, fontWeight: 800, color: C.s900 }}>{activeConversation?.from || "Conversation"}</div>
                                        <div style={{ fontSize: 12, color: C.s400 }}>{activeConversation?.role || "Candidate"}</div>
                                    </div>
                                    <div style={{ display: "flex", gap: 6 }}>
                                        {CALLS_ENABLED && (
                                            <>
                                                <button onClick={() => startCall("AUDIO")} style={{ width: 32, height: 32, borderRadius: 8, background: C.s50, border: `1px solid ${C.s200}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: C.s500 }}><FiPhone size={13} /></button>
                                                <button onClick={() => startCall("VIDEO")} style={{ width: 32, height: 32, borderRadius: 8, background: C.s50, border: `1px solid ${C.s200}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: C.s500 }}><FiVideo size={13} /></button>
                                            </>
                                        )}
                                        <button style={{ width: 32, height: 32, borderRadius: 8, background: C.s50, border: `1px solid ${C.s200}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: C.s500 }}><FiMoreVertical size={13} /></button>
                                    </div>
                                </div>

                                {CALLS_ENABLED && activeConversation?.activeCall?.state === "RINGING" && activeConversation?.activeCall?.initiatedBy === "CANDIDATE" && (
                                    <div style={{
                                        margin: "12px 16px 0",
                                        padding: "12px 14px",
                                        borderRadius: 12,
                                        background: "#fff",
                                        border: `1px solid ${C.s200}`,
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 10,
                                    }}>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontFamily: C.fd, fontWeight: 800, color: C.s900, fontSize: 13.5 }}>
                                                {activeConversation?.from || "Candidate"} is calling
                                            </div>
                                            <div style={{ color: C.s500, fontSize: 12 }}>
                                                {activeConversation?.activeCall?.mediaType === "VIDEO" ? "Video call" : "Audio call"}
                                            </div>
                                        </div>
                                        <Btn variant="green" onClick={acceptIncomingCall}>Accept</Btn>
                                        <Btn variant="danger" onClick={endCall}>Reject</Btn>
                                    </div>
                                )}

                                {/* Messages area */}
                                <div style={{ flex: 1, overflowY: "auto", padding: "16px 18px", display: "flex", flexDirection: "column", gap: 12, background: C.s50 }}>
                                    {(activeConversation?.messages || []).length === 0 ? (
                                        <div style={{
                                            flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
                                            color: C.s400, fontSize: 13.5, fontWeight: 600
                                        }}>
                                            No messages yet. Start the conversation here.
                                        </div>
                                    ) : (
                                        (activeConversation?.messages || []).map((m, i) => (
                                            <div key={i} style={{ display: "flex", justifyContent: m.from === "me" ? "flex-end" : "flex-start" }}>
                                                <div style={{
                                                    maxWidth: "72%", padding: "10px 14px", borderRadius: 14,
                                                    background: m.from === "me" ? C.navy : "#fff",
                                                    border: m.from === "me" ? "none" : `1px solid ${C.s200}`,
                                                    borderBottomRightRadius: m.from === "me" ? 4 : 14,
                                                    borderBottomLeftRadius: m.from === "me" ? 14 : 4
                                                }}>
                                                    <div style={{ fontSize: 13.5, color: m.from === "me" ? "#fff" : C.s800, lineHeight: 1.55 }}>{m.text}</div>
                                                    <div style={{ fontSize: 10.5, color: m.from === "me" ? "rgba(255,255,255,.55)" : C.s400, marginTop: 4, textAlign: "right" }}>{m.time}</div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                    <div ref={chatEndRef} />
                                </div>

                                {/* Input bar */}
                                <div style={{ padding: "12px 16px", borderTop: `1px solid ${C.s100}`, background: "#fff" }}>
                                    <div style={{
                                        display: "flex", alignItems: "center", gap: 8, background: C.s50,
                                        border: `1.5px solid ${C.s200}`, borderRadius: 12, padding: "8px 14px"
                                    }}>
                                        <input
                                            style={{
                                                flex: 1, background: "none", border: "none", outline: "none", fontSize: 13.5,
                                                color: C.s900, fontFamily: C.dm
                                            }}
                                            placeholder="Write a message…"
                                            value={msgInput}
                                            onChange={e => setMsgInput(e.target.value)}
                                            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                                        />
                                        <div style={{ display: "flex", gap: 6 }}>
                                            {[FiPaperclip, FiSmile].map((Icon, i) => (
                                                <button key={i} style={{
                                                    width: 28, height: 28, borderRadius: 7, background: "transparent",
                                                    border: "none", display: "flex", alignItems: "center", justifyContent: "center",
                                                    cursor: "pointer", color: C.s400
                                                }}>
                                                    <Icon size={14} />
                                                </button>
                                            ))}
                                            <button onClick={sendMessage}
                                                style={{
                                                    width: 32, height: 32, borderRadius: 9, background: C.navy, border: "none",
                                                    display: "flex", alignItems: "center", justifyContent: "center",
                                                    cursor: "pointer", color: "#fff"
                                                }}>
                                                <FiSend size={13} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Modal>

                    {CALLS_ENABLED && (
                        <Modal open={showCall} onClose={endCall} title={`${callMode === "VIDEO" ? "Video" : "Audio"} Call`} width={560} noPad>
                            <div style={{ padding: 20, display: "grid", gap: 16 }}>
                                <div style={{
                                    display: "flex", alignItems: "center", justifyContent: "space-between",
                                    padding: "14px 16px", borderRadius: 14, background: C.s50, border: `1px solid ${C.s200}`
                                }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                        <div>
                                            <div style={{ fontFamily: C.fd, fontWeight: 800, color: C.s900, marginBottom: 4 }}>
                                                {activeConversation?.from || "Candidate"}
                                            </div>
                                            <div style={{ fontSize: 12.5, color: C.s500 }}>
                                                {callStatus === "ringing" ? "Waiting for the candidate to join" : callStatus === "connecting" ? "Connecting secure call session" : "Call ready"}
                                            </div>
                                        </div>
                                        {isCallConnected && (
                                            <div style={{
                                                width: 12,
                                                height: 12,
                                                borderRadius: "50%",
                                                background: "#10b981",
                                                boxShadow: "0 0 8px rgba(16, 185, 129, 0.6)",
                                                animation: "pulse 2s infinite"
                                            }} />
                                        )}
                                    </div>
                                    <Tag color={callMode === "VIDEO" ? C.indigo : C.green}>{callMode}</Tag>
                                </div>

                                <div style={{
                                    borderRadius: 16,
                                    overflow: "hidden",
                                    background: "#0f172a",
                                    minHeight: 220,
                                    position: "relative",
                                    border: `1px solid ${C.s200}`,
                                }}>
                                    {callMode === "VIDEO" ? (
                                        <div style={{ position: "relative", width: "100%", height: 320, background: "#111827" }}>
                                            {remoteCallStream && (
                                                <video ref={remoteVideoRef} autoPlay playsInline style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                            )}
                                            <video ref={callPreviewRef} autoPlay muted playsInline style={{ position: "absolute", bottom: 16, right: 16, width: 100, height: 140, objectFit: "cover", borderRadius: 8, border: "2px solid rgba(255,255,255,0.2)", background: "#000", zIndex: 10, display: localCallStream ? "block" : "none" }} />
                                            {!remoteCallStream && (
                                                <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 13, flexDirection: "column", gap: 10 }}>
                                                    <Avatar initials={activeConversation?.avatar || "C"} color={activeConversation?.color || C.navy} size={50} radius={16} fontSize={16} />
                                                    Connecting secure video stream...
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div style={{
                                            minHeight: 220,
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            color: "#fff",
                                            flexDirection: "column",
                                            gap: 10,
                                            padding: 20,
                                            textAlign: "center",
                                        }}>
                                            <Avatar initials={activeConversation?.avatar || "C"} color={activeConversation?.color || C.navy} size={64} radius={20} fontSize={20} />
                                            <div style={{ fontFamily: C.fd, fontSize: 18, fontWeight: 800 }}>{activeConversation?.from || "Candidate"}</div>
                                            <div style={{ color: "rgba(255,255,255,.72)", fontSize: 13 }}>
                                                Secure audio call in progress
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
                                    <div style={{ fontSize: 12.5, color: C.s500 }}>
                                        The call is negotiated through Socket.IO signaling and browser media permissions.
                                    </div>
                                    <Btn variant="danger" onClick={endCall}>
                                        <FiPhone size={13} /> End Call
                                    </Btn>
                                </div>
                            </div>
                        </Modal>
                    )}

                    {/* MODAL: ANALYTICS */}
                    <Modal open={showAna} onClose={() => setShowAna(false)} title="Analytics Dashboard" width={860}>
                        {/* Tab bar */}
                        <div style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap" }}>
                            {
                                ["overview", "traffic", "pipeline", "sources"].map(t => (
                                    <button key={t} className={`ep-ana-tab${anaTab === t ? " active" : ""}`}
                                        onClick={() => setAnaTab(t)}>
                                        {t.charAt(0).toUpperCase() + t.slice(1)}
                                    </button>
                                ))
                            }
                            <div style={{ marginLeft: "auto" }}>
                                <Btn variant="ghost" style={{ fontSize: 12, padding: "7px 13px" }}><FiDownload size={12} /> Export CSV</Btn>
                            </div>
                        </div>

                        {/* KPI row */}
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 24 }}>
                            {
                                [
                                    { label: "Active Jobs", val: analytics.kpis[0].val, change: analytics.kpis[0].change, up: analytics.kpis[0].up, color: C.navy },
                                    { label: "Applications", val: analytics.kpis[1].val, change: analytics.kpis[1].change, up: analytics.kpis[1].up, color: C.green },
                                    { label: "Shortlisted", val: analytics.kpis[2].val, change: analytics.kpis[2].change, up: analytics.kpis[2].up, color: C.amber },
                                    { label: "Offers Sent", val: analytics.kpis[3].val, change: analytics.kpis[3].change, up: analytics.kpis[3].up, color: C.indigo },
                                ].map((k, i) => (
                                    <div key={i} style={{
                                        padding: "14px 16px", borderRadius: 13,
                                        background: k.color + "08", border: `1px solid ${k.color}18`
                                    }}>
                                        <div style={{
                                            fontSize: 11, fontWeight: 800, color: k.color, textTransform: "uppercase",
                                            letterSpacing: ".1em", fontFamily: C.fd, marginBottom: 6
                                        }}>{k.label}</div>
                                        <div style={{
                                            fontFamily: C.fd, fontSize: 24, fontWeight: 800, color: C.s900,
                                            letterSpacing: "-0.03em", marginBottom: 4
                                        }}>{k.val}</div>
                                        <div style={{
                                            display: "inline-flex", alignItems: "center", gap: 4,
                                            fontSize: 11, fontWeight: 800, color: k.up ? "#059669" : "#dc2626",
                                            background: k.up ? "#ecfdf5" : "#fef2f2", padding: "2px 8px", borderRadius: 100
                                        }}>
                                            {k.up ? <FiArrowUp size={9} /> : <FiArrowDown size={9} />}{k.change} this month
                                        </div>
                                    </div>
                                ))
                            }
                        </div>

                        {(anaTab === "overview" || anaTab === "traffic") && (
                            <>
                                {/* Line charts */}
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
                                    {[
                                        { label: "Job Posts by Month", data: analytics.monthlyJobs, color: C.navy },
                                        { label: "Applications by Month", data: analytics.monthlyApplications, color: C.green },
                                    ].map((chart, i) => (
                                        <div key={i} style={{ padding: "16px", borderRadius: 14, border: `1px solid ${C.s200}`, background: "#fff" }}>
                                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                                                <div style={{ fontFamily: C.fd, fontSize: 14, fontWeight: 800, color: C.s900 }}>{chart.label}</div>
                                                <div style={{ display: "flex", gap: 6 }}>
                                                    {["7d", "30d", "90d"].map(r => (
                                                        <button key={r} style={{
                                                            padding: "3px 9px", borderRadius: 6, fontSize: 11, fontWeight: 700,
                                                            background: r === "30d" ? chart.color + "14" : "transparent",
                                                            color: r === "30d" ? chart.color : C.s400, border: "none", cursor: "pointer", fontFamily: C.fd
                                                        }}>
                                                            {r}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                            <LineChart data={chart.data} color={chart.color} height={130} />
                                            {/* Month labels */}
                                            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
                                                {analytics.monthLabels.map((m, mi) => (
                                                    <span key={mi} style={{ fontSize: 9.5, color: C.s400, fontFamily: C.dm }}>{m}</span>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Bar chart - Monthly Applications */}
                                <div style={{ padding: "16px", borderRadius: 14, border: `1px solid ${C.s200}`, background: "#fff", marginBottom: 24 }}>
                                    <div style={{ fontFamily: C.fd, fontSize: 14, fontWeight: 800, color: C.s900, marginBottom: 12 }}>Monthly Applications</div>
                                    <BarChart
                                        data={analytics.monthlyApplications}
                                        colors={analytics.monthLabels.map((_, i) => i === analytics.monthLabels.length - 1 ? C.green : C.navy + "99")}
                                        labels={analytics.monthLabels}
                                        height={130} />
                                </div>
                            </>
                        )}

                        {(anaTab === "sources") && (
                            <div style={{ padding: "16px", borderRadius: 14, border: `1px solid ${C.s200}`, background: "#fff", marginBottom: 24 }}>
                                <div style={{ fontFamily: C.fd, fontSize: 14, fontWeight: 800, color: C.s900, marginBottom: 16 }}>Application Sources</div>
                                <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
                                    {/* Donut */}
                                    <div style={{ position: "relative", width: 160, height: 160, flexShrink: 0 }}>
                                        <svg width="160" height="160" viewBox="0 0 160 160" style={{ transform: "rotate(-90deg)" }}>
                                            <circle cx="80" cy="80" r="62" fill="none" stroke={C.s100} strokeWidth="14" />
                                            {(() => {
                                                const circ = 2 * Math.PI * 62; let off = 0;
                                                return analytics.sourceBreakdown.map((s, i) => {
                                                    const dash = (s.pct / 100) * circ;
                                                    const el = <circle key={i} cx="80" cy="80" r="62" fill="none"
                                                        stroke={s.color} strokeWidth="14" strokeLinecap="butt"
                                                        strokeDasharray={`${dash - 1.5} ${circ - dash + 1.5}`}
                                                        strokeDashoffset={-off * circ / 100} />;
                                                    off += s.pct; return el;
                                                });
                                            })()}
                                        </svg>
                                        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                                            <div style={{ fontFamily: C.fd, fontSize: 22, fontWeight: 800, color: C.s900 }}>{formatCompactNumber(tracking.totalApplications ?? normalizedApplications.length ?? 0)}</div>
                                            <div style={{ fontSize: 10, color: C.s400, fontWeight: 700, textTransform: "uppercase" }}>Total</div>
                                        </div>
                                    </div>
                                    {/* Legend + bars */}
                                    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 12 }}>
                                        {analytics.sourceBreakdown.map((s, i) => (
                                            <div key={i} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                                <div style={{ width: 10, height: 10, borderRadius: 3, background: s.color, flexShrink: 0 }} />
                                                <span style={{ fontSize: 13, fontWeight: 600, color: C.s700, width: 100, flexShrink: 0 }}>{s.label}</span>
                                                <div style={{ flex: 1, height: 8, borderRadius: 100, background: C.s100 }}>
                                                    <div style={{ height: "100%", borderRadius: 100, background: s.color, width: `${s.pct}%` }} />
                                                </div>
                                                <span style={{ fontSize: 13, fontWeight: 800, color: s.color, fontFamily: C.fd, width: 36, textAlign: "right" }}>{s.pct}%</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {(anaTab === "pipeline") && (
                            <div style={{ padding: "16px", borderRadius: 14, border: `1px solid ${C.s200}`, background: "#fff", marginBottom: 24 }}>
                                <div style={{ fontFamily: C.fd, fontSize: 14, fontWeight: 800, color: C.s900, marginBottom: 16 }}>Hiring Funnel</div>
                                <FunnelChart data={analytics.funnelData} />
                                <div style={{
                                    marginTop: 20, padding: "14px 16px", borderRadius: 12,
                                    background: `linear-gradient(135deg,rgba(0,35,102,.04),rgba(16,185,129,.04))`,
                                    border: `1px solid rgba(0,35,102,.08)`, display: "flex", gap: 24, flexWrap: "wrap"
                                }}>
                                    <div>
                                        <div style={{ fontSize: 10.5, fontWeight: 800, color: C.s400, textTransform: "uppercase", letterSpacing: ".1em", marginBottom: 3 }}>Offer Conversion</div>
                                        <div style={{ fontFamily: C.fd, fontSize: 22, fontWeight: 800, color: C.s900 }}>0.93%</div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: 10.5, fontWeight: 800, color: C.s400, textTransform: "uppercase", letterSpacing: ".1em", marginBottom: 3 }}>Avg. Time to Hire</div>
                                        <div style={{ fontFamily: C.fd, fontSize: 22, fontWeight: 800, color: C.s900 }}>18 days</div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: 10.5, fontWeight: 800, color: C.s400, textTransform: "uppercase", letterSpacing: ".1em", marginBottom: 3 }}>Offer Acceptance</div>
                                        <div style={{ fontFamily: C.fd, fontSize: 22, fontWeight: 800, color: C.green }}>84%</div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </Modal>
                    {/* MODAL: PREMIUM X */}
                    <Modal open={showPro} onClose={() => setShowPro(false)} title="Premium X - Supercharge Hiring" width={760}>
                        <div style={{
                            background: `linear-gradient(135deg,#002366,#1a3a6e)`,
                            border: `1px solid #2d4a8e`, borderRadius: 14, padding: "20px 22px", marginBottom: 24,
                            display: "flex", gap: 16, alignItems: "center"
                        }}>
                            <div style={{
                                width: 52, height: 52, borderRadius: 14, background: "rgba(255,255,255,.15)",
                                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0
                            }}>
                                <FiZap size={24} color="#fff" />
                            </div>
                            <div>
                                <div style={{ fontFamily: C.fd, fontSize: 18, fontWeight: 800, color: "#fff", marginBottom: 4 }}>Premium X Hiring Suite</div>
                                <div style={{ fontSize: 13.5, color: "rgba(255,255,255,.65)", lineHeight: 1.6 }}>
                                    A production-ready recruiting layer for employers who need verified reach, faster screening, stronger employer branding, and measurable hiring outcomes.
                                </div>
                            </div>
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 24 }}>
                            {[
                                { label: "Target users", value: "HR, founders, agencies" },
                                { label: "Best for", value: "Urgent and volume hiring" },
                                { label: "Core promise", value: "Find, rank, reach" },
                                { label: "Success metric", value: "Shortlist velocity" },
                            ].map((item) => (
                                <div key={item.label} style={{ padding: "12px", borderRadius: 12, background: C.s50, border: `1px solid ${C.s200}` }}>
                                    <div style={{ fontSize: 10.5, fontWeight: 800, color: C.s400, textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 5 }}>{item.label}</div>
                                    <div style={{ fontSize: 12.5, fontWeight: 800, color: C.s800, lineHeight: 1.35 }}>{item.value}</div>
                                </div>
                            ))}
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 24 }}>
                            {[
                                { name: "Starter", price: "INR 4,999", period: "/mo", features: ["5 active jobs", "100 resume views", "Basic candidate filters", "Email support"], color: C.sky, best: false },
                                { name: "Growth", price: "INR 12,999", period: "/mo", features: ["Unlimited jobs", "750 resume views", "AI match scoring", "Multi-channel outreach", "Full hiring analytics"], color: C.navy, best: true },
                                { name: "Enterprise", price: "Custom", period: "", features: ["Everything in Growth", "Dedicated hiring desk", "Custom integrations", "SLA guarantee", "Account manager"], color: C.purple, best: false },
                            ].map((plan, i) => (
                                <div key={i} style={{
                                    borderRadius: 14, border: `2px solid ${plan.best ? plan.color : C.s200}`,
                                    padding: "18px 16px", position: "relative",
                                    background: plan.best ? `linear-gradient(135deg,${plan.color}08,${plan.color}04)` : "#fff",
                                    transition: "all .2s", cursor: "pointer"
                                }}
                                    onMouseEnter={e => { e.currentTarget.style.borderColor = plan.color; e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = `0 12px 32px ${plan.color}18`; }}
                                    onMouseLeave={e => { e.currentTarget.style.borderColor = plan.best ? plan.color : C.s200; e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; }}>
                                    {plan.best && (
                                        <div style={{
                                            position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)",
                                            background: C.navy, color: "#fff", fontSize: 10.5, fontWeight: 800,
                                            padding: "3px 12px", borderRadius: 100, fontFamily: C.fd, whiteSpace: "nowrap"
                                        }}>
                                            Most Popular
                                        </div>
                                    )}
                                    <div style={{ fontFamily: C.fd, fontSize: 15, fontWeight: 800, color: plan.color, marginBottom: 6 }}>{plan.name}</div>
                                    <div style={{ display: "flex", alignItems: "baseline", gap: 2, marginBottom: 14 }}>
                                        <span style={{ fontFamily: C.fd, fontSize: 26, fontWeight: 800, color: C.s900 }}>{plan.price}</span>
                                        <span style={{ fontSize: 13, color: C.s400 }}>{plan.period}</span>
                                    </div>
                                    <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 7, marginBottom: 16 }}>
                                        {plan.features.map((f, fi) => (
                                            <li key={fi} style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12.5, color: C.s700, fontWeight: 500 }}>
                                                <FiCheckCircle size={13} color={plan.color} />{f}
                                            </li>
                                        ))}
                                    </ul>
                                    <Btn variant={plan.best ? "primary" : "ghost"}
                                        style={{ width: "100%", justifyContent: "center", fontSize: 12.5, ...(plan.best ? { background: plan.color } : {}) }}>
                                        {plan.price === "Custom" ? "Contact Sales" : "Get Started"}
                                    </Btn>
                                </div>
                            ))}
                        </div>

                        <div style={{ borderTop: `1px solid ${C.s100}`, paddingTop: 20 }}>
                            <div style={{ fontFamily: C.fd, fontSize: 14, fontWeight: 800, color: C.s900, marginBottom: 14 }}>What Premium X adds to the employer dashboard</div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                                {[
                                    { icon: FiUserCheck, label: "AI shortlist workspace", desc: "Rank candidates by JD fit, skills, salary, location, and notice period" },
                                    { icon: FiMessageSquare, label: "Recruiter outreach desk", desc: "Use chat, email templates, WhatsApp nudges, and follow-up reminders" },
                                    { icon: FiBarChart2, label: "Hiring intelligence", desc: "Track source quality, funnel conversion, time-to-shortlist, and offer signals" },
                                    { icon: FiAward, label: "Featured employer brand", desc: "Boost company profile, job cards, and recruiter trust badges" },
                                    { icon: FiShield, label: "Verified candidate layer", desc: "Prioritize profiles with resume, identity, and skill confidence signals" },
                                    { icon: FiCpu, label: "ATS-ready workflows", desc: "Export CSV, attach notes, and prepare integration-friendly pipelines" },
                                ].map((f, i) => (
                                    <div key={i} style={{ display: "flex", gap: 10, padding: "12px 14px", borderRadius: 11, background: C.s50, border: `1px solid ${C.s200}` }}>
                                        <div style={{ width: 32, height: 32, borderRadius: 9, background: C.navy + "10", display: "flex", alignItems: "center", justifyContent: "center", color: C.navy, flexShrink: 0 }}>
                                            <f.icon size={14} />
                                        </div>
                                        <div>
                                            <div style={{ fontSize: 12.5, fontWeight: 800, color: C.s900, marginBottom: 2 }}>{f.label}</div>
                                            <div style={{ fontSize: 11.5, color: C.s500 }}>{f.desc}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </Modal>
                    {/* MODAL: POST A JOB */}
                    <Modal open={showPost} onClose={() => setShowPost(false)} title="Post a New Job" width={620}>
                        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                            {[
                                { label: "Job Title", placeholder: "e.g. Senior Product Designer", type: "text" },
                                { label: "Department", placeholder: "e.g. Design, Engineering, Product", type: "text" },
                                { label: "Location", placeholder: "e.g. Bengaluru · Hybrid", type: "text" },
                                { label: "Salary Range", placeholder: "e.g. ₹18–26 LPA", type: "text" },
                            ].map((f, i) => (
                                <div key={i}>
                                    <label style={{ display: "block", fontSize: 12.5, fontWeight: 700, color: C.s700, marginBottom: 6 }}>{f.label}</label>
                                    <input type={f.type} placeholder={f.placeholder}
                                        style={{
                                            width: "100%", padding: "10px 14px", borderRadius: 10, border: `1.5px solid ${C.s200}`,
                                            fontSize: 13.5, color: C.s900, background: "#fff", fontFamily: C.dm, transition: "border-color .16s"
                                        }}
                                        onFocus={e => e.target.style.borderColor = C.navy}
                                        onBlur={e => e.target.style.borderColor = C.s200} />
                                </div>
                            ))}
                            <div>
                                <label style={{ display: "block", fontSize: 12.5, fontWeight: 700, color: C.s700, marginBottom: 6 }}>Job Description</label>
                                <textarea placeholder="Describe the role, responsibilities, and requirements…" rows={5}
                                    style={{
                                        width: "100%", padding: "10px 14px", borderRadius: 10, border: `1.5px solid ${C.s200}`,
                                        fontSize: 13.5, color: C.s900, background: "#fff", fontFamily: C.dm, resize: "vertical", transition: "border-color .16s"
                                    }}
                                    onFocus={e => e.target.style.borderColor = C.navy}
                                    onBlur={e => e.target.style.borderColor = C.s200} />
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                                <div>
                                    <label style={{ display: "block", fontSize: 12.5, fontWeight: 700, color: C.s700, marginBottom: 6 }}>Job Type</label>
                                    <select style={{
                                        width: "100%", padding: "10px 14px", borderRadius: 10, border: `1.5px solid ${C.s200}`,
                                        fontSize: 13.5, color: C.s700, background: "#fff", fontFamily: C.dm, cursor: "pointer"
                                    }}>
                                        <option>Full-time</option><option>Part-time</option><option>Contract</option><option>Internship</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: "block", fontSize: 12.5, fontWeight: 700, color: C.s700, marginBottom: 6 }}>Experience Level</label>
                                    <select style={{
                                        width: "100%", padding: "10px 14px", borderRadius: 10, border: `1.5px solid ${C.s200}`,
                                        fontSize: 13.5, color: C.s700, background: "#fff", fontFamily: C.dm, cursor: "pointer"
                                    }}>
                                        <option>Mid-level (3–5 yrs)</option><option>Entry level</option><option>Senior (5–8 yrs)</option><option>Lead / Principal</option>
                                    </select>
                                </div>
                            </div>
                            {/* Urgency toggle */}
                            <div style={{
                                display: "flex", alignItems: "center", justifyContent: "space-between",
                                padding: "12px 14px", borderRadius: 11, background: "#fff8f0", border: "1px solid #fed7aa"
                            }}>
                                <div>
                                    <div style={{ fontSize: 13, fontWeight: 700, color: "#92400e" }}>Mark as Urgent</div>
                                    <div style={{ fontSize: 12, color: "#b45309" }}>Urgent jobs get a badge and higher visibility</div>
                                </div>
                                <div style={{
                                    width: 44, height: 24, borderRadius: 100, background: C.amber, cursor: "pointer",
                                    display: "flex", alignItems: "center", paddingLeft: 22, transition: "all .2s"
                                }}>
                                    <div style={{ width: 18, height: 18, borderRadius: "50%", background: "#fff", boxShadow: "0 1px 4px rgba(0,0,0,.2)" }} />
                                </div>
                            </div>
                            {/* Actions */}
                            <div style={{ display: "flex", gap: 10, paddingTop: 4 }}>
                                <Btn variant="ghost" onClick={() => setShowPost(false)} style={{ flex: 1, justifyContent: "center" }}>Save Draft</Btn>
                                <Btn variant="primary" style={{ flex: 2, justifyContent: "center", fontSize: 14 }}><FiBriefcase size={14} /> Publish Job</Btn>
                            </div>
                        </div>
                    </Modal>

                    {/* ─── View Job Modal ─── */}
                    <Modal open={showViewJob} onClose={() => setShowViewJob(false)} title={selectedJob?.title || "Job Details"} width={720}>
                        {selectedJob && (
                            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>

                                {/* Job Header Card */}
                                <div style={{
                                    background: `linear-gradient(135deg, #002366, #1a3a6e)`, borderRadius: 16,
                                    padding: "20px 24px", position: "relative", overflow: "hidden"
                                }}>
                                    <div style={{ position: "absolute", inset: 0, opacity: .04, backgroundImage: "radial-gradient(#fff 1px,transparent 1px)", backgroundSize: "22px 22px" }} />
                                    <div style={{ position: "relative", zIndex: 1, display: "flex", alignItems: "flex-start", gap: 14 }}>
                                        <div style={{
                                            width: 52, height: 52, borderRadius: 14, background: "rgba(255,255,255,.12)",
                                            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0
                                        }}>
                                            <FiBriefcase size={24} color="#fff" />
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontFamily: C.fd, fontSize: 19, fontWeight: 800, color: "#fff", marginBottom: 2 }}>{selectedJob.title}</div>
                                            <div style={{ fontSize: 13, color: "rgba(255,255,255,.6)", display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                                                <FiMapPin size={12} />
                                                <span>{selectedJob.department || selectedJob.dept || "—"} &middot; {selectedJob.location || selectedJob.loc || "—"}</span>
                                            </div>
                                        </div>
                                        <div style={{
                                            padding: "5px 12px", borderRadius: 100, background: "rgba(16,185,129,.15)",
                                            border: "1px solid rgba(16,185,129,.3)", fontSize: 11.5, fontWeight: 800,
                                            color: "#34d399", fontFamily: C.fd, letterSpacing: ".04em", flexShrink: 0
                                        }}>
                                            {selectedJob.jobType || selectedJob.type || "Full-time"}
                                        </div>
                                    </div>
                                </div>

                                {/* Stats Grid */}
                                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
                                    {[
                                        { icon: FiCalendar, label: "Posted", val: selectedJob.lastUpdated || selectedJob.posted || "Recent", color: "#6366f1", bg: "#f5f3ff" },
                                        { icon: FiUsers, label: "Applicants", val: String(selectedJob.applicantCount ?? selectedJob.apps ?? 0), color: "#10b981", bg: "#ecfdf5" },
                                        { icon: FiDollarSign, label: "Salary", val: selectedJob.salary || "Not disclosed", color: "#f59e0b", bg: "#fffbeb" },
                                    ].map((item, idx) => (
                                        <div key={idx} style={{
                                            padding: "14px 16px", borderRadius: 12, background: item.bg,
                                            border: `1px solid ${item.color}20`, display: "flex", alignItems: "center", gap: 12
                                        }}>
                                            <div style={{
                                                width: 40, height: 40, borderRadius: 11, background: item.color + "16",
                                                display: "flex", alignItems: "center", justifyContent: "center", color: item.color, flexShrink: 0
                                            }}>
                                                <item.icon size={18} />
                                            </div>
                                            <div>
                                                <div style={{ fontSize: 11, fontWeight: 800, color: item.color, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 2 }}>{item.label}</div>
                                                <div style={{ fontSize: 15, fontWeight: 800, color: C.s900, fontFamily: C.fd }}>{item.val}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Candidates Section */}
                                <div>
                                    {(() => {
                                        const jobApps = normalizedApplications.filter(a => a.jobId === selectedJob.id);
                                        const totalCount = jobApps.length;

                                        const statusGroups = [
                                            { key: "NEW", label: "New", statuses: ["APPLIED"], color: "#6366f1", bg: "#f5f3ff" },
                                            { key: "SCREENING", label: "Screening", statuses: ["SCREENING"], color: "#0ea5e9", bg: "#f0f9ff" },
                                            { key: "SHORTLISTED", label: "Shortlisted", statuses: ["SHORTLISTED"], color: "#002366", bg: "#eef2ff" },
                                            { key: "INTERVIEW", label: "Interview", statuses: ["INTERVIEW"], color: "#f59e0b", bg: "#fffbeb" },
                                            { key: "OFFERED", label: "Offer", statuses: ["OFFERED", "HIRED"], color: "#10b981", bg: "#ecfdf5" },
                                            { key: "REJECTED", label: "Rejected", statuses: ["REJECTED"], color: "#ef4444", bg: "#fef2f2" },
                                        ];

                                        const grouped = statusGroups.map(group => ({
                                            ...group,
                                            apps: jobApps.filter(a => group.statuses.includes((a.status || "").toUpperCase())),
                                        })).filter(g => g.apps.length > 0);

                                        const ungrouped = jobApps.filter(a =>
                                            !statusGroups.some(g => g.statuses.includes((a.status || "").toUpperCase()))
                                        );

                                        return (
                                            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                                    <div style={{ fontFamily: C.fd, fontSize: 15, fontWeight: 800, color: C.s900 }}>Candidates</div>
                                                    <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, color: C.s500, fontWeight: 600 }}>
                                                        <FiUsers size={14} /> <span style={{ fontWeight: 800, color: C.navy }}>{totalCount}</span> total
                                                    </div>
                                                </div>

                                                {totalCount === 0 ? (
                                                    <div style={{
                                                        padding: "36px 24px", textAlign: "center", borderRadius: 14,
                                                        background: C.s50, border: `1.5px dashed ${C.s200}`, color: C.s400
                                                    }}>
                                                        <div style={{ width: 48, height: 48, borderRadius: 14, background: C.s100, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px", color: C.s300 }}>
                                                            <FiUsers size={22} />
                                                        </div>
                                                        <div style={{ fontSize: 14, fontWeight: 700, color: C.s500, marginBottom: 4 }}>No applications yet</div>
                                                        <div style={{ fontSize: 12.5, color: C.s400 }}>Candidates will appear here once they apply.</div>
                                                    </div>
                                                ) : (
                                                    <>
                                                        {/* Grouped candidates by status */}
                                                        {grouped.map(group => (
                                                            <div key={group.key} style={{ borderRadius: 12, border: `1px solid ${C.s200}`, overflow: "hidden" }}>
                                                                <div style={{
                                                                    display: "flex", alignItems: "center", gap: 8, padding: "10px 14px",
                                                                    background: group.bg, borderBottom: `1px solid ${C.s200}`,
                                                                }}>
                                                                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: group.color }} />
                                                                    <span style={{ fontSize: 12.5, fontWeight: 800, color: group.color, fontFamily: C.fd }}>{group.label}</span>
                                                                    <span style={{
                                                                        marginLeft: "auto", fontSize: 11, fontWeight: 800, color: "#fff",
                                                                        background: group.color, padding: "1px 8px", borderRadius: 100, minWidth: 18, textAlign: "center"
                                                                    }}>{group.apps.length}</span>
                                                                </div>
                                                                <div style={{ display: "flex", flexDirection: "column" }}>
                                                                    {group.apps.map((app, ai) => (
<div key={app.id} style={{
                                                                             display: "flex", alignItems: "center", gap: 12, padding: "11px 14px",
                                                                             borderBottom: ai < group.apps.length - 1 ? `1px solid ${C.s100}` : "none",
                                                                             transition: "background .15s", cursor: "pointer"
                                                                         }}
                                                                             onClick={() => { setSelectedCandidateApp(app); setShowCandidateModal(true); }}
                                                                             onMouseEnter={e => e.currentTarget.style.background = C.s50}
                                                                             onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                                                                         >
                                                                             <div style={{
                                                                                 width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                                                                                 background: app.candidateLogoUrl ? `url("${app.candidateLogoUrl}") center/cover no-repeat` : `linear-gradient(135deg, ${group.color}18, ${group.color}08)`,
                                                                                 backgroundSize: "cover",
                                                                                 display: "flex", alignItems: "center", justifyContent: "center",
                                                                                 color: group.color, fontWeight: 800, fontSize: 13, fontFamily: C.fd
                                                                             }}>
                                                                                 {!app.candidateLogoUrl && (app.candidateName ? app.candidateName.slice(0, 2).toUpperCase() : "C")}
                                                                             </div>
                                                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                                                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                                                                                    <span style={{ fontSize: 13.5, fontWeight: 700, color: C.s800 }}>{app.candidateName || "Unknown Candidate"}</span>
                                                                                    {app.matchScore != null && (
                                                                                        <span style={{ fontSize: 10.5, fontWeight: 800, color: "#fff", background: app.matchScore >= 80 ? "#10b981" : app.matchScore >= 60 ? "#f59e0b" : "#94a3b8", padding: "1px 7px", borderRadius: 100 }}>{app.matchScore}%</span>
                                                                                    )}
                                                                                </div>
                                                                                <div style={{ fontSize: 11.5, color: C.s500, display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
                                                                                    <span style={{ color: C.s400 }}>{app.candidateEmail || "—"}</span>
                                                                                    {app.candidateCurrentTitle && (
                                                                                        <>
                                                                                            <span style={{ color: C.s300 }}>|</span>
                                                                                            <span>{app.candidateCurrentTitle}</span>
                                                                                        </>
                                                                                    )}
                                                                                    <span style={{ color: C.s300 }}>|</span>
                                                                                    <span style={{ fontSize: 11, color: C.s400 }}>
                                                                                        {(() => {
                                                                                            try { return new Date(app.appliedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }); }
                                                                                            catch { return "—"; }
                                                                                        })()}
                                                                                    </span>
                                                                                </div>
                                                                            </div>
                                                                            <div style={{ display: "flex", gap: 6, flexShrink: 0, alignItems: "center" }}>
                                                                                {app.resumeUrl ? (
                                                                                    <button onClick={e => { e.stopPropagation(); handlePreviewResume(app.id); }}
                                                                                        style={{
                                                                                            display: "inline-flex", alignItems: "center", gap: 5,
                                                                                            padding: "6px 11px", borderRadius: 8, fontSize: 11.5, fontWeight: 700,
                                                                                            background: "#fff", color: C.navy, border: `1px solid ${C.navy}25`,
                                                                                            cursor: "pointer", fontFamily: C.fd, transition: "all .15s"
                                                                                        }}
                                                                                        onMouseEnter={e => { e.currentTarget.style.background = C.navy + "08"; e.currentTarget.style.borderColor = C.navy + "50"; }}
                                                                                        onMouseLeave={e => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.borderColor = C.navy + "25"; }}>
                                                                                        <FiFileText size={12} /> Resume
                                                                                    </button>
                                                                                ) : (
                                                                                    <label style={{
                                                                                        display: "inline-flex", alignItems: "center", gap: 5,
                                                                                        padding: "6px 11px", borderRadius: 8, fontSize: 11.5, fontWeight: 700,
                                                                                        background: "#fff", color: C.s500, border: `1px solid ${C.s200}`,
                                                                                        cursor: "pointer", fontFamily: C.fd, transition: "all .15s"
                                                                                    }}
                                                                                        onMouseEnter={e => { e.currentTarget.style.background = C.s50; e.currentTarget.style.borderColor = C.s300; }}
                                                                                        onMouseLeave={e => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.borderColor = C.s200; }}>
                                                                                        <FiUpload size={12} /> {uploadingResumeAppId === app.id ? "Uploading..." : "Upload"}
                                                                                        <input type="file" accept=".pdf,application/pdf" style={{ display: "none" }}
                                                                                            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleResumeUpload(app.id, f); e.target.value = ""; }} />
                                                                                    </label>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        ))}

                                                        {/* Ungrouped fallback */}
                                                        {ungrouped.length > 0 && (
                                                            <div style={{ borderRadius: 12, border: `1px solid ${C.s200}`, overflow: "hidden" }}>
                                                                <div style={{
                                                                    display: "flex", alignItems: "center", gap: 8, padding: "10px 14px",
                                                                    background: C.s50, borderBottom: `1px solid ${C.s200}`,
                                                                }}>
                                                                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: C.s400 }} />
                                                                    <span style={{ fontSize: 12.5, fontWeight: 800, color: C.s500, fontFamily: C.fd }}>Other</span>
                                                                    <span style={{
                                                                        marginLeft: "auto", fontSize: 11, fontWeight: 800, color: "#fff",
                                                                        background: C.s400, padding: "1px 8px", borderRadius: 100
                                                                    }}>{ungrouped.length}</span>
                                                                </div>
{ungrouped.map((app, ai) => (
                                                                        <div key={app.id} style={{ padding: "11px 14px", borderBottom: ai < ungrouped.length - 1 ? `1px solid ${C.s100}` : "none", display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}
                                                                            onClick={() => { setSelectedCandidateApp(app); setShowCandidateModal(true); }}
                                                                            onMouseEnter={e => e.currentTarget.style.background = C.s50}
                                                                            onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                                                                        >
                                                                            <div style={{ width: 36, height: 36, borderRadius: 10, flexShrink: 0, background: app.candidateLogoUrl ? `url("${app.candidateLogoUrl}") center/cover no-repeat` : C.s50, backgroundSize: "cover", display: "flex", alignItems: "center", justifyContent: "center", color: C.s400, fontWeight: 800, fontSize: 13 }}>
                                                                                {!app.candidateLogoUrl && (app.candidateName ? app.candidateName.slice(0, 2).toUpperCase() : "C")}
                                                                            </div>
                                                                        <div style={{ flex: 1, minWidth: 0 }}>
                                                                            <div style={{ fontSize: 13.5, fontWeight: 700, color: C.s800 }}>{app.candidateName || "Unknown Candidate"}</div>
                                                                            <div style={{ fontSize: 11.5, color: C.s500 }}>{app.candidateEmail || "—"}</div>
                                                                        </div>
                                                                        <button onClick={e => { e.stopPropagation(); handlePreviewResume(app.id); }} style={{ padding: "6px 11px", borderRadius: 8, fontSize: 11.5, fontWeight: 700, background: "#fff", color: C.navy, border: `1px solid ${C.navy}25`, cursor: "pointer", fontFamily: C.fd }}>
                                                                            <FiFileText size={12} /> Resume
                                                                        </button>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        );
                                    })()}
                                </div>

                                {/* Actions */}
                                <div style={{ display: "flex", gap: 10, paddingTop: 6, borderTop: `1px solid ${C.s100}` }}>
                                    <button onClick={() => { setShowViewJob(false); setShowEditJob(true); }}
                                        style={{
                                            flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
                                            padding: "11px 0", borderRadius: 10, border: "none",
                                            background: `linear-gradient(135deg, #002366, #1a3a6e)`, color: "#fff",
                                            fontSize: 13.5, fontWeight: 800, fontFamily: C.fd, cursor: "pointer",
                                            boxShadow: "0 4px 14px rgba(0,35,102,.2)", transition: "all .18s"
                                        }}
                                        onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 6px 20px rgba(0,35,102,.3)"; }}
                                        onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "0 4px 14px rgba(0,35,102,.2)"; }}>
                                        <FiEdit2 size={15} /> Edit Listing
                                    </button>
                                    <button onClick={() => setShowViewJob(false)}
                                        style={{
                                            flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
                                            padding: "11px 0", borderRadius: 10, border: `1.5px solid ${C.s200}`,
                                            background: "#fff", color: C.s600, fontSize: 13.5, fontWeight: 700,
                                            fontFamily: C.dm, cursor: "pointer", transition: "all .15s"
                                        }}
                                        onMouseEnter={e => { e.currentTarget.style.background = C.s50; e.currentTarget.style.borderColor = C.s300; }}
                                        onMouseLeave={e => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.borderColor = C.s200; }}>
                                        Close
                                    </button>
                                </div>
                            </div>
                        )}
                    </Modal>

                    {/* ─── Edit Job Modal ─── */}
                    <Modal open={showEditJob} onClose={() => setShowEditJob(false)} title="Edit Job Listing" width={720}>
                        {selectedJob && (
                            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>

                                {/* Tabs with icons */}
                                <div style={{ display: "flex", gap: 0, borderBottom: `1.5px solid ${C.s100}`, marginBottom: 20 }}>
                                    {[
                                        { key: "basic", label: "Basic Info", icon: FiEdit2 },
                                        { key: "screening", label: "Screening Questions", icon: FiFileText },
                                    ].map((tab) => (
                                        <button key={tab.key} onClick={() => setEditJobTab(tab.key)}
                                            style={{
                                                display: "inline-flex", alignItems: "center", gap: 7,
                                                padding: "10px 20px", fontSize: 13, fontWeight: 700, fontFamily: C.fd,
                                                color: editJobTab === tab.key ? C.navy : C.s400, background: "none", border: "none",
                                                borderBottom: editJobTab === tab.key ? `2.5px solid ${C.navy}` : "2.5px solid transparent",
                                                cursor: "pointer", transition: "all .14s"
                                            }}>
                                            <tab.icon size={15} />
                                            {tab.label}
                                        </button>
                                    ))}
                                </div>

                                {/* Error banner */}
                                {editError && (
                                    <div style={{
                                        display: "flex", alignItems: "center", gap: 8, padding: "10px 14px",
                                        borderRadius: 10, background: "#fef2f2", border: "1px solid #fecaca",
                                        color: "#dc2626", fontSize: 12.5, fontWeight: 600, marginBottom: 14
                                    }}>
                                        <FiAlertCircle size={15} style={{ flexShrink: 0 }} />
                                        {editError}
                                    </div>
                                )}

                                {/* ── Basic Info Tab ── */}
                                {editJobTab === "basic" && (
                                    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

                                        {/* Section: Role Details */}
                                        <div>
                                            <div style={{ fontSize: 11, fontWeight: 800, color: C.s400, textTransform: "uppercase", letterSpacing: ".1em", marginBottom: 10 }}>Role Details</div>
                                            <div style={{ background: C.s50, borderRadius: 12, padding: 16, border: `1px solid ${C.s100}`, display: "flex", flexDirection: "column", gap: 14 }}>
                                                <div>
                                                    <label style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 700, color: C.s700, marginBottom: 5 }}>
                                                        Job Title <span style={{ color: "#dc2626" }}>*</span>
                                                    </label>
                                                    <input value={editFormData.title} onChange={e => handleEditFormChange("title", e.target.value)}
                                                        placeholder="e.g. Senior UX Designer"
                                                        style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: `1.5px solid ${C.s200}`, fontSize: 13.5, color: C.s900, fontFamily: C.dm, outline: "none", transition: "border-color .15s" }}
                                                        onFocus={e => e.target.style.borderColor = C.navy} onBlur={e => e.target.style.borderColor = C.s200} />
                                                    {!editFormData.title.trim() && (
                                                        <div style={{ fontSize: 11, color: "#dc2626", marginTop: 4, fontWeight: 600 }}>Job title is required</div>
                                                    )}
                                                </div>
                                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                                                    <div>
                                                        <label style={{ fontSize: 12, fontWeight: 700, color: C.s700, marginBottom: 5, display: "block" }}>Department</label>
                                                        <input value={editFormData.department} onChange={e => handleEditFormChange("department", e.target.value)}
                                                            placeholder="e.g. Engineering"
                                                            style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: `1.5px solid ${C.s200}`, fontSize: 13.5, color: C.s900, fontFamily: C.dm, outline: "none", transition: "border-color .15s" }}
                                                            onFocus={e => e.target.style.borderColor = C.navy} onBlur={e => e.target.style.borderColor = C.s200} />
                                                    </div>
                                                    <div>
                                                        <label style={{ fontSize: 12, fontWeight: 700, color: C.s700, marginBottom: 5, display: "block" }}>Location</label>
                                                        <input value={editFormData.location} onChange={e => handleEditFormChange("location", e.target.value)}
                                                            placeholder="e.g. Dehradun, Uttarakhand"
                                                            style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: `1.5px solid ${C.s200}`, fontSize: 13.5, color: C.s900, fontFamily: C.dm, outline: "none", transition: "border-color .15s" }}
                                                            onFocus={e => e.target.style.borderColor = C.navy} onBlur={e => e.target.style.borderColor = C.s200} />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Section: Description */}
                                        <div>
                                            <div style={{ fontSize: 11, fontWeight: 800, color: C.s400, textTransform: "uppercase", letterSpacing: ".1em", marginBottom: 10 }}>Description</div>
                                            <div style={{ background: C.s50, borderRadius: 12, padding: 16, border: `1px solid ${C.s100}` }}>
                                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 5 }}>
                                                    <label style={{ fontSize: 12, fontWeight: 700, color: C.s700 }}>Job Description</label>
                                                    <span style={{ fontSize: 10.5, fontWeight: 700, color: editFormData.description.length > 5000 ? "#dc2626" : C.s400 }}>
                                                        {editFormData.description.length}/5000
                                                    </span>
                                                </div>
                                                <textarea value={editFormData.description} onChange={e => {
                                                    if (e.target.value.length <= 5000) handleEditFormChange("description", e.target.value);
                                                }} rows={5}
                                                    placeholder="Describe the role, responsibilities, qualifications, and what makes this opportunity unique..."
                                                    style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: `1.5px solid ${C.s200}`, fontSize: 13.5, color: C.s900, fontFamily: C.dm, resize: "vertical", outline: "none", lineHeight: 1.6, transition: "border-color .15s" }}
                                                    onFocus={e => e.target.style.borderColor = C.navy} onBlur={e => e.target.style.borderColor = C.s200} />
                                            </div>
                                        </div>

                                        {/* Section: Employment Details */}
                                        <div>
                                            <div style={{ fontSize: 11, fontWeight: 800, color: C.s400, textTransform: "uppercase", letterSpacing: ".1em", marginBottom: 10 }}>Employment Details</div>
                                            <div style={{ background: C.s50, borderRadius: 12, padding: 16, border: `1px solid ${C.s100}`, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
                                                <div>
                                                    <label style={{ fontSize: 12, fontWeight: 700, color: C.s700, marginBottom: 5, display: "block" }}>Job Type</label>
                                                    <select value={editFormData.jobType} onChange={e => handleEditFormChange("jobType", e.target.value)}
                                                        style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: `1.5px solid ${C.s200}`, fontSize: 13.5, color: C.s700, fontFamily: C.dm, cursor: "pointer", outline: "none" }}>
                                                        <option>Full-time</option><option>Part-time</option><option>Contract</option><option>Internship</option><option>Freelance</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <label style={{ fontSize: 12, fontWeight: 700, color: C.s700, marginBottom: 5, display: "block" }}>Status</label>
                                                    <select value={editFormData.isActive ? "Active" : "Closed"} onChange={e => handleEditFormChange("isActive", e.target.value === "Active")}
                                                        style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: `1.5px solid ${C.s200}`, fontSize: 13.5, color: C.s700, fontFamily: C.dm, cursor: "pointer", outline: "none" }}>
                                                        <option value="Active">Active</option><option value="Closed">Closed</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <label style={{ fontSize: 12, fontWeight: 700, color: C.s700, marginBottom: 5, display: "block" }}>Work Mode</label>
                                                    <select value={editFormData.workMode || "On-site"} onChange={e => handleEditFormChange("workMode", e.target.value)}
                                                        style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: `1.5px solid ${C.s200}`, fontSize: 13.5, color: C.s700, fontFamily: C.dm, cursor: "pointer", outline: "none" }}>
                                                        <option>On-site</option><option>Remote</option><option>Hybrid</option>
                                                    </select>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Section: Compensation */}
                                        <div>
                                            <div style={{ fontSize: 11, fontWeight: 800, color: C.s400, textTransform: "uppercase", letterSpacing: ".1em", marginBottom: 10 }}>Compensation (₹/year)</div>
                                            <div style={{ background: C.s50, borderRadius: 12, padding: 16, border: `1px solid ${C.s100}`, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                                                <div>
                                                    <label style={{ fontSize: 12, fontWeight: 700, color: C.s700, marginBottom: 5, display: "block" }}>Minimum</label>
                                                    <div style={{ position: "relative" }}>
                                                        <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 13.5, fontWeight: 700, color: C.s400 }}>₹</span>
                                                        <input type="number" value={editFormData.salaryMin} onChange={e => handleEditFormChange("salaryMin", e.target.value)}
                                                            placeholder="500000"
                                                            min="0"
                                                            style={{ width: "100%", padding: "10px 14px 10px 30px", borderRadius: 10, border: `1.5px solid ${C.s200}`, fontSize: 13.5, color: C.s900, fontFamily: C.dm, outline: "none", transition: "border-color .15s" }}
                                                            onFocus={e => e.target.style.borderColor = C.navy} onBlur={e => e.target.style.borderColor = C.s200} />
                                                    </div>
                                                </div>
                                                <div>
                                                    <label style={{ fontSize: 12, fontWeight: 700, color: C.s700, marginBottom: 5, display: "block" }}>Maximum</label>
                                                    <div style={{ position: "relative" }}>
                                                        <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 13.5, fontWeight: 700, color: C.s400 }}>₹</span>
                                                        <input type="number" value={editFormData.salaryMax} onChange={e => handleEditFormChange("salaryMax", e.target.value)}
                                                            placeholder="1200000"
                                                            min="0"
                                                            style={{ width: "100%", padding: "10px 14px 10px 30px", borderRadius: 10, border: `1.5px solid ${C.s200}`, fontSize: 13.5, color: C.s900, fontFamily: C.dm, outline: "none", transition: "border-color .15s" }}
                                                            onFocus={e => e.target.style.borderColor = C.navy} onBlur={e => e.target.style.borderColor = C.s200} />
                                                    </div>
                                                </div>
                                                {Number(editFormData.salaryMin) > 0 && Number(editFormData.salaryMax) > 0 && Number(editFormData.salaryMax) < Number(editFormData.salaryMin) && (
                                                    <div style={{ gridColumn: "1 / -1", fontSize: 11.5, color: "#dc2626", fontWeight: 600 }}>
                                                        Maximum salary should be greater than minimum salary.
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                    </div>
                                )}

                                {/* ── Screening Questions Tab ── */}
                                {editJobTab === "screening" && (
                                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                                        <div style={{
                                            display: "flex", alignItems: "center", gap: 8, padding: "10px 14px",
                                            borderRadius: 10, background: "#fffbeb", border: "1px solid #fde68a",
                                            fontSize: 12, color: "#92400e", fontWeight: 600, lineHeight: 1.5
                                        }}>
                                            <FiInfo size={15} style={{ flexShrink: 0, color: "#f59e0b" }} />
                                            Changes to screening questions will only apply to new candidates. Existing candidates' answers are preserved.
                                        </div>

                                        {editFormData.screeningQuestions.length === 0 && (
                                            <div style={{
                                                padding: "32px 20px", textAlign: "center", color: C.s400, fontSize: 13.5,
                                                background: C.s50, borderRadius: 12, border: `1.5px dashed ${C.s200}`
                                            }}>
                                                <div style={{ width: 44, height: 44, borderRadius: 12, background: C.s100, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 10px", color: C.s300 }}>
                                                    <FiFileText size={18} />
                                                </div>
                                                <div style={{ fontWeight: 700, color: C.s500, marginBottom: 4 }}>No screening questions yet</div>
                                                <div style={{ fontSize: 12.5 }}>Click "Add Question" to create your first screening question.</div>
                                            </div>
                                        )}

                                        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                                            {editFormData.screeningQuestions.map((q, idx) => {
                                                const qId = q._id || q.id;
                                                return (
                                                    <div key={qId || idx} style={{
                                                        padding: "14px 16px", borderRadius: 12, border: `1.5px solid ${C.s200}`,
                                                        background: "#fff", transition: "border-color .15s"
                                                    }}
                                                        onMouseEnter={e => e.currentTarget.style.borderColor = C.navy + "30"}
                                                        onMouseLeave={e => e.currentTarget.style.borderColor = C.s200}>
                                                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                                                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                                                <span style={{
                                                                    display: "inline-flex", alignItems: "center", justifyContent: "center",
                                                                    width: 24, height: 24, borderRadius: 7, background: C.navy + "10",
                                                                    fontSize: 11, fontWeight: 800, color: C.navy, fontFamily: C.fd
                                                                }}>{idx + 1}</span>
                                                                <span style={{ fontSize: 11, fontWeight: 800, color: C.s400, textTransform: "uppercase", letterSpacing: ".05em" }}>Question</span>
                                                            </div>
                                                            <button onClick={() => handleRemoveEditQuestion(qId)}
                                                                style={{
                                                                    width: 28, height: 28, borderRadius: 8, background: "#fef2f2",
                                                                    border: "1px solid #fecaca", color: "#ef4444", cursor: "pointer",
                                                                    display: "flex", alignItems: "center", justifyContent: "center",
                                                                    transition: "all .12s"
                                                                }}
                                                                onMouseEnter={e => { e.currentTarget.style.background = "#fee2e2"; }}
                                                                onMouseLeave={e => { e.currentTarget.style.background = "#fef2f2"; }}>
                                                                <FiTrash2 size={12} />
                                                            </button>
                                                        </div>
                                                        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                                                            <div>
                                                                <input value={q.question} onChange={e => handleEditQuestionChange(qId, "question", e.target.value)}
                                                                    placeholder="Enter your screening question..."
                                                                    style={{
                                                                        width: "100%", padding: "9px 12px", borderRadius: 8,
                                                                        border: `1.5px solid ${C.s200}`, fontSize: 13, color: C.s900,
                                                                        fontFamily: C.dm, outline: "none", transition: "border-color .15s"
                                                                    }}
                                                                    onFocus={e => e.target.style.borderColor = C.navy}
                                                                    onBlur={e => e.target.style.borderColor = C.s200} />
                                                            </div>
                                                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                                                                <div>
                                                                    <label style={{ fontSize: 11, fontWeight: 700, color: C.s600, marginBottom: 4, display: "block" }}>Response Type</label>
                                                                    <select value={q.type} onChange={e => handleEditQuestionChange(qId, "type", e.target.value)}
                                                                        style={{
                                                                            width: "100%", padding: "9px 10px", borderRadius: 8,
                                                                            border: `1.5px solid ${C.s200}`, fontSize: 12.5, color: C.s700,
                                                                            fontFamily: C.dm, cursor: "pointer", outline: "none"
                                                                        }}>
                                                                        <option value="TEXT">Text Answer</option>
                                                                        <option value="YES_NO">Yes/No</option>
                                                                        <option value="MULTIPLE_CHOICE">Single Choice</option>
                                                                        <option value="CHECKBOX">Checkbox</option>
                                                                        <option value="NUMERIC">Number</option>
                                                                        <option value="PARAGRAPH">Paragraph</option>
                                                                    </select>
                                                                </div>
                                                                <div>
                                                                    <label style={{ fontSize: 11, fontWeight: 700, color: C.s600, marginBottom: 4, display: "block" }}>Requirement</label>
                                                                    <select value={q.required ? "true" : "false"} onChange={e => handleEditQuestionChange(qId, "required", e.target.value === "true")}
                                                                        style={{
                                                                            width: "100%", padding: "9px 10px", borderRadius: 8,
                                                                            border: `1.5px solid ${C.s200}`, fontSize: 12.5, color: C.s700,
                                                                            fontFamily: C.dm, cursor: "pointer", outline: "none"
                                                                        }}>
                                                                        <option value="true">Required</option>
                                                                        <option value="false">Optional</option>
                                                                    </select>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        <button onClick={handleAddEditQuestion}
                                            style={{
                                                display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
                                                padding: "11px", width: "100%", borderRadius: 10,
                                                background: C.navy + "06", border: `1.5px dashed ${C.navy}30`,
                                                color: C.navy, fontSize: 13, fontWeight: 700, fontFamily: C.fd,
                                                cursor: "pointer", transition: "all .15s"
                                            }}
                                            onMouseEnter={e => { e.currentTarget.style.background = C.navy + "0c"; e.currentTarget.style.borderColor = C.navy + "50"; }}
                                            onMouseLeave={e => { e.currentTarget.style.background = C.navy + "06"; e.currentTarget.style.borderColor = C.navy + "30"; }}>
                                            <FiPlus size={15} /> Add Question
                                        </button>
                                    </div>
                                )}

                                {/* ── Action Buttons ── */}
                                <div style={{ display: "flex", gap: 10, paddingTop: 18, borderTop: `1px solid ${C.s100}`, marginTop: 20 }}>
                                    <button onClick={() => setShowEditJob(false)}
                                        style={{
                                            flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
                                            padding: "11px 0", borderRadius: 10, border: `1.5px solid ${C.s200}`,
                                            background: "#fff", color: C.s600, fontSize: 13.5, fontWeight: 700,
                                            fontFamily: C.dm, cursor: "pointer", transition: "all .15s"
                                        }}
                                        onMouseEnter={e => { e.currentTarget.style.background = C.s50; e.currentTarget.style.borderColor = C.s300; }}
                                        onMouseLeave={e => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.borderColor = C.s200; }}>
                                        Cancel
                                    </button>
                                    <button onClick={handleEditSave}
                                        style={{
                                            flex: 2, display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
                                            padding: "11px 0", borderRadius: 10, border: "none",
                                            background: `linear-gradient(135deg, #002366, #1a3a6e)`, color: "#fff",
                                            fontSize: 14, fontWeight: 800, fontFamily: C.fd, cursor: editSaving ? "default" : "pointer",
                                            opacity: editSaving ? 0.65 : 1,
                                            boxShadow: "0 4px 14px rgba(0,35,102,.2)", transition: "all .18s"
                                        }}
                                        onMouseEnter={e => { if (!editSaving) { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 6px 20px rgba(0,35,102,.3)"; } }}
                                        onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "0 4px 14px rgba(0,35,102,.2)"; }}>
                                        {editSaving ? (
                                            <><span style={{ width: 14, height: 14, borderRadius: "50%", border: "2px solid rgba(255,255,255,.3)", borderTopColor: "#fff", animation: "rmSpinEdit .6s linear infinite" }} /> Saving...</>
                                        ) : (
                                            <><FiCheckCircle size={15} /> Save Changes</>
                                        )}
                                    </button>
                                </div>
                            </div>
                        )}
                    </Modal>

                    {/* ─── Notification Sidebar ─── */}
                    <div className={`pd-notif-overlay ${showNotifications ? 'show' : ''}`} onClick={() => setShowNotifications(false)} />
                    <div className={`pd-notif-sidebar ${showNotifications ? 'show' : ''}`}>
                        <div className="pd-notif-head">
                            <h3>Notifications</h3>
                            <button className="pd-notif-close" onClick={() => setShowNotifications(false)}><FiX size={18} /></button>
                        </div>
                        <div className="pd-notif-body">
                            <div className="pd-notif-date">Today</div>

                            {notificationsLoading && (
                                <div style={{ padding: "0 24px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
                                    <div style={{ fontSize: 12.5, fontWeight: 800, color: C.s500, fontFamily: C.fd }}>
                                        Loading notifications...
                                    </div>
                                    <div style={{ height: 40 }} />
                                </div>
                            )}

                            {!notificationsLoading && notificationsError && (
                                <div style={{ padding: "0 24px 16px", color: "#b91c1c", fontSize: 12.5, fontWeight: 800, fontFamily: C.fd }}>
                                    {notificationsError}
                                </div>
                            )}

                            {!notificationsLoading && !notificationsError && employerNotifications.length === 0 && (
                                <div style={{ padding: "0 24px 16px", color: C.s400, fontSize: 12.5, fontWeight: 700, fontFamily: C.fd }}>
                                    No notifications right now.
                                </div>
                            )}

                            {!notificationsLoading && employerNotifications.map((n) => {
                                const id = String(n?.id || n?._id || "");
                                const isRead = String(n?.status || "").toUpperCase() === "READ";
                                const title = n?.title || "";
                                const desc = n?.message || n?.desc || "";
                                const time = n?.lastUpdated || n?.createdAt || "";

                                return (
                                    <div
                                        className="pd-notif-item"
                                        key={id || title + time}
                                        onClick={async () => {
                                            if (!id) return;

                                            try {
                                                await authService.markEmployerNotificationRead(id);
                                            } catch {
                                                // keep UI resilient
                                            }

                                            setEmployerNotifications((current) =>
                                                current.map((x) => {
                                                    const xid = String(x?.id || x?._id || "");
                                                    if (!xid || xid !== id) return x;
                                                    return { ...x, status: "READ" };
                                                })
                                            );
                                        }}
                                        style={{ background: isRead ? "transparent" : "#EEF2FF" }}
                                    >
                                        <div
                                            className="pd-notif-icon"
                                            style={{
                                                background: isRead ? C.s200 : `${C.indigo}14`,
                                                color: isRead ? C.s500 : C.indigo,
                                            }}
                                        >
                                            <FiBell size={16} />
                                        </div>

                                        <div className="pd-notif-content">
                                            <div className="pd-notif-title" style={{ opacity: isRead ? 0.7 : 1 }}>
                                                {title}
                                            </div>
                                            {desc ? <div className="pd-notif-desc">{desc}</div> : null}
                                            {time ? <div className="pd-notif-time">{time}</div> : null}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                </div>
            )}

            {showDeleteConfirm && (
                <div className="fixed inset-0 z-[10002] flex items-center justify-center" style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)" }}>
                    <div style={{
                        background: "#fff", borderRadius: 20, maxWidth: 420, width: "90%",
                        padding: "32px 28px 24px", textAlign: "center", boxShadow: "0 24px 80px rgba(0,0,0,0.2)",
                        fontFamily: "'DM Sans', system-ui, sans-serif",
                    }}>
                        <div style={{
                            width: 52, height: 52, borderRadius: "50%", background: "#fef2f2",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            margin: "0 auto 16px",
                        }}>
                            <FiTrash2 size={22} color="#dc2626" />
                        </div>
                        <h3 style={{ fontSize: 17, fontWeight: 800, color: "#0f172a", margin: "0 0 6px" }}>
                            {deletePassStep === 0 ? "Delete account" : `Step ${deletePassStep} of 2 � ${deletePassStep === 1 ? "Enter password" : "Re-enter password"}`}
                        </h3>
                        <p style={{ fontSize: 13, color: "#64748b", lineHeight: 1.6, margin: "0 0 20px" }}>
                            {deletePassStep === 0
                                ? "This will permanently deactivate your account, company profile, and all job listings. This action cannot be undone."
                                : deletePassStep === 1
                                    ? "Enter your current password."
                                    : "Re-enter the same password to confirm."}
                        </p>

                        {deletePassStep === 1 && (
                            <div style={{ marginBottom: 16 }}>
                                <input
                                    type="password"
                                    value={deletePassword}
                                    onChange={e => setDeletePassword(e.target.value)}
                                    onKeyDown={e => { if (e.key === "Enter") handleDeleteAccount(); }}
                                    placeholder="Enter your password"
                                    autoFocus
                                    style={{
                                        width: "100%", padding: "12px 14px", fontSize: 14,
                                        border: `1.5px solid ${deleteError ? "#dc2626" : "#e2e8f0"}`,
                                        borderRadius: 12, outline: "none", color: "#0f172a",
                                        transition: "border-color 0.15s",
                                    }}
                                />
                                {deleteError && (
                                    <p style={{ fontSize: 12, color: "#dc2626", margin: "6px 0 0", textAlign: "left" }}>{deleteError}</p>
                                )}
                            </div>
                        )}

                        {deletePassStep === 2 && (
                            <div style={{ marginBottom: 16 }}>
                                <input
                                    type="password"
                                    value={deletePassword2}
                                    onChange={e => setDeletePassword2(e.target.value)}
                                    onKeyDown={e => { if (e.key === "Enter") handleDeleteAccount(); }}
                                    placeholder="Re-enter your password"
                                    autoFocus
                                    style={{
                                        width: "100%", padding: "12px 14px", fontSize: 14,
                                        border: `1.5px solid ${deleteError ? "#dc2626" : "#e2e8f0"}`,
                                        borderRadius: 12, outline: "none", color: "#0f172a",
                                        transition: "border-color 0.15s",
                                    }}
                                />
                                {deleteError && (
                                    <p style={{ fontSize: 12, color: "#dc2626", margin: "6px 0 0", textAlign: "left" }}>{deleteError}</p>
                                )}
                            </div>
                        )}

                        <div style={{ display: "flex", gap: 10 }}>
                            <button
                                onClick={() => {
                                    if (deletePassStep === 0) {
                                        setShowDeleteConfirm(false);
                                    }
                                    setDeletePassStep(0);
                                    setDeletePassword("");
                                    setDeletePassword2("");
                                    setDeleteError("");
                                }}
                                style={{
                                    flex: 1, padding: "12px", borderRadius: 12, border: "1.5px solid #e2e8f0",
                                    background: "#fff", color: "#475569", fontSize: 13, fontWeight: 700, cursor: "pointer",
                                }}
                            >
                                {deletePassStep === 0 ? "Cancel" : "Back"}
                            </button>
                            <button
                                onClick={handleDeleteAccount}
                                disabled={deleting || (deletePassStep === 1 && !deletePassword) || (deletePassStep === 2 && !deletePassword2)}
                                style={{
                                    flex: 1, padding: "12px", borderRadius: 12, border: "none",
                                    background: "#dc2626", color: "#fff", fontSize: 13, fontWeight: 800, cursor: "pointer",
                                    opacity: (deleting || (deletePassStep === 1 && !deletePassword) || (deletePassStep === 2 && !deletePassword2)) ? 0.6 : 1,
                                }}
                            >
                                {deleting ? "Deleting..." : deletePassStep === 0 ? "Delete my account" : deletePassStep === 1 ? "Next" : "Confirm deletion"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Candidate Detail Modal ────────────────────────── */}
            {showCandidateModal && selectedCandidateApp && (() => {
                const a = selectedCandidateApp;
                const screening = Array.isArray(a.screeningAnswers) && a.screeningAnswers.length > 0 ? a.screeningAnswers : [];
                const fmtDate = (v) => { if (!v) return "-"; try { return new Date(v).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric" }); } catch { return "-"; } };
                return (
                    <div onClick={() => setShowCandidateModal(false)} style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(15,23,42,.6)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, backdropFilter: "blur(6px)" }}>
                        <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: 20, width: "100%", maxWidth: 700, maxHeight: "90vh", overflow: "hidden", boxShadow: "0 24px 64px rgba(0,0,0,.25)", display: "flex", flexDirection: "column" }}>
                            {/* ─ Header ─ */}
                            <div style={{ padding: "18px 24px", borderBottom: `1px solid ${C.s100}`, display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                    <div style={{ width: 40, height: 40, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 800, color: C.navy, border: `1px solid ${C.s200}`, flexShrink: 0, background: a.candidateLogoUrl ? `url("${a.candidateLogoUrl}") center/cover no-repeat` : C.s100 }}>
                                        {!a.candidateLogoUrl && (a.candidateName ? a.candidateName.slice(0, 2).toUpperCase() : "CA")}
                                    </div>
                                    <div>
                                        <div style={{ fontFamily: C.fd, fontSize: 17, fontWeight: 800, color: C.s900 }}>{a.candidateName || "Candidate"}</div>
                                        <div style={{ fontSize: 13, color: C.s500 }}>{a.candidateEmail || a.candidatePhone ? `${a.candidateEmail || ""}${a.candidateEmail && a.candidatePhone ? " · " : ""}${a.candidatePhone || ""}` : ""}</div>
                                    </div>
                                </div>
                                <button onClick={() => setShowCandidateModal(false)} style={{ width: 32, height: 32, borderRadius: 9, background: C.s50, border: `1px solid ${C.s200}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: C.s500, flexShrink: 0 }}>
                                    <FiX size={15} />
                                </button>
                            </div>
                            {/* ─ Body (scrollable) ─ */}
                            <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
                                {/* Info grid */}
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
                                    {[
                                        { label: "Applied Role", val: a.jobTitle || "—", color: C.navy },
                                        { label: "Status", val: prettifyStatus(a.status || "APPLIED"), color: (statusColors[a.status] || C.s500) },
                                        { label: "Applied On", val: fmtDate(a.appliedAt), color: C.s600 },
                                        { label: "Experience", val: a.candidateExperience || "—", color: C.s600 },
                                        { label: "Location", val: a.candidateCity || a.candidateState || "—", color: C.s600 },
                                        { label: "Current Title", val: a.candidateCurrentTitle || "—", color: C.s600 },
                                    ].map((info, i) => (
                                        <div key={i} style={{ padding: "12px 14px", borderRadius: 12, background: C.s50, border: `1px solid ${C.s100}` }}>
                                            <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", color: info.color, marginBottom: 4 }}>{info.label}</div>
                                            <div style={{ fontSize: 13.5, fontWeight: 700, color: C.s800, fontFamily: C.fd }}>{info.val}</div>
                                        </div>
                                    ))}
                                </div>
                                {/* Resume link */}
                                {(a.resumeUrl || a.resumeFileName) ? (
                                    <div style={{ marginBottom: 20, display: "flex", alignItems: "center", gap: 8, padding: "12px 14px", borderRadius: 12, background: C.s50, border: `1px solid ${C.s100}` }}>
                                        <FiFileText size={16} color={C.navy} />
                                        <span style={{ fontSize: 13, fontWeight: 600, color: C.s700, flex: 1 }}>{a.resumeFileName || "Resume"}</span>
                                        <a href={a.resumeUrl} target="_blank" rel="noopener noreferrer" style={{ padding: "6px 12px", borderRadius: 8, background: C.navy, color: "#fff", fontSize: 12, fontWeight: 700, textDecoration: "none" }}>
                                            <FiExternalLink size={13} style={{ marginRight: 4, verticalAlign: "middle" }} /> View
                                        </a>
                                    </div>
                                ) : null}
                                {/* Job context card */}
                                <div style={{ marginBottom: 20, padding: "16px 18px", borderRadius: 14, background: `linear-gradient(135deg, ${C.navy}08, ${C.navy}02)`, border: `1px solid ${C.navy}18`, display: "flex", alignItems: "center", gap: 14 }}>
                                    <div style={{ width: 40, height: 40, borderRadius: 12, background: C.navy + "12", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                        <FiBriefcase size={18} color={C.navy} />
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", color: C.navy, marginBottom: 2 }}>Applied for</div>
                                        <div style={{ fontSize: 15, fontWeight: 800, color: C.s900, fontFamily: C.fd }}>{a.jobTitle || "Unknown Role"}</div>
                                    </div>
                                    <div style={{ fontSize: 12, fontWeight: 700, color: C.s500, background: "#fff", padding: "6px 14px", borderRadius: 100, border: `1px solid ${C.s200}`, whiteSpace: "nowrap" }}>
                                        <FiCalendar size={12} style={{ marginRight: 4, verticalAlign: "middle" }} /> {fmtDate(a.appliedAt)}
                                    </div>
                                </div>
                                {/* Screening Q&A — only shown if the job had screening questions */}
                                {screening.length > 0 && (
                                <div>
                                    <div style={{ fontFamily: C.fd, fontSize: 15, fontWeight: 800, color: C.s900, marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
                                        <FiFileText size={16} color={C.navy} /> Screening Questions &amp; Answers
                                        <span style={{ fontSize: 12, fontWeight: 700, color: C.s400, background: C.s100, padding: "2px 10px", borderRadius: 100 }}>{screening.length}</span>
                                    </div>
                                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                                        {screening.map((sq, i) => (
                                            <div key={sq.questionId || i} style={{ padding: "14px 16px", borderRadius: 12, background: C.s50, border: `1px solid ${C.s100}` }}>
                                                <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                                                    <div style={{ width: 24, height: 24, borderRadius: 8, background: C.navy + "12", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: C.navy, flexShrink: 0 }}>{i + 1}</div>
                                                    <div style={{ flex: 1, minWidth: 0 }}>
                                                        <div style={{ fontSize: 13, fontWeight: 700, color: C.s800, marginBottom: 6 }}>{sq.question || "Question"}</div>
                                                        <div style={{ fontSize: 13.5, color: C.s600, lineHeight: 1.6, whiteSpace: "pre-wrap", background: "#fff", padding: "10px 14px", borderRadius: 10, border: `1px solid ${C.s100}` }}>{sq.answer ?? "No answer provided"}</div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                )}
                            </div>
                        </div>
                    </div>
                );
            })()}

            {/* ── Crop Modal ────────────────────────────────────── */}
            {cropModal.open && cropImageUrl && (
                <div onClick={() => { if (!cropSaving) { setCropModal({ open: false, kind: "logo" }); setCropImageUrl(""); URL.revokeObjectURL(cropImageUrl); } }}
                    style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(15,23,42,.7)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, backdropFilter: "blur(6px)" }}>
                    <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: 20, width: "100%", maxWidth: 580, overflow: "hidden", boxShadow: "0 24px 64px rgba(0,0,0,.3)" }}>
                        {/* Header */}
                        <div style={{ padding: "16px 20px", borderBottom: `1px solid ${C.s100}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                            <div style={{ fontFamily: C.fd, fontSize: 16, fontWeight: 800, color: C.s900 }}>{cropModal.kind === "logo" ? "Crop Logo" : "Crop Cover Image"}</div>
                            <button onClick={() => { if (!cropSaving) { setCropModal({ open: false, kind: "logo" }); setCropImageUrl(""); URL.revokeObjectURL(cropImageUrl); } }}
                                style={{ width: 32, height: 32, borderRadius: 9, background: C.s50, border: `1px solid ${C.s200}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: C.s500 }}>
                                <FiX size={15} />
                            </button>
                        </div>
                        {/* Cropper */}
                        <div style={{ position: "relative", width: "100%", height: cropModal.kind === "logo" ? 380 : 280, background: "#000" }}>
                            <Cropper
                                image={cropImageUrl}
                                crop={crop}
                                zoom={zoom}
                                aspect={cropModal.kind === "logo" ? 1 : 3}
                                cropShape={cropModal.kind === "logo" ? "round" : "rect"}
                                showGrid={false}
                                onCropChange={setCrop}
                                onZoomChange={setZoom}
                                onCropComplete={handleCropComplete}
                                style={{ containerStyle: { background: "#111" }, cropAreaStyle: { border: cropModal.kind === "logo" ? "none" : "2px solid #fff" } }}
                            />
                        </div>
                        {/* Zoom slider */}
                        <div style={{ padding: "12px 20px", borderBottom: `1px solid ${C.s100}`, display: "flex", alignItems: "center", gap: 12 }}>
                            <FiMinimize2 size={14} color={C.s400} />
                            <input type="range" min={1} max={3} step={0.05} value={zoom} onChange={e => setZoom(Number(e.target.value))}
                                style={{ flex: 1, height: 4, WebkitAppearance: "none", appearance: "none", background: C.s200, borderRadius: 4, outline: "none", cursor: "pointer" }} />
                            <FiMaximize2 size={14} color={C.s400} />
                        </div>
                        {/* Actions */}
                        <div style={{ padding: "14px 20px", display: "flex", justifyContent: "flex-end", gap: 10 }}>
                            <button onClick={() => { setCropModal({ open: false, kind: "logo" }); setCropImageUrl(""); URL.revokeObjectURL(cropImageUrl); }} disabled={cropSaving}
                                style={{ padding: "9px 20px", borderRadius: 10, border: `1px solid ${C.s200}`, background: "#fff", color: C.s600, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: C.dm }}>
                                Cancel
                            </button>
                            <button onClick={handleCropSave} disabled={!croppedPixels || cropSaving}
                                style={{ padding: "9px 20px", borderRadius: 10, border: "none", background: C.navy, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: C.fd, opacity: !croppedPixels || cropSaving ? 0.6 : 1, display: "flex", alignItems: "center", gap: 6 }}>
                                {cropSaving ? <><span style={{ width: 14, height: 14, borderRadius: "50%", border: "2px solid rgba(255,255,255,.3)", borderTopColor: "#fff", animation: "rmSpinEdit .6s linear infinite", display: "inline-block" }} /> Saving...</> : "Save"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
