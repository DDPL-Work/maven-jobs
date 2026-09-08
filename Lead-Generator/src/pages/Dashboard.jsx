import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  LuArrowRight,
  LuBadgeCheck,
  LuClock3,
  LuPlus,
  LuSparkles,
  LuSend,
  LuChevronLeft,
  LuChevronRight,
} from "react-icons/lu";
import { fetchLeadDashboard } from "../api/leadApi";

const PaginatedTable = ({ data, columns, renderRow, emptyMessage }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const totalItems = data.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));

  useEffect(() => {
    setCurrentPage(1);
  }, [data]);

  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentData = data.slice(startIndex, startIndex + itemsPerPage);

  const formatHeader = (col) => {
    if (typeof col === "string") return col;
    if (col && typeof col.label === "string") return col.label;
    return "";
  };

  const getHeaderStyle = (col) => {
    if (col && typeof col.style === "object") return col.style;
    return {};
  };

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <div className="table-wrap">
        <table className="lead-table recent-table" style={{ margin: 0 }}>
          <thead>
            <tr>
              {columns.map((col, index) => (
                <th key={index} style={getHeaderStyle(col)}>
                  {formatHeader(col)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {currentData.length > 0 ? (
              currentData.map((item, index) => renderRow(item, index + startIndex))
            ) : (
              <tr>
                <td colSpan={columns.length} className="empty-cell" style={{ padding: "3rem 1rem" }}>
                  {emptyMessage}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {totalItems > itemsPerPage && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "16px", marginTop: "8px" }}>
          <span style={{ fontSize: "0.875rem", color: "#64748b" }}>
            Showing <strong style={{ color: "#334155" }}>{startIndex + 1}</strong> to <strong style={{ color: "#334155" }}>{Math.min(startIndex + itemsPerPage, totalItems)}</strong> of <strong style={{ color: "#334155" }}>{totalItems}</strong> entries
          </span>
          <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "6px", width: "34px", height: "34px", border: "1px solid #e2e8f0", borderRadius: "8px", background: currentPage === 1 ? "#f8fafc" : "#fff", color: currentPage === 1 ? "#cbd5e1" : "#475569", cursor: currentPage === 1 ? "not-allowed" : "pointer", transition: "all 0.2s" }}
            >
              <LuChevronLeft size={18} />
            </button>
            <div style={{ display: "flex", margin: "0 4px", gap: "6px" }}>
              {Array.from({ length: totalPages }).map((_, idx) => {
                const pageNum = idx + 1;
                // Simple windowing logic (show first, last, current, and adjacent)
                if (
                  pageNum === 1 || 
                  pageNum === totalPages || 
                  (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                ) {
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      style={{ minWidth: "34px", height: "34px", padding: "0 6px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.9rem", fontWeight: currentPage === pageNum ? 700 : 500, borderRadius: "8px", border: currentPage === pageNum ? "1px solid #1a4a8f" : "1px solid #e2e8f0", background: currentPage === pageNum ? "#1a4a8f" : "#fff", color: currentPage === pageNum ? "#ffffff" : "#475569", cursor: "pointer", transition: "all 0.2s" }}
                    >
                      {pageNum}
                    </button>
                  );
                }
                
                if (pageNum === currentPage - 2 || pageNum === currentPage + 2) {
                  return <span key={pageNum} style={{ display: "flex", alignItems: "flex-end", padding: "0 2px", color: "#94a3b8", fontWeight: 600 }}>...</span>;
                }
                
                return null;
              })}
            </div>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "6px", width: "34px", height: "34px", border: "1px solid #e2e8f0", borderRadius: "8px", background: currentPage === totalPages ? "#f8fafc" : "#fff", color: currentPage === totalPages ? "#cbd5e1" : "#475569", cursor: currentPage === totalPages ? "not-allowed" : "pointer", transition: "all 0.2s" }}
            >
              <LuChevronRight size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

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

const statusToneMap = {
  NEW: "tag-blue",
  CONTACTED: "tag-amber",
  QUALIFIED: "tag-violet",
  FOLLOW_UP: "tag-orange",
  WON: "tag-green",
  LOST: "tag-rose",
  CONVERTED: "tag-green",
  FORWARDED: "tag-blue",
  ASSIGNED: "tag-blue",
};

const formatDate = (value) => {
  if (!value) {
    return "Not scheduled";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
};

const formatStatus = (value = "") =>
  value
    .toLowerCase()
    .split("_")
    .map((item) => item.charAt(0).toUpperCase() + item.slice(1))
    .join(" ");

export default function Dashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dateFilter, setDateFilter] = useState({ start: "", end: "" });
  const [appliedFilter, setAppliedFilter] = useState({ start: "", end: "" });
  const sessionUser = getSessionUser();

  useEffect(() => {
    let mounted = true;

    const loadDashboard = async () => {
      try {
        setLoading(true);
        const data = await fetchLeadDashboard({
          startDate: appliedFilter.start,
          endDate: appliedFilter.end,
        });
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
  }, [appliedFilter.start, appliedFilter.end]);

  const handleApplyFilter = () => {
    if (dateFilter.start && dateFilter.end && new Date(dateFilter.start) > new Date(dateFilter.end)) {
      setError("Start date must be before end date");
      return;
    }
    setAppliedFilter(dateFilter);
  };

  const summary = dashboard?.summary || {};
  const recentLeads = dashboard?.recentLeads || [];
  const pipeline = dashboard?.pipeline || [];
  const activeZone = sessionUser?.zone || dashboard?.zone || "";
  const activeState = sessionUser?.state || dashboard?.state || "";

  const countByStatuses = (statuses = []) =>
    pipeline
      .filter((item) => statuses.includes(String(item.label || "").toUpperCase()))
      .reduce((total, item) => total + Number(item.value || 0), 0);

  const convertedCount = countByStatuses(["CONVERTED", "WON"]);
  const forwardedCount = countByStatuses(["FORWARDED", "ASSIGNED"]);

  const totalConverted = convertedCount;
  const totalForwarded = forwardedCount;

  const convertedDescription = "Successfully converted";
  const forwardedDescription = "Sent to State Manager pipeline";

  const totalConvertedSafe = Number(totalConverted || 0);

  const calls = dashboard?.calls || [];
  const interestedClients = dashboard?.interestedClients || [];
  const contactPersons = recentLeads.flatMap(lead => 
    (lead.contacts || []).map(contact => ({ ...contact, companyName: lead.companyName, leadCode: lead.leadCode }))
  );

  return (
    <div className="page-section">
      <section className="hero-card">
        <div className="hero-copy">
          <div className="eyebrow">
            <LuSparkles />
            Lead Generator Panel
          </div>
          <h1>Welcome back</h1>
          <p>
            Here's what is happening with your leads today.
          </p>
          {activeZone || activeState ? (
            <p style={{ marginTop: "8px", fontWeight: 600, color: "#0f172a" }}>
              Territory: {activeState || "State not assigned"}{activeZone ? `, ${activeZone} Zone` : ""}
            </p>
          ) : null}
        </div>

        <div className="hero-actions">
          <Link to="/add-lead" className="button button-primary">
            <LuPlus />
            Add New Lead
          </Link>
        </div>
      </section>

      {error ? <div className="status-banner">{error}</div> : null}

      <section className="filters-bar" style={{ display: "flex", gap: "1rem", marginBottom: "2rem", alignItems: "flex-end", flexWrap: "wrap" }}>
        <div className="filter-group" style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <label style={{ fontSize: "0.875rem", fontWeight: 500, color: "#64748b" }}>Start Date</label>
          <input 
            type="date" 
            className="input" 
            value={dateFilter.start} 
            onChange={(e) => setDateFilter((prev) => ({ ...prev, start: e.target.value }))} 
          />
        </div>
        <div className="filter-group" style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <label style={{ fontSize: "0.875rem", fontWeight: 500, color: "#64748b" }}>End Date</label>
          <input 
            type="date" 
            className="input" 
            value={dateFilter.end} 
            onChange={(e) => setDateFilter((prev) => ({ ...prev, end: e.target.value }))} 
          />
        </div>
        <button className="button button-secondary" onClick={handleApplyFilter}>
          Apply Filters
        </button>
      </section>

      <section className="stat-grid">
        <article className="stat-card stat-card-submitted">
          <div className="stat-card-top">
            <span>Total Leads</span>
            <span className="stat-icon stat-icon-blue">
              <LuClock3 />
            </span>
          </div>
          <h2>{loading ? "..." : summary.totalLeads || 0}</h2>
          <p>{summary.leadsThisMonth || 0} added this month</p>
        </article>

        <article className="stat-card stat-card-approved">
          <div className="stat-card-top">
            <span>Converted Leads</span>
            <span className="stat-icon stat-icon-green">
              <LuBadgeCheck />
            </span>
          </div>
          <h2>{loading ? "..." : totalConvertedSafe || 0}</h2>
          <p>{convertedDescription}</p>
        </article>

        <article className="stat-card stat-card-forwarded">
          <div className="stat-card-top">
            <span>Forwarded Leads</span>
            <span className="stat-icon stat-icon-blue">
              <LuSend />
            </span>
          </div>
          <h2>{loading ? "..." : totalForwarded || 0}</h2>
          <p>{forwardedDescription}</p>
        </article>
      </section>

      <section className="content-grid">
        <article className="data-card recent-leads-card">
          <div className="card-header recent-leads-header">
            <div>
              <h3 className="recent-title">Recent Leads</h3>
              <p className="recent-subtitle">Recent Activity</p>
            </div>
            <Link to="/my-leads" className="button recent-add-btn">
              View All
              <LuArrowRight />
            </Link>
          </div>

          <PaginatedTable
            data={recentLeads}
            columns={["Company Name", "Date Submitted", "Status"]}
            emptyMessage="No leads yet. Use Add New Lead to create the first record."
            renderRow={(lead) => (
              <tr key={lead.id}>
                <td>{lead.companyName}</td>
                <td>{formatDate(lead.createdAt)}</td>
                <td>
                  <span className={`tag ${statusToneMap[lead.status] || "tag-neutral"}`}>
                    {formatStatus(lead.status)}
                  </span>
                </td>
              </tr>
            )}
          />
        </article>

        <article className="data-card recent-leads-card">
          <div className="card-header recent-leads-header">
            <div>
              <h3 className="recent-title">Latest Calls</h3>
              <p className="recent-subtitle">Activity History</p>
            </div>
          </div>
          <PaginatedTable
            data={calls}
            columns={["Date", "Company", "Outcome", "Notes"]}
            emptyMessage="No calls recorded yet."
            renderRow={(call, index) => (
              <tr key={`call-${index}`}>
                <td>{formatDate(call.date)}</td>
                <td>{call.companyName}</td>
                <td>{call.outcome}</td>
                <td><span title={call.notes}>{call.notes.length > 50 ? call.notes.substring(0, 50) + "..." : call.notes}</span></td>
              </tr>
            )}
          />
        </article>
      </section>

      <section className="content-grid" style={{ marginTop: "2rem" }}>
        <article className="data-card recent-leads-card">
          <div className="card-header recent-leads-header">
            <div>
              <h3 className="recent-title">Contact Persons</h3>
              <p className="recent-subtitle">Associated with recent leads</p>
            </div>
          </div>
          <PaginatedTable
            data={contactPersons}
            columns={["Name", "Company", "Phone", "Designation"]}
            emptyMessage="No contact persons available."
            renderRow={(contact, index) => (
              <tr key={`contact-${index}`}>
                <td>{contact.fullName}</td>
                <td>{contact.companyName}</td>
                <td>{contact.phone}</td>
                <td>{contact.designation || "-"}</td>
              </tr>
            )}
          />
        </article>

        <article className="data-card recent-leads-card">
          <div className="card-header recent-leads-header">
            <div>
              <h3 className="recent-title">Interested Clients</h3>
              <p className="recent-subtitle">High priority and qualified leads</p>
            </div>
          </div>
          <PaginatedTable
            data={interestedClients}
            columns={["Company", "Contact", "Status"]}
            emptyMessage="No interested clients found."
            renderRow={(client) => (
              <tr key={client.id}>
                <td>{client.companyName}</td>
                <td>{client.contactName}</td>
                <td>
                  <span className={`tag ${statusToneMap[client.status] || "tag-neutral"}`}>
                    {client.subStatus ? `${formatStatus(client.status)} - ${client.subStatus}` : formatStatus(client.status)}
                  </span>
                </td>
              </tr>
            )}
          />
        </article>
      </section>
    </div>
  );
}
