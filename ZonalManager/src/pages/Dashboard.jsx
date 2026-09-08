import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  LuCircleAlert,
  LuUsers,
  LuCircleCheck,
  LuTrendingUp,
  LuArrowRight,
  LuDownload,
  LuLoaderCircle,
} from "react-icons/lu";
import { fetchLeadDashboard } from "../api/leadApi";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import ZonalReportTemplate from "../components/ZonalReportTemplate";

const MAX_RECENT_NOTIFICATIONS = 8;

export default function Dashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isNotificationsModalOpen, setIsNotificationsModalOpen] = useState(false);
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [reportPayload, setReportPayload] = useState(null);
  const reportRef = useRef(null);

  useEffect(() => {
    // simple clock
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let mounted = true;

    const loadDashboard = async () => {
      try {
        setLoading(true);
        const data = await fetchLeadDashboard();
        if (mounted) {
          setDashboard(data);
          setError("");
        }
      } catch (requestError) {
        if (mounted) {
          setError(requestError.response?.data?.message || "Unable to load dashboard");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadDashboard();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!isNotificationsModalOpen && !isTeamModalOpen) {
      return undefined;
    }

    const onEscape = (event) => {
      if (event.key === "Escape") {
        setIsNotificationsModalOpen(false);
        setIsTeamModalOpen(false);
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onEscape);
    };
  }, [isNotificationsModalOpen, isTeamModalOpen]);

  if (loading) {
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
    activeManagers,
    activeFses,
    totalAssigned,
    conversionRate,
    conversionGrowth,
    converted,
    teamOverview,
    recentActivity,
  } = dashboard || {};

  const totalPending = Number(pendingValidation || 0);
  const totalManagers = Number(activeManagers || 0);
  const totalFses = Number(activeFses || 0);
  const assignedLeads = Number(totalAssigned || 0);
  const convertedLeads = Number(converted || 0);

  const allTeamOverview = Array.isArray(teamOverview) ? teamOverview : [];
  const previewTeamOverview = allTeamOverview.slice(0, 3);
  const allNotifications = Array.isArray(recentActivity) ? recentActivity : [];
  const recentNotifications = allNotifications.slice(0, MAX_RECENT_NOTIFICATIONS);
  const previewNotifications = recentNotifications.slice(0, 3);

  const renderNotificationItem = (activity) => {
    const colorMap = {
      success: "#10b981",
      danger: "#ef4444",
      primary: "#1e3a8a",
      default: "#64748b"
    };

    const dotColor = colorMap[activity.type] || colorMap.default;

    return (
      <div key={activity.id} className="dashboard-notification-item">
        <div style={{ marginTop: "6px" }}>
          <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: dotColor }} />
        </div>
        <div>
          <p style={{ margin: "0 0 4px 0", fontSize: "0.875rem", color: "#334155", fontWeight: "500", lineHeight: "1.4" }}>
            {activity.text}
          </p>
          <span style={{ fontSize: "0.75rem", color: "#94a3b8" }}>{activity.time}</span>
        </div>
      </div>
    );
  };

  const handleDownloadReport = () => {
    if (isGeneratingReport || !dashboard) {
      return;
    }

    const rawSession = sessionStorage.getItem("crm_panel_session");
    let sessionZone = "";

    try {
      const parsed = rawSession ? JSON.parse(rawSession) : null;
      sessionZone = parsed?.user?.zone || "";
    } catch {
      sessionZone = "";
    }

    const zone = sessionZone || allTeamOverview[0]?.location || "Assigned";
    const payload = {
      zone,
      pendingValidation: totalPending,
      activeManagers: totalManagers,
      activeFses: totalFses,
      totalAssigned: assignedLeads,
      converted: convertedLeads,
      conversionRate: conversionRate || "0%",
      conversionGrowth: conversionGrowth || "0%",
      teamOverview: allTeamOverview,
      recentActivity: recentNotifications,
    };

    setReportPayload(payload);
    setIsGeneratingReport(true);

    setTimeout(async () => {
      try {
        const element = reportRef.current;
        if (!element) {
          return;
        }

        const canvas = await html2canvas(element, {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: "#ffffff",
        });

        const imgData = canvas.toDataURL("image/png");
        const pdfWidth = canvas.width / 2;
        const pdfHeight = canvas.height / 2;

        const pdf = new jsPDF({
          orientation: "portrait",
          unit: "px",
          format: [pdfWidth, pdfHeight],
        });

        pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
        pdf.save(`Maven_CRM_${zone}_Zonal_Report.pdf`);
      } catch (error) {
        console.error("Zonal report PDF generation failed:", error);
      } finally {
        setIsGeneratingReport(false);
        setReportPayload(null);
      }
    }, 120);
  };

  return (
    <div className="page-section" style={{ padding: "24px 32px", background: "#f8fafc", minHeight: "100vh" }}>
      {/* Header Section */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "32px" }}>
        <div>
          <h1 style={{ fontSize: "2rem", fontWeight: "700", color: "#1e3a8a", margin: 0, letterSpacing: "-0.5px" }}>
            Dashboard Overview
          </h1>
          <p style={{ color: "#64748b", margin: "4px 0 0 0", fontSize: "1rem" }}>
            Zonal Control Center
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <button
            type="button"
            onClick={handleDownloadReport}
            disabled={isGeneratingReport || !dashboard}
            style={{
              border: "1px solid #cbd5e1",
              backgroundColor: "#ffffff",
              color: "#1e3a8a",
              borderRadius: "10px",
              padding: "10px 14px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontWeight: 600,
              cursor: isGeneratingReport ? "not-allowed" : "pointer",
            }}
          >
            {isGeneratingReport ? <LuLoaderCircle size={16} /> : <LuDownload size={16} />}
            {isGeneratingReport ? "Generating PDF..." : "Download PDF Report"}
          </button>
          <div style={{ color: "#64748b", fontSize: "0.875rem" }}>
            Last updated: Today, {currentTime.toLocaleTimeString("en-US")}
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "24px", marginBottom: "32px" }}>

        {/* Pending Validation Card */}
        <div style={{ backgroundColor: "#fff", border: "1px solid #fdba74", borderRadius: "12px", padding: "24px", position: "relative", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <span style={{ color: "#64748b", fontSize: "0.8rem", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px" }}>Pending Evaluation</span>
            <div style={{ backgroundColor: "#ea580c", color: "#fff", width: "40px", height: "40px", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <LuCircleAlert size={24} />
            </div>
          </div>
          <div style={{ marginTop: "16px", marginBottom: "24px" }}>
            <span style={{ fontSize: "2.5rem", fontWeight: "700", color: "#ea580c", lineHeight: "1" }}>{totalPending}</span>
          </div>
          <div>
            <Link to="/zone-leads" style={{ color: "#ea580c", fontSize: "0.875rem", fontWeight: "600", textDecoration: "none", display: "flex", alignItems: "center", gap: "4px" }}>
              Review Now <LuArrowRight size={16} />
            </Link>
          </div>
        </div>

        {/* Active State Managers Card */}
        <div style={{ backgroundColor: "#fff", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "24px", position: "relative", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <span style={{ color: "#64748b", fontSize: "0.8rem", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px" }}>Active State Managers</span>
            <div style={{ backgroundColor: "#1e3a8a", color: "#fff", width: "40px", height: "40px", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <LuUsers size={24} />
            </div>
          </div>
          <div style={{ marginTop: "16px" }}>
            <span style={{ fontSize: "2.5rem", fontWeight: "700", color: "#1e3a8a", lineHeight: "1" }}>{totalManagers}</span>
          </div>
        </div>

        {/* Active FSEs Card */}
        <div style={{ backgroundColor: "#fff", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "24px", position: "relative", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <span style={{ color: "#64748b", fontSize: "0.8rem", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px" }}>Active FSEs</span>
            <div style={{ backgroundColor: "#16a34a", color: "#fff", width: "40px", height: "40px", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <LuCircleCheck size={24} />
            </div>
          </div>
          <div style={{ marginTop: "16px" }}>
            <span style={{ fontSize: "2.5rem", fontWeight: "700", color: "#16a34a", lineHeight: "1" }}>{totalFses}</span>
          </div>
        </div>

        {/* Conversion Rate Card */}
        <div style={{ backgroundColor: "#fff", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "24px", position: "relative", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <span style={{ color: "#64748b", fontSize: "0.8rem", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px" }}>Conversion Rate</span>
            <div style={{ backgroundColor: "#9333ea", color: "#fff", width: "40px", height: "40px", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <LuTrendingUp size={24} />
            </div>
          </div>
          <div style={{ marginTop: "16px", display: "flex", alignItems: "baseline", gap: "12px" }}>
            <span style={{ fontSize: "2.5rem", fontWeight: "700", color: "#9333ea", lineHeight: "1" }}>{conversionRate}</span>
            <span style={{ fontSize: "1rem", fontWeight: "700", color: conversionGrowth?.startsWith("-") ? "#dc2626" : "#16a34a" }}>{conversionGrowth}</span>
          </div>
          <div style={{ marginTop: "8px", color: "#64748b", fontSize: "0.85rem" }}>
            Converted Leads: <strong style={{ color: "#1e293b" }}>{convertedLeads}</strong> | Assigned: <strong style={{ color: "#1e293b" }}>{assignedLeads}</strong>
          </div>
        </div>

      </div>

      {/* Main Content Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: "24px" }}>

        {/* Team Overview Section */}
        <div style={{ backgroundColor: "#fff", borderRadius: "12px", border: "1px solid #e2e8f0", display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div style={{ padding: "24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h2 style={{ fontSize: "1.25rem", fontWeight: "700", color: "#1e3a8a", margin: 0 }}>Team Overview</h2>
            <button
              type="button"
              onClick={() => setIsTeamModalOpen(true)}
              disabled={!allTeamOverview.length}
              style={{
                fontSize: "0.875rem",
                fontWeight: "600",
                color: allTeamOverview.length ? "#1e3a8a" : "#94a3b8",
                background: "transparent",
                border: 0,
                cursor: allTeamOverview.length ? "pointer" : "not-allowed",
                padding: 0,
              }}
            >
              View All
            </button>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
              <thead style={{ backgroundColor: "#f8fafc", borderTop: "1px solid #f1f5f9", borderBottom: "1px solid #f1f5f9" }}>
                <tr>
                  <th style={{ padding: "16px 24px", fontSize: "0.75rem", fontWeight: "600", color: "#64748b", textTransform: "uppercase" }}>State Manager</th>
                  <th style={{ padding: "16px 24px", fontSize: "0.75rem", fontWeight: "600", color: "#64748b", textTransform: "uppercase" }}>Location</th>
                  <th style={{ padding: "16px 24px", fontSize: "0.75rem", fontWeight: "600", color: "#64748b", textTransform: "uppercase" }}>Active Leads</th>
                  <th style={{ padding: "16px 24px", fontSize: "0.75rem", fontWeight: "600", color: "#64748b", textTransform: "uppercase" }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {previewTeamOverview.length ? previewTeamOverview.map((fse, index) => (
                  <tr key={fse.id} style={{ borderBottom: index < previewTeamOverview.length - 1 ? "1px solid #f1f5f9" : "none" }}>
                    <td style={{ padding: "16px 24px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        {fse.profileImage ? (
                          <img
                            src={fse.profileImage}
                            alt={fse.name}
                            style={{
                              width: "32px",
                              height: "32px",
                              borderRadius: "50%",
                              objectFit: "cover",
                              border: "1px solid #cbd5e1",
                            }}
                          />
                        ) : (
                          <div style={{ width: "32px", height: "32px", borderRadius: "50%", backgroundColor: "#e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.75rem", fontWeight: "600", color: "#475569" }}>
                            {fse.initials}
                          </div>
                        )}
                        <span style={{ fontWeight: "500", color: "#334155" }}>{fse.name}</span>
                      </div>
                    </td>
                    <td style={{ padding: "16px 24px", color: "#64748b" }}>{fse.location}</td>
                    <td style={{ padding: "16px 24px", color: "#334155", fontWeight: "500" }}>{fse.activeLeads}</td>
                    <td style={{ padding: "16px 24px" }}>
                      <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", backgroundColor: fse.status === "Active" ? "#ecfdf5" : "#f1f5f9", color: fse.status === "Active" ? "#10b981" : "#64748b", padding: "4px 10px", borderRadius: "12px", fontSize: "0.75rem", fontWeight: "600" }}>
                        <div style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: fse.status === "Active" ? "#10b981" : "#94a3b8" }}></div>
                        {fse.status}
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="4" style={{ padding: "16px 24px", color: "#94a3b8", textAlign: "center" }}>
                      No active State Managers found in this zone.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Activity Section */}
        <div style={{ backgroundColor: "#fff", borderRadius: "12px", border: "1px solid #e2e8f0", display: "flex", flexDirection: "column" }}>
          <div style={{ padding: "24px", paddingBottom: "16px", borderBottom: "1px solid #f1f5f9" }}>
            <h2 style={{ fontSize: "1.25rem", fontWeight: "700", color: "#1e3a8a", margin: 0 }}>Recent Activity</h2>
          </div>
          <div style={{ padding: "16px 24px", display: "flex", flexDirection: "column", gap: "24px", flex: 1 }}>
            {previewNotifications.length ? (
              previewNotifications.map((activity) => renderNotificationItem(activity))
            ) : (
              <p style={{ margin: 0, color: "#94a3b8", fontSize: "0.9rem" }}>No notifications available.</p>
            )}
          </div>
          <div style={{ padding: "16px 24px", marginTop: "auto", textAlign: "center", borderTop: "1px solid #f1f5f9" }}>
            <button
              type="button"
              onClick={() => setIsNotificationsModalOpen(true)}
              disabled={!recentNotifications.length}
              style={{
                fontSize: "0.875rem",
                fontWeight: "600",
                color: recentNotifications.length ? "#1e3a8a" : "#94a3b8",
                background: "transparent",
                border: 0,
                cursor: recentNotifications.length ? "pointer" : "not-allowed",
                padding: 0,
              }}
            >
              View All Notifications
            </button>
          </div>
        </div>

      </div>

      {isNotificationsModalOpen ? (
        <div
          className="modal-overlay"
          role="presentation"
          onClick={() => setIsNotificationsModalOpen(false)}
        >
          <section
            className="modal-content dashboard-notifications-modal"
            role="dialog"
            aria-modal="true"
            aria-label="All notifications"
            onClick={(event) => event.stopPropagation()}
          >
            <header className="dashboard-notifications-header">
              <div>
                <h2 className="dashboard-notifications-title">Recent Notifications</h2>
                <p className="dashboard-notifications-subtitle">
                  Showing latest {recentNotifications.length} updates.
                </p>
              </div>
              <button
                type="button"
                className="close-btn"
                onClick={() => setIsNotificationsModalOpen(false)}
                aria-label="Close notifications modal"
              >
                &times;
              </button>
            </header>

            <div className="dashboard-notification-scroll">
              {recentNotifications.length ? (
                recentNotifications.map((activity) => renderNotificationItem(activity))
              ) : (
                <p className="dashboard-notification-empty">No notifications available.</p>
              )}
            </div>
          </section>
        </div>
      ) : null}

      {isTeamModalOpen ? (
        <div
          className="modal-overlay"
          role="presentation"
          onClick={() => setIsTeamModalOpen(false)}
        >
          <section
            className="modal-content dashboard-team-modal"
            role="dialog"
            aria-modal="true"
            aria-label="All team members"
            onClick={(event) => event.stopPropagation()}
          >
            <header className="dashboard-notifications-header">
              <div>
                <h2 className="dashboard-notifications-title">All Team Members</h2>
                <p className="dashboard-notifications-subtitle">
                  Showing {allTeamOverview.length} State Managers from your zone.
                </p>
              </div>
              <button
                type="button"
                className="close-btn"
                onClick={() => setIsTeamModalOpen(false)}
                aria-label="Close team modal"
              >
                &times;
              </button>
            </header>

            <div className="dashboard-team-scroll">
              <table className="dashboard-team-table">
                <thead>
                  <tr>
                    <th>State Manager</th>
                    <th>Location</th>
                    <th>Active Leads</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {allTeamOverview.length ? allTeamOverview.map((fse, index) => (
                    <tr key={`modal-${fse.id}`} className={index === allTeamOverview.length - 1 ? "is-last" : ""}>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                          {fse.profileImage ? (
                            <img
                              src={fse.profileImage}
                              alt={fse.name}
                              style={{
                                width: "32px",
                                height: "32px",
                                borderRadius: "50%",
                                objectFit: "cover",
                                border: "1px solid #cbd5e1",
                              }}
                            />
                          ) : (
                            <div style={{ width: "32px", height: "32px", borderRadius: "50%", backgroundColor: "#e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.75rem", fontWeight: "600", color: "#475569" }}>
                              {fse.initials}
                            </div>
                          )}
                          <span style={{ fontWeight: "500", color: "#334155" }}>{fse.name}</span>
                        </div>
                      </td>
                      <td>{fse.location}</td>
                      <td style={{ color: "#334155", fontWeight: "500" }}>{fse.activeLeads}</td>
                      <td>
                        <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", backgroundColor: fse.status === "Active" ? "#ecfdf5" : "#f1f5f9", color: fse.status === "Active" ? "#10b981" : "#64748b", padding: "4px 10px", borderRadius: "12px", fontSize: "0.75rem", fontWeight: "600" }}>
                          <div style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: fse.status === "Active" ? "#10b981" : "#94a3b8" }} />
                          {fse.status}
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan="4" className="dashboard-team-empty">No active State Managers found in this zone.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      ) : null}

      <div style={{ position: "absolute", left: "-9999px", top: 0, overflow: "hidden", height: 0 }}>
        {reportPayload ? <ZonalReportTemplate ref={reportRef} reportData={reportPayload} /> : null}
      </div>
    </div>
  );
}
