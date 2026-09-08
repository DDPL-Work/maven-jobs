import React, { useState, useEffect, useRef } from "react";
import { FiEye, FiEyeOff } from "react-icons/fi";
import { FcGoogle } from "react-icons/fc";
import LogoImage from "../../assets/maven-logo.svg";
import { useDispatch, useSelector } from "react-redux";
import { loginUser, loginWithGoogle } from "../../Redux/thunks/authThunks";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import LoginIllustration from "../../assets/Character.svg";

const Login = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { loading } = useSelector((state) => state.auth);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Ref for the container where GIS renders the actual Google button
  const googleBtnContainerRef = useRef(null);
  // Ref for the credential callback so GIS always calls the latest version
  const credentialCallbackRef = useRef(null);

  const getRoleDestination = (role) => {
    if (
      ["LEAD_GENERATOR", "STATE_MANAGER", "APPROVER", "ADMIN"].includes(role)
    ) {
      return "/lead-generator/dashboard";
    }
    return "/";
  };

  // ---------------------------------------------------------------
  // Keep the callback ref fresh so GIS always invokes the latest handler
  // This avoids stale closure issues where navigate/dispatch are outdated
  // ---------------------------------------------------------------
  credentialCallbackRef.current = async (credentialResponse) => {
    console.log("[Google Auth] Credential received:", credentialResponse);

    if (!credentialResponse?.credential) {
      console.error("[Google Auth] No credential in response");
      toast.error("Google sign-in failed. No credential received.");
      return;
    }

    setGoogleLoading(true);
    try {
      const result = await dispatch(
        loginWithGoogle(credentialResponse.credential),
      );

      if (result.meta.requestStatus === "fulfilled") {
        toast.success("Login successful!");
        navigate(getRoleDestination(result.payload.user.role));
      } else {
        toast.error(result.payload || "Google login failed");
      }
    } catch {
      toast.error("Google login failed. Please try again.");
    } finally {
      setGoogleLoading(false);
    }
  };

  // ---------------------------------------------------------------
  // EMAIL / PASSWORD LOGIN
  // ---------------------------------------------------------------
  const handleLogin = async () => {
    if (!email || !password) {
      toast.error("Enter email & password");
      return;
    }

    const result = await dispatch(loginUser({ email, password }));

    if (result.meta.requestStatus === "fulfilled") {
      toast.success("Login successful!");
      navigate(getRoleDestination(result.payload.user.role));
    } else {
      toast.error(result.payload || "Invalid credentials");
    }
  };

  // ---------------------------------------------------------------
  // GOOGLE IDENTITY SERVICES — load script + render button
  // ---------------------------------------------------------------
  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    console.log("[Google Auth] VITE_GOOGLE_CLIENT_ID:", clientId);

    if (!clientId) {
      console.error(
        "[Google Auth] VITE_GOOGLE_CLIENT_ID is not defined in environment",
      );
      return;
    }

    const renderGoogleButton = () => {
      if (!window.google?.accounts?.id) {
        console.error("[Google Auth] google.accounts.id is not available");
        return;
      }
      if (!googleBtnContainerRef.current) {
        console.error("[Google Auth] Button container ref not attached to DOM");
        return;
      }

      // Initialize GIS with our callback (via ref to avoid stale closures)
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: (response) => credentialCallbackRef.current?.(response),
        auto_select: false,
        cancel_on_tap_outside: true,
      });

      // Measure the container width so the Google button fills it exactly
      const containerWidth = googleBtnContainerRef.current.offsetWidth || 320;

      // Render the REAL Google button into our container
      window.google.accounts.id.renderButton(googleBtnContainerRef.current, {
        theme: "outline",
        size: "large",
        text: "signin_with",
        shape: "rectangular",
        width: containerWidth,
      });

      console.log(
        "[Google Auth] Google button rendered successfully, width:",
        containerWidth,
      );
    };

    // If GIS script is already loaded (e.g. by GoogleOAuthProvider), render now
    if (window.google?.accounts?.id) {
      console.log("[Google Auth] GIS already loaded, rendering button");
      renderGoogleButton();
      return;
    }

    // Otherwise load the GIS script ourselves
    console.log("[Google Auth] Loading GIS script...");
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => {
      console.log("[Google Auth] GIS script loaded successfully");
      renderGoogleButton();
    };
    script.onerror = () => {
      console.error("[Google Auth] Failed to load GIS script from Google");
      toast.error(
        "Failed to load Google Sign-In. Please check your network connection.",
      );
    };
    document.head.appendChild(script);
    // Note: we intentionally do NOT remove the script on unmount
    // because it may be used by other components or page navigations
  }, []);

  // ---------------------------------------------------------------
  // RENDER
  // ---------------------------------------------------------------
  return (
    <div className="relative w-full h-screen bg-[#1F41A9] overflow-hidden flex">
      {/* LEFT CONTENT */}
      <div className="hidden lg:flex flex-col justify-center px-35 -mt-19 w-1/2 z-10">
        <img src={LogoImage} className="w-52 mb-8" alt="Logo" />

        <h1 className="text-white text-4xl font-bold font-serif leading-tight mb-6">
          Welcome to Maven Jobs
        </h1>

        <p className="text-white/90 text-2xl font-medium font-[Calibri] mb-8 max-w-md">
          Your trusted recruitment partner for finding the best talent across
          industries.
        </p>

        <ul className="space-y-3 text-white text-base font-[Calibri]">
          <li className="flex items-center gap-3">
            <span className="w-2 h-2 bg-[#A1DB40] rounded-full"></span>
            Access thousands of qualified candidates
          </li>
          <li className="flex items-center gap-3">
            <span className="w-2 h-2 bg-[#A1DB40] rounded-full"></span>
            Advanced search and filtering tools
          </li>
          <li className="flex items-center gap-3">
            <span className="w-2 h-2 bg-[#A1DB40] rounded-full"></span>
            Real-time analytics and insights
          </li>
        </ul>
      </div>

      {/* RIGHT LOGIN CARD */}
      <div className="flex w-full lg:w-1/2 items-center justify-center z-10">
        <div className="w-full max-w-md bg-white rounded-xl p-8 shadow-sm">
          <h2 className="text-center text-2xl font-bold font-serif text-[#0C0C0C]">
            Sign In
          </h2>

          <p className="text-center text-sm font-[Calibri] text-zinc-500 mt-1">
            Access your recruiter dashboard
          </p>

          {/* ======================================================
              GOOGLE SIGN-IN BUTTON
              
              Strategy: The REAL Google button is rendered underneath
              inside googleBtnContainerRef. Our custom styled div is
              placed on top with pointer-events: none so the user
              sees our design but clicks go through to the Google
              button which handles the full OAuth flow.
              ====================================================== */}
          <div className="relative mt-6 w-full h-11 rounded-lg overflow-hidden border border-gray-300 bg-white">
            {/* Layer 1: Actual Google button (receives clicks) */}
            <div
              ref={googleBtnContainerRef}
              className="absolute inset-0"
              style={{ zIndex: 1 }}
            />

            {/* Layer 2: Our custom styled overlay (visual only, no click capture) */}
            <div
              className="absolute inset-0 flex items-center justify-center gap-3 pointer-events-none select-none"
              style={{ zIndex: 2 }}
            >
              {googleLoading ? (
                <span className="flex items-center gap-2 text-sm font-[Calibri] text-[#0C0C0C]">
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
                  <span className="text-sm font-[Calibri] text-[#0C0C0C]">
                    Sign in with Google
                  </span>
                </>
              )}
            </div>
          </div>

          {/* DIVIDER */}
          <div className="flex items-center gap-3 mt-6">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-zinc-400 font-[Calibri]">
              or sign in with email
            </span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* EMAIL */}
          <div className="mt-4">
            <label className="text-sm font-[Calibri] text-[#0C0C0C]">
              Email Address
            </label>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full h-10 rounded-lg bg-[#FCFBF8] border border-gray-200 px-4 text-sm font-[Calibri]"
            />
          </div>

          {/* PASSWORD */}
          <div className="mt-4">
            <label className="text-sm font-[Calibri] text-[#0C0C0C]">
              Password
            </label>

            <div className="relative mt-1">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-10 rounded-lg bg-[#FCFBF8] border border-gray-200 px-4 text-sm font-[Calibri]"
              />

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500"
              >
                {showPassword ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>
          </div>

          {/* FORGOT */}
          <div className="flex justify-end mt-2">
            <span className="text-sm font-[Calibri] cursor-pointer text-[#0C0C0C] hover:underline">
              Forgot password?
            </span>
          </div>

          {/* SIGN IN BUTTON */}
          <button
            onClick={handleLogin}
            disabled={loading || googleLoading}
            className="mt-6 w-full h-11 rounded-lg bg-[#103C7F] text-white font-[Calibri]"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>

          {/* FOOTER */}
          <p className="text-center text-xs text-zinc-500 font-[Calibri] mt-6">
            By signing in, you agree to our{" "}
            <span className="underline cursor-pointer">Terms of Service</span>{" "}
            and{" "}
            <span className="underline cursor-pointer">Privacy Policy</span>
          </p>
        </div>
      </div>

      {/* BACKGROUND SHAPES */}
      <div className="absolute -left-66 -top-55  w-[568px] h-[568px] bg-[#274FC7] rounded-full" />
      <div className="absolute -left-106 -bottom-85  w-[568px] h-[568px] bg-[#274FC7] rounded-full" />
      <svg
        className="absolute -right-25 top-65 rotate-25 h-full"
        width="420"
        viewBox="0 0 420 827"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
      >
        <path
          d="
      M420 0
      L260 0
      C180 140 180 300 260 413
      C340 540 340 700 260 827
      L420 827
      Z
    "
          fill="#264ECA"
        />
      </svg>
      <img
        src={LoginIllustration}
        alt="Recruitment Illustration"
        className="absolute left-0 -bottom-5 w-[250px] h-auto z-20 pointer-events-none"
      />
    </div>
  );
};

export default Login;
