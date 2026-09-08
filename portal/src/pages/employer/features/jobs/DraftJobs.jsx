import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiFileText, FiTrash2, FiEdit3, FiCalendar, FiClock,
  FiAlertCircle,
} from 'react-icons/fi';
import EmployerLayout from '../../../../components/employer/EmployerLayout';
import EmployerBreadcrumb from '../../../../components/employer/EmployerBreadcrumb';
import { getDrafts, deleteDraft } from '../../../../services/draftJobService';

const C = {
  navy: '#002366',
  s50: '#f8fafc', s100: '#f1f5f9', s200: '#e2e8f0',
  s300: '#cbd5e1', s400: '#94a3b8', s500: '#64748b',
  s600: '#475569', s700: '#334155', s800: '#1e293b', s900: '#0f172a',
};

const Btn = ({ children, variant = 'primary', ...rest }) => {
  const map = {
    primary: { bg: 'linear-gradient(135deg,#001a50,#0F3DB5)', color: '#fff', border: 'none', shadow: '0 4px 14px rgba(0,35,102,0.25)' },
    danger: { bg: '#FEF2F2', color: '#DC2626', border: '1.5px solid #FECACA', shadow: 'none' },
    ghost: { bg: '#F8FAFC', color: C.s500, border: '1.5px solid #E2E8F0', shadow: 'none' },
  };
  const s = map[variant] || map.primary;
  return (
    <button {...rest} style={{
      display: 'inline-flex', alignItems: 'center', gap: 7,
      padding: '10px 18px', borderRadius: 12, fontSize: 13, fontWeight: 700,
      fontFamily: "'DM Sans',sans-serif", cursor: 'pointer',
      background: s.bg, color: s.color, border: s.border, boxShadow: s.shadow,
      transition: 'all 0.18s', ...rest.style,
    }}
      onMouseEnter={e => { if (!rest.disabled) { e.currentTarget.style.transform = 'translateY(-1px)'; if (variant === 'primary') e.currentTarget.style.boxShadow = '0 8px 22px rgba(0,35,102,0.35)'; } }}
      onMouseLeave={e => { if (!rest.disabled) { e.currentTarget.style.transform = 'translateY(0)'; if (variant === 'primary') e.currentTarget.style.boxShadow = s.shadow; } }}
    >
      {children}
    </button>
  );
};

