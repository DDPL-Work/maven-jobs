import { useEffect, useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { LuChevronLeft, LuEye, LuEyeOff, LuMapPin } from "react-icons/lu";
import { toast } from "sonner";
import logo from "../assets/maven-logo.svg";

const resolveRootApiBaseUrl = () => {
  const configuredBaseUrl = String(import.meta.env.VITE_API_BASE_URL || "").trim();
  if (!configuredBaseUrl) {
    return "http://localhost:3000/api/v1";
  }

  const normalized = configuredBaseUrl.replace(/\/+$/, "");
  const match = normalized.match(/^(.*\/api\/v1)(?:\/.*)?$/i);
  return match ? match[1] : normalized;
};

const API_BASE = resolveRootApiBaseUrl();

const ZONE_ORDER = ["North", "South", "East", "West"];

async function fetchSignupMeta(zone = "") {
  const query = zone ? `?zone=${encodeURIComponent(zone)}` : "";
  const response = await fetch(`${API_BASE}/state-manager/auth/meta${query}`);
  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload.message || "Unable to load zone/state options.");
  }

  return payload?.data || {};
}

async function signupStateManager(data) {
  const response = await fetch(`${API_BASE}/state-manager/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.message || "Registration failed");
  }

  return payload;
}

export default function Signup() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [zone, setZone] = useState("");
  const [stateName, setStateName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [pickerStep, setPickerStep] = useState("zone");
  const [activePickerZone, setActivePickerZone] = useState("");
  const [isMetaLoading, setIsMetaLoading] = useState(false);
  const [availableStatesByZone, setAvailableStatesByZone] = useState({});

  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;

    const loadMeta = async () => {
      try {
        setIsMetaLoading(true);
        const data = await fetchSignupMeta();
        if (!mounted) {
          return;
        }

        setAvailableStatesByZone(data.availableStatesByZone || {});
      } catch (requestError) {
        if (mounted) {
          toast.error(requestError.message || "Unable to load state options.");
        }
      } finally {
        if (mounted) {
          setIsMetaLoading(false);
        }
      }
    };

    loadMeta();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!isPickerOpen) {
      return undefined;
    }

    const onEscape = (event) => {
      if (event.key === "Escape") {
        setIsPickerOpen(false);
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onEscape);
    };
  }, [isPickerOpen]);

  const sortedZones = useMemo(
    () => [...new Set([...(Object.keys(availableStatesByZone) || []), ...ZONE_ORDER])].filter(Boolean),
    [availableStatesByZone],
  );

  const activeZoneStates = useMemo(
    () => (activePickerZone ? availableStatesByZone[activePickerZone] || [] : []),
    [activePickerZone, availableStatesByZone],
  );

  const ensureZoneStatesLoaded = async (selectedZone) => {
    if (Array.isArray(availableStatesByZone[selectedZone])) {
      return;
    }

    const data = await fetchSignupMeta(selectedZone);
    const nextStates = Array.isArray(data.availableStates) ? data.availableStates : [];
    setAvailableStatesByZone((prev) => ({ ...prev, [selectedZone]: nextStates }));
  };

  const openZoneStatePicker = () => {
    setActivePickerZone(zone || "");
    setPickerStep(zone ? "state" : "zone");
    setIsPickerOpen(true);
  };

  const handleSelectZone = async (selectedZone) => {
    try {
      setIsMetaLoading(true);
      await ensureZoneStatesLoaded(selectedZone);
      setActivePickerZone(selectedZone);
      setPickerStep("state");
    } catch (requestError) {
      toast.error(requestError.message || "Unable to load states for this zone.");
    } finally {
      setIsMetaLoading(false);
    }
  };

  const handleSelectState = (selectedState) => {
    setZone(activePickerZone);
    setStateName(selectedState);
    setIsPickerOpen(false);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const normalizedFullName = fullName.trim().replace(/\s+/g, " ");
    const fullNamePattern = /^[A-Za-z][A-Za-z .'-]*$/;

    if (!normalizedFullName || !email.trim() || !zone.trim() || !stateName.trim() || !password || !confirmPassword) {
      toast.error("All fields are required.");
      return;
    }

    if (normalizedFullName.length < 2 || normalizedFullName.length > 80) {
      toast.error("Full name must be between 2 and 80 characters.");
      return;
    }

    if (!fullNamePattern.test(normalizedFullName)) {
      toast.error("Full name can only contain letters, spaces, apostrophes, hyphens, and periods.");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    if (password.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }

    setIsSubmitting(true);

    try {
      await signupStateManager({
        fullName: normalizedFullName,
        email: email.trim(),
        zone: zone.trim(),
        state: stateName.trim(),
        password,
        confirmPassword,
      });
      toast.success("Request sent for approval. You can sign in after zonal manager approval.");
      navigate("/login", { replace: true });
    } catch (requestError) {
      toast.error(requestError.message || "Unable to sign up.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login-shell">
      <div className="login-card">
        <div className="login-brand">
          <img src={logo} alt="Maven Jobs" className="login-brand-logo" />
          <h1 className="login-brand-title">State Manager Portal</h1>
          <p className="login-brand-sub">
            Register your account to manage your zone's sales operations, assign leads, and track team performance.
          </p>
          <ul className="login-feature-list">
            {[
              "Submit and track leads in real-time",
              "View approval status and feedback",
              "Monitor your performance dashboard",
            ].map((item) => (
              <li key={item} className="login-feature-item">
                <span className="login-feature-dot" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="login-form-wrap">
          <p className="login-eyebrow">State Manager Access</p>
          <h2 className="login-form-title">Create your account</h2>
          <p className="login-form-sub">Fill in the details below and send for zonal approval.</p>

          <form onSubmit={handleSubmit} className="login-form">
            <div className="login-field">
              <label className="login-label" htmlFor="lg-full-name">
                Full Name
              </label>
              <input
                id="lg-full-name"
                type="text"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                placeholder="Your full name"
                className="login-input"
                autoComplete="name"
                maxLength={80}
                required
              />
            </div>

            <div className="login-field">
              <label className="login-label" htmlFor="lg-email">
                Email address
              </label>
              <input
                id="lg-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@mavenjobs.com"
                className="login-input"
                autoComplete="email"
                required
              />
            </div>

            <div className="login-field">
              <label className="login-label" htmlFor="lg-zone-state">
                Zone, State
              </label>
              <button
                id="lg-zone-state"
                type="button"
                className="login-input"
                onClick={openZoneStatePicker}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
                <span>
                  {zone && stateName ? `${zone} Zone, ${stateName}` : "Select Zone and State"}
                </span>
                <LuMapPin size={16} color="#64748b" />
              </button>
            </div>

            <div className="login-field">
              <label className="login-label" htmlFor="lg-password">
                Password
              </label>
              <div style={{ position: "relative" }}>
                <input
                  id="lg-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter your password"
                  className="login-input"
                  autoComplete="new-password"
                  style={{ paddingRight: "40px" }}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  style={{
                    position: "absolute",
                    right: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "rgba(255, 255, 255, 0.5)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <LuEyeOff size={18} /> : <LuEye size={18} />}
                </button>
              </div>
            </div>

            <div className="login-field">
              <label className="login-label" htmlFor="lg-confirm-password">
                Confirm Password
              </label>
              <div style={{ position: "relative" }}>
                <input
                  id="lg-confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="Confirm your password"
                  className="login-input"
                  autoComplete="new-password"
                  style={{ paddingRight: "40px" }}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((current) => !current)}
                  style={{
                    position: "absolute",
                    right: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "rgba(255, 255, 255, 0.5)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                  title={showConfirmPassword ? "Hide password" : "Show password"}
                >
                  {showConfirmPassword ? <LuEyeOff size={18} /> : <LuEye size={18} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={isSubmitting} className="login-btn">
              {isSubmitting ? "Submitting request..." : "Send for Approval"}
            </button>
            <div style={{ marginTop: "24px", textAlign: "center", fontSize: "0.875rem", color: "#475569", fontWeight: "500" }}>
              Already have an account?{" "}
              <Link to="/login" style={{ color: "#1e40af", textDecoration: "none", fontWeight: "600" }}>
                Sign In
              </Link>
            </div>
          </form>
        </div>
      </div>

      {isPickerOpen ? (
        <div className="modal-overlay" role="presentation" onClick={() => setIsPickerOpen(false)}>
          <section
            className="modal-content"
            style={{ maxWidth: "560px", width: "100%" }}
            role="dialog"
            aria-modal="true"
            aria-label="Select zone and state"
            onClick={(event) => event.stopPropagation()}
          >
            <header className="modal-header">
              <div className="header-info">
                <h2>{pickerStep === "zone" ? "Select Zone" : `Select State (${activePickerZone} Zone)`}</h2>
                <p>
                  {pickerStep === "zone"
                    ? "Choose your zone to continue."
                    : "Only currently available states are shown."}
                </p>
              </div>
              <button type="button" className="close-btn" onClick={() => setIsPickerOpen(false)}>
                &times;
              </button>
            </header>

            <div className="modal-body">
              {isMetaLoading ? (
                <p style={{ margin: 0, color: "#64748b" }}>Loading options...</p>
              ) : pickerStep === "zone" ? (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "12px" }}>
                  {sortedZones.map((zoneItem) => {
                    const availableCount = (availableStatesByZone[zoneItem] || []).length;

                    return (
                      <button
                        key={zoneItem}
                        type="button"
                        onClick={() => handleSelectZone(zoneItem)}
                        className="secondary-btn"
                        style={{
                          width: "100%",
                          justifyContent: "space-between",
                          display: "flex",
                          alignItems: "center",
                          padding: "12px 14px",
                        }}
                      >
                        <span>{zoneItem} Zone</span>
                        <span style={{ color: "#64748b", fontSize: "0.8rem" }}>{availableCount} states</span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div>
                  <button
                    type="button"
                    className="secondary-btn"
                    onClick={() => setPickerStep("zone")}
                    style={{ marginBottom: "14px", display: "inline-flex", alignItems: "center", gap: "6px" }}
                  >
                    <LuChevronLeft size={14} />
                    Back to Zones
                  </button>

                  {activeZoneStates.length ? (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "10px" }}>
                      {activeZoneStates.map((item) => (
                        <button
                          key={item}
                          type="button"
                          className="secondary-btn"
                          onClick={() => handleSelectState(item)}
                          style={{ width: "100%", textAlign: "left", justifyContent: "flex-start" }}
                        >
                          {item}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p style={{ margin: 0, color: "#64748b" }}>
                      No states are currently available in {activePickerZone} zone.
                    </p>
                  )}
                </div>
              )}
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}
