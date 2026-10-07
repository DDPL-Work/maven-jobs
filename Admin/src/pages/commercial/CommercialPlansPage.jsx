import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  LuPlus,
  LuRefreshCw,
  LuEye,
  LuPencil,
  LuHistory,
  LuCircleCheck,
  LuCircleX,
  LuX,
  LuSparkles,
  LuLayers,
  LuCalendar,
  LuShieldCheck,
  LuUsers,
} from "react-icons/lu";
import {
  getCommercialPlans,
  getCommercialPlanById,
  setCommercialPlanStatus,
  createCommercialPlanVersion,
  publishCommercialPlanVersion,
} from "../../services/adminApi";

export { STANDARD_PLAN_CODES } from "./CommercialPlanBuilderPage";

export function computePlanPricing(ver = {}, fallbackPlan = {}) {
  const basePrice = Number(ver?.basePrice ?? fallbackPlan?.basePrice ?? 0);
  const discount = Number(ver?.discount ?? fallbackPlan?.discount ?? 0);
  const taxable = Math.max(0, basePrice - discount);

  let taxType = ver?.taxType || fallbackPlan?.taxType;
  let igstRate = Number(ver?.igstRate ?? fallbackPlan?.igstRate ?? 0);
  let cgstRate = Number(ver?.cgstRate ?? fallbackPlan?.cgstRate ?? 0);
  let sgstRate = Number(ver?.sgstRate ?? fallbackPlan?.sgstRate ?? 0);

  if (!taxType) {
    if (cgstRate > 0 || sgstRate > 0) {
      taxType = "CGST_SGST";
    } else if (igstRate > 0) {
      taxType = "IGST";
    } else {
      const fallbackTax = Number(ver?.taxPercent ?? fallbackPlan?.taxPercent ?? 18);
      taxType = "IGST";
      igstRate = fallbackTax;
    }
  }

  // Mutual exclusion rule
  if (taxType === "IGST") {
    cgstRate = 0;
    sgstRate = 0;
    if (igstRate === 0 && (ver?.taxPercent || fallbackPlan?.taxPercent)) {
      igstRate = Number(ver?.taxPercent ?? fallbackPlan?.taxPercent ?? 18);
    }
  } else if (taxType === "CGST_SGST") {
    igstRate = 0;
    if (cgstRate === 0 && sgstRate === 0 && (ver?.taxPercent || fallbackPlan?.taxPercent)) {
      const half = Number(ver?.taxPercent ?? fallbackPlan?.taxPercent ?? 18) / 2;
      cgstRate = half;
      sgstRate = half;
    }
  } else if (taxType === "NONE") {
    igstRate = 0;
    cgstRate = 0;
    sgstRate = 0;
  }

  const effectiveTaxPercent = taxType === "IGST" ? igstRate : taxType === "CGST_SGST" ? (cgstRate + sgstRate) : 0;

  let igstAmount = Number(ver?.igstAmount ?? fallbackPlan?.igstAmount ?? 0);
  let cgstAmount = Number(ver?.cgstAmount ?? fallbackPlan?.cgstAmount ?? 0);
  let sgstAmount = Number(ver?.sgstAmount ?? fallbackPlan?.sgstAmount ?? 0);

  if (taxType === "IGST") {
    igstAmount = Math.round((taxable * igstRate) / 100);
    cgstAmount = 0;
    sgstAmount = 0;
  } else if (taxType === "CGST_SGST") {
    igstAmount = 0;
    cgstAmount = Math.round((taxable * cgstRate) / 100);
    sgstAmount = Math.round((taxable * sgstRate) / 100);
  } else {
    igstAmount = 0;
    cgstAmount = 0;
    sgstAmount = 0;
  }

  const taxAmount = igstAmount + cgstAmount + sgstAmount;
  const computedFinal = Math.round(taxable + taxAmount);
  const finalPayablePrice =
    ver?.finalPrice !== undefined && ver?.finalPrice !== null && Number(ver.finalPrice) > 0
      ? Number(ver.finalPrice)
      : computedFinal;

  return {
    basePrice,
    discount,
    taxable,
    taxType,
    igstRate,
    cgstRate,
    sgstRate,
    igstAmount,
    cgstAmount,
    sgstAmount,
    taxPercent: effectiveTaxPercent,
    taxAmount,
    finalPayablePrice,
  };
}

