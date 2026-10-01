import { useEffect, useState } from "react";
import {
  LuReceipt,
  LuSearch,
  LuRefreshCw,
  LuEye,
  LuCircleCheck,
  LuClock,
  LuLayers,
  LuPackage,
  LuX,
  LuTriangleAlert,
} from "react-icons/lu";
import {
  getCommercialSubscriptions,
  getCommercialSubscriptionById,
} from "../../services/adminApi";

export default function CommercialSubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [status, setStatus] = useState("");
  const [subscriptionType, setSubscriptionType] = useState("");
  const [selectedSub, setSelectedSub] = useState(null);
  const [inspectLoading, setInspectLoading] = useState(false);

  const loadSubscriptions = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getCommercialSubscriptions({ status, subscriptionType });
      if (res.success) {
        setSubscriptions(res.subscriptions || []);
        setTotal(res.total || 0);
      }
    } catch (err) {
      setError(err.message || "Failed to load subscriptions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSubscriptions();
  }, [status, subscriptionType]);

  const handleInspect = async (subId) => {
    setInspectLoading(true);
    try {
      const res = await getCommercialSubscriptionById(subId);
      if (res.success) {
        setSelectedSub(res.data);
      }
    } catch (err) {
      alert(err.message || "Failed to load subscription details");
    } finally {
      setInspectLoading(false);
    }
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
            Subscriptions & Entitlements
          </h1>
          <p className="text-sm text-slate-500">
            Real-time registry of all active, historical, and scheduled company commercial subscriptions.
          </p>
        </div>
        <button
          onClick={loadSubscriptions}
          className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 self-start md:self-auto"
        >
          <LuRefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <select
          value={subscriptionType}
          onChange={(e) => setSubscriptionType(e.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 focus:outline-none"
        >
          <option value="">All Subscription Types</option>
          <option value="PLAN">Plan Subscriptions</option>
          <option value="STANDALONE">Standalone Product Purchases</option>
          <option value="ADD_ON">Add-on Purchases</option>
        </select>

        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 focus:outline-none"
        >
          <option value="">All Statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="EXPIRED">Expired</option>
          <option value="SCHEDULED">Scheduled</option>
          <option value="UPGRADED">Upgraded</option>
        </select>

        <span className="ml-auto text-xs text-slate-400 font-medium">{total} total subscriptions</span>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/75 text-slate-500 uppercase tracking-wider font-semibold">
                <th className="px-5 py-3.5">Company</th>
                <th className="px-4 py-3.5">Type</th>
                <th className="px-4 py-3.5">Plan / Product Item</th>
                <th className="px-4 py-3.5">Version</th>
                <th className="px-4 py-3.5">Price Paid</th>
                <th className="px-4 py-3.5">Validity Dates</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {subscriptions.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-400">
                    {loading ? "Loading subscriptions..." : "No subscriptions found."}
                  </td>
                </tr>
              ) : (
                subscriptions.map((sub) => {
                  const now = new Date();
                  const isExpiringSoon =
                    sub.status === "ACTIVE" &&
                    new Date(sub.endDate) > now &&
                    new Date(sub.endDate) - now < 7 * 24 * 60 * 60 * 1000;

                  return (
                    <tr key={sub._id} className="transition hover:bg-slate-50/50">
                      <td className="px-5 py-4">
                        <div className="font-bold text-slate-900">{sub.companyId?.name || "Company"}</div>
                        <div className="text-[11px] text-slate-400">{sub.companyId?.email}</div>
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${
                            sub.subscriptionType === "PLAN"
                              ? "bg-indigo-50 text-indigo-700"
                              : "bg-emerald-50 text-emerald-700"
                          }`}
                        >
                          {sub.subscriptionType}
                        </span>
                      </td>
                      <td className="px-4 py-4 font-semibold text-slate-800">
                        {sub.commercialSnapshot?.planName ||
                          sub.commercialSnapshot?.productName ||
                          sub.planId?.name ||
                          sub.productId?.name ||
                          "Commercial Item"}
                      </td>
                      <td className="px-4 py-4 font-mono font-semibold text-slate-600">
                        {sub.planVersionNumber ? `v${sub.planVersionNumber}` : "-"}
                      </td>
                      <td className="px-4 py-4 font-bold text-slate-900">
                        {formatCurrency(sub.commercialSnapshot?.pricePaid)}
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-slate-800 font-medium">
                          {new Date(sub.startDate).toLocaleDateString()} — {new Date(sub.endDate).toLocaleDateString()}
                        </div>
                        {isExpiringSoon && (
                          <span className="text-[10px] font-semibold text-amber-600 flex items-center gap-1 mt-0.5">
                            <LuClock className="h-3 w-3" /> Expiring soon
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                            sub.status === "ACTIVE"
                              ? "bg-emerald-50 text-emerald-700"
                              : sub.status === "SCHEDULED"
                              ? "bg-blue-50 text-blue-700"
                              : sub.status === "UPGRADED"
                              ? "bg-indigo-50 text-indigo-700"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {sub.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button
                          onClick={() => handleInspect(sub._id)}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-indigo-600 shadow-xs hover:bg-indigo-50"
                        >
                          <LuEye className="h-3.5 w-3.5" /> Inspect
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Subscription Inspector Modal */}
      {selectedSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="rounded-md bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-700 uppercase">
                  {selectedSub.subscriptionType} SUBSCRIPTION
                </span>
                <h2 className="text-lg font-bold text-slate-900 mt-1">
                  {selectedSub.companyId?.name} — {selectedSub.commercialSnapshot?.planName || "Subscription"}
                </h2>
              </div>
              <button
                onClick={() => setSelectedSub(null)}
                className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <LuX className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-5 space-y-5 max-h-[75vh] overflow-y-auto pr-1 text-xs">
              {/* Commercial Snapshot Card (Immutable from purchase) */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                  Immutable Commercial Snapshot (At Purchase)
                </h3>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Price Paid</span>
                    <span className="font-bold text-slate-900 text-sm">
                      {formatCurrency(selectedSub.commercialSnapshot?.pricePaid)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Tax Paid</span>
                    <span className="font-semibold text-slate-700">
                      {formatCurrency(selectedSub.commercialSnapshot?.taxPaid)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Purchased Date</span>
                    <span className="font-semibold text-slate-700">
                      {new Date(selectedSub.commercialSnapshot?.purchasedAt || selectedSub.startDate).toLocaleDateString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Status</span>
                    <span className="font-bold text-emerald-700">{selectedSub.status}</span>
                  </div>
                </div>
              </div>

              {/* Entitlement Snapshot & Live Remaining Balances */}
              <div>
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                  Entitlements & Live Credit Consumption
                </h3>

                <div className="space-y-2.5">
                  {(selectedSub.entitlements || []).map((ent) => {
                    const consumed = ent.consumedQuantity || 0;
                    const allocated = ent.allocatedQuantity || 0;
                    const remaining = ent.remainingQuantity || 0;
                    const percent = allocated > 0 ? Math.round((consumed / allocated) * 100) : 0;

                    return (
                      <div key={ent._id} className="rounded-xl border border-slate-200 p-3 bg-white">
                        <div className="flex items-center justify-between font-medium">
                          <span className="font-bold text-slate-900">{ent.productName} ({ent.productCode})</span>
                          <span className="text-indigo-700 font-semibold">
                            {remaining} {ent.unit}s remaining ({consumed} used / {allocated} total)
                          </span>
                        </div>
                        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                          <div
                            className={`h-full rounded-full transition-all ${
                              percent > 80 ? "bg-amber-500" : "bg-emerald-500"
                            }`}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                        <div className="mt-1 flex justify-between text-[10px] text-slate-400">
                          <span>Expires: {new Date(ent.expiryDate).toLocaleDateString()}</span>
                          <span>User Limit: {ent.userLimit || 1} seat(s)</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
