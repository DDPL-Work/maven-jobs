import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiFilter, FiSearch, FiBriefcase, FiMoreVertical, FiClock, FiPlus, FiFolder } from 'react-icons/fi';
import EmployerLayout from '../../../../components/employer/EmployerLayout';
import EmployerBreadcrumb from '../../../../components/employer/EmployerBreadcrumb';
import { useFolders } from '../../../../hooks/useFolderQueries';

export default function ResdexRequirements() {
  const navigate = useNavigate();
  const { data: requirements = [], isLoading, isError } = useFolders({ limit: 100, folderType: 'REQUIREMENT' });
  const [searchName, setSearchName] = useState('');
  const [filterBy, setFilterBy] = useState('me'); // 'me' or 'anyone'
  const [statusFilter, setStatusFilter] = useState({ open: true, closed: false });
  const [tagsFilter, setTagsFilter] = useState({ prospect: false, shortlisted: false, rejected: false });

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

      // Filter by (Created by me vs Anyone)
      // Since we don't have the current user context directly here, we'll approximate:
      // 'me' -> mostly private folders (not shared/public) or we just assume all fetched are 'me' normally unless public
      // In a real app, you'd check `req.createdBy === currentUser.id`
      if (filterBy === 'me' && req.isPublic) return false;

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

  return (
    <EmployerLayout>
      <div style={{ background: '#f8fafc', minHeight: 'calc(100vh - 70px)' }}>
        <EmployerBreadcrumb
          items={[
            { label: 'Dashboard', path: '/employer-dashboard' },
            { label: 'Resdex', path: '/resdex' },
            { label: 'Resdex Requirements', path: null },
          ]}
        />
        
        <div style={{ maxWidth: 1400, margin: '0 auto', padding: '24px 32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, background: '#fff', padding: '16px 24px', borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', margin: 0 }}>Resdex Requirements</h1>
            <button style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 8,
              background: '#002366', color: '#fff', fontWeight: 600, fontSize: 14, border: 'none', cursor: 'pointer'
            }}>
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
              
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, paddingBottom: 16, borderBottom: '1px solid #f1f5f9' }}>
                <span style={{ fontSize: 13, color: '#0f172a', fontWeight: 600 }}>{activeFiltersCount} Filter applied</span>
                {activeFiltersCount > 0 && (
                  <button onClick={clearAllFilters} style={{ background: 'none', border: 'none', color: '#2563eb', fontSize: 13, cursor: 'pointer', fontWeight: 500 }}>
                    Clear all
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
                        <button style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 4 }}><FiMoreVertical size={18} /></button>
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
    </EmployerLayout>
  );
}
