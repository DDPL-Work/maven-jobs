import { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
<<<<<<< Updated upstream
import { FiFilter, FiSearch, FiBriefcase, FiMoreVertical, FiClock, FiPlus, FiFolder, FiEdit2, FiCopy, FiTrash2, FiX } from 'react-icons/fi';
=======
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
  FiRefreshCw,
  FiChevronDown
} from 'react-icons/fi';
>>>>>>> Stashed changes
import { motion, AnimatePresence } from 'framer-motion';
import EmployerLayout from '../../../../components/employer/EmployerLayout';
import EmployerBreadcrumb from '../../../../components/employer/EmployerBreadcrumb';
import { useFolders, useCreateFolder, useDeleteFolder, useDuplicateFolder, useUpdateFolder } from '../../../../hooks/useFolderQueries';
import CreateFolderModal from '../../../../components/employer/CreateFolderModal';

const SCOPE_OPTIONS = [
  { value: 'me', label: 'Created By Me' },
  { value: 'anyone', label: 'All Company Requirements' }
];

function RrCustomScopeSelect({ value, onChange, isOpen, onToggle, onClose }) {
  const selectRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (selectRef.current && !selectRef.current.contains(e.target)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen, onClose]);

  const selectedOpt = SCOPE_OPTIONS.find(o => o.value === value) || SCOPE_OPTIONS[0];

  return (
    <div className="rr-custom-scope-wrap" ref={selectRef}>
      <button
        type="button"
        className={`rr-custom-scope-btn ${isOpen ? 'active' : ''}`}
        onClick={onToggle}
      >
        <span className="rr-custom-scope-text">{selectedOpt.label}</span>
        <FiChevronDown size={14} className={`rr-custom-scope-chevron ${isOpen ? 'rotate' : ''}`} />
      </button>
      {isOpen && (
        <div className="rr-custom-scope-menu">
          {SCOPE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              className={`rr-custom-scope-option ${value === opt.value ? 'selected' : ''}`}
              onClick={() => {
                onChange(opt.value);
                onClose();
              }}
            >
              <span>{opt.label}</span>
              {value === opt.value && <FiCheck size={14} className="rr-custom-scope-check" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ResdexRequirements() {
  const navigate = useNavigate();
  const [searchName, setSearchName] = useState('');
  const [filterBy, setFilterBy] = useState('me'); // 'me' or 'anyone'
  const [statusFilter, setStatusFilter] = useState({ open: true, closed: false });
  const [tagsFilter, setTagsFilter] = useState({ prospect: false, shortlisted: false, rejected: false });
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);
<<<<<<< Updated upstream
  const [editFolderData, setEditFolderData] = useState(null);
=======
  const [scopeDropdownOpen, setScopeDropdownOpen] = useState(null); // 'mobile' | 'desktop' | null

  // Alert Modal
  const [alertModalOpen, setAlertModalOpen] = useState(false);
  const [selectedReqForAlert, setSelectedReqForAlert] = useState(null);

  // Share Modal
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [selectedReqForShare, setSelectedReqForShare] = useState(null);

  // Delete Modal
>>>>>>> Stashed changes
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [folderToDelete, setFolderToDelete] = useState(null);

  const { data: requirements = [], isLoading, isError } = useFolders({ 
    limit: 100, 
    folderType: 'REQUIREMENT',
    ...(filterBy === 'anyone' ? { scope: 'company' } : {})
  });
  const createFolder = useCreateFolder();
  const deleteFolder = useDeleteFolder();
  const duplicateFolder = useDuplicateFolder();
  const updateFolder = useUpdateFolder();

  const filteredRequirements = useMemo(() => {
    return requirements.filter(req => {
      // Name filter
      if (searchName && !req.name.toLowerCase().includes(searchName.toLowerCase())) return false;

      // Status filter
      const isReqOpen = req.status !== 'closed'; // Default to open
      if (!statusFilter.open && isReqOpen) return false;
      if (!statusFilter.closed && !isReqOpen) return false;

      // Tags filter
      const hasSelectedTags = tagsFilter.prospect || tagsFilter.shortlisted || tagsFilter.rejected;
      if (hasSelectedTags) {
        const reqTags = req.tags || [];
        let hasMatch = false;
        if (tagsFilter.prospect && reqTags.includes('prospect')) hasMatch = true;
        if (tagsFilter.shortlisted && reqTags.includes('shortlisted')) hasMatch = true;
        if (tagsFilter.rejected && reqTags.includes('rejected')) hasMatch = true;
        if (!hasMatch) return false;
      }

      // Filter by (Created by me vs Anyone) is now fully handled by the backend via the 'scope' parameter.
      return true;
    });
  }, [requirements, searchName, filterBy, statusFilter, tagsFilter]);

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

  const handleCreateRequirement = async (data) => {
    try {
      if (editFolderData) {
        await updateFolder.mutateAsync({ id: editFolderData._id, ...data });
      } else {
        const res = await createFolder.mutateAsync({
          ...data,
          folderType: 'REQUIREMENT'
        });
        if (res.data?._id) {
          navigate(`/employer-dashboard/folders/${res.data._id}`);
        }
      }
      setCreateModalOpen(false);
      setEditFolderData(null);
    } catch (err) {
      console.error('Failed to create/update requirement:', err);
    }
  };

  const handleDelete = (req) => {
    setFolderToDelete(req);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (folderToDelete) {
      try {
        await deleteFolder.mutateAsync(folderToDelete._id);
        setDeleteModalOpen(false);
        setFolderToDelete(null);
      } catch (err) {
        console.error('Failed to delete:', err);
      }
    }
  };

  const handleDuplicate = async (req) => {
    try {
      await duplicateFolder.mutateAsync(req._id);
    } catch (err) {
      console.error('Failed to duplicate:', err);
    }
  };

  return (
<<<<<<< Updated upstream
    <EmployerLayout>
      <div style={{ background: '#f8fafc', minHeight: 'calc(100vh - 70px)' }}>
=======
    <EmployerLayout containerWidth={1240}>
      <div className="rr-page-wrapper">
>>>>>>> Stashed changes
        <EmployerBreadcrumb
          items={[
            { label: 'Dashboard', path: '/employer-dashboard' },
            { label: 'Resdex', path: '/resume-search' },
            { label: 'Resdex Requirements', path: null },
          ]}
        />
<<<<<<< Updated upstream
        
        <div style={{ maxWidth: 1400, margin: '0 auto', padding: '24px 32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, background: '#fff', padding: '16px 24px', borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', margin: 0 }}>Resdex Requirements</h1>
            <button 
              onClick={() => setCreateModalOpen(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 8,
                background: '#002366', color: '#fff', fontWeight: 600, fontSize: 14, border: 'none', cursor: 'pointer'
=======

        <div className="rr-container">
          {/* Header Card */}
          <div className="rr-header-card">
            <div className="rr-title-area">
              <h1>
                Resdex Requirements
                <span className="rr-title-badge">{requirements.length} Requirements</span>
              </h1>
              <p>
                Saved recruitment workspaces for specific hiring openings with search blueprints, candidates & email alerts.
              </p>
            </div>
            <button
              onClick={() => {
                setEditingRequirement(null);
                setCreateModalOpen(true);
>>>>>>> Stashed changes
              }}
            >
              <FiPlus size={16} /> Create Requirement
            </button>
          </div>

          <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
            {/* Sidebar Filters */}
            <div style={{ width: 280, background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', flexShrink: 0, padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
                <FiFilter color="#64748b" />
                <h3 style={{ fontSize: 15, fontWeight: 700, color: '#334155', margin: 0 }}>Filters</h3>
              </div>
<<<<<<< Updated upstream
              
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, paddingBottom: 16, borderBottom: '1px solid #f1f5f9' }}>
                <span style={{ fontSize: 13, color: '#0f172a', fontWeight: 600 }}>{activeFiltersCount} Filter applied</span>
                {activeFiltersCount > 0 && (
                  <button onClick={clearAllFilters} style={{ background: 'none', border: 'none', color: '#2563eb', fontSize: 13, cursor: 'pointer', fontWeight: 500 }}>
                    Clear all
=======
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
              type="button"
              className={`rr-mobile-filter-trigger ${activeFiltersCount > 0 ? 'is-active' : ''}`}
              onClick={() => setMobileDrawerOpen(true)}
            >
              <FiFilter size={15} />
              <span>Filter Requirements</span>
              {activeFiltersCount > 0 && (
                <span className="rr-mobile-filter-badge">{activeFiltersCount}</span>
              )}
            </button>

            <RrCustomScopeSelect
              value={filterBy}
              onChange={setFilterBy}
              isOpen={scopeDropdownOpen === 'mobile'}
              onToggle={() => setScopeDropdownOpen(prev => prev === 'mobile' ? null : 'mobile')}
              onClose={() => setScopeDropdownOpen(null)}
            />
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
                  <div className="rr-desktop-only-scope">
                    <RrCustomScopeSelect
                      value={filterBy}
                      onChange={setFilterBy}
                      isOpen={scopeDropdownOpen === 'desktop'}
                      onToggle={() => setScopeDropdownOpen(prev => prev === 'desktop' ? null : 'desktop')}
                      onClose={() => setScopeDropdownOpen(null)}
                    />
                  </div>
                  <button
                    onClick={() => refetch()}
                    title="Refresh list"
                    className="rr-refresh-btn"
                  >
                    <FiRefreshCw size={14} /> Refresh
>>>>>>> Stashed changes
                  </button>
                )}
              </div>

              {/* Filter by name */}
              <div style={{ marginBottom: 24 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 8 }}>Filter by name</label>
                <div style={{ position: 'relative' }}>
                  <FiSearch style={{ position: 'absolute', left: 12, top: 10, color: '#94a3b8' }} />
                  <input
                    type="text"
                    placeholder="Filter on Requirement name"
                    value={searchName}
                    onChange={(e) => setSearchName(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px 9px 36px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13, outline: 'none' }}
                  />
                </div>
              </div>

              {/* Status */}
              <div style={{ marginBottom: 24 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 12 }}>Status</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#475569', cursor: 'pointer' }}>
                    <input type="checkbox" checked={statusFilter.open} onChange={(e) => setStatusFilter({...statusFilter, open: e.target.checked})} style={{ width: 16, height: 16, accentColor: '#2563eb' }} />
                    open
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#475569', cursor: 'pointer' }}>
                    <input type="checkbox" checked={statusFilter.closed} onChange={(e) => setStatusFilter({...statusFilter, closed: e.target.checked})} style={{ width: 16, height: 16, accentColor: '#2563eb' }} />
                    closed
                  </label>
                </div>
              </div>

              {/* Tags */}
              <div style={{ marginBottom: 24 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 12 }}>Tags</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#475569', cursor: 'pointer' }}>
                    <input type="checkbox" checked={tagsFilter.prospect} onChange={(e) => setTagsFilter({...tagsFilter, prospect: e.target.checked})} style={{ width: 16, height: 16, accentColor: '#2563eb' }} />
                    prospect
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#475569', cursor: 'pointer' }}>
                    <input type="checkbox" checked={tagsFilter.shortlisted} onChange={(e) => setTagsFilter({...tagsFilter, shortlisted: e.target.checked})} style={{ width: 16, height: 16, accentColor: '#2563eb' }} />
                    shortlisted
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#475569', cursor: 'pointer' }}>
                    <input type="checkbox" checked={tagsFilter.rejected} onChange={(e) => setTagsFilter({...tagsFilter, rejected: e.target.checked})} style={{ width: 16, height: 16, accentColor: '#2563eb' }} />
                    rejected
                  </label>
                </div>
              </div>

              <button style={{ width: '100%', padding: '10px 0', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                Refine search
              </button>
            </div>

            {/* Main Content Area */}
            <div style={{ flex: 1 }}>
              <div style={{ marginBottom: 16 }}>
                <select
                  value={filterBy}
                  onChange={(e) => setFilterBy(e.target.value)}
                  style={{
                    padding: '8px 32px 8px 16px', borderRadius: 6, border: '1px solid #cbd5e1', background: '#fff',
                    fontSize: 14, color: '#334155', fontWeight: 500, outline: 'none', cursor: 'pointer', appearance: 'none',
                    backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%2394a3b8%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")',
                    backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', backgroundSize: '10px'
                  }}
                >
                  <option value="me">Created By Me</option>
                  <option value="anyone">Created By Anyone</option>
                </select>
              </div>

              {isLoading ? (
                <div style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8' }}>Loading requirements...</div>
              ) : isError ? (
                <div style={{ textAlign: 'center', padding: '60px 0', color: '#ef4444' }}>Error loading requirements.</div>
              ) : filteredRequirements.length === 0 ? (
                <div style={{
                  background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center', minHeight: 400, padding: 40, textAlign: 'center'
                }}>
                  <div style={{ width: 240, height: 180, marginBottom: 24, position: 'relative' }}>
                    {/* Placeholder illustration */}
                    <div style={{ width: 140, height: 140, background: '#fef3c7', borderRadius: '50%', position: 'absolute', top: 20, left: 50, zIndex: 0 }} />
                    <div style={{ width: 200, height: 120, background: '#f1f5f9', borderRadius: 12, border: '2px solid #e2e8f0', position: 'absolute', bottom: 20, left: 20, zIndex: 1 }} />
                    <div style={{ width: 180, height: 100, background: '#fff', borderRadius: 12, border: '2px solid #e2e8f0', position: 'absolute', bottom: 10, left: 30, zIndex: 2, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} />
                    <FiSearch size={48} color="#94a3b8" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 3 }} />
                  </div>
                  <h2 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', marginBottom: 12 }}>No hiring requirement found</h2>
                  <p style={{ fontSize: 15, color: '#64748b', margin: 0 }}>Try relaxing your criterias by modifying filters</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
                  {filteredRequirements.map(req => (
                    <div key={req._id} style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: 20, display: 'flex', flexDirection: 'column', transition: 'all 0.2s', cursor: 'pointer' }}
                         onClick={() => navigate(`/employer-dashboard/folders/${req._id}`)}
                         onMouseEnter={e => e.currentTarget.style.boxShadow = '0 10px 25px -5px rgba(0,0,0,0.1)'}
                         onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div style={{ width: 40, height: 40, borderRadius: 8, background: req.color || '#002366', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                            <FiBriefcase size={20} />
                          </div>
                          <div>
                            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', margin: '0 0 4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 180 }}>{req.name}</h3>
                            <div style={{ display: 'flex', gap: 6 }}>
                              <span style={{ fontSize: 12, color: req.status === 'closed' ? '#ef4444' : '#64748b', background: req.status === 'closed' ? '#fee2e2' : '#f1f5f9', padding: '2px 8px', borderRadius: 12, fontWeight: 500 }}>
                                {req.status === 'closed' ? 'Closed' : 'Open'}
                              </span>
                              {req.tags && req.tags.map(tag => (
                                <span key={tag} style={{ fontSize: 12, color: '#0284c7', background: '#e0f2fe', padding: '2px 8px', borderRadius: 12, fontWeight: 500, textTransform: 'capitalize' }}>
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                        <div style={{ position: 'relative' }}>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveDropdown(activeDropdown === req._id ? null : req._id);
                            }}
                            style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 4 }}
                          >
                            <FiMoreVertical size={18} />
                          </button>
                          {activeDropdown === req._id && (
                            <div 
                              style={{
                                position: 'absolute', top: '100%', right: 0, marginTop: 4, 
                                background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, 
                                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', zIndex: 10, width: 140, overflow: 'hidden'
                              }}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button 
                                onClick={() => { setEditFolderData(req); setCreateModalOpen(true); setActiveDropdown(null); }}
                                style={{ width: '100%', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 8, border: 'none', background: 'none', color: '#334155', cursor: 'pointer', fontSize: 13, fontWeight: 500, textAlign: 'left' }}
                              >
                                <FiEdit2 size={14} /> Rename
                              </button>
                              <button 
                                onClick={() => { handleDuplicate(req); setActiveDropdown(null); }}
                                style={{ width: '100%', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 8, border: 'none', background: 'none', color: '#334155', cursor: 'pointer', fontSize: 13, fontWeight: 500, textAlign: 'left' }}
                              >
                                <FiCopy size={14} /> Duplicate
                              </button>
                              <div style={{ height: 1, background: '#f1f5f9' }} />
                              <button 
                                onClick={() => { handleDelete(req); setActiveDropdown(null); }}
                                style={{ width: '100%', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 8, border: 'none', background: 'none', color: '#ef4444', cursor: 'pointer', fontSize: 13, fontWeight: 500, textAlign: 'left' }}
                              >
                                <FiTrash2 size={14} /> Delete
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                      <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #f1f5f9', paddingTop: 16 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#64748b', fontSize: 13 }}>
                          <FiFolder size={14} /> <strong>{req.candidateCount || 0}</strong> candidates
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#94a3b8', fontSize: 12 }}>
                          <FiClock size={12} /> {new Date(req.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      <CreateFolderModal 
        isOpen={isCreateModalOpen} 
        onClose={() => { setCreateModalOpen(false); setEditFolderData(null); }}
        onSubmit={handleCreateRequirement}
        initialData={editFolderData}
      />

      <AnimatePresence>
        {deleteModalOpen && folderToDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(15, 23, 42, 0.45)",
              backdropFilter: "blur(4px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 9999,
              padding: 20,
            }}
            onClick={() => setDeleteModalOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 10 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              onClick={(e) => e.stopPropagation()}
              style={{
                width: "100%",
                maxWidth: 400,
                background: "#fff",
                borderRadius: 18,
                boxShadow: "0 24px 60px rgba(15, 23, 42, 0.20)",
                overflow: "hidden",
                padding: 24,
                textAlign: 'center'
              }}
            >
              <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#fee2e2', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <FiTrash2 size={24} />
              </div>
              <h3 style={{ margin: '0 0 8px', fontSize: 18, color: '#0f172a' }}>Delete Requirement?</h3>
              <p style={{ margin: '0 0 24px', color: '#64748b', fontSize: 14 }}>
                Are you sure you want to delete "{folderToDelete.name}"? This action cannot be undone.
              </p>
              <div style={{ display: 'flex', gap: 12 }}>
                <button
                  onClick={() => setDeleteModalOpen(false)}
                  style={{ flex: 1, padding: '10px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  style={{ flex: 1, padding: '10px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </EmployerLayout>
  );
}
