import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LuChevronLeft, LuEye, LuEyeOff, LuMapPin } from "react-icons/lu";
import logo from "../assets/maven-logo.svg";
import { fetchFseSignupMeta, signupFSE } from "../api/fseApi";

const SESSION_KEY = "crm_panel_session";
const ZONE_ORDER = ["North", "South", "East", "West"];

export default function Signup() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [zone, setZone] = useState("");
  const [stateName, setStateName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
        const data = await fetchFseSignupMeta();
        if (!mounted) {
          return;
        }
        setAvailableStatesByZone(data.availableStatesByZone || {});
      } catch (requestError) {
        if (mounted) {
          setError(requestError?.response?.data?.message || "Unable to load state options.");
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

    const data = await fetchFseSignupMeta(selectedZone);
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
      setError("");
      setIsMetaLoading(true);
      await ensureZoneStatesLoaded(selectedZone);
      setActivePickerZone(selectedZone);
      setPickerStep("state");
    } catch (requestError) {
      setError(requestError?.response?.data?.message || "Unable to load states for this zone.");
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
    setError("");

    if (!fullName.trim() || !email.trim() || !zone || !stateName || !password || !confirmPassword) {
      setError("All fields are required.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const response = await signupFSE({
        fullName: fullName.trim(),
        email: email.trim(),
        zone,
        state: stateName,
        password,
        confirmPassword,
      });
      sessionStorage.setItem(SESSION_KEY, JSON.stringify({ token: response.token, user: response.user }));
      navigate("/", { replace: true });
    } catch (requestError) {
      setError(requestError?.response?.data?.message || requestError.message || "Unable to sign up.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-shell">
      <div className="login-card">
        <div className="login-brand">
          <div className="login-brand-logo-card">
            <img src={logo} alt="Maven Jobs" className="login-brand-logo" />
          </div>
          <h1 className="login-brand-title">Field Sales Executive Portal</h1>
          <p className="login-brand-sub">
            Register to join your state team and start handling assigned leads.
          </p>
          <ul className="login-feature-list">
            <li className="login-feature-item"><span className="login-feature-dot" />Secure role-based access</li>
            <li className="login-feature-item"><span className="login-feature-dot" />State-wise lead visibility</li>
            <li className="login-feature-item"><span className="login-feature-dot" />Complete follow-up workflow</li>
          </ul>
        </div>

        <div className="login-form-wrap">
          <p className="login-eyebrow">FSE Registration</p>
          <h2 className="login-form-title">Create your account</h2>
          <p className="login-form-sub">Fill your details to get started.</p>

          <form className="login-form" onSubmit={handleSubmit}>
            <div className="login-field">
              <label className="login-label" htmlFor="signup-name">Full Name</label>
              <input
                id="signup-name"
                className="login-input"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                placeholder="Your full name"
                required
              />
            </div>

            <div className="login-field">
              <label className="login-label" htmlFor="signup-email">Email address</label>
              <input
                id="signup-email"
                className="login-input"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@mavenjobs.com"
                autoComplete="email"
                required
              />
            </div>

            <div className="login-field">
              <label className="login-label" htmlFor="signup-zone-state">Zone, State</label>
              <button
                id="signup-zone-state"
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
                <span>{zone && stateName ? `${zone} Zone, ${stateName}` : "Select Zone and State"}</span>
                <LuMapPin size={16} color="#64748b" />
              </button>
            </div>

            <div className="login-field">
              <label className="login-label" htmlFor="signup-password">Password</label>
              <div style={{ position: "relative" }}>
                <input
                  id="signup-password"
                  className="login-input"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Create a password"
                  autoComplete="new-password"
                  style={{ paddingRight: "40px" }}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  style={{
                    position: "absolute",
                    right: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "#64748b",
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
              <label className="login-label" htmlFor="signup-confirm-password">Confirm Password</label>
              <div style={{ position: "relative" }}>
                <input
                  id="signup-confirm-password"
                  className="login-input"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="Confirm your password"
                  autoComplete="new-password"
                  style={{ paddingRight: "40px" }}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  style={{
                    position: "absolute",
                    right: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "#64748b",
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

            {error ? <div className="login-error">{error}</div> : null}

            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? "Creating account..." : "Create account"}
            </button>

            <div style={{ marginTop: "24px", textAlign: "center", fontSize: "0.875rem", color: "#475569", fontWeight: 500 }}>
              Already registered?{" "}
              <Link to="/login" style={{ color: "#1e40af", textDecoration: "none", fontWeight: 600 }}>
                Sign in
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
                    : "All states in this zone are available for FSE signup."}
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
