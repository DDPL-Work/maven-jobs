import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  LuCircleAlert,
  LuUsers,
  LuCircleCheck,
  LuTrendingUp,
  LuArrowRight,
  LuFileText,
  LuCalendar,
  LuUser,
  LuFilter
} from "react-icons/lu";
import { fetchLeadDashboard } from "../api/leadApi";
import MemberReportModal from "../components/MemberReportModal";

const SESSION_KEY = "crm_panel_session";

const getSessionUser = () => {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    return parsed?.user || null;
  } catch {
    return null;
  }
};

export default function Dashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isNotificationsModalOpen, setIsNotificationsModalOpen] = useState(false);
  const [reportMember, setReportMember] = useState(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  // Filters
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedMemberId, setSelectedMemberId] = useState("");

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const params = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      if (selectedMemberId) params.memberId = selectedMemberId;

      const data = await fetchLeadDashboard(params);
      setDashboard(data);
      setError("");
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to load dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, [startDate, endDate, selectedMemberId]);

  if (loading && !dashboard) {
    return (
      <div className="page-section" style={{ display: 'flex', justifyContent: 'center', paddingTop: '100px', color: '#64748b' }}>
        Loading dashboard metrics...
      </div>
    );
  }

  if (error) {
    return <div className="page-section"><div className="status-banner">{error}</div></div>;
  }

  const {
    pendingValidation,
    activeFses,
    activeLeadGenerators,
    totalAssigned,
    totalLeadsGenerated,
    conversionRate,
    rolePerformance,
    recentActivity,
  } = dashboard || {};

  const fsePerformers = rolePerformance?.fse?.members || [];
  const leadGeneratorPerformers = rolePerformance?.leadGenerator?.members || [];
  const allMembers = [...fsePerformers, ...leadGeneratorPerformers];

  const currentUser = getSessionUser();
  const managerName = currentUser?.fullName || currentUser?.email || "State Manager";
  const managerZone = currentUser?.zone || "Assigned";
  const managerState = currentUser?.state || "State Not Assigned";

  const handleViewReport = (member) => {
    setReportMember(member);
    setIsReportModalOpen(true);
  };

  return (
    <div className="page-section dashboard-page" style={{ padding: "24px 32px", background: "#f8fafc", minHeight: "100vh" }}>
      
      {/* Header Section */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "32px" }}>
        <div>
          <h1 style={{ fontSize: "2rem", fontWeight: "800", color: "#1e3a8a", margin: 0, letterSpacing: "-1px" }}>
            State Performance Dashboard
          </h1>
          <p style={{ color: "#64748b", margin: "4px 0 0 0", fontSize: "1rem", fontWeight: "500" }}>
            Monitoring {managerState} ({managerZone} Zone) | {managerName}
          </p>
        </div>
        <div style={{ color: "#94a3b8", fontSize: "0.875rem", fontWeight: "500" }}>
          Real-time updates as of {currentTime.toLocaleTimeString()}
        </div>
      </div>

      {/* Filters Bar */}
      <div style={{ 
        backgroundColor: "#fff", 
        borderRadius: "16px", 
        padding: "20px 24px", 
        marginBottom: "32px", 
        display: "flex", 
        flexWrap: "wrap", 
        gap: "24px", 
        alignItems: "center",
        border: "1px solid #e2e8f0",
        boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <LuFilter size={20} color="#64748b" />
          <span style={{ fontWeight: "700", color: "#1e293b", fontSize: "0.9rem" }}>Filter Insights:</span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ position: "relative" }}>
            <LuCalendar style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} size={16} />
            <input 
              type="date" 
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              style={{ padding: "8px 12px 8px 36px", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "0.85rem", color: "#334155", fontWeight: "600" }}
            />
          </div>
          <span style={{ color: "#94a3b8", fontWeight: "700" }}>to</span>
          <div style={{ position: "relative" }}>
            <LuCalendar style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} size={16} />
            <input 
              type="date" 
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              style={{ padding: "8px 12px 8px 36px", borderRadius: "10px", border: "1px solid #cbd5e1", fontSize: "0.85rem", color: "#334155", fontWeight: "600" }}
            />
          </div>
        </div>

        <div style={{ position: "relative", minWidth: "220px" }}>
          <LuUser style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} size={16} />
          <select 
            value={selectedMemberId}
            onChange={(e) => setSelectedMemberId(e.target.value)}
            style={{ 
              width: "100%", 
              padding: "8px 12px 8px 36px", 
              borderRadius: "10px", 
              border: "1px solid #cbd5e1", 
              fontSize: "0.85rem", 
              color: "#334155", 
              fontWeight: "600",
              appearance: "none",
              backgroundColor: "#fff"
            }}
          >
            <option value="">All Team Members</option>
            {allMembers.map(m => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
        </div>

        {(startDate || endDate || selectedMemberId) && (
          <button 
            onClick={() => { setStartDate(""); setEndDate(""); setSelectedMemberId(""); }}
            style={{ color: "#ef4444", fontSize: "0.85rem", fontWeight: "700", background: "none", border: "none", cursor: "pointer" }}
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* KPI Cards Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "24px", marginBottom: "32px" }}>

        {/* Leadgen Queue Card */}
        <div style={{ backgroundColor: "#fff", border: "1px solid #fed7aa", borderRadius: "16px", padding: "24px", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ color: "#64748b", fontSize: "0.75rem", fontWeight: "700", textTransform: "uppercase", letterSpacing: "1px" }}>Leadgen Queue</span>
            <div style={{ backgroundColor: "#fff7ed", color: "#ea580c", width: "40px", height: "40px", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <LuCircleAlert size={22} />
            </div>
          </div>
          <div style={{ marginTop: "16px", marginBottom: "12px" }}>
            <span style={{ fontSize: "2.25rem", fontWeight: "800", color: "#1e293b" }}>{pendingValidation}</span>
          </div>
          <Link to="/leadgen-queue" style={{ color: "#ea580c", fontSize: "0.85rem", fontWeight: "700", textDecoration: "none", display: "flex", alignItems: "center", gap: "4px" }}>
            Review Queue <LuArrowRight size={14} />
          </Link>
        </div>

        {/* Total Generated Card */}
        <div style={{ backgroundColor: "#fff", border: "1px solid #e2e8f0", borderRadius: "16px", padding: "24px", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ color: "#64748b", fontSize: "0.75rem", fontWeight: "700", textTransform: "uppercase", letterSpacing: "1px" }}>Leads Generated</span>
            <div style={{ backgroundColor: "#f1f5f9", color: "#475569", width: "40px", height: "40px", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <LuFileText size={22} />
            </div>
          </div>
          <div style={{ marginTop: "16px" }}>
            <span style={{ fontSize: "2.25rem", fontWeight: "800", color: "#1e293b" }}>{totalLeadsGenerated || 0}</span>
          </div>
        </div>

        {/* FSE Load Card */}
        <div style={{ backgroundColor: "#fff", border: "1px solid #e2e8f0", borderRadius: "16px", padding: "24px", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ color: "#64748b", fontSize: "0.75rem", fontWeight: "700", textTransform: "uppercase", letterSpacing: "1px" }}>FSE Field Load</span>
            <div style={{ backgroundColor: "#eff6ff", color: "#2563eb", width: "40px", height: "40px", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <LuUsers size={22} />
            </div>
          </div>
          <div style={{ marginTop: "16px" }}>
            <span style={{ fontSize: "2.25rem", fontWeight: "800", color: "#1e293b" }}>{totalAssigned}</span>
          </div>
          <Link to="/fse-pipeline" style={{ color: "#2563eb", fontSize: "0.85rem", fontWeight: "700", textDecoration: "none", display: "flex", alignItems: "center", gap: "4px", marginTop: "12px" }}>
            Track Pipeline <LuArrowRight size={14} />
          </Link>
        </div>

        {/* Conversion Rate Card */}
        <div style={{ 
          background: "linear-gradient(135deg, #1e3a8a 0%, #172554 100%)", 
          borderRadius: "16px", 
          padding: "24px", 
          color: "#fff",
          boxShadow: "0 10px 15px -3px rgba(30, 58, 138, 0.2)"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ color: "rgba(255,255,255,0.7)", fontSize: "0.75rem", fontWeight: "700", textTransform: "uppercase", letterSpacing: "1px" }}>Conv. Efficiency</span>
            <div style={{ backgroundColor: "rgba(255,255,255,0.1)", color: "#fff", width: "40px", height: "40px", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <LuTrendingUp size={22} />
            </div>
          </div>
          <div style={{ marginTop: "16px" }}>
            <span style={{ fontSize: "2.5rem", fontWeight: "800" }}>{conversionRate}</span>
          </div>
        </div>

      </div>

      {/* Main Performance Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
        
        {/* FSE Performance */}
        <div style={{ backgroundColor: "#fff", borderRadius: "20px", border: "1px solid #e2e8f0", overflow: "hidden", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)" }}>
          <div style={{ padding: "24px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <h2 style={{ fontSize: "1.25rem", fontWeight: "800", color: "#1e3a8a", margin: 0 }}>FSE Performance</h2>
              <p style={{ margin: "4px 0 0", fontSize: "0.85rem", color: "#64748b", fontWeight: "500" }}>Field Sales Executive efficiency metrics</p>
            </div>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
              <thead style={{ backgroundColor: "#f8fafc" }}>
                <tr>
                  <th style={{ padding: "14px 24px", fontSize: "0.7rem", fontWeight: "700", color: "#64748b", textTransform: "uppercase" }}>Name</th>
                  <th style={{ padding: "14px 24px", fontSize: "0.7rem", fontWeight: "700", color: "#64748b", textTransform: "uppercase" }}>Assigned</th>
                  <th style={{ padding: "14px 24px", fontSize: "0.7rem", fontWeight: "700", color: "#64748b", textTransform: "uppercase" }}>Converted</th>
                  <th style={{ padding: "14px 24px", fontSize: "0.7rem", fontWeight: "700", color: "#64748b", textTransform: "uppercase" }}>Rate</th>
                  <th style={{ padding: "14px 24px" }}></th>
                </tr>
              </thead>
              <tbody>
                {fsePerformers.map((m) => (
                  <tr key={m.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "16px 24px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <div style={{ width: "32px", height: "32px", borderRadius: "50%", backgroundColor: "#e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.7rem", fontWeight: "800" }}>
                          {m.initials}
                        </div>
                        <span style={{ fontWeight: "700", color: "#334155", fontSize: "0.9rem" }}>{m.name}</span>
                      </div>
                    </td>
                    <td style={{ padding: "16px 24px", color: "#475569", fontWeight: "600" }}>{m.totalAssignedLeads}</td>
                    <td style={{ padding: "16px 24px", color: "#10b981", fontWeight: "700" }}>{m.convertedLeads}</td>
                    <td style={{ padding: "16px 24px" }}>
                      <span style={{ background: "#eff6ff", color: "#2563eb", padding: "4px 8px", borderRadius: "8px", fontSize: "0.75rem", fontWeight: "800" }}>
                        {m.conversionRate}
                      </span>
                    </td>
                    <td style={{ padding: "16px 24px" }}>
                      <button onClick={() => handleViewReport(m)} style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer" }}>
                        <LuFileText size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Leadgen Performance */}
        <div style={{ backgroundColor: "#fff", borderRadius: "20px", border: "1px solid #e2e8f0", overflow: "hidden", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)" }}>
          <div style={{ padding: "24px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <h2 style={{ fontSize: "1.25rem", fontWeight: "800", color: "#1e3a8a", margin: 0 }}>Leadgen Performance</h2>
              <p style={{ margin: "4px 0 0", fontSize: "0.85rem", color: "#64748b", fontWeight: "500" }}>Generation and forwarding metrics</p>
            </div>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
              <thead style={{ backgroundColor: "#f8fafc" }}>
                <tr>
                  <th style={{ padding: "14px 24px", fontSize: "0.7rem", fontWeight: "700", color: "#64748b", textTransform: "uppercase" }}>Name</th>
                  <th style={{ padding: "14px 24px", fontSize: "0.7rem", fontWeight: "700", color: "#64748b", textTransform: "uppercase" }}>Generated</th>
                  <th style={{ padding: "14px 24px", fontSize: "0.7rem", fontWeight: "700", color: "#64748b", textTransform: "uppercase" }}>Forwarded</th>
                  <th style={{ padding: "14px 24px", fontSize: "0.7rem", fontWeight: "700", color: "#64748b", textTransform: "uppercase" }}>Conv.</th>
                  <th style={{ padding: "14px 24px" }}></th>
                </tr>
              </thead>
              <tbody>
                {leadGeneratorPerformers.map((m) => (
                  <tr key={m.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "16px 24px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <div style={{ width: "32px", height: "32px", borderRadius: "50%", backgroundColor: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.7rem", fontWeight: "800" }}>
                          {m.initials}
                        </div>
                        <span style={{ fontWeight: "700", color: "#334155", fontSize: "0.9rem" }}>{m.name}</span>
                      </div>
                    </td>
                    <td style={{ padding: "16px 24px", color: "#475569", fontWeight: "600" }}>{m.totalGeneratedLeads}</td>
                    <td style={{ padding: "16px 24px", color: "#2563eb", fontWeight: "700" }}>{m.forwardedLeads}</td>
                    <td style={{ padding: "16px 24px", color: "#10b981", fontWeight: "700" }}>{m.convertedLeads}</td>
                    <td style={{ padding: "16px 24px" }}>
                      <button onClick={() => handleViewReport(m)} style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer" }}>
                        <LuFileText size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      <MemberReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        member={reportMember}
      />
    </div>
  );
}
