import { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiPlus, FiMoreVertical, FiChevronDown, FiInfo,
  FiSearch, FiCheck, FiX, FiLock, FiShield,
  FiClock, FiGlobe, FiTrash2, FiEdit3, FiCheckCircle,
  FiPhone, FiArrowLeft, FiRefreshCw, FiEye, FiEyeOff
} from 'react-icons/fi';
import EmployerLayout from '../../../../components/employer/EmployerLayout';
import EmployerBreadcrumb from '../../../../components/employer/EmployerBreadcrumb';
import './UserManagement.css';

// Initial pre-loaded users matching the screenshot
const INITIAL_USERS = [
  {
    id: 'u-1',
    name: 'admin',
    email: 'admin@mavenjobs.in',
    isSuperUser: true,
    isRestricted: false,
    avatar: 'A',
    avatarBg: '#fef3c7',
    avatarColor: '#b45309',
    resdex: true,
    jobPosting: true,
    jobBooster: true,
  },
  {
    id: 'u-2',
    name: 'muskan',
    email: 'recruit@mavenjobs.in',
    isSuperUser: false,
    isRestricted: true,
    avatar: 'M',
    avatarBg: '#fef3c7',
    avatarColor: '#b45309',
    resdex: false,
    jobPosting: false,
    jobBooster: false,
  },
  {
    id: 'u-3',
    name: 'Nikita',
    email: 'hr@mavenjobs.in',
    isSuperUser: false,
    isRestricted: true,
    avatar: 'N',
    avatarBg: '#e2e8f0',
    avatarColor: '#475569',
    resdex: true,
    jobPosting: false,
    jobBooster: false,
  },
  {
    id: 'u-4',
    name: 'Khushi',
    email: 'bd3@mavenjobs.in',
    isSuperUser: false,
    isRestricted: false,
    avatar: 'K',
    avatarBg: '#fef3c7',
    avatarColor: '#b45309',
    resdex: true,
    jobPosting: true,
    jobBooster: true,
  },
  {
    id: 'u-5',
    name: 'Rahul Sharma',
    email: 'rahul.s@mavenjobs.in',
    isSuperUser: false,
    isRestricted: false,
    avatar: 'R',
    avatarBg: '#dbeafe',
    avatarColor: '#1d4ed8',
    resdex: true,
    jobPosting: true,
    jobBooster: false,
  },
  {
    id: 'u-6',
    name: 'Priya Verma',
    email: 'priya.v@mavenjobs.in',
    isSuperUser: false,
    isRestricted: true,
    avatar: 'P',
    avatarBg: '#fce7f3',
    avatarColor: '#be185d',
    resdex: true,
    jobPosting: false,
    jobBooster: false,
  },
  {
    id: 'u-7',
    name: 'Amit Patel',
    email: 'amit.p@mavenjobs.in',
    isSuperUser: false,
    isRestricted: false,
    avatar: 'A',
    avatarBg: '#ede9fe',
    avatarColor: '#6d28d9',
    resdex: true,
    jobPosting: false,
    jobBooster: false,
  },
  {
    id: 'u-8',
    name: 'Sneha Kulkarni',
    email: 'sneha.k@mavenjobs.in',
    isSuperUser: false,
    isRestricted: false,
    avatar: 'S',
    avatarBg: '#ccfbf1',
    avatarColor: '#0f766e',
    resdex: true,
    jobPosting: true,
    jobBooster: false,
  },
  {
    id: 'u-9',
    name: 'Vikram Malhotra',
    email: 'vikram.m@mavenjobs.in',
    isSuperUser: false,
    isRestricted: true,
    avatar: 'V',
    avatarBg: '#fee2e2',
    avatarColor: '#b91c1c',
    resdex: true,
    jobPosting: false,
    jobBooster: false,
  },
  {
    id: 'u-10',
    name: 'Ananya Roy',
    email: 'ananya.r@mavenjobs.in',
    isSuperUser: false,
    isRestricted: true,
    avatar: 'A',
    avatarBg: '#e0e7ff',
    avatarColor: '#3730a3',
    resdex: false,
    jobPosting: false,
    jobBooster: false,
  },
];

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

