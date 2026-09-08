import { useEffect, useRef, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  LuArrowRight,
  LuCalendarDays,
  LuChartNoAxesCombined,
  LuCircleCheckBig,
  LuClipboardList,
  LuPhone,
  LuMapPin,
  LuRepeat2,
  LuStar,
  LuThumbsDown,
  LuThumbsUp,
  LuTrendingUp,
  LuUsers,
  LuX,
  LuRefreshCw,
} from "react-icons/lu";
import { fetchFseDashboard } from "../api/fseApi";

// ─── Date helpers ─────────────────────────────────────────────────────────────
function toISO(date) {
  return date.toISOString().slice(0, 10);
}

function today() {
  return new Date();
}

const PRESETS = [
  { label: "Today", getValue: () => ({ start: toISO(today()), end: toISO(today()) }) },
  {
    label: "Yesterday",
    getValue: () => {
      const d = new Date();
      d.setDate(d.getDate() - 1);
      return { start: toISO(d), end: toISO(d) };
    },
  },
  {
    label: "Last 7 Days",
    getValue: () => {
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - 6);
      return { start: toISO(start), end: toISO(end) };
    },
  },
  {
    label: "This Month",
    getValue: () => {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      return { start: toISO(start), end: toISO(now) };
    },
  },
  {
    label: "Last Month",
    getValue: () => {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end = new Date(now.getFullYear(), now.getMonth(), 0);
      return { start: toISO(start), end: toISO(end) };
    },
  },
  {
    label: "Last 3 Months",
    getValue: () => {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth() - 2, 1);
      return { start: toISO(start), end: toISO(now) };
    },
  },
];

