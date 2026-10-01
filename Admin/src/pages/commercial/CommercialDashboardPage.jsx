import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  LuBadgePercent,
  LuLayers,
  LuPackage,
  LuReceipt,
  LuTrendingUp,
  LuUsers,
  LuWallet,
  LuTriangleAlert,
  LuArrowUpRight,
  LuPlus,
  LuRefreshCw,
  LuClock,
} from "react-icons/lu";
import { getCommercialDashboard } from "../../services/adminApi";

export default function CommercialDashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getCommercialDashboard();
      if (res.success) {
        setStats(res.data);
      }
    } catch (err) {
      setError(err.message || "Failed to load commercial analytics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const formatCurrency = (val) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  if (loading && !stats) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-6 py-4 shadow-sm">
          <LuRefreshCw className="h-5 w-5 animate-spin text-indigo-600" />
          <span className="text-sm font-medium text-slate-600">Loading Commercial Engine...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Top Banner & Quick Actions */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live Commercial Engine
            </span>
          </div>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
            Commercial Overview
          </h1>
          <p className="text-sm text-slate-500">
            Real-time governance over products, plans, pricing, entitlements, and credit ledgers.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={loadData}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            <LuRefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
          </button>
          <Link
            to="/admin/commercial/products"
            className="flex items-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2.5 text-xs font-semibold text-indigo-700 shadow-sm transition hover:bg-indigo-100"
          >
            <LuPlus className="h-3.5 w-3.5" /> + New Product
          </Link>
          <Link
            to="/admin/commercial/plans"
            className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-indigo-700"
          >
            <LuPlus className="h-3.5 w-3.5" /> + Build Plan
          </Link>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
          <LuTriangleAlert className="h-5 w-5 text-rose-500 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {/* Estimated MRR */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-500">Est. MRR</span>
            <div className="rounded-xl bg-indigo-50 p-2.5 text-indigo-600">
              <LuTrendingUp className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900">{formatCurrency(stats?.mrr)}</div>
            <p className="mt-1 text-xs text-slate-500">Normalized 30-day active recurring rate</p>
          </div>
        </div>

        {/* Total Commercial Revenue */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-500">Total Revenue</span>
            <div className="rounded-xl bg-emerald-50 p-2.5 text-emerald-600">
              <LuWallet className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900">{formatCurrency(stats?.totalRevenue)}</div>
            <p className="mt-1 text-xs text-slate-500">{stats?.totalOrdersCount || 0} completed commercial orders</p>
          </div>
        </div>

        {/* Active Subscriptions */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-500">Active Subscriptions</span>
            <div className="rounded-xl bg-blue-50 p-2.5 text-blue-600">
              <LuReceipt className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900">{stats?.activeSubscriptions || 0}</div>
            <p className="mt-1 text-xs text-slate-500">{stats?.standaloneSubscriptions || 0} standalone add-on purchases</p>
          </div>
        </div>

        {/* Catalog: Products & Plans */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-500">Commercial Catalog</span>
            <div className="rounded-xl bg-amber-50 p-2.5 text-amber-600">
              <LuLayers className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-3">
            <div className="text-2xl font-bold text-slate-900">{stats?.activePlans || 0} Plans</div>
            <span className="text-xs font-medium text-slate-400">/ {stats?.activeProducts || 0} Products</span>
          </div>
          <p className="mt-1 text-xs text-slate-500">{stats?.expiredSubscriptions || 0} historical expired subscriptions</p>
        </div>
      </div>

      {/* Mid Section: Credit Consumption & Top Plans */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Credit Consumption Breakdown */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-base font-semibold text-slate-900">Total Credit Consumption</h2>
              <p className="text-xs text-slate-500">Real-time volume consumed by recruiters across the platform</p>
            </div>
            <Link
              to="/admin/commercial/credit-ledger"
              className="flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700"
            >
              Full Ledger <LuArrowUpRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="mt-5 space-y-4">
            {(!stats?.consumptionByProduct || stats.consumptionByProduct.length === 0) ? (
              <p className="py-8 text-center text-xs text-slate-400">No credit consumption events recorded yet.</p>
            ) : (
              stats.consumptionByProduct.map((item) => {
                const total = stats.consumptionByProduct.reduce((acc, c) => acc + c.totalConsumed, 0);
                const percent = total > 0 ? Math.round((item.totalConsumed / total) * 100) : 0;

                return (
                  <div key={item._id} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-medium">
                      <span className="text-slate-800 font-semibold">{item._id}</span>
                      <span className="text-slate-500">
                        {item.totalConsumed.toLocaleString()} consumed ({item.eventsCount} events)
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-indigo-500 transition-all duration-500"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Most Purchased Plans */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-base font-semibold text-slate-900">Most Purchased Plans</h2>
              <p className="text-xs text-slate-500">Subscription volume by plan package</p>
            </div>
            <Link
              to="/admin/commercial/plans"
              className="flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700"
            >
              Manage Plans <LuArrowUpRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="mt-5 divide-y divide-slate-100">
            {(!stats?.popularPlans || stats.popularPlans.length === 0) ? (
              <p className="py-8 text-center text-xs text-slate-400">No plan subscription history yet.</p>
            ) : (
              stats.popularPlans.map((plan) => (
                <div key={plan.planId} className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700 font-bold text-xs">
                      {plan.type?.slice(0, 3) || "PLN"}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{plan.name}</p>
                      <p className="text-xs text-slate-400">Code: {plan.code}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                      {plan.count} purchases
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Expiring Subscriptions Alert Panel */}
      <div className="rounded-2xl border border-amber-200/80 bg-amber-50/30 p-6 shadow-sm">
        <div className="flex items-center justify-between pb-4 border-b border-amber-100">
          <div className="flex items-center gap-2.5">
            <div className="rounded-lg bg-amber-100 p-2 text-amber-700">
              <LuClock className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">Expiring Soon (Next 7 Days)</h2>
              <p className="text-xs text-slate-500">Active company plans reaching end of validity</p>
            </div>
          </div>
          <Link
            to="/admin/commercial/subscriptions"
            className="text-xs font-semibold text-amber-800 hover:underline"
          >
            View All Subscriptions
          </Link>
        </div>

        <div className="mt-4 overflow-x-auto">
          {(!stats?.expiringSoon || stats.expiringSoon.length === 0) ? (
            <p className="py-6 text-center text-xs text-slate-400">No subscriptions expiring in the next 7 days.</p>
          ) : (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-amber-200/60 text-slate-500">
                  <th className="pb-2 font-medium">Company</th>
                  <th className="pb-2 font-medium">Plan / Item</th>
                  <th className="pb-2 font-medium">Expiry Date</th>
                  <th className="pb-2 font-medium">Price Paid</th>
                  <th className="pb-2 font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-amber-100/70">
                {stats.expiringSoon.map((sub) => (
                  <tr key={sub._id} className="text-slate-800">
                    <td className="py-3 font-semibold">{sub.companyId?.name || "Client"}</td>
                    <td className="py-3">{sub.commercialSnapshot?.planName || sub.planId?.name || "Plan"}</td>
                    <td className="py-3 text-amber-700 font-medium">
                      {new Date(sub.endDate).toLocaleDateString()}
                    </td>
                    <td className="py-3">{formatCurrency(sub.commercialSnapshot?.pricePaid)}</td>
                    <td className="py-3">
                      <Link
                        to={`/admin/commercial/subscriptions`}
                        className="rounded-lg bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 border border-slate-200 shadow-xs hover:bg-slate-50"
                      >
                        Inspect
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
