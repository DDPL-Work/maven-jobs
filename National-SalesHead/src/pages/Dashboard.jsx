import { useEffect, useState } from "react";
import { 
  LuTrendingUp, 
  LuUsers, 
  LuCircleCheck, 
  LuCircleAlert, 
  LuMap, 
  LuArrowUpRight,
  LuArrowDownRight
} from "react-icons/lu";
import { fetchNSHDashboard } from "../api/nshApi";

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const result = await fetchNSHDashboard();
        setData(result);
      } catch (err) {
        setError("Failed to load national dashboard metrics.");
      } finally {
        setLoading(false);
      }
    };
    loadDashboard();
  }, []);

  if (loading) return <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>Loading National Sales Data...</div>;
  if (error) return <div style={{ padding: "20px", color: "#ef4444" }}>{error}</div>;

  const { summary, zoneStats, recentLeads } = data;

  return (
    <div style={{ padding: "24px 32px" }}>
      <div style={{ marginBottom: "32px" }}>
        <h1 style={{ fontSize: "1.875rem", fontWeight: "700", color: "#1e3a8a", margin: "0 0 8px 0" }}>National Sales Overview</h1>
        <p style={{ color: "#64748b", margin: 0 }}>Monitor sales performance across all regions in real-time.</p>
      </div>

      {/* KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "24px", marginBottom: "32px" }}>
        <StatCard title="Total Leads" value={summary.totalLeads} icon={<LuUsers />} color="#3b82f6" bgColor="#eff6ff" />
        <StatCard title="Total Converted" value={summary.convertedLeads} icon={<LuCircleCheck />} color="#10b981" bgColor="#ecfdf5" />
        <StatCard title="Conversion Rate" value={`${summary.conversionRate}%`} icon={<LuTrendingUp />} color="#8b5cf6" bgColor="#f5f3ff" />
        <StatCard title="Active Team" value={summary.activeLGs + summary.activeSMs} icon={<LuUsers />} color="#f59e0b" bgColor="#fffbeb" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "24px" }}>
        {/* Zone Stats Table */}
        <div style={{ backgroundColor: "#fff", padding: "24px", borderRadius: "16px", border: "1px solid #e2e8f0" }}>
          <h2 style={{ fontSize: "1.125rem", fontWeight: "700", color: "#1e3a8a", marginBottom: "20px", display: "flex", alignItems: "center", gap: "8px" }}>
            <LuMap size={20} /> Zone Performance
          </h2>
          <div className="table-wrap">
            <table className="my-leads-table">
              <thead>
                <tr>
                  <th>ZONE</th>
                  <th>LEADS</th>
                  <th>CONVERTED</th>
                  <th>CONV. RATE</th>
                  <th>ACTIVE LGs</th>
                </tr>
              </thead>
              <tbody>
                {zoneStats.map((zone) => (
                  <tr key={zone.zone}>
                    <td><strong>{zone.zone}</strong></td>
                    <td>{zone.totalLeads}</td>
                    <td>{zone.converted}</td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ fontWeight: 600 }}>{zone.conversionRate}%</span>
                        <div style={{ height: "6px", width: "60px", background: "#f1f5f9", borderRadius: "3px", overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${zone.conversionRate}%`, background: "#3b82f6" }} />
                        </div>
                      </div>
                    </td>
                    <td>{zone.activeLGs}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Activity */}
        <div style={{ backgroundColor: "#fff", padding: "24px", borderRadius: "16px", border: "1px solid #e2e8f0" }}>
          <h2 style={{ fontSize: "1.125rem", fontWeight: "700", color: "#1e3a8a", marginBottom: "20px" }}>Recent Activity</h2>
          <div style={{ display: "grid", gap: "16px" }}>
            {recentLeads.map((lead) => (
              <div key={lead.id} style={{ display: "flex", alignItems: "center", gap: "12px", paddingBottom: "16px", borderBottom: "1px solid #f1f5f9" }}>
                <div style={{ 
                  width: "40px", 
                  height: "40px", 
                  borderRadius: "8px", 
                  backgroundColor: lead.status === "CONVERTED" ? "#ecfdf5" : "#eff6ff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: lead.status === "CONVERTED" ? "#10b981" : "#3b82f6"
                }}>
                  {lead.status === "CONVERTED" ? <LuCircleCheck size={20} /> : <LuTrendingUp size={20} />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontWeight: 600, fontSize: "0.875rem", color: "#1e293b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {lead.companyName}
                  </p>
                  <p style={{ margin: 0, fontSize: "0.75rem", color: "#64748b" }}>
                    {lead.status} in {lead.zone} Zone
                  </p>
                </div>
                <div style={{ fontSize: "0.75rem", color: "#94a3b8" }}>
                  {new Date(lead.createdAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, color, bgColor }) {
  return (
    <div className="stat-card-nsh">
      <div style={{ width: "56px", height: "56px", borderRadius: "14px", backgroundColor: bgColor, color: color, display: "flex", alignItems: "center", justifyContent: "center" }}>
        {icon}
      </div>
      <div>
        <p style={{ margin: 0, fontSize: "0.875rem", color: "#64748b", fontWeight: 500 }}>{title}</p>
        <p style={{ margin: 0, fontSize: "1.5rem", fontWeight: "700", color: "#1e293b" }}>{value}</p>
      </div>
    </div>
  );
}
