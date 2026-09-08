import { useEffect, useRef, useState } from "react";
import { 
  LuSearch, 
  LuDownload,
  LuBuilding2,
  LuUser,
  LuLoaderCircle,
  LuChevronLeft,
  LuChevronRight
} from "react-icons/lu";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { toast } from "sonner";
import { fetchAllLeads } from "../api/nshApi";
import NationalLeadsReportTemplate from "../components/NationalLeadsReportTemplate";

const PAGE_SIZE = 15;

export default function AllLeads() {
  const [leads, setLeads] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isExporting, setIsExporting] = useState(false);
  const [reportPayload, setReportPayload] = useState(null);
  
  // Filters
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [zone, setZone] = useState("");
  const [status, setStatus] = useState("");
  const [date, setDate] = useState("");
  const [page, setPage] = useState(1);
  const reportRef = useRef(null);

  const loadLeads = async ({
    pageOverride,
    searchOverride,
    zoneOverride,
    statusOverride,
    dateOverride,
    showLoader = true,
  } = {}) => {
    try {
      if (showLoader) {
        setLoading(true);
      }
      const result = await fetchAllLeads({
        search: searchOverride ?? appliedSearch,
        zone: zoneOverride ?? zone,
        status: statusOverride ?? status,
        date: dateOverride ?? date,
        page: pageOverride ?? page,
        limit: PAGE_SIZE,
      });
      setLeads(result.data);
      setTotal(result.total);
      setTotalPages(result?.pagination?.totalPages || 1);
      setError("");
      return result;
    } catch (err) {
      setError("Failed to load national lead database.");
      return null;
    } finally {
      if (showLoader) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    loadLeads();
  }, [zone, status, date, page, appliedSearch]);

  const handleSearch = (e) => {
    if (e.key === "Enter") {
      setPage(1);
      setAppliedSearch(search.trim());
    }
  };

  const fetchRecentLeadsForExport = async () => {
    const baseFilters = {
      search: appliedSearch,
      zone,
      status,
      date,
    };

    const result = await fetchAllLeads({
      ...baseFilters,
      page: 1,
      limit: 25,
    });

    const items = Array.isArray(result?.data) ? result.data.slice(0, 25) : [];

    return {
      items,
      total: items.length,
      filters: baseFilters,
    };
  };

  const handleExportPdf = async () => {
    try {
      setIsExporting(true);
      const exportResult = await fetchRecentLeadsForExport();

      if (!exportResult.items.length) {
        toast.error("No leads available for PDF export with current filters.");
        return;
      }

      const payload = {
        ...exportResult,
        generatedAt: new Date().toISOString(),
      };

      setReportPayload(payload);
      await new Promise((resolve) => setTimeout(resolve, 120));

      const element = reportRef.current;
      if (!element) {
        throw new Error("Unable to prepare PDF template.");
      }

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
      });

      const imageData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imageWidth = pdfWidth;
      const imageHeight = (canvas.height * imageWidth) / canvas.width;
      let heightLeft = imageHeight;
      let position = 0;

      pdf.addImage(imageData, "PNG", 0, position, imageWidth, imageHeight);
      heightLeft -= pdfHeight;

      while (heightLeft > 0) {
        position = heightLeft - imageHeight;
        pdf.addPage();
        pdf.addImage(imageData, "PNG", 0, position, imageWidth, imageHeight);
        heightLeft -= pdfHeight;
      }

      const fileDate = new Date().toISOString().slice(0, 10);
      pdf.save(`Maven_National_Leads_${fileDate}.pdf`);
      toast.success("PDF exported successfully.");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Unable to export PDF right now.");
    } finally {
      setIsExporting(false);
      setReportPayload(null);
    }
  };

  const fromIndex = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const toIndex = Math.min(page * PAGE_SIZE, total);

  return (
    <div style={{ padding: "24px 32px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "32px" }}>
        <div>
          <h1 style={{ fontSize: "1.875rem", fontWeight: "700", color: "#1e3a8a", margin: "0 0 8px 0" }}>National Lead Database</h1>
          <p style={{ color: "#64748b", margin: 0 }}>View and manage all {total} leads across the country.</p>
        </div>
        <button
          type="button"
          onClick={handleExportPdf}
          disabled={isExporting}
          style={{ 
          padding: "10px 20px", 
          borderRadius: "10px", 
          backgroundColor: "#fff", 
          border: "1px solid #e2e8f0", 
          color: "#1e293b", 
          fontWeight: 600, 
          display: "flex", 
          alignItems: "center", 
          gap: "8px",
          cursor: isExporting ? "not-allowed" : "pointer",
          opacity: isExporting ? 0.75 : 1
        }}
        >
          <LuDownload size={18} /> {isExporting ? "Exporting PDF..." : "Export Data"}
        </button>
      </div>

      {/* Filter Toolbar */}
      <section className="my-leads-toolbar-card" style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "24px", marginBottom: "24px" }}>
        <div className="my-leads-search" style={{ margin: 0 }}>
          <LuSearch />
          <input 
            type="text" 
            placeholder="Search by Company, Contact, or Phone (Press Enter)..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleSearch}
          />
        </div>

        <div style={{ display: "flex", gap: "12px" }}>
          <select value={zone} onChange={(e) => { setZone(e.target.value); setPage(1); }} className="filter-chip" style={{ appearance: "auto", paddingRight: "30px" }}>
            <option value="">All Zones</option>
            <option value="North">North Zone</option>
            <option value="South">South Zone</option>
            <option value="East">East Zone</option>
            <option value="West">West Zone</option>
          </select>

          <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="filter-chip" style={{ appearance: "auto", paddingRight: "30px" }}>
            <option value="">All Statuses</option>
            <option value="NEW">New</option>
            <option value="FORWARDED">Forwarded</option>
            <option value="ASSIGNED">Assigned</option>
            <option value="CONVERTED">Converted</option>
            <option value="REJECTED">Rejected</option>
            <option value="LOST">Lost</option>
          </select>

          <select value={date} onChange={(e) => { setDate(e.target.value); setPage(1); }} className="filter-chip" style={{ appearance: "auto", paddingRight: "30px" }}>
            <option value="">All Timeline</option>
            <option value="today">Today</option>
            <option value="yesterday">Yesterday</option>
            <option value="this_week">This Week</option>
            <option value="this_month">This Month</option>
          </select>
        </div>
      </section>

      {/* Table Card */}
      <section className="my-leads-table-card">
        <div className="table-wrap">
          <table className="my-leads-table">
            <thead>
              <tr>
                <th>COMPANY & CODE</th>
                <th>ZONE & LOCATION</th>
                <th>CONTACT PERSON</th>
                <th>STATUS</th>
                <th>GENERATOR</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" style={{ padding: "100px 0", textAlign: "center", color: "#64748b" }}>
                    <LuLoaderCircle className="animate-spin" size={24} style={{ marginBottom: "12px" }} />
                    <p>Fetching leads from database...</p>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan="5" style={{ padding: "100px 0", textAlign: "center", color: "#ef4444" }}>
                    {error}
                  </td>
                </tr>
              ) : leads.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ padding: "100px 0", textAlign: "center", color: "#64748b" }}>
                    No leads found matching your filters.
                  </td>
                </tr>
              ) : (
                leads.map((lead) => (
                  <tr key={lead.id}>
                    <td>
                      <div className="company-cell">
                        <span className="row-icon"><LuBuilding2 /></span>
                        <div>
                          <strong>{lead.companyName}</strong>
                          <small style={{ display: "block", color: "#94a3b8", fontSize: "0.7rem" }}>{lead.leadCode}</small>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                        <span style={{ fontSize: "0.875rem", fontWeight: 600, color: "#1e40af" }}>{lead.zone} Zone</span>
                        <span style={{ fontSize: "0.75rem", color: "#64748b" }}>{lead.city}, {lead.state}</span>
                      </div>
                    </td>
                    <td>
                      <div className="contact-cell">
                        <span className="contact-name"><LuUser /> {lead.contactName}</span>
                        <small>{lead.phone}</small>
                      </div>
                    </td>
                    <td>
                      <StatusPill status={lead.status} />
                    </td>
                    <td>
                      <div style={{ fontSize: "0.875rem" }}>
                        <span style={{ display: "block", fontWeight: 500 }}>{lead.generatorName}</span>
                        <small style={{ color: "#94a3b8" }}>{new Date(lead.createdAt).toLocaleDateString()}</small>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "12px 18px",
            borderTop: "1px solid #e2e8f0",
            background: "#f8fafc",
            gap: "10px",
            flexWrap: "wrap",
          }}
        >
          <span style={{ color: "#64748b", fontSize: "0.85rem" }}>
            Showing {fromIndex}-{toIndex} of {total} leads (15 per page)
          </span>
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <button
              type="button"
              className="secondary-btn"
              style={{ padding: "7px 10px" }}
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              disabled={page <= 1 || loading}
            >
              <LuChevronLeft />
            </button>
            <span style={{ color: "#334155", fontWeight: 600, minWidth: "95px", textAlign: "center" }}>
              Page {page} / {totalPages || 1}
            </span>
            <button
              type="button"
              className="secondary-btn"
              style={{ padding: "7px 10px" }}
              onClick={() => setPage((prev) => Math.min(totalPages || 1, prev + 1))}
              disabled={page >= (totalPages || 1) || loading}
            >
              <LuChevronRight />
            </button>
          </div>
        </div>
      </section>

      <div style={{ position: "absolute", left: "-9999px", top: 0, height: 0, overflow: "hidden" }}>
        {reportPayload ? <NationalLeadsReportTemplate ref={reportRef} report={reportPayload} /> : null}
      </div>
    </div>
  );
}

function StatusPill({ status }) {
  const colors = {
    CONVERTED: { text: "#10b981", bg: "#ecfdf5", border: "#10b981" },
    REJECTED: { text: "#ef4444", bg: "#fef2f2", border: "#ef4444" },
    LOST: { text: "#ef4444", bg: "#fef2f2", border: "#ef4444" },
    FORWARDED: { text: "#3b82f6", bg: "#eff6ff", border: "#3b82f6" },
    ASSIGNED: { text: "#8b5cf6", bg: "#f5f3ff", border: "#8b5cf6" },
    DEFAULT: { text: "#f59e0b", bg: "#fffbeb", border: "#f59e0b" }
  };

  const style = colors[status] || colors.DEFAULT;

  return (
    <span style={{ 
      fontSize: "0.75rem", 
      fontWeight: 700, 
      color: style.text, 
      background: style.bg, 
      padding: "3px 10px", 
      borderRadius: "12px", 
      border: `1px solid ${style.border}`,
      textTransform: "capitalize"
    }}>
      {status.toLowerCase()}
    </span>
  );
}
