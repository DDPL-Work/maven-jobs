import React, { useEffect, useRef, useState, useCallback } from "react";
import { gsap } from "gsap";
import { FiSend, FiMinus, FiChevronDown, FiZap, FiStar, FiX, FiLock, FiUpload, FiClock, FiTrash2, FiFileText, FiPlus } from "react-icons/fi";
import mavenLogo from "../../assets/maven-logo-BdiSsfJk.svg";
import authService from "../services/authService";
import api from "../services/api";

/* ── BACKEND CHATBOT API ── */

let usageCache = { data: null, expiry: 0 };

function getCachedUsageStats() {
  if (usageCache.data && Date.now() < usageCache.expiry) {
    return Promise.resolve(usageCache.data);
  }
  return api.get("/chatbot/usage").then((response) => {
    const data = response.data?.data || null;
    usageCache = { data, expiry: Date.now() + 30000 };
    return data;
  }).catch(() => {
    if (usageCache.data) return usageCache.data;
    return null;
  });
}

function getThreadKey() {
  try {
    const raw = localStorage.getItem("user");
    if (raw) {
      const user = JSON.parse(raw);
      const uid = user?._id || user?.id || "";
      if (uid) return `mavenai_threadId_${uid}`;
    }
  } catch {}
  return "mavenai_threadId";
}

function getStoredThread() {
  try { return localStorage.getItem(getThreadKey()) || ""; } catch { return ""; }
}

function storeThread(id) {
  try { if (id) localStorage.setItem(getThreadKey(), id); } catch {}
}

function clearThread() {
  try { localStorage.removeItem(getThreadKey()); } catch {}
}

function isLoggedIn() {
  try { return !!localStorage.getItem("candidateToken"); } catch { return false; }
}

function getUserRole() {
  if (!isLoggedIn()) return "GUEST";
  try {
    const raw = localStorage.getItem("user");
    if (raw) {
      const user = JSON.parse(raw);
      if (user?.role && user.role !== "GUEST") return user.role;
    }
  } catch {}
  try {
    const empRaw = localStorage.getItem("employerUser");
    if (empRaw) {
      const emp = JSON.parse(empRaw);
      if (emp.companyName || emp.companyId) return "CLIENT";
    }
  } catch {}
  return "GUEST";
}

async function callMavenBackend(text, threadId) {
  const payload = { text };
  if (threadId) payload.threadId = threadId;

  const response = await api.post("/chatbot/message", payload);
  const data = response.data;

  if (!data.success) {
    throw new Error(data.message || "Failed to get response");
  }

  return data.data;
}

async function getUsageStats() {
  return getCachedUsageStats();
}

async function getJobRecommendations() {
  try {
    const response = await api.get("/chatbot/recommend-jobs");
    return response.data?.data || null;
  } catch {
    return null;
  }
}

async function getTopApplicants() {
  try {
    const response = await api.get("/chatbot/top-applicants");
    return response.data?.data?.applicants || [];
  } catch {
    return [];
  }
}

async function getCandidateRecommendations() {
  try {
    const response = await api.get("/chatbot/recommend-candidates");
    return response.data?.data || null;
  } catch {
    return null;
  }
}

async function uploadPdfFile(file, threadId) {
  try {
    const formData = new FormData();
    formData.append("file", file);
    if (threadId) formData.append("threadId", threadId);
    const response = await api.post("/chatbot/upload", formData);
    return response.data?.data || null;
  } catch (err) {
    const msg = err.response?.data?.message || err.message || "Upload failed";
    return { success: false, message: msg };
  }
}

async function getThreadsWithDetails() {
  try {
    const response = await api.get("/chatbot/threads/details");
    return response.data?.data?.threads || [];
  } catch {
    return [];
  }
}

/* ── RECOMMENDATION CARD RENDERERS ── */

const JobRecommendationCard = ({ job }) => (
  <a
    href={`/jobs/${job._id}`}
    target="_blank"
    rel="noopener noreferrer"
    style={{
      display: "flex", alignItems: "center", gap: 10,
      padding: "10px 12px", borderRadius: 10,
      background: "#ffffff", border: "1px solid #e2e8f0",
      textDecoration: "none", cursor: "pointer",
      transition: "all 0.15s",
    }}
    onMouseEnter={e => { e.currentTarget.style.borderColor = "#2563eb"; e.currentTarget.style.boxShadow = "0 2px 8px rgba(37,99,235,0.1)"; }}
    onMouseLeave={e => { e.currentTarget.style.borderColor = "#e2e8f0"; e.currentTarget.style.boxShadow = "none"; }}
  >
    <div style={{
      width: 34, height: 34, borderRadius: 8,
      background: "linear-gradient(135deg, #eef2ff, #e0e7ff)",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: 12, fontWeight: 800, color: "#4338ca", flexShrink: 0,
    }}>
      {job.company?.charAt(0) || "J"}
    </div>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {job.title}
      </div>
      <div style={{ fontSize: 10, color: "#64748b", marginTop: 1 }}>
        {job.company} · {job.location}
      </div>
    </div>
    <div style={{
      display: "flex", alignItems: "center", gap: 4,
      padding: "4px 10px", borderRadius: 100,
      background: "#dcfce7", fontSize: 10, fontWeight: 800, color: "#166534", flexShrink: 0,
    }}>
      {job.matchScore}% Match
    </div>
  </a>
);

