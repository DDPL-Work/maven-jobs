import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="max-w-xl rounded-[28px] border border-slate-200 bg-white px-8 py-8 text-center shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-400">
          Candidate Module
        </p>
        <h1 className="mt-3 text-3xl font-bold text-slate-900">
          Page not found
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-500">
          The page you requested does not exist in the Candidate workspace.
        </p>
        <Link
          to="/candidate/dashboard"
          className="mt-6 inline-flex rounded-2xl bg-[#163060] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#1d3f7f]"
        >
          Go to dashboard
        </Link>
      </div>
    </div>
  );
}
