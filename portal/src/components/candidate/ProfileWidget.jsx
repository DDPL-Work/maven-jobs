import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FiEye, FiCalendar, FiBriefcase, FiMapPin, FiCheck } from 'react-icons/fi';

const CIRCUMFERENCE = 213.628;

const getRingConfig = (pct) => {
  if (pct >= 100) return { color: '#10B981', glow: true, label: null };
  if (pct >= 90) return { color: '#10B981', glow: false, label: `${pct}%` };
  if (pct >= 70) return { color: '#3B82F6', glow: false, label: `${pct}%` };
  return { color: '#94A3B8', glow: false, label: `${pct}%` };
};

export default function ProfileWidget({ user, profileCompletion = 0 }) {
  const navigate = useNavigate();
  const pct = Math.min(100, Math.max(0, Number(profileCompletion) || 0));
  const { color: ringColor, glow, label } = getRingConfig(pct);
  const dashOffset = CIRCUMFERENCE - (pct / 100) * CIRCUMFERENCE;

  const initials = user?.name
    ? user.name.split(' ').filter(Boolean).map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  const lastUpdated = user?.updatedAt
    ? new Date(user.updatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : 'Today';

  return (
    <div className="pd-card" style={{ padding: 0, overflow: 'hidden' }}>
      {/* Cover strip */}
      <div style={{
        height: 60,
        background: user?.coverPic
          ? `url(${user.coverPic}) center/cover no-repeat`
          : 'linear-gradient(135deg, #1E40AF 0%, #3B82F6 50%, #60A5FA 100%)',
        position: 'relative',
      }}>
        {/* Avatar + Ring container */}
        <div style={{
          position: 'absolute', bottom: -32, left: '50%', transform: 'translateX(-50%)',
          width: 80, height: 80,
        }}>
          {/* SVG progress ring */}
          <svg width="80" height="80" viewBox="0 0 80 80" style={{ position: 'absolute', inset: 0, transform: 'rotate(-90deg)' }}
            aria-label={`Profile ${pct}% complete`} role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
            <defs>
              {glow && (
                <filter id="ring-glow">
                  <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#10B981" floodOpacity="0.5" />
                </filter>
              )}
            </defs>
            {/* Background ring */}
            <circle cx="40" cy="40" r="34" fill="none" stroke="#E2E8F0" strokeWidth="4.5" />
            {/* Progress ring */}
            <circle cx="40" cy="40" r="34" fill="none" stroke={ringColor} strokeWidth="4.5"
              strokeDasharray={CIRCUMFERENCE} strokeDashoffset={dashOffset}
              strokeLinecap="round" style={{ transition: 'stroke-dashoffset 0.8s ease, stroke 0.3s ease' }}
              filter={glow ? 'url(#ring-glow)' : undefined}
            />
          </svg>

          {/* Avatar */}
          <div style={{
            position: 'absolute', top: 10, left: 10, width: 60, height: 60,
            borderRadius: '50%', overflow: 'hidden',
            border: '2.5px solid #fff', boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
          }}>
            {user?.profilePic ? (
              <img src={user.profilePic} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f1f5f9' }}>
                <span style={{ fontSize: 18, fontWeight: 700, color: '#475569' }}>{initials}</span>
              </div>
            )}
          </div>

          {/* Bottom badge */}
          <div style={{
            position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            minWidth: pct >= 100 ? 20 : 28, height: 18,
            borderRadius: 9, padding: '0 5px',
            background: ringColor,
            color: '#fff', fontSize: 10, fontWeight: 700, lineHeight: 1,
            boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
          }}>
            {pct >= 100 ? <FiCheck size={11} /> : label}
          </div>
        </div>
      </div>

      {/* Info */}
      <div style={{ padding: '46px 16px 16px', textAlign: 'center' }}>
        <h4 style={{ fontSize: 15, fontWeight: 700, color: '#0F172A', margin: '0 0 2px' }}>
          {user?.name || 'User'}
        </h4>
        <p style={{ fontSize: 12, color: '#64748B', margin: '0 0 2px' }}>
          {user?.headline || 'Update your headline'}
        </p>
        {user?.currentCompany && (
          <p style={{ fontSize: 11, color: '#94A3B8', margin: '0 0 6px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3 }}>
            <FiBriefcase size={10} /> {user.currentCompany}
          </p>
        )}
        {user?.currentCity && (
          <p style={{ fontSize: 11, color: '#94A3B8', margin: '0 0 8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3 }}>
            <FiMapPin size={10} /> {user.currentCity}
          </p>
        )}

        <div style={{
          fontSize: 10, color: '#94A3B8', marginBottom: 12,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
        }}>
          <FiCalendar size={9} /> Last updated {lastUpdated}
        </div>

        <button
          onClick={() => navigate('/profile')}
          style={{
            width: '100%', padding: '8px 12px', borderRadius: 8, border: 'none',
            background: '#EEF2FF', color: '#2563EB', fontSize: 12, fontWeight: 600,
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = '#DBE4FF'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = '#EEF2FF'; e.currentTarget.style.transform = 'translateY(0)'; }}
        >
          <FiEye size={13} /> View Profile
        </button>
      </div>
    </div>
  );
}
