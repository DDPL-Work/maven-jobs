import React, { useState, useEffect, useMemo, useCallback } from "react";
import { LuSearch, LuGlobe, LuBuilding2, LuMapPin, LuPhone, LuMail, LuEye, LuPencil, LuX, LuCheck, LuSend, LuFilter, LuChevronUp, LuChevronDown } from "react-icons/lu";
import { fetchPortalLeads, verifyPortalLead, fetchFseCRMs } from "../api/fseApi";

const formatDate = (dateString) => {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};



const PortalLeads = () => {
  const [leads, setLeads] = useState([]);
  const [crms, setCrms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  
  const [selectedLead, setSelectedLead] = useState(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState(null);
  const [selectedCrm, setSelectedCrm] = useState(null);
  const [crmSearch, setCrmSearch] = useState("");
  const [crmDropdownOpen, setCrmDropdownOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  const [search, setSearch] = useState("");
  const [location, setLocation] = useState("");
  const [assignedToId, setAssignedToId] = useState("");
  const [status, setStatus] = useState("");
  const [subStatus, setSubStatus] = useState("");
  const [clientType, setClientType] = useState("");
  const [projection, setProjection] = useState("");
  const [date, setDate] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (location) count++;
    if (assignedToId) count++;
    if (status) count++;
    if (clientType) count++;
    if (projection) count++;
    if (date || (startDate && endDate)) count++;
    if (subStatus) count++;
    return count;
  }, [location, assignedToId, status, clientType, projection, date, startDate, endDate, subStatus]);

  const handleView = (lead) => {
    setSelectedLead(lead);
    setViewModalOpen(true);
  };

  const handleEdit = (lead) => {
    setSelectedLead(lead);
    setVerificationStatus(null);
    setSelectedCrm(null);
    setCrmSearch("");
    setCrmDropdownOpen(false);
    setRejectionReason("");
    setEditModalOpen(true);
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [leadsRes, crmsRes] = await Promise.all([
        fetchPortalLeads({
          search,
          location,
          assignedTo: assignedToId,
          status,
          date,
          startDate,
          endDate,
        }),
        fetchFseCRMs()
      ]);
      setLeads(leadsRes.items || []);
      setCrms(crmsRes || []);
    } catch (err) {
      console.error("Failed to load portal leads:", err);
    } finally {
      setLoading(false);
    }
  }, [search, location, assignedToId, status, date, startDate, endDate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleVerificationSubmit = async () => {
    if (!verificationStatus) return;
    
    setIsVerifying(true);
    try {
      const action = verificationStatus === 'approved' ? 'APPROVE' : 'REJECT';
      const payload = {
        action,
        crmUserId: selectedCrm?.id,
        reason: rejectionReason
      };
      
      await verifyPortalLead(selectedLead.id, payload);
      setEditModalOpen(false);
      loadData();
    } catch (error) {
      console.error("Verification failed", error);
      alert(error?.response?.data?.message || "Verification failed");
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="my-leads-page">
      <header className="page-header-premium">
        <div className="header-left">
          <div className="breadcrumb">
            <span>Dashboard</span>
            <span className="separator">/</span>
            <span className="current">Portal Leads</span>
          </div>
          <h1 className="page-title-premium">Portal Leads</h1>
          <p className="page-subtitle">View and manage leads that originated from the MavenJobs portal.</p>
        </div>
      </header>

      <section className="my-leads-filters-container-premium">
        <div className="filter-main-row">
          <div className="search-box-premium">
            <LuSearch className="search-icon" />
            <input
              className="search-input-premium"
              placeholder="Search company, contact, or lead code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          
          <div className="filter-actions-toolbar">
            <button 
              className={`advanced-toggle-btn ${showAdvanced ? 'active' : ''}`}
              onClick={() => setShowAdvanced(!showAdvanced)}
            >
              <LuFilter size={16} />
              <span>Advanced Filters</span>
              {activeFilterCount > 0 && <span className="filter-badge">{activeFilterCount}</span>}
              {showAdvanced ? <LuChevronUp size={16} /> : <LuChevronDown size={16} />}
            </button>
            
            <button className="reset-btn-premium" onClick={() => {
              setSearch(""); setLocation(""); setAssignedToId(""); setStatus(""); setSubStatus("");
              setClientType(""); setProjection(""); setDate(""); setStartDate(""); setEndDate("");
            }}>
              Clear All
            </button>
          </div>
        </div>

        {showAdvanced && (
          <div className="advanced-filters-panel animate-slide-down">
            <div className="filter-grid-layout">
              <div className="filter-control">
                <label>Geography</label>
                <div className="input-with-icon">
                  <LuMapPin className="field-icon" />
                  <input
                    placeholder="State or City..."
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                  />
                </div>
              </div>

              <div className="filter-control">
                <label>Assigned To (CRM)</label>
                <select value={assignedToId} onChange={(e) => setAssignedToId(e.target.value)}>
                  <option value="">All CRMs</option>
                  {crms.map(crm => (
                    <option key={crm.id} value={crm.id}>{crm.name} ({crm.email})</option>
                  ))}
                </select>
              </div>

              <div className="filter-control">
                <label>Pipeline Status</label>
                <select value={status} onChange={(e) => setStatus(e.target.value)}>
                  <option value="">All Statuses</option>
                  <option value="NEW">New</option>
                  <option value="ASSIGNED">Assigned</option>
                  <option value="REJECTED">Rejected</option>
                </select>
              </div>

              <div className="filter-control">
                <label>Date Shortcut</label>
                <select value={date} onChange={(e) => setDate(e.target.value)}>
                  <option value="">Custom Selection</option>
                  <option value="today">Today</option>
                  <option value="yesterday">Yesterday</option>
                  <option value="this_week">This Week</option>
                  <option value="this_month">This Month</option>
                </select>
              </div>

              <div className="filter-control col-span-2">
                <label>Custom Date Range</label>
                <div className="date-range-inputs">
                  <input type="date" value={startDate} onChange={(e) => { setStartDate(e.target.value); setDate(""); }} />
                  <span className="range-sep">to</span>
                  <input type="date" value={endDate} onChange={(e) => { setEndDate(e.target.value); setDate(""); }} />
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      <section className="my-leads-table-card-premium">
        <div className="table-wrap">
          <table className="my-leads-table grid-table">
            <thead>
              <tr className="header-level-1">
                <th colSpan="3">COMPANY INFORMATION</th>
                <th colSpan="3">CONTACT DETAILS</th>
                <th rowSpan="2">ASSIGNED TO</th>
                <th rowSpan="2">STATUS</th>
                <th rowSpan="2">ACTION</th>
              </tr>
              <tr className="header-level-2">
                <th>RECEIVED DATE</th>
                <th>LEAD ID</th>
                <th>COMPANY NAME</th>
                <th>CONTACT PERSON</th>
                <th>EMAIL</th>
                <th>PHONE & LOCATION</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: "center", padding: "40px" }}>Loading portal leads...</td>
                </tr>
              ) : leads.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: "center", padding: "40px" }}>No portal leads found matching your criteria.</td>
                </tr>
              ) : (
                leads.map((lead) => (
                  <tr key={lead.id} className="lead-row">
                    <td>{formatDate(lead.createdAt)}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <span style={{ fontWeight: 600, color: "#1E5EFF" }}>{lead.leadCode || lead.id}</span>
                      </div>
                    </td>
                    <td>
                      <div className="company-cell">
                        <div className="company-text">
                          <div className="company-name">{lead.companyName}</div>
                        </div>
                      </div>
                    </td>
                    <td>{lead.contactName}</td>
                    <td>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        {lead.email}
                      </div>
                    </td>
                    <td>
                      <div className="flex flex-col gap-1 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <LuPhone size={14} />
                          {lead.phone}
                        </div>
                        <div className="flex items-center gap-2">
                          <LuMapPin size={14} />
                          {lead.city}, {lead.state}
                        </div>
                      </div>
                    </td>
                    <td>
                      {lead.status === 'ASSIGNED' && lead.assignedTo ? (
                        <div className="flex flex-col gap-1 text-sm">
                          <div className="font-semibold text-slate-700">{lead.assignedTo.fullName}</div>
                          <div className="text-gray-500" style={{ fontSize: '11px' }}>{lead.assignedTo.email}</div>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-sm italic">Unassigned</span>
                      )}
                    </td>
                    <td>
                      <span className={`status-pill ${
                        lead.status === 'NEW' ? 'status-pill-pending' : 
                        lead.status === 'ASSIGNED' ? 'status-pill-approved' : 'status-pill-contacted'
                      }`}>
                        {lead.status}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-3">
                        <button className="icon-btn text-blue-600 hover:text-blue-800" onClick={() => handleView(lead)} title="View Details">
                          <LuEye size={18} />
                        </button>
                        {(lead.status === 'NEW' || lead.status === 'REJECTED') && (
                          <button className="icon-btn text-gray-600 hover:text-gray-800" onClick={() => handleEdit(lead)} title="Process Lead">
                            <LuPencil size={18} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* View Modal */}
      {viewModalOpen && selectedLead && (
        <div className="modal-overlay" onClick={() => setViewModalOpen(false)}>
          <div className="modal-content" style={{ maxWidth: '600px' }} onClick={(e) => e.stopPropagation()}>
            <header className="modal-header">
              <div className="header-info">
                <h2>Lead Details</h2>
                <p>ID: {selectedLead.leadCode || selectedLead.id}</p>
              </div>
              <button className="close-btn" onClick={() => setViewModalOpen(false)}><LuX size={20} /></button>
            </header>
            <div className="modal-body">
              <div className="detail-section">
                <h3>Company Information</h3>
                <div className="detail-grid">
                  <div className="detail-item full-width">
                    <span className="detail-label"><LuBuilding2 size={14} /> Company Name</span>
                    <p className="detail-value" style={{ fontWeight: 700, color: '#1e40af', fontSize: '1.2rem' }}>{selectedLead.companyName}</p>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label"><LuMapPin size={14} /> Location</span>
                    <p className="detail-value">{selectedLead.city}, {selectedLead.state}</p>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Status</span>
                    <p className="detail-value">
                      <span className={`status-pill ${
                        selectedLead.status === 'NEW' ? 'status-pill-pending' : 
                        selectedLead.status === 'ASSIGNED' ? 'status-pill-approved' : 'status-pill-contacted'
                      }`}>
                        {selectedLead.status}
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              <div className="detail-section">
                <h3>Contact Information</h3>
                <div className="detail-grid">
                  <div className="detail-item full-width">
                    <span className="detail-label">Contact Person</span>
                    <p className="detail-value" style={{ fontWeight: 600 }}>{selectedLead.contactName}</p>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label"><LuPhone size={14} /> Phone</span>
                    <p className="detail-value">{selectedLead.phone}</p>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label"><LuMail size={14} /> Email</span>
                    <p className="detail-value">{selectedLead.email}</p>
                  </div>
                </div>
              </div>

              {selectedLead.status === 'ASSIGNED' && selectedLead.assignedTo && (
                <div className="detail-section">
                  <h3>Assignment Information</h3>
                  <div className="detail-grid">
                    <div className="detail-item full-width">
                      <span className="detail-label">Assigned CRM</span>
                      <p className="detail-value" style={{ fontWeight: 600 }}>{selectedLead.assignedTo.fullName}</p>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label"><LuMail size={14} /> CRM Email</span>
                      <p className="detail-value">{selectedLead.assignedTo.email || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <footer className="modal-footer">
              <button className="secondary-btn" onClick={() => setViewModalOpen(false)}>Close</button>
            </footer>
          </div>
        </div>
      )}

      {/* Edit/Action Modal */}
      {editModalOpen && selectedLead && (
        <div className="modal-overlay" onClick={() => setEditModalOpen(false)}>
          <div className="modal-content" style={{ maxWidth: '550px' }} onClick={(e) => e.stopPropagation()}>
            <header className="modal-header">
              <div className="header-info">
                <h2>Process Portal Lead</h2>
                <p>Verification & Assignment for {selectedLead.companyName}</p>
              </div>
              <button className="close-btn" onClick={() => setEditModalOpen(false)}><LuX size={20} /></button>
            </header>
            <div className="modal-body">
              
              {/* Step 1: Verification */}
              <div className="detail-section mb-6">
                <h3 className="flex items-center gap-2 mb-3" style={{ fontSize: '1.1rem', color: '#1e3a8a', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
                  <span style={{ background: '#e0e7ff', color: '#3730a3', borderRadius: '50%', width: '24px', height: '24px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', fontWeight: 'bold' }}>1</span>
                  Verification Status
                </h3>
                
                <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                  <button 
                    className="button" 
                    style={{ 
                      flex: 1, 
                      padding: '10px 14px', 
                      backgroundColor: verificationStatus === 'approved' ? '#f0fdf4' : '#ffffff', 
                      color: verificationStatus === 'approved' ? '#166534' : '#475569', 
                      border: `2px solid ${verificationStatus === 'approved' ? '#22c55e' : '#e2e8f0'}`,
                      transition: 'all 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      fontSize: '0.95rem'
                    }}
                    onClick={() => setVerificationStatus('approved')}
                  >
                    <div style={{ padding: '4px', background: verificationStatus === 'approved' ? '#dcfce7' : '#f1f5f9', borderRadius: '50%', display: 'flex' }}>
                      <LuCheck size={18} /> 
                    </div>
                    <span style={{ fontWeight: 600 }}>Approve Lead</span>
                  </button>
                  
                  <button 
                    className="button" 
                    style={{ 
                      flex: 1, 
                      padding: '10px 14px', 
                      backgroundColor: verificationStatus === 'rejected' ? '#fef2f2' : '#ffffff', 
                      color: verificationStatus === 'rejected' ? '#991b1b' : '#475569', 
                      border: `2px solid ${verificationStatus === 'rejected' ? '#ef4444' : '#e2e8f0'}`,
                      transition: 'all 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      fontSize: '0.95rem'
                    }}
                    onClick={() => setVerificationStatus('rejected')}
                  >
                    <div style={{ padding: '4px', background: verificationStatus === 'rejected' ? '#fee2e2' : '#f1f5f9', borderRadius: '50%', display: 'flex' }}>
                      <LuX size={18} /> 
                    </div>
                    <span style={{ fontWeight: 600 }}>Reject Lead</span>
                  </button>
                </div>
              </div>

              {/* Step 2: Rejection Reason (Only visible if rejected) */}
              {verificationStatus === 'rejected' && (
                <div className="detail-section animate-slide-down" style={{ marginTop: '24px' }}>
                  <h3 className="flex items-center gap-2 mb-3" style={{ fontSize: '1.1rem', color: '#1e3a8a', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
                    <span style={{ background: '#e0e7ff', color: '#3730a3', borderRadius: '50%', width: '24px', height: '24px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', fontWeight: 'bold' }}>2</span>
                    Reason for Rejection
                  </h3>
                  
                  <div className="form-field" style={{ marginTop: '16px' }}>
                    <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#475569', marginBottom: '8px', display: 'block' }}>Please specify the reason *</label>
                    <textarea 
                      className="textarea"
                      style={{ width: '100%', minHeight: '100px', border: '1px solid #cbd5e1', borderRadius: '10px', padding: '12px', outline: 'none' }}
                      placeholder="E.g. Incomplete information, outside service area, etc."
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                    ></textarea>
                  </div>
                </div>
              )}

              {/* Step 2: CRM Assignment (Only visible if approved) */}
              {verificationStatus === 'approved' && (
                <div className="detail-section animate-slide-down" style={{ marginTop: '24px' }}>
                  <h3 className="flex items-center gap-2 mb-3" style={{ fontSize: '1.1rem', color: '#1e3a8a', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
                    <span style={{ background: '#e0e7ff', color: '#3730a3', borderRadius: '50%', width: '24px', height: '24px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', fontWeight: 'bold' }}>2</span>
                    Assign to CRM
                  </h3>
                  
                  <div className="form-field" style={{ marginTop: '16px' }}>
                    <label style={{ fontSize: '0.85rem', fontWeight: 700, color: '#475569', marginBottom: '8px', display: 'block' }}>Search and Select CRM Representative</label>
                    <div className="input-with-icon" style={{ position: 'relative' }}>
                      <LuSearch style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                      <input 
                        type="text"
                        className="input"
                        style={{ width: '100%', paddingLeft: '40px', height: '46px', border: '1px solid #cbd5e1', borderRadius: '10px', outline: 'none' }}
                        placeholder="Search CRM by name or email..."
                        value={crmSearch}
                        onChange={(e) => {
                          setCrmSearch(e.target.value);
                          setSelectedCrm(null);
                          setCrmDropdownOpen(true);
                        }}
                        onFocus={() => setCrmDropdownOpen(true)}
                        onBlur={() => setTimeout(() => setCrmDropdownOpen(false), 200)}
                      />
                      
                      {crmDropdownOpen && (
                        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: '8px', background: '#fff', border: '1px solid #cbd5e1', borderRadius: '10px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', zIndex: 50, maxHeight: '200px', overflowY: 'auto' }}>
                          {crms.filter(crm => 
                            crm.name.toLowerCase().includes(crmSearch.toLowerCase()) || 
                            crm.email.toLowerCase().includes(crmSearch.toLowerCase())
                          ).length > 0 ? (
                            crms.filter(crm => 
                              crm.name.toLowerCase().includes(crmSearch.toLowerCase()) || 
                              crm.email.toLowerCase().includes(crmSearch.toLowerCase())
                            ).map(crm => (
                              <div 
                                key={crm.id} 
                                style={{ padding: '12px 16px', borderBottom: '1px solid #f1f5f9', cursor: 'pointer', transition: 'background 0.2s', display: 'flex', flexDirection: 'column' }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                onClick={() => {
                                  setSelectedCrm(crm);
                                  setCrmSearch(`${crm.name} (${crm.email})`);
                                  setCrmDropdownOpen(false);
                                }}
                              >
                                <span style={{ fontWeight: 600, color: '#1e293b' }}>{crm.name}</span>
                                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>{crm.email} - {crm.role}</span>
                              </div>
                            ))
                          ) : (
                            <div style={{ padding: '12px 16px', color: '#64748b', fontSize: '0.9rem', textAlign: 'center' }}>
                              No CRMs found
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <LuGlobe size={14} /> The selected CRM will receive an email notification with lead details.
                    </p>
                  </div>
                </div>
              )}

            </div>
            <footer className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc' }}>
              <button className="secondary-btn" onClick={() => setEditModalOpen(false)}>Cancel</button>
              <button 
                className="button button-primary" 
                disabled={!verificationStatus || (verificationStatus === 'approved' && !selectedCrm) || (verificationStatus === 'rejected' && !rejectionReason.trim()) || isVerifying}
                style={{ padding: '12px 24px', opacity: (!verificationStatus || (verificationStatus === 'approved' && !selectedCrm) || (verificationStatus === 'rejected' && !rejectionReason.trim()) || isVerifying) ? 0.5 : 1 }}
                onClick={handleVerificationSubmit}
              >
                {isVerifying ? 'Processing...' : (verificationStatus === 'rejected' ? 'Confirm Rejection' : 'Complete Assignment')}
                {!isVerifying && <LuSend size={16} />}
              </button>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
};

export default PortalLeads;