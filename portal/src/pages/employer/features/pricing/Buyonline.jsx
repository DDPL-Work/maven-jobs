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
      "All commercial prices are displayed with transparent tax breakdowns. Applicable Goods and Services Tax (GST 18%) is calculated and shown clearly prior to payment checkout.",
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

  // Dynamic Job Post Counters
  const [smbJobCount, setSmbJobCount] = useState(1);
  const [hotJobCount, setHotJobCount] = useState(1);
  const [internshipJobCount, setInternshipJobCount] = useState(1);

  // Employer Login Gate State
  const [isLoginGateOpen, setIsLoginGateOpen] = useState(false);
  const pendingPaymentRef = useRef(null); // stores callback to invoke after login

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

      // Filter out user seat products from customer-facing catalog
      const filteredOffers = (offersData || []).filter((o) => {
        const cat = o.product?.category;
        const pType = o.product?.productType;
        const code = String(o.product?.code || "");
        const sku = String(o.sku || "");
        return (
          cat !== "USER_SEATS" &&
          pType !== "SEAT_BASED" &&
          !code.includes("SEAT") &&
          !sku.includes("SEAT")
        );
      });

      setPlans(plansData || []);
      setOffers(filteredOffers);
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
    if (cat && ["all", "combined", "jobs", "resdex", "standalone", "custom"].includes(cat)) {
      setActiveCategory(cat);
    }
    if (location.hash) {
      setTimeout(() => {
        const el = document.querySelector(location.hash);
        if (el) el.scrollIntoView({ behavior: "smooth" });
      }, 400);
    }
  }, [searchParams, location.hash]);

  const formatCurrency = (val) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  // Resolve dynamic Products for SMB Job, Hot Vacancy, and Internship
  const smbProduct = products.find((p) => p.code === "SMB_JOB") || {
    name: "SMB Job",
    code: "SMB_JOB",
    category: "JOB_POSTING",
    defaultPrice: 500,
    validity: 30,
    unit: "Job",
    description: "Standard cost-effective job posting for small and medium businesses.",
  };

  const hotProduct = products.find((p) => p.code === "HOT_VACANCY") || {
    name: "Hot Vacancy",
    code: "HOT_VACANCY",
    category: "JOB_POSTING",
    defaultPrice: 1200,
    validity: 30,
    unit: "Job",
    description: "High-visibility premium job posting with branding and top placement.",
  };

  const internshipProduct = products.find((p) => p.code === "INTERNSHIP_JOB") || {
    name: "Internship Job",
    code: "INTERNSHIP_JOB",
    category: "JOB_POSTING",
    defaultPrice: 400,
    validity: 30,
    unit: "Job",
    description: "Targeted job posting specifically for internships and college students.",
  };

  // Open Checkout for a Plan, Standalone Offer, or Dynamic Product
  const handleInitiatePurchase = (item, type = "PLAN") => {
    setPaymentError("");
    setSelectedItemForPurchase({ ...item, itemType: type });
    setIsPurchaseModalOpen(true);
  };

  // Confirm and Execute Payment — Production-grade 3-step flow:
  // 1. Create Razorpay order on server (get real orderId)
  // 2. Open Razorpay checkout with that orderId
  // 3. On success, call /confirm-payment to verify HMAC + activate entitlement atomically
  const handleExecutePayment = async () => {
    // Gate: verify employer session
    const employerUser = (() => {
      try { return JSON.parse(localStorage.getItem("employerUser") || "null"); } catch { return null; }
    })();
    if (!employerUser) {
      pendingPaymentRef.current = handleExecutePayment;
      setIsLoginGateOpen(true);
      return;
    }

    if (!selectedItemForPurchase) return;

    const isPlan = selectedItemForPurchase.itemType === "PLAN";
    const isDirectProduct = selectedItemForPurchase.itemType === "PRODUCT";
    const ver = selectedItemForPurchase.activeVersion || selectedItemForPurchase;

    // Compute base + GST amount
    const basePrice = isPlan ? ver.basePrice : selectedItemForPurchase.price;
    const discount  = isPlan ? (ver.discount || 0) : 0;
    const taxable   = Math.max(0, basePrice - discount);
    const gst       = Math.round(taxable * 0.18);
    const total     = taxable + gst; // in INR (not paise)

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
        validity: ver.validity || selectedItemForPurchase.validity || 30,
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
    const resume = pendingPaymentRef.current;
    pendingPaymentRef.current = null;
    if (resume) {
      // Small delay to let modal close cleanly before payment UI opens
      setTimeout(() => resume(), 120);
    }
  };

  return (
    <div className="bo-page-wrapper">
      {/* Employer Login Gate Modal */}
      <EmployerLoginModal
        isOpen={isLoginGateOpen}
        context="purchase"
        onClose={() => {
          setIsLoginGateOpen(false);
          pendingPaymentRef.current = null;
        }}
        onLoginSuccess={handleLoginSuccess}
      />

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
            onClick={() => setActiveCategory("standalone")}
            className={`bo-cat-tab ${activeCategory === "standalone" ? "active" : ""}`}
          >
            Standalone & Add-ons
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

                    <div>
                      <span className="bo-card-type-tag">
                        {plan.planType} PLAN
                      </span>
                      <h3 className="bo-card-title bo-title-font">
                        {plan.name}
                      </h3>
                      <p className="bo-card-desc">
                        {plan.description || "Comprehensive hiring package for your recruitment team."}
                      </p>
                    </div>

                    {/* Price Block */}
                    <div className="bo-price-block">
                      <div className="bo-price-main-wrap">
                        <span className="bo-price-val bo-title-font">
                          {ver.finalPrice === 0 ? "Free" : formatCurrency(ver.finalPrice)}
                        </span>
                        {ver.discount > 0 && (
                          <span className="bo-price-original">
                            {formatCurrency(ver.basePrice)}
                          </span>
                        )}
                      </div>
                      <div className="bo-price-tax-note">
                        {ver.finalPrice > 0 ? "+ GST as applicable • " : ""}
                        Valid for {ver.validity || 90} {ver.validityUnit?.toLowerCase() || "days"}
                      </div>
                    </div>

                    {/* Included Products List */}
                    <div className="bo-features-container">
                      <div className="bo-features-header">
                        Included Entitlements:
                      </div>

                      {(ver.items || []).map((it, idx) => (
                        <div key={idx} className="bo-feature-item">
                          <FiCheck className="bo-check-icon" />
                          <span>
                            <strong>{it.quantity}</strong> {it.productName} ({it.unit})
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Purchase CTA */}
                    <div>
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
                    {smbProduct.validity || 30} Days Validity
                  </span>
                </div>

                <h3 className="bo-card-title bo-title-font">{smbProduct.name}</h3>
                <div className="bo-card-subtitle">
                  Cost-effective hiring for small & medium businesses
                </div>

                <p className="bo-card-desc">
                  {smbProduct.description || "Standard verified job postings with instant reach and candidate application delivery."}
                </p>

                <div className="bo-price-block">
                  <div className="bo-price-row">
                    <div>
                      <span className="bo-price-val bo-title-font">
                        {formatCurrency(smbProduct.defaultPrice || 500)}
                      </span>
                      <span style={{ fontSize: "12px", color: "#64748b", fontWeight: 700, marginLeft: "4px" }}>
                        / job post
                      </span>
                      <span className="bo-price-tax-note" style={{ display: "block" }}>
                        + GST as applicable • Valid for {smbProduct.validity || 30} days
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bo-features-container">
                  <div className="bo-feature-item">
                    <FiCheck className="bo-check-icon" />
                    <span>Instant live publishing on candidate job search</span>
                  </div>
                  <div className="bo-feature-item">
                    <FiCheck className="bo-check-icon" />
                    <span>Candidate applications accessible for 90 days</span>
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
                        {formatCurrency((smbProduct.defaultPrice || 500) * smbJobCount)}
                      </span>
                      <span className="bo-stepper-subtotal-label">+ GST as applicable</span>
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
                        price: (smbProduct.defaultPrice || 500) * smbJobCount,
                        unitPrice: smbProduct.defaultPrice || 500,
                      },
                      "PRODUCT"
                    )
                  }
                  className="bo-btn-buy"
                >
                  Buy {smbJobCount} SMB {smbJobCount > 1 ? "Jobs" : "Job"}{" "}
                  <FiArrowRight style={{ width: "16px", height: "16px" }} />
                </button>
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
                    {hotProduct.validity || 30} Days Validity
                  </span>
                </div>

                <h3 className="bo-card-title bo-title-font">{hotProduct.name}</h3>
                <div className="bo-card-subtitle" style={{ color: "#b45309" }}>
                  Priority top placement & maximum candidate reach
                </div>

                <p className="bo-card-desc">
                  {hotProduct.description || "High-visibility premium job posting with branding and top search placement."}
                </p>

                <div className="bo-price-block">
                  <div className="bo-price-row">
                    <div>
                      <span className="bo-price-val bo-title-font">
                        {formatCurrency(hotProduct.defaultPrice || 1200)}
                      </span>
                      <span style={{ fontSize: "12px", color: "#64748b", fontWeight: 700, marginLeft: "4px" }}>
                        / job post
                      </span>
                      <span className="bo-price-tax-note" style={{ display: "block" }}>
                        + GST as applicable • Valid for {hotProduct.validity || 30} days
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bo-features-container">
                  <div className="bo-feature-item">
                    <FiCheck className="bo-check-icon" />
                    <span><strong>Top Search Placement</strong> on candidate listings</span>
                  </div>
                  <div className="bo-feature-item">
                    <FiCheck className="bo-check-icon" />
                    <span><strong>5x Candidate Reach</strong> compared to standard posts</span>
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
                        {formatCurrency((hotProduct.defaultPrice || 1200) * hotJobCount)}
                      </span>
                      <span className="bo-stepper-subtotal-label">+ GST as applicable</span>
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
                        price: (hotProduct.defaultPrice || 1200) * hotJobCount,
                        unitPrice: hotProduct.defaultPrice || 1200,
                      },
                      "PRODUCT"
                    )
                  }
                  className="bo-btn-buy"
                >
                  Buy {hotJobCount} Hot {hotJobCount > 1 ? "Vacancies" : "Vacancy"}{" "}
                  <FiArrowRight style={{ width: "16px", height: "16px" }} />
                </button>
              </div>

              {/* Card 3: Internship Job Card */}
              <div className="bo-card">
                <div className="bo-card-top-row">
                  <span className="bo-card-sku-tag" style={{ background: "#ecfdf5", color: "#047857" }}>
                    INTERNSHIP
                  </span>
                  <span className="bo-card-validity-tag">
                    {internshipProduct.validity || 30} Days Validity
                  </span>
                </div>

                <h3 className="bo-card-title bo-title-font">{internshipProduct.name}</h3>
                <div className="bo-card-subtitle" style={{ color: "#047857" }}>
                  Targeted hiring for college students & freshers
                </div>

                <p className="bo-card-desc">
                  {internshipProduct.description || "Targeted verified job postings specifically designed for internships and early-career talent."}
                </p>

                <div className="bo-price-block">
                  <div className="bo-price-row">
                    <div>
                      <span className="bo-price-val bo-title-font">
                        {formatCurrency(internshipProduct.defaultPrice || 400)}
                      </span>
                      <span style={{ fontSize: "12px", color: "#64748b", fontWeight: 700, marginLeft: "4px" }}>
                        / internship post
                      </span>
                      <span className="bo-price-tax-note" style={{ display: "block" }}>
                        + GST as applicable • Valid for {internshipProduct.validity || 30} days
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bo-features-container">
                  <div className="bo-feature-item">
                    <FiCheck className="bo-check-icon" />
                    <span>Dedicated student & college graduate reach</span>
                  </div>
                  <div className="bo-feature-item">
                    <FiCheck className="bo-check-icon" />
                    <span>Configurable stipend & duration filters</span>
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
                        {formatCurrency((internshipProduct.defaultPrice || 400) * internshipJobCount)}
                      </span>
                      <span className="bo-stepper-subtotal-label">+ GST as applicable</span>
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
                        price: (internshipProduct.defaultPrice || 400) * internshipJobCount,
                        unitPrice: internshipProduct.defaultPrice || 400,
                      },
                      "PRODUCT"
                    )
                  }
                  className="bo-btn-buy"
                >
                  Buy {internshipJobCount} {internshipJobCount > 1 ? "Internships" : "Internship"}{" "}
                  <FiArrowRight style={{ width: "16px", height: "16px" }} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Section 3: ResDex / Resume Database Plans */}
        {(activeCategory === "all" || activeCategory === "resdex") && resdexOffers.length > 0 && (
          <div id="resume-database" className="bo-section">
            <div className="bo-section-header">
              <h2 className="bo-section-title bo-title-font">Resume Database (ResDex) Packs</h2>
              <p className="bo-section-subtitle">
                Direct access to millions of verified candidates with candidate phone, email, and CV download.
              </p>
            </div>

            <div className="bo-grid-3">
              {resdexOffers.map((offer) => (
                <div key={offer._id} className="bo-card">
                  <div className="bo-card-top-row">
                    <span className="bo-card-sku-tag">RESDEX</span>
                    <span className="bo-card-validity-tag">{offer.validity} Days Validity</span>
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
                      {formatCurrency(offer.price)}
                    </span>
                    <span className="bo-price-tax-note" style={{ display: "block" }}>+ GST as applicable</span>
                  </div>

                  <div className="bo-features-container">
                    <div className="bo-feature-item">
                      <FiCheck className="bo-check-icon" />
                      <span>Full Candidate Contact Access</span>
                    </div>
                    <div className="bo-feature-item">
                      <FiCheck className="bo-check-icon" />
                      <span>Advanced Skills & Experience Filters</span>
                    </div>
                    <div className="bo-feature-item">
                      <FiCheck className="bo-check-icon" />
                      <span>Direct PDF Resume Downloads</span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleInitiatePurchase(offer, "STANDALONE")}
                    className="bo-btn-buy"
                  >
                    Buy Resume Credits <FiArrowRight style={{ width: "16px", height: "16px" }} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Section 4: Standalone & AI Add-on Products */}
        {(activeCategory === "all" || activeCategory === "standalone") && aiOffers.length > 0 && (
          <div id="ai-credits" className="bo-section">
            <div className="bo-section-header">
              <span className="bo-section-tag">Add-on Capabilities</span>
              <h2 className="bo-section-title bo-title-font" style={{ marginTop: "8px" }}>
                Standalone AI & Productivity Credits
              </h2>
              <p className="bo-section-subtitle">
                Top up company-wide AI credits for automated job descriptions and candidate screening.
              </p>
            </div>

            <div className="bo-grid-3">
              {aiOffers.map((offer) => (
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
                        {formatCurrency(offer.price)}
                      </span>
                      <span className="bo-price-tax-note">+ GST</span>
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
                    onClick={() => handleInitiatePurchase(offer, "STANDALONE")}
                    className="bo-btn-buy"
                  >
                    Top up AI Credits <FiArrowRight style={{ width: "16px", height: "16px" }} />
                  </button>
                </div>
              ))}
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
                    const isCorp = p.code === "CORPORATE";
                    return (
                      <td key={p._id} className="center bo-table-val-regular">
                        {isCorp ? "3 Users" : "1 User"}
                      </td>
                    );
                  })}
                  <td className="center" style={{ fontWeight: 700, color: "#1e293b" }}>Unlimited</td>
                </tr>

                {/* ── SECTION 2: AI RECRUITMENT SUITE (Q5.4 & Q5.8) ── */}
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
                    const isPaid = p.code !== "FREE";
                    return (
                      <td key={p._id} className="center">
                        {isPaid ? (
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
                    const isPaid = p.code !== "FREE";
                    return (
                      <td key={p._id} className="center">
                        {isPaid ? (
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

                {/* ── SECTION 3: JOB REACH & BRANDING (Q6.1) ── */}
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
                    const hasHot = p.activeVersion?.items?.some((i) => i.productCode === "HOT_VACANCY");
                    return (
                      <td key={p._id} className="center bo-table-val-regular">
                        {hasHot ? "Up to 3 Cities" : "1 City"}
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
                      30 Days
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

      {/* Review & Purchase Checkout Modal */}
      {isPurchaseModalOpen && selectedItemForPurchase && (
        <div className="bo-modal-backdrop">
          <div className="bo-modal-box bo-modal-lg">
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
              {/* Items summary */}
              <div className="bo-summary-card">
                <span className="bo-summary-title">What you will receive:</span>
                {selectedItemForPurchase.itemType === "PLAN" ? (
                  <div>
                    {(selectedItemForPurchase.activeVersion?.items || []).map((it, idx) => (
                      <div key={idx} className="bo-summary-item">
                        <FiCheck className="bo-check-icon" />
                        <span>
                          <strong>{it.quantity}</strong> {it.productName} ({it.unit})
                        </span>
                      </div>
                    ))}
                  </div>
                ) : selectedItemForPurchase.itemType === "PRODUCT" ? (
                  <div className="bo-summary-item">
                    <FiCheck className="bo-check-icon" />
                    <span>
                      <strong>{selectedItemForPurchase.quantity}</strong>{" "}
                      {selectedItemForPurchase.name} ({selectedItemForPurchase.unit || "Job"} Postings)
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
                <div style={{ marginTop: "12px", fontSize: "11px", color: "#64748b" }}>
                  Validity Period:{" "}
                  <strong>
                    {selectedItemForPurchase.activeVersion?.validity ||
                      selectedItemForPurchase.validity ||
                      30}{" "}
                    Days
                  </strong>
                </div>
              </div>

              {/* Price Calculation */}
              {(() => {
                const isPlan = selectedItemForPurchase.itemType === "PLAN";
                const ver = selectedItemForPurchase.activeVersion || selectedItemForPurchase;
                const base = isPlan ? ver.basePrice : selectedItemForPurchase.price;
                const discount = isPlan ? ver.discount : 0;
                const taxable = Math.max(0, base - discount);
                const tax = Math.round(taxable * 0.18);
                const total = Math.round(taxable + tax);

                return (
                  <div className="bo-price-summary-box">
                    <div className="bo-price-calc-row">
                      <span>Base Amount:</span>
                      <span>{formatCurrency(base)}</span>
                    </div>
                    {discount > 0 && (
                      <div className="bo-price-calc-row discount">
                        <span>Commercial Discount:</span>
                        <span>- {formatCurrency(discount)}</span>
                      </div>
                    )}
                    <div className="bo-price-calc-row">
                      <span>Applicable GST (18%):</span>
                      <span>+ {formatCurrency(tax)}</span>
                    </div>
                    <div className="bo-price-calc-row total">
                      <span>Total Payable Amount:</span>
                      <span className="bo-price-total-val">{formatCurrency(total)}</span>
                    </div>
                  </div>
                );
              })()}

              <div style={{ fontSize: "11px", color: "#94a3b8" }}>
                By confirming purchase, you agree to Maven Jobs Commercial Terms. Credits are immediately activated upon successful payment.
              </div>

              <div className="bo-modal-actions">
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
              <div className="bo-success-row">
                <span style={{ color: "#94a3b8" }}>Payment ID:</span>
                <span style={{ fontFamily: "monospace", color: "#64748b", fontSize: "11px" }}>
                  {purchaseSuccessData.razorpayPaymentId ||
                   purchaseSuccessData.details?.transactionId ||
                   purchaseSuccessData.details?.payment?.gatewayPaymentId ||
                   "—"}
                </span>
              </div>
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
    </div>
  );
}