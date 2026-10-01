import { useEffect, useState } from "react";
import {
  LuWallet,
  LuPlus,
  LuRefreshCw,
  LuSearch,
  LuFilter,
  LuArrowDownLeft,
  LuArrowUpRight,
  LuX,
  LuTriangleAlert,
} from "react-icons/lu";
import {
  getCommercialCreditLedger,
  adjustCommercialCredit,
  getCommercialProducts,
} from "../../services/adminApi";

export default function CommercialCreditLedgerPage() {
  const [entries, setEntries] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);

  // Filters
  const [productCode, setProductCode] = useState("");
  const [transactionType, setTransactionType] = useState("");

  // Adjustment Modal State
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [adjustForm, setAdjustForm] = useState({
    companyId: "",
    productCode: "SMB_JOB",
    quantity: 5,
    validityDays: 30,
    reason: "",
  });

  const loadLedger = async () => {
    setLoading(true);
    try {
      const res = await getCommercialCreditLedger({
        productCode,
        transactionType,
      });
      if (res.success) {
        setEntries(res.entries || []);
        setTotal(res.total || 0);
      }
    } catch (err) {
      alert(err.message || "Failed to load credit ledger");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLedger();
    getCommercialProducts().then((res) => {
      if (res.success) setProducts(res.products || []);
    });
  }, [productCode, transactionType]);

  const handleAdjustSubmit = async (e) => {
    e.preventDefault();
    if (!adjustForm.companyId || !adjustForm.reason) {
      alert("Company ID and mandatory reason are required for audit trail.");
      return;
    }
    try {
      await adjustCommercialCredit(adjustForm);
      alert("Credit adjustment successful!");
      setIsAdjustModalOpen(false);
      loadLedger();
    } catch (err) {
      alert(err.message || "Failed to adjust credit");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
            Commercial Credit Ledger
          </h1>
          <p className="text-sm text-slate-500">
            Immutable double-entry transaction record of every single credit allocation and consumption.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={loadLedger}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            <LuRefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
          </button>
          <button
            onClick={() => setIsAdjustModalOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-indigo-700"
          >
            <LuPlus className="h-4 w-4" /> Manual Credit Adjustment
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <select
          value={productCode}
          onChange={(e) => setProductCode(e.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 focus:outline-none"
        >
          <option value="">All Products</option>
          {products.map((p) => (
            <option key={p.code} value={p.code}>
              {p.name} ({p.code})
            </option>
          ))}
        </select>

        <select
          value={transactionType}
          onChange={(e) => setTransactionType(e.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 focus:outline-none"
        >
          <option value="">All Transaction Types</option>
          <option value="PLAN_PURCHASE">Plan Purchase (+)</option>
          <option value="STANDALONE_PURCHASE">Standalone Purchase (+)</option>
          <option value="JOB_POSTED">Job Posted (-)</option>
          <option value="RESUME_VIEWED">Resume Viewed (-)</option>
          <option value="AI_USED">AI Used (-)</option>
          <option value="MANUAL_ADJUSTMENT">Manual Adjustment (Admin)</option>
        </select>

        <span className="ml-auto text-xs text-slate-400 font-medium">{total} total entries</span>
      </div>

      {/* Ledger Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/75 text-slate-500 uppercase tracking-wider font-semibold">
                <th className="px-5 py-3.5">Company</th>
                <th className="px-4 py-3.5">Product</th>
                <th className="px-4 py-3.5">Transaction Type</th>
                <th className="px-4 py-3.5">Quantity Change</th>
                <th className="px-4 py-3.5">Balance After</th>
                <th className="px-4 py-3.5">Reference</th>
                <th className="px-4 py-3.5">Expiry Date</th>
                <th className="px-5 py-3.5 text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {entries.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-400">
                    {loading ? "Loading ledger..." : "No ledger transactions found."}
                  </td>
                </tr>
              ) : (
                entries.map((entry) => {
                  const isPositive = entry.quantity > 0;
                  return (
                    <tr key={entry._id} className="transition hover:bg-slate-50/50">
                      <td className="px-5 py-4">
                        <div className="font-bold text-slate-900">{entry.companyId?.name || "Company"}</div>
                        <div className="text-[10px] text-slate-400">{entry.companyId?.email}</div>
                      </td>
                      <td className="px-4 py-4 font-mono font-semibold text-slate-800">
                        {entry.productCode}
                      </td>
                      <td className="px-4 py-4">
                        <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700">
                          {entry.transactionType}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex items-center gap-1 font-bold font-mono text-xs ${
                            isPositive ? "text-emerald-600" : "text-rose-600"
                          }`}
                        >
                          {isPositive ? <LuArrowDownLeft className="h-3.5 w-3.5" /> : <LuArrowUpRight className="h-3.5 w-3.5" />}
                          {isPositive ? `+${entry.quantity}` : entry.quantity}
                        </span>
                      </td>
                      <td className="px-4 py-4 font-bold font-mono text-slate-900">
                        {entry.balanceAfter}
                      </td>
                      <td className="px-4 py-4 text-slate-600">
                        <span className="font-medium text-[11px] block">{entry.referenceType}</span>
                        {entry.notes && <span className="text-[10px] text-slate-400">{entry.notes}</span>}
                      </td>
                      <td className="px-4 py-4 text-slate-500 font-medium">
                        {entry.expiryDate ? new Date(entry.expiryDate).toLocaleDateString() : "-"}
                      </td>
                      <td className="px-5 py-4 text-right text-slate-400 text-[11px]">
                        {new Date(entry.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual Credit Adjustment Modal */}
      {isAdjustModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Manual Credit Adjustment</h2>
                <p className="text-xs text-slate-500">
                  Add or deduct commercial credits directly for a customer with a mandatory audit reason.
                </p>
              </div>
              <button
                onClick={() => setIsAdjustModalOpen(false)}
                className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <LuX className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAdjustSubmit} className="mt-5 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700">Company ObjectId *</label>
                <input
                  type="text"
                  required
                  placeholder="Paste Company ID (e.g. 64d9f...)"
                  value={adjustForm.companyId}
                  onChange={(e) => setAdjustForm({ ...adjustForm, companyId: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 font-mono text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700">Product Code *</label>
                  <select
                    value={adjustForm.productCode}
                    onChange={(e) => setAdjustForm({ ...adjustForm, productCode: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-800"
                  >
                    {products.map((p) => (
                      <option key={p.code} value={p.code}>
                        {p.name} ({p.code})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700">
                    Quantity Adjustment * (e.g. 10 or -5)
                  </label>
                  <input
                    type="number"
                    required
                    value={adjustForm.quantity}
                    onChange={(e) => setAdjustForm({ ...adjustForm, quantity: Number(e.target.value) })}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 font-bold text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700">Validity (Days for added credits)</label>
                <input
                  type="number"
                  min="1"
                  value={adjustForm.validityDays}
                  onChange={(e) => setAdjustForm({ ...adjustForm, validityDays: Number(e.target.value) })}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-800"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700">Mandatory Audit Reason *</label>
                <textarea
                  rows="3"
                  required
                  placeholder="e.g. Granted 5 complimentary SMB jobs as part of promotional partnership..."
                  value={adjustForm.reason}
                  onChange={(e) => setAdjustForm({ ...adjustForm, reason: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-slate-800"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAdjustModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-indigo-600 px-5 py-2 font-semibold text-white shadow-sm hover:bg-indigo-700"
                >
                  Execute Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
