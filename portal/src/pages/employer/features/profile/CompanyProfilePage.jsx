import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  FiEdit2, FiCheckCircle, FiShield, FiBriefcase, FiUser,
  FiMapPin, FiGlobe, FiPhone, FiMail, FiX, FiCheck
} from 'react-icons/fi';
import EmployerLayout from '../../../../components/employer/EmployerLayout';
import EmployerBreadcrumb from '../../../../components/employer/EmployerBreadcrumb';
import { useEmployerAuth } from '../../../../hooks/useEmployerAuth';
import authService from '../../../../services/authService';

// Company Profile Page component
const STORAGE_KEY = 'employer_company_profile_data';

export default function CompanyProfilePage() {
  const { session } = useEmployerAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Edit Modals
  const [editAccountModal, setEditAccountModal] = useState(false);
  const [editCompanyModal, setEditCompanyModal] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState('');

  // Initial state with defaults matching the screenshots + dynamic session fallbacks
  const [profile, setProfile] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}

    const empUser = (() => {
      try {
        return JSON.parse(localStorage.getItem('employerUser') || '{}');
      } catch {
        return {};
      }
    })();

    return {
      // Header
      companyName: empUser.companyName || empUser.name || 'SAVVI SALES SERVICES PRIVATE LIMITED',
      logoUrl: empUser.logoUrl || '',

      // Account Details
      username: empUser.email || empUser.username || 'admin@mavenjobs.in',
      communicationEmail: empUser.email || 'admin@mavenjobs.in',
      mobileNumber: empUser.phone || '+91-9996725557',

      // Company Details
      companyType: 'Placement consultant/Search Firm',
      industryType: 'Employment Firms/Recruitment Services Firms',
      contactPerson: empUser.name || 'Diwakar',
      alias: '',
      contactDesignation: 'Talent Acquisition Lead',
      websiteUrl: 'https://mavenjobs.in',
      profileHotVacancies: 'Standard',
      profileClassifieds: 'Standard',
      phone1: '9350114002',
      phone2: '',
      tanNumber: 'RTKS23867E',

      // KYC Details
      kycStatus: 'APPROVED',
      registeredName: empUser.companyName || 'SAVVI SALES & SERVICES PRIVATE LIMITED',
      addressLabel: 'Primary Address',
      address: '331, Gandhi Colony, Samalkha, Panipat, Haryana, 132101',
      country: 'India',
      city: 'PANIPAT',
      state: 'Haryana',
      pincode: '132101',
      gstin: 'Unregistered',
    };
  });

  // Edit form buffers
  const [accountForm, setAccountForm] = useState({
    username: profile.username,
    communicationEmail: profile.communicationEmail,
    mobileNumber: profile.mobileNumber,
  });

  const [companyForm, setCompanyForm] = useState({
    companyType: profile.companyType,
    industryType: profile.industryType,
    contactPerson: profile.contactPerson,
    alias: profile.alias,
    contactDesignation: profile.contactDesignation,
    websiteUrl: profile.websiteUrl,
    phone1: profile.phone1,
    phone2: profile.phone2,
    tanNumber: profile.tanNumber,
  });

  // Fetch live dashboard data to populate if present
  useEffect(() => {
    let active = true;
    authService.getEmployerDashboard()
      .then((res) => {
        if (!active || !res?.data) return;
        setDashboardData(res.data);
        const comp = res.data.company;
        const usr = res.data.user;

        setProfile((prev) => {
          const updated = {
            ...prev,
            companyName: comp?.name || prev.companyName,
            logoUrl: comp?.logoUrl || prev.logoUrl,
            username: usr?.email || usr?.username || prev.username,
            communicationEmail: comp?.email || usr?.email || prev.communicationEmail,
            mobileNumber: usr?.phone || comp?.phone || prev.mobileNumber,
            industryType: comp?.industry || prev.industryType,
            companyType: comp?.type || prev.companyType,
            websiteUrl: comp?.website || prev.websiteUrl,
            contactPerson: usr?.name || prev.contactPerson,
            phone1: comp?.phone || prev.phone1,
            phone2: comp?.altPhone || prev.phone2,
            registeredName: comp?.name || prev.registeredName,
          };
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
          } catch {}
          return updated;
        });
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, []);

  const handleSaveAccount = (e) => {
    e.preventDefault();
    const updated = {
      ...profile,
      communicationEmail: accountForm.communicationEmail,
      mobileNumber: accountForm.mobileNumber,
    };
    setProfile(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {}
    setEditAccountModal(false);
    showToast('Account details updated successfully');
  };

  const handleSaveCompany = (e) => {
    e.preventDefault();
    const updated = {
      ...profile,
      companyType: companyForm.companyType,
      industryType: companyForm.industryType,
      contactPerson: companyForm.contactPerson,
      alias: companyForm.alias,
      contactDesignation: companyForm.contactDesignation,
      websiteUrl: companyForm.websiteUrl,
      phone1: companyForm.phone1,
      phone2: companyForm.phone2,
      tanNumber: companyForm.tanNumber,
    };
    setProfile(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {}
    setEditCompanyModal(false);
    showToast('Company details updated successfully');
  };

  const showToast = (msg) => {
    setSaveSuccess(msg);
    setTimeout(() => setSaveSuccess(''), 3500);
  };

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
              {profile.companyName}
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
                background: '#dcfce7',
                color: '#15803d',
                padding: '4px 10px',
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 700,
              }}>
                <FiCheckCircle size={12} /> KYC Verified
              </span>
              <span style={{ fontSize: 13, color: '#64748b', fontWeight: 500 }}>
                Client ID: MV-88294
              </span>
              <span style={{ fontSize: 13, color: '#64748b', fontWeight: 500 }}>
                • India
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
                alt={profile.companyName}
                style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: 14 }}
              />
            ) : (
              <span style={{
                fontSize: 24,
                fontWeight: 800,
                color: '#002366',
                fontFamily: "'Bricolage Grotesque', sans-serif",
              }}>
                {profile.companyName.slice(0, 2).toUpperCase()}
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
              onClick={() => {
                setAccountForm({
                  username: profile.username,
                  communicationEmail: profile.communicationEmail,
                  mobileNumber: profile.mobileNumber,
                });
                setEditAccountModal(true);
              }}
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
              onClick={() => {
                setCompanyForm({
                  companyType: profile.companyType,
                  industryType: profile.industryType,
                  contactPerson: profile.contactPerson,
                  alias: profile.alias,
                  contactDesignation: profile.contactDesignation,
                  websiteUrl: profile.websiteUrl,
                  phone1: profile.phone1,
                  phone2: profile.phone2,
                  tanNumber: profile.tanNumber,
                });
                setEditCompanyModal(true);
              }}
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
            <ProfileRow label="Alias" value={profile.alias || '—'} />
            <ProfileRow label="Contact Person's Designation" value={profile.contactDesignation || '—'} />
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
            <ProfileRow label="Phone Number 2" value={profile.phone2 || '—'} />
            <ProfileRow label="TAN Number" value={profile.tanNumber || '—'} />
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
              background: '#dcfce7',
              color: '#15803d',
              padding: '4px 12px',
              borderRadius: 6,
              fontSize: 12.5,
              fontWeight: 800,
              letterSpacing: '0.04em',
            }}>
              <FiCheckCircle size={13} /> {profile.kycStatus}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <ProfileRow
              label="KYC Status"
              value={
                <span style={{
                  display: 'inline-block',
                  background: '#dcfce7',
                  color: '#15803d',
                  padding: '3px 10px',
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: 800,
                  letterSpacing: '0.04em',
                }}>
                  {profile.kycStatus}
                </span>
              }
            />
            <ProfileRow label="Name" value={profile.registeredName} />
            <ProfileRow label="Address Label" value={profile.addressLabel} />
            <ProfileRow label="Address" value={profile.address} />
            <ProfileRow label="Country" value={profile.country} />
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
        }} onClick={() => setEditAccountModal(false)}>
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
              <button onClick={() => setEditAccountModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                <FiX size={20} />
              </button>
            </div>

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
                  style={{
                    padding: '10px 22px', borderRadius: 10, border: 'none',
                    background: '#002366', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: 14
                  }}
                >
                  Save Changes
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
        }} onClick={() => setEditCompanyModal(false)}>
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
              <button onClick={() => setEditCompanyModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                <FiX size={20} />
              </button>
            </div>

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

              <div style={{ marginBottom: 22 }}>
                <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: '#334155', marginBottom: 5 }}>TAN Number</label>
                <input
                  type="text"
                  value={companyForm.tanNumber}
                  onChange={(e) => setCompanyForm({ ...companyForm, tanNumber: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid #cbd5e1', fontSize: 13.5, boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                <button
                  type="button"
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
                  style={{
                    padding: '10px 22px', borderRadius: 10, border: 'none',
                    background: '#002366', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: 14
                  }}
                >
                  Save Changes
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
        {value}
      </div>
    </div>
  );
}
