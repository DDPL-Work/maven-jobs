import EmployerHeader from './EmployerHeader';

const C = {
  navy: "#002366",
  s50: "#f8fafc", s100: "#f1f5f9", s200: "#e2e8f0",
  s300: "#cbd5e1", s400: "#94a3b8", s500: "#64748b",
  s600: "#475569", s700: "#334155", s800: "#1e293b", s900: "#0f172a",
};

export default function EmployerLayout({
  company = {},
  activeTab = 'home',
  onNavigate,
  onMessagesClick,
  onNotificationsClick,
  onLogout,
  containerWidth = 1160,
  children,
}) {
  return (
    <div style={{ minHeight: '100vh', background: '#f0f4f9', fontFamily: "'DM Sans', sans-serif" }}>
      <EmployerHeader
        company={company}
        activeTab={activeTab}
        onNavigate={onNavigate}
        onMessagesClick={onMessagesClick}
        onNotificationsClick={onNotificationsClick}
        onLogout={onLogout}
        requireAuth
      />
      <div style={{
        maxWidth: containerWidth,
        margin: '0 auto',
        padding: '20px 20px 48px',
      }}>
        {children}
      </div>
    </div>
  );
}