export default function CommercialPlansPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Plan Detail Modal State
  const [inspectingPlan, setInspectingPlan] = useState(null);
  const [detailTab, setDetailTab] = useState("overview");

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const plansRes = await getCommercialPlans();
      if (plansRes.success) setPlans(plansRes.plans || []);
    } catch (err) {
      setError(err.message || "Failed to load plans");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (location.state?.successMsg) {
      setSuccessMsg(location.state.successMsg);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // Inspect Plan Details
  const handleInspectPlan = async (planId) => {
    try {
      const res = await getCommercialPlanById(planId);
      if (res.success) {
        setInspectingPlan(res.data);
        setDetailTab("overview");
      }
    } catch (err) {
      alert(err.message || "Failed to load plan details");
    }
  };

  // Create New Version for an existing plan
  const handleCreateNewVersion = async (plan) => {
    const nextVer = (plan.currentVersion || 1) + 1;
    if (
      !confirm(
        `Create new draft Version v${nextVer} for '${plan.name}'? Existing subscribers will remain on their current version.`
      )
    )
      return;

    try {
      const activeVersion = plan.activeVersion || {};
      const pricing = computePlanPricing(activeVersion, plan);
      await createCommercialPlanVersion(plan._id, {
        changelog: `New draft version ${nextVer} initiated by admin`,
        basePrice: pricing.basePrice,
        discount: pricing.discount,
        discountPercent: pricing.basePrice > 0 ? Math.round((pricing.discount / pricing.basePrice) * 100) : 0,
        taxType: pricing.taxType,
        igstRate: pricing.igstRate,
        cgstRate: pricing.cgstRate,
        sgstRate: pricing.sgstRate,
        igstAmount: pricing.igstAmount,
        cgstAmount: pricing.cgstAmount,
        sgstAmount: pricing.sgstAmount,
        taxPercent: pricing.taxPercent,
        taxAmount: pricing.taxAmount,
        finalPrice: pricing.finalPayablePrice,
        sellPrice: pricing.finalPayablePrice,
        finalPayablePrice: pricing.finalPayablePrice,
        validity: activeVersion.validity || 90,
        items: activeVersion.items || [],
      });
      setSuccessMsg(
        `Draft v${nextVer} created! You can now adjust product limits and publish when ready.`
      );
      loadData();
      handleInspectPlan(plan._id);
    } catch (err) {
      alert(err.message || "Failed to create new version");
    }
  };

  // Publish a draft version
  const handlePublishVersion = async (planId, versionId) => {
    if (
      !confirm(
        "Are you sure you want to publish this version? It will become the active version for all new purchases."
      )
    )
      return;
    try {
      await publishCommercialPlanVersion(planId, versionId);
      setSuccessMsg("Plan version published successfully!");
      loadData();
      handleInspectPlan(planId);
    } catch (err) {
      alert(err.message || "Failed to publish version");
    }
  };

  const handleTogglePlanStatus = async (plan, newStatus) => {
    if (!confirm(`Are you sure you want to set status to ${newStatus}?`)) return;
    try {
      await setCommercialPlanStatus(plan._id, newStatus);
      setSuccessMsg(`Plan status updated to ${newStatus}`);
      loadData();
    } catch (err) {
      alert(err.message || "Failed to update status");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
            Commercial Plans
          </h1>
          <p className="text-sm text-slate-500">
            Manage bundled commercial subscription packages, monitor subscribers, view version histories, and pricing.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            <LuRefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
          </button>
          <button
            onClick={() => navigate("/admin/commercial/plans/builder")}
            className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-indigo-700"
          >
            <LuPlus className="h-4 w-4" /> + Build New Plan
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center justify-between rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-medium text-rose-800">
          <span>{error}</span>
          <button onClick={() => setError("")} className="text-rose-700 hover:text-rose-900">
            <LuX className="h-4 w-4" />
          </button>
        </div>
      )}

      {successMsg && (
        <div className="flex items-center justify-between rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-medium text-emerald-800">
          <span>{successMsg}</span>
          <button onClick={() => setSuccessMsg("")} className="text-emerald-700 hover:text-emerald-900">
            <LuX className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Plans List Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/75 text-slate-500 uppercase tracking-wider font-semibold">
                <th className="px-5 py-3.5">Plan Name & Code</th>
                <th className="px-4 py-3.5">Type</th>
                <th className="px-4 py-3.5">Published Version</th>
                <th className="px-4 py-3.5">Validity</th>
                <th className="px-4 py-3.5">Final Price (Incl. GST)</th>
                <th className="px-4 py-3.5">Key Entitlements</th>
                <th className="px-4 py-3.5">Subscribers</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {plans.length === 0 ? (
                <tr>
                  <td colSpan="9" className="py-12 text-center text-slate-400">
                    {loading ? "Loading plans..." : "No commercial plans found."}
                  </td>
                </tr>
              ) : (
                plans.map((plan) => {
                  const ver = plan.activeVersion || {};
                  const rowPricing = computePlanPricing(ver, plan);
                  return (
                    <tr key={plan._id} className="transition hover:bg-slate-50/50">
                      <td className="px-5 py-4">
                        <div className="font-bold text-slate-900 flex items-center gap-1.5">
                          {plan.name}
                          {plan.featured && (
                            <span className="rounded-full bg-amber-50 px-1.5 py-0.5 text-[9px] font-bold text-amber-700 border border-amber-200">
                              FEATURED
                            </span>
                          )}
                        </div>
                        <div className="font-mono text-[11px] text-slate-400 font-semibold">{plan.code}</div>
                      </td>
                      <td className="px-4 py-4">
                        <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700">
                          {plan.planType}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span className="rounded-md bg-indigo-50 px-2 py-0.5 font-mono text-[11px] font-bold text-indigo-700">
                          v{plan.currentVersion || 1}
                        </span>
                      </td>
                      <td className="px-4 py-4 font-medium text-slate-700">
                        {ver.validity || 90} {ver.validityUnit?.toLowerCase() || "days"}
                      </td>
                      <td className="px-4 py-4 font-bold text-slate-900">
                        ₹{rowPricing.finalPayablePrice.toLocaleString()}
                        <span className="block text-[10px] text-slate-400 font-normal">
                          Base: ₹{rowPricing.basePrice.toLocaleString()}
                          {rowPricing.taxAmount > 0 ? ` + GST` : ""}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {(ver.items || []).slice(0, 3).map((it, idx) => (
                            <span
                              key={idx}
                              className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600"
                            >
                              {it.quantity} {it.productCode}
                            </span>
                          ))}
                          {(ver.items || []).length > 3 && (
                            <span className="text-[10px] text-slate-400">
                              +{(ver.items || []).length - 3} more
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4 font-semibold text-slate-800">
                        {plan.activeSubscribersCount || 0} active
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                            plan.status === "ACTIVE"
                              ? "bg-emerald-50 text-emerald-700"
                              : plan.status === "INACTIVE"
                              ? "bg-amber-50 text-amber-700"
                              : "bg-rose-50 text-rose-700"
                          }`}
                        >
                          {plan.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleInspectPlan(plan._id)}
                            title="View Details & Versions"
                            className="rounded-lg p-1.5 text-indigo-600 hover:bg-indigo-50"
                          >
                            <LuEye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() =>
                              navigate(`/admin/commercial/plans/builder/${plan._id}`, {
                                state: { plan },
                              })
                            }
                            title="Edit Plan"
                            className="rounded-lg p-1.5 text-blue-600 hover:bg-blue-50"
                          >
                            <LuPencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleCreateNewVersion(plan)}
                            title="Create New Version"
                            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                          >
                            <LuHistory className="h-4 w-4" />
                          </button>
                          {plan.status === "ACTIVE" ? (
                            <button
                              onClick={() => handleTogglePlanStatus(plan, "INACTIVE")}
                              title="Deactivate Plan"
                              className="rounded-lg p-1.5 text-amber-500 hover:bg-amber-50"
                            >
                              <LuCircleX className="h-4 w-4" />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleTogglePlanStatus(plan, "ACTIVE")}
                              title="Activate Plan"
                              className="rounded-lg p-1.5 text-emerald-600 hover:bg-emerald-50"
                            >
                              <LuCircleCheck className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Plan Details & Version History Modal */}
      {inspectingPlan && (() => {
        const activeVer =
          inspectingPlan.publishedVersion ||
          inspectingPlan.activeVersion ||
          (inspectingPlan.versions || []).find((v) => v.status === "PUBLISHED") ||
          inspectingPlan.versions?.[0] ||
          {};
        const pricing = computePlanPricing(activeVer, inspectingPlan);
        const planDays = activeVer.validity || inspectingPlan.validity || 90;
        const items = activeVer.items || [];

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-6 overflow-y-auto">
            <div className="relative w-full max-w-5xl xl:max-w-6xl max-h-[92vh] flex flex-col rounded-3xl bg-white shadow-2xl my-auto overflow-hidden animate-in fade-in zoom-in-95 duration-150 border border-slate-100">
              {/* Modal Fixed Header & Tabs */}
              <div className="border-b border-slate-100 px-6 pt-5 pb-0 flex-shrink-0 bg-white">
                <div className="flex items-start justify-between pb-4 gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="rounded-lg bg-indigo-50 border border-indigo-200/80 px-2.5 py-0.5 text-xs font-bold text-indigo-700 font-mono">
                        {inspectingPlan.code}
                      </span>
                      <span className="rounded-lg bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700">
                        {inspectingPlan.planType || "CUSTOM"}
                      </span>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                          inspectingPlan.status === "ACTIVE"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-slate-100 text-slate-600 border border-slate-200"
                        }`}
                      >
                        {inspectingPlan.status || "ACTIVE"}
                      </span>
                      {inspectingPlan.featured && (
                        <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700 border border-amber-200">
                          FEATURED PLAN
                        </span>
                      )}
                    </div>
                    <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                      {inspectingPlan.name}
                    </h2>
                    <p className="text-xs text-slate-500">
                      Comprehensive plan breakdown, itemized catalog entitlements, version history, and accurate pricing.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => {
                        const planToEdit = inspectingPlan;
                        setInspectingPlan(null);
                        navigate(`/admin/commercial/plans/builder/${planToEdit._id}`, {
                          state: { plan: planToEdit },
                        });
                      }}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 px-3.5 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 transition shadow-2xs"
                      title="Edit this plan configuration"
                    >
                      <LuPencil className="h-3.5 w-3.5" /> Edit Plan
                    </button>
                    <button
                      onClick={() => setInspectingPlan(null)}
                      className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
                    >
                      <LuX className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                {/* Tabs */}
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setDetailTab("overview")}
                    className={`pb-2.5 text-xs font-semibold border-b-2 transition flex items-center gap-1.5 ${
                      detailTab === "overview"
                        ? "border-indigo-600 text-indigo-600"
                        : "border-transparent text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    <LuLayers className="h-3.5 w-3.5" />
                    Overview & Products ({items.length})
                  </button>
                  <button
                    onClick={() => setDetailTab("versions")}
                    className={`pb-2.5 text-xs font-semibold border-b-2 transition flex items-center gap-1.5 ${
                      detailTab === "versions"
                        ? "border-indigo-600 text-indigo-600"
                        : "border-transparent text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    <LuHistory className="h-3.5 w-3.5" />
                    Version History ({(inspectingPlan.versions || []).length})
                  </button>
                </div>
              </div>

              {/* Scrollable Modal Content Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Overview Tab Content */}
                {detailTab === "overview" && (
                  <div className="space-y-6">
                    {/* Top 4 Metrics */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100">
                        <span className="text-slate-400 block text-[11px] font-medium">Active Version</span>
                        <span className="font-bold text-indigo-700 text-base mt-0.5 block">
                          v{activeVer.version || inspectingPlan.currentVersion || 1}
                        </span>
                        <span className="text-[10px] text-slate-500 mt-1 inline-flex items-center gap-1">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                          Status: {activeVer.status || "PUBLISHED"}
                        </span>
                      </div>

                      <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100">
                        <span className="text-slate-400 block text-[11px] font-medium">Plan Validity</span>
                        <span className="font-bold text-slate-900 text-base mt-0.5 block">
                          {planDays} Days
                        </span>
                        <span className="text-[10px] text-slate-500 mt-1 block">
                          Payment on Purchase
                        </span>
                      </div>

                      <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100">
                        <span className="text-slate-400 block text-[11px] font-medium">Active Subscribers</span>
                        <span className="font-bold text-emerald-700 text-base mt-0.5 block">
                          {inspectingPlan.activeSubscribersCount || 0}
                        </span>
                        <span className="text-[10px] text-slate-500 mt-1 block">
                          Enrolled Companies
                        </span>
                      </div>

                      <div className="rounded-2xl bg-indigo-50/60 p-4 border border-indigo-100">
                        <span className="text-indigo-600 block text-[11px] font-medium">Final Payable Price</span>
                        <span className="font-black text-indigo-800 text-base mt-0.5 block">
                          ₹{pricing.finalPayablePrice.toLocaleString()}
                        </span>
                        <span className="text-[10px] text-indigo-600 mt-1 block font-medium">
                          Incl. {pricing.taxPercent}% GST
                        </span>
                      </div>
                    </div>

                    {/* Detailed Pricing Breakdown Card */}
                    <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/70 via-white to-slate-50 p-5 shadow-xs">
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-indigo-100/70">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="rounded-md bg-indigo-600 px-2 py-0.5 text-[10px] font-bold text-white uppercase tracking-wider">
                              Verified Commercial Pricing
                            </span>
                            <span className="text-[11px] font-medium text-slate-500">
                              Payment on Purchase
                            </span>
                          </div>
                          <h3 className="text-base font-bold text-slate-900 mt-1">
                            Final Payable Amount: ₹{pricing.finalPayablePrice.toLocaleString()}
                          </h3>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Total amount payable by subscribing company, inclusive of catalog products and {pricing.taxPercent}% GST.
                          </p>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="rounded-2xl bg-white border border-indigo-200/80 px-4 py-3 shadow-xs text-right min-w-[210px]">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                              Final Payable Price
                            </span>
                            <span className="text-2xl font-black text-indigo-700 tracking-tight">
                              ₹{pricing.finalPayablePrice.toLocaleString()}
                            </span>
                            <span className="block text-[10px] text-emerald-600 font-semibold mt-0.5">
                              Net payable with all taxes
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 text-xs">
                        <div className="rounded-xl bg-white p-3 border border-slate-200/80 shadow-2xs">
                          <span className="text-slate-400 block text-[11px] font-medium">Base Selling Price</span>
                          <span className="font-bold text-slate-800 text-sm mt-0.5 block">
                            ₹{pricing.basePrice.toLocaleString()}
                          </span>
                          <span className="text-[10px] text-slate-400">Pre-discount catalog price</span>
                        </div>
                        <div className="rounded-xl bg-white p-3 border border-slate-200/80 shadow-2xs">
                          <span className="text-slate-400 block text-[11px] font-medium">Discount / Deduction</span>
                          <span
                            className={`font-bold text-sm mt-0.5 block ${
                              pricing.discount > 0 ? "text-emerald-600" : "text-slate-600"
                            }`}
                          >
                            {pricing.discount > 0 ? `- ₹${pricing.discount.toLocaleString()}` : "₹0 (None)"}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {pricing.discount > 0 ? "Promotional deduction" : "Standard list price"}
                          </span>
                        </div>
                        <div className="rounded-xl bg-white p-3 border border-slate-200/80 shadow-2xs">
                          <span className="text-slate-400 block text-[11px] font-medium">Taxable Base</span>
                          <span className="font-bold text-slate-800 text-sm mt-0.5 block">
                            ₹{pricing.taxable.toLocaleString()}
                          </span>
                          <span className="text-[10px] text-slate-400">Base minus discount</span>
                        </div>
                        <div className="rounded-xl bg-white p-3 border border-slate-200/80 shadow-2xs">
                          <span className="text-slate-400 block text-[11px] font-medium">
                            {pricing.taxType === "IGST"
                              ? `IGST (${pricing.igstRate}%)`
                              : pricing.taxType === "CGST_SGST"
                              ? `CGST+SGST (${pricing.cgstRate}% + ${pricing.sgstRate}%)`
                              : "Taxes"}
                          </span>
                          <span className="font-bold text-indigo-600 text-sm mt-0.5 block">
                            + ₹{pricing.taxAmount.toLocaleString()}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {pricing.taxType === "IGST"
                              ? "Inter-state supply (CGST & SGST: ₹0)"
                              : pricing.taxType === "CGST_SGST"
                              ? `CGST: ₹${pricing.cgstAmount.toLocaleString()} | SGST: ₹${pricing.sgstAmount.toLocaleString()} (IGST: ₹0)`
                              : "Tax exempt"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Included Products Section */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                            Included Products & Feature Allocations
                          </h4>
                          <p className="text-[11px] text-slate-500">
                            Products configured in active version v{activeVer.version || inspectingPlan.currentVersion || 1}
                          </p>
                        </div>
                        <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-700">
                          {items.length} Product{items.length === 1 ? "" : "s"} Configured
                        </span>
                      </div>

                      {items.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-slate-400 text-xs">
                          No products currently configured in this plan version.
                        </div>
                      ) : (
                        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
                              <tr>
                                <th className="px-4 py-3">Product Name & Code</th>
                                <th className="px-4 py-3">Quota & Allocation Cadence</th>
                                <th className="px-4 py-3">Catalog Base Price</th>
                                <th className="px-4 py-3">Reset / Validity Period</th>
                                <th className="px-4 py-3">Expiry Policy</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {items.map((it, idx) => {
                                const code = String(it.productCode || "").toUpperCase();
                                const isAi = code === "AI_CREDIT" || code.includes("AI");
                                const itemDays = it.validity || (isAi ? 30 : planDays);
                                const itemBasePrice = Number(it.basePrice || (it.unitPrice ? it.unitPrice * (it.quantity || 1) : 0));

                                return (
                                  <tr key={idx} className="hover:bg-slate-50/50 transition">
                                    <td className="px-4 py-3.5">
                                      <div className="font-bold text-slate-900 text-xs">
                                        {code === "RESDEX" || it.productName === "ResDex Resume Search" || String(it.productName).toLowerCase() === "resdex resume search"
                                          ? "Max CV Access"
                                          : code === "MIVITE" || it.productName === "MIvites Candidate Outreach" || String(it.productName).toLowerCase() === "mivites candidate outreach"
                                          ? "Max NVite Credits"
                                          : it.productName}
                                      </div>
                                      <div className="flex items-center gap-1.5 mt-0.5">
                                        <span className="rounded bg-slate-100 px-1.5 py-0.2 font-mono text-[10px] font-semibold text-slate-600">
                                          {it.productCode}
                                        </span>
                                      </div>
                                    </td>
                                    <td className="px-4 py-3.5">
                                      <div className="font-extrabold text-indigo-700 text-xs">
                                        {it.quantity} {it.unit || "Units"}{isAi ? " / month" : " total"}
                                      </div>
                                      {isAi ? (
                                        <span className="inline-block mt-1 rounded-md bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700 border border-amber-200">
                                          Monthly Quota • Resets every 30 days
                                        </span>
                                      ) : (
                                        <span className="inline-block mt-1 rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                                          Total Plan Allocation ({planDays} days)
                                        </span>
                                      )}
                                    </td>
                                    <td className="px-4 py-3.5">
                                      {itemBasePrice > 0 ? (
                                        <div>
                                          <div className="font-bold text-slate-800 text-xs">
                                            ₹{itemBasePrice.toLocaleString()}
                                          </div>
                                          {it.unitPrice > 0 && (
                                            <span className="block text-[10px] text-slate-400">
                                              @ ₹{Number(it.unitPrice).toLocaleString()} / unit
                                            </span>
                                          )}
                                        </div>
                                      ) : (
                                        <span className="text-slate-400 text-[11px] italic">Included in plan</span>
                                      )}
                                    </td>
                                    <td className="px-4 py-3.5 font-medium text-slate-700">
                                      {itemDays} Days
                                      <span className="block text-[10px] text-slate-400 font-normal">
                                        {isAi ? "No carry forward" : "Full plan lifecycle"}
                                      </span>
                                    </td>
                                    <td className="px-4 py-3.5">
                                      <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-mono text-slate-600">
                                        {it.expiryRule || (isAi ? "FIXED_DAYS" : "SUBSCRIPTION_END")}
                                      </span>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Versions Tab Content */}
                {detailTab === "versions" && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between pb-1">
                      <p className="text-xs text-slate-500">
                        Audit trail of plan versions, pricing revisions, and publication status.
                      </p>
                      <span className="text-xs font-bold text-slate-700">
                        {(inspectingPlan.versions || []).length} Version{(inspectingPlan.versions || []).length === 1 ? "" : "s"} Recorded
                      </span>
                    </div>

                    <div className="space-y-3 max-h-[55vh] overflow-y-auto pr-1">
                      {(inspectingPlan.versions || []).map((ver) => {
                        const verPricing = computePlanPricing(ver, inspectingPlan);
                        const isCurrent = ver.version === (inspectingPlan.currentVersion || 1);

                        return (
                          <div
                            key={ver._id}
                            className={`rounded-2xl border p-4.5 text-xs space-y-3 transition ${
                              isCurrent
                                ? "border-indigo-200 bg-indigo-50/20"
                                : "border-slate-200 bg-white hover:border-slate-300"
                            }`}
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                              <div className="flex items-center gap-2.5 flex-wrap">
                                <span className="font-extrabold text-slate-900 text-sm">
                                  Version v{ver.version}
                                </span>
                                <span
                                  className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                                    ver.status === "PUBLISHED"
                                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                      : ver.status === "DRAFT"
                                      ? "bg-amber-50 text-amber-700 border border-amber-200"
                                      : "bg-slate-100 text-slate-600 border border-slate-200"
                                  }`}
                                >
                                  {ver.status}
                                </span>
                                {isCurrent && (
                                  <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-bold text-indigo-700">
                                    ACTIVE IN MARKET
                                  </span>
                                )}
                                <span className="text-slate-400 font-medium">
                                  Validity: {ver.validity || planDays} days
                                </span>
                              </div>

                              <div className="text-right">
                                <div className="text-base font-black text-indigo-700">
                                  ₹{verPricing.finalPayablePrice.toLocaleString()}
                                </div>
                                <div className="text-[10px] text-slate-400">
                                  Base: ₹{verPricing.basePrice.toLocaleString()} | Tax: ₹{verPricing.taxAmount.toLocaleString()}
                                </div>
                              </div>
                            </div>

                            <div className="rounded-xl bg-slate-50/80 p-2.5 text-[11px] text-slate-600 border border-slate-100">
                              <span className="font-semibold text-slate-700">Changelog: </span>
                              {ver.changelog || "No changelog recorded for this version."}
                            </div>

                            <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[11px] text-slate-400">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-slate-600">
                                  {(ver.items || []).length} products configured
                                </span>
                                <div className="hidden sm:flex items-center gap-1">
                                  {(ver.items || []).slice(0, 4).map((it, idx) => (
                                    <span
                                      key={idx}
                                      className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] text-slate-600"
                                    >
                                      {it.quantity} {it.productCode}
                                    </span>
                                  ))}
                                  {(ver.items || []).length > 4 && (
                                    <span className="text-[10px] text-slate-400">
                                      +{(ver.items || []).length - 4} more
                                    </span>
                                  )}
                                </div>
                              </div>

                              {ver.status === "DRAFT" && (
                                <button
                                  onClick={() => handlePublishVersion(inspectingPlan._id, ver._id)}
                                  className="rounded-xl bg-emerald-600 px-3.5 py-1.5 font-bold text-white hover:bg-emerald-700 transition shadow-2xs"
                                >
                                  Publish Version v{ver.version}
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Fixed Footer */}
              <div className="border-t border-slate-100 px-6 py-4 flex items-center justify-between flex-shrink-0 bg-slate-50/80 rounded-b-3xl">
                <div className="text-xs text-slate-500 hidden sm:block">
                  <span className="font-semibold text-slate-700">{inspectingPlan.name}</span> ({inspectingPlan.code}) •{" "}
                  {planDays} Days • Payable: <span className="font-bold text-indigo-700">₹{pricing.finalPayablePrice.toLocaleString()}</span> (incl. {pricing.taxPercent}% GST)
                </div>
                <button
                  type="button"
                  onClick={() => setInspectingPlan(null)}
                  className="rounded-xl border border-slate-200 bg-white px-5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs ml-auto transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
