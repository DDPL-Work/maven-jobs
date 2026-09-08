import { useCallback, useEffect, useState } from "react";
import {
  LuBanknote,
  LuCalendar,
  LuCalendarCheck,
  LuCopy,
  LuUserCheck,
  LuUsers,
  LuWallet,
} from "react-icons/lu";
import {
  Badge,
  EmptyState,
  MetricCard,
  PageState,
  PanelCard,
  SectionHeading,
} from "../components/Ui";
import { getPayments } from "../services/crmApi";
import { formatDate, formatNumber } from "../utils/formatters";

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

function formatTime(value) {
  if (!value) return "-";
  return new Date(value).toLocaleTimeString("en-US", {
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
  const limit = 15;

  const loadPayments = useCallback(async () => {
    setIsLoading(true);
    setError("");

    try {
      const response = await getPayments({
        role: activeTab || undefined,
        page: currentPage,
        limit,
      });
      setData(response.data);
    } catch (err) {
      setError(err.message || "Unable to load payments.");
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, currentPage]);

  useEffect(() => {
    loadPayments();
  }, [loadPayments]);

  const handleTabChange = (value) => {
    setActiveTab(value);
    setCurrentPage(1);
  };

  if (error) {
    return <PageState title={error} error />;
  }

  if (isLoading && !data) {
    return <PageState title="Loading payments data..." />;
  }

  const revenue = data?.revenue || {};
  const activeMembers = data?.activeMembers || {};
  const transactions = data?.transactions || [];
  const pagination = data?.pagination || {};

  const kpis = [
    {
      label: "Total Revenue",
      value: formatINR(revenue.total),
      detail: "Lifetime revenue from all paid transactions",
      icon: LuWallet,
      tone: "blue",
    },
    {
      label: "This Month",
      value: formatINR(revenue.thisMonth),
      detail: "Revenue earned in the current month",
      icon: LuCalendarCheck,
      tone: "emerald",
    },
    {
      label: "This Year",
      value: formatINR(revenue.thisYear),
      detail: "Revenue earned in the current calendar year",
      icon: LuCalendar,
      tone: "lime",
    },
    {
      label: "By Candidates",
      value: formatINR(revenue.byCandidates),
      detail: "Revenue from candidate PRO/ELITE subscriptions",
      icon: LuUserCheck,
      tone: "amber",
    },
    {
      label: "By Employers",
      value: formatINR(revenue.byEmployers),
      detail: "Revenue from employer (client) subscriptions",
      icon: LuUsers,
      tone: "rose",
    },
    {
      label: "Active Members",
      value: activeMembers.pro + activeMembers.elite,
      detail: `${activeMembers.pro} PRO \u00B7 ${activeMembers.elite} ELITE`,
      icon: LuBanknote,
      tone: "slate",
    },
  ];

  return (
    <div className="mx-auto w-full max-w-7xl">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {kpis.map((kpi) => (
          <MetricCard key={kpi.label} {...kpi} />
        ))}
      </div>

      <PanelCard className="mt-6">
        <SectionHeading
          eyebrow="Transactions"
          title="Razorpay payment records"
          action={
            <Badge tone="emerald">
              {pagination.total || 0} total transactions
            </Badge>
          }
        />

        <div className="mt-6 flex gap-2">
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
          <div className="mt-6">
            <EmptyState
              title="No transactions found"
              description={
                activeTab
                  ? `No ${activeTab.toLowerCase()} transactions recorded yet.`
                  : "No paid transactions recorded yet."
              }
            />
          </div>
        ) : (
          <>
            <div className="mt-4 overflow-hidden rounded-[22px] border border-slate-200">
              <div className="grid grid-cols-[1.3fr_1.1fr_0.7fr_0.8fr_0.7fr_0.9fr] gap-3 bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                <span>Name</span>
                <span>Transaction ID</span>
                <span>Plan</span>
                <span>Amount</span>
                <span>Status</span>
                <span>Date</span>
              </div>
              <div className="divide-y divide-slate-200">
                {transactions.map((txn) => (
                  <div
                    key={txn.id}
                    className="grid min-h-[74px] grid-cols-[1.3fr_1.1fr_0.7fr_0.8fr_0.7fr_0.9fr] items-center gap-3 px-4 py-4 text-sm text-slate-700 transition-colors duration-200 hover:bg-lime-50/40"
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
                    <Badge tone="blue">{txn.planType}</Badge>
                    <span className="font-semibold text-slate-900">
                      {formatINR(txn.amount)}
                    </span>
                    <Badge
                      tone={
                        txn.status === "PAID"
                          ? "emerald"
                          : txn.status === "FAILED"
                            ? "rose"
                            : txn.status === "REFUNDED"
                              ? "amber"
                              : "slate"
                      }
                    >
                      {txn.status}
                    </Badge>
                    <div>
                      <p className="text-sm font-medium text-slate-700">
                        {formatDate(txn.createdAt)}
                      </p>
                      <p className="text-xs text-slate-400">
                        {formatTime(txn.createdAt)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {pagination.pages > 1 && (
              <div className="mt-6 flex items-center justify-between">
                <p className="text-sm text-slate-500">
                  Page {pagination.page} of {pagination.pages}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() =>
                      setCurrentPage((p) => Math.max(1, p - 1))
                    }
                    disabled={currentPage <= 1}
                    className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() =>
                      setCurrentPage((p) =>
                        Math.min(pagination.pages, p + 1),
                      )
                    }
                    disabled={currentPage >= pagination.pages}
                    className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </PanelCard>
    </div>
  );
}
