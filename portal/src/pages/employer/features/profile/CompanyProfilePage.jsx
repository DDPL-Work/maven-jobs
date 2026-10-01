import React, { useState, useEffect } from 'react';
import {
  FiEdit2, FiCheckCircle, FiShield, FiBriefcase, FiUser,
  FiMapPin, FiGlobe, FiPhone, FiMail, FiX, FiCheck, FiAlertCircle
} from 'react-icons/fi';
import EmployerLayout from '../../../../components/employer/EmployerLayout';
import EmployerBreadcrumb from '../../../../components/employer/EmployerBreadcrumb';
import { useEmployerAuth } from '../../../../hooks/useEmployerAuth';
import authService from '../../../../services/authService';

export default function CompanyProfilePage() {
  const { session } = useEmployerAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
        <div style={{ maxWidth: 1080, margin: '0 auto', padding: '40px 20px', textAlign: 'center' }}>
          <EmployerBreadcrumb items={[
            { label: 'Employer Dashboard', path: '/employer-dashboard' },
            { label: 'Company Profile' },
          ]} />
          <div style={{
            background: '#ffffff',
            borderRadius: 16,
            border: '1px solid #e2e8f0',
            padding: '70px 32px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 16,
            color: '#64748b',
          }}>
            <div style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              border: '3px solid #e2e8f0',
              borderTopColor: '#002366',
              animation: 'spinProfile 0.8s linear infinite',
            }} />
            <span style={{ fontSize: 14.5, fontWeight: 600 }}>Fetching company details from database...</span>
          </div>
          <style>{`
            @keyframes spinProfile {
              to { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      </EmployerLayout>
    );
  }

  if (error || !profile) {
    return (
      <EmployerLayout activeTab="company-profile">
        <div style={{ maxWidth: 1080, margin: '0 auto', padding: '40px 20px' }}>
          <EmployerBreadcrumb items={[
            { label: 'Employer Dashboard', path: '/employer-dashboard' },
            { label: 'Company Profile' },
          ]} />
          <div style={{
            background: '#fff5f5',
            borderRadius: 16,
            border: '1px solid #fed7d7',
            padding: '40px 32px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 14,
            color: '#c53030',
            textAlign: 'center',
          }}>
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

  return (
    <EmployerLayout activeTab="company-profile">
      <div style={{ maxWidth: 1080, margin: '0 auto' }}>
        {/* Breadcrumb */}
        <EmployerBreadcrumb items={[
          { label: 'Employer Dashboard', path: '/employer-dashboard' },
          { label: 'Company Profile' },
        ]} />

        {/* Success Banner */}
        {saveSuccess && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            background: '#ecfdf5',
            border: '1px solid #a7f3d0',
            color: '#065f46',
            padding: '12px 18px',
            borderRadius: 12,
            marginBottom: 20,
            fontSize: 14,
            fontWeight: 600,
            animation: 'fadeIn 0.2s ease',
          }}>
            <FiCheck size={18} color="#059669" />
            <span>{saveSuccess}</span>
          </div>
        )}

        {/* Header Title Card */}
        <div style={{
          background: '#ffffff',
          borderRadius: 16,
          border: '1px solid #e2e8f0',
          padding: '28px 32px',
          boxShadow: '0 2px 10px rgba(15,23,42,0.03)',
          marginBottom: 24,
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 20,
        }}>
          <div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontSize: 12.5,
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: '#2563eb',
              marginBottom: 8,
            }}>
              <FiBriefcase size={14} />
              Company Profile
            </div>
            <h1 style={{
              margin: 0,
              fontSize: 26,
              fontWeight: 800,
              color: '#002366',
              fontFamily: "'Bricolage Grotesque', 'DM Sans', sans-serif",
              letterSpacing: '-0.02em',
              lineHeight: 1.25,
            }}>
              {profile.companyName || 'Company Profile'}
            </h1>
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              gap: 12,
              marginTop: 10,
            }}>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                background: isKycApproved ? '#dcfce7' : '#fef3c7',
                color: isKycApproved ? '#15803d' : '#b45309',
                padding: '4px 10px',
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 700,
              }}>
                <FiCheckCircle size={12} /> {isKycApproved ? 'KYC Verified' : (profile.kycStatus || 'Pending Verification')}
              </span>
              <span style={{ fontSize: 13, color: '#64748b', fontWeight: 500 }}>
                Client ID: {profile.clientId || '—'}
              </span>
              <span style={{ fontSize: 13, color: '#64748b', fontWeight: 500 }}>
                • {profile.country || 'India'}
              </span>
            </div>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 70,
            height: 70,
            borderRadius: 16,
            background: 'linear-gradient(135deg, #eef2ff, #e0e7ff)',
            border: '1.5px solid #c7d2fe',
            boxShadow: '0 4px 12px rgba(99,102,241,0.08)',
          }}>
            {profile.logoUrl ? (
              <img
                src={profile.logoUrl}
                alt={profile.companyName || 'Company'}
                style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: 14 }}
              />
            ) : (
              <span style={{
                fontSize: 24,
                fontWeight: 800,
                color: '#002366',
                fontFamily: "'Bricolage Grotesque', sans-serif",
              }}>
                {(profile.companyName || 'CO').slice(0, 2).toUpperCase()}
              </span>
            )}
          </div>
        </div>

        {/* 1. Account Details Card */}
        <div style={{
          background: '#ffffff',
          borderRadius: 16,
          border: '1px solid #e2e8f0',
          padding: '28px 32px',
          boxShadow: '0 2px 10px rgba(15,23,42,0.03)',
          marginBottom: 24,
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 20,
            paddingBottom: 14,
            borderBottom: '1px solid #f1f5f9',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <FiUser size={20} color="#002366" />
              <h2 style={{
                margin: 0,
                fontSize: 18,
                fontWeight: 800,
                color: '#0f172a',
                letterSpacing: '-0.01em',
              }}>
                Account Details
              </h2>
            </div>
            <button
              onClick={handleOpenAccountModal}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 14px',
                borderRadius: 8,
                border: '1px solid #bfdbfe',
                background: '#eff6ff',
                color: '#2563eb',
                fontSize: 13.5,
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#dbeafe'}
              onMouseLeave={(e) => e.currentTarget.style.background = '#eff6ff'}
            >
              <FiEdit2 size={13} />
              Edit
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <ProfileRow label="Username" value={profile.username} />
            <ProfileRow label="Email for Communication" value={profile.communicationEmail} />
            <ProfileRow label="Mobile Number" value={profile.mobileNumber} />
          </div>
        </div>

        {/* 2. Company Details Card */}
        <div style={{
          background: '#ffffff',
          borderRadius: 16,
          border: '1px solid #e2e8f0',
          padding: '28px 32px',
          boxShadow: '0 2px 10px rgba(15,23,42,0.03)',
          marginBottom: 24,
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 20,
            paddingBottom: 14,
            borderBottom: '1px solid #f1f5f9',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <FiBriefcase size={20} color="#002366" />
              <h2 style={{
                margin: 0,
                fontSize: 18,
                fontWeight: 800,
                color: '#0f172a',
                letterSpacing: '-0.01em',
              }}>
                Company Details
              </h2>
            </div>
            <button
              onClick={handleOpenCompanyModal}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 14px',
                borderRadius: 8,
                border: '1px solid #bfdbfe',
                background: '#eff6ff',
                color: '#2563eb',
                fontSize: 13.5,
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#dbeafe'}
              onMouseLeave={(e) => e.currentTarget.style.background = '#eff6ff'}
            >
              <FiEdit2 size={13} />
              Edit
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
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
                    style={{ color: '#2563eb', textDecoration: 'none' }}
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
            <ProfileRow label="Phone Number 1" value={profile.phone1} />
            <ProfileRow label="Phone Number 2" value={profile.phone2} />
            {/* <ProfileRow label="TAN Number" value={profile.tanNumber} /> */}
          </div>
        </div>

        {/* 3. KYC Details Card */}
        <div style={{
          background: '#ffffff',
          borderRadius: 16,
          border: '1px solid #e2e8f0',
          padding: '28px 32px',
          boxShadow: '0 2px 10px rgba(15,23,42,0.03)',
          marginBottom: 32,
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 20,
            paddingBottom: 14,
            borderBottom: '1px solid #f1f5f9',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <FiShield size={20} color="#002366" />
              <h2 style={{
                margin: 0,
                fontSize: 18,
                fontWeight: 800,
                color: '#0f172a',
                letterSpacing: '-0.01em',
              }}>
                KYC Details
              </h2>
            </div>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              background: isKycApproved ? '#dcfce7' : '#fef3c7',
              color: isKycApproved ? '#15803d' : '#b45309',
              padding: '4px 12px',
              borderRadius: 6,
              fontSize: 12.5,
              fontWeight: 800,
              letterSpacing: '0.04em',
            }}>
              <FiCheckCircle size={13} /> {profile.kycStatus || 'PENDING'}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <ProfileRow
              label="KYC Status"
              value={
                <span style={{
                  display: 'inline-block',
                  background: isKycApproved ? '#dcfce7' : '#fef3c7',
                  color: isKycApproved ? '#15803d' : '#b45309',
                  padding: '3px 10px',
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: 800,
                  letterSpacing: '0.04em',
                }}>
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
      </div>

      {/* Edit Account Details Modal */}
      {editAccountModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 99999,
          background: 'rgba(15,23,42,0.5)',
          backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 20,
        }} onClick={() => !savingAccount && setEditAccountModal(false)}>
          <div onClick={(e) => e.stopPropagation()} style={{
            background: '#ffffff',
            borderRadius: 20,
            maxWidth: 480,
            width: '100%',
            padding: '28px 28px 24px',
            boxShadow: '0 24px 60px rgba(0,0,0,0.2)',
          }}>
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

              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
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
        <div style={{
          position: 'fixed', inset: 0, zIndex: 99999,
          background: 'rgba(15,23,42,0.5)',
          backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 20,
        }} onClick={() => !savingCompany && setEditCompanyModal(false)}>
          <div onClick={(e) => e.stopPropagation()} style={{
            background: '#ffffff',
            borderRadius: 20,
            maxWidth: 540,
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '28px 28px 24px',
            boxShadow: '0 24px 60px rgba(0,0,0,0.2)',
          }}>
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
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
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

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
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

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
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

              {/* <div style={{ marginBottom: 22 }}>
                <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: '#334155', marginBottom: 5 }}>TAN Number</label>
                <input
                  type="text"
                  value={companyForm.tanNumber}
                  onChange={(e) => setCompanyForm({ ...companyForm, tanNumber: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid #cbd5e1', fontSize: 13.5, boxSizing: 'border-box' }}
                />
              </div> */}

              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
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
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'minmax(200px, 260px) 1fr',
      gap: 16,
      alignItems: 'baseline',
      padding: '4px 0',
    }}>
      <div style={{
        fontSize: 14,
        fontWeight: 500,
        color: '#64748b',
        textAlign: 'right',
        userSelect: 'none',
      }}>
        {label}:
      </div>
      <div style={{
        fontSize: 14.5,
        fontWeight: 600,
        color: '#0f172a',
        wordBreak: 'break-word',
      }}>
        {displayVal}
      </div>
    </div>
  );
}
