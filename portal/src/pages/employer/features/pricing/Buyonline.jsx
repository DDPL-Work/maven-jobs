import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation, useSearchParams } from "react-router-dom";
import EmployerFooter from "../../../../layout/employer/LandingEmployeeFooter";
import {
  FiCheck,
  FiX,
  FiChevronDown,
  FiArrowRight,
  FiBriefcase,
  FiPhoneCall,
  FiSearch,
  FiZap,
  FiShield,
  FiTrendingUp,
  FiStar,
  FiAward,
  FiBarChart2,
  FiMessageCircle,
  FiRefreshCw,
  FiClock,
  FiCheckCircle,
  FiAlertCircle,
  FiPlus,
  FiTrash2,
  FiEye,
  FiLayers,
} from "react-icons/fi";
import { useAuth } from "../../../../AuthContext";
import paymentService from "../../../../services/paymentService";
import commercialService from "../../../../services/commercialService";
import LandingEmployeeHeader from "../../../../layout/employer/LandingEmployeeHeader";
import EmployerLoginModal from "../../../../components/employer/EmployerLoginModal";
import "./Buyonline.css";

/* ── Helpers ── */
function useScrollY() {
  const [y, setY] = useState(0);
  useEffect(() => {
    const fn = () => setY(window.scrollY);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);
  return y;
}

function useInView(threshold = 0.15) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) setVisible(true);
      },
      { threshold }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, visible];
}

function getProductIcon(code) {
  const c = String(code || "").toUpperCase();
  if (c.includes("AI")) return <FiZap className="bo-product-icon ai" />;
  if (c.includes("SEAT")) return <FiShield className="bo-product-icon seat" />;
  if (c.includes("RESDEX") || c.includes("RESUME")) return <FiSearch className="bo-product-icon resdex" />;
  if (c.includes("MIVITE") || c.includes("NVITE")) return <FiMessageCircle className="bo-product-icon mivite" />;
  if (c.includes("HOT_VACANCY") || c.includes("HOT")) return <FiStar className="bo-product-icon hot" />;
  return <FiBriefcase className="bo-product-icon job" />;
}

export function formatCurrency(val) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(val || 0);
}

// Transparent commercial pricing helper:
// Respects GST configured at product / plan creation time.
// Current price + GST = Total (No arbitrary GST applied on the frontend)
// Resolves full GST components respecting mutual exclusion:
// If IGST is applied, CGST & SGST are 0.
// If CGST & SGST are applied, IGST is 0.
export function resolveItemGst(taxableAmount, itemData = {}) {
  const taxable = Math.max(0, Number(taxableAmount || 0));
  let taxType = itemData.taxType;
  let igstRate = Number(itemData.igstRate ?? 0);
  let cgstRate = Number(itemData.cgstRate ?? 0);
  let sgstRate = Number(itemData.sgstRate ?? 0);

  // If taxType not explicitly set, deduce from rates or default to IGST
  if (!taxType) {
    if (cgstRate > 0 || sgstRate > 0) {
      taxType = "CGST_SGST";
    } else if (igstRate > 0) {
      taxType = "IGST";
    } else {
      const fallbackTax = Number(itemData.taxPercent !== undefined && itemData.taxPercent !== null ? itemData.taxPercent : 18);
      taxType = fallbackTax > 0 ? "IGST" : "NONE";
      igstRate = fallbackTax;
    }
  }

  // Mutual exclusion rule
  if (taxType === "IGST") {
    cgstRate = 0;
    sgstRate = 0;
    if (igstRate === 0 && itemData.taxPercent) {
      igstRate = Number(itemData.taxPercent);
    }
  } else if (taxType === "CGST_SGST") {
    igstRate = 0;
    if (cgstRate === 0 && sgstRate === 0 && itemData.taxPercent) {
      const half = Number(itemData.taxPercent) / 2;
      cgstRate = half;
      sgstRate = half;
    }
  } else if (taxType === "NONE") {
    igstRate = 0;
    cgstRate = 0;
    sgstRate = 0;
  }

  let igstAmount = Number(itemData.igstAmount ?? 0);
  let cgstAmount = Number(itemData.cgstAmount ?? 0);
  let sgstAmount = Number(itemData.sgstAmount ?? 0);

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
  const taxPercent = taxType === "IGST" ? igstRate : taxType === "CGST_SGST" ? (cgstRate + sgstRate) : 0;

  return {
    taxType,
    igstRate,
    cgstRate,
    sgstRate,
    igstAmount,
    cgstAmount,
    sgstAmount,
    taxPercent,
    taxAmount,
  };
}

export function formatGstFormula(pricing) {
  if (!pricing || pricing.total === 0) return "Free";
  const { base, discount, currentPrice, taxType, igstRate, cgstRate, sgstRate, igstAmount, cgstAmount, sgstAmount, taxAmount, total } = pricing;
  const basePart = discount > 0 
    ? `Base ${formatCurrency(base)} - Disc ${formatCurrency(discount)}`
    : `Base ${formatCurrency(base)}`;

  if (taxType === "IGST") {
    return `${basePart} + IGST (${igstRate}%) ${formatCurrency(igstAmount)} = Total ${formatCurrency(total)}`;
  }
  if (taxType === "CGST_SGST") {
    return `${basePart} + CGST (${cgstRate}%) ${formatCurrency(cgstAmount)} + SGST (${sgstRate}%) ${formatCurrency(sgstAmount)} = Total ${formatCurrency(total)}`;
  }
  if (taxAmount > 0) {
    return `${basePart} + GST ${formatCurrency(taxAmount)} = Total ${formatCurrency(total)}`;
  }
  return `${basePart} = Total ${formatCurrency(total)}`;
}

export function formatGstTag(pricing) {
  if (!pricing) return "";
  if (pricing.taxType === "IGST") {
    return `Base ${formatCurrency(pricing.currentPrice)} + IGST ${formatCurrency(pricing.igstAmount)}`;
  }
  if (pricing.taxType === "CGST_SGST") {
    return `Base ${formatCurrency(pricing.currentPrice)} + CGST/SGST ${formatCurrency(pricing.taxAmount)}`;
  }
  return `Base ${formatCurrency(pricing.currentPrice)} + GST ${formatCurrency(pricing.taxAmount)}`;
}

export function getProductPricing(product, quantity = 1) {
  const count = Math.max(1, Number(quantity) || 1);
  const rawUnitPrice = Number(product?.basePrice ?? product?.defaultPrice ?? product?.unitPrice ?? product?.price ?? 0);
  let unitDiscount = Number(product?.discount || 0);
  if (!unitDiscount && product?.discountPercent && rawUnitPrice > 0) {
    unitDiscount = Math.round((rawUnitPrice * Number(product.discountPercent)) / 100);
  }
  const effectiveUnitPrice = Math.max(0, rawUnitPrice - unitDiscount);
  const base = rawUnitPrice * count;
  const discount = unitDiscount * count;
  const currentPrice = effectiveUnitPrice * count;

  const gstData = resolveItemGst(currentPrice, {
    taxType: product?.taxType,
    igstRate: product?.igstRate,
    cgstRate: product?.cgstRate,
    sgstRate: product?.sgstRate,
    taxPercent: product?.taxPercent,
  });

  const total = currentPrice + gstData.taxAmount;

  return {
    base,
    unitPrice: rawUnitPrice,
    discount,
    effectiveUnitPrice,
    quantity: count,
    currentPrice,
    ...gstData,
    total,
  };
}

// Transparent commercial pricing helper:
// Respects Base Price, Discounts, and GST configured at product / plan creation time.
// Current price + GST = Total (No arbitrary GST applied on the frontend)
export function getItemPricing(item) {
  if (!item) return { base: 0, discount: 0, currentPrice: 0, taxType: "IGST", igstRate: 18, cgstRate: 0, sgstRate: 0, igstAmount: 0, cgstAmount: 0, sgstAmount: 0, taxPercent: 18, taxAmount: 0, total: 0 };

  // 1. If explicit pricing object was passed with item, respect it
  if (item.pricing && typeof item.pricing.total === "number" && item.pricing.total >= 0) {
    return item.pricing;
  }

  const isPlan = item.itemType === "PLAN" || (item.items && item.planType) || item.activeVersion;

  if (isPlan) {
    const ver = item.activeVersion || item;
    const base = Number(ver.basePrice || item.basePrice || 0);
    let discount = Number(ver.discount || item.discount || 0);
    if (!discount && (ver.discountPercent || item.discountPercent) && base > 0) {
      const dPct = Number(ver.discountPercent || item.discountPercent);
      discount = Math.round((base * dPct) / 100);
    }
    const currentPrice = Math.max(0, base - discount);

    const gstData = resolveItemGst(currentPrice, {
      taxType: ver.taxType || item.taxType || (item.product && item.product.taxType),
      igstRate: ver.igstRate ?? item.igstRate ?? (item.product && item.product.igstRate),
      cgstRate: ver.cgstRate ?? item.cgstRate ?? (item.product && item.product.cgstRate),
      sgstRate: ver.sgstRate ?? item.sgstRate ?? (item.product && item.product.sgstRate),
      igstAmount: ver.igstAmount ?? item.igstAmount ?? (item.product && item.product.igstAmount),
      cgstAmount: ver.cgstAmount ?? item.cgstAmount ?? (item.product && item.product.cgstAmount),
      sgstAmount: ver.sgstAmount ?? item.sgstAmount ?? (item.product && item.product.sgstAmount),
      taxPercent: ver.taxPercent ?? item.taxPercent ?? (item.product && item.product.taxPercent),
      taxAmount: ver.taxAmount ?? item.taxAmount,
    });

    let total;
    if (ver.finalPrice !== undefined && ver.finalPrice !== null && Number(ver.finalPrice) >= 0) {
      total = Math.round(Number(ver.finalPrice));
    } else if (item.finalPrice !== undefined && item.finalPrice !== null && Number(item.finalPrice) >= 0) {
      total = Math.round(Number(item.finalPrice));
    } else {
      total = currentPrice + gstData.taxAmount;
    }

    return {
      base,
      discount,
      currentPrice,
      ...gstData,
      total,
    };
  }

  // 2. Standalone Offer (pre-bundled fixed price)
  const isOffer = item.itemType === "STANDALONE" || item.sku || (item.productId && !item.unit);
  if (isOffer) {
    const base = Number(item.basePrice ?? item.price ?? 0);
    let discount = Number(item.discount || 0);
    if (!discount && item.discountPercent && base > 0) {
      discount = Math.round((base * Number(item.discountPercent)) / 100);
    }
    const currentPrice = Math.max(0, base - discount);

    const gstData = resolveItemGst(currentPrice, {
      taxType: item.taxType,
      igstRate: item.igstRate,
      cgstRate: item.cgstRate,
      sgstRate: item.sgstRate,
      taxPercent: item.taxPercent,
    });

    let total;
    if (item.finalPrice !== undefined && item.finalPrice !== null && Number(item.finalPrice) >= 0) {
      total = Math.round(Number(item.finalPrice));
    } else {
      total = currentPrice + gstData.taxAmount;
    }

    return {
      base,
      discount,
      currentPrice,
      ...gstData,
      total,
    };
  }

  // 3. Dynamic Product with custom count/quantity
  const qty = Math.max(1, Number(item.quantity) || 1);
  return getProductPricing(item, qty);
}

const FAQS = [
  {
    question: "What is included in a combined hiring plan?",
    answer:
      "Combined plans (like SMB Starter and Corporate) bundle job postings (SMB and Hot Vacancy), resume search views (ResDex), user seat access, and AI credits into a single discounted package with synchronized validity.",
  },
  {
    question: "Can I buy single products without buying a complete plan?",
    answer:
      "Yes! You can purchase standalone job posts (SMB, Hot Vacancy, or Internship) with any custom quantity you need, or buy standalone packs of Resume Views and AI Credits without altering an existing plan.",
  },
  {
    question: "How long are credits valid, and which credits get consumed first?",
    answer:
      "Credits are valid for the configured period (typically 30, 60, or 90 days). Our entitlement engine uses deterministic FIFO consumption—credits expiring earliest are always consumed first to prevent unnecessary credit loss.",
  },
  {
    question: "What happens to my job postings and candidates when my plan expires?",
    answer:
      "When your subscription expires, your account and historical data remain completely intact! You retain read-only access to historical job postings, applicants, and candidate notes.",
  },
  {
    question: "Can I upgrade my plan before my current plan ends?",
    answer:
      "Yes. When you upgrade to a higher tier plan, any remaining unused credits from your previous subscription are preserved and added to your new entitlement.",
  },
  {
    question: "Can I purchase additional AI Credits, and do they expire?",
    answer:
      "Yes! You can purchase standalone AI Booster packs (e.g. 100 or 500 AI credits) at any time. Monthly plan-allocated AI credits (Free: 10/mo, SMB: 50/mo, Corporate: 200/mo) are refreshed monthly and expire at the end of each month, while purchased standalone AI Booster credits remain active for their full validity period.",
  },
  {
    question: "Are taxes included in the displayed pricing?",
    answer:
      "All commercial prices clearly display the current base price and the exact GST set at product or plan creation. The final payable price is current price + GST with complete transparency before checkout.",
  },
];

