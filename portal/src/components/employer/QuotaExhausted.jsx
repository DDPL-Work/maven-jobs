import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import EmployerLayout from './EmployerLayout';
import notAllowedImg from '../../../assets/notAllowed.png';

export default function QuotaExhausted({ jobTypeLabel, availablePlans = [] }) {
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

    const handlePostJobClick = (url) => {
        setDropdownOpen(false);
        // We use window.location.href or navigate
        // Because /post-job to /post-job?type=management might just change query params, 
        // causing a re-render. Let's use window.location.href to force a clean unmount/mount 
        // to reset states if we are already on PostJob component.
        window.location.href = url;
    };

    return (
        <EmployerLayout activeTab="jobs">
            <div style={{
                minHeight: '80vh',
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
                    style={{ width: '320px', height: 'auto', marginBottom: '24px' }} 
                />

                <h1 style={{
                    fontSize: '24px',
                    fontWeight: 600,
                    color: '#0F172A',
                    marginBottom: '12px'
                }}>
                    No active {jobTypeLabel} plan found
                </h1>

                {!isRecruiter && (
                    <>
                        <p style={{
                            fontSize: '15px',
                            color: '#64748B',
                            marginBottom: '28px',
                            fontWeight: 400
                        }}>
                            Continue to purchase plan
                        </p>

                        <button 
                            onClick={() => navigate('/manage-quota')}
                            style={{
                                padding: '12px 32px',
                                background: '#2563EB',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '6px',
                                fontSize: '15px',
                                fontWeight: 600,
                                cursor: 'pointer',
                                marginBottom: '48px',
                                transition: 'background 0.2s',
                                boxShadow: '0 4px 12px rgba(37, 99, 235, 0.2)'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = '#1D4ED8'}
                            onMouseLeave={(e) => e.currentTarget.style.background = '#2563EB'}
                        >
                            Proceed to Purchase
                        </button>
                    </>
                )}

                {availablePlans.length > 0 && (
                    <div style={{
                        background: '#F8FAFC',
                        borderRadius: '12px',
                        padding: '24px',
                        maxWidth: '560px',
                        width: '100%',
                        textAlign: 'center',
                    }}>
                        <p style={{
                            margin: '0 0 16px 0',
                            fontSize: '15.5px',
                            color: '#334155',
                            lineHeight: '1.5'
                        }}>
                            We have also found <strong>{availablePlans.map(p => p.label).join(', ')}</strong> job posting subscription in your account.
                        </p>
                        
                        <div style={{ position: 'relative', display: 'inline-block' }} ref={dropdownRef}>
                            <button 
                                onClick={() => {
                                    if (availablePlans.length === 1) {
                                        handlePostJobClick(availablePlans[0].url);
                                    } else {
                                        setDropdownOpen(!dropdownOpen);
                                    }
                                }}
                                style={{
                                    background: 'transparent',
                                    border: 'none',
                                    color: '#2563EB',
                                    fontSize: '15px',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    padding: '8px 12px',
                                    borderRadius: '6px',
                                    transition: 'background 0.2s'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.background = '#EFF6FF'}
                                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                            >
                                Post Job
                                {availablePlans.length > 1 && (
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
                                        <polyline points="6 9 12 15 18 9"></polyline>
                                    </svg>
                                )}
                            </button>

                            {dropdownOpen && availablePlans.length > 1 && (
                                <div style={{
                                    position: 'absolute',
                                    top: '100%',
                                    left: '50%',
                                    transform: 'translateX(-50%)',
                                    marginTop: '8px',
                                    background: '#fff',
                                    border: '1px solid #E2E8F0',
                                    borderRadius: '8px',
                                    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
                                    minWidth: '180px',
                                    zIndex: 50,
                                    overflow: 'hidden'
                                }}>
                                    {availablePlans.map((plan, idx) => (
                                        <div 
                                            key={idx}
                                            onClick={() => handlePostJobClick(plan.url)}
                                            style={{
                                                padding: '12px 16px',
                                                fontSize: '14px',
                                                fontWeight: 500,
                                                color: '#1E293B',
                                                cursor: 'pointer',
                                                textAlign: 'left',
                                                borderBottom: idx !== availablePlans.length - 1 ? '1px solid #F1F5F9' : 'none',
                                                transition: 'background 0.15s'
                                            }}
                                            onMouseEnter={(e) => e.currentTarget.style.background = '#F8FAFC'}
                                            onMouseLeave={(e) => e.currentTarget.style.background = '#fff'}
                                        >
                                            {plan.label}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </EmployerLayout>
    );
}
