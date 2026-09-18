import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiPlus, FiMoreVertical, FiChevronDown, FiInfo,
  FiSearch, FiCheck, FiX, FiLock, FiShield,
  FiClock, FiGlobe, FiTrash2, FiEdit3, FiCheckCircle,
  FiPhone, FiArrowLeft, FiRefreshCw, FiEye, FiEyeOff, FiLoader
} from 'react-icons/fi';
import EmployerLayout from '../../../../components/employer/EmployerLayout';
import EmployerBreadcrumb from '../../../../components/employer/EmployerBreadcrumb';
import userManagementService from '../../../../services/userManagementService';
import './UserManagement.css';

// Avatar palette for auto-generating user avatar colors
const AVATAR_PALETTE = [
  { bg: '#fef3c7', color: '#b45309' },
  { bg: '#dbeafe', color: '#1d4ed8' },
  { bg: '#e0e7ff', color: '#3730a3' },
  { bg: '#ccfbf1', color: '#0f766e' },
  { bg: '#fce7f3', color: '#be185d' },
  { bg: '#ede9fe', color: '#6d28d9' },
  { bg: '#e2e8f0', color: '#475569' },
];



const TIME_SLOTS = [
  '12:00 AM', '12:30 AM', '01:00 AM', '01:30 AM', '02:00 AM', '02:30 AM',
  '03:00 AM', '03:30 AM', '04:00 AM', '04:30 AM', '05:00 AM', '05:30 AM',
  '06:00 AM', '06:30 AM', '07:00 AM', '07:30 AM', '08:00 AM', '08:30 AM',
  '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
  '12:00 PM', '12:30 PM', '01:00 PM', '01:30 PM', '02:00 PM', '02:30 PM',
  '03:00 PM', '03:30 PM', '04:00 PM', '04:30 PM', '05:00 PM', '05:30 PM',
  '06:00 PM', '06:30 PM', '07:00 PM', '07:30 PM', '08:00 PM', '08:30 PM',
  '09:00 PM', '09:30 PM', '10:00 PM', '10:30 PM', '11:00 PM', '11:30 PM'
];

