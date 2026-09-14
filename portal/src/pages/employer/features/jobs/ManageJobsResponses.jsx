import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  FiChevronDown, FiChevronUp, FiSearch, FiRefreshCw,
  FiUsers, FiSlash, FiMoreVertical, FiChevronsLeft,
  FiChevronLeft, FiChevronRight, FiChevronsRight,
  FiCheckCircle, FiFileText, FiFilter, FiTrash2,
  FiEdit3, FiCalendar, FiClock, FiAlertCircle, FiX,
  FiExternalLink, FiMail, FiPhone, FiMapPin, FiEye
} from 'react-icons/fi';
import EmployerLayout from '../../../../components/employer/EmployerLayout';
import EmployerBreadcrumb from '../../../../components/employer/EmployerBreadcrumb';
import { getDrafts, deleteDraft } from '../../../../services/draftJobService';
import employerJobService from '../../../../services/employerJobService';
import './ManageJobsResponses.css';

// Fallback initial jobs when server has no records yet
const FALLBACK_JOBS = [
  {
    id: 'job-sample-1',
    _id: 'job-sample-1',
    title: 'Inside Sales Specialist',
    location: 'Gurugram',
    category: 'NVite',
    status: 'active',
    postedBy: 'recruit@mavenjobs.in',
    postedByLabel: 'sent by recruit...',
    date: '13 Aug 2026',
    totalResponses: 2,
    newResponses: 0,
    shortlisted: 0,
    recipientsCount: 73,
    lastSentDate: '13 Aug 2026',
  },
  {
    id: 'job-sample-2',
    _id: 'job-sample-2',
    title: 'Accountant',
    location: 'Karnal +2',
    category: 'NVite',
    status: 'active',
    postedBy: 'recruit@mavenjobs.in',
    postedByLabel: 'sent by recruit...',
    date: '08 Aug 2026',
    totalResponses: 20,
    newResponses: 0,
    shortlisted: 0,
    recipientsCount: 140,
    lastSentDate: '08 Aug 2026',
  },
  {
    id: 'job-sample-3',
    _id: 'job-sample-3',
    title: 'Data Analyst',
    location: 'Panipat',
    category: 'NVite',
    status: 'active',
    postedBy: 'info@mavenjobs.in',
    postedByLabel: 'sent by info@...',
    date: '07 Aug 2026',
    totalResponses: 15,
    newResponses: 0,
    shortlisted: 0,
    recipientsCount: 95,
    lastSentDate: '07 Aug 2026',
  },
  {
    id: 'job-sample-4',
    _id: 'job-sample-4',
    title: 'Export Executive',
    location: 'Panipat',
    category: 'NVite',
    status: 'active',
    postedBy: 'info@mavenjobs.in',
    postedByLabel: 'sent by info@...',
    date: '07 Aug 2026',
    totalResponses: 15,
    newResponses: 0,
    shortlisted: 0,
    recipientsCount: 88,
    lastSentDate: '07 Aug 2026',
  },
  {
    id: 'job-sample-5',
    _id: 'job-sample-5',
    title: 'Purchase Engineer',
    location: 'New Delhi +2',
    category: 'NVite',
    status: 'active',
    postedBy: 'recruit@mavenjobs.in',
    postedByLabel: 'sent by recruit...',
    date: '07 Aug 2026',
    totalResponses: 21,
    newResponses: 21,
    shortlisted: 0,
    recipientsCount: 110,
    lastSentDate: '07 Aug 2026',
  },
  {
    id: 'job-sample-6',
    _id: 'job-sample-6',
    title: 'Tele Caller',
    location: 'Panipat',
    category: 'NVite',
    status: 'active',
    postedBy: 'recruit@mavenjobs.in',
    postedByLabel: 'sent by recruit...',
    date: '07 Aug 2026',
    totalResponses: 1,
    newResponses: 1,
    shortlisted: 0,
    recipientsCount: 52,
    lastSentDate: '07 Aug 2026',
  },
];

const generateFiltersFromData = (dataList) => {
  const statusesMap = {};
  const categoriesMap = {};
  const postersMap = {};

  dataList.forEach(job => {
    // Status
    const status = job.status || 'unknown';
    statusesMap[status] = (statusesMap[status] || 0) + 1;

    // Category
    const category = job.category || 'unknown';
    categoriesMap[category] = (categoriesMap[category] || 0) + 1;

    // Posted By
    const postedBy = job.postedBy || 'unknown';
    if (!postersMap[postedBy]) {
      postersMap[postedBy] = { count: 0, label: postedBy };
    }
    postersMap[postedBy].count += 1;
  });

  return {
    totalJobs: dataList.length,
    statuses: Object.entries(statusesMap).map(([id, count]) => ({
      id, label: id.charAt(0).toUpperCase() + id.slice(1) + ' Jobs', count
    })),
    categories: Object.entries(categoriesMap).map(([id, count]) => ({
      id, label: id, count
    })),
    posters: Object.entries(postersMap).map(([id, data]) => ({
      id, label: data.label, email: id, count: data.count
    }))
  };
};

