import { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams, useLocation, useParams } from 'react-router-dom';
import {
  FiFolder, FiPlus, FiTrash2, FiShare2, FiChevronDown,
  FiSliders, FiCheck, FiX, FiCalendar, FiChevronLeft, FiChevronRight,
  FiChevronsLeft, FiChevronsRight
} from 'react-icons/fi';
import EmployerLayout from '../../../../components/employer/EmployerLayout';
import EmployerBreadcrumb from '../../../../components/employer/EmployerBreadcrumb';
import CreateFolderModal from '../../../../components/employer/CreateFolderModal';
import ShareFolderModal from '../../../../components/employer/ShareFolderModal';
import {
  useFolders, useCreateFolder, useUpdateFolder, useDeleteFolder, useDuplicateFolder
} from '../../../../hooks/useFolderQueries';
import './FolderListPage.css';

const TABS = [
  { id: 'my-folders', label: 'My folders' },
  { id: 'shared-with-me', label: 'Folders shared with me' },
  { id: 'contacted-candidates', label: 'Contacted candidates' },
];

const DATE_FILTERS = [
  { id: 'all', label: 'All time' },
  { id: 'last-7', label: 'Last 7 days' },
  { id: 'last-14', label: 'Last 14 days' },
  { id: 'last-30', label: 'Last 30 days' },
  { id: 'custom', label: 'Custom date range' },
];

