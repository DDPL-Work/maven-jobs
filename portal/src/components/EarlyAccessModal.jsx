import React, { useState, useEffect } from 'react';
import {
  FiX, FiBriefcase, FiMapPin, FiZap, FiCheckCircle,
  FiStar, FiClock, FiSend, FiUsers, FiTrendingUp, FiLock, FiAward, FiLoader
} from 'react-icons/fi';
import authService from '../services/authService';
import './EarlyAccessModal.css';

const FEATURES = [
  {
    icon: <FiAward />,
    title: 'Discover hidden roles',
    desc: 'Get access to roles from top companies before they go public on any job platform.',
    color: '#10b981'
  },
  {
    icon: <FiTrendingUp />,
    title: 'Share early interest',
    desc: 'Stay ahead by signaling your interest directly to recruiters running fresh searches.',
    color: '#3b82f6'
  },
  {
    icon: <FiUsers />,
    title: 'Get noticed first',
    desc: "If your profile is a match, you appear at the top of the recruiter's candidate list.",
    color: '#8b5cf6'
  },
  {
    icon: <FiLock />,
    title: 'Confidential companies',
    desc: 'Company names are revealed once you are shortlisted for complete privacy assurance.',
    color: '#f59e0b'
  }
];

const colorPalette = [
  { bg: '#EEF2FF', color: '#4338CA' },
  { bg: '#FFF7ED', color: '#C2410C' },
  { bg: '#F0FDF4', color: '#15803D' },
  { bg: '#EFF6FF', color: '#1D4ED8' },
  { bg: '#FDF2F8', color: '#9D174D' },
  { bg: '#FEF3C7', color: '#92400E' },
  { bg: '#E0E7FF', color: '#3730A3' },
];

const getInitials = (name) =>
  String(name || 'C')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0] || '')
    .join('')
    .toUpperCase();

