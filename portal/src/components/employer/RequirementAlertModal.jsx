import { useState, useEffect } from 'react';
import { FiX, FiBell, FiCheck, FiMail, FiSend } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../services/api';

export default function RequirementAlertModal({
  isOpen,
  onClose,
  requirement,
  onSaveAlerts,
  currentUser = null
}) {
  const [enabled, setEnabled] = useState(true);
  const [frequency, setFrequency] = useState('DAILY');
  const [emails, setEmails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testSentMsg, setTestSentMsg] = useState('');

  useEffect(() => {
    if (isOpen && requirement) {
      const alerts = requirement.alerts || {};
      setEnabled(alerts.enabled !== false);
      setFrequency(alerts.frequency || 'DAILY');
      setEmails(
        Array.isArray(alerts.recipients)
          ? alerts.recipients.join(', ')
          : (alerts.email || currentUser?.email || '')
      );
    }
  }, [isOpen, requirement, currentUser]);

  if (!isOpen || !requirement) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    const emailList = emails
      ? emails.split(',').map(m => m.trim()).filter(Boolean)
      : (currentUser?.email ? [currentUser.email] : []);

    try {
      await onSaveAlerts({
        alerts: {
          enabled,
          frequency,
          recipients: emailList
        }
      });
      onClose();
    } catch (err) {
      console.error('Failed to update alerts:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.5)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10003,
          padding: 16,
        }}
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 10 }}
          transition={{ duration: 0.2 }}
          onClick={(e) => e.stopPropagation()}
          style={{
            width: '100%',
            maxWidth: 480,
            background: '#ffffff',
            borderRadius: 18,
            boxShadow: '0 20px 50px rgba(0,0,0,0.2)',
            overflow: 'hidden',
            fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif"
          }}
        >
          {/* Header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '20px 24px',
            borderBottom: '1px solid #f1f5f9'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                background: '#e0f2fe',
                color: '#0284c7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <FiBell size={20} />
              </div>
              <div>
                <h3 style={{ fontSize: 17, fontWeight: 700, color: '#0f172a', margin: 0 }}>
                  Candidate Match Alerts
                </h3>
                <span style={{ fontSize: 12, color: '#64748b' }}>
                  {requirement.name}
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                border: 'none',
                background: '#f8fafc',
                color: '#64748b',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <FiX size={16} />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ padding: '20px 24px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px 16px',
              borderRadius: 12,
              background: enabled ? '#f0fdf4' : '#f8fafc',
              border: `1.5px solid ${enabled ? '#bbf7d0' : '#e2e8f0'}`,
              marginBottom: 18
            }}>
              <div>
                <span style={{ display: 'block', fontSize: 14, fontWeight: 700, color: '#0f172a' }}>
                  Email Notifications
                </span>
                <span style={{ fontSize: 12, color: '#64748b' }}>
                  Receive matches when new talent enters Resdex
                </span>
              </div>
              <label style={{ position: 'relative', display: 'inline-block', width: 44, height: 24 }}>
                <input
                  type="checkbox"
                  checked={enabled}
                  onChange={(e) => setEnabled(e.target.checked)}
                  style={{ opacity: 0, width: 0, height: 0 }}
                />
                <span style={{
                  position: 'absolute',
                  cursor: 'pointer',
                  inset: 0,
                  backgroundColor: enabled ? '#10b981' : '#cbd5e1',
                  borderRadius: 24,
                  transition: '0.2s'
                }}>
                  <span style={{
                    position: 'absolute',
                    height: 18,
                    width: 18,
                    left: enabled ? 23 : 3,
                    bottom: 3,
                    backgroundColor: 'white',
                    borderRadius: '50%',
                    transition: '0.2s'
                  }} />
                </span>
              </label>
            </div>

            {enabled && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 20 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 8 }}>
                    Delivery Frequency
                  </label>
                  <div style={{ display: 'flex', gap: 12 }}>
                    {[
                      { id: 'DAILY', label: 'Daily Digest', desc: 'Sent every morning' },
                      { id: 'WEEKLY', label: 'Weekly Summary', desc: 'Sent every Monday' }
                    ].map(f => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => setFrequency(f.id)}
                        style={{
                          flex: 1,
                          padding: '10px 12px',
                          borderRadius: 10,
                          border: frequency === f.id ? '2px solid #002366' : '1px solid #cbd5e1',
                          background: frequency === f.id ? '#eff6ff' : '#fff',
                          textAlign: 'left',
                          cursor: 'pointer'
                        }}
                      >
                        <div style={{ fontSize: 13, fontWeight: 700, color: frequency === f.id ? '#002366' : '#334155' }}>
                          {f.label}
                        </div>
                        <div style={{ fontSize: 11, color: '#64748b' }}>{f.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                    Recipient Emails (comma separated)
                  </label>
                  <div style={{ position: 'relative' }}>
                    <FiMail style={{ position: 'absolute', left: 12, top: 12, color: '#94a3b8' }} />
                    <input
                      type="text"
                      placeholder="e.g. recruiter@company.com"
                      value={emails}
                      onChange={(e) => setEmails(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 12px 10px 36px',
                        borderRadius: 8,
                        border: '1.5px solid #cbd5e1',
                        fontSize: 13,
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </div>
              </div>
            )}

            {testSentMsg && (
              <div style={{ padding: '8px 12px', background: '#ecfdf5', color: '#047857', borderRadius: 8, fontSize: 12, fontWeight: 600, marginBottom: 14 }}>
                {testSentMsg}
              </div>
            )}

            <div style={{ display: 'flex', gap: 10, justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f1f5f9', paddingTop: 16 }}>
              <div>
                <button
                  type="button"
                  disabled={isSendingTest}
                  onClick={async () => {
                    setIsSendingTest(true);
                    setTestSentMsg('');
                    try {
                      await api.post(`/company-panel/folders/${requirement._id}/test-alert`);
                      setTestSentMsg('✓ Test match alert email sent to your inbox!');
                    } catch (err) {
                      setTestSentMsg('Failed to send test email.');
                    } finally {
                      setIsSendingTest(false);
                    }
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '8px 14px',
                    borderRadius: 8,
                    border: '1px solid #bae6fd',
                    background: '#f0f9ff',
                    color: '#0284c7',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: isSendingTest ? 'not-allowed' : 'pointer'
                  }}
                  title="Send immediate test email to preview matches"
                >
                  <FiSend size={12} />
                  <span>{isSendingTest ? 'Sending Test...' : 'Send Test Alert'}</span>
                </button>
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  type="button"
                  onClick={onClose}
                  style={{
                    padding: '9px 16px',
                    borderRadius: 8,
                    border: '1px solid #cbd5e1',
                    background: '#fff',
                    color: '#475569',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{
                    padding: '9px 20px',
                    borderRadius: 8,
                    border: 'none',
                    background: '#002366',
                    color: '#fff',
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6
                  }}
                >
                  {isSubmitting ? 'Saving...' : 'Save Settings'}
                </button>
              </div>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
