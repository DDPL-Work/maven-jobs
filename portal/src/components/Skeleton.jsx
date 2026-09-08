import React from "react";

const pulse = `
@keyframes sk-pulse {
  0% { opacity: 0.6; }
  50% { opacity: 1; }
  100% { opacity: 0.6; }
}
.sk { animation: sk-pulse 1.5s ease-in-out infinite; }
`;

export function SkeletonLine({ width = "100%", height = 12, style }) {
  return <div className="sk" style={{ width, height, borderRadius: 6, background: "#e2e8f0", ...style }} />;
}

export function SkeletonBlock({ width = "100%", height = 100, rounded = 12, style }) {
  return <div className="sk" style={{ width, height, borderRadius: rounded, background: "#e2e8f0", ...style }} />;
}

export function SkeletonCircle({ size = 40, style }) {
  return <div className="sk" style={{ width: size, height: size, borderRadius: "50%", background: "#e2e8f0", flexShrink: 0, ...style }} />;
}

export function SkeletonCard({ lines = 3, lineHeight = 10, thumb = false, style }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: 16, background: "#fff", borderRadius: 12, border: "1px solid #f1f5f9", ...style }}>
      {thumb && <SkeletonBlock height={120} rounded={8} />}
      {Array.from({ length: lines }).map((_, i) => (
        <SkeletonLine key={i} width={`${70 + Math.random() * 30}%`} height={lineHeight} />
      ))}
    </div>
  );
}

export function SkeletonJobCard({ style }) {
  return (
    <div style={{ display: "flex", gap: 12, padding: 16, background: "#fff", borderRadius: 12, border: "1px solid #f1f5f9", ...style }}>
      <SkeletonBlock width={56} height={56} rounded={12} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
        <SkeletonLine width="55%" height={14} />
        <SkeletonLine width="35%" height={11} />
        <SkeletonLine width="70%" height={10} />
        <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
          <SkeletonLine width={60} height={20} rounded={99} />
          <SkeletonLine width={80} height={20} rounded={99} />
          <SkeletonLine width={50} height={20} rounded={99} />
        </div>
      </div>
    </div>
  );
}

export function SkeletonCompanyCard({ style }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, padding: 16, background: "#fff", borderRadius: 12, border: "1px solid #f1f5f9", alignItems: "center", ...style }}>
      <SkeletonCircle size={56} />
      <SkeletonLine width="60%" height={13} />
      <SkeletonLine width="40%" height={10} />
      <SkeletonLine width="80%" height={10} />
    </div>
  );
}

export function SkeletonBlogCard({ style }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, background: "#fff", borderRadius: 12, overflow: "hidden", border: "1px solid #f1f5f9", ...style }}>
      <SkeletonBlock height={160} rounded={0} />
      <div style={{ padding: "12px 14px 16px", display: "flex", flexDirection: "column", gap: 6 }}>
        <SkeletonLine width="30%" height={10} />
        <SkeletonLine width="85%" height={13} />
        <SkeletonLine width="70%" height={13} />
        <SkeletonLine width="50%" height={10} />
      </div>
    </div>
  );
}

export function SkeletonProfileHeader({ style }) {
  return (
    <div style={{ display: "flex", gap: 16, padding: 20, background: "#fff", borderRadius: 16, border: "1px solid #f1f5f9", ...style }}>
      <SkeletonCircle size={72} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6, justifyContent: "center" }}>
        <SkeletonLine width="45%" height={18} />
        <SkeletonLine width="30%" height={12} />
        <SkeletonLine width="55%" height={10} />
      </div>
    </div>
  );
}

export function SkeletonTable({ rows = 5, cols = 4, style }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 2, ...style }}>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} style={{ display: "flex", gap: 12, padding: "10px 12px" }}>
          {Array.from({ length: cols }).map((_, c) => (
            <SkeletonLine key={c} width={`${80 / cols}%`} height={10} />
          ))}
        </div>
      ))}
    </div>
  );
}

export function SkeletonStatsRow({ count = 4, style }) {
  return (
    <div style={{ display: "flex", gap: 12, ...style }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} style={{ flex: 1, padding: 14, background: "#fff", borderRadius: 12, border: "1px solid #f1f5f9", display: "flex", flexDirection: "column", gap: 6 }}>
          <SkeletonLine width="50%" height={10} />
          <SkeletonLine width="30%" height={22} />
        </div>
      ))}
    </div>
  );
}

