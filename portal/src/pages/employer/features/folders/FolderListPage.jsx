import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams, useLocation, useParams } from 'react-router-dom';
import {
  FiFolder, FiPlus, FiTrash2, FiShare2, FiChevronDown,
  FiSliders, FiCheck, FiX, FiCalendar, FiChevronLeft, FiChevronRight,
  FiChevronsLeft, FiChevronsRight, FiUsers, FiFileText
} from 'react-icons/fi';
import EmployerLayout from '../../../../components/employer/EmployerLayout';
import EmployerBreadcrumb from '../../../../components/employer/EmployerBreadcrumb';
import CreateFolderModal from '../../../../components/employer/CreateFolderModal';
import ShareFolderModal from '../../../../components/employer/ShareFolderModal';
import {
  useFolders, useCreateFolder, useUpdateFolder, useDeleteFolder, useDuplicateFolder
} from '../../../../hooks/useFolderQueries';
import { useEmployerAuth } from '../../../../hooks/useEmployerAuth';
import authService from '../../../../services/authService';
import CandidateCard from '../../../../components/employer/CandidateCard';
import './FolderListPage.css';

const TABS = [
  { id: 'my-folders', label: 'My folders', icon: FiFolder },
  { id: 'shared-with-me', label: 'Folders shared with me', icon: FiShare2 },
  { id: 'contacted-candidates', label: 'Contacted candidates', icon: FiUsers },
  { id: 'cv-shared-with-me', label: 'CV shared with me', icon: FiFileText },
];

const DATE_FILTERS = [
  { id: 'all', label: 'All time' },
  { id: 'last-7', label: 'Last 7 days' },
  { id: 'last-14', label: 'Last 14 days' },
  { id: 'last-30', label: 'Last 30 days' },
  { id: 'custom', label: 'Custom date range' },
];

const FOLDER_SORT_OPTIONS = [
  { value: 'created', label: 'Created date' },
  { value: 'recent', label: 'Recently Updated' },
  { value: 'name', label: 'Alphabetical' },
  { value: 'candidates', label: 'Candidate count' },
];

const SHARED_SORT_OPTIONS = [
  { value: 'created', label: 'Created date' },
  { value: 'recent', label: 'Recently Updated' },
  { value: 'name', label: 'Alphabetical' },
];

const PAGE_SIZE_OPTIONS = [
  { value: 20, label: '20' },
  { value: 40, label: '40' },
  { value: 60, label: '60' },
  { value: 100, label: '100' },
];

const CONTACTED_SORT_OPTIONS = [
  { value: 'Date', label: 'Date' },
  { value: 'Name', label: 'Name' },
  { value: 'Count', label: 'Candidate count' },
];

