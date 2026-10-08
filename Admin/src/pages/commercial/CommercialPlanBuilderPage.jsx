import { useEffect, useState, useMemo } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import {
  LuArrowLeft,
  LuArrowRight,
  LuCheck,
  LuPackage,
  LuPlus,
  LuRefreshCw,
  LuSearch,
  LuTrash2,
  LuSparkles,
  LuCalculator,
  LuTrendingUp,
  LuReceipt,
  LuShieldCheck,
} from "react-icons/lu";
import {
  getCommercialPlanById,
  createCommercialPlan,
  updateCommercialPlan,
  getCommercialProducts,
} from "../../services/adminApi";

export const DEFAULT_PRODUCT_FEATURES = {
  HOT_VACANCY: [
    { key: "companyLogo", name: "Company Logo Shown", enabled: true },
    { key: "topSearchPlacement", name: "Top Search Placement", enabled: true },
    { key: "candidateAlerts", name: "Candidate Job Alerts", enabled: true },
    { key: "multipleCities", name: "Multiple Cities Allowed", enabled: true, value: 3 },
  ],
  SMB_JOB: [
    { key: "basicPosting", name: "Basic Job Posting", enabled: true },
    { key: "cityAllowed", name: "City Allowed", enabled: true },
    { key: "companyLogo", name: "Company Logo Shown", enabled: false },
    { key: "candidateAlerts", name: "Candidate Alerts", enabled: false },
    { key: "topSearchPlacement", name: "Top Search Placement", enabled: false },
  ],
  INTERNSHIP_JOB: [],
  AI_CREDIT: [
    { key: "improveJd", name: "Improve Job Description (Free Tier)", enabled: true },
    { key: "generateJd", name: "Write Full JD from Title (Paid Only)", enabled: true },
    { key: "screeningQuestions", name: "Generate Screening Questions (Paid Only)", enabled: true },
  ],
  RESDEX: [
    { key: "advanceFilters", name: "Advanced Filters", enabled: true },
    { key: "downloadCv", name: "Download PDF CV", enabled: true },
    { key: "contactDetails", name: "View Direct Contact Info", enabled: true },
  ],
  MIVITE: [
    { key: "candidateOutreach", name: "Candidate Outreach Messaging", enabled: true },
    { key: "directInvite", name: "Direct Job Application NVites", enabled: true },
  ],
};

export const STANDARD_PLAN_CODES = [
  { code: "FREE", label: "FREE — Free Starter Plan", defaultName: "Free Starter Plan", planType: "FREE" },
  { code: "SMB_STARTER", label: "SMB_STARTER — SMB Starter Plan", defaultName: "SMB Starter Plan", planType: "SMB" },
  { code: "CORPORATE", label: "CORPORATE — Corporate Growth Plan", defaultName: "Corporate Growth Plan", planType: "CORPORATE" },
  { code: "ENTERPRISE", label: "ENTERPRISE — Enterprise Hiring Plan", defaultName: "Enterprise Hiring Plan", planType: "ENTERPRISE" },
  { code: "CUSTOM", label: "CUSTOM — Custom Plan", defaultName: "Custom Plan", planType: "CUSTOM" },
];

