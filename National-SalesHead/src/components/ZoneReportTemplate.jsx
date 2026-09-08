import React from "react";
import logo from "../assets/maven-logo.svg";

/**
 * ZoneReportTemplate - A high-fidelity, printable template for regional sales reports.
 * Used by html2canvas to generate PDF visuals.
 */
const ZoneReportTemplate = React.forwardRef(({ zoneData }, ref) => {
  if (!zoneData) return null;

  const today = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });

  return (
    <div
      ref={ref}
      style={{
        width: "800px",
        padding: "60px",
        backgroundColor: "#ffffff",
        color: "#1e293b",
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        position: "absolute",
        left: "-9999px",
        top: "0"
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "60px", borderBottom: "4px solid #1e40af", paddingBottom: "30px" }}>
        <div>
          <img src={logo} alt="Maven Jobs" style={{ width: "180px", marginBottom: "16px" }} />
          <h1 style={{ margin: 0, fontSize: "2.5rem", fontWeight: 800, color: "#1e3a8a" }}>Regional Sales Report</h1>
          <p style={{ margin: "4px 0 0 0", fontSize: "1.1rem", color: "#64748b", fontWeight: 600 }}>{zoneData.zone} Zone | India Division</p>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: "0.875rem", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "1px", fontWeight: 700 }}>Generated On</div>
          <div style={{ fontSize: "1.25rem", fontWeight: 700, color: "#1e293b" }}>{today}</div>
          <div style={{ marginTop: "12px", padding: "6px 16px", borderRadius: "20px", backgroundColor: "#eff6ff", color: "#1e40af", fontSize: "0.875rem", fontWeight: 700, display: "inline-block" }}>
            Official Document
          </div>
        </div>
      </div>

      {/* Hero Metrics */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "30px", marginBottom: "50px" }}>
        <MetricBox label="Total Lead Volume" value={zoneData.totalLeads} color="#1e40af" />
        <MetricBox label="Conversion Success" value={`${zoneData.conversionRate}%`} color="#10b981" />
        <MetricBox label="Active Workforce" value={zoneData.lgCount + zoneData.smCount} color="#f59e0b" />
      </div>

      {/* Detailed Breakdown */}
      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: "40px", marginBottom: "60px" }}>
        <div>
          <h3 style={{ fontSize: "1.5rem", color: "#1e3a8a", borderLeft: "6px solid #1e40af", paddingLeft: "15px", marginBottom: "25px" }}>Operational Metrics</h3>
          <div style={{ display: "grid", gap: "20px" }}>
            <DataRow label="Total Leads Generated" value={zoneData.totalLeads} />
            <DataRow label="Successfully Converted" value={zoneData.converted} />
            <DataRow label="Pending Evaluation" value={zoneData.pending} />
            <DataRow label="Approval Pipeline" value={zoneData.forwarded} />
            <div style={{ marginTop: "10px", padding: "20px", borderRadius: "16px", backgroundColor: "#f8fafc", border: "1px solid #e2e8f0" }}>
              <div style={{ fontSize: "0.875rem", color: "#64748b", marginBottom: "8px", fontWeight: 600 }}>Regional Conversion Efficiency</div>
              <div style={{ height: "12px", width: "100%", backgroundColor: "#e2e8f0", borderRadius: "6px", overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${zoneData.conversionRate}%`, backgroundColor: "#1e40af", borderRadius: "6px" }} />
              </div>
              <div style={{ textAlign: "right", marginTop: "8px", fontSize: "1.1rem", fontWeight: 800, color: "#1e40af" }}>{zoneData.conversionRate}%</div>
            </div>
          </div>
        </div>

        <div>
          <h3 style={{ fontSize: "1.5rem", color: "#1e3a8a", borderLeft: "6px solid #1e40af", paddingLeft: "15px", marginBottom: "25px" }}>Team Structure</h3>
          <div style={{ padding: "25px", borderRadius: "20px", border: "2px dashed #cbd5e1", backgroundColor: "#fff" }}>
            <TeamStat label="State Managers" count={zoneData.smCount} icon="SM" />
            <div style={{ height: "1px", backgroundColor: "#e2e8f0", margin: "20px 0" }} />
            <TeamStat label="Lead Generators" count={zoneData.lgCount} icon="LG" />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ marginTop: "auto", paddingTop: "40px", borderTop: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontSize: "0.875rem", color: "#94a3b8" }}>
          &copy; 2026 Maven Jobs CRM. Confidential National Sales Report.
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          {[1, 2, 3].map(i => <div key={i} style={{ width: "30px", height: "4px", borderRadius: "2px", backgroundColor: i === 1 ? "#1e40af" : i === 2 ? "#10b981" : "#f59e0b" }} />)}
        </div>
      </div>
    </div>
  );
});

const MetricBox = ({ label, value, color }) => (
  <div style={{ padding: "30px", borderRadius: "20px", backgroundColor: "#fff", border: "1px solid #e2e8f0", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.05)", textAlign: "center" }}>
    <p style={{ margin: "0 0 10px 0", fontSize: "0.875rem", color: "#64748b", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px" }}>{label}</p>
    <h2 style={{ margin: 0, fontSize: "2.5rem", fontWeight: 800, color: color }}>{value}</h2>
  </div>
);

const DataRow = ({ label, value }) => (
  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: "10px", borderBottom: "1px solid #f1f5f9" }}>
    <span style={{ fontSize: "1.1rem", color: "#475569", fontWeight: 500 }}>{label}</span>
    <span style={{ fontSize: "1.25rem", fontWeight: 700, color: "#1e293b" }}>{value}</span>
  </div>
);

const TeamStat = ({ label, count, icon }) => (
  <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
    <div style={{ width: "45px", height: "45px", borderRadius: "12px", backgroundColor: "#1e40af", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800 }}>{icon}</div>
    <div>
      <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "#1e293b" }}>{count}</div>
      <div style={{ fontSize: "0.875rem", color: "#64748b", fontWeight: 600 }}>{label}</div>
    </div>
  </div>
);

export default ZoneReportTemplate;
