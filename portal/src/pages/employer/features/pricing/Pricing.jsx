import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FiZap, FiCheckCircle, FiArrowLeft, FiBriefcase, FiInfo, FiChevronRight, FiClock, FiAlertCircle, FiCreditCard, FiTrendingUp, FiShoppingCart, FiRefreshCw, FiSearch, FiDownload, FiBarChart2 } from "react-icons/fi";
import authService from "../../../../services/authService";
import paymentService from "../../../../services/paymentService";

const C = {
  navy: "#002366", navyD: "#001540", navyM: "#1a3a6e",
  green: "#10b981", greenD: "#059669",
  indigo: "#6366f1", amber: "#f59e0b", sky: "#0ea5e9",
  red: "#ef4444", purple: "#8b5cf6",
  s50: "#f8fafc", s100: "#f1f5f9", s200: "#e2e8f0",
  s300: "#cbd5e1", s400: "#94a3b8", s500: "#64748b",
  s600: "#475569", s700: "#334155", s800: "#1e293b", s900: "#0f172a",
  fd: "'Bricolage Grotesque',sans-serif",
  dm: "'DM Sans',sans-serif",
};

const PACKAGES = [
  {
    key: "STANDARD", name: "Job Package 1", posts: 5, price: 199,
    color: C.amber, gradient: "linear-gradient(135deg,#fbbf24,#f59e0b)",
    features: [
      "5 active job postings",
      "30 days listing per job",
      "Basic candidate matching",
      "Email notifications",
      "Standard support",
    ],
    desc: "Best for startups testing the platform",
  },
  {
    key: "PREMIUM", name: "Job Package 2", posts: 12, price: 349,
    color: C.navy, gradient: "linear-gradient(135deg,#002366,#1a3a6e)",
    popular: true,
    features: [
      "12 active job postings",
      "45 days listing per job",
      "AI-powered candidate matching",
      "Priority email & phone support",
      "Resdex database access",
      "Applicant tracking",
    ],
    desc: "Most popular for growing teams",
  },
  {
    key: "ELITE", name: "Job Package 3", posts: 20, price: 599,
    color: C.purple, gradient: "linear-gradient(135deg,#8b5cf6,#6d28d9)",
    features: [
      "20 active job postings",
      "60 days listing per job",
      "Advanced AI matching",
      "Dedicated account manager",
      "Unlimited Resdex access",
      "Premium analytics & insights",
      "Priority 24/7 support",
    ],
    desc: "For high-volume enterprise hiring",
  },
];

function loadRazorpay() {
  return new Promise((resolve, reject) => {
    if (window.Razorpay) return resolve(window.Razorpay);
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.async = true;
    s.onload = () => resolve(window.Razorpay);
    s.onerror = () => reject(new Error("Failed to load Razorpay"));
    document.body.appendChild(s);
  });
}

