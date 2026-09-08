import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="rounded-[28px] border border-slate-200 bg-white p-10 text-center shadow-[0_24px_80px_rgba(15,23,42,0.12)]">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-400">
          CRM panel
        </p>
        <h1 className="mt-3 text-3xl font-bold text-slate-900">
          Page not found
        </h1>
        <p className="mt-3 text-sm text-slate-500">
          The CRM route you requested does not exist.
        </p>
        <Link
          to="/crm/dashboard"
          className="mt-6 inline-flex rounded-2xl bg-[#163060] px-5 py-3 text-sm font-semibold text-white"
        >
          Go to dashboard
        </Link>
      </div>
    </div>
  );
}
