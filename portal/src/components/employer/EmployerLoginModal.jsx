import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiMail, FiLock, FiX, FiEye, FiEyeOff, FiArrowRight } from 'react-icons/fi';
import authService from '../../services/authService';

const overlay = {
  position: 'fixed', inset: 0, zIndex: 9999,
  background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(8px)',
  display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
};

const card = {
  background: '#fff', borderRadius: 24, maxWidth: 420, width: '100%',
  padding: '40px 36px 32px', boxShadow: '0 32px 80px rgba(0,0,0,0.25)',
  position: 'relative',
};

export default function EmployerLoginModal({ isOpen, onClose, onLoginSuccess }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) { setError('Please enter both email and password.'); return; }
    setLoading(true); setError('');
    try {
      const response = await authService.employerLogin(email, password);
      if (response?.token) {
        localStorage.setItem('employerToken', response.token);
        const employerUser = {
          ...(response.user || {}),
          companyName: response?.company?.name || response?.user?.companyName || '',
          logoUrl: response?.company?.logoUrl || response?.user?.logoUrl || '',
          coverImageUrl: response?.company?.coverImageUrl || response?.user?.coverImageUrl || '',
        };
        localStorage.setItem('employerUser', JSON.stringify(employerUser));
        onClose?.();
        onLoginSuccess?.(response);
      }
    } catch (err) {
      setError(err?.message || 'Invalid employer credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={overlay} onClick={onClose}>
      <div style={card} onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} style={{
          position: 'absolute', top: 16, right: 16,
          background: '#F1F5F9', border: 'none', borderRadius: 10,
          width: 36, height: 36, display: 'flex', alignItems: 'center',
          justifyContent: 'center', cursor: 'pointer', color: '#64748B'
        }}>
          <FiX size={18} />
        </button>

        <h2 style={{ margin: '0 0 4px', fontSize: 22, fontWeight: 800, color: '#0F172A' }}>Employer Login</h2>
        <p style={{ margin: '0 0 28px', fontSize: 14, color: '#64748B', fontWeight: 500 }}>Sign in to your employer account</p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: '#1E293B', display: 'block', marginBottom: 6 }}>Work Email</label>
            <div style={{ position: 'relative' }}>
              <FiMail size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
              <input type="email" placeholder="Enter registered email" value={email}
                onChange={(e) => { setEmail(e.target.value); setError(''); }}
                style={{ width: '100%', padding: '12px 14px 12px 42px', fontSize: 14, fontWeight: 500,
                  border: '1.5px solid #E2E8F0', borderRadius: 12, outline: 'none', fontFamily: 'inherit',
                  boxSizing: 'border-box', transition: 'border-color 0.18s' }}
                onFocus={(e) => e.target.style.borderColor = '#002366'}
                onBlur={(e) => e.target.style.borderColor = '#E2E8F0'}
              />
            </div>
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: '#1E293B', display: 'block', marginBottom: 6 }}>Password</label>
            <div style={{ position: 'relative' }}>
              <FiLock size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
              <input type={showPassword ? 'text' : 'password'} placeholder="Enter password" value={password}
                onChange={(e) => { setPassword(e.target.value); setError(''); }}
                style={{ width: '100%', padding: '12px 44px 12px 42px', fontSize: 14, fontWeight: 500,
                  border: '1.5px solid #E2E8F0', borderRadius: 12, outline: 'none', fontFamily: 'inherit',
                  boxSizing: 'border-box', transition: 'border-color 0.18s' }}
                onFocus={(e) => e.target.style.borderColor = '#002366'}
                onBlur={(e) => e.target.style.borderColor = '#E2E8F0'}
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: 0 }}>
                {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
              </button>
            </div>
          </div>

          {error && <div style={{ padding: '10px 14px', borderRadius: 10, background: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626', fontSize: 13, fontWeight: 600 }}>{error}</div>}

          <button type="submit" disabled={loading} style={{
            padding: '13px 24px', borderRadius: 14, border: 'none',
            background: loading ? '#CBD5E1' : 'linear-gradient(135deg, #001a50, #0F3DB5)',
            color: '#fff', fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
            fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            boxShadow: loading ? 'none' : '0 6px 20px rgba(0,35,102,0.3)',
          }}>
            {loading ? 'Signing in...' : 'Sign in'} <FiArrowRight size={18} />
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: '#64748B', fontWeight: 500 }}>
          Don't have an account?{' '}
          <button type="button" onClick={() => navigate('/employer-login')}
            style={{ background: 'none', border: 'none', color: '#002366', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', padding: 0 }}>
            Create one
          </button>
        </div>
      </div>
    </div>
  );
}