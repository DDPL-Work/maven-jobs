import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { FiChevronRight, FiHome, FiMail, FiClock, FiUser, FiArrowLeft, FiChevronLeft, FiChevronRight as FiChevronRightIcon, FiMessageSquare, FiTrash2, FiMapPin, FiBriefcase, FiDollarSign, FiHelpCircle } from 'react-icons/fi';
import authService from '../../../../services/authService';
import CandidateHeader from '../../../../components/common/CandidateHeader';
import LandingFooter from '../../../../components/LandingFooter';
import './MIvitesPage.css';

const PAGE_SIZE = 5;

function getInitials(name) {
  if (!name) return '?';
  return name.split(/\s+/).filter(Boolean).map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

function getGradient(name) {
  let hash = 0;
  const s = name || 'Company';
  for (let i = 0; i < s.length; i++) hash = s.charCodeAt(i) + ((hash << 5) - hash);
  const h = Math.abs(hash) % 360;
  return `linear-gradient(135deg, hsl(${h},70%,65%), hsl(${(h + 40) % 360},70%,55%))`;
}

export default function MIvitesPage() {
  const [nvites, setNvites] = useState([]);
  const [selected, setSelected] = useState(null);
  const [mobileView, setMobileView] = useState('list'); // 'list' | 'detail'
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [actionStates, setActionStates] = useState({}); // { [id]: 'applied' | 'not_interested' | 'deleted' }
  const [showHelp, setShowHelp] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await authService.getNvites();
      if (res?.success && Array.isArray(res.data)) {
        setNvites(res.data);
        if (res.data.length > 0) setSelected(res.data[0]);
      }
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => { setPage(1); }, [nvites]);

  const visibleNvites = nvites.filter(inv => actionStates[inv.id] !== 'deleted');
  const totalPages = Math.max(1, Math.ceil(visibleNvites.length / PAGE_SIZE));
  const startIdx = (page - 1) * PAGE_SIZE;
  const pageItems = visibleNvites.slice(startIdx, startIdx + PAGE_SIZE);
  // Ensure selected nvite is not deleted, otherwise fallback
  const selectedNvite = (selected && actionStates[selected.id] !== 'deleted') 
    ? selected 
    : (visibleNvites[0] || null);

  const handleAction = (id, action) => {
    setActionStates(prev => ({ ...prev, [id]: action }));
    if (action === 'deleted') {
      if (selected?.id === id) setSelected(null); // It will fallback to visibleNvites[0]
    }
  };

  return (
    <div className="mv-page">
      <CandidateHeader />
      
      <div className="mv-container">
        <div className="mv-header-section">
          <div className="mv-header-left">
            <div className="mv-header-icon-box">
              <FiMessageSquare size={24} color="#143f86" />
            </div>
            <div>
              <h1 className="mv-title">MIvites: Your invitation to apply</h1>
              <p className="mv-subtitle">Recruiters have chosen you from a large pool of candidates to apply to these jobs</p>
            </div>
          </div>
          
          <div className="mv-help-wrapper">
            <button className="mv-help-trigger" onClick={() => setShowHelp(!showHelp)}>
              How do MIvites work? <FiHelpCircle size={15} />
            </button>
            {showHelp && (
              <>
                <div className="mv-help-overlay" onClick={() => setShowHelp(false)} />
                <div className="mv-help-popover">
                  <div className="mv-help-timeline">
                    <div className="mv-ht-item">
                      <div className="mv-ht-icon mv-ht-check">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
                      </div>
                      <div className="mv-ht-text">Recruiters search for candidates based on their requirements</div>
                    </div>
                    <div className="mv-ht-item">
                      <div className="mv-ht-icon mv-ht-check">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
                      </div>
                      <div className="mv-ht-text">They choose the most relevant candidates matching the job</div>
                    </div>
                    <div className="mv-ht-item">
                      <div className="mv-ht-icon mv-ht-circle"></div>
                      <div className="mv-ht-text">They send an invitation to the chosen candidates to apply to the job</div>
                    </div>
                  </div>
                  <button className="mv-help-close" onClick={() => setShowHelp(false)}>Got it</button>
                </div>
              </>
            )}
          </div>
        </div>

        {!loading && (
          <div className="mv-filter-bar">
            <button className="mv-filter-btn active">All ({visibleNvites.length})</button>
          </div>
        )}

        {loading ? (
          <div className="mv-loading">Loading...</div>
        ) : visibleNvites.length === 0 ? (
          <div className="mv-empty">
            <FiMail size={40} />
            <h3>No invitations yet</h3>
            <p>When a recruiter sends you an invitation, it will appear here.</p>
            <Link to="/dashboard" className="mv-back-link"><FiArrowLeft size={14} /> Back to Dashboard</Link>
          </div>
        ) : (
          <div className="mv-layout">
            <div className={`mv-list-panel ${mobileView === 'detail' ? 'hide-on-mobile' : ''}`}>
              {pageItems.map(inv => (
                <button
                  key={inv.id}
                  className={`mv-list-item ${selectedNvite?.id === inv.id ? 'active' : ''}`}
                  onClick={() => { setSelected(inv); setMobileView('detail'); }}
                >
                  {inv.logoUrl ? (
                    <img src={inv.logoUrl} alt="" className="mv-avatar-img" />
                  ) : (
                    <div className="mv-avatar" style={{ background: getGradient(inv.company), color: '#fff' }}>
                      {getInitials(inv.company)}
                    </div>
                  )}
                  <div className="mv-item-info">
                    <div className="mv-item-title">{inv.title}</div>
                    <div className="mv-item-preview">
                      {(inv.body || '').replace(/\s+/g, ' ').trim().substring(0, 60)}
                      {(inv.body || '').length > 60 ? '...' : ''}
                    </div>
                    <div className="mv-item-meta">
                      <strong>{inv.company}</strong>
                      <span className="mv-meta-sep">&middot;</span>
                      <FiClock size={11} />
                      <span>{inv.ago}</span>
                    </div>
                    {actionStates[inv.id] === 'applied' && (
                      <div className="mv-item-badge mv-item-badge-success">Applied</div>
                    )}
                  </div>
                </button>
              ))}
              {totalPages > 1 && (
                <div className="mv-pagination">
                  <button
                    className="mv-page-btn"
                    disabled={page <= 1}
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                  >
                    <FiChevronLeft size={16} />
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                    <button
                      key={p}
                      className={`mv-page-btn ${p === page ? 'active' : ''}`}
                      onClick={() => setPage(p)}
                    >
                      {p}
                    </button>
                  ))}
                  <button
                    className="mv-page-btn"
                    disabled={page >= totalPages}
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  >
                    <FiChevronRightIcon size={16} />
                  </button>
                </div>
              )}
            </div>

            <div className={`mv-detail-panel ${mobileView === 'list' ? 'hide-on-mobile' : ''}`}>
              {selectedNvite && (
                <>
                  <button className="mv-mobile-back" onClick={() => setMobileView('list')}>
                    <FiArrowLeft size={16} /> Back to Invitations
                  </button>
                  <div className="mv-detail-header">
                  {selectedNvite.logoUrl ? (
                    <img src={selectedNvite.logoUrl} alt="" className="mv-detail-avatar-img" />
                  ) : (
                    <div className="mv-detail-avatar" style={{ background: getGradient(selectedNvite.company), color: '#fff' }}>
                      {getInitials(selectedNvite.company)}
                    </div>
                  )}
                    <div>
                      <h2>{selectedNvite.title}</h2>
                      <div className="mv-detail-meta">
                        <FiUser size={13} /> {selectedNvite.recruiterName} from <strong>{selectedNvite.company}</strong>
                        <span className="mv-meta-sep">&middot;</span>
                        <FiClock size={11} />
                        <span>{selectedNvite.ago}</span>
                      </div>
                      <div className="mv-detail-meta" style={{ marginTop: '8px' }}>
                        <FiMapPin size={13} /> {selectedNvite.location || 'Remote'}
                        <span className="mv-meta-sep">&middot;</span>
                        <FiBriefcase size={13} /> {selectedNvite.experience || '0 - 3 Years'}
                        <span className="mv-meta-sep">&middot;</span>
                        <FiDollarSign size={13} /> {selectedNvite.salary || 'Not disclosed'}
                      </div>
                    </div>
                  </div>
                  
                  <div className="mv-detail-actions">
                    <div className="mv-action-group">
                      {actionStates[selectedNvite.id] === 'applied' ? (
                        <button className="mv-btn mv-btn-applied" disabled>Applied</button>
                      ) : (
                        <>
                          <button 
                            className="mv-btn mv-btn-outline" 
                            onClick={() => handleAction(selectedNvite.id, 'not_interested')}
                          >
                            Not interested
                          </button>
                          <button 
                            className="mv-btn mv-btn-primary" 
                            onClick={() => handleAction(selectedNvite.id, 'applied')}
                          >
                            Apply
                          </button>
                        </>
                      )}
                    </div>
                    <button 
                      className="mv-btn-icon-delete" 
                      onClick={() => handleAction(selectedNvite.id, 'deleted')} 
                      title="Delete NVite"
                    >
                      <FiTrash2 size={18} />
                    </button>
                  </div>

                  <div className="mv-detail-body">
                    <h3>Job description</h3>
                    {(selectedNvite.body || '').split('\n').map((line, i) => (
                      line.trim() ? <p key={i}>{line}</p> : <br key={i} />
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      <LandingFooter />
    </div>
  );
}
