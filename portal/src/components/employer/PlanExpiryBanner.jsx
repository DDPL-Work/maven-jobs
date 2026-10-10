import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiAlertTriangle, FiArrowRight, FiX, FiLock, FiClock, FiCalendar } from 'react-icons/fi';
import api from '../../services/api';
import './PlanExpiryBanner.css';

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

  const cssVars = {
    '--peb-gradient': theme.gradient,
    '--peb-border': theme.border,
    '--peb-text': theme.text,
    '--peb-shadow': theme.shadow,
    '--peb-pill-bg': theme.pillBg,
    '--peb-pill-border': theme.pillBorder,
    '--peb-pill-text': theme.pillText,
    '--peb-dot-bg': theme.dotBg,
    '--peb-badge-bg': theme.badgeBg,
    '--peb-badge-border': theme.badgeBorder,
    '--peb-badge-text': theme.badgeText,
    '--peb-badge-highlight': theme.badgeHighlight,
    '--peb-btn-bg': theme.btnBg,
    '--peb-btn-hover': theme.btnHover,
    '--peb-btn-shadow': theme.btnShadow,
    '--peb-cancel-border': theme.cancelBorder,
    '--peb-cancel-color': theme.cancelColor,
    '--peb-cancel-hover-bg': theme.cancelHoverBg,
  };

  return (
    <div className="peb-wrapper" style={cssVars}>
      <div className="peb-container">
        {/* Left Side: Status Badge, Live Indicator & Description Message */}
        <div className="peb-left">
          <div className="peb-status-badge">
            <span className="peb-status-dot" />
            <span>{isYellow ? 'Expiring Soon' : isLocked ? 'Access Locked' : 'Plan Expired'}</span>
          </div>

          <div className="peb-message">
            {isYellow ? (
              <span>
                Your <strong>{expiryData.planName}</strong> validity expires on{' '}
                <strong>{formattedDate}</strong>
                {formattedTime && <span className="peb-time-detail">{` at ${formattedTime}`}</span>}.
              </span>
            ) : isLocked ? (
              <span>
                Your <strong>{expiryData.planName}</strong> {totalGraceDays}-day read-only period has ended. Candidate views are locked.
              </span>
            ) : (
              <span>
                Your <strong>{expiryData.planName}</strong> has expired. Read-only grace active (<strong>{graceDaysRemaining}d remaining</strong>).
              </span>
            )}
          </div>
        </div>

        {/* Right Side: Live Digital Countdown + Action Button + Dismiss Button */}
        <div className="peb-right">
          {/* Live Ticking Countdown Pill */}
          {isYellow && (
            <div className="peb-countdown" title="Live Countdown Timer">
              <span className="peb-countdown-label">
                <FiClock size={11} style={{ color: 'var(--peb-badge-highlight)' }} />
                <span className="peb-countdown-text">Ends in:</span>
              </span>
              <span className="peb-countdown-unit">{pad(cdDays)}d</span>
              <span className="peb-countdown-sep">:</span>
              <span className="peb-countdown-unit">{pad(cdHours)}h</span>
              <span className="peb-countdown-sep">:</span>
              <span className="peb-countdown-unit">{pad(cdMinutes)}m</span>
              <span className="peb-countdown-sep">:</span>
              <span className="peb-countdown-unit">{pad(cdSeconds)}s</span>
            </div>
          )}

          {/* For Expired State: Show exact expiration date */}
          {isExpired && formattedDate && (
            <div className="peb-expired-date">
              <FiCalendar size={11} style={{ color: 'var(--peb-badge-highlight)' }} />
              <span>Expired on:</span>
              <strong>{formattedDate}{formattedTime ? ` • ${formattedTime}` : ''}</strong>
            </div>
          )}

          <div className="peb-right-actions">
            <button
              onClick={() => navigate('/buy-online?renew=true')}
              className="peb-renew-btn"
            >
              <span>Renew Plan</span>
              <FiArrowRight size={12} />
            </button>

            <button
              onClick={handleDismiss}
              title="Dismiss notice"
              aria-label="Dismiss banner"
              className="peb-dismiss-btn"
            >
              <FiX size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
