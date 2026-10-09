import { useEffect, useState } from "react";
import {
  LuHistory,
  LuSearch,
  LuRefreshCw,
  LuShieldAlert,
  LuUser,
  LuClock,
} from "react-icons/lu";
import { getCommercialAuditLogs } from "../../services/adminApi";

export default function CommercialAuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  // Filters
  const [targetType, setTargetType] = useState("");
  const [search, setSearch] = useState("");

  const loadLogs = async () => {
    setLoading(true);
    try {
      const res = await getCommercialAuditLogs({
        targetType,
        search,
      });
      if (res.success) {
        setLogs(res.logs || []);
        setTotal(res.total || 0);
      }
    } catch (err) {
      alert(err.message || "Failed to load audit logs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [targetType]);

  const handleSearch = (e) => {
    e.preventDefault();
    loadLogs();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
            Commercial Audit Logs
          </h1>
          <p className="text-sm text-slate-500">
            Immutable security log of all commercial actions, plan publications, price edits, and credit adjustments.
          </p>
        </div>
        <button
          onClick={loadLogs}
          className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 self-start md:self-auto"
        >
          <LuRefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between">
        <form onSubmit={handleSearch} className="relative flex-1">
          <LuSearch className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by target name, action, or admin email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 pl-10 pr-4 text-xs text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none"
          />
        </form>

        <div className="flex items-center gap-3">
          <select
            value={targetType}
            onChange={(e) => setTargetType(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 focus:outline-none"
          >
            <option value="">All Target Types</option>
            <option value="PRODUCT">Products</option>
            <option value="OFFER">Offers / SKUs</option>
            <option value="PLAN">Plans</option>
            <option value="PLAN_VERSION">Plan Versions</option>
            <option value="SUBSCRIPTION">Subscriptions</option>
            <option value="CREDIT_LEDGER">Credit Ledger</option>
          </select>

          <span className="text-xs text-slate-400 font-medium whitespace-nowrap">
            {total} audit entries
          </span>
        </div>
      </div>

      {/* Audit Log Timeline Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/75 text-slate-500 uppercase tracking-wider font-semibold">
                <th className="px-5 py-3.5">Action & Entity</th>
                <th className="px-4 py-3.5">Target Name / ID</th>
                <th className="px-4 py-3.5">Performed By</th>
                <th className="px-4 py-3.5">Reason / Note</th>
                <th className="px-4 py-3.5">Snapshot Diff</th>
                <th className="px-5 py-3.5 text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-400">
                    {loading ? "Loading audit logs..." : "No commercial audit logs found."}
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log._id} className="transition hover:bg-slate-50/50">
                    <td className="px-5 py-4">
                      <span className="rounded-md bg-indigo-50 px-2 py-0.5 font-bold font-mono text-[10px] text-indigo-700">
                        {log.action}
                      </span>
                      <span className="block text-[10px] text-slate-400 mt-1 uppercase font-semibold">
                        {log.targetType}
                      </span>
                    </td>
                    <td className="px-4 py-4 font-semibold text-slate-900">
                      {log.targetName || log.targetId || "-"}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1.5 font-medium text-slate-800">
                        <LuUser className="h-3.5 w-3.5 text-slate-400" />
                        <span>{log.performedBy?.email || "Super Admin"}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 ml-5 block">{log.performedBy?.role}</span>
                    </td>
                    <td className="px-4 py-4 text-slate-600 max-w-xs truncate">
                      {log.reason || "Administrative update"}
                    </td>
                    <td className="px-4 py-4">
                      {log.afterSnapshot ? (
                        <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                          Captured
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[10px]">-</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-right text-slate-400 text-[11px] whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