export default function CommercialPlanBuilderPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { planId: routePlanId, id: routeId } = useParams();
  const planId = routePlanId || routeId;

  const [availableProducts, setAvailableProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [editingPlanId, setEditingPlanId] = useState(planId || null);
  const [builderStep, setBuilderStep] = useState(1);
  const [isPriceManuallyEdited, setIsPriceManuallyEdited] = useState(false);
  const [isCustomPlanCode, setIsCustomPlanCode] = useState(false);

  const [builderPlanForm, setBuilderPlanForm] = useState({
    name: "",
    code: "",
    planType: "SMB",
    description: "",
    validity: 90,
    validityUnit: "DAYS",
    gracePeriodDays: 90,
    basePrice: 0,
    discount: 0,
    taxType: "IGST",
    igstRate: 18,
    cgstRate: 0,
    sgstRate: 0,
    taxPercent: 18,
    items: [],
    publishImmediately: true,
  });

  // Step 2 Products Filter & Search State
  const [step2SearchQuery, setStep2SearchQuery] = useState("");
  const [step2CategoryFilter, setStep2CategoryFilter] = useState("ALL");

  // Helper to find a product in available catalog
  const getCatalogProduct = (productId) => {
    return availableProducts.find((p) => String(p._id) === String(productId));
  };

  // Helper to compute item quotas, multiplier, validity, and subtotal:
  // ONLY AI credit is defined per month; all other products are defined directly as TOTAL for the plan
  const computeItemCycle = (item, prod, planValidity = 90) => {
    const code = String(item.productCode || prod?.code || "").toUpperCase();
    const cat = String(prod?.category || item.category || "").toUpperCase();
    const isAi = code === "AI_CREDIT" || code.includes("AI") || cat === "AI";

    const validityDays = Number(planValidity || 90);
    const unitPrice = Number(prod?.defaultPrice ?? item.unitPrice ?? 0);

    const resolvedFeatures =
      item.features && item.features.length > 0
        ? item.features
        : (prod?.features && prod.features.length > 0
            ? prod.features
            : (DEFAULT_PRODUCT_FEATURES[code] || []));

    if (isAi) {
      // ONLY AI Credit is defined per month
      const months = Math.max(1, Math.round(validityDays / 30));
      const monthlyAllowance = Math.max(
        0,
        Number(item.baseQuantity !== undefined ? item.baseQuantity : (item.quantity || 50))
      );
      const subtotal = monthlyAllowance * unitPrice * months;

      return {
        ...item,
        features: resolvedFeatures,
        productCode: item.productCode || prod?.code,
        productName: item.productName || prod?.name,
        productType: prod?.productType || item.productType || "CREDIT_BASED",
        category: prod?.category || item.category,
        unit: item.unit || prod?.unit || "Credit",
        baseQuantity: monthlyAllowance,
        quantity: monthlyAllowance,
        totalQuantity: monthlyAllowance * months,
        validity: 30, // resets monthly
        validityUnit: "DAYS",
        unitPrice,
        subtotal,
        multiplier: months,
        isAi: true,
      };
    } else {
      // ALL other products are defined directly as TOTAL for the plan
      const totalQty = Math.max(
        0,
        Number(item.quantity !== undefined ? item.quantity : (item.baseQuantity || 10))
      );
      const subtotal = totalQty * unitPrice;

      let pName = item.productName || prod?.name;
      if (code === "RESDEX" || pName === "ResDex Resume Search" || String(pName).toLowerCase() === "resdex resume search") {
        pName = "Max CV Access";
      } else if (code === "MIVITE" || pName === "MIvites Candidate Outreach" || String(pName).toLowerCase() === "mivites candidate outreach") {
        pName = "Max NVite Credits";
      }

      return {
        ...item,
        features: resolvedFeatures,
        productCode: item.productCode || prod?.code,
        productName: pName,
        productType: prod?.productType || item.productType || "CREDIT_BASED",
        category: prod?.category || item.category,
        unit: item.unit || prod?.unit || "Credit",
        baseQuantity: totalQty,
        quantity: totalQty,
        totalQuantity: totalQty,
        validity: validityDays,
        validityUnit: "DAYS",
        unitPrice,
        subtotal,
        multiplier: 1,
        isAi: false,
      };
    }
  };

  const handleToggleFeature = (productId, featureKey) => {
    setBuilderPlanForm((prev) => {
      const updatedItems = prev.items.map((it) => {
        if (String(it.productId) === String(productId)) {
          const prod = getCatalogProduct(productId);
          const currentFeatures =
            it.features && it.features.length > 0
              ? it.features
              : (prod?.features && prod.features.length > 0
                  ? prod.features
                  : (DEFAULT_PRODUCT_FEATURES[String(it.productCode || prod?.code).toUpperCase()] || []));

          const newFeatures = currentFeatures.map((f) => {
            if (f.key === featureKey) {
              const nextEnabled = !f.enabled;
              const currentVal = f.value !== undefined ? f.value : (featureKey === "multipleCities" ? 3 : true);
              return {
                ...f,
                enabled: nextEnabled,
                value: currentVal,
                name: (featureKey === "multipleCities" && currentVal && currentVal > 1)
                  ? `Multiple Cities Allowed (up to ${currentVal})`
                  : (featureKey === "multipleCities" ? "Multiple Cities Allowed" : f.name),
              };
            }
            return f;
          });
          return { ...it, features: newFeatures };
        }
        return it;
      });
      return { ...prev, items: updatedItems };
    });
  };

  const handleFeatureValueChange = (productId, featureKey, val) => {
    const num = Math.max(1, parseInt(val, 10) || 1);
    setBuilderPlanForm((prev) => {
      const updatedItems = prev.items.map((it) => {
        if (String(it.productId) === String(productId)) {
          const prod = getCatalogProduct(productId);
          const currentFeatures =
            it.features && it.features.length > 0
              ? it.features
              : (prod?.features && prod.features.length > 0
                  ? prod.features
                  : (DEFAULT_PRODUCT_FEATURES[String(it.productCode || prod?.code).toUpperCase()] || []));

          const newFeatures = currentFeatures.map((f) => {
            if (f.key === featureKey) {
              return {
                ...f,
                value: num,
                name: featureKey === "multipleCities" ? `Multiple Cities Allowed (up to ${num})` : f.name,
              };
            }
            return f;
          });
          return { ...it, features: newFeatures };
        }
        return it;
      });
      return { ...prev, items: updatedItems };
    });
  };

  // Helper to calculate total price based on product type, quota count, and defaultPrice
  const calculateItemsCatalogPrice = (itemsList, planValidity, prods = availableProducts) => {
    const pValidity = Number(planValidity || builderPlanForm?.validity || 90);
    return (itemsList || []).reduce((sum, item) => {
      const prod = prods.find((p) => String(p._id) === String(item.productId));
      const computed = computeItemCycle(item, prod, pValidity);
      return sum + computed.subtotal;
    }, 0);
  };

  // Helper to update items and automatically synchronize basePrice when not manually edited
  const updateItemsAndSyncPrice = (newItems, customValidity) => {
    const effectiveDays = Math.max(
      1,
      Number(customValidity !== undefined && customValidity !== "" ? customValidity : builderPlanForm.validity || 90)
    );
    const computedItems = (newItems || []).map((it) => {
      const prod = getCatalogProduct(it.productId);
      return computeItemCycle(it, prod, effectiveDays);
    });
    const newCatalogSum = calculateItemsCatalogPrice(computedItems, effectiveDays);
    setBuilderPlanForm((prev) => ({
      ...prev,
      validity: customValidity !== undefined ? customValidity : prev.validity,
      items: computedItems,
      basePrice: isPriceManuallyEdited ? prev.basePrice : newCatalogSum,
    }));
  };

  const handleResetToCatalogPrice = () => {
    const catalogSum = calculateItemsCatalogPrice(builderPlanForm.items, builderPlanForm.validity);
    setBuilderPlanForm((prev) => ({
      ...prev,
      basePrice: catalogSum,
    }));
    setIsPriceManuallyEdited(false);
  };

  const handlePlanCodeSelect = (val) => {
    if (val === "CUSTOM_OTHER") {
      setIsCustomPlanCode(true);
      setBuilderPlanForm((prev) => ({
        ...prev,
        code: "",
      }));
    } else {
      setIsCustomPlanCode(false);
      const match = STANDARD_PLAN_CODES.find((item) => item.code === val);
      setBuilderPlanForm((prev) => ({
        ...prev,
        code: val,
        name: match?.defaultName || prev.name,
        planType: match?.planType || prev.planType,
      }));
    }
  };

  const handleCustomPlanCodeChange = (customCodeRaw) => {
    const rawUpper = customCodeRaw.toUpperCase().replace(/\s+/g, "_");
    let inferredType = "CUSTOM";
    if (rawUpper.includes("FREE")) inferredType = "FREE";
    else if (rawUpper.includes("ENTERPRISE")) inferredType = "ENTERPRISE";
    else if (rawUpper.includes("CORP")) inferredType = "CORPORATE";
    else if (rawUpper.includes("SMB") || rawUpper.includes("STARTUP")) inferredType = "SMB";

    const words = rawUpper.split("_").filter(Boolean);
    const suggestedName = words
      .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
      .join(" ");

    setBuilderPlanForm((prev) => ({
      ...prev,
      code: rawUpper,
      name: suggestedName ? `${suggestedName} Plan` : prev.name,
      planType: inferredType,
    }));
  };

  // Populate form for editing existing plan
  const initEditPlan = (plan, prodsList) => {
    setEditingPlanId(plan._id);
    setIsCustomPlanCode(Boolean(plan?.code && !STANDARD_PLAN_CODES.some((c) => c.code === plan.code)));
    setBuilderStep(1);

    const ver =
      plan.activeVersion ||
      plan.publishedVersion ||
      (plan.versions || []).find((v) => v.status === "PUBLISHED") ||
      (plan.versions || [])[0] ||
      {};
    const existingItems = Array.isArray(ver.items) ? ver.items : [];
    const planValidity = ver.validity || plan.validity || 90;

    const mappedItems = existingItems.map((it) => {
      const catalogProd = prodsList.find(
        (p) => String(p._id) === String(it.productId?._id || it.productId)
      );
      const code = String(it.productCode || catalogProd?.code || "").toUpperCase();
      const cat = String(catalogProd?.category || it.category || "").toUpperCase();
      const isAi = code === "AI_CREDIT" || code.includes("AI") || cat === "AI";

      // If AI: user defined monthly quota allowance (it.baseQuantity or it.quantity)
      // If Non-AI: exact total plan credit count
      let creditCount = 1;
      if (isAi) {
        creditCount = Number(
          it.baseQuantity !== undefined && it.baseQuantity > 0
            ? it.baseQuantity
            : it.quantity || 50
        );
      } else {
        if (it.baseQuantity !== undefined && it.baseQuantity > 0 && it.quantity > it.baseQuantity) {
          creditCount = Number(it.baseQuantity);
        } else {
          creditCount = Number(it.quantity !== undefined ? it.quantity : it.baseQuantity || 1);
        }
      }

      return computeItemCycle(
        {
          productId: it.productId?._id || it.productId,
          productCode: it.productCode || catalogProd?.code,
          productName: it.productName || catalogProd?.name,
          productType: it.productType || catalogProd?.productType || "CREDIT_BASED",
          category: it.category || catalogProd?.category,
          unitPrice: catalogProd?.defaultPrice ?? (Number(it.unitPrice) || 0),
          baseQuantity: creditCount,
          quantity: creditCount,
          unit: it.unit || catalogProd?.unit || "Credit",
          productCycleDays: isAi ? 30 : planValidity,
          features: it.features || catalogProd?.features || [],
        },
        catalogProd,
        planValidity
      );
    });

    const catalogPrice = calculateItemsCatalogPrice(mappedItems, planValidity, prodsList);
    const savedBasePrice = ver.basePrice !== undefined ? ver.basePrice : catalogPrice;

    const verTaxType = ver.taxType || plan.taxType || (Number(ver.cgstRate) > 0 || Number(ver.sgstRate) > 0 ? "CGST_SGST" : "IGST");
    const rawTax = ver.taxPercent !== undefined ? ver.taxPercent : (plan.taxPercent ?? 18);
    const verIgst = verTaxType === "IGST" ? Number(ver.igstRate !== undefined ? ver.igstRate : rawTax) : 0;
    const verCgst = verTaxType === "CGST_SGST" ? Number(ver.cgstRate !== undefined ? ver.cgstRate : 9) : 0;
    const verSgst = verTaxType === "CGST_SGST" ? Number(ver.sgstRate !== undefined ? ver.sgstRate : 9) : 0;

    setBuilderPlanForm({
      name: plan.name || "",
      code: plan.code || "",
      planType: plan.planType || "SMB",
      description: plan.description || "",
      validity: planValidity,
      validityUnit: ver.validityUnit || "DAYS",
      gracePeriodDays: ver.gracePeriodDays !== undefined ? ver.gracePeriodDays : (plan.gracePeriodDays !== undefined ? plan.gracePeriodDays : 90),
      basePrice: savedBasePrice,
      discount: ver.discount || 0,
      taxType: verTaxType,
      igstRate: verIgst,
      cgstRate: verCgst,
      sgstRate: verSgst,
      taxPercent: verIgst + verCgst + verSgst,
      items: mappedItems,
      publishImmediately: true,
    });

    setIsPriceManuallyEdited(ver.basePrice !== undefined);
  };

  // Populate form for creating new plan
  const initNewPlan = (prodsList) => {
    setEditingPlanId(null);
    setBuilderStep(1);
    setIsPriceManuallyEdited(false);

    const initialPlanValidity = 90;

    const initialItems = prodsList.slice(0, 3).map((p) => {
      const defaultBase = p.code === "RESDEX" ? 500 : p.code === "AI_CREDIT" ? 50 : 10;
      return computeItemCycle(
        {
          productId: p._id,
          productCode: p.code,
          productName: p.name,
          productType: p.productType || "CREDIT_BASED",
          category: p.category,
          unitPrice: p.defaultPrice || 0,
          baseQuantity: defaultBase,
          quantity: defaultBase,
          unit: p.unit || "Credit",
          productCycleDays: 30,
          features: p.features || [],
        },
        p,
        initialPlanValidity
      );
    });

    const initialCatalogSum = calculateItemsCatalogPrice(initialItems, initialPlanValidity, prodsList);

    setBuilderPlanForm({
      name: "",
      code: "",
      planType: "SMB",
      description: "",
      validity: initialPlanValidity,
      validityUnit: "DAYS",
      gracePeriodDays: 90,
      basePrice: initialCatalogSum,
      discount: 0,
      taxType: "IGST",
      igstRate: 18,
      cgstRate: 0,
      sgstRate: 0,
      taxPercent: 18,
      items: initialItems,
      publishImmediately: true,
    });
    setIsCustomPlanCode(false);
  };

  useEffect(() => {
    const loadInitData = async () => {
      setLoading(true);
      setError("");
      try {
        const prodsRes = await getCommercialProducts({ status: "ACTIVE" });
        const prods = prodsRes?.products || [];
        setAvailableProducts(prods);

        if (planId) {
          // Editing existing plan - always fetch fresh full details
          let planData = location.state?.plan;
          try {
            const planRes = await getCommercialPlanById(planId);
            if (planRes.success && planRes.data) {
              planData = planRes.data;
            }
          } catch (e) {
            console.warn("Could not fetch plan by id, falling back to location state", e);
          }

          if (planData) {
            initEditPlan(planData, prods);
          } else {
            setError("Plan not found");
          }
        } else {
          // Creating new plan
          initNewPlan(prods);
        }
      } catch (err) {
        setError(err.message || "Failed to initialize plan builder");
      } finally {
        setLoading(false);
      }
    };

    loadInitData();
  }, [planId]);

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
      const defaultBase =
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

      const newItem = computeItemCycle(
        {
          productId: prod._id,
          productCode: prod.code,
          productName: prod.name,
          productType: prod.productType || "CREDIT_BASED",
          category: prod.category,
          unitPrice: prod.defaultPrice || 0,
          baseQuantity: defaultBase,
          quantity: defaultBase,
          unit: prod.unit || "Credit",
          productCycleDays: 30,
          features: prod.features || [],
        },
        prod,
        builderPlanForm.validity || 90
      );
      updateItemsAndSyncPrice([...builderPlanForm.items, newItem]);
    }
  };

  const handleRemoveProductFromPlan = (productId) => {
    const updatedItems = builderPlanForm.items.filter(
      (i) => String(i.productId) !== String(productId)
    );
    updateItemsAndSyncPrice(updatedItems);
  };

  const handleQuantityChange = (productId, newQty) => {
    const qty = Math.max(0, Number(newQty));
    const prod = getCatalogProduct(productId);
    const updatedItems = builderPlanForm.items.map((i) => {
      if (String(i.productId) === String(productId)) {
        return computeItemCycle({ ...i, baseQuantity: qty, quantity: qty }, prod, builderPlanForm.validity);
      }
      return i;
    });
    updateItemsAndSyncPrice(updatedItems);
  };

  const handleSelectAllProducts = () => {
    const allItems = availableProducts.map((prod) => {
      const existing = builderPlanForm.items.find(
        (i) => String(i.productId) === String(prod._id)
      );
      if (existing) return existing;
      const defaultBase =
        prod.code === "RESDEX"
          ? 500
          : prod.code === "AI_CREDIT"
          ? 50
          : prod.code === "HOT_VACANCY"
          ? 2
          : prod.code === "SMB_JOB"
          ? 10
          : 10;

      return computeItemCycle(
        {
          productId: prod._id,
          productCode: prod.code,
          productName: prod.name,
          productType: prod.productType || "CREDIT_BASED",
          category: prod.category,
          unitPrice: prod.defaultPrice || 0,
          baseQuantity: defaultBase,
          quantity: defaultBase,
          unit: prod.unit || "Credit",
          productCycleDays: existing?.productCycleDays || 30,
          features: prod.features || [],
        },
        prod,
        builderPlanForm.validity || 90
      );
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

    setSaving(true);
    try {
      const computedItems = builderPlanForm.items.map((it) => {
        const prod = availableProducts.find(
          (p) => String(p._id) === String(it.productId?._id || it.productId)
        );
        return computeItemCycle(it, prod, builderPlanForm.validity || 90);
      });

      // Pricing calculations for payload
      const basePriceNum = Number(builderPlanForm.basePrice || 0);
      const discountNum = Number(builderPlanForm.discount || 0);
      const taxableNum = Math.max(0, basePriceNum - discountNum);

      const isIgst = builderPlanForm.taxType === "IGST";
      const igstRate = isIgst ? Number(builderPlanForm.igstRate || 0) : 0;
      const cgstRate = !isIgst ? Number(builderPlanForm.cgstRate || 0) : 0;
      const sgstRate = !isIgst ? Number(builderPlanForm.sgstRate || 0) : 0;

      const igstAmount = Math.round((taxableNum * igstRate) / 100);
      const cgstAmount = Math.round((taxableNum * cgstRate) / 100);
      const sgstAmount = Math.round((taxableNum * sgstRate) / 100);
      const taxAmountNum = igstAmount + cgstAmount + sgstAmount;
      const finalPriceNum = Math.round(taxableNum + taxAmountNum);
      const discountPercentNum = basePriceNum > 0 ? Math.round((discountNum / basePriceNum) * 100) : 0;
      const totalTaxPercent = igstRate + cgstRate + sgstRate;

      const payload = {
        ...builderPlanForm,
        validity: Math.max(1, Number(builderPlanForm.validity || 90)),
        gracePeriodDays: Math.max(0, Number(builderPlanForm.gracePeriodDays !== undefined && builderPlanForm.gracePeriodDays !== "" ? builderPlanForm.gracePeriodDays : 90)),
        basePrice: basePriceNum,
        discount: discountNum,
        discountPercent: discountPercentNum,
        taxType: isIgst ? "IGST" : "CGST_SGST",
        igstRate,
        cgstRate,
        sgstRate,
        igstAmount,
        cgstAmount,
        sgstAmount,
        taxPercent: totalTaxPercent,
        taxAmount: taxAmountNum,
        finalPrice: finalPriceNum,
        sellPrice: finalPriceNum,
        finalPayablePrice: finalPriceNum,
        items: computedItems.map((ci) => ({
          ...ci,
          unitPrice: ci.unitPrice,
          basePrice: ci.subtotal,
        })),
      };

      if (editingPlanId) {
        await updateCommercialPlan(editingPlanId, payload);
      } else {
        await createCommercialPlan(payload);
      }

      navigate("/admin/commercial/plans", {
        state: {
          successMsg: editingPlanId
            ? `Plan '${builderPlanForm.name}' updated successfully!`
            : `Plan '${builderPlanForm.name}' created and published successfully!`,
        },
      });
    } catch (err) {
      alert(err.message || (editingPlanId ? "Failed to update plan" : "Failed to create plan"));
    } finally {
      setSaving(false);
    }
  };

  // Dynamic Catalog Total based on selected items and catalog rates
  const calculatedCatalogTotal = useMemo(() => {
    return calculateItemsCatalogPrice(builderPlanForm.items, builderPlanForm.validity, availableProducts);
  }, [builderPlanForm.items, builderPlanForm.validity, availableProducts]);

  // Pricing calculations for Builder Step 3 & 4
  const taxable = Math.max(0, builderPlanForm.basePrice - builderPlanForm.discount);
  const isIgstPlan = builderPlanForm.taxType === "IGST";
  const planIgstRate = isIgstPlan ? Number(builderPlanForm.igstRate || 0) : 0;
  const planCgstRate = !isIgstPlan ? Number(builderPlanForm.cgstRate || 0) : 0;
  const planSgstRate = !isIgstPlan ? Number(builderPlanForm.sgstRate || 0) : 0;
  const planIgstAmount = Math.round((taxable * planIgstRate) / 100);
  const planCgstAmount = Math.round((taxable * planCgstRate) / 100);
  const planSgstAmount = Math.round((taxable * planSgstRate) / 100);
  const taxAmount = planIgstAmount + planCgstAmount + planSgstAmount;
  const finalPrice = Math.round(taxable + taxAmount);

  if (loading) {
    return (
      <div className="flex min-h-[400px] w-full items-center justify-center">
        <div className="flex items-center gap-3 text-slate-500 text-sm font-semibold">
          <LuRefreshCw className="h-5 w-5 animate-spin text-indigo-600" />
          Loading plan builder...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <p className="text-sm font-bold text-rose-600">{error}</p>
        <button
          onClick={() => navigate("/admin/commercial/plans")}
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white"
        >
          <LuArrowLeft className="h-4 w-4" /> Back to Plans
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header / Back Nav */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate("/admin/commercial/plans")}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition shadow-2xs"
          >
            <LuArrowLeft className="h-4 w-4" /> Back to Plans
          </button>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 md:text-2xl">
              {editingPlanId ? `Edit Plan: ${builderPlanForm.name || "Commercial Plan"}` : "Create Commercial Plan"}
            </h1>
            <p className="text-xs text-slate-500">
              {editingPlanId
                ? "Update commercial plan parameters, products quotas, rates and pricing."
                : "Follow the 4-step wizard to configure a complete commercial plan package."}
            </p>
          </div>
        </div>

        {/* Wizard Step Progress Pills */}
        <div className="flex items-center gap-1.5 bg-slate-100/80 p-1 rounded-2xl border border-slate-200">
          {[
            { step: 1, label: "1. Info" },
            { step: 2, label: "2. Products" },
            { step: 3, label: "3. Pricing" },
            { step: 4, label: "4. Review" },
          ].map((s) => (
            <button
              key={s.step}
              type="button"
              onClick={() => {
                if (s.step > builderStep) {
                  if (builderStep === 1 && (!builderPlanForm.name || !builderPlanForm.code)) {
                    alert("Plan name and code are required.");
                    return;
                  }
                  if (builderStep === 2 && builderPlanForm.items.length === 0) {
                    alert("Please add at least one product item.");
                    return;
                  }
                }
                setBuilderStep(s.step);
              }}
              className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                builderStep === s.step
                  ? "bg-white text-indigo-700 shadow-xs font-bold"
                  : builderStep > s.step
                  ? "text-slate-700 hover:text-slate-900"
                  : "text-slate-400"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Builder Card Container */}
      <div className="w-full flex flex-col rounded-3xl bg-white shadow-sm border border-slate-200 overflow-hidden">
        {/* Step Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 flex-shrink-0 bg-white">
          <div>
            <div className="flex items-center gap-2">
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                  editingPlanId ? "bg-amber-100 text-amber-800" : "bg-indigo-50 text-indigo-700"
                }`}
              >
                {editingPlanId ? "Editing Plan" : "New Plan Builder"} • Step {builderStep} of 4
              </span>
              <h2 className="text-base font-bold text-slate-900">
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
                : "Configure step settings and click Next Step to proceed."}
            </p>
          </div>
        </div>

        {/* Content Body */}
        <div className="px-6 py-5 space-y-6">
          {/* Step 1: Basic Info */}
          {builderStep === 1 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* 1. Plan Code (First Place) */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Plan Code * (Unique)</label>
                  <select
                    required
                    value={isCustomPlanCode ? "CUSTOM_OTHER" : builderPlanForm.code}
                    onChange={(e) => handlePlanCodeSelect(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-mono font-bold text-slate-800 focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="">-- Select Plan Code --</option>
                    {STANDARD_PLAN_CODES.map((item) => (
                      <option key={item.code} value={item.code}>
                        {item.label}
                      </option>
                    ))}
                    <option value="CUSTOM_OTHER">Custom / Other Plan Code...</option>
                  </select>

                  {isCustomPlanCode && (
                    <input
                      type="text"
                      required
                      placeholder="ENTER CUSTOM PLAN CODE (e.g. STARTUP_TIER)"
                      value={builderPlanForm.code}
                      onChange={(e) => handleCustomPlanCodeChange(e.target.value)}
                      className="mt-2 w-full rounded-xl border border-indigo-300 bg-indigo-50/30 px-3 py-2 text-xs font-mono font-bold uppercase text-indigo-950 focus:border-indigo-500 focus:outline-none"
                    />
                  )}
                </div>

                {/* 2. Plan Name (Auto-filled, editable) */}
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
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                  <label className="block text-xs font-semibold text-slate-700">Validity (Days) *</label>
                  <input
                    type="number"
                    min="1"
                    value={builderPlanForm.validity ?? ""}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === "") {
                        setBuilderPlanForm((prev) => ({ ...prev, validity: "" }));
                        return;
                      }
                      const num = Number(val);
                      updateItemsAndSyncPrice(builderPlanForm.items, num);
                    }}
                    onBlur={() => {
                      if (!builderPlanForm.validity || Number(builderPlanForm.validity) < 1) {
                        updateItemsAndSyncPrice(builderPlanForm.items, 90);
                      }
                    }}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-indigo-950"
                  />
                  <p className="mt-1 text-[11px] text-slate-400">Active duration of the plan.</p>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Read-Only Grace (Days) *</label>
                  <input
                    type="number"
                    min="0"
                    value={builderPlanForm.gracePeriodDays ?? ""}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === "") {
                        setBuilderPlanForm((prev) => ({ ...prev, gracePeriodDays: "" }));
                        return;
                      }
                      const newGrace = Math.max(0, Number(val));
                      setBuilderPlanForm((prev) => ({ ...prev, gracePeriodDays: newGrace }));
                    }}
                    onBlur={() => {
                      if (builderPlanForm.gracePeriodDays === "" || isNaN(Number(builderPlanForm.gracePeriodDays))) {
                        setBuilderPlanForm((prev) => ({ ...prev, gracePeriodDays: 90 }));
                      }
                    }}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-indigo-950"
                  />
                  <p className="mt-1 text-[11px] text-slate-400">Post-expiry read-only window (0 = lock immediately).</p>
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
                        {isSelected && (() => {
                          const computed = computeItemCycle(item, prod, builderPlanForm.validity);
                          return (
                            <div className="mt-3 pt-3 border-t border-indigo-100/70 space-y-3 bg-white/80 p-3.5 rounded-xl border border-indigo-100">
                              {computed.isAi ? (
                                <>
                                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs bg-purple-50/80 p-2.5 rounded-lg border border-purple-200">
                                    <div className="flex items-center gap-2">
                                      <span className="font-bold text-purple-900">Monthly AI Allocation Pool</span>
                                      <span className="text-purple-600 text-[11px]">→ Resets every 30 days (0 rollover)</span>
                                    </div>
                                    <span className="inline-flex items-center rounded-md bg-purple-100 px-2 py-0.5 text-[10px] font-bold text-purple-800">
                                      {computed.multiplier} Months Duration ({builderPlanForm.validity}d Plan)
                                    </span>
                                  </div>

                                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                                    {/* 1. Monthly Allowance */}
                                    <div>
                                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                        Monthly Allowance *
                                      </label>
                                      <input
                                        type="number"
                                        min="0"
                                        value={computed.quantity}
                                        onChange={(e) => handleQuantityChange(prod._id, e.target.value)}
                                        className="w-full rounded-lg border border-purple-300 bg-white px-2.5 py-1.5 text-xs font-bold text-indigo-950 focus:border-indigo-500 focus:outline-none"
                                      />
                                      <span className="text-[10px] text-slate-400 mt-0.5 block">
                                        Assigned fresh each calendar month
                                      </span>
                                    </div>

                                    {/* 2. Total Plan Credits */}
                                    <div>
                                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                        Total Across Plan ({builderPlanForm.validity}d)
                                      </label>
                                      <div className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-semibold text-slate-800">
                                        {computed.totalQuantity} {item.unit || prod.unit}s
                                      </div>
                                      <span className="text-[10px] font-medium text-purple-600 mt-0.5 block">
                                        {computed.quantity}/mo × {computed.multiplier} months
                                      </span>
                                    </div>

                                    {/* 3. Validity (Days) */}
                                    <div>
                                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                        Monthly Reset Cycle
                                      </label>
                                      <div className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-semibold text-slate-800">
                                        30 Days (Resets Monthly)
                                      </div>
                                      <span className="text-[10px] text-slate-400 mt-0.5 block">
                                        Expires monthly with 0 rollover
                                      </span>
                                    </div>

                                    {/* 4. Subtotal */}
                                    <div>
                                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                        Rate & Calculated Subtotal
                                      </label>
                                      <div className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-bold text-slate-900">
                                        ₹{computed.subtotal.toLocaleString()}
                                      </div>
                                      <span className="text-[10px] text-slate-500 mt-0.5 block">
                                        ₹{computed.unitPrice.toLocaleString()}/{item.unit || prod.unit} × {computed.multiplier} mo
                                      </span>
                                    </div>
                                  </div>
                                </>
                              ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                  {/* 1. Total Quota / Credits */}
                                  <div>
                                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                      Total Plan Credits / Quota *
                                    </label>
                                    <input
                                      type="number"
                                      min="0"
                                      value={computed.quantity}
                                      onChange={(e) => handleQuantityChange(prod._id, e.target.value)}
                                      className="w-full rounded-lg border border-indigo-300 bg-indigo-50/20 px-2.5 py-1.5 text-xs font-bold text-indigo-950 focus:border-indigo-500 focus:outline-none"
                                    />
                                    <span className="text-[10px] text-slate-400 mt-0.5 block">
                                      Total {item.unit || prod.unit}s included in this plan
                                    </span>
                                  </div>

                                  {/* 2. Validity (Days) */}
                                  <div>
                                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                      Credit Validity in Plan
                                    </label>
                                    <div className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-semibold text-slate-800">
                                      {builderPlanForm.validity} Days (Full Plan Duration)
                                    </div>
                                    <span className="text-[10px] text-slate-400 mt-0.5 block">
                                      Valid throughout entire plan duration
                                    </span>
                                  </div>

                                  {/* 3. Subtotal */}
                                  <div>
                                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                      Rate & Calculated Subtotal
                                    </label>
                                    <div className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-bold text-slate-900">
                                      ₹{computed.subtotal.toLocaleString()}
                                    </div>
                                    <span className="text-[10px] text-slate-500 mt-0.5 block">
                                      ₹{computed.unitPrice.toLocaleString()}/{item.unit || prod.unit} × {computed.quantity}
                                    </span>
                                  </div>
                                </div>
                              )}

                              {/* Product Features & Service Entitlements Toggle List */}
                              {computed.features && computed.features.length > 0 && (
                                <div className="mt-3.5 pt-3 border-t border-slate-200/80">
                                  <div className="flex flex-wrap items-center justify-between gap-1 mb-2">
                                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                                      <LuSparkles className="h-3.5 w-3.5 text-indigo-600" />
                                      <span>Included Service Features & Capabilities</span>
                                    </div>
                                    <span className="text-[11px] text-slate-500 font-medium">
                                      Click to toggle features included for this product
                                    </span>
                                  </div>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                    {computed.features.map((feat) => {
                                      const isEnabled = feat.enabled !== false;
                                      const isMultipleCities = feat.key === "multipleCities";

                                      if (isMultipleCities) {
                                        const cityLimit = feat.value !== undefined ? Number(feat.value) : 3;
                                        return (
                                          <div
                                            key={feat.key}
                                            className={`flex flex-col justify-between p-3 rounded-xl border transition-all ${
                                              isEnabled
                                                ? "border-emerald-300 bg-emerald-50/80 text-emerald-950 shadow-xs"
                                                : "border-slate-200 bg-slate-50 text-slate-400 hover:border-slate-300"
                                            }`}
                                          >
                                            <div className="flex items-center justify-between gap-2">
                                              <div
                                                className="min-w-0 pr-1 cursor-pointer flex-1"
                                                onClick={() => handleToggleFeature(prod._id, feat.key)}
                                              >
                                                <div className="text-xs font-bold truncate">
                                                  Multiple Cities Allowed
                                                </div>
                                                <div className="text-[10px] text-slate-500 font-mono">
                                                  {feat.key}
                                                </div>
                                              </div>
                                              <button
                                                type="button"
                                                onClick={() => handleToggleFeature(prod._id, feat.key)}
                                                className={`inline-flex items-center justify-center h-5 w-5 rounded-full text-[11px] font-bold shrink-0 transition ${
                                                  isEnabled
                                                    ? "bg-emerald-600 text-white"
                                                    : "bg-slate-200 text-slate-500"
                                                }`}
                                              >
                                                {isEnabled ? <LuCheck className="h-3 w-3" /> : "✕"}
                                              </button>
                                            </div>

                                            {isEnabled && (
                                              <div className="mt-2.5 pt-2 border-t border-emerald-200/80 flex items-center justify-between gap-2">
                                                <span className="text-[11px] font-semibold text-emerald-900">
                                                  Max Cities Allowed:
                                                </span>
                                                <div className="flex items-center gap-1.5">
                                                  <input
                                                    type="number"
                                                    min="1"
                                                    max="50"
                                                    value={cityLimit}
                                                    onChange={(e) =>
                                                      handleFeatureValueChange(prod._id, feat.key, e.target.value)
                                                    }
                                                    className="w-16 rounded-lg border border-emerald-400 bg-white px-2 py-0.5 text-xs font-bold text-slate-900 text-center focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                                  />
                                                  <span className="text-[11px] text-emerald-800 font-medium">
                                                    cities
                                                  </span>
                                                </div>
                                              </div>
                                            )}
                                          </div>
                                        );
                                      }

                                      return (
                                        <button
                                          key={feat.key}
                                          type="button"
                                          onClick={() => handleToggleFeature(prod._id, feat.key)}
                                          className={`flex items-center justify-between gap-2 px-3 py-2 rounded-xl border text-left transition-all ${
                                            isEnabled
                                              ? "border-emerald-300 bg-emerald-50/80 text-emerald-950 shadow-xs"
                                              : "border-slate-200 bg-slate-50 text-slate-400 hover:border-slate-300"
                                          }`}
                                        >
                                          <div className="min-w-0 pr-1">
                                            <div className="text-xs font-bold truncate">
                                              {feat.name || feat.key}
                                            </div>
                                            <div className="text-[10px] text-slate-500 font-mono">
                                              {feat.key}
                                            </div>
                                          </div>
                                          <span
                                            className={`inline-flex items-center justify-center h-5 w-5 rounded-full text-[11px] font-bold shrink-0 ${
                                              isEnabled
                                                ? "bg-emerald-600 text-white"
                                                : "bg-slate-200 text-slate-500"
                                            }`}
                                          >
                                            {isEnabled ? <LuCheck className="h-3 w-3" /> : "✕"}
                                          </span>
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })()}
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
                          <th className="py-2.5 px-3 text-center">Allocation Scope</th>
                          <th className="py-2.5 px-3 text-center">Plan Quota</th>
                          <th className="py-2.5 px-3 text-right">Catalog Unit Rate</th>
                          <th className="py-2.5 px-3 text-right">Calculated Subtotal</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {builderPlanForm.items.map((item, idx) => {
                          const prod = getCatalogProduct(item.productId);
                          const computed = computeItemCycle(item, prod, builderPlanForm.validity);
                          const pType = prod?.productType || item.productType || "CREDIT_BASED";

                          return (
                            <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                              <td className="py-2.5 px-3">
                                <div className="font-bold text-slate-900">{computed.productName}</div>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  <span className="font-mono text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                                    {computed.productCode}
                                  </span>
                                  {prod?.category && (
                                    <span className="text-[10px] text-slate-400">
                                      • {prod.category}
                                    </span>
                                  )}
                                </div>
                                {computed.features && computed.features.some((f) => f.enabled !== false) && (
                                  <div className="flex flex-wrap gap-1 mt-1.5">
                                    {computed.features
                                      .filter((f) => f.enabled !== false)
                                      .map((f) => (
                                        <span
                                          key={f.key}
                                          className="inline-flex items-center gap-1 text-[9px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-medium border border-slate-200"
                                        >
                                          <LuCheck className="h-2.5 w-2.5 text-emerald-600" />
                                          {f.name || f.key}
                                        </span>
                                      ))}
                                  </div>
                                )}
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
                                  {(pType || "CREDIT_BASED").replace(/_/g, " ")}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-center">
                                {computed.isAi ? (
                                  <span className="inline-block text-[10px] font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                                    Monthly Pool ({computed.multiplier} mo)
                                  </span>
                                ) : (
                                  <span className="inline-block text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                    Total ({builderPlanForm.validity}d)
                                  </span>
                                )}
                              </td>
                              <td className="py-2.5 px-3 text-center">
                                <span className="inline-block font-bold text-slate-800 bg-slate-100 px-2 py-1 rounded-lg">
                                  {computed.quantity.toLocaleString()} {computed.unit}s {computed.isAi ? "/ mo" : ""}
                                </span>
                                <span className="block text-[9px] text-slate-400 mt-0.5">
                                  {computed.isAi
                                    ? `(${computed.totalQuantity} total over ${computed.multiplier} mo)`
                                    : `total plan quota`}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-right">
                                <div className="font-medium text-slate-700">
                                  ₹{computed.unitPrice.toLocaleString()}
                                </div>
                                <div className="text-[10px] text-slate-400">
                                  per {computed.unit}
                                </div>
                              </td>
                              <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                                ₹{computed.subtotal.toLocaleString()}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot>
                        <tr className="border-t-2 border-slate-200 bg-slate-50/80 font-bold text-slate-900">
                          <td colSpan="5" className="py-2.5 px-3 text-right">
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

                {/* GST Taxation Mode: IGST vs (CGST + SGST) */}
                <div className="rounded-xl border border-slate-200 bg-white p-3 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800">
                      GST Taxation Mode & Statutory Distribution
                    </label>
                    <span className="text-[10px] text-slate-500">
                      {builderPlanForm.taxType === "IGST" ? "Inter-State Supply" : "Intra-State Supply"}
                    </span>
                  </div>

                  {/* Mode Selector */}
                  <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
                    <button
                      type="button"
                      onClick={() =>
                        setBuilderPlanForm({
                          ...builderPlanForm,
                          taxType: "IGST",
                          igstRate: builderPlanForm.igstRate > 0 ? builderPlanForm.igstRate : 18,
                          cgstRate: 0,
                          sgstRate: 0,
                          taxPercent: builderPlanForm.igstRate > 0 ? builderPlanForm.igstRate : 18,
                        })
                      }
                      className={`rounded-lg py-1.5 px-2 text-center transition border ${
                        builderPlanForm.taxType === "IGST"
                          ? "bg-indigo-50 border-indigo-500 text-indigo-700 font-bold"
                          : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      IGST (Inter-State Supply)
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setBuilderPlanForm({
                          ...builderPlanForm,
                          taxType: "CGST_SGST",
                          igstRate: 0,
                          cgstRate: builderPlanForm.cgstRate > 0 ? builderPlanForm.cgstRate : 9,
                          sgstRate: builderPlanForm.sgstRate > 0 ? builderPlanForm.sgstRate : 9,
                          taxPercent: (builderPlanForm.cgstRate > 0 ? builderPlanForm.cgstRate : 9) + (builderPlanForm.sgstRate > 0 ? builderPlanForm.sgstRate : 9),
                        })
                      }
                      className={`rounded-lg py-1.5 px-2 text-center transition border ${
                        builderPlanForm.taxType === "CGST_SGST"
                          ? "bg-indigo-50 border-indigo-500 text-indigo-700 font-bold"
                          : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      CGST + SGST (Intra-State Supply)
                    </button>
                  </div>

                  {/* Tax Rate Inputs with Mutual Exclusion Auto-Zero */}
                  {builderPlanForm.taxType === "IGST" ? (
                    <div className="grid grid-cols-3 gap-2 pt-1">
                      <div>
                        <label className="block text-[11px] font-bold text-indigo-900">
                          IGST Rate (%) *
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          required
                          value={builderPlanForm.igstRate}
                          onChange={(e) => {
                            const val = e.target.value === "" ? 0 : Number(e.target.value);
                            setBuilderPlanForm({
                              ...builderPlanForm,
                              taxType: "IGST",
                              igstRate: val,
                              cgstRate: 0,
                              sgstRate: 0,
                              taxPercent: val,
                            });
                          }}
                          className="mt-1 w-full rounded-lg border border-indigo-300 bg-indigo-50/30 px-2.5 py-1.5 text-xs font-bold text-slate-900 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-medium text-slate-400">
                          CGST Rate (%)
                        </label>
                        <div className="mt-1 rounded-lg border border-slate-200 bg-slate-100 px-2.5 py-1.5 text-xs text-slate-400 font-mono">
                          0% (Auto 0)
                        </div>
                      </div>
                      <div>
                        <label className="block text-[11px] font-medium text-slate-400">
                          SGST Rate (%)
                        </label>
                        <div className="mt-1 rounded-lg border border-slate-200 bg-slate-100 px-2.5 py-1.5 text-xs text-slate-400 font-mono">
                          0% (Auto 0)
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-2 pt-1">
                      <div>
                        <label className="block text-[11px] font-medium text-slate-400">
                          IGST Rate (%)
                        </label>
                        <div className="mt-1 rounded-lg border border-slate-200 bg-slate-100 px-2.5 py-1.5 text-xs text-slate-400 font-mono">
                          0% (Auto 0)
                        </div>
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-indigo-900">
                          CGST Rate (%) *
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          required
                          value={builderPlanForm.cgstRate}
                          onChange={(e) => {
                            const val = e.target.value === "" ? 0 : Number(e.target.value);
                            setBuilderPlanForm({
                              ...builderPlanForm,
                              taxType: "CGST_SGST",
                              igstRate: 0,
                              cgstRate: val,
                              taxPercent: val + Number(builderPlanForm.sgstRate || 0),
                            });
                          }}
                          className="mt-1 w-full rounded-lg border border-indigo-300 bg-indigo-50/30 px-2.5 py-1.5 text-xs font-bold text-slate-900 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-indigo-900">
                          SGST Rate (%) *
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          required
                          value={builderPlanForm.sgstRate}
                          onChange={(e) => {
                            const val = e.target.value === "" ? 0 : Number(e.target.value);
                            setBuilderPlanForm({
                              ...builderPlanForm,
                              taxType: "CGST_SGST",
                              igstRate: 0,
                              sgstRate: val,
                              taxPercent: Number(builderPlanForm.cgstRate || 0) + val,
                            });
                          }}
                          className="mt-1 w-full rounded-lg border border-indigo-300 bg-indigo-50/30 px-2.5 py-1.5 text-xs font-bold text-slate-900 focus:outline-none"
                        />
                      </div>
                    </div>
                  )}
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
                    Validity: {builderPlanForm.validity} Days
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-slate-600">
                    <span>Total Products Base Value:</span>
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
                    <span>Taxable Base Amount:</span>
                    <span>₹{taxable.toLocaleString()}</span>
                  </div>

                  {isIgstPlan ? (
                    <div className="flex justify-between text-slate-600">
                      <span>IGST ({planIgstRate}%):</span>
                      <span>+ ₹{planIgstAmount.toLocaleString()}</span>
                    </div>
                  ) : (
                    <>
                      <div className="flex justify-between text-slate-600">
                        <span>CGST ({planCgstRate}%):</span>
                        <span>+ ₹{planCgstAmount.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>SGST ({planSgstRate}%):</span>
                        <span>+ ₹{planSgstAmount.toLocaleString()}</span>
                      </div>
                    </>
                  )}
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
                    <div className="text-[11px] text-slate-500">
                      {builderPlanForm.validity} Days Active • {builderPlanForm.gracePeriodDays ?? 90}d Read-Only Grace
                    </div>
                  </div>
                </div>

                <div className="mt-4">
                  <p className="text-xs font-semibold text-slate-700 mb-2">Included Products & Entitlements Breakdown:</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {builderPlanForm.items.map((it, idx) => {
                      const prod = getCatalogProduct(it.productId);
                      const computed = computeItemCycle(it, prod, builderPlanForm.validity);
                      return (
                        <div
                          key={idx}
                          className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/60 p-2.5 text-slate-800"
                        >
                          <div className="flex items-center gap-2">
                            <LuCheck className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                            <div>
                              <span className="font-bold">{computed.quantity}</span> {computed.productName} ({computed.unit}s)
                              {computed.isAi && (
                                <span className="text-purple-700 font-semibold ml-1 text-[11px]">/ month</span>
                              )}
                              <div className="text-[10px] text-slate-400">
                                {computed.isAi ? (
                                  <>₹{computed.unitPrice.toLocaleString()}/{computed.unit} • Monthly reset ({computed.totalQuantity} total over {computed.multiplier} mo)</>
                                ) : (
                                  <>₹{computed.unitPrice.toLocaleString()}/{computed.unit} • {builderPlanForm.validity}d validity</>
                                )}
                              </div>
                            </div>
                          </div>
                          <span className="text-xs font-mono font-bold text-slate-700">
                            ₹{computed.subtotal.toLocaleString()}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-indigo-100/70 flex flex-wrap justify-between gap-2 text-xs text-slate-600">
                  <span>
                    Base: ₹{builderPlanForm.basePrice.toLocaleString()} • Discount: ₹{builderPlanForm.discount.toLocaleString()} • Taxable: ₹{taxable.toLocaleString()} •{" "}
                    {isIgstPlan ? `IGST (${planIgstRate}%): ₹${planIgstAmount.toLocaleString()}` : `CGST (${planCgstRate}%): ₹${planCgstAmount.toLocaleString()} + SGST (${planSgstRate}%): ₹${planSgstAmount.toLocaleString()}`}
                  </span>
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

        {/* Builder Footer Navigation */}
        <div className="flex justify-between items-center px-6 py-4 border-t border-slate-100 flex-shrink-0 bg-slate-50/80 rounded-b-3xl">
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
              onClick={() => navigate("/admin/commercial/plans")}
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
                disabled={saving}
                onClick={handleSavePlan}
                className={`flex items-center gap-1.5 rounded-xl px-6 py-2 text-xs font-semibold text-white shadow-sm transition-colors ${
                  editingPlanId
                    ? "bg-indigo-600 hover:bg-indigo-700"
                    : "bg-emerald-600 hover:bg-emerald-700"
                } disabled:opacity-50`}
              >
                {saving ? (
                  <>
                    <LuRefreshCw className="h-4 w-4 animate-spin" /> Saving...
                  </>
                ) : editingPlanId ? (
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
  );
}
