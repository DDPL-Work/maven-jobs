import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import EmployerLayout from './EmployerLayout';
import notAllowedImg from '../../../assets/notAllowed.png';

export default function QuotaExhausted({ 
    jobTypeLabel, 
    availablePlans = [], 
    activeTab = "jobs", 
    purchaseUrl = "/manage-quota",
    wrapLayout = true,
    onSelectPlanType = null,
    isPlanExpired = false,
}) {
    const navigate = useNavigate();
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    const employerUser = JSON.parse(localStorage.getItem('employerUser') || 'null');
    const isRecruiter = employerUser?.role === 'RECRUITER';

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handlePostJobClick = (url, planType) => {
        setDropdownOpen(false);
        if (onSelectPlanType && planType) {
            onSelectPlanType(planType);
            return;
        }
        if (url.startsWith('/resume-search')) {
            navigate(url);
        } else {
            // Force clean mount to reset form state when switching job categories
            window.location.href = url;
        }
    };

    const content = (
        <div style={{
            minHeight: wrapLayout ? '80vh' : '60vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '40px 20px',
            background: '#fff',
            fontFamily: "'Inter', sans-serif"
        }}>
                <img 
                    src={notAllowedImg} 
                    alt="Not Allowed" 
                    style={{ width: '280px', height: 'auto', marginBottom: '24px' }} 
                />

                <h1 style={{
                    fontSize: '24px',
                    fontWeight: 700,
                    color: '#0F172A',
                    marginBottom: availablePlans.length > 0 ? '8px' : '12px',
                    textAlign: 'center'
                }}>
                    {isPlanExpired ? "Plan Expired – Renew to Continue" : `No active ${jobTypeLabel} plan found`}
                </h1>

                {availablePlans.length > 0 ? (
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        marginTop: '4px',
                        maxWidth: '600px',
                        width: '100%',
                        textAlign: 'center'
                    }}>
                        <p style={{
                            fontSize: '15px',
                            color: '#64748B',
                            marginBottom: '14px',
                            fontWeight: 400
                        }}>
                            Active in your account:
                        </p>

                        {/* Display all active categories */}
                        <div style={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: '10px',
                            justifyContent: 'center',
                            alignItems: 'center',
                            marginBottom: '28px'
                        }}>
                            {availablePlans.map((plan, idx) => (
                                <div
                                    key={idx}
                                    style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        padding: '8px 16px',
                                        borderRadius: '999px',
                                        background: '#F0FDF4',
                                        border: '1px solid #BBF7D0',
                                        color: '#15803D',
                                        fontSize: '14px',
                                        fontWeight: 600,
                                        boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
                                    }}
                                >
                                    <span style={{
                                        width: '8px',
                                        height: '8px',
                                        borderRadius: '50%',
                                        background: '#22C55E',
                                        display: 'inline-block',
                                        boxShadow: '0 0 0 2px rgba(34, 197, 94, 0.25)'
                                    }} />
                                    <span>{plan.label}</span>
                                    <span style={{
                                        fontSize: '12px',
                                        fontWeight: 500,
                                        color: '#166534',
                                        background: '#DCFCE7',
                                        padding: '2px 8px',
                                        borderRadius: '12px'
                                    }}>
                                        {plan.left} credit{plan.left !== 1 ? 's' : ''} left
                                    </span>
                                </div>
                            ))}
                        </div>

                        {/* Action button: single button if 1 active, or dropdown button if > 1 active */}
                        {availablePlans.length === 1 ? (
                            <button
                                onClick={() => handlePostJobClick(availablePlans[0].url, availablePlans[0].type)}
                                style={{
                                    padding: '12px 32px',
                                    background: '#2563EB',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: '8px',
                                    fontSize: '15px',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    boxShadow: '0 4px 14px rgba(37, 99, 235, 0.25)',
                                    transition: 'all 0.2s ease'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = '#1D4ED8';
                                    e.currentTarget.style.transform = 'translateY(-1px)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = '#2563EB';
                                    e.currentTarget.style.transform = 'translateY(0)';
                                }}
                            >
                                <span>
                                    {availablePlans[0].label.toLowerCase().includes('job') || 
                                     availablePlans[0].label.toLowerCase().includes('vacancy') || 
                                     availablePlans[0].label.toLowerCase().includes('internship') 
                                        ? `Post ${availablePlans[0].label}` 
                                        : `Use ${availablePlans[0].label}`}
                                </span>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="5" y1="12" x2="19" y2="12"></line>
                                    <polyline points="12 5 19 12 12 19"></polyline>
                                </svg>
                            </button>
                        ) : (
                            <div style={{ position: 'relative', display: 'inline-block' }} ref={dropdownRef}>
                                <button
                                    onClick={() => setDropdownOpen(!dropdownOpen)}
                                    style={{
                                        padding: '12px 28px',
                                        background: '#2563EB',
                                        color: '#fff',
                                        border: 'none',
                                        borderRadius: '8px',
                                        fontSize: '15px',
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '10px',
                                        boxShadow: '0 4px 14px rgba(37, 99, 235, 0.25)',
                                        transition: 'all 0.2s ease'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.background = '#1D4ED8';
                                        e.currentTarget.style.transform = 'translateY(-1px)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.background = '#2563EB';
                                        e.currentTarget.style.transform = 'translateY(0)';
                                    }}
                                >
                                    <span>{activeTab === 'resdex' ? 'Switch to Active Service' : 'Post with Active Plan'}</span>
                                    <svg
                                        width="18"
                                        height="18"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2.5"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        style={{
                                            transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                                            transition: 'transform 0.2s ease'
                                        }}
                                    >
                                        <polyline points="6 9 12 15 18 9"></polyline>
                                    </svg>
                                </button>

                                {dropdownOpen && (
                                    <div style={{
                                        position: 'absolute',
                                        top: 'calc(100% + 8px)',
                                        left: '50%',
                                        transform: 'translateX(-50%)',
                                        background: '#fff',
                                        border: '1px solid #E2E8F0',
                                        borderRadius: '12px',
                                        boxShadow: '0 12px 30px rgba(15, 23, 42, 0.12)',
                                        minWidth: '240px',
                                        zIndex: 100,
                                        overflow: 'hidden',
                                        padding: '6px'
                                    }}>
                                        <div style={{
                                            padding: '8px 12px 4px',
                                            fontSize: '11px',
                                            fontWeight: 700,
                                            color: '#94A3B8',
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.05em',
                                            textAlign: 'left'
                                        }}>
                                            Active categories
                                        </div>
                                        {availablePlans.map((plan, idx) => (
                                            <div
                                                key={idx}
                                                onClick={() => handlePostJobClick(plan.url, plan.type)}
                                                style={{
                                                    padding: '10px 14px',
                                                    borderRadius: '8px',
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'space-between',
                                                    transition: 'background 0.15s ease',
                                                    textAlign: 'left'
                                                }}
                                                onMouseEnter={(e) => e.currentTarget.style.background = '#F8FAFC'}
                                                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                            >
                                                <div>
                                                    <div style={{ fontSize: '14px', fontWeight: 600, color: '#0F172A' }}>
                                                        {plan.label.toLowerCase().includes('job') || 
                                                         plan.label.toLowerCase().includes('vacancy') || 
                                                         plan.label.toLowerCase().includes('internship') 
                                                            ? `Post ${plan.label}` 
                                                            : `Use ${plan.label}`}
                                                    </div>
                                                    <div style={{ fontSize: '12px', color: '#16A34A', fontWeight: 500, marginTop: '2px' }}>
                                                        {plan.left} credit{plan.left !== 1 ? 's' : ''} available
                                                    </div>
                                                </div>
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                    <polyline points="9 18 15 12 9 6"></polyline>
                                                </svg>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Secondary Option: Purchase missing plan */}
                        {!isRecruiter && (
                            <div style={{ marginTop: '24px' }}>
                                <button
                                    onClick={() => navigate(purchaseUrl || '/manage-quota')}
                                    style={{
                                        background: 'transparent',
                                        border: 'none',
                                        color: '#64748B',
                                        fontSize: '14px',
                                        fontWeight: 500,
                                        cursor: 'pointer',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        padding: '6px 14px',
                                        borderRadius: '6px',
                                        transition: 'all 0.2s ease'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.color = '#2563EB';
                                        e.currentTarget.style.background = '#EFF6FF';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.color = '#64748B';
                                        e.currentTarget.style.background = 'transparent';
                                    }}
                                >
                                    Need {jobTypeLabel}? Proceed to purchase plan →
                                </button>
                            </div>
                        )}
                    </div>
                ) : (
                    /* When 0 categories are active */
                    !isRecruiter ? (
                        <div style={{ textAlign: 'center' }}>
                            <p style={{
                                fontSize: '15px',
                                color: '#64748B',
                                marginBottom: '24px',
                                fontWeight: 400
                            }}>
                                {isPlanExpired
                                    ? "Your plan has expired and remaining unused credits have ended per policy. Renew now to resume full access."
                                    : "Continue to purchase plan"}
                            </p>

                            <button 
                                onClick={() => navigate(isPlanExpired ? '/buy-online?renew=true' : (purchaseUrl || '/manage-quota'))}
                                style={{
                                    padding: '12px 32px',
                                    background: isPlanExpired ? '#D97706' : '#2563EB',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: '8px',
                                    fontSize: '15px',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    boxShadow: isPlanExpired
                                        ? '0 4px 14px rgba(217, 119, 6, 0.25)'
                                        : '0 4px 14px rgba(37, 99, 235, 0.25)',
                                    transition: 'all 0.2s ease'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = isPlanExpired ? '#B45309' : '#1D4ED8';
                                    e.currentTarget.style.transform = 'translateY(-1px)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = isPlanExpired ? '#D97706' : '#2563EB';
                                    e.currentTarget.style.transform = 'translateY(0)';
                                }}
                            >
                                {isPlanExpired ? "Renew Plan Now" : "Proceed to Purchase"}
                            </button>
                        </div>
                    ) : (
                        <p style={{ fontSize: '15px', color: '#64748B', marginTop: '12px' }}>
                            Please contact your administrator to purchase {jobTypeLabel ? jobTypeLabel.toLowerCase() : 'service'} credits.
                        </p>
                    )
                )}
            </div>
    );

    if (!wrapLayout) {
        return content;
    }

    return (
        <EmployerLayout activeTab={activeTab}>
            {content}
        </EmployerLayout>
    );
}