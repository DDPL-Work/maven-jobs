import React, { useState, useEffect } from "react";
import {
  FiX,
  FiUsers,
  FiLock,
  FiBell,
  FiTrash2,
  FiCheckCircle,
  FiShield,
  FiMail,
  FiPhone,
} from "react-icons/fi";
import "./SettingsModal.css";

const SettingsModal = ({ isOpen, onClose, user }) => {
  const [activeTab, setActiveTab] = useState("account");
  const [email, setEmail] = useState(user?.email || "");
  const [phone, setPhone] = useState(user?.phone || "8126977256");
  const [privacySetting, setPrivacySetting] = useState("employers");
  const [notifications, setNotifications] = useState({
    jobAlerts: true,
    statusUpdates: true,
    directMessages: true,
    newsletter: false,
  });

  // Keep internal state updated if user changes
  useEffect(() => {
    if (user?.email) setEmail(user.email);
    if (user?.phone) setPhone(user.phone);
  }, [user]);

  // Close modal on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const toggleNotification = (key) => {
    setNotifications((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  return (
    <div
      className="pd-modal-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-modal-title"
    >
      <div
        className="pd-modal-box settings-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="settings-close-btn pd-modal-close"
          onClick={onClose}
          aria-label="Close Settings"
          title="Close Settings"
        >
          <FiX size={20} />
        </button>

        <div className="settings-layout">
          {/* Sidebar Navigation */}
          <div className="settings-sidebar">
            <h3 id="settings-modal-title">Settings</h3>
            <div className="settings-nav">
              <button
                type="button"
                className={`settings-nav-item ${activeTab === "account" ? "active" : ""}`}
                onClick={() => setActiveTab("account")}
              >
                <FiUsers /> <span>Account</span>
              </button>
              <button
                type="button"
                className={`settings-nav-item ${activeTab === "privacy" ? "active" : ""}`}
                onClick={() => setActiveTab("privacy")}
              >
                <FiLock /> <span>Privacy</span>
              </button>
              <button
                type="button"
                className={`settings-nav-item ${activeTab === "notifications" ? "active" : ""}`}
                onClick={() => setActiveTab("notifications")}
              >
                <FiBell /> <span>Notifications</span>
              </button>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="settings-main">
            {/* ── ACCOUNT TAB ── */}
            {activeTab === "account" && (
              <div className="settings-section">
                <h4>Account Settings</h4>

                <div className="settings-field">
                  <label htmlFor="settings-email">Email Address</label>
                  <div className="settings-input-group">
                    <input
                      id="settings-email"
                      type="email"
                      value={email}
                      readOnly
                      placeholder="Your email address"
                    />
                    <button type="button" className="settings-edit-btn">
                      Change
                    </button>
                  </div>
                  <div className="settings-badge-verified">
                    <FiCheckCircle size={13} />
                    <span>Primary Account Email</span>
                  </div>
                </div>

                <div className="settings-field">
                  <label htmlFor="settings-phone">Phone Number</label>
                  <div className="settings-input-group">
                    <input
                      id="settings-phone"
                      type="tel"
                      value={phone}
                      readOnly
                      placeholder="Your phone number"
                    />
                    <button type="button" className="settings-edit-btn">
                      Verify
                    </button>
                  </div>
                </div>

                <div className="settings-divider" />

                <div className="settings-danger-zone">
                  <h5>Danger Zone</h5>
                  <p>
                    Once you deactivate your account, your profile and application history will no longer be visible to employers.
                  </p>
                  <button
                    type="button"
                    className="settings-delete-btn"
                    onClick={() => {
                      if (window.confirm("Are you sure you want to deactivate your account?")) {
                        // Action can be plugged here
                      }
                    }}
                  >
                    <FiTrash2 /> Deactivate Account
                  </button>
                </div>
              </div>
            )}

            {/* ── PRIVACY TAB ── */}
            {activeTab === "privacy" && (
              <div className="settings-section">
                <h4>Privacy & Visibility</h4>

                <div className="settings-field">
                  <label>Profile Visibility</label>
                  <div className="settings-radio-group">
                    <label
                      className={`settings-radio-card ${privacySetting === "public" ? "active" : ""}`}
                    >
                      <input
                        type="radio"
                        name="privacy"
                        value="public"
                        checked={privacySetting === "public"}
                        onChange={() => setPrivacySetting("public")}
                      />
                      <div>
                        <div className="settings-radio-title">Public</div>
                        <div className="settings-radio-desc">
                          Anyone on the web can view your professional profile and portfolio.
                        </div>
                      </div>
                    </label>

                    <label
                      className={`settings-radio-card ${privacySetting === "employers" ? "active" : ""}`}
                    >
                      <input
                        type="radio"
                        name="privacy"
                        value="employers"
                        checked={privacySetting === "employers"}
                        onChange={() => setPrivacySetting("employers")}
                      />
                      <div>
                        <div className="settings-radio-title">Verified Employers Only</div>
                        <div className="settings-radio-desc">
                          Only vetted recruiters and hiring companies can see your full credentials.
                        </div>
                      </div>
                    </label>

                    <label
                      className={`settings-radio-card ${privacySetting === "private" ? "active" : ""}`}
                    >
                      <input
                        type="radio"
                        name="privacy"
                        value="private"
                        checked={privacySetting === "private"}
                        onChange={() => setPrivacySetting("private")}
                      />
                      <div>
                        <div className="settings-radio-title">Private</div>
                        <div className="settings-radio-desc">
                          Hide profile from all searches. Only accessible when you apply directly to a job.
                        </div>
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* ── NOTIFICATIONS TAB ── */}
            {activeTab === "notifications" && (
              <div className="settings-section">
                <h4>Notification Preferences</h4>

                <div className="settings-toggle-list">
                  <div className="settings-toggle-row">
                    <div>
                      <div className="settings-toggle-title">Job Recommendations</div>
                      <div className="settings-toggle-desc">
                        Receive instant alerts when jobs matching your profile are posted.
                      </div>
                    </div>
                    <label className="settings-switch">
                      <input
                        type="checkbox"
                        checked={notifications.jobAlerts}
                        onChange={() => toggleNotification("jobAlerts")}
                      />
                      <span className="settings-slider" />
                    </label>
                  </div>

                  <div className="settings-toggle-row">
                    <div>
                      <div className="settings-toggle-title">Application Status Updates</div>
                      <div className="settings-toggle-desc">
                        Get notified when a company reviews or updates your job applications.
                      </div>
                    </div>
                    <label className="settings-switch">
                      <input
                        type="checkbox"
                        checked={notifications.statusUpdates}
                        onChange={() => toggleNotification("statusUpdates")}
                      />
                      <span className="settings-slider" />
                    </label>
                  </div>

                  <div className="settings-toggle-row">
                    <div>
                      <div className="settings-toggle-title">Direct Messages & Chats</div>
                      <div className="settings-toggle-desc">
                        Receive real-time notifications for messages and interview requests.
                      </div>
                    </div>
                    <label className="settings-switch">
                      <input
                        type="checkbox"
                        checked={notifications.directMessages}
                        onChange={() => toggleNotification("directMessages")}
                      />
                      <span className="settings-slider" />
                    </label>
                  </div>

                  <div className="settings-toggle-row">
                    <div>
                      <div className="settings-toggle-title">Maven Career Insights</div>
                      <div className="settings-toggle-desc">
                        Occasional weekly digests, salary benchmarks, and career guidance.
                      </div>
                    </div>
                    <label className="settings-switch">
                      <input
                        type="checkbox"
                        checked={notifications.newsletter}
                        onChange={() => toggleNotification("newsletter")}
                      />
                      <span className="settings-slider" />
                    </label>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