const CandidateRecommendationCard = ({ candidate }) => {
  const profileUrl = candidate.publicShareId
    ? `${window.location.origin}/mj/${candidate.publicShareId}`
    : candidate.userId
      ? `${window.location.origin}/candidate/profile/${candidate.userId}`
      : null;

  return (
    <div
      onClick={() => profileUrl && window.open(profileUrl, "_blank")}
      style={{
        display: "flex", alignItems: "center", gap: 10,
        padding: "10px 12px", borderRadius: 10,
        background: "#ffffff", border: "1px solid #e2e8f0",
        cursor: profileUrl ? "pointer" : "default",
        transition: "all 0.15s",
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = "#818cf8"; e.currentTarget.style.boxShadow = "0 1px 3px rgba(99,102,241,.15)"; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = "#e2e8f0"; e.currentTarget.style.boxShadow = "none"; }}
    >
      <div style={{
        width: 34, height: 34, borderRadius: "50%",
        background: "linear-gradient(135deg, #dbeafe, #bfdbfe)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 12, fontWeight: 800, color: "#1e40af", flexShrink: 0,
        textTransform: "uppercase",
      }}>
        {candidate.name?.charAt(0) || "C"}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {candidate.name}
        </div>
        <div style={{ fontSize: 10, color: "#64748b", marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {candidate.headline || candidate.currentTitle || "Candidate"} · {candidate.totalExperience || "Exp N/A"}
        </div>
        {candidate.skills && candidate.skills.length > 0 && (
          <div style={{ display: "flex", gap: 4, marginTop: 4, flexWrap: "wrap" }}>
            {candidate.skills.slice(0, 3).map((skill, i) => (
              <span key={i} style={{
                padding: "1px 6px", borderRadius: 4, background: "#f1f5f9",
                fontSize: 9, fontWeight: 600, color: "#475569",
              }}>
                {skill}
              </span>
            ))}
            {candidate.skills.length > 3 && (
              <span style={{ fontSize: 9, fontWeight: 600, color: "#94a3b8" }}>+{candidate.skills.length - 3}</span>
            )}
          </div>
        )}
      </div>
      <div style={{
        display: "flex", alignItems: "center", gap: 4,
        padding: "4px 10px", borderRadius: 100,
        background: "#dbeafe", fontSize: 10, fontWeight: 800, color: "#1e40af", flexShrink: 0,
      }}>
        {candidate.matchScore}% Match
      </div>
    </div>
  );
};

/* ── LOGIN PROMPT ── */
const LoginPrompt = () => (
  <div style={{
    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
    padding: "32px 24px", textAlign: "center", height: "100%", gap: 14
  }}>
    <div style={{
      width: 52, height: 52, borderRadius: "50%",
      background: "#EEF2FF", display: "flex", alignItems: "center", justifyContent: "center"
    }}>
      <FiLock size={22} color="#002366" />
    </div>
    <div style={{ fontSize: 16, fontWeight: 800, color: "#0f172a" }}>Personalised Career AI</div>
    <div style={{ fontSize: 12.5, color: "#64748B", lineHeight: 1.6, maxWidth: 260 }}>
      Please log in to your account to access AI-powered career guidance tailored to your profile and skills.
    </div>
  </div>
);

/* ── TIER BADGE ── */
const TierBadge = ({ tier, usage }) => {
  if (!tier) return null;
  const tierColors = {
    FREE: { bg: "#F1F5F9", text: "#475569", label: "Free" },
    PRO: { bg: "#FEF3C7", text: "#92400E", label: "Pro" },
    ELITE: { bg: "#DBEAFE", text: "#1E40AF", label: "Elite" },
    STANDARD: { bg: "#F1F5F9", text: "#475569", label: "Standard" },
    PREMIUM: { bg: "#FEF3C7", text: "#92400E", label: "Premium" },
  };
  const style = tierColors[tier] || tierColors.FREE;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <span style={{
        padding: "2px 8px", borderRadius: 6, fontSize: 9, fontWeight: 800,
        background: style.bg, color: style.text, letterSpacing: "0.05em",
        textTransform: "uppercase"
      }}>
        {style.label}
      </span>
      {usage && (
        <span style={{ fontSize: 9, fontWeight: 700, color: "#94A3B8" }}>
          {usage.dailyMessages}/{usage.dailyLimit}
        </span>
      )}
    </div>
  );
};

/* ── MARKDOWN RENDERER ── */
const renderMarkdown = (text) => {
  if (!text) return null;
  const lines = text.split("\n");
  const out = [];
  let i = 0;

  const parseBold = (str) =>
    str.split(/\*\*(.*?)\*\*/g).map((p, idx) =>
      idx % 2 === 1
        ? <strong key={idx} style={{ fontWeight: 700, color: "#0f172a" }}>{p}</strong>
        : p
    );

  while (i < lines.length) {
    const line = lines[i];

    if (/^[•\-\*] /.test(line)) {
      const items = [];
      while (i < lines.length && /^[•\-\*] /.test(lines[i])) {
        items.push(lines[i].replace(/^[•\-\*] /, "").trim());
        i++;
      }
      out.push(
        <ul key={`ul${i}`} style={{ margin: "6px 0", paddingLeft: 0, listStyle: "none" }}>
          {items.map((item, idx) => (
            <li key={idx} style={{ display: "flex", gap: 8, marginBottom: 4, alignItems: "flex-start" }}>
              <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#2563EB", marginTop: 8, flexShrink: 0, display: "block" }} />
              <span>{parseBold(item)}</span>
            </li>
          ))}
        </ul>
      );
      continue;
    }

    if (/^\d+\. /.test(line)) {
      const items = [];
      while (i < lines.length && /^\d+\. /.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\. /, "").trim());
        i++;
      }
      out.push(
        <ol key={`ol${i}`} style={{ margin: "6px 0", paddingLeft: 0, listStyle: "none" }}>
          {items.map((item, idx) => (
            <li key={idx} style={{ display: "flex", gap: 8, marginBottom: 5, alignItems: "flex-start" }}>
              <span style={{ minWidth: 20, height: 20, borderRadius: 6, background: "linear-gradient(135deg,#002366,#0040C0)", color: "#fff", fontSize: 10, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{idx + 1}</span>
              <span style={{ paddingTop: 1 }}>{parseBold(item)}</span>
            </li>
          ))}
        </ol>
      );
      continue;
    }

    if (line.trim() === "") { out.push(<div key={`sp${i}`} style={{ height: 5 }} />); i++; continue; }

    out.push(<p key={`p${i}`} style={{ margin: 0, lineHeight: 1.68 }}>{parseBold(line)}</p>);
    i++;
  }
  return out;
};

/* ── 3D GLOBE ── */
function use3DGlobe(canvasRef, enabled) {
  const anim = useRef({ glow: 0.5, pulse: 0.4, ringA: 0, scaleV: 0, modeAlpha: [1, 0, 0] });
  const gsapCtx = useRef(null);
  const rafRef = useRef(null);

  useEffect(() => {
    if (!enabled || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const W = 110, H = 110, CX = 55, CY = 55, R = 38;
    canvas.width = W; canvas.height = H;

    let tRX = 0, tRY = 0, rX = 0, rY = 0;
    let grabbed = false, lastMX = 0, lastMY = 0, velX = 0, velY = 0;

    const onDown = (e) => {
      grabbed = true;
      lastMX = e.clientX ?? e.touches?.[0]?.clientX;
      lastMY = e.clientY ?? e.touches?.[0]?.clientY;
      velX = 0; velY = 0;
      canvas.style.cursor = "grabbing";
    };
    const onUp = () => { grabbed = false; canvas.style.cursor = "grab"; };
    const onMove = (e) => {
      const cx = e.clientX ?? e.touches?.[0]?.clientX;
      const cy = e.clientY ?? e.touches?.[0]?.clientY;
      if (!cx) return;
      if (grabbed) {
        velX = (cx - lastMX) * 0.022; velY = (cy - lastMY) * 0.015;
        tRY += velX; tRX -= velY; lastMX = cx; lastMY = cy;
      } else {
        const rect = canvas.getBoundingClientRect();
        tRX = -((cy - rect.top - CY) / CY) * 0.35;
        tRY = ((cx - rect.left - CX) / CX) * 0.35;
      }
    };
    const onLeave = () => { if (!grabbed) { tRX = 0; tRY = 0; } };

    canvas.addEventListener("mousedown", onDown);
    canvas.addEventListener("touchstart", onDown, { passive: true });
    window.addEventListener("mouseup", onUp);
    window.addEventListener("touchend", onUp);
    window.addEventListener("mousemove", onMove);
    canvas.addEventListener("mouseleave", onLeave);

    anim.current.scaleV = 0;
    gsapCtx.current = gsap.context(() => {
      gsap.to(anim.current, { glow: 1, duration: 2.2, ease: "sine.inOut", repeat: -1, yoyo: true });
      gsap.to(anim.current, { pulse: 1, duration: 1.6, ease: "sine.inOut", repeat: -1, yoyo: true, delay: 0.6 });
      gsap.to(anim.current, { ringA: Math.PI * 2, duration: 9, ease: "none", repeat: -1 });
      gsap.to(anim.current, { scaleV: 1, duration: 1.3, ease: "elastic.out(1,0.6)" });
    });

    const NPTS = 10;
    const pts = Array.from({ length: NPTS }, (_, i) => {
      const phi = Math.acos(-1 + 2 * (i + 0.5) / NPTS);
      const th = Math.PI * (1 + Math.sqrt(5)) * i;
      return [Math.sin(phi) * Math.cos(th), Math.cos(phi), Math.sin(phi) * Math.sin(th), Math.random() * Math.PI * 2];
    });

    const LATS = 9, LONS = 16;
    const sphere = (() => {
      const rows = [], cols = [];
      for (let i = 0; i <= LATS; i++) {
        const phi = (i / LATS) * Math.PI, row = [];
        for (let j = 0; j <= LONS; j++) {
          const th = (j / LONS) * Math.PI * 2;
          row.push([Math.sin(phi) * Math.cos(th), Math.cos(phi), Math.sin(phi) * Math.sin(th)]);
        }
        rows.push(row);
      }
      for (let j = 0; j <= LONS; j++) {
        const col = [];
        for (let i = 0; i <= LATS; i++) {
          const phi = (i / LATS) * Math.PI, th = (j / LONS) * Math.PI * 2;
          col.push([Math.sin(phi) * Math.cos(th), Math.cos(phi), Math.sin(phi) * Math.sin(th)]);
        }
        cols.push(col);
      }
      return { rows, cols };
    })();

    const rot = ([x, y, z], rx, ry) => {
      const x1 = x * Math.cos(ry) + z * Math.sin(ry);
      const z1 = -x * Math.sin(ry) + z * Math.cos(ry);
      return [x1, y * Math.cos(rx) - z1 * Math.sin(rx), y * Math.sin(rx) + z1 * Math.cos(rx)];
    };

    let fc = 0;
    const mA = anim.current.modeAlpha;

    const draw = () => {
      fc++;
      ctx.clearRect(0, 0, W, H);
      ctx.save();
      ctx.translate(CX, CY);
      ctx.scale(anim.current.scaleV, anim.current.scaleV);

      if (!grabbed) { rX += (tRX - rX) * 0.06; rY += (tRY - rY) * 0.06; }
      else { rX = tRX; rY = tRY; }
      if (!grabbed) { velX *= 0.94; velY *= 0.94; tRY += velX * 0.28; tRX += velY * 0.28; }

      const autoRY = anim.current.ringA * 0.15 + rY;
      const bS = Math.max(mA[0], mA[2]), gS = Math.max(mA[1], mA[2]);

      const og = ctx.createRadialGradient(0, 0, R * 0.5, 0, 0, R + 22);
      og.addColorStop(0, `rgba(0,35,102,${0.12 * bS * anim.current.glow})`);
      og.addColorStop(0.5, `rgba(16,185,129,${0.07 * gS * anim.current.glow})`);
      og.addColorStop(1, "rgba(0,0,0,0)");
      ctx.beginPath(); ctx.arc(0, 0, R + 22, 0, Math.PI * 2); ctx.fillStyle = og; ctx.fill();

      const sg = ctx.createRadialGradient(-R * 0.24, -R * 0.22, R * 0.02, 0, 0, R);
      sg.addColorStop(0, `rgba(160,200,255,${0.2 + bS * 0.1})`);
      sg.addColorStop(0.14, `rgba(18,74,196,${0.8 + bS * 0.1})`);
      sg.addColorStop(0.5, "rgba(0,35,102,0.94)");
      sg.addColorStop(0.85, "rgba(0,14,46,0.98)");
      sg.addColorStop(1, "rgba(0,7,24,1)");
      ctx.beginPath(); ctx.arc(0, 0, R, 0, Math.PI * 2); ctx.fillStyle = sg; ctx.fill();

      const wA = 0.16 + bS * 0.12;
      sphere.rows.forEach((row, ri) => {
        const isG = ri % 3 === 0;
        for (let j = 0; j < row.length - 1; j++) {
          const [ax, ay, az] = rot(row[j], rX, autoRY);
          const [bx, by, bz] = rot(row[j + 1], rX, autoRY);
          if (az < -0.08 && bz < -0.08) continue;
          const d = ((az + bz) / 2 + 1) / 2;
          ctx.beginPath(); ctx.moveTo(ax * R, ay * R); ctx.lineTo(bx * R, by * R);
          ctx.strokeStyle = isG ? `rgba(16,185,129,${d * wA * 1.1 * gS + 0.02})` : `rgba(80,148,255,${d * wA * bS + 0.02})`;
          ctx.lineWidth = 0.5; ctx.stroke();
        }
      });
      sphere.cols.forEach(col => {
        for (let i = 0; i < col.length - 1; i++) {
          const [ax, ay, az] = rot(col[i], rX, autoRY);
          const [bx, by, bz] = rot(col[i + 1], rX, autoRY);
          if (az < -0.08 && bz < -0.08) continue;
          const d = ((az + bz) / 2 + 1) / 2;
          ctx.beginPath(); ctx.moveTo(ax * R, ay * R); ctx.lineTo(bx * R, by * R);
          ctx.strokeStyle = `rgba(40,100,220,${d * 0.18 * bS + 0.02})`;
          ctx.lineWidth = 0.38; ctx.stroke();
        }
      });

      const cg = ctx.createRadialGradient(0, 0, 0, 0, 0, R * 0.5);
      cg.addColorStop(0, `rgba(16,185,129,${0.25 * gS * anim.current.pulse})`);
      cg.addColorStop(0.5, `rgba(0,80,180,${0.12 * bS * anim.current.pulse})`);
      cg.addColorStop(1, "rgba(0,0,0,0)");
      ctx.beginPath(); ctx.arc(0, 0, R * 0.5, 0, Math.PI * 2); ctx.fillStyle = cg; ctx.fill();

      const rim = ctx.createRadialGradient(0, 0, R * 0.76, 0, 0, R);
      rim.addColorStop(0, "rgba(0,0,0,0)");
      rim.addColorStop(1, `rgba(16,185,129,${0.18 * gS * anim.current.glow})`);
      ctx.beginPath(); ctx.arc(0, 0, R, 0, Math.PI * 2); ctx.fillStyle = rim; ctx.fill();

      const spec = ctx.createRadialGradient(-R * 0.26, -R * 0.28, 0, -R * 0.2, -R * 0.22, R * 0.38);
      spec.addColorStop(0, "rgba(255,255,255,0.28)");
      spec.addColorStop(1, "rgba(0,0,0,0)");
      ctx.beginPath(); ctx.arc(0, 0, R, 0, Math.PI * 2); ctx.fillStyle = spec; ctx.fill();

      const r1 = R * 1.28 + anim.current.glow * 4;
      ctx.save(); ctx.rotate(anim.current.ringA * 0.17);
      ctx.beginPath(); ctx.ellipse(0, 0, r1, r1 * 0.17, 0, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(0,35,102,${0.55 * bS * anim.current.glow})`; ctx.lineWidth = 1.8; ctx.stroke();
      ctx.strokeStyle = `rgba(0,35,102,${0.12 * bS})`; ctx.lineWidth = 5; ctx.stroke(); ctx.restore();

      const r2 = R * 1.16 + anim.current.pulse * 4;
      ctx.save(); ctx.rotate(-anim.current.ringA * 0.11 + 1.1);
      ctx.beginPath(); ctx.ellipse(0, 0, r2, r2 * 0.21, 0, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(16,185,129,${0.55 * gS * anim.current.pulse})`; ctx.lineWidth = 1.5; ctx.stroke();
      ctx.strokeStyle = `rgba(16,185,129,${0.1 * gS})`; ctx.lineWidth = 5; ctx.stroke(); ctx.restore();

      pts.forEach(([nx, ny, nz, phase], i) => {
        const nm = Math.sqrt(nx * nx + ny * ny + nz * nz);
        const [rx2, ry2, rz2] = rot([nx / nm, ny / nm, nz / nm], rX, autoRY);
        if (rz2 < 0) return;
        const d = (rz2 + 1) / 2, sx = rx2 * R, sy = ry2 * R;
        const isBlue = i % 3 !== 0;
        const pulse2 = 0.5 + 0.5 * Math.sin(fc * 0.045 + phase);
        const nr = 2.2 + d * 1.8 + pulse2;
        const color = isBlue ? "0,35,102" : "16,185,129";
        const aStr = isBlue ? bS : gS;
        const ng = ctx.createRadialGradient(sx, sy, 0, sx, sy, nr * 3.5);
        ng.addColorStop(0, `rgba(${color},${aStr * d * 0.5})`);
        ng.addColorStop(1, "rgba(0,0,0,0)");
        ctx.beginPath(); ctx.arc(sx, sy, nr * 3.5, 0, Math.PI * 2); ctx.fillStyle = ng; ctx.fill();
        ctx.beginPath(); ctx.arc(sx, sy, nr, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${d * 0.85 * aStr})`; ctx.fill();
      });

      ctx.restore();
      rafRef.current = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(rafRef.current);
      gsapCtx.current?.revert();
      canvas.removeEventListener("mousedown", onDown);
      canvas.removeEventListener("touchstart", onDown);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("touchend", onUp);
      window.removeEventListener("mousemove", onMove);
      canvas.removeEventListener("mouseleave", onLeave);
    };
  }, [enabled]);

  const setGlobeMode = useCallback((prev, next) => {
    const mA = anim.current.modeAlpha;
    gsap.to(mA, { [prev]: 0, duration: 0.38, ease: "power2.out" });
    gsap.to(mA, { [next]: 1, duration: 0.48, ease: "power2.out" });
  }, []);

  return { setGlobeMode };
}

/* ── MAIN ── */
const Premium3D = React.memo(() => {
  const canvasRef = useRef(null);
  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  const [chatOpen, setChatOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [activeMode, setActiveMode] = useState(0);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [ranking, setRanking] = useState([]);
  const [rankingLoading, setRankingLoading] = useState(false);
  const [userRank, setUserRank] = useState(null);
  const [matchedJobs, setMatchedJobs] = useState([]);
  const [matchedJobsLoading, setMatchedJobsLoading] = useState(false);
  const [matchedJobsShown, setMatchedJobsShown] = useState(false);
  const [threadId, setThreadId] = useState(getStoredThread());
  const [userTier, setUserTier] = useState(null);
  const [usage, setUsage] = useState(null);
  const [loggedIn, setLoggedIn] = useState(isLoggedIn());
  const [userRole, setUserRole] = useState(getUserRole());
  const [history, setHistory] = useState([]);
  const [topApplicants, setTopApplicants] = useState([]);
  const [topApplicantsLoading, setTopApplicantsLoading] = useState(false);
  const [recommendationLoading, setRecommendationLoading] = useState({ job: false, candidate: false });
  const [uploading, setUploading] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const [historyThreads, setHistoryThreads] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState(null);
  const fileInputRef = useRef(null);

  const greetingText = !loggedIn
    ? "Hi! I'm **MavenAI** 👋\n\nPlease log in to your account to get personalised career guidance based on your profile, skills, and experience."
    : userRole === "CLIENT"
      ? "Hi! I'm **MavenAI** 👋\n\nYour AI hiring assistant, powered by MavenJobs — India's #1 hiring platform.\n\nHow can I help you find the right talent today?"
      : "Hi! I'm **MavenAI** 👋\n\nYour personal career acceleration specialist, powered by MavenJobs — India's #1 hiring platform.\n\nHow can I help you land your dream role today?";

  const showGlobe = !chatOpen || minimized;
  const { setGlobeMode } = use3DGlobe(canvasRef, showGlobe);

  const refreshAuth = useCallback(() => {
    const tokenExists = isLoggedIn();
    setLoggedIn(tokenExists);
    if (tokenExists) {
      setUserRole(getUserRole());
    } else {
      setUserRole("GUEST");
      setUserTier(null);
      setUsage(null);
    }
  }, []);

  const [sidebarHidden, setSidebarHidden] = useState(() => {
    return typeof document !== "undefined" && document.body.classList.contains("employer-sidebar-open");
  });

  useEffect(() => {
    const handler = (e) => {
      setSidebarHidden(!!e.detail?.open);
    };
    window.addEventListener("employer-sidebar-toggle", handler);
    return () => window.removeEventListener("employer-sidebar-toggle", handler);
  }, []);

  useEffect(() => {
    refreshAuth();
    window.addEventListener("candidate-session-expired", refreshAuth);
    window.addEventListener("candidate-logged-in", refreshAuth);
    window.addEventListener("storage", refreshAuth);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") refreshAuth();
    });
    return () => {
      window.removeEventListener("candidate-session-expired", refreshAuth);
      window.removeEventListener("candidate-logged-in", refreshAuth);
      window.removeEventListener("storage", refreshAuth);
      document.removeEventListener("visibilitychange", refreshAuth);
    };
  }, [refreshAuth]);

  // Reset chat history when user logs out or a different user logs in
  useEffect(() => {
    setHistory([]);
    setThreadId("");
    clearThread();
    setMatchedJobsShown(false);
    setUploadedFileName(null);
  }, [loggedIn]);

  useEffect(() => {
    if (loggedIn) {
      getUsageStats().then((stats) => {
        if (stats) {
          setUserTier(stats.tier);
          setUsage({ dailyMessages: stats.dailyMessagesUsed, dailyLimit: stats.dailyMessageLimit });

          if (stats.tier === "ELITE" && chatOpen && !matchedJobsShown) {
            setMatchedJobsLoading(true);
            api.get("/chatbot/matched-jobs")
              .then(res => {
                if (res.data?.success) {
                  setMatchedJobs(res.data.data.jobs || []);
                  setMatchedJobsShown(true);
                }
              })
              .catch(() => {})
              .finally(() => setMatchedJobsLoading(false));
          }

          if (userRole === "CLIENT" && chatOpen && topApplicants.length === 0 && !topApplicantsLoading) {
            setTopApplicantsLoading(true);
            getTopApplicants()
              .then(apps => { if (apps.length > 0) setTopApplicants(apps); })
              .catch(() => {})
              .finally(() => setTopApplicantsLoading(false));
          }
        }
      });
    }
  }, [loggedIn, chatOpen]);

  const MODES = [
    { name: "Discovery", color: "#2563EB" },
    { name: "Connect", color: "#10b981" },
    { name: "Ranking", color: "#8B5CF6" },
  ];
  const LABELS = [
    `MavenAI ${userTier ? `· ${userTier}` : ""}`,
    "Reaching candidates across all channels",
    "Top 10 candidates by quiz XP",
  ];
  const getQuickReplies = () => {
    if (!loggedIn) {
      return ["Review my resume", "Interview tips", "Improve my profile"];
    }
    if (userRole === "CLIENT") {
      const replies = ["Post a job", "Hiring tips", "Pricing & plans"];
      if (userTier === "ELITE") {
        replies.unshift("Get Candidate Recommendations");
      }
      return replies;
    }
    const replies = ["Review my resume", "Interview tips", "Improve my profile"];
    if (userTier === "ELITE" || userTier === "PRO") {
      replies.unshift("Get Job Recommendations");
    }
    return replies;
  };

  useEffect(() => {
    if (scrollRef.current)
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [history, isTyping]);

  useEffect(() => {
    if (chatOpen && !minimized)
      setTimeout(() => inputRef.current?.focus(), 350);
  }, [chatOpen, minimized]);

  const handleModeSwitch = (i) => {
    if (i === activeMode) return;
    setGlobeMode(activeMode, i);
    setActiveMode(i);
  };

  useEffect(() => {
    if (!chatOpen || minimized || activeMode !== 2) return;

    let cancelled = false;
    setRankingLoading(true);
    authService.getQuizRanking()
      .then((response) => {
        if (cancelled) return;
        if (response?.success) {
          const rankingData = response.data;
          setRanking(rankingData?.top10 || []);
          setUserRank(rankingData?.userRank || null);
        }
      })
      .catch((err) => {
        if (!cancelled) setApiError(err.message || "Unable to fetch rankings");
      })
      .finally(() => {
        if (!cancelled) setRankingLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [activeMode, chatOpen, minimized]);

  const sendMessage = async (overrideText) => {
    const text = (typeof overrideText === "string" ? overrideText : input).trim();
    if (!text || isTyping) return;

    if (!loggedIn) {
      setApiError("Please login to use MavenAI");
      return;
    }

    setApiError(null);
    const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const userMsg = { role: "user", text, time: now };
    const updated = [...history, userMsg];

    setHistory(updated);
    setInput("");
    setIsTyping(true);

    try {
      const result = await callMavenBackend(text, threadId || undefined);
      const aiTime = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

      if (result.threadId) {
        setThreadId(result.threadId);
        storeThread(result.threadId);
      }
      if (result.tier) setUserTier(result.tier);
      if (result.usage) setUsage(result.usage);

      setHistory(prev => [...prev, { role: "ai", text: result.botMessage.text, time: aiTime }]);
    } catch (err) {
      console.error("MavenAI error:", err.message);
      const msg = err.response?.data?.message || err.message || "Connection issue";
      setApiError(msg);
      const aiTime = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      if (msg.includes("limit reached")) {
        setHistory(prev => [...prev, {
          role: "ai",
          text: `⚠️ **Daily message limit reached**\n\nYou've used all your ${usage?.dailyLimit || 10} messages for today. Upgrade your plan for higher limits or try again tomorrow.`,
          time: aiTime
        }]);
      } else {
        setHistory(prev => [...prev, {
          role: "ai",
          text: "I'm experiencing a brief connection issue. Please try again — I'm here to help with your career journey! 🚀",
          time: aiTime
        }]);
      }
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      const val = input.trim();
      if (val === "/history") {
        openHistory();
        setInput("");
        return;
      }
      sendMessage();
    }
  };

  const openHistory = async () => {
    if (!loggedIn) return;
    setShowHistory(true);
    setHistoryLoading(true);
    setHistoryError(null);
    try {
      const threads = await getThreadsWithDetails();
      setHistoryThreads(threads);
    } catch {
      setHistoryError("Failed to load history.");
    } finally {
      setHistoryLoading(false);
    }
  };

  const switchThread = async (targetThreadId) => {
    try {
      const response = await api.get(`/chatbot/threads/${targetThreadId}/messages?limit=100`);
      const msgs = response.data?.data?.messages || [];
      setThreadId(targetThreadId);
      storeThread(targetThreadId);
      setHistory(msgs.map(m => ({
        role: m.senderRole === "USER" ? "user" : "ai",
        text: m.text,
        time: new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      })));
      setShowHistory(false);
      // Check if the thread has a PDF
      const thread = historyThreads.find(t => String(t._id) === targetThreadId);
      if (thread && thread.hasPdf) {
        setUploadedFileName("(from history)");
      } else {
        setUploadedFileName(null);
      }
    } catch {
      setHistoryError("Failed to load conversation.");
    }
  };

  const deleteHistoryThread = async (threadIdToDelete) => {
    try {
      await api.delete(`/chatbot/threads/${threadIdToDelete}`);
      setHistoryThreads(prev => prev.filter(t => String(t._id) !== threadIdToDelete));
      if (String(threadId) === String(threadIdToDelete)) {
        setThreadId("");
        clearThread();
        setHistory([]);
        setUploadedFileName(null);
      }
    } catch {
      setHistoryError("Failed to delete thread.");
    }
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== "application/pdf") {
      setApiError("Only PDF files are allowed.");
      e.target.value = "";
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setApiError("File size exceeds 5 MB limit.");
      e.target.value = "";
      return;
    }
    setUploading(true);
    setApiError(null);
    try {
      const result = await uploadPdfFile(file, threadId || undefined);
      if (result?.success) {
        if (result.threadId) {
          setThreadId(result.threadId);
          storeThread(result.threadId);
        }
        setUploadedFileName(result.fileName || file.name);
        const aiTime = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
        setHistory(prev => [...prev, {
          role: "ai",
          text: `📄 **"${result.fileName || file.name}"** uploaded successfully. I can now answer questions based on its content.`,
          time: aiTime,
        }]);
      } else {
        setApiError(result?.message || "Upload failed.");
      }
    } catch {
      setApiError("Upload failed. Please try again.");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const removeUploadedFile = async () => {
    setUploadedFileName(null);
    const aiTime = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    setHistory(prev => [...prev, {
      role: "ai",
      text: "Uploaded file has been cleared from the conversation context.",
      time: aiTime,
    }]);
  };

  const handleQuickReply = (q) => {
    if (q.toLowerCase().includes("ranking")) {
      handleModeSwitch(2);
      return;
    }
    if (q === "Get Job Recommendations") {
      fetchJobRecommendations();
      return;
    }
    if (q === "Get Candidate Recommendations") {
      fetchCandidateRecommendations();
      return;
    }
    setInput("");
    setTimeout(() => sendMessage(q), 50);
  };

  const handleNewChat = () => {
    setHistory([]);
    setThreadId("");
    clearThread();
    setMatchedJobs([]);
    setMatchedJobsShown(false);
    setTopApplicants([]);
    setUploadedFileName(null);
    setApiError(null);
  };

  const fetchJobRecommendations = async () => {
    if (recommendationLoading.job) return;
    setRecommendationLoading(prev => ({ ...prev, job: true }));

    const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    setHistory(prev => [...prev, { role: "user", text: "Get Job Recommendations", time: now }]);

    try {
      const result = await getJobRecommendations();
      const aiTime = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

      if (!result || !result.success) {
        setHistory(prev => [...prev, {
          role: "ai",
          text: result?.message || "Unable to fetch job recommendations right now. Please try again later.",
          time: aiTime,
        }]);
        return;
      }

      if (result.jobs && result.jobs.length > 0) {
        setHistory(prev => [...prev, {
          role: "ai",
          text: result.message,
          time: aiTime,
          recommendations: result.jobs,
          recType: "jobs",
        }]);
      } else {
        setHistory(prev => [...prev, {
          role: "ai",
          text: result.message,
          time: aiTime,
        }]);
      }

      if (result.usage) {
        setUsage(prev => prev ? { ...prev, dailyJobRecommendations: result.usage } : prev);
      }
    } catch (err) {
      const aiTime = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      setHistory(prev => [...prev, {
        role: "ai",
        text: "I'm having trouble fetching job recommendations. Please try again in a moment.",
        time: aiTime,
      }]);
    } finally {
      setRecommendationLoading(prev => ({ ...prev, job: false }));
    }
  };

  const fetchCandidateRecommendations = async () => {
    if (recommendationLoading.candidate) return;
    setRecommendationLoading(prev => ({ ...prev, candidate: true }));

    const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    setHistory(prev => [...prev, { role: "user", text: "Get Candidate Recommendations", time: now }]);

    try {
      const result = await getCandidateRecommendations();
      const aiTime = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

      if (!result || !result.success) {
        setHistory(prev => [...prev, {
          role: "ai",
          text: result?.message || "Unable to fetch candidate recommendations right now. Please try again later.",
          time: aiTime,
        }]);
        return;
      }

      if (result.candidates && result.candidates.length > 0) {
        setHistory(prev => [...prev, {
          role: "ai",
          text: result.message,
          time: aiTime,
          recommendations: result.candidates,
          recType: "candidates",
        }]);
      } else {
        setHistory(prev => [...prev, {
          role: "ai",
          text: result.message,
          time: aiTime,
        }]);
      }

      if (result.usage) {
        setUsage(prev => prev ? { ...prev, dailyCandidateRecommendations: result.usage } : prev);
      }
    } catch (err) {
      const aiTime = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      setHistory(prev => [...prev, {
        role: "ai",
        text: "I'm having trouble fetching candidate recommendations. Please try again in a moment.",
        time: aiTime,
      }]);
    } finally {
      setRecommendationLoading(prev => ({ ...prev, candidate: false }));
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,700;12..96,800&family=DM+Sans:wght@400;500;600;700&display=swap');

        .mvn-wrap {
          position: fixed; bottom: 28px; right: 28px; z-index: 9999;
          font-family: 'DM Sans', system-ui, sans-serif;
          display: flex; flex-direction: column; align-items: flex-end; gap: 12px;
          transition: opacity 0.2s ease, visibility 0.2s ease;
        }

        body.employer-sidebar-open .mvn-wrap,
        .mvn-wrap.mvn-wrap-hidden {
          display: none !important;
          visibility: hidden !important;
          opacity: 0 !important;
          pointer-events: none !important;
        }

        .mvn-panel {
          width: 380px; background: #fff; border-radius: 24px;
          border: 1px solid #dde3ef;
          box-shadow: 0 24px 60px rgba(0,30,90,0.18), 0 6px 20px rgba(0,0,0,0.06);
          overflow: hidden; display: flex; flex-direction: column; height: 560px;
          transform-origin: bottom right;
          animation: mvnIn 0.38s cubic-bezier(0.34,1.56,0.64,1) forwards;
        }
        @keyframes mvnIn {
          from { opacity:0; transform:scale(0.86) translateY(14px); }
          to   { opacity:1; transform:scale(1) translateY(0); }
        }

        .mvn-header {
          background: #001a50; padding: 18px 18px 14px;
          flex-shrink: 0; position: relative; overflow: hidden;
        }
        .mvn-header::before {
          content:''; position:absolute; inset:0;
          background:
            radial-gradient(ellipse 90% 80% at 90% 5%, rgba(16,185,129,0.25), transparent 55%),
            radial-gradient(ellipse 60% 50% at 5% 95%, rgba(99,102,241,0.18), transparent 55%);
          pointer-events:none;
        }
        .mvn-header::after {
          content:''; position:absolute; inset:0;
          background-image: radial-gradient(rgba(255,255,255,0.05) 1px, transparent 1px);
          background-size: 22px 22px; pointer-events:none;
        }

        .mvn-logo-chip {
          width: 46px; height: 46px; border-radius: 13px;
          background: rgba(255,255,255,0.12);
          border: 1.5px solid rgba(255,255,255,0.2);
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0; overflow: hidden;
        }
        .mvn-logo-chip img { width: 32px; height: 32px; object-fit: contain; display: block; }

        .mvn-ai-avatar {
          width: 34px; height: 34px; border-radius: 11px;
          background: #001a50; border: 1.5px solid #003080;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0; overflow: hidden;
        }
        .mvn-ai-avatar img { width: 22px; height: 22px; object-fit: contain; display: block; }

        .mvn-online {
          width:8px; height:8px; border-radius:50%; background:#10b981;
          box-shadow:0 0 0 2px rgba(16,185,129,0.3),0 0 8px rgba(16,185,129,0.6);
          animation:mvnBlink 2.4s ease-in-out infinite; flex-shrink:0;
        }
        @keyframes mvnBlink { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.5;transform:scale(0.8)} }

        .mvn-tabs { display:flex; gap:5px; margin-top:13px; position:relative; z-index:1; }
        .mvn-tab {
          flex:1; padding:6px 0; border-radius:9px; border:1px solid;
          font-size:10px; font-weight:800; font-family:'Bricolage Grotesque',sans-serif;
          letter-spacing:0.03em; text-transform:uppercase; cursor:pointer;
          transition:all 0.2s; display:flex; align-items:center; justify-content:center; gap:5px;
        }
        .mvn-tab.off { background:rgba(255,255,255,0.04); border-color:rgba(255,255,255,0.09); color:rgba(255,255,255,0.32); }
        .mvn-tab.off:hover { background:rgba(255,255,255,0.09); color:rgba(255,255,255,0.6); border-color:rgba(255,255,255,0.16); }
        .mvn-tab.on { background:rgba(255,255,255,0.14); border-color:rgba(255,255,255,0.28); color:#fff; box-shadow:0 2px 8px rgba(0,0,0,0.18); }
        .mvn-tab-dot { width:6px; height:6px; border-radius:50%; flex-shrink:0; }

        .mvn-ctrl {
          width:30px; height:30px; border-radius:9px;
          background:rgba(255,255,255,0.07); border:1px solid rgba(255,255,255,0.12);
          color:rgba(255,255,255,0.55); cursor:pointer;
          display:flex; align-items:center; justify-content:center; transition:all 0.18s;
        }
        .mvn-ctrl:hover { background:rgba(255,255,255,0.16); color:#fff; }

        .mvn-strip {
          padding:8px 16px;
          background:linear-gradient(90deg,#EEF2FF,#F0FDF9);
          border-bottom:1px solid #e2e8f0;
          display:flex; align-items:center; gap:6px; flex-shrink:0;
        }

        .mvn-msgs {
          flex:1; overflow-y:auto; padding:16px;
          display:flex; flex-direction:column; gap:14px;
          background:#F7F9FC; scroll-behavior:smooth;
        }
        .mvn-msgs::-webkit-scrollbar { width:3px; }
        .mvn-msgs::-webkit-scrollbar-thumb { background:#CBD5E1; border-radius:99px; }

        .mvn-row { display:flex; align-items:flex-end; gap:9px; }
        .mvn-row.usr { flex-direction:row-reverse; }

        .mvn-bubble-ai {
          width: fit-content;
          max-width: 100%;
          background: #fff;
          border: 1.5px solid #E2E8F0;
          border-radius: 18px 18px 18px 5px;
          padding: 12px 14px;
          font-size: 13.5px; line-height: 1.65; color: #1e293b;
          box-shadow: 0 2px 10px rgba(0,30,80,0.07);
          word-break: break-word;
        }

        .mvn-bubble-usr {
          width: fit-content;
          max-width: 100%;
          background: linear-gradient(135deg, #0A2E8A 0%, #0F3DB5 60%, #1A52D5 100%);
          border-radius: 18px 18px 5px 18px;
          padding: 10px 16px;
          font-size: 13.5px; line-height: 1.6;
          color: #FFFFFF; font-weight: 500;
          box-shadow: 0 4px 18px rgba(10,46,138,0.32);
          word-break: break-word;
          white-space: pre-wrap;
          letter-spacing: 0.01em;
        }

        .mvn-time { font-size:10px; color:#94a3b8; font-weight:600; margin-top:4px; padding:0 2px; }

        .mvn-typing { display:flex; gap:4px; align-items:center; padding:3px 2px; }
        .mvn-dot { width:6px; height:6px; border-radius:50%; background:#94a3b8; animation:mvnDot 1.3s ease-in-out infinite; }
        .mvn-dot:nth-child(2){animation-delay:0.18s} .mvn-dot:nth-child(3){animation-delay:0.36s}
        @keyframes mvnDot { 0%,80%,100%{transform:translateY(0);opacity:.4} 40%{transform:translateY(-5px);opacity:1} }

        .mvn-error {
          margin:0 14px 8px; padding:8px 12px;
          background:#FEF2F2; border:1px solid #FECACA; border-radius:10px;
          font-size:11px; color:#B91C1C; font-weight:600;
        }

        .mvn-quick { padding:10px 14px 7px; display:flex; gap:6px; flex-wrap:wrap; background:#F7F9FC; border-top:1px solid #EDF0F5; flex-shrink:0; }
        .mvn-qbtn {
          padding:6px 13px; background:#fff; border:1.5px solid #E2E8F0; border-radius:100px;
          font-size:11.5px; font-weight:700; color:#002366; cursor:pointer;
          transition:all 0.2s cubic-bezier(0.34,1.56,0.64,1); font-family:'DM Sans',sans-serif; white-space:nowrap;
          box-shadow:0 1px 4px rgba(0,35,102,0.06);
        }
        .mvn-qbtn:hover { background:#EEF2FF; border-color:#A5B4FC; transform:translateY(-1px); box-shadow:0 3px 10px rgba(0,35,102,0.12); }

        .mvn-input-row { display:flex; gap:8px; padding:12px 14px 14px; background:#fff; border-top:1px solid #EDF0F5; flex-shrink:0; align-items:center; }
        .mvn-input {
          flex:1; background:#F7F9FC; border:1.5px solid #E2E8F0; border-radius:13px;
          padding:10px 14px; font-size:13.5px; font-weight:500; color:#1e293b;
          outline:none; font-family:'DM Sans',sans-serif; transition:border-color 0.2s,box-shadow 0.2s;
        }
        .mvn-input:focus { border-color:#93C5FD; box-shadow:0 0 0 3px rgba(0,35,102,0.07); background:#fff; }
        .mvn-input::placeholder { color:#94a3b8; font-weight:400; }
        .mvn-send {
          width:43px; height:43px; border-radius:13px; border:none;
          background:linear-gradient(135deg,#001a50,#0F3DB5);
          color:#fff; cursor:pointer; flex-shrink:0;
          display:flex; align-items:center; justify-content:center;
          box-shadow:0 4px 16px rgba(0,35,102,0.3);
          transition:all 0.22s cubic-bezier(0.34,1.56,0.64,1);
        }
        .mvn-send:hover:not(:disabled) { transform:translateY(-1.5px) scale(1.05); box-shadow:0 8px 24px rgba(0,35,102,0.42); }
        .mvn-send:disabled { opacity:0.38; cursor:not-allowed; transform:none; }

        .mvn-pill {
          display:flex; align-items:center; gap:9px; padding:10px 18px;
          background:linear-gradient(135deg,#001030,#001a50);
          border-radius:100px; cursor:pointer;
          box-shadow:0 10px 30px rgba(0,35,102,0.36); border:1px solid rgba(255,255,255,0.1);
          transition:all 0.25s cubic-bezier(0.34,1.56,0.64,1);
          animation:mvnIn 0.3s ease forwards;
        }
        .mvn-pill:hover { transform:translateY(-2px) scale(1.02); box-shadow:0 14px 38px rgba(0,35,102,0.46); }
        .mvn-pill-logo { width:22px; height:22px; object-fit:contain; display:block; }

        .mvn-globe-btn {
          width:72px; height:72px; border-radius:50%;
          background:linear-gradient(140deg,#001030 0%,#002b7a 100%);
          border:2px solid rgba(255,255,255,0.1);
          box-shadow:0 10px 36px rgba(0,35,102,0.44),0 2px 10px rgba(0,35,102,0.2),inset 0 1px 0 rgba(255,255,255,0.12);
          display:flex; align-items:center; justify-content:center;
          cursor:pointer; position:relative;
          transition:transform 0.3s cubic-bezier(0.34,1.56,0.64,1),box-shadow 0.3s;
          overflow:hidden;
        }
        .mvn-globe-btn::before { content:''; position:absolute; inset:0; border-radius:50%; background:radial-gradient(circle at 35% 30%,rgba(255,255,255,0.15),transparent 60%); pointer-events:none; }
        .mvn-globe-btn:hover { transform:scale(1.1) translateY(-3px); box-shadow:0 20px 54px rgba(0,35,102,0.52),0 4px 14px rgba(16,185,129,0.2); }
        .mvn-ring { position:absolute; border-radius:50%; border:2px solid; pointer-events:none; animation:mvnRing 2.8s ease-out infinite; }
        .mvn-ring-1 { inset:-8px; border-color:rgba(16,185,129,0.32); animation-delay:0s; }
        .mvn-ring-2 { inset:-16px; border-color:rgba(0,35,102,0.18); animation-delay:1s; }
        @keyframes mvnRing { 0%{transform:scale(1);opacity:.75} 100%{transform:scale(1.5);opacity:0} }
        .mvn-badge { position:absolute; top:-2px; right:-2px; width:18px; height:18px; border-radius:50%; background:#10b981; border:2.5px solid #fff; box-shadow:0 2px 8px rgba(16,185,129,0.55); animation:mvnBadge 2.4s ease-in-out infinite; }
        @keyframes mvnBadge { 0%,100%{transform:scale(1)} 50%{transform:scale(1.2)} }

        .mvn-tooltip {
          position:absolute; bottom:86px; right:0;
          background:#fff; border:1.5px solid #E2E8F0; border-radius:14px;
          padding:10px 16px; font-size:12px; font-weight:700; color:#002366;
          white-space:nowrap; box-shadow:0 8px 24px rgba(0,35,102,0.12);
          font-family:'DM Sans',sans-serif; pointer-events:none;
          opacity:0; animation:mvnTip 0.4s ease 1.5s forwards;
          display:flex; align-items:center; gap:7px;
        }
        .mvn-tooltip::after { content:''; position:absolute; bottom:-7px; right:26px; width:12px; height:12px; background:#fff; border-right:1.5px solid #E2E8F0; border-bottom:1.5px solid #E2E8F0; transform:rotate(45deg); }
        @keyframes mvnTip { from{opacity:0;transform:translateY(5px)} to{opacity:1;transform:translateY(0)} }

        .mvn-sep { display:flex; align-items:center; gap:10px; margin:2px 0; }
        .mvn-sep span { font-size:10px; font-weight:700; color:#94a3b8; letter-spacing:0.06em; text-transform:uppercase; white-space:nowrap; }
        .mvn-sep::before,.mvn-sep::after { content:''; flex:1; height:1px; background:#E2E8F0; }
        .mvn-rank-table { border:1px solid #E2E8F0; border-radius:16px; overflow:hidden; background:#fff; box-shadow:0 8px 24px rgba(0,35,102,.06); }
        .mvn-rank-row { display:grid; grid-template-columns:38px minmax(0,1fr) 58px 46px; gap:8px; align-items:center; padding:10px 12px; border-top:1px solid #EEF2F7; font-size:11px; color:#334155; }
        .mvn-rank-row:first-child { border-top:0; }
        .mvn-rank-head { background:#F8FAFC; color:#64748B; font-size:9px; font-weight:800; letter-spacing:.08em; text-transform:uppercase; }
        .mvn-rank-name { min-width:0; font-weight:800; color:#0f172a; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .mvn-rank-sub { margin-top:2px; font-size:9.5px; color:#94A3B8; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .mvn-rank-xp { font-weight:900; color:#002366; text-align:right; }
        .mvn-rank-empty { padding:18px; text-align:center; color:#64748B; font-size:12px; line-height:1.5; }

        .mvn-upload-btn {
          width:36px; height:36px; border-radius:10px; border:1.5px solid #E2E8F0;
          background:#F7F9FC; color:#64748B; cursor:pointer; flex-shrink:0;
          display:flex; align-items:center; justify-content:center;
          transition:all 0.2s; font-size:13px;
        }
        .mvn-upload-btn:hover:not(:disabled) { background:#EEF2FF; border-color:#A5B4FC; color:#002366; }
        .mvn-upload-btn:disabled { opacity:0.4; cursor:not-allowed; }

        .mvn-input-wrap { position:relative; flex:1; display:flex; }
        .mvn-slash-suggest {
          position:absolute; bottom:100%; left:0; right:0; margin-bottom:6px;
          background:#fff; border:1px solid #E2E8F0; border-radius:12px;
          box-shadow:0 4px 20px rgba(0,35,102,0.12); overflow:hidden; z-index:10;
        }
        .mvn-slash-item {
          display:flex; align-items:center; gap:8px; padding:10px 14px;
          font-size:13px; font-weight:600; color:#1e293b; cursor:pointer;
          border-bottom:1px solid #F1F5F9; transition:background 0.15s;
        }
        .mvn-slash-item:last-child { border-bottom:none; }
        .mvn-slash-item:hover { background:#EFF6FF; }
        .mvn-slash-item code { background:#F1F5F9; padding:2px 8px; border-radius:6px; font-size:12px; color:#002366; }

        .mvn-history-overlay {
          position:absolute; inset:0; z-index:100;
          background:rgba(15,23,42,0.5); backdrop-filter:blur(4px);
          display:flex; align-items:center; justify-content:center;
          animation:mvnFade 0.2s ease;
        }
        @keyframes mvnFade { from{opacity:0} to{opacity:1} }
        .mvn-history-modal {
          width:88%; max-height:70%; background:#fff; border-radius:20px;
          box-shadow:0 24px 60px rgba(0,0,0,0.25); overflow:hidden;
          display:flex; flex-direction:column; animation:mvnSlide 0.25s ease;
        }
        @keyframes mvnSlide { from{opacity:0;transform:translateY(10px) scale(0.96)} to{opacity:1;transform:translateY(0) scale(1)} }
        .mvn-history-header {
          padding:16px 18px 12px; border-bottom:1px solid #E2E8F0;
          display:flex; align-items:center; justify-content:space-between; flex-shrink:0;
        }
        .mvn-history-list { flex:1; overflow-y:auto; padding:8px 0; }
        .mvn-history-item {
          display:flex; align-items:center; gap:10px;
          padding:12px 18px; cursor:pointer;
          transition:background 0.12s; border-bottom:1px solid #F1F5F9;
        }
        .mvn-history-item:hover { background:#F8FAFC; }
        .mvn-history-item:active { background:#F1F5F9; }
      
      /* ── RESPONSIVE FIXES ── */
      @media (max-width: 480px) {
        .mvn-wrap {
          bottom: 16px;
          right: 16px;
          left: auto;
        }
        .mvn-panel {
          width: calc(100vw - 32px);
          max-width: calc(100vw - 32px);
          height: calc(100vh - 120px);
          max-height: 560px;
          border-radius: 20px 20px 16px 16px;
          animation: mvnInMobile 0.35s cubic-bezier(0.34,1.56,0.64,1) forwards;
          transform-origin: bottom right;
        }
        @keyframes mvnInMobile {
          from { opacity:0; transform:translateY(20px) scale(0.98); }
          to   { opacity:1; transform:translateY(0) scale(1); }
        }
        .mvn-header { padding: 16px 16px 12px; }
        .mvn-tabs { gap: 3px; margin-top: 10px; }
        .mvn-tab { font-size: 9px; padding: 5px 0; }
        .mvn-msgs { padding: 12px; gap: 10px; }
        .mvn-bubble-ai, .mvn-bubble-usr { font-size: 12.5px; padding: 10px 12px; max-width: 90%; }
        .mvn-row { gap: 7px; }
        .mvn-quick { padding: 8px 12px 6px; gap: 5px; }
        .mvn-qbtn { font-size: 10.5px; padding: 5px 11px; }
        .mvn-input-row { padding: 10px 12px 12px; gap: 6px; }
        .mvn-input { font-size: 13px; padding: 9px 12px; }
        .mvn-send { width: 38px; height: 38px; border-radius: 11px; }
        .mvn-globe-btn { width: 64px; height: 64px; }
        .mvn-tooltip { display: none; }
        .mvn-ring-1 { inset: -6px; }
        .mvn-ring-2 { inset: -12px; }
        .mvn-pill { padding: 8px 14px; border-radius: 100px; }
        .mvn-pill-logo { width: 20px; height: 20px; }
        .mvn-pill span { font-size: 12px; }
        .mvn-history-modal { width: 100%; max-height: 85vh; border-radius: 16px 16px 12px 12px; }
        .mvn-history-header { padding: 14px 16px 10px; }
        .mvn-history-item { padding: 10px 16px; }
        .mvn-strip { padding: 7px 14px; }
        .mvn-logo-chip { width: 42px; height: 42px; border-radius: 11px; }
        .mvn-logo-chip img { width: 28px; height: 28px; }
      }
      
      @media (max-width: 768px) and (min-width: 481px) {
        .mvn-wrap {
          bottom: 20px;
          right: 20px;
        }
        .mvn-panel {
          width: 360px;
          max-width: calc(100vw - 40px);
          height: 520px;
        }
        .mvn-globe-btn { width: 68px; height: 68px; }
      }
      
      @media (max-width: 1024px) and (min-width: 769px) {
        .mvn-wrap {
          bottom: 24px;
          right: 24px;
        }
        .mvn-panel {
          width: 380px;
        }
      }
    `}</style>

      <div
        className={`mvn-wrap ${sidebarHidden ? "mvn-wrap-hidden" : ""}`}
        style={sidebarHidden ? { display: "none" } : undefined}
      >

        {chatOpen && !minimized && (
          <div className="mvn-panel">

            <div className="mvn-header">
              <div style={{ position: "relative", zIndex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div className="mvn-logo-chip">
                    <img src={mavenLogo} alt="MavenJobs" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontSize: 16, fontWeight: 800, color: "#fff", letterSpacing: "-0.015em", lineHeight: 1.2 }}>
                        MavenAI
                      </div>
                      {loggedIn && <TierBadge tier={userTier} usage={usage} />}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
                      <div className="mvn-online" />
                      <span style={{ fontSize: 10, fontWeight: 700, color: "#6EE7B7", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                        {loggedIn ? `${userRole === "CLIENT" ? "Employer" : "Career"} Specialist` : "AI Assistant"}
                      </span>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    {loggedIn && (
                      <button className="mvn-ctrl" onClick={(e) => { e.stopPropagation(); openHistory(); }} title="Chat History"><FiClock size={13} /></button>
                    )}
                    {loggedIn && (
                      <button className="mvn-ctrl" onClick={(e) => { e.stopPropagation(); handleNewChat(); }} title="New Chat"><FiPlus size={13} /></button>
                    )}
                    <button className="mvn-ctrl" onClick={() => setMinimized(true)} title="Minimise"><FiMinus size={13} /></button>
                    <button className="mvn-ctrl" onClick={() => { setChatOpen(false); setMinimized(false); }} title="Close"><FiX size={13} /></button>
                  </div>
                </div>
                <div className="mvn-tabs">
                  {MODES.map((m, i) => (
                    <button key={i} className={`mvn-tab ${activeMode === i ? "on" : "off"}`} onClick={() => handleModeSwitch(i)}>
                      <span className="mvn-tab-dot" style={{ background: m.color }} />
                      {m.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mvn-strip">
              <FiZap size={11} color="#002366" fill="#002366" />
              <span style={{ fontSize: 11.5, fontWeight: 700, color: "#002366" }}>{LABELS[activeMode]}</span>
            </div>

            <div className="mvn-msgs" ref={scrollRef}>
              {activeMode === 2 ? (
                <>
                  <div style={{
                    display: "flex", alignItems: "center", gap: 8,
                    marginBottom: 12, padding: "0 2px",
                  }}>
                    <div style={{
                      width: 4, height: 18, borderRadius: 4,
                      background: "linear-gradient(180deg,#8B5CF6,#6366F1)",
                    }} />
                    <span style={{
                      fontFamily: "'Bricolage Grotesque',sans-serif",
                      fontSize: 12, fontWeight: 800, color: "#0f172a",
                      letterSpacing: "-0.02em",
                    }}>Daily Quiz Leaderboard</span>
                  </div>
                <div className="mvn-rank-table">
                  <div className="mvn-rank-row mvn-rank-head">
                    <span>#</span><span>Candidate</span><span style={{ textAlign: "right" }}>XP</span><span style={{ textAlign: "right" }}>Quiz</span>
                  </div>
                  {rankingLoading ? (
                    <div className="mvn-rank-empty">Loading rankings...</div>
                  ) : ranking.length ? (
                    <>
                      {ranking.slice(0, 3).map((row) => (
                        <div className="mvn-rank-row" key={row.candidateId} style={{ background: "linear-gradient(90deg,rgba(217,119,6,.06),transparent)" }}>
                          <span style={{ fontWeight: 900, color: row.rank === 1 ? "#d97706" : row.rank === 2 ? "#a3a3a3" : row.rank === 3 ? "#b45309" : "#64748b", fontSize: row.rank === 1 ? 16 : 14 }}>
                            {row.rank === 1 ? "🥇" : row.rank === 2 ? "🥈" : row.rank === 3 ? "🥉" : row.rank}
                          </span>
                          <div style={{ minWidth: 0 }}>
                            <div className="mvn-rank-name" style={{ color: row.rank <= 3 ? "#0f172a" : undefined }}>{row.name}</div>
                            <div className="mvn-rank-sub">{row.headline}</div>
                          </div>
                          <span className="mvn-rank-xp" style={{ color: row.rank <= 3 ? "#d97706" : undefined }}>{row.totalXp}</span>
                          <span style={{ textAlign: "right", color: "#64748b", fontWeight: 800 }}>{row.quizzesPlayed}</span>
                        </div>
                      ))}
                      {ranking.length > 3 && (
                        <>
                          <div style={{ borderTop: "1px dashed #e2e8f0", margin: "4px 0" }} />
                          {ranking.slice(3, 10).map((row) => (
                            <div className="mvn-rank-row" key={row.candidateId}>
                              <span style={{ fontWeight: 900, color: "#64748b", fontSize: 13 }}>{row.rank}</span>
                              <div style={{ minWidth: 0 }}>
                                <div className="mvn-rank-name">{row.name}</div>
                                <div className="mvn-rank-sub">{row.headline}</div>
                              </div>
                              <span className="mvn-rank-xp">{row.totalXp}</span>
                              <span style={{ textAlign: "right", color: "#64748b", fontWeight: 800 }}>{row.quizzesPlayed}</span>
                            </div>
                          ))}
                        </>
                      )}
                      {/* User Rank */}
                      {userRank && (
                        <div style={{
                          marginTop: 16, padding: "16px",
                          borderRadius: 12,
                          background: userRank.rank <= 10
                            ? "linear-gradient(135deg,rgba(217,119,6,.08),rgba(16,185,129,.08))"
                            : "#f8fafc",
                          border: userRank.rank <= 10
                            ? "1.5px solid rgba(217,119,6,.25)"
                            : "1.5px solid #e2e8f0",
                          textAlign: "center",
                        }}>
                          <div style={{ fontSize: 10, fontWeight: 800, color: "#94a3b8", textTransform: "uppercase", letterSpacing: ".15em", marginBottom: 8 }}>
                            Your Rank
                          </div>
                          <div style={{ fontSize: 32, fontWeight: 900, color: userRank.rank <= 10 ? "#d97706" : "#002366", lineHeight: 1, marginBottom: 4 }}>
                            #{userRank.rank}
                          </div>
                          <div style={{ fontSize: 12, color: "#64748b", fontWeight: 600, marginBottom: 8 }}>
                            of {userRank.totalCandidates} Candidate{userRank.totalCandidates !== 1 ? "s" : ""}
                            {userRank.totalXp > 0 && <span style={{ color: "#94a3b8" }}> · {userRank.totalXp} XP</span>}
                          </div>
                          {userRank.rank <= 3 && (
                            <div style={{ fontSize: 11, color: "#d97706", fontWeight: 700 }}>
                              🏆 Elite — you're among the best!
                            </div>
                          )}
                          {userRank.rank > 3 && userRank.rank <= 10 && (
                            <div style={{ fontSize: 11, color: "#10b981", fontWeight: 700 }}>
                              🔥 Top 10 — keep pushing higher!
                            </div>
                          )}
                          {userRank.rank > 10 && userRank.rank <= 50 && (
                            <div style={{ fontSize: 11, color: "#64748b", fontWeight: 600 }}>
                              📈 {userRank.rank - 10} more spots to break into the top 10.
                            </div>
                          )}
                          {userRank.rank > 50 && (
                            <div style={{ fontSize: 11, color: "#64748b", fontWeight: 600 }}>
                              🎯 Play daily to climb the ranks.
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="mvn-rank-empty">No quiz XP yet. Play today's quiz to enter the top 10.</div>
                  )}
                  </div>
                </>
              ) : !loggedIn ? (
                <LoginPrompt />
              ) : history.length === 0 && matchedJobsLoading ? (
                <div style={{ padding: "0 12px 8px", textAlign: "center" }}>
                  <div style={{ fontSize: 10, color: "#94a3b8", padding: "12px 0" }}>Finding best matches for you…</div>
                </div>
              ) : history.length === 0 && matchedJobs.length > 0 ? (
                <div style={{ padding: "0 12px 8px" }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8, paddingLeft: 4 }}>
                    Top matches for you
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {matchedJobs.slice(0, 4).map(job => (
                      <a
                        key={String(job._id)}
                        href={`/jobs/${job._id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          padding: "10px 12px",
                          borderRadius: 10,
                          background: "#ffffff",
                          border: "1px solid #e2e8f0",
                          textDecoration: "none",
                          transition: "all 0.15s",
                          cursor: "pointer",
                        }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = "#2563eb"; e.currentTarget.style.boxShadow = "0 2px 8px rgba(37,99,235,0.1)"; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = "#e2e8f0"; e.currentTarget.style.boxShadow = "none"; }}
                      >
                        <div style={{
                          width: 34, height: 34, borderRadius: 8,
                          background: "linear-gradient(135deg, #eef2ff, #e0e7ff)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 12, fontWeight: 800, color: "#4338ca", flexShrink: 0,
                        }}>
                          {job.company?.charAt(0) || "J"}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {job.title}
                          </div>
                          <div style={{ fontSize: 10, color: "#64748b", marginTop: 1 }}>
                            {job.company} · {job.location}
                          </div>
                        </div>
                        <div style={{
                          display: "flex", alignItems: "center", gap: 4,
                          padding: "4px 10px", borderRadius: 100,
                          background: "#dcfce7", fontSize: 10, fontWeight: 800, color: "#166534", flexShrink: 0,
                        }}>
                          {job.matchScore}% Match
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              ) : history.length === 0 && userRole === "CLIENT" && topApplicants.length > 0 ? (
                <div style={{ padding: "0 12px 8px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8, paddingLeft: 4 }}>
                    <div style={{
                      padding: "2px 8px", borderRadius: 6, fontSize: 9, fontWeight: 800,
                      background: "#FEF3C7", color: "#92400E", letterSpacing: "0.05em",
                    }}>AI-Ranked</div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                      Top Matches
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {topApplicants.slice(0, 3).map((cand, idx) => (
                      <CandidateRecommendationCard key={cand.candidateId || idx} candidate={cand} />
                    ))}
                  </div>
                  <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 8, paddingLeft: 4 }}>
                    Based on recent applicants to your jobs — updates in real-time
                  </div>
                </div>
              ) : history.length === 0 ? (
                <div className="mvn-row">
                  <div className="mvn-ai-avatar">
                    <img src={mavenLogo} alt="MavenAI" />
                  </div>
                  <div style={{ maxWidth: "75%", alignSelf: "flex-end" }}>
                    <div className="mvn-bubble-ai">
                      {renderMarkdown(greetingText)}
                    </div>
                    <div className="mvn-time" style={{ textAlign: "left" }}>
                      {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                </div>
              ) : history.map((msg, i) => (
                <div key={i}>
                  <div className={`mvn-row ${msg.role === "user" ? "usr" : ""}`}>
                    {msg.role === "ai" && (
                      <div className="mvn-ai-avatar">
                        <img src={mavenLogo} alt="MavenAI" />
                      </div>
                    )}
                    <div style={{ maxWidth: "75%", alignSelf: "flex-end" }}>
                      <div className={msg.role === "ai" ? "mvn-bubble-ai" : "mvn-bubble-usr"}>
                        {msg.role === "ai"
                          ? renderMarkdown(msg.text)
                          : <span style={{ whiteSpace: "pre-wrap" }}>{msg.text}</span>
                        }
                      </div>
                      <div className="mvn-time" style={{ textAlign: msg.role === "user" ? "right" : "left" }}>
                        {msg.time}
                      </div>
                    </div>
                  </div>
                  {msg.recommendations && msg.recType === "jobs" && (
                    <div style={{ padding: "6px 0 2px 44px", display: "flex", flexDirection: "column", gap: 6 }}>
                      {msg.recommendations.map(job => (
                        <JobRecommendationCard key={String(job._id)} job={job} />
                      ))}
                    </div>
                  )}
                  {msg.recommendations && msg.recType === "candidates" && (
                    <div style={{ padding: "6px 0 2px 44px", display: "flex", flexDirection: "column", gap: 6 }}>
                      {msg.recommendations.map((cand, idx) => (
                        <CandidateRecommendationCard key={cand.candidateId || idx} candidate={cand} />
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {activeMode !== 2 && isTyping && loggedIn && (
                <div className="mvn-row">
                  <div className="mvn-ai-avatar"><img src={mavenLogo} alt="MavenAI" /></div>
                  <div className="mvn-bubble-ai" style={{ padding: "13px 16px" }}>
                    <div className="mvn-typing">
                      <div className="mvn-dot" /><div className="mvn-dot" /><div className="mvn-dot" />
                    </div>
                  </div>
                </div>
              )}
              {(recommendationLoading.job || recommendationLoading.candidate) && (
                <div style={{ padding: "0 12px 8px", textAlign: "center" }}>
                  <div style={{ fontSize: 10, color: "#94a3b8", padding: "12px 0" }}>
                    Fetching recommendations…
                  </div>
                </div>
              )}
            </div>

            {apiError && (
              <div className="mvn-error">⚠ {apiError.slice(0, 100)}</div>
            )}

            {loggedIn && history.length === 0 && (
              <div className="mvn-quick">
                {getQuickReplies().map((q, i) => (
                  <button key={i} className="mvn-qbtn" onClick={() => handleQuickReply(q)}>{q}</button>
                ))}
              </div>
            )}

            <div className="mvn-input-row">
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,application/pdf"
                onChange={handleFileSelect}
                style={{ display: "none" }}
              />
              {loggedIn && (
                <button
                  className="mvn-upload-btn"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading || isTyping}
                  title="Upload PDF"
                >
                  <FiUpload size={15} />
                </button>
              )}
              <div className="mvn-input-wrap">
                {loggedIn && input.startsWith("/") && input !== "/history" && (
                  <div className="mvn-slash-suggest">
                    <div className="mvn-slash-item" onClick={() => { setInput("/history"); inputRef.current?.focus(); }}>
                      <FiClock size={14} /> <code>/history</code> — View past conversations
                    </div>
                  </div>
                )}
                <input
                  ref={inputRef}
                  className="mvn-input"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={loggedIn ? "Ask MavenAI anything… (/history for past chats)" : "Login to chat with MavenAI"}
                  disabled={isTyping || !loggedIn}
                />
              </div>
              <button
                className="mvn-send"
                onClick={() => sendMessage()}
                disabled={!input.trim() || isTyping || !loggedIn}
              >
                <FiSend size={16} />
              </button>
            </div>
            {uploadedFileName && (
              <div style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "4px 14px 6px", fontSize: 11, fontWeight: 600,
                color: "#1e40af", background: "#eff6ff",
                borderTop: "1px solid #dbeafe",
              }}>
                <FiFileText size={12} />
                <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {uploadedFileName}
                </span>
                <button
                  onClick={removeUploadedFile}
                  style={{
                    background: "none", border: "none", cursor: "pointer",
                    color: "#94a3b8", padding: 2, display: "flex",
                  }}
                  title="Remove file"
                >
                  <FiX size={12} />
                </button>
              </div>
            )}

            {/* ── HISTORY MODAL ── */}
            {showHistory && (
              <div className="mvn-history-overlay" onClick={() => setShowHistory(false)}>
                <div className="mvn-history-modal" onClick={e => e.stopPropagation()}>
                  <div className="mvn-history-header">
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <FiClock size={15} color="#002366" />
                      <span style={{ fontSize: 14, fontWeight: 800, color: "#0f172a" }}>Chat History</span>
                    </div>
                    <button
                      className="mvn-ctrl"
                      onClick={() => setShowHistory(false)}
                      style={{ width: 28, height: 28, borderRadius: 8 }}
                    >
                      <FiX size={12} />
                    </button>
                  </div>
                  <div className="mvn-history-list">
                    {historyLoading ? (
                      <div style={{ padding: 24, textAlign: "center", fontSize: 12, color: "#94a3b8" }}>
                        Loading conversations…
                      </div>
                    ) : historyThreads.length === 0 ? (
                      <div style={{ padding: 24, textAlign: "center", fontSize: 12, color: "#94a3b8", lineHeight: 1.6 }}>
                        No past conversations found.
                        <br />Start a new chat to begin.
                      </div>
                    ) : (
                      historyThreads.map(thread => (
                        <div key={String(thread._id)} className="mvn-history-item" onClick={() => switchThread(String(thread._id))}>
                          <div style={{
                            width: 32, height: 32, borderRadius: 8,
                            background: thread.hasPdf ? "#fef3c7" : "#f1f5f9",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            flexShrink: 0,
                          }}>
                            {thread.hasPdf ? <FiFileText size={14} color="#92400e" /> : <FiClock size={14} color="#64748b" />}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 12, fontWeight: 700, color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {thread.title || "Chat"}
                            </div>
                            <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 1 }}>
                              {thread.messageCount} message{thread.messageCount !== 1 ? "s" : ""}
                              {thread.hasPdf ? " · PDF attached" : ""}
                              {" · "}
                              {new Date(thread.lastActivityAt || thread.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                            </div>
                          </div>
                          <button
                            onClick={(e) => { e.stopPropagation(); deleteHistoryThread(String(thread._id)); }}
                            style={{
                              background: "none", border: "none", cursor: "pointer",
                              color: "#94a3b8", padding: 4, borderRadius: 6, display: "flex",
                              flexShrink: 0, transition: "color 0.15s",
                            }}
                            onMouseEnter={e => e.currentTarget.style.color = "#ef4444"}
                            onMouseLeave={e => e.currentTarget.style.color = "#94a3b8"}
                            title="Delete"
                          >
                            <FiTrash2 size={13} />
                          </button>
                        </div>
                      ))
                    )}
                    {historyError && (
                      <div style={{ padding: "8px 18px", fontSize: 11, color: "#b91c1c", background: "#fef2f2" }}>
                        {historyError}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {chatOpen && minimized && (
          <div className="mvn-pill" onClick={() => setMinimized(false)}>
            <div className="mvn-online" style={{ width: 7, height: 7 }} />
            <img src={mavenLogo} alt="MavenAI" className="mvn-pill-logo" />
            <span style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontSize: 13.5, fontWeight: 800, color: "#fff" }}>MavenAI</span>
            <FiChevronDown size={14} color="rgba(255,255,255,0.5)" />
          </div>
        )}

        <div style={{ position: "relative", display: "inline-block" }}>
          {!chatOpen && (
            <div className="mvn-tooltip">
              <FiStar size={10} color="#10b981" fill="#10b981" />
              Chat with MavenAI
            </div>
          )}
          <div className="mvn-ring mvn-ring-1" />
          <div className="mvn-ring mvn-ring-2" />
          <button
            className="mvn-globe-btn"
            onClick={() => {
              refreshAuth();
              if (chatOpen && minimized) setMinimized(false);
              else if (!chatOpen) { setChatOpen(true); setMinimized(false); }
              else setMinimized(true);
            }}
            title="MavenAI"
          >
            <canvas ref={canvasRef} style={{ cursor: "grab", borderRadius: "50%", display: "block" }} />
          </button>
          <div className="mvn-badge" />
        </div>

      </div>
    </>
  );
});

export default Premium3D;

