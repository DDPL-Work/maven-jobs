import { Link } from 'react-router-dom';
import { FiChevronRight, FiHome } from 'react-icons/fi';

const C = {
  s400: "#94a3b8", s500: "#64748b", s900: "#0f172a",
  navy: "#002366",
};

export default function EmployerBreadcrumb({ items = [] }) {
  if (!items || items.length === 0) return null;

  return (
    <nav style={{
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      fontSize: '0.82rem',
      fontWeight: 600,
      color: C.s500,
      marginBottom: 20,
    }}>
      {items.map((item, i) => {
        const isLast = i === items.length - 1;
        const isFirst = i === 0;

        return (
          <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {isFirst && <FiHome size={13} />}
            {isLast ? (
              <span style={{ color: C.s900 }}>{item.label}</span>
            ) : (
              <Link to={item.path || '#'} style={{
                color: C.navy,
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                transition: 'color 0.15s',
              }}
                onMouseEnter={e => { e.currentTarget.style.color = '#001a4d'; }}
                onMouseLeave={e => { e.currentTarget.style.color = C.navy; }}
              >
                {item.label}
              </Link>
            )}
            {!isLast && <FiChevronRight size={12} style={{ color: C.s400, flexShrink: 0 }} />}
          </span>
        );
      })}
    </nav>
  );
}
