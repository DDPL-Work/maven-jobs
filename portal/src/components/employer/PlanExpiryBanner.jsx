import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiAlertTriangle, FiArrowRight, FiX, FiLock, FiClock, FiCalendar } from 'react-icons/fi';
import api from '../../services/api';

export default function PlanExpiryBanner() {
  const navigate = useNavigate();
  const [expiryData, setExpiryData] = useState(null);
  const [monitoredEndDate, setMonitoredEndDate] = useState(null);
  const [now, setNow] = useState(Date.now());
  const [dismissed, setDismissed] = useState(false);
  const autoRefreshedRef = useRef(false);
  const lastMonitoredEndDateRef = useRef(null);

  // Clear any previously persisted session dismiss flag so refresh always shows the banner
  useEffect(() => {
    try {
      sessionStorage.removeItem('dismissed_plan_expiry_banner');
    } catch {}
  }, []);

  // Keep live time updated every 1 second for accurate real-time countdown clock
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchStatus = async () => {
    const userStored = localStorage.getItem('employerUser') || localStorage.getItem('user');
    if (!userStored || userStored === 'undefined') return;

    try {
      const res = await api.get('/company-panel/commercial/entitlements');
      if (res.data?.data) {
        const data = res.data.data;

        // Always check the plan expiry date directly from the Company model
        const companyPlan = data.companyPlan;
        const activePlan = data.activePlan;
        const expiredPlan = data.expiredPlan;
        const commercialStatus = data.commercialStatus;

        const endDateVal = companyPlan?.endDate || activePlan?.endDate || expiredPlan?.endDate;
        setMonitoredEndDate(endDateVal || null);
        if (endDateVal && endDateVal !== lastMonitoredEndDateRef.current) {
          lastMonitoredEndDateRef.current = endDateVal;
          autoRefreshedRef.current = false;
        }

        if (!endDateVal) {
          setExpiryData(null);
          return;
        }

        const targetTime = new Date(endDateVal).getTime();
        const diffMs = targetTime - Date.now();
        const totalHoursRemaining = diffMs > 0 ? Math.floor(diffMs / (1000 * 60 * 60)) : 0;

        // Expiry trigger: Within 7 days (168 hours) OR already expired
        const isExpiringSoon = totalHoursRemaining <= (7 * 24) && diffMs > 0;
        const isExpired = Boolean(
          diffMs <= 0 ||
          commercialStatus === 'EXPIRED_GRACE' ||
          commercialStatus === 'EXPIRED_LOCKED' ||
          companyPlan?.isExpired
        );

        if (isExpiringSoon || isExpired) {
          setExpiryData({
            ...data,
            diffMs,
            isExpiringSoon,
            isExpired,
            planName: companyPlan?.planName || activePlan?.planName || expiredPlan?.planName || 'Recruitment Plan',
            endDate: endDateVal,
          });
        } else {
          setExpiryData(null);
        }
      }
    } catch (_) {
      // Silently ignore if unauthenticated or endpoint is unreachable
    }
  };

  useEffect(() => {
    fetchStatus();

    const handleExternalChange = () => {
      fetchStatus();
    };
    window.addEventListener('plan-status-changed', handleExternalChange);
    window.addEventListener('employer-credits-changed', handleExternalChange);
    return () => {
      window.removeEventListener('plan-status-changed', handleExternalChange);
      window.removeEventListener('employer-credits-changed', handleExternalChange);
    };
  }, []);

  // Real-time automatic AJAX trigger:
  // When current countdown reaches 0 (the exact second current plan ends),
  // automatically trigger an AJAX call to activate the scheduled plan and refresh all credits in real time!
  useEffect(() => {
    const activeTargetDate = monitoredEndDate || expiryData?.endDate;
    if (!activeTargetDate) return;
    const target = new Date(activeTargetDate).getTime();
    if (now >= target && !autoRefreshedRef.current) {
      autoRefreshedRef.current = true;
      (async () => {
        try {
          const res = await api.get('/company-panel/commercial/entitlements');
          if (res.data?.data) {
            const data = res.data.data;
            // Notify all other components (ManageQuota, Buyonline, Header, etc.)
            window.dispatchEvent(new CustomEvent('employer-credits-changed', { detail: data }));
            window.dispatchEvent(new CustomEvent('plan-status-changed', { detail: data }));

            const companyPlan = data.companyPlan;
            const activePlan = data.activePlan;
            const expiredPlan = data.expiredPlan;
            const newEndDate = companyPlan?.endDate || activePlan?.endDate || expiredPlan?.endDate;
            setMonitoredEndDate(newEndDate || null);
            if (newEndDate && newEndDate !== lastMonitoredEndDateRef.current) {
              lastMonitoredEndDateRef.current = newEndDate;
              autoRefreshedRef.current = false;
            }

            const newDiff = newEndDate ? new Date(newEndDate).getTime() - Date.now() : 0;
            const newTotalHours = newDiff > 0 ? Math.floor(newDiff / (1000 * 60 * 60)) : 0;
            const isExpiringSoon = newTotalHours <= (7 * 24) && newDiff > 0;
            const isExpired = Boolean(
              newDiff <= 0 ||
              data.commercialStatus === 'EXPIRED_GRACE' ||
              data.commercialStatus === 'EXPIRED_LOCKED'
            );

            if (isExpiringSoon || isExpired) {
              setExpiryData({
                ...data,
                diffMs: newDiff,
                isExpiringSoon,
                isExpired,
                planName: companyPlan?.planName || activePlan?.planName || expiredPlan?.planName || 'Recruitment Plan',
                endDate: newEndDate,
              });
            } else {
              // New plan is active and healthy (e.g. valid for 90 days), clear banner automatically!
              setExpiryData(null);
            }
          }
        } catch (err) {
          console.warn('[PlanExpiryBanner] Auto-refresh failed:', err?.message);
        }
      })();
    }
  }, [now, monitoredEndDate, expiryData?.endDate]);

  if (!expiryData || dismissed) return null;

  // Closes the banner for the current view, but refreshes will show it again
  const handleDismiss = () => {
    setDismissed(true);
  };

  // Live countdown calculation
  const targetDate = expiryData.endDate ? new Date(expiryData.endDate).getTime() : 0;
  const currentDiffMs = Math.max(0, targetDate - now);
  const isExpired = currentDiffMs <= 0 || expiryData.isExpired;
  const isYellow = !isExpired && expiryData.isExpiringSoon;

  const totalSecs = Math.floor(currentDiffMs / 1000);
  const cdDays = Math.floor(totalSecs / 86400);
  const cdHours = Math.floor((totalSecs % 86400) / 3600);
  const cdMinutes = Math.floor((totalSecs % 3600) / 60);
  const cdSeconds = totalSecs % 60;
  const pad = (n) => String(n).padStart(2, '0');

  const dateObj = expiryData.endDate ? new Date(expiryData.endDate) : null;
  const isValidDate = dateObj && !isNaN(dateObj.getTime());

  // Exact Indian Standard Date & Time formatting
  const formattedDate = isValidDate
    ? dateObj.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : '';

  const hasSpecificTime = isValidDate && (dateObj.getHours() !== 0 || dateObj.getMinutes() !== 0);
  const formattedTime = hasSpecificTime
    ? dateObj.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      })
    : '';

  const totalGraceDays = expiryData.expiredPlan?.gracePeriodDays || expiryData.companyPlan?.gracePeriodDays || 90;
  const graceDaysRemaining = expiryData.graceDaysRemaining || 0;
  const isLocked = expiryData.commercialStatus === 'EXPIRED_LOCKED';

  // Professional Color Themes (Yellow & Red)
  const yellowTheme = {
    gradient: 'linear-gradient(90deg, #FEFCE8 0%, #FFFBEB 50%, #FEF9C3 100%)',
    border: '#FDE047',
    text: '#713F12',
    shadow: '0 2px 6px rgba(202, 138, 4, 0.06)',
    pillBg: '#FEF08A',
    pillBorder: '#FACC15',
    pillText: '#854D0E',
    dotBg: '#D97706',
    badgeBg: '#FFFFFF',
    badgeBorder: '#FDE68A',
    badgeText: '#78350F',
    badgeHighlight: '#D97706',
    btnBg: '#D97706',
    btnHover: '#B45309',
    btnShadow: '0 2px 4px rgba(217, 119, 6, 0.25)',
    cancelBorder: 'rgba(180, 83, 9, 0.25)',
    cancelColor: '#92400E',
    cancelHoverBg: 'rgba(254, 240, 138, 0.6)',
  };

  const redTheme = {
    gradient: 'linear-gradient(90deg, #FFF1F2 0%, #FEF2F2 50%, #FEE2E2 100%)',
    border: '#FECACA',
    text: '#881337',
    shadow: '0 2px 6px rgba(225, 29, 72, 0.06)',
    pillBg: '#FEE2E2',
    pillBorder: '#FCA5A5',
    pillText: '#991B1B',
    dotBg: '#E11D48',
    badgeBg: '#FFFFFF',
    badgeBorder: '#FECDD3',
    badgeText: '#9F1239',
    badgeHighlight: '#E11D48',
    btnBg: '#E11D48',
    btnHover: '#BE123C',
    btnShadow: '0 2px 4px rgba(225, 29, 72, 0.25)',
    cancelBorder: 'rgba(225, 29, 72, 0.25)',
    cancelColor: '#9F1239',
    cancelHoverBg: 'rgba(254, 226, 226, 0.6)',
  };

  const theme = isYellow ? yellowTheme : redTheme;

  return (
    <div
      style={{
        width: '100%',
        background: theme.gradient,
        borderBottom: `1px solid ${theme.border}`,
        color: theme.text,
        fontSize: '13px',
        fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
        boxSizing: 'border-box',
        zIndex: 250,
        position: 'relative',
        boxShadow: theme.shadow,
        transition: 'all 0.2s ease',
      }}
    >
      <div
        style={{
          width: '100%',
          padding: '7px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          flexWrap: 'wrap',
          minHeight: '42px',
          boxSizing: 'border-box',
        }}
      >
        {/* Left Side: Live Status Dot, Plan Name & Exact Expiry Date */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* Status Badge with Live Pulsing Dot */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '3px 9px',
              borderRadius: '16px',
              backgroundColor: theme.pillBg,
              border: `1px solid ${theme.pillBorder}`,
              color: theme.pillText,
              fontWeight: 700,
              fontSize: '11px',
              letterSpacing: '0.4px',
              textTransform: 'uppercase',
              flexShrink: 0,
            }}
          >
            {/* <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: theme.dotBg,
                display: 'inline-block',
                boxShadow: `0 0 0 2px ${theme.pillBg}`,
              }}
            /> */}
            <span>{isYellow ? 'Expiring Soon' : isLocked ? 'Access Locked' : 'Plan Expired'}</span>
          </div>

          {/* Description Text with Exact Expiry Date */}
          <div style={{ fontSize: '13px', lineHeight: 1.4, color: theme.text }}>
            {isYellow ? (
              <span>
                Your <strong>{expiryData.planName}</strong> validity expires on{' '}
                <strong>{formattedDate}{formattedTime ? ` at ${formattedTime}` : ''}</strong>.
              </span>
            ) : isLocked ? (
              <span>
                Your <strong>{expiryData.planName}</strong> {totalGraceDays}-day read-only period has ended. Candidate views are locked.
              </span>
            ) : (
              <span>
                Your <strong>{expiryData.planName}</strong> has expired. Read-only grace window active (<strong>{graceDaysRemaining} days remaining</strong>).
              </span>
            )}
          </div>
        </div>

        {/* Right Side: Live Digital Countdown + Action Button + Dismiss Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
          {/* Live Ticking Countdown Pill */}
          {isYellow && (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                backgroundColor: '#FFFFFF',
                border: `1px solid ${theme.badgeBorder}`,
                borderRadius: '6px',
                padding: '3px 8px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                fontFamily: "'SF Mono', Monaco, Consolas, 'Liberation Mono', monospace",
                fontSize: '12px',
                fontWeight: 700,
                color: theme.text,
              }}
              title="Live Countdown Timer"
            >
              <span
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '11px',
                  fontWeight: 600,
                  color: theme.badgeHighlight,
                  marginRight: '4px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <FiClock size={12} style={{ color: theme.badgeHighlight }} />
                <span>Ends in:</span>
              </span>
              <span style={{ padding: '2px 5px', borderRadius: '4px', background: '#FEF3C7', color: '#92400E' }}>
                {pad(cdDays)}d
              </span>
              <span style={{ color: theme.badgeHighlight, fontWeight: 700, opacity: 0.7 }}>:</span>
              <span style={{ padding: '2px 5px', borderRadius: '4px', background: '#FEF3C7', color: '#92400E' }}>
                {pad(cdHours)}h
              </span>
              <span style={{ color: theme.badgeHighlight, fontWeight: 700, opacity: 0.7 }}>:</span>
              <span style={{ padding: '2px 5px', borderRadius: '4px', background: '#FEF3C7', color: '#92400E' }}>
                {pad(cdMinutes)}m
              </span>
              <span style={{ color: theme.badgeHighlight, fontWeight: 700, opacity: 0.7 }}>:</span>
              <span style={{ padding: '2px 5px', borderRadius: '4px', background: '#FEF3C7', color: '#B45309' }}>
                {pad(cdSeconds)}s
              </span>
            </div>
          )}

          {/* For Expired State: Show exact expiration date */}
          {isExpired && formattedDate && (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                backgroundColor: '#FFFFFF',
                border: `1px solid ${theme.badgeBorder}`,
                padding: '3px 8px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 500,
                color: theme.badgeText,
                boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
              }}
            >
              <FiCalendar size={12} style={{ color: theme.badgeHighlight }} />
              <span>Expired on:</span>
              <strong>{formattedDate}{formattedTime ? ` • ${formattedTime}` : ''}</strong>
            </div>
          )}

          <button
            onClick={() => navigate('/buy-online?renew=true')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: theme.btnBg,
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '6px',
              padding: '6px 14px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: theme.btnShadow,
              transition: 'all 0.15s ease',
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = theme.btnHover;
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = theme.btnBg;
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <span>Renew Plan</span>
            <FiArrowRight size={13} />
          </button>

          <button
            onClick={handleDismiss}
            title="Dismiss notice"
            aria-label="Dismiss banner"
            style={{
              background: 'transparent',
              border: `1px solid ${theme.cancelBorder}`,
              cursor: 'pointer',
              color: theme.cancelColor,
              width: '26px',
              height: '26px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = theme.cancelHoverBg;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <FiX size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}
