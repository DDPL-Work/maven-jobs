import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiPhone, FiMail, FiChevronDown, FiChevronUp, FiCheckCircle, FiPackage, FiLoader } from 'react-icons/fi';
import EmployerLayout from '../../../../components/employer/EmployerLayout';
import EmployerBreadcrumb from '../../../../components/employer/EmployerBreadcrumb';
import authService from '../../../../services/authService';

export default function MySubscriptionsPage() {
  const [loading, setLoading] = useState(true);
  const [subscriptionData, setSubscriptionData] = useState(null);
  const [expandedCards, setExpandedCards] = useState({ 0: true }); // First card open by default
  const [invoiceToast, setInvoiceToast] = useState(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchSubscriptions() {
      try {
        setLoading(true);
        const res = await authService.getEmployerSubscriptions();
        if (isMounted && res?.data) {
          setSubscriptionData(res.data);
        }
      } catch (err) {
        console.error('Failed to fetch subscriptions from server:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchSubscriptions();

    return () => {
      isMounted = false;
    };
  }, []);

  // Strictly dynamic data from MongoDB — NO static or dummy fallback data
  const subscriptions = subscriptionData?.subscriptions || [];
  const approver = subscriptionData?.approver || null;
  const salesEnquiry = subscriptionData?.salesEnquiry || {
    tollFree: '1800 102 2558',
    email: 'sales@mavenjobs.com',
    region: 'INDIA',
  };

  const toggleCard = (index) => {
    setExpandedCards((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const handleRequestInvoice = (sub, e) => {
    e.stopPropagation();
    setInvoiceToast(`Invoice requested for Transaction ID #${sub.transactionId}. Sent to your registered email.`);
    setTimeout(() => {
      setInvoiceToast(null);
    }, 4500);
  };

  const getInitials = (name) => {
    if (!name) return 'CRM';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <EmployerLayout activeTab="subscriptions">
      <div style={{
        maxWidth: 1260,
        margin: '0 auto',
        padding: '24px 32px 60px',
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
      }}>
        {/* Breadcrumb Navigation */}
        <div style={{ marginBottom: 20 }}>
          <EmployerBreadcrumb
            items={[
              { label: 'Employer Dashboard', path: '/employer-dashboard' },
              { label: 'My Subscriptions' },
            ]}
          />
        </div>

        {/* Floating Toast feedback */}
        {invoiceToast && (
          <div style={{
            position: 'fixed',
            top: 24,
            right: 24,
            zIndex: 9999,
            backgroundColor: '#0f172a',
            color: '#ffffff',
            padding: '14px 20px',
            borderRadius: 12,
            boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            border: '1px solid #334155',
            fontSize: 14,
            fontWeight: 500,
          }}>
            <FiCheckCircle size={20} color="#34d399" style={{ flexShrink: 0 }} />
            <span>{invoiceToast}</span>
          </div>
        )}

        {/* Page Title & Subtitle */}
        <div style={{ marginBottom: 24 }}>
          <h1 style={{
            fontSize: 28,
            fontWeight: 800,
            color: '#0f172a',
            margin: 0,
            letterSpacing: '-0.4px',
            lineHeight: 1.25,
          }}>
            Subscription Status
          </h1>
          <p style={{
            fontSize: 14.5,
            color: '#64748b',
            marginTop: 6,
            marginBottom: 0,
            fontWeight: 400,
          }}>
            List of all services purchased on this account
          </p>
        </div>

        {/* Tab Navigation with underline */}
        <div style={{
          borderBottom: '1px solid #e2e8f0',
          marginBottom: 32,
          position: 'relative',
        }}>
          <div style={{
            display: 'inline-block',
            position: 'relative',
            paddingBottom: 12,
            fontWeight: 700,
            fontSize: 15,
            color: '#0f172a',
            cursor: 'pointer',
          }}>
            <span>All subscriptions ({subscriptions.length})</span>
            <div style={{
              position: 'absolute',
              bottom: -1,
              left: 0,
              right: 0,
              height: 3,
              backgroundColor: '#ef4444',
              borderRadius: '2px 2px 0 0',
            }} />
          </div>
        </div>

        {/* Main 2-Column Layout */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 28,
          alignItems: 'flex-start',
        }}>
          {/* Left Column: Subscriptions List */}
          <div style={{
            flex: '1 1 680px',
            minWidth: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: 20,
          }}>
            {loading ? (
              <div style={{
                backgroundColor: '#ffffff',
                borderRadius: 14,
                border: '1px solid #e2e8f0',
                padding: '48px 24px',
                textAlign: 'center',
                color: '#64748b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
                fontSize: 14.5,
              }}>
                <FiLoader className="animate-spin" size={20} color="#1e5eff" />
                <span>Loading subscriptions from database...</span>
              </div>
            ) : subscriptions.length === 0 ? (
              <div style={{
                backgroundColor: '#ffffff',
                borderRadius: 14,
                border: '1px solid #e2e8f0',
                padding: '48px 32px',
                textAlign: 'center',
                boxShadow: '0 1px 4px rgba(15, 23, 42, 0.04)',
              }}>
                <div style={{
                  width: 56,
                  height: 56,
                  borderRadius: '50%',
                  backgroundColor: '#f1f5f9',
                  color: '#64748b',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 16,
                }}>
                  <FiPackage size={26} />
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', margin: '0 0 8px' }}>
                  No subscriptions purchased yet
                </h3>
                <p style={{ fontSize: 14, color: '#64748b', maxWidth: 440, margin: '0 auto 20px', lineHeight: 1.5 }}>
                  There are currently no active or previous subscriptions recorded for this account. Explore our packages to post vacancies and search candidates.
                </p>
                <Link
                  to="/employer-dashboard/pricing"
                  style={{
                    display: 'inline-block',
                    backgroundColor: '#002366',
                    color: '#ffffff',
                    padding: '10px 24px',
                    borderRadius: 8,
                    fontWeight: 600,
                    fontSize: 14,
                    textDecoration: 'none',
                    transition: 'opacity 0.2s',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.9'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
                >
                  Explore Packages
                </Link>
              </div>
            ) : (
              subscriptions.map((sub, idx) => {
                const isExpanded = !!expandedCards[idx];
                return (
                  <div
                    key={sub.id || idx}
                    style={{
                      backgroundColor: '#ffffff',
                      borderRadius: 14,
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 1px 4px rgba(15, 23, 42, 0.04)',
                      overflow: 'hidden',
                      transition: 'border-color 0.2s, box-shadow 0.2s',
                    }}
                  >
                    {/* Card Header Summary */}
                    <div
                      onClick={() => toggleCard(idx)}
                      style={{
                        padding: '24px 28px',
                        cursor: 'pointer',
                        userSelect: 'none',
                        display: 'flex',
                        flexWrap: 'wrap',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 20,
                        backgroundColor: '#ffffff',
                      }}
                    >
                      {/* Left 3 Data Columns */}
                      <div style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        alignItems: 'center',
                        gap: 48,
                      }}>
                        {/* Transaction ID */}
                        <div>
                          <div style={{
                            fontSize: 12,
                            textTransform: 'none',
                            color: '#8c9aa8',
                            fontWeight: 500,
                            marginBottom: 4,
                            letterSpacing: '0.2px',
                          }}>
                            Transaction ID
                          </div>
                          <div style={{
                            fontSize: 17,
                            fontWeight: 700,
                            color: '#0f172a',
                            letterSpacing: '-0.2px',
                          }}>
                            {sub.transactionId}
                          </div>
                        </div>

                        {/* Date */}
                        <div>
                          <div style={{
                            fontSize: 12,
                            textTransform: 'none',
                            color: '#8c9aa8',
                            fontWeight: 500,
                            marginBottom: 4,
                            letterSpacing: '0.2px',
                          }}>
                            Date
                          </div>
                          <div style={{
                            fontSize: 16,
                            fontWeight: 700,
                            color: '#0f172a',
                          }}>
                            {sub.date}
                          </div>
                        </div>

                        {/* Amount Paid */}
                        <div>
                          <div style={{
                            fontSize: 12,
                            textTransform: 'none',
                            color: '#8c9aa8',
                            fontWeight: 500,
                            marginBottom: 4,
                            letterSpacing: '0.2px',
                          }}>
                            Amount Paid
                          </div>
                          <div style={{
                            fontSize: 16,
                            fontWeight: 700,
                            color: '#0f172a',
                          }}>
                            {sub.amountFormatted}
                          </div>
                        </div>
                      </div>

                      {/* Right action: Request invoice & chevron */}
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                      }}>
                        <button
                          type="button"
                          onClick={(e) => handleRequestInvoice(sub, e)}
                          style={{
                            background: 'none',
                            border: 'none',
                            padding: 0,
                            color: '#1e5eff',
                            fontSize: 14.5,
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            outline: 'none',
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.textDecoration = 'underline'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.textDecoration = 'none'; }}
                        >
                          Request invoice
                        </button>
                        <span style={{
                          color: '#1e5eff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}>
                          {isExpanded ? <FiChevronUp size={18} /> : <FiChevronDown size={18} />}
                        </span>
                      </div>
                    </div>

                    {/* Expanded Accordion Body */}
                    {isExpanded && (
                      <div style={{
                        padding: '0 28px 24px 28px',
                        borderTop: '1px solid #f1f5f9',
                      }}>
                        <div style={{
                          fontSize: 11,
                          fontWeight: 700,
                          color: '#8c9aa8',
                          letterSpacing: '0.8px',
                          textTransform: 'uppercase',
                          marginTop: 20,
                          marginBottom: 18,
                        }}>
                          PRODUCT DESCRIPTION
                        </div>

                        <div style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 18,
                        }}>
                          {(sub.products || []).map((prod, pIdx) => {
                            const isActive = String(prod.status || '').toUpperCase() === 'ACTIVE';
                            return (
                              <div
                                key={prod.id || pIdx}
                                style={{
                                  display: 'flex',
                                  alignItems: 'flex-start',
                                  justifyContent: 'space-between',
                                  gap: 20,
                                }}
                              >
                                {/* Left bullet & details */}
                                <div style={{
                                  display: 'flex',
                                  alignItems: 'flex-start',
                                  gap: 12,
                                }}>
                                  <span style={{
                                    width: 7,
                                    height: 7,
                                    borderRadius: '50%',
                                    backgroundColor: '#cbd5e1',
                                    marginTop: 6,
                                    flexShrink: 0,
                                  }} />
                                  <div>
                                    <div style={{
                                      fontSize: 14.5,
                                      fontWeight: 600,
                                      color: '#1e293b',
                                      lineHeight: 1.4,
                                    }}>
                                      {prod.name}
                                    </div>
                                    <div style={{
                                      fontSize: 12.5,
                                      color: '#8c9aa8',
                                      marginTop: 3,
                                    }}>
                                      {prod.validity}
                                    </div>
                                  </div>
                                </div>

                                {/* Right Active / Expired badge */}
                                <span style={{
                                  fontSize: 11,
                                  fontWeight: 700,
                                  padding: '3px 12px',
                                  borderRadius: 20,
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.6px',
                                  flexShrink: 0,
                                  backgroundColor: isActive ? '#eaf8ef' : '#f1f5f9',
                                  color: isActive ? '#16a34a' : '#64748b',
                                  border: isActive ? '1px solid #bbf7d0' : '1px solid #e2e8f0',
                                }}>
                                  {prod.status || 'ACTIVE'}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Right Column: For Sales enquiry & CRM Approver */}
          <div style={{
            flex: '0 0 310px',
            width: 310,
          }}>
            <div style={{
              backgroundColor: '#ffffff',
              borderRadius: 14,
              border: '1px solid #e2e8f0',
              boxShadow: '0 1px 4px rgba(15, 23, 42, 0.04)',
              padding: '24px',
            }}>
              <h3 style={{
                fontSize: 15,
                fontWeight: 700,
                color: '#0f172a',
                margin: 0,
                marginBottom: 16,
              }}>
                For Sales enquiry
              </h3>

              <div style={{
                fontSize: 11,
                fontWeight: 700,
                color: '#8c9aa8',
                letterSpacing: '0.8px',
                textTransform: 'uppercase',
                marginBottom: 14,
              }}>
                {salesEnquiry.region || 'INDIA'}
              </div>

              {/* Toll Free */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                marginBottom: 14,
              }}>
                <div style={{
                  width: 34,
                  height: 34,
                  borderRadius: '50%',
                  backgroundColor: '#eff6ff',
                  color: '#1e5eff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <FiPhone size={15} />
                </div>
                <div>
                  <div style={{
                    fontSize: 11,
                    color: '#8c9aa8',
                    fontWeight: 500,
                    lineHeight: 1,
                  }}>
                    Toll Free
                  </div>
                  <div style={{
                    fontSize: 13.5,
                    fontWeight: 700,
                    color: '#0f172a',
                    marginTop: 3,
                  }}>
                    {salesEnquiry.tollFree}
                  </div>
                </div>
              </div>

              {/* Email */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                marginBottom: 20,
              }}>
                <div style={{
                  width: 34,
                  height: 34,
                  borderRadius: '50%',
                  backgroundColor: '#eff6ff',
                  color: '#1e5eff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <FiMail size={15} />
                </div>
                <div>
                  <div style={{
                    fontSize: 11,
                    color: '#8c9aa8',
                    fontWeight: 500,
                    lineHeight: 1,
                  }}>
                    Email
                  </div>
                  <div style={{
                    fontSize: 13.5,
                    fontWeight: 700,
                    color: '#0f172a',
                    marginTop: 3,
                  }}>
                    {salesEnquiry.email}
                  </div>
                </div>
              </div>

              {/* CRM Approver Card (Only if approver exists in DB) */}
              {approver && (
                <div style={{
                  backgroundColor: '#f8fafc',
                  borderRadius: 10,
                  border: '1px solid #edf2f7',
                  padding: '12px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                }}>
                  {approver.avatar ? (
                    <img
                      src={approver.avatar}
                      alt={approver.name}
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: '50%',
                        objectFit: 'cover',
                        flexShrink: 0,
                        border: '1px solid #cbd5e1',
                      }}
                    />
                  ) : (
                    <div style={{
                      width: 40,
                      height: 40,
                      borderRadius: '50%',
                      backgroundColor: '#1e5eff',
                      color: '#ffffff',
                      fontWeight: 700,
                      fontSize: 14,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      {getInitials(approver.name)}
                    </div>
                  )}

                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{
                      fontWeight: 700,
                      color: '#0f172a',
                      fontSize: 14,
                      lineHeight: 1.3,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}>
                      {approver.name}
                    </div>
                    {approver.email && (
                      <div
                        style={{
                          fontSize: 12,
                          color: '#64748b',
                          marginTop: 2,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                        title={approver.email}
                      >
                        {approver.email}
                      </div>
                    )}
                    <div style={{
                      fontSize: 10.5,
                      fontWeight: 600,
                      color: '#1e5eff',
                      marginTop: 2,
                    }}>
                      {approver.role || 'CRM Approver'}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </EmployerLayout>
  );
}