export default function UserManagement() {
  const navigate = useNavigate();

  // Users state with localStorage fallback
  const [users, setUsers] = useState(() => {
    try {
      const saved = localStorage.getItem('maven_sub_users');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return INITIAL_USERS;
  });

  // Sync users to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('maven_sub_users', JSON.stringify(users));
    } catch {}
  }, [users]);

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
  const [allowedDomains, setAllowedDomains] = useState(['@mavenjobs.in', '@mycompany.com']);
  const [newDomainInput, setNewDomainInput] = useState('');
  const [domainStep, setDomainStep] = useState('input'); // 'input' | 'otp'
  const [domainOtp, setDomainOtp] = useState(['', '', '', '', '', '']);
  const [domainError, setDomainError] = useState('');
  const [otpTimer, setOtpTimer] = useState(30);
  const [otpLoading, setOtpLoading] = useState(false);
  const domainOtpRefs = useRef([]);
  const maskedPhone = '+91 98******10';

  // Account Security settings state (matching Screenshot 1)
  const [notifyPasswordChange, setNotifyPasswordChange] = useState(true);
  const [receiveOtpOnlyOnMobile, setReceiveOtpOnlyOnMobile] = useState(false);
  const [useOtpOnPatternChange, setUseOtpOnPatternChange] = useState(false);

  // Time Restrictions settings state (matching Screenshot 2)
  const [weekendRestrictions, setWeekendRestrictions] = useState([]); // ['Saturday', 'Sunday']
  const [showWeekendMsq, setShowWeekendMsq] = useState(false);
  const weekendMsqRef = useRef(null);
  const [accessStartTime, setAccessStartTime] = useState('12:00 AM');
  const [accessEndTime, setAccessEndTime] = useState('12:30 AM');

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

  const handleChangePasswordSubmit = (e) => {
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
    showToast(`Password changed successfully for ${changePasswordUser?.name || changePasswordUser?.email}!`);
    handleCloseChangePassword();
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

  // Master Checkbox - Only sub-users can be selected (super-users cannot be selected)
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
    if (target?.isSuperUser) return; // Super-user cannot be selected
    setSelectedUserIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Toggle single permission for user
  const handleTogglePermission = (userId, field) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === userId) {
          const updated = { ...u, [field]: !u[field] };
          // If Job Booster enabled, ensure Job Posting is also enabled
          if (field === 'jobBooster' && updated.jobBooster) {
            updated.jobPosting = true;
          }
          // If Job Posting disabled, disable Job Booster too
          if (field === 'jobPosting' && !updated.jobPosting) {
            updated.jobBooster = false;
          }
          return updated;
        }
        return u;
      })
    );
    showToast(`Updated ${field === 'jobPosting' ? 'Job Posting' : field === 'jobBooster' ? 'Job Booster' : 'Resdex'} permission`);
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
  const handleSaveUser = (keepOpen = false) => {
    if (!validateForm()) return;

    const trimmedName = formName.trim();
    const trimmedEmail = formEmail.trim().toLowerCase();

    // If in Edit mode
    if (editingUser) {
      if (users.some((u) => u.id !== editingUser.id && u.email.toLowerCase() === trimmedEmail)) {
        setFormErrors({ email: 'A user with this email already exists' });
        return;
      }
      setUsers((prev) =>
        prev.map((u) =>
          u.id === editingUser.id
            ? {
                ...u,
                name: trimmedName,
                email: trimmedEmail,
                jobPosting: formJobPosting,
                jobBooster: formJobBooster,
                resdex: formResdex,
              }
            : u
        )
      );
      showToast(`User "${trimmedName}" updated successfully!`);
      handleCloseAddModal();
      return;
    }

    // Check if email already exists
    if (users.some((u) => u.email.toLowerCase() === trimmedEmail)) {
      setFormErrors({ email: 'A user with this email already exists' });
      return;
    }

    const firstChar = trimmedName[0]?.toUpperCase() || 'U';
    const palette = AVATAR_PALETTE[Math.floor(Math.random() * AVATAR_PALETTE.length)];

    const newUser = {
      id: `u-${Date.now()}`,
      name: trimmedName,
      email: trimmedEmail,
      isSuperUser: false,
      avatar: firstChar,
      avatarBg: palette.bg,
      avatarColor: palette.color,
      resdex: formResdex,
      jobPosting: formJobPosting,
      jobBooster: formJobBooster,
    };

    setUsers((prev) => [newUser, ...prev]);
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
  const handleDeleteUser = (userId) => {
    const target = users.find((u) => u.id === userId);
    if (target?.isSuperUser) {
      showToast('Super-user cannot be deleted');
      return;
    }
    if (window.confirm(`Are you sure you want to delete sub-user "${target?.name || 'this user'}"?`)) {
      setUsers((prev) => prev.filter((u) => u.id !== userId));
      setSelectedUserIds((prev) => prev.filter((id) => id !== userId));
      showToast(`Sub-user "${target?.name || ''}" deleted successfully.`);
    }
  };

  // Delete Selected Users
  const handleDeleteSelected = () => {
    if (selectedUserIds.length === 0) return;
    if (window.confirm(`Are you sure you want to remove ${selectedUserIds.length} sub-user(s)?`)) {
      setUsers((prev) => prev.filter((u) => !selectedUserIds.includes(u.id)));
      setSelectedUserIds([]);
      showToast('Selected user(s) removed successfully.');
    }
  };

  // --- Allowed Domain Flow: First verify OTP -> then enter new domain ---
  const handleOpenDomainModal = () => {
    setDomainStep('otp'); // First step: verify OTP!
    setNewDomainInput('');
    setDomainOtp(['', '', '', '', '', '']);
    setDomainError('');
    setOtpTimer(30);
    setShowDomainModal(true);
    showToast(`Verification OTP sent to Super-user's phone (${maskedPhone})`);
    setTimeout(() => {
      domainOtpRefs.current[0]?.focus();
    }, 150);
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

  const handleVerifyOtpFirst = (e) => {
    e?.preventDefault?.();
    const enteredCode = domainOtp.join('');
    if (enteredCode.length < 6) {
      setDomainError('Please enter the complete 6-digit OTP');
      return;
    }

    setOtpLoading(true);
    setTimeout(() => {
      setOtpLoading(false);
      setDomainError('');
      setDomainStep('domain'); // Step 2: Now give option to enter new domain!
      showToast('Super-user phone verified! Please enter the new domain.');
    }, 350);
  };

  const handleSaveDomainAfterOtp = (e) => {
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
    if (allowedDomains.includes(dom)) {
      setDomainError(`Domain ${dom} is already in the allowed domains list`);
      return;
    }

    setAllowedDomains((prev) => [...prev, dom]);
    showToast(`Domain ${dom} added successfully!`);
    setShowDomainModal(false);
    setDomainStep('otp');
    setNewDomainInput('');
    setDomainOtp(['', '', '', '', '', '']);
    setDomainError('');
  };

  const handleResendOtp = () => {
    setDomainOtp(['', '', '', '', '', '']);
    setOtpTimer(30);
    setDomainError('');
    showToast(`New OTP sent to Super-user's phone (${maskedPhone})`);
    domainOtpRefs.current[0]?.focus();
  };

  const handleFillDemoOtp = () => {
    setDomainOtp(['1', '2', '3', '4', '5', '6']);
    setDomainError('');
    domainOtpRefs.current[5]?.focus();
  };

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
                    onClick={() => {
                      setOpenDropdown(null);
                      showToast('User list exported to CSV.');
                    }}
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
                      style={{
                        padding: '6px 12px',
                        fontSize: 13,
                        color: '#0f172a',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <span>{dom}</span>
                      <FiCheck size={14} color="#10b981" />
                    </div>
                  ))}
                  <div style={{ borderTop: '1px solid #e2e8f0', marginTop: 4, paddingTop: 4 }}>
                    <button
                      type="button"
                      className="um-popover-item"
                      style={{ color: '#0284c7', fontWeight: 600 }}
                      onClick={() => {
                        setOpenDropdown(null);
                        handleOpenDomainModal();
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
                          onChange={(e) => {
                            setNotifyPasswordChange(e.target.checked);
                            showToast('Security setting updated');
                          }}
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
                          onChange={(e) => {
                            setReceiveOtpOnlyOnMobile(e.target.checked);
                            showToast('Security setting updated');
                          }}
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
                          onChange={(e) => {
                            setUseOtpOnPatternChange(e.target.checked);
                            showToast('Security setting updated');
                          }}
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

                  {/* Block access for sub-user on (MSQ Multi-select) */}
                  <div className="um-restriction-field">
                    <span className="um-restriction-label">Block access for sub-user on</span>
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
                      <FiInfo size={16} color="#94a3b8" title="Restrict sub-user access on specified weekend days" />
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
                      <FiInfo size={16} color="#94a3b8" title="Set daily working hour limits for sub-users" />
                    </div>
                  </div>

                  {/* Save Button */}
                  <button
                    type="button"
                    className="um-btn-save-blue"
                    onClick={() => {
                      setOpenDropdown(null);
                      setShowWeekendMsq(false);
                      showToast('Time restrictions saved successfully!');
                    }}
                  >
                    Save
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
                onClick={handleOpenDomainModal}
              >
                Add Allowed Domain
              </span>
            </div>
            <div>
              If allowed domain is @mycompany.com, then only account ending with @mycompany.com can be added as subuser.
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

        {/* Sub-Users Table */}
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
                  <div className="um-th-metric-sub">8 (8 licenses)</div>
                </th>

                <th className="um-th um-th-metric">
                  <div className="um-th-metric-title">Job Posting</div>
                  <div className="um-th-metric-sub">3</div>
                </th>

                <th className="um-th um-th-metric">
                  <div className="um-th-metric-title">Job Booster</div>
                  <div className="um-th-metric-sub">3</div>
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
                            title="Super-user cannot be selected"
                            aria-label="Super-user cannot be selected"
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
                                <span className="um-badge-superuser" style={{ cursor: 'pointer' }}>Super-user</span>
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

                      {/* Row Actions on Hover: Super-user shows ONLY Edit; Sub-users show Edit & Delete */}
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

        {/* --- ADD ALLOWED DOMAIN MODAL: STEP 1 = OTP VERIFICATION -> STEP 2 = ENTER DOMAIN --- */}
        {showDomainModal && (
          <div className="um-modal-overlay" onClick={() => setShowDomainModal(false)}>
            <div className="um-modal-box" onClick={(e) => e.stopPropagation()}>
              <div className="um-modal-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <h2 className="um-modal-title">
                    {domainStep === 'otp' ? 'Security Verification' : 'Add Allowed Domain'}
                  </h2>
                </div>
                <button
                  type="button"
                  className="um-modal-close-btn"
                  onClick={() => setShowDomainModal(false)}
                >
                  <FiX size={20} />
                </button>
              </div>

              {domainStep === 'otp' ? (
                /* STEP 1: VERIFY OTP FIRST */
                <form onSubmit={handleVerifyOtpFirst}>
                  <div className="um-modal-body">
                    {/* Security Info Card */}
                    <div
                      style={{
                        background: '#f0f7ff',
                        border: '1px solid #bae6fd',
                        borderRadius: 10,
                        padding: '14px 16px',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 12,
                      }}
                    >
                      <FiShield size={20} color="#0284c7" style={{ flexShrink: 0, marginTop: 2 }} />
                      <div style={{ fontSize: 13, color: '#0369a1', lineHeight: 1.5 }}>
                        <strong>Super-user Mobile Verification:</strong>
                        <div style={{ marginTop: 3 }}>
                          To authorize adding a new domain, enter the 6-digit OTP sent to the Super-user's registered phone number:{' '}
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

                    {/* Demo OTP Helper Pill */}
                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                      <button
                        type="button"
                        className="um-demo-otp-pill"
                        onClick={handleFillDemoOtp}
                        title="Click to automatically fill dummy OTP"
                      >
                        <span>💡 Demo OTP: <strong>123456</strong> (Click to fill)</span>
                      </button>
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
                          Resend OTP in <strong>{otpTimer}s</strong>
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
                      Super-user Phone Verified ({maskedPhone})
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
                          Only accounts ending with this domain can be added as sub-users.
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
                      Add Domain
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

        {/* --- CHANGE RESTRICTIONS MODAL --- */}
        {showRestrictionsModal && (
          <div className="um-modal-overlay" onClick={() => setShowRestrictionsModal(false)}>
            <div className="um-modal-box" onClick={(e) => e.stopPropagation()}>
              <div className="um-modal-header">
                <h2 className="um-modal-title">Change Restrictions</h2>
                <button
                  type="button"
                  className="um-modal-close-btn"
                  onClick={() => setShowRestrictionsModal(false)}
                >
                  <FiX size={20} />
                </button>
              </div>
              <div className="um-modal-body">
                <div className="um-form-group">
                  <label className="um-form-label">Time Restriction Policy</label>
                  <select className="um-input-text" defaultValue="all-day">
                    <option value="all-day">Allow access 24/7 (No restriction)</option>
                    <option value="office-hours">Office hours only (9:00 AM - 7:00 PM IST)</option>
                    <option value="custom">Custom schedule (Weekdays only)</option>
                  </select>
                </div>
                <div className="um-form-group">
                  <label className="um-form-label">IP Address Restriction</label>
                  <input
                    type="text"
                    className="um-input-text"
                    placeholder="e.g. 192.168.1.0/24 (Leave blank for unrestricted)"
                  />
                </div>
              </div>
              <div className="um-modal-footer">
                <button
                  type="button"
                  className="um-btn-link-action"
                  onClick={() => setShowRestrictionsModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="um-btn-modal-save"
                  onClick={() => {
                    setShowRestrictionsModal(false);
                    showToast('Restrictions updated successfully.');
                  }}
                >
                  Apply Changes
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </EmployerLayout>
  );
}
