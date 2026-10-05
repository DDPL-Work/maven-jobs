import { useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import EmployerHeader from './EmployerHeader';
import EmployerFooter from './EmployerFooter';
import { useEmployerAuth } from '../../hooks/useEmployerAuth';

const C = {
  navy: "#002366",
  s50: "#f8fafc", s100: "#f1f5f9", s200: "#e2e8f0",
  s300: "#cbd5e1", s400: "#94a3b8", s500: "#64748b",
  s600: "#475569", s700: "#334155", s800: "#1e293b", s900: "#0f172a",
};

export default function EmployerLayout({
  company,
  user,
  activeTab = 'home',
  onNavigate,
  onMessagesClick,
  onNotificationsClick,
  onLogout,
  containerWidth = 1160,
  hideFooter = false,
  children,
}) {
  const navigate = useNavigate();
  const { session } = useEmployerAuth();

  const handleDefaultNavigate = useCallback((tabId) => {
    if (onNavigate) {
      onNavigate(tabId);
      return;
    }
    if (tabId === 'home') {
      navigate('/employer-dashboard');
    } else if (tabId === 'analysis') {
      navigate('/employer-dashboard/analytics');
    } else if (tabId === 'jobs') {
      navigate('/post-job');
    }
  }, [onNavigate, navigate]);

  const resolvedCompany = useMemo(() => {
    if (company && (company.name || company.logoUrl)) return company;
    if (session) {
      return {
        name: session.companyName || session.name || session.username || '',
        logoUrl: session.logoUrl || session.avatar || '',
        ...(company || {}),
      };
    }
    return company || {};
  }, [company, session]);

  const resolvedUser = useMemo(() => {
    if (user && (user.name || user.username || user.email)) return user;
    if (session) return session;
    return user;
  }, [user, session]);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      background: '#f0f4f9',
      fontFamily: "'DM Sans', sans-serif"
    }}>
      <EmployerHeader
        company={resolvedCompany}
        user={resolvedUser}
        activeTab={activeTab}
        onNavigate={handleDefaultNavigate}
        onMessagesClick={onMessagesClick}
        onNotificationsClick={onNotificationsClick}
        onLogout={onLogout}
        requireAuth
      />
      <div
        className="ep-layout-content-wrapper"
        style={{
          flex: 1,
          width: '100%',
          maxWidth: containerWidth,
          margin: '0 auto',
          boxSizing: 'border-box',
        }}
      >
        {children}
      </div>
      <style>{`
        .ep-layout-content-wrapper {
          padding: 20px 20px 48px;
        }
        @media (max-width: 1024px) {
          .ep-layout-content-wrapper {
            padding: 16px 16px 40px;
          }
        }
        @media (max-width: 640px) {
          .ep-layout-content-wrapper {
            padding: 12px 12px 36px;
          }
        }
      `}</style>
      {!hideFooter && <EmployerFooter />}
    </div>
  );
}
