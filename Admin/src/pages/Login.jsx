import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginAdmin, setStoredSession } from "../services/adminApi";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!email.trim() || !password.trim()) {
      setError("Email and password are required.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const response = await loginAdmin({
        email: email.trim(),
        password,
      });

      setStoredSession({
        token: response.token,
        user: response.user,
      });

      navigate("/admin/dashboard", { replace: true });
    } catch (requestError) {
      setError(requestError.message || "Unable to sign in.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top_left,_rgba(163,230,53,0.14),_transparent_28%),linear-gradient(180deg,_#f8fafc_0%,_#eef4ff_100%)] px-4 py-10">
      <div className="w-full max-w-[460px] rounded-[30px] border border-slate-200 bg-white p-8 shadow-[0_30px_90px_rgba(15,23,42,0.12)] sm:p-10">
        <div className="mx-auto max-w-sm">
          <h1 className="text-center font-[Georgia] text-4xl font-bold text-[#163060]">
            Admin Panel
          </h1>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div>
              <label className="block text-sm font-semibold text-slate-700">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="admin@mavenjobs.com"
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
              disabled={isSubmitting}
              className="w-full rounded-2xl bg-[#163060] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#1d3f7f] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? "Logging in..." : "Login"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