export default function EarlyAccessModal({ isOpen, onClose, jobs = [] }) {
  const [sharedInterests, setSharedInterests] = useState([]);
  const [sharingId, setSharingId] = useState(null);
  const [notification, setNotification] = useState(null);
  const [activeFilter, setActiveFilter] = useState('All');

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleShareInterest = async (id) => {
    if (sharedInterests.includes(id) || sharingId) return;
    setSharingId(id);
    try {
      await authService.shareInterest(id);
      setSharedInterests(prev => [...prev, id]);
      setNotification("Interest shared! We'll notify you when the recruiter responds.");
    } catch {
      setNotification("Something went wrong. Please try again.");
    }
    setSharingId(null);
  };

  // Normalize raw DB strings like "PART_TIME", "on site", "On Site/Hybrid/ Remote" to clean labels
  const normalizeLabel = (raw) => {
    if (!raw) return null;
    const map = {
      'full_time': 'Full-Time', 'fulltime': 'Full-Time', 'full-time': 'Full-Time',
      'part_time': 'Part-Time', 'parttime': 'Part-Time', 'part-time': 'Part-Time',
      'contract': 'Contract', 'freelance': 'Freelance', 'internship': 'Internship',
      'remote': 'Remote', 'work from home': 'Remote', 'wfh': 'Remote',
      'hybrid': 'Hybrid',
      'onsite': 'On-Site', 'on site': 'On-Site', 'on-site': 'On-Site', 'office': 'On-Site',
    };
    const key = raw.toLowerCase().replace(/[/_\s]+/g, ' ').trim();
    // Check exact map first
    if (map[key]) return map[key];
    // Check partial matches for compound values like "On Site/Hybrid/ Remote"
    if (key.includes('remote') && key.includes('hybrid')) return 'Hybrid/Remote';
    if (key.includes('remote')) return 'Remote';
    if (key.includes('hybrid')) return 'Hybrid';
    if (key.includes('site') || key.includes('onsite')) return 'On-Site';
    if (key.includes('full')) return 'Full-Time';
    if (key.includes('part')) return 'Part-Time';
    // Fallback: Title Case, strip underscores
    return raw.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()).trim();
  };

  const displayJobs = jobs.length > 0 ? jobs : [];

  // Build clean, deduplicated filters from workplaceType + jobType
  const seen = new Set();
  const filterMap = new Map(); // normalized label -> original raw value for matching
  displayJobs.forEach(j => {
    [j.workplaceType, j.jobType].filter(Boolean).forEach(raw => {
      const label = normalizeLabel(raw);
      if (label && !seen.has(label)) { seen.add(label); filterMap.set(label, raw); }
    });
  });

  // Only show filters that make sense (max 5 + All)
  const PRIORITY = ['Remote', 'Hybrid', 'On-Site', 'Full-Time', 'Part-Time', 'Contract', 'Internship', 'Hybrid/Remote'];
  const sortedFilters = [...filterMap.keys()].sort((a, b) => {
    const ai = PRIORITY.indexOf(a); const bi = PRIORITY.indexOf(b);
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  }).slice(0, 5);
  const filters = ['All', ...sortedFilters];

  const countForFilter = (f) => f === 'All'
    ? displayJobs.length
    : displayJobs.filter(j => normalizeLabel(j.workplaceType) === f || normalizeLabel(j.jobType) === f).length;

  const filteredJobs = activeFilter === 'All'
    ? displayJobs
    : displayJobs.filter(j => normalizeLabel(j.workplaceType) === activeFilter || normalizeLabel(j.jobType) === activeFilter);


  return (
    <div className="ea-overlay" onClick={onClose}>
      <div className="ea-container" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="ea-header">
          <div className="ea-header-badge">
            <FiSend size={14} />
            <span>EXCLUSIVE ACCESS</span>
          </div>
          <h1 className="ea-header-title">
            <span className="ea-count-highlight">{displayJobs.length}</span> Early Access Roles
            <br />from Top Companies
          </h1>
          <p className="ea-header-sub">
            Exclusive opportunities discovered before they go public — curated just for you.
          </p>
          <div className="ea-header-stats">
            <div className="ea-hstat">
              <strong>{displayJobs.length}</strong>
              <span>Open Roles</span>
            </div>
            <div className="ea-hstat-divider" />
            <div className="ea-hstat">
              <strong>{sharedInterests.length}</strong>
              <span>Interests Shared</span>
            </div>
            <div className="ea-hstat-divider" />
            <div className="ea-hstat">
              <strong>Top 50</strong>
              <span>Companies</span>
            </div>
          </div>
          <button className="ea-close" onClick={onClose}><FiX size={20} /></button>
        </div>

        {/* Filters */}
        {filters.length > 1 && (
          <div className="ea-filters">
            <span className="ea-filters-label">Filter:</span>
            {filters.map(f => {
              const count = countForFilter(f);
              return (
                <button
                  key={f}
                  className={`ea-filter-btn ${activeFilter === f ? 'active' : ''}`}
                  onClick={() => setActiveFilter(f)}
                >
                  {f}
                  <span className="ea-filter-count">{count}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Content */}
        <div className="ea-content">
          {/* Jobs List */}
          <div className="ea-jobs-list">
            {filteredJobs.length > 0 ? filteredJobs.map((job, idx) => {
              const palette = colorPalette[idx % colorPalette.length];
              const isShared = sharedInterests.includes(job.id);
              const salaryText = job.salaryFormatted
                || (job.salaryMin && job.salaryMax
                  ? `${Math.round(job.salaryMin / 100000)}L – ${Math.round(job.salaryMax / 100000)}L P.A.`
                  : 'Salary not disclosed');
              const expText = job.experience || job.exp || '0–3 Yrs';

              return (
                <div className={`ea-job-card ${isShared ? 'shared' : ''}`} key={job.id || idx}>
                  <div className="ea-job-card-top">
                    <div className="ea-job-logo" style={{ background: palette.bg, color: palette.color }}>
                      {(job.title || 'J').substring(0, 2).toUpperCase()}
                    </div>
                    <div className="ea-job-title-block">
                      <h3>{job.title}</h3>
                      <p>{job.company || job.companyName}</p>
                    </div>
                    <div className="ea-job-top-right">
                      <span className="ea-job-time">
                        <FiClock size={12} /> {job.ago || job.lastUpdated || 'Recent'}
                      </span>
                      {isShared && (
                        <span className="ea-shared-badge"><FiCheckCircle size={12} /> Shared</span>
                      )}
                    </div>
                  </div>

                  {/* Tags Row */}
                  <div className="ea-job-tags-row">
                    <span className="ea-rating-badge">
                      <FiStar size={11} /> {job.rating || '4.2'}+
                    </span>
                    {(job.tags || []).slice(0, 3).map((t, i) => (
                      <span key={i} className="ea-tag">{normalizeLabel(t) || t}</span>
                    ))}
                  </div>

                  {/* Meta */}
                  <div className="ea-job-meta">
                    <span><FiBriefcase size={13} /> {expText}</span>
                    <span><FiZap size={13} /> {salaryText}</span>
                    <span><FiMapPin size={13} /> {job.loc || job.location || 'Remote'}</span>
                  </div>

                  {/* Skills */}
                  {(job.skills && job.skills.length > 0) && (
                    <div className="ea-skills">
                      {job.skills.slice(0, 6).map((s, i) => (
                        <span key={i} className="ea-skill-chip">{s}</span>
                      ))}
                      {job.skills.length > 6 && (
                        <span className="ea-skill-more">+{job.skills.length - 6}</span>
                      )}
                    </div>
                  )}

                  {/* Bottom Row */}
                  <div className="ea-job-bottom">
                    <div className="ea-hiring-info">
                      <p className="ea-hiring-label">Hiring from one of these companies</p>
                      <div className="ea-logos">
                        {(job.hiringCompanies || []).slice(0, 6).map((hc, i) => (
                          <div key={hc.id || i} className="ea-logo-avatar" title={hc.name}>
                            {hc.logoUrl ? (
                              <img src={hc.logoUrl} alt={hc.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                            ) : (
                              getInitials(hc.name)
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                    <button
                      className={`ea-share-btn ${isShared ? 'done' : ''} ${sharingId === (job.id || idx) ? 'loading' : ''}`}
                      onClick={() => handleShareInterest(job.id || idx)}
                      disabled={isShared || sharingId === (job.id || idx)}
                    >
                      {sharingId === (job.id || idx) ? (
                        <><FiLoader size={15} className="ea-spinner" /> Sharing...</>
                      ) : isShared ? (
                        <><FiCheckCircle size={15} /> Interest Shared</>
                      ) : (
                        <><FiSend size={15} /> Share Interest</>
                      )}
                    </button>
                  </div>
                </div>
              );
            }) : (
              <div className="ea-empty-state">
                <div className="ea-empty-icon"><FiBriefcase size={28} /></div>
                <h3>No early access roles right now</h3>
                <p>We're constantly curating new exclusive roles. Check back soon!</p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <aside className="ea-sidebar">
            <div className="ea-sidebar-card">
              <div className="ea-sidebar-top">
                <div className="ea-sidebar-icon-wrap">
                  <FiSend size={20} />
                </div>
                <div className="ea-sidebar-dot" />
              </div>
              <h3 className="ea-sidebar-title">What makes Early Access unique?</h3>

              <div className="ea-features">
                {FEATURES.map((f, i) => (
                  <div className="ea-feature-item" key={i}>
                    <div className="ea-feature-icon" style={{ background: f.color + '20', color: f.color }}>
                      {f.icon}
                    </div>
                    <div>
                      <h4>{f.title}</h4>
                      <p>{f.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="ea-sidebar-divider" />

              <div className="ea-faq-box">
                <div className="ea-faq-icon"><FiLock size={16} /></div>
                <div>
                  <h4>Can I know the exact company?</h4>
                  <p>
                    These roles are confidential to protect both parties. If you're shortlisted,
                    the recruiter will personally share full details.
                  </p>
                </div>
              </div>

              {displayJobs.length > 0 && (
                <div className="ea-sidebar-progress">
                  <div className="ea-progress-label">
                    <span>Interests shared</span>
                    <strong>{sharedInterests.length} / {displayJobs.length}</strong>
                  </div>
                  <div className="ea-progress-track">
                    <div
                      className="ea-progress-fill"
                      style={{ width: `${(sharedInterests.length / displayJobs.length) * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </aside>
        </div>

        {/* Toast Notification */}
        {notification && (
          <div className="ea-toast">
            <FiCheckCircle size={16} />
            <span>{notification}</span>
          </div>
        )}
      </div>
    </div>
  );
}
