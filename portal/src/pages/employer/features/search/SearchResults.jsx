import { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { FiSearch, FiChevronLeft, FiChevronRight, FiSliders, FiRefreshCw, FiUsers, FiFolderPlus } from 'react-icons/fi';
import authService from '../../../../services/authService';
import EmployerLayout from '../../../../components/employer/EmployerLayout';
import EmployerBreadcrumb from '../../../../components/employer/EmployerBreadcrumb';
import CandidateCard from '../../../../components/employer/CandidateCard';
import FolderSelectorModal from '../../../../components/employer/FolderSelectorModal';
import './SearchResume.css';

const C = {
  navy: "#002366", navyD: "#001540", navyM: "#1a3a6e",
  green: "#10b981", indigo: "#6366f1",
  s50: "#f8fafc", s100: "#f1f5f9", s200: "#e2e8f0",
  s300: "#cbd5e1", s400: "#94a3b8", s500: "#64748b",
  s600: "#475569", s700: "#334155", s800: "#1e293b", s900: "#0f172a",
};

const SORT_OPTIONS = [
  { value: "relevance", label: "Most Relevant" },
  { value: "newest", label: "Newest First" },
  { value: "oldest", label: "Oldest First" },
  { value: "experience_high", label: "Experience (High to Low)" },
  { value: "experience_low", label: "Experience (Low to High)" },
];

export default function SearchResults() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [user, setUser] = useState(null);
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(true);
  const [sessionExpired, setSessionExpired] = useState(false);

  const [candidates, setCandidates] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [sort, setSort] = useState("relevance");
  const [showFilters, setShowFilters] = useState(false);
  const [folderCandidateId, setFolderCandidateId] = useState(null);

  const filtersFromUrl = useMemo(() => {
    const f = {};
    searchParams.forEach((value, key) => {
      f[key] = value;
    });
    return f;
  }, [searchParams]);

  const fetchResults = useCallback(async (page = 1) => {
    setSearching(true);
    try {
      const params = Object.fromEntries(searchParams.entries());
      params.page = String(page);
      if (sort) params.sort = sort;
      const res = await authService.searchResdexCandidates(params);
      if (res?.success) {
        setCandidates(res.data.candidates || []);
        setPagination(res.data.pagination || { page: 1, limit: 20, total: 0, totalPages: 0 });
      }
    } catch {
      setCandidates([]);
      setPagination({ page: 1, limit: 20, total: 0, totalPages: 0 });
    }
    setSearching(false);
  }, [searchParams, sort]);

  useEffect(() => {
    if (candidates.length > 0) {
      sessionStorage.setItem('maven_candidate_list', JSON.stringify(candidates.map(c => c.userId || c.id)));
      sessionStorage.setItem('maven_search_text', searchParams.get('keywords') || searchParams.get('query') || '');
      sessionStorage.setItem('maven_search_total', pagination?.total || candidates.length);
    }
  }, [candidates, searchParams, pagination]);

  useEffect(() => {
    const token = localStorage.getItem("employerToken");
    if (!token) { setSessionExpired(true); setLoading(false); return; }
    const load = async () => {
      try {
        const dashRes = await authService.getEmployerDashboard().catch(() => null);
        if (dashRes?.success) {
          setCompany(dashRes.data.company || dashRes.data);
          setUser(dashRes.data.user || dashRes.data);
        }
      } catch { setSessionExpired(true); }
      setLoading(false);
    };
    load();
  }, []);

  useEffect(() => {
    if (!loading) fetchResults(1);
  }, [loading, fetchResults]);

  useEffect(() => {
    const handler = () => setSessionExpired(true);
    window.addEventListener("employer-session-expired", handler);
    return () => window.removeEventListener("employer-session-expired", handler);
  }, []);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    filtersFromUrl.forEach((value, key) => {
      if (!["version", "sort", "page", "limit"].includes(key) && value) count++;
    });
    return count;
  }, [filtersFromUrl]);

  if (sessionExpired) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f8fafc" }}>
        <div style={{ textAlign: "center" }}>
          <FiUsers size={48} color={C.s400} style={{ marginBottom: 16 }} />
          <h2 style={{ fontSize: "1.2rem", fontWeight: 700, color: C.s900, marginBottom: 8 }}>Session Expired</h2>
          <p style={{ color: C.s500, fontSize: "0.9rem", marginBottom: 20 }}>Please log in again to access Resdex.</p>
          <button onClick={() => navigate("/employer-login")} style={{
            padding: "10px 24px", borderRadius: 10, background: C.navy, color: "#fff",
            border: "none", fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
          }}>Go to Login</button>
        </div>
      </div>
    );
  }

  if (loading) {
    return <SearchResultsSkeleton />;
  }

  return (
    <>
    <EmployerLayout
      company={company}
      activeTab="resdex"
      onNavigate={(tab) => {
        if (tab === "dashboard") navigate("/employer-dashboard");
        else if (tab === "analytics") navigate("/employer-dashboard/analytics");
      }}
      onMessagesClick={() => {}}
      onNotificationsClick={() => {}}
      onLogout={() => { localStorage.removeItem("employerToken"); navigate("/employer-login"); }}
    >
      <EmployerBreadcrumb items={[
        { label: 'Employer Dashboard', path: '/employer-dashboard' },
        { label: 'Resdex', path: '/resdex' },
        { label: 'Search Results' },
      ]} />

      <div className="sr-header">
        <div>
          <h1 className="sr-title">
            <FiSearch size={22} style={{ marginRight: 8 }} /> Search Results
          </h1>
          <p className="sr-subtitle">
            {pagination.total > 0
              ? `Found ${pagination.total.toLocaleString()} candidate${pagination.total !== 1 ? 's' : ''} matching your criteria`
              : 'No candidates found. Try adjusting your search filters.'}
          </p>
        </div>
        <div className="sr-header-actions">
          <button className="sr-btn sr-btn-ghost" onClick={() => setShowFilters(!showFilters)}>
            <FiSliders size={14} /> {showFilters ? 'Hide' : 'Show'} Filters ({activeFilterCount})
          </button>
          <select className="sr-input sr-select" value={sort}
            onChange={e => setSort(e.target.value)}
            style={{ width: 'auto', display: 'inline-flex', padding: '8px 14px', fontSize: '0.78rem' }}>
            {SORT_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <Link to="/resdex" className="sr-btn">
            <FiRefreshCw size={14} /> New Search
          </Link>
        </div>
      </div>

        <div className="sr-layout">
          {showFilters && (
            <aside className="sr-sidebar" style={{ width: 280 }}>
              <div className="sr-sidebar-header">
                <h3 className="sr-sidebar-title"><FiFilter size={15} /> Active Filters</h3>
              </div>
              <div className="sr-filters" style={{ padding: '12px 16px' }}>
                {activeFilterCount === 0 ? (
                  <p style={{ fontSize: '0.78rem', color: C.s400 }}>No active filters</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {Object.entries(filtersFromUrl).filter(([k]) => !["version", "sort", "page", "limit"].includes(k)).map(([key, value]) => (
                      <div key={key} style={{
                        padding: '8px 10px', background: '#f8fafc', borderRadius: 8,
                        fontSize: '0.75rem'
                      }}>
                        <div style={{ fontWeight: 700, color: C.s600, marginBottom: 2, textTransform: 'capitalize' }}>
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </div>
                        <div style={{ color: C.s800, fontWeight: 600 }}>{value}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </aside>
          )}

          <main className="sr-main">
            {searching ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} style={{
                    height: 180, background: 'white', borderRadius: 16,
                    border: `1px solid ${C.s200}`, padding: 20,
                  }}>
                    <div style={{ height: 16, width: '40%', background: C.s100, borderRadius: 6, marginBottom: 12 }} />
                    <div style={{ height: 12, width: '60%', background: C.s100, borderRadius: 6, marginBottom: 8 }} />
                    <div style={{ height: 12, width: '30%', background: C.s100, borderRadius: 6 }} />
                  </div>
                ))}
              </div>
            ) : candidates.length === 0 ? (
              <div style={{
                textAlign: 'center', padding: '60px 20px', background: 'white',
                borderRadius: 16, border: `1px solid ${C.s200}`,
              }}>
                <FiSearch size={48} color={C.s300} style={{ marginBottom: 16 }} />
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: C.s800, marginBottom: 8 }}>No Candidates Found</h3>
                <p style={{ fontSize: '0.85rem', color: C.s500, maxWidth: 400, margin: '0 auto 20px' }}>
                  Try broadening your search criteria, removing some filters, or using the AI assistant to build a better query.
                </p>
                <Link to="/resdex" className="sr-btn sr-btn-primary" style={{ textDecoration: 'none' }}>
                  <FiSearch size={14} /> Back to Search
                </Link>
              </div>
            ) : (
              <>
                <div className="sr-results-summary" style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '12px 0', fontSize: '0.82rem', color: C.s500,
                }}>
                  <span>Showing {candidates.length} of {pagination.total.toLocaleString()} results</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {candidates.map((candidate, index) => (
                    <CandidateCard key={candidate.id || candidate.userId || index} candidate={candidate}
                      onAddToFolder={(c) => setFolderCandidateId(c.userId || c.id)} />
                  ))}
                  {candidates.length === 0 && !searching && (
                    <div style={{
                      textAlign: 'center', padding: '60px 20px', background: 'white',
                      borderRadius: 16, border: `1px solid ${C.s200}`,
                    }}>
                      <FiSearch size={48} color={C.s300} style={{ marginBottom: 16 }} />
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: C.s800, marginBottom: 8 }}>No Candidates Found</h3>
                      <p style={{ fontSize: '0.85rem', color: C.s500, maxWidth: 400, margin: '0 auto 20px' }}>
                        Try broadening your search criteria or removing some filters.
                      </p>
                    </div>
                  )}
                </div>

                {pagination.totalPages > 1 && (
                  <Pagination
                    current={pagination.page}
                    total={pagination.totalPages}
                    onChange={fetchResults}
                  />
                )}
              </>
            )}
          </main>
        </div>
      </EmployerLayout>

      {folderCandidateId && (
        <FolderSelectorModal
          candidateId={folderCandidateId}
          onClose={() => setFolderCandidateId(null)}
        />
      )}
    </>
  );
}



