import { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiCalendar, FiClock, FiZap, FiInfo, FiEdit2,
  FiExternalLink, FiPieChart, FiTrendingUp, FiCheckCircle,
  FiRotateCcw, FiSave, FiLayers, FiSend
} from 'react-icons/fi';
import EmployerLayout from '../../../../components/employer/EmployerLayout';
import EmployerBreadcrumb from '../../../../components/employer/EmployerBreadcrumb';
import './ManageQuota.css';

export default function ManageQuota() {
  const navigate = useNavigate();

  // Allocation frequency policy
  const [allocationPolicy, setAllocationPolicy] = useState('weekly'); // 'weekly' | 'monthly' | 'full'

  // Quota Allocation state separated by policy
  // - weekly: weekly assigned quota (editable)
  // - monthly: monthly assigned quota (editable)
  // - full: total pool, used, and remaining (read-only, cannot be edited)
  const [policyAllocations, setPolicyAllocations] = useState({
    weekly: {
      cvAccess: { total: 3630, used: 212 },
      nvite: { total: 181140, used: 0 },
    },
    monthly: {
      cvAccess: { total: 15000, used: 890 },
      nvite: { total: 250000, used: 12400 },
    },
    full: {
      cvAccess: { total: 25000, used: 21582 },
      nvite: { total: 250000, used: 68860 },
    },
  });

  // Inline draft edit state (null = not in edit mode, string = active draft value)
  const [editDrafts, setEditDrafts] = useState({
    cvAccess: null,
    nvite: null,
  });
  const [editErrors, setEditErrors] = useState({
    cvAccess: '',
    nvite: '',
  });

  // Reference to Save Settings button to distinguish click outside from hitting Save
  const saveBtnRef = useRef(null);

  // Toast message
  const [toast, setToast] = useState(null);
  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  // Resdex Usage Summary Data (matching Screenshot)
  const resdexUsageData = useMemo(() => [
    { label: 'Default', cv: '25,000', nvite: '250,000', isBold: false },
    { label: 'Purchased', cv: '—', nvite: '—', isBold: false },
    { label: 'Total*', cv: '25,000', nvite: '250,000', isBold: true },
    { label: 'Released', cv: '25,000', nvite: '250,000', isBold: true },
    { label: 'Used', cv: '21,582', nvite: '68,860', isBold: false, isWarning: true },
    { label: 'Remaining', cv: '3,418', nvite: '181,140', isBold: true, isSuccess: true },
  ], []);

  // Active policy quota data
  const currentPolicyData = policyAllocations[allocationPolicy];

  // Compute Balances and Percentages dynamically with drafts
  const currentCvTotal = allocationPolicy !== 'full' && editDrafts.cvAccess !== null && !isNaN(parseInt(String(editDrafts.cvAccess).replace(/,/g, ''), 10))
    ? parseInt(String(editDrafts.cvAccess).replace(/,/g, ''), 10)
    : currentPolicyData.cvAccess.total;
  const currentCvUsed = currentPolicyData.cvAccess.used;
  const cvBalance = Math.max(0, currentCvTotal - currentCvUsed);
  const cvPercent = Math.min(100, Math.round((currentCvUsed / (currentCvTotal || 1)) * 100)) || 0;

  const currentNviteTotal = allocationPolicy !== 'full' && editDrafts.nvite !== null && !isNaN(parseInt(String(editDrafts.nvite).replace(/,/g, ''), 10))
    ? parseInt(String(editDrafts.nvite).replace(/,/g, ''), 10)
    : currentPolicyData.nvite.total;
  const currentNviteUsed = currentPolicyData.nvite.used;
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

  // Handle Edit Start (only allowed in weekly and monthly modes)
  const handleStartEdit = (key) => {
    if (allocationPolicy === 'full') return;
    setEditDrafts((prev) => ({
      ...prev,
      [key]: String(policyAllocations[allocationPolicy][key].total),
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
      // If clicking inside an inline edit box, continue editing
      if (e.target.closest('.mq-inline-edit-box')) {
        return;
      }
      // If clicking on an edit pencil button, handleStartEdit will handle switching
      if (e.target.closest('.mq-btn-edit-pencil')) {
        return;
      }
      // If clicking Save settings button, handleSaveAllSettings will handle saving
      if (saveBtnRef.current && saveBtnRef.current.contains(e.target)) {
        return;
      }

      // Any other place hit -> unsaved changes get removed
      handleCancelAllDrafts();
    };

    document.addEventListener('pointerdown', handlePointerDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
    };
  }, [editDrafts]);

  // Save Settings: saves all edited quota values and policy
  const handleSaveAllSettings = () => {
    if (allocationPolicy === 'full') {
      showToast('Full access policy settings applied successfully!');
      return;
    }

    let hasError = false;
    const newErrors = { cvAccess: '', nvite: '' };
    const activeData = policyAllocations[allocationPolicy];
    const updatedData = { ...activeData };

    if (editDrafts.cvAccess !== null) {
      const num = parseInt(String(editDrafts.cvAccess).replace(/,/g, ''), 10);
      if (isNaN(num) || num < 0) {
        newErrors.cvAccess = 'Enter a valid positive number';
        hasError = true;
      } else if (num < activeData.cvAccess.used) {
        newErrors.cvAccess = `Cannot be less than used (${activeData.cvAccess.used.toLocaleString()})`;
        hasError = true;
      } else {
        updatedData.cvAccess = {
          ...updatedData.cvAccess,
          total: num,
        };
      }
    }

    if (editDrafts.nvite !== null) {
      const num = parseInt(String(editDrafts.nvite).replace(/,/g, ''), 10);
      if (isNaN(num) || num < 0) {
        newErrors.nvite = 'Enter a valid positive number';
        hasError = true;
      } else if (num < activeData.nvite.used) {
        newErrors.nvite = `Cannot be less than used (${activeData.nvite.used.toLocaleString()})`;
        hasError = true;
      } else {
        updatedData.nvite = {
          ...updatedData.nvite,
          total: num,
        };
      }
    }

    if (hasError) {
      setEditErrors(newErrors);
      return;
    }

    setPolicyAllocations((prev) => ({
      ...prev,
      [allocationPolicy]: updatedData,
    }));
    setEditDrafts({ cvAccess: null, nvite: null });
    setEditErrors({ cvAccess: '', nvite: '' });
    showToast(`${allocationPolicy === 'weekly' ? 'Weekly' : 'Monthly'} quota settings saved successfully!`);
  };

  // Reset to default
  const handleResetSettings = () => {
    setAllocationPolicy('weekly');
    setPolicyAllocations({
      weekly: {
        cvAccess: { total: 3630, used: 212 },
        nvite: { total: 181140, used: 0 },
      },
      monthly: {
        cvAccess: { total: 15000, used: 890 },
        nvite: { total: 250000, used: 12400 },
      },
      full: {
        cvAccess: { total: 25000, used: 21582 },
        nvite: { total: 250000, used: 68860 },
      },
    });
    handleCancelAllDrafts();
    showToast('Settings restored to default allocations.');
  };

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
              Configure and distribute your active CV view limits and NVite messaging allowances across your recruitment team.
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

        {/* Top Summary Stat Cards */}
        <div className="mq-stats-grid">
          {/* Stat 1: CV Access Balance */}
          <div className="mq-stat-card">
            <div className="mq-stat-top">
              <div className="mq-stat-icon-wrapper cv">
                <FiLayers size={22} color="#002366" />
              </div>
              <span className="mq-stat-badge cv">
                {100 - cvPercent}% Remaining
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
              <span>{cvBalance.toLocaleString()} {allocationPolicy === 'full' ? 'Remaining' : 'Balance'}</span>
            </div>
          </div>

          {/* Stat 2: NVite Credits Balance */}
          <div className="mq-stat-card">
            <div className="mq-stat-top">
              <div className="mq-stat-icon-wrapper nvite">
                <FiSend size={22} color="#0284c7" />
              </div>
              <span className="mq-stat-badge nvite">
                {100 - nvitePercent}% Remaining
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
                {allocationPolicy === 'weekly' ? 'Weekly' : allocationPolicy === 'monthly' ? 'Monthly' : 'Full Access'}
              </span>
            </div>
            <div className="mq-cycle-desc">
              {allocationPolicy === 'weekly' && 'Weekly assigned quota resets every Monday 00:00 IST.'}
              {allocationPolicy === 'monthly' && 'Monthly assigned quota replenishes on the 1st of each month.'}
              {allocationPolicy === 'full' && 'Total pool credits unlocked without periodic limits (read-only).'}
            </div>
          </div>
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
                    <span className="mq-policy-title">Full access</span>
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
                            {allocationPolicy === 'weekly' && 'Weekly assigned resume unlock quota'}
                            {allocationPolicy === 'monthly' && 'Monthly assigned resume unlock quota'}
                            {allocationPolicy === 'full' && 'Total pool resume views & contact unlocks'}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Total (Editable only in weekly & monthly) */}
                    <td className="mq-td" style={{ textAlign: 'right' }}>
                      {allocationPolicy !== 'full' && editDrafts.cvAccess !== null ? (
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
                          {allocationPolicy !== 'full' && (
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
                    <td className="mq-td" style={{ textAlign: 'right', color: '#64748b' }}>
                      <span className="mq-num-used">{currentCvUsed.toLocaleString()}</span>
                    </td>

                    {/* Balance / Remaining */}
                    <td className="mq-td" style={{ textAlign: 'right' }}>
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
                            {allocationPolicy === 'weekly' && 'Weekly assigned candidate outreach credits'}
                            {allocationPolicy === 'monthly' && 'Monthly assigned candidate outreach credits'}
                            {allocationPolicy === 'full' && 'Total pool email & WhatsApp invitation credits'}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Total (Editable only in weekly & monthly) */}
                    <td className="mq-td" style={{ textAlign: 'right' }}>
                      {allocationPolicy !== 'full' && editDrafts.nvite !== null ? (
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
                          {allocationPolicy !== 'full' && (
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
                    <td className="mq-td" style={{ textAlign: 'right', color: '#64748b' }}>
                      <span className="mq-num-used">{currentNviteUsed.toLocaleString()}</span>
                    </td>

                    {/* Balance / Remaining */}
                    <td className="mq-td" style={{ textAlign: 'right' }}>
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
                  ? 'Full access mode provides unrestricted access to the total pool; no allocation limits can be edited.'
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
              <div className="mq-gauge-box">
                <div className="mq-gauge-label-row">
                  <span className="mq-gauge-label">CV Access Utilization</span>
                  <span className="mq-gauge-val">86.3%</span>
                </div>
                <div className="mq-gauge-bar">
                  <div className="mq-gauge-fill cv" style={{ width: '86.3%' }} />
                </div>
                <div className="mq-gauge-foot">21,582 of 25,000 used</div>
              </div>

              <div className="mq-gauge-box">
                <div className="mq-gauge-label-row">
                  <span className="mq-gauge-label">NVite Credits Utilization</span>
                  <span className="mq-gauge-val">27.5%</span>
                </div>
                <div className="mq-gauge-bar">
                  <div className="mq-gauge-fill nvite" style={{ width: '27.5%' }} />
                </div>
                <div className="mq-gauge-foot">68,860 of 250,000 used</div>
              </div>
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
      </div>
    </EmployerLayout>
  );
}