export function SkeletonSearchBar({ style }) {
  return (
    <div style={{ display: "flex", gap: 8, alignItems: "center", ...style }}>
      <SkeletonBlock height={48} rounded={12} />
      <SkeletonBlock width={120} height={48} rounded={12} />
      <SkeletonBlock width={100} height={48} rounded={12} />
    </div>
  );
}

export function SkeletonHero({ style }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, alignItems: "center", padding: "60px 20px", ...style }}>
      <SkeletonLine width="50%" height={36} />
      <SkeletonLine width="35%" height={18} />
      <SkeletonSearchBar style={{ width: "100%", maxWidth: 700 }} />
      <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
        <SkeletonLine width={80} height={28} rounded={99} />
        <SkeletonLine width={100} height={28} rounded={99} />
        <SkeletonLine width={90} height={28} rounded={99} />
      </div>
    </div>
  );
}

export function SkeletonDashboard({ style }) {
  return (
    <div style={{ display: "flex", gap: 16, ...style }}>
      <div style={{ width: 280, display: "flex", flexDirection: "column", gap: 8 }}>
        <SkeletonProfileHeader />
        <SkeletonBlock height={200} />
      </div>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 12 }}>
        <SkeletonStatsRow count={3} />
        <SkeletonJobCard />
        <SkeletonJobCard />
        <SkeletonJobCard />
      </div>
    </div>
  );
}

export function SkeletonPage({ variant = "default", style }) {
  return (
    <div style={{ padding: "24px", maxWidth: 1200, margin: "0 auto", ...style }}>
      {variant === "hero" && <SkeletonHero />}
      {variant === "dashboard" && <SkeletonDashboard />}
      {variant === "list" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <SkeletonSearchBar />
          <div style={{ marginTop: 12 }}>{Array.from({ length: 6 }).map((_, i) => <SkeletonJobCard key={i} style={{ marginBottom: 8 }} />)}</div>
        </div>
      )}
      {variant === "grid" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16 }}>
          {Array.from({ length: 8 }).map((_, i) => <SkeletonCompanyCard key={i} />)}
        </div>
      )}
      {variant === "blogs" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
          {Array.from({ length: 6 }).map((_, i) => <SkeletonBlogCard key={i} />)}
        </div>
      )}
      {variant === "detail" && (
        <div style={{ display: "flex", gap: 24 }}>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 12 }}>
            <SkeletonBlock height={200} />
            <SkeletonLine width="60%" height={22} />
            <SkeletonLine width="80%" height={12} />
            <SkeletonLine width="70%" height={12} />
            <SkeletonBlock height={120} />
          </div>
          <div style={{ width: 320, display: "flex", flexDirection: "column", gap: 10 }}>
            <SkeletonBlock height={180} />
            <SkeletonBlock height={120} />
          </div>
        </div>
      )}
      {variant === "default" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <SkeletonLine width="40%" height={24} />
          <SkeletonLine width="60%" height={14} />
          {Array.from({ length: 4 }).map((_, i) => <SkeletonBlock key={i} height={80} />)}
        </div>
      )}
    </div>
  );
}

export function SkeletonHomePage() {
  return (
    <div>
      <SkeletonHero />
      <div style={{ padding: "24px", maxWidth: 1200, margin: "0 auto" }}>
        <SkeletonStatsRow count={5} style={{ marginBottom: 24 }} />
        <SkeletonLine width="30%" height={20} style={{ marginBottom: 16 }} />
        <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>
          <SkeletonBlock width={180} height={120} rounded={16} />
          <SkeletonBlock width={180} height={120} rounded={16} />
          <SkeletonBlock width={180} height={120} rounded={16} />
          <SkeletonBlock width={180} height={120} rounded={16} />
        </div>
        <SkeletonLine width="30%" height={20} style={{ marginBottom: 16 }} />
        <div style={{ display: "flex", gap: 12 }}>
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCircle key={i} size={80} />)}
        </div>
      </div>
    </div>
  );
}

export function SkeletonQuiz() {
  return (
    <div style={{ padding: "40px 24px", maxWidth: 600, margin: "0 auto", display: "flex", flexDirection: "column", gap: 16, alignItems: "center" }}>
      <SkeletonCircle size={64} />
      <SkeletonLine width="50%" height={22} />
      <SkeletonLine width="70%" height={14} />
      <SkeletonBlock height={300} />
    </div>
  );
}

// Inject keyframes once
if (typeof document !== "undefined") {
  const id = "sk-styles";
  if (!document.getElementById(id)) {
    const s = document.createElement("style");
    s.id = id;
    s.textContent = pulse;
    document.head.appendChild(s);
  }
}

export default SkeletonPage;