// Separate controlled modal component for Change Restrictions
function ChangeRestrictionsModal({ isOpen, onClose, selectedIds, onSaved }) {
  const [policy, setPolicy] = useState('all-day');
  const [ipRestriction, setIpRestriction] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleApply = async () => {
    setSaving(true);
    setError('');
    try {
      await userManagementService.updateRestrictions({
        ids: selectedIds,
        policy,
        ipRestriction,
      });
      onSaved();
      onClose();
    } catch (err) {
      setError(err?.message || 'Failed to update restrictions');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="um-modal-overlay" onClick={onClose}>
      <div className="um-modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="um-modal-header">
          <h2 className="um-modal-title">Change Restrictions</h2>
          <button type="button" className="um-modal-close-btn" onClick={onClose}>
            <FiX size={20} />
          </button>
        </div>
        <div className="um-modal-body">
          {selectedIds?.length > 0 && (
            <div style={{ padding: '8px 12px', background: '#f0f7ff', borderRadius: 8, fontSize: 13, color: '#0369a1', marginBottom: 12 }}>
              Applying to <strong>{selectedIds.length}</strong> selected user(s).
            </div>
          )}
          <div className="um-form-group">
            <label className="um-form-label">Time Restriction Policy</label>
            <select className="um-input-text" value={policy} onChange={(e) => setPolicy(e.target.value)}>
              <option value="all-day">Allow access 24/7 (No restriction)</option>
              <option value="office-hours">Office hours only (9:00 AM – 7:00 PM IST)</option>
              <option value="custom">Custom schedule (Weekdays only)</option>
            </select>
          </div>
          <div className="um-form-group">
            <label className="um-form-label">IP Address Restriction</label>
            <input
              type="text"
              className="um-input-text"
              placeholder="e.g. 192.168.1.0/24 (Leave blank for unrestricted)"
              value={ipRestriction}
              onChange={(e) => setIpRestriction(e.target.value)}
            />
          </div>
          {error && <div style={{ fontSize: 12, color: '#ef4444', fontWeight: 500 }}>{error}</div>}
        </div>
        <div className="um-modal-footer">
          <button type="button" className="um-btn-link-action" onClick={onClose}>Cancel</button>
          <button
            type="button"
            className="um-btn-modal-save"
            disabled={saving}
            onClick={handleApply}
          >
            {saving ? 'Saving…' : 'Apply Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function UserManagement() {
  const navigate = useNavigate();

  // Users state — loaded from API
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState(null);

  // Fetch users from API on mount
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setApiError(null);
    try {
      const result = await userManagementService.getUsers();
      setUsers(result.data || []);
    } catch (err) {
      setApiError(err?.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  // Selected Users
  const [selectedUserIds, setSelectedUserIds] = useState([]);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('approved');
  const [userFilter, setUserFilter] = useState('all'); // 'all', 'superuser', 'regular'

  // Dropdown States
  const [openDropdown, setOpenDropdown] = useState(null); // 'domains', 'security', 'time', 'userFilter', 'options'

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDomainModal, setShowDomainModal] = useState(false);
  const [showRestrictionsModal, setShowRestrictionsModal] = useState(false);

  // Allowed Domains & OTP Verification state
  const [allowedDomains, setAllowedDomains] = useState([]);

  // Fetch domains from API on mount
  const fetchDomains = useCallback(async () => {
    try {
      const result = await userManagementService.getDomains();
      setAllowedDomains(result.data || []);
    } catch {
      // silently fail — domains will just be empty
    }
  }, []);

  useEffect(() => { fetchDomains(); }, [fetchDomains]);
  const [hoveredDomain, setHoveredDomain] = useState(null);
  const [domainAction, setDomainAction] = useState('add'); // 'add', 'edit', 'delete'
  const [targetDomain, setTargetDomain] = useState('');
  const [newDomainInput, setNewDomainInput] = useState('');
  const [domainStep, setDomainStep] = useState('otp'); // 'otp' | 'domain'
  const [domainOtp, setDomainOtp] = useState(['', '', '', '', '', '']);
  const [domainError, setDomainError] = useState('');
  const [otpTimer, setOtpTimer] = useState(30);
  const [otpLoading, setOtpLoading] = useState(false);
  const domainOtpRefs = useRef([]);
  const [otpSessionId, setOtpSessionId] = useState(null);
  const [domainToken, setDomainToken] = useState(null);
  const [maskedPhone, setMaskedPhone] = useState('');
  const [otpMethod, setOtpMethod] = useState('mobile');

  // Account Security settings state (matching Screenshot 1)
  const [notifyPasswordChange, setNotifyPasswordChange] = useState(true);
  const [receiveOtpOnlyOnMobile, setReceiveOtpOnlyOnMobile] = useState(false);
  const [useOtpOnPatternChange, setUseOtpOnPatternChange] = useState(false);

  const fetchSecuritySettings = useCallback(async () => {
    try {
      const result = await userManagementService.getSecuritySettings();
      if (result.data) {
        setNotifyPasswordChange(result.data.notifyPasswordChange);
        setReceiveOtpOnlyOnMobile(result.data.receiveOtpOnlyOnMobile);
        setUseOtpOnPatternChange(result.data.useOtpOnPatternChange);
      }
    } catch {
      // silently fail
    }
  }, []);

  useEffect(() => { fetchSecuritySettings(); }, [fetchSecuritySettings]);

  const handleToggleSecuritySetting = async (key, currentValue) => {
    const newValue = !currentValue;
    // Optimistic update
    if (key === 'notifyPasswordChange') setNotifyPasswordChange(newValue);
    if (key === 'receiveOtpOnlyOnMobile') setReceiveOtpOnlyOnMobile(newValue);
    if (key === 'useOtpOnPatternChange') setUseOtpOnPatternChange(newValue);

    try {
      await userManagementService.updateSecuritySettings({ [key]: newValue });
      showToast('Security settings updated');
    } catch (err) {
      // Revert on failure
      if (key === 'notifyPasswordChange') setNotifyPasswordChange(currentValue);
      if (key === 'receiveOtpOnlyOnMobile') setReceiveOtpOnlyOnMobile(currentValue);
      if (key === 'useOtpOnPatternChange') setUseOtpOnPatternChange(currentValue);
      showToast(err?.message || 'Failed to update security settings');
    }
  };

  // Time Restrictions settings state (matching Screenshot 2)
  const [weekendRestrictions, setWeekendRestrictions] = useState([]); // ['Saturday', 'Sunday']
  const [showWeekendMsq, setShowWeekendMsq] = useState(false);
  const weekendMsqRef = useRef(null);
  const [accessStartTime, setAccessStartTime] = useState('12:00 AM');
  const [accessEndTime, setAccessEndTime] = useState('12:30 AM');
  const [savingTimeRestrictions, setSavingTimeRestrictions] = useState(false);

  const toggleWeekendDay = (day) => {
    setWeekendRestrictions((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const getWeekendDisplay = () => {
    if (weekendRestrictions.length === 0) return 'No weekend restriction';
    const order = ['Saturday', 'Sunday'];
    const sorted = [...weekendRestrictions].sort((a, b) => order.indexOf(a) - order.indexOf(b));
    return sorted.join(', ');
  };

  // Toast notification
  const [toast, setToast] = useState(null);
  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(null), 3500);
  };

  // OTP Countdown timer
  useEffect(() => {
    let interval = null;
    if (showDomainModal && domainStep === 'otp' && otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [showDomainModal, domainStep, otpTimer]);

  // Add User Form State
  const [editingUser, setEditingUser] = useState(null);
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formJobPosting, setFormJobPosting] = useState(true);
  const [formJobBooster, setFormJobBooster] = useState(true);
  const [formResdex, setFormResdex] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  // Change Password Modal State
  const [changePasswordUser, setChangePasswordUser] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  const handleOpenChangePassword = (user) => {
    setChangePasswordUser(user);
    setNewPassword('');
    setConfirmPassword('');
    setShowNewPassword(false);
    setShowConfirmPassword(false);
    setPasswordError('');
  };

  const handleCloseChangePassword = () => {
    setChangePasswordUser(null);
    setNewPassword('');
    setConfirmPassword('');
    setPasswordError('');
  };

  const handleChangePasswordSubmit = async (e) => {
    e.preventDefault();
    if (!newPassword.trim()) {
      setPasswordError('Please enter a new password');
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters long');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }
    try {
      await userManagementService.changePassword(changePasswordUser.id, newPassword);
      showToast(`Password changed successfully for ${changePasswordUser?.name || changePasswordUser?.email}!`);
      handleCloseChangePassword();
    } catch (err) {
      setPasswordError(err?.message || 'Failed to change password');
    }
  };

  const handleCloseAddModal = () => {
    setShowAddModal(false);
    setEditingUser(null);
    setFormName('');
    setFormEmail('');
    setFormJobPosting(true);
    setFormJobBooster(true);
    setFormResdex(false);
    setFormErrors({});
  };

  // Close dropdowns on outside click
  const dropdownRef = useRef(null);
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpenDropdown(null);
        setShowWeekendMsq(false);
      } else if (weekendMsqRef.current && !weekendMsqRef.current.contains(e.target)) {
        setShowWeekendMsq(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filtered Users List
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      // Tab filter
      if (activeTab === 'pending') return false; // Mocking 0 pending
      // Restriction filter
      if (userFilter === 'restricted' && !u.isRestricted) return false;
      if (userFilter === 'unrestricted' && u.isRestricted) return false;
      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = u.name.toLowerCase().includes(q);
        const matchesEmail = u.email.toLowerCase().includes(q);
        return matchesName || matchesEmail;
      }
      return true;
    });
  }, [users, activeTab, userFilter, searchQuery]);

  // Master Checkbox - Only RECRUITERs can be selected (CLIENTs cannot be selected)
  const selectableUsers = useMemo(() => {
    return filteredUsers.filter((u) => !u.isSuperUser);
  }, [filteredUsers]);

  const isAllSelected = selectableUsers.length > 0 && selectableUsers.every((u) => selectedUserIds.includes(u.id));
  const isIndeterminate = selectedUserIds.length > 0 && !isAllSelected;

  const handleSelectAll = () => {
    if (isAllSelected) {
      setSelectedUserIds([]);
    } else {
      setSelectedUserIds(selectableUsers.map((u) => u.id));
    }
  };

  const handleSelectUser = (id) => {
    const target = users.find((u) => u.id === id);
    if (target?.isSuperUser) return; // CLIENT cannot be selected
    setSelectedUserIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Toggle single permission for user — optimistically update then call API
  const handleTogglePermission = async (userId, field) => {
    const target = users.find((u) => u.id === userId);
    if (!target) return;

    const newValue = !target[field];
    const updatedPermissions = {
      jobPosting: target.jobPosting,
      jobBooster: target.jobBooster,
      resdex: target.resdex,
      [field]: newValue,
    };
    // Enforce dependency rules
    if (field === 'jobBooster' && newValue) updatedPermissions.jobPosting = true;
    if (field === 'jobPosting' && !newValue) updatedPermissions.jobBooster = false;

    // Optimistic update
    setUsers((prev) =>
      prev.map((u) =>
        u.id === userId ? { ...u, ...updatedPermissions } : u
      )
    );

    try {
      await userManagementService.updateUser(userId, updatedPermissions);
      showToast(`Updated ${field === 'jobPosting' ? 'Job Posting' : field === 'jobBooster' ? 'Job Booster' : 'Resdex'} permission`);
    } catch (err) {
      // Roll back on failure
      setUsers((prev) =>
        prev.map((u) => u.id === userId ? target : u)
      );
      showToast(err?.message || 'Failed to update permission');
    }
  };

  // Validate Add User Form
  const validateForm = () => {
    const errs = {};
    if (!formName.trim()) errs.name = 'Please enter the name of the user';
    if (!formEmail.trim()) {
      errs.email = 'Please enter work email';
    } else if (!/\S+@\S+\.\S+/.test(formEmail)) {
      errs.email = 'Please enter a valid email address';
    } else {
      // Check domain against allowedDomains
      const emailDomain = `@${formEmail.trim().split('@')[1]?.toLowerCase()}`;
      if (!allowedDomains.includes(emailDomain)) {
        errs.email = `Domain ${emailDomain} is not allowed. Please add it via 'Add Allowed Domain' first.`;
      }
    }
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Handle Save User (Create or Edit)
  const handleSaveUser = async (keepOpen = false) => {
    if (!validateForm()) return;

    const trimmedName = formName.trim();
    const trimmedEmail = formEmail.trim().toLowerCase();

    // If in Edit mode
    if (editingUser) {
      try {
        await userManagementService.updateUser(editingUser.id, {
          name: trimmedName,
          email: trimmedEmail,
          jobPosting: formJobPosting,
          jobBooster: formJobBooster,
          resdex: formResdex,
        });
        setUsers((prev) =>
          prev.map((u) =>
            u.id === editingUser.id
              ? { ...u, name: trimmedName, email: trimmedEmail, jobPosting: formJobPosting, jobBooster: formJobBooster, resdex: formResdex }
              : u
          )
        );
        showToast(`User "${trimmedName}" updated successfully!`);
        handleCloseAddModal();
      } catch (err) {
        if (err?.message?.toLowerCase().includes('email')) {
          setFormErrors({ email: err.message });
        } else {
          showToast(err?.message || 'Failed to update user');
        }
      }
      return;
    }

    // Create new user
    try {
      const result = await userManagementService.createUser({
        name: trimmedName,
        email: trimmedEmail,
        jobPosting: formJobPosting,
        jobBooster: formJobBooster,
        resdex: formResdex,
        role: 'RECRUITER',
      });
      setUsers((prev) => [...prev, result.data]);
      showToast(`User "${trimmedName}" added successfully!`);

      // Reset inputs
      setFormName('');
      setFormEmail('');
      setFormJobPosting(true);
      setFormJobBooster(true);
      setFormResdex(false);
      setFormErrors({});

      if (!keepOpen) {
        handleCloseAddModal();
      }
    } catch (err) {
      if (err?.message?.toLowerCase().includes('email') || err?.message?.toLowerCase().includes('domain')) {
        setFormErrors({ email: err.message });
      } else {
        showToast(err?.message || 'Failed to create user');
      }
    }
  };

  // Edit user action
  const handleEditUser = (user) => {
    setEditingUser(user);
    setFormName(user.name);
    setFormEmail(user.email);
    setFormJobPosting(user.jobPosting);
    setFormJobBooster(user.jobBooster);
    setFormResdex(user.resdex);
    setFormErrors({});
    setShowAddModal(true);
  };

  // Delete individual user action
  const handleDeleteUser = async (userId) => {
    const target = users.find((u) => u.id === userId);
    if (target?.isSuperUser) {
      showToast('CLIENT cannot be deleted');
      return;
    }
    if (window.confirm(`Are you sure you want to delete RECRUITER "${target?.name || 'this user'}"?`)) {
      try {
        await userManagementService.deleteUsers([userId]);
        setUsers((prev) => prev.filter((u) => u.id !== userId));
        setSelectedUserIds((prev) => prev.filter((id) => id !== userId));
        showToast(`RECRUITER "${target?.name || ''}" deleted successfully.`);
      } catch (err) {
        showToast(err?.message || 'Failed to delete user');
      }
    }
  };

  // Delete Selected Users
  const handleDeleteSelected = async () => {
    if (selectedUserIds.length === 0) return;
    if (window.confirm(`Are you sure you want to remove ${selectedUserIds.length} RECRUITER(s)?`)) {
      try {
        await userManagementService.deleteUsers(selectedUserIds);
        setUsers((prev) => prev.filter((u) => !selectedUserIds.includes(u.id)));
        setSelectedUserIds([]);
        showToast('Selected user(s) removed successfully.');
      } catch (err) {
        showToast(err?.message || 'Failed to delete users');
      }
    }
  };

  // --- Allowed Domain Flow: First verify OTP -> then enter new domain ---
  const handleOpenDomainModal = async (action = 'add', domain = '') => {
    setDomainAction(action);
    setTargetDomain(domain);
    setNewDomainInput(action === 'edit' ? domain : '');
    setDomainOtp(['', '', '', '', '', '']);
    setDomainError('');
    setOtpTimer(30);
    setOtpSessionId(null);
    setDomainToken(null);
    setMaskedPhone('');
    
    if (receiveOtpOnlyOnMobile) {
      setDomainStep('otp');
      setShowDomainModal(true);
      await triggerSendOtp('mobile');
    } else {
      setDomainStep('select_method');
      setShowDomainModal(true);
    }
  };

  const triggerSendOtp = async (method) => {
    setOtpMethod(method);
    try {
      const res = await userManagementService.sendDomainOtp(method);
      if (res.data) {
        setOtpSessionId(res.data.sessionId);
        setMaskedPhone(res.data.maskedPhone); // can be masked email or phone
        setOtpTimer(res.data.expiresInSeconds || 600);
        showToast(`Verification OTP sent to CLIENT's ${method === 'email' ? 'email' : 'phone'} (${res.data.maskedPhone})`);
      }
    } catch (err) {
      setDomainError(err?.message || 'Failed to send OTP');
    }
    
    setTimeout(() => {
      domainOtpRefs.current[0]?.focus();
    }, 150);
  };

  const handleSelectOtpMethod = async (method) => {
    setDomainStep('otp');
    await triggerSendOtp(method);
  };

  const handleDomainOtpChange = (index, value) => {
    // Handle pasting 6 digits
    if (value.length > 1) {
      const digits = value.replace(/\D/g, '').slice(0, 6).split('');
      const updated = [...domainOtp];
      digits.forEach((d, i) => {
        if (i < 6) updated[i] = d;
      });
      setDomainOtp(updated);
      setDomainError('');
      const nextIdx = Math.min(digits.length, 5);
      domainOtpRefs.current[nextIdx]?.focus();
      return;
    }

    const val = value.replace(/\D/g, '');
    const updated = [...domainOtp];
    updated[index] = val;
    setDomainOtp(updated);
    setDomainError('');

    if (val && index < 5) {
      domainOtpRefs.current[index + 1]?.focus();
    }
  };

  const handleDomainOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !domainOtp[index] && index > 0) {
      domainOtpRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOtpFirst = async (e) => {
    e?.preventDefault?.();
    const enteredCode = domainOtp.join('');
    if (enteredCode.length < 6) {
      setDomainError('Please enter the complete 6-digit OTP');
      return;
    }
    if (!otpSessionId) {
      setDomainError('Session expired. Please resend OTP.');
      return;
    }
    
    setOtpLoading(true);
    try {
      const result = await userManagementService.verifyDomainOtp(otpSessionId, enteredCode);
      setDomainToken(result.data?.domainToken);
      setDomainError('');
      
      if (domainAction === 'delete') {
        // Execute delete immediately after verification
        const delResult = await userManagementService.deleteDomain(targetDomain, result.data.domainToken);
        setAllowedDomains(delResult.data);
        showToast(`Domain ${targetDomain} deleted successfully!`);
        setShowDomainModal(false);
        setDomainStep('otp');
        setDomainOtp(['', '', '', '', '', '']);
      } else {
        setDomainStep('domain');
        showToast('OTP verified! Please enter the domain.');
      }
    } catch (err) {
      setDomainError(err?.message || 'Invalid OTP');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleSaveDomainAfterOtp = async (e) => {
    e?.preventDefault?.();
    let dom = newDomainInput.trim().toLowerCase();
    if (!dom) {
      setDomainError('Please enter a domain name');
      return;
    }
    if (!dom.startsWith('@')) dom = `@${dom}`;
    if (!dom.includes('.') || dom.length < 4) {
      setDomainError('Please enter a valid domain (e.g. @mycompany.com)');
      return;
    }
    if (domainAction === 'add' && allowedDomains.includes(dom)) {
      setDomainError(`Domain ${dom} is already in the allowed domains list`);
      return;
    }
    if (domainAction === 'edit' && dom !== targetDomain && allowedDomains.includes(dom)) {
      setDomainError(`Domain ${dom} is already in the allowed domains list`);
      return;
    }
    
    setOtpLoading(true);
    try {
      if (domainAction === 'add') {
        const result = await userManagementService.addDomain(dom, domainToken);
        setAllowedDomains(result.data || [...allowedDomains, dom]);
        showToast(`Domain ${dom} added successfully!`);
      } else if (domainAction === 'edit') {
        const result = await userManagementService.editDomain(targetDomain, dom, domainToken);
        setAllowedDomains(result.data);
        showToast(`Domain updated to ${dom} successfully!`);
      }
      setShowDomainModal(false);
      setDomainStep('otp');
      setNewDomainInput('');
      setDomainOtp(['', '', '', '', '', '']);
      setDomainError('');
    } catch (err) {
      setDomainError(err?.message || `Failed to ${domainAction} domain`);
    } finally {
      setOtpLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setDomainOtp(['', '', '', '', '', '']);
    setOtpTimer(30);
    setDomainError('');
    domainOtpRefs.current[0]?.focus();
    
    await triggerSendOtp(otpMethod);
  };

  const handleExportCSV = () => {
    const domainsRow = ['Allowed Domains', ...allowedDomains].join(',');
    const securityRows = [
      ['Notify Password Change', notifyPasswordChange ? 'Yes' : 'No'].join(','),
      ['Receive OTP Only On Mobile', receiveOtpOnlyOnMobile ? 'Yes' : 'No'].join(','),
      ['Use OTP On Pattern Change', useOtpOnPatternChange ? 'Yes' : 'No'].join(',')
    ].join('\n');
    
    const restrictionRows = [
      ['Blocked Weekend Days', weekendRestrictions.length ? weekendRestrictions.join(' and ') : 'None'].join(','),
      ['Access Start Time', accessStartTime].join(','),
      ['Access End Time', accessEndTime].join(',')
    ].join('\n');

    const userHeaders = ['ID', 'Name', 'Email', 'Role', 'Restricted', 'Resdex', 'Job Posting', 'Job Booster'];
    const userRows = users.map(u => [
      u.id,
      `"${u.name}"`,
      `"${u.email}"`,
      u.isSuperUser ? 'CLIENT' : 'RECRUITER',
      u.isRestricted ? 'Yes' : 'No',
      u.resdex ? 'Yes' : 'No',
      u.jobPosting ? 'Yes' : 'No',
      u.jobBooster ? 'Yes' : 'No'
    ].join(',')).join('\n');

    const csvContent = [
      '--- GENERAL SETTINGS ---',
      domainsRow,
      securityRows,
      '',
      '--- TIME RESTRICTIONS ---',
      restrictionRows,
      '',
      '--- USERS ---',
      userHeaders.join(','),
      userRows
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `user_management_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setOpenDropdown(null);
    showToast('Data exported to CSV successfully.');
  };

  // Calculate dynamic permission counts
  const resdexCount = users.filter(u => u.resdex).length;
  const jobPostingCount = users.filter(u => u.jobPosting).length;
  const jobBoosterCount = users.filter(u => u.jobBooster).length;

  return (
    <EmployerLayout activeTab="home">
      <div className="um-container" ref={dropdownRef}>
        {/* Breadcrumb Navigation */}
        <EmployerBreadcrumb
          items={[
            { label: 'Employer Dashboard', path: '/employer-dashboard' },
            { label: 'Manage users & permissions' },
          ]}
        />

        {/* Loading State */}
        {loading && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 240, flexDirection: 'column', gap: 12 }}>
            <div style={{ width: 36, height: 36, border: '3px solid #e2e8f0', borderTopColor: '#002366', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            <span style={{ color: '#64748b', fontSize: 14 }}>Loading users…</span>
          </div>
        )}

        {/* API Error */}
        {!loading && apiError && (
          <div style={{ textAlign: 'center', padding: '48px 20px', color: '#b91c1c' }}>
            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>Failed to load users</div>
            <div style={{ fontSize: 13, color: '#64748b', marginBottom: 16 }}>{apiError}</div>
            <button type="button" className="um-btn-primary" onClick={fetchUsers}>Retry</button>
          </div>
        )}

        {!loading && !apiError && (<>

        {/* Floating Feedback Toast */}
        {toast && (
          <div
            style={{
              position: 'fixed',
              top: 24,
              right: 24,
              zIndex: 99999,
              backgroundColor: '#002366',
              color: '#ffffff',
              padding: '12px 20px',
              borderRadius: 8,
              boxShadow: '0 8px 24px rgba(0, 35, 102, 0.2)',
              fontSize: 14,
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              animation: 'umFadeIn 0.2s ease',
            }}
          >
            <FiCheckCircle size={17} color="#10b981" />
            {toast}
          </div>
        )}

        {/* Page Top Header */}
        <div className="um-header">
          <h1 className="um-title">Manage users & permissions</h1>

          <div className="um-header-actions">
            <button
              type="button"
              className="um-btn-primary"
              onClick={() => {
                setEditingUser(null);
                setFormName('');
                setFormEmail('');
                setFormJobPosting(true);
                setFormJobBooster(true);
                setFormResdex(false);
                setFormErrors({});
                setShowAddModal(true);
              }}
            >
              <FiPlus size={16} />
              Add user
            </button>

            <div style={{ position: 'relative' }}>
              <button
                type="button"
                className="um-btn-icon-more"
                aria-label="Options"
                onClick={() => setOpenDropdown(openDropdown === 'options' ? null : 'options')}
              >
                <FiMoreVertical size={18} />
              </button>

              {openDropdown === 'options' && (
                <div className="um-popover-menu">
                  <button
                    type="button"
                    className="um-popover-item"
                    onClick={handleExportCSV}
                  >
                    Export users CSV
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tabs & Top Controls Bar */}
        <div className="um-tabs-row">
          <div className="um-tabs-left">
            <button
              type="button"
              className={`um-tab-btn ${activeTab === 'approved' ? 'active' : ''}`}
              onClick={() => setActiveTab('approved')}
            >
              Approved ({users.length})
            </button>
          </div>

          <div className="um-tabs-right">
            {/* Allowed Domains Dropdown */}
            <div style={{ position: 'relative' }}>
              <button
                type="button"
                className="um-dropdown-trigger"
                onClick={() => setOpenDropdown(openDropdown === 'domains' ? null : 'domains')}
              >
                Allowed Domains <FiChevronDown size={14} />
              </button>

              {openDropdown === 'domains' && (
                <div className="um-popover-menu" style={{ width: 240 }}>
                  <div style={{ padding: '8px 12px', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                    Allowed Domains
                  </div>
                  {allowedDomains.map((dom) => (
                    <div
                      key={dom}
                      onMouseEnter={() => setHoveredDomain(dom)}
                      onMouseLeave={() => setHoveredDomain(null)}
                      style={{
                        padding: '6px 12px',
                        fontSize: 13,
                        color: '#0f172a',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        background: hoveredDomain === dom ? '#f8fafc' : 'transparent',
                      }}
                    >
                      <span>{dom}</span>
                      {hoveredDomain === dom ? (
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button
                            type="button"
                            onClick={() => {
                              setOpenDropdown(null);
                              handleOpenDomainModal('edit', dom);
                            }}
                            style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: 2 }}
                            title="Edit Domain"
                          >
                            <FiEdit3 size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setOpenDropdown(null);
                              handleOpenDomainModal('delete', dom);
                            }}
                            style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 2 }}
                            title="Delete Domain"
                          >
                            <FiTrash2 size={13} />
                          </button>
                        </div>
                      ) : (
                        <FiCheck size={14} color="#10b981" />
                      )}
                    </div>
                  ))}
                  <div style={{ borderTop: '1px solid #e2e8f0', marginTop: 4, paddingTop: 4 }}>
                    <button
                      type="button"
                      className="um-popover-item"
                      style={{ color: '#0284c7', fontWeight: 600 }}
                      onClick={() => {
                        setOpenDropdown(null);
                        handleOpenDomainModal('add', '');
                      }}
                    >
                      <FiPlus size={14} /> Add Allowed Domain
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Account Security Dropdown (Matching Screenshot 1) */}
            <div style={{ position: 'relative' }}>
              <button
                type="button"
                className="um-dropdown-trigger"
                onClick={() => setOpenDropdown(openDropdown === 'security' ? null : 'security')}
              >
                Account Security <FiChevronDown size={14} />
              </button>

              {openDropdown === 'security' && (
                <div className="um-security-popover" onClick={(e) => e.stopPropagation()}>
                  {/* Password Settings */}
                  <div>
                    <h3 className="um-popover-heading">Password Settings</h3>

                    <label className="um-toggle-row">
                      <span className="um-switch">
                        <input
                          type="checkbox"
                          checked={notifyPasswordChange}
                          onChange={() => handleToggleSecuritySetting('notifyPasswordChange', notifyPasswordChange)}
                        />
                        <span className="um-switch-slider"></span>
                      </span>
                      <span className="um-toggle-label">
                        Notify Password Change
                        <FiInfo size={15} color="#94a3b8" title="Sends an alert whenever your password is changed" />
                      </span>
                    </label>

                    <label className="um-toggle-row">
                      <span className="um-switch">
                        <input
                          type="checkbox"
                          checked={receiveOtpOnlyOnMobile}
                          onChange={() => handleToggleSecuritySetting('receiveOtpOnlyOnMobile', receiveOtpOnlyOnMobile)}
                        />
                        <span className="um-switch-slider"></span>
                      </span>
                      <span className="um-toggle-label">
                        Receive OTP only on Mobile
                        <FiInfo size={15} color="#94a3b8" title="Delivers OTPs solely to the registered mobile number" />
                      </span>
                    </label>
                  </div>

                  {/* Enhanced Security (using OTP for login) settings */}
                  <div>
                    <h3 className="um-popover-heading">
                      Enhanced Security (using OTP for login) settings
                    </h3>
                    <p className="um-popover-subtext">
                      OTP security will shield your account from hackers
                    </p>

                    <label className="um-toggle-row" style={{ marginTop: 6 }}>
                      <span className="um-switch">
                        <input
                          type="checkbox"
                          checked={useOtpOnPatternChange}
                          onChange={() => handleToggleSecuritySetting('useOtpOnPatternChange', useOtpOnPatternChange)}
                        />
                        <span className="um-switch-slider"></span>
                      </span>
                      <span className="um-toggle-label">
                        Use OTP when user login pattern changes
                        <FiInfo size={15} color="#94a3b8" title="Challenges login with OTP if unusual pattern or new IP is detected" />
                      </span>
                    </label>
                  </div>
                </div>
              )}
            </div>

            {/* Time Restrictions Dropdown (Matching Screenshot 2) */}
            <div style={{ position: 'relative' }}>
              <button
                type="button"
                className="um-dropdown-trigger"
                onClick={() => setOpenDropdown(openDropdown === 'time' ? null : 'time')}
              >
                Time Restrictions <FiChevronDown size={14} />
              </button>

              {openDropdown === 'time' && (
                <div className="um-time-popover" onClick={(e) => e.stopPropagation()}>
                  <h3 className="um-popover-heading">Time Restrictions</h3>

                  {/* Block access for RECRUITER on (MSQ Multi-select) */}
                  <div className="um-restriction-field">
                    <span className="um-restriction-label">Block access for RECRUITER on</span>
                    <div className="um-select-wrapper">
                      <div className="um-msq-container" ref={weekendMsqRef}>
                        <button
                          type="button"
                          className={`um-msq-trigger ${showWeekendMsq ? 'open' : ''}`}
                          onClick={() => setShowWeekendMsq((prev) => !prev)}
                        >
                          <span className="um-msq-value">{getWeekendDisplay()}</span>
                          <FiChevronDown
                            size={14}
                            color="#64748b"
                            style={{
                              transform: showWeekendMsq ? 'rotate(180deg)' : 'rotate(0deg)',
                              transition: 'transform 0.2s ease',
                              flexShrink: 0
                            }}
                          />
                        </button>

                        {showWeekendMsq && (
                          <div className="um-msq-dropdown">
                            <label className="um-msq-item">
                              <input
                                type="checkbox"
                                checked={weekendRestrictions.includes('Saturday')}
                                onChange={() => toggleWeekendDay('Saturday')}
                              />
                              <span>Saturday</span>
                            </label>
                            <label className="um-msq-item">
                              <input
                                type="checkbox"
                                checked={weekendRestrictions.includes('Sunday')}
                                onChange={() => toggleWeekendDay('Sunday')}
                              />
                              <span>Sunday</span>
                            </label>
                          </div>
                        )}
                      </div>
                      <FiInfo size={16} color="#94a3b8" title="Restrict RECRUITER access on specified weekend days" />
                    </div>
                  </div>

                  {/* Allow access between */}
                  <div className="um-restriction-field">
                    <span className="um-restriction-label">Allow access between</span>
                    <div className="um-select-wrapper">
                      <div className="um-time-between-row">
                        <select
                          className="um-custom-select"
                          value={accessStartTime}
                          onChange={(e) => setAccessStartTime(e.target.value)}
                        >
                          {TIME_SLOTS.map((t) => (
                            <option key={`start-${t}`} value={t}>{t}</option>
                          ))}
                        </select>
                        <span className="um-time-sep">To</span>
                        <select
                          className="um-custom-select"
                          value={accessEndTime}
                          onChange={(e) => setAccessEndTime(e.target.value)}
                        >
                          {TIME_SLOTS.map((t) => (
                            <option key={`end-${t}`} value={t}>{t}</option>
                          ))}
                        </select>
                      </div>
                      <FiInfo size={16} color="#94a3b8" title="Set daily working hour limits for RECRUITERs" />
                    </div>
                  </div>

                  {/* Save Button */}
                  <button
                    type="button"
                    className="um-btn-save-blue"
                    disabled={savingTimeRestrictions}
                    onClick={async () => {
                      const subUserIds = users.filter(u => !u.isSuperUser).map(u => u.id);
                      if (subUserIds.length === 0) {
                        showToast('No RECRUITERs found to apply restrictions.');
                        return;
                      }

                      setSavingTimeRestrictions(true);
                      try {
                        await userManagementService.updateRestrictions({
                          ids: subUserIds,
                          weekendRestrictions,
                          accessStartTime,
                          accessEndTime
                        });
                        setOpenDropdown(null);
                        setShowWeekendMsq(false);
                        showToast('Time restrictions applied to RECRUITERs successfully!');
                        fetchUsers();
                      } catch (err) {
                        showToast(err?.message || 'Failed to update time restrictions');
                      } finally {
                        setSavingTimeRestrictions(false);
                      }
                    }}
                  >
                    {savingTimeRestrictions ? 'Saving...' : 'Save'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Security Notice Callout Banner */}
        <div className="um-info-banner">
          <div className="um-info-icon-wrapper">
            <FiInfo size={19} color="#0284c7" />
          </div>
          <div className="um-info-content">
            <div>
              As a security measure, add certain domains like <strong>@mycompany.com</strong> as allowed domains.{' '}
              <span
                role="button"
                tabIndex={0}
                className="um-info-link"
                onClick={() => handleOpenDomainModal('add', '')}
              >
                Add Allowed Domain
              </span>
            </div>
            <div>
              If allowed domain is @mycompany.com, then only account ending with @mycompany.com can be added as RECRUITER.
            </div>
            <div className="um-info-note">
              <strong>Note:</strong> Response manager access is available to all recruiters who post a job, send an NVite, or are added as collaborators.
            </div>
          </div>
        </div>

        {/* Action & Filter Toolbar */}
        <div className="um-table-toolbar">
          <div>
            <button
              type="button"
              className="um-btn-outline"
              onClick={() => setShowRestrictionsModal(true)}
            >
              Change Restrictions
            </button>
          </div>

          <div className="um-search-container">
            <input
              type="text"
              className="um-search-input"
              placeholder="Search approved users"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button
              type="button"
              className="um-search-btn"
              aria-label="Search"
              onClick={() => {}}
            >
              <FiSearch size={15} />
            </button>
          </div>
        </div>

        {/* Bulk Actions Bar if users selected */}
        {selectedUserIds.length > 0 && (
          <div className="um-bulk-bar">
            <span style={{ fontSize: 13, fontWeight: 600 }}>
              {selectedUserIds.length} user{selectedUserIds.length > 1 ? 's' : ''} selected
            </span>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                type="button"
                style={{
                  background: 'transparent',
                  border: '1px solid #475569',
                  color: '#ffffff',
                  padding: '5px 12px',
                  borderRadius: 6,
                  fontSize: 12,
                  cursor: 'pointer',
                }}
                onClick={() => setShowRestrictionsModal(true)}
              >
                Change Restrictions
              </button>
              <button
                type="button"
                style={{
                  background: '#ef4444',
                  border: 'none',
                  color: '#ffffff',
                  padding: '5px 12px',
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}
                onClick={handleDeleteSelected}
              >
                <FiTrash2 size={13} /> Delete
              </button>
              <button
                type="button"
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#94a3b8',
                  fontSize: 12,
                  cursor: 'pointer',
                  textDecoration: 'underline',
                }}
                onClick={() => setSelectedUserIds([])}
              >
                Deselect All
              </button>
            </div>
          </div>
        )}

        {/* RECRUITERs Table */}
        <div className="um-table-card">
          <table className="um-table">
            <thead>
              <tr>
                <th className="um-th" style={{ width: 44, paddingRight: 0 }}>
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    ref={(el) => el && (el.indeterminate = isIndeterminate)}
                    onChange={handleSelectAll}
                    style={{ width: 16, height: 16, cursor: 'pointer', accentColor: '#002366' }}
                    aria-label="Select all users"
                  />
                </th>

                <th className="um-th" style={{ minWidth: 260 }}>
                  <div style={{ position: 'relative', display: 'inline-block' }}>
                    <button
                      type="button"
                      style={{
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        padding: 0,
                        fontSize: 13,
                        fontWeight: 600,
                        color: '#334155',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 5,
                      }}
                      onClick={() => setOpenDropdown(openDropdown === 'userFilter' ? null : 'userFilter')}
                    >
                      {userFilter === 'restricted'
                        ? 'Restricted'
                        : userFilter === 'unrestricted'
                        ? 'Unrestricted'
                        : 'All users'}{' '}
                      <FiChevronDown size={13} />
                    </button>

                    {openDropdown === 'userFilter' && (
                      <div className="um-popover-menu" style={{ left: 0, right: 'auto', width: 160 }}>
                        <button
                          type="button"
                          className="um-popover-item"
                          onClick={() => {
                            setUserFilter('all');
                            setOpenDropdown(null);
                          }}
                        >
                          All users
                        </button>
                        <button
                          type="button"
                          className="um-popover-item"
                          onClick={() => {
                            setUserFilter('unrestricted');
                            setOpenDropdown(null);
                          }}
                        >
                          Unrestricted
                        </button>
                        <button
                          type="button"
                          className="um-popover-item"
                          onClick={() => {
                            setUserFilter('restricted');
                            setOpenDropdown(null);
                          }}
                        >
                          Restricted
                        </button>
                      </div>
                    )}
                  </div>
                </th>

                <th className="um-th um-th-metric">
                  <div className="um-th-metric-title">Resdex</div>
                  <div className="um-th-metric-sub">{resdexCount} ({resdexCount} licenses)</div>
                </th>

                <th className="um-th um-th-metric">
                  <div className="um-th-metric-title">Job Posting</div>
                  <div className="um-th-metric-sub">{jobPostingCount}</div>
                </th>

                <th className="um-th um-th-metric">
                  <div className="um-th-metric-title">Job Booster</div>
                  <div className="um-th-metric-sub">{jobBoosterCount}</div>
                </th>

                <th className="um-th um-th-actions" style={{ width: 140, textAlign: 'right', paddingRight: 16 }}>
                  {/* Actions Column */}
                </th>
              </tr>
            </thead>

            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '48px 20px', color: '#64748b' }}>
                    <div style={{ fontSize: 15, fontWeight: 600, color: '#334155', marginBottom: 4 }}>
                      No users found
                    </div>
                    <div style={{ fontSize: 13 }}>Try clearing your search query or add a new user.</div>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const isSelected = !u.isSuperUser && selectedUserIds.includes(u.id);

                  return (
                    <tr key={u.id} className={`um-tr ${isSelected ? 'selected' : ''}`}>
                      {/* Checkbox */}
                      <td className="um-td" style={{ width: 44, paddingRight: 0 }}>
                        {u.isSuperUser ? (
                          <input
                            type="checkbox"
                            disabled
                            checked={false}
                            style={{
                              width: 16,
                              height: 16,
                              cursor: 'not-allowed',
                              opacity: 0.35,
                            }}
                            title="CLIENT cannot be selected"
                            aria-label="CLIENT cannot be selected"
                          />
                        ) : (
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleSelectUser(u.id)}
                            style={{ width: 16, height: 16, cursor: 'pointer', accentColor: '#002366' }}
                            aria-label={`Select ${u.name}`}
                          />
                        )}
                      </td>

                      {/* User Info - Click opens Change Password Modal */}
                      <td className="um-td">
                        <div
                          className="um-user-cell clickable"
                          onClick={() => handleOpenChangePassword(u)}
                          title="Click on profile to change password"
                          style={{ cursor: 'pointer' }}
                        >
                          <div
                            className="um-avatar"
                            style={{
                              backgroundColor: u.avatarBg,
                              color: u.avatarColor,
                              cursor: 'pointer',
                            }}
                          >
                            {u.avatar}
                          </div>

                          <div className="um-user-meta" style={{ cursor: 'pointer' }}>
                            <div className="um-user-name-row" style={{ cursor: 'pointer' }}>
                              <span className="um-user-name" style={{ cursor: 'pointer' }}>{u.name}</span>
                              {u.isSuperUser && (
                                <span className="um-badge-superuser" style={{ cursor: 'pointer' }}>CLIENT</span>
                              )}
                            </div>
                            <span className="um-user-email" style={{ cursor: 'pointer' }}>{u.email}</span>
                          </div>
                        </div>
                      </td>

                      {/* Resdex Permission */}
                      <td className="um-td um-metric-cell">
                        <button
                          type="button"
                          className="um-permission-badge"
                          title="Click to toggle Resdex access"
                          onClick={() => handleTogglePermission(u.id, 'resdex')}
                        >
                          {u.resdex ? (
                            <FiCheck className="um-icon-check" size={18} />
                          ) : (
                            <FiX className="um-icon-cross" size={18} />
                          )}
                        </button>
                      </td>

                      {/* Job Posting Permission */}
                      <td className="um-td um-metric-cell">
                        <button
                          type="button"
                          className="um-permission-badge"
                          title="Click to toggle Job Posting access"
                          onClick={() => handleTogglePermission(u.id, 'jobPosting')}
                        >
                          {u.jobPosting ? (
                            <FiCheck className="um-icon-check" size={18} />
                          ) : (
                            <FiX className="um-icon-cross" size={18} />
                          )}
                        </button>
                      </td>

                      {/* Job Booster Permission */}
                      <td className="um-td um-metric-cell">
                        <button
                          type="button"
                          className="um-permission-badge"
                          title="Click to toggle Job Booster access"
                          onClick={() => handleTogglePermission(u.id, 'jobBooster')}
                        >
                          {u.jobBooster ? (
                            <FiCheck className="um-icon-check" size={18} />
                          ) : (
                            <FiX className="um-icon-cross" size={18} />
                          )}
                        </button>
                      </td>

                      {/* Row Actions on Hover: CLIENT shows ONLY Edit; RECRUITERs show Edit & Delete */}
                      <td className="um-td um-td-actions" style={{ width: 140, textAlign: 'right', paddingRight: 16 }}>
                        <div className="um-row-actions">
                          <button
                            type="button"
                            className="um-btn-action-edit"
                            title="Edit user"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditUser(u);
                            }}
                          >
                            <FiEdit3 size={13} />
                          </button>
                          {!u.isSuperUser && (
                            <button
                              type="button"
                              className="um-btn-action-delete"
                              title="Delete user"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteUser(u.id);
                              }}
                            >
                              <FiTrash2 size={13} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* --- ADD / EDIT USER MODAL (Screenshot 2) --- */}
        {showAddModal && (
          <div className="um-modal-overlay" onClick={handleCloseAddModal}>
            <div className="um-modal-box" onClick={(e) => e.stopPropagation()}>
              {/* Modal Header */}
              <div className="um-modal-header">
                <h2 className="um-modal-title">{editingUser ? 'Edit user' : 'Add users'}</h2>
                <button
                  type="button"
                  className="um-modal-close-btn"
                  onClick={handleCloseAddModal}
                  aria-label="Close"
                >
                  <FiX size={20} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="um-modal-body">
                {/* Name Field */}
                <div className="um-form-group">
                  <label className="um-form-label" htmlFor="um-input-name">
                    Name
                  </label>
                  <input
                    id="um-input-name"
                    type="text"
                    className="um-input-text"
                    placeholder="Enter the name of the user"
                    value={formName}
                    onChange={(e) => {
                      setFormName(e.target.value);
                      if (formErrors.name) setFormErrors((p) => ({ ...p, name: null }));
                    }}
                    autoFocus
                  />
                  {formErrors.name && (
                    <span style={{ fontSize: 12, color: '#ef4444', fontWeight: 500 }}>
                      {formErrors.name}
                    </span>
                  )}
                </div>

                {/* Contact Details Field */}
                <div className="um-form-group">
                  <label className="um-form-label" htmlFor="um-input-email">
                    Contact details
                  </label>
                  <input
                    id="um-input-email"
                    type="email"
                    className="um-input-text"
                    placeholder="Enter work email"
                    value={formEmail}
                    onChange={(e) => {
                      setFormEmail(e.target.value);
                      if (formErrors.email) setFormErrors((p) => ({ ...p, email: null }));
                    }}
                  />
                  {formErrors.email && (
                    <span style={{ fontSize: 12, color: '#ef4444', fontWeight: 500 }}>
                      {formErrors.email}
                    </span>
                  )}
                  <span style={{ fontSize: 11.5, color: '#64748b' }}>
                    Allowed email domains: {allowedDomains.join(', ')}
                  </span>
                </div>

                {/* Permissions Field Card */}
                <div className="um-form-group">
                  <label className="um-form-label">Permissions</label>

                  <div className="um-permissions-card">
                    {/* Job Posting */}
                    <label className="um-checkbox-row">
                      <input
                        type="checkbox"
                        checked={formJobPosting}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setFormJobPosting(checked);
                          if (!checked) setFormJobBooster(false); // Booster requires Job Posting
                        }}
                      />
                      <span>Job Posting</span>
                    </label>

                    {/* Job Booster */}
                    <label className="um-checkbox-row">
                      <input
                        type="checkbox"
                        checked={formJobBooster}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setFormJobBooster(checked);
                          if (checked) setFormJobPosting(true); // Automatically check Job Posting
                        }}
                      />
                      <div className="um-checkbox-label-content">
                        <span>Job Booster</span>
                        <span style={{ fontSize: 12.5, color: '#64748b' }}>
                          (requires Job Posting permission)
                        </span>
                        <FiInfo
                          size={13}
                          color="#64748b"
                          title="Gives additional priority visibility to your jobs"
                        />
                      </div>
                    </label>

                    {/* Resdex */}
                    <label className="um-checkbox-row">
                      <input
                        type="checkbox"
                        checked={formResdex}
                        onChange={(e) => setFormResdex(e.target.checked)}
                      />
                      <div className="um-checkbox-label-content">
                        <span>Resdex</span>
                        <span style={{ fontSize: 12.5, color: '#64748b' }}>(includes NVite)</span>
                        <FiLock size={13} color="#64748b" title="Consumes 1 Resdex license" />
                      </div>
                    </label>

                    {/* Information Note */}
                    <div className="um-permissions-note">
                      <FiInfo size={16} color="#0284c7" style={{ flexShrink: 0, marginTop: 1 }} />
                      <div>
                        <strong>Response manager</strong> access is available to all recruiters who post a job, send an NVite, or are added as collaborators.
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="um-modal-footer">
                {!editingUser && (
                  <button
                    type="button"
                    className="um-btn-link-action"
                    onClick={() => handleSaveUser(true)}
                  >
                    Save and add another user
                  </button>
                )}

                <button
                  type="button"
                  className="um-btn-modal-save"
                  onClick={() => handleSaveUser(false)}
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}

        {/* --- CHANGE PASSWORD MODAL (Matching User Screenshot) --- */}
        {changePasswordUser && (
          <div className="um-modal-overlay" onClick={handleCloseChangePassword}>
            <div className="um-cp-modal-box" onClick={(e) => e.stopPropagation()}>
              {/* Modal Header */}
              <div className="um-cp-modal-header">
                <h2 className="um-cp-modal-title">Change Password</h2>
                <button
                  type="button"
                  className="um-cp-close-btn"
                  onClick={handleCloseChangePassword}
                  aria-label="Close"
                >
                  <FiX size={20} />
                </button>
              </div>

              <form onSubmit={handleChangePasswordSubmit} className="um-cp-form">
                {/* Username */}
                <div className="um-cp-field-group">
                  <label className="um-cp-label">Username</label>
                  <input
                    type="text"
                    className="um-cp-input readonly"
                    value={changePasswordUser.email}
                    readOnly
                    disabled
                  />
                </div>

                {/* Add new password */}
                <div className="um-cp-field-group">
                  <label className="um-cp-label">Add new password</label>
                  <div className="um-cp-input-wrapper">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      className="um-cp-input"
                      placeholder="Type here"
                      value={newPassword}
                      onChange={(e) => {
                        setNewPassword(e.target.value);
                        if (passwordError) setPasswordError('');
                      }}
                      autoFocus
                    />
                    <button
                      type="button"
                      className="um-cp-eye-btn"
                      onClick={() => setShowNewPassword((prev) => !prev)}
                      aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                    >
                      {showNewPassword ? <FiEye size={18} /> : <FiEyeOff size={18} />}
                    </button>
                  </div>
                </div>

                {/* Confirm password */}
                <div className="um-cp-field-group">
                  <label className="um-cp-label">Confirm password</label>
                  <div className="um-cp-input-wrapper">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      className="um-cp-input"
                      placeholder="Type here"
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        if (passwordError) setPasswordError('');
                      }}
                    />
                    <button
                      type="button"
                      className="um-cp-eye-btn"
                      onClick={() => setShowConfirmPassword((prev) => !prev)}
                      aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                    >
                      {showConfirmPassword ? <FiEye size={18} /> : <FiEyeOff size={18} />}
                    </button>
                  </div>
                </div>

                {passwordError && (
                  <div className="um-cp-error-text">
                    {passwordError}
                  </div>
                )}

                {/* Actions: Change Password & Cancel */}
                <div className="um-cp-actions-row">
                  <button
                    type="submit"
                    className="um-cp-btn-submit"
                  >
                    Change Password
                  </button>
                  <button
                    type="button"
                    className="um-cp-btn-cancel"
                    onClick={handleCloseChangePassword}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* --- ADD ALLOWED DOMAIN MODAL: STEP 1 = SELECT METHOD -> STEP 2 = OTP VERIFICATION -> STEP 3 = ENTER DOMAIN --- */}
        {showDomainModal && (
          <div className="um-modal-overlay" onClick={() => setShowDomainModal(false)}>
            <div className="um-modal-box" onClick={(e) => e.stopPropagation()}>
              <div className="um-modal-header">
                <h2 className="um-modal-title">
                  {domainStep === 'select_method' ? 'Choose Verification Method' : domainStep === 'otp' ? 'Security Verification' : domainAction === 'edit' ? 'Edit Allowed Domain' : 'Add Allowed Domain'}
                </h2>
                <button
                  type="button"
                  className="um-modal-close-btn"
                  onClick={() => setShowDomainModal(false)}
                >
                  <FiX size={20} />
                </button>
              </div>

              {domainStep === 'select_method' ? (
                <div className="um-modal-body">
                  <div style={{ textAlign: 'center', marginBottom: 24, color: '#334155', fontSize: 14 }}>
                    Please select where you would like to receive your security verification OTP:
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'center', gap: 12 }}>
                    <button
                      type="button"
                      className="um-btn-primary"
                      onClick={() => handleSelectOtpMethod('email')}
                      style={{ textAlign: 'center', flex: 1 }}
                    >
                      Send OTP to Registered Email
                    </button>
                    <button
                      type="button"
                      className="um-btn-outline"
                      onClick={() => handleSelectOtpMethod('mobile')}
                      style={{ textAlign: 'center', flex: 1 }}
                    >
                      Send OTP to Registered Mobile
                    </button>
                  </div>
                </div>
              ) : domainStep === 'otp' ? (
                /* STEP 2: ENTER OTP */
                <form onSubmit={handleVerifyOtpFirst}>
                  <div className="um-modal-body">
                    {/* Security Info Card */}
                    <div style={{ marginBottom: 24 }}>
                      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                        <div style={{ width: 40, height: 40, background: '#f0f9ff', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <FiShield size={20} color="#0ea5e9" />
                        </div>
                        <div style={{ fontSize: 13, color: '#475569', lineHeight: 1.5 }}>
                          To authorize {domainAction === 'delete' ? `deleting the domain ${targetDomain}` : domainAction === 'edit' ? `editing the domain ${targetDomain}` : 'adding a new domain'}, enter the 6-digit OTP sent to the CLIENT's registered {otpMethod === 'email' ? 'email' : 'mobile number'}:{' '}
                          <strong style={{ color: '#002366' }}>{maskedPhone}</strong>
                        </div>
                      </div>
                    </div>

                    {/* 6 OTP Boxes */}
                    <div className="um-otp-row">
                      {domainOtp.map((digit, index) => (
                        <input
                          key={index}
                          ref={(el) => (domainOtpRefs.current[index] = el)}
                          type="text"
                          inputMode="numeric"
                          maxLength={6}
                          value={digit}
                          className={`um-otp-box ${domainError ? 'error' : ''}`}
                          onChange={(e) => handleDomainOtpChange(index, e.target.value)}
                          onKeyDown={(e) => handleDomainOtpKeyDown(index, e)}
                        />
                      ))}
                    </div>

                    {domainError && (
                      <div style={{ textAlign: 'center', fontSize: 12, color: '#ef4444', fontWeight: 600 }}>
                        {domainError}
                      </div>
                    )}

                    {/* Resend Timer */}
                    <div style={{ textAlign: 'center', fontSize: 12.5, color: '#64748b' }}>
                      {otpTimer > 0 ? (
                        <span>
                          OTP expires in <strong>{Math.floor(otpTimer / 60)}:{String(otpTimer % 60).padStart(2, '0')}</strong>
                        </span>
                      ) : (
                        <button
                          type="button"
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#002366',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            fontSize: 12.5,
                          }}
                          onClick={handleResendOtp}
                        >
                          <FiRefreshCw size={12} /> Resend OTP
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="um-modal-footer">
                    <button
                      type="button"
                      className="um-btn-link-action"
                      onClick={() => setShowDomainModal(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="um-btn-modal-save"
                      disabled={domainOtp.join('').length < 6 || otpLoading}
                    >
                      {otpLoading ? 'Verifying…' : 'Verify OTP & Continue'}
                    </button>
                  </div>
                </form>
              ) : (
                /* STEP 2: ENTER NEW DOMAIN AFTER OTP VERIFICATION */
                <form onSubmit={handleSaveDomainAfterOtp}>
                  <div className="um-modal-body">
                    {/* Verified Status Banner */}
                    <div
                      style={{
                        background: '#ecfdf5',
                        border: '1px solid #a7f3d0',
                        borderRadius: 10,
                        padding: '10px 14px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        fontSize: 13,
                        color: '#065f46',
                        fontWeight: 600,
                      }}
                    >
                      <FiCheckCircle size={17} color="#10b981" />
                      CLIENT {otpMethod === 'email' ? 'Email' : 'Phone'} Verified ({maskedPhone})
                    </div>

                    <div className="um-form-group">
                      <label className="um-form-label">Domain Name</label>
                      <input
                        type="text"
                        className="um-input-text"
                        placeholder="e.g. @mycompany.com"
                        value={newDomainInput}
                        onChange={(e) => {
                          setNewDomainInput(e.target.value);
                          if (domainError) setDomainError('');
                        }}
                        autoFocus
                      />
                      {domainError ? (
                        <span style={{ fontSize: 12, color: '#ef4444', fontWeight: 500 }}>
                          {domainError}
                        </span>
                      ) : (
                        <span style={{ fontSize: 12, color: '#64748b' }}>
                          Only accounts ending with this domain can be added as RECRUITERs.
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="um-modal-footer">
                    <button
                      type="button"
                      className="um-btn-link-action"
                      onClick={() => setShowDomainModal(false)}
                    >
                      Cancel
                    </button>
                    <button type="submit" className="um-btn-modal-save">
                      {domainAction === 'edit' ? 'Update Domain' : 'Add Domain'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

        {/* --- CHANGE RESTRICTIONS MODAL --- */}
        {showRestrictionsModal && (
          <ChangeRestrictionsModal
            isOpen={showRestrictionsModal}
            onClose={() => setShowRestrictionsModal(false)}
            selectedIds={selectedUserIds}
            onSaved={() => {
              showToast('Restrictions updated successfully.');
              fetchUsers();
            }}
          />
        )}
        </>)}
      </div>
    </EmployerLayout>
  );
}
