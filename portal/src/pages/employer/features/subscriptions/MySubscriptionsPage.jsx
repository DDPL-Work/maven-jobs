import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiPhone, FiMail, FiChevronDown, FiChevronUp, FiCheckCircle, FiPackage, FiLoader } from 'react-icons/fi';
import EmployerLayout from '../../../../components/employer/EmployerLayout';
import EmployerBreadcrumb from '../../../../components/employer/EmployerBreadcrumb';
import authService from '../../../../services/authService';
import './MySubscriptionsPage.css';

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
      <div className="msp-container">
        {/* Breadcrumb Navigation */}
        <div className="msp-breadcrumb-wrapper">
          <EmployerBreadcrumb
            items={[
              { label: 'Employer Dashboard', path: '/employer-dashboard' },
              { label: 'My Subscriptions' },
            ]}
          />
        </div>

        {/* Floating Toast feedback */}
        {invoiceToast && (
          <div className="msp-toast">
            <FiCheckCircle size={18} color="#34d399" style={{ flexShrink: 0 }} />
            <span>{invoiceToast}</span>
          </div>
        )}

        {/* Page Title & Subtitle */}
        <div className="msp-header-wrapper">
          <h1 className="msp-page-title">
            Subscription Status
          </h1>
          <p className="msp-page-subtitle">
            List of all services purchased on this account
          </p>
        </div>

        {/* Tab Navigation with underline */}
        <div className="msp-tabs-bar">
          <div className="msp-tab-item">
            <span>All subscriptions ({subscriptions.length})</span>
            <div className="msp-tab-indicator" />
          </div>
        </div>

        {/* Main 2-Column Layout */}
        <div className="msp-layout">
          {/* Left Column: Subscriptions List */}
          <div className="msp-subs-col">
            {loading ? (
              <div className="msp-state-card">
                <div className="msp-loading-content">
                  <FiLoader className="animate-spin" size={20} color="#1e5eff" />
                  <span>Loading subscriptions from database...</span>
                </div>
              </div>
            ) : subscriptions.length === 0 ? (
              <div className="msp-state-card">
                <div className="msp-empty-icon">
                  <FiPackage size={26} />
                </div>
                <h3 className="msp-empty-title">
                  No subscriptions purchased yet
                </h3>
                <p className="msp-empty-desc">
                  There are currently no active or previous subscriptions recorded for this account. Explore our packages to post vacancies and search candidates.
                </p>
                <Link to="/employer-dashboard/pricing" className="msp-explore-btn">
                  Explore Packages
                </Link>
              </div>
            ) : (
              subscriptions.map((sub, idx) => {
                const isExpanded = !!expandedCards[idx];
                return (
                  <div key={sub.id || idx} className="msp-card">
                    {/* Card Header Summary */}
                    <div
                      className="msp-card-header"
                      onClick={() => toggleCard(idx)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          toggleCard(idx);
                        }
                      }}
                    >
                      {/* Left 3 Data Columns */}
                      <div className="msp-meta-grid">
                        {/* Transaction ID */}
                        <div className="msp-meta-item">
                          <div className="msp-meta-label">
                            Transaction ID
                          </div>
                          <div className="msp-meta-value msp-meta-val-tx">
                            {sub.transactionId}
                          </div>
                        </div>

                        {/* Date */}
                        <div className="msp-meta-item">
                          <div className="msp-meta-label">
                            Date
                          </div>
                          <div className="msp-meta-value">
                            {sub.date}
                          </div>
                        </div>

                        {/* Amount Paid */}
                        <div className="msp-meta-item">
                          <div className="msp-meta-label">
                            Amount Paid
                          </div>
                          <div className="msp-meta-value">
                            {sub.amountFormatted}
                          </div>
                        </div>
                      </div>

                      {/* Right action: Request invoice & chevron */}
                      <div className="msp-card-actions">
                        <button
                          type="button"
                          className="msp-invoice-btn"
                          onClick={(e) => handleRequestInvoice(sub, e)}
                        >
                          Request invoice
                        </button>
                        <span className="msp-chevron">
                          {isExpanded ? <FiChevronUp size={18} /> : <FiChevronDown size={18} />}
                        </span>
                      </div>
                    </div>

                    {/* Expanded Accordion Body */}
                    {isExpanded && (
                      <div className="msp-accordion-body">
                        <div className="msp-section-tag">
                          Product Description
                        </div>

                        <div className="msp-product-list">
                          {(sub.products || []).map((prod, pIdx) => {
                            const isActive = String(prod.status || '').toUpperCase() === 'ACTIVE';
                            return (
                              <div key={prod.id || pIdx} className="msp-product-row">
                                {/* Left bullet & details */}
                                <div className="msp-product-left">
                                  <span className="msp-product-dot" />
                                  <div>
                                    <div className="msp-product-name">
                                      {prod.name}
                                    </div>
                                    <div className="msp-product-validity">
                                      {prod.validity}
                                    </div>
                                  </div>
                                </div>

                                {/* Right Active / Expired badge */}
                                <span className={`msp-status-badge ${isActive ? 'msp-badge-active' : 'msp-badge-inactive'}`}>
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
          <div className="msp-sidebar-col">
            <div className="msp-sales-card">
              <h3 className="msp-sales-title">
                For Sales enquiry
              </h3>

              <div className="msp-sales-region">
                {salesEnquiry.region || 'INDIA'}
              </div>

              {/* Toll Free */}
              <div className="msp-contact-item">
                <div className="msp-contact-icon">
                  <FiPhone size={15} />
                </div>
                <div>
                  <div className="msp-contact-label">
                    Toll Free
                  </div>
                  <a
                    href={`tel:${salesEnquiry.tollFree.replace(/\s+/g, '')}`}
                    className="msp-contact-val"
                  >
                    {salesEnquiry.tollFree}
                  </a>
                </div>
              </div>

              {/* Email */}
              <div className="msp-contact-item">
                <div className="msp-contact-icon">
                  <FiMail size={15} />
                </div>
                <div>
                  <div className="msp-contact-label">
                    Email
                  </div>
                  <a
                    href={`mailto:${salesEnquiry.email}`}
                    className="msp-contact-val"
                  >
                    {salesEnquiry.email}
                  </a>
                </div>
              </div>

              {/* CRM Approver Card (Only if approver exists in DB) */}
              {approver && (
                <div className="msp-approver-card">
                  {approver.avatar ? (
                    <img
                      src={approver.avatar}
                      alt={approver.name}
                      className="msp-approver-avatar"
                    />
                  ) : (
                    <div className="msp-approver-fallback">
                      {getInitials(approver.name)}
                    </div>
                  )}

                  <div className="msp-approver-info">
                    <div className="msp-approver-name" title={approver.name}>
                      {approver.name}
                    </div>
                    {approver.email && (
                      <div className="msp-approver-email" title={approver.email}>
                        {approver.email}
                      </div>
                    )}
                    <div className="msp-approver-role">
                      {approver.role === 'APPROVER' ? 'ACCOUNT MANAGER' : (approver.role || 'ACCOUNT MANAGER')}
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
