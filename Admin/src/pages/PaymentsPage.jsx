import { useCallback, useEffect, useState } from "react";
import {
  LuArrowUpRight,
  LuBanknote,
  LuCalendar,
  LuCalendarCheck,
  LuCopy,
  LuDot,
  LuUserCheck,
  LuUsers,
  LuWallet,
  LuChevronLeft,
  LuChevronRight,
  LuChevronsLeft,
  LuChevronsRight,
} from "react-icons/lu";
import { getPayments } from "../services/adminApi";

const statusStyles = {
  PAID: "bg-emerald-50 text-emerald-700",
  CREATED: "bg-amber-50 text-amber-700",
  FAILED: "bg-rose-50 text-rose-700",
  REFUNDED: "bg-violet-50 text-violet-700",
  EXPIRED: "bg-slate-50 text-slate-500",
};

const KPI_CARDS = [
  {
    title: "Total Revenue",
    key: "total",
    prefix: "\u20B9",
    detail: "Lifetime revenue from all paid transactions",
    tone: "from-[#0f6ae6] to-[#1481ff]",
    icon: LuWallet,
  },
  {
    title: "This Month",
    key: "thisMonth",
    prefix: "\u20B9",
    detail: "Revenue earned in the current month",
    tone: "from-[#17b26a] to-[#84cc16]",
    icon: LuCalendarCheck,
  },
  {
    title: "This Year",
    key: "thisYear",
    prefix: "\u20B9",
    detail: "Revenue earned in the current calendar year",
    tone: "from-[#6d28d9] to-[#8b5cf6]",
    icon: LuCalendar,
  },
  {
    title: "By Candidates",
    key: "byCandidates",
    prefix: "\u20B9",
    detail: "Revenue from candidate PRO/ELITE subscriptions",
    tone: "from-[#f59e0b] to-[#f97316]",
    icon: LuUserCheck,
  },
  {
    title: "By Employers",
    key: "byEmployers",
    prefix: "\u20B9",
    detail: "Revenue from employer (client) subscriptions",
    tone: "from-[#dc2626] to-[#f97316]",
    icon: LuUsers,
  },
  {
    title: "Active Members",
    key: "members",
    detail: "Active PRO + ELITE plan holders",
    tone: "from-[#0891b2] to-[#06b6d4]",
    icon: LuBanknote,
  },
];

const FILTER_TABS = [
  { label: "All", value: "" },
  { label: "Candidates", value: "CANDIDATE" },
  { label: "Clients", value: "CLIENT" },
];

function formatINR(amount) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount || 0);
}

