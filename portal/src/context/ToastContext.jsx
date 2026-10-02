import { createContext, useContext, useState, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';

const ToastContext = createContext(null);

const TOAST_COLORS = {
  success: { bg: '#065f46', border: '#34d399' },
  error: { bg: '#7f1d1d', border: '#f87171' },
  warning: { bg: '#78350f', border: '#fbbf24' },
  info: { bg: '#1e3a5f', border: '#60a5fa' },
};

const TOAST_ICONS = {
  success: '\u2713',
  error: '\u2715',
  warning: '\u26a0',
  info: '\u2139',
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timerRefs = useRef({});
  const idRef = useRef(0);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    if (timerRefs.current[id]) {
      clearTimeout(timerRefs.current[id]);
      delete timerRefs.current[id];
    }
  }, []);

  const showToast = useCallback((text, type = 'error', duration = 4000) => {
    const id = ++idRef.current;
    setToasts((prev) => [...prev, { id, text, type }]);
    timerRefs.current[id] = setTimeout(() => dismiss(id), duration);
  }, [dismiss]);

  const portalNode = typeof document !== 'undefined' ? document.body : null;

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {portalNode && createPortal(
        <div style={{ position: 'fixed', top: 28, right: 28, zIndex: 999999, display: 'flex', flexDirection: 'column', gap: 10, pointerEvents: 'none' }}>
          {toasts.map((toast) => {
            const colors = TOAST_COLORS[toast.type] || TOAST_COLORS.error;
            return (
              <div key={toast.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 18px', borderRadius: 12, background: colors.bg, border: '1px solid ' + colors.border, color: '#fff', fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: 14, fontWeight: 600, maxWidth: 380, minWidth: 220, boxShadow: '0 8px 32px rgba(0,0,0,0.28)', pointerEvents: 'all', animation: 'mvn-toast-slide-in 0.28s cubic-bezier(0.16,1,0.3,1)' }}>
                <span style={{ fontSize: 16, flexShrink: 0 }}>{TOAST_ICONS[toast.type] || '\u25cf'}</span>
                <span style={{ flex: 1, lineHeight: 1.4 }}>{toast.text}</span>
                <button onClick={() => dismiss(toast.id)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.65)', cursor: 'pointer', fontSize: 16, padding: 0, lineHeight: 1, flexShrink: 0 }} aria-label="Dismiss">{String.fromCharCode(0x2715)}</button>
              </div>
            );
          })}
        </div>,
        portalNode,
      )}
      <style dangerouslySetInnerHTML={{ __html: '@keyframes mvn-toast-slide-in { from { opacity: 0; transform: translateX(40px); } to { opacity: 1; transform: translateX(0); } }' }} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) return { showToast: (text) => console.warn('[Toast]', text) };
  return ctx;
}
