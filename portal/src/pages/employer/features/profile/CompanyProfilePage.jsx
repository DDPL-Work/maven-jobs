import React, { useState, useEffect, useRef } from 'react';
import {
  FiEdit2, FiCheckCircle, FiShield, FiBriefcase, FiUser,
  FiMapPin, FiGlobe, FiPhone, FiMail, FiX, FiCheck, FiAlertCircle,
  FiCamera, FiUploadCloud, FiLock, FiZap, FiLayers, FiArrowRight
} from 'react-icons/fi';
import EmployerLayout from '../../../../components/employer/EmployerLayout';
import EmployerBreadcrumb from '../../../../components/employer/EmployerBreadcrumb';
import { useEmployerAuth } from '../../../../hooks/useEmployerAuth';
import authService from '../../../../services/authService';
import './CompanyProfilePage.css';

export default function CompanyProfilePage() {
  const { session } = useEmployerAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Logo upload state & ref
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const logoInputRef = useRef(null);

  // Edit Modals & State
  const [editAccountModal, setEditAccountModal] = useState(false);
  const [editCompanyModal, setEditCompanyModal] = useState(false);
  const [savingAccount, setSavingAccount] = useState(false);
  const [savingCompany, setSavingCompany] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState('');
  const [modalError, setModalError] = useState('');

  // Edit form buffers
  const [accountForm, setAccountForm] = useState({
    username: '',
    communicationEmail: '',
    mobileNumber: '',
  });

  const [companyForm, setCompanyForm] = useState({
    companyType: '',
    industryType: '',
    contactPerson: '',
    alias: '',
    contactDesignation: '',
    websiteUrl: '',
    phone1: '',
    phone2: '',
    // tanNumber: '',
  });

  const loadProfile = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await authService.getEmployerProfile();
      if (res?.data) {
        const comp = res.data.company || {};
        const usr = res.data.user || {};

        const merged = {
          id: comp.id || comp._id || '',
          clientId: comp.clientId || (comp.id ? `MV-${String(comp.id).slice(-5).toUpperCase()}` : (comp._id ? `MV-${String(comp._id).slice(-5).toUpperCase()}` : '—')),
          companyName: comp.companyName || comp.name || session?.companyName || '',
          logoUrl: comp.logoUrl || session?.logoUrl || '',
          username: usr.username || usr.name || usr.email || '',
          communicationEmail: comp.communicationEmail || comp.email || usr.email || '',
          mobileNumber: comp.mobileNumber || comp.phone || usr.phone || '',
          companyType: comp.companyType || comp.type || '',
          industryType: comp.industryType || comp.industry || '',
          contactPerson: comp.contactPerson || usr.name || '',
          alias: comp.alias || '',
          contactDesignation: comp.contactDesignation || comp.tagline || '',
          websiteUrl: comp.websiteUrl || comp.website || '',
          profileHotVacancies: comp.profileHotVacancies || 'Standard',
          profileClassifieds: comp.profileClassifieds || 'Standard',
          jobLiveDurationDays: comp.jobLiveDurationDays || 30,
          jobLiveDurations: comp.jobLiveDurations || {
            standard: comp.jobLiveDurationDays || 30,
            hotVacancy: comp.jobLiveDurationDays || 30,
            smb: comp.jobLiveDurationDays || 30,
            internship: comp.jobLiveDurationDays || 30,
          },
          phone1: comp.phone1 || comp.phone || '',
          phone2: comp.phone2 || comp.altPhone || '',
          // tanNumber: comp.tanNumber || '',
          gstin: comp.gstin || '',
          kycStatus: comp.kycStatus || (comp.status === 'ACTIVE' ? 'APPROVED' : (comp.status || 'PENDING_VERIFICATION')),
          registeredName: comp.registeredName || comp.name || '',
          addressLabel: comp.addressLabel || 'Primary Address',
          address: comp.location?.address || '',
          country: comp.location?.country || 'India',
          city: comp.location?.city || '',
          state: comp.location?.region || comp.location?.state || '',
          pincode: comp.location?.pincode || '',
          status: comp.status || 'ACTIVE',
          planSnapshot: comp.planSnapshot || null,
          services: comp.services || comp.planSnapshot?.services || [],
          packageType: comp.packageType || 'STANDARD',
          plan: comp.plan || comp.planSnapshot?.planName || 'Free Plan',
        };

        setProfile(merged);
      } else {
        setError('No company details received.');
      }
    } catch (err) {
      console.error('Failed to fetch company profile from collection:', err);
      setError(err?.message || 'Failed to load company profile. Please ensure you are logged in.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const showToast = (msg) => {
    setSaveSuccess(msg);
    setTimeout(() => setSaveSuccess(''), 3500);
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploadingLogo(true);
      const res = await authService.uploadEmployerMedia('logo', file);
      if (res?.data?.company?.logoUrl) {
        setProfile((prev) => ({ ...prev, logoUrl: res.data.company.logoUrl }));
      }
      showToast('Company logo uploaded successfully');
    } catch (err) {
      alert(err?.message || 'Failed to upload company logo');
    } finally {
      setUploadingLogo(false);
      if (logoInputRef.current) logoInputRef.current.value = '';
    }
  };

  const handleOpenAccountModal = () => {
    if (!profile) return;
    setAccountForm({
      username: profile.username || '',
      communicationEmail: profile.communicationEmail || '',
      mobileNumber: profile.mobileNumber || '',
    });
    setModalError('');
    setEditAccountModal(true);
  };

  const handleOpenCompanyModal = () => {
    if (!profile) return;
    setCompanyForm({
      companyType: profile.companyType || '',
      industryType: profile.industryType || '',
      contactPerson: profile.contactPerson || '',
      alias: profile.alias || '',
      contactDesignation: profile.contactDesignation || '',
      websiteUrl: profile.websiteUrl || '',
      jobLiveDurationDays: profile.jobLiveDurationDays || 30,
      phone1: profile.phone1 || '',
      phone2: profile.phone2 || '',
      // tanNumber: profile.tanNumber || '',
    });
    setModalError('');
    setEditCompanyModal(true);
  };

  const handleSaveAccount = async (e) => {
    e.preventDefault();
    try {
      setSavingAccount(true);
      setModalError('');
      const res = await authService.updateEmployerProfile({
        communicationEmail: accountForm.communicationEmail,
        email: accountForm.communicationEmail,
        companyEmail: accountForm.communicationEmail,
        phone: accountForm.mobileNumber,
        mobileNumber: accountForm.mobileNumber,
      });

      if (res?.data) {
        const comp = res.data.company || {};
        const usr = res.data.user || {};
        setProfile((prev) => ({
          ...prev,
          username: usr.username || usr.email || prev.username,
          communicationEmail: comp.communicationEmail || comp.email || accountForm.communicationEmail,
          mobileNumber: comp.mobileNumber || comp.phone || accountForm.mobileNumber,
        }));
      } else {
        setProfile((prev) => ({
          ...prev,
          communicationEmail: accountForm.communicationEmail,
          mobileNumber: accountForm.mobileNumber,
        }));
      }
      setEditAccountModal(false);
      showToast('Account details updated successfully');
    } catch (err) {
      setModalError(err?.message || 'Failed to update account details');
    } finally {
      setSavingAccount(false);
    }
  };

  const handleSaveCompany = async (e) => {
    e.preventDefault();
    try {
      setSavingCompany(true);
      setModalError('');
      const res = await authService.updateEmployerProfile({
        companyType: companyForm.companyType,
        type: companyForm.companyType,
        industryType: companyForm.industryType,
        industry: companyForm.industryType,
        contactPerson: companyForm.contactPerson,
        alias: companyForm.alias,
        contactDesignation: companyForm.contactDesignation,
        websiteUrl: companyForm.websiteUrl,
        website: companyForm.websiteUrl,
        jobLiveDurationDays: Number(companyForm.jobLiveDurationDays) || 30,
        phone1: companyForm.phone1,
        phone: companyForm.phone1,
        phone2: companyForm.phone2,
        altPhone: companyForm.phone2,
        // tanNumber: companyForm.tanNumber,
      });

      if (res?.data?.company) {
        const comp = res.data.company;
        setProfile((prev) => ({
          ...prev,
          companyType: comp.companyType || comp.type || companyForm.companyType,
          industryType: comp.industryType || comp.industry || companyForm.industryType,
          contactPerson: comp.contactPerson || companyForm.contactPerson,
          alias: comp.alias || companyForm.alias,
          contactDesignation: comp.contactDesignation || companyForm.contactDesignation,
          websiteUrl: comp.websiteUrl || comp.website || companyForm.websiteUrl,
          jobLiveDurationDays: comp.jobLiveDurationDays || Number(companyForm.jobLiveDurationDays) || 30,
          jobLiveDurations: comp.jobLiveDurations || prev.jobLiveDurations,
          phone1: comp.phone1 || comp.phone || companyForm.phone1,
          phone2: comp.phone2 || comp.altPhone || companyForm.phone2,
          // tanNumber: comp.tanNumber || companyForm.tanNumber,
        }));
      } else {
        setProfile((prev) => ({
          ...prev,
          ...companyForm,
        }));
      }
      setEditCompanyModal(false);
      showToast('Company details updated successfully');
    } catch (err) {
      setModalError(err?.message || 'Failed to update company details');
    } finally {
      setSavingCompany(false);
    }
  };

  if (loading) {
    return (
      <EmployerLayout activeTab="company-profile">
        <div className="cpp-container">
          <EmployerBreadcrumb items={[
            { label: 'Employer Dashboard', path: '/employer-dashboard' },
            { label: 'Company Profile' },
          ]} />
          <div className="cpp-state-card">
            <div className="cpp-spinner" />
            <span style={{ fontSize: 14.5, fontWeight: 600 }}>Fetching company details from database...</span>
          </div>
        </div>
      </EmployerLayout>
    );
  }

  if (error || !profile) {
    return (
      <EmployerLayout activeTab="company-profile">
        <div className="cpp-container">
          <EmployerBreadcrumb items={[
            { label: 'Employer Dashboard', path: '/employer-dashboard' },
            { label: 'Company Profile' },
          ]} />
          <div className="cpp-error-card">
            <FiAlertCircle size={32} />
            <span style={{ fontSize: 16, fontWeight: 700 }}>{error || 'Unable to load company profile'}</span>
            <button
              onClick={loadProfile}
              style={{
                marginTop: 8,
                padding: '8px 20px',
                borderRadius: 8,
                border: 'none',
                background: '#002366',
                color: '#fff',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Retry
            </button>
          </div>
        </div>
      </EmployerLayout>
    );
  }

  const isKycApproved = profile.kycStatus === 'APPROVED' || profile.status === 'ACTIVE';

  const planCode = String(profile?.planSnapshot?.planCode || profile?.plan || '').toUpperCase();
  const isPaidPlan = Boolean(planCode && !planCode.includes('FREE'));
  const hasHotVacancy = (profile?.services || []).some(
    (s) => String(s.productCode).toUpperCase() === 'HOT_VACANCY' || String(s.productCode).toUpperCase().includes('HOT')
  );
  const hasLogoDisplayFeature = hasHotVacancy || isPaidPlan;

  return (
    <EmployerLayout activeTab="company-profile">
      <div className="cpp-container">
        {/* Breadcrumb */}
        <EmployerBreadcrumb items={[
          { label: 'Employer Dashboard', path: '/employer-dashboard' },
          { label: 'Company Profile' },
        ]} />

        {/* Success Banner */}
        {saveSuccess && (
          <div className="cpp-success-banner">
            <FiCheck size={18} color="#059669" />
            <span>{saveSuccess}</span>
          </div>
        )}

        {/* Header Title Card */}
        <div className="cpp-header-card">
          <div className="cpp-header-left">
            <div className="cpp-header-tag">
              <FiBriefcase size={14} />
              Company Profile
            </div>
            <h1 className="cpp-header-title">
              {profile.companyName || 'Company Profile'}
            </h1>
            <div className="cpp-header-meta">
              <span className={`cpp-kyc-badge ${isKycApproved ? 'approved' : 'pending'}`}>
                <FiCheckCircle size={12} /> {isKycApproved ? 'KYC Verified' : (profile.kycStatus || 'Pending Verification')}
              </span>
              <span className="cpp-meta-text">
                Client ID: {profile.clientId || '—'}
              </span>
              <span className="cpp-meta-text">
                • {profile.country || 'India'}
              </span>
            </div>
          </div>

          <div className="cpp-header-logo-section">
            <div style={{ position: 'relative' }}>
              <div className="cpp-logo-box">
                {profile.logoUrl ? (
                  <img
                    src={profile.logoUrl}
                    alt={profile.companyName || 'Company'}
                  />
                ) : (
                  <span className="cpp-logo-initials">
                    {(profile.companyName || 'CO').slice(0, 2).toUpperCase()}
                  </span>
                )}
              </div>
              <input
                type="file"
                ref={logoInputRef}
                onChange={handleLogoUpload}
                accept="image/png,image/jpeg,image/jpg,image/webp"
                style={{ display: 'none' }}
              />
              <button
                type="button"
                className="cpp-logo-cam-btn"
                disabled={uploadingLogo}
                onClick={() => logoInputRef.current?.click()}
                title="Upload or Change Logo"
                style={{ cursor: uploadingLogo ? 'wait' : 'pointer' }}
              >
                <FiCamera size={13} />
              </button>
            </div>
            <div className="cpp-logo-meta">
              <div style={{ fontSize: 13, fontWeight: 700, color: '#1e293b' }}>
                Company Logo
              </div>
              <button
                type="button"
                disabled={uploadingLogo}
                onClick={() => logoInputRef.current?.click()}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  fontSize: 12,
                  fontWeight: 600,
                  color: '#2563eb',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  marginTop: 2,
                }}
              >
                <FiUploadCloud size={13} />
                {uploadingLogo ? 'Uploading...' : profile.logoUrl ? 'Change Logo' : 'Upload Logo'}
              </button>
              <div style={{
                marginTop: 4,
                fontSize: 11,
                fontWeight: 600,
                color: hasLogoDisplayFeature ? '#059669' : '#d97706',
              }}>
                {hasLogoDisplayFeature
                  ? '✓ Active branding on Hot Vacancies'
                  : 'ⓘ Saved (Shown on Hot Vacancy)'}
              </div>
            </div>
          </div>
        </div>

        {/* 1. Account Details Card */}
        <div className="cpp-card">
          <div className="cpp-card-header">
            <div className="cpp-card-title-group">
              <FiUser size={20} color="#002366" />
              <h2 className="cpp-card-title">
                Account Details
              </h2>
            </div>
            <button
              onClick={handleOpenAccountModal}
              className="cpp-edit-btn"
            >
              <FiEdit2 size={13} />
              Edit
            </button>
          </div>

          <div className="cpp-profile-rows-list">
            <ProfileRow label="Username" value={profile.username} />
            <ProfileRow label="Email for Communication" value={profile.communicationEmail} />
            <ProfileRow label="Mobile Number" value={profile.mobileNumber} />
          </div>
        </div>

        {/* 2. Company Details Card */}
        <div className="cpp-card">
          <div className="cpp-card-header">
            <div className="cpp-card-title-group">
              <FiBriefcase size={20} color="#002366" />
              <h2 className="cpp-card-title">
                Company Details
              </h2>
            </div>
            <button
              onClick={handleOpenCompanyModal}
              className="cpp-edit-btn"
            >
              <FiEdit2 size={13} />
              Edit
            </button>
          </div>

          <div className="cpp-profile-rows-list">
            <ProfileRow label="Company Type" value={profile.companyType} />
            <ProfileRow label="Industry Type" value={profile.industryType} />
            <ProfileRow label="Contact Person" value={profile.contactPerson} />
            <ProfileRow label="Alias" value={profile.alias} />
            <ProfileRow label="Contact Person's Designation" value={profile.contactDesignation} />
            <ProfileRow
              label="Website URL"
              value={
                profile.websiteUrl ? (
                  <a
                    href={profile.websiteUrl.startsWith('http') ? profile.websiteUrl : `https://${profile.websiteUrl}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: '#2563eb', textDecoration: 'none', wordBreak: 'break-all' }}
                    onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
                    onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
                  >
                    {profile.websiteUrl}
                  </a>
                ) : '—'
              }
            />
            <ProfileRow label="Profile for Hot Vacancies" value={profile.profileHotVacancies || 'Standard'} />
            <ProfileRow label="Profile for Classifieds" value={profile.profileClassifieds || 'Standard'} />
            <ProfileRow
              label="Job Live Duration"
              value={
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontWeight: 800, color: '#059669', fontSize: 13.5 }}>
                      {profile.jobLiveDurationDays || 30} Days Live
                    </span>
                    <span style={{
                      fontSize: 10.5,
                      fontWeight: 700,
                      background: '#ecfdf5',
                      color: '#047857',
                      border: '1px solid #a7f3d0',
                      padding: '1px 6px',
                      borderRadius: 4,
                    }}>
                      Candidate Portal Visibility
                    </span>
                  </div>
                  <div style={{ fontSize: 11, color: '#64748b', lineHeight: 1.4 }}>
                    Hot Vacancy: {profile.jobLiveDurations?.hotVacancy || profile.jobLiveDurationDays || 30}d • SMB Job: {profile.jobLiveDurations?.smb || profile.jobLiveDurationDays || 30}d • Internship: {profile.jobLiveDurations?.internship || profile.jobLiveDurationDays || 30}d • Standard: {profile.jobLiveDurations?.standard || profile.jobLiveDurationDays || 30}d
                  </div>
                </div>
              }
            />
            <ProfileRow label="Phone Number 1" value={profile.phone1} />
            <ProfileRow label="Phone Number 2" value={profile.phone2} />
            {/* <ProfileRow label="TAN Number" value={profile.tanNumber} /> */}
          </div>
        </div>

        {/* 3. KYC Details Card */}
        <div className="cpp-card" style={{ marginBottom: 32 }}>
          <div className="cpp-card-header">
            <div className="cpp-card-title-group">
              <FiShield size={20} color="#002366" />
              <h2 className="cpp-card-title">
                KYC Details
              </h2>
            </div>
            <span className={`cpp-kyc-badge ${isKycApproved ? 'approved' : 'pending'}`}>
              <FiCheckCircle size={13} /> {profile.kycStatus || 'PENDING'}
            </span>
          </div>

          <div className="cpp-profile-rows-list">
            <ProfileRow
              label="KYC Status"
              value={
                <span className={`cpp-kyc-badge ${isKycApproved ? 'approved' : 'pending'}`}>
                  {profile.kycStatus || 'PENDING'}
                </span>
              }
            />
            <ProfileRow label="Name" value={profile.registeredName || profile.companyName} />
            <ProfileRow label="Address Label" value={profile.addressLabel || 'Primary Address'} />
            <ProfileRow label="Address" value={profile.address} />
            <ProfileRow label="Country" value={profile.country || 'India'} />
            <ProfileRow label="City" value={profile.city} />
            <ProfileRow label="State" value={profile.state} />
            <ProfileRow label="Pincode" value={profile.pincode} />
            <ProfileRow label="GSTIN" value={profile.gstin} />
          </div>
        </div>

        {/* 4. Plan Entitlements & Services Card */}
        <div className="cpp-card" style={{ marginBottom: 32 }}>
          <div className="cpp-card-header cpp-card-header-plan">
            <div className="cpp-card-title-group">
              <FiLayers size={20} color="#002366" />
              <div>
                <h2 className="cpp-card-title">
                  Current Plan & Service Entitlements
                </h2>
                <p style={{ margin: '2px 0 0', fontSize: 12.5, color: '#64748b' }}>
                  Features, quotas, and service capabilities linked to your company profile
                </p>
              </div>
            </div>
            <a
              href="/employer-dashboard/pricing"
              className="cpp-plan-header-action"
            >
              <span>Upgrade Plan & Add Services</span>
              <FiArrowRight size={14} />
            </a>
          </div>

          {/* Plan Meta Header */}
          <div className="cpp-plan-meta-grid" style={{
            background: isPaidPlan ? 'linear-gradient(135deg, #f0fdf4, #e0f2fe)' : '#f8fafc',
            border: isPaidPlan ? '1px solid #bbf7d0' : '1px solid #e2e8f0',
          }}>
            <div>
              <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#64748b' }}>
                Active Plan
              </span>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#002366', marginTop: 2 }}>
                {profile.planSnapshot?.planName || profile.plan || 'Free Starter Plan'}
              </div>
              <span style={{
                display: 'inline-block',
                marginTop: 4,
                padding: '2px 8px',
                borderRadius: 6,
                fontSize: 10.5,
                fontWeight: 800,
                background: isPaidPlan ? '#dcfce7' : '#e2e8f0',
                color: isPaidPlan ? '#15803d' : '#475569',
              }}>
                {isPaidPlan ? 'PAID COMMERCIAL PLAN' : 'FREE TIER'}
              </span>
            </div>

            <div>
              <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#64748b' }}>
                Plan Expiry
              </span>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#1e293b', marginTop: 4 }}>
                {profile.planSnapshot?.endDate
                  ? new Date(profile.planSnapshot.endDate).toLocaleDateString('en-IN', {
                      day: 'numeric', month: 'short', year: 'numeric'
                    })
                  : '30 Days Validity'}
              </div>
              <span style={{ fontSize: 11, color: '#64748b' }}>
                90-day read-only grace upon expiration
              </span>
            </div>

            <div>
              <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#64748b' }}>
                Branding & Logo Status
              </span>
              <div style={{ fontSize: 13, fontWeight: 700, color: hasLogoDisplayFeature ? '#059669' : '#d97706', marginTop: 4 }}>
                {hasLogoDisplayFeature ? '✓ Logo Shown on Hot Vacancies' : 'Company Initials on Search'}
              </div>
              <span style={{ fontSize: 11, color: '#64748b' }}>
                {hasLogoDisplayFeature ? 'Search & Job card branding active' : 'Upload logo ready for Hot Vacancies'}
              </span>
            </div>
          </div>

          {/* Services & Feature Breakdown Grid */}
          <div className="cpp-services-grid">
            {/* Job Posting Service */}
            <div className="cpp-service-box">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <span style={{ fontSize: 13, fontWeight: 800, color: '#0f172a' }}>Job Postings</span>
                <span style={{ fontSize: 11, fontWeight: 700, background: '#eff6ff', color: '#1d4ed8', padding: '2px 8px', borderRadius: 6 }}>
                  {profile.jobLimit || 1} Total Slots
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#059669', fontWeight: 600 }}>
                  <FiCheck size={13} />
                  <span>Standard Job Posting (1 City Limit)</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: hasHotVacancy ? '#059669' : '#94a3b8', fontWeight: 600 }}>
                  {hasHotVacancy ? <FiCheck size={13} /> : <FiLock size={13} />}
                  <span>Hot Vacancy (Logo Branding & 3 Cities)</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#059669', fontWeight: 600 }}>
                  <FiCheck size={13} />
                  <span>Live on Candidate Portal for {profile.jobLiveDurationDays || 30} Days</span>
                </div>
              </div>
            </div>

            {/* AI Credits Service */}
            <div className="cpp-service-box">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <span style={{ fontSize: 13, fontWeight: 800, color: '#0f172a' }}>AI Operations</span>
                <span style={{ fontSize: 11, fontWeight: 700, background: '#faf5ff', color: '#7e22ce', padding: '2px 8px', borderRadius: 6 }}>
                  {isPaidPlan ? '50+ uses / month' : '10 uses / month'}
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#059669', fontWeight: 600 }}>
                  <FiCheck size={13} />
                  <span>Improve JD, Requirements & Responsibilities (Free)</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: isPaidPlan ? '#059669' : '#94a3b8', fontWeight: 600 }}>
                  {isPaidPlan ? <FiCheck size={13} /> : <FiLock size={13} />}
                  <span>Write Full JD from Job Title (Paid Only)</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: isPaidPlan ? '#059669' : '#94a3b8', fontWeight: 600 }}>
                  {isPaidPlan ? <FiCheck size={13} /> : <FiLock size={13} />}
                  <span>Generate Screening Questions with AI (Paid Only)</span>
                </div>
              </div>
            </div>

            {/* Max CV Access Service */}
            <div className="cpp-service-box">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <span style={{ fontSize: 13, fontWeight: 800, color: '#0f172a' }}>Max CV Access</span>
                <span style={{ fontSize: 11, fontWeight: 700, background: '#f0fdf4', color: '#15803d', padding: '2px 8px', borderRadius: 6 }}>
                  Resume Database
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#059669', fontWeight: 600 }}>
                  <FiCheck size={13} />
                  <span>Search verified candidate profiles</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: isPaidPlan ? '#059669' : '#94a3b8', fontWeight: 600 }}>
                  {isPaidPlan ? <FiCheck size={13} /> : <FiLock size={13} />}
                  <span>Direct contact unlock & resume downloads</span>
                </div>
              </div>
            </div>

            {/* Candidate Outreach Service */}
            <div className="cpp-service-box">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <span style={{ fontSize: 13, fontWeight: 800, color: '#0f172a' }}>Max NVite Credits</span>
                <span style={{ fontSize: 11, fontWeight: 700, background: '#fff7ed', color: '#c2410c', padding: '2px 8px', borderRadius: 6 }}>
                  Candidate Invites
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: isPaidPlan ? '#059669' : '#94a3b8', fontWeight: 600 }}>
                  {isPaidPlan ? <FiCheck size={13} /> : <FiLock size={13} />}
                  <span>Direct job application invites to qualified candidates</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: isPaidPlan ? '#059669' : '#94a3b8', fontWeight: 600 }}>
                  {isPaidPlan ? <FiCheck size={13} /> : <FiLock size={13} />}
                  <span>Automated candidate invite engagement</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Account Details Modal */}
      {editAccountModal && (
        <div className="cpp-modal-overlay" onClick={() => !savingAccount && setEditAccountModal(false)}>
          <div className="cpp-modal-content" style={{ maxWidth: 480 }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#002366' }}>Edit Account Details</h3>
              <button
                disabled={savingAccount}
                onClick={() => setEditAccountModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
              >
                <FiX size={20} />
              </button>
            </div>

            {modalError && (
              <div style={{
                background: '#fff5f5', border: '1px solid #fed7d7', color: '#c53030',
                padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 16
              }}>
                {modalError}
              </div>
            )}

            <form onSubmit={handleSaveAccount}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                  Email for Communication
                </label>
                <input
                  type="email"
                  value={accountForm.communicationEmail}
                  onChange={(e) => setAccountForm({ ...accountForm, communicationEmail: e.target.value })}
                  required
                  style={{
                    width: '100%', padding: '10px 14px', borderRadius: 10,
                    border: '1.5px solid #cbd5e1', fontSize: 14, outline: 'none',
                    boxSizing: 'border-box', fontFamily: 'inherit'
                  }}
                />
              </div>

              <div style={{ marginBottom: 24 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                  Mobile Number
                </label>
                <input
                  type="text"
                  value={accountForm.mobileNumber}
                  onChange={(e) => setAccountForm({ ...accountForm, mobileNumber: e.target.value })}
                  required
                  style={{
                    width: '100%', padding: '10px 14px', borderRadius: 10,
                    border: '1.5px solid #cbd5e1', fontSize: 14, outline: 'none',
                    boxSizing: 'border-box', fontFamily: 'inherit'
                  }}
                />
              </div>

              <div className="cpp-modal-actions">
                <button
                  type="button"
                  disabled={savingAccount}
                  onClick={() => setEditAccountModal(false)}
                  style={{
                    padding: '10px 20px', borderRadius: 10, border: '1px solid #cbd5e1',
                    background: '#fff', color: '#475569', fontWeight: 700, cursor: 'pointer', fontSize: 14
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingAccount}
                  style={{
                    padding: '10px 22px', borderRadius: 10, border: 'none',
                    background: '#002366', color: '#fff', fontWeight: 700, cursor: savingAccount ? 'not-allowed' : 'pointer', fontSize: 14,
                    opacity: savingAccount ? 0.7 : 1
                  }}
                >
                  {savingAccount ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Company Details Modal */}
      {editCompanyModal && (
        <div className="cpp-modal-overlay" onClick={() => !savingCompany && setEditCompanyModal(false)}>
          <div className="cpp-modal-content" style={{ maxWidth: 540, maxHeight: '90vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#002366' }}>Edit Company Details</h3>
              <button
                disabled={savingCompany}
                onClick={() => setEditCompanyModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
              >
                <FiX size={20} />
              </button>
            </div>

            {modalError && (
              <div style={{
                background: '#fff5f5', border: '1px solid #fed7d7', color: '#c53030',
                padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 16
              }}>
                {modalError}
              </div>
            )}

            <form onSubmit={handleSaveCompany}>
              <div className="cpp-modal-grid-2">
                <div>
                  <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: '#334155', marginBottom: 5 }}>Company Type</label>
                  <input
                    type="text"
                    value={companyForm.companyType}
                    onChange={(e) => setCompanyForm({ ...companyForm, companyType: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid #cbd5e1', fontSize: 13.5, boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: '#334155', marginBottom: 5 }}>Industry Type</label>
                  <input
                    type="text"
                    value={companyForm.industryType}
                    onChange={(e) => setCompanyForm({ ...companyForm, industryType: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid #cbd5e1', fontSize: 13.5, boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div className="cpp-modal-grid-2">
                <div>
                  <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: '#334155', marginBottom: 5 }}>Contact Person</label>
                  <input
                    type="text"
                    value={companyForm.contactPerson}
                    onChange={(e) => setCompanyForm({ ...companyForm, contactPerson: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid #cbd5e1', fontSize: 13.5, boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: '#334155', marginBottom: 5 }}>Contact Person's Designation</label>
                  <input
                    type="text"
                    value={companyForm.contactDesignation}
                    onChange={(e) => setCompanyForm({ ...companyForm, contactDesignation: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid #cbd5e1', fontSize: 13.5, boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: '#334155', marginBottom: 5 }}>Alias</label>
                <input
                  type="text"
                  value={companyForm.alias}
                  onChange={(e) => setCompanyForm({ ...companyForm, alias: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid #cbd5e1', fontSize: 13.5, boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: '#334155', marginBottom: 5 }}>Website URL</label>
                <input
                  type="text"
                  value={companyForm.websiteUrl}
                  onChange={(e) => setCompanyForm({ ...companyForm, websiteUrl: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid #cbd5e1', fontSize: 13.5, boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: '#334155', marginBottom: 5 }}>
                  Job Live Duration (Days)
                </label>
                <input
                  type="number"
                  min="1"
                  max="365"
                  value={companyForm.jobLiveDurationDays}
                  onChange={(e) => setCompanyForm({ ...companyForm, jobLiveDurationDays: Number(e.target.value) || '' })}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid #cbd5e1', fontSize: 13.5, boxSizing: 'border-box' }}
                />
                <span style={{ display: 'block', fontSize: 11, color: '#64748b', marginTop: 3 }}>
                  Number of days all newly posted company jobs remain live on the candidate portal (default 30 days)
                </span>
              </div>

              <div className="cpp-modal-grid-2">
                <div>
                  <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: '#334155', marginBottom: 5 }}>Phone Number 1</label>
                  <input
                    type="text"
                    value={companyForm.phone1}
                    onChange={(e) => setCompanyForm({ ...companyForm, phone1: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid #cbd5e1', fontSize: 13.5, boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: '#334155', marginBottom: 5 }}>Phone Number 2</label>
                  <input
                    type="text"
                    value={companyForm.phone2}
                    onChange={(e) => setCompanyForm({ ...companyForm, phone2: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid #cbd5e1', fontSize: 13.5, boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div className="cpp-modal-actions">
                <button
                  type="button"
                  disabled={savingCompany}
                  onClick={() => setEditCompanyModal(false)}
                  style={{
                    padding: '10px 20px', borderRadius: 10, border: '1px solid #cbd5e1',
                    background: '#fff', color: '#475569', fontWeight: 700, cursor: 'pointer', fontSize: 14
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingCompany}
                  style={{
                    padding: '10px 22px', borderRadius: 10, border: 'none',
                    background: '#002366', color: '#fff', fontWeight: 700, cursor: savingCompany ? 'not-allowed' : 'pointer', fontSize: 14,
                    opacity: savingCompany ? 0.7 : 1
                  }}
                >
                  {savingCompany ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </EmployerLayout>
  );
}

function ProfileRow({ label, value }) {
  const displayVal = value !== null && value !== undefined && value !== '' ? value : '—';
  return (
    <div className="cpp-profile-row">
      <div className="cpp-profile-label">
        {label}:
      </div>
      <div className="cpp-profile-value">
        {displayVal}
      </div>
    </div>
  );
}