function formatDate(value) {
  if (!value) return "-";
  const d = new Date(value);
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatTime(value) {
  if (!value) return "-";
  const d = new Date(value);
  return d.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function copyToClipboard(text) {
  navigator.clipboard.writeText(text);
}

export default function PaymentsPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const loadPayments = useCallback(async () => {
    setIsLoading(true);
    setError("");

    try {
      const response = await getPayments({
        role: activeTab || undefined,
        page: currentPage,
        limit: pageSize,
      });
      setData(response.data);
    } catch (err) {
      setError(err.message || "Unable to load payments.");
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, currentPage, pageSize]);

  useEffect(() => {
    loadPayments();
  }, [loadPayments]);

  const handleTabChange = (value) => {
    setActiveTab(value);
    setCurrentPage(1);
  };

  const revenue = data?.revenue || {};
  const activeMembers = data?.activeMembers || {};
  const transactions = data?.transactions || [];
  const pagination = data?.pagination || {};

  // Pagination calculations
  const totalEntries = pagination.total || 0;
  const totalPages = pagination.pages || Math.max(1, Math.ceil(totalEntries / pageSize));
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);
  const startIndex = totalEntries === 0 ? 0 : (safeCurrentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalEntries);

  const getPageNumbers = () => {
    const pages = [];
    const maxButtons = 5;
    if (totalPages <= maxButtons) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      let start = Math.max(1, safeCurrentPage - 2);
      let end = Math.min(totalPages, start + maxButtons - 1);
      if (end - start < maxButtons - 1) {
        start = Math.max(1, end - maxButtons + 1);
      }
      for (let i = start; i <= end; i++) pages.push(i);
    }
    return pages;
  };

  const kpis = KPI_CARDS.map((card) => {
    if (card.key === "members") {
      return {
        ...card,
        value: `${activeMembers.pro + activeMembers.elite}`,
        change: `${activeMembers.pro} PRO \u00B7 ${activeMembers.elite} ELITE`,
      };
    }
    return {
      ...card,
      value: card.prefix
        ? formatINR(revenue[card.key]).replace(/^(\u20B9)/, "$1 ")
        : revenue[card.key] ?? 0,
      change: card.prefix ? `${card.prefix}${(revenue[card.key] || 0).toLocaleString("en-IN")}` : "",
    };
  });

  if (isLoading && !data) {
    return <PageState title="Loading payments data..." />;
  }

  if (error) {
    return <PageState title={error} error />;
  }

  return (
    <div className="mx-auto w-full max-w-7xl">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {kpis.map((item) => {
          const Icon = item.icon;

          return (
            <article
              key={item.title}
              className="group flex min-h-[200px] flex-col justify-between rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_12px_35px_rgba(15,23,42,0.06)] transition-all duration-200 hover:-translate-y-1 hover:border-lime-300 hover:shadow-[0_22px_55px_rgba(132,204,22,0.16)]"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-500">
                    {item.title}
                  </p>
                  <p className="mt-3 text-3xl font-bold text-slate-900">
                    {item.value}
                  </p>
                </div>
                <div
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${item.tone} text-white shadow-sm transition-transform duration-200 group-hover:scale-105`}
                >
                  <Icon size={20} />
                </div>
              </div>
              <div className="mt-5 space-y-2">
                {item.change && (
                  <p className="text-sm font-semibold text-emerald-600">
                    {item.change}
                  </p>
                )}
                <p className="text-sm leading-6 text-slate-500">{item.detail}</p>
              </div>
            </article>
          );
        })}
      </section>

      <section className="mt-6 rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_12px_35px_rgba(15,23,42,0.06)]">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
              Transactions
            </p>
            <h2 className="mt-2 text-2xl font-bold text-slate-900">
              Razorpay payment records
            </h2>
          </div>
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
            {pagination.total || 0} total transactions
          </span>
        </div>

        <div className="mt-6 flex gap-2 border-b border-slate-200 pb-4">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => handleTabChange(tab.value)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition-all duration-200 ${
                activeTab === tab.value
                  ? "bg-[#163060] text-white shadow-md"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="flex min-h-[300px] items-center justify-center">
            <p className="text-sm font-semibold text-slate-400">
              Loading transactions...
            </p>
          </div>
        ) : transactions.length === 0 ? (
          <div className="flex min-h-[300px] items-center justify-center">
            <div className="rounded-[20px] border border-dashed border-slate-200 bg-slate-50 px-8 py-6 text-center">
              <p className="text-sm font-semibold text-slate-400">
                No transactions found
              </p>
              <p className="mt-2 text-sm text-slate-500">
                {activeTab
                  ? `No ${activeTab.toLowerCase()} transactions recorded yet.`
                  : "No paid transactions recorded yet."}
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="mt-4 overflow-hidden rounded-[22px] border border-slate-200">
              <div className="grid grid-cols-[1.3fr_1.1fr_0.7fr_0.8fr_0.7fr_0.9fr_0.5fr] gap-3 bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                <span>Name</span>
                <span>Transaction ID</span>
                <span>Plan</span>
                <span>Amount</span>
                <span>Status</span>
                <span>Date</span>
                <span />
              </div>
              <div className="divide-y divide-slate-200">
                {transactions.map((txn) => (
                  <div
                    key={txn.id}
                    className="grid min-h-[74px] grid-cols-[1.3fr_1.1fr_0.7fr_0.8fr_0.7fr_0.9fr_0.5fr] items-center gap-3 px-4 py-4 text-sm text-slate-700 transition-colors duration-200 hover:bg-lime-50/40"
                  >
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900">
                        {txn.userName}
                      </p>
                      <p className="truncate text-xs text-slate-400">
                        {txn.userEmail}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="truncate font-mono text-xs text-slate-500">
                        {txn.razorpayPaymentId || txn.razorpayOrderId || "-"}
                      </span>
                      {(txn.razorpayPaymentId || txn.razorpayOrderId) && (
                        <button
                          onClick={() =>
                            copyToClipboard(
                              txn.razorpayPaymentId || txn.razorpayOrderId,
                            )
                          }
                          className="shrink-0 text-slate-300 transition-colors hover:text-slate-600"
                        >
                          <LuCopy size={14} />
                        </button>
                      )}
                    </div>
                    <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
                      {txn.planType}
                    </span>
                    <span className="font-semibold text-slate-900">
                      {formatINR(txn.amount)}
                    </span>
                    <span>
                      <StatusBadge status={txn.status} />
                    </span>
                    <div>
                      <p className="text-sm font-medium text-slate-700">
                        {formatDate(txn.createdAt)}
                      </p>
                      <p className="text-xs text-slate-400">
                        {formatTime(txn.createdAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {txn.companyName && (
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
                          {txn.companyName}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Table Pagination Footer */}
              {totalEntries > 0 && (
                <div className="flex flex-col items-center justify-between gap-4 border-t border-slate-200 bg-slate-50/50 px-5 py-3.5 sm:flex-row">
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
                    <span>
                      Showing <strong className="font-semibold text-slate-900">{totalEntries === 0 ? 0 : startIndex + 1}</strong> to{" "}
                      <strong className="font-semibold text-slate-900">{endIndex}</strong> of{" "}
                      <strong className="font-semibold text-slate-900">{totalEntries}</strong> entries
                    </span>
                    <span className="text-slate-300">|</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-500">Show</span>
                      <select
                        value={pageSize}
                        onChange={(e) => {
                          setPageSize(Number(e.target.value));
                          setCurrentPage(1);
                        }}
                        className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700 shadow-2xs focus:border-indigo-500 focus:outline-none"
                      >
                        <option value={5}>5</option>
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                      </select>
                      <span className="text-slate-500">per page</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setCurrentPage(1)}
                      disabled={safeCurrentPage <= 1}
                      title="First Page"
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-2xs transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <LuChevronsLeft className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={safeCurrentPage <= 1}
                      title="Previous Page"
                      className="flex h-8 items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-700 shadow-2xs transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <LuChevronLeft className="h-3.5 w-3.5" /> Previous
                    </button>

                    <div className="flex items-center gap-1">
                      {getPageNumbers().map((num) => (
                        <button
                          key={num}
                          onClick={() => setCurrentPage(num)}
                          className={`flex h-8 min-w-[32px] items-center justify-center rounded-lg px-2 text-xs font-semibold transition ${
                            safeCurrentPage === num
                              ? "bg-indigo-600 text-white shadow-xs"
                              : "border border-slate-200 bg-white text-slate-700 shadow-2xs hover:bg-slate-50"
                          }`}
                        >
                          {num}
                        </button>
                      ))}
                    </div>

                    <button
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={safeCurrentPage >= totalPages}
                      title="Next Page"
                      className="flex h-8 items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-700 shadow-2xs transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Next <LuChevronRight className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => setCurrentPage(totalPages)}
                      disabled={safeCurrentPage >= totalPages}
                      title="Last Page"
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-2xs transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <LuChevronsRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </section>
    </div>
  );
}

function PageState({ title, error = false }) {
  return (
    <div className="mx-auto flex min-h-[420px] w-full max-w-7xl items-center justify-center">
      <div
        className={`rounded-[28px] border px-8 py-7 text-center shadow-[0_20px_60px_rgba(15,23,42,0.08)] ${
          error ? "border-rose-200 bg-rose-50" : "border-slate-200 bg-white"
        }`}
      >
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-400">
          Payments
        </p>
        <p className="mt-3 text-lg font-semibold text-slate-900">{title}</p>
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const style = statusStyles[status] || "bg-slate-50 text-slate-600";
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${style}`}
    >
      <LuDot size={18} className="-ml-1" />
      {status}
    </span>
  );
}