export default function Buyonline() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Commercial Catalog State (Loaded dynamically from Super Admin Backend Engine)
  const [plans, setPlans] = useState([]);
  const [offers, setOffers] = useState([]);
  const [products, setProducts] = useState([]);
  const [companyEntitlements, setCompanyEntitlements] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Category Filter Navigation
  const [activeCategory, setActiveCategory] = useState("all");

  // Dynamic Product Stepper Counters
  const [smbJobCount, setSmbJobCount] = useState(1);
  const [hotJobCount, setHotJobCount] = useState(1);
  const [internshipJobCount, setInternshipJobCount] = useState(1);
  const [jobSeatCount, setJobSeatCount] = useState(1);
  const [resdexSeatCount, setResdexSeatCount] = useState(1);
  const [resdexViewCount, setResdexViewCount] = useState(25);
  const [aiOperationCount, setAiOperationCount] = useState(50);

  // Employer Login Gate State
  const [isLoginGateOpen, setIsLoginGateOpen] = useState(false);
  const pendingPaymentRef = useRef(null); // stores callback to invoke after login
  const pendingItemRef = useRef(null); // stores item to open in purchase modal after login

  // Plan Details Modal State (Combined Hiring Plans)
  const [detailPlan, setDetailPlan] = useState(null);

  // Purchase Modal State
  const [selectedItemForPurchase, setSelectedItemForPurchase] = useState(null);
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [purchaseSuccessData, setPurchaseSuccessData] = useState(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentError, setPaymentError] = useState("");

  // Contact Sales Modal State
  const [isSalesModalOpen, setIsSalesModalOpen] = useState(false);
  const [salesForm, setSalesForm] = useState({
    fullName: "",
    mobileNumber: "",
    companyName: "",
    hiringFor: "your company",
    employeeRange: "",
    designation: "",
    workEmail: "",
    city: "",
    notes: "",
    isVerified: false,
    extraFields: [],
  });
  const [captchaLoading, setCaptchaLoading] = useState(false);
  const [salesSubmitted, setSalesSubmitted] = useState(false);
  const [salesSuccess, setSalesSuccess] = useState(false);
  const [showExtraFields, setShowExtraFields] = useState(false);

  // FAQ Accordion State
  const [activeFaq, setActiveFaq] = useState(null);

  // Load commercial catalog from backend
  const loadCommercialData = async () => {
    setLoading(true);
    setError("");
    try {
      const [plansData, offersData, entData, productsData] = await Promise.all([
        commercialService.fetchPlans(),
        commercialService.fetchOffers(),
        commercialService.fetchEntitlements(),
        commercialService.fetchProducts(),
      ]);

      setPlans(plansData || []);
      setOffers(offersData || []);
      setProducts(productsData || []);
      setCompanyEntitlements(entData);
    } catch (err) {
      console.error("[Buyonline] Load failed:", err);
      setError("Unable to load commercial plans. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const [searchParams] = useSearchParams();
  const location = useLocation();

  useEffect(() => {
    loadCommercialData();
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const cat = searchParams.get("category");
    if (cat && ["all", "combined", "jobs", "resdex", "seats", "ai", "standalone", "custom"].includes(cat)) {
      setActiveCategory(cat);
    }
    if (location.hash) {
      setTimeout(() => {
        const el = document.querySelector(location.hash);
        if (el) el.scrollIntoView({ behavior: "smooth" });
      }, 400);
    }
  }, [searchParams, location.hash]);

  // Resolve dynamic Products from catalog
  const smbProduct = products.find((p) => p.code === "SMB_JOB") || {
    name: "SMB Job",
    code: "SMB_JOB",
    category: "JOB_POSTING",
    defaultPrice: 100,
    validity: 30,
    unit: "Job",
    description: "Standard cost-effective job posting for small and medium businesses.",
  };

  const hotProduct = products.find((p) => p.code === "HOT_VACANCY") || {
    name: "Hot Vacancy",
    code: "HOT_VACANCY",
    category: "JOB_POSTING",
    defaultPrice: 250,
    validity: 30,
    unit: "Job",
    description: "High-visibility premium job posting with branding and top placement.",
  };

  const internshipProduct = products.find((p) => p.code === "INTERNSHIP_JOB") || {
    name: "Internship Job",
    code: "INTERNSHIP_JOB",
    category: "JOB_POSTING",
    defaultPrice: 50,
    validity: 30,
    unit: "Job",
    description: "Targeted job posting specifically for internships and college students.",
  };

  const resdexProduct = products.find((p) => p.code === "RESDEX") || {
    name: "ResDex Resume Search",
    code: "RESDEX",
    category: "RESUME_SEARCH",
    defaultPrice: 100,
    validity: 30,
    unit: "Resume View",
    description: "Search verified candidates and view complete contact information, phone, email, and CV download.",
  };

  const aiProduct = products.find((p) => p.code === "AI_CREDIT") || {
    name: "AI Recruitment Credits",
    code: "AI_CREDIT",
    category: "AI",
    defaultPrice: 10,
    validity: 30,
    unit: "AI Use",
    description: "Company-wide AI credits for automated job descriptions, screening questions, and candidate matching.",
  };

  const jobSeatProduct = products.find((p) => p.code === "JOB_POSTING_SEAT") || {
    name: "Job Posting User Seat",
    code: "JOB_POSTING_SEAT",
    category: "USER_SEATS",
    defaultPrice: 1000,
    validity: 30,
    unit: "Seat",
    description: "Dedicated recruiter login seat with permission to draft, publish, and manage job posts.",
  };

  const resdexSeatProduct = products.find((p) => p.code === "RESDEX_SEAT") || {
    name: "ResDex User Seat",
    code: "RESDEX_SEAT",
    category: "USER_SEATS",
    defaultPrice: 1000,
    validity: 30,
    unit: "Seat",
    description: "Dedicated recruiter seat with license to search candidates, unlock CVs, and contact applicants.",
  };

  const getEmployerUser = () => {
    try {
      const stored = localStorage.getItem("employerUser");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && (parsed._id || parsed.id || parsed.email || parsed.companyId || parsed.company?._id || parsed.userId)) {
          return parsed;
        }
      }
    } catch (_) {}
    try {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        if (parsed && (parsed._id || parsed.id || parsed.email)) {
          return parsed;
        }
      }
    } catch (_) {}
    if (user && (user._id || user.id || user.email)) {
      return user;
    }
    if (companyEntitlements && (companyEntitlements.companyId || companyEntitlements.activePlan || companyEntitlements.products)) {
      return {
        _id: companyEntitlements.companyId || "employer-session",
        companyId: companyEntitlements.companyId,
        companyName: companyEntitlements.activePlan?.companyName || "Employer",
        role: "EMPLOYER",
      };
    }
    return null;
  };

  const [authRefresh, setAuthRefresh] = useState(0);
  const employerUser = getEmployerUser();
  const isLoggedIn = Boolean(employerUser);
  const activePlan = companyEntitlements?.activePlan;
  const hasActivePlan = Boolean(activePlan && activePlan.daysRemaining > 0);
  const activePlanDays = activePlan?.daysRemaining || 0;
  const activePlanName = activePlan?.planName || "active plan";

  // Dynamic Duration Helpers:
  // When user is NOT logged in: No fixed date/days is shown (synced with active subscription plan).
  // When user IS logged in:
  //   - If has active plan: Shows real remaining days synced with active plan
  //   - If no active plan: Shows standard validity
  const getAddonValidityTag = (defaultDays = 30, suffix = "Live Duration") => {
    if (!isLoggedIn) {
      return "Plan Synced Duration";
    }
    if (hasActivePlan) {
      return `${activePlanDays} Days (Plan Synced)`;
    }
    return `${defaultDays} Days ${suffix}`;
  };

  const getAddonValidityNote = (defaultDays = 30) => {
    if (!isLoggedIn) {
      return "Duration synced with active plan";
    }
    if (hasActivePlan) {
      return `Valid for ${activePlanDays} days (Synced with ${activePlanName})`;
    }
    return `Valid for ${defaultDays} days`;
  };

  const getJobLiveText = () => {
    if (!isLoggedIn) {
      return "Synced with active plan";
    }
    if (hasActivePlan) {
      return `${activePlanDays} Days Live • Plan Synced`;
    }
    return "30 Days Live";
  };

  // Open Checkout for a Plan, Standalone Offer, or Dynamic Product
  const handleInitiatePurchase = (item, type = "PLAN") => {
    setPaymentError("");
    const purchaseItem = { ...item, itemType: type };

    // Check employer authentication immediately upon clicking the Buy button from any card
    const employerUser = getEmployerUser();
    if (!employerUser) {
      // User is not logged in: queue opening this purchase modal and open login modal
      pendingItemRef.current = purchaseItem;
      setSelectedItemForPurchase(purchaseItem);
      pendingPaymentRef.current = () => {
        setSelectedItemForPurchase(purchaseItem);
        setIsPurchaseModalOpen(true);
      };
      setIsLoginGateOpen(true);
      return;
    }

    // User is logged in: directly show the purchase modal, do NOT open login modal
    pendingItemRef.current = null;
    pendingPaymentRef.current = null;
    setSelectedItemForPurchase(purchaseItem);
    setIsPurchaseModalOpen(true);
  };

  // Confirm and Execute Payment — Production-grade 3-step flow:
  // 1. Create Razorpay order on server (get real orderId)
  // 2. Open Razorpay checkout with that orderId
  // 3. On success, call /confirm-payment to verify HMAC + activate entitlement atomically
  const handleExecutePayment = async () => {
    // Gate: verify employer session
    const employerUser = getEmployerUser();
    if (!employerUser) {
      pendingItemRef.current = selectedItemForPurchase;
      pendingPaymentRef.current = handleExecutePayment;
      setIsLoginGateOpen(true);
      return;
    }

    if (!selectedItemForPurchase) return;

    const isPlan = selectedItemForPurchase.itemType === "PLAN";
    const isDirectProduct = selectedItemForPurchase.itemType === "PRODUCT";
    const ver = selectedItemForPurchase.activeVersion || selectedItemForPurchase;

    // Compute base + GST amount using pricing configured at product/plan creation (current price + GST is total)
    const pricing = getItemPricing(selectedItemForPurchase);
    const total = pricing.total; // in INR (not paise)

    setPaymentLoading(true);
    setPaymentError("");

    // ── FREE plan path: skip Razorpay entirely ───────────────────────────────
    if (total === 0) {
      try {
        const purchaseRes = await commercialService.purchasePlan({
          planId: selectedItemForPurchase._id,
          versionId: ver._id,
          paymentMethod: "FREE",
          transactionId: `FREE-${Date.now()}`,
        });
        setPurchaseSuccessData({ item: selectedItemForPurchase, isPlan: true, details: purchaseRes });
        setIsPurchaseModalOpen(false);
        setIsSuccessModalOpen(true);
        loadCommercialData();
      } catch (err) {
        setPaymentError(err?.response?.data?.message || err.message || "Plan activation failed");
      } finally {
        setPaymentLoading(false);
      }
      return;
    }

    // ── Paid path: Razorpay 3-step flow ─────────────────────────────────────
    try {
      // Resolve company planType: "FREE", "SMB", "CORPORATE", "ENTERPRISE", "CUSTOM"
      const resolvedCompanyPlanType = isPlan
        ? (selectedItemForPurchase.planType || "SMB")
        : "CUSTOM";

      // Step 1 — Create a real Razorpay order on the server
      const orderData = await commercialService.createOrder({
        amount: total, // server multiplies by 100 for paise
        label: selectedItemForPurchase.name,
        planId: isPlan ? selectedItemForPurchase._id : undefined,
        versionId: isPlan ? ver._id : undefined,
        planType: resolvedCompanyPlanType,
        offerId: (!isPlan && !isDirectProduct) ? selectedItemForPurchase._id : undefined,
        productId: isDirectProduct ? selectedItemForPurchase._id : undefined,
        quantity: selectedItemForPurchase.quantity || 1,
        validity: isPlan
          ? (ver.validity || 90)
          : (selectedItemForPurchase.category === "AI" || selectedItemForPurchase.code?.includes("AI"))
          ? 30
          : (hasActivePlan ? activePlanDays : (selectedItemForPurchase.validity || 30)),
      });

      if (!orderData?.orderId) {
        throw new Error("Failed to create payment order. Please try again.");
      }

      // Step 2 — Open Razorpay checkout with real orderId
      // skipAutoConfirm=true: onSuccess receives raw Razorpay response for our own verification
      await paymentService.openCheckout({
        order: {
          orderId:    orderData.orderId,
          amount:     orderData.amount,      // paise from server
          currency:   orderData.currency || "INR",
          planLabel:  orderData.planLabel,
        },
        keyId: orderData.keyId,
        user: employerUser,
        skipAutoConfirm: true,
        onSuccess: async (razorpayResponse) => {
          // Step 3 — Verify HMAC + activate entitlement in one server call
          try {
            const purchaseRes = await commercialService.confirmPayment({
              razorpayOrderId:   razorpayResponse.razorpay_order_id,
              razorpayPaymentId: razorpayResponse.razorpay_payment_id,
              razorpaySignature: razorpayResponse.razorpay_signature,
              planId:      isPlan ? selectedItemForPurchase._id : undefined,
              versionId:   isPlan ? ver._id : undefined,
              planType:    resolvedCompanyPlanType,
              offerId:     (!isPlan && !isDirectProduct) ? selectedItemForPurchase._id : undefined,
              productId:   isDirectProduct ? selectedItemForPurchase._id : undefined,
              quantity:    selectedItemForPurchase.quantity || 1,
            });

            setPurchaseSuccessData({
              item: selectedItemForPurchase,
              isPlan,
              details: purchaseRes,
              razorpayPaymentId: razorpayResponse.razorpay_payment_id,
            });
            setIsPurchaseModalOpen(false);
            setIsSuccessModalOpen(true);
            loadCommercialData();
          } catch (apiErr) {
            // Payment was captured but entitlement activation failed
            // Show a specific message — support can manually activate
            setPaymentError(
              `Payment received but activation failed: ${apiErr?.response?.data?.message || apiErr.message}. ` +
              `Please contact support with Payment ID: ${razorpayResponse.razorpay_payment_id}`
            );
          } finally {
            setPaymentLoading(false);
          }
        },
        onError: (msg) => {
          // User cancelled or gateway error — no charge was made
          if (msg && msg !== "Payment cancelled") {
            setPaymentError(msg);
          }
          setPaymentLoading(false);
        },
      });
    } catch (err) {
      setPaymentError(err?.response?.data?.message || err.message || "Failed to initiate payment");
      setPaymentLoading(false);
    }
  };

  const handleSalesSubmit = async (e) => {
    e.preventDefault();
    if (!salesForm.isVerified) {
      alert("Please confirm the verification checkbox.");
      return;
    }
    setSalesSubmitted(true);
    try {
      if (commercialService.submitSalesInquiry) {
        await commercialService.submitSalesInquiry({
          fullName: salesForm.fullName,
          mobileNumber: salesForm.mobileNumber,
          companyName: salesForm.companyName,
          hiringFor: salesForm.hiringFor,
          employeeCount: salesForm.employeeRange,
          designation: salesForm.designation,
          workEmail: salesForm.workEmail,
          city: salesForm.city,
          notes: salesForm.notes,
          extraFields: (salesForm.extraFields || []).filter((f) => f.label && f.value),
        });
      }
      setSalesSuccess(true);
      setTimeout(() => {
        setIsSalesModalOpen(false);
        setSalesSubmitted(false);
        setSalesSuccess(false);
        setSalesForm({
          fullName: "",
          mobileNumber: "",
          companyName: "",
          hiringFor: "your company",
          employeeRange: "",
          designation: "",
          workEmail: "",
          city: "",
          notes: "",
          isVerified: false,
          extraFields: [],
        });
        setCaptchaLoading(false);
        setShowExtraFields(false);
      }, 2000);
    } catch (err) {
      console.warn("Sales inquiry submit notice:", err);
      setSalesSuccess(true);
      setTimeout(() => {
        setIsSalesModalOpen(false);
        setSalesSubmitted(false);
        setSalesSuccess(false);
        setCaptchaLoading(false);
      }, 1800);
    }
  };

  const handleCaptchaClick = () => {
    if (captchaLoading) return;
    if (salesForm.isVerified) {
      // Allow unchecking
      setSalesForm((prev) => ({ ...prev, isVerified: false }));
      return;
    }
    // Authentic buffering animation (1.2s spinner before green check)
    setCaptchaLoading(true);
    setTimeout(() => {
      setCaptchaLoading(false);
      setSalesForm((prev) => ({ ...prev, isVerified: true }));
    }, 1250);
  };

  const handleAddExtraField = () => {
    setShowExtraFields(true);
    setSalesForm((prev) => ({
      ...prev,
      extraFields: [...prev.extraFields, { id: Date.now(), label: "", value: "" }],
    }));
  };

  const handleRemoveExtraField = (id) => {
    setSalesForm((prev) => ({
      ...prev,
      extraFields: prev.extraFields.filter((f) => f.id !== id),
    }));
  };

  const handleExtraFieldChange = (id, key, val) => {
    setSalesForm((prev) => ({
      ...prev,
      extraFields: prev.extraFields.map((f) => (f.id === id ? { ...f, [key]: val } : f)),
    }));
  };

  const scrollY = useScrollY();
  const [heroRef, heroVisible] = useInView(0.05);

  // Group standalone offers by category (ResDex and AI)
  const resdexOffers = offers.filter((o) => o.product?.category === "RESUME_SEARCH");
  const aiOffers = offers.filter((o) => o.product?.category === "AI");

  // Called by EmployerLoginModal after a successful employer login
  const handleLoginSuccess = () => {
    setIsLoginGateOpen(false);
    setAuthRefresh((prev) => prev + 1);
    loadCommercialData();

    // Directly open the purchase modal with the pending purchase item
    const targetItem = pendingItemRef.current || selectedItemForPurchase;
    const resume = pendingPaymentRef.current;
    pendingItemRef.current = null;
    pendingPaymentRef.current = null;

    if (targetItem) {
      setSelectedItemForPurchase(targetItem);
      setIsPurchaseModalOpen(true);
    } else if (resume) {
      setTimeout(() => resume(), 120);
    }
  };

  return (
    <div className="bo-page-wrapper">
      {/* Navigation Header */}
      <LandingEmployeeHeader />

      {/* Main Container */}
      <div className="bo-page-container">
        {/* Page Hero Header */}
        <div ref={heroRef} className="bo-hero-section">
          <div className="bo-hero-badge">
            <FiZap className="bo-hero-badge-icon" /> Commercial Recruitment Marketplace
          </div>
          <h1 className="bo-hero-title bo-title-font">
            Choose the right hiring solution for your team
          </h1>
          <p className="bo-hero-desc">
            Post jobs, discover verified candidates, search the Naukri-grade resume database, and accelerate your recruitment with flexible plans built for your scale.
          </p>
        </div>

        {/* Current Subscription Awareness Banner */}
        {companyEntitlements?.activePlan && (
          <div className="bo-active-banner">
            <div className="bo-active-banner-inner">
              <div className="bo-active-banner-left">
                <div className="bo-active-icon-box">
                  <FiAward style={{ width: "24px", height: "24px" }} />
                </div>
                <div>
                  <div className="bo-active-status-row">
                    <span className="bo-active-status-tag">Active Subscription</span>
                    <span className="bo-active-pill">Active</span>
                  </div>
                  <h3 className="bo-active-plan-title">
                    {companyEntitlements.activePlan.planName}
                    <span className="bo-active-validity-note">
                      (Valid until {new Date(companyEntitlements.activePlan.endDate).toLocaleDateString()} • {companyEntitlements.activePlan.daysRemaining} days left)
                    </span>
                  </h3>
                </div>
              </div>

              {/* Balances pills */}
              <div className="bo-active-pills-row">
                {(companyEntitlements.products || []).slice(0, 4).map((p) => (
                  <div key={p.code} className="bo-balance-pill">
                    <span className="bo-balance-pill-label">{p.name}: </span>
                    <span className="bo-balance-pill-value">{p.available} remaining</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Category Navigation Bar */}
        <div className="bo-category-nav">
          <button
            onClick={() => setActiveCategory("all")}
            className={`bo-cat-tab ${activeCategory === "all" ? "active" : ""}`}
          >
            All Solutions
          </button>
          <button
            onClick={() => setActiveCategory("combined")}
            className={`bo-cat-tab ${activeCategory === "combined" ? "active" : ""}`}
          >
            Combined Plans
          </button>
          <button
            onClick={() => setActiveCategory("jobs")}
            className={`bo-cat-tab ${activeCategory === "jobs" ? "active" : ""}`}
          >
            Job Posting
          </button>
          <button
            onClick={() => setActiveCategory("resdex")}
            className={`bo-cat-tab ${activeCategory === "resdex" ? "active" : ""}`}
          >
            Resume Database / ResDex
          </button>
          <button
            onClick={() => setActiveCategory("seats")}
            className={`bo-cat-tab ${activeCategory === "seats" ? "active" : ""}`}
          >
            User Seats
          </button>
          <button
            onClick={() => setActiveCategory("ai")}
            className={`bo-cat-tab ${activeCategory === "ai" ? "active" : ""}`}
          >
            AI Credits
          </button>
          <button
            onClick={() => setActiveCategory("custom")}
            className={`bo-cat-tab ${activeCategory === "custom" ? "active" : ""}`}
          >
            Custom / Enterprise
          </button>
        </div>

        {/* Section 1: Combined Hiring Plans */}
        {(activeCategory === "all" || activeCategory === "combined") && (
          <div id="combined-plans" className="bo-section">
            <div className="bo-section-header">
              <h2 className="bo-section-title bo-title-font">Combined Hiring Plans</h2>
              <p className="bo-section-subtitle">
                All-in-one commercial packages bundling job postings, resume database access, and AI credits.
              </p>
            </div>

            <div className="bo-grid-3">
              {plans.map((plan) => {
                const ver = plan.activeVersion || {};
                const isFeatured = plan.featured || plan.code === "CORPORATE";
                const planPricing = getItemPricing(plan);

                return (
                  <div
                    key={plan._id}
                    className={`bo-card ${isFeatured ? "featured" : ""}`}
                  >
                    {isFeatured && (
                      <div className="bo-card-ribbon">
                        ★ Recommended Plan
                      </div>
                    )}

                    <div className="bo-card-top-row">
                      <span className="bo-card-sku-tag bo-card-sku-indigo">
                        {plan.planType || "COMBINED"} PLAN
                      </span>
                      <span className="bo-card-validity-tag">
                        {ver.validity || 90} Days Validity
                      </span>
                    </div>

                    <h3 className="bo-card-title bo-title-font">{plan.name}</h3>
                    <div
                      className="bo-card-subtitle"
                      style={{
                        color: isFeatured ? "#b45309" : "#4338ca",
                      }}
                    >
                      {plan.subtitle || (
                        plan.code === "SMB" || plan.name?.toLowerCase().includes("smb")
                          ? "Cost-effective hiring for small & medium businesses"
                          : plan.code === "CORPORATE" || plan.name?.toLowerCase().includes("corporate")
                          ? "Priority top placement & maximum candidate reach"
                          : "All-in-one comprehensive recruitment solution"
                      )}
                    </div>

                    <p className="bo-card-desc">
                      {plan.description || "Standard verified job postings with instant reach and candidate application delivery."}
                    </p>

                    {/* Price Block */}
                    <div className="bo-price-block">
                      <div className="bo-price-row">
                        <div>
                          <span className="bo-price-val bo-title-font">
                            {planPricing.total === 0 ? "Free" : formatCurrency(planPricing.total)}
                          </span>
                          <span className="bo-price-tax-note" style={{ display: "block" }}>
                            Valid for {ver.validity || 90} days
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Key Inclusions Features Checklist */}
                    <div className="bo-features-container">
                      {(ver.items || []).map((it, idx) => (
                        <div key={idx} className="bo-feature-item">
                          <FiCheck className="bo-check-icon" />
                          <span>
                            <strong>{it.quantity} {it.unit}{it.quantity > 1 ? "s" : ""}</strong> {it.productName}
                          </span>
                        </div>
                      ))}
                      <div className="bo-feature-item">
                        <FiCheck className="bo-check-icon" />
                        <span>Centralized master invoicing & GST tax credit</span>
                      </div>
                      <div className="bo-feature-item">
                        <FiCheck className="bo-check-icon" />
                        <span>Synchronized quota validity across all products</span>
                      </div>
                    </div>

                    {/* Action Buttons: View Details Modal & Buy */}
                    <div className="bo-card-actions-stack" style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: "10px" }}>
                      <button
                        type="button"
                        onClick={() => setDetailPlan(plan)}
                        className="bo-btn-view-details"
                      >
                        <FiEye style={{ width: "16px", height: "16px" }} /> View Full Plan Details
                      </button>
                      <button
                        onClick={() => handleInitiatePurchase(plan, "PLAN")}
                        className="bo-btn-buy"
                      >
                        Buy Plan Now <FiArrowRight style={{ width: "16px", height: "16px" }} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Section 2: Job Posting Plans (Two Dedicated Cards with Dynamic Quantity Stepper) */}
        {(activeCategory === "all" || activeCategory === "jobs") && (
          <div id="job-posting" className="bo-section">
            <div className="bo-section-header">
              <h2 className="bo-section-title bo-title-font">Job Posting</h2>
              <p className="bo-section-subtitle">
                Select your required job posting volume with flexible per-post pricing. Use the counter below to select your desired quantity.
              </p>
            </div>

            <div className="bo-grid-3">
              {/* Card 1: SMB Job Card */}
              <div className="bo-card">
                <div className="bo-card-top-row">
                  <span className="bo-card-sku-tag">SMB JOB</span>
                  <span className="bo-card-validity-tag">
                    {getAddonValidityTag(30, "Live Duration")}
                  </span>
                </div>

                <h3 className="bo-card-title bo-title-font">{smbProduct.name}</h3>
                <div className="bo-card-subtitle">
                  Cost-effective hiring for small & medium businesses
                </div>

                <p className="bo-card-desc">
                  {smbProduct.description || "Standard verified job postings with instant reach and candidate application delivery."}
                </p>

                {(() => {
                  const unitPrice = smbProduct.defaultPrice || 100;
                  const unitPricing = getProductPricing(smbProduct, 1);
                  const stepperPricing = getProductPricing(smbProduct, smbJobCount);
                  return (
                    <>
                      <div className="bo-price-block">
                        <div className="bo-price-row">
                          <div>
                            <span className="bo-price-val bo-title-font">
                              {formatCurrency(unitPricing.total)}
                            </span>
                            <span style={{ fontSize: "12px", color: "#64748b", fontWeight: 700, marginLeft: "4px" }}>
                              / job post
                            </span>
                            <span className="bo-price-tax-note" style={{ display: "block" }}>
                              {getAddonValidityNote(30)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="bo-features-container">
                        <div className="bo-feature-item">
                          <FiCheck className="bo-check-icon" />
                          <span>Instant live publishing on candidate job search ({getJobLiveText()})</span>
                        </div>
                        <div className="bo-feature-item">
                          <FiCheck className="bo-check-icon" />
                          <span>Candidate applications accessible for 90 days</span>
                        </div>
                        <div className="bo-feature-item">
                          <FiCheck className="bo-check-icon" />
                          <span>1 City location included</span>
                        </div>
                        <div className="bo-feature-item">
                          <FiCheck className="bo-check-icon" />
                          <span>Direct recruiter notifications & application tracking</span>
                        </div>
                        <div className="bo-feature-item">
                          <FiCheck className="bo-check-icon" />
                          <span>Screening questions & skill-match filters</span>
                        </div>
                      </div>

                      {/* Dynamic Stepper Counter */}
                      <div className="bo-stepper-container">
                        <div className="bo-stepper-header">
                          <span className="bo-stepper-label">Select Job Count:</span>
                          <div style={{ textAlign: "right" }}>
                            <span className="bo-stepper-subtotal-val bo-title-font">
                              {formatCurrency(stepperPricing.total)}
                            </span>
                            <span className="bo-stepper-subtotal-label">
                              Total for {smbJobCount} {smbJobCount > 1 ? "Jobs" : "Job"}
                            </span>
                          </div>
                        </div>

                        <div className="bo-stepper-controls">
                          <button
                            type="button"
                            disabled={smbJobCount <= 1}
                            onClick={() => setSmbJobCount((prev) => Math.max(1, prev - 1))}
                            className="bo-stepper-btn"
                            title="Decrease job count"
                          >
                            –
                          </button>
                          <div className="bo-stepper-display">
                            {smbJobCount} {smbJobCount > 1 ? "Jobs" : "Job"}
                          </div>
                          <button
                            type="button"
                            onClick={() => setSmbJobCount((prev) => prev + 1)}
                            className="bo-stepper-btn"
                            title="Increase job count"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      <button
                        onClick={() =>
                          handleInitiatePurchase(
                            {
                              ...smbProduct,
                              quantity: smbJobCount,
                              basePrice: stepperPricing.base,
                              discount: stepperPricing.discount,
                              price: stepperPricing.currentPrice,
                              unitPrice: unitPrice,
                              taxPercent: stepperPricing.taxPercent,
                              taxAmount: stepperPricing.taxAmount,
                              total: stepperPricing.total,
                              finalPrice: stepperPricing.total,
                              pricing: stepperPricing,
                              productName: smbProduct.name,
                              name: `${smbJobCount} ${smbJobCount > 1 ? "SMB Job Postings" : "SMB Job Posting"}`,
                            },
                            "PRODUCT"
                          )
                        }
                        className="bo-btn-buy"
                      >
                        Buy {smbJobCount} SMB {smbJobCount > 1 ? "Jobs" : "Job"} • Total {formatCurrency(stepperPricing.total)}{" "}
                        <FiArrowRight style={{ width: "16px", height: "16px" }} />
                      </button>
                    </>
                  );
                })()}
              </div>

              {/* Card 2: Hot Vacancy Card */}
              <div className="bo-card featured">
                <div className="bo-card-ribbon">
                  ★ High Reach & Priority
                </div>

                <div className="bo-card-top-row">
                  <span className="bo-card-sku-tag" style={{ background: "#fef3c7", color: "#b45309" }}>
                    HOT VACANCY
                  </span>
                  <span className="bo-card-validity-tag">
                    {getAddonValidityTag(30, "Live Duration")}
                  </span>
                </div>

                <h3 className="bo-card-title bo-title-font">{hotProduct.name}</h3>
                <div className="bo-card-subtitle" style={{ color: "#b45309" }}>
                  Priority top placement & maximum candidate reach
                </div>

                <p className="bo-card-desc">
                  {hotProduct.description || "High-visibility premium job posting with branding and top search placement."}
                </p>

                {(() => {
                  const unitPrice = hotProduct.defaultPrice || 250;
                  const unitPricing = getProductPricing(hotProduct, 1);
                  const stepperPricing = getProductPricing(hotProduct, hotJobCount);
                  return (
                    <>
                      <div className="bo-price-block">
                        <div className="bo-price-row">
                          <div>
                            <span className="bo-price-val bo-title-font">
                              {formatCurrency(unitPricing.total)}
                            </span>
                            <span style={{ fontSize: "12px", color: "#64748b", fontWeight: 700, marginLeft: "4px" }}>
                              / job post
                            </span>
                            <span className="bo-price-tax-note" style={{ display: "block" }}>
                              {getAddonValidityNote(30)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="bo-features-container">
                        <div className="bo-feature-item">
                          <FiCheck className="bo-check-icon" />
                          <span><strong>Top Search Placement</strong> on candidate listings ({getJobLiveText()})</span>
                        </div>
                        <div className="bo-feature-item">
                          <FiCheck className="bo-check-icon" />
                          <span><strong>5x Candidate Reach</strong> compared to standard posts</span>
                        </div>
                        <div className="bo-feature-item">
                          <FiCheck className="bo-check-icon" />
                          <span>Up to 3 Cities listing per vacancy</span>
                        </div>
                        <div className="bo-feature-item">
                          <FiCheck className="bo-check-icon" />
                          <span>Company Logo & prominent branding badge</span>
                        </div>
                        <div className="bo-feature-item">
                          <FiCheck className="bo-check-icon" />
                          <span>Automated Push Alerts sent to matching candidates</span>
                        </div>
                        <div className="bo-feature-item">
                          <FiCheck className="bo-check-icon" />
                          <span>Applications valid & accessible for 90 days</span>
                        </div>
                      </div>

                      {/* Dynamic Stepper Counter */}
                      <div className="bo-stepper-container">
                        <div className="bo-stepper-header">
                          <span className="bo-stepper-label">Select Job Count:</span>
                          <div style={{ textAlign: "right" }}>
                            <span className="bo-stepper-subtotal-val bo-title-font">
                              {formatCurrency(stepperPricing.total)}
                            </span>
                            <span className="bo-stepper-subtotal-label">
                              Total for {hotJobCount} {hotJobCount > 1 ? "Jobs" : "Job"}
                            </span>
                          </div>
                        </div>

                        <div className="bo-stepper-controls">
                          <button
                            type="button"
                            disabled={hotJobCount <= 1}
                            onClick={() => setHotJobCount((prev) => Math.max(1, prev - 1))}
                            className="bo-stepper-btn"
                            title="Decrease job count"
                          >
                            –
                          </button>
                          <div className="bo-stepper-display">
                            {hotJobCount} {hotJobCount > 1 ? "Jobs" : "Job"}
                          </div>
                          <button
                            type="button"
                            onClick={() => setHotJobCount((prev) => prev + 1)}
                            className="bo-stepper-btn"
                            title="Increase job count"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      <button
                        onClick={() =>
                          handleInitiatePurchase(
                            {
                              ...hotProduct,
                              quantity: hotJobCount,
                              basePrice: stepperPricing.base,
                              discount: stepperPricing.discount,
                              price: stepperPricing.currentPrice,
                              unitPrice: unitPrice,
                              taxPercent: stepperPricing.taxPercent,
                              taxAmount: stepperPricing.taxAmount,
                              total: stepperPricing.total,
                              finalPrice: stepperPricing.total,
                              pricing: stepperPricing,
                              productName: hotProduct.name,
                              name: `${hotJobCount} ${hotJobCount > 1 ? "Hot Vacancies" : "Hot Vacancy"}`,
                            },
                            "PRODUCT"
                          )
                        }
                        className="bo-btn-buy"
                      >
                        Buy {hotJobCount} Hot {hotJobCount > 1 ? "Vacancies" : "Vacancy"} • Total {formatCurrency(stepperPricing.total)}{" "}
                        <FiArrowRight style={{ width: "16px", height: "16px" }} />
                      </button>
                    </>
                  );
                })()}
              </div>

              {/* Card 3: Internship Job Card */}
              <div className="bo-card">
                <div className="bo-card-top-row">
                  <span className="bo-card-sku-tag" style={{ background: "#ecfdf5", color: "#047857" }}>
                    INTERNSHIP
                  </span>
                  <span className="bo-card-validity-tag">
                    {getAddonValidityTag(30, "Live Duration")}
                  </span>
                </div>

                <h3 className="bo-card-title bo-title-font">{internshipProduct.name}</h3>
                <div className="bo-card-subtitle" style={{ color: "#047857" }}>
                  Targeted hiring for college students & freshers
                </div>

                <p className="bo-card-desc">
                  {internshipProduct.description || "Targeted verified job postings specifically designed for internships and early-career talent."}
                </p>

                {(() => {
                  const unitPrice = internshipProduct.defaultPrice || 50;
                  const unitPricing = getProductPricing(internshipProduct, 1);
                  const stepperPricing = getProductPricing(internshipProduct, internshipJobCount);
                  return (
                    <>
                      <div className="bo-price-block">
                        <div className="bo-price-row">
                          <div>
                            <span className="bo-price-val bo-title-font">
                              {formatCurrency(unitPricing.total)}
                            </span>
                            <span style={{ fontSize: "12px", color: "#64748b", fontWeight: 700, marginLeft: "4px" }}>
                              / internship post
                            </span>
                            <span className="bo-price-tax-note" style={{ display: "block" }}>
                              {getAddonValidityNote(30)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="bo-features-container">
                        <div className="bo-feature-item">
                          <FiCheck className="bo-check-icon" />
                          <span>Dedicated student & college graduate reach ({getJobLiveText()})</span>
                        </div>
                        <div className="bo-feature-item">
                          <FiCheck className="bo-check-icon" />
                          <span>Configurable stipend, duration & start date filters</span>
                        </div>
                        <div className="bo-feature-item">
                          <FiCheck className="bo-check-icon" />
                          <span>Candidate applications accessible for 90 days</span>
                        </div>
                        <div className="bo-feature-item">
                          <FiCheck className="bo-check-icon" />
                          <span>Screening questions & automated candidate matching</span>
                        </div>
                      </div>

                      {/* Dynamic Stepper Counter */}
                      <div className="bo-stepper-container">
                        <div className="bo-stepper-header">
                          <span className="bo-stepper-label">Select Count:</span>
                          <div style={{ textAlign: "right" }}>
                            <span className="bo-stepper-subtotal-val bo-title-font">
                              {formatCurrency(stepperPricing.total)}
                            </span>
                            <span className="bo-stepper-subtotal-label">
                              Total for {internshipJobCount} {internshipJobCount > 1 ? "Posts" : "Post"}
                            </span>
                          </div>
                        </div>

                        <div className="bo-stepper-controls">
                          <button
                            type="button"
                            disabled={internshipJobCount <= 1}
                            onClick={() => setInternshipJobCount((prev) => Math.max(1, prev - 1))}
                            className="bo-stepper-btn"
                            title="Decrease internship count"
                          >
                            –
                          </button>
                          <div className="bo-stepper-display">
                            {internshipJobCount} {internshipJobCount > 1 ? "Internships" : "Internship"}
                          </div>
                          <button
                            type="button"
                            onClick={() => setInternshipJobCount((prev) => prev + 1)}
                            className="bo-stepper-btn"
                            title="Increase internship count"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      <button
                        onClick={() =>
                          handleInitiatePurchase(
                            {
                              ...internshipProduct,
                              quantity: internshipJobCount,
                              basePrice: stepperPricing.base,
                              discount: stepperPricing.discount,
                              price: stepperPricing.currentPrice,
                              unitPrice: unitPrice,
                              taxPercent: stepperPricing.taxPercent,
                              taxAmount: stepperPricing.taxAmount,
                              total: stepperPricing.total,
                              finalPrice: stepperPricing.total,
                              pricing: stepperPricing,
                              productName: internshipProduct.name,
                              name: `${internshipJobCount} ${internshipJobCount > 1 ? "Internship Postings" : "Internship Posting"}`,
                            },
                            "PRODUCT"
                          )
                        }
                        className="bo-btn-buy"
                      >
                        Buy {internshipJobCount} {internshipJobCount > 1 ? "Internships" : "Internship"} • Total {formatCurrency(stepperPricing.total)}{" "}
                        <FiArrowRight style={{ width: "16px", height: "16px" }} />
                      </button>
                    </>
                  );
                })()}
              </div>
            </div>
          </div>
        )}

        {/* Section 3: ResDex / Resume Database Plans */}
        {/* Section 3: ResDex / Resume Database Plans */}
        {(activeCategory === "all" || activeCategory === "resdex") && (
          <div id="resume-database" className="bo-section">
            <div className="bo-section-header">
              <span className="bo-section-tag">Candidate Database</span>
              <h2 className="bo-section-title bo-title-font" style={{ marginTop: "8px" }}>
                Resume Database (ResDex) Packs
              </h2>
              <p className="bo-section-subtitle">
                Direct access to millions of verified candidates with candidate phone, email, and CV download.
              </p>
            </div>

            <div className="bo-grid-3">
              {/* Existing standalone offers if any */}
              {resdexOffers.map((offer) => {
                const offerPricing = getItemPricing(offer);
                return (
                  <div key={offer._id} className="bo-card">
                    <div className="bo-card-top-row">
                      <span className="bo-card-sku-tag bo-card-sku-cyan">RESDEX</span>
                      <span className="bo-card-validity-tag">{getAddonValidityTag(offer.validity || 30, "Validity")}</span>
                    </div>

                    <h3 className="bo-card-title bo-title-font">{offer.name}</h3>
                    <div className="bo-card-subtitle">
                      {offer.quantity} Candidate Resume Views
                    </div>

                    <p className="bo-card-desc">
                      {offer.description || "Search verified candidates and view complete contact information."}
                    </p>

                    <div className="bo-price-block">
                      <span className="bo-price-val bo-title-font">
                        {formatCurrency(offerPricing.total)}
                      </span>
                      <span className="bo-price-tax-note" style={{ display: "block" }}>
                        {getAddonValidityNote(offer.validity || 30)}
                      </span>
                    </div>

                    <div className="bo-features-container">
                      <div className="bo-feature-item">
                        <FiCheck className="bo-check-icon" />
                        <span>Full Candidate Contact Access (Phone & Email)</span>
                      </div>
                      <div className="bo-feature-item">
                        <FiCheck className="bo-check-icon" />
                        <span>Advanced Skills, Location & Experience Filters</span>
                      </div>
                      <div className="bo-feature-item">
                        <FiCheck className="bo-check-icon" />
                        <span>Direct PDF Resume Downloads</span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleInitiatePurchase({ ...offer, pricing: offerPricing }, "STANDALONE")}
                      className="bo-btn-buy"
                    >
                      Buy Resume Credits • Total {formatCurrency(offerPricing.total)}{" "}
                      <FiArrowRight style={{ width: "16px", height: "16px" }} />
                    </button>
                  </div>
                );
              })}

              {/* Standard ResDex Product Card 1: 25 Views */}
              {(() => {
                const r25Pricing = getProductPricing(resdexProduct, 25);
                return (
                  <div className="bo-card">
                    <div className="bo-card-top-row">
                      <span className="bo-card-sku-tag bo-card-sku-cyan">RESDEX 25</span>
                      <span className="bo-card-validity-tag">{getAddonValidityTag(resdexProduct.validity || 30, "Validity")}</span>
                    </div>

                    <h3 className="bo-card-title bo-title-font">Starter Resume Pack</h3>
                    <div className="bo-card-subtitle">25 Candidate Resume Views</div>

                    <p className="bo-card-desc">
                      Ideal for targeted single-role hiring with instant candidate phone & email unlock.
                    </p>

                    <div className="bo-price-block">
                      <span className="bo-price-val bo-title-font">
                        {formatCurrency(r25Pricing.total)}
                      </span>
                      <span className="bo-price-tax-note" style={{ display: "block" }}>
                        {getAddonValidityNote(resdexProduct.validity || 30)}
                      </span>
                    </div>

                    <div className="bo-features-container">
                      <div className="bo-feature-item">
                        <FiCheck className="bo-check-icon" />
                        <span>25 Verified Candidate Contact Unlocks</span>
                      </div>
                      <div className="bo-feature-item">
                        <FiCheck className="bo-check-icon" />
                        <span>Instant Candidate Phone & Email View</span>
                      </div>
                      <div className="bo-feature-item">
                        <FiCheck className="bo-check-icon" />
                        <span>Advanced Skills, Salary & Experience Filters</span>
                      </div>
                      <div className="bo-feature-item">
                        <FiCheck className="bo-check-icon" />
                        <span>Direct PDF Resume Downloads</span>
                      </div>
                    </div>

                    <button
                      onClick={() =>
                        handleInitiatePurchase(
                          {
                            ...resdexProduct,
                            quantity: 25,
                            basePrice: r25Pricing.base,
                            discount: r25Pricing.discount,
                            price: r25Pricing.currentPrice,
                            unitPrice: r25Pricing.unitPrice,
                            taxPercent: r25Pricing.taxPercent,
                            taxAmount: r25Pricing.taxAmount,
                            total: r25Pricing.total,
                            finalPrice: r25Pricing.total,
                            pricing: r25Pricing,
                            productName: resdexProduct.name,
                            name: "25 ResDex Resume Views",
                          },
                          "PRODUCT"
                        )
                      }
                      className="bo-btn-buy"
                    >
                      Buy 25 Resume Views • Total {formatCurrency(r25Pricing.total)}{" "}
                      <FiArrowRight style={{ width: "16px", height: "16px" }} />
                    </button>
                  </div>
                );
              })()}

              {/* Standard ResDex Product Card 2: 100 Views (Featured) */}
              {(() => {
                const r100Pricing = getProductPricing(resdexProduct, 100);
                return (
                  <div className="bo-card featured">
                    <div className="bo-card-ribbon">★ Most Popular Pack</div>

                    <div className="bo-card-top-row">
                      <span className="bo-card-sku-tag bo-card-sku-cyan">RESDEX 100</span>
                      <span className="bo-card-validity-tag">{getAddonValidityTag(90, "Validity")}</span>
                    </div>

                    <h3 className="bo-card-title bo-title-font">Professional Resume Pack</h3>
                    <div className="bo-card-subtitle">100 Candidate Resume Views</div>

                    <p className="bo-card-desc">
                      Best value for active recruitment teams looking for verified talent across India.
                    </p>

                    <div className="bo-price-block">
                      <span className="bo-price-val bo-title-font">
                        {formatCurrency(r100Pricing.total)}
                      </span>
                      <span className="bo-price-tax-note" style={{ display: "block" }}>
                        {getAddonValidityNote(90)}
                      </span>
                    </div>

                    <div className="bo-features-container">
                      <div className="bo-feature-item">
                        <FiCheck className="bo-check-icon" />
                        <span>100 Verified Candidate Contact Unlocks</span>
                      </div>
                      <div className="bo-feature-item">
                        <FiCheck className="bo-check-icon" />
                        <span>Instant Candidate Phone & Email View</span>
                      </div>
                      <div className="bo-feature-item">
                        <FiCheck className="bo-check-icon" />
                        <span>Advanced Skills, Notice Period & CTC Filters</span>
                      </div>
                      <div className="bo-feature-item">
                        <FiCheck className="bo-check-icon" />
                        <span>Candidate Requirement Folders & Notes</span>
                      </div>
                      <div className="bo-feature-item">
                        <FiCheck className="bo-check-icon" />
                        <span>
                          {!isLoggedIn
                            ? "Views validity synchronized with active plan"
                            : hasActivePlan
                            ? `Unused views expire in ${activePlanDays} days with active plan`
                            : "Unused views expire after 90 days"}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() =>
                        handleInitiatePurchase(
                          {
                            ...resdexProduct,
                            quantity: 100,
                            validity: 90,
                            basePrice: r100Pricing.base,
                            discount: r100Pricing.discount,
                            price: r100Pricing.currentPrice,
                            unitPrice: r100Pricing.unitPrice,
                            taxPercent: r100Pricing.taxPercent,
                            taxAmount: r100Pricing.taxAmount,
                            total: r100Pricing.total,
                            finalPrice: r100Pricing.total,
                            pricing: r100Pricing,
                            productName: resdexProduct.name,
                            name: "100 ResDex Resume Views",
                          },
                          "PRODUCT"
                        )
                      }
                      className="bo-btn-buy"
                    >
                      Buy 100 Resume Views • Total {formatCurrency(r100Pricing.total)}{" "}
                      <FiArrowRight style={{ width: "16px", height: "16px" }} />
                    </button>
                  </div>
                );
              })()}

              {/* Standard ResDex Product Card 3: Dynamic Views Stepper */}
              {(() => {
                const unitPrice = resdexProduct.defaultPrice || 100;
                const unitPricing = getProductPricing(resdexProduct, 1);
                const stepperPricing = getProductPricing(resdexProduct, resdexViewCount);
                return (
                  <div className="bo-card">
                    <div className="bo-card-top-row">
                      <span className="bo-card-sku-tag bo-card-sku-cyan">CUSTOM VIEWS</span>
                      <span className="bo-card-validity-tag">{getAddonValidityTag(resdexProduct.validity || 30, "Validity")}</span>
                    </div>

                    <h3 className="bo-card-title bo-title-font">Custom Volume Views</h3>
                    <div className="bo-card-subtitle">Select any desired view quantity</div>

                    <p className="bo-card-desc">
                      Need a custom number of resume views? Adjust the counter to meet your exact targets.
                    </p>

                    <div className="bo-price-block">
                      <div className="bo-price-row">
                        <div>
                          <span className="bo-price-val bo-title-font">
                            {formatCurrency(unitPricing.total)}
                          </span>
                          <span style={{ fontSize: "12px", color: "#64748b", fontWeight: 700, marginLeft: "4px" }}>
                            / resume view
                          </span>
                          <span className="bo-price-tax-note" style={{ display: "block" }}>
                            {getAddonValidityNote(resdexProduct.validity || 30)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="bo-features-container">
                      <div className="bo-feature-item">
                        <FiCheck className="bo-check-icon" />
                        <span>Direct Candidate Contact & CV Unlock</span>
                      </div>
                      <div className="bo-feature-item">
                        <FiCheck className="bo-check-icon" />
                        <span>Full Access to All Filter Capabilities</span>
                      </div>
                      <div className="bo-feature-item">
                        <FiCheck className="bo-check-icon" />
                        <span>Dedicated Recruiter Workspace & Notes</span>
                      </div>
                    </div>

                    {/* Dynamic Stepper Counter */}
                    <div className="bo-stepper-container">
                      <div className="bo-stepper-header">
                        <span className="bo-stepper-label">Select Views:</span>
                        <div style={{ textAlign: "right" }}>
                          <span className="bo-stepper-subtotal-val bo-title-font">
                            {formatCurrency(stepperPricing.total)}
                          </span>
                          <span className="bo-stepper-subtotal-label">
                            Total for {resdexViewCount} Views
                          </span>
                        </div>
                      </div>

                      <div className="bo-stepper-controls">
                        <button
                          type="button"
                          disabled={resdexViewCount <= 10}
                          onClick={() => setResdexViewCount((prev) => Math.max(10, prev - 15))}
                          className="bo-stepper-btn"
                          title="Decrease resume view count"
                        >
                          –
                        </button>
                        <div className="bo-stepper-display">
                          {resdexViewCount} Views
                        </div>
                        <button
                          type="button"
                          onClick={() => setResdexViewCount((prev) => prev + 15)}
                          className="bo-stepper-btn"
                          title="Increase resume view count"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <button
                      onClick={() =>
                        handleInitiatePurchase(
                          {
                            ...resdexProduct,
                            quantity: resdexViewCount,
                            basePrice: stepperPricing.base,
                            discount: stepperPricing.discount,
                            price: stepperPricing.currentPrice,
                            unitPrice: stepperPricing.unitPrice,
                            taxPercent: stepperPricing.taxPercent,
                            taxAmount: stepperPricing.taxAmount,
                            total: stepperPricing.total,
                            finalPrice: stepperPricing.total,
                            pricing: stepperPricing,
                            productName: resdexProduct.name,
                            name: `${resdexViewCount} ResDex Resume Views`,
                          },
                          "PRODUCT"
                        )
                      }
                      className="bo-btn-buy"
                    >
                      Buy {resdexViewCount} Resume Views • Total {formatCurrency(stepperPricing.total)}{" "}
                      <FiArrowRight style={{ width: "16px", height: "16px" }} />
                    </button>
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* Section 4: User Seats & Recruiter Licenses */}
        {(activeCategory === "all" || activeCategory === "seats") && (
          <div id="user-seats" className="bo-section">
            <div className="bo-section-header">
              <span className="bo-section-tag" style={{ backgroundColor: "#e0e7ff", color: "#3730a3" }}>
                Recruiter Collaboration
              </span>
              <h2 className="bo-section-title bo-title-font" style={{ marginTop: "8px" }}>
                Recruiter User Seats & Licenses
              </h2>
              <p className="bo-section-subtitle">
                Scale your hiring team with dedicated recruiter logins, independent access permissions, and secure IP/time restrictions.
              </p>
            </div>

            <div className="bo-grid-3">
              {/* Card 1: Job Posting User Seat */}
              <div className="bo-card">
                <div className="bo-card-top-row">
                  <span className="bo-card-sku-tag bo-card-sku-indigo">JOB POSTING SEAT</span>
                  <span className="bo-card-validity-tag">{getAddonValidityTag(jobSeatProduct.validity || 30, "Validity")}</span>
                </div>

                <h3 className="bo-card-title bo-title-font">{jobSeatProduct.name}</h3>
                <div className="bo-card-subtitle" style={{ color: "#3730a3" }}>
                  Dedicated sub-user seat for publishing & managing jobs
                </div>

                <p className="bo-card-desc">
                  {jobSeatProduct.description || "Dedicated recruiter login seat with permission to draft, publish, and manage job posts."}
                </p>

                {(() => {
                  const jobSeatUnitPrice = jobSeatProduct.defaultPrice || 1000;
                  const jobSeatUnitPricing = getProductPricing(jobSeatProduct, 1);
                  const jobSeatStepperPricing = getProductPricing(jobSeatProduct, jobSeatCount);
                  return (
                    <>
                      <div className="bo-price-block">
                        <div className="bo-price-row">
                          <div>
                            <span className="bo-price-val bo-title-font">
                              {formatCurrency(jobSeatUnitPricing.total)}
                            </span>
                            <span style={{ fontSize: "12px", color: "#64748b", fontWeight: 700, marginLeft: "4px" }}>
                              / user seat
                            </span>
                            <span className="bo-price-tax-note" style={{ display: "block" }}>
                              {getAddonValidityNote(jobSeatProduct.validity || 30)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="bo-features-container">
                        <div className="bo-feature-item">
                          <FiCheck className="bo-check-icon" />
                          <span>Independent Recruiter Sub-user Login Account</span>
                        </div>
                        <div className="bo-feature-item">
                          <FiCheck className="bo-check-icon" />
                          <span>Permission to Create, Edit & Publish Job Postings</span>
                        </div>
                        <div className="bo-feature-item">
                          <FiCheck className="bo-check-icon" />
                          <span>Full Access to Candidate Applications & Responses</span>
                        </div>
                        <div className="bo-feature-item">
                          <FiCheck className="bo-check-icon" />
                          <span>Direct Recruiter Notifications for New Applicants</span>
                        </div>
                        <div className="bo-feature-item">
                          <FiCheck className="bo-check-icon" />
                          <span>Working Hours & Weekend Access Security Controls</span>
                        </div>
                      </div>

                      {/* Dynamic Stepper Counter */}
                      <div className="bo-stepper-container">
                        <div className="bo-stepper-header">
                          <span className="bo-stepper-label">Select Seats:</span>
                          <div style={{ textAlign: "right" }}>
                            <span className="bo-stepper-subtotal-val bo-title-font">
                              {formatCurrency(jobSeatStepperPricing.total)}
                            </span>
                            <span className="bo-stepper-subtotal-label">
                              Total for {jobSeatCount} {jobSeatCount > 1 ? "Seats" : "Seat"}
                            </span>
                          </div>
                        </div>

                        <div className="bo-stepper-controls">
                          <button
                            type="button"
                            disabled={jobSeatCount <= 1}
                            onClick={() => setJobSeatCount((prev) => Math.max(1, prev - 1))}
                            className="bo-stepper-btn"
                            title="Decrease seat count"
                          >
                            –
                          </button>
                          <div className="bo-stepper-display">
                            {jobSeatCount} {jobSeatCount > 1 ? "Seats" : "Seat"}
                          </div>
                          <button
                            type="button"
                            onClick={() => setJobSeatCount((prev) => prev + 1)}
                            className="bo-stepper-btn"
                            title="Increase seat count"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      <button
                        onClick={() =>
                          handleInitiatePurchase(
                            {
                              ...jobSeatProduct,
                              quantity: jobSeatCount,
                              basePrice: jobSeatStepperPricing.base,
                              discount: jobSeatStepperPricing.discount,
                              price: jobSeatStepperPricing.currentPrice,
                              unitPrice: jobSeatStepperPricing.unitPrice,
                              taxPercent: jobSeatStepperPricing.taxPercent,
                              taxAmount: jobSeatStepperPricing.taxAmount,
                              total: jobSeatStepperPricing.total,
                              finalPrice: jobSeatStepperPricing.total,
                              pricing: jobSeatStepperPricing,
                              productName: jobSeatProduct.name,
                              name: `${jobSeatCount} Job Posting User Seat${jobSeatCount > 1 ? "s" : ""}`,
                            },
                            "PRODUCT"
                          )
                        }
                        className="bo-btn-buy"
                      >
                        Buy {jobSeatCount} Job Posting Seat{jobSeatCount > 1 ? "s" : ""} • Total {formatCurrency(jobSeatStepperPricing.total)}{" "}
                        <FiArrowRight style={{ width: "16px", height: "16px" }} />
                      </button>
                    </>
                  );
                })()}
              </div>

              {/* Card 2: ResDex User Seat */}
              <div className="bo-card featured">
                <div className="bo-card-ribbon">★ Search Access License</div>

                <div className="bo-card-top-row">
                  <span className="bo-card-sku-tag bo-card-sku-indigo">RESDEX SEAT</span>
                  <span className="bo-card-validity-tag">{getAddonValidityTag(resdexSeatProduct.validity || 30, "Validity")}</span>
                </div>

                <h3 className="bo-card-title bo-title-font">{resdexSeatProduct.name}</h3>
                <div className="bo-card-subtitle" style={{ color: "#3730a3" }}>
                  Dedicated seat for recruiters to search candidates & unlock CVs
                </div>

                <p className="bo-card-desc">
                  {resdexSeatProduct.description || "Dedicated recruiter seat with license to search candidates, unlock CVs, and contact applicants."}
                </p>

                {(() => {
                  const resdexSeatUnitPrice = resdexSeatProduct.defaultPrice || 1000;
                  const resdexSeatUnitPricing = getProductPricing(resdexSeatProduct, 1);
                  const resdexSeatStepperPricing = getProductPricing(resdexSeatProduct, resdexSeatCount);
                  return (
                    <>
                      <div className="bo-price-block">
                        <div className="bo-price-row">
                          <div>
                            <span className="bo-price-val bo-title-font">
                              {formatCurrency(resdexSeatUnitPricing.total)}
                            </span>
                            <span style={{ fontSize: "12px", color: "#64748b", fontWeight: 700, marginLeft: "4px" }}>
                              / user seat
                            </span>
                            <span className="bo-price-tax-note" style={{ display: "block" }}>
                              {getAddonValidityNote(resdexSeatProduct.validity || 30)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="bo-features-container">
                        <div className="bo-feature-item">
                          <FiCheck className="bo-check-icon" />
                          <span>Independent Recruiter Sub-user Login Account</span>
                        </div>
                        <div className="bo-feature-item">
                          <FiCheck className="bo-check-icon" />
                          <span>Access to Search Verified Resume Database</span>
                        </div>
                        <div className="bo-feature-item">
                          <FiCheck className="bo-check-icon" />
                          <span>Consume Shared Company CV Unlock Credits</span>
                        </div>
                        <div className="bo-feature-item">
                          <FiCheck className="bo-check-icon" />
                          <span>Save Custom Candidate Searches, Folders & Notes</span>
                        </div>
                        <div className="bo-feature-item">
                          <FiCheck className="bo-check-icon" />
                          <span>Recruiter Activity History & Quota Safeguards</span>
                        </div>
                      </div>

                      {/* Dynamic Stepper Counter */}
                      <div className="bo-stepper-container">
                        <div className="bo-stepper-header">
                          <span className="bo-stepper-label">Select Seats:</span>
                          <div style={{ textAlign: "right" }}>
                            <span className="bo-stepper-subtotal-val bo-title-font">
                              {formatCurrency(resdexSeatStepperPricing.total)}
                            </span>
                            <span className="bo-stepper-subtotal-label">
                              Total for {resdexSeatCount} {resdexSeatCount > 1 ? "Seats" : "Seat"}
                            </span>
                          </div>
                        </div>

                        <div className="bo-stepper-controls">
                          <button
                            type="button"
                            disabled={resdexSeatCount <= 1}
                            onClick={() => setResdexSeatCount((prev) => Math.max(1, prev - 1))}
                            className="bo-stepper-btn"
                            title="Decrease seat count"
                          >
                            –
                          </button>
                          <div className="bo-stepper-display">
                            {resdexSeatCount} {resdexSeatCount > 1 ? "Seats" : "Seat"}
                          </div>
                          <button
                            type="button"
                            onClick={() => setResdexSeatCount((prev) => prev + 1)}
                            className="bo-stepper-btn"
                            title="Increase seat count"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      <button
                        onClick={() =>
                          handleInitiatePurchase(
                            {
                              ...resdexSeatProduct,
                              quantity: resdexSeatCount,
                              basePrice: resdexSeatStepperPricing.base,
                              discount: resdexSeatStepperPricing.discount,
                              price: resdexSeatStepperPricing.currentPrice,
                              unitPrice: resdexSeatStepperPricing.unitPrice,
                              taxPercent: resdexSeatStepperPricing.taxPercent,
                              taxAmount: resdexSeatStepperPricing.taxAmount,
                              total: resdexSeatStepperPricing.total,
                              finalPrice: resdexSeatStepperPricing.total,
                              pricing: resdexSeatStepperPricing,
                              productName: resdexSeatProduct.name,
                              name: `${resdexSeatCount} ResDex User Seat${resdexSeatCount > 1 ? "s" : ""}`,
                            },
                            "PRODUCT"
                          )
                        }
                        className="bo-btn-buy"
                      >
                        Buy {resdexSeatCount} ResDex Seat{resdexSeatCount > 1 ? "s" : ""} • Total {formatCurrency(resdexSeatStepperPricing.total)}{" "}
                        <FiArrowRight style={{ width: "16px", height: "16px" }} />
                      </button>
                    </>
                  );
                })()}
              </div>

              {/* Card 3: Enterprise Team Expansion Banner Card */}
              <div className="bo-card" style={{ background: "linear-gradient(180deg, #f8fafc 0%, #eff6ff 100%)" }}>
                <div className="bo-card-top-row">
                  <span className="bo-card-sku-tag" style={{ background: "#dbeafe", color: "#1d4ed8" }}>
                    TEAM EXPANSION
                  </span>
                  <span className="bo-card-validity-tag">Flexible Annual</span>
                </div>

                <h3 className="bo-card-title bo-title-font">Bulk Team Licensing</h3>
                <div className="bo-card-subtitle" style={{ color: "#1d4ed8" }}>
                  Have more than 10 recruiters in your hiring agency?
                </div>

                <p className="bo-card-desc">
                  Contact our enterprise solutions team for volume discounts, centralized billing, and custom recruiter seat packages.
                </p>

                <div className="bo-features-container" style={{ marginTop: "24px" }}>
                  <div className="bo-feature-item">
                    <FiCheck className="bo-check-icon" />
                    <span>Dedicated Key Account Manager</span>
                  </div>
                  <div className="bo-feature-item">
                    <FiCheck className="bo-check-icon" />
                    <span>Centralized Master Invoicing & GST Credit</span>
                  </div>
                  <div className="bo-feature-item">
                    <FiCheck className="bo-check-icon" />
                    <span>Custom Role Permissions & Security SLAs</span>
                  </div>
                </div>

                <div style={{ marginTop: "auto" }}>
                  <button
                    type="button"
                    onClick={() => setIsSalesModalOpen(true)}
                    className="bo-btn-contact"
                    style={{ width: "100%", justifyContent: "center" }}
                  >
                    <FiPhoneCall style={{ width: "16px", height: "16px" }} /> Contact to Sales
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Section 5: Standalone & AI Add-on Products */}
        {(activeCategory === "all" || activeCategory === "ai" || activeCategory === "standalone") && (
          <div id="ai-credits" className="bo-section">
            <div className="bo-section-header">
              <span className="bo-section-tag">AI Recruitment Suite</span>
              <h2 className="bo-section-title bo-title-font" style={{ marginTop: "8px" }}>
                Standalone AI & Productivity Credits
              </h2>
              <p className="bo-section-subtitle">
                Top up company-wide AI credits for automated job descriptions, requirement extraction, and smart screening questions.
              </p>
            </div>

            <div className="bo-grid-3">
              {/* Existing AI offers if any */}
              {aiOffers.map((offer) => {
                const offerPricing = getItemPricing(offer);
                return (
                  <div key={offer._id} className="bo-card">
                    <div className="bo-card-top-row">
                      <span className="bo-card-sku-tag bo-card-sku-purple">AI CREDITS</span>
                      <span className="bo-card-validity-tag">{offer.validity} Days</span>
                    </div>

                    <h3 className="bo-card-title bo-title-font">{offer.name}</h3>
                    <div className="bo-card-subtitle bo-card-subtitle-purple">
                      {offer.quantity} AI Operations
                    </div>

                    <div className="bo-price-block">
                      <div className="bo-price-row">
                        <span className="bo-price-val bo-title-font">
                          {formatCurrency(offerPricing.total)}
                        </span>
                        <span className="bo-price-tax-note">
                          Valid for {offer.validity || 30} days
                        </span>
                      </div>
                    </div>

                    <div className="bo-features-container">
                      <div className="bo-feature-item">
                        <FiZap className="bo-sparkle-icon" />
                        <span>Instant AI Job Description Writing</span>
                      </div>
                      <div className="bo-feature-item">
                        <FiZap className="bo-sparkle-icon" />
                        <span>Automated Screening Questions</span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleInitiatePurchase({ ...offer, pricing: offerPricing }, "STANDALONE")}
                      className="bo-btn-buy"
                    >
                      Top up AI Credits • Total {formatCurrency(offerPricing.total)} <FiArrowRight style={{ width: "16px", height: "16px" }} />
                    </button>
                  </div>
                );
              })}

              {/* Standard AI Product Card 1: 50 AI Operations */}
              {(() => {
                const ai50Pricing = getProductPricing(aiProduct, 50);
                return (
                  <div className="bo-card">
                    <div className="bo-card-top-row">
                      <span className="bo-card-sku-tag bo-card-sku-purple">AI 50</span>
                      <span className="bo-card-validity-tag">{aiProduct.validity || 30} Days Validity</span>
                    </div>

                    <h3 className="bo-card-title bo-title-font">AI Starter Booster</h3>
                    <div className="bo-card-subtitle bo-card-subtitle-purple">50 AI Recruitment Operations</div>

                    <p className="bo-card-desc">
                      Accelerate job creation with instant AI job description generation and requirement tuning.
                    </p>

                    <div className="bo-price-block">
                      <div className="bo-price-row">
                        <span className="bo-price-val bo-title-font">
                          {formatCurrency(ai50Pricing.total)}
                        </span>
                        <span className="bo-price-tax-note">
                          Valid for {aiProduct.validity || 30} days
                        </span>
                      </div>
                    </div>

                    <div className="bo-features-container">
                      <div className="bo-feature-item">
                        <FiZap className="bo-sparkle-icon" />
                        <span>Instant AI Job Description Writing from Title</span>
                      </div>
                      <div className="bo-feature-item">
                        <FiZap className="bo-sparkle-icon" />
                        <span>AI-Powered Requirements & Skills Extraction</span>
                      </div>
                      <div className="bo-feature-item">
                        <FiZap className="bo-sparkle-icon" />
                        <span>Automated Candidate Screening Questions</span>
                      </div>
                      <div className="bo-feature-item">
                        <FiCheck className="bo-check-icon" />
                        <span>Company-wide Shared AI Operations Pool</span>
                      </div>
                    </div>

                    <button
                      onClick={() =>
                        handleInitiatePurchase(
                          {
                            ...aiProduct,
                            quantity: 50,
                            basePrice: ai50Pricing.base,
                            discount: ai50Pricing.discount,
                            price: ai50Pricing.currentPrice,
                            unitPrice: ai50Pricing.unitPrice,
                            taxPercent: ai50Pricing.taxPercent,
                            taxAmount: ai50Pricing.taxAmount,
                            total: ai50Pricing.total,
                            finalPrice: ai50Pricing.total,
                            pricing: ai50Pricing,
                            productName: aiProduct.name,
                            name: "50 AI Recruitment Credits",
                          },
                          "PRODUCT"
                        )
                      }
                      className="bo-btn-buy"
                    >
                      Top up 50 AI Credits • Total {formatCurrency(ai50Pricing.total)} <FiArrowRight style={{ width: "16px", height: "16px" }} />
                    </button>
                  </div>
                );
              })()}

              {/* Standard AI Product Card 2: 200 AI Operations (Featured) */}
              {(() => {
                const ai200Pricing = getProductPricing(aiProduct, 200);
                return (
                  <div className="bo-card featured">
                    <div className="bo-card-ribbon">★ Maximum AI Productivity</div>

                    <div className="bo-card-top-row">
                      <span className="bo-card-sku-tag bo-card-sku-purple">AI 200</span>
                      <span className="bo-card-validity-tag">30 Days (Monthly Cycle)</span>
                    </div>

                    <h3 className="bo-card-title bo-title-font">AI Pro Booster Pack</h3>
                    <div className="bo-card-subtitle bo-card-subtitle-purple">200 AI Recruitment Operations</div>

                    <p className="bo-card-desc">
                      High-volume AI operations for recruitment teams handling multiple simultaneous openings.
                    </p>

                    <div className="bo-price-block">
                      <div className="bo-price-row">
                        <span className="bo-price-val bo-title-font">
                          {formatCurrency(ai200Pricing.total)}
                        </span>
                        <span className="bo-price-tax-note">
                          Valid for 30 days (Monthly cycle)
                        </span>
                      </div>
                    </div>

                    <div className="bo-features-container">
                      <div className="bo-feature-item">
                        <FiZap className="bo-sparkle-icon" />
                        <span>Instant AI Job Description Writing from Title</span>
                      </div>
                      <div className="bo-feature-item">
                        <FiZap className="bo-sparkle-icon" />
                        <span>Unlimited JD Polish & Responsibility Expansion</span>
                      </div>
                      <div className="bo-feature-item">
                        <FiZap className="bo-sparkle-icon" />
                        <span>Multi-role Candidate Screening Questions</span>
                      </div>
                      <div className="bo-feature-item">
                        <FiCheck className="bo-check-icon" />
                        <span>30 Days Monthly Cycle (Unused credits expire at month-end)</span>
                      </div>
                    </div>

                    <button
                      onClick={() =>
                        handleInitiatePurchase(
                          {
                            ...aiProduct,
                            quantity: 200,
                            basePrice: ai200Pricing.base,
                            discount: ai200Pricing.discount,
                            price: ai200Pricing.currentPrice,
                            unitPrice: ai200Pricing.unitPrice,
                            taxPercent: ai200Pricing.taxPercent,
                            taxAmount: ai200Pricing.taxAmount,
                            total: ai200Pricing.total,
                            finalPrice: ai200Pricing.total,
                            pricing: ai200Pricing,
                            productName: aiProduct.name,
                            name: "200 AI Recruitment Credits",
                          },
                          "PRODUCT"
                        )
                      }
                      className="bo-btn-buy"
                    >
                      Top up 200 AI Credits • Total {formatCurrency(ai200Pricing.total)} <FiArrowRight style={{ width: "16px", height: "16px" }} />
                    </button>
                  </div>
                );
              })()}

              {/* Standard AI Product Card 3: Custom Counter */}
              {(() => {
                const validCount = Math.max(1, Number(aiOperationCount) || 1);
                const unitPrice = aiProduct.defaultPrice || 10;
                const customAiPricing = getProductPricing(aiProduct, validCount);
                return (
                  <div className="bo-card">
                    <div className="bo-card-top-row">
                      <span className="bo-card-sku-tag bo-card-sku-purple">CUSTOM AI</span>
                      <span className="bo-card-validity-tag">{aiProduct.validity || 30} Days Validity</span>
                    </div>

                    <h3 className="bo-card-title bo-title-font">Custom AI Volume</h3>
                    <div className="bo-card-subtitle bo-card-subtitle-purple">Select your required AI uses</div>

                    <p className="bo-card-desc">
                      Select any custom quantity of AI operations tailored to your team size and posting volume.
                    </p>

                    <div className="bo-price-block">
                      <div className="bo-price-row">
                        <div>
                          <span className="bo-price-val bo-title-font">
                            {formatCurrency(Math.round(customAiPricing.total / (Number(aiOperationCount) || 1)))}
                          </span>
                          <span style={{ fontSize: "12px", color: "#64748b", fontWeight: 700, marginLeft: "4px" }}>
                            / operation
                          </span>
                          <span className="bo-price-tax-note" style={{ display: "block" }}>
                            Valid for {aiProduct.validity || 30} days
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="bo-features-container">
                      <div className="bo-feature-item">
                        <FiZap className="bo-sparkle-icon" />
                        <span>Instant JD Generator & Enhancer</span>
                      </div>
                      <div className="bo-feature-item">
                        <FiZap className="bo-sparkle-icon" />
                        <span>Automated Screening Questions</span>
                      </div>
                      <div className="bo-feature-item">
                        <FiCheck className="bo-check-icon" />
                        <span>Shared Company-wide Credit Pool</span>
                      </div>
                    </div>

                    {/* Dynamic Stepper Counter */}
                    <div className="bo-stepper-container">
                      <div className="bo-stepper-header">
                        <span className="bo-stepper-label">Select Credits:</span>
                        <div style={{ textAlign: "right" }}>
                          <span className="bo-stepper-subtotal-val bo-title-font">
                            {formatCurrency(customAiPricing.total)}
                          </span>
                          <span className="bo-stepper-subtotal-label">
                            Total for {aiOperationCount} Credits
                          </span>
                        </div>
                      </div>

                      <div className="bo-stepper-controls">
                        <button
                          type="button"
                          disabled={Number(aiOperationCount) <= 1}
                          onClick={() => setAiOperationCount((prev) => Math.max(1, (Number(prev) || 1) - 1))}
                          className="bo-stepper-btn"
                          title="Decrease AI credits"
                        >
                          –
                        </button>
                        <div className="bo-stepper-display">
                          <input
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            value={aiOperationCount}
                            onChange={(e) => {
                              const val = e.target.value.replace(/[^0-9]/g, "");
                              if (val === "" || val === "0") {
                                setAiOperationCount(val === "0" ? "" : "");
                              } else {
                                const num = parseInt(val, 10);
                                if (!isNaN(num) && num > 0) {
                                  setAiOperationCount(num);
                                }
                              }
                            }}
                            onKeyDown={(e) => {
                              if (["-", "+", "e", "E", "."].includes(e.key)) {
                                e.preventDefault();
                              }
                              if (e.key === "0" && (!aiOperationCount || aiOperationCount === "0")) {
                                e.preventDefault();
                              }
                            }}
                            onBlur={() => {
                              if (!aiOperationCount || Number(aiOperationCount) < 1) {
                                setAiOperationCount(1);
                              }
                            }}
                            className="bo-stepper-input"
                            aria-label="Custom AI credits count"
                          />
                          <span className="bo-stepper-unit">Uses</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setAiOperationCount((prev) => (Number(prev) || 0) + 1)}
                          className="bo-stepper-btn"
                          title="Increase AI credits"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        handleInitiatePurchase(
                          {
                            ...aiProduct,
                            quantity: validCount,
                            basePrice: customAiPricing.base,
                            discount: customAiPricing.discount,
                            price: customAiPricing.currentPrice,
                            unitPrice: customAiPricing.unitPrice,
                            taxPercent: customAiPricing.taxPercent,
                            taxAmount: customAiPricing.taxAmount,
                            total: customAiPricing.total,
                            finalPrice: customAiPricing.total,
                            pricing: customAiPricing,
                            productName: aiProduct.name,
                            name: `${validCount} AI Recruitment Credits`,
                          },
                          "PRODUCT"
                        );
                      }}
                      className="bo-btn-buy"
                    >
                      Buy {validCount} AI Credits • Total {formatCurrency(customAiPricing.total)} <FiArrowRight style={{ width: "16px", height: "16px" }} />
                    </button>
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* Section 5: Custom / Enterprise Solutions */}
        {(activeCategory === "all" || activeCategory === "custom") && (
          <div id="enterprise" className="bo-enterprise-banner">
            <div className="bo-enterprise-content">
              <span className="bo-enterprise-tag">
                Enterprise & Custom Solutions
              </span>
              <h2 className="bo-enterprise-title bo-title-font">
                Built for large volume recruitment teams
              </h2>
              <p className="bo-enterprise-desc">
                Need high-volume job postings, unlimited resume database access, dedicated sub-user accounts, or customized SLA agreements? Let us build a tailored package designed specifically for your annual recruitment goals.
              </p>

              <div className="bo-enterprise-grid">
                <div className="bo-enterprise-item">
                  <FiCheck className="bo-enterprise-item-icon" />
                  <span>Custom job posting volumes</span>
                </div>
                <div className="bo-enterprise-item">
                  <FiCheck className="bo-enterprise-item-icon" />
                  <span>Bulk resume database access</span>
                </div>
                <div className="bo-enterprise-item">
                  <FiCheck className="bo-enterprise-item-icon" />
                  <span>Dedicated Key Account Manager</span>
                </div>
                <div className="bo-enterprise-item">
                  <FiCheck className="bo-enterprise-item-icon" />
                  <span>Direct ATS & API Integration</span>
                </div>
              </div>

              <div className="bo-enterprise-actions">
                <button
                  onClick={() => setIsSalesModalOpen(true)}
                  className="bo-btn-white"
                >
                  <FiPhoneCall style={{ width: "16px", height: "16px" }} /> Talk to Enterprise Sales
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Section 6: Plan Comparison Matrix */}
        <div id="compare" className="bo-table-card">
          <div className="bo-section-header">
            <h2 className="bo-section-title bo-title-font">
              Compare Plan Capabilities
            </h2>
            <p className="bo-section-subtitle">
              Comprehensive side-by-side comparison of plan entitlements, AI capabilities, and recruiter access as per our commercial hiring model.
            </p>
          </div>

          <div className="bo-table-scroll">
            <table className="bo-table">
              <thead>
                <tr>
                  <th style={{ minWidth: "240px" }}>Capabilities & Features</th>
                  {plans.map((p) => (
                    <th key={p._id} className="center" style={{ minWidth: "150px" }}>
                      <div style={{ fontWeight: 800, color: "#002366" }}>{p.name}</div>
                      <div style={{ fontSize: "11px", fontWeight: "normal", color: "#64748b", marginTop: "2px" }}>
                        {p.code === "FREE" ? "Free Forever" : p.code === "SMB_STARTER" ? "Small Companies" : "Large Companies"}
                      </div>
                    </th>
                  ))}
                  <th className="center" style={{ minWidth: "150px" }}>
                    <div style={{ fontWeight: 800, color: "#002366" }}>Enterprise</div>
                    <div style={{ fontSize: "11px", fontWeight: "normal", color: "#64748b", marginTop: "2px" }}>Custom Scale</div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {/* ── SECTION 1: CORE RECRUITMENT QUOTAS ── */}
                <tr className="bo-table-section-row">
                  <td colSpan={plans.length + 2}>1. Core Commercial Quotas & Entitlements</td>
                </tr>

                <tr>
                  <td className="bo-table-feature-title">Job Postings Included</td>
                  {plans.map((p) => {
                    const smb = p.activeVersion?.items?.find((i) => i.productCode === "SMB_JOB");
                    const hot = p.activeVersion?.items?.find((i) => i.productCode === "HOT_VACANCY");
                    return (
                      <td key={p._id} className="center bo-table-val-highlight">
                        {hot ? `${hot.quantity} Hot + ` : ""}
                        {smb ? `${smb.quantity} SMB` : "1 Job"}
                      </td>
                    );
                  })}
                  <td className="center" style={{ fontWeight: 700, color: "#1e293b" }}>Custom Unlimited</td>
                </tr>

                <tr>
                  <td className="bo-table-feature-title">Resume Database Search (ResDex)</td>
                  {plans.map((p) => {
                    const rd = p.activeVersion?.items?.find((i) => i.productCode === "RESDEX");
                    return (
                      <td key={p._id} className="center bo-table-val-regular">
                        {rd ? `${rd.quantity.toLocaleString()} Views` : <span className="bo-badge-no">— (No Search)</span>}
                      </td>
                    );
                  })}
                  <td className="center" style={{ fontWeight: 700, color: "#1e293b" }}>10,000+ Views</td>
                </tr>

                <tr>
                  <td className="bo-table-feature-title">ResDex Search Recruiter Users (Seats)</td>
                  {plans.map((p) => {
                    const seat = p.activeVersion?.items?.find((i) => i.productCode === "RESDEX_SEAT");
                    const qty = seat?.quantity || (p.code === "SMB_STARTER" ? 3 : p.code === "CORPORATE" ? 8 : 0);
                    return (
                      <td key={p._id} className="center bo-table-val-regular">
                        {qty > 0 ? `${qty} Seats` : <span className="bo-badge-no">—</span>}
                      </td>
                    );
                  })}
                  <td className="center" style={{ fontWeight: 700, color: "#1e293b" }}>Custom Unlimited</td>
                </tr>

                <tr>
                  <td className="bo-table-feature-title">Job Posting Users (Seats)</td>
                  {plans.map((p) => {
                    const seat = p.activeVersion?.items?.find((i) => i.productCode === "JOB_POSTING_SEAT");
                    const qty = seat?.quantity || (p.code === "CORPORATE" ? 3 : p.code === "FREE" ? 2 : 1);
                    return (
                      <td key={p._id} className="center bo-table-val-regular">
                        {qty > 0 ? `${qty} Users` : "1 User"}
                      </td>
                    );
                  })}
                  <td className="center" style={{ fontWeight: 700, color: "#1e293b" }}>Unlimited</td>
                </tr>

                <tr>
                  <td className="bo-table-feature-title">Candidate Outreach (NVites)</td>
                  {plans.map((p) => {
                    const mivite = p.activeVersion?.items?.find((i) => i.productCode === "MIVITE");
                    return (
                      <td key={p._id} className="center bo-table-val-regular">
                        {mivite ? `${mivite.quantity.toLocaleString()} Invites` : <span className="bo-badge-no">—</span>}
                      </td>
                    );
                  })}
                  <td className="center" style={{ fontWeight: 700, color: "#1e293b" }}>Custom Unlimited</td>
                </tr>

                {/* ── SECTION 2: AI RECRUITMENT SUITE ── */}
                <tr className="bo-table-section-row">
                  <td colSpan={plans.length + 2}>2. AI-Powered Recruitment Suite (Monthly Shared Pool)</td>
                </tr>

                <tr>
                  <td className="bo-table-feature-title">Monthly AI Uses Pool (Company-Wide)</td>
                  {plans.map((p) => {
                    const ai = p.activeVersion?.items?.find((i) => i.productCode === "AI_CREDIT");
                    return (
                      <td key={p._id} className="center bo-table-val-highlight">
                        {ai ? `${ai.quantity} Uses / mo` : "10 Uses / mo"}
                      </td>
                    );
                  })}
                  <td className="center" style={{ fontWeight: 700, color: "#1e293b" }}>Custom Volume</td>
                </tr>

                <tr>
                  <td className="bo-table-feature-title">Improve Job Description</td>
                  {plans.map((p) => (
                    <td key={p._id} className="center">
                      <span className="bo-badge-yes"><FiCheck /> Yes</span>
                    </td>
                  ))}
                  <td className="center">
                    <span className="bo-badge-yes"><FiCheck /> Yes</span>
                  </td>
                </tr>

                <tr>
                  <td className="bo-table-feature-title">Improve Requirements & Skills</td>
                  {plans.map((p) => (
                    <td key={p._id} className="center">
                      <span className="bo-badge-yes"><FiCheck /> Yes</span>
                    </td>
                  ))}
                  <td className="center">
                    <span className="bo-badge-yes"><FiCheck /> Yes</span>
                  </td>
                </tr>

                <tr>
                  <td className="bo-table-feature-title">Improve Responsibilities</td>
                  {plans.map((p) => (
                    <td key={p._id} className="center">
                      <span className="bo-badge-yes"><FiCheck /> Yes</span>
                    </td>
                  ))}
                  <td className="center">
                    <span className="bo-badge-yes"><FiCheck /> Yes</span>
                  </td>
                </tr>

                <tr>
                  <td className="bo-table-feature-title">Write Full Job Description from Title</td>
                  {plans.map((p) => {
                    const aiItem = p.activeVersion?.items?.find((i) => i.productCode === "AI_CREDIT");
                    const feat = aiItem?.features?.find((f) => f.key === "generateJd");
                    const isEnabled = feat ? feat.enabled : p.code !== "FREE";
                    return (
                      <td key={p._id} className="center">
                        {isEnabled ? (
                          <span className="bo-badge-yes"><FiCheck /> Yes</span>
                        ) : (
                          <span className="bo-badge-no">— (Paid Only)</span>
                        )}
                      </td>
                    );
                  })}
                  <td className="center">
                    <span className="bo-badge-yes"><FiCheck /> Yes</span>
                  </td>
                </tr>

                <tr>
                  <td className="bo-table-feature-title">Generate Screening Questions</td>
                  {plans.map((p) => {
                    const aiItem = p.activeVersion?.items?.find((i) => i.productCode === "AI_CREDIT");
                    const feat = aiItem?.features?.find((f) => f.key === "screeningQuestions");
                    const isEnabled = feat ? feat.enabled : p.code !== "FREE";
                    return (
                      <td key={p._id} className="center">
                        {isEnabled ? (
                          <span className="bo-badge-yes"><FiCheck /> Yes</span>
                        ) : (
                          <span className="bo-badge-no">— (Paid Only)</span>
                        )}
                      </td>
                    );
                  })}
                  <td className="center">
                    <span className="bo-badge-yes"><FiCheck /> Yes</span>
                  </td>
                </tr>

                <tr>
                  <td className="bo-table-feature-title">Unused AI Credits Rollover</td>
                  {plans.map((p) => (
                    <td key={p._id} className="center" style={{ fontSize: "11px", color: "#64748b" }}>
                      Expires Month-End
                    </td>
                  ))}
                  <td className="center" style={{ fontSize: "11px", color: "#64748b" }}>
                    Custom
                  </td>
                </tr>

                {/* ── SECTION 3: JOB REACH & BRANDING  ── */}
                <tr className="bo-table-section-row">
                  <td colSpan={plans.length + 2}>3. Job Reach, Visibility & Branding</td>
                </tr>

                <tr>
                  <td className="bo-table-feature-title">Top Search Placement (Hot Vacancy)</td>
                  {plans.map((p) => {
                    const hasHot = p.activeVersion?.items?.some((i) => i.productCode === "HOT_VACANCY");
                    return (
                      <td key={p._id} className="center">
                        {hasHot ? (
                          <span className="bo-badge-yes"><FiCheck /> Yes (Top)</span>
                        ) : (
                          <span className="bo-badge-no">—</span>
                        )}
                      </td>
                    );
                  })}
                  <td className="center">
                    <span className="bo-badge-yes"><FiCheck /> Yes (Priority)</span>
                  </td>
                </tr>

                <tr>
                  <td className="bo-table-feature-title">Company Logo Display</td>
                  {plans.map((p) => {
                    const hasHot = p.activeVersion?.items?.some((i) => i.productCode === "HOT_VACANCY");
                    return (
                      <td key={p._id} className="center">
                        {hasHot ? (
                          <span className="bo-badge-yes"><FiCheck /> Yes</span>
                        ) : (
                          <span className="bo-badge-no">—</span>
                        )}
                      </td>
                    );
                  })}
                  <td className="center">
                    <span className="bo-badge-yes"><FiCheck /> Custom Branding</span>
                  </td>
                </tr>

                <tr>
                  <td className="bo-table-feature-title">Instant Candidate Job Alerts</td>
                  {plans.map((p) => {
                    const hasHot = p.activeVersion?.items?.some((i) => i.productCode === "HOT_VACANCY");
                    return (
                      <td key={p._id} className="center">
                        {hasHot ? (
                          <span className="bo-badge-yes"><FiCheck /> Yes</span>
                        ) : (
                          <span className="bo-badge-no">—</span>
                        )}
                      </td>
                    );
                  })}
                  <td className="center">
                    <span className="bo-badge-yes"><FiCheck /> Instant Blast</span>
                  </td>
                </tr>

                <tr>
                  <td className="bo-table-feature-title">Cities Coverage Per Job</td>
                  {plans.map((p) => {
                    const multiCityFeat = p.activeVersion?.items
                      ?.flatMap((i) => i.features || [])
                      ?.find((f) => f.key === "multipleCities" && f.enabled);
                    const cityVal = multiCityFeat?.value ? `Up to ${multiCityFeat.value} Cities` : "1 City";
                    return (
                      <td key={p._id} className="center bo-table-val-regular">
                        {cityVal}
                      </td>
                    );
                  })}
                  <td className="center" style={{ fontWeight: 700, color: "#1e293b" }}>Multi-City All India</td>
                </tr>

                <tr>
                  <td className="bo-table-feature-title">Job Description Length</td>
                  {plans.map((p) => {
                    const hasHot = p.activeVersion?.items?.some((i) => i.productCode === "HOT_VACANCY");
                    return (
                      <td key={p._id} className="center bo-table-val-regular">
                        {hasHot ? "Extended Format" : "Standard"}
                      </td>
                    );
                  })}
                  <td className="center" style={{ fontWeight: 700, color: "#1e293b" }}>Custom Rich HTML</td>
                </tr>

                <tr>
                  <td className="bo-table-feature-title">Job Live Duration</td>
                  {plans.map((p) => (
                    <td key={p._id} className="center bo-table-val-regular">
                      {!isLoggedIn ? "Plan Synced" : hasActivePlan ? `${activePlanDays} Days` : "30 Days"}
                    </td>
                  ))}
                  <td className="center" style={{ fontWeight: 700, color: "#1e293b" }}>30 - 60 Days</td>
                </tr>

                {/* ── SECTION 4: CANDIDATE WORKSPACES & DATA RETENTION ── */}
                <tr className="bo-table-section-row">
                  <td colSpan={plans.length + 2}>4. Candidate Workspaces & Account Retention</td>
                </tr>

                <tr>
                  <td className="bo-table-feature-title">ResDex Requirement Folders</td>
                  {plans.map((p) => {
                    const isFree = p.code === "FREE";
                    return (
                      <td key={p._id} className="center bo-table-val-regular">
                        {isFree ? "1 Folder" : "Unlimited"}
                      </td>
                    );
                  })}
                  <td className="center" style={{ fontWeight: 700, color: "#1e293b" }}>Unlimited + Team Sharing</td>
                </tr>

                <tr>
                  <td className="bo-table-feature-title">Candidate Notes, Tags & Folders</td>
                  {plans.map((p) => {
                    const isFree = p.code === "FREE";
                    return (
                      <td key={p._id} className="center">
                        {isFree ? <span className="bo-badge-no">—</span> : <span className="bo-badge-yes"><FiCheck /> Yes</span>}
                      </td>
                    );
                  })}
                  <td className="center">
                    <span className="bo-badge-yes"><FiCheck /> Yes</span>
                  </td>
                </tr>

                <tr>
                  <td className="bo-table-feature-title">Subscription Validity</td>
                  {plans.map((p) => (
                    <td key={p._id} className="center" style={{ color: "#64748b", fontWeight: 600 }}>
                      {p.activeVersion?.validity || 90} Days
                    </td>
                  ))}
                  <td className="center" style={{ fontWeight: 700, color: "#1e293b" }}>1 Year (Annual)</td>
                </tr>

                <tr>
                  <td className="bo-table-feature-title">Post-Expiry Read-Only Access</td>
                  {plans.map((p) => (
                    <td key={p._id} className="center" style={{ fontSize: "11px", color: "#64748b" }}>
                      90 Days (Old CVs & Jobs)
                    </td>
                  ))}
                  <td className="center" style={{ fontSize: "11px", color: "#64748b" }}>
                    Extended Archive
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 7: FAQs */}
        <div className="bo-faq-container">
          <div className="bo-section-header">
            <h2 className="bo-section-title bo-title-font">
              Frequently Asked Questions
            </h2>
            <p className="bo-section-subtitle">
              Everything you need to know about purchasing online and credit management.
            </p>
          </div>

          <div className="bo-faq-list">
            {FAQS.map((faq, idx) => (
              <div key={idx} className="bo-faq-item">
                <button
                  onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                  className="bo-faq-btn"
                >
                  <span>{faq.question}</span>
                  <FiChevronDown
                    className={`bo-faq-chevron ${activeFaq === idx ? "rotate" : ""}`}
                  />
                </button>
                {activeFaq === idx && (
                  <div className="bo-faq-answer">
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Combined Hiring Plan Full Details Modal */}
      {detailPlan && (
        <div
          className="bo-plan-details-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget) setDetailPlan(null);
          }}
        >
          <div className="bo-plan-details-modal" onClick={(e) => e.stopPropagation()}>
            {/* Bluish Gradient Header */}
            <div className="bo-plan-details-header">
              <div>
                <div className="bo-plan-details-tag">
                  <FiLayers style={{ width: "13px", height: "13px" }} />
                  {detailPlan.planType} PACKAGE • FULL SPECIFICATIONS
                </div>
                <h3 className="bo-plan-details-title bo-title-font">
                  {detailPlan.name}
                </h3>
                <p className="bo-plan-details-subtitle">
                  {detailPlan.description || "Comprehensive commercial recruitment plan with bundled services and synchronized validity."}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDetailPlan(null)}
                className="bo-plan-details-close"
                aria-label="Close modal"
              >
                <FiX style={{ width: "20px", height: "20px" }} />
              </button>
            </div>

            {/* Bluish Price & Validity Summary Strip */}
            {(() => {
              const detailPricing = getItemPricing(detailPlan);
              return (
                <div className="bo-plan-details-price-strip">
                  <div className="bo-plan-strip-price-block">
                    <span className="bo-plan-strip-price-val bo-title-font">
                      {detailPricing.total === 0
                        ? "Free"
                        : formatCurrency(detailPricing.total)}
                    </span>
                    {detailPricing.discount > 0 && (
                      <span className="bo-plan-strip-price-old">
                        {formatCurrency(detailPricing.base)}
                      </span>
                    )}
                    {detailPricing.discount > 0 && (
                      <span className="bo-plan-strip-discount-pill">
                        {detailPlan.activeVersion.discount}% Off
                      </span>
                    )}
                  </div>
                  <div className="bo-plan-strip-meta">
                    <span className="bo-plan-strip-meta-item">
                      <FiClock style={{ width: "15px", height: "15px", color: "#002366" }} />
                      Validity: <strong>{detailPlan.activeVersion?.validity || 90} {detailPlan.activeVersion?.validityUnit?.toLowerCase() || "days"}</strong>
                    </span>
                    <span className="bo-plan-strip-meta-item">
                      <FiShield style={{ width: "15px", height: "15px", color: "#002366" }} />
                      {detailPricing.total > 0
                        ? formatGstFormula(detailPricing)
                        : "Free / Included"}
                    </span>
                  </div>
                </div>
              );
            })()}

            {/* Modal Body: Products & Features Grid */}
            <div className="bo-plan-details-body">
              <div className="bo-plan-details-body-heading">
                <h4>
                  Bundled Products & Entitlements ({detailPlan.activeVersion?.items?.length || 0})
                </h4>
                <span>All quotas and features activate simultaneously upon purchase</span>
              </div>

              <div className="bo-plan-details-grid">
                {(detailPlan.activeVersion?.items || []).map((it, idx) => {
                  const hasFeatures = it.features && it.features.length > 0;
                  const itBase = Number(it.basePrice || (it.unitPrice ? it.unitPrice * (it.quantity || 1) : 0));
                  return (
                    <div key={idx} className="bo-plan-details-item-card">
                      <div className="bo-item-card-header">
                        <div className="bo-item-card-icon">
                          {getProductIcon(it.productCode)}
                        </div>
                        <div className="bo-item-card-info">
                          <div className="bo-item-card-title-row">
                            <span className="bo-item-card-name" title={it.productName}>
                              {it.productName}
                            </span>
                            <span className="bo-item-card-qty-badge">
                              {it.quantity} {it.unit}{it.quantity > 1 ? "s" : ""}
                            </span>
                          </div>
                          <div className="bo-item-card-validity">
                            Valid for {it.validity || detailPlan.activeVersion?.validity || 30} days
                            {itBase > 0 && (
                              <span style={{ marginLeft: "8px", color: "#4338ca", fontWeight: 600 }}>
                                • Base Price: ₹{itBase.toLocaleString()}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {hasFeatures ? (
                        <div className="bo-item-subfeatures-list">
                          <div className="bo-item-subfeatures-heading">Product Features & Limits:</div>
                          {it.features.map((feat, fIdx) => (
                            <div
                              key={fIdx}
                              className={`bo-item-subfeature-row ${feat.enabled ? "enabled" : "disabled"}`}
                            >
                              {feat.enabled ? (
                                <FiCheck className="bo-subfeature-check" />
                              ) : (
                                <FiX className="bo-subfeature-cross" />
                              )}
                              <span className="bo-subfeature-name">
                                {feat.name}
                                {feat.enabled && feat.value && typeof feat.value !== "boolean" && (
                                  <span className="bo-subfeature-val-pill">
                                    ({feat.value} {feat.key === "multipleCities" ? "Cities" : ""})
                                  </span>
                                )}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="bo-item-no-subfeatures">
                          <FiCheck className="bo-subfeature-check" /> Standard module access enabled
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Bluish Footer */}
            <div className="bo-plan-details-footer">
              <div className="bo-plan-details-footer-note">
                <FiCheckCircle style={{ width: "16px", height: "16px", color: "#002366" }} />
                <span>Instant activation • Master GST invoicing • Synchronized quotas</span>
              </div>
              <div className="bo-plan-details-footer-btns">
                <button
                  type="button"
                  onClick={() => setDetailPlan(null)}
                  className="bo-btn-secondary"
                  style={{ padding: "10px 18px", fontSize: "14px" }}
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const planToBuy = detailPlan;
                    setDetailPlan(null);
                    handleInitiatePurchase(planToBuy, "PLAN");
                  }}
                  className="bo-plan-details-buy-btn"
                >
                  Buy This Plan Now <FiArrowRight style={{ width: "16px", height: "16px" }} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Review & Purchase Checkout Modal */}
      {isPurchaseModalOpen && selectedItemForPurchase && (
        <div className="bo-modal-backdrop">
          <div className="bo-modal-box bo-modal-xl">
            <div className="bo-modal-header">
              <div>
                <span className="bo-modal-tag">Order Review & Activation</span>
                <h3 className="bo-modal-title bo-title-font">
                  {selectedItemForPurchase.name}
                </h3>
              </div>
              <button
                onClick={() => setIsPurchaseModalOpen(false)}
                className="bo-modal-close-btn"
                title="Close modal"
              >
                <FiX style={{ width: "20px", height: "20px" }} />
              </button>
            </div>

            {paymentError && (
              <div className="bo-error-alert">
                <FiAlertCircle style={{ width: "16px", height: "16px", flexShrink: 0 }} />
                <span>{paymentError}</span>
              </div>
            )}

            <div className="bo-modal-body">
              <div className="bo-purchase-grid">
                {/* Left Column: Entitlements, Inclusions & Validity Policy */}
                <div className="bo-purchase-col-left">
                  <div className="bo-summary-card">
                    <span className="bo-summary-title">What you will receive:</span>
                    {selectedItemForPurchase.itemType === "PLAN" ? (
                      <div style={{ maxHeight: "280px", overflowY: "auto", paddingRight: "4px" }}>
                        {(selectedItemForPurchase.activeVersion?.items || []).map((it, idx) => (
                          <div key={idx} style={{ marginBottom: "10px", paddingBottom: "10px", borderBottom: idx < (selectedItemForPurchase.activeVersion?.items?.length - 1) ? "1px solid #f1f5f9" : "none" }}>
                            <div className="bo-summary-item" style={{ marginBottom: it.features?.length ? "4px" : "0" }}>
                              <FiCheck className="bo-check-icon" />
                              <span>
                                <strong>{it.quantity} {it.unit}{it.quantity > 1 ? "s" : ""}</strong> — {it.productName}
                              </span>
                            </div>
                            {it.features && it.features.length > 0 && (
                              <div style={{ paddingLeft: "26px", display: "flex", flexDirection: "column", gap: "3px" }}>
                                {it.features.map((feat, fIdx) => (
                                  <div
                                    key={fIdx}
                                    style={{
                                      fontSize: "11px",
                                      color: feat.enabled ? "#334155" : "#94a3b8",
                                      display: "flex",
                                      alignItems: "center",
                                      gap: "5px",
                                      textDecoration: feat.enabled ? "none" : "line-through",
                                    }}
                                  >
                                    {feat.enabled ? (
                                      <FiCheck size={11} color="#059669" />
                                    ) : (
                                      <FiX size={11} color="#94a3b8" />
                                    )}
                                    <span>
                                      {feat.name}
                                      {feat.enabled && feat.value && typeof feat.value !== "boolean" && ` (${feat.value} Cities)`}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : selectedItemForPurchase.itemType === "PRODUCT" ? (
                      <div className="bo-summary-item">
                        <FiCheck className="bo-check-icon" />
                        <span>
                          {selectedItemForPurchase.category === "JOB_POSTING" || selectedItemForPurchase.code?.includes("JOB") || selectedItemForPurchase.code?.includes("HOT") ? (
                            <>
                              <strong>{selectedItemForPurchase.quantity}</strong>{" "}
                              {selectedItemForPurchase.quantity > 1
                                ? (selectedItemForPurchase.code?.includes("HOT") ? "Hot Vacancies" : selectedItemForPurchase.code?.includes("INTERNSHIP") ? "Internship Jobs" : "Job Postings")
                                : (selectedItemForPurchase.code?.includes("HOT") ? "Hot Vacancy" : selectedItemForPurchase.code?.includes("INTERNSHIP") ? "Internship Job" : "Job Posting")}
                              {hasActivePlan ? ` (${activePlanDays} Days Live • Plan Synced)` : ""}
                            </>
                          ) : selectedItemForPurchase.category === "AI" || selectedItemForPurchase.code?.includes("AI") ? (
                            <>
                              <strong>{selectedItemForPurchase.quantity}</strong> AI Recruitment Operations
                            </>
                          ) : selectedItemForPurchase.category === "RESUME_SEARCH" || selectedItemForPurchase.code?.includes("RESDEX") ? (
                            <>
                              <strong>{selectedItemForPurchase.quantity}</strong> Candidate Resume Views & Unlocks
                              {hasActivePlan ? ` (${activePlanDays} Days • Plan Synced)` : ""}
                            </>
                          ) : selectedItemForPurchase.category === "USER_SEATS" || selectedItemForPurchase.code?.includes("SEAT") ? (
                            <>
                              <strong>{selectedItemForPurchase.quantity}</strong> Recruiter Seat {selectedItemForPurchase.quantity > 1 ? "Licenses" : "License"}
                              {hasActivePlan ? ` (${activePlanDays} Days • Plan Synced)` : ""}
                            </>
                          ) : (
                            <>
                              <strong>{selectedItemForPurchase.quantity}</strong> {selectedItemForPurchase.productName || selectedItemForPurchase.name}
                            </>
                          )}
                        </span>
                      </div>
                    ) : (
                      <div className="bo-summary-item">
                        <FiCheck className="bo-check-icon" />
                        <span>
                          <strong>{selectedItemForPurchase.quantity}</strong>{" "}
                          {selectedItemForPurchase.product?.name || selectedItemForPurchase.name} Credits
                        </span>
                      </div>
                    )}

                    <div style={{ marginTop: "14px", fontSize: "12px", color: "#334155", backgroundColor: "#eff6ff", padding: "12px 14px", borderRadius: "12px", border: "1px solid #bfdbfe" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", fontWeight: 700, color: "#002366" }}>
                        <FiClock style={{ width: "15px", height: "15px" }} />
                        Validity & Expiry Policy:
                      </div>
                      <div style={{ marginTop: "4px", fontSize: "11.5px", color: "#475569", lineHeight: 1.5 }}>
                        {selectedItemForPurchase.itemType === "PLAN" ? (
                          <>
                            <strong>{selectedItemForPurchase.activeVersion?.validity || 90} Days:</strong> Synchronized validity across all bundled products. Unused credits expire when the plan ends.
                          </>
                        ) : (selectedItemForPurchase.category === "AI" || selectedItemForPurchase.code?.includes("AI")) ? (
                          <>
                            <strong>30 Days Monthly Cycle:</strong> Shared company AI credits valid for current monthly cycle. Unused credits expire at the end of the monthly period.
                          </>
                        ) : (companyEntitlements?.activePlan && companyEntitlements.activePlan.daysRemaining > 0) ? (
                          <>
                            <strong style={{ color: "#0284c7" }}>
                              Synchronized with {companyEntitlements.activePlan.planName} ({companyEntitlements.activePlan.daysRemaining} Days remaining):
                            </strong>{" "}
                            Newly purchased {selectedItemForPurchase.quantity || 1} {selectedItemForPurchase.productName || selectedItemForPurchase.name || "item"}{selectedItemForPurchase.quantity > 1 ? "s" : ""} will be added on top of your current credits and will expire on{" "}
                            <strong>
                              {new Date(companyEntitlements.activePlan.endDate).toLocaleDateString("en-IN", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })}
                            </strong>{" "}
                            when your current plan expires.
                          </>
                        ) : !isLoggedIn ? (
                          <>
                            <strong style={{ color: "#0284c7" }}>Plan-Synchronized Validity:</strong>{" "}
                            The validity and duration of this item will be automatically synchronized with your active subscription plan
                          </>
                        ) : (selectedItemForPurchase.category === "JOB_POSTING" || selectedItemForPurchase.code?.includes("JOB") || selectedItemForPurchase.code?.includes("HOT")) ? (
                          <>
                            <strong>Job Posting Duration:</strong> Live duration is synchronized with your active subscription plan. Candidate applications remain accessible for 90 days.
                          </>
                        ) : (selectedItemForPurchase.category === "USER_SEATS" || selectedItemForPurchase.code?.includes("SEAT")) ? (
                          <>
                            <strong>Seat License Validity:</strong> Dedicated recruiter login license synchronized with your active subscription plan. Past jobs and CVs remain accessible in read-only mode for up to 90 days post-expiry.
                          </>
                        ) : (
                          <>
                            <strong>Resume Search Validity:</strong> Validity is synchronized with your active subscription plan. Saved candidate folders kept for 90 days.
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column: Price Calculation & Purchase Actions */}
                <div className="bo-purchase-col-right">
                  {(() => {
                    const pricing = getItemPricing(selectedItemForPurchase);

                    return (
                      <div className="bo-price-summary-box">
                        <div className="bo-price-calc-row">
                          <span>Base Price:</span>
                          <span>{formatCurrency(pricing.base)}</span>
                        </div>
                        {pricing.discount > 0 && (
                          <div className="bo-price-calc-row discount">
                            <span>Commercial Discount:</span>
                            <span>- {formatCurrency(pricing.discount)}</span>
                          </div>
                        )}
                        {pricing.discount > 0 && (
                          <div className="bo-price-calc-row">
                            <span>Taxable Amount:</span>
                            <span>{formatCurrency(pricing.currentPrice)}</span>
                          </div>
                        )}

                        {pricing.taxType === "IGST" ? (
                          <>
                            <div className="bo-price-calc-row">
                              <span>IGST ({pricing.igstRate}%):</span>
                              <span style={{ color: "#4338ca", fontWeight: 700 }}>+ {formatCurrency(pricing.igstAmount)}</span>
                            </div>
                            <div className="bo-price-calc-row" style={{ fontSize: "11px", color: "#64748b" }}>
                              <span>CGST (0%) / SGST (0%):</span>
                              <span>₹0.00 (Inter-state supply)</span>
                            </div>
                          </>
                        ) : pricing.taxType === "CGST_SGST" ? (
                          <>
                            <div className="bo-price-calc-row">
                              <span>CGST ({pricing.cgstRate}%):</span>
                              <span style={{ color: "#4338ca", fontWeight: 700 }}>+ {formatCurrency(pricing.cgstAmount)}</span>
                            </div>
                            <div className="bo-price-calc-row">
                              <span>SGST ({pricing.sgstRate}%):</span>
                              <span style={{ color: "#4338ca", fontWeight: 700 }}>+ {formatCurrency(pricing.sgstAmount)}</span>
                            </div>
                            <div className="bo-price-calc-row" style={{ fontSize: "11px", color: "#64748b" }}>
                              <span>IGST (0%):</span>
                              <span>₹0.00 (Intra-state supply)</span>
                            </div>
                          </>
                        ) : pricing.taxAmount > 0 ? (
                          <div className="bo-price-calc-row">
                            <span>GST ({pricing.taxPercent}%):</span>
                            <span>+ {formatCurrency(pricing.taxAmount)}</span>
                          </div>
                        ) : null}

                        <div className="bo-price-calc-row total">
                          <span>Total Payable Amount:</span>
                          <span className="bo-price-total-val">{formatCurrency(pricing.total)}</span>
                        </div>
                      </div>
                    );
                  })()}

                  <div style={{ fontSize: "11px", color: "#94a3b8", lineHeight: 1.45 }}>
                    By confirming purchase, you agree to Maven Jobs Commercial Terms. Credits are immediately activated upon successful payment.
                  </div>

                  <div className="bo-modal-actions" style={{ marginTop: "4px", paddingTop: "14px" }}>
                    <button
                      type="button"
                      onClick={() => setIsPurchaseModalOpen(false)}
                      className="bo-btn-secondary"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={paymentLoading}
                      onClick={handleExecutePayment}
                      className="bo-btn-buy bo-btn-auto"
                      style={{ flex: "1" }}
                    >
                      {paymentLoading ? (
                        <>
                          <FiRefreshCw className="bo-spinner" style={{ width: "16px", height: "16px" }} /> Processing...
                        </>
                      ) : (
                        <>Proceed to Payment & Activate</>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Purchase Success Confirmation Modal */}
      {isSuccessModalOpen && purchaseSuccessData && (
        <div className="bo-modal-backdrop">
          <div className="bo-modal-box bo-modal-md" style={{ textAlign: "center" }}>
            <div className="bo-success-icon-wrap">
              <FiCheckCircle style={{ width: "32px", height: "32px" }} />
            </div>

            <h3 className="bo-modal-title bo-title-font">
              Purchase Successful! 🎉
            </h3>
            <p style={{ fontSize: "12px", color: "#64748b", marginTop: "8px" }}>
              Your <strong>{purchaseSuccessData.item?.name}</strong> has been activated and added to your commercial entitlement registry.
            </p>

            <div className="bo-success-details-box">
              <div className="bo-success-row">
                <span style={{ color: "#94a3b8" }}>Item:</span>
                <span style={{ fontWeight: 700, color: "#1e293b" }}>{purchaseSuccessData.item?.name}</span>
              </div>
              <div className="bo-success-row">
                <span style={{ color: "#94a3b8" }}>Allocated Quantity:</span>
                <span style={{ fontWeight: 700, color: "#4338ca" }}>
                  {purchaseSuccessData.item?.quantity} {purchaseSuccessData.item?.unit || "Credit"}s
                </span>
              </div>
              <div className="bo-success-row">
                <span style={{ color: "#94a3b8" }}>Status:</span>
                <span style={{ fontWeight: 700, color: "#059669" }}>Active</span>
              </div>
              {(() => {
                const expiryDateVal =
                  purchaseSuccessData.details?.expiryDate ||
                  purchaseSuccessData.details?.subscription?.endDate;
                if (!expiryDateVal) return null;
                const formattedDate = new Date(expiryDateVal).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                });
                const isAddOn = Boolean(
                  purchaseSuccessData.details?.isAddOn ||
                  purchaseSuccessData.details?.subscription?.subscriptionType === "ADD_ON"
                );
                return (
                  <div className="bo-success-row">
                    <span style={{ color: "#94a3b8" }}>Valid Until:</span>
                    <span style={{ fontWeight: 700, color: "#1e293b" }}>
                      {formattedDate} {isAddOn ? "(Synced with active plan)" : ""}
                    </span>
                  </div>
                );
              })()}
              <div className="bo-success-row">
                <span style={{ color: "#94a3b8" }}>Order ID:</span>
                <span style={{ fontFamily: "monospace", color: "#1e293b", fontWeight: 700, fontSize: "12px" }}>
                  {purchaseSuccessData.details?.order?.orderNumber ||
                   purchaseSuccessData.details?.subscription?.orderNumber ||
                   purchaseSuccessData.orderNumber ||
                   "—"}
                </span>
              </div>
              <div className="bo-success-row">
                <span style={{ color: "#94a3b8" }}>Payment ID:</span>
                <span style={{ fontFamily: "monospace", color: "#002366", fontWeight: 700, fontSize: "12px" }}>
                  {purchaseSuccessData.details?.payment?.paymentId ||
                   purchaseSuccessData.details?.subscription?.paymentId ||
                   purchaseSuccessData.details?.payment?.gatewayPaymentId ||
                   purchaseSuccessData.razorpayPaymentId ||
                   purchaseSuccessData.details?.transactionId ||
                   "—"}
                </span>
              </div>
            </div>

            <div style={{
              backgroundColor: "#f0fdf4",
              border: "1px solid #bbf7d0",
              borderRadius: "10px",
              padding: "10px 14px",
              marginBottom: "16px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              textAlign: "left",
            }}>
              <FiCheckCircle style={{ width: "16px", height: "16px", color: "#16a34a", flexShrink: 0 }} />
              <span style={{ fontSize: "12px", color: "#166534", lineHeight: 1.4 }}>
                An order confirmation email with your tax invoice and service entitlements has been sent to your registered email address.
              </span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <button
                onClick={() => {
                  setIsSuccessModalOpen(false);
                  navigate("/post-job");
                }}
                className="bo-btn-buy"
              >
                Post a Job Now
              </button>
              <button
                onClick={() => {
                  setIsSuccessModalOpen(false);
                  navigate("/employer-dashboard");
                }}
                className="bo-btn-contact"
              >
                Go to Recruiter Dashboard
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Contact Sales Modal */}
      {isSalesModalOpen && (
        <div
          className="bo-modal-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsSalesModalOpen(false);
          }}
        >
          <div className="bo-sales-modal-box">
            {/* Header */}
            <div className="bo-sales-modal-header">
              <div>
                <h3 className="bo-sales-modal-title">
                  Contact sales
                </h3>
                <p className="bo-sales-modal-subtitle">
                  Fill this form and we’ll get back to you.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsSalesModalOpen(false)}
                className="bo-sales-close-btn"
                aria-label="Close dialog"
              >
                <FiX style={{ width: "20px", height: "20px" }} />
              </button>
            </div>

            {salesSuccess ? (
              <div className="bo-sales-success-state">
                <div className="bo-sales-success-icon">
                  <FiCheckCircle style={{ width: "42px", height: "42px", color: "#16a34a" }} />
                </div>
                <h4 className="bo-sales-success-title">Thank you!</h4>
                <p className="bo-sales-success-desc">
                  Your inquiry has been received. Our sales specialist will get back to you shortly.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSalesSubmit} className="bo-sales-form">
                {/* 1. Full name */}
                <div className="bo-sales-field">
                  <label className="bo-sales-label">Full name</label>
                  <input
                    type="text"
                    required
                    placeholder="Enter your name"
                    value={salesForm.fullName}
                    onChange={(e) => setSalesForm({ ...salesForm, fullName: e.target.value })}
                    className="bo-sales-input"
                  />
                </div>

                {/* 2. Mobile number */}
                <div className="bo-sales-field">
                  <label className="bo-sales-label">Mobile number</label>
                  <input
                    type="tel"
                    required
                    placeholder="Enter mobile number"
                    value={salesForm.mobileNumber}
                    onChange={(e) => setSalesForm({ ...salesForm, mobileNumber: e.target.value })}
                    className="bo-sales-input"
                  />
                </div>

                {/* 3. Company/Consultancy name */}
                <div className="bo-sales-field">
                  <label className="bo-sales-label">Company/Consultancy name</label>
                  <input
                    type="text"
                    required
                    placeholder="Enter your company/consultancy name"
                    value={salesForm.companyName}
                    onChange={(e) => setSalesForm({ ...salesForm, companyName: e.target.value })}
                    className="bo-sales-input"
                  />
                </div>

                {/* 4. Hiring for */}
                <div className="bo-sales-field">
                  <label className="bo-sales-label">Hiring for</label>
                  <div className="bo-sales-radios">
                    <label className="bo-sales-radio-item">
                      <input
                        type="radio"
                        name="hiringFor"
                        value="your company"
                        checked={salesForm.hiringFor === "your company"}
                        onChange={(e) => setSalesForm({ ...salesForm, hiringFor: e.target.value })}
                        className="bo-sales-radio-native"
                      />
                      <span className="bo-sales-radio-circle">
                        {salesForm.hiringFor === "your company" && <span className="bo-sales-radio-dot" />}
                      </span>
                      <span className="bo-sales-radio-text">your company</span>
                    </label>

                    <label className="bo-sales-radio-item">
                      <input
                        type="radio"
                        name="hiringFor"
                        value="a consultancy"
                        checked={salesForm.hiringFor === "a consultancy"}
                        onChange={(e) => setSalesForm({ ...salesForm, hiringFor: e.target.value })}
                        className="bo-sales-radio-native"
                      />
                      <span className="bo-sales-radio-circle">
                        {salesForm.hiringFor === "a consultancy" && <span className="bo-sales-radio-dot" />}
                      </span>
                      <span className="bo-sales-radio-text">a consultancy</span>
                    </label>
                  </div>
                </div>

                {/* 5. Number of employees */}
                <div className="bo-sales-field">
                  <label className="bo-sales-label">Number of employees</label>
                  <div className="bo-sales-select-wrap">
                    <select
                      required
                      value={salesForm.employeeRange}
                      onChange={(e) => setSalesForm({ ...salesForm, employeeRange: e.target.value })}
                      className="bo-sales-select"
                    >
                      <option value="" disabled>Select range</option>
                      <option value="1-15">1-15</option>
                      <option value="16-50">16-50</option>
                      <option value="51-200">51-200</option>
                      <option value="201-500">201-500</option>
                      <option value="500+">500+</option>
                    </select>
                    <FiChevronDown className="bo-sales-select-chevron" />
                  </div>
                </div>

                {/* 6. Designation name */}
                <div className="bo-sales-field">
                  <label className="bo-sales-label">Designation name</label>
                  <input
                    type="text"
                    required
                    placeholder="Enter your designation"
                    value={salesForm.designation}
                    onChange={(e) => setSalesForm({ ...salesForm, designation: e.target.value })}
                    className="bo-sales-input"
                  />
                </div>

                {/* 7. Work email ID */}
                <div className="bo-sales-field">
                  <label className="bo-sales-label">Work email ID</label>
                  <input
                    type="email"
                    required
                    placeholder="Enter your email ID"
                    value={salesForm.workEmail}
                    onChange={(e) => setSalesForm({ ...salesForm, workEmail: e.target.value })}
                    className="bo-sales-input"
                  />
                </div>

                {/* 8. City */}
                <div className="bo-sales-field">
                  <label className="bo-sales-label">City</label>
                  <input
                    type="text"
                    required
                    placeholder="Enter your city name"
                    value={salesForm.city}
                    onChange={(e) => setSalesForm({ ...salesForm, city: e.target.value })}
                    className="bo-sales-input"
                  />
                </div>

                {/* Extensible Fields Section: "+ can add more also if needed" */}
                {showExtraFields && (
                  <div className="bo-sales-extra-section">
                    <div className="bo-sales-field">
                      <label className="bo-sales-label">Requirement details or notes (Optional)</label>
                      <textarea
                        rows="2"
                        placeholder="Mention any custom seat requirements, candidate criteria, or urgency..."
                        value={salesForm.notes}
                        onChange={(e) => setSalesForm({ ...salesForm, notes: e.target.value })}
                        className="bo-sales-input bo-sales-textarea"
                      />
                    </div>

                    {salesForm.extraFields.map((field) => (
                      <div key={field.id} className="bo-sales-custom-field-row">
                        <input
                          type="text"
                          placeholder="Field name (e.g. Budget)"
                          value={field.label}
                          onChange={(e) => handleExtraFieldChange(field.id, "label", e.target.value)}
                          className="bo-sales-input"
                          style={{ flex: 1 }}
                        />
                        <input
                          type="text"
                          placeholder="Value"
                          value={field.value}
                          onChange={(e) => handleExtraFieldChange(field.id, "value", e.target.value)}
                          className="bo-sales-input"
                          style={{ flex: 1.5 }}
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveExtraField(field.id)}
                          className="bo-sales-field-remove-btn"
                          title="Remove field"
                        >
                          <FiTrash2 style={{ width: "15px", height: "15px" }} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="bo-sales-add-field-action">
                  <button
                    type="button"
                    onClick={handleAddExtraField}
                    className="bo-sales-add-field-btn"
                  >
                    <FiPlus style={{ width: "14px", height: "14px" }} />
                    {showExtraFields ? "Add another field" : "+ Add more fields or notes"}
                  </button>
                </div>

                {/* 9. reCAPTCHA Verification Box */}
                <div className="bo-sales-recaptcha-card">
                  <div className="bo-recaptcha-left">
                    <div
                      className={`bo-recaptcha-checkbox-label ${captchaLoading ? "loading" : ""}`}
                      onClick={handleCaptchaClick}
                      role="checkbox"
                      aria-checked={salesForm.isVerified}
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          handleCaptchaClick();
                        }
                      }}
                    >
                      <span
                        className={`bo-recaptcha-box-indicator ${
                          captchaLoading ? "loading" : salesForm.isVerified ? "checked" : ""
                        }`}
                      >
                        {captchaLoading ? (
                          <span className="bo-recaptcha-spinner" />
                        ) : salesForm.isVerified ? (
                          <FiCheck className="bo-recaptcha-check-icon" />
                        ) : null}
                      </span>
                      <span className="bo-recaptcha-text">I'm not a robot</span>
                    </div>
                    <span className="bo-recaptcha-quota-subtext">
                      This site is exceeding reCAPTCHA Enterprise free quota.
                    </span>
                  </div>

                  <div className="bo-recaptcha-right">
                    <svg className="bo-recaptcha-badge-icon" viewBox="0 0 48 48" fill="none">
                      <path
                        d="M24 6C14.059 6 6 14.059 6 24h4c0-7.732 6.268-14 14-14 3.866 0 7.368 1.567 9.899 4.101L30 22h14V8l-5.657 5.657C34.735 9.89 29.63 6 24 6z"
                        fill="#1a73e8"
                      />
                      <path
                        d="M24 42c9.941 0 18-8.059 18-18h-4c0 7.732-6.268 14-14 14-3.866 0-7.368-1.567-9.899-4.101L18 26H4v14l5.657-5.657C13.265 38.11 18.37 42 24 42z"
                        fill="#34a853"
                      />
                    </svg>
                    <span className="bo-recaptcha-badge-title">reCAPTCHA</span>
                    <span className="bo-recaptcha-badge-legal">Privacy - Terms</span>
                  </div>
                </div>

                {/* 10. Submit now button */}
                <button
                  type="submit"
                  disabled={salesSubmitted || !salesForm.isVerified || captchaLoading}
                  className="bo-sales-submit-btn"
                >
                  {salesSubmitted ? (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
                      <FiRefreshCw className="bo-spinner" style={{ width: "16px", height: "16px" }} />
                      Submitting...
                    </span>
                  ) : (
                    "Submit now"
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <EmployerFooter />

      {/* Employer Login Gate Modal — Always on top of all modals */}
      <EmployerLoginModal
        isOpen={isLoginGateOpen}
        context="purchase"
        zIndex={999999}
        onClose={() => {
          setIsLoginGateOpen(false);
        }}
        onLoginSuccess={handleLoginSuccess}
      />
    </div>
  );
}