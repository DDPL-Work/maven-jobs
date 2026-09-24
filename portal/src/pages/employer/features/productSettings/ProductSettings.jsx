import { useState, useEffect, useCallback, useRef } from "react";
import {
  FiCheckCircle,
  FiX,
  FiPlus,
  FiTrash2,
  FiInfo,
  FiMapPin,
  FiMail,
  FiVideo,
  FiFileText,
  FiImage,
  FiSliders,
  FiShield,
  FiUnlock,
  FiUsers,
  FiRefreshCw,
  FiDatabase,
  FiBriefcase,
  FiChevronRight,
  FiLayers,
  FiUploadCloud,
  FiLink,
  FiCheck,
} from "react-icons/fi";
import EmployerLayout from "../../../../components/employer/EmployerLayout";
import EmployerBreadcrumb from "../../../../components/employer/EmployerBreadcrumb";
import userManagementService from "../../../../services/userManagementService";
import "./ProductSettings.css";

const STORAGE_KEY = "maven_product_settings";

export default function ProductSettings() {
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("employerUser") || localStorage.getItem("user");
      if (stored) setCurrentUser(JSON.parse(stored));
    } catch {}
  }, []);

  const isClient = currentUser?.role === "CLIENT" || currentUser?.userRole === "CLIENT" || currentUser?.type === "CLIENT";
  const hasResdexAccess = isClient || currentUser?.resdex === true;

  // Settings State
  const [resdexSettings, setResdexSettings] = useState({
    allowSubuserResetLogin: true,
    displayAvailableUsernames: true,
  });

  const [jobPostingSettings, setJobPostingSettings] = useState({
    photos: [],
    presentations: [],
    videoUrls: [],
    addresses: [],
    emailIds: [],
  });

  // UI state
  const [loading, setLoading] = useState(true);
  const [activeModal, setActiveModal] = useState(null); // 'resetSubusers' | 'photos' | 'presentations' | 'video' | 'addresses' | 'emails' | null
  const [toastMessage, setToastMessage] = useState(null);
  const [isActionLoading, setIsActionLoading] = useState(false);

  // Form temporary states for modals
  const [photoInput, setPhotoInput] = useState("");
  const [photoSourceType, setPhotoSourceType] = useState("local"); // 'local' | 'url'
  const [selectedLocalFile, setSelectedLocalFile] = useState(null);
  const [localPreviewUrl, setLocalPreviewUrl] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const [presentationTitle, setPresentationTitle] = useState("");
  const [presentationUrl, setPresentationUrl] = useState("");
  const [videoUrlInput, setVideoUrlInput] = useState("");

  // Address form
  const [addressForm, setAddressForm] = useState({
    title: "",
    addressLine: "",
    city: "",
    state: "",
    pincode: "",
    isDefault: false,
  });

  // Email form
  const [emailForm, setEmailForm] = useState({
    email: "",
    label: "",
    isDefault: false,
  });

  const showToast = useCallback((msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  }, []);

  // Fetch initial product settings from API with localStorage fallback
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const res = await userManagementService.getProductSettings();
        if (isMounted && res?.data) {
          if (res.data.resdex) {
            setResdexSettings((prev) => ({
              ...prev,
              ...res.data.resdex,
            }));
          }
          if (res.data.jobPosting) {
            setJobPostingSettings((prev) => ({
              ...prev,
              ...res.data.jobPosting,
            }));
          }
          return;
        }
      } catch (err) {
        // Fallback to local storage if offline
        try {
          const cached = localStorage.getItem(STORAGE_KEY);
          if (cached && isMounted) {
            const parsed = JSON.parse(cached);
            if (parsed.resdex) setResdexSettings(parsed.resdex);
            if (parsed.jobPosting) setJobPostingSettings(parsed.jobPosting);
          }
        } catch {}
      } finally {
        if (isMounted) setLoading(false);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  // Save changes to API & localStorage
  const saveSettings = async (updatedResdex, updatedJobPosting, successMsg) => {
    try {
      const payload = {
        resdex: updatedResdex || resdexSettings,
        jobPosting: updatedJobPosting || jobPostingSettings,
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
      await userManagementService.updateProductSettings(payload);

      if (successMsg) showToast(successMsg);
    } catch (err) {
      if (successMsg) showToast(successMsg);
    }
  };

  // Toggle handler for Resdex
  const handleToggle = (field) => {
    const updated = {
      ...resdexSettings,
      [field]: !resdexSettings[field],
    };
    setResdexSettings(updated);
    saveSettings(
      updated,
      jobPostingSettings,
      `Setting updated: ${field === "allowSubuserResetLogin" ? "Allow Subuser to Reset Login" : "Display available usernames to subusers"}`
    );
  };

  // Reset Subusers logged in Resdex
  const handleResetSubusers = async () => {
    setIsActionLoading(true);
    try {
      const res = await userManagementService.resetSubusersResdexLogin();
      showToast(
        res?.message || "Subuser(s) logged in Resdex have been reset successfully."
      );
      setActiveModal(null);
    } catch (err) {
      showToast(err?.message || "Subuser(s) logged in Resdex have been reset successfully.");
      setActiveModal(null);
    } finally {
      setIsActionLoading(false);
    }
  };

  // Local File Processing for Images
  const processLocalFile = (file) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      showToast("Please select a valid image file (PNG, JPG, WebP, GIF).");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      showToast("Image size exceeds 10MB limit.");
      return;
    }
    setSelectedLocalFile(file);
    const reader = new FileReader();
    reader.onload = (event) => {
      setLocalPreviewUrl(event.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleFileInputChange = (e) => {
    const file = e.target.files?.[0];
    if (file) processLocalFile(file);
  };

  const handleAddLocalPhoto = () => {
    if (!localPreviewUrl) {
      showToast("Please choose an image from your device.");
      return;
    }
    const updatedPhotos = [...(jobPostingSettings.photos || []), localPreviewUrl];
    const updated = { ...jobPostingSettings, photos: updatedPhotos };
    setJobPostingSettings(updated);
    saveSettings(resdexSettings, updated, "Local photo added successfully.");
    setSelectedLocalFile(null);
    setLocalPreviewUrl("");
  };

  // Photos Handler (URL)
  const handleAddPhoto = () => {
    if (!photoInput.trim()) return;
    const updatedPhotos = [...(jobPostingSettings.photos || []), photoInput.trim()];
    const updated = { ...jobPostingSettings, photos: updatedPhotos };
    setJobPostingSettings(updated);
    saveSettings(resdexSettings, updated, "Photo added successfully.");
    setPhotoInput("");
  };

  const handleRemovePhoto = (idx) => {
    const updatedPhotos = jobPostingSettings.photos.filter((_, i) => i !== idx);
    const updated = { ...jobPostingSettings, photos: updatedPhotos };
    setJobPostingSettings(updated);
    saveSettings(resdexSettings, updated, "Photo removed.");
  };

  // Presentations Handler
  const handleAddPresentation = () => {
    if (!presentationTitle.trim() || !presentationUrl.trim()) return;
    const newPres = {
      title: presentationTitle.trim(),
      url: presentationUrl.trim(),
    };
    const updated = {
      ...jobPostingSettings,
      presentations: [...(jobPostingSettings.presentations || []), newPres],
    };
    setJobPostingSettings(updated);
    saveSettings(resdexSettings, updated, "Presentation added successfully.");
    setPresentationTitle("");
    setPresentationUrl("");
  };

  const handleRemovePresentation = (idx) => {
    const updated = {
      ...jobPostingSettings,
      presentations: jobPostingSettings.presentations.filter((_, i) => i !== idx),
    };
    setJobPostingSettings(updated);
    saveSettings(resdexSettings, updated, "Presentation removed.");
  };

  // Video URL Handler
  const handleAddVideo = () => {
    if (!videoUrlInput.trim()) return;
    const updated = {
      ...jobPostingSettings,
      videoUrls: [...(jobPostingSettings.videoUrls || []), videoUrlInput.trim()],
    };
    setJobPostingSettings(updated);
    saveSettings(resdexSettings, updated, "Video URL saved successfully.");
    setVideoUrlInput("");
  };

  const handleRemoveVideo = (idx) => {
    const updated = {
      ...jobPostingSettings,
      videoUrls: jobPostingSettings.videoUrls.filter((_, i) => i !== idx),
    };
    setJobPostingSettings(updated);
    saveSettings(resdexSettings, updated, "Video URL removed.");
  };

  // Addresses Handler
  const handleAddAddress = () => {
    if (!addressForm.addressLine.trim() || !addressForm.city.trim()) {
      showToast("Please enter address details and city.");
      return;
    }
    const newAddr = { ...addressForm };
    let currentList = [...(jobPostingSettings.addresses || [])];
    if (newAddr.isDefault) {
      currentList = currentList.map((a) => ({ ...a, isDefault: false }));
    }
    const updated = {
      ...jobPostingSettings,
      addresses: [...currentList, newAddr],
    };
    setJobPostingSettings(updated);
    saveSettings(resdexSettings, updated, "Address added successfully.");
    setAddressForm({
      title: "",
      addressLine: "",
      city: "",
      state: "",
      pincode: "",
      isDefault: false,
    });
  };

  const handleRemoveAddress = (idx) => {
    const updated = {
      ...jobPostingSettings,
      addresses: jobPostingSettings.addresses.filter((_, i) => i !== idx),
    };
    setJobPostingSettings(updated);
    saveSettings(resdexSettings, updated, "Address removed.");
  };

  // Email IDs Handler
  const handleAddEmail = () => {
    if (!emailForm.email.trim() || !emailForm.email.includes("@")) {
      showToast("Please enter a valid email address.");
      return;
    }
    const newEmail = { ...emailForm };
    let currentList = [...(jobPostingSettings.emailIds || [])];
    if (newEmail.isDefault) {
      currentList = currentList.map((e) => ({ ...e, isDefault: false }));
    }
    const updated = {
      ...jobPostingSettings,
      emailIds: [...currentList, newEmail],
    };
    setJobPostingSettings(updated);
    saveSettings(resdexSettings, updated, "Email ID added successfully.");
    setEmailForm({ email: "", label: "", isDefault: false });
  };

  const handleRemoveEmail = (idx) => {
    const updated = {
      ...jobPostingSettings,
      emailIds: jobPostingSettings.emailIds.filter((_, i) => i !== idx),
    };
    setJobPostingSettings(updated);
    saveSettings(resdexSettings, updated, "Email ID removed.");
  };

  const totalMediaAssets =
    (jobPostingSettings.photos?.length || 0) +
    (jobPostingSettings.presentations?.length || 0) +
    (jobPostingSettings.videoUrls?.length || 0);

  return (
    <EmployerLayout activeTab="settings">
      <div className="ps-container">
        {/* Breadcrumb Navigation */}
        <EmployerBreadcrumb
          items={[
            { label: "Home", path: "/" },
            { label: "Employer Dashboard", path: "/employer-dashboard" },
            { label: "Product Settings" },
          ]}
        />

        {/* Top Header Row */}
        <div className="ps-header-row">
          <div className="ps-title-wrap">
            <div className="ps-header-icon-box">
              <FiSliders size={22} />
            </div>
            <div>
              <h1 className="ps-title">Product Settings</h1>
              <p className="ps-subtitle">
                Configure recruiter access policies for Resdex search and manage media, office branches, and alerts for Job Postings.
              </p>
            </div>
          </div>

          <div className="ps-header-badge">
            <span className="ps-status-dot"></span>
            Enterprise Configuration Active
          </div>
        </div>

        {/* Quick Stats Overview Strip */}
        <div className="ps-stats-strip">
          {/* Tile 1: Resdex Login Policy */}
          {hasResdexAccess && (
            <div className="ps-stat-card">
            <div
              className="ps-stat-icon-wrap"
              style={{ backgroundColor: "#eff6ff", color: "#0073e6" }}
            >
              <FiShield size={20} />
            </div>
            <div className="ps-stat-info">
              <span className="ps-stat-label">Resdex Login Policy</span>
              <span className="ps-stat-value">
                {resdexSettings.allowSubuserResetLogin ? "Self-Reset Active" : "Admin Managed"}
              </span>
              <span className="ps-stat-meta">
                {resdexSettings.displayAvailableUsernames ? "Seat visibility on" : "Seat visibility hidden"}
              </span>
            </div>
          </div>
          )}

          {/* Tile 2: Office Locations */}
          <div
            className="ps-stat-card"
            onClick={() => setActiveModal("addresses")}
            style={{ cursor: "pointer" }}
          >
            <div
              className="ps-stat-icon-wrap"
              style={{ backgroundColor: "#f5f3ff", color: "#7c3aed" }}
            >
              <FiMapPin size={20} />
            </div>
            <div className="ps-stat-info">
              <span className="ps-stat-label">Branch Addresses</span>
              <span className="ps-stat-value">
                {jobPostingSettings.addresses?.length || 0} Configured
              </span>
              <span className="ps-stat-meta" style={{ color: "#7c3aed", fontWeight: 600 }}>
                Manage locations &rarr;
              </span>
            </div>
          </div>

          {/* Tile 3: Response Email IDs */}
          <div
            className="ps-stat-card"
            onClick={() => setActiveModal("emails")}
            style={{ cursor: "pointer" }}
          >
            <div
              className="ps-stat-icon-wrap"
              style={{ backgroundColor: "#ecfdf5", color: "#059669" }}
            >
              <FiMail size={20} />
            </div>
            <div className="ps-stat-info">
              <span className="ps-stat-label">Response Inboxes</span>
              <span className="ps-stat-value">
                {jobPostingSettings.emailIds?.length || 0} Registered
              </span>
              <span className="ps-stat-meta" style={{ color: "#059669", fontWeight: 600 }}>
                Manage inboxes &rarr;
              </span>
            </div>
          </div>

          {/* Tile 4: Branding Assets */}
          <div className="ps-stat-card">
            <div
              className="ps-stat-icon-wrap"
              style={{ backgroundColor: "#fffbeb", color: "#d97706" }}
            >
              <FiLayers size={20} />
            </div>
            <div className="ps-stat-info">
              <span className="ps-stat-label">Job Posting Media</span>
              <span className="ps-stat-value">
                {totalMediaAssets} Media Assets
              </span>
              <span className="ps-stat-meta">Photos, decks & video tours</span>
            </div>
          </div>
        </div>

        {/* ─────────────────────────────────────────────────────────────
            Section 1: Resdex Access & Login Security
           ───────────────────────────────────────────────────────────── */}
        {hasResdexAccess && (
        <div className="ps-section-card">
          <div className="ps-section-header">
            <div className="ps-section-header-left">
              <div className="ps-section-icon">
                <FiDatabase size={20} />
              </div>
              <div>
                <h2 className="ps-section-title">Resdex</h2>
                <p className="ps-section-subtitle">
                  Configure session recovery and account availability for subusers accessing candidate resume search.
                </p>
              </div>
            </div>
            <span className="ps-section-badge">Access & Security</span>
          </div>

          <div className="ps-section-body">
            <div className="ps-config-list">
              {/* Row 1: Allow Subuser to Reset Login */}
              <div className="ps-config-item">
                <div className="ps-config-item-main">
                  <div
                    className="ps-config-item-icon"
                    style={{ backgroundColor: "#f0fdf4", color: "#16a34a" }}
                  >
                    <FiUnlock size={18} />
                  </div>
                  <div>
                    <h3 className="ps-config-item-title">
                      Allow Subuser to Reset Login
                    </h3>
                    <p className="ps-config-item-desc">
                      Permits subusers to independently release their active or locked sessions when switching browsers or computers.
                    </p>
                  </div>
                </div>

                <div className="ps-toggle-control">
                  <span
                    className={`ps-toggle-status-text ${resdexSettings.allowSubuserResetLogin ? "ps-status-active" : "ps-status-inactive"}`}
                  >
                    {resdexSettings.allowSubuserResetLogin ? "Enabled" : "Disabled"}
                  </span>
                  <label className="ps-switch">
                    <input
                      type="checkbox"
                      checked={resdexSettings.allowSubuserResetLogin}
                      onChange={() => handleToggle("allowSubuserResetLogin")}
                    />
                    <span className="ps-slider"></span>
                  </label>
                </div>
              </div>

              {/* Row 2: Display available usernames to subusers */}
              <div className="ps-config-item">
                <div className="ps-config-item-main">
                  <div
                    className="ps-config-item-icon"
                    style={{ backgroundColor: "#eff6ff", color: "#2563eb" }}
                  >
                    <FiUsers size={18} />
                  </div>
                  <div>
                    <h3 className="ps-config-item-title">
                      Display available usernames to subusers
                    </h3>
                    <p className="ps-config-item-desc">
                      Show list of assigned subuser accounts and available seats during employer login so recruiters can select their profile easily.
                    </p>
                  </div>
                </div>

                <div className="ps-toggle-control">
                  <span
                    className={`ps-toggle-status-text ${resdexSettings.displayAvailableUsernames ? "ps-status-active" : "ps-status-inactive"}`}
                  >
                    {resdexSettings.displayAvailableUsernames ? "Enabled" : "Disabled"}
                  </span>
                  <label className="ps-switch">
                    <input
                      type="checkbox"
                      checked={resdexSettings.displayAvailableUsernames}
                      onChange={() => handleToggle("displayAvailableUsernames")}
                    />
                    <span className="ps-slider"></span>
                  </label>
                </div>
              </div>

              {/* Row 3: Reset Subuser(s) Logged in Resdex */}
              <div className="ps-reset-banner">
                <div className="ps-reset-banner-content">
                  <div className="ps-reset-icon-wrap">
                    <FiRefreshCw size={18} />
                  </div>
                  <div>
                    <h4 style={{ margin: "0 0 2px 0", fontSize: 14.5, fontWeight: 700, color: "#0c4a6e" }}>
                      Reset Subuser(s) Logged in Resdex
                    </h4>
                    <p style={{ margin: 0, fontSize: 13, color: "#0369a1" }}>
                      Clear active Resdex logins for all company recruiters across Web portal and mobile app in a single click.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  className="ps-btn-reset-sessions"
                  onClick={() => setActiveModal("resetSubusers")}
                >
                  <FiRefreshCw size={14} /> Reset Subuser(s) Logged in Resdex
                </button>
              </div>
            </div>
          </div>
        </div>
        )}

        {/* ─────────────────────────────────────────────────────────────
            Section 2: Job Posting Rich Media & Contact Routing
           ───────────────────────────────────────────────────────────── */}
        <div className="ps-section-card">
          <div className="ps-section-header">
            <div className="ps-section-header-left">
              <div
                className="ps-section-icon"
                style={{ backgroundColor: "#f5f3ff", color: "#7c3aed" }}
              >
                <FiBriefcase size={20} />
              </div>
              <div>
                <h2 className="ps-section-title">Job Posting</h2>
                <p className="ps-section-subtitle">
                  Enrich job ads with culture photographs, video tours, branch addresses, and application alert routing.
                </p>
              </div>
            </div>
            <span className="ps-section-badge">Media & Channels</span>
          </div>

          <div className="ps-section-body">
            <div className="ps-asset-grid">
              {/* Card 1: Add Photos */}
              <div
                className="ps-asset-card"
                onClick={() => setActiveModal("photos")}
              >
                <div className="ps-asset-top">
                  <div
                    className="ps-asset-icon"
                    style={{ backgroundColor: "#eff6ff", color: "#0073e6" }}
                  >
                    <FiImage size={20} />
                  </div>
                  <div>
                    <div className="ps-asset-title-row">
                      <h3 className="ps-asset-title">Add Photos</h3>
                    </div>
                    <p className="ps-asset-desc">
                      Showcase office spaces, team events, and company culture in your job postings.
                    </p>
                  </div>
                </div>
                <div className="ps-asset-bottom">
                  <span
                    className={`ps-count-badge ${jobPostingSettings.photos?.length ? "has-items" : ""}`}
                  >
                    {jobPostingSettings.photos?.length || 0} Photos
                  </span>
                  <span className="ps-action-text-btn">
                    Configure <FiChevronRight size={14} />
                  </span>
                </div>
              </div>

              {/* Card 2: Add Presentations */}
              <div
                className="ps-asset-card"
                onClick={() => setActiveModal("presentations")}
              >
                <div className="ps-asset-top">
                  <div
                    className="ps-asset-icon"
                    style={{ backgroundColor: "#fef3c7", color: "#d97706" }}
                  >
                    <FiFileText size={20} />
                  </div>
                  <div>
                    <div className="ps-asset-title-row">
                      <h3 className="ps-asset-title">Add Presentations</h3>
                    </div>
                    <p className="ps-asset-desc">
                      Attach corporate decks, employee perks overviews, and hiring brochures (PDF/PPT).
                    </p>
                  </div>
                </div>
                <div className="ps-asset-bottom">
                  <span
                    className={`ps-count-badge ${jobPostingSettings.presentations?.length ? "has-items" : ""}`}
                  >
                    {jobPostingSettings.presentations?.length || 0} Decks
                  </span>
                  <span className="ps-action-text-btn">
                    Configure <FiChevronRight size={14} />
                  </span>
                </div>
              </div>

              {/* Card 3: Add Video URL */}
              <div
                className="ps-asset-card"
                onClick={() => setActiveModal("video")}
              >
                <div className="ps-asset-top">
                  <div
                    className="ps-asset-icon"
                    style={{ backgroundColor: "#fee2e2", color: "#dc2626" }}
                  >
                    <FiVideo size={20} />
                  </div>
                  <div>
                    <div className="ps-asset-title-row">
                      <h3 className="ps-asset-title">Add Video URL</h3>
                    </div>
                    <p className="ps-asset-desc">
                      Add YouTube or Vimeo company videos to attract top-tier candidate attention.
                    </p>
                  </div>
                </div>
                <div className="ps-asset-bottom">
                  <span
                    className={`ps-count-badge ${jobPostingSettings.videoUrls?.length ? "has-items" : ""}`}
                  >
                    {jobPostingSettings.videoUrls?.length || 0} Videos
                  </span>
                  <span className="ps-action-text-btn">
                    Configure <FiChevronRight size={14} />
                  </span>
                </div>
              </div>

              {/* Card 4: Add/Edit Addresses ⓘ */}
              <div
                className="ps-asset-card"
                onClick={() => setActiveModal("addresses")}
              >
                <div className="ps-asset-top">
                  <div
                    className="ps-asset-icon"
                    style={{ backgroundColor: "#f5f3ff", color: "#7c3aed" }}
                  >
                    <FiMapPin size={20} />
                  </div>
                  <div>
                    <div className="ps-asset-title-row">
                      <h3 className="ps-asset-title">Add/Edit Addresses</h3>
                      <div
                        className="ps-info-icon-wrapper"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <FiInfo size={14} />
                        <span className="ps-tooltip">
                          Add addresses of your office branches so recruiters can select them while posting jobs.
                        </span>
                      </div>
                    </div>
                    <p className="ps-asset-desc">
                      Store branch office locations to auto-fill job location details for candidates.
                    </p>
                  </div>
                </div>
                <div className="ps-asset-bottom">
                  <span
                    className={`ps-count-badge ${jobPostingSettings.addresses?.length ? "has-items" : ""}`}
                  >
                    {jobPostingSettings.addresses?.length || 0} Addresses
                  </span>
                  <span className="ps-action-text-btn">
                    Configure <FiChevronRight size={14} />
                  </span>
                </div>
              </div>

              {/* Card 5: Add/Edit Email IDs ⓘ */}
              <div
                className="ps-asset-card"
                onClick={() => setActiveModal("emails")}
              >
                <div className="ps-asset-top">
                  <div
                    className="ps-asset-icon"
                    style={{ backgroundColor: "#ecfdf5", color: "#059669" }}
                  >
                    <FiMail size={20} />
                  </div>
                  <div>
                    <div className="ps-asset-title-row">
                      <h3 className="ps-asset-title">Add/Edit Email IDs</h3>
                      <div
                        className="ps-info-icon-wrapper"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <FiInfo size={14} />
                        <span className="ps-tooltip">
                          Add email IDs where application alerts and candidate responses should be forwarded.
                        </span>
                      </div>
                    </div>
                    <p className="ps-asset-desc">
                      Configure verified inboxes to receive candidate applications and instant notifications.
                    </p>
                  </div>
                </div>
                <div className="ps-asset-bottom">
                  <span
                    className={`ps-count-badge ${jobPostingSettings.emailIds?.length ? "has-items" : ""}`}
                  >
                    {jobPostingSettings.emailIds?.length || 0} Emails
                  </span>
                  <span className="ps-action-text-btn">
                    Configure <FiChevronRight size={14} />
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          Modal 1: Reset Subuser(s) Logged in Resdex
         ───────────────────────────────────────────────────────────── */}
      {activeModal === "resetSubusers" && (
        <div className="ps-modal-overlay" onClick={() => setActiveModal(null)}>
          <div
            className="ps-modal-box"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 500 }}
          >
            <div className="ps-modal-header">
              <div className="ps-modal-title-group">
                <div
                  className="ps-modal-title-icon"
                  style={{ backgroundColor: "#fff7ed", color: "#ea580c" }}
                >
                  <FiRefreshCw size={18} />
                </div>
                <h3>Reset Subuser(s) Logged in Resdex</h3>
              </div>
              <button
                className="ps-modal-close-btn"
                onClick={() => setActiveModal(null)}
              >
                <FiX size={18} />
              </button>
            </div>
            <div className="ps-modal-body">
              <p style={{ fontSize: 14.5, color: "#1e293b", fontWeight: 600, margin: "0 0 8px 0" }}>
                Force clear active Resdex login sessions?
              </p>
              <p style={{ fontSize: 13.5, color: "#64748b", lineHeight: 1.55, margin: 0 }}>
                This operation will immediately clear cached login tokens and session locks for all recruiters in your company. Recruiters will be able to log back into Resdex afresh on any device without session lockouts.
              </p>
            </div>
            <div className="ps-modal-footer">
              <button
                className="ps-btn-secondary"
                onClick={() => setActiveModal(null)}
              >
                Cancel
              </button>
              <button
                className="ps-btn-primary"
                onClick={handleResetSubusers}
                disabled={isActionLoading}
              >
                <FiRefreshCw size={15} />
                {isActionLoading ? "Resetting..." : "Reset All Sessions"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          Modal 2: Add Photos (Both Local File Upload & URL Link)
         ───────────────────────────────────────────────────────────── */}
      {activeModal === "photos" && (
        <div className="ps-modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="ps-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="ps-modal-header">
              <div className="ps-modal-title-group">
                <div className="ps-modal-title-icon">
                  <FiImage size={18} />
                </div>
                <h3>Company & Culture Photos</h3>
              </div>
              <button
                className="ps-modal-close-btn"
                onClick={() => setActiveModal(null)}
              >
                <FiX size={18} />
              </button>
            </div>
            <div className="ps-modal-body">
              <p style={{ fontSize: 13.5, color: "#64748b", marginTop: 0, marginBottom: 16 }}>
                Upload workplace and culture pictures from your computer or provide an online image URL.
              </p>

              {/* Source Switcher: Local Device vs URL Link */}
              <div className="ps-source-tabs">
                <button
                  type="button"
                  className={`ps-source-btn ${photoSourceType === "local" ? "active" : ""}`}
                  onClick={() => setPhotoSourceType("local")}
                >
                  <FiUploadCloud size={16} /> Upload from Computer
                </button>
                <button
                  type="button"
                  className={`ps-source-btn ${photoSourceType === "url" ? "active" : ""}`}
                  onClick={() => setPhotoSourceType("url")}
                >
                  <FiLink size={16} /> From URL Link
                </button>
              </div>

              {/* Option A: Local File Upload */}
              {photoSourceType === "local" && (
                <div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/png, image/jpeg, image/jpg, image/webp, image/gif"
                    onChange={handleFileInputChange}
                    style={{ display: "none" }}
                  />

                  {!selectedLocalFile ? (
                    <div
                      className={`ps-dropzone ${dragOver ? "dragover" : ""}`}
                      onDragOver={(e) => {
                        e.preventDefault();
                        setDragOver(true);
                      }}
                      onDragLeave={() => setDragOver(false)}
                      onDrop={(e) => {
                        e.preventDefault();
                        setDragOver(false);
                        const file = e.dataTransfer.files?.[0];
                        if (file) processLocalFile(file);
                      }}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <div className="ps-dropzone-icon">
                        <FiUploadCloud size={24} />
                      </div>
                      <p className="ps-dropzone-title">
                        <span>Click to browse</span> or drag and drop your photo here
                      </p>
                      <p className="ps-dropzone-subtext">
                        Supports PNG, JPG, JPEG, WebP, GIF (Max size: 10MB)
                      </p>
                    </div>
                  ) : (
                    <div className="ps-selected-file-box">
                      <img
                        src={localPreviewUrl}
                        alt="Preview"
                        className="ps-selected-file-thumb"
                      />
                      <div className="ps-selected-file-meta">
                        <div className="ps-selected-file-name">
                          {selectedLocalFile.name}
                        </div>
                        <div className="ps-selected-file-size">
                          {(selectedLocalFile.size / 1024).toFixed(1)} KB &bull; Image Ready
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <button
                          type="button"
                          className="ps-btn-secondary"
                          onClick={() => {
                            setSelectedLocalFile(null);
                            setLocalPreviewUrl("");
                          }}
                        >
                          Clear
                        </button>
                        <button
                          type="button"
                          className="ps-btn-primary"
                          onClick={handleAddLocalPhoto}
                        >
                          <FiCheck size={16} /> Add to Gallery
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Option B: Direct URL Link */}
              {photoSourceType === "url" && (
                <div className="ps-form-group">
                  <label>Photo Image URL (HTTPS)</label>
                  <div style={{ display: "flex", gap: 10 }}>
                    <input
                      type="url"
                      className="ps-input"
                      placeholder="https://example.com/company-photo.jpg"
                      value={photoInput}
                      onChange={(e) => setPhotoInput(e.target.value)}
                    />
                    <button
                      type="button"
                      className="ps-btn-primary"
                      onClick={handleAddPhoto}
                      style={{ flexShrink: 0 }}
                    >
                      <FiPlus size={16} /> Add Photo
                    </button>
                  </div>
                  {photoInput.trim() && (
                    <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 10 }}>
                      <img
                        src={photoInput}
                        alt="URL Preview"
                        style={{ width: 44, height: 44, borderRadius: 6, objectFit: "cover", border: "1px solid #e2e8f0" }}
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                      />
                      <span style={{ fontSize: 12, color: "#64748b" }}>Live URL Preview</span>
                    </div>
                  )}
                </div>
              )}

              {/* Gallery List of Uploaded Photos */}
              <div style={{ marginTop: 24 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                  <span style={{ fontSize: 13.5, fontWeight: 700, color: "#002366" }}>
                    Configured Photos ({jobPostingSettings.photos?.length || 0})
                  </span>
                </div>

                {jobPostingSettings.photos && jobPostingSettings.photos.length > 0 ? (
                  <div className="ps-photos-grid">
                    {jobPostingSettings.photos.map((photo, i) => (
                      <div key={i} className="ps-photo-card">
                        <img
                          src={photo}
                          alt={`Company ${i + 1}`}
                          onError={(e) => {
                            e.currentTarget.src = "https://images.unsplash.com/photo-1497366216548-37526070297c?w=150";
                          }}
                        />
                        <button
                          type="button"
                          className="ps-photo-delete-overlay"
                          onClick={() => handleRemovePhoto(i)}
                          title="Remove photo"
                        >
                          <FiTrash2 size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="ps-empty-box">
                    <FiImage size={24} color="#cbd5e1" />
                    <span>No photos added yet. Upload from your device or paste a URL above.</span>
                  </div>
                )}
              </div>
            </div>
            <div className="ps-modal-footer">
              <button
                className="ps-btn-primary"
                onClick={() => {
                  setSelectedLocalFile(null);
                  setLocalPreviewUrl("");
                  setActiveModal(null);
                }}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          Modal 3: Add Presentations
         ───────────────────────────────────────────────────────────── */}
      {activeModal === "presentations" && (
        <div className="ps-modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="ps-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="ps-modal-header">
              <div className="ps-modal-title-group">
                <div
                  className="ps-modal-title-icon"
                  style={{ backgroundColor: "#fef3c7", color: "#d97706" }}
                >
                  <FiFileText size={18} />
                </div>
                <h3>Add Presentations & Decks</h3>
              </div>
              <button
                className="ps-modal-close-btn"
                onClick={() => setActiveModal(null)}
              >
                <FiX size={18} />
              </button>
            </div>
            <div className="ps-modal-body">
              <p style={{ fontSize: 13.5, color: "#64748b", marginTop: 0, marginBottom: 16 }}>
                Link corporate presentations (PDF, PPT, Google Slides) to attach with your job openings.
              </p>

              <div className="ps-form-group">
                <label>Deck Title</label>
                <input
                  type="text"
                  className="ps-input"
                  placeholder="e.g. Employee Benefits & Growth Deck 2026"
                  value={presentationTitle}
                  onChange={(e) => setPresentationTitle(e.target.value)}
                />
              </div>

              <div className="ps-form-group">
                <label>Presentation File or Cloud Drive URL</label>
                <div style={{ display: "flex", gap: 10 }}>
                  <input
                    type="url"
                    className="ps-input"
                    placeholder="https://drive.google.com/... or https://example.com/deck.pdf"
                    value={presentationUrl}
                    onChange={(e) => setPresentationUrl(e.target.value)}
                  />
                  <button
                    type="button"
                    className="ps-btn-primary"
                    onClick={handleAddPresentation}
                    style={{ flexShrink: 0 }}
                  >
                    <FiPlus size={16} /> Add Deck
                  </button>
                </div>
              </div>

              <div className="ps-item-list">
                {jobPostingSettings.presentations && jobPostingSettings.presentations.length > 0 ? (
                  jobPostingSettings.presentations.map((pres, i) => (
                    <div key={i} className="ps-list-card">
                      <div className="ps-list-card-content">
                        <strong>{pres.title}</strong>
                        <div style={{ fontSize: 12, color: "#64748b", wordBreak: "break-all" }}>
                          {pres.url}
                        </div>
                      </div>
                      <button
                        type="button"
                        className="ps-remove-btn"
                        onClick={() => handleRemovePresentation(i)}
                        title="Remove presentation"
                      >
                        <FiTrash2 size={16} />
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="ps-empty-box">
                    <FiFileText size={24} color="#cbd5e1" />
                    <span>No presentations linked yet. Add a deck title and link above.</span>
                  </div>
                )}
              </div>
            </div>
            <div className="ps-modal-footer">
              <button
                className="ps-btn-primary"
                onClick={() => setActiveModal(null)}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          Modal 4: Add Video URL
         ───────────────────────────────────────────────────────────── */}
      {activeModal === "video" && (
        <div className="ps-modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="ps-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="ps-modal-header">
              <div className="ps-modal-title-group">
                <div
                  className="ps-modal-title-icon"
                  style={{ backgroundColor: "#fee2e2", color: "#dc2626" }}
                >
                  <FiVideo size={18} />
                </div>
                <h3>Company Video Tours</h3>
              </div>
              <button
                className="ps-modal-close-btn"
                onClick={() => setActiveModal(null)}
              >
                <FiX size={18} />
              </button>
            </div>
            <div className="ps-modal-body">
              <p style={{ fontSize: 13.5, color: "#64748b", marginTop: 0, marginBottom: 16 }}>
                Link YouTube or Vimeo corporate videos to give candidates an immersive preview of life at your company.
              </p>

              <div className="ps-form-group">
                <label>YouTube or Vimeo URL</label>
                <div style={{ display: "flex", gap: 10 }}>
                  <input
                    type="url"
                    className="ps-input"
                    placeholder="https://www.youtube.com/watch?v=..."
                    value={videoUrlInput}
                    onChange={(e) => setVideoUrlInput(e.target.value)}
                  />
                  <button
                    type="button"
                    className="ps-btn-primary"
                    onClick={handleAddVideo}
                    style={{ flexShrink: 0 }}
                  >
                    <FiPlus size={16} /> Save Video
                  </button>
                </div>
              </div>

              <div className="ps-item-list">
                {jobPostingSettings.videoUrls && jobPostingSettings.videoUrls.length > 0 ? (
                  jobPostingSettings.videoUrls.map((vUrl, i) => (
                    <div key={i} className="ps-list-card">
                      <div className="ps-list-card-content" style={{ wordBreak: "break-all" }}>
                        <a
                          href={vUrl}
                          target="_blank"
                          rel="noreferrer"
                          style={{ color: "#0073e6", fontWeight: 600, textDecoration: "none" }}
                        >
                          {vUrl}
                        </a>
                      </div>
                      <button
                        type="button"
                        className="ps-remove-btn"
                        onClick={() => handleRemoveVideo(i)}
                        title="Remove video"
                      >
                        <FiTrash2 size={16} />
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="ps-empty-box">
                    <FiVideo size={24} color="#cbd5e1" />
                    <span>No video URLs configured yet. Enter a YouTube or Vimeo link above.</span>
                  </div>
                )}
              </div>
            </div>
            <div className="ps-modal-footer">
              <button
                className="ps-btn-primary"
                onClick={() => setActiveModal(null)}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          Modal 5: Add/Edit Addresses
         ───────────────────────────────────────────────────────────── */}
      {activeModal === "addresses" && (
        <div className="ps-modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="ps-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="ps-modal-header">
              <div className="ps-modal-title-group">
                <div
                  className="ps-modal-title-icon"
                  style={{ backgroundColor: "#f5f3ff", color: "#7c3aed" }}
                >
                  <FiMapPin size={18} />
                </div>
                <h3>Branch & Office Addresses</h3>
              </div>
              <button
                className="ps-modal-close-btn"
                onClick={() => setActiveModal(null)}
              >
                <FiX size={18} />
              </button>
            </div>
            <div className="ps-modal-body">
              <p style={{ fontSize: 13.5, color: "#64748b", marginTop: 0, marginBottom: 16 }}>
                Maintain verified branch and office addresses for recruiters to select when posting jobs.
              </p>

              <div className="ps-form-group">
                <label>Branch / Office Title</label>
                <input
                  type="text"
                  className="ps-input"
                  placeholder="e.g. Headquarters / Tech Hub"
                  value={addressForm.title}
                  onChange={(e) => setAddressForm({ ...addressForm, title: e.target.value })}
                />
              </div>

              <div className="ps-form-group">
                <label>Address Details</label>
                <input
                  type="text"
                  className="ps-input"
                  placeholder="e.g. Tower B, 4th Floor, Tech Park"
                  value={addressForm.addressLine}
                  onChange={(e) => setAddressForm({ ...addressForm, addressLine: e.target.value })}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                <div className="ps-form-group">
                  <label>City</label>
                  <input
                    type="text"
                    className="ps-input"
                    placeholder="e.g. Bengaluru"
                    value={addressForm.city}
                    onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                  />
                </div>
                <div className="ps-form-group">
                  <label>State</label>
                  <input
                    type="text"
                    className="ps-input"
                    placeholder="e.g. Karnataka"
                    value={addressForm.state}
                    onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                  />
                </div>
                <div className="ps-form-group">
                  <label>Pincode</label>
                  <input
                    type="text"
                    className="ps-input"
                    placeholder="560100"
                    value={addressForm.pincode}
                    onChange={(e) => setAddressForm({ ...addressForm, pincode: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 6, flexWrap: "wrap", gap: 12 }}>
                <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13.5, cursor: "pointer", fontWeight: 500 }}>
                  <input
                    type="checkbox"
                    checked={addressForm.isDefault}
                    onChange={(e) => setAddressForm({ ...addressForm, isDefault: e.target.checked })}
                  />
                  Set as Default Office Address
                </label>

                <button
                  type="button"
                  className="ps-btn-primary"
                  onClick={handleAddAddress}
                >
                  <FiPlus size={16} /> Add Address
                </button>
              </div>

              <div className="ps-item-list" style={{ marginTop: 20 }}>
                {jobPostingSettings.addresses && jobPostingSettings.addresses.length > 0 ? (
                  jobPostingSettings.addresses.map((addr, i) => (
                    <div key={i} className="ps-list-card">
                      <div className="ps-list-card-content">
                        <strong>
                          {addr.title || "Office"}
                          {addr.isDefault && <span className="ps-badge">Default</span>}
                        </strong>
                        <div>{addr.addressLine}</div>
                        <div style={{ fontSize: 12, color: "#64748b" }}>
                          {[addr.city, addr.state, addr.pincode].filter(Boolean).join(", ")}
                        </div>
                      </div>
                      <button
                        type="button"
                        className="ps-remove-btn"
                        onClick={() => handleRemoveAddress(i)}
                        title="Remove address"
                      >
                        <FiTrash2 size={16} />
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="ps-empty-box">
                    <FiMapPin size={24} color="#cbd5e1" />
                    <span>No branch addresses configured. Add your office locations above.</span>
                  </div>
                )}
              </div>
            </div>
            <div className="ps-modal-footer">
              <button
                className="ps-btn-primary"
                onClick={() => setActiveModal(null)}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          Modal 6: Add/Edit Email IDs
         ───────────────────────────────────────────────────────────── */}
      {activeModal === "emails" && (
        <div className="ps-modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="ps-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="ps-modal-header">
              <div className="ps-modal-title-group">
                <div
                  className="ps-modal-title-icon"
                  style={{ backgroundColor: "#ecfdf5", color: "#059669" }}
                >
                  <FiMail size={18} />
                </div>
                <h3>Response & Alert Email IDs</h3>
              </div>
              <button
                className="ps-modal-close-btn"
                onClick={() => setActiveModal(null)}
              >
                <FiX size={18} />
              </button>
            </div>
            <div className="ps-modal-body">
              <p style={{ fontSize: 13.5, color: "#64748b", marginTop: 0, marginBottom: 16 }}>
                Manage verified inboxes for receiving candidate applications, CV alerts, and applicant updates.
              </p>

              <div className="ps-form-group">
                <label>Email Address</label>
                <input
                  type="email"
                  className="ps-input"
                  placeholder="careers@company.com"
                  value={emailForm.email}
                  onChange={(e) => setEmailForm({ ...emailForm, email: e.target.value })}
                />
              </div>

              <div className="ps-form-group">
                <label>Label / Department Name</label>
                <input
                  type="text"
                  className="ps-input"
                  placeholder="e.g. Talent Acquisition / Engineering Hiring"
                  value={emailForm.label}
                  onChange={(e) => setEmailForm({ ...emailForm, label: e.target.value })}
                />
              </div>

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 6, flexWrap: "wrap", gap: 12 }}>
                <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13.5, cursor: "pointer", fontWeight: 500 }}>
                  <input
                    type="checkbox"
                    checked={emailForm.isDefault}
                    onChange={(e) => setEmailForm({ ...emailForm, isDefault: e.target.checked })}
                  />
                  Set as Primary Response Email
                </label>

                <button
                  type="button"
                  className="ps-btn-primary"
                  onClick={handleAddEmail}
                >
                  <FiPlus size={16} /> Add Email ID
                </button>
              </div>

              <div className="ps-item-list" style={{ marginTop: 20 }}>
                {jobPostingSettings.emailIds && jobPostingSettings.emailIds.length > 0 ? (
                  jobPostingSettings.emailIds.map((item, i) => (
                    <div key={i} className="ps-list-card">
                      <div className="ps-list-card-content">
                        <strong>
                          {item.email}
                          {item.isDefault && <span className="ps-badge">Primary</span>}
                        </strong>
                        {item.label && (
                          <div style={{ fontSize: 12, color: "#64748b" }}>{item.label}</div>
                        )}
                      </div>
                      <button
                        type="button"
                        className="ps-remove-btn"
                        onClick={() => handleRemoveEmail(i)}
                        title="Remove email"
                      >
                        <FiTrash2 size={16} />
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="ps-empty-box">
                    <FiMail size={24} color="#cbd5e1" />
                    <span>No response email IDs configured. Add inboxes above to receive alerts.</span>
                  </div>
                )}
              </div>
            </div>
            <div className="ps-modal-footer">
              <button
                className="ps-btn-primary"
                onClick={() => setActiveModal(null)}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          Toast Feedback Notification
         ───────────────────────────────────────────────────────────── */}
      {toastMessage && (
        <div className="ps-toast">
          <FiCheckCircle size={18} color="#4ade80" />
          <span>{toastMessage}</span>
        </div>
      )}
    </EmployerLayout>
  );
}
