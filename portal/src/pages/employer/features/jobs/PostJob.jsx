import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import authService from '../../../../services/authService';
import { gsap } from 'gsap';
import {
    FiBriefcase, FiFileText, FiUsers, FiCheckCircle,
    FiArrowLeft, FiArrowRight, FiPlus, FiTrash2,
    FiInfo, FiToggleLeft, FiToggleRight, FiX,
    FiDollarSign, FiMapPin, FiClock, FiZap,
    FiChevronDown, FiAlertCircle, FiStar, FiUpload,
    FiExternalLink
} from 'react-icons/fi';
import mavenLogo from '../../../../../assets/maven-logo-BdiSsfJk.svg';
import LocationAutocomplete from '../../../../components/LocationAutocomplete';
import { autoSaveDraft, getDraft } from '../../../../services/draftJobService';

/* ─────────────────────── CONSTANTS ─────────────────────── */
const STEPS = [
    { id: 1, key: 'job', label: 'Job Details', icon: <FiBriefcase size={18} /> },
    { id: 2, key: 'candidate', label: 'Candidate Preferences', icon: <FiUsers size={18} /> },
    { id: 3, key: 'screening', label: 'Screening Questions', icon: <FiFileText size={18} /> },
    { id: 4, key: 'review', label: 'Review & Launch', icon: <FiCheckCircle size={18} /> },
];

const JOB_TYPES = ['Full-time', 'Part-time', 'Remote', 'Hybrid', 'Contract', 'Internship'];
const INDUSTRIES = ['Technology', 'Finance', 'Healthcare', 'E-commerce', 'EdTech', 'Manufacturing', 'Media'];
const EXPERIENCE = ['Fresher', '[Manually]', '1', '2', '3', '4', '5+'];
const PERKS_LIST = ['Health Insurance', 'Office Cab/Shuttle', 'Food Allowance', 'Annual Bonus', 'Provident Fund', 'Flexible Hours', 'Work From Home', 'Stock Options', 'Learning Budget', 'Gym Membership'];
const EDUCATION = ['Any', '10th Pass', '12th Pass', 'Diploma', 'Bachelor\'s', 'Master\'s', 'MBA', 'PhD'];
const Q_TYPES = ['Yes/No', 'Single Choice', 'Text Answer', 'Number'];

/* ─────────────────────── STYLED INPUT ─────────────────────── */
const Input = ({ label, required, hint, error, ...props }) => {
    const [focused, setFocused] = useState(false);
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {label && (
                <label style={{ fontSize: 13, fontWeight: 700, color: '#1E293B', display: 'flex', alignItems: 'center', gap: 5 }}>
                    {label}
                    {required && <span style={{ color: '#EF4444', fontSize: 14 }}>*</span>}
                    {hint && (
                        <span style={{ fontSize: 11.5, fontWeight: 500, color: '#94A3B8', marginLeft: 4 }}>({hint})</span>
                    )}
                </label>
            )}
            <input
                {...props}
                onFocus={e => { setFocused(true); props.onFocus?.(e); }}
                onBlur={e => { setFocused(false); props.onBlur?.(e); }}
                style={{
                    padding: '11px 14px', fontSize: 14, fontWeight: 500,
                    color: '#0F172A', background: '#fff',
                    border: `1.5px solid ${error ? '#EF4444' : focused ? '#002366' : '#E2E8F0'}`,
                    borderRadius: 12, outline: 'none', fontFamily: 'inherit',
                    transition: 'border-color 0.18s, box-shadow 0.18s',
                    boxShadow: focused ? '0 0 0 3px rgba(0,35,102,0.08)' : 'none',
                    width: '100%', boxSizing: 'border-box',
                    ...props.style
                }}
            />
            {error && <span style={{ fontSize: 12, color: '#EF4444', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}><FiAlertCircle size={12} />{error}</span>}
        </div>
    );
};

const Textarea = ({ label, required, hint, rows = 5, ...props }) => {
    const [focused, setFocused] = useState(false);
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {label && (
                <label style={{ fontSize: 13, fontWeight: 700, color: '#1E293B', display: 'flex', alignItems: 'center', gap: 5 }}>
                    {label}
                    {required && <span style={{ color: '#EF4444', fontSize: 14 }}>*</span>}
                    {hint && <span style={{ fontSize: 11.5, fontWeight: 500, color: '#94A3B8', marginLeft: 4 }}>({hint})</span>}
                </label>
            )}
            <textarea
                {...props}
                rows={rows}
                onFocus={e => { setFocused(true); props.onFocus?.(e); }}
                onBlur={e => { setFocused(false); props.onBlur?.(e); }}
                style={{
                    padding: '12px 14px', fontSize: 14, fontWeight: 500,
                    color: '#0F172A', background: '#fff',
                    border: `1.5px solid ${focused ? '#002366' : '#E2E8F0'}`,
                    borderRadius: 12, outline: 'none', fontFamily: 'inherit',
                    transition: 'border-color 0.18s, box-shadow 0.18s',
                    boxShadow: focused ? '0 0 0 3px rgba(0,35,102,0.08)' : 'none',
                    resize: 'vertical', width: '100%', boxSizing: 'border-box',
                    ...props.style
                }}
            />
        </div>
    );
};

const Select = ({ label, required, hint, options, value, onChange, placeholder }) => {
    const [focused, setFocused] = useState(false);
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {label && (
                <label style={{ fontSize: 13, fontWeight: 700, color: '#1E293B', display: 'flex', alignItems: 'center', gap: 5 }}>
                    {label}
                    {required && <span style={{ color: '#EF4444', fontSize: 14 }}>*</span>}
                    {hint && <span style={{ fontSize: 11.5, fontWeight: 500, color: '#94A3B8', marginLeft: 4 }}>({hint})</span>}
                </label>
            )}
            <div style={{ position: 'relative' }}>
                <select
                    value={value}
                    onChange={onChange}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
                    style={{
                        padding: '11px 36px 11px 14px', fontSize: 14, fontWeight: 500,
                        color: value ? '#0F172A' : '#94A3B8', background: '#fff',
                        border: `1.5px solid ${focused ? '#002366' : '#E2E8F0'}`,
                        borderRadius: 12, outline: 'none', fontFamily: 'inherit',
                        appearance: 'none', cursor: 'pointer',
                        transition: 'border-color 0.18s, box-shadow 0.18s',
                        boxShadow: focused ? '0 0 0 3px rgba(0,35,102,0.08)' : 'none',
                        width: '100%', boxSizing: 'border-box'
                    }}
                >
                    {placeholder && <option value="">{placeholder}</option>}
                    {options.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
                <FiChevronDown size={15} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: '#64748B', pointerEvents: 'none' }} />
            </div>
        </div>
    );
};

/* ─────────────────────── SECTION CARD ─────────────────────── */
const SectionCard = ({ icon, title, subtitle, children, accentColor = '#002366', toggle, toggleValue, onToggle, required }) => (
    <div style={{
        background: '#fff', borderRadius: 20, border: '1px solid #E8EDF5',
        overflow: 'hidden', boxShadow: '0 2px 16px rgba(0,35,102,0.05)'
    }}>
        {/* Card header */}
        <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '20px 28px', borderBottom: '1px solid #F1F5F9',
            background: `linear-gradient(135deg, ${accentColor}06 0%, transparent 100%)`
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{
                    width: 44, height: 44, borderRadius: 13,
                    background: `linear-gradient(135deg, ${accentColor}18, ${accentColor}08)`,
                    border: `1.5px solid ${accentColor}22`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: accentColor, flexShrink: 0
                }}>
                    {icon}
                </div>
                <div>
                    <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.01em', display: 'flex', alignItems: 'center', gap: 4 }}>{title}{required && <span style={{ color: '#EF4444', fontSize: 16 }}>*</span>}</h3>
                    {subtitle && <p style={{ margin: '3px 0 0', fontSize: 13, color: '#64748B', fontWeight: 500 }}>{subtitle}</p>}
                </div>
            </div>
            {toggle && (
                <button onClick={onToggle} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                    <div style={{
                        width: 48, height: 26, borderRadius: 100,
                        background: toggleValue ? '#84CC16' : '#CBD5E1',
                        position: 'relative', transition: 'background 0.2s'
                    }}>
                        <div style={{
                            width: 20, height: 20, borderRadius: '50%', background: '#fff',
                            position: 'absolute', top: 3,
                            left: toggleValue ? 25 : 3,
                            transition: 'left 0.2s',
                            boxShadow: '0 1px 4px rgba(0,0,0,0.15)'
                        }} />
                    </div>
                </button>
            )}
        </div>
        <div style={{ padding: '28px' }}>
            {children}
        </div>
    </div>
);