export default function DraftJobs() {
  const navigate = useNavigate();
  const [drafts, setDrafts] = useState([]);
  const [confirmDelete, setConfirmDelete] = useState(null);

  useEffect(() => { setDrafts(getDrafts()); }, []);

  const handleContinue = useCallback((draftId) => {
    navigate(`/post-job?draftId=${draftId}`);
  }, [navigate]);

  const handleDelete = useCallback((draftId) => {
    deleteDraft(draftId);
    setDrafts(getDrafts());
    setConfirmDelete(null);
  }, []);

  const formatDate = (ts) => {
    try {
      const d = new Date(ts);
      return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch {
      return '—';
    }
  };

  const sortedDrafts = useMemo(() =>
    [...drafts].sort((a, b) => (b.savedAt || 0) - (a.savedAt || 0)),
    [drafts]
  );

  return (
    <EmployerLayout
      activeTab="jobs"
      containerWidth={960}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        *,*::before,*::after{box-sizing:border-box}
      `}</style>

      <EmployerBreadcrumb items={[
        { label: 'Dashboard', path: '/employer-dashboard' },
        { label: 'Jobs', path: '/post-job' },
        { label: 'Draft Jobs' },
      ]} />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: C.s900, letterSpacing: '-0.02em' }}>Draft Jobs</h2>
          <p style={{ margin: '4px 0 0', fontSize: 13.5, color: C.s500, fontWeight: 500 }}>
            {sortedDrafts.length} draft{drafts.length !== 1 ? 's' : ''} saved
          </p>
        </div>
        <Btn variant="primary" onClick={() => navigate('/post-job')}>
          <FiFileText size={15} /> New Job Posting
        </Btn>
      </div>

      {sortedDrafts.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '80px 20px', borderRadius: 20,
          border: '1.5px dashed #E2E8F0', background: '#F8FAFC',
        }}>
          <div style={{
            width: 64, height: 64, borderRadius: 16,
            background: '#EEF2FF', margin: '0 auto 16px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: C.navy,
          }}>
            <FiFileText size={28} />
          </div>
          <h3 style={{ margin: '0 0 6px', fontSize: 17, fontWeight: 800, color: C.s800 }}>No draft jobs yet</h3>
          <p style={{ margin: '0 0 24px', fontSize: 13.5, color: C.s500, maxWidth: 320, marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.6 }}>
            When you start posting a job and exit before completing it, your progress will be saved here.
          </p>
          <Btn variant="primary" onClick={() => navigate('/post-job')}>
            <FiFileText size={15} /> Start a Job Posting
          </Btn>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {sortedDrafts.map((draft) => (
            <div key={draft.draftId} style={{
              background: '#fff', borderRadius: 16, border: '1px solid #E2E8F0',
              padding: '20px 24px', transition: 'all 0.18s',
              display: 'flex', alignItems: 'center', gap: 16,
              boxShadow: '0 1px 4px rgba(0,0,0,0.03)',
            }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,35,102,0.07)'; e.currentTarget.style.borderColor = 'rgba(0,35,102,0.15)'; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.03)'; e.currentTarget.style.borderColor = '#E2E8F0'; }}
            >
              <div style={{
                width: 44, height: 44, borderRadius: 12,
                background: '#FFF7ED', border: '1px solid #FED7AA',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, color: '#EA580C',
              }}>
                <FiEdit3 size={20} />
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: C.s900, marginBottom: 2 }}>
                  {draft.jobTitle?.trim() || draft.companyName?.trim() || 'Untitled Draft'}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                  {draft.companyName?.trim() && (
                    <span style={{ fontSize: 12.5, fontWeight: 600, color: C.s500 }}>{draft.companyName}</span>
                  )}
                  {draft.industry && (
                    <>
                      <span style={{ fontSize: 10, color: C.s300 }}>|</span>
                      <span style={{ fontSize: 12.5, fontWeight: 600, color: C.s500 }}>{draft.industry}</span>
                    </>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 8, flexWrap: 'wrap' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11.5, fontWeight: 600, color: C.s400 }}>
                    <FiCalendar size={12} /> {formatDate(draft.savedAt)}
                  </span>
                  {draft.savedAt && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11.5, fontWeight: 600, color: C.s400 }}>
                      <FiClock size={12} /> Step {draft.step || 1}/4
                    </span>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                <Btn variant="primary" onClick={() => handleContinue(draft.draftId)} style={{ padding: '9px 16px', fontSize: 12.5 }}>
                  <FiEdit3 size={14} /> Continue
                </Btn>
                <Btn variant="ghost" onClick={() => setConfirmDelete(draft.draftId)} style={{ padding: '9px 14px', fontSize: 12.5, color: '#EF4444', borderColor: '#FECACA', background: '#FEF2F2' }}>
                  <FiTrash2 size={14} /> Delete
                </Btn>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Confirm Delete Modal */}
      {confirmDelete && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
        }} onClick={() => setConfirmDelete(null)}>
          <div style={{
            background: '#fff', borderRadius: 24, maxWidth: 380, width: '100%',
            padding: '36px 32px 28px', textAlign: 'center',
            boxShadow: '0 32px 80px rgba(0,0,0,0.2)',
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{
              width: 56, height: 56, borderRadius: '50%',
              background: '#FEF2F2', margin: '0 auto 16px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <FiAlertCircle size={28} color="#DC2626" />
            </div>
            <h3 style={{ margin: '0 0 8px', fontSize: 17, fontWeight: 800, color: C.s900 }}>Delete Draft?</h3>
            <p style={{ margin: '0 0 24px', fontSize: 13.5, color: C.s500, lineHeight: 1.6 }}>
              This draft will be permanently removed. You won't be able to recover it.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <Btn variant="ghost" onClick={() => setConfirmDelete(null)} style={{ flex: 1, justifyContent: 'center' }}>
                Cancel
              </Btn>
              <Btn variant="danger" onClick={() => handleDelete(confirmDelete)} style={{ flex: 1, justifyContent: 'center' }}>
                <FiTrash2 size={14} /> Delete
              </Btn>
            </div>
          </div>
        </div>
      )}
    </EmployerLayout>
  );
}