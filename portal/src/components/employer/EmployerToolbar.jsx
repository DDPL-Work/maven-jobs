const C = {
  s500: "#64748b", s800: "#1e293b", s900: "#0f172a",
};

export default function EmployerToolbar({
  title,
  subtitle,
  actions,
  children,
}) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: 16,
      marginBottom: 24,
      flexWrap: 'wrap',
    }}>
      <div>
        {title && (
          <h1 style={{
            fontFamily: "'Sora', sans-serif",
            fontSize: '1.5rem',
            fontWeight: 800,
            color: C.s900,
            margin: '0 0 4px',
            letterSpacing: '-0.03em',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}>
            {title}
          </h1>
        )}
        {subtitle && (
          <p style={{
            fontSize: '0.88rem',
            color: C.s500,
            margin: 0,
          }}>
            {subtitle}
          </p>
        )}
      </div>
      {actions && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          flexWrap: 'wrap',
          flexShrink: 0,
        }}>
          {actions}
        </div>
      )}
      {children}
    </div>
  );
}
