import { useState, useEffect } from "react";
import { 
  LuX, 
  LuSearch, 
  LuBuilding2, 
  LuMapPin, 
  LuCalendar,
  LuCircleCheck,
  LuLoader,
  LuTrendingUp,
  LuTarget
} from "react-icons/lu";
import { fetchLeads } from "../api/leadApi";

export default function MemberReportModal({ isOpen, onClose, member }) {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    if (!isOpen || !member?.id) return;

    const loadLeads = async () => {
      try {
        setLoading(true);
        const data = await fetchLeads({ memberId: member.id, search, status });
        setLeads(Array.isArray(data) ? data : data.leads || []);
      } catch (err) {
        console.error("Failed to load work report", err);
      } finally {
        setLoading(false);
      }
    };

    const handler = setTimeout(loadLeads, 300);
    return () => clearTimeout(handler);
  }, [isOpen, member?.id, search, status]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1000 }}>
      <section 
        className="modal-content" 
        style={{ maxWidth: '900px', width: '90%', maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="modal-header" style={{ padding: '24px', borderBottom: '1px solid #e2e8f0', background: 'linear-gradient(to right, #ffffff, #f8fafc)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%' }}>
            <div className="header-info">
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1e3a8a', margin: 0 }}>Work Report: {member?.fullName || member?.name}</h2>
              <p style={{ color: '#64748b', margin: '4px 0 0 0' }}>Detailed lead history and performance metrics</p>
            </div>
            {member?.targets && (
              <div style={{ display: 'flex', gap: '16px', marginRight: '40px' }}>
                <div style={{ textAlign: 'right' }}>
                  <small style={{ color: '#64748b', fontWeight: 600, display: 'block' }}>TARGETS</small>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#1e3a8a', background: '#eff6ff', padding: '2px 8px', borderRadius: '4px' }}>
                      Gen: {member.targets.leadGeneration || 0}
                    </span>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#047857', background: '#ecfdf5', padding: '2px 8px', borderRadius: '4px' }}>
                      Conv: {member.targets.conversions || 0}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
          <button type="button" className="close-btn" onClick={onClose} style={{ top: '24px', right: '24px' }}>
            <LuX size={24} />
          </button>
        </header>

        <div style={{ padding: '16px 24px', backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', gap: '12px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <LuSearch style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input 
              type="text" 
              placeholder="Search by company or lead code..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: '100%', padding: '10px 12px 10px 40px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.875rem' }}
            />
          </div>
          <select 
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            style={{ padding: '10px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#fff', fontSize: '0.875rem', minWidth: '150px' }}
          >
            <option value="">All Statuses</option>
            <option value="NEW">New</option>
            <option value="FORWARDED">Forwarded</option>
            <option value="ASSIGNED">Assigned</option>
            <option value="CONVERTED">Converted</option>
            <option value="REJECTED">Rejected</option>
            <option value="LOST">Lost</option>
          </select>
        </div>

        <div style={{ padding: '12px 24px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', background: '#fff', borderBottom: '1px solid #f1f5f9' }}>
          <div style={{ padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <small style={{ color: '#64748b', fontWeight: 600, display: 'block' }}>TOTAL LEADS</small>
            <span style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1e293b' }}>{leads.length}</span>
          </div>
          <div style={{ padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <small style={{ color: '#64748b', fontWeight: 600, display: 'block' }}>CONVERTED</small>
            <span style={{ fontSize: '1.25rem', fontWeight: 700, color: '#10b981' }}>{leads.filter(l => l.status === 'CONVERTED').length}</span>
          </div>
          <div style={{ padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <small style={{ color: '#64748b', fontWeight: 600, display: 'block' }}>PENDING</small>
            <span style={{ fontSize: '1.25rem', fontWeight: 700, color: '#f59e0b' }}>{leads.filter(l => ['NEW', 'FORWARDED', 'ASSIGNED'].includes(l.status)).length}</span>
          </div>
          <div style={{ padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <small style={{ color: '#64748b', fontWeight: 600, display: 'block' }}>CVR</small>
            <span style={{ fontSize: '1.25rem', fontWeight: 700, color: '#3b82f6' }}>
              {leads.length > 0 ? Math.round((leads.filter(l => l.status === 'CONVERTED').length / leads.length) * 100) : 0}%
            </span>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '0' }}>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '100px 0', color: '#64748b' }}>
              <LuLoader className="animate-spin" size={40} style={{ marginBottom: '16px', color: '#3b82f6' }} />
              <p>Fetching work records...</p>
            </div>
          ) : leads.length === 0 ? (
            <div style={{ padding: '100px 0', textAlign: 'center', color: '#94a3b8' }}>
              <LuCircleCheck size={48} style={{ marginBottom: '16px', opacity: 0.3 }} />
              <p>No records found matching your filters.</p>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ position: 'sticky', top: 0, background: '#fff', zIndex: 10, borderBottom: '2px solid #f1f5f9' }}>
                <tr>
                  <th style={{ padding: '14px 24px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: '#64748b' }}>LEAD INFO</th>
                  <th style={{ padding: '14px 24px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: '#64748b' }}>LOCATION</th>
                  <th style={{ padding: '14px 24px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: '#64748b' }}>DATE</th>
                  <th style={{ padding: '14px 24px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: '#64748b' }}>STATUS</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((lead) => (
                  <tr key={lead._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '16px 24px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ background: '#f0f4ff', color: '#3b82f6', width: '36px', height: '36px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <LuBuilding2 size={18} />
                        </div>
                        <div>
                          <strong style={{ display: 'block', color: '#1e293b' }}>{lead.companyName}</strong>
                          <small style={{ color: '#64748b' }}>{lead.leadCode || 'N/A'}</small>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '16px 24px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#475569', fontSize: '0.875rem' }}>
                        <LuMapPin size={14} />
                        {lead.city}, {lead.state}
                      </div>
                    </td>
                    <td style={{ padding: '16px 24px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#475569', fontSize: '0.875rem' }}>
                        <LuCalendar size={14} />
                        {new Date(lead.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td style={{ padding: '16px 24px' }}>
                      {renderStatusPill(lead.status)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <footer style={{ padding: '16px 24px', borderTop: '1px solid #e2e8f0', backgroundColor: '#f8fafc', display: 'flex', justifyContent: 'flex-end' }}>
          <button 
            onClick={onClose}
            style={{ padding: '8px 20px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#fff', color: '#475569', fontWeight: 600, cursor: 'pointer' }}
          >
            Close Report
          </button>
        </footer>
      </section>
    </div>
  );
}

function renderStatusPill(status) {
  const styles = {
    CONVERTED: { bg: '#ecfdf5', text: '#10b981', border: '#10b981' },
    REJECTED: { bg: '#fef2f2', text: '#ef4444', border: '#ef4444' },
    LOST: { bg: '#f1f5f9', text: '#64748b', border: '#64748b' },
    ASSIGNED: { bg: '#eff6ff', text: '#3b82f6', border: '#3b82f6' },
    FORWARDED: { bg: '#fefce8', text: '#a16207', border: '#a16207' },
    NEW: { bg: '#f5f3ff', text: '#8b5cf6', border: '#8b5cf6' },
  };

  const current = styles[status] || { bg: '#f8fafc', text: '#64748b', border: '#cbd5e1' };

  return (
    <span style={{ 
      fontSize: '0.7rem', 
      fontWeight: 700, 
      color: current.text, 
      backgroundColor: current.bg, 
      padding: '4px 10px', 
      borderRadius: '20px', 
      border: `1px solid ${current.border}`,
      textTransform: 'uppercase'
    }}>
      {status}
    </span>
  );
}