function Pagination({ current, total, onChange }) {
  const getRange = () => {
    const maxVisible = 5;
    if (total <= maxVisible) return Array.from({ length: total }, (_, i) => i + 1);
    const half = Math.floor(maxVisible / 2);
    let start = Math.max(1, current - half);
    let end = Math.min(total, start + maxVisible - 1);
    if (end - start + 1 < maxVisible) start = Math.max(1, end - maxVisible + 1);
    const pages = [];
    if (start > 1) { pages.push(1); if (start > 2) pages.push(null); }
    for (let i = start; i <= end; i++) pages.push(i);
    if (end < total) { if (end < total - 1) pages.push(null); pages.push(total); }
    return pages;
  };
  const range = getRange();
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      gap: 6, marginTop: 24, padding: '16px 0',
    }}>
      <button className="sr-btn" disabled={current <= 1}
        onClick={() => onChange(current - 1)}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
        <FiChevronLeft size={14} /> Prev
      </button>
      {range.map((page, i) =>
        page === null ? (
          <span key={`e${i}`} style={{ color: C.s400, fontSize: '0.82rem', padding: '0 4px' }}>...</span>
        ) : (
          <button key={page}
            className={`sr-btn ${page === current ? 'sr-btn-primary' : ''}`}
            onClick={() => onChange(page)}
            style={{ minWidth: 36, justifyContent: 'center', fontWeight: page === current ? 700 : 500 }}>
            {page}
          </button>
        )
      )}
      <button className="sr-btn" disabled={current >= total}
        onClick={() => onChange(current + 1)}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
        Next <FiChevronRight size={14} />
      </button>
    </div>
  );
}

