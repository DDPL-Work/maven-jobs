import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { FiAlertTriangle, FiRefreshCcw } from 'react-icons/fi';

export default function RateLimitModal({ isOpen, onClose, message }) {
  const overlayRef = useRef(null);
  const cardRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(overlayRef.current, { opacity: 0 }, { opacity: 1, duration: 0.25 });
      gsap.fromTo(cardRef.current,
        { opacity: 0, scale: 0.92, y: 30 },
        { opacity: 1, scale: 1, y: 0, duration: 0.35, ease: 'back.out(1.3)' }
      );
    });
    document.body.style.overflow = 'hidden';
    const handler = (e) => { if (e.key === 'Escape') onClose?.(); };
    window.addEventListener('keydown', handler);
    return () => {
      ctx.revert();
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handler);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={overlayRef}
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(15,23,42,0.6)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 24,
      }}
    >
      <div
        ref={cardRef}
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#fff', borderRadius: 24,
          maxWidth: 420, width: '100%',
          padding: '44px 36px 36px',
          boxShadow: '0 32px 80px rgba(0,0,0,0.2)',
          textAlign: 'center',
          fontFamily: "'DM Sans', system-ui, sans-serif",
        }}
      >
        <div style={{
          width: 68, height: 68, borderRadius: '50%',
          background: 'linear-gradient(135deg, #FEF2F2, #FEE2E2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 20px',
          boxShadow: '0 8px 24px rgba(239,68,68,0.15)',
        }}>
          <FiAlertTriangle size={32} color="#DC2626" />
        </div>

        <h3 style={{
          margin: 0, fontSize: 20, fontWeight: 800,
          color: '#0F172A', letterSpacing: '-0.02em',
        }}>
          Service Unavailable
        </h3>

        <p style={{
          margin: '10px 0 24px', fontSize: 14.5, color: '#475569',
          fontWeight: 500, lineHeight: 1.65,
        }}>
          {message || 'AI services are temporarily unavailable due to high demand. Our team has been notified and is working to restore them.'}
        </p>

        <div style={{
          padding: '14px 18px', borderRadius: 12,
          background: '#FFFBEB', border: '1px solid #FDE68A',
          display: 'flex', alignItems: 'center', gap: 10,
          marginBottom: 28,
        }}>
          <FiRefreshCcw size={16} color="#D97706" style={{ flexShrink: 0 }} />
          <span style={{ fontSize: 12.5, color: '#92400E', fontWeight: 600, lineHeight: 1.5, textAlign: 'left' }}>
            Please try again later. If the issue persists, contact support at{' '}
            <a href="mailto:support@mavenjobs.com" style={{ color: '#002366', fontWeight: 700, textDecoration: 'underline' }}>
              support@mavenjobs.com
            </a>
          </span>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={onClose}
            style={{
              flex: 1, padding: '13px',
              borderRadius: 14, border: '1.5px solid #E2E8F0',
              background: '#fff', color: '#334155',
              fontSize: 14, fontWeight: 700, cursor: 'pointer',
              fontFamily: 'inherit',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#F8FAFC'; e.currentTarget.style.borderColor = '#CBD5E1'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = '#E2E8F0'; }}
          >
            Got it
          </button>
          <a
            href="mailto:support@mavenjobs.com"
            style={{
              flex: 1, padding: '13px',
              borderRadius: 14, border: 'none',
              background: 'linear-gradient(135deg, #001a50, #0F3DB5)',
              color: '#fff', fontSize: 14, fontWeight: 700,
              textDecoration: 'none', display: 'flex', alignItems: 'center',
              justifyContent: 'center', cursor: 'pointer', fontFamily: 'inherit',
              boxShadow: '0 6px 20px rgba(0,35,102,0.25)',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 10px 28px rgba(0,35,102,0.35)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,35,102,0.25)'; }}
          >
            Contact Support
          </a>
        </div>
      </div>
    </div>
  );
}