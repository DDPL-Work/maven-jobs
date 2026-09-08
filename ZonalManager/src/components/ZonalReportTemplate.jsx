import React from "react";
import logo from "../assets/maven-logo.svg";

const MAX_RECENT_NOTIFICATIONS = 8;

const ZonalReportTemplate = React.forwardRef(({ reportData }, ref) => {
  if (!reportData) {
    return null;
  }

  const {
    zone = "Assigned",
    pendingValidation = 0,
    activeManagers = 0,
    activeFses = 0,
    totalAssigned = 0,
    converted = 0,
    conversionRate = "0%",
    conversionGrowth = "0%",
    teamOverview = [],
    recentActivity = [],
  } = reportData;

  const generatedOn = new Date().toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return (
    <div
      ref={ref}
      style={{
        width: "920px",
        padding: "48px",
        backgroundColor: "#ffffff",
        color: "#0f172a",
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        position: "absolute",
        left: "-9999px",
        top: "0",
      }}
    >
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          borderBottom: "3px solid #1e3a8a",
          paddingBottom: "20px",
          marginBottom: "28px",
        }}
      >
        <div>
          <img src={logo} alt="Maven Jobs" style={{ width: "165px", marginBottom: "12px" }} />
          <h1 style={{ margin: 0, fontSize: "2rem", color: "#1e3a8a", fontWeight: 800 }}>
            Zonal Performance Report
          </h1>
          <p style={{ margin: "6px 0 0 0", color: "#64748b", fontWeight: 600 }}>
            {zone} Zone | Operational Snapshot
          </p>
        </div>
        <div style={{ textAlign: "right" }}>
          <p style={{ margin: 0, color: "#64748b", fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.8px" }}>
            Generated On
          </p>
          <p style={{ margin: "4px 0 0 0", fontSize: "1.1rem", fontWeight: 700 }}>{generatedOn}</p>
          <p style={{ margin: "10px 0 0 0", fontSize: "0.85rem", color: "#475569" }}>Confidential Internal Use</p>
        </div>
      </header>

      <section style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "14px", marginBottom: "24px" }}>
        <MetricCard title="Pending Evaluation" value={pendingValidation} tone="#ea580c" />
        <MetricCard title="Converted Leads" value={converted} tone="#16a34a" />
        <MetricCard title="Conversion Rate" value={conversionRate} tone="#9333ea" />
      </section>

      <section style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "24px" }}>
        <Panel title="Operations Summary">
          <SummaryRow label="Active State Managers" value={activeManagers} />
          <SummaryRow label="Active FSEs" value={activeFses} />
          <SummaryRow label="Total Assigned Leads" value={totalAssigned} />
          <SummaryRow label="Conversion Growth" value={conversionGrowth} />
        </Panel>

        <Panel title="Team Highlights">
          {teamOverview.slice(0, 6).map((member) => (
            <SummaryRow
              key={member.id}
              label={`${member.name} (${member.location || zone})`}
              value={`${member.activeLeads || 0} active`}
            />
          ))}
          {!teamOverview.length ? <p style={{ margin: 0, color: "#94a3b8", fontSize: "0.9rem" }}>No team data available.</p> : null}
        </Panel>
      </section>

      <section style={{ marginBottom: "24px" }}>
        <h2 style={{ margin: "0 0 10px 0", fontSize: "1.05rem", color: "#1e3a8a" }}>Recent Activity</h2>
        <div style={{ border: "1px solid #e2e8f0", borderRadius: "10px", overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead style={{ background: "#f8fafc" }}>
              <tr>
                <th style={tableHeadStyle}>Activity</th>
                <th style={tableHeadStyle}>Time</th>
              </tr>
            </thead>
            <tbody>
              {recentActivity.slice(0, MAX_RECENT_NOTIFICATIONS).map((item, index) => (
                <tr key={item.id || `${item.text}-${index}`}>
                  <td style={tableBodyStyle}>{item.text}</td>
                  <td style={tableBodyStyle}>{item.time}</td>
                </tr>
              ))}
              {!recentActivity.length ? (
                <tr>
                  <td style={tableBodyStyle} colSpan={2}>
                    No recent activity available.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      <footer style={{ borderTop: "1px solid #e2e8f0", paddingTop: "12px", display: "flex", justifyContent: "space-between" }}>
        <span style={{ fontSize: "0.75rem", color: "#94a3b8" }}>
          Maven CRM | Zonal Manager Report
        </span>
        <span style={{ fontSize: "0.75rem", color: "#94a3b8" }}>Page 1 / 1</span>
      </footer>
    </div>
  );
});

const MetricCard = ({ title, value, tone }) => (
  <article
    style={{
      border: "1px solid #e2e8f0",
      borderRadius: "12px",
      padding: "16px",
      background: "#ffffff",
    }}
  >
    <p style={{ margin: 0, fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.6px", color: "#64748b" }}>{title}</p>
    <p style={{ margin: "8px 0 0 0", fontSize: "1.8rem", fontWeight: 800, color: tone }}>{value}</p>
  </article>
);

const Panel = ({ title, children }) => (
  <article
    style={{
      border: "1px solid #e2e8f0",
      borderRadius: "12px",
      padding: "16px",
      background: "#ffffff",
    }}
  >
    <h3 style={{ margin: "0 0 10px 0", fontSize: "1rem", color: "#1e3a8a" }}>{title}</h3>
    <div style={{ display: "grid", gap: "8px" }}>{children}</div>
  </article>
);

const SummaryRow = ({ label, value }) => (
  <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #f1f5f9", paddingBottom: "6px" }}>
    <span style={{ fontSize: "0.86rem", color: "#475569" }}>{label}</span>
    <strong style={{ fontSize: "0.9rem", color: "#1e293b" }}>{value}</strong>
  </div>
);

const tableHeadStyle = {
  textAlign: "left",
  padding: "10px 12px",
  fontSize: "0.75rem",
  color: "#64748b",
  textTransform: "uppercase",
  letterSpacing: "0.5px",
};

const tableBodyStyle = {
  borderTop: "1px solid #f1f5f9",
  padding: "10px 12px",
  fontSize: "0.82rem",
  color: "#334155",
  verticalAlign: "top",
};

export default ZonalReportTemplate;
