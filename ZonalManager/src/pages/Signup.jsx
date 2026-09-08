import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LuEye, LuEyeOff } from "react-icons/lu";
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

async function signupZonalManager(payload) {
  const response = await fetch(`${API_BASE}/zonal-manager/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Registration failed");
  }

  return data;
}

export default function Signup() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [zone, setZone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    const normalizedFullName = fullName.trim().replace(/\s+/g, " ");
    const fullNamePattern = /^[A-Za-z][A-Za-z .'-]*$/;

    if (!normalizedFullName || !email.trim() || !zone.trim() || !password || !confirmPassword) {
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
      await signupZonalManager({
        fullName: normalizedFullName,
        email: email.trim(),
        zone: zone.trim(),
        password,
        confirmPassword,
      });
      toast.success("Registration successful. Please sign in.");
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
          <h1 className="login-brand-title">Zonal Manager Portal</h1>
          <p className="login-brand-sub">
            Create a zonal manager account to supervise state-level sales operations and lead conversion flow.
          </p>
          <ul className="login-feature-list">
            {[
              "Built for zone-wise visibility and controls",
              "Secure account access with role-based permissions",
              "Designed for real-time lead tracking and escalations",
            ].map((item) => (
              <li key={item} className="login-feature-item">
                <span className="login-feature-dot" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="login-form-wrap">
          <p className="login-eyebrow">Zonal Manager Access</p>
          <h2 className="login-form-title">Create your account</h2>
          <p className="login-form-sub">
            Register with your official email and assigned zone.
          </p>

          <form onSubmit={handleSubmit} className="login-form">
            <div className="login-field">
              <label className="login-label" htmlFor="zm-signup-full-name">
                Full Name
              </label>
              <input
                id="zm-signup-full-name"
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
              <label className="login-label" htmlFor="zm-signup-email">
                Email address
              </label>
              <input
                id="zm-signup-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@mavenjobs.com"
                className="login-input"
                autoComplete="email"
              />
            </div>

            <div className="login-field">
              <label className="login-label" htmlFor="zm-signup-zone">
                Zone
              </label>
              <select
                id="zm-signup-zone"
                value={zone}
                onChange={(event) => setZone(event.target.value)}
                className="login-input"
                style={{ appearance: "auto" }}
              >
                <option value="" disabled>
                  Select a zone
                </option>
                <option value="North">North</option>
                <option value="South">South</option>
                <option value="East">East</option>
                <option value="West">West</option>
              </select>
            </div>

            <div className="login-field">
              <label className="login-label" htmlFor="zm-signup-password">
                Password
              </label>
              <div style={{ position: "relative" }}>
                <input
                  id="zm-signup-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter your password"
                  className="login-input"
                  autoComplete="new-password"
                  style={{ paddingRight: "40px" }}
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
              <label className="login-label" htmlFor="zm-signup-confirm">
                Confirm Password
              </label>
              <div style={{ position: "relative" }}>
                <input
                  id="zm-signup-confirm"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="Confirm your password"
                  className="login-input"
                  autoComplete="new-password"
                  style={{ paddingRight: "40px" }}
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

            <button type="submit" disabled={isSubmitting} className="login-btn">
              {isSubmitting ? "Creating account..." : "Register"}
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
    </div>
  );
}
