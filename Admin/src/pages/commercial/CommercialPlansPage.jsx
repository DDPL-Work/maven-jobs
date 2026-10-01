import { useEffect, useState, useMemo } from "react";
import {
  LuPlus,
  LuSearch,
  LuRefreshCw,
  LuLayers,
  LuPackage,
  LuCheck,
  LuTrash2,
  LuEye,
  LuPencil,
  LuHistory,
  LuCircleCheck,
  LuCircleX,
  LuTriangleAlert,
  LuX,
  LuArrowRight,
  LuShieldCheck,
  LuSparkles,
  LuUsers,
  LuClock,
  LuCalculator,
  LuReceipt,
  LuTrendingUp,
} from "react-icons/lu";
import {
  getCommercialPlans,
  getCommercialPlanById,
  createCommercialPlan,
  updateCommercialPlan,
  setCommercialPlanStatus,
  createCommercialPlanVersion,
  updateCommercialPlanVersion,
  publishCommercialPlanVersion,
  getCommercialProducts,
} from "../../services/adminApi";

export default function CommercialPlansPage() {
  const [plans, setPlans] = useState([]);
  const [availableProducts, setAvailableProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Plan Builder Modal State
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [editingPlanId, setEditingPlanId] = useState(null);
  const [builderStep, setBuilderStep] = useState(1);
  const [isPriceManuallyEdited, setIsPriceManuallyEdited] = useState(false);
  const [builderPlanForm, setBuilderPlanForm] = useState({
    name: "",
    code: "",
    planType: "SMB",
    description: "",
    billingCycle: "QUARTERLY",
    validity: 90,
    validityUnit: "DAYS",
    basePrice: 0,
    discount: 0,
    taxPercent: 18,
    items: [],
    publishImmediately: true,
  });

  // Step 2 Products Filter & Search State
  const [step2SearchQuery, setStep2SearchQuery] = useState("");
  const [step2CategoryFilter, setStep2CategoryFilter] = useState("ALL");

  // Plan Detail Modal State
  const [inspectingPlan, setInspectingPlan] = useState(null);
  const [detailTab, setDetailTab] = useState("overview");

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const [plansRes, prodsRes] = await Promise.all([
        getCommercialPlans(),
        getCommercialProducts({ status: "ACTIVE" }),
      ]);
      if (plansRes.success) setPlans(plansRes.plans || []);
      if (prodsRes.success) setAvailableProducts(prodsRes.products || []);
    } catch (err) {
      setError(err.message || "Failed to load plans");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Helper to find a product in available catalog
  const getCatalogProduct = (productId) => {
    return availableProducts.find((p) => String(p._id) === String(productId));
  };

  // Helper to calculate total price based on product type, quota count, and defaultPrice defined in product section
  const calculateItemsCatalogPrice = (itemsList) => {
    return (itemsList || []).reduce((sum, item) => {
      const prod = getCatalogProduct(item.productId);
      const unitPrice = prod?.defaultPrice ?? (Number(item.unitPrice) || 0);
      const qty = Number(item.quantity) || 0;
      return sum + qty * Number(unitPrice);
    }, 0);
  };

  // Helper to update items and automatically synchronize basePrice when not manually edited
  const updateItemsAndSyncPrice = (newItems) => {
    const newCatalogSum = calculateItemsCatalogPrice(newItems);
    setBuilderPlanForm((prev) => ({
      ...prev,
      items: newItems,
      basePrice: isPriceManuallyEdited ? prev.basePrice : newCatalogSum,
    }));
  };

  const handleResetToCatalogPrice = () => {
    const catalogSum = calculateItemsCatalogPrice(builderPlanForm.items);
    setBuilderPlanForm((prev) => ({
      ...prev,
      basePrice: catalogSum,
    }));
    setIsPriceManuallyEdited(false);
  };

  const openPlanBuilder = () => {
    setEditingPlanId(null);
    setBuilderStep(1);
    setStep2SearchQuery("");
    setStep2CategoryFilter("ALL");
    setIsPriceManuallyEdited(false);

    // Initialize default items from available products
    const initialItems = availableProducts.slice(0, 3).map((p) => ({
      productId: p._id,
      productCode: p.code,
      productName: p.name,
      productType: p.productType || "CREDIT_BASED",
      category: p.category,
      unitPrice: p.defaultPrice || 0,
      quantity: p.code === "RESDEX" ? 500 : p.code === "AI_CREDIT" ? 50 : 10,
      unit: p.unit || "Credit",
      validity: p.validity || 90,
      userLimit: p.category === "USER_SEATS" ? 1 : 3,
      features: p.features || [],
    }));

    // Dynamic calculated base price based on product count and defaultPrice from product creation
    const initialCatalogSum = calculateItemsCatalogPrice(initialItems);

    setBuilderPlanForm({
      name: "",
      code: "",
      planType: "SMB",
      description: "",
      billingCycle: "QUARTERLY",
      validity: 90,
      validityUnit: "DAYS",
      basePrice: initialCatalogSum,
      discount: 0,
      taxPercent: 18,
      items: initialItems,
      publishImmediately: true,
    });
    setIsBuilderOpen(true);
  };

  const handleEditPlan = (plan) => {
    setEditingPlanId(plan._id);
    setBuilderStep(1);
    setStep2SearchQuery("");
    setStep2CategoryFilter("ALL");

    const ver = plan.activeVersion || {};
    const existingItems = Array.isArray(ver.items) ? ver.items : [];

    const mappedItems = existingItems.map((it) => {
      const catalogProd = getCatalogProduct(it.productId);
      return {
        productId: it.productId,
        productCode: it.productCode || catalogProd?.code,
        productName: it.productName || catalogProd?.name,
        productType: it.productType || catalogProd?.productType || "CREDIT_BASED",
        category: it.category || catalogProd?.category,
        unitPrice: catalogProd?.defaultPrice ?? (Number(it.unitPrice) || 0),
        quantity: Number(it.quantity) || 1,
        unit: it.unit || catalogProd?.unit || "Credit",
        validity: it.validity || ver.validity || plan.validity || 90,
        userLimit: it.userLimit !== undefined ? it.userLimit : (catalogProd?.category === "USER_SEATS" ? 1 : 0),
        features: it.features || catalogProd?.features || [],
      };
    });

    const catalogPrice = calculateItemsCatalogPrice(mappedItems);
    const savedBasePrice = ver.basePrice !== undefined ? ver.basePrice : catalogPrice;

    setBuilderPlanForm({
      name: plan.name || "",
      code: plan.code || "",
      planType: plan.planType || "SMB",
      description: plan.description || "",
      billingCycle: ver.billingCycle || "QUARTERLY",
      validity: ver.validity || 90,
      validityUnit: ver.validityUnit || "DAYS",
      basePrice: savedBasePrice,
      discount: ver.discount || 0,
      taxPercent: ver.taxPercent !== undefined ? ver.taxPercent : 18,
      items: mappedItems,
      publishImmediately: true,
    });

    setIsPriceManuallyEdited(ver.basePrice !== undefined);
    setIsBuilderOpen(true);
  };

  const handleToggleProductInPlan = (prod) => {
    const isAlreadyIncluded = builderPlanForm.items.some(
      (i) => String(i.productId) === String(prod._id)
    );
    if (isAlreadyIncluded) {
      const updatedItems = builderPlanForm.items.filter(
        (i) => String(i.productId) !== String(prod._id)
      );
      updateItemsAndSyncPrice(updatedItems);
    } else {
      const defaultQty =
        prod.code === "RESDEX"
          ? 500
          : prod.code === "AI_CREDIT"
          ? 50
          : prod.code === "HOT_VACANCY"
          ? 2
          : prod.code === "SMB_JOB"
          ? 10
          : prod.category === "USER_SEATS"
          ? 1
          : 10;
      const newItem = {
        productId: prod._id,
        productCode: prod.code,
        productName: prod.name,
        productType: prod.productType || "CREDIT_BASED",
        category: prod.category,
        unitPrice: prod.defaultPrice || 0,
        quantity: defaultQty,
        unit: prod.unit || "Credit",
        validity: prod.validity || builderPlanForm.validity || 90,
        userLimit: prod.category === "USER_SEATS" ? 1 : 3,
        features: prod.features || [],
      };
      updateItemsAndSyncPrice([...builderPlanForm.items, newItem]);
    }
  };

  const handleRemoveProductFromPlan = (productId) => {
    const updatedItems = builderPlanForm.items.filter(
      (i) => String(i.productId) !== String(productId)
    );
    updateItemsAndSyncPrice(updatedItems);
  };

  const handleItemQuantityChange = (productId, qty) => {
    const updatedItems = builderPlanForm.items.map((i) =>
      String(i.productId) === String(productId) ? { ...i, quantity: Math.max(0, Number(qty)) } : i
    );
    updateItemsAndSyncPrice(updatedItems);
  };

  const handleUpdateItemField = (productId, field, value) => {
    const updatedItems = builderPlanForm.items.map((i) =>
      String(i.productId) === String(productId)
        ? {
            ...i,
            [field]: field === "unit" ? value : Math.max(0, Number(value)),
          }
        : i
    );
    if (field === "quantity") {
      updateItemsAndSyncPrice(updatedItems);
    } else {
      setBuilderPlanForm({ ...builderPlanForm, items: updatedItems });
    }
  };

  const handleSelectAllProducts = () => {
    const allItems = availableProducts.map((prod) => {
      const existing = builderPlanForm.items.find(
        (i) => String(i.productId) === String(prod._id)
      );
      if (existing) return existing;
      return {
        productId: prod._id,
        productCode: prod.code,
        productName: prod.name,
        productType: prod.productType || "CREDIT_BASED",
        category: prod.category,
        unitPrice: prod.defaultPrice || 0,
        quantity:
          prod.code === "RESDEX"
            ? 500
            : prod.code === "AI_CREDIT"
            ? 50
            : prod.code === "HOT_VACANCY"
            ? 2
            : prod.code === "SMB_JOB"
            ? 10
            : 10,
        unit: prod.unit || "Credit",
        validity: prod.validity || builderPlanForm.validity || 90,
        userLimit: prod.category === "USER_SEATS" ? 1 : 3,
        features: prod.features || [],
      };
    });
    updateItemsAndSyncPrice(allItems);
  };

  const handleDeselectAllProducts = () => {
    updateItemsAndSyncPrice([]);
  };

  // Filter products for Step 2
  const filteredProductsForStep2 = availableProducts.filter((prod) => {
    const matchesSearch =
      !step2SearchQuery.trim() ||
      prod.name?.toLowerCase().includes(step2SearchQuery.toLowerCase()) ||
      prod.code?.toLowerCase().includes(step2SearchQuery.toLowerCase()) ||
      (prod.category && prod.category.toLowerCase().includes(step2SearchQuery.toLowerCase()));

    const matchesCategory =
      step2CategoryFilter === "ALL" || prod.category === step2CategoryFilter;

    return matchesSearch && matchesCategory;
  });

  const handleSavePlan = async () => {
    if (!builderPlanForm.name || !builderPlanForm.code) {
      alert("Plan name and code are required.");
      return;
    }
    if (builderPlanForm.items.length === 0) {
      alert("A published plan must have at least one product item.");
      return;
    }

    try {
      if (editingPlanId) {
        await updateCommercialPlan(editingPlanId, builderPlanForm);
        setSuccessMsg(`Plan '${builderPlanForm.name}' updated successfully!`);
      } else {
        await createCommercialPlan(builderPlanForm);
        setSuccessMsg(`Plan '${builderPlanForm.name}' created and published successfully!`);
      }
      setIsBuilderOpen(false);
      setEditingPlanId(null);
      loadData();
    } catch (err) {
      alert(err.message || (editingPlanId ? "Failed to update plan" : "Failed to create plan"));
    }
  };

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
    if (!confirm(`Create new draft Version v${nextVer} for '${plan.name}'? Existing subscribers will remain on their current version.`)) return;

    try {
      const activeVersion = plan.activeVersion || {};
      await createCommercialPlanVersion(plan._id, {
        changelog: `New draft version ${nextVer} initiated by admin`,
        basePrice: activeVersion.basePrice || 0,
        discount: activeVersion.discount || 0,
        taxPercent: activeVersion.taxPercent || 18,
        validity: activeVersion.validity || 90,
        items: activeVersion.items || [],
      });
      setSuccessMsg(`Draft v${nextVer} created! You can now adjust product limits and publish when ready.`);
      loadData();
      handleInspectPlan(plan._id);
    } catch (err) {
      alert(err.message || "Failed to create new version");
    }
  };

  // Publish a draft version
  const handlePublishVersion = async (planId, versionId) => {
    if (!confirm("Are you sure you want to publish this version? It will become the active version for all new purchases.")) return;
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

  // Dynamic Catalog Total based on selected items and catalog rates
  const calculatedCatalogTotal = useMemo(() => {
    return calculateItemsCatalogPrice(builderPlanForm.items);
  }, [builderPlanForm.items, availableProducts]);

  // Pricing calculations for Builder Step 3
  const taxable = Math.max(0, builderPlanForm.basePrice - builderPlanForm.discount);
  const taxAmount = (taxable * builderPlanForm.taxPercent) / 100;
  const finalPrice = Math.round(taxable + taxAmount);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
            Commercial Plans & Builder
          </h1>
          <p className="text-sm text-slate-500">
            Design bundled commercial subscription packages, configure items, manage version history, and pricing.
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
            onClick={openPlanBuilder}
            className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-indigo-700"
          >
            <LuPlus className="h-4 w-4" /> + Build New Plan
          </button>
        </div>
      </div>

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
                <th className="px-4 py-3.5">Final Price</th>
                <th className="px-4 py-3.5">Included Products</th>
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
                        ₹{(ver.finalPrice || 0).toLocaleString()}
                        <span className="block text-[10px] text-slate-400 font-normal">
                          Base: ₹{(ver.basePrice || 0).toLocaleString()}
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
                            onClick={() => handleEditPlan(plan)}
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

      {/* Plan Builder Modal Wizard */}
      {isBuilderOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-6 overflow-y-auto">
          <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-3xl bg-white shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Fixed Header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 flex-shrink-0 bg-white">
              <div>
                <div className="flex items-center gap-2">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                    editingPlanId ? "bg-amber-100 text-amber-800" : "bg-indigo-50 text-indigo-700"
                  }`}>
                    {editingPlanId ? "Editing Existing Plan" : "New Plan Builder"} • Step {builderStep} of 4
                  </span>
                  <h2 className="text-lg font-bold text-slate-900">
                    {editingPlanId ? (
                      <>
                        {builderStep === 1 && `Edit Plan Information: ${builderPlanForm.name || "Commercial Plan"}`}
                        {builderStep === 2 && "Modify Included Products & Quotas"}
                        {builderStep === 3 && "Commercial Pricing, Markup & Tax"}
                        {builderStep === 4 && "Review & Save Plan Changes"}
                      </>
                    ) : (
                      <>
                        {builderStep === 1 && "Plan Information"}
                        {builderStep === 2 && "Select Products & Assign Credits"}
                        {builderStep === 3 && "Commercial Pricing & Tax"}
                        {builderStep === 4 && "Live Preview & Confirmation"}
                      </>
                    )}
                  </h2>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  {editingPlanId
                    ? "Update commercial plan settings, product entitlements, catalog rates, or adjustments."
                    : "Follow the wizard to configure a complete commercial plan package."}
                </p>
              </div>
              <button
                onClick={() => {
                  setIsBuilderOpen(false);
                  setEditingPlanId(null);
                }}
                className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <LuX className="h-5 w-5" />
              </button>
            </div>

            {/* Scrollable Modal Content Body */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
              {/* Step 1: Basic Info */}
              {builderStep === 1 && (
                <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700">Plan Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Corporate Plan"
                      value={builderPlanForm.name}
                      onChange={(e) => setBuilderPlanForm({ ...builderPlanForm, name: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700">Plan Code * (Unique)</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. CORPORATE"
                      value={builderPlanForm.code}
                      onChange={(e) => setBuilderPlanForm({ ...builderPlanForm, code: e.target.value.toUpperCase() })}
                      className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-mono font-bold uppercase"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700">Plan Type *</label>
                    <select
                      value={builderPlanForm.planType}
                      onChange={(e) => setBuilderPlanForm({ ...builderPlanForm, planType: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs"
                    >
                      <option value="FREE">Free</option>
                      <option value="SMB">SMB</option>
                      <option value="CORPORATE">Corporate</option>
                      <option value="ENTERPRISE">Enterprise</option>
                      <option value="CUSTOM">Custom</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700">Billing Cycle</label>
                    <select
                      value={builderPlanForm.billingCycle}
                      onChange={(e) => setBuilderPlanForm({ ...builderPlanForm, billingCycle: e.target.value })}
                      className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs"
                    >
                      <option value="MONTHLY">Monthly</option>
                      <option value="QUARTERLY">Quarterly</option>
                      <option value="ANNUAL">Annual</option>
                      <option value="CUSTOM">Custom</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700">Validity (Days) *</label>
                    <input
                      type="number"
                      min="1"
                      value={builderPlanForm.validity}
                      onChange={(e) => setBuilderPlanForm({ ...builderPlanForm, validity: Number(e.target.value) })}
                      className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700">Plan Description</label>
                  <textarea
                    rows="3"
                    value={builderPlanForm.description}
                    onChange={(e) => setBuilderPlanForm({ ...builderPlanForm, description: e.target.value })}
                    placeholder="Comprehensive hiring package with Hot Vacancies, SMB Jobs, Resume Views, and AI credits..."
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs"
                  />
                </div>
              </div>
            )}

            {/* Step 2: Products & Entitlements Catalog */}
            {builderStep === 2 && (
              <div className="mt-4 space-y-3.5">
                {/* Search, Filter & Quick Stats Header */}
                <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3.5 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">
                        Products & Entitlements Catalog
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Select which products to bundle into this plan, then configure credits, validity, and user limits.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-100 px-3 py-1 text-xs font-bold text-indigo-700">
                        <LuPackage className="h-3.5 w-3.5" />
                        {builderPlanForm.items.length} of {availableProducts.length} Included
                      </span>
                      <div className="h-4 w-px bg-slate-200" />
                      <button
                        type="button"
                        onClick={handleSelectAllProducts}
                        className="rounded-lg bg-white px-2.5 py-1 text-[11px] font-semibold text-indigo-600 border border-slate-200 hover:bg-slate-50"
                      >
                        Select All
                      </button>
                      <button
                        type="button"
                        onClick={handleDeselectAllProducts}
                        className="rounded-lg bg-white px-2.5 py-1 text-[11px] font-semibold text-rose-600 border border-slate-200 hover:bg-rose-50"
                      >
                        Clear All
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 pt-1">
                    {/* Search */}
                    <div className="relative w-full sm:w-64">
                      <LuSearch className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search product or code..."
                        value={step2SearchQuery}
                        onChange={(e) => setStep2SearchQuery(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-white py-1.5 pl-8 pr-3 text-xs placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none"
                      />
                    </div>

                    {/* Category Filter Pills */}
                    <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
                      {[
                        { key: "ALL", label: "All Products" },
                        { key: "JOB_POSTING", label: "Job Postings" },
                        { key: "RESUME_SEARCH", label: "Resume Search" },
                        { key: "AI", label: "AI Capabilities" },
                        { key: "USER_SEATS", label: "User Seats" },
                        { key: "ADD_ONS", label: "Add-ons" },
                      ].map((cat) => (
                        <button
                          key={cat.key}
                          type="button"
                          onClick={() => setStep2CategoryFilter(cat.key)}
                          className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition ${
                            step2CategoryFilter === cat.key
                              ? "bg-indigo-600 text-white shadow-sm"
                              : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                          }`}
                        >
                          {cat.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Filtered Products List */}
                <div className="max-h-[50vh] overflow-y-auto space-y-2.5 pr-1">
                  {filteredProductsForStep2.length === 0 ? (
                    <div className="p-8 text-center text-xs text-slate-500 border border-dashed border-slate-200 rounded-2xl">
                      No products found matching your search.
                    </div>
                  ) : (
                    filteredProductsForStep2.map((prod) => {
                      const item = builderPlanForm.items.find(
                        (i) => String(i.productId) === String(prod._id)
                      );
                      const isSelected = !!item;

                      return (
                        <div
                          key={prod._id}
                          className={`rounded-2xl border transition-all p-3.5 ${
                            isSelected
                              ? "border-indigo-500 bg-indigo-50/20 shadow-sm ring-1 ring-indigo-500/20"
                              : "border-slate-200 bg-white hover:border-slate-300"
                          }`}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            {/* Left: Checkbox & Product Meta */}
                            <div className="flex items-start gap-3">
                              <label className="mt-0.5 flex cursor-pointer items-center">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => handleToggleProductInPlan(prod)}
                                  className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                />
                              </label>

                              <div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="font-bold text-slate-900 text-xs sm:text-sm">
                                    {prod.name}
                                  </span>
                                  <span className="font-mono text-[10px] font-semibold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                                    {prod.code}
                                  </span>
                                  <span
                                    className={`rounded-md px-1.5 py-0.5 text-[9px] font-bold ${
                                      prod.category === "JOB_POSTING"
                                        ? "bg-blue-50 text-blue-700"
                                        : prod.category === "RESUME_SEARCH"
                                        ? "bg-indigo-50 text-indigo-700"
                                        : prod.category === "AI"
                                        ? "bg-purple-50 text-purple-700"
                                        : prod.category === "USER_SEATS"
                                        ? "bg-emerald-50 text-emerald-700"
                                        : "bg-slate-100 text-slate-700"
                                    }`}
                                  >
                                    {prod.category}
                                  </span>
                                  {prod.code === "AI_CREDIT" && (
                                    <span className="rounded-md bg-purple-100 px-1.5 py-0.5 text-[9px] font-semibold text-purple-800">
                                      Monthly Shared Pool
                                    </span>
                                  )}
                                </div>
                                <p className="text-[11px] text-slate-500 mt-0.5">
                                  {prod.description || `Catalog unit: ${prod.unit} • Type: ${prod.productType}`}
                                </p>
                              </div>
                            </div>

                            {/* Right: Quick Action Button */}
                            <div className="flex items-center gap-2 self-end sm:self-center">
                              {isSelected ? (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveProductFromPlan(prod._id)}
                                  className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200 transition"
                                >
                                  <LuTrash2 className="h-3 w-3" /> Remove
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleToggleProductInPlan(prod)}
                                  className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition"
                                >
                                  <LuPlus className="h-3.5 w-3.5" /> Include in Plan
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Editable Entitlement Inputs (Shown when product is included) */}
                          {isSelected && (
                            <div className="mt-3 pt-3 border-t border-indigo-100/70 grid grid-cols-1 sm:grid-cols-4 gap-3 bg-white/80 p-3 rounded-xl border border-indigo-100">
                              {/* 1. Credit / Quantity */}
                              <div>
                                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                  Credits / Quantity *
                                </label>
                                <input
                                  type="number"
                                  min="0"
                                  value={item.quantity}
                                  onChange={(e) =>
                                    handleItemQuantityChange(prod._id, e.target.value)
                                  }
                                  className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-bold text-indigo-950 focus:border-indigo-500 focus:outline-none"
                                />
                                <span className="text-[10px] text-slate-400 mt-0.5 block">
                                  Quota: {item.quantity} {item.unit || prod.unit}s
                                </span>
                              </div>

                              {/* 2. Unit */}
                              <div>
                                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                  Unit of Measure
                                </label>
                                <input
                                  type="text"
                                  value={item.unit || prod.unit}
                                  onChange={(e) =>
                                    handleUpdateItemField(prod._id, "unit", e.target.value)
                                  }
                                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-700 focus:border-indigo-500 focus:outline-none"
                                />
                                <span className="text-[10px] text-slate-400 mt-0.5 block">
                                  e.g. Job, View, AI Use
                                </span>
                              </div>

                              {/* 3. Validity (Days) */}
                              <div>
                                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                  Credit Validity (Days)
                                </label>
                                <input
                                  type="number"
                                  min="1"
                                  value={item.validity || builderPlanForm.validity || 90}
                                  onChange={(e) =>
                                    handleUpdateItemField(prod._id, "validity", e.target.value)
                                  }
                                  className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-800 focus:border-indigo-500 focus:outline-none"
                                />
                                <span className="text-[10px] text-slate-400 mt-0.5 block">
                                  Expires after {item.validity || builderPlanForm.validity || 90} days
                                </span>
                              </div>

                              {/* 4. User Seats Limit */}
                              <div>
                                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                  User / Seat Limit
                                </label>
                                <input
                                  type="number"
                                  min="0"
                                  value={item.userLimit || 1}
                                  onChange={(e) =>
                                    handleUpdateItemField(prod._id, "userLimit", e.target.value)
                                  }
                                  className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-800 focus:border-indigo-500 focus:outline-none"
                                />
                                <span className="text-[10px] text-slate-400 mt-0.5 block">
                                  Concurrent recruiter seats
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* Step 3: Commercial Pricing & Tax */}
            {builderStep === 3 && (
              <div className="mt-5 space-y-5">
                {/* 1. Itemized Product Catalog Calculation Breakdown */}
                <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <LuCalculator className="h-4 w-4 text-indigo-600" />
                        <h4 className="text-sm font-bold text-slate-900">
                          Catalog-Based Price Calculation Breakdown
                        </h4>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Prices are dynamically derived from each product's <strong>count / quota</strong> and the unit rate defined in the <strong>Product Creation</strong> section.
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700">
                        {builderPlanForm.items.length} Product{builderPlanForm.items.length === 1 ? "" : "s"} Configured
                      </span>
                    </div>
                  </div>

                  {builderPlanForm.items.length === 0 ? (
                    <div className="py-6 text-center text-xs text-amber-700 bg-amber-50 rounded-xl mt-3 p-4 border border-amber-200">
                      No products added to this plan yet. Please go back to <strong>Step 2</strong> to select products and assign quotas.
                    </div>
                  ) : (
                    <div className="overflow-x-auto mt-3">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-slate-100 bg-slate-50/75 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
                            <th className="py-2.5 px-3">Product & Code</th>
                            <th className="py-2.5 px-3">Product Type</th>
                            <th className="py-2.5 px-3 text-center">Quota / Count</th>
                            <th className="py-2.5 px-3 text-right">Catalog Unit Rate</th>
                            <th className="py-2.5 px-3 text-right">Calculated Subtotal</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {builderPlanForm.items.map((item, idx) => {
                            const prod = getCatalogProduct(item.productId);
                            const unitPrice = prod?.defaultPrice ?? (Number(item.unitPrice) || 0);
                            const qty = Number(item.quantity) || 0;
                            const subtotal = qty * unitPrice;
                            const pType = prod?.productType || item.productType || "CREDIT_BASED";

                            return (
                              <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                                <td className="py-2.5 px-3">
                                  <div className="font-bold text-slate-900">{item.productName}</div>
                                  <div className="flex items-center gap-1.5 mt-0.5">
                                    <span className="font-mono text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                                      {item.productCode}
                                    </span>
                                    {prod?.category && (
                                      <span className="text-[10px] text-slate-400">
                                        • {prod.category}
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td className="py-2.5 px-3">
                                  <span
                                    className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold ${
                                      pType === "CREDIT_BASED"
                                        ? "bg-indigo-50 text-indigo-700"
                                        : pType === "SEAT_BASED"
                                        ? "bg-emerald-50 text-emerald-700"
                                        : pType === "USAGE_BASED"
                                        ? "bg-amber-50 text-amber-700"
                                        : "bg-purple-50 text-purple-700"
                                    }`}
                                  >
                                    {pType.replace("_", " ")}
                                  </span>
                                </td>
                                <td className="py-2.5 px-3 text-center">
                                  <span className="inline-block font-bold text-slate-800 bg-slate-100 px-2 py-1 rounded-lg">
                                    {qty.toLocaleString()} {item.unit || prod?.unit || "Unit"}
                                  </span>
                                </td>
                                <td className="py-2.5 px-3 text-right">
                                  <div className="font-medium text-slate-700">
                                    ₹{unitPrice.toLocaleString()}
                                  </div>
                                  <div className="text-[10px] text-slate-400">
                                    per {item.unit || prod?.unit || "Unit"}
                                  </div>
                                </td>
                                <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                                  ₹{subtotal.toLocaleString()}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                        <tfoot>
                          <tr className="border-t-2 border-slate-200 bg-slate-50/80 font-bold text-slate-900">
                            <td colSpan="4" className="py-2.5 px-3 text-right">
                              Total Calculated Catalog Price (Sum of All Included Products):
                            </td>
                            <td className="py-2.5 px-3 text-right text-indigo-700 text-sm font-black">
                              ₹{calculatedCatalogTotal.toLocaleString()}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  )}
                </div>

                {/* 2. Commercial Pricing Configuration & Increase/Markup Controls */}
                <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/40 via-white to-purple-50/20 p-4 sm:p-5 shadow-xs space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-indigo-100/70 pb-3">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        <LuTrendingUp className="h-4 w-4 text-indigo-600" />
                        Commercial Base Price & Flexibility
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Base Price is populated dynamically from catalog rates (₹{calculatedCatalogTotal.toLocaleString()}). You can increase or adjust this price as needed.
                      </p>
                    </div>

                    {/* Reset / Sync button */}
                    <button
                      type="button"
                      onClick={handleResetToCatalogPrice}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-white px-3 py-1.5 text-xs font-semibold text-indigo-700 shadow-2xs hover:bg-indigo-50 transition-colors"
                      title="Sync base price with exact sum of catalog rates"
                    >
                      <LuRefreshCw className="h-3.5 w-3.5" />
                      Reset to Catalog Sum (₹{calculatedCatalogTotal.toLocaleString()})
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Base Price Input */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-800">
                          Base Selling Price (₹) *
                        </label>
                        {builderPlanForm.basePrice > calculatedCatalogTotal ? (
                          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                            +₹{(builderPlanForm.basePrice - calculatedCatalogTotal).toLocaleString()} Markup
                          </span>
                        ) : builderPlanForm.basePrice < calculatedCatalogTotal ? (
                          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                            -₹{(calculatedCatalogTotal - builderPlanForm.basePrice).toLocaleString()} Discounted
                          </span>
                        ) : (
                          <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-bold text-indigo-800">
                            Catalog Match
                          </span>
                        )}
                      </div>
                      <input
                        type="number"
                        min="0"
                        required
                        value={builderPlanForm.basePrice}
                        onChange={(e) => {
                          setIsPriceManuallyEdited(true);
                          setBuilderPlanForm({
                            ...builderPlanForm,
                            basePrice: Math.max(0, Number(e.target.value)),
                          });
                        }}
                        className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm font-black text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                      />
                      <p className="text-[10px] text-slate-500">
                        {isPriceManuallyEdited
                          ? "Customized price. Click 'Reset to Catalog Sum' to re-sync."
                          : "Derived automatically from product quotas and rates."}
                      </p>
                    </div>

                    {/* Plan Discount Input */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-800">
                        Plan-Level Discount (₹)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={builderPlanForm.discount}
                        onChange={(e) =>
                          setBuilderPlanForm({
                            ...builderPlanForm,
                            discount: Math.max(0, Number(e.target.value)),
                          })
                        }
                        className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm font-semibold text-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                      />
                      <p className="text-[10px] text-slate-500">
                        Optional promotional deduction from base price.
                      </p>
                    </div>

                    {/* Tax / GST Input */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-800">
                        Tax / GST Rate (%)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={builderPlanForm.taxPercent}
                        onChange={(e) =>
                          setBuilderPlanForm({
                            ...builderPlanForm,
                            taxPercent: Math.max(0, Number(e.target.value)),
                          })
                        }
                        className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm font-semibold text-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                      />
                      <p className="text-[10px] text-slate-500">
                        Standard statutory GST rate (18%).
                      </p>
                    </div>
                  </div>
                </div>

                {/* 3. Live Price Calculation Summary Invoice Card */}
                <div className="rounded-2xl border border-indigo-200 bg-indigo-50/60 p-5 space-y-3 text-xs shadow-2xs">
                  <div className="flex items-center justify-between border-b border-indigo-200/70 pb-2.5">
                    <span className="font-bold text-slate-800 flex items-center gap-1.5">
                      <LuReceipt className="h-4 w-4 text-indigo-600" />
                      Live Pricing & Tax Computation Summary
                    </span>
                    <span className="text-[11px] text-indigo-700 font-semibold">
                      Validity: {builderPlanForm.validity} Days ({builderPlanForm.billingCycle})
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-slate-600">
                      <span>Total Catalog Products Value:</span>
                      <span className="font-medium">₹{calculatedCatalogTotal.toLocaleString()}</span>
                    </div>

                    {builderPlanForm.basePrice !== calculatedCatalogTotal && (
                      <div className="flex justify-between">
                        <span className="text-slate-600">
                          {builderPlanForm.basePrice > calculatedCatalogTotal
                            ? "Plan Premium / Markup:"
                            : "Catalog Package Adjustment:"}
                        </span>
                        <span
                          className={
                            builderPlanForm.basePrice > calculatedCatalogTotal
                              ? "font-semibold text-emerald-700"
                              : "font-semibold text-amber-700"
                          }
                        >
                          {builderPlanForm.basePrice > calculatedCatalogTotal
                            ? `+ ₹${(builderPlanForm.basePrice - calculatedCatalogTotal).toLocaleString()}`
                            : `- ₹${(calculatedCatalogTotal - builderPlanForm.basePrice).toLocaleString()}`}
                        </span>
                      </div>
                    )}

                    <div className="flex justify-between text-slate-800 font-semibold">
                      <span>Base Selling Price:</span>
                      <span>₹{builderPlanForm.basePrice.toLocaleString()}</span>
                    </div>

                    {builderPlanForm.discount > 0 && (
                      <div className="flex justify-between text-emerald-700">
                        <span>Plan Discount:</span>
                        <span>- ₹{builderPlanForm.discount.toLocaleString()}</span>
                      </div>
                    )}

                    <div className="flex justify-between text-slate-600">
                      <span>Taxable Amount:</span>
                      <span>₹{taxable.toLocaleString()}</span>
                    </div>

                    <div className="flex justify-between text-slate-600">
                      <span>GST ({builderPlanForm.taxPercent}%):</span>
                      <span>+ ₹{taxAmount.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="border-t border-indigo-200 pt-2.5 flex items-center justify-between font-black text-slate-900 text-sm">
                    <div>
                      <span>Final Commercial Plan Price:</span>
                      <span className="block text-[10px] font-normal text-slate-500">
                        (Inclusive of all taxes & statutory duties)
                      </span>
                    </div>
                    <span className="text-xl text-indigo-700">
                      ₹{finalPrice.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Live Preview & Confirm */}
            {builderStep === 4 && (
              <div className="mt-5 space-y-5">
                <div className="rounded-2xl border-2 border-indigo-500 bg-gradient-to-b from-indigo-50/30 to-white p-6 shadow-sm">
                  <div className="flex items-center justify-between border-b border-indigo-100 pb-3">
                    <div>
                      <span className="rounded-md bg-indigo-100 px-2 py-0.5 text-[10px] font-bold text-indigo-800">
                        {builderPlanForm.planType} PLAN
                      </span>
                      <h3 className="text-xl font-bold text-slate-900 mt-1">{builderPlanForm.name}</h3>
                      <p className="text-xs text-slate-500 font-mono mt-0.5">{builderPlanForm.code}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-black text-indigo-700">₹{finalPrice.toLocaleString()}</div>
                      <div className="text-[11px] text-slate-500">{builderPlanForm.validity} Days Validity ({builderPlanForm.billingCycle})</div>
                    </div>
                  </div>

                  <div className="mt-4">
                    <p className="text-xs font-semibold text-slate-700 mb-2">Included Products & Entitlements Breakdown:</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {builderPlanForm.items.map((it, idx) => {
                        const prod = getCatalogProduct(it.productId);
                        const unitPrice = prod?.defaultPrice ?? (Number(it.unitPrice) || 0);
                        const qty = Number(it.quantity) || 0;
                        return (
                          <div
                            key={idx}
                            className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/60 p-2.5 text-slate-800"
                          >
                            <div className="flex items-center gap-2">
                              <LuCheck className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                              <div>
                                <span className="font-bold">{qty}</span> {it.productName} ({it.unit})
                                <div className="text-[10px] text-slate-400">
                                  ₹{unitPrice.toLocaleString()}/{it.unit} • {it.validity || builderPlanForm.validity}d validity
                                </div>
                              </div>
                            </div>
                            <span className="text-xs font-mono font-bold text-slate-700">
                              ₹{(qty * unitPrice).toLocaleString()}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-indigo-100/70 flex justify-between text-xs text-slate-600">
                    <span>Base: ₹{builderPlanForm.basePrice.toLocaleString()} • Discount: ₹{builderPlanForm.discount.toLocaleString()} • GST: ₹{taxAmount.toLocaleString()}</span>
                    <span className="font-bold text-indigo-800">Total: ₹{finalPrice.toLocaleString()}</span>
                  </div>
                </div>

                <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 flex items-center gap-2">
                  <LuShieldCheck className="h-4 w-4 text-amber-600 flex-shrink-0" />
                  <span>
                    Publishing will freeze this configuration as <strong>Version 1</strong>. Future changes will create Version 2, preserving historical subscriptions.
                  </span>
                </div>
              </div>
            )}

            </div>

            {/* Modal Fixed Footer Navigation */}
            <div className="flex justify-between items-center px-6 py-3.5 border-t border-slate-100 flex-shrink-0 bg-slate-50/80 rounded-b-3xl">
              <button
                type="button"
                disabled={builderStep === 1}
                onClick={() => setBuilderStep((prev) => Math.max(1, prev - 1))}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-30"
              >
                Back
              </button>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsBuilderOpen(false);
                    setEditingPlanId(null);
                  }}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                {builderStep < 4 ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (builderStep === 1 && (!builderPlanForm.name || !builderPlanForm.code)) {
                        alert("Plan name and code are required.");
                        return;
                      }
                      if (builderStep === 2 && builderPlanForm.items.length === 0) {
                        alert("Please add at least one product item.");
                        return;
                      }
                      setBuilderStep((prev) => prev + 1);
                    }}
                    className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-5 py-2 text-xs font-semibold text-white hover:bg-indigo-700"
                  >
                    Next Step <LuArrowRight className="h-3.5 w-3.5" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSavePlan}
                    className={`flex items-center gap-1.5 rounded-xl px-6 py-2 text-xs font-semibold text-white shadow-sm transition-colors ${
                      editingPlanId
                        ? "bg-indigo-600 hover:bg-indigo-700"
                        : "bg-emerald-600 hover:bg-emerald-700"
                    }`}
                  >
                    {editingPlanId ? (
                      <>
                        <LuCheck className="h-4 w-4" /> Save & Update Plan
                      </>
                    ) : (
                      <>
                        <LuSparkles className="h-4 w-4" /> Publish Plan
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Plan Details & Version History Modal */}
      {inspectingPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-6 overflow-y-auto">
          <div className="relative w-full max-w-3xl max-h-[90vh] flex flex-col rounded-3xl bg-white shadow-2xl my-auto overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Fixed Header & Tabs */}
            <div className="border-b border-slate-100 px-6 pt-5 pb-0 flex-shrink-0 bg-white">
              <div className="flex items-center justify-between pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-md bg-indigo-50 px-2 py-0.5 text-xs font-bold text-indigo-700 font-mono">
                      {inspectingPlan.code}
                    </span>
                    <h2 className="text-lg font-bold text-slate-900">{inspectingPlan.name}</h2>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Plan Details, Version History, Included Entitlements, and Subscribers.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const planToEdit = inspectingPlan;
                      setInspectingPlan(null);
                      handleEditPlan(planToEdit);
                    }}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 transition"
                    title="Edit this plan configuration"
                  >
                    <LuPencil className="h-3.5 w-3.5" /> Edit Plan
                  </button>
                  <button
                    onClick={() => setInspectingPlan(null)}
                    className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                  >
                    <LuX className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setDetailTab("overview")}
                  className={`pb-2.5 text-xs font-semibold border-b-2 transition ${
                    detailTab === "overview"
                      ? "border-indigo-600 text-indigo-600"
                      : "border-transparent text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Overview & Products
                </button>
                <button
                  onClick={() => setDetailTab("versions")}
                  className={`pb-2.5 text-xs font-semibold border-b-2 transition ${
                    detailTab === "versions"
                      ? "border-indigo-600 text-indigo-600"
                      : "border-transparent text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Version History ({(inspectingPlan.versions || []).length})
                </button>
              </div>
            </div>

            {/* Scrollable Modal Content Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* Overview Tab Content */}
              {detailTab === "overview" && (
                <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4 rounded-2xl bg-slate-50 p-4 text-xs">
                  <div>
                    <span className="text-slate-400 block font-medium">Current Active Version</span>
                    <span className="font-bold text-indigo-700 text-sm">v{inspectingPlan.currentVersion}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium">Final Price</span>
                    <span className="font-bold text-slate-900 text-sm">
                      ₹{(inspectingPlan.publishedVersion?.finalPrice || 0).toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium">Active Subscribers</span>
                    <span className="font-bold text-emerald-700 text-sm">{inspectingPlan.activeSubscribersCount || 0}</span>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                    Included Products in Current Version:
                  </h4>
                  <div className="divide-y divide-slate-100 rounded-xl border border-slate-200">
                    {(inspectingPlan.publishedVersion?.items || []).map((it, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 text-xs">
                        <div className="font-semibold text-slate-900">{it.productName}</div>
                        <div className="font-bold text-indigo-700">
                          {it.quantity} {it.unit}s
                        </div>
                        <div className="text-slate-500">Validity: {it.validity || 30} days</div>
                        <div className="text-slate-500">User Seats: {it.userLimit || 1}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Versions Tab Content */}
            {detailTab === "versions" && (
              <div className="mt-4 space-y-3 max-h-[50vh] overflow-y-auto">
                {(inspectingPlan.versions || []).map((ver) => (
                  <div
                    key={ver._id}
                    className="rounded-2xl border border-slate-200 p-4 text-xs space-y-2 transition hover:border-slate-300"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">Version v{ver.version}</span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            ver.status === "PUBLISHED"
                              ? "bg-emerald-50 text-emerald-700"
                              : ver.status === "DRAFT"
                              ? "bg-amber-50 text-amber-700"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {ver.status}
                        </span>
                      </div>
                      <div className="font-bold text-slate-900">
                        ₹{(ver.finalPrice || 0).toLocaleString()} ({ver.validity} days)
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-500">{ver.changelog || "No changelog recorded."}</p>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px] text-slate-400">
                      <span>{(ver.items || []).length} products configured</span>
                      {ver.status === "DRAFT" && (
                        <button
                          onClick={() => handlePublishVersion(inspectingPlan._id, ver._id)}
                          className="rounded-lg bg-emerald-600 px-3 py-1 font-semibold text-white hover:bg-emerald-700"
                        >
                          Publish Version v{ver.version}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
            </div>

            {/* Modal Fixed Footer */}
            <div className="border-t border-slate-100 px-6 py-3.5 flex justify-end flex-shrink-0 bg-slate-50/80 rounded-b-3xl">
              <button
                type="button"
                onClick={() => setInspectingPlan(null)}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 shadow-2xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