// ─── Mini Bar Chart ───────────────────────────────────────────────────────────
function MiniBarChart({ data, valueKey, color, label }) {
  if (!data || data.length === 0) return null;
  const max = Math.max(...data.map((d) => d[valueKey] || 0), 1);
  return (
    <div className="fse-mini-chart" aria-label={`${label} chart`}>
      {data.map((item, i) => {
        const pct = Math.round(((item[valueKey] || 0) / max) * 100);
        return (
          <div key={i} className="fse-bar-col">
            <div
              className="fse-bar"
              style={{
                height: pct > 0 ? `${Math.max(pct, 8)}%` : "2px",
                background: pct > 0 ? color : "#e2e8f0",
                opacity: pct > 0 ? 1 : 0.4
              }}
              title={`${item.label}: ${item[valueKey] || 0}`}
            />
            <span className="fse-bar-label">{item.label?.split(" ")[0]}</span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, sub, accent, chart, chartKey, chartColor }) {
  return (
    <article className="fse-stat-card" style={{ "--accent": accent }}>
      <div className="fse-stat-top">
        <span className="fse-stat-icon">{icon}</span>
        <span className="fse-stat-label">{label}</span>
      </div>
      <div className="fse-stat-value">{value}</div>
      {sub && <p className="fse-stat-sub">{sub}</p>}
      {chart && chartKey && (
        <MiniBarChart data={chart} valueKey={chartKey} color={chartColor || accent} label={label} />
      )}
    </article>
  );
}

// ─── Status Tag ───────────────────────────────────────────────────────────────
const STATUS_STYLES = {
  CONVERTED: "tag tag-green",
  LOST: "tag tag-rose",
  REJECTED: "tag tag-rose",
  INTERESTED: "tag tag-green",
  ASSIGNED: "tag tag-blue",
  CONTACTED: "tag tag-blue",
  FOLLOW_UP: "tag tag-yellow",
  QUALIFIED: "tag tag-blue",
  NEW: "tag tag-blue",
  DEFAULT: "tag tag-blue",
};

function statusTag(status = "") {
  return STATUS_STYLES[status] || STATUS_STYLES.DEFAULT;
}

// ─── Date Filter Bar ──────────────────────────────────────────────────────────
function DateFilterBar({ start, end, onApply, onReset }) {
  const [localStart, setLocalStart] = useState(start);
  const [localEnd, setLocalEnd] = useState(end);
  const [activePreset, setActivePreset] = useState(null);
  const startRef = useRef(null);

  const applyPreset = (preset) => {
    const range = preset.getValue();
    setLocalStart(range.start);
    setLocalEnd(range.end);
    setActivePreset(preset.label);
    onApply(range.start, range.end);
  };

  const handleApply = () => {
    setActivePreset(null);
    onApply(localStart, localEnd);
  };

  const handleReset = () => {
    setLocalStart("");
    setLocalEnd("");
    setActivePreset(null);
    onReset();
  };

  return (
    <div className="fse-date-bar">
      <div className="fse-date-presets">
        {PRESETS.map((p) => (
          <button
            key={p.label}
            className={`fse-preset-btn${activePreset === p.label ? " active" : ""}`}
            onClick={() => applyPreset(p)}
          >
            {p.label}
          </button>
        ))}
      </div>
      <div className="fse-date-inputs">
        <div className="fse-date-field">
          <LuCalendarDays className="fse-date-icon" />
          <input
            ref={startRef}
            type="date"
            className="fse-date-input"
            value={localStart}
            max={localEnd || undefined}
            onChange={(e) => { setLocalStart(e.target.value); setActivePreset(null); }}
            aria-label="Start date"
          />
        </div>
        <span className="fse-date-sep">—</span>
        <div className="fse-date-field">
          <LuCalendarDays className="fse-date-icon" />
          <input
            type="date"
            className="fse-date-input"
            value={localEnd}
            min={localStart || undefined}
            onChange={(e) => { setLocalEnd(e.target.value); setActivePreset(null); }}
            aria-label="End date"
          />
        </div>
        <button className="fse-apply-btn" onClick={handleApply} disabled={!localStart || !localEnd}>
          Apply
        </button>
        <button className="fse-reset-btn" onClick={handleReset} title="Reset filter" aria-label="Reset date filter">
          <LuX />
        </button>
      </div>
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const load = useCallback(
    async (sd = startDate, ed = endDate, isRefresh = false) => {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError("");
      try {
        const params = {};
        if (sd) params.startDate = sd;
        if (ed) params.endDate = ed;
        const result = await fetchFseDashboard(params);
        setData(result);
      } catch (err) {
        setError(err?.response?.data?.message || "Failed to load dashboard.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [startDate, endDate],
  );

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleApply = (sd, ed) => {
    setStartDate(sd);
    setEndDate(ed);
    load(sd, ed);
  };

  const handleReset = () => {
    setStartDate("");
    setEndDate("");
    load("", "");
  };

  if (loading) {
    return (
      <div className="page-section">
        <div className="fse-dash-loader">
          <div className="fse-spinner" />
          <span>Loading dashboard…</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-section">
        <div className="status-banner">{error}</div>
      </div>
    );
  }

  const s = data?.summary || {};
  const monthly = data?.monthlyStats || [];
  const recentLeads = data?.recentLeads || [];

  const isFiltered = !!(startDate && endDate);

  const filterLabel = isFiltered
    ? `${new Date(startDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })} – ${new Date(endDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}`
    : "All Time";

  return (
    <div className="page-section fse-dashboard-page">

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="fse-hero">
        <div className="fse-hero-left">
          <p className="eyebrow">
            <LuClipboardList /> FSE Workspace
          </p>
          <h1>Dashboard Overview</h1>
          <p className="fse-hero-sub">
            Track assigned leads, field visits, calls and conversion performance.
          </p>
        </div>
        <div className="fse-hero-right">
          <button
            className="fse-refresh-btn"
            onClick={() => load(startDate, endDate, true)}
            disabled={refreshing}
            aria-label="Refresh dashboard"
          >
            <LuRefreshCw className={refreshing ? "spin" : ""} />
            {refreshing ? "Refreshing…" : "Refresh"}
          </button>
          <Link to="/my-leads" className="button button-primary">
            Open Leads <LuArrowRight />
          </Link>
        </div>
      </section>

      {/* ── Date Filter ──────────────────────────────────────────────── */}
      <DateFilterBar
        start={startDate}
        end={endDate}
        onApply={handleApply}
        onReset={handleReset}
      />

      {/* Active filter pill */}
      {isFiltered && (
        <div className="fse-filter-active">
          <LuCalendarDays />
          Showing data for: <strong>{filterLabel}</strong>
          <button className="fse-filter-clear" onClick={handleReset} aria-label="Clear filter">
            <LuX /> Clear
          </button>
        </div>
      )}

      {/* ── Monthly Cards Row ─────────────────────────────────────────── */}
      <div className="fse-section-header">
        <h2>Monthly Overview</h2>
        <p>Last 6 months performance breakdown</p>
      </div>

      <div className="fse-monthly-grid">
        <StatCard
          icon={<LuUsers />}
          label="Total Visits"
          value={s.totalVisit ?? 0}
          sub="Field visits in date range"
          accent="#6366f1"
          chart={monthly}
          chartKey="totalVisit"
          chartColor="#6366f1"
        />
        <StatCard
          icon={<LuPhone />}
          label="Total Calls"
          value={s.totalCalls ?? 0}
          sub="Cold calls in date range"
          accent="#14b8a6"
          chart={monthly}
          chartKey="totalCalls"
          chartColor="#14b8a6"
        />
        <StatCard
          icon={<LuMapPin />}
          label="New Visit"
          value={s.newVisit ?? 0}
          sub="First-time field contacts"
          accent="#f59e0b"
          chart={monthly}
          chartKey="newVisit"
          chartColor="#f59e0b"
        />
        <StatCard
          icon={<LuRepeat2 />}
          label="Repeat Visit"
          value={s.repeatVisit ?? 0}
          sub="Follow-up field visits"
          accent="#8b5cf6"
          chart={monthly}
          chartKey="repeatVisit"
          chartColor="#8b5cf6"
        />
      </div>

      {/* ── Status / KPI Cards ────────────────────────────────────────── */}
      <div className="fse-section-header">
        <h2>Performance Metrics</h2>
        <p>Key indicators for the selected period</p>
      </div>

      <div className="fse-kpi-grid">
        <StatCard
          icon={<LuThumbsUp />}
          label="Interested"
          value={s.interested ?? 0}
          sub="Positive responses"
          accent="#22c55e"
        />
        <StatCard
          icon={<LuThumbsDown />}
          label="Not Interested"
          value={s.notInterested ?? 0}
          sub="Declined leads"
          accent="#f43f5e"
        />
        <StatCard
          icon={<LuCircleCheckBig />}
          label="Converted"
          value={s.converted ?? 0}
          sub="Successfully closed"
          accent="#10b981"
          chart={monthly}
          chartKey="converted"
          chartColor="#10b981"
        />
        <StatCard
          icon={<LuChartNoAxesCombined />}
          label="Conversion Rate"
          value={`${s.conversionRate ?? 0}%`}
          sub="Overall close rate"
          accent="#6366f1"
        />
        <StatCard
          icon={<LuStar />}
          label="Avg Visit / Day"
          value={s.avgVisit ?? 0}
          sub={isFiltered ? "Within selected range" : "Lifetime average"}
          accent="#f59e0b"
        />
        <StatCard
          icon={<LuTrendingUp />}
          label="Follow-ups Today"
          value={s.followUpsToday ?? 0}
          sub="Scheduled for today"
          accent="#14b8a6"
        />
      </div>

      {/* ── Recent Activity ───────────────────────────────────────────── */}
      <section className="fse-recent-card">
        <div className="card-header">
          <div className="section-copy">
            <h2>Recent Activity</h2>
            <p>Latest updates from your assigned leads</p>
          </div>
          <Link to="/my-leads" className="fse-view-all">
            View All <LuArrowRight />
          </Link>
        </div>

        {recentLeads.length ? (
          <div className="table-wrap">
            <table className="lead-table">
              <thead>
                <tr>
                  <th>Lead</th>
                  <th>Source</th>
                  <th>Status</th>
                  <th>Updated</th>
                </tr>
              </thead>
              <tbody>
                {recentLeads.map((lead) => (
                  <tr key={lead.id}>
                    <td>
                      <strong>{lead.companyName || "—"}</strong>
                      <small>{lead.contactName || "—"}</small>
                    </td>
                    <td>
                      <span className="fse-source-tag">{lead.leadSource || "—"}</span>
                    </td>
                    <td>
                      <span className={statusTag(lead.status)}>{lead.status}</span>
                    </td>
                    <td>
                      {lead.updatedAt
                        ? new Date(lead.updatedAt).toLocaleString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="helper-copy">No assigned leads yet.</p>
        )}
      </section>
    </div>
  );
}