const queryLocalJobs = (jobsList, params) => {
  let filtered = [...jobsList];

  // Search
  if (params.search) {
    const q = params.search.toLowerCase();
    filtered = filtered.filter(job => 
      (job.title && job.title.toLowerCase().includes(q)) || 
      (job.location && job.location.toLowerCase().includes(q))
    );
  }

  // Status
  if (params.status) {
    const statuses = params.status.split(',');
    filtered = filtered.filter(job => statuses.includes(job.status));
  }

  // Category
  if (params.category) {
    const categories = params.category.split(',');
    filtered = filtered.filter(job => categories.includes(job.category));
  }

  // Posted By
  if (params.postedBy) {
    const posters = params.postedBy.split(',');
    filtered = filtered.filter(job => posters.includes(job.postedBy));
  }

  // Sorting
  if (params.sortBy === 'date-desc') {
    filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
  } else if (params.sortBy === 'responses-desc') {
    filtered.sort((a, b) => (b.totalResponses || 0) - (a.totalResponses || 0));
  } else if (params.sortBy === 'title-asc') {
    filtered.sort((a, b) => a.title.localeCompare(b.title));
  }

  const totalCount = filtered.length;
  const totalPages = Math.ceil(totalCount / params.limit) || 1;
  const page = Math.max(1, Math.min(params.page, totalPages));
  const startIndex = (page - 1) * params.limit;
  
  const items = filtered.slice(startIndex, startIndex + params.limit);

  return { items, pagination: { totalCount, totalPages, page, limit: params.limit } };
};

