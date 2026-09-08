import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Document, Page, pdfjs } from 'react-pdf';
import { FiX, FiDownload, FiFileText, FiZoomIn, FiZoomOut, FiChevronLeft, FiChevronRight, FiDollarSign, FiAlertCircle, FiShoppingCart } from 'react-icons/fi';
import authService from '../../services/authService';

pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

export default function ResumeModal({ candidateId, resumeUrl: initialUrl, onClose, creditFree = false }) {
  const navigate = useNavigate();
  const [url, setUrl] = useState(initialUrl || '');
  const [loading, setLoading] = useState(false);
  const [checkingCredits, setCheckingCredits] = useState(!creditFree);
  const [creditError, setCreditError] = useState('');
  const [error, setError] = useState('');
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1);
  const [pdfLoading, setPdfLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (!candidateId && !initialUrl) {
      setCheckingCredits(false);
      setError('No resume available');
      return;
    }
    let active = true;
    (async () => {
      setCheckingCredits(true);
      setCreditError('');
      setError('');
      try {
        if (creditFree) {
          setCheckingCredits(false);
          if (initialUrl) {
            setUrl(initialUrl);
          } else {
            setLoading(true);
            try {
              const res = await authService.getCandidateResume(candidateId);
              if (!active) return;
              const u = res?.data?.url;
              if (u) setUrl(u);
              else setError('Resume unavailable');
            } catch {
              if (!active) return;
              setError('Failed to load resume');
            } finally {
              if (active) setLoading(false);
            }
          }
          return;
        }
        const cr = await authService.useCredits('RESUME_VIEW', candidateId);
        if (!active) return;
        if (cr?.success) {
          window.dispatchEvent(new CustomEvent("employer-credits-changed"));
          setCheckingCredits(false);
          if (initialUrl) {
            setUrl(initialUrl);
          } else {
            setLoading(true);
            try {
              const res = await authService.getCandidateResume(candidateId);
              if (!active) return;
              const u = res?.data?.url;
              if (u) setUrl(u);
              else setError('Resume unavailable');
            } catch {
              if (!active) return;
              setError('Failed to load resume');
            } finally {
              if (active) setLoading(false);
            }
          }
        } else if (cr?.message?.toLowerCase().includes('credit')) {
          if (active) { setCreditError(cr.message); setCheckingCredits(false); }
        } else {
          if (active) { throw new Error(cr?.message || 'Failed to access resume'); }
        }
      } catch (err) {
        if (!active) return;
        const msg = err?.response?.data?.message || err.message || '';
        if (msg.toLowerCase().includes('credit') || msg.toLowerCase().includes('insufficient')) {
          setCreditError(msg || 'Insufficient credits. Purchase credits to access this resume.');
        } else {
          setError(msg || 'Failed to load resume');
        }
        setCheckingCredits(false);
      }
    })();
    return () => { active = false; };
  }, [candidateId, initialUrl]);

  const handleDownload = useCallback(async () => {
    if (!candidateId) {
      if (url) window.open(url, '_blank');
      return;
    }
    const baseUrl = (import.meta.env.VITE_API_URL || 'https://naukri-6v4n.onrender.com/api/v1').replace(/\/+$/, '');
    const downloadUrl = `${baseUrl}/candidate/${candidateId}/resume/download`;
    if (creditFree) {
      setDownloading(true);
      try {
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } catch (err) {
        setError(err?.message || 'Download failed');
      }
      setDownloading(false);
      return;
    }
    setDownloading(true);
    try {
      const cr = await authService.useCredits('RESUME_DOWNLOAD', candidateId);
      if (cr?.success) {
        window.dispatchEvent(new CustomEvent("employer-credits-changed"));
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } else {
        setCreditError(cr?.message || 'Insufficient credits');
      }
    } catch (err) {
      const msg = err?.response?.data?.message || err.message || 'Download failed';
      if (msg.toLowerCase().includes('credit') || msg.toLowerCase().includes('insufficient')) {
        setCreditError(msg || 'Insufficient credits');
      } else {
        setError(msg);
      }
    }
    setDownloading(false);
  }, [candidateId, url, creditFree]);

  const handleBackdropClick = useCallback((e) => {
    if (e.target === e.currentTarget) onClose();
  }, [onClose]);

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  function onDocumentLoadSuccess({ numPages: pages }) {
    setNumPages(pages);
    setPdfLoading(false);
    setPageNumber(1);
  }

  function onDocumentLoadError() {
    setPdfLoading(false);
    setError('Failed to load PDF');
  }

  const zoomIn = () => setScale(s => Math.min(s + 0.25, 3));
  const zoomOut = () => setScale(s => Math.max(s - 0.25, 0.5));
  const goToPage = (page) => setPageNumber(Math.max(1, Math.min(page, numPages || 1)));

  return (
    <div
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-label="Resume viewer"
      style={{
        position: 'fixed', inset: 0, zIndex: 10000,
        background: 'rgba(15,23,42,0.7)', backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '20px', animation: 'rmFadeIn 0.2s ease',
      }}
    >
      <style>{`
        @keyframes rmFadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes rmScaleIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        .rm-scroll::-webkit-scrollbar { width: 6px; height: 6px; }
        .rm-scroll::-webkit-scrollbar-track { background: transparent; }
        .rm-scroll::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
        .rm-scroll::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
        .react-pdf__Document { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 16px 0; }
        .react-pdf__Page { box-shadow: 0 2px 12px rgba(0,0,0,0.08); border-radius: 4px; overflow: hidden; }
        .react-pdf__Page canvas { display: block; }
        .react-pdf__message { padding: 40px; text-align: center; color: #64748b; font-size: 0.9rem; }
      `}</style>
      <div style={{
        background: '#fff', borderRadius: 20, width: '100%', maxWidth: 960,
        maxHeight: '92vh', display: 'flex', flexDirection: 'column',
        overflow: 'hidden', boxShadow: '0 32px 80px rgba(0,0,0,0.35)',
        animation: 'rmScaleIn 0.25s cubic-bezier(0.16,1,0.3,1)',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 20px', borderBottom: '1px solid #e2e8f0', flexShrink: 0,
          background: '#fff',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: 'linear-gradient(135deg,#eef2ff,#e0e7ff)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4338ca',
            }}>
              <FiFileText size={16} />
            </div>
            <div>
              <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#0f172a' }}>Resume</div>
              <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: 1 }}>PDF Document</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {url && !error && numPages && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginRight: 4, padding: '3px 8px', background: '#f1f5f9', borderRadius: 6, fontSize: '0.75rem', fontWeight: 600, color: '#475569' }}>
                <button onClick={zoomOut} disabled={scale <= 0.5} aria-label="Zoom out"
                  style={{ background: 'none', border: 'none', padding: '2px', cursor: scale <= 0.5 ? 'not-allowed' : 'pointer', color: scale <= 0.5 ? '#cbd5e1' : '#475569', display: 'flex', alignItems: 'center' }}>
                  <FiZoomOut size={14} />
                </button>
                <span style={{ minWidth: 32, textAlign: 'center' }}>{Math.round(scale * 100)}%</span>
                <button onClick={zoomIn} disabled={scale >= 3} aria-label="Zoom in"
                  style={{ background: 'none', border: 'none', padding: '2px', cursor: scale >= 3 ? 'not-allowed' : 'pointer', color: scale >= 3 ? '#cbd5e1' : '#475569', display: 'flex', alignItems: 'center' }}>
                  <FiZoomIn size={14} />
                </button>
              </div>
            )}
            {url && !error && (
              <button onClick={handleDownload} disabled={downloading} aria-label="Download resume" title="Download"
                  style={{
                    display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px',
                    borderRadius: 6, border: 'none', background: '#002366', color: '#fff',
                    fontSize: '0.75rem', fontWeight: 700, cursor: downloading ? 'default' : 'pointer',
                    opacity: downloading ? 0.6 : 1, transition: 'all 0.15s',
                  }}>
                  <FiDownload size={12} /> {downloading ? 'Processing...' : 'Download'}
                </button>
            )}
            <button onClick={onClose} aria-label="Close modal" title="Close"
              style={{
                width: 30, height: 30, borderRadius: 6, border: '1px solid #e2e8f0',
                background: '#fff', color: '#64748b', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.15s', marginLeft: 2,
              }}>
              <FiX size={16} />
            </button>
          </div>
        </div>

        {/* PDF Viewer */}
        <div ref={scrollRef} className="rm-scroll" style={{
          flex: 1, minHeight: 0, overflow: 'auto',
          background: '#f1f5f9', display: 'flex', flexDirection: 'column',
        }}>
          {checkingCredits ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 500, gap: 16 }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', border: '3px solid #e2e8f0', borderTopColor: '#002366', animation: 'rmSpin 0.7s linear infinite' }} />
              <style>{`@keyframes rmSpin { to { transform: rotate(360deg); } }`}</style>
              <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 500 }}>Verifying access...</span>
            </div>
          ) : creditError ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 500, gap: 14, padding: '0 24px' }}>
              <div style={{ width: 56, height: 56, borderRadius: 16, background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FiDollarSign size={28} color="#dc2626" />
              </div>
              <div style={{ fontSize: '1rem', color: '#dc2626', fontWeight: 700, textAlign: 'center' }}>Credits Required</div>
              <p style={{ fontSize: '0.85rem', color: '#64748b', textAlign: 'center', maxWidth: 300, margin: 0, lineHeight: 1.5 }}>{creditError}</p>
              <button onClick={() => { onClose(); navigate('/employer-dashboard/pricing'); }}
                style={{ marginTop: 8, display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 22px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#002366,#1a3a6e)', color: '#fff', fontSize: '0.85rem', fontWeight: 800, fontFamily: "'DM Sans',sans-serif", cursor: 'pointer', boxShadow: '0 4px 14px rgba(0,35,102,.2)' }}>
                <FiShoppingCart size={14} /> Buy Credits
              </button>
            </div>
          ) : loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 500, gap: 16 }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', border: '3px solid #e2e8f0', borderTopColor: '#002366', animation: 'rmSpin 0.7s linear infinite' }} />
              <style>{`@keyframes rmSpin { to { transform: rotate(360deg); } }`}</style>
              <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 500 }}>Loading resume...</span>
            </div>
          ) : error ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 500, gap: 12 }}>
              <div style={{ width: 48, height: 48, borderRadius: 14, background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FiFileText size={24} color="#ef4444" />
              </div>
              <span style={{ fontSize: '0.9rem', color: '#ef4444', fontWeight: 600 }}>{error}</span>
            </div>
          ) : (
            <>
              <Document
                file={url}
                onLoadSuccess={onDocumentLoadSuccess}
                onLoadError={onDocumentLoadError}
                loading={
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 500, gap: 12 }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', border: '3px solid #e2e8f0', borderTopColor: '#002366', animation: 'rmSpin 0.7s linear infinite' }} />
                    <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Loading PDF...</span>
                  </div>
                }
                error={
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 500, gap: 12 }}>
                    <FiFileText size={36} color="#cbd5e1" />
                    <span style={{ fontSize: '0.9rem', color: '#94a3b8' }}>Unable to preview resume</span>
                  </div>
                }
              >
                {Array.from(new Array(numPages || 1), (_, i) => (
                  <Page
                    key={`page_${i + 1}`}
                    pageNumber={i + 1}
                    scale={scale}
                    renderTextLayer={false}
                    renderAnnotationLayer={false}
                    loading={
                      <div style={{ width: 600, height: 800, background: '#fff', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <div style={{ width: 24, height: 24, borderRadius: '50%', border: '2px solid #e2e8f0', borderTopColor: '#002366', animation: 'rmSpin 0.7s linear infinite' }} />
                      </div>
                    }
                  />
                ))}
              </Document>

              {/* Page navigation */}
              {numPages > 1 && (
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
                  padding: '12px 16px', background: '#fff', borderTop: '1px solid #e2e8f0',
                  flexShrink: 0, fontSize: '0.8rem', fontWeight: 600, color: '#475569',
                }}>
                  <button onClick={() => goToPage(pageNumber - 1)} disabled={pageNumber <= 1} aria-label="Previous page"
                    style={{ background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 6, padding: '5px 10px', cursor: pageNumber <= 1 ? 'not-allowed' : 'pointer', color: pageNumber <= 1 ? '#cbd5e1' : '#475569', display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.75rem', fontWeight: 600 }}>
                    <FiChevronLeft size={14} /> Prev
                  </button>
                  <span>
                    Page <input type="number" value={pageNumber} min={1} max={numPages} onChange={(e) => goToPage(Number(e.target.value))}
                      style={{ width: 40, textAlign: 'center', padding: '3px 4px', borderRadius: 4, border: '1px solid #e2e8f0', fontSize: '0.8rem', fontWeight: 600, color: '#0f172a' }} /> of {numPages}
                  </span>
                  <button onClick={() => goToPage(pageNumber + 1)} disabled={pageNumber >= numPages} aria-label="Next page"
                    style={{ background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 6, padding: '5px 10px', cursor: pageNumber >= numPages ? 'not-allowed' : 'pointer', color: pageNumber >= numPages ? '#cbd5e1' : '#475569', display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.75rem', fontWeight: 600 }}>
                    Next <FiChevronRight size={14} />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