export default function FolderListPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const { tab: pathTab } = useParams();

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

  const showToast = useCallback((msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  }, []);

  // Fetch backend custom folders
  const params = useMemo(() => {
    return { sort: sortBy, page, limit: pageSize };
  }, [sortBy, page, pageSize]);

  const { data: serverFolders = [], refetch } = useFolders(params);
  const createFolder = useCreateFolder();
  const updateFolder = useUpdateFolder();
  const deleteFolder = useDeleteFolder();
  const duplicateFolder = useDuplicateFolder();

  // Filter server folders dynamically based on date filter
  const filteredFolders = useMemo(() => {
    let list = Array.isArray(serverFolders) ? [...serverFolders] : [];
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
      f => f.isPublic || (Array.isArray(f.sharedWith) && f.sharedWith.length > 0) || f.shareWithUsers
    );
  }, [serverFolders]);

  // Contacted candidates folders dynamically sorted
  const contactedFolders = useMemo(() => {
    let list = Array.isArray(serverFolders) ? [...serverFolders] : [];
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
  const handleDeleteSelected = async () => {
    if (selectedFolderIds.length === 0) {
      showToast('Please select at least one folder to delete.');
      return;
    }

    if (!window.confirm(`Delete ${selectedFolderIds.length} selected folder(s)?`)) return;

    try {
      for (const id of selectedFolderIds) {
        await deleteFolder.mutateAsync(id);
      }
      setSelectedFolderIds([]);
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

  return (
    <EmployerLayout>
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
            <h1 className="flp-title">Manage Folders</h1>
            <button
              type="button"
              className="flp-create-folder-btn"
              onClick={() => setShowCreate(true)}
            >
              Create folder
            </button>
          </div>

          {/* Main layout (full-width when on Contacted candidates tab) */}
          <div className={`flp-layout ${activeTab === 'contacted-candidates' ? 'flp-layout-full' : ''}`}>
            {/* ─────────────────────────────────────────────────────────────
                Left Column: Filters Sidebar (Hidden on Contacted candidates tab)
               ───────────────────────────────────────────────────────────── */}
            {activeTab !== 'contacted-candidates' && (
              <aside className="flp-sidebar">
                <div className="flp-sidebar-header">
                  <FiSliders size={17} color="#64748b" />
                  <span>Filters</span>
                </div>

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
              </aside>
            )}

            {/* ─────────────────────────────────────────────────────────────
                Right Column: Main Tabs and Folder Contents
               ───────────────────────────────────────────────────────────── */}
            <main className="flp-main-content">
              {/* Tabs Navigation & Top Pagination */}
              <div className="flp-tabs-header-row">
                <div className="flp-tabs-list">
                  {TABS.map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      className={`flp-tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                      onClick={() => handleTabChange(tab.id)}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Top Pagination Controls */}
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
                      <select
                        className="flp-sort-select"
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                      >
                        <option value="created">Created date</option>
                        <option value="recent">Recently Updated</option>
                        <option value="name">Alphabetical</option>
                        <option value="candidates">Candidate count</option>
                      </select>
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
                      <select
                        className="flp-sort-select"
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                      >
                        <option value="created">Created date</option>
                        <option value="recent">Recently Updated</option>
                        <option value="name">Alphabetical</option>
                      </select>
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
                </div>
              )}

              {/* ─────────────────────────────────────────────────────────────
                  TAB 3: Contacted candidates (Table View per Screenshot 3)
                 ───────────────────────────────────────────────────────────── */}
              {activeTab === 'contacted-candidates' && (
                <div className="flp-tab-panel">
                  {/* Top Bar Controls per Screenshot 3 */}
                  <div className="flp-contacted-bar">
                    <div className="flp-contacted-bar-left">
                      <span>Folders:</span>
                      <select
                        className="flp-contacted-select"
                        value={pageSize}
                        onChange={(e) => setPageSize(Number(e.target.value))}
                      >
                        <option value={20}>20</option>
                        <option value={40}>40</option>
                        <option value={60}>60</option>
                        <option value={100}>100</option>
                      </select>
                      <span>per page</span>

                      <span style={{ marginLeft: 16 }}>Sort by:</span>
                      <select
                        className="flp-contacted-select"
                        value={contactedSortBy}
                        onChange={(e) => setContactedSortBy(e.target.value)}
                      >
                        <option value="Date">Date</option>
                        <option value="Name">Name</option>
                        <option value="Count">Candidate count</option>
                      </select>
                    </div>

                    <div className="flp-contacted-bar-right">
                      <span className="flp-bar-pipe">|</span>
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

                  {/* Contacted Folders Table */}
                  <div className="flp-contacted-table-wrap">
                    <table className="flp-contacted-table">
                      <thead>
                        <tr>
                          <th style={{ width: '55%', textAlign: 'left' }}>Folder Name</th>
                          <th style={{ width: '25%', textAlign: 'left' }}>Candidates Contacted</th>
                          <th style={{ width: '20%', textAlign: 'left' }}>Last Sent</th>
                        </tr>
                      </thead>
                      <tbody>
                        {contactedFolders.length > 0 ? (
                          contactedFolders.map((row) => (
                            <tr key={row._id}>
                              <td>
                                <button
                                  type="button"
                                  className="flp-table-link-btn"
                                  onClick={() => navigate(`/employer-dashboard/folders/${row._id}`)}
                                >
                                  {row.name}
                                </button>
                              </td>
                              <td>
                                <button
                                  type="button"
                                  className="flp-table-count-btn"
                                  onClick={() => navigate(`/employer-dashboard/folders/${row._id}`)}
                                >
                                  {row.candidateCount || 0}
                                </button>
                              </td>
                              <td className="flp-table-date-cell">
                                {row.lastActivityAt
                                  ? new Date(row.lastActivityAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                                  : new Date(row.updatedAt || row.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={3} style={{ textAlign: 'center', padding: '36px 16px', color: '#64748b' }}>
                              No contacted candidates folders found.
                            </td>
                          </tr>
                        )}
                      </tbody>
                      <tfoot>
                        <tr>
                          <th style={{ textAlign: 'left' }}>Folder Name</th>
                          <th style={{ textAlign: 'left' }}>Candidates Contacted</th>
                          <th style={{ textAlign: 'left' }}>Last Sent</th>
                        </tr>
                      </tfoot>
                    </table>
                  </div>

                  {/* Bottom Bar Controls per Screenshot 3 */}
                  <div className="flp-contacted-bar" style={{ marginTop: 0 }}>
                    <div className="flp-contacted-bar-left">
                      <span>Folders:</span>
                      <select
                        className="flp-contacted-select"
                        value={pageSize}
                        onChange={(e) => setPageSize(Number(e.target.value))}
                      >
                        <option value={20}>20</option>
                        <option value={40}>40</option>
                        <option value={60}>60</option>
                        <option value={100}>100</option>
                      </select>
                      <span>per page</span>

                      <span style={{ marginLeft: 16 }}>Sort by:</span>
                      <select
                        className="flp-contacted-select"
                        value={contactedSortBy}
                        onChange={(e) => setContactedSortBy(e.target.value)}
                      >
                        <option value="Date">Date</option>
                        <option value="Name">Name</option>
                        <option value="Count">Candidate count</option>
                      </select>
                    </div>

                    <div className="flp-contacted-bar-right">
                      <span className="flp-bar-pipe">|</span>
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
      </div>
    </EmployerLayout>
  );
}