export default function Pricing() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [company, setCompany] = useState(null);
  const [activeRequest, setActiveRequest] = useState(null);
  const [canRequest, setCanRequest] = useState(true);
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [creditData, setCreditData] = useState(null);
  const [topupLoading, setTopupLoading] = useState(false);
  const [creditHistory, setCreditHistory] = useState([]);
  const [txPage, setTxPage] = useState(1);
  const [txTotalPages, setTxTotalPages] = useState(1);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const raw = localStorage.getItem("employerUser");
        if (active) setUser(raw ? JSON.parse(raw) : null);
        const res = await authService.getEmployerDashboard();
        if (!active) return;
        const data = res?.data || res || {};
        setCompany(data?.company || null);
        setActiveRequest(data?.packageChange?.activeRequest || null);
        setCanRequest(data?.packageChange?.canRequestNewChange ?? true);
        try {
          const cr = await authService.getCredits();
          if (active && cr?.success) setCreditData(cr.data);
        } catch {}
      } catch {}
      if (active) setLoading(false);
    })();
    return () => { active = false; };
  }, []);

  const loadCreditHistory = async (page = 1) => {
    try {
      const res = await authService.getCreditHistory({ page, limit: 10 });
      if (res?.success) {
        setCreditHistory(res.data || []);
        setTxPage(res.page || 1);
        setTxTotalPages(res.totalPages || 1);
      }
    } catch {}
  };

  useEffect(() => { if (!loading) loadCreditHistory(); }, [loading]);

  const refreshCredits = async () => {
    try {
      const cr = await authService.getCredits();
      if (cr?.success) setCreditData(cr.data);
      loadCreditHistory();
    } catch {}
  };

  const handleBuyPackage = async (pkgKey) => {
    const planMap = { STANDARD: "JOB_PACKAGE_1", PREMIUM: "JOB_PACKAGE_2", ELITE: "JOB_PACKAGE_3" };
    const jobPkgId = planMap[pkgKey];
    if (!jobPkgId) return;
    setError(""); setSuccess(""); setBuying(jobPkgId);
    try {
      const orderRes = await paymentService.createOrder(jobPkgId);
      const { orderId, amount, currency, keyId, planLabel } = orderRes.data;
      await paymentService.openCheckout({
        order: { orderId, amount, currency, planLabel },
        keyId, user,
        onSuccess: () => { setSuccess("Package upgraded! Your job posting limit has been increased."); setBuying(null); },
        onError: (msg) => { setError(msg || "Payment failed"); setBuying(null); },
      });
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Failed to initiate payment");
      setBuying(null);
    }
  };

  const handleTopup = async () => {
    setError(""); setSuccess(""); setTopupLoading(true);
    try {
      const orderRes = await authService.topupCredits();
      if (!orderRes?.success) throw new Error(orderRes?.message || "Failed to create order");
      const { orderId, amount, currency, keyId, credits } = orderRes.data;
      const Razorpay = await loadRazorpay();
      const rzp = new Razorpay({
        key: keyId,
        amount,
        currency: currency || "INR",
        name: "MavenJobs",
        description: `${credits} Resume Search Credits`,
        order_id: orderId,
        prefill: { name: user?.name || "", email: user?.email || "" },
        theme: { color: "#002366" },
        handler: async (response) => {
          try {
            const verifyRes = await authService.verifyCreditTopup({
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });
            if (verifyRes?.success) {
              setSuccess(`${credits} credits added to your account!`);
              refreshCredits();
            } else {
              setError(verifyRes?.message || "Verification failed");
            }
          } catch (err) {
            setError(err?.response?.data?.message || err.message || "Payment verification failed");
          }
          setTopupLoading(false);
        },
        modal: { ondismiss: () => { setTopupLoading(false); setError("Top-up cancelled"); } },
      });
      rzp.open();
    } catch (err) {
      setError(err?.response?.data?.message || err.message || "Failed to initiate top-up");
      setTopupLoading(false);
    }
  };

  const currentPkg = (company?.packageType || "STANDARD").toUpperCase();
  const activeJobs = Number(company?.activeJobCount || 0);
  const jobLimit = Number(company?.jobLimit || 0);
  const safeLimit = jobLimit > 0 ? jobLimit : 1;
  const utilization = Math.min(100, Math.round((activeJobs / safeLimit) * 100));
  const remaining = Math.max(0, jobLimit - activeJobs);

  const getPkgIndex = (key) => PACKAGES.findIndex(p => p.key === key);
  const currentIdx = getPkgIndex(currentPkg);
  const isElite = currentPkg === "ELITE";

  if (loading) {
    return (
      <div style={{ background: "#f8fafc", minHeight: "100vh", fontFamily: C.dm, color: C.s900 }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "80px 24px", textAlign: "center", color: C.s400, fontSize: 14 }}>Loading…</div>
      </div>
    );
  }

  return (
    <div style={{ background: "#f0f4f9", minHeight: "100vh", fontFamily: C.dm, color: C.s900 }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "28px 20px 80px" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 32, flexWrap: "wrap", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button onClick={() => navigate("/employer-dashboard")}
              style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 10, border: `1px solid ${C.s200}`, background: "#fff", color: C.s500, fontSize: 12.5, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
              <FiArrowLeft size={13} /> Dashboard
            </button>
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, color: C.s500, fontWeight: 600, background: "#fff", padding: "7px 14px", borderRadius: 10, border: `1px solid ${C.s200}` }}>
              <FiBriefcase size={14} color={C.navy} />
              <span style={{ fontFamily: C.fd, fontWeight: 800, color: C.navy }}>{PACKAGES[currentIdx]?.name || currentPkg}</span>
              <span style={{ width: 4, height: 4, borderRadius: "50%", background: C.s300 }} />
              <span style={{ fontWeight: 700, color: C.s700 }}>{activeJobs}/{jobLimit}</span> jobs
            </div>
          </div>
          {creditData && (
            <div style={{ display: "flex", alignItems: "center", gap: 10, background: "#fff", padding: "7px 14px", borderRadius: 10, border: `1px solid ${C.s200}` }}>
              <span style={{ fontSize: 15, fontWeight: 800, color: C.amber, fontFamily: C.fd }}>₹</span>
              <span style={{ fontSize: 12.5, fontWeight: 700, color: C.s700 }}>
                <span style={{ color: C.navy }}>{creditData.balance}</span> Credits
              </span>
              <button onClick={handleTopup} disabled={topupLoading}
                style={{ padding: "5px 12px", borderRadius: 8, border: "none", background: C.navy, color: "#fff", fontSize: 11, fontWeight: 800, cursor: topupLoading ? "default" : "pointer", fontFamily: C.fd, opacity: topupLoading ? 0.6 : 1, transition: "all .15s" }}>
                {topupLoading ? "..." : "Top Up"}
              </button>
            </div>
          )}
        </div>

        {/* Title */}
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: "linear-gradient(135deg,#002366,#1a3a6e)", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 16, boxShadow: "0 8px 24px rgba(0,35,102,.15)" }}>
            <FiZap size={26} color="#fff" />
          </div>
          <h1 style={{ fontFamily: C.fd, fontSize: 30, fontWeight: 800, margin: "0 0 8px", color: C.s900 }}>Plans & Credits</h1>
          <p style={{ fontSize: 14.5, color: C.s500, margin: 0 }}>Choose a job package or top up resume search credits</p>
        </div>

        {/* Job Package Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20, marginBottom: 40 }}>
          {PACKAGES.map((pkg) => {
            const isActive = pkg.key === currentPkg;
            const pkgIdx = getPkgIndex(pkg.key);
            const canBuy = pkgIdx > currentIdx;
            const isBuyingNow = buying === ["JOB_PACKAGE_1","JOB_PACKAGE_2","JOB_PACKAGE_3"][pkgIdx];
            return (
              <div key={pkg.key} style={{
                borderRadius: 20, overflow: "hidden", position: "relative",
                border: `2px solid ${isActive ? pkg.color : C.s200}`,
                background: "#fff", transition: "all .3s",
                display: "flex", flexDirection: "column",
              }}>
                {pkg.popular && !isActive && (
                  <div style={{ position: "absolute", top: 14, right: 14, background: C.green, color: "#fff", fontSize: 9.5, fontWeight: 800, padding: "3px 12px", borderRadius: 100, fontFamily: C.fd, zIndex: 2, letterSpacing: ".06em", textTransform: "uppercase" }}>
                    Most Popular
                  </div>
                )}
                {isActive && (
                  <div style={{ position: "absolute", top: 14, right: 14, background: pkg.color, color: "#fff", fontSize: 9.5, fontWeight: 800, padding: "3px 12px", borderRadius: 100, fontFamily: C.fd, zIndex: 2 }}>
                    Current Plan
                  </div>
                )}

                {/* Top gradient */}
                <div style={{ height: 4, background: pkg.gradient }} />

                <div style={{ padding: "24px 24px 0" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: `${pkg.color}14`, display: "flex", alignItems: "center", justifyContent: "center", color: pkg.color }}>
                      <FiBriefcase size={20} />
                    </div>
                    <div>
                      <div style={{ fontFamily: C.fd, fontSize: 17, fontWeight: 800, color: C.s900 }}>{pkg.name}</div>
                      <div style={{ fontSize: 12, color: C.s500 }}>{pkg.desc}</div>
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 4 }}>
                    <span style={{ fontFamily: C.fd, fontSize: 32, fontWeight: 800, color: C.s900 }}>₹{pkg.price}</span>
                    <span style={{ fontSize: 13, color: C.s400 }}>/year</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 18 }}>
                    <FiBriefcase size={13} color={pkg.color} />
                    <span style={{ fontSize: 13, fontWeight: 700, color: C.s700 }}>{pkg.posts} job posts</span>
                  </div>

                  <ul style={{ listStyle: "none", padding: 0, margin: "0 0 20px", display: "flex", flexDirection: "column", gap: 8 }}>
                    {pkg.features.map((f, i) => (
                      <li key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 13, color: C.s600, lineHeight: 1.4 }}>
                        <FiCheckCircle size={14} color={C.green} style={{ flexShrink: 0, marginTop: 2 }} />
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>

                <div style={{ padding: "0 24px 24px", marginTop: "auto" }}>
                  {isActive && isElite ? (
                    <div style={{ padding: "11px 14px", borderRadius: 10, background: "#ecfdf5", border: "1px solid #a7f3d0", fontSize: 13, fontWeight: 700, color: "#065f46", textAlign: "center" }}>
                      Highest plan — full access active
                    </div>
                  ) : isActive ? (
                    <div style={{ padding: "11px 14px", borderRadius: 10, background: "#eef2ff", border: "1px solid #c7d2fe", fontSize: 13, fontWeight: 700, color: C.navy, textAlign: "center" }}>
                      Currently active
                    </div>
                  ) : isElite && !canBuy ? (
                    <div style={{ padding: "11px 14px", borderRadius: 10, background: "#fef2f2", border: "1px solid #fecaca", fontSize: 12.5, fontWeight: 700, color: "#dc2626", textAlign: "center" }}>
                      Upgrade not available — already on Elite
                    </div>
                  ) : (
                    <button onClick={() => handleBuyPackage(pkg.key)} disabled={isBuyingNow}
                      style={{ width: "100%", padding: "12px 0", borderRadius: 11, border: "none", fontSize: 14, fontWeight: 800, fontFamily: C.fd, cursor: isBuyingNow ? "default" : "pointer", background: pkg.gradient, color: "#fff", opacity: isBuyingNow ? 0.65 : 1, transition: "all .2s", boxShadow: `0 4px 14px ${pkg.color}30` }}>
                      {isBuyingNow ? "Processing…" : `Buy ₹${pkg.price}`}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Utilization */}
        <div style={{ borderRadius: 16, border: `1px solid ${C.s200}`, background: "#fff", padding: "22px 24px", marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, flexWrap: "wrap", gap: 8 }}>
            <div style={{ fontFamily: C.fd, fontSize: 15, fontWeight: 800, color: C.s900 }}>Job Slot Utilization</div>
            <div style={{ fontFamily: C.fd, fontSize: 22, fontWeight: 800, color: C.s900 }}>{activeJobs} / {jobLimit}</div>
          </div>
          <div style={{ width: "100%", height: 8, borderRadius: 100, background: C.s100, overflow: "hidden", marginBottom: 8 }}>
            <div style={{ width: `${utilization}%`, height: "100%", borderRadius: 100, background: utilization > 80 ? C.red : utilization > 50 ? C.amber : C.green, transition: "width .4s ease" }} />
          </div>
          <div style={{ fontSize: 13, color: C.s500, fontWeight: 600 }}>{remaining} slot{remaining !== 1 ? 's' : ''} available</div>
          {activeRequest && (
            <div style={{ marginTop: 12, padding: "12px 16px", borderRadius: 10, background: "#fffbeb", border: "1px solid #fde68a", fontSize: 13, color: "#92400e" }}>
              <FiClock size={13} style={{ marginRight: 6, verticalAlign: "middle" }} />
              Request in review: {activeRequest.requestedPackageType} ({activeRequest.requestedJobLimit} posts)
            </div>
          )}
        </div>

        {/* Credit Management */}
        <div style={{ borderRadius: 16, border: `1px solid ${C.s200}`, background: "#fff", padding: "24px", marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 16 }}>
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: "#fffbeb", border: "1px solid #fde68a", display: "flex", alignItems: "center", justifyContent: "center", color: C.amber, fontSize: 17, fontWeight: 800, fontFamily: C.fd }}>
                  ₹
                </div>
                <div>
                  <div style={{ fontFamily: C.fd, fontSize: 17, fontWeight: 800, color: C.s900 }}>Resume Search Credits</div>
                  <p style={{ fontSize: 12.5, color: C.s500, margin: "2px 0 0" }}>Use credits to view and download candidate resumes from Resdex</p>
                </div>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
              <div style={{ textAlign: "right" }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: 2, justifyContent: "flex-end" }}>
                  <span style={{ fontSize: 18, fontWeight: 800, color: C.amber, fontFamily: C.fd }}>₹</span>
                  <span style={{ fontFamily: C.fd, fontSize: 30, fontWeight: 800, color: C.navy, lineHeight: 1 }}>{creditData?.balance ?? 0}</span>
                </div>
                <div style={{ fontSize: 11.5, color: C.s400, fontWeight: 600, marginTop: 1 }}>Available Credits</div>
              </div>
              <button onClick={handleTopup} disabled={topupLoading}
                style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "12px 22px", borderRadius: 10, border: "none", background: "linear-gradient(135deg,#002366,#1a3a6e)", color: "#fff", fontSize: 13, fontWeight: 800, fontFamily: C.fd, cursor: topupLoading ? "default" : "pointer", opacity: topupLoading ? 0.6 : 1, transition: "all .2s", boxShadow: "0 4px 14px rgba(0,35,102,.2)", whiteSpace: "nowrap" }}
                onMouseEnter={e => { if (!topupLoading) { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 6px 20px rgba(0,35,102,.3)"; } }}
                onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "0 4px 14px rgba(0,35,102,.2)"; }}>
                {topupLoading ? (
                  <><span style={{ width: 14, height: 14, borderRadius: "50%", border: "2px solid rgba(255,255,255,.3)", borderTopColor: "#fff", animation: "pCreditSpin .6s linear infinite", display: "inline-block" }} /> Processing...</>
                ) : (
                  <><FiShoppingCart size={15} /> Buy 1,000 Credits — ₹100</>
                )}
              </button>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, marginBottom: 20 }}>
            {[
              { label: "Resume View", cost: "10 credits per view", icon: FiSearch, color: C.sky, desc: "One-time charge per candidate" },
              { label: "Resume Download", cost: "10 credits per download", icon: FiDownload, color: C.green, desc: "Free after first view" },
              { label: "Lifetime Access", cost: "Free re-access", icon: FiRefreshCw, color: C.purple, desc: "Pay once, access forever" },
            ].map((item, i) => (
              <div key={i} style={{ padding: "16px", borderRadius: 12, background: C.s50, border: `1px solid ${C.s100}`, display: "flex", alignItems: "flex-start", gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: `${item.color}14`, display: "flex", alignItems: "center", justifyContent: "center", color: item.color, flexShrink: 0 }}>
                  <item.icon size={16} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: C.s800, marginBottom: 2 }}>{item.label}</div>
                  <div style={{ fontSize: 11.5, color: C.s500, marginBottom: 1 }}>{item.cost}</div>
                  <div style={{ fontSize: 11, color: C.s400 }}>{item.desc}</div>
                </div>
              </div>
            ))}
          </div>

          {creditHistory.length > 0 && (
            <>
              <div style={{ fontSize: 11, fontWeight: 800, color: C.s400, textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 10 }}>Recent Transactions</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {creditHistory.map((txn, i) => (
                  <div key={txn._id || i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", borderRadius: 10, background: C.s50, gap: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, overflow: "hidden" }}>
                      <div style={{ width: 6, height: 6, borderRadius: "50%", flexShrink: 0, background: txn.type === "PURCHASE" ? C.green : "#ef4444" }} />
                      <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        <span style={{ fontSize: 12.5, fontWeight: 600, color: C.s700 }}>{txn.description}</span>
                        <span style={{ fontSize: 11, color: C.s400, marginLeft: 8 }}>
                          {(() => { try { return new Date(txn.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }); } catch { return ""; } })()}
                        </span>
                      </div>
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 800, color: txn.type === "PURCHASE" ? C.green : "#ef4444", flexShrink: 0 }}>
                      {txn.type === "PURCHASE" ? `+${txn.amount}` : `-${Math.abs(txn.amount)}`}
                    </span>
                  </div>
                ))}
                {txTotalPages > 1 && (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 12 }}>
                    <button onClick={() => loadCreditHistory(txPage - 1)} disabled={txPage <= 1}
                      style={{ padding: "6px 12px", borderRadius: 8, border: `1px solid ${C.s200}`, background: "#fff", fontSize: 12, fontWeight: 700, color: txPage <= 1 ? C.s300 : C.navy, cursor: txPage <= 1 ? "default" : "pointer", fontFamily: C.fd }}>
                      Prev
                    </button>
                    {Array.from({ length: txTotalPages }, (_, i) => i + 1).map(p => (
                      <button key={p} onClick={() => loadCreditHistory(p)}
                        style={{ width: 32, height: 32, borderRadius: 8, border: p === txPage ? "none" : `1px solid ${C.s200}`, background: p === txPage ? C.navy : "#fff", fontSize: 12, fontWeight: 700, color: p === txPage ? "#fff" : C.s600, cursor: "pointer", fontFamily: C.fd }}>
                        {p}
                      </button>
                    ))}
                    <button onClick={() => loadCreditHistory(txPage + 1)} disabled={txPage >= txTotalPages}
                      style={{ padding: "6px 12px", borderRadius: 8, border: `1px solid ${C.s200}`, background: "#fff", fontSize: 12, fontWeight: 700, color: txPage >= txTotalPages ? C.s300 : C.navy, cursor: txPage >= txTotalPages ? "default" : "pointer", fontFamily: C.fd }}>
                      Next
                    </button>
                  </div>
                )}
              </div>
            </>
          )}

          {creditHistory.length === 0 && (
            <div style={{ textAlign: "center", padding: "32px 0 16px", color: C.s400, fontSize: 13 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: C.s50, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 10px", color: C.s300, border: `1px solid ${C.s100}` }}>
                <FiRefreshCw size={18} />
              </div>
              No transactions yet. Purchase credits to get started.
            </div>
          )}
        </div>

        {/* Messages */}
        {error && (
          <div style={{ padding: "12px 18px", borderRadius: 10, background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626", fontSize: 13, fontWeight: 600, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
            <FiAlertCircle size={14} style={{ flexShrink: 0 }} />
            {error}
            <button onClick={() => setError("")} style={{ marginLeft: "auto", background: "none", border: "none", color: "#dc2626", cursor: "pointer", padding: 0 }}>✕</button>
          </div>
        )}
        {success && (
          <div style={{ padding: "12px 18px", borderRadius: 10, background: "#ecfdf5", border: "1px solid #a7f3d0", color: "#059669", fontSize: 13, fontWeight: 600, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
            <FiCheckCircle size={14} style={{ flexShrink: 0 }} />
            {success}
          </div>
        )}

        {/* Secure Payment Note */}
        <div style={{ padding: "14px 18px", borderRadius: 12, background: "#fffbeb", border: "1px solid #fde68a", display: "flex", alignItems: "flex-start", gap: 10, fontSize: 12.5, color: "#92400e", lineHeight: 1.6 }}>
          <FiInfo size={16} color={C.amber} style={{ flexShrink: 0, marginTop: 1 }} />
          <div>
            <strong>Secure payment via Razorpay</strong>
            <br />
            All transactions are encrypted and PCI-DSS compliant. Credits are added immediately after successful payment.
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        @keyframes pCreditSpin { to { transform:rotate(360deg); } }
        .cc-card { animation:fadeUp .35s ease-out both; }
        .cc-card:nth-child(1) { animation-delay:0.05s; }
        .cc-card:nth-child(2) { animation-delay:0.1s; }
        .cc-card:nth-child(3) { animation-delay:0.15s; }
      `}</style>
    </div>
  );
}
