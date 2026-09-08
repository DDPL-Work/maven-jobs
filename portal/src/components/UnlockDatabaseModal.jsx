import { useState } from 'react';
import {
    FiX, FiCheckCircle, FiShield, FiZap, FiArrowRight,
    FiLoader, FiMessageSquare, FiUsers, FiMail, FiBarChart2, FiDownload
} from 'react-icons/fi';

export default function UnlockDatabaseModal({ isOpen, onClose }) {
    const [isProcessing, setIsProcessing] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    if (!isOpen) return null;

    const handleCheckout = () => {
        setIsProcessing(true);
        setTimeout(() => {
            setIsProcessing(false);
            setIsSuccess(true);
        }, 2000);
    };

    const FEATURES = [
        { icon: <FiMessageSquare size={18} />, text: "Chat directly with candidates — no intermediaries" },
        { icon: <FiUsers size={18} />, text: "View tabular data of who applied to which job" },
        { icon: <FiMail size={18} />, text: "Access candidate email and contact details" },
        { icon: <FiBarChart2 size={18} />, text: "Analytics dashboard with hiring funnel insights" },
        { icon: <FiDownload size={18} />, text: "Export applicant data for your records" },
        { icon: <FiShield size={18} />, text: "All profiles verified — email, phone & employment" },
    ];

    return (
        <div
            style={{
                position: 'fixed', inset: 0, zIndex: 10000,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'rgba(0, 10, 30, 0.75)', backdropFilter: 'blur(10px)',
                padding: '20px',
            }}
            onClick={onClose}
        >
            <style>{`
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
                @keyframes scaleIn { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }
            `}</style>

            <div
                style={{
                    background: '#fff', borderRadius: '24px', width: '100%',
                    maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto',
                    boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
                    position: 'relative', animation: 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                }}
                onClick={e => e.stopPropagation()}
            >
                <button
                    onClick={onClose}
                    style={{
                        position: 'absolute', top: '20px', right: '20px',
                        width: '40px', height: '40px', zIndex: 10,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: '#f1f5f9', color: '#64748b',
                        border: 'none', borderRadius: '50%', cursor: 'pointer',
                        transition: 'all 0.2s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#e2e8f0'; e.currentTarget.style.color = '#0f172a' }}
                    onMouseLeave={e => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.color = '#64748b' }}
                >
                    <FiX size={20} />
                </button>

                {isSuccess ? (
                    <div style={{ padding: '60px 40px', textAlign: 'center', animation: 'scaleIn 0.5s ease' }}>
                        <div style={{
                            width: '80px', height: '80px', borderRadius: '50%',
                            background: '#ecfdf5', color: '#10b981',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            margin: '0 auto 24px',
                        }}>
                            <FiCheckCircle size={40} />
                        </div>
                        <h2 style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: '28px', fontWeight: 800, color: '#0f172a', marginBottom: '12px' }}>Pro Activated!</h2>
                        <p style={{ fontSize: '15px', color: '#64748b', lineHeight: 1.6, marginBottom: '32px' }}>
                            You now have full Pro access. Chat with candidates, view applicant tables, and manage your pipeline.
                        </p>
                        <button
                            onClick={onClose}
                            style={{
                                width: '100%', padding: '16px', background: '#10b981', color: '#fff',
                                border: 'none', borderRadius: '12px', fontSize: '15px', fontWeight: 800,
                                cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", transition: 'all 0.2s',
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = '#0da371'}
                            onMouseLeave={e => e.currentTarget.style.background = '#10b981'}
                        >
                            Go to Database
                        </button>
                    </div>
                ) : (
                    <div style={{ padding: '50px 40px' }}>
                        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                            <div style={{
                                display: 'inline-flex', alignItems: 'center', gap: '6px',
                                fontSize: '11px', fontWeight: 800, letterSpacing: '.15em',
                                textTransform: 'uppercase', color: '#10b981',
                                background: 'rgba(16,185,129,.1)', padding: '6px 14px',
                                borderRadius: '100px', marginBottom: '16px',
                            }}>
                                <FiZap size={14} /> Single Plan — Full Access
                            </div>
                            <h2 style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: '36px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.03em', marginBottom: '8px' }}>
                                Pro
                            </h2>
                            <p style={{ fontSize: '16px', color: '#64748b', lineHeight: 1.6 }}>
                                Unlock candidate chat, applicant tables, and full pipeline visibility.
                            </p>
                        </div>

                        <div style={{
                            background: '#f8fafc', border: '1.5px solid #e2e8f0',
                            borderRadius: '16px', padding: '24px', marginBottom: '28px',
                        }}>
                            {FEATURES.map((f, i) => (
                                <div key={i} style={{
                                    display: 'flex', alignItems: 'center', gap: '12px',
                                    marginBottom: i < FEATURES.length - 1 ? '16px' : 0,
                                    fontSize: '14px', color: '#475569', fontWeight: 500,
                                }}>
                                    <div style={{
                                        width: '32px', height: '32px', borderRadius: '8px',
                                        background: '#ecfdf5', display: 'flex', alignItems: 'center',
                                        justifyContent: 'center', flexShrink: 0, color: '#10b981',
                                    }}>{f.icon}</div>
                                    {f.text}
                                </div>
                            ))}
                        </div>

                        <button
                            onClick={handleCheckout}
                            disabled={isProcessing}
                            style={{
                                width: '100%', padding: '16px', background: '#10b981', color: '#fff',
                                border: 'none', borderRadius: '12px', fontSize: '15px', fontWeight: 800,
                                cursor: isProcessing ? 'not-allowed' : 'pointer',
                                fontFamily: "'DM Sans', sans-serif", transition: 'all 0.2s',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                                opacity: isProcessing ? 0.8 : 1,
                                boxShadow: '0 8px 24px rgba(16,185,129,.3)',
                            }}
                            onMouseEnter={e => { if (!isProcessing) { e.currentTarget.style.background = '#0da371' } }}
                            onMouseLeave={e => { if (!isProcessing) { e.currentTarget.style.background = '#10b981' } }}
                        >
                            {isProcessing ? (
                                <><FiLoader size={18} /> Processing...</>
                            ) : (
                                <>Upgrade to Pro <FiArrowRight /></>
                            )}
                        </button>

                        <div style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            gap: '8px', marginTop: '16px', fontSize: '12px', color: '#94a3b8',
                        }}>
                            <FiShield size={14} /> Secure 256-bit SSL encryption
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}