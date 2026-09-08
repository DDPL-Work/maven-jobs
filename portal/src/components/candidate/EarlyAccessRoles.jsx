import React, { useState } from 'react';
import { FiSend, FiChevronRight, FiInfo, FiStar, FiBriefcase, FiZap, FiMapPin, FiCheckCircle } from 'react-icons/fi';
import authService from '../../services/authService';

const COLORS = [
  { bg: '#EEF2FF', color: '#4338CA' },
  { bg: '#FFF7ED', color: '#C2410C' },
  { bg: '#F0FDF4', color: '#15803D' },
  { bg: '#EFF6FF', color: '#1D4ED8' },
  { bg: '#FDF2F8', color: '#9D174D' },
];

const getInitials = (name) =>
  String(name || 'C')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0] || '')
    .join('')
    .toUpperCase();

export default function EarlyAccessRoles({ earlyAccess = [], onViewAll }) {
  const [sharedIds, setSharedIds] = useState(new Set());
  const [sharingId, setSharingId] = useState(null);

  const handleShare = async (job) => {
    if (sharedIds.has(job.id) || sharingId) return;
    setSharingId(job.id);
    try {
      await authService.shareInterest(job.id);
      setSharedIds(prev => new Set(prev).add(job.id));
    } catch { /* ignore */ }
    setSharingId(null);
  };

  return (
    <div className="pd-card pd-early-card">
      <div className="pd-section-header">
        <div className="pd-early-hd">
          <div className="pd-early-icon-wrap"><FiSend size={20} /></div>
          <div>
            <h3>{earlyAccess.length} Early access roles <FiInfo size={13} className="pd-info-icon" /></h3>
            <p>Exclusive roles before they go public</p>
          </div>
        </div>
        <button className="pd-text-btn" onClick={onViewAll}>View all <FiChevronRight size={14} /></button>
      </div>
      <div className="pd-scroll-wrap">
        <button className="pd-scroll-btn left" onClick={() => {
          const el = document.querySelector('.pd-early-scroll');
          if (el) el.scrollBy({ left: -300, behavior: 'smooth' });
        }}><FiChevronRight size={18} style={{ transform: 'rotate(180deg)' }} /></button>
        <div className="pd-early-scroll">
          {earlyAccess.length > 0 ? earlyAccess.map((r, i) => {
            const isShared = sharedIds.has(r.id);
            return (
              <div className="pd-early-role-card" key={r.id || i}>
                <div className="pd-early-role-badge">{r.tags?.[0] || 'Featured'}</div>
                <h4>{r.title}</h4>
                <p className="pd-early-type">{r.company}</p>
                <div className="pd-early-tags">
                  <span className="pd-early-rating"><FiStar size={11} /> {r.rating || '4.0'}</span>
                  {(r.tags || []).map(t => <span key={t} className="pd-early-tag">{t}</span>)}
                </div>
                <div className="pd-early-meta">
                  <span><FiBriefcase size={12} /> {r.experience || '0-3 Yrs'}</span>
                  <span><FiZap size={12} /> {r.salaryFormatted || '4-8 L P.A.'}</span>
                  <span><FiMapPin size={12} /> {r.loc || r.location || 'Remote'}</span>
                </div>
                {(r.hiringCompanies && r.hiringCompanies.length > 0) && (
                  <div className="pd-early-hiring">
                    <p>Hiring from one of these</p>
                    <div className="pd-early-logos">
                      {r.hiringCompanies.slice(0, 5).map((hc, idx) => {
                        const pal = COLORS[idx % COLORS.length];
                        return (
                          <div
                            key={hc.id || idx}
                            className="pd-early-logo"
                            title={hc.name}
                            style={{ background: pal.bg, color: pal.color }}
                          >
                            {hc.logoUrl ? (
                              <img src={hc.logoUrl} alt={hc.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                            ) : (
                              getInitials(hc.name)
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                <button
                  className={`pd-early-cta ${isShared ? 'shared' : ''}`}
                  onClick={() => handleShare(r)}
                  disabled={isShared || sharingId === r.id}
                >
                  {isShared ? (
                    <><FiCheckCircle size={14} /> Interested</>
                  ) : (
                    <><FiSend size={14} /> Share interest</>
                  )}
                </button>
              </div>
            );
          }) : (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: '#64748b', fontSize: '13px', width: '100%' }}>
              No early access roles available right now.
            </div>
          )}
        </div>
        <button className="pd-scroll-btn right" onClick={() => {
          const el = document.querySelector('.pd-early-scroll');
          if (el) el.scrollBy({ left: 300, behavior: 'smooth' });
        }}><FiChevronRight size={18} /></button>
      </div>
    </div>
  );
}