/* ─────────────────────── INFO BOX ─────────────────────── */
const InfoBox = ({ children }) => (
    <div style={{
        display: 'flex', gap: 12, padding: '14px 18px',
        background: 'linear-gradient(135deg, #EEF2FF, #F0FDF4)',
        border: '1px solid #C7D7FF', borderRadius: 12, marginBottom: 28
    }}>
        <FiInfo size={16} color="#002366" style={{ flexShrink: 0, marginTop: 1 }} />
        <div style={{ fontSize: 13, color: '#334155', fontWeight: 500, lineHeight: 1.65 }}>{children}</div>
    </div>
);

/* ─────────────────────── STEP 1: JOB DETAILS ─────────────────────── */
function StepJobDetails({ data, setData, onAiEnhance, aiLoading, onUploadJd }) {
    const [selectedTypes, setSelectedTypes] = useState(data.jobTypes || []);
    const [selectedPerks, setSelectedPerks] = useState(data.perks || []);

    const toggleType = (t) => {
        const next = selectedTypes.includes(t) ? selectedTypes.filter(x => x !== t) : [...selectedTypes, t];
        setSelectedTypes(next);
        setData(p => ({ ...p, jobTypes: next }));
    };
    const togglePerk = (p) => {
        const next = selectedPerks.includes(p) ? selectedPerks.filter(x => x !== p) : [...selectedPerks, p];
        setSelectedPerks(next);
        setData(prev => ({ ...prev, perks: next }));
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <InfoBox>
                You're posting this job as a <strong>Company / Business</strong>. Your posting will be visible to
                <strong> 8Cr+</strong> job seekers on MavenJobs within minutes of launch.
            </InfoBox>

            {/* Basic Info */}
            <SectionCard icon={<FiBriefcase size={20} />} title="Company & Role" subtitle="Basic information about the position being hired for." accentColor="#002366">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                    <Input label="Company Name" required placeholder="e.g. Acme Corp"
                        value={data.companyName || ''} onChange={e => setData(p => ({ ...p, companyName: e.target.value }))} />
                    <Input label="Job Title" required placeholder="e.g. Senior Product Manager"
                        value={data.jobTitle || ''} onChange={e => setData(p => ({ ...p, jobTitle: e.target.value }))} />
                    <Select label="Industry" required options={INDUSTRIES} placeholder="Select industry"
                        value={data.industry || ''} onChange={e => setData(p => ({ ...p, industry: e.target.value }))} />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <label style={{ fontSize: 13, fontWeight: 700, color: '#1E293B', display: 'flex', alignItems: 'center', gap: 5 }}>
                            Primary Location
                            <span style={{ color: '#EF4444', fontSize: 14 }}>*</span>
                        </label>
                        <LocationAutocomplete
                            value={data.location || ''}
                            onChange={(val) => setData(p => ({ ...p, location: val }))}
                            placeholder="Select location"
                            id="post-job-location"
                            aria-label="Primary Location"
                        />
                    </div>
                </div>

                {/* External Link */}
                <div style={{ marginTop: 22 }}>
                    <Input label="External Link" placeholder="https://company.com/careers/role"
                        hint="Redirects candidates to an external career page instead of your MavenJobs application form"
                        value={data.externalLink || ''} onChange={e => setData(p => ({ ...p, externalLink: e.target.value }))} />
                </div>

                {/* Job Type pills */}
                <div style={{ marginTop: 22 }}>
                    <label style={{ fontSize: 13, fontWeight: 700, color: '#1E293B', display: 'block', marginBottom: 10 }}>
                        Job Type <span style={{ color: '#EF4444' }}>*</span>
                    </label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {JOB_TYPES.map(t => (
                            <button key={t} onClick={() => toggleType(t)} style={{
                                padding: '8px 18px', borderRadius: 100, fontSize: 13, fontWeight: 700,
                                border: selectedTypes.includes(t) ? '1.5px solid #002366' : '1.5px solid #E2E8F0',
                                background: selectedTypes.includes(t) ? '#002366' : '#fff',
                                color: selectedTypes.includes(t) ? '#fff' : '#64748B',
                                cursor: 'pointer', transition: 'all 0.18s', fontFamily: 'inherit'
                            }}>
                                {selectedTypes.includes(t) && '✓ '}{t}
                            </button>
                        ))}
                    </div>
                </div>
            </SectionCard>

            {/* Salary */}
            <SectionCard icon={<FiDollarSign size={20} />} title="Compensation" subtitle="Salary range helps attract the right candidates faster." accentColor="#84CC16">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20, alignItems: 'end' }}>
                    <div>
                        <label style={{ fontSize: 13, fontWeight: 700, color: '#1E293B', display: 'block', marginBottom: 6 }}>
                            Min Salary <span style={{ color: '#EF4444' }}>*</span>
                        </label>
                        <div style={{ display: 'flex', alignItems: 'center', border: '1.5px solid #E2E8F0', borderRadius: 12, overflow: 'hidden', background: '#fff' }}>
                            <span style={{ padding: '11px 12px', background: '#F8FAFC', color: '#64748B', fontSize: 14, fontWeight: 700, borderRight: '1px solid #E2E8F0' }}>₹</span>
                            <input placeholder="e.g. 800000" value={data.salaryMin || ''} onChange={e => setData(p => ({ ...p, salaryMin: e.target.value }))}
                                style={{ padding: '11px 14px', fontSize: 14, fontWeight: 500, color: '#0F172A', border: 'none', outline: 'none', flex: 1, fontFamily: 'inherit' }} />
                        </div>
                    </div>
                    <div>
                        <label style={{ fontSize: 13, fontWeight: 700, color: '#1E293B', display: 'block', marginBottom: 6 }}>
                            Max Salary <span style={{ color: '#EF4444' }}>*</span>
                        </label>
                        <div style={{ display: 'flex', alignItems: 'center', border: '1.5px solid #E2E8F0', borderRadius: 12, overflow: 'hidden', background: '#fff' }}>
                            <span style={{ padding: '11px 12px', background: '#F8FAFC', color: '#64748B', fontSize: 14, fontWeight: 700, borderRight: '1px solid #E2E8F0' }}>₹</span>
                            <input placeholder="e.g. 1500000" value={data.salaryMax || ''} onChange={e => setData(p => ({ ...p, salaryMax: e.target.value }))}
                                style={{ padding: '11px 14px', fontSize: 14, fontWeight: 500, color: '#0F172A', border: 'none', outline: 'none', flex: 1, fontFamily: 'inherit' }} />
                        </div>
                    </div>
                    <Select label="Pay Cycle" options={['Per Month', 'Per Annum', 'Per Hour']} value={data.payCycle || 'Per Annum'}
                        onChange={e => setData(p => ({ ...p, payCycle: e.target.value }))} />
                </div>
                <div style={{ marginTop: 16 }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', width: 'fit-content' }}>
                        <input type="checkbox" checked={data.hideSalary || false} onChange={e => setData(p => ({ ...p, hideSalary: e.target.checked }))}
                            style={{ width: 16, height: 16, accentColor: '#002366' }} />
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#475569' }}>Hide salary from candidates (show "Competitive" instead)</span>
                    </label>
                </div>
            </SectionCard>

            {/* Description */}
            <SectionCard icon={<FiFileText size={20} />} title="Job Description" subtitle="Tell candidates about the role, responsibilities, and what success looks like." accentColor="#002366">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                    {/* Role Description */}
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                            <label style={{ fontSize: 13, fontWeight: 700, color: '#1E293B', display: 'flex', alignItems: 'center', gap: 5 }}>
                                Role Description <span style={{ color: '#EF4444', fontSize: 14 }}>*</span>
                            </label>
                            <div style={{ display: 'flex', gap: 6 }}>
                                <button type="button" onClick={() => onAiEnhance('roleDescription', 'description')} disabled={aiLoading?.roleDescription}
                                    style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 8, fontSize: 11.5, fontWeight: 700, fontFamily: 'inherit', cursor: aiLoading?.roleDescription ? 'wait' : 'pointer', border: '1.5px solid #C7D7FF', background: '#EEF2FF', color: '#002366', transition: 'all .14s' }}>
                                    <FiZap size={14} /> {aiLoading?.roleDescription ? 'Enhancing…' : 'Enhance with AI'}
                                </button>
                                <label style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 8, fontSize: 11.5, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer', border: '1.5px solid #E2E8F0', background: '#F8FAFC', color: '#64748B', transition: 'all .14s' }}>
                                    <FiUpload size={13} /> Upload JD/RD
                                    <input type="file" accept=".txt,.md" style={{ display: 'none' }} onChange={(e) => { onUploadJd(e); }} />
                                </label>
                            </div>
                        </div>
                        <textarea value={data.roleDescription || ''} onChange={e => setData(p => ({ ...p, roleDescription: e.target.value }))} rows={6}
                            placeholder="Describe the role, responsibilities, and what success looks like..."
                            style={{ width: '100%', padding: '12px 14px', fontSize: 14, fontWeight: 500, color: '#0F172A', background: '#fff', border: '1.5px solid #E2E8F0', borderRadius: 12, outline: 'none', fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box', transition: 'border-color 0.18s' }}
                            onFocus={e => e.target.style.borderColor = '#002366'} onBlur={e => e.target.style.borderColor = '#E2E8F0'} />
                    </div>

                    {/* Key Responsibilities */}
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                            <label style={{ fontSize: 13, fontWeight: 700, color: '#1E293B', display: 'flex', alignItems: 'center', gap: 5 }}>
                                Key Responsibilities <span style={{ color: '#EF4444', fontSize: 14 }}>*</span>
                            </label>
                            <button type="button" onClick={() => onAiEnhance('responsibilities', 'responsibilities')} disabled={aiLoading?.responsibilities}
                                style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 8, fontSize: 11.5, fontWeight: 700, fontFamily: 'inherit', cursor: aiLoading?.responsibilities ? 'wait' : 'pointer', border: '1.5px solid #C7D7FF', background: '#EEF2FF', color: '#002366', transition: 'all .14s' }}>
                                <FiZap size={14} /> {aiLoading?.responsibilities ? 'Enhancing…' : 'Enhance with AI'}
                            </button>
                        </div>
                        <textarea value={data.responsibilities || ''} onChange={e => setData(p => ({ ...p, responsibilities: e.target.value }))} rows={5}
                            placeholder="• Lead cross-functional product teams&#10;• Define and own the product roadmap&#10;• Collaborate with engineering and design..."
                            style={{ width: '100%', padding: '12px 14px', fontSize: 14, fontWeight: 500, color: '#0F172A', background: '#fff', border: '1.5px solid #E2E8F0', borderRadius: 12, outline: 'none', fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box', transition: 'border-color 0.18s' }}
                            onFocus={e => e.target.style.borderColor = '#002366'} onBlur={e => e.target.style.borderColor = '#E2E8F0'} />
                        <div style={{ fontSize: 11.5, color: '#94A3B8', marginTop: 4, fontWeight: 500 }}>Add each responsibility on a new line, starting with •</div>
                    </div>

                    {/* Required Skills & Qualifications */}
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                            <label style={{ fontSize: 13, fontWeight: 700, color: '#1E293B', display: 'flex', alignItems: 'center', gap: 5 }}>
                                Required Skills & Qualifications <span style={{ color: '#EF4444', fontSize: 14 }}>*</span>
                            </label>
                            <button type="button" onClick={() => onAiEnhance('skills', 'qualifications')} disabled={aiLoading?.skills}
                                style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 8, fontSize: 11.5, fontWeight: 700, fontFamily: 'inherit', cursor: aiLoading?.skills ? 'wait' : 'pointer', border: '1.5px solid #C7D7FF', background: '#EEF2FF', color: '#002366', transition: 'all .14s' }}>
                                <FiZap size={14} /> {aiLoading?.skills ? 'Enhancing…' : 'Enhance with AI'}
                            </button>
                        </div>
                        <textarea value={data.skills || ''} onChange={e => setData(p => ({ ...p, skills: e.target.value }))} rows={4}
                            placeholder="• 5+ years of product management experience&#10;• Strong analytical and data-driven mindset&#10;• Excellent communication skills..."
                            style={{ width: '100%', padding: '12px 14px', fontSize: 14, fontWeight: 500, color: '#0F172A', background: '#fff', border: '1.5px solid #E2E8F0', borderRadius: 12, outline: 'none', fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box', transition: 'border-color 0.18s' }}
                            onFocus={e => e.target.style.borderColor = '#002366'} onBlur={e => e.target.style.borderColor = '#E2E8F0'} />
                        <div style={{ fontSize: 11.5, color: '#94A3B8', marginTop: 4, fontWeight: 500 }}>Add each qualification on a new line, starting with •</div>
                    </div>
                </div>
            </SectionCard>
        </div>
    );
}