function FlpCustomSelect({ value, options, onChange, activeDropdown, setActiveDropdown, dropdownId, prefix = '', style = {} }) {
  const isOpen = activeDropdown === dropdownId;
  const currentOption = options.find(o => String(o.value) === String(value)) || options[0];

  return (
    <div className="flp-custom-select-wrapper" style={style}>
      <button
        type="button"
        className={`flp-custom-select-btn ${isOpen ? 'open' : ''}`}
        onClick={(e) => {
          e.stopPropagation();
          setActiveDropdown(isOpen ? null : dropdownId);
        }}
      >
        <span className="flp-custom-select-text">
          {prefix && <span className="flp-custom-select-prefix">{prefix} </span>}
          {currentOption.label}
        </span>
        <FiChevronDown size={13} className={`flp-custom-select-chevron ${isOpen ? 'rotate' : ''}`} />
      </button>

      {isOpen && (
        <div className="flp-custom-select-menu" onClick={(e) => e.stopPropagation()}>
          {options.map((opt) => {
            const isSelected = String(opt.value) === String(value);
            return (
              <button
                key={String(opt.value)}
                type="button"
                className={`flp-custom-select-option ${isSelected ? 'active' : ''}`}
                onClick={() => {
                  onChange(opt.value);
                  setActiveDropdown(null);
                }}
              >
                <span>{opt.label}</span>
                {isSelected && <FiCheck size={13} className="flp-custom-select-check" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function FolderListPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const { tab: pathTab } = useParams();

  // Custom Dropdown State for Mobile/Tablet
  const [mobileTabDropdownOpen, setMobileTabDropdownOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const mobileTabDropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (mobileTabDropdownRef.current && !mobileTabDropdownRef.current.contains(e.target)) {
        setMobileTabDropdownOpen(false);
      }
      setActiveDropdown(null);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  // Active Tab determination from path param (/manage-folders/:tab) or query param (?tab=xyz or ?xyz)
  const activeTab = useMemo(() => {
    if (pathTab && TABS.some(t => t.id === pathTab)) return pathTab;

    const tabParam = searchParams.get('tab');
    if (tabParam && TABS.some(t => t.id === tabParam)) return tabParam;

    const rawQuery = location.search.replace(/^\?/, '').split('&')[0];
    if (rawQuery && TABS.some(t => t.id === rawQuery)) return rawQuery;

    return 'my-folders';
  }, [pathTab, searchParams, location.search]);

  const handleTabChange = (tabId) => {
    setSearchParams({ tab: tabId });
    setSelectedFolderIds([]);
  };

  // Left Sidebar Filters
  const [dateFilter, setDateFilter] = useState('all');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');

  // Pagination & Sorting
  const [pageSize, setPageSize] = useState(40);
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState('created');
  const [contactedSortBy, setContactedSortBy] = useState('Date');
  const [goToPage, setGoToPage] = useState('1');

  // Selection
  const [selectedFolderIds, setSelectedFolderIds] = useState([]);

  // Modals & Notifications
  const [showCreate, setShowCreate] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [renameData, setRenameData] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const showToast = useCallback((msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  }, []);

  // Fetch backend custom folders
  const { session } = useEmployerAuth();
  
  const params = useMemo(() => {
    return { sort: sortBy, page, limit: pageSize };
  }, [sortBy, page, pageSize]);

  const { data: serverFolders = [], refetch } = useFolders(params);
  const createFolder = useCreateFolder();
  const updateFolder = useUpdateFolder();
  const deleteFolder = useDeleteFolder();
  const duplicateFolder = useDuplicateFolder();

  // Fetch Shared CVs
  const [sharedCVs, setSharedCVs] = useState([]);
  const [sharedCVsLoading, setSharedCVsLoading] = useState(false);

  useEffect(() => {
    if (activeTab === 'cv-shared-with-me') {
      setSharedCVsLoading(true);
      authService.getSharedCVs()
        .then(res => {
          if (res && res.data) {
            setSharedCVs(res.data);
          }
        })
        .catch(err => console.error("Error fetching shared CVs:", err))
        .finally(() => setSharedCVsLoading(false));
    }
  }, [activeTab]);

  // Filter server folders dynamically based on date filter (My Folders only)
  const filteredFolders = useMemo(() => {
    let list = Array.isArray(serverFolders) ? serverFolders.filter(f => f.employerId === session?.id) : [];
    const now = new Date();

    if (dateFilter === 'last-7') {
      const cut = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      list = list.filter(f => new Date(f.createdAt || f.updatedAt) >= cut);
    } else if (dateFilter === 'last-14') {
      const cut = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
      list = list.filter(f => new Date(f.createdAt || f.updatedAt) >= cut);
    } else if (dateFilter === 'last-30') {
      const cut = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      list = list.filter(f => new Date(f.createdAt || f.updatedAt) >= cut);
    } else if (dateFilter === 'custom' && customFrom && customTo) {
      const from = new Date(customFrom);
      const to = new Date(customTo);
      to.setHours(23, 59, 59, 999);
      list = list.filter(f => {
        const d = new Date(f.createdAt || f.updatedAt);
        return d >= from && d <= to;
      });
    }

    return list;
  }, [serverFolders, dateFilter, customFrom, customTo]);

  // Selected folder objects for sharing
  const selectedFolderObjects = useMemo(() => {
    return filteredFolders.filter((f) => selectedFolderIds.includes(f._id));
  }, [filteredFolders, selectedFolderIds]);

  // Shared folders dynamically filtered
  const sharedFolders = useMemo(() => {
    return (serverFolders || []).filter(
      f => f.employerId !== session?.id
    );
  }, [serverFolders, session]);

  // Contacted candidates folders dynamically sorted
  const contactedFolders = useMemo(() => {
    let list = Array.isArray(serverFolders) ? serverFolders.filter(f => (f.contactedCount || 0) > 0) : [];
    if (contactedSortBy === 'Date') {
      list.sort((a, b) => new Date(b.lastActivityAt || b.updatedAt || b.createdAt) - new Date(a.lastActivityAt || a.updatedAt || a.createdAt));
    } else if (contactedSortBy === 'Name') {
      list.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    } else if (contactedSortBy === 'Count') {
      list.sort((a, b) => (b.candidateCount || 0) - (a.candidateCount || 0));
    }
    return list;
  }, [serverFolders, contactedSortBy]);

  // Select all handler for My Folders
  const isAllSelected = useMemo(() => {
    return filteredFolders.length > 0 && selectedFolderIds.length === filteredFolders.length;
  }, [filteredFolders, selectedFolderIds]);

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedFolderIds([]);
    } else {
      setSelectedFolderIds(filteredFolders.map(f => f._id));
    }
  };

  const handleToggleFolder = (folderId) => {
    setSelectedFolderIds(prev =>
      prev.includes(folderId) ? prev.filter(id => id !== folderId) : [...prev, folderId]
    );
  };

  // Delete selected folders
  const handleDeleteSelected = () => {
    if (selectedFolderIds.length === 0) {
      showToast('Please select at least one folder to delete.');
      return;
    }
    setShowDeleteConfirm(true);
  };

  const confirmDeleteFolders = async () => {
    try {
      for (const id of selectedFolderIds) {
        await deleteFolder.mutateAsync(id);
      }
      setSelectedFolderIds([]);
      setShowDeleteConfirm(false);
      refetch();
      showToast('Selected folder(s) deleted successfully.');
    } catch {
      showToast('Failed to delete some folders.');
    }
  };

  // Share selected folders - opens the ShareFolderModal
  const handleShareSelected = () => {
    if (selectedFolderIds.length === 0) {
      showToast('Please select at least one folder to share.');
      return;
    }
    setShowShareModal(true);
  };

  const handleConfirmShare = async ({ userEmails, folders }) => {
    try {
      for (const f of folders) {
        const existing = Array.isArray(f.sharedWith) ? f.sharedWith : [];
        const merged = Array.from(new Set([...existing, ...userEmails]));
        await updateFolder.mutateAsync({
          id: f._id,
          sharedWith: merged,
          isPublic: true,
        });
      }
      setShowShareModal(false);
      setSelectedFolderIds([]);
      refetch();
      showToast(
        `Folder${folders.length > 1 ? 's' : ''} shared with ${userEmails.length} user${userEmails.length > 1 ? 's' : ''} successfully!`
      );
    } catch {
      showToast('Failed to share folder(s).');
    }
  };

  // Create folder submit
  const handleCreateSubmit = async (data) => {
    try {
      await createFolder.mutateAsync(data);
      setShowCreate(false);
      refetch();
      showToast(`Folder "${data.name}" created successfully!`);
    } catch (e) {
      showToast(e?.message || 'Error creating folder');
    }
  };

  const [mobileFilterExpanded, setMobileFilterExpanded] = useState(false);

  return (
    <EmployerLayout containerWidth={1240}>
      <div className="flp-root">
        {/* Toast Notification */}
        {toastMessage && (
          <div className="flp-toast">
            <span>{toastMessage}</span>
            <button type="button" onClick={() => setToastMessage(null)} className="flp-toast-close">
              <FiX size={15} />
            </button>
          </div>
        )}

        <div className="flp-container">
          <EmployerBreadcrumb items={[
            { label: 'Employer Dashboard', path: '/employer-dashboard' },
            { label: 'Manage Folders' },
          ]} />

          {/* Header row: Manage Folders & Create folder button */}
          <div className="flp-header">
            <div className="flp-header-left">
              <h1 className="flp-title">Manage Folders</h1>
            </div>
            
            <div className="flp-header-right">
              {/* Top Pagination Controls - Desktop only */}
              <div className="flp-top-pagination">
                <span>Show</span>
                <select
                  className="flp-page-size-select"
                  value={pageSize}
                  onChange={(e) => setPageSize(Number(e.target.value))}
                >
                  <option value={20}>20</option>
                  <option value={40}>40</option>
                  <option value={60}>60</option>
                  <option value={100}>100</option>
                </select>

                <button type="button" className="flp-nav-arrow" disabled title="First page">
                  &laquo;
                </button>
                <button type="button" className="flp-nav-arrow" disabled title="Previous page">
                  &lsaquo;
                </button>
                <div className="flp-page-badge">
                  Page 1 of 1
                </div>
                <button type="button" className="flp-nav-arrow" disabled title="Next page">
                  &rsaquo;
                </button>
                <button type="button" className="flp-nav-arrow" disabled title="Last page">
                  &raquo;
                </button>
              </div>

              <button
                type="button"
                className="flp-create-folder-btn"
                onClick={() => setShowCreate(true)}
              >
                <FiPlus size={16} />
                <span>Create folder</span>
              </button>
            </div>
          </div>

          {/* Main layout (full-width when on Contacted candidates tab) */}
          <div className={`flp-layout ${activeTab === 'contacted-candidates' ? 'flp-layout-full' : ''}`}>
            {/* ─────────────────────────────────────────────────────────────
                Left Column: Filters Sidebar (Hidden on Contacted candidates tab)
               ───────────────────────────────────────────────────────────── */}
            {activeTab !== 'contacted-candidates' && (
<<<<<<< Updated upstream
              <aside className="flp-sidebar">
                <div className="flp-sidebar-header">
                  <FiSliders size={17} color="#64748b" />
                  <span>Filters</span>
=======
              <aside className={`flp-sidebar ${mobileFilterExpanded ? 'flp-sidebar--open' : ''}`}>
                <div
                  className="flp-sidebar-header"
                  onClick={() => setMobileFilterExpanded(p => !p)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && setMobileFilterExpanded(p => !p)}
                >
                  <div className="flp-sidebar-header-left">
                    <FiSliders size={16} className="flp-filter-icon" />
                    <span className="flp-filter-title-text">Date Filter</span>
                    {isFilterActive && (
                      <span className="flp-filter-active-badge">1</span>
                    )}
                  </div>
                  <div className="flp-sidebar-header-right">
                    {isFilterActive && (
                      <button
                        type="button"
                        className="flp-clear-filters-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleClearFilters();
                        }}
                        title="Clear all filters"
                      >
                        <FiX size={12} />
                        <span>Clear</span>
                      </button>
                    )}
                    <span className="flp-sidebar-chevron">
                      <FiChevronDown size={16} style={{ transform: mobileFilterExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }} />
                    </span>
                  </div>
>>>>>>> Stashed changes
                </div>

                <div className="flp-sidebar-body">
                  <div className="flp-filter-section">
                    <div className="flp-filter-label">Created date</div>
                    <div className="flp-filter-group">
                      {DATE_FILTERS.map((f) => (
                        <label key={f.id} className="flp-radio-label">
                          <input
                            type="radio"
                            name="dateFilter"
                            value={f.id}
                            checked={dateFilter === f.id}
                            onChange={() => setDateFilter(f.id)}
                          />
                          <span className="flp-radio-custom" />
                          <span className="flp-radio-text">{f.label}</span>
                        </label>
                      ))}
                    </div>

                    {/* Custom Date Range Inputs */}
                    {dateFilter === 'custom' && (
                      <div className="flp-custom-date-inputs">
                        <div className="flp-date-field">
                          <span>From:</span>
                          <input
                            type="date"
                            value={customFrom}
                            onChange={(e) => setCustomFrom(e.target.value)}
                            className="flp-date-input"
                          />
                        </div>
                        <div className="flp-date-field">
                          <span>To:</span>
                          <input
                            type="date"
                            value={customTo}
                            onChange={(e) => setCustomTo(e.target.value)}
                            className="flp-date-input"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </aside>
            )}

            {/* ─────────────────────────────────────────────────────────────
                Right Column: Main Tabs and Folder Contents
               ───────────────────────────────────────────────────────────── */}
            <main className="flp-main-content">
              {/* Tabs Navigation (Desktop tabs + Tablet/Mobile Dropdown) */}
              <div className="flp-tabs-container">
                {/* Desktop Tabs Strip */}
                <div className="flp-tabs-header-desktop">
                  <div className="flp-tabs-list">
                    {TABS.map((tab) => {
                      const TabIcon = tab.icon;
                      return (
                        <button
                          key={tab.id}
                          type="button"
                          className={`flp-tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                          onClick={() => handleTabChange(tab.id)}
                        >
                          {TabIcon && <TabIcon size={15} style={{ marginRight: 6 }} />}
                          <span>{tab.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Mobile & Tablet Professional Custom Dropdown Selector */}
                <div className="flp-tabs-header-mobile">
                  <div className="flp-custom-dropdown-container" ref={mobileTabDropdownRef}>
                    <button
                      type="button"
                      className={`flp-custom-dropdown-trigger ${mobileTabDropdownOpen ? 'open' : ''}`}
                      onClick={() => setMobileTabDropdownOpen(prev => !prev)}
                      aria-expanded={mobileTabDropdownOpen}
                    >
                      <div className="flp-custom-dropdown-selected">
                        {(() => {
                          const currentTab = TABS.find(t => t.id === activeTab) || TABS[0];
                          const Icon = currentTab.icon;
                          return (
                            <>
                              <div className="flp-custom-dropdown-icon">
                                {Icon && <Icon size={14} />}
                              </div>
                              <span className="flp-custom-dropdown-title">{currentTab.label}</span>
                            </>
                          );
                        })()}
                      </div>
                      <div className="flp-custom-dropdown-right">
                        <span className="flp-custom-dropdown-count-badge">
                          {activeTab === 'my-folders' && `${filteredFolders.length} Folders`}
                          {activeTab === 'shared-with-me' && `${sharedFolders.length} Folders`}
                          {activeTab === 'contacted-candidates' && `${contactedFolders.length} Folders`}
                          {activeTab === 'cv-shared-with-me' && `${sharedCVs.length} CVs`}
                        </span>
                        <FiChevronDown
                          size={15}
                          className={`flp-custom-dropdown-chevron ${mobileTabDropdownOpen ? 'rotate' : ''}`}
                        />
                      </div>
                    </button>

                    {mobileTabDropdownOpen && (
                      <div className="flp-custom-dropdown-menu">
                        {TABS.map((tab) => {
                          const Icon = tab.icon;
                          const isSelected = activeTab === tab.id;
                          let count = 0;
                          if (tab.id === 'my-folders') count = filteredFolders.length;
                          else if (tab.id === 'shared-with-me') count = sharedFolders.length;
                          else if (tab.id === 'contacted-candidates') count = contactedFolders.length;
                          else if (tab.id === 'cv-shared-with-me') count = sharedCVs.length;

                          return (
                            <button
                              key={tab.id}
                              type="button"
                              className={`flp-custom-dropdown-item ${isSelected ? 'active' : ''}`}
                              onClick={() => {
                                handleTabChange(tab.id);
                                setMobileTabDropdownOpen(false);
                              }}
                            >
                              <div className="flp-custom-item-left">
                                <div className={`flp-custom-item-icon ${isSelected ? 'active' : ''}`}>
                                  {Icon && <Icon size={14} />}
                                </div>
                                <span className="flp-custom-item-text">{tab.label}</span>
                              </div>
                              <div className="flp-custom-item-right">
                                <span className="flp-custom-item-count">
                                  {tab.id === 'cv-shared-with-me' ? `${count} CVs` : `${count}`}
                                </span>
                                {isSelected && <FiCheck size={14} className="flp-custom-item-check" />}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* ─────────────────────────────────────────────────────────────
                  TAB 1: My folders
                 ───────────────────────────────────────────────────────────── */}
              {activeTab === 'my-folders' && (
                <div className="flp-tab-panel">
                  {/* Action Toolbar */}
                  <div className="flp-actions-toolbar">
                    <div className="flp-toolbar-left">
                      <label className="flp-checkbox-label">
                        <input
                          type="checkbox"
                          checked={isAllSelected}
                          onChange={handleToggleSelectAll}
                        />
                        <span>Select all</span>
                      </label>

                      <button
                        type="button"
                        className={`flp-tool-btn ${selectedFolderIds.length === 0 ? 'disabled' : ''}`}
                        onClick={handleDeleteSelected}
                      >
                        <FiTrash2 size={15} />
                        <span>Delete</span>
                      </button>

                      <button
                        type="button"
                        className={`flp-tool-btn ${selectedFolderIds.length === 0 ? 'disabled' : ''}`}
                        onClick={handleShareSelected}
                      >
                        <FiShare2 size={15} />
                        <span>Share</span>
                      </button>
                    </div>

                    <div className="flp-toolbar-right">
                      <span>Sort by:</span>
                      <FlpCustomSelect
                        value={sortBy}
                        options={FOLDER_SORT_OPTIONS}
                        onChange={setSortBy}
                        activeDropdown={activeDropdown}
                        setActiveDropdown={setActiveDropdown}
                        dropdownId="my-folders-sort"
                      />
                    </div>
                  </div>

                  {/* Folders List Row Cards */}
                  {filteredFolders.length > 0 ? (
                    <div className="flp-folders-list">
                      {filteredFolders.map((folder) => {
                        const isSelected = selectedFolderIds.includes(folder._id);
                        return (
                          <div key={folder._id} className="flp-folder-row-card">
                            <div className="flp-folder-row-left">
                              <input
                                type="checkbox"
                                className="flp-folder-checkbox"
                                checked={isSelected}
                                onChange={() => handleToggleFolder(folder._id)}
                              />
                              <span
                                className="flp-folder-name"
                                onClick={() => navigate(`/employer-dashboard/folders/${folder._id}`)}
                              >
                                {folder.name}
                              </span>
                              {folder.isPublic && (
                                <span className="flp-default-badge" style={{ background: '#ecfdf5', color: '#059669' }}>
                                  Public
                                </span>
                              )}
                            </div>

                            <div className="flp-folder-row-right">
                              <span className="flp-candidates-count">
                                {folder.candidateCount || 0} Candidates
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="flp-empty-folders-state">
                      <FiFolder size={40} color="#94a3b8" />
                      <p style={{ margin: 0, fontWeight: 600, color: '#475569' }}>No folders found</p>
                      <p style={{ margin: 0, fontSize: 13, color: '#94a3b8' }}>Create your first folder to organize candidates.</p>
                      <button type="button" className="flp-create-folder-btn" onClick={() => setShowCreate(true)} style={{ marginTop: 8 }}>
                        Create folder
                      </button>
                    </div>
                  )}

                  {/* Bottom Pagination */}
                  <div className="flp-bottom-pagination">
                    <span>Show</span>
                    <FlpCustomSelect
                      value={pageSize}
                      options={PAGE_SIZE_OPTIONS}
                      onChange={(val) => setPageSize(Number(val))}
                      activeDropdown={activeDropdown}
                      setActiveDropdown={setActiveDropdown}
                      dropdownId="my-folders-page-size"
                    />

                    <button type="button" className="flp-nav-arrow" disabled title="First page">
                      &laquo;
                    </button>
                    <button type="button" className="flp-nav-arrow" disabled title="Previous page">
                      &lsaquo;
                    </button>
                    <div className="flp-page-badge">
                      Page 1 of 1
                    </div>
                    <button type="button" className="flp-nav-arrow" disabled title="Next page">
                      &rsaquo;
                    </button>
                    <button type="button" className="flp-nav-arrow" disabled title="Last page">
                      &raquo;
                    </button>
                  </div>
                </div>
              )}

              {/* ─────────────────────────────────────────────────────────────
                  TAB 2: Folders shared with me
                 ───────────────────────────────────────────────────────────── */}
              {activeTab === 'shared-with-me' && (
                <div className="flp-tab-panel">
                  {/* Action Toolbar */}
                  <div className="flp-actions-toolbar" style={{ justifyContent: 'flex-end' }}>
                    <div className="flp-toolbar-right">
                      <span>Sort by:</span>
                      <FlpCustomSelect
                        value={sortBy}
                        options={SHARED_SORT_OPTIONS}
                        onChange={setSortBy}
                        activeDropdown={activeDropdown}
                        setActiveDropdown={setActiveDropdown}
                        dropdownId="shared-sort"
                      />
                    </div>
                  </div>

                  {sharedFolders.length > 0 ? (
                    <div className="flp-folders-list">
                      {sharedFolders.map((folder) => (
                        <div key={folder._id} className="flp-folder-row-card">
                          <div className="flp-folder-row-left">
                            <span
                              className="flp-folder-name"
                              onClick={() => navigate(`/employer-dashboard/folders/${folder._id}`)}
                            >
                              {folder.name}
                            </span>
                            <span className="flp-default-badge" style={{ background: '#f0fdf4', color: '#16a34a' }}>
                              Shared
                            </span>
                          </div>

                          <div className="flp-folder-row-right">
                            <span className="flp-candidates-count">
                              {folder.candidateCount || 0} Candidates
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    /* Empty State Card per Screenshot 2 */
                    <div className="flp-shared-empty-card">
                      {/* SVG Illustration: Person sitting thoughtfully, plant, fence & cat */}
                      <svg width="280" height="200" viewBox="0 0 280 200" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ margin: '0 auto 18px', display: 'block' }}>
                        {/* Warm Background Soft Blob */}
                        <path d="M70 120C50 70 90 20 160 30C230 40 240 100 220 140C200 180 100 170 70 120Z" fill="#fef3c7" opacity="0.65" />

                        {/* Wooden Fence / Trellis on the right */}
                        <g opacity="0.85">
                          <rect x="175" y="85" width="8" height="65" rx="2" fill="#d97706" opacity="0.5" />
                          <rect x="195" y="85" width="8" height="65" rx="2" fill="#d97706" opacity="0.5" />
                          <rect x="215" y="85" width="8" height="65" rx="2" fill="#d97706" opacity="0.5" />
                          <rect x="235" y="85" width="8" height="65" rx="2" fill="#d97706" opacity="0.5" />
                          <rect x="170" y="100" width="75" height="6" rx="1.5" fill="#b45309" opacity="0.6" />
                          <rect x="170" y="130" width="75" height="6" rx="1.5" fill="#b45309" opacity="0.6" />
                        </g>

                        {/* Potted plant on left */}
                        <path d="M90 142H106L103 158H93L90 142Z" fill="#14b8a6" />
                        <ellipse cx="98" cy="142" rx="8" ry="2" fill="#0d9488" />
                        <path d="M98 142C92 135 84 136 85 128C88 128 95 134 98 142Z" fill="#10b981" />
                        <path d="M98 142C102 133 112 134 110 126C106 126 100 133 98 142Z" fill="#059669" />
                        <path d="M98 142C96 130 100 122 98 118C96 122 96 132 98 142Z" fill="#34d399" />

                        {/* Red/Coral Ottoman / Cube seat */}
                        <rect x="122" y="125" width="40" height="32" rx="4" fill="#e11d48" />
                        <rect x="122" y="123" width="40" height="6" rx="3" fill="#f43f5e" />

                        {/* Dark blue cat on right */}
                        <path d="M205 135C200 135 195 140 195 148C195 156 200 160 208 160C215 160 220 155 220 148C220 143 218 139 214 136L216 130L211 133C209 133 207 134 205 135Z" fill="#1e293b" />
                        <polygon points="208,134 205,127 203,134" fill="#1e293b" />
                        <polygon points="214,134 212,127 210,134" fill="#1e293b" />
                        <path d="M218 155C224 155 228 150 228 142C228 137 225 136 223 138" stroke="#1e293b" strokeWidth="3" strokeLinecap="round" />

                        {/* Sitting Person */}
                        <path d="M126 118L120 152H130L135 130L145 130L150 152H160L154 118Z" fill="#1e293b" />
                        <ellipse cx="125" cy="154" rx="6" ry="2.5" fill="#0f172a" />
                        <ellipse cx="155" cy="154" rx="6" ry="2.5" fill="#0f172a" />

                        {/* Blue patterned sweater */}
                        <path d="M125 90C125 85 155 85 155 90L157 122H123L125 90Z" fill="#0284c7" />
                        <path d="M136 88L140 94L144 88" fill="#ffffff" />
                        <circle cx="132" cy="100" r="1.2" fill="#bae6fd" />
                        <circle cx="140" cy="102" r="1.2" fill="#bae6fd" />
                        <circle cx="148" cy="100" r="1.2" fill="#bae6fd" />
                        <circle cx="135" cy="112" r="1.2" fill="#bae6fd" />
                        <circle cx="145" cy="112" r="1.2" fill="#bae6fd" />

                        {/* Hands to chin */}
                        <path d="M125 96L134 108L138 98" stroke="#0284c7" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M155 96L146 108L142 98" stroke="#0284c7" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                        <ellipse cx="137" cy="94" rx="3" ry="4" fill="#fcd34d" />
                        <ellipse cx="143" cy="94" rx="3" ry="4" fill="#fcd34d" />

                        {/* Head & Hair */}
                        <circle cx="140" cy="80" r="8" fill="#fcd34d" />
                        <ellipse cx="140" cy="74" rx="10" ry="8" fill="#1e293b" />
                        <circle cx="140" cy="65" r="5" fill="#1e293b" />
                        <circle cx="137" cy="79" r="1" fill="#0f172a" />
                        <circle cx="143" cy="79" r="1" fill="#0f172a" />
                        <path d="M138 83Q140 84 142 83" stroke="#0f172a" strokeWidth="0.8" fill="none" />

                        {/* Ground shadow */}
                        <ellipse cx="145" cy="162" rx="65" ry="3.5" fill="#e2e8f0" />
                      </svg>

                      <h2 className="flp-shared-empty-title">
                        Oops! No folders have been shared with you
                      </h2>
                      <p className="flp-shared-empty-desc">
                        When someone shares folders with you, you can access them here.
                      </p>
                    </div>
                  )}

                  {/* Bottom Pagination */}
                  <div className="flp-bottom-pagination">
                    <span>Show</span>
                    <FlpCustomSelect
                      value={pageSize}
                      options={PAGE_SIZE_OPTIONS}
                      onChange={(val) => setPageSize(Number(val))}
                      activeDropdown={activeDropdown}
                      setActiveDropdown={setActiveDropdown}
                      dropdownId="shared-page-size"
                    />

                    <button type="button" className="flp-nav-arrow" disabled title="First page">
                      &laquo;
                    </button>
                    <button type="button" className="flp-nav-arrow" disabled title="Previous page">
                      &lsaquo;
                    </button>
                    <div className="flp-page-badge">
                      Page 1 of 1
                    </div>
                    <button type="button" className="flp-nav-arrow" disabled title="Next page">
                      &rsaquo;
                    </button>
                    <button type="button" className="flp-nav-arrow" disabled title="Last page">
                      &raquo;
                    </button>
                  </div>
                </div>
              )}

              {/* ─────────────────────────────────────────────────────────────
                  TAB 3: Contacted candidates (Table View per Screenshot 3)
                 ───────────────────────────────────────────────────────────── */}
              {activeTab === 'contacted-candidates' && (
                <div className="flp-tab-panel">
                  {/* Top Bar Controls */}
                  <div className="flp-contacted-bar">
                    <div className="flp-contacted-bar-left">
                      <div className="flp-contacted-control-item">
                        <span className="flp-control-label">Folders:</span>
                        <FlpCustomSelect
                          value={pageSize}
                          options={PAGE_SIZE_OPTIONS}
                          onChange={(val) => setPageSize(Number(val))}
                          activeDropdown={activeDropdown}
                          setActiveDropdown={setActiveDropdown}
                          dropdownId="contacted-top-page-size"
                        />
                        <span className="flp-control-sublabel">per page</span>
                      </div>

                      <div className="flp-contacted-control-item">
                        <span className="flp-control-label">Sort by:</span>
                        <FlpCustomSelect
                          value={contactedSortBy}
                          options={CONTACTED_SORT_OPTIONS}
                          onChange={setContactedSortBy}
                          activeDropdown={activeDropdown}
                          setActiveDropdown={setActiveDropdown}
                          dropdownId="contacted-top-sort"
                        />
                      </div>
                    </div>

                    <div className="flp-contacted-bar-right">
                      <div className="flp-contacted-page-jump">
                        <span className="flp-control-label">Page:</span>
                        <input
                          type="text"
                          className="flp-page-input"
                          value={goToPage}
                          onChange={(e) => setGoToPage(e.target.value)}
                        />
                        <button
                          type="button"
                          className="flp-go-btn"
                          onClick={() => showToast(`Navigated to page ${goToPage}`)}
                        >
                          Go
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Contacted Folders Table */}
                  <div className="flp-contacted-table-wrap">
                    <table className="flp-contacted-table">
                      <thead>
                        <tr>
                          <th className="flp-col-name">Folder Name</th>
                          <th className="flp-col-candidates">Candidates Contacted</th>
                          <th className="flp-col-date">Last Sent</th>
                        </tr>
                      </thead>
                      <tbody>
                        {contactedFolders.length > 0 ? (
                          contactedFolders.map((row) => (
                            <tr key={row._id}>
                              <td className="flp-col-name">
                                <button
                                  type="button"
                                  className="flp-table-link-btn"
                                  onClick={() => navigate(`/employer-dashboard/folders/${row._id}`)}
                                >
                                  <FiFolder size={15} className="flp-table-icon" />
                                  <span>{row.name}</span>
                                </button>
                              </td>
                              <td className="flp-col-candidates">
                                <button
                                  type="button"
                                  className="flp-table-count-btn"
                                  onClick={() => navigate(`/employer-dashboard/folders/${row._id}?tab=contacted`)}
                                >
                                  {row.contactedCount || 0} candidates
                                </button>
                              </td>
                              <td className="flp-col-date flp-table-date-cell">
                                {row.lastActivityAt
                                  ? new Date(row.lastActivityAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                                  : new Date(row.updatedAt || row.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={3} className="flp-table-empty-cell">
                              <div className="flp-table-empty-content">
                                <FiUsers size={32} className="flp-table-empty-icon" />
                                <p className="flp-table-empty-title">No contacted candidates folders found</p>
                                <p className="flp-table-empty-subtitle">When you contact candidates from a folder, activity records will show up here.</p>
                              </div>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Bottom Bar Controls */}
                  <div className="flp-contacted-bar flp-contacted-bar-bottom">
                    <div className="flp-contacted-bar-left">
                      <div className="flp-contacted-control-item">
                        <span className="flp-control-label">Folders:</span>
                        <FlpCustomSelect
                          value={pageSize}
                          options={PAGE_SIZE_OPTIONS}
                          onChange={(val) => setPageSize(Number(val))}
                          activeDropdown={activeDropdown}
                          setActiveDropdown={setActiveDropdown}
                          dropdownId="contacted-bottom-page-size"
                        />
                        <span className="flp-control-sublabel">per page</span>
                      </div>

                      <div className="flp-contacted-control-item">
                        <span className="flp-control-label">Sort by:</span>
                        <FlpCustomSelect
                          value={contactedSortBy}
                          options={CONTACTED_SORT_OPTIONS}
                          onChange={setContactedSortBy}
                          activeDropdown={activeDropdown}
                          setActiveDropdown={setActiveDropdown}
                          dropdownId="contacted-bottom-sort"
                        />
                      </div>
                    </div>

                    <div className="flp-contacted-bar-right">
                      <div className="flp-contacted-page-jump">
                        <span className="flp-control-label">Page:</span>
                        <input
                          type="text"
                          className="flp-page-input"
                          value={goToPage}
                          onChange={(e) => setGoToPage(e.target.value)}
                        />
                        <button
                          type="button"
                          className="flp-go-btn"
                          onClick={() => showToast(`Navigated to page ${goToPage}`)}
                        >
                          Go
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ─────────────────────────────────────────────────────────────
                  TAB 4: CV shared with me
                 ───────────────────────────────────────────────────────────── */}
              {activeTab === 'cv-shared-with-me' && (
                <div className="flp-tab-panel">
                  {sharedCVsLoading ? (
                    <div style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>Loading...</div>
                  ) : sharedCVs.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                      {sharedCVs.map((cv) => {
                        const c = cv.candidateId || {};
                        const p = cv.profileId || {};
                        const candidateData = {
                          userId: c._id,
                          name: c.name || "Unknown Candidate",
                          email: c.email,
                          phone: c.phone,
                          avatar: c.avatar,
                          profilePic: c.profilePic,
                          
                          currentTitle: p.currentTitle || "",
                          headline: p.headline || "",
                          currentCompany: p.currentCompany || "",
                          currentCity: p.currentCity || "",
                          totalExperience: p.totalExperience,
                          expectedSalary: p.expectedSalary,
                          resume: cv.isResumeAttached ? p.resume : null,
                          skills: p.skills || [],
                          education: p.education || [],
                        };

                        const customFooter = (
                          <div style={{ 
                            background: '#f8fafc', padding: 12, borderRadius: 8, 
                            border: '1px solid #e2e8f0', display: 'flex', 
                            justifyContent: 'space-between', alignItems: 'center' 
                          }}>
                            <div style={{ fontSize: '0.85rem', color: '#475569' }}>
                              <div><strong>Forwarded by:</strong> {cv.senderId?.name || cv.senderId?.email || "Unknown"}</div>
                              <div style={{ marginTop: 2 }}><strong>Date:</strong> {new Date(cv.createdAt).toLocaleDateString()}</div>
                            </div>
                            {cv.isResumeAttached && (
                              <div style={{ 
                                background: '#eef2ff', color: '#4338ca', 
                                padding: '4px 10px', borderRadius: 99, 
                                fontSize: '0.75rem', fontWeight: 600 
                              }}>
                                Resume Attached
                              </div>
                            )}
                          </div>
                        );

                        return (
                          <CandidateCard
                            key={cv._id}
                            candidate={candidateData}
                            profileQueryParams={`fromSharedCV=true&isResumeAttached=${cv.isResumeAttached}`}
                            customFooter={customFooter}
                          />
                        );
                      })}
                    </div>
                  ) : (
                    <div className="flp-shared-empty-card">
                      <svg width="280" height="200" viewBox="0 0 280 200" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ margin: '0 auto 18px', display: 'block' }}>
                        <path d="M70 120C50 70 90 20 160 30C230 40 240 100 220 140C200 180 100 170 70 120Z" fill="#fef3c7" opacity="0.65" />
                        <g opacity="0.85">
                          <rect x="175" y="85" width="8" height="65" rx="2" fill="#d97706" opacity="0.5" />
                          <rect x="195" y="85" width="8" height="65" rx="2" fill="#d97706" opacity="0.5" />
                          <rect x="215" y="85" width="8" height="65" rx="2" fill="#d97706" opacity="0.5" />
                          <rect x="235" y="85" width="8" height="65" rx="2" fill="#d97706" opacity="0.5" />
                          <rect x="170" y="100" width="75" height="6" rx="1.5" fill="#b45309" opacity="0.6" />
                          <rect x="170" y="130" width="75" height="6" rx="1.5" fill="#b45309" opacity="0.6" />
                        </g>
                        <path d="M90 142H106L103 158H93L90 142Z" fill="#14b8a6" />
                        <ellipse cx="98" cy="142" rx="8" ry="2" fill="#0d9488" />
                        <path d="M98 142C92 135 84 136 85 128C88 128 95 134 98 142Z" fill="#10b981" />
                        <path d="M98 142C102 133 112 134 110 126C106 126 100 133 98 142Z" fill="#059669" />
                        <path d="M98 142C96 130 100 122 98 118C96 122 96 132 98 142Z" fill="#34d399" />
                        <rect x="122" y="125" width="40" height="32" rx="4" fill="#e11d48" />
                        <rect x="122" y="123" width="40" height="6" rx="3" fill="#f43f5e" />
                        <path d="M205 135C200 135 195 140 195 148C195 156 200 160 208 160C215 160 220 155 220 148C220 143 218 139 214 136L216 130L211 133C209 133 207 134 205 135Z" fill="#1e293b" />
                        <polygon points="208,134 205,127 203,134" fill="#1e293b" />
                        <polygon points="214,134 212,127 210,134" fill="#1e293b" />
                        <path d="M218 155C224 155 228 150 228 142C228 137 225 136 223 138" stroke="#1e293b" strokeWidth="3" strokeLinecap="round" />
                        <path d="M126 118L120 152H130L135 130L145 130L150 152H160L154 118Z" fill="#1e293b" />
                        <ellipse cx="125" cy="154" rx="6" ry="2.5" fill="#0f172a" />
                        <ellipse cx="155" cy="154" rx="6" ry="2.5" fill="#0f172a" />
                        <path d="M125 90C125 85 155 85 155 90L157 122H123L125 90Z" fill="#0284c7" />
                        <path d="M136 88L140 94L144 88" fill="#ffffff" />
                        <circle cx="132" cy="100" r="1.2" fill="#bae6fd" />
                        <circle cx="140" cy="102" r="1.2" fill="#bae6fd" />
                        <circle cx="148" cy="100" r="1.2" fill="#bae6fd" />
                        <circle cx="135" cy="112" r="1.2" fill="#bae6fd" />
                        <circle cx="145" cy="112" r="1.2" fill="#bae6fd" />
                        <path d="M125 96L134 108L138 98" stroke="#0284c7" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M155 96L146 108L142 98" stroke="#0284c7" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                        <ellipse cx="137" cy="94" rx="3" ry="4" fill="#fcd34d" />
                        <ellipse cx="143" cy="94" rx="3" ry="4" fill="#fcd34d" />
                        <circle cx="140" cy="80" r="8" fill="#fcd34d" />
                        <ellipse cx="140" cy="74" rx="10" ry="8" fill="#1e293b" />
                        <circle cx="140" cy="65" r="5" fill="#1e293b" />
                        <circle cx="137" cy="79" r="1" fill="#0f172a" />
                        <circle cx="143" cy="79" r="1" fill="#0f172a" />
                        <path d="M138 83Q140 84 142 83" stroke="#0f172a" strokeWidth="0.8" fill="none" />
                        <ellipse cx="145" cy="162" rx="65" ry="3.5" fill="#e2e8f0" />
                      </svg>

                      <h2 className="flp-shared-empty-title">
                        Oops! No CVs have been shared with you
                      </h2>
                      <p className="flp-shared-empty-desc">
                        When someone forwards a candidate to you, you can access their CVs here.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </main>
          </div>
        </div>

        {/* Create Folder Modal */}
        <CreateFolderModal
          isOpen={showCreate}
          onClose={() => setShowCreate(false)}
          onSubmit={handleCreateSubmit}
        />

        {/* Share Folder Modal */}
        <ShareFolderModal
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          onShare={handleConfirmShare}
          selectedFolders={selectedFolderObjects}
        />

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="flp-modal-overlay">
            <div className="flp-modal-content">
              <div className="flp-modal-header">
                <h2>Confirm Deletion</h2>
                <button type="button" onClick={() => setShowDeleteConfirm(false)} className="flp-modal-close-icon">
                  <FiX size={20} />
                </button>
              </div>
              <div className="flp-modal-body" style={{ padding: '20px' }}>
                <p>Are you sure you want to delete {selectedFolderIds.length} selected folder(s)?</p>
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '20px' }}>
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(false)}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '6px',
                      background: 'none',
                      border: '1px solid #cbd5e1',
                      color: '#475569',
                      cursor: 'pointer',
                      fontWeight: '500'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={confirmDeleteFolders}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '6px',
                      background: '#ef4444',
                      border: 'none',
                      color: 'white',
                      cursor: 'pointer',
                      fontWeight: '500'
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </EmployerLayout>
  );
}
