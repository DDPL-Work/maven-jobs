import { useState, useEffect, useRef } from "react";
import { FcGoogle } from "react-icons/fc";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  loginCandidate,
  loginWithGoogle,
  setStoredUser,
} from "../services/candidateApi";

export default function Login() {
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const token = searchParams.get("token") || "";
  const jobId = searchParams.get("jobId") || "";

  const googleBtnRef = useRef(null);
  const callbackRef = useRef(null);

  // Keep callback ref fresh so GIS always calls the latest handler
  callbackRef.current = async (credentialResponse) => {
    console.log("[Candidate Google Auth] Credential received");

    if (!credentialResponse?.credential) {
      setError("Google sign-in failed. No credential received.");
      return;
    }

    setGoogleLoading(true);
    setError("");

    try {
      const response = await loginWithGoogle(credentialResponse.credential);

      setStoredUser({
        user: response.user,
        profile: response.profile,
      });

      if (token) {
        const query = new URLSearchParams();
        if (jobId) {
          query.set("jobId", jobId);
          query.set("applyJobId", jobId);
        }
        const queryString = query.toString();
        navigate(
          `/landing/${encodeURIComponent(token)}${queryString ? `?${queryString}` : ""}`,
          { replace: true },
        );
      } else {
        navigate("/candidate/dashboard", { replace: true });
      }
    } catch (requestError) {
      setError(requestError.message || "Google login failed.");
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!email.trim() || !password.trim()) {
      setError("Email and password are required.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const response = await loginCandidate({
        email: email.trim(),
        password,
      });

      setStoredUser({
        user: response.user,
        profile: response.profile,
      });

      if (token) {
        const query = new URLSearchParams();
        if (jobId) {
          query.set("jobId", jobId);
          query.set("applyJobId", jobId);
        }

        const queryString = query.toString();
        navigate(
          `/landing/${encodeURIComponent(token)}${queryString ? `?${queryString}` : ""}`,
          { replace: true },
        );
      } else {
        navigate("/candidate/dashboard", { replace: true });
      }
    } catch (requestError) {
      setError(requestError.message || "Unable to sign in.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Load Google Identity Services and render button
  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    console.log("[Candidate Google Auth] VITE_GOOGLE_CLIENT_ID:", clientId);

    if (!clientId) {
      console.error(
        "[Candidate Google Auth] VITE_GOOGLE_CLIENT_ID is not defined",
      );
      return;
    }

    const renderGoogleButton = () => {
      if (!window.google?.accounts?.id) {
        console.error("[Candidate Google Auth] google.accounts.id not available");
        return;
      }
      if (!googleBtnRef.current) {
        console.error("[Candidate Google Auth] Button container ref not set");
        return;
      }

      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: (response) => callbackRef.current?.(response),
        auto_select: false,
        cancel_on_tap_outside: true,
      });

      const containerWidth = googleBtnRef.current.offsetWidth || 320;

      window.google.accounts.id.renderButton(googleBtnRef.current, {
        theme: "outline",
        size: "large",
        text: "signin_with",
        shape: "rectangular",
        width: containerWidth,
      });

      console.log("[Candidate Google Auth] Button rendered, width:", containerWidth);
    };

    if (window.google?.accounts?.id) {
      console.log("[Candidate Google Auth] GIS already loaded");
      renderGoogleButton();
      return;
    }

    console.log("[Candidate Google Auth] Loading GIS script...");
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => {
      console.log("[Candidate Google Auth] GIS script loaded");
      renderGoogleButton();
    };
    script.onerror = () => {
      console.error("[Candidate Google Auth] Failed to load GIS script");
    };
    document.head.appendChild(script);
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-md overflow-hidden rounded-[32px] border border-slate-200 bg-white p-6 shadow-[0_30px_100px_rgba(15,23,42,0.12)] sm:p-10">
        <div className="mx-auto w-full text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-400">
            Candidate Access
          </p>
          <h2 className="mt-3 text-3xl font-bold text-slate-900">
            Sign in to Candidate Module
          </h2>

          {/* GOOGLE SIGN-IN BUTTON */}
          <div className="relative mt-6 w-full h-11 rounded-2xl overflow-hidden border border-slate-200 bg-white">
            <div
              ref={googleBtnRef}
              className="absolute inset-0"
              style={{ zIndex: 1 }}
            />
            <div
              className="absolute inset-0 flex items-center justify-center gap-3 pointer-events-none select-none"
              style={{ zIndex: 2 }}
            >
              {googleLoading ? (
                <span className="flex items-center gap-2 text-sm text-slate-700">
                  <svg
                    className="animate-spin h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  Signing in with Google...
                </span>
              ) : (
                <>
                  <FcGoogle className="text-xl" />
                  <span className="text-sm font-medium text-slate-700">
                    Sign in with Google
                  </span>
                </>
              )}
            </div>
          </div>

          {/* DIVIDER */}
          <div className="flex items-center gap-3 mt-5">
            <div className="flex-1 h-px bg-slate-200" />
            <span className="text-xs text-slate-400">or</span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>

          <form onSubmit={handleSubmit} className="mt-5 space-y-5 text-left">
            <div>
              <label className="block text-sm font-semibold text-slate-700">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="candidate@mavenjobs.com"
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#163060] focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter password"
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#163060] focus:bg-white"
              />
            </div>

            {error ? (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
                {error}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={isSubmitting || googleLoading}
              className="w-full rounded-2xl bg-[#163060] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#1d3f7f] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? "Signing in..." : "Continue to Candidate Dashboard"}
            </button>
          </form>

          <p className="mt-5 text-sm text-slate-500">
            New candidate?{" "}
            <Link
              to={
                token
                  ? `/register?token=${encodeURIComponent(token)}${
                      jobId ? `&jobId=${encodeURIComponent(jobId)}` : ""
                    }`
                  : "/register"
              }
              className="font-semibold text-[#163060] hover:text-lime-600"
            >
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
