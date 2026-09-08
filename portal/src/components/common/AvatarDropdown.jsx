import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { FiUser, FiHome, FiMap, FiLogOut, FiChevronDown, FiAward } from 'react-icons/fi';
import { useAuth } from '../../AuthContext';
import LogoutModal from './LogoutModal';

const C = {
  navy: "#002366",
  s50: "#f8fafc", s100: "#f1f5f9", s200: "#e2e8f0",
  s300: "#cbd5e1", s400: "#94a3b8", s500: "#64748b",
  s600: "#475569", s700: "#334155", s800: "#1e293b",
  dm: "'DM Sans', system-ui, sans-serif",
};

export default function AvatarDropdown({ dropdownAlign = 'right' }) {
  const [open, setOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open]);

  const initials = user?.name
    ? user.name.split(' ').filter(Boolean).map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  const handleLogout = () => {
    logout();
    queryClient.clear();
    navigate('/');
  };

  const menuItems = [
    { label: 'Profile', icon: FiUser, onClick: () => { navigate('/profile'); setOpen(false); }, active: window.location.pathname === '/profile' },
    { label: 'Home', icon: FiHome, onClick: () => { navigate('/dashboard'); setOpen(false); }, active: window.location.pathname === '/dashboard' },
    { label: 'Premium', icon: FiAward, onClick: () => { navigate('/premium'); setOpen(false); }, active: window.location.pathname === '/premium' },
    { label: 'Site Map', icon: FiMap, onClick: () => { navigate('/sitemap'); setOpen(false); }, active: window.location.pathname === '/sitemap' },
    { separator: true },
    { label: 'Logout', icon: FiLogOut, onClick: () => { setOpen(false); setShowLogoutModal(true); }, danger: true },
  ];

  return (
    <>
      <div ref={dropdownRef} style={{ position: 'relative', display: 'inline-flex' }}>
        <button
          onClick={() => setOpen(p => !p)}
          aria-haspopup="true"
          aria-expanded={open}
          aria-label="User menu"
          style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '5px 12px 5px 5px', borderRadius: 12,
            background: open
              ? `linear-gradient(135deg, ${C.navy}12, ${C.navy}08)`
              : `linear-gradient(135deg, ${C.navy}08, ${C.navy}02)`,
            border: `1px solid ${open ? C.navy + '30' : C.navy + '15'}`,
            cursor: 'pointer', fontFamily: C.dm,
            transition: 'all 0.18s', outline: 'none',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = C.navy + '40';
            e.currentTarget.style.background = `linear-gradient(135deg, ${C.navy}14, ${C.navy}08)`;
          }}
          onMouseLeave={e => {
            if (!open) {
              e.currentTarget.style.borderColor = C.navy + '15';
              e.currentTarget.style.background = `linear-gradient(135deg, ${C.navy}08, ${C.navy}02)`;
            }
          }}
        >
          <div style={{
            width: 32, height: 32, borderRadius: 8, flexShrink: 0,
            overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: user?.profilePic
              ? 'transparent'
              : 'linear-gradient(135deg,#f8fafc,#e2e8f0)',
          }}>
            {user?.profilePic ? (
              <img
                src={user.profilePic}
                alt=""
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={e => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.parentElement.style.background = 'linear-gradient(135deg,#f8fafc,#e2e8f0)';
                }}
              />
            ) : (
              <span style={{ fontSize: 11, fontWeight: 800, color: C.s400 }}>
                {initials}
              </span>
            )}
          </div>
          <div style={{
            lineHeight: 1.2, textAlign: 'left',
            maxWidth: user?.membership?.active && user?.membership?.plan === 'ELITE' ? 150 : 120,
            overflow: 'hidden',
          }}>
            <div style={{
              fontSize: 12.5, fontWeight: 800, color: '#0F172A',
              letterSpacing: '-0.01em',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {user?.membership?.active && user?.membership?.plan === 'ELITE' && (
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 3,
                  background: '#fbbf24', color: '#002366', fontSize: 9,
                  fontWeight: 800, padding: '1px 6px', borderRadius: 4,
                  marginRight: 4, fontFamily: C.dm, letterSpacing: '.04em',
                  verticalAlign: 'middle',
                }}>
                  <FiAward size={9} /> ELITE
                </span>
              )}
              {user?.name || 'User'}
            </div>
          </div>
          <FiChevronDown size={13} color={C.s400} style={{
            transition: 'transform 0.2s',
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
          }} />
        </button>

        {open && (
          <div
            style={{
              position: 'absolute', top: 'calc(100% + 8px)', 
              ...(dropdownAlign === 'left' ? { left: 0 } : { right: 0 }),
              zIndex: 9999,
              minWidth: 220, borderRadius: 16,
              background: 'rgba(255,255,255,0.88)',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              border: '1px solid rgba(255,255,255,0.6)',
              boxShadow: '0 16px 48px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.04)',
              padding: 6, overflow: 'hidden',
              animation: 'adFadeIn 0.2s ease-out',
            }}
          >
            <div style={{
              padding: '12px 14px 10px',
              borderBottom: '1px solid rgba(0,0,0,0.06)',
              marginBottom: 4,
            }}>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 6 }}>
                {user?.name || 'User'}
                {user?.membership?.active && user?.membership?.plan === 'ELITE' && (
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 3,
                    background: '#fbbf24', color: '#002366', fontSize: 9,
                    fontWeight: 800, padding: '2px 7px', borderRadius: 4,
                    fontFamily: C.dm, letterSpacing: '.04em',
                  }}>
                    <FiAward size={10} /> ELITE
                  </span>
                )}
              </p>
              <p style={{
                margin: '2px 0 0', fontSize: 12, color: C.s500,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 180,
              }}>
                {user?.email || ''}
              </p>
            </div>

            {menuItems.map((item, i) => {
              if (item.separator) {
                return <div key={`sep-${i}`} style={{ height: 1, background: 'rgba(0,0,0,0.06)', margin: '4px 8px' }} />;
              }
              const { label, icon: Icon, onClick, active, danger } = item;
              return (
                <button
                  key={label}
                  role="menuitem"
                  onClick={onClick}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 14px', border: 'none', borderRadius: 10,
                    background: active ? 'rgba(59,130,246,0.1)' : 'transparent',
                    color: danger ? '#ef4444' : (active ? '#2563eb' : '#1e293b'),
                    fontSize: 13.5, fontWeight: 600, fontFamily: C.dm,
                    cursor: 'pointer', transition: 'all 0.12s', textAlign: 'left',
                    marginBottom: 1,
                  }}
                  onMouseEnter={e => {
                    if (danger) { e.currentTarget.style.background = '#FEF2F2'; }
                    else { e.currentTarget.style.background = '#F1F5F9'; }
                  }}
                  onMouseLeave={e => {
                    if (!active) e.currentTarget.style.background = 'transparent';
                    else e.currentTarget.style.background = 'rgba(59,130,246,0.1)';
                  }}
                >
                  <Icon size={16} />
                  {label}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <LogoutModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleLogout}
      />
    </>
  );
}
