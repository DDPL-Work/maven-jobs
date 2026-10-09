import { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiCalendar, FiClock, FiZap, FiInfo, FiEdit2,
  FiExternalLink, FiPieChart, FiTrendingUp, FiCheckCircle,
  FiRotateCcw, FiSave, FiLayers, FiSend,
  FiPackage, FiShield, FiBriefcase, FiCpu, FiCheck, FiUsers
} from 'react-icons/fi';
import EmployerLayout from '../../../../components/employer/EmployerLayout';
import EmployerBreadcrumb from '../../../../components/employer/EmployerBreadcrumb';
import authService from '../../../../services/authService';
import './ManageQuota.css';

export default function ManageQuota() {
  const navigate = useNavigate();

  const [allocationPolicy, setAllocationPolicy] = useState('full'); 
  const [loading, setLoading] = useState(true);

  const [policyAllocations, setPolicyAllocations] = useState({
    weekly: {
      cvAccess: { total: 0, used: 0 },
      nvite: { total: 0, used: 0 },
    },
    monthly: {
      cvAccess: { total: 0, used: 0 },
      nvite: { total: 0, used: 0 },
    },
    full: {
      cvAccess: { total: 0, used: 0 },
      nvite: { total: 0, used: 0 },
    },
  });

  const [rawServerData, setRawServerData] = useState(null);
  const [planData, setPlanData] = useState(null);
  const [servicesData, setServicesData] = useState([]);

  const [editDrafts, setEditDrafts] = useState({
    cvAccess: null,
    nvite: null,
  });
  const [editErrors, setEditErrors] = useState({
    cvAccess: '',
    nvite: '',
  });

  useEffect(() => {
    fetchQuotaData();
  }, []);

  const fetchQuotaData = async () => {
    try {
      setLoading(true);
      const res = await authService.getQuotaManagement();
      if (res.success && res.data) {
        setRawServerData(res.data);
        setAllocationPolicy(res.data.allocationPolicy || 'full');
        setPolicyAllocations(res.data);
        setPlanData(res.data.plan || null);
        setServicesData(Array.isArray(res.data.services) ? res.data.services : []);
      }
    } catch (error) {
      showToast(error.message || 'Failed to load quota configuration');
    } finally {
      setLoading(false);
    }
  };

  const saveBtnRef = useRef(null);

  // Toast message
  const [toast, setToast] = useState(null);
  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  // Helper date formatter
  const formatDate = (dateVal) => {
    if (!dateVal) return '—';
    try {
      return new Date(dateVal).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return String(dateVal);
    }
  };

  const calcDaysLeft = (endDateVal) => {
    if (!endDateVal) return null;
    try {
      const end = new Date(endDateVal).getTime();
      const now = Date.now();
      const diff = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
      return diff > 0 ? diff : 0;
    } catch {
      return null;
    }
  };

  // Resdex Usage Summary Data dynamically computed from full policy (no dummy data)
  const resdexUsageData = useMemo(() => {
    const fullCv = policyAllocations.full?.cvAccess || { total: 0, used: 0 };
    const fullNvite = policyAllocations.full?.nvite || { total: 0, used: 0 };

    return [
      { label: 'Default', cv: fullCv.total.toLocaleString(), nvite: fullNvite.total.toLocaleString(), isBold: false },
      { label: 'Purchased', cv: '—', nvite: '—', isBold: false },
      { label: 'Total*', cv: fullCv.total.toLocaleString(), nvite: fullNvite.total.toLocaleString(), isBold: true },
      { label: 'Released', cv: fullCv.total.toLocaleString(), nvite: fullNvite.total.toLocaleString(), isBold: true },
      { label: 'Used', cv: fullCv.used.toLocaleString(), nvite: fullNvite.used.toLocaleString(), isBold: false, isWarning: true },
      { label: 'Remaining', cv: Math.max(0, fullCv.total - fullCv.used).toLocaleString(), nvite: Math.max(0, fullNvite.total - fullNvite.used).toLocaleString(), isBold: true, isSuccess: true },
    ];
  }, [policyAllocations.full]);

  // Active policy quota data
  const currentPolicyData = policyAllocations[allocationPolicy] || {
    cvAccess: { total: 0, used: 0 },
    nvite: { total: 0, used: 0 },
  };

  // Compute Balances and Percentages dynamically with drafts
  const currentCvTotal = allocationPolicy !== 'full' && editDrafts.cvAccess !== null && !isNaN(parseInt(String(editDrafts.cvAccess).replace(/,/g, ''), 10))
    ? parseInt(String(editDrafts.cvAccess).replace(/,/g, ''), 10)
    : (currentPolicyData.cvAccess?.total || 0);
  const currentCvUsed = currentPolicyData.cvAccess?.used || 0;
  const cvBalance = Math.max(0, currentCvTotal - currentCvUsed);
  const cvPercent = Math.min(100, Math.round((currentCvUsed / (currentCvTotal || 1)) * 100)) || 0;

  const currentNviteTotal = allocationPolicy !== 'full' && editDrafts.nvite !== null && !isNaN(parseInt(String(editDrafts.nvite).replace(/,/g, ''), 10))
    ? parseInt(String(editDrafts.nvite).replace(/,/g, ''), 10)
    : (currentPolicyData.nvite?.total || 0);
  const currentNviteUsed = currentPolicyData.nvite?.used || 0;
  const nviteBalance = Math.max(0, currentNviteTotal - currentNviteUsed);
  const nvitePercent = Math.min(100, Math.round((currentNviteUsed / (currentNviteTotal || 1)) * 100)) || 0;

  // Revert all unsaved changes and close edit inputs
  const handleCancelAllDrafts = () => {
    setEditDrafts({ cvAccess: null, nvite: null });
    setEditErrors({ cvAccess: '', nvite: '' });
  };

  // Switch allocation policy
  const handlePolicyChange = (policy) => {
    handleCancelAllDrafts();
    setAllocationPolicy(policy);
  };

  // Handle Edit Start (only allowed in weekly and monthly modes and ONLY if credits > 0)
  const handleStartEdit = (key) => {
    if (allocationPolicy === 'full') return;
    const fullPool = policyAllocations.full?.[key]?.total || 0;
    if (fullPool <= 0) {
      showToast(`Cannot edit: 0 ${key === 'cvAccess' ? 'CV Access' : 'NVite'} credits in your active plan.`);
      return;
    }
    setEditDrafts((prev) => ({
      ...prev,
      [key]: String(policyAllocations[allocationPolicy]?.[key]?.total || 0),
    }));
    setEditErrors((prev) => ({
      ...prev,
      [key]: '',
    }));
  };

  // Click outside to cancel unsaved edits
  useEffect(() => {
    const isEditing = editDrafts.cvAccess !== null || editDrafts.nvite !== null;
    if (!isEditing) return;

    const handlePointerDown = (e) => {
      if (e.target.closest('.mq-inline-edit-box')) return;
      if (e.target.closest('.mq-btn-edit-pencil')) return;
      if (saveBtnRef.current && saveBtnRef.current.contains(e.target)) return;
      handleCancelAllDrafts();
    };

    document.addEventListener('pointerdown', handlePointerDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
    };
  }, [editDrafts]);

  // Save Settings: saves all edited quota values and policy
  const handleSaveAllSettings = async () => {
    let hasError = false;
    const newErrors = { cvAccess: '', nvite: '' };
    
    const activeData = policyAllocations[allocationPolicy] || {};
    
    let cvTotal = activeData.cvAccess?.total || 0;
    let nviteTotal = activeData.nvite?.total || 0;

    if (allocationPolicy !== 'full') {
      const fullCvPool = policyAllocations.full?.cvAccess?.total || 0;
      const fullNvitePool = policyAllocations.full?.nvite?.total || 0;

      if (fullCvPool <= 0) {
        cvTotal = 0;
      } else if (editDrafts.cvAccess !== null) {
        const num = parseInt(String(editDrafts.cvAccess).replace(/,/g, ''), 10);
        if (isNaN(num) || num < 0) {
          newErrors.cvAccess = 'Enter a valid positive number';
          hasError = true;
        } else if (num < (activeData.cvAccess?.used || 0)) {
          newErrors.cvAccess = `Cannot be less than used (${(activeData.cvAccess?.used || 0).toLocaleString()})`;
          hasError = true;
        } else {
          cvTotal = num;
        }
      }

      if (fullNvitePool <= 0) {
        nviteTotal = 0;
      } else if (editDrafts.nvite !== null) {
        const num = parseInt(String(editDrafts.nvite).replace(/,/g, ''), 10);
        if (isNaN(num) || num < 0) {
          newErrors.nvite = 'Enter a valid positive number';
          hasError = true;
        } else if (num < (activeData.nvite?.used || 0)) {
          newErrors.nvite = `Cannot be less than used (${(activeData.nvite?.used || 0).toLocaleString()})`;
          hasError = true;
        } else {
          nviteTotal = num;
        }
      }
    }

    if (hasError) {
      setEditErrors(newErrors);
      return;
    }

    try {
      setLoading(true);
      const payload = {
        allocationPolicy,
      };

      if (allocationPolicy === 'weekly') {
        payload.weekly = { cvAccess: cvTotal, nvite: nviteTotal };
      } else if (allocationPolicy === 'monthly') {
        payload.monthly = { cvAccess: cvTotal, nvite: nviteTotal };
      }

      await authService.updateQuotaManagement(payload);
      
      setPolicyAllocations((prev) => ({
        ...prev,
        [allocationPolicy]: {
          ...prev[allocationPolicy],
          cvAccess: { ...prev[allocationPolicy]?.cvAccess, total: cvTotal },
          nvite: { ...prev[allocationPolicy]?.nvite, total: nviteTotal },
        },
      }));
      setEditDrafts({ cvAccess: null, nvite: null });
      setEditErrors({ cvAccess: '', nvite: '' });
      showToast(`${allocationPolicy === 'weekly' ? 'Weekly' : allocationPolicy === 'monthly' ? 'Monthly' : 'Full Access'} quota settings saved successfully!`);
    } catch (error) {
      showToast(error.message || 'Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  // Reset to default (Restores TRUE server allocations, no dummy numbers)
  const handleResetSettings = () => {
    if (rawServerData) {
      setAllocationPolicy(rawServerData.allocationPolicy || 'full');
      setPolicyAllocations(rawServerData);
    }
    handleCancelAllDrafts();
    showToast('Settings restored to company default allocations.');
  };

  // Filter extra services from planSnapshot that are not already in CV Access or NVite, and exclude seat products (which are recruiter licenses)
  const extraServices = useMemo(() => {
    return servicesData.filter((s) => {
      const code = String(s.productCode || '').toUpperCase();
      const cat = String(s.category || '').toUpperCase();
      const unitStr = String(s.unit || '').toLowerCase();
      const isSeat = s.isSeat || code.includes('SEAT') || cat === 'USER_SEATS' || unitStr.includes('seat');
      return !isSeat &&
             !code.includes('CV') && !code.includes('RESDEX') && cat !== 'RESUME_SEARCH' &&
             !code.includes('NVITE') && !code.includes('MIVITE') && cat !== 'MIVITES';
    });
  }, [servicesData]);

  const formatServiceProductName = (service) => {
    const code = String(service?.productCode || '').toUpperCase();
    const rawName = String(service?.productName || '').trim();
    if (code === 'RESDEX' || rawName === 'ResDex Resume Search' || rawName.toLowerCase() === 'resdex resume search') {
      return 'Max CV Access';
    }
    if (code === 'MIVITE' || rawName === 'MIvites Candidate Outreach' || rawName.toLowerCase() === 'mivites candidate outreach') {
      return 'Max NVite Credits';
    }
    return service?.productName || 'Product';
  };

  if (loading) {
    return (
      <EmployerLayout requireAuth={false}>
        <div className="mq-container" style={{ display: 'flex', justifyContent: 'center', padding: '50px' }}>
          <div className="mq-loading-spinner" />
          <p style={{ marginLeft: 10 }}>Loading Quota Information...</p>
        </div>
      </EmployerLayout>
    );
  }

  return (
    <EmployerLayout requireAuth={false}>
      <div className="mq-container">
        {/* Toast Notification */}
        {toast && (
          <div className="mq-toast">
            <FiCheckCircle size={18} color="#10b981" />
            <span>{toast}</span>
          </div>
        )}

        {/* Breadcrumb Navigation */}
        <EmployerBreadcrumb
          items={[
            { label: 'Home', link: '/' },
            { label: 'Employer Dashboard', link: '/employer-dashboard' },
            { label: 'Manage Quota' }
          ]}
        />

        {/* Page Header */}
        <div className="mq-header-row">
          <div>
            <h1 className="mq-title">Manage Quota</h1>
            <p className="mq-subtitle">
              Configure and distribute your active CV view limits, candidate outreach messaging, and job posting slots across your recruitment team. Job posting, Max CV Access, and Max NVite Credits are allocated for your full plan cycle ({planData?.validity || 90} days), while AI credits refresh monthly without rollover.
            </p>
          </div>

          <div className="mq-header-actions">
            <button
              type="button"
              className="mq-btn-outline"
              onClick={handleResetSettings}
              title="Reset allocations to default"
            >
              <FiRotateCcw size={14} />
              Reset Defaults
            </button>
            <button
              type="button"
              className="mq-btn-outline"
              onClick={() => navigate('/report/resdex')}
            >
              <FiTrendingUp size={14} />
              Usage Reports
            </button>
          </div>
        </div>

        {/* EXTRA SECTION: Active Subscribed Plan Banner */}
        {planData && (
          <div className="mq-plan-banner">
            <div className="mq-plan-banner-top">
              <div className="mq-plan-banner-title-area">
                <div className="mq-plan-banner-icon">
                  <FiPackage size={24} />
                </div>
                <div>
                  <h2 className="mq-plan-banner-name">
                    {planData.planName || 'Active Commercial Plan'}
                    <span className="mq-plan-pill">{planData.planType || 'ACTIVE'}</span>
                  </h2>
                  <div className="mq-plan-banner-sub">
                    Plan Code: <strong style={{ color: '#ffffff' }}>{planData.planCode || 'FREE'}</strong>
                    {planData.billingCycle && ` • Cycle: ${planData.billingCycle}`}
                    {planData.startDate && ` • Start: ${formatDate(planData.startDate)}`}
                    {planData.endDate && ` • Valid Till: ${formatDate(planData.endDate)}`}
                  </div>
                </div>
              </div>

              <div className="mq-plan-banner-chips">
                {planData.endDate && (
                  <div className="mq-plan-chip">
                    <FiClock size={13} />
                    <span>{calcDaysLeft(planData.endDate)} Days Remaining</span>
                  </div>
                )}
                {planData.planVersionNumber && (
                  <div className="mq-plan-chip">
                    <FiZap size={13} />
                    <span>Catalog v{planData.planVersionNumber}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="mq-plan-banner-footer">
              <div className="mq-plan-guarantee">
                <FiShield size={15} />
                <span>Locked Catalog Specifications Guarantee</span>
              </div>
              <span>Allocations are permanently locked into your profile at registration and remain immune to catalog revisions.</span>
            </div>
          </div>
        )}

        {/* Top Summary Stat Cards */}
        <div className="mq-stats-grid">
          {/* Stat 1: CV Access Balance */}
          <div className="mq-stat-card">
            <div className="mq-stat-top">
              <div className="mq-stat-icon-wrapper cv">
                <FiLayers size={22} color="#002366" />
              </div>
              <span className="mq-stat-badge cv">
                {currentCvTotal > 0 ? `${100 - cvPercent}% Remaining` : 'Not in Plan'}
              </span>
            </div>
            <div className="mq-stat-label">CV Access Available</div>
            <div className="mq-stat-value-row">
              <span className="mq-stat-value">{cvBalance.toLocaleString()}</span>
              <span className="mq-stat-total">/ {currentCvTotal.toLocaleString()} total</span>
            </div>
            <div className="mq-stat-progress-bar">
              <div
                className="mq-stat-progress-fill cv"
                style={{ width: `${cvPercent}%` }}
              />
            </div>
            <div className="mq-stat-footer">
              <span>{currentCvUsed.toLocaleString()} Used</span>
              <span>{cvBalance.toLocaleString()} {currentCvTotal > 0 ? (allocationPolicy === 'full' ? 'Remaining' : 'Balance') : 'Available'}</span>
            </div>
          </div>

          {/* Stat 2: NVite Credits Balance */}
          <div className="mq-stat-card">
            <div className="mq-stat-top">
              <div className="mq-stat-icon-wrapper nvite">
                <FiSend size={22} color="#0284c7" />
              </div>
              <span className="mq-stat-badge nvite">
                {currentNviteTotal > 0 ? `${100 - nvitePercent}% Remaining` : 'Not in Plan'}
              </span>
            </div>
            <div className="mq-stat-label">NVite Credits Available</div>
            <div className="mq-stat-value-row">
              <span className="mq-stat-value">{nviteBalance.toLocaleString()}</span>
              <span className="mq-stat-total">/ {currentNviteTotal.toLocaleString()} total</span>
            </div>
            <div className="mq-stat-progress-bar">
              <div
                className="mq-stat-progress-fill nvite"
                style={{ width: `${nvitePercent}%` }}
              />
            </div>
            <div className="mq-stat-footer">
              <span>{currentNviteUsed.toLocaleString()} Used</span>
              <span>{nviteBalance.toLocaleString()} {allocationPolicy === 'full' ? 'Remaining' : 'Balance'}</span>
            </div>
          </div>

          {/* Stat 3: Active Allocation Cycle */}
          <div className="mq-stat-card">
            <div className="mq-stat-top">
              <div className="mq-stat-icon-wrapper cycle">
                <FiClock size={22} color="#10b981" />
              </div>
              <span className="mq-stat-badge cycle">Active Policy</span>
            </div>
            <div className="mq-stat-label">Current Release Cycle</div>
            <div className="mq-stat-value-row">
              <span className="mq-stat-value">
                {allocationPolicy === 'weekly' ? 'Weekly' : allocationPolicy === 'monthly' ? 'Monthly' : 'Full Plan Cycle'}
              </span>
            </div>
            <div className="mq-cycle-desc">
              {allocationPolicy === 'weekly' && 'Weekly assigned quota resets every Monday 00:00 IST.'}
              {allocationPolicy === 'monthly' && 'Monthly assigned quota replenishes on the 1st of each month.'}
              {allocationPolicy === 'full' && `Job postings, CV access, and NVites are allocated for your full plan cycle (${planData?.validity || 90} days). AI credits refresh monthly without rollover.`}
            </div>
          </div>

          {/* EXTRA STAT CARDS: Dynamically generated for other plan services (e.g. SMB Jobs, AI Credits) */}
          {extraServices.map((service) => {
            const code = String(service.productCode || '').toUpperCase();
            const isJob = code.includes('JOB') || service.category === 'JOB_POSTING' || String(service.unit).toLowerCase().includes('job');
            const isAi = code.includes('AI') || service.category === 'AI' || String(service.unit).toLowerCase().includes('ai');
            const iconVariant = isJob ? 'job' : isAi ? 'ai' : 'service';
            const percentRemaining = Math.max(0, 100 - (service.percentUsed || 0));

            return (
              <div key={service._id || service.productCode} className="mq-stat-card">
                <div className="mq-stat-top">
                  <div className={`mq-stat-icon-wrapper ${iconVariant}`}>
                    {isJob ? (
                      <FiBriefcase size={22} color="#be185d" />
                    ) : isAi ? (
                      <FiCpu size={22} color="#6d28d9" />
                    ) : (
                      <FiPackage size={22} color="#475569" />
                    )}
                  </div>
                  <span className={`mq-stat-badge ${iconVariant}`}>
                    {isAi ? 'Monthly • No Rollover' : isJob ? 'Full Plan Cycle' : `${percentRemaining}% Remaining`}
                  </span>
                </div>
                <div className="mq-stat-label">{isAi ? 'AI Credits (Current Month)' : `${formatServiceProductName(service)} Quota`}</div>
                <div className="mq-stat-value-row">
                  <span className="mq-stat-value">{service.remaining?.toLocaleString() ?? 0}</span>
                  <span className="mq-stat-total">/ {(service.total || 0).toLocaleString()} {service.total === 1 ? service.unit : (service.unit?.endsWith('s') ? service.unit : `${service.unit}s`)}</span>
                </div>
                <div className="mq-stat-progress-bar">
                  <div
                    className={`mq-stat-progress-fill ${iconVariant}`}
                    style={{ width: `${service.percentUsed || 0}%` }}
                  />
                </div>
                <div className="mq-stat-footer">
                  <span>{(service.used || 0).toLocaleString()} Used</span>
                  <span>{(service.remaining || 0).toLocaleString()} Available</span>
                </div>
                {isAi && (
                  <div style={{ fontSize: '11px', color: '#6d28d9', marginTop: '8px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <FiInfo size={12} />
                    <span>Monthly allowance — remaining credits do not carry forward to next month</span>
                  </div>
                )}
                {isJob && (
                  <div style={{ fontSize: '11px', color: '#be185d', marginTop: '8px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <FiInfo size={12} />
                    <span>Allocated for full plan cycle ({planData?.validity || service.validity || 90} days)</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Main Workspace Layout (2 Columns) */}
        <div className="mq-main-grid">
          {/* Left Column: Allocation Settings Card */}
          <div className="mq-card mq-allocation-card">
            <div className="mq-card-header">
              <div>
                <h2 className="mq-card-title">Allocate Quota Policy</h2>
                <p className="mq-card-desc">
                  Choose how and when credits are replenished for your sub-users.
                </p>
              </div>
            </div>

            {/* Policy Selector Options (Weekly, Monthly, Full Access) */}
            <div className="mq-policy-selector-group">
              <label
                className={`mq-policy-option ${allocationPolicy === 'weekly' ? 'selected' : ''}`}
                onClick={() => handlePolicyChange('weekly')}
              >
                <input
                  type="radio"
                  name="allocationPolicy"
                  value="weekly"
                  checked={allocationPolicy === 'weekly'}
                  onChange={() => handlePolicyChange('weekly')}
                />
                <div className="mq-policy-option-content">
                  <div className="mq-policy-title-row">
                    <FiCalendar size={16} />
                    <span className="mq-policy-title">Weekly</span>
                    <span className="mq-pill-recommended">Recommended</span>
                  </div>
                </div>
              </label>

              <label
                className={`mq-policy-option ${allocationPolicy === 'monthly' ? 'selected' : ''}`}
                onClick={() => handlePolicyChange('monthly')}
              >
                <input
                  type="radio"
                  name="allocationPolicy"
                  value="monthly"
                  checked={allocationPolicy === 'monthly'}
                  onChange={() => handlePolicyChange('monthly')}
                />
                <div className="mq-policy-option-content">
                  <div className="mq-policy-title-row">
                    <FiClock size={16} />
                    <span className="mq-policy-title">Monthly</span>
                  </div>
                </div>
              </label>

              <label
                className={`mq-policy-option ${allocationPolicy === 'full' ? 'selected' : ''}`}
                onClick={() => handlePolicyChange('full')}
              >
                <input
                  type="radio"
                  name="allocationPolicy"
                  value="full"
                  checked={allocationPolicy === 'full'}
                  onChange={() => handlePolicyChange('full')}
                />
                <div className="mq-policy-option-content">
                  <div className="mq-policy-title-row">
                    <FiZap size={16} />
                    <span className="mq-policy-title">Full Plan Cycle</span>
                    <span className="mq-pill-recommended">Default</span>
                  </div>
                </div>
              </label>
            </div>

            {/* Quota Allocation Interactive Table */}
            <div className="mq-table-wrapper">
              <table className="mq-table">
                <thead>
                  <tr>
                    <th className="mq-th">Resource</th>
                    <th className="mq-th" style={{ textAlign: 'right' }}>Total</th>
                    <th className="mq-th" style={{ textAlign: 'right' }}>Used</th>
                    <th className="mq-th" style={{ textAlign: 'right' }}>
                      {allocationPolicy === 'full' ? 'Remaining' : 'Balance'}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {/* Row 1: Max CV Access */}
                  <tr className="mq-tr">
                    <td className="mq-td font-medium">
                      <div className="mq-metric-title-cell">
                        <div className="mq-metric-icon-small cv">
                          <FiLayers size={14} color="#002366" />
                        </div>
                        <div>
                          <div className="mq-metric-name">Max CV Access</div>
                          <div className="mq-metric-helper">
                            {(policyAllocations.full?.cvAccess?.total || 0) === 0
                              ? 'No CV unlock credits in active plan (locked at 0)'
                              : allocationPolicy === 'weekly'
                              ? 'Weekly assigned resume unlock quota'
                              : allocationPolicy === 'monthly'
                              ? 'Monthly assigned resume unlock quota'
                              : `Total pool resume views & contact unlocks allocated for full plan cycle (${planData?.validity || 90} days)`}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Total (Editable only in weekly & monthly and if credits > 0) */}
                    <td className="mq-td" style={{ textAlign: 'right' }}>
                      {allocationPolicy !== 'full' && (policyAllocations.full?.cvAccess?.total || 0) > 0 && editDrafts.cvAccess !== null ? (
                        <div className="mq-inline-edit-box">
                          <input
                            type="number"
                            className="mq-inline-input"
                            value={editDrafts.cvAccess}
                            onChange={(e) => {
                              const val = e.target.value;
                              setEditDrafts((prev) => ({ ...prev, cvAccess: val }));
                              if (editErrors.cvAccess) setEditErrors((prev) => ({ ...prev, cvAccess: '' }));
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveAllSettings();
                              if (e.key === 'Escape') handleCancelAllDrafts();
                            }}
                            autoFocus
                          />
                        </div>
                      ) : (
                        <div className="mq-value-with-edit">
                          <span className="mq-num-bold">{currentCvTotal.toLocaleString()}</span>
                          {allocationPolicy !== 'full' && (policyAllocations.full?.cvAccess?.total || 0) > 0 && (
                            <button
                              type="button"
                              className="mq-btn-edit-pencil"
                              onClick={() => handleStartEdit('cvAccess')}
                              title={`Click to edit Max CV Access ${allocationPolicy} total`}
                            >
                              <FiEdit2 size={13} />
                            </button>
                          )}
                        </div>
                      )}
                      {allocationPolicy !== 'full' && editErrors.cvAccess && (
                        <div className="mq-inline-error">{editErrors.cvAccess}</div>
                      )}
                    </td>

                    {/* Used */}
                    <td className="mq-td" data-label="Used" style={{ textAlign: 'right', color: '#64748b' }}>
                      <span className="mq-num-used">{currentCvUsed.toLocaleString()}</span>
                    </td>

                    {/* Balance / Remaining */}
                    <td className="mq-td" data-label={allocationPolicy === 'full' ? 'Remaining' : 'Balance'} style={{ textAlign: 'right' }}>
                      <span className="mq-num-balance">{cvBalance.toLocaleString()}</span>
                    </td>
                  </tr>

                  {/* Row 2: Max NVite Credits */}
                  <tr className="mq-tr">
                    <td className="mq-td font-medium">
                      <div className="mq-metric-title-cell">
                        <div className="mq-metric-icon-small nvite">
                          <FiSend size={14} color="#0284c7" />
                        </div>
                        <div>
                          <div className="mq-metric-name">Max NVite Credits</div>
                          <div className="mq-metric-helper">
                            {(policyAllocations.full?.nvite?.total || 0) === 0
                              ? 'No NVite outreach credits in active plan (locked at 0)'
                              : allocationPolicy === 'weekly'
                              ? 'Weekly assigned candidate outreach credits'
                              : allocationPolicy === 'monthly'
                              ? 'Monthly assigned candidate outreach credits'
                              : `Total pool candidate outreach credits allocated for full plan cycle (${planData?.validity || 90} days)`}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Total (Editable only in weekly & monthly and if credits > 0) */}
                    <td className="mq-td" style={{ textAlign: 'right' }}>
                      {allocationPolicy !== 'full' && (policyAllocations.full?.nvite?.total || 0) > 0 && editDrafts.nvite !== null ? (
                        <div className="mq-inline-edit-box">
                          <input
                            type="number"
                            className="mq-inline-input"
                            value={editDrafts.nvite}
                            onChange={(e) => {
                              const val = e.target.value;
                              setEditDrafts((prev) => ({ ...prev, nvite: val }));
                              if (editErrors.nvite) setEditErrors((prev) => ({ ...prev, nvite: '' }));
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveAllSettings();
                              if (e.key === 'Escape') handleCancelAllDrafts();
                            }}
                            autoFocus
                          />
                        </div>
                      ) : (
                        <div className="mq-value-with-edit">
                          <span className="mq-num-bold">{currentNviteTotal.toLocaleString()}</span>
                          {allocationPolicy !== 'full' && (policyAllocations.full?.nvite?.total || 0) > 0 && (
                            <button
                              type="button"
                              className="mq-btn-edit-pencil"
                              onClick={() => handleStartEdit('nvite')}
                              title={`Click to edit Max NVite Credits ${allocationPolicy} total`}
                            >
                              <FiEdit2 size={13} />
                            </button>
                          )}
                        </div>
                      )}
                      {allocationPolicy !== 'full' && editErrors.nvite && (
                        <div className="mq-inline-error">{editErrors.nvite}</div>
                      )}
                    </td>

                    {/* Used */}
                    <td className="mq-td" data-label="Used" style={{ textAlign: 'right', color: '#64748b' }}>
                      <span className="mq-num-used">{currentNviteUsed.toLocaleString()}</span>
                    </td>

                    {/* Balance / Remaining */}
                    <td className="mq-td" data-label={allocationPolicy === 'full' ? 'Remaining' : 'Balance'} style={{ textAlign: 'right' }}>
                      <span className="mq-num-balance">{nviteBalance.toLocaleString()}</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Save Settings Action */}
            <div className="mq-allocation-footer">
              <button
                ref={saveBtnRef}
                type="button"
                className="mq-btn-save-settings"
                onClick={handleSaveAllSettings}
              >
                <FiSave size={16} />
                Save settings
              </button>
              <span className="mq-footer-tip">
                {allocationPolicy === 'full'
                  ? `Full access mode provides unrestricted access to the total pool allocated for the full cycle of your plan days (${planData?.validity || 90} days).`
                  : 'Changes apply instantly across all active recruiters in your company account.'}
              </span>
            </div>
          </div>

          {/* Right Column: Resdex Usage Analytics Card */}
          <div className="mq-card mq-usage-card">
            <div className="mq-card-header">
              <div>
                <h2 className="mq-card-title">Resdex Usage</h2>
                <p className="mq-card-desc">
                  Overall enterprise consumption from your active subscription plan.
                </p>
              </div>

              <button
                type="button"
                className="mq-btn-report-link"
                onClick={() => navigate('/report/resdex')}
              >
                <span>View Resdex Usage Report</span>
                <FiExternalLink size={13} />
              </button>
            </div>

            {/* Quick Visual Gauges */}
            <div className="mq-gauge-section">
              {(() => {
                const cvTotal = policyAllocations.full?.cvAccess?.total || 0;
                const cvUsed = policyAllocations.full?.cvAccess?.used || 0;
                const cvPercent = cvTotal > 0 ? ((cvUsed / cvTotal) * 100).toFixed(1) : '0.0';

                const nviteTotal = policyAllocations.full?.nvite?.total || 0;
                const nviteUsed = policyAllocations.full?.nvite?.used || 0;
                const nvitePercent = nviteTotal > 0 ? ((nviteUsed / nviteTotal) * 100).toFixed(1) : '0.0';

                return (
                  <>
                    <div className="mq-gauge-box">
                      <div className="mq-gauge-label-row">
                        <span className="mq-gauge-label">CV Access Utilization</span>
                        <span className="mq-gauge-val">{cvPercent}%</span>
                      </div>
                      <div className="mq-gauge-bar">
                        <div className="mq-gauge-fill cv" style={{ width: `${cvPercent}%` }} />
                      </div>
                      <div className="mq-gauge-foot">{cvUsed.toLocaleString()} of {cvTotal.toLocaleString()} used</div>
                    </div>

                    <div className="mq-gauge-box">
                      <div className="mq-gauge-label-row">
                        <span className="mq-gauge-label">NVite Credits Utilization</span>
                        <span className="mq-gauge-val">{nvitePercent}%</span>
                      </div>
                      <div className="mq-gauge-bar">
                        <div className="mq-gauge-fill nvite" style={{ width: `${nvitePercent}%` }} />
                      </div>
                      <div className="mq-gauge-foot">{nviteUsed.toLocaleString()} of {nviteTotal.toLocaleString()} used</div>
                    </div>
                  </>
                );
              })()}
            </div>

            {/* Usage Breakdown Table (Exact fields matching Screenshot) */}
            <div className="mq-table-wrapper">
              <table className="mq-usage-table">
                <thead>
                  <tr>
                    <th className="mq-th-usage">Category</th>
                    <th className="mq-th-usage" style={{ textAlign: 'right' }}>CV Access</th>
                    <th className="mq-th-usage" style={{ textAlign: 'right' }}>NVite</th>
                  </tr>
                </thead>
                <tbody>
                  {resdexUsageData.map((row) => (
                    <tr key={row.label} className="mq-usage-tr">
                      <td className={`mq-usage-td ${row.isBold ? 'bold' : ''}`}>
                        {row.label}
                      </td>
                      <td className={`mq-usage-td ${row.isBold ? 'bold' : ''} ${row.isSuccess ? 'success' : ''} ${row.isWarning ? 'warning' : ''}`} style={{ textAlign: 'right' }}>
                        {row.cv}
                      </td>
                      <td className={`mq-usage-td ${row.isBold ? 'bold' : ''} ${row.isSuccess ? 'success' : ''} ${row.isWarning ? 'warning' : ''}`} style={{ textAlign: 'right' }}>
                        {row.nvite}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Usage Footnote */}
            <div className="mq-usage-footnote">
              <FiInfo size={13} color="#94a3b8" />
              <span>*Credits shown above are for current/active subscription only</span>
            </div>
          </div>
        </div>

        {/* EXTRA SECTION: Subscribed Products & Entitlement Quotas Full Table */}
        {servicesData.length > 0 && (
          <div className="mq-services-section">
            <div className="mq-services-card">
              <div className="mq-services-header">
                <div>
                  <h3 className="mq-services-title">
                    <FiLayers size={18} color="#002366" />
                    Subscribed Products & Entitlement Quotas
                  </h3>
                  <p style={{ margin: '4px 0 0 0', fontSize: 13, color: '#64748b' }}>
                    Live resource allocations and feature specifications locked into your company profile from your commercial subscription.
                  </p>
                </div>
              </div>

              <div className="mq-table-wrapper">
                <table className="mq-services-table">
                  <thead>
                    <tr>
                      <th className="mq-services-th">Product & SKU</th>
                      <th className="mq-services-th">Entitlement Quota</th>
                      <th className="mq-services-th">Utilization</th>
                      <th className="mq-services-th" style={{ textAlign: 'right' }}>Used</th>
                      <th className="mq-services-th" style={{ textAlign: 'right' }}>Remaining Balance</th>
                      <th className="mq-services-th">Validity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {servicesData.map((service) => {
                      const percent = service.percentUsed || 0;
                      const code = String(service.productCode || '').toUpperCase();
                      const cat = String(service.category || '').toUpperCase();
                      const unitStr = String(service.unit || '').toLowerCase();
                      const isSeat = service.isSeat || code.includes('SEAT') || cat === 'USER_SEATS' || unitStr.includes('seat');
                      const isAi = !isSeat && (code.includes('AI') || cat === 'AI' || service.isAi);

                      return (
                        <tr key={service._id || service.productCode} className="mq-services-tr">
                          <td className="mq-services-td">
                            <div className="mq-prod-name">
                              <span>{formatServiceProductName(service)}</span>
                              {isSeat && (
                                <span style={{
                                  marginLeft: 8,
                                  fontSize: 10.5,
                                  fontWeight: 600,
                                  color: '#0284c7',
                                  background: '#e0f2fe',
                                  padding: '2px 7px',
                                  borderRadius: 10,
                                  display: 'inline-block'
                                }}>
                                  Recruiter Seat
                                </span>
                              )}
                            </div>
                            <div className="mq-prod-code">{service.productCode}</div>
                            {isSeat && (
                              <div style={{ marginTop: 4 }}>
                                <button
                                  type="button"
                                  onClick={() => navigate('/employer/settings/users')}
                                  style={{
                                    background: 'none',
                                    border: 'none',
                                    padding: 0,
                                    color: '#002366',
                                    fontSize: 11.5,
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    textDecoration: 'underline',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 3
                                  }}
                                >
                                  Manage Seat Assignments →
                                </button>
                              </div>
                            )}
                            {Array.isArray(service.features) && service.features.length > 0 && (
                              <div style={{ marginTop: 6 }}>
                                {service.features.map((feat) => (
                                  <span key={feat.key || feat.name} className="mq-feature-tag">
                                    ✓ {feat.name || feat.key}
                                  </span>
                                ))}
                              </div>
                            )}
                          </td>
                          <td className="mq-services-td">
                            <strong style={{ color: '#0f172a', fontSize: 13.5 }}>
                              {(service.total || 0).toLocaleString()} {service.total === 1 ? service.unit : (service.unit?.endsWith('s') ? service.unit : `${service.unit}s`)}
                            </strong>
                          </td>
                          <td className="mq-services-td">
                            <span style={{ fontSize: 12, fontWeight: 700, color: '#334155' }}>{percent}%</span>
                            <div className="mq-mini-progress">
                              <div className="mq-mini-fill" style={{ width: `${percent}%` }} />
                            </div>
                          </td>
                          <td className="mq-services-td" style={{ textAlign: 'right', color: '#64748b' }}>
                            <span className="mq-num-used">{(service.used || 0).toLocaleString()}</span>
                            {isSeat && (
                              <div style={{ fontSize: 11, color: '#64748b' }}>assigned</div>
                            )}
                          </td>
                          <td className="mq-services-td" style={{ textAlign: 'right' }}>
                            <span className="mq-num-balance" style={{ color: service.remaining > 0 ? '#047857' : '#dc2626' }}>
                              {(service.remaining || 0).toLocaleString()}
                            </span>
                            {isSeat && (
                              <div style={{ fontSize: 11, color: service.remaining > 0 ? '#047857' : '#dc2626' }}>available</div>
                            )}
                          </td>
                          <td className="mq-services-td">
                            {(() => {
                              if (isAi) {
                                return (
                                  <div>
                                    <span style={{ fontSize: 12, fontWeight: 700, color: '#6d28d9', background: '#f5f3ff', padding: '2px 8px', borderRadius: 4, display: 'inline-block' }}>
                                      Monthly Cycle
                                    </span>
                                    <div style={{ fontSize: 11, color: '#7c3aed', marginTop: 3, fontWeight: 500 }}>
                                      No carry forward
                                    </div>
                                  </div>
                                );
                              }
                              return (
                                <div>
                                  <span style={{ fontSize: 12, fontWeight: 700, color: '#0f172a' }}>
                                    {planData?.validity || service.validity || 30} {service.validityUnit || 'DAYS'}
                                  </span>
                                  <div style={{ fontSize: 11, color: '#047857', marginTop: 3, fontWeight: 600 }}>
                                    Full Plan Cycle
                                  </div>
                                </div>
                              );
                            })()}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </EmployerLayout>
  );
}
