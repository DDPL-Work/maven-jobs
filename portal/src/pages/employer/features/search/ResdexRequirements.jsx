import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiFilter,
  FiSearch,
  FiBriefcase,
  FiMoreVertical,
  FiClock,
  FiPlus,
  FiFolder,
  FiEdit2,
  FiCopy,
  FiTrash2,
  FiX,
  FiBell,
  FiShare2,
  FiPlay,
  FiUsers,
  FiCheckCircle,
  FiMapPin,
  FiDollarSign,
  FiTag,
  FiCheck,
  FiRefreshCw
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import EmployerLayout from '../../../../components/employer/EmployerLayout';
import EmployerBreadcrumb from '../../../../components/employer/EmployerBreadcrumb';
import {
  useFolders,
  useCreateFolder,
  useDeleteFolder,
  useDuplicateFolder,
  useUpdateFolder
} from '../../../../hooks/useFolderQueries';
import CreateRequirementModal from '../../../../components/employer/CreateRequirementModal';
import RequirementAlertModal from '../../../../components/employer/RequirementAlertModal';
import ShareFolderModal from '../../../../components/employer/ShareFolderModal';
import { useAuth } from '../../../../AuthContext';
import './ResdexRequirements.css';

export default function ResdexRequirements() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Search & Filter state
  const [searchName, setSearchName] = useState('');
  const [filterBy, setFilterBy] = useState('me'); // 'me' | 'anyone'
  const [statusFilter, setStatusFilter] = useState({ open: true, closed: false });
  const [tagsFilter, setTagsFilter] = useState({ prospect: false, shortlisted: false, rejected: false });
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  // Modals state
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  const [editingRequirement, setEditingRequirement] = useState(null);
  const [activeDropdown, setActiveDropdown] = useState(null);

  // Alert Modal
  const [alertModalOpen, setAlertModalOpen] = useState(false);
  const [selectedReqForAlert, setSelectedReqForAlert] = useState(null);

  // Share Modal
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [selectedReqForShare, setSelectedReqForShare] = useState(null);

  // Delete Modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [folderToDelete, setFolderToDelete] = useState(null);

  // Queries
  const { data: requirements = [], isLoading, isError, refetch } = useFolders({
    limit: 100,
    folderType: 'REQUIREMENT',
    ...(filterBy === 'anyone' ? { scope: 'company' } : {})
  });

  const createFolder = useCreateFolder();
  const deleteFolder = useDeleteFolder();
  const duplicateFolder = useDuplicateFolder();
  const updateFolder = useUpdateFolder();

  // Filtered requirements
  const filteredRequirements = useMemo(() => {
    return requirements.filter(req => {
      // Name & title filter
      if (searchName.trim()) {
        const q = searchName.toLowerCase();
        const nameMatch = (req.name || '').toLowerCase().includes(q);
        const titleMatch = (req.jobTitle || req.criteria?.jobTitle || '').toLowerCase().includes(q);
        const skillMatch = (req.criteria?.skills || req.skills || []).some(s => String(s).toLowerCase().includes(q));
        if (!nameMatch && !titleMatch && !skillMatch) return false;
      }

      // Status filter
      const isReqOpen = req.status !== 'closed';
      if (!statusFilter.open && isReqOpen) return false;
      if (!statusFilter.closed && !isReqOpen) return false;

      // Tags filter (candidate stages inside requirement)
      const hasSelectedTags = tagsFilter.prospect || tagsFilter.shortlisted || tagsFilter.rejected;
      if (hasSelectedTags) {
        const reqTags = req.tags || [];
        const hasCandidates = (req.candidates || []).length > 0;
        let match = false;
        if (tagsFilter.prospect && (reqTags.includes('prospect') || hasCandidates)) match = true;
        if (tagsFilter.shortlisted && reqTags.includes('shortlisted')) match = true;
        if (tagsFilter.rejected && reqTags.includes('rejected')) match = true;
        if (!match) return false;
      }

      return true;
    });
  }, [requirements, searchName, statusFilter, tagsFilter]);

  // Metrics
  const metrics = useMemo(() => {
    const total = requirements.length;
    const open = requirements.filter(r => r.status !== 'closed').length;
    const totalCandidates = requirements.reduce((acc, r) => acc + (r.candidateCount || r.candidates?.length || 0), 0);
    const activeAlerts = requirements.filter(r => r.alerts?.enabled !== false).length;
    return { total, open, totalCandidates, activeAlerts };
  }, [requirements]);

  const activeFiltersCount = [
    searchName ? 1 : 0,
    statusFilter.open ? 1 : 0,
    statusFilter.closed ? 1 : 0,
    tagsFilter.prospect ? 1 : 0,
    tagsFilter.shortlisted ? 1 : 0,
    tagsFilter.rejected ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  const clearAllFilters = () => {
    setSearchName('');
    setStatusFilter({ open: false, closed: false });
    setTagsFilter({ prospect: false, shortlisted: false, rejected: false });
  };

  // 1-Click Run Search
  const handleRunSearch = (req) => {
    const criteria = req.criteria || {};
    const skills = criteria.skills || req.skills || [];
    const jobTitle = req.jobTitle || criteria.jobTitles?.[0] || req.name || '';
    
    const savedFilters = {
      keyword: jobTitle,
      skills: Array.isArray(skills) ? skills : (skills ? [skills] : []),
      designation: req.jobTitle || criteria.jobTitles?.[0] || '',
      minExperience: criteria.experienceMin !== undefined && criteria.experienceMin !== null && criteria.experienceMin !== '' ? String(criteria.experienceMin) : '',
      maxExperience: criteria.experienceMax !== undefined && criteria.experienceMax !== null && criteria.experienceMax !== '' ? String(criteria.experienceMax) : '',
      currentSalaryMin: criteria.salaryMin !== undefined && criteria.salaryMin !== null && criteria.salaryMin !== '' ? String(criteria.salaryMin) : '',
      currentSalaryMax: criteria.salaryMax !== undefined && criteria.salaryMax !== null && criteria.salaryMax !== '' ? String(criteria.salaryMax) : '',
      currentCity: Array.isArray(criteria.locations) ? criteria.locations : (criteria.locations ? [criteria.locations] : (req.locations || [])),
      noticePeriod: Array.isArray(criteria.noticePeriod) ? criteria.noticePeriod : (criteria.noticePeriod ? [criteria.noticePeriod] : []),
      ug: criteria.education || '',
      industry: criteria.industry || '',
      role: criteria.jobTitles?.[0] || req.jobTitle || ''
    };

    navigate('/resume-search', {
      state: {
        savedFilters,
        searchName: req.name,
        requirementId: req._id
      }
    });
  };

  // Create / Update
  const handleSaveRequirement = async (payload) => {
    try {
      if (editingRequirement) {
        await updateFolder.mutateAsync({ id: editingRequirement._id, ...payload });
      } else {
        const res = await createFolder.mutateAsync(payload);
        if (res?.data?._id) {
          navigate(`/employer-dashboard/folders/${res.data._id}`);
        }
      }
      setCreateModalOpen(false);
      setEditingRequirement(null);
      refetch();
    } catch (err) {
      console.error('Failed to save requirement:', err);
      throw err;
    }
  };

  // Close / Reopen Toggle
  const handleToggleStatus = async (req) => {
    const nextStatus = req.status === 'closed' ? 'open' : 'closed';
    try {
      await updateFolder.mutateAsync({ id: req._id, status: nextStatus });
      setActiveDropdown(null);
      refetch();
    } catch (err) {
      console.error('Failed to toggle status:', err);
    }
  };

  // Duplicate
  const handleDuplicate = async (req) => {
    try {
      await duplicateFolder.mutateAsync(req._id);
      setActiveDropdown(null);
      refetch();
    } catch (err) {
      console.error('Failed to duplicate:', err);
    }
  };

  // Delete
  const confirmDelete = async () => {
    if (folderToDelete) {
      try {
        await deleteFolder.mutateAsync(folderToDelete._id);
        setDeleteModalOpen(false);
        setFolderToDelete(null);
        refetch();
      } catch (err) {
        console.error('Failed to delete:', err);
      }
    }
  };

  // Save Alerts
  const handleSaveAlerts = async (alertPayload) => {
    if (selectedReqForAlert) {
      try {
        await updateFolder.mutateAsync({ id: selectedReqForAlert._id, ...alertPayload });
        refetch();
      } catch (err) {
        console.error('Failed to update alerts:', err);
      }
    }
  };

  // Shared Sidebar Filters Component
  const renderFilterControls = () => (
    <>
      <div className="rr-filter-header">
        <div className="rr-filter-title">
          <FiFilter color="#64748b" />
          <span>Filters</span>
        </div>
        {activeFiltersCount > 0 && (
          <button onClick={clearAllFilters} className="rr-clear-btn">
            Clear all ({activeFiltersCount})
          </button>
        )}
      </div>

      {/* Filter by name / role */}
      <div className="rr-filter-group">
        <label className="group-label">Filter by Requirement</label>
        <div className="rr-search-input-wrap">
          <FiSearch className="rr-search-icon" />
          <input
            type="text"
            placeholder="Search name, role, skill..."
            value={searchName}
            onChange={(e) => setSearchName(e.target.value)}
            className="rr-search-input"
          />
        </div>
      </div>

      {/* Status */}
      <div className="rr-filter-group">
        <label className="group-label">Status</label>
        <div className="rr-checkbox-list">
          <label className="rr-checkbox-item">
            <input
              type="checkbox"
              checked={statusFilter.open}
              onChange={(e) => setStatusFilter({ ...statusFilter, open: e.target.checked })}
            />
            <span>Open Requirements</span>
          </label>
          <label className="rr-checkbox-item">
            <input
              type="checkbox"
              checked={statusFilter.closed}
              onChange={(e) => setStatusFilter({ ...statusFilter, closed: e.target.checked })}
            />
            <span>Closed Requirements</span>
          </label>
        </div>
      </div>

      {/* Candidate Stages inside */}
      <div className="rr-filter-group">
        <label className="group-label">Candidate Stage</label>
        <div className="rr-checkbox-list">
          <label className="rr-checkbox-item">
            <input
              type="checkbox"
              checked={tagsFilter.prospect}
              onChange={(e) => setTagsFilter({ ...tagsFilter, prospect: e.target.checked })}
            />
            <span>Has Prospects</span>
          </label>
          <label className="rr-checkbox-item">
            <input
              type="checkbox"
              checked={tagsFilter.shortlisted}
              onChange={(e) => setTagsFilter({ ...tagsFilter, shortlisted: e.target.checked })}
            />
            <span>Has Shortlisted</span>
          </label>
          <label className="rr-checkbox-item">
            <input
              type="checkbox"
              checked={tagsFilter.rejected}
              onChange={(e) => setTagsFilter({ ...tagsFilter, rejected: e.target.checked })}
            />
            <span>Has Rejected</span>
          </label>
        </div>
      </div>
    </>
  );

  return (
    <EmployerLayout>
      <div className="rr-page-wrapper">
        <EmployerBreadcrumb
          items={[
            { label: 'Dashboard', path: '/employer-dashboard' },
            { label: 'Resdex', path: '/resume-search' },
            { label: 'Resdex Requirements', path: null },
          ]}
        />

        <div className="rr-container">
          {/* Header Card */}
          <div className="rr-header-card">
            <div className="rr-title-area">
              <h1>
                Resdex Requirements
                <span className="rr-title-badge">{requirements.length} Folders</span>
              </h1>
              <p>
                Saved recruitment workspaces for specific hiring openings with search blueprints, candidates & email alerts.
              </p>
            </div>
            <button
              onClick={() => {
                setEditingRequirement(null);
                setCreateModalOpen(true);
              }}
              className="rr-btn-primary"
            >
              <FiPlus size={18} />
              <span>Create Requirement</span>
            </button>
          </div>

          {/* KPI Summary Cards */}
          <div className="rr-metrics-row">
            <div className="rr-metric-card">
              <div className="rr-metric-icon" style={{ background: '#eff6ff', color: '#1d4ed8' }}>
                <FiBriefcase size={22} />
              </div>
              <div>
                <div className="rr-metric-val">{metrics.total}</div>
                <div className="rr-metric-label">Total Requirements</div>
              </div>
            </div>

            <div className="rr-metric-card">
              <div className="rr-metric-icon" style={{ background: '#ecfdf5', color: '#047857' }}>
                <FiCheckCircle size={22} />
              </div>
              <div>
                <div className="rr-metric-val">{metrics.open}</div>
                <div className="rr-metric-label">Active / Open Openings</div>
              </div>
            </div>

            <div className="rr-metric-card">
              <div className="rr-metric-icon" style={{ background: '#f5f3ff', color: '#6d28d9' }}>
                <FiUsers size={22} />
              </div>
              <div>
                <div className="rr-metric-val">{metrics.totalCandidates}</div>
                <div className="rr-metric-label">Candidates Sourced</div>
              </div>
            </div>

            <div className="rr-metric-card">
              <div className="rr-metric-icon" style={{ background: '#f0f9ff', color: '#0284c7' }}>
                <FiBell size={22} />
              </div>
              <div>
                <div className="rr-metric-val">{metrics.activeAlerts}</div>
                <div className="rr-metric-label">Active Match Alerts</div>
              </div>
            </div>
          </div>

          {/* Mobile Filter Trigger */}
          <div className="rr-mobile-filter-bar">
            <button
              className="rr-mobile-filter-trigger"
              onClick={() => setMobileDrawerOpen(true)}
            >
              <FiFilter size={16} />
              <span>Filter Requirements ({activeFiltersCount})</span>
            </button>
            <select
              value={filterBy}
              onChange={(e) => setFilterBy(e.target.value)}
              className="rr-scope-select"
            >
              <option value="me">Created By Me</option>
              <option value="anyone">All Company Requirements</option>
            </select>
          </div>

          {/* Main Grid Layout */}
          <div className="rr-content-layout">
            {/* Desktop Sidebar Filters */}
            <aside className="rr-sidebar">
              {renderFilterControls()}
            </aside>

            {/* Mobile Filter Drawer */}
            <AnimatePresence>
              {mobileDrawerOpen && (
                <>
                  <motion.div
                    className="rr-mobile-drawer-overlay"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setMobileDrawerOpen(false)}
                  />
                  <motion.div
                    className="rr-mobile-drawer"
                    initial={{ x: '-100%' }}
                    animate={{ x: 0 }}
                    exit={{ x: '-100%' }}
                    transition={{ type: 'tween', duration: 0.25 }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
                      <button
                        onClick={() => setMobileDrawerOpen(false)}
                        style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: 4 }}
                      >
                        <FiX size={20} />
                      </button>
                    </div>
                    {renderFilterControls()}
                    <button
                      onClick={() => setMobileDrawerOpen(false)}
                      style={{
                        width: '100%',
                        padding: '12px',
                        background: '#002366',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 8,
                        fontWeight: 700,
                        marginTop: 20,
                        cursor: 'pointer'
                      }}
                    >
                      Apply Filters
                    </button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>

            {/* Main Area */}
            <main className="rr-main-area">
              <div className="rr-top-controls">
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <select
                    value={filterBy}
                    onChange={(e) => setFilterBy(e.target.value)}
                    className="rr-scope-select"
                  >
                    <option value="me">Created By Me</option>
                    <option value="anyone">All Company Requirements</option>
                  </select>
                  <button
                    onClick={() => refetch()}
                    title="Refresh list"
                    style={{
                      padding: '9px 12px',
                      borderRadius: 8,
                      border: '1px solid #cbd5e1',
                      background: '#fff',
                      color: '#64748b',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      fontSize: 13,
                      fontWeight: 600
                    }}
                  >
                    <FiRefreshCw size={14} /> Refresh
                  </button>
                </div>

                <div className="rr-results-summary">
                  Showing <strong>{filteredRequirements.length}</strong> of {requirements.length} requirements
                </div>
              </div>

              {isLoading ? (
                <div style={{ textAlign: 'center', padding: '80px 0', color: '#94a3b8' }}>
                  <FiRefreshCw className="animate-spin" size={28} style={{ margin: '0 auto 12px', display: 'block' }} />
                  Loading hiring requirements...
                </div>
              ) : isError ? (
                <div style={{ textAlign: 'center', padding: '60px 0', color: '#ef4444' }}>
                  Failed to load requirements. Please try again.
                </div>
              ) : filteredRequirements.length === 0 ? (
                <div style={{
                  background: '#ffffff',
                  borderRadius: 16,
                  border: '1px solid #e2e8f0',
                  padding: '60px 24px',
                  textAlign: 'center',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
                }}>
                  <div style={{
                    width: 64,
                    height: 64,
                    borderRadius: '50%',
                    background: '#f1f5f9',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 16px',
                    color: '#94a3b8'
                  }}>
                    <FiSearch size={28} />
                  </div>
                  <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', margin: '0 0 6px' }}>
                    No matching hiring requirements found
                  </h3>
                  <p style={{ fontSize: 14, color: '#64748b', maxWidth: 440, margin: '0 auto 20px' }}>
                    {searchName || activeFiltersCount > 0
                      ? 'Try clearing or modifying your filters to see more requirements.'
                      : 'Create your first hiring requirement to save search criteria, manage candidate pipelines, and turn on candidate alerts.'}
                  </p>
                  <button
                    onClick={() => {
                      if (activeFiltersCount > 0) clearAllFilters();
                      else setCreateModalOpen(true);
                    }}
                    className="rr-btn-primary"
                    style={{ margin: '0 auto' }}
                  >
                    {activeFiltersCount > 0 ? 'Clear Filters' : '+ Create Requirement'}
                  </button>
                </div>
              ) : (
                <div className="rr-cards-grid">
                  {filteredRequirements.map(req => {
                    const isClosed = req.status === 'closed';
                    const criteria = req.criteria || {};
                    const skills = criteria.skills || req.skills || [];
                    const locations = criteria.locations || req.locations || [];
                    const candidateCount = req.candidateCount || req.candidates?.length || 0;
                    const alerts = req.alerts || {};

                    return (
                      <div
                        key={req._id}
                        className="rr-card"
                        onClick={() => navigate(`/employer-dashboard/folders/${req._id}`)}
                      >
                        {/* Top row */}
                        <div className="rr-card-top">
                          <div style={{ display: 'flex', alignItems: 'flex-start', minWidth: 0, flex: 1 }}>
                            <div className="rr-card-avatar" style={{ background: req.color || '#002366' }}>
                              <FiBriefcase />
                            </div>
                            <div className="rr-card-head-info">
                              <h3
                                className="rr-card-title"
                                title={req.name}
                              >
                                {req.name}
                              </h3>
                              <p className="rr-card-role" title={req.jobTitle || criteria.jobTitle || 'Role'}>
                                {req.jobTitle || criteria.jobTitle || 'Target Requirement'}
                              </p>
                              <div className="rr-status-row">
                                <span className={`rr-pill-status ${isClosed ? 'rr-pill-closed' : 'rr-pill-open'}`}>
                                  {isClosed ? 'Closed' : 'Open'}
                                </span>
                                <span className="rr-pill-creator">
                                  {req.ownerName || (typeof req.createdBy === 'object' ? req.createdBy?.name : 'Company')}
                                </span>
                                {alerts.enabled !== false && (
                                  <span className="rr-pill-alert" title={`Alerts: ${alerts.frequency || 'Daily'}`}>
                                    <FiBell size={10} /> {alerts.frequency === 'WEEKLY' ? 'Weekly' : 'Daily'}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* 3 dots action menu */}
                          <div style={{ position: 'relative' }}>
                            <button
                              className="rr-dots-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveDropdown(activeDropdown === req._id ? null : req._id);
                              }}
                              title="More actions"
                            >
                              <FiMoreVertical size={18} />
                            </button>

                            {activeDropdown === req._id && (
                              <div
                                className="rr-menu-dropdown"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <button
                                  className="rr-menu-item"
                                  onClick={() => {
                                    handleRunSearch(req);
                                    setActiveDropdown(null);
                                  }}
                                >
                                  <FiPlay size={14} color="#002366" /> Run Search
                                </button>
                                <button
                                  className="rr-menu-item"
                                  onClick={() => {
                                    setEditingRequirement(req);
                                    setCreateModalOpen(true);
                                    setActiveDropdown(null);
                                  }}
                                >
                                  <FiEdit2 size={14} /> Edit Criteria
                                </button>
                                <button
                                  className="rr-menu-item"
                                  onClick={() => {
                                    setSelectedReqForAlert(req);
                                    setAlertModalOpen(true);
                                    setActiveDropdown(null);
                                  }}
                                >
                                  <FiBell size={14} /> Alert Settings
                                </button>
                                <button
                                  className="rr-menu-item"
                                  onClick={() => {
                                    setSelectedReqForShare(req);
                                    setShareModalOpen(true);
                                    setActiveDropdown(null);
                                  }}
                                >
                                  <FiShare2 size={14} /> Share with Team
                                </button>
                                <button
                                  className="rr-menu-item"
                                  onClick={() => handleToggleStatus(req)}
                                >
                                  <FiCheck size={14} /> {isClosed ? 'Reopen Requirement' : 'Close Requirement'}
                                </button>
                                <button
                                  className="rr-menu-item"
                                  onClick={() => handleDuplicate(req)}
                                >
                                  <FiCopy size={14} /> Duplicate
                                </button>
                                <div style={{ height: 1, background: '#f1f5f9', margin: '4px 0' }} />
                                <button
                                  className="rr-menu-item danger"
                                  onClick={() => {
                                    setFolderToDelete(req);
                                    setDeleteModalOpen(true);
                                    setActiveDropdown(null);
                                  }}
                                >
                                  <FiTrash2 size={14} /> Delete
                                </button>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Criteria Preview Bar */}
                        <div className="rr-card-criteria">
                          {skills.length > 0 && (
                            <div className="rr-criteria-line">
                              <span style={{ fontWeight: 700, color: '#64748b', fontSize: 11 }}>Skills:</span>
                              <div className="rr-skills-wrap">
                                {skills.slice(0, 3).map(s => (
                                  <span key={s} className="rr-skill-chip">{s}</span>
                                ))}
                                {skills.length > 3 && (
                                  <span className="rr-skill-chip" style={{ color: '#0284c7' }}>
                                    +{skills.length - 3}
                                  </span>
                                )}
                              </div>
                            </div>
                          )}

                          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', fontSize: 11, color: '#475569' }}>
                            {(criteria.experienceMin !== undefined || criteria.experienceMax !== undefined) && (
                              <span>
                                💼 {criteria.experienceMin || 0} - {criteria.experienceMax || 15} Yrs
                              </span>
                            )}
                            {(criteria.salaryMin !== undefined || criteria.salaryMax !== undefined) && (
                              <span>
                                💰 ₹{criteria.salaryMin || 0} - {criteria.salaryMax || 'Any'} LPA
                              </span>
                            )}
                            {locations.length > 0 && (
                              <span>
                                📍 {locations.slice(0, 2).join(', ')}{locations.length > 2 ? ` +${locations.length - 2}` : ''}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Candidate Funnel */}
                        <div className="rr-funnel-bar">
                          <div className="rr-funnel-item">
                            <span className="rr-funnel-count">{candidateCount}</span>
                            <span className="rr-funnel-tag">Total</span>
                          </div>
                          <div style={{ width: 1, height: 20, background: '#e2e8f0' }} />
                          <div className="rr-funnel-item">
                            <span className="rr-funnel-count" style={{ color: '#0284c7' }}>
                              {req.prospectCount ?? candidateCount}
                            </span>
                            <span className="rr-funnel-tag">Prospects</span>
                          </div>
                          <div style={{ width: 1, height: 20, background: '#e2e8f0' }} />
                          <div className="rr-funnel-item">
                            <span className="rr-funnel-count" style={{ color: '#059669' }}>
                              {req.shortlistedCount ?? 0}
                            </span>
                            <span className="rr-funnel-tag">Shortlisted</span>
                          </div>
                          <div style={{ width: 1, height: 20, background: '#e2e8f0' }} />
                          <div className="rr-funnel-item">
                            <span className="rr-funnel-count" style={{ color: '#dc2626' }}>
                              {req.rejectedCount ?? 0}
                            </span>
                            <span className="rr-funnel-tag">Rejected</span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="rr-card-actions">
                          <button
                            type="button"
                            className="rr-btn-run-search"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRunSearch(req);
                            }}
                            title="Execute saved search filters in Resdex"
                          >
                            <FiPlay size={14} /> Run Search
                          </button>
                          <button
                            type="button"
                            className="rr-btn-workspace"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/employer-dashboard/folders/${req._id}`);
                            }}
                          >
                            <FiFolder size={14} /> View
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </main>
          </div>
        </div>
      </div>

      {/* Create / Edit Modal */}
      <CreateRequirementModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setCreateModalOpen(false);
          setEditingRequirement(null);
        }}
        onSubmit={handleSaveRequirement}
        initialData={editingRequirement}
        currentUser={user}
      />

      {/* Fast Alert Toggle Modal */}
      <RequirementAlertModal
        isOpen={alertModalOpen}
        onClose={() => {
          setAlertModalOpen(false);
          setSelectedReqForAlert(null);
        }}
        requirement={selectedReqForAlert}
        onSaveAlerts={handleSaveAlerts}
        currentUser={user}
      />

      {/* Team Sharing Modal */}
      {shareModalOpen && selectedReqForShare && (
        <ShareFolderModal
          isOpen={shareModalOpen}
          onClose={() => {
            setShareModalOpen(false);
            setSelectedReqForShare(null);
          }}
          onShare={async (shareData) => {
            try {
              await updateFolder.mutateAsync({
                id: selectedReqForShare._id,
                sharedWith: shareData.users || [],
                isPublic: true
              });
              setShareModalOpen(false);
              refetch();
            } catch (err) {
              console.error('Failed to share requirement:', err);
            }
          }}
          selectedFolders={[selectedReqForShare]}
        />
      )}

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteModalOpen && folderToDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(15, 23, 42, 0.55)',
              backdropFilter: 'blur(4px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10005,
              padding: 20,
            }}
            onClick={() => setDeleteModalOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 10 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              onClick={(e) => e.stopPropagation()}
              style={{
                width: '100%',
                maxWidth: 420,
                background: '#fff',
                borderRadius: 18,
                boxShadow: '0 25px 60px rgba(15, 23, 42, 0.25)',
                overflow: 'hidden',
                padding: 24,
                textAlign: 'center'
              }}
            >
              <div style={{
                width: 52,
                height: 52,
                borderRadius: '50%',
                background: '#fee2e2',
                color: '#ef4444',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px'
              }}>
                <FiTrash2 size={24} />
              </div>
              <h3 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 800, color: '#0f172a' }}>
                Delete Requirement?
              </h3>
              <p style={{ margin: '0 0 24px', color: '#64748b', fontSize: 14 }}>
                Are you sure you want to delete <strong>"{folderToDelete.name}"</strong>? All saved criteria and candidate stage mappings will be removed.
              </p>
              <div style={{ display: 'flex', gap: 12 }}>
                <button
                  type="button"
                  onClick={() => setDeleteModalOpen(false)}
                  style={{
                    flex: 1,
                    padding: '11px',
                    background: '#f1f5f9',
                    color: '#475569',
                    border: 'none',
                    borderRadius: 8,
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmDelete}
                  style={{
                    flex: 1,
                    padding: '11px',
                    background: '#ef4444',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 8,
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Yes, Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </EmployerLayout>
  );
}