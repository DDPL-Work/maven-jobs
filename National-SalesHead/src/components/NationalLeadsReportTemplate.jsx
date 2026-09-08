import React from "react";
import logo from "../assets/maven-logo.svg";

const statusStyleMap = {
  CONVERTED: { color: "#0f766e", bg: "#ccfbf1", border: "#5eead4" },
  FORWARDED: { color: "#1d4ed8", bg: "#dbeafe", border: "#93c5fd" },
  ASSIGNED: { color: "#6d28d9", bg: "#ede9fe", border: "#c4b5fd" },
  REJECTED: { color: "#b91c1c", bg: "#fee2e2", border: "#fca5a5" },
  LOST: { color: "#b91c1c", bg: "#fee2e2", border: "#fca5a5" },
  DEFAULT: { color: "#92400e", bg: "#fef3c7", border: "#fcd34d" },
};

const statusStyleFor = (status = "") => statusStyleMap[status] || statusStyleMap.DEFAULT;

const filterLabel = (value = "", fallback = "All") => {
  const next = String(value || "").trim();
  return next || fallback;
};

const NationalLeadsReportTemplate = React.forwardRef(({ report = null }, ref) => {
  if (!report) {
    return null;
  }

  const generatedOn = new Date(report.generatedAt || Date.now()).toLocaleString("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div
      ref={ref}
      style={{
        width: "1120px",
        background: "#ffffff",
        color: "#1e293b",
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        padding: "36px",
      }}
    >
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: "20px",
          borderBottom: "4px solid #18458a",
          paddingBottom: "18px",
          marginBottom: "20px",
        }}
      >
        <div>
          <img src={logo} alt="Maven Jobs" style={{ width: "156px", marginBottom: "10px" }} />
          <h1 style={{ margin: 0, fontSize: "1.9rem", color: "#18458a", fontWeight: 800 }}>
            National Lead Database Report
          </h1>
          <p style={{ margin: "6px 0 0", color: "#64748b", fontSize: "0.96rem" }}>
            Themed export from National Sales Head panel
          </p>
        </div>
        <div style={{ textAlign: "right" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              background: "#eff6ff",
              border: "1px solid #bfdbfe",
              borderRadius: "999px",
              color: "#1d4ed8",
              fontWeight: 700,
              padding: "6px 12px",
              fontSize: "0.8rem",
              marginBottom: "10px",
            }}
          >
            Confidential
          </div>
          <p style={{ margin: 0, fontSize: "0.84rem", color: "#64748b" }}>Generated On</p>
          <p style={{ margin: "4px 0 0", fontSize: "0.96rem", color: "#1e293b", fontWeight: 700 }}>{generatedOn}</p>
        </div>
      </header>

      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
          gap: "10px",
          marginBottom: "20px",
        }}
      >
        <InfoCard label="Total Leads" value={report.total || 0} />
        <InfoCard label="Zone Filter" value={filterLabel(report.filters?.zone, "All Zones")} />
        <InfoCard label="Status Filter" value={filterLabel(report.filters?.status, "All Statuses")} />
        <InfoCard label="Timeline Filter" value={filterLabel(report.filters?.date, "All Timeline")} />
        <InfoCard label="Search Query" value={filterLabel(report.filters?.search, "None")} />
      </section>

      <section style={{ border: "1px solid #dbe4f2", borderRadius: "12px", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
          <thead>
            <tr style={{ background: "#18458a" }}>
              {["Company & Code", "Zone & Location", "Contact", "Status", "Generator", "Created On"].map((heading) => (
                <th
                  key={heading}
                  style={{
                    color: "#ffffff",
                    fontSize: "0.76rem",
                    letterSpacing: "0.04em",
                    textTransform: "uppercase",
                    textAlign: "left",
                    padding: "11px 10px",
                    fontWeight: 800,
                    borderRight: "1px solid rgba(255,255,255,0.1)",
                  }}
                >
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(report.items || []).length ? (
              report.items.map((lead, index) => {
                const status = String(lead.status || "").toUpperCase();
                const statusStyle = statusStyleFor(status);

                return (
                  <tr key={lead.id || `${lead.leadCode}-${index}`} style={{ background: index % 2 ? "#f8fbff" : "#ffffff" }}>
                    <td style={cellStyle}>
                      <div style={{ fontWeight: 700, color: "#1e3a8a" }}>{lead.companyName || "-"}</div>
                      <div style={{ fontSize: "0.72rem", color: "#64748b" }}>{lead.leadCode || "-"}</div>
                    </td>
                    <td style={cellStyle}>
                      <div style={{ fontWeight: 700, color: "#1d4ed8" }}>
                        {lead.zone ? `${lead.zone} Zone` : "Unknown Zone"}
                      </div>
                      <div style={{ fontSize: "0.72rem", color: "#64748b" }}>
                        {lead.city || "Unknown"}, {lead.state || "Unknown"}
                      </div>
                    </td>
                    <td style={cellStyle}>
                      <div style={{ fontWeight: 700 }}>{lead.contactName || "-"}</div>
                      <div style={{ fontSize: "0.72rem", color: "#64748b" }}>{lead.phone || "-"}</div>
                    </td>
                    <td style={cellStyle}>
                      <span
                        style={{
                          display: "inline-block",
                          border: `1px solid ${statusStyle.border}`,
                          background: statusStyle.bg,
                          color: statusStyle.color,
                          borderRadius: "999px",
                          padding: "3px 10px",
                          fontSize: "0.72rem",
                          fontWeight: 700,
                        }}
                      >
                        {status ? `${status.charAt(0)}${status.slice(1).toLowerCase()}` : "New"}
                      </span>
                    </td>
                    <td style={cellStyle}>
                      <div style={{ fontWeight: 700 }}>{lead.generatorName || "-"}</div>
                    </td>
                    <td style={cellStyle}>
                      {lead.createdAt
                        ? new Date(lead.createdAt).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })
                        : "-"}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={6} style={{ padding: "20px", textAlign: "center", color: "#64748b" }}>
                  No leads found for selected filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
});

const cellStyle = {
  padding: "10px",
  borderBottom: "1px solid #e2e8f0",
  borderRight: "1px solid #f1f5f9",
  verticalAlign: "top",
  fontSize: "0.78rem",
  color: "#1e293b",
};

function InfoCard({ label, value }) {
  return (
    <div
      style={{
        border: "1px solid #dbe4f2",
        borderRadius: "10px",
        background: "#f8fbff",
        padding: "10px 12px",
      }}
    >
      <p
        style={{
          margin: 0,
          color: "#64748b",
          textTransform: "uppercase",
          letterSpacing: "0.04em",
          fontSize: "0.68rem",
          fontWeight: 800,
        }}
      >
        {label}
      </p>
      <p style={{ margin: "5px 0 0", fontWeight: 700, color: "#1e3a8a", fontSize: "0.9rem" }}>{value}</p>
    </div>
  );
}

export default NationalLeadsReportTemplate;