/* ─────────────────────── STEP 2: CANDIDATE PREFERENCES ─────────────────────── */
function StepCandidatePreferences({ data, setData, onSuggestSkills, skillSuggestions, skillSuggestLoading }) {
    const [skills, setSkills] = useState(data.requiredSkills || []);
    const [skillInput, setSkillInput] = useState('');
    const [minExpCustom, setMinExpCustom] = useState(false);
    const [maxExpCustom, setMaxExpCustom] = useState(false);

    const addSkill = (s) => {
        const skill = (s || skillInput).trim();
        if (skill && !skills.includes(skill)) {
            const next = [...skills, skill];
            setSkills(next);
            setData(p => ({ ...p, requiredSkills: next }));
            if (next.length === 1) {
                onSuggestSkills(next);
            }
        }
        setSkillInput('');
    };
    const removeSkill = (s) => {
        const next = skills.filter(x => x !== s);
        setSkills(next);
        setData(p => ({ ...p, requiredSkills: next }));
    };
    const addSuggestedSkill = (s) => {
        if (!skills.includes(s)) {
            const next = [...skills, s];
            setSkills(next);
            setData(p => ({ ...p, requiredSkills: next }));
            onSuggestSkills(next);
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <InfoBox>
                Setting candidate preferences helps MavenJobs' AI match your role with the most relevant profiles from our <strong>8Cr+ resume database</strong>.
            </InfoBox>

            {/* Experience & Education */}
            <SectionCard icon={<FiUsers size={20} />} title="Experience & Education" subtitle="Define the ideal candidate background." accentColor="#002366">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <Select label="Minimum Experience" required options={EXPERIENCE} placeholder="Select min experience"
                            value={minExpCustom ? '[Manually]' : (data.minExp || '')}
                            onChange={e => {
                                if (e.target.value === '[Manually]') {
                                    setMinExpCustom(true);
                                    setData(p => ({ ...p, minExp: '' }));
                                } else {
                                    setMinExpCustom(false);
                                    setData(p => ({ ...p, minExp: e.target.value }));
                                }
                            }} />
                        {minExpCustom && (
                            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                <input type="number" min="0" placeholder="Enter years"
                                    value={data.minExp || ''}
                                    onChange={e => setData(p => ({ ...p, minExp: e.target.value }))}
                                    style={{
                                        flex: 1, padding: '11px 14px', fontSize: 14, fontWeight: 500,
                                        color: '#0F172A', background: '#fff',
                                        border: '1.5px solid #E2E8F0', borderRadius: 12,
                                        outline: 'none', fontFamily: 'inherit'
                                    }} />
                                <span style={{ fontSize: 13, color: '#64748B', fontWeight: 500, whiteSpace: 'nowrap' }}>years</span>
                            </div>
                        )}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <Select label="Maximum Experience" required options={EXPERIENCE} placeholder="Select max experience"
                            value={maxExpCustom ? '[Manually]' : (data.maxExp || '')}
                            onChange={e => {
                                if (e.target.value === '[Manually]') {
                                    setMaxExpCustom(true);
                                    setData(p => ({ ...p, maxExp: '' }));
                                } else {
                                    setMaxExpCustom(false);
                                    setData(p => ({ ...p, maxExp: e.target.value }));
                                }
                            }} />
                        {maxExpCustom && (
                            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                <input type="number" min="0" placeholder="Enter years"
                                    value={data.maxExp || ''}
                                    onChange={e => setData(p => ({ ...p, maxExp: e.target.value }))}
                                    style={{
                                        flex: 1, padding: '11px 14px', fontSize: 14, fontWeight: 500,
                                        color: '#0F172A', background: '#fff',
                                        border: '1.5px solid #E2E8F0', borderRadius: 12,
                                        outline: 'none', fontFamily: 'inherit'
                                    }} />
                                <span style={{ fontSize: 13, color: '#64748B', fontWeight: 500, whiteSpace: 'nowrap' }}>years</span>
                            </div>
                        )}
                    </div>
                    <Select label="Minimum Education" required options={EDUCATION} placeholder="Select education"
                        value={data.minEducation || ''} onChange={e => setData(p => ({ ...p, minEducation: e.target.value }))} />
                    <Select label="Notice Period Preference" options={['Immediate', '15 Days', '30 Days', '60 Days', '90 Days', 'Any']}
                        placeholder="Any" value={data.noticePeriod || ''} onChange={e => setData(p => ({ ...p, noticePeriod: e.target.value }))} />
                </div>
            </SectionCard>

            {/* Skills */}
            <SectionCard icon={<FiZap size={20} />} title="Required Skills" subtitle="Add skills candidates must have. AI uses these for smart matching." accentColor="#84CC16" required>
                <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
                    <input value={skillInput} onChange={e => setSkillInput(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSkill(); } }}
                        placeholder="Type a skill and press Enter (e.g. React, Python, SQL)"
                        style={{
                            flex: 1, padding: '11px 14px', fontSize: 14, fontWeight: 500, color: '#0F172A',
                            background: '#fff', border: '1.5px solid #E2E8F0', borderRadius: 12,
                            outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box'
                        }} />
                    <button onClick={() => addSkill()} style={{
                        padding: '11px 20px', borderRadius: 12, border: 'none',
                        background: 'linear-gradient(135deg, #001a50, #0F3DB5)',
                        color: '#fff', fontSize: 13.5, fontWeight: 700, cursor: 'pointer',
                        fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6,
                        boxShadow: '0 4px 14px rgba(0,35,102,0.28)'
                    }}>
                        <FiPlus size={15} /> Add
                    </button>
                </div>
                {skills.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {skills.map(s => (
                            <span key={s} style={{
                                display: 'inline-flex', alignItems: 'center', gap: 7,
                                padding: '6px 12px', borderRadius: 100,
                                background: '#002366', color: '#fff',
                                fontSize: 13, fontWeight: 700
                            }}>
                                {s}
                                <button onClick={() => removeSkill(s)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.7)', cursor: 'pointer', padding: 0, display: 'flex' }}>
                                    <FiX size={13} />
                                </button>
                            </span>
                        ))}
                    </div>
                )}
                {skills.length === 0 && (
                    <div style={{
                        padding: '20px', textAlign: 'center', color: '#94A3B8', fontSize: 13.5, fontWeight: 500,
                        background: '#F8FAFC', borderRadius: 12, border: '1.5px dashed #E2E8F0'
                    }}>
                        No skills added yet. Type a skill above and press Enter or click Add.
                    </div>
                )}
                {/* AI Skill Suggestions */}
                {skills.length > 0 && (
                    <div style={{ marginTop: 16 }}>
                        {skillSuggestLoading ? (
                            <div style={{ fontSize: 12.5, color: '#94A3B8', fontWeight: 600, padding: '8px 0' }}>AI suggesting related skills…</div>
                        ) : skillSuggestions.length > 0 ? (
                            <div>
                                <div style={{ fontSize: 12, fontWeight: 700, color: '#64748B', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 5 }}>
                                    <FiZap size={13} color="#002366" /> AI Suggested Skills
                                </div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                    {skillSuggestions.map(s => (
                                        <button key={s} onClick={() => addSuggestedSkill(s)}
                                            style={{
                                                display: 'inline-flex', alignItems: 'center', gap: 5,
                                                padding: '5px 13px', borderRadius: 100,
                                                background: '#EEF2FF', border: '1.5px solid #C7D7FF',
                                                color: '#002366', fontSize: 12.5, fontWeight: 700,
                                                cursor: 'pointer', fontFamily: 'inherit',
                                                transition: 'all .14s'
                                            }}
                                            onMouseEnter={e => { e.currentTarget.style.background = '#002366'; e.currentTarget.style.color = '#fff'; }}
                                            onMouseLeave={e => { e.currentTarget.style.background = '#EEF2FF'; e.currentTarget.style.color = '#002366'; }}
                                        >
                                            <FiPlus size={12} /> {s}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ) : null}
                    </div>
                )}
            </SectionCard>

            {/* CV Submission Settings */}
            <SectionCard icon={<FiUpload size={20} />} title="CV Submission Settings"
                subtitle="Configure how candidates apply for this role." accentColor="#002366"
                toggle toggleValue={data.cvEnabled !== false} onToggle={() => setData(p => ({ ...p, cvEnabled: p.cvEnabled === false ? true : false }))}>
                {data.cvEnabled !== false && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                        <Input label="Max CVs Allowed" hint="optional" placeholder="Leave empty for unlimited (e.g. 100)"
                            value={data.maxCvs || ''} onChange={e => setData(p => ({ ...p, maxCvs: e.target.value }))} />
                        <Input label="CV Submission End Date" type="date"
                            value={data.cvEndDate || ''} onChange={e => setData(p => ({ ...p, cvEndDate: e.target.value }))} />
                        <div style={{ gridColumn: '1/-1' }}>
                            <div style={{ padding: '16px 18px', background: '#F8FAFC', border: '1.5px solid #E2E8F0', borderRadius: 12 }}>
                                <label style={{ display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer' }}>
                                    <input type="checkbox" checked={data.requireSample || false} onChange={e => setData(p => ({ ...p, requireSample: e.target.checked }))}
                                        style={{ width: 18, height: 18, accentColor: '#002366', marginTop: 1, flexShrink: 0 }} />
                                    <div>
                                        <div style={{ fontSize: 13.5, fontWeight: 700, color: '#0F172A' }}>Require Portfolio / Sample File</div>
                                        <div style={{ fontSize: 12.5, color: '#64748B', marginTop: 2 }}>If enabled, candidates must upload a portfolio or sample file along with their CV.</div>
                                    </div>
                                </label>
                            </div>
                        </div>
                    </div>
                )}
            </SectionCard>
        </div>
    );
}

/* ─────────────────────── STEP 3: SCREENING QUESTIONS ─────────────────────── */
function StepScreening({ data, setData }) {
    const [questions, setQuestions] = useState(data.questions || []);

    const addQuestion = () => {
        const q = { id: Date.now(), question: '', type: 'Yes/No', required: false, scoring: 'Preferred' };
        const next = [...questions, q];
        setQuestions(next);
        setData(p => ({ ...p, questions: next }));
    };
    const removeQuestion = (id) => {
        const next = questions.filter(q => q.id !== id);
        setQuestions(next);
        setData(p => ({ ...p, questions: next }));
    };
    const updateQuestion = (id, field, val) => {
        const next = questions.map(q => q.id === id ? { ...q, [field]: val } : q);
        setQuestions(next);
        setData(p => ({ ...p, questions: next }));
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <InfoBox>
                <strong>Must</strong> = candidate is marked unsuitable if they answer No. &nbsp;
                <strong>Preferred</strong> = −10 score per incorrect answer. Text answers require a free-text response from the candidate.
            </InfoBox>

            <SectionCard icon={<FiFileText size={20} />} title="Screening Questions"
                subtitle="Optional questions shown to candidates during CV submission." accentColor="#002366">

                {/* Table header */}
                {questions.length > 0 && (
                    <div style={{
                        display: 'grid', gridTemplateColumns: '1fr 140px 120px 80px 40px', gap: 12,
                        padding: '10px 14px', background: '#F8FAFC', borderRadius: 10, marginBottom: 12
                    }}>
                        {['Question', 'Type', 'Scoring', 'Required', ''].map(h => (
                            <div key={h} style={{ fontSize: 11.5, fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</div>
                        ))}
                    </div>
                )}

                {/* Questions */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {questions.map((q, i) => (
                        <div key={q.id} style={{
                            display: 'grid', gridTemplateColumns: '1fr 140px 120px 80px 40px', gap: 12, alignItems: 'center',
                            padding: '14px', background: '#fff', border: '1.5px solid #E8EDF5', borderRadius: 12
                        }}>
                            <input value={q.question} onChange={e => updateQuestion(q.id, 'question', e.target.value)}
                                placeholder={`Question ${i + 1}...`}
                                style={{
                                    padding: '9px 12px', fontSize: 13.5, fontWeight: 500, color: '#0F172A',
                                    border: '1.5px solid #E2E8F0', borderRadius: 10, outline: 'none', fontFamily: 'inherit', width: '100%', boxSizing: 'border-box'
                                }} />
                            <select value={q.type} onChange={e => updateQuestion(q.id, 'type', e.target.value)}
                                style={{
                                    padding: '9px 10px', fontSize: 13, fontWeight: 500, color: '#0F172A',
                                    border: '1.5px solid #E2E8F0', borderRadius: 10, outline: 'none', fontFamily: 'inherit', background: '#fff'
                                }}>
                                {Q_TYPES.map(t => <option key={t}>{t}</option>)}
                            </select>
                            <select value={q.scoring} onChange={e => updateQuestion(q.id, 'scoring', e.target.value)}
                                style={{
                                    padding: '9px 10px', fontSize: 13, fontWeight: 500,
                                    color: q.scoring === 'Must' ? '#B91C1C' : '#166534',
                                    border: `1.5px solid ${q.scoring === 'Must' ? '#FECACA' : '#A7F3D0'}`,
                                    borderRadius: 10, outline: 'none', fontFamily: 'inherit',
                                    background: q.scoring === 'Must' ? '#FEF2F2' : '#ECFDF5'
                                }}>
                                <option>Preferred</option>
                                <option>Must</option>
                            </select>
                            <label style={{ display: 'flex', justifyContent: 'center', cursor: 'pointer' }}>
                                <input type="checkbox" checked={q.required} onChange={e => updateQuestion(q.id, 'required', e.target.checked)}
                                    style={{ width: 18, height: 18, accentColor: '#002366' }} />
                            </label>
                            <button onClick={() => removeQuestion(q.id)} style={{
                                width: 32, height: 32, borderRadius: 9, background: '#FEF2F2',
                                border: '1px solid #FECACA', color: '#EF4444', cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>
                                <FiTrash2 size={14} />
                            </button>
                        </div>
                    ))}
                </div>

                {questions.length === 0 && (
                    <div style={{
                        padding: '32px 20px', textAlign: 'center', color: '#94A3B8',
                        fontSize: 14, fontWeight: 500, background: '#F8FAFC', borderRadius: 12, border: '1.5px dashed #E2E8F0'
                    }}>
                        No screening questions added yet.
                        <br /><span style={{ fontSize: 13 }}>Click "Add Question" to get started.</span>
                    </div>
                )}

                <button onClick={addQuestion} style={{
                    marginTop: 16, display: 'flex', alignItems: 'center', gap: 8,
                    padding: '11px 20px', borderRadius: 12,
                    background: '#EEF2FF', border: '1.5px solid #C7D7FF',
                    color: '#002366', fontSize: 13.5, fontWeight: 700,
                    cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.18s'
                }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#002366'; e.currentTarget.style.color = '#fff'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = '#EEF2FF'; e.currentTarget.style.color = '#002366'; }}
                >
                    <FiPlus size={15} /> Add Question
                </button>
            </SectionCard>

            {/* Campaign Plan */}
            <SectionCard icon={<FiZap size={20} />} title="Campaign Plan" subtitle="Choose how long your job posting stays active." accentColor="#84CC16">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    {[
                        { plan: 'Standard', price: '₹400', days: 45, desc: 'Standard visibility, 45-day retention', color: '#002366' },
                        { plan: 'Premium', price: '₹850', days: 90, desc: 'Top placement, 90-day retention, AI boost', color: '#84CC16', badge: 'Popular' },
                    ].map(({ plan, price, days, desc, color, badge }) => (
                        <button key={plan} onClick={() => setData(p => ({ ...p, campaignPlan: plan }))} style={{
                            padding: '20px', borderRadius: 16, cursor: 'pointer', textAlign: 'left',
                            border: data.campaignPlan === plan ? `2px solid ${color}` : '2px solid #E2E8F0',
                            background: data.campaignPlan === plan ? `${color}08` : '#fff',
                            transition: 'all 0.2s', position: 'relative', fontFamily: 'inherit'
                        }}>
                            {badge && (
                                <span style={{
                                    position: 'absolute', top: -10, right: 16, padding: '3px 10px', borderRadius: 100,
                                    background: '#84CC16', color: '#fff', fontSize: 11, fontWeight: 800
                                }}>{badge}</span>
                            )}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                                <span style={{ fontSize: 15, fontWeight: 800, color: '#0F172A' }}>{plan}</span>
                                <span style={{ fontSize: 18, fontWeight: 900, color }}>
                                    {price}<span style={{ fontSize: 12, fontWeight: 600, color: '#64748B' }}>/post</span>
                                </span>
                            </div>
                            <div style={{ fontSize: 13, color: '#64748B', fontWeight: 500 }}>{desc}</div>
                            <div style={{
                                marginTop: 12, display: 'flex', alignItems: 'center', gap: 6,
                                fontSize: 12.5, fontWeight: 700, color: data.campaignPlan === plan ? color : '#94A3B8'
                            }}>
                                <div style={{
                                    width: 14, height: 14, borderRadius: '50%', border: `2px solid ${data.campaignPlan === plan ? color : '#CBD5E1'}`,
                                    background: data.campaignPlan === plan ? color : 'transparent',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                                }}>
                                    {data.campaignPlan === plan && <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#fff' }} />}
                                </div>
                                {days}-day retention
                            </div>
                        </button>
                    ))}
                </div>
            </SectionCard>
        </div>
    );
}

/* ─────────────────────── STEP 4: REVIEW & LAUNCH ─────────────────────── */
function StepReview({ data }) {
    const ReviewRow = ({ label, value }) => (
        <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
            padding: '12px 0', borderBottom: '1px solid #F1F5F9', gap: 16
        }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#64748B', flexShrink: 0, minWidth: 180 }}>{label}</span>
            <span style={{ fontSize: 13.5, fontWeight: 600, color: '#0F172A', textAlign: 'right' }}>{value || '—'}</span>
        </div>
    );

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* Launch info box */}
            <div style={{
                padding: '24px 28px', borderRadius: 20,
                background: 'linear-gradient(135deg, #001a50 0%, #002fa0 100%)',
                position: 'relative', overflow: 'hidden'
            }}>
                <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(255,255,255,0.04) 1px, transparent 1px)', backgroundSize: '22px 22px', pointerEvents: 'none' }} />
                <div style={{
                    position: 'absolute', top: -40, right: -40, width: 200, height: 200, borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(132,204,22,0.18) 0%, transparent 70%)', pointerEvents: 'none'
                }} />
                <div style={{ position: 'relative', zIndex: 1 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#86EFAC', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>
                        ✦ What happens after launch
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 600, color: '#fff', lineHeight: 1.7 }}>
                        {['Shareable links will be generated for all enabled services.',
                            'Copy and send these links directly to candidates.',
                            'Links automatically stop working after the set end date.',
                            'AI screening begins immediately — results available in your dashboard.'
                        ].map((item, i) => (
                            <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 6 }}>
                                <span style={{ color: '#84CC16', flexShrink: 0, marginTop: 2 }}>→</span>
                                <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14 }}>{item}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <SectionCard icon={<FiCheckCircle size={20} />} title="Job Summary" subtitle="Review all details before launching your campaign." accentColor="#002366">
                <ReviewRow label="Company Name" value={data.companyName} />
                <ReviewRow label="Job Title" value={data.jobTitle} />
                <ReviewRow label="Industry" value={data.industry} />
                <ReviewRow label="Location" value={data.location} />
                <ReviewRow label="Job Type" value={(data.jobTypes || []).join(', ')} />
                <ReviewRow label="Salary Range" value={data.salaryMin && data.salaryMax ? `₹${parseInt(data.salaryMin || 0).toLocaleString('en-IN')} – ₹${parseInt(data.salaryMax || 0).toLocaleString('en-IN')} ${data.payCycle || 'Per Annum'}` : null} />
                <ReviewRow label="Experience Required" value={data.minExp && data.maxExp ? `${data.minExp} – ${data.maxExp}` : data.minExp} />
                <ReviewRow label="Minimum Education" value={data.minEducation} />
                <ReviewRow label="Notice Period" value={data.noticePeriod} />
                <ReviewRow label="Required Skills" value={(data.requiredSkills || []).join(', ')} />
                <ReviewRow label="CV Submission" value={data.cvEnabled !== false ? 'Enabled' : 'Disabled'} />
                <ReviewRow label="Max CVs" value={data.maxCvs || 'Unlimited'} />
                <ReviewRow label="Portfolio Required" value={data.requireSample ? 'Yes' : 'No'} />
                <ReviewRow label="Screening Questions" value={`${(data.questions || []).length} question(s)`} />
                <ReviewRow label="External Link" value={data.externalLink || '—'} />
                <ReviewRow label="Campaign Plan" value={data.campaignPlan || 'Standard'} />
            </SectionCard>

            {/* Role Description Preview */}
            {data.roleDescription && (
                <SectionCard icon={<FiFileText size={20} />} title="Role Description Preview" subtitle="This is what candidates will see." accentColor="#84CC16">
                    <pre style={{ margin: 0, fontSize: 14, lineHeight: 1.75, color: '#334155', fontFamily: 'inherit', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                        {data.roleDescription}
                    </pre>
                </SectionCard>
            )}
        </div>
    );
}

/* ─────────────────────── PROGRESS BAR ─────────────────────── */
function ProgressBar({ currentStep, totalSteps, navigate, mavenLogo, stepLabel, onExit }) {
    const progressRef = useRef(null);
    const pct = ((currentStep - 1) / (totalSteps - 1)) * 100;

    useEffect(() => {
        if (progressRef.current) {
            gsap.to(progressRef.current, { width: `${pct}%`, duration: 0.55, ease: 'power3.out' });
        }
    }, [pct]);

    return (
        <div style={{
            background: '#fff', borderBottom: '1px solid #E8EDF5', padding: '0 40px', position: 'sticky', top: 0, zIndex: 100,
            boxShadow: '0 4px 20px rgba(0,35,102,0.05)'
        }}>
            <div style={{ 
                maxWidth: 1300, margin: '0 auto', 
                display: 'grid', gridTemplateColumns: '1fr auto 1fr', 
                alignItems: 'center', gap: 20 
            }}>

                {/* Left: Logo & Title */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0 }}>
                    <Link to="/">
                        <img src={mavenLogo} alt="MavenJobs" style={{ height: 32, display: 'block' }} />
                    </Link>
                    <div style={{ width: 1, height: 24, background: '#E2E8F0' }} />
                    <div>
                        <div style={{ fontSize: 14, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.01em' }}>Post a Job</div>
                        <div style={{ fontSize: 11, color: '#94A3B8', fontWeight: 600 }}>
                            Step {currentStep} of {totalSteps}
                        </div>
                    </div>
                </div>

                {/* Center: Step indicators */}
                <div style={{ width: 680, padding: '16px 0 0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
                        <div style={{ position: 'absolute', top: 18, left: '5%', right: '5%', height: 2, background: '#E2E8F0', borderRadius: 99, zIndex: 0 }} />
                        <div ref={progressRef} style={{ position: 'absolute', top: 18, left: '5%', height: 2, background: 'linear-gradient(90deg, #002366, #84CC16)', borderRadius: 99, zIndex: 1, width: '0%' }} />

                        {STEPS.map((step, i) => {
                            const done = currentStep > step.id;
                            const active = currentStep === step.id;
                            return (
                                <div key={step.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, position: 'relative', zIndex: 2 }}>
                                    <div style={{
                                        width: 36, height: 36, borderRadius: '50%',
                                        background: done ? '#84CC16' : active ? '#002366' : '#fff',
                                        border: `2.5px solid ${done ? '#84CC16' : active ? '#002366' : '#E2E8F0'}`,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        color: done || active ? '#fff' : '#94A3B8',
                                        transition: 'all 0.35s cubic-bezier(0.34,1.56,0.64,1)',
                                        boxShadow: active ? '0 0 0 5px rgba(0,35,102,0.1)' : done ? '0 0 0 5px rgba(132,204,22,0.15)' : 'none'
                                    }}>
                                        {done ? <FiCheckCircle size={15} /> : React.cloneElement(step.icon, { size: 14 })}
                                    </div>
                                    <div style={{ textAlign: 'center' }}>
                                        <div style={{
                                            fontSize: 10, fontWeight: 800, color: active ? '#002366' : done ? '#3F6212' : '#94A3B8',
                                            textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap', transition: 'color 0.2s'
                                        }}>
                                            {step.label}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    {/* Thin progress stripe at bottom of the indicators */}
                    <div style={{ height: 2, background: '#F1F5F9', marginTop: 14, borderRadius: 0 }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: 'linear-gradient(90deg, #002366, #84CC16)', borderRadius: 0, transition: 'width 0.55s cubic-bezier(0.4,0,0.2,1)' }} />
                    </div>
                </div>

                {/* Right: Spacer for Grid Alignment */}
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button onClick={() => { if (onExit) onExit(); else navigate(-1); }} style={{
                        display: 'flex', alignItems: 'center', gap: 5,
                        fontSize: 12, fontWeight: 700, color: '#64748B',
                        background: 'none', border: '1.5px solid #E2E8F0',
                        padding: '7px 14px', borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit',
                        transition: 'all 0.18s'
                    }}
                        onMouseEnter={e => { e.currentTarget.style.color = '#002366'; e.currentTarget.style.borderColor = '#C7D7FF'; e.currentTarget.style.background = '#EEF2FF'; }}
                        onMouseLeave={e => { e.currentTarget.style.color = '#64748B'; e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.background = 'none'; }}
                    >
                        <FiX size={14} /> Exit
                    </button>
                </div>
            </div>
        </div>
    );
}


/* ─────────────────────── MAIN PAGE ─────────────────────── */
export default function PostJob() {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [launched, setLaunched] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState('');
    const [createdJob, setCreatedJob] = useState(null);
    const [formData, setFormData] = useState({ campaignPlan: 'Standard', cvEnabled: true });
    const contentRef = useRef(null);
    const headerRef = useRef(null);
    const launchRef = useRef(null);
    const modalRef = useRef(null);
    const modalOverlayRef = useRef(null);
    const draftIdRef = useRef(null);
    const formDataRef = useRef(formData);
    formDataRef.current = formData;
    const launchedRef = useRef(launched);
    launchedRef.current = launched;

    // Auto-save draft when closing tab/window
    useEffect(() => {
        const handleBeforeUnload = (e) => {
            if (launchedRef.current) return;
            const saved = autoSaveDraft(formDataRef.current, draftIdRef.current);
            if (saved) draftIdRef.current = saved.draftId;
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, []);

    // Restore draft if draftId is in URL
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const draftId = params.get('draftId');
        if (draftId) {
            const draft = getDraft(draftId);
            if (draft) {
                setFormData((prev) => ({ ...prev, ...draft }));
                draftIdRef.current = draftId;
            }
        }
    }, []);

    // Auto-fill company name from session
    useEffect(() => {
        try {
            const session = JSON.parse(localStorage.getItem('employerUser') || 'null');
            if (session?.companyName && !formData.companyName) {
                setFormData(p => ({ ...p, companyName: session.companyName }));
            }
        } catch { /* ignore */ }
    }, []);

    const [aiLoading, setAiLoading] = useState({});
    const [aiError, setAiError] = useState("");

    const handleAiEnhance = async (field, type) => {
        const text = formData[field];
        if (!text || !text.trim()) {
            setAiError(`Please write something in the ${field.replace(/([A-Z])/g, ' $1').toLowerCase()} field first.`);
            return;
        }
        setAiLoading(p => ({ ...p, [field]: true }));
        setAiError("");
        try {
            const res = await authService.enhanceDescription(text, type);
            const enhanced = res?.data?.text || "";
            if (enhanced) setFormData(p => ({ ...p, [field]: enhanced }));
        } catch (err) {
            setAiError(err?.message || "AI enhancement failed. Try again.");
        } finally {
            setAiLoading(p => ({ ...p, [field]: false }));
        }
    };

    const handleUploadJd = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            const text = ev.target?.result || "";
            setFormData(p => ({ ...p, roleDescription: text }));
        };
        reader.readAsText(file);
        e.target.value = "";
    };

    const [skillSuggestions, setSkillSuggestions] = useState([]);
    const [skillSuggestLoading, setSkillSuggestLoading] = useState(false);

    const handleSuggestSkills = async (skills) => {
        if (skills.length === 0) return;
        setSkillSuggestLoading(true);
        try {
            const res = await authService.suggestSkills(skills);
            const suggestions = res?.data?.suggestions || [];
            setSkillSuggestions(suggestions.filter(s => !skills.includes(s)));
        } catch {
            setSkillSuggestions([]);
        } finally {
            setSkillSuggestLoading(false);
        }
    };

    // Page-load animation
    useEffect(() => {
        gsap.fromTo(headerRef.current,
            { opacity: 0, y: -20 },
            { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' }
        );
        animateStepIn();
    }, []);

    const animateStepIn = () => {
        if (!contentRef.current) return;
        gsap.fromTo(contentRef.current,
            { opacity: 0, y: 28, scale: 0.98 },
            { opacity: 1, y: 0, scale: 1, duration: 0.45, ease: 'back.out(1.2)' }
        );
    };

    const animateStepOut = (cb) => {
        if (!contentRef.current) { cb(); return; }
        gsap.to(contentRef.current, {
            opacity: 0, y: -20, scale: 0.98, duration: 0.25, ease: 'power2.in',
            onComplete: cb
        });
    };

    const [stepError, setStepError] = useState("");

    const validateStep = (s) => {
        if (s === 1) {
            if (!formData.companyName?.trim()) return "Please fill in the Company Name field.";
            if (!formData.jobTitle?.trim()) return "Please fill in the Job Title field.";
            if (!formData.industry) return "Please select an Industry.";
            if (!formData.location) return "Please fill in the Location field.";
            if (!(formData.jobTypes || []).length) return "Please select at least one Job Type.";
            if (!formData.salaryMin || !formData.salaryMax) return "Please fill in the Salary Range fields.";
            if (!formData.roleDescription?.trim()) return "Please fill in the Role Description field.";
            if (!formData.responsibilities?.trim()) return "Please fill in the Key Responsibilities field.";
            if (!formData.skills?.trim()) return "Please fill in the Required Skills & Qualifications field.";
            return null;
        }
        if (s === 2) {
            if (!formData.minExp) return "Please select Minimum Experience.";
            if (!formData.maxExp) return "Please select Maximum Experience.";
            if (!formData.minEducation) return "Please select Minimum Education.";
            if (!(formData.requiredSkills || []).length) return "Please add at least one Required Skill.";
            return null;
        }
        return null;
    };

    const goNext = () => {
        const err = validateStep(step);
        if (err) { setStepError(err); return; }
        setStepError("");
        setAiError("");
        animateStepOut(() => {
            setStep(s => Math.min(s + 1, STEPS.length));
            setTimeout(animateStepIn, 30);
        });
    };

    const goBack = () => {
        setStepError("");
        setAiError("");
        animateStepOut(() => {
            setStep(s => Math.max(s - 1, 1));
            setTimeout(animateStepIn, 30);
        });
    };

    const dismissValidation = useCallback(() => {
        if (!modalRef.current) { setStepError(""); return; }
        gsap.to(modalRef.current, {
            opacity: 0, scale: 0.92, y: 20, duration: 0.2, ease: 'power2.in',
            onComplete: () => setStepError("")
        });
        gsap.to(modalOverlayRef.current, {
            opacity: 0, duration: 0.18, ease: 'power2.in'
        });
    }, []);

    useEffect(() => {
        if (!stepError) return;
        gsap.fromTo(modalOverlayRef.current, { opacity: 0 }, { opacity: 1, duration: 0.25, ease: 'power2.out' });
        gsap.fromTo(modalRef.current, { opacity: 0, scale: 0.92, y: 20 }, { opacity: 1, scale: 1, y: 0, duration: 0.3, ease: 'back.out(1.3)' });
        const handler = (e) => { if (e.key === 'Escape') dismissValidation(); };
        window.addEventListener('keydown', handler);
        document.body.style.overflow = 'hidden';
        return () => {
            window.removeEventListener('keydown', handler);
            document.body.style.overflow = '';
        };
    }, [stepError, dismissValidation]);

    const validateJobForm = () => {
        const step1Err = validateStep(1);
        if (step1Err) return { step: 1, message: step1Err };
        const step2Err = validateStep(2);
        if (step2Err) return { step: 2, message: step2Err };
        return null;
    };

    const handleLaunch = async () => {
        const validation = validateJobForm();
        if (validation) {
            setStep(validation.step);
            setSubmitError(validation.message);
            return;
        }

        setSubmitError('');
        setSubmitting(true);

        try {
            const skills = Array.isArray(formData.requiredSkills)
                ? formData.requiredSkills
                : String(formData.requiredSkills || '')
                    .split(',')
                    .map((item) => item.trim())
                    .filter(Boolean);

            const experience = formData.minExp && formData.maxExp
                ? `${formData.minExp} – ${formData.maxExp}`
                : formData.minExp || formData.maxExp || '';

            const workplaceType = (formData.jobTypes || []).includes('Remote')
                ? 'Remote'
                : (formData.jobTypes || []).includes('Hybrid')
                    ? 'Hybrid'
                    : (formData.jobTypes || []).includes('Part-time')
                        ? 'Part-time'
                        : (formData.jobTypes || []).includes('Contract')
                            ? 'Contract'
                            : 'Full-time';

            const uiTypeToSchemaType = {
                'Yes/No': 'YES_NO',
                'Single Choice': 'MULTIPLE_CHOICE',
                'Text Answer': 'TEXT',
                'Number': 'NUMERIC',
            };

            const screeningQuestions = (formData.questions || []).map((q, idx) => ({
                question: q.question,
                type: uiTypeToSchemaType[q.type] || 'TEXT',
                required: q.required,
                options: [],
                maxLength: 500,
                order: idx,
            }));

            const payload = {
                title: formData.jobTitle,
                summary: formData.roleDescription || formData.responsibilities || '',
                description: [formData.roleDescription, formData.responsibilities, formData.skills]
                    .filter(Boolean)
                    .join('\n\n'),
                department: formData.industry || 'General',
                jobType: formData.jobTypes?.[0] || 'Full-time',
                workplaceType,
                location: formData.location,
                experience,
                salaryMin: Number(formData.salaryMin) || 0,
                salaryMax: Number(formData.salaryMax) || 0,
                skills,
                deadline: formData.cvEndDate || undefined,
                screeningQuestions,
                externalLink: formData.externalLink || '',
            };

            const response = await authService.employerCreateJob(payload);
            setCreatedJob(response?.data || null);
            animateStepOut(() => {
                setLaunched(true);
                setSubmitting(false);
                setTimeout(() => {
                    if (launchRef.current) {
                        gsap.fromTo(launchRef.current,
                            { opacity: 0, scale: 0.88, y: 40 },
                            { opacity: 1, scale: 1, y: 0, duration: 0.65, ease: 'back.out(1.4)' }
                        );
                    }
                }, 60);
            });
        } catch (error) {
            setSubmitting(false);
            setSubmitError(error?.message || 'Unable to post the job. Please try again.');
        }
    };

    const updateData = useCallback((updater) => {
        setFormData(prev => typeof updater === 'function' ? updater(prev) : { ...prev, ...updater });
    }, []);

    const stepLabel = STEPS.find(s => s.id === step)?.label;

    const handleExit = useCallback(() => {
        const saved = autoSaveDraft(formData, draftIdRef.current);
        if (saved) draftIdRef.current = saved.draftId;
        navigate('/employer-dashboard');
    }, [formData, navigate]);

    /* ── SUCCESS STATE ── */
    if (launched) {
        const employerSession = (() => {
            try {
                return JSON.parse(localStorage.getItem('employerUser') || 'null') || {};
            } catch {
                return {};
            }
        })();

        return (
            <div style={{ minHeight: '100vh', background: '#F0F4FA', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40, fontFamily: "'DM Sans', system-ui, sans-serif" }}>
                <div ref={launchRef} style={{
                    background: '#fff', borderRadius: 28, padding: '56px 52px', maxWidth: 560, width: '100%',
                    textAlign: 'center', boxShadow: '0 24px 80px rgba(0,35,102,0.14)', border: '1px solid #E2E8F0'
                }}>
                    <div style={{
                        width: 80, height: 80, borderRadius: '50%', background: 'linear-gradient(135deg,#84CC16,#65A30D)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 28px',
                        boxShadow: '0 8px 28px rgba(132,204,22,0.35)'
                    }}>
                        <FiCheckCircle size={38} color="#fff" />
                    </div>
                    <h2 style={{ margin: '0 0 12px', fontSize: 28, fontWeight: 900, color: '#0F172A', letterSpacing: '-0.02em' }}>
                        Job Posted Successfully! 🚀
                    </h2>
                    <p style={{ margin: '0 0 8px', fontSize: 15.5, color: '#475569', lineHeight: 1.7, fontWeight: 500 }}>
                        <strong style={{ color: '#002366' }}>{formData.jobTitle || 'Your role'}</strong> at <strong style={{ color: '#002366' }}>{formData.companyName || 'your company'}</strong> is now live.
                    </p>
                    <p style={{ margin: '0 0 36px', fontSize: 14, color: '#94A3B8', fontWeight: 500 }}>
                        Your campaign link is being generated. You'll receive it on your registered email within 2 minutes.
                    </p>
                    <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                        <button onClick={() => navigate('/employer-dashboard')} style={{
                            padding: '13px 28px', borderRadius: 14,
                            background: 'linear-gradient(135deg,#001a50,#0F3DB5)',
                            color: '#fff', fontSize: 14.5, fontWeight: 700, border: 'none', cursor: 'pointer',
                            fontFamily: 'inherit', boxShadow: '0 6px 20px rgba(0,35,102,0.3)'
                        }}>
                            Go to Dashboard
                        </button>
                        <button onClick={() => { setLaunched(false); setStep(1); setFormData({ campaignPlan: 'Standard', cvEnabled: true }); }} style={{
                            padding: '13px 28px', borderRadius: 14,
                            background: '#F1F5F9', border: '1.5px solid #E2E8F0',
                            color: '#002366', fontSize: 14.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit'
                        }}>
                            Post Another Job
                        </button>
                </div>
            </div>
        </div>
    );
}

    return (
        <div style={{ minHeight: '100vh', background: '#F0F4FA', fontFamily: "'DM Sans', system-ui, sans-serif" }}>
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&display=swap');
        *, *::before, *::after { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: #CBD5E1; border-radius: 99px; }
        input[type=date]::-webkit-calendar-picker-indicator { opacity: 0.5; cursor: pointer; }
      `}</style>

            {/* ── CONSOLIDATED HEADER & PROGRESS ── */}
            <ProgressBar
                currentStep={step}
                totalSteps={STEPS.length}
                navigate={navigate}
                mavenLogo={mavenLogo}
                stepLabel={stepLabel}
                onExit={handleExit}
            />

            {/* ── CONTENT ── */}
            <main style={{ maxWidth: 900, margin: '0 auto', padding: '32px 40px 120px' }}>
                {/* Breadcrumbs */}
                <div style={{
                    marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10,
                    fontSize: 13, fontWeight: 600, color: '#94A3B8'
                }}>
                    <Link to="/employer-login" style={{
                        color: '#64748B', textDecoration: 'none', transition: 'all 0.2s',
                        display: 'flex', alignItems: 'center', gap: 4
                    }}
                        onMouseEnter={e => e.currentTarget.style.color = '#002366'}
                        onMouseLeave={e => e.currentTarget.style.color = '#64748B'}
                    >
                        Employer
                    </Link>
                    <span style={{ color: '#CBD5E1', fontSize: 11 }}>▶</span>
                    <span style={{ color: '#0F172A', fontWeight: 800 }}>Job Post</span>
                </div>

                <div ref={contentRef}>
                    {step === 1 && <StepJobDetails data={formData} setData={updateData} onAiEnhance={handleAiEnhance} aiLoading={aiLoading} onUploadJd={handleUploadJd} />}
                    {step === 2 && <StepCandidatePreferences data={formData} setData={updateData} onSuggestSkills={handleSuggestSkills} skillSuggestions={skillSuggestions} skillSuggestLoading={skillSuggestLoading} />}
                    {step === 3 && <StepScreening data={formData} setData={updateData} />}
                    {step === 4 && <StepReview data={formData} />}
                </div>
                {aiError && (
                    <div style={{ maxWidth: 900, margin: '20px auto 0', padding: '12px 16px', borderRadius: 12, background: '#FEF2F2', border: '1px solid #FECACA', color: '#B91C1C', fontSize: 12.5, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <FiAlertCircle size={14} /> {aiError}
                    </div>
                )}

                {submitError && (
                    <div style={{ maxWidth: 900, margin: '20px auto 0', padding: '14px 18px', borderRadius: 16, background: '#FEE2E2', border: '1px solid #FECACA', color: '#B91C1C', fontWeight: 700 }}>
                        {submitError}
                    </div>
                )}
            </main>

            {/* ── STICKY FOOTER NAV ── */}
            <div style={{
                position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100,
                background: 'rgba(255,255,255,0.96)', backdropFilter: 'blur(16px)',
                borderTop: '1px solid #E2E8F0',
                boxShadow: '0 -8px 32px rgba(0,35,102,0.07)',
                padding: '16px 40px'
            }}>
                <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>

                    {/* Left: completion indicator */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                            width: 40, height: 40, borderRadius: 12,
                            background: `conic-gradient(#002366 ${(step / STEPS.length) * 360}deg, #E2E8F0 0deg)`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                            <div style={{
                                width: 28, height: 28, borderRadius: 8, background: '#fff',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: 11, fontWeight: 900, color: '#002366'
                            }}>
                                {Math.round((step / STEPS.length) * 100)}%
                            </div>
                        </div>
                        <div>
                            <div style={{ fontSize: 12.5, fontWeight: 800, color: '#0F172A' }}>
                                {step === STEPS.length ? 'Ready to launch!' : `Step ${step} of ${STEPS.length}`}
                            </div>
                            <div style={{ fontSize: 11.5, color: '#94A3B8', fontWeight: 600 }}>{stepLabel}</div>
                        </div>
                    </div>

                    {/* Right: nav buttons */}
                    <div style={{ display: 'flex', gap: 10 }}>
                        {step > 1 && (
                            <button onClick={goBack} style={{
                                display: 'flex', alignItems: 'center', gap: 8,
                                padding: '12px 22px', borderRadius: 14,
                                background: '#F1F5F9', border: '1.5px solid #E2E8F0',
                                color: '#002366', fontSize: 14, fontWeight: 700,
                                cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.18s'
                            }}
                                onMouseEnter={e => { e.currentTarget.style.background = '#EEF2FF'; e.currentTarget.style.borderColor = '#C7D7FF'; }}
                                onMouseLeave={e => { e.currentTarget.style.background = '#F1F5F9'; e.currentTarget.style.borderColor = '#E2E8F0'; }}
                            >
                                <FiArrowLeft size={16} /> Back
                            </button>
                        )}
                        {step < STEPS.length ? (
                            <button onClick={goNext} style={{
                                display: 'flex', alignItems: 'center', gap: 8,
                                padding: '12px 28px', borderRadius: 14, border: 'none',
                                background: 'linear-gradient(135deg, #001a50 0%, #0F3DB5 100%)',
                                color: '#fff', fontSize: 14, fontWeight: 700,
                                cursor: 'pointer', fontFamily: 'inherit',
                                boxShadow: '0 6px 20px rgba(0,35,102,0.3)',
                                transition: 'all 0.22s'
                            }}
                                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1.5px)'; e.currentTarget.style.boxShadow = '0 10px 28px rgba(0,35,102,0.42)'; }}
                                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,35,102,0.3)'; }}
                            >
                                Continue to {STEPS[step]?.label} <FiArrowRight size={16} />
                            </button>
                        ) : (
                            <button onClick={handleLaunch} disabled={submitting} style={{
                                display: 'flex', alignItems: 'center', gap: 9,
                                padding: '13px 32px', borderRadius: 14, border: 'none',
                                background: submitting ? '#A7F3D0' : 'linear-gradient(135deg, #65A30D 0%, #84CC16 100%)',
                                color: submitting ? '#064E3B' : '#fff', fontSize: 14.5, fontWeight: 800,
                                cursor: submitting ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
                                boxShadow: submitting ? 'none' : '0 6px 24px rgba(132,204,22,0.38)',
                                transition: 'all 0.22s', letterSpacing: '0.01em'
                            }}
                                onMouseEnter={e => {
                                    if (!submitting) {
                                        e.currentTarget.style.transform = 'translateY(-2px)';
                                        e.currentTarget.style.boxShadow = '0 12px 32px rgba(132,204,22,0.5)';
                                    }
                                }}
                                onMouseLeave={e => {
                                    if (!submitting) {
                                        e.currentTarget.style.transform = 'translateY(0)';
                                        e.currentTarget.style.boxShadow = '0 6px 24px rgba(132,204,22,0.38)';
                                    }
                                }}
                            >
                                <FiZap size={17} /> {submitting ? 'Posting job...' : 'Launch Job Campaign'}
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* ── VALIDATION MODAL ── */}
            {stepError && (
                <div ref={modalOverlayRef} onClick={dismissValidation} role="dialog" aria-modal="true" style={{
                    position: 'fixed', inset: 0, zIndex: 9999,
                    background: 'rgba(15,23,42,0.5)',
                    backdropFilter: 'blur(8px)',
                    WebkitBackdropFilter: 'blur(8px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: 24
                }}>
                    <div ref={modalRef} onClick={e => e.stopPropagation()} style={{
                        background: 'rgba(255,255,255,0.97)',
                        backdropFilter: 'blur(24px)',
                        WebkitBackdropFilter: 'blur(24px)',
                        borderRadius: 24,
                        border: '1px solid rgba(255,255,255,0.5)',
                        boxShadow: '0 32px 80px rgba(0,0,0,0.2), 0 0 0 1px rgba(255,255,255,0.1) inset',
                        maxWidth: 420, width: '100%',
                        padding: '40px 36px 32px',
                        textAlign: 'center'
                    }}>
                        <div style={{
                            width: 64, height: 64, borderRadius: '50%',
                            background: 'linear-gradient(135deg, #FEF2F2, #FEE2E2)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            margin: '0 auto 20px',
                            boxShadow: '0 8px 24px rgba(239,68,68,0.15)'
                        }}>
                            <FiAlertCircle size={30} color="#DC2626" />
                        </div>
                        <h3 style={{
                            margin: 0, fontSize: 20, fontWeight: 800, color: '#0F172A',
                            letterSpacing: '-0.02em', lineHeight: 1.3
                        }}>
                            Missing Required Field
                        </h3>
                        <p style={{
                            margin: '10px 0 28px', fontSize: 15, color: '#475569',
                            fontWeight: 500, lineHeight: 1.5
                        }}>
                            {stepError}
                        </p>
                        <button onClick={dismissValidation} style={{
                            display: 'inline-flex', alignItems: 'center', gap: 8,
                            padding: '12px 36px', borderRadius: 14, border: 'none',
                            background: 'linear-gradient(135deg, #001a50, #0F3DB5)',
                            color: '#fff', fontSize: 15, fontWeight: 700,
                            cursor: 'pointer', fontFamily: 'inherit',
                            boxShadow: '0 8px 24px rgba(0,35,102,0.3)',
                            transition: 'all 0.2s'
                        }}
                            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,35,102,0.4)'; }}
                            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,35,102,0.3)'; }}
                        >
                            Got it
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}