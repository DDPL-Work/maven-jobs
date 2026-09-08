import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FiChevronRight, FiCalendar, FiMonitor, FiSearch } from 'react-icons/fi';

const COLORS = [
  { bg: '#EEF2FF', color: '#4338CA' },
  { bg: '#F0FDF4', color: '#15803D' },
  { bg: '#FDF2F8', color: '#9D174D' },
  { bg: '#FFF7ED', color: '#C2410C' },
  { bg: '#FEF3C7', color: '#92400E' },
  { bg: '#E0E7FF', color: '#3730A3' },
  { bg: '#F5F3FF', color: '#7C3AED' },
];

const getInitials = (name) =>
  String(name || 'C')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0] || '')
    .join('')
    .toUpperCase();

const timeAgo = (dateStr) => {
  if (!dateStr) return '';
  const then = new Date(dateStr).getTime();
  if (isNaN(then)) return '';
  const diffMs = Date.now() - then;
  if (diffMs < 0) return '';
  const mins = Math.floor(diffMs / 60000);
  if (mins < 60) return `${mins} min${mins === 1 ? '' : 's'} ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} day${days === 1 ? '' : 's'} ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} month${months === 1 ? '' : 's'} ago`;
  const years = Math.floor(months / 12);
  const rem = months % 12;
  if (rem === 0) return `${years} year${years === 1 ? '' : 's'} ago`;
  return `${years} year${years === 1 ? '' : 's'} ${rem} month${rem === 1 ? '' : 's'} ago`;
};

export default function FollowingCompanies({ companies = [], totalCount = 0, onViewAll }) {
  const navigate = useNavigate();

  return (
    <div className="pd-card" style={{ padding: '18px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div>
          <p style={{ fontSize: 11, fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 2px' }}>
            Following
          </p>
          <h3 style={{ fontSize: 22, fontWeight: 800, color: '#0F172A', margin: 0, lineHeight: 1.2 }}>
            {totalCount} {totalCount === 1 ? 'Company' : 'Companies'}
          </h3>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {companies.slice(0, 3).map((c, i) => {
          const palette = COLORS[i % COLORS.length];
          return (
            <div key={c.id || i} onClick={() => navigate(`/company/${c.id}`)} style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px',
              borderRadius: 10, background: '#F8FAFC', border: '1px solid #F1F5F9',
              cursor: 'pointer', transition: 'all 0.15s ease',
            }}
              onMouseEnter={e => { e.currentTarget.style.background = '#F1F5F9'; e.currentTarget.style.transform = 'translateX(2px)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#F8FAFC'; e.currentTarget.style.transform = 'translateX(0)'; }}
            >
              <div style={{
                width: 32, height: 32, borderRadius: 8,
                background: palette.bg, color: palette.color,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, fontWeight: 700, flexShrink: 0, overflow: 'hidden',
              }}>
                {c.logoUrl ? (
                  <img src={c.logoUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  getInitials(c.name)
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#0F172A' }}>{c.name}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 1 }}>
                  <span style={{ fontSize: 11, color: '#64748B', display: 'flex', alignItems: 'center', gap: 2 }}>
                    <FiMonitor size={9} /> {c.industry || 'General'}
                  </span>
                  {c.followedAt && (
                    <span style={{ fontSize: 10, color: '#94A3B8', display: 'flex', alignItems: 'center', gap: 2 }}>
                      <FiCalendar size={8} /> {timeAgo(c.followedAt)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        {companies.length === 0 && (
          <div style={{
            padding: '24px 10px', textAlign: 'center', fontSize: 12, color: '#94A3B8',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: '50%', background: '#F1F5F9',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <FiSearch size={15} style={{ color: '#94A3B8' }} />
            </div>
            <span>No companies followed yet</span>
            <span
              onClick={() => navigate('/companies')}
              style={{ color: '#2563EB', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}
            >
              Discover companies
            </span>
          </div>
        )}
      </div>

      {companies.length > 0 && (
        <button
          onClick={() => (onViewAll ? onViewAll() : navigate('/companies'))}
          style={{
            width: '100%', marginTop: 12, padding: '8px 12px', borderRadius: 8, border: '1px solid #E2E8F0',
            background: '#fff', color: '#2563EB', fontSize: 12, fontWeight: 600,
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = '#F8FAFC'; e.currentTarget.style.borderColor = '#CBD5E1'; }}
          onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = '#E2E8F0'; }}
        >
          View All <FiChevronRight size={13} />
        </button>
      )}
    </div>
  );
}