function SearchResultsSkeleton() {
  return (
    <div style={{ minHeight: '100vh', background: '#f0f4f9' }}>
      <div style={{ height: 58, background: '#fff', borderBottom: `1px solid ${C.s200}`, position: 'sticky', top: 0, zIndex: 200 }} />
      <div style={{ maxWidth: 1160, margin: '0 auto', padding: '20px 20px 48px' }}>
        <div style={{ height: 16, width: 300, background: C.s100, borderRadius: 6, marginBottom: 24 }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {[1, 2, 3, 4].map(i => (
            <div key={i} style={{
              height: 200, background: 'white', borderRadius: 16,
              border: `1px solid ${C.s200}`, padding: 20,
            }}>
              <div style={{ display: 'flex', gap: 14 }}>
                <div style={{ width: 52, height: 52, borderRadius: 14, background: C.s100, flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ height: 16, width: '30%', background: C.s100, borderRadius: 6, marginBottom: 8 }} />
                  <div style={{ height: 12, width: '50%', background: C.s100, borderRadius: 6, marginBottom: 12 }} />
                  <div style={{ display: 'flex', gap: 12 }}>
                    <div style={{ height: 12, width: 80, background: C.s100, borderRadius: 6 }} />
                    <div style={{ height: 12, width: 100, background: C.s100, borderRadius: 6 }} />
                    <div style={{ height: 12, width: 80, background: C.s100, borderRadius: 6 }} />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}