export default function ManageJobsResponses() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Active view tab synced with URL query param: ?tab=all | ?tab=drafts
  const tabFromUrl = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(tabFromUrl === 'drafts' ? 'drafts' : 'all');

  useEffect(() => {
    if (tabFromUrl === 'drafts') {
      setActiveTab('drafts');
    } else {
      setActiveTab('all');
    }
  }, [tabFromUrl]);

  const handleTabChange = (newTab) => {
    setActiveTab(newTab);
    if (newTab === 'drafts') {
      setSearchParams({ tab: 'drafts' });
    } else {
      setSearchParams({});
    }
  };

  // Draft Jobs Logic
  const [drafts, setDrafts] = useState([]);
  const [confirmDeleteDraft, setConfirmDeleteDraft] = useState(null);

  useEffect(() => {
    setDrafts(getDrafts());
  }, []);

  const handleContinueDraft = (draftId) => {
    navigate(`/post-job?draftId=${draftId}`);
  };

  const handleDeleteDraft = (draftId) => {
    deleteDraft(draftId);
    setDrafts(getDrafts());
    setConfirmDeleteDraft(null);
    showToast('Draft job deleted permanently.');
  };

  const formatDate = (ts) => {
    try {
      const d = new Date(ts);
      return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch {
      return '—';
    }
  };

  // -------------------------------------------------------------
  // Dynamic API State for Jobs & Filters
  // -------------------------------------------------------------
  const [allJobs, setAllJobs] = useState([]);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [jobs, setJobs] = useState([]);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [filtersData, setFiltersData] = useState({
    totalJobs: 0,
    statuses: [],
    categories: [],
    posters: [],
  });

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [selectedStatuses, setSelectedStatuses] = useState(['active']);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedPosters, setSelectedPosters] = useState([]);

  // Accordion collapse state
  const [statusOpen, setStatusOpen] = useState(true);
  const [categoryOpen, setCategoryOpen] = useState(true);
  const [posterOpen, setPosterOpen] = useState(true);

  // Sorting and Pagination state
  const [sortBy, setSortBy] = useState('date-desc');
  const [pageSize, setPageSize] = useState(60);
  const [showPageSizeMenu, setShowPageSizeMenu] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Header "Post Job" Dropdown
  const [showPostJobMenu, setShowPostJobMenu] = useState(false);
  const postJobRef = useRef(null);
  const pageSizeRef = useRef(null);

  // Row Action Menu Dropdown (job id)
  const [openRowMenuId, setOpenRowMenuId] = useState(null);

  // Selected Jobs for Bulk Actions
  const [selectedJobIds, setSelectedJobIds] = useState([]);

  // Toast feedback
  const [toast, setToast] = useState(null);
  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  // Job Responses Viewer Modal / Drawer State
  const [activeResponseJob, setActiveResponseJob] = useState(null);
  const [jobResponses, setJobResponses] = useState([]);
  const [loadingResponses, setLoadingResponses] = useState(false);

  // Debounce search term input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm.trim());
      setCurrentPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Click outside listener for dropdown menus
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (postJobRef.current && !postJobRef.current.contains(e.target)) {
        setShowPostJobMenu(false);
      }
      if (pageSizeRef.current && !pageSizeRef.current.contains(e.target)) {
        setShowPageSizeMenu(false);
      }
      if (!e.target.closest('.mjr-job-menu-wrapper')) {
        setOpenRowMenuId(null);
      }
    };
    document.addEventListener('pointerdown', handleOutsideClick);
    return () => document.removeEventListener('pointerdown', handleOutsideClick);
  }, []);

  // Fetch all data once to derive dynamic filters and use client-side filtering
  const fetchAllData = useCallback(async () => {
    setLoadingJobs(true);
    try {
      // Fetch without any specific filters, with a high limit to get all for client-side filtering/facets
      const data = await employerJobService.getEmployerJobs({ limit: 1000 });
      if (data && Array.isArray(data.items) && data.items.length > 0) {
        setAllJobs(data.items);
        setFiltersData(generateFiltersFromData(data.items));
      } else {
        setAllJobs(FALLBACK_JOBS);
        setFiltersData(generateFiltersFromData(FALLBACK_JOBS));
      }
    } catch (err) {
      console.warn("API failed, using fallback jobs", err);
      setAllJobs(FALLBACK_JOBS);
      setFiltersData(generateFiltersFromData(FALLBACK_JOBS));
    } finally {
      setIsDataLoaded(true);
    }
  }, []);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // Handle local filtering whenever filters or page change
  useEffect(() => {
    if (!isDataLoaded) return;
    
    setLoadingJobs(true);
    // Slight delay to simulate loading or just debounce filter changes slightly
    const timer = setTimeout(() => {
      const params = {
        page: currentPage,
        limit: pageSize,
        search: debouncedSearch,
        sortBy,
        status: selectedStatuses.join(','),
        category: selectedCategories.join(','),
        postedBy: selectedPosters.join(','),
      };

      const localData = queryLocalJobs(allJobs, params);
      setJobs(localData.items);
      setTotalCount(localData.pagination.totalCount);
      setTotalPages(localData.pagination.totalPages);
      setLoadingJobs(false);
    }, 150);

    return () => clearTimeout(timer);
  }, [allJobs, isDataLoaded, currentPage, pageSize, debouncedSearch, sortBy, selectedStatuses, selectedCategories, selectedPosters]);

  // Open job details and candidate responses into a new tab
  const handleOpenResponses = (job) => {
    const jobId = job.id || job._id;
    window.open(`/employer/job-responses/${jobId}`, '_blank');
  };

  // Single Job Close
  const handleCloseJob = async (job) => {
    try {
      await employerJobService.closeEmployerJob(job.id || job._id);
      showToast(`Closed job "${job.title}".`);
      setOpenRowMenuId(null);
      fetchAllData();
    } catch (err) {
      showToast(err?.message || `Failed to close job.`);
    }
  };

  // Bulk Selection Handlers
  const handleSelectAll = () => {
    if (selectedJobIds.length === jobs.length && jobs.length > 0) {
      setSelectedJobIds([]);
    } else {
      setSelectedJobIds(jobs.map((j) => j.id || j._id));
    }
  };

  const handleToggleSelectJob = (id) => {
    setSelectedJobIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Bulk Actions
  const handleBulkRefresh = async () => {
    if (selectedJobIds.length === 0) {
      fetchAllData();
      showToast('Refreshed job responses list.');
      return;
    }
    try {
      await employerJobService.bulkRefreshJobs(selectedJobIds);
      showToast(`Refreshed ${selectedJobIds.length} job(s).`);
      fetchAllData();
    } catch (err) {
      showToast(err?.message || 'Failed to refresh jobs.');
    }
  };

  const handleBulkCollaborate = () => {
    if (selectedJobIds.length === 0) {
      showToast('Please select at least one job to collaborate.');
      return;
    }
    showToast(`Shared ${selectedJobIds.length} job(s) with team members.`);
  };

  const handleBulkClose = async () => {
    if (selectedJobIds.length === 0) {
      showToast('Please select at least one job to close.');
      return;
    }
    try {
      await employerJobService.bulkCloseJobs(selectedJobIds);
      showToast(`Successfully closed ${selectedJobIds.length} job(s).`);
      setSelectedJobIds([]);
      fetchAllData();
    } catch (err) {
      showToast(err?.message || 'Failed to close jobs.');
    }
  };

  // Filter Checkbox Toggles
  const toggleStatus = (statusId) => {
    setSelectedStatuses((prev) => {
      const next = prev.includes(statusId) ? prev.filter((s) => s !== statusId) : [...prev, statusId];
      setCurrentPage(1);
      return next;
    });
  };

  const toggleCategory = (catId) => {
    setSelectedCategories((prev) => {
      const next = prev.includes(catId) ? prev.filter((c) => c !== catId) : [...prev, catId];
      setCurrentPage(1);
      return next;
    });
  };

  const togglePoster = (posterId) => {
    setSelectedPosters((prev) => {
      const next = prev.includes(posterId) ? prev.filter((p) => p !== posterId) : [...prev, posterId];
      setCurrentPage(1);
      return next;
    });
  };

  // Clear all filters
  const handleClearFilters = () => {
    setSearchTerm('');
    setDebouncedSearch('');
    setUserSearchTerm('');
    setSelectedStatuses(['active']);
    setSelectedCategories([]);
    setSelectedPosters([]);
    setCurrentPage(1);
    showToast('Filters cleared.');
  };

  // Filtered poster list for accordion search
  const displayedPosters = useMemo(() => {
    if (!filtersData.posters) return [];
    if (!userSearchTerm.trim()) return filtersData.posters;
    const q = userSearchTerm.toLowerCase();
    return filtersData.posters.filter(
      (p) => (p.label && p.label.toLowerCase().includes(q)) || (p.email && p.email.toLowerCase().includes(q))
    );
  }, [filtersData.posters, userSearchTerm]);

  return (
    <EmployerLayout activeTab="jobs" requireAuth={false}>
      <div className="mjr-container">
        {/* Toast Notification */}
        {toast && (
          <div className="mjr-toast">
            <FiCheckCircle size={18} color="#10b981" />
            <span>{toast}</span>
          </div>
        )}

        {/* Breadcrumb Navigation */}
        <EmployerBreadcrumb
          items={[
            { label: 'Home', link: '/' },
            { label: 'Employer Dashboard', link: '/employer-dashboard' },
            { label: 'Manage Jobs and Responses' },
          ]}
        />

        {/* Page Header with "Post job" Dropdown */}
        <div className="mjr-header-row">
          <div>
            <h1 className="mjr-title">Manage Jobs and Responses</h1>
            <p className="mjr-subtitle">Responses to your jobs and NVites will appear here</p>
          </div>

          <div className="mjr-post-job-wrapper" ref={postJobRef}>
            <button
              type="button"
              className="mjr-btn-post-job"
              onClick={() => setShowPostJobMenu((prev) => !prev)}
            >
              <span>Post job</span>
              <FiChevronDown
                size={16}
                style={{
                  transform: showPostJobMenu ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.15s ease',
                }}
              />
            </button>

            {/* Post Job Dropdown Menu */}
            {showPostJobMenu && (
              <div className="mjr-post-job-menu">
                <button
                  type="button"
                  className="mjr-post-job-item"
                  onClick={() => {
                    setShowPostJobMenu(false);
                    navigate('/post-job?type=hot');
                  }}
                >
                  <span>Hot Vacancy</span>
                  <span className="mjr-active-badge">Active</span>
                </button>

                <button
                  type="button"
                  className="mjr-post-job-item"
                  onClick={() => {
                    setShowPostJobMenu(false);
                    navigate('/post-job?type=management');
                  }}
                >
                  <span>SMB Job</span>
                </button>

                <button
                  type="button"
                  className="mjr-post-job-item"
                  onClick={() => {
                    setShowPostJobMenu(false);
                    navigate('/post-job?type=internship');
                  }}
                >
                  <span>Internship</span>
                  <span className="mjr-active-badge">Active</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Tabs & Pagination Row */}
        <div className="mjr-tabs-bar">
          <div className="mjr-tabs-left">
            <button
              type="button"
              className={`mjr-tab-btn ${activeTab === 'all' ? 'active' : ''}`}
              onClick={() => handleTabChange('all')}
            >
              All Jobs {totalCount > 0 ? totalCount : (filtersData.totalJobs || '')}
            </button>
            <button
              type="button"
              className={`mjr-tab-btn ${activeTab === 'drafts' ? 'active' : ''}`}
              onClick={() => handleTabChange('drafts')}
            >
              Drafts {drafts.length > 0 ? `(${drafts.length})` : ''}
            </button>
          </div>

          {activeTab === 'all' && (
            <div className="mjr-tabs-right">
              {/* Show items per page */}
              <div className="mjr-page-size-selector" ref={pageSizeRef}>
                <span>Show</span>
                <button
                  type="button"
                  className="mjr-page-size-btn"
                  onClick={() => setShowPageSizeMenu((prev) => !prev)}
                >
                  <span>{pageSize}</span>
                  <FiChevronDown size={14} />
                </button>

                {showPageSizeMenu && (
                  <div className="mjr-page-size-menu">
                    {[20, 40, 60, 80, 100].map((size) => (
                      <button
                        key={size}
                        type="button"
                        className={`mjr-page-size-item ${pageSize === size ? 'selected' : ''}`}
                        onClick={() => {
                          setPageSize(size);
                          setCurrentPage(1);
                          setShowPageSizeMenu(false);
                        }}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Pagination arrows */}
              <div className="mjr-pagination-nav">
                <button
                  type="button"
                  className="mjr-page-arrow"
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage <= 1 || loadingJobs}
                  title="First Page"
                >
                  <FiChevronsLeft size={16} />
                </button>
                <button
                  type="button"
                  className="mjr-page-arrow"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage <= 1 || loadingJobs}
                  title="Previous Page"
                >
                  <FiChevronLeft size={16} />
                </button>

                <span className="mjr-page-box">Page {currentPage} of {Math.max(1, totalPages)}</span>

                <button
                  type="button"
                  className="mjr-page-arrow"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage >= totalPages || loadingJobs}
                  title="Next Page"
                >
                  <FiChevronRight size={16} />
                </button>
                <button
                  type="button"
                  className="mjr-page-arrow"
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage >= totalPages || loadingJobs}
                  title="Last Page"
                >
                  <FiChevronsRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Content Area */}
        {activeTab === 'all' ? (
          <div className="mjr-layout-grid">
            {/* Left Sidebar Filters */}
            <aside className="mjr-sidebar">
              <div className="mjr-sidebar-header">
                <FiFilter size={16} color="#002366" />
                <span>Filters</span>
              </div>

              {/* Main Title/Ref Search */}
              <div className="mjr-search-box">
                <input
                  type="text"
                  className="mjr-search-input"
                  placeholder="Search by Title/Ref Code/Job ID"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <FiSearch size={15} className="mjr-search-icon" />
              </div>

              {/* Accordion 1: Job Status */}
              <div className="mjr-filter-group">
                <button
                  type="button"
                  className="mjr-filter-header"
                  onClick={() => setStatusOpen((prev) => !prev)}
                >
                  <span>Job status</span>
                  {statusOpen ? <FiChevronUp size={15} /> : <FiChevronDown size={15} />}
                </button>

                {statusOpen && (
                  <div className="mjr-filter-list">
                    {(filtersData.statuses || []).map((s) => (
                      <label key={s.id} className="mjr-filter-item">
                        <div className="mjr-filter-item-left">
                          <input
                            type="checkbox"
                            className="mjr-filter-checkbox"
                            checked={selectedStatuses.includes(s.id)}
                            onChange={() => toggleStatus(s.id)}
                          />
                          <span>{s.label}</span>
                        </div>
                        <span className="mjr-filter-count">{s.count ?? 0}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* Accordion 2: Category */}
              <div className="mjr-filter-group">
                <button
                  type="button"
                  className="mjr-filter-header"
                  onClick={() => setCategoryOpen((prev) => !prev)}
                >
                  <span>Category</span>
                  {categoryOpen ? <FiChevronUp size={15} /> : <FiChevronDown size={15} />}
                </button>

                {categoryOpen && (
                  <div className="mjr-filter-list">
                    {(filtersData.categories || []).map((cat) => (
                      <label key={cat.id} className="mjr-filter-item">
                        <div className="mjr-filter-item-left">
                          <input
                            type="checkbox"
                            className="mjr-filter-checkbox"
                            checked={selectedCategories.includes(cat.id)}
                            onChange={() => toggleCategory(cat.id)}
                          />
                          <span>{cat.label}</span>
                        </div>
                        <span className="mjr-filter-count">{cat.count ?? 0}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* Accordion 3: Job Posted By */}
              <div className="mjr-filter-group">
                <button
                  type="button"
                  className="mjr-filter-header"
                  onClick={() => setPosterOpen((prev) => !prev)}
                >
                  <span>Job posted by</span>
                  {posterOpen ? <FiChevronUp size={15} /> : <FiChevronDown size={15} />}
                </button>

                {posterOpen && (
                  <div>
                    <div className="mjr-sub-search-box">
                      <input
                        type="text"
                        className="mjr-sub-search-input"
                        placeholder="Search by username"
                        value={userSearchTerm}
                        onChange={(e) => setUserSearchTerm(e.target.value)}
                      />
                      <FiSearch size={13} className="mjr-search-icon" />
                    </div>

                    <div className="mjr-filter-list">
                      {displayedPosters.map((poster) => (
                        <label key={poster.id} className="mjr-filter-item">
                          <div className="mjr-filter-item-left">
                            <input
                              type="checkbox"
                              className="mjr-filter-checkbox"
                              checked={selectedPosters.includes(poster.id)}
                              onChange={() => togglePoster(poster.id)}
                            />
                            <span>{poster.label}</span>
                          </div>
                          <span className="mjr-filter-count">{poster.count ?? 0}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </aside>

            {/* Main Job Cards Area */}
            <main>
              {/* Bulk Toolbar */}
              <div className="mjr-toolbar">
                <div className="mjr-toolbar-left">
                  <label className="mjr-checkbox-label">
                    <input
                      type="checkbox"
                      className="mjr-filter-checkbox"
                      checked={jobs.length > 0 && selectedJobIds.length === jobs.length}
                      onChange={handleSelectAll}
                    />
                    <span>Select All</span>
                  </label>

                  <button
                    type="button"
                    className="mjr-btn-tool"
                    onClick={handleBulkRefresh}
                  >
                    <FiRefreshCw size={13} />
                    <span>Refresh</span>
                  </button>

                  <button
                    type="button"
                    className="mjr-btn-tool"
                    onClick={handleBulkCollaborate}
                  >
                    <FiUsers size={14} />
                    <span>Collaborate</span>
                  </button>

                  <button
                    type="button"
                    className="mjr-btn-tool"
                    onClick={handleBulkClose}
                  >
                    <FiSlash size={13} />
                    <span>Close</span>
                  </button>
                </div>

                <div className="mjr-toolbar-right">
                  <span style={{ fontSize: 13, color: '#64748b' }}>Sort by:</span>
                  <select
                    className="mjr-sort-select"
                    value={sortBy}
                    onChange={(e) => {
                      setSortBy(e.target.value);
                      setCurrentPage(1);
                    }}
                  >
                    <option value="date-desc">Posted/sent date</option>
                    <option value="responses-desc">Total Responses (High to Low)</option>
                    <option value="title-asc">Job Title (A-Z)</option>
                  </select>
                </div>
              </div>

              {/* Jobs List */}
              <div className="mjr-jobs-list">
                {loadingJobs ? (
                  <div style={{ padding: '60px 20px', textAlign: 'center' }}>
                    <div className="mjr-spinner" />
                    <p style={{ marginTop: 14, fontSize: 14, color: '#64748b' }}>Loading employer jobs...</p>
                  </div>
                ) : jobs.length === 0 ? (
                  <div className="mjr-draft-empty-card" style={{ padding: '40px 20px' }}>
                    <p className="mjr-draft-empty-title">No jobs match your filter</p>
                    <p className="mjr-draft-empty-subtitle">Try adjusting your filters or search keywords</p>
                    <button
                      type="button"
                      className="mjr-btn-clear-filters"
                      onClick={handleClearFilters}
                    >
                      Clear Filters
                    </button>
                  </div>
                ) : (
                  jobs.map((job) => {
                    const jobId = job.id || job._id;
                    const isSelected = selectedJobIds.includes(jobId);
                    const isMenuOpen = openRowMenuId === jobId;

                    return (
                      <div
                        key={jobId}
                        className={`mjr-job-card ${isSelected ? 'selected' : ''}`}
                      >
                        {/* Select Checkbox */}
                        <input
                          type="checkbox"
                          className="mjr-filter-checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelectJob(jobId)}
                        />

                        {/* Title & Location & Tag */}
                        <div className="mjr-job-info">
                          <span
                            className="mjr-job-title"
                            onClick={() => handleOpenResponses(job)}
                            title="Click to view candidate responses"
                          >
                            {job.title}
                          </span>
                          <span className="mjr-job-location">{job.location}</span>
                          <span className="mjr-job-tag">{job.category}</span>
                        </div>

                        {/* Middle Stats */}
                        <div className="mjr-job-stats">
                          <div
                            className="mjr-stat-item"
                            style={{ cursor: 'pointer' }}
                            onClick={() => handleOpenResponses(job)}
                            title="View responses"
                          >
                            <div className="mjr-stat-num-row">
                              <span className="mjr-stat-number">{job.totalResponses ?? 0}</span>
                              {(job.newResponses ?? 0) > 0 && (
                                <span className="mjr-stat-new-badge">{job.newResponses} New</span>
                              )}
                            </div>
                            <span className="mjr-stat-label">Total Responses</span>
                          </div>

                          <div className="mjr-stat-item">
                            <span className="mjr-stat-number" style={{ color: '#0f172a' }}>
                              {job.shortlisted ?? 0}
                            </span>
                            <span className="mjr-stat-label">Shortlisted</span>
                          </div>
                        </div>

                        {/* Right Meta & 3-Dots Action Menu */}
                        <div className="mjr-job-meta-row">
                          <span className="mjr-job-sent-meta">
                            {job.postedByLabel} | {job.date}
                          </span>

                          <div className="mjr-job-menu-wrapper">
                            <button
                              type="button"
                              className="mjr-btn-row-menu"
                              onClick={() =>
                                setOpenRowMenuId((prev) => (prev === jobId ? null : jobId))
                              }
                              title="More options"
                            >
                              <FiMoreVertical size={16} />
                            </button>

                            {/* 3-Dots Row Action Dropdown Menu */}
                            {isMenuOpen && (
                              <div className="mjr-row-dropdown">
                                <button
                                  type="button"
                                  className="mjr-row-action-btn"
                                  onClick={() => handleOpenResponses(job)}
                                >
                                  View Responses ({job.totalResponses ?? 0})
                                </button>
                                <button
                                  type="button"
                                  className="mjr-row-action-btn"
                                  onClick={() => handleCloseJob(job)}
                                >
                                  Close
                                </button>
                                <button
                                  type="button"
                                  className="mjr-row-action-btn"
                                  onClick={() => {
                                    setOpenRowMenuId(null);
                                    showToast(`Opening collaboration for ${job.title}`);
                                  }}
                                >
                                  Collaborate
                                </button>
                                <button
                                  type="button"
                                  className="mjr-row-action-btn"
                                  onClick={() => {
                                    setOpenRowMenuId(null);
                                    showToast(`Opening NVite preview for ${job.title}`);
                                  }}
                                >
                                  Preview NVite
                                </button>

                                <div className="mjr-dropdown-divider" />

                                <div className="mjr-nvite-info-block">
                                  <div className="mjr-nvite-info-title">NVite info (last 90 days)</div>
                                  <div className="mjr-nvite-info-bullet">• {job.recipientsCount ?? 0} total recipients</div>
                                  <div className="mjr-nvite-info-bullet">• Last sent on {job.lastSentDate || '—'}</div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </main>
          </div>
        ) : (
          /* Drafts Tab View */
          <div className="mjr-drafts-grid">
            {/* Left Info Card with Graphic */}
            <div className="mjr-draft-info-card">
              <div className="mjr-draft-ill-wrapper">
                <svg width="120" height="120" viewBox="0 0 200 200" fill="none">
                  <rect x="40" y="30" width="120" height="140" rx="12" fill="#e0f2fe" />
                  <rect x="55" y="45" width="90" height="12" rx="4" fill="#38bdf8" />
                  <rect x="55" y="65" width="70" height="8" rx="3" fill="#93c5fd" />
                  <rect x="55" y="80" width="80" height="8" rx="3" fill="#93c5fd" />
                  <rect x="55" y="95" width="60" height="8" rx="3" fill="#93c5fd" />
                  <circle cx="130" cy="130" r="28" fill="#0284c7" />
                  <path d="M120 130L127 137L142 122" stroke="#ffffff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <p className="mjr-draft-info-text">
                All jobs under drafts stay in the system for a period of 90 days
              </p>
            </div>

            {/* Right View: Empty State or Saved Drafts List */}
            {drafts.length === 0 ? (
              <div className="mjr-draft-empty-card">
                <div className="mjr-draft-empty-ill">
                  <svg width="150" height="120" viewBox="0 0 240 180" fill="none">
                    <circle cx="120" cy="90" r="70" fill="#f8fafc" />
                    <rect x="80" y="55" width="80" height="70" rx="8" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="2" strokeDasharray="4 4" />
                    <circle cx="120" cy="85" r="16" fill="#e2e8f0" />
                    <path d="M112 110C112 105 116 102 120 102C124 102 128 105 128 110" stroke="#94a3b8" strokeWidth="3" strokeLinecap="round" />
                  </svg>
                </div>
                <h2 className="mjr-draft-empty-title">Oops! You do not have any drafts at the moment</h2>
                <p className="mjr-draft-empty-subtitle">Once you have jobs saved as drafts, they can be found here</p>
                <button
                  type="button"
                  className="mjr-btn-clear-filters"
                  onClick={() => navigate('/post-job')}
                >
                  Post a Job
                </button>
              </div>
            ) : (
              <div className="mjr-draft-list-container">
                <div className="mjr-draft-header-row">
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#334155' }}>
                    {drafts.length} draft{drafts.length !== 1 ? 's' : ''} saved
                  </span>
                  <button
                    type="button"
                    className="mjr-btn-draft-continue"
                    onClick={() => navigate('/post-job')}
                  >
                    <FiFileText size={14} />
                    New Job Posting
                  </button>
                </div>

                {drafts.map((draft) => (
                  <div key={draft.draftId} className="mjr-draft-item-card">
                    <div className="mjr-draft-icon-box">
                      <FiEdit3 size={20} />
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginBottom: 2 }}>
                        {draft.jobTitle?.trim() || draft.companyName?.trim() || 'Untitled Draft'}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                        {draft.companyName?.trim() && (
                          <span style={{ fontSize: 12.5, fontWeight: 600, color: '#64748b' }}>{draft.companyName}</span>
                        )}
                        {draft.industry && (
                          <span style={{ fontSize: 12.5, fontWeight: 600, color: '#64748b' }}>| {draft.industry}</span>
                        )}
                      </div>
                      <div className="mjr-draft-meta-tags">
                        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                          <FiCalendar size={12} /> {formatDate(draft.savedAt)}
                        </span>
                        {draft.savedAt && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                            <FiClock size={12} /> Step {draft.step || 1}/4
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="mjr-draft-actions">
                      <button
                        type="button"
                        className="mjr-btn-draft-continue"
                        onClick={() => handleContinueDraft(draft.draftId)}
                      >
                        <FiEdit3 size={13} /> Continue
                      </button>
                      <button
                        type="button"
                        className="mjr-btn-draft-delete"
                        onClick={() => setConfirmDeleteDraft(draft.draftId)}
                      >
                        <FiTrash2 size={13} /> Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Candidate Responses Drawer */}
        {activeResponseJob && (
          <div className="mjr-responses-modal-overlay" onClick={() => setActiveResponseJob(null)}>
            <div className="mjr-responses-drawer" onClick={(e) => e.stopPropagation()}>
              <div className="mjr-drawer-header">
                <div className="mjr-drawer-title-box">
                  <h3>Responses for {activeResponseJob.title}</h3>
                  <p>{activeResponseJob.location} • {jobResponses.length} applicant{jobResponses.length !== 1 ? 's' : ''}</p>
                </div>
                <button
                  type="button"
                  className="mjr-drawer-close-btn"
                  onClick={() => setActiveResponseJob(null)}
                >
                  <FiX size={18} />
                </button>
              </div>

              <div className="mjr-drawer-content">
                {loadingResponses ? (
                  <div style={{ padding: '60px 20px', textAlign: 'center' }}>
                    <div className="mjr-spinner" />
                    <p style={{ marginTop: 14, fontSize: 14, color: '#64748b' }}>Loading applicants...</p>
                  </div>
                ) : jobResponses.length === 0 ? (
                  <div style={{ padding: '60px 20px', textAlign: 'center' }}>
                    <p style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', margin: '0 0 6px 0' }}>No responses yet</p>
                    <p style={{ fontSize: 13.5, color: '#64748b', margin: 0 }}>Applicants applying to this job will appear here.</p>
                  </div>
                ) : (
                  jobResponses.map((applicant) => (
                    <div key={applicant.applicationId} className="mjr-applicant-card">
                      <div className="mjr-applicant-top">
                        <div className="mjr-applicant-avatar">
                          {applicant.candidateName?.slice(0, 1).toUpperCase() || 'C'}
                        </div>
                        <div className="mjr-applicant-info">
                          <div className="mjr-applicant-name">{applicant.candidateName}</div>
                          <div className="mjr-applicant-sub">
                            {applicant.designation && <span>{applicant.designation}</span>}
                            {applicant.experience && <span>• {applicant.experience}</span>}
                            {applicant.location && (
                              <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                                <FiMapPin size={11} /> {applicant.location}
                              </span>
                            )}
                          </div>
                        </div>
                        <span className={`mjr-applicant-status-badge ${applicant.status?.toLowerCase()}`}>
                          {applicant.status}
                        </span>
                      </div>

                      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 12.5, color: '#475569' }}>
                        {applicant.candidateEmail && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                            <FiMail size={13} color="#64748b" /> {applicant.candidateEmail}
                          </div>
                        )}
                        {applicant.phone && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                            <FiPhone size={13} color="#64748b" /> {applicant.phone}
                          </div>
                        )}
                      </div>

                      <div className="mjr-applicant-bottom">
                        <span>Applied on {applicant.appliedAtFormatted}</span>
                        {applicant.resumeUrl && applicant.resumeUrl !== '#' ? (
                          <a
                            href={applicant.resumeUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mjr-btn-resume-link"
                          >
                            <FiFileText size={13} /> View Resume
                          </a>
                        ) : (
                          <span style={{ fontSize: 12, color: '#94a3b8' }}>No resume attached</span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Confirm Delete Draft Modal */}
        {confirmDeleteDraft && (
          <div className="mjr-modal-overlay" onClick={() => setConfirmDeleteDraft(null)}>
            <div className="mjr-modal-card" onClick={(e) => e.stopPropagation()}>
              <div style={{
                width: 54, height: 54, borderRadius: '50%',
                background: '#FEF2F2', margin: '0 auto 16px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <FiAlertCircle size={26} color="#DC2626" />
              </div>
              <h3 style={{ margin: '0 0 8px', fontSize: 17, fontWeight: 800, color: '#0f172a' }}>Delete Draft?</h3>
              <p style={{ margin: '0 0 24px', fontSize: 13.5, color: '#64748b', lineHeight: 1.5 }}>
                This draft will be permanently removed. You will not be able to recover it.
              </p>
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  type="button"
                  className="mjr-btn-clear-filters"
                  style={{ flex: 1, background: '#f1f5f9', color: '#475569' }}
                  onClick={() => setConfirmDeleteDraft(null)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="mjr-btn-draft-delete"
                  style={{ flex: 1, justifyContent: 'center', padding: '10px' }}
                  onClick={() => handleDeleteDraft(confirmDeleteDraft)}
                >
                  <FiTrash2 size={14} /> Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </EmployerLayout>
  );
}
