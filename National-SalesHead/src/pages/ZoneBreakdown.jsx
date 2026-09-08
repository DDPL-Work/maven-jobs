import { useEffect, useState, useRef } from "react";
import { 
  LuMap, 
  LuUsers, 
  LuCircleCheck, 
  LuTrendingUp, 
  LuChevronRight,
  LuLayoutGrid,
  LuLayoutList,
  LuDownload,
  LuLoaderCircle
} from "react-icons/lu";
import { fetchZoneStats } from "../api/nshApi";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import ZoneReportTemplate from "../components/ZoneReportTemplate";

export default function ZoneBreakdown() {
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [viewMode, setViewMode] = useState("grid"); // 'grid' or 'list'
  const [isGenerating, setIsGenerating] = useState(false);
  const [reportZone, setReportZone] = useState(null);
  
  const reportRef = useRef(null);

  useEffect(() => {
    const loadZones = async () => {
      try {
        const result = await fetchZoneStats();
        setZones(result);
      } catch (err) {
        setError("Failed to load zone-wise performance stats.");
      } finally {
        setLoading(false);
      }
    };
    loadZones();
  }, []);

  const handleDownloadReport = async (zone) => {
    if (isGenerating) return;
    
    setReportZone(zone);
    setIsGenerating(true);

    // Wait for state update and template render
    setTimeout(async () => {
      try {
        const element = reportRef.current;
        if (!element) return;

        const canvas = await html2canvas(element, {
          scale: 2, // higher resolution
          useCORS: true,
          logging: false,
          backgroundColor: "#ffffff"
        });

        const imgData = canvas.toDataURL("image/png");
        const pdf = new jsPDF({
          orientation: "portrait",
          unit: "px",
          format: [canvas.width / 2, canvas.height / 2] // match canvas size
        });

        pdf.addImage(imgData, "PNG", 0, 0, canvas.width / 2, canvas.height / 2);
        pdf.save(`Maven_CRM_${zone.zone}_Zone_Report.pdf`);
      } catch (err) {
        console.error("PDF generation failed:", err);
      } finally {
        setIsGenerating(false);
        setReportZone(null);
      }
    }, 100);
  };

  if (loading) return <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>Analyzing Regional Performance...</div>;
  if (error) return <div style={{ padding: "20px", color: "#ef4444" }}>{error}</div>;

  return (
    <div style={{ padding: "24px 32px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "32px" }}>
        <div>
          <h1 style={{ fontSize: "1.875rem", fontWeight: "700", color: "#1e3a8a", margin: "0 0 8px 0" }}>Zone Performance</h1>
          <p style={{ color: "#64748b", margin: 0 }}>Detailed breakdown of sales operations across all four zones.</p>
        </div>
        
        <div style={{ display: "flex", backgroundColor: "#fff", borderRadius: "10px", padding: "4px", border: "1px solid #e2e8f0" }}>
          <button 
            onClick={() => setViewMode("grid")}
            style={{ 
              padding: "8px 12px", 
              borderRadius: "8px", 
              border: "none", 
              backgroundColor: viewMode === "grid" ? "#eff6ff" : "transparent",
              color: viewMode === "grid" ? "#1e40af" : "#64748b",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px"
            }}
          >
            <LuLayoutGrid size={18} /> <span style={{ fontSize: "0.875rem", fontWeight: 600 }}>Grid</span>
          </button>
          <button 
            onClick={() => setViewMode("list")}
            style={{ 
              padding: "8px 12px", 
              borderRadius: "8px", 
              border: "none", 
              backgroundColor: viewMode === "list" ? "#eff6ff" : "transparent",
              color: viewMode === "list" ? "#1e40af" : "#64748b",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px"
            }}
          >
            <LuLayoutList size={18} /> <span style={{ fontSize: "0.875rem", fontWeight: 600 }}>Table</span>
          </button>
        </div>
      </div>

      {viewMode === "grid" ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: "24px" }}>
          {zones.map((zone) => (
            <div key={zone.zone} className="zone-card">
              <div style={{ padding: "24px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center", backgroundColor: "#f8fafc" }}>
                <h3 style={{ margin: 0, fontSize: "1.25rem", color: "#1e3a8a", fontWeight: "700" }}>{zone.zone} Zone</h3>
                <div style={{ padding: "4px 12px", borderRadius: "20px", backgroundColor: "#3b82f6", color: "#fff", fontSize: "0.75rem", fontWeight: 700 }}>
                  Active
                </div>
              </div>
              
              <div style={{ padding: "24px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "32px" }}>
                  <div>
                    <label style={{ fontSize: "0.75rem", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 600 }}>Total Leads</label>
                    <p style={{ margin: "4px 0 0 0", fontSize: "1.5rem", fontWeight: 700, color: "#1e293b" }}>{zone.totalLeads}</p>
                  </div>
                  <div>
                    <label style={{ fontSize: "0.75rem", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 600 }}>Conversion Rate</label>
                    <p style={{ margin: "4px 0 0 0", fontSize: "1.5rem", fontWeight: 700, color: "#10b981" }}>{zone.conversionRate}%</p>
                  </div>
                </div>

                <div style={{ display: "grid", gap: "12px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.875rem", color: "#475569" }}>
                    <span>Converted Deals</span>
                    <span style={{ fontWeight: 600 }}>{zone.converted}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.875rem", color: "#475569" }}>
                    <span>Pending Evaluation</span>
                    <span style={{ fontWeight: 600 }}>{zone.pending}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.875rem", color: "#475569" }}>
                    <span>Active State Managers</span>
                    <span style={{ fontWeight: 600 }}>{zone.smCount}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.875rem", color: "#475569" }}>
                    <span>Lead Generators</span>
                    <span style={{ fontWeight: 600 }}>{zone.lgCount}</span>
                  </div>
                </div>

                <button 
                  className="zone-report-btn"
                  onClick={() => handleDownloadReport(zone)}
                  disabled={isGenerating}
                >
                  {isGenerating && reportZone?.zone === zone.zone ? (
                    <><LuLoaderCircle className="animate-spin" size={16} /> Generating PDF...</>
                  ) : (
                    <>View Detailed Zone Report <LuChevronRight size={16} /></>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ backgroundColor: "#fff", padding: "24px", borderRadius: "16px", border: "1px solid #e2e8f0" }}>
          <div className="table-wrap">
            <table className="my-leads-table">
              <thead>
                <tr>
                  <th>ZONE</th>
                  <th>LEADS</th>
                  <th>CONVERTED</th>
                  <th>PENDING</th>
                  <th>CONV. RATE</th>
                  <th>SMs</th>
                  <th>LGs</th>
                </tr>
              </thead>
              <tbody>
                {zones.map((zone) => (
                  <tr key={zone.zone}>
                    <td><strong>{zone.zone}</strong></td>
                    <td>{zone.totalLeads}</td>
                    <td>{zone.converted}</td>
                    <td>{zone.pending}</td>
                    <td><span style={{ color: "#10b981", fontWeight: 700 }}>{zone.conversionRate}%</span></td>
                     <td>{zone.smCount}</td>
                    <td>{zone.lgCount}</td>
                    <td>
                      <button 
                        onClick={() => handleDownloadReport(zone)}
                        disabled={isGenerating}
                        style={{ background: "transparent", border: "none", color: "#1e40af", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px", fontWeight: 600 }}
                      >
                        <LuDownload size={14} /> PDF
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Hidden PDF Template Container */}
      <div style={{ position: "absolute", left: "-9999px", top: 0, overflow: "hidden", height: 0 }}>
        {reportZone && <ZoneReportTemplate ref={reportRef} zoneData={reportZone} />}
      </div>
    </div>
  );
}
