import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { FiX } from 'react-icons/fi';

// Inject keyframes once
if (typeof document !== 'undefined' && !document.getElementById('ad-global-keyframes')) {
  const s = document.createElement('style');
  s.id = 'ad-global-keyframes';
  s.textContent = `
@keyframes adFadeIn{from{opacity:0}to{opacity:1}}
@keyframes adScaleIn{from{opacity:0;transform:scale(0.95) translateY(-4px)}to{opacity:1;transform:scale(1) translateY(0)}}
  `;
  document.head.appendChild(s);
}

export default function LogoutModal({ isOpen, onClose, onConfirm }) {
  const overlayRef = useRef(null);
  const modalRef = useRef(null);
  const cancelRef = useRef(null);
  const previousActiveElement = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    previousActiveElement.current = document.activeElement;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') { onClose(); return; }
      if (e.key === 'Tab') {
        const focusable = modalRef.current?.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        if (!focusable?.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault(); last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault(); first.focus();
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    requestAnimationFrame(() => cancelRef.current?.focus());
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
      previousActiveElement.current?.focus();
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div
      ref={overlayRef}
      style={{
        position: 'fixed', inset: 0, zIndex: 2147483000,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        width: '100vw', height: '100vh',
        background: 'rgba(0,0,0,0.45)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        animation: 'adFadeIn 0.2s ease-out',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="logout-modal-title"
    >
      <div
        ref={modalRef}
        style={{
          background: 'rgba(255,255,255,0.85)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderRadius: 20,
          border: '1px solid rgba(255,255,255,0.3)',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
          padding: 32,
          width: 360,
          maxWidth: '90vw',
          transformOrigin: 'center',
          animation: 'adScaleIn 0.2s ease-out',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
          <h2 id="logout-modal-title" style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#0f172a' }}>Logout</h2>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 4, borderRadius: 8, display: 'flex' }}
            aria-label="Close modal"
          >
            <FiX size={20} />
          </button>
        </div>
        <p style={{ margin: '8px 0 24px', fontSize: 15, color: '#475569', lineHeight: 1.5 }}>
          Are you sure you want to logout?
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <button
            ref={cancelRef}
            onClick={onClose}
            style={{
              padding: '10px 24px', borderRadius: 12, border: '1px solid #e2e8f0',
              background: 'white', color: '#334155', fontSize: 14, fontWeight: 600,
              cursor: 'pointer', transition: 'all 0.15s ease',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#f8fafc'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'white'; }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            style={{
              padding: '10px 24px', borderRadius: 12, border: 'none',
              background: '#ef4444', color: 'white', fontSize: 14, fontWeight: 600,
              cursor: 'pointer', transition: 'all 0.15s ease',
              boxShadow: '0 4px 12px rgba(239,68,68,0.3)',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = '#dc2626';
              e.currentTarget.style.boxShadow = '0 6px 16px rgba(239,68,68,0.4)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = '#ef4444';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(239,68,68,0.3)';
            }}
          >
            Logout
          </button>
        </div>
      </div>
      </div>,
      document.body
    );
  }
