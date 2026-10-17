import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  LuSearch,
  LuPhone,
  LuMail,
  LuBuilding2,
  LuMapPin,
  LuEye,
  LuFilter,
  LuRefreshCw,
  LuChevronLeft,
  LuChevronRight,
  LuChevronDown,
  LuChevronUp,
  LuCircleCheck,
  LuClock,
  LuX,
  LuMessageSquareQuote,
  LuSparkles,
} from "react-icons/lu";
import Swal from "sweetalert2";
import { fetchSalesEnquiries, updateSalesEnquiry } from "../services/crmApi";

const STATUS_CONFIG = {
  NEW: {
    label: "New Request",
    bg: "bg-amber-50 text-amber-700 border-amber-200",
    dot: "bg-amber-500",
  },
  CONTACTED: {
    label: "Contacted",
    bg: "bg-sky-50 text-sky-700 border-sky-200",
    dot: "bg-sky-500",
  },
  IN_DISCUSSION: {
    label: "In Discussion",
    bg: "bg-purple-50 text-purple-700 border-purple-200",
    dot: "bg-purple-500",
  },
  DEMO_SCHEDULED: {
    label: "Demo Scheduled",
    bg: "bg-indigo-50 text-indigo-700 border-indigo-200",
    dot: "bg-indigo-500",
  },
  CONVERTED: {
    label: "Converted",
    bg: "bg-emerald-50 text-emerald-700 border-emerald-200",
    dot: "bg-emerald-500",
  },
  CLOSED: {
    label: "Closed",
    bg: "bg-slate-100 text-slate-600 border-slate-200",
    dot: "bg-slate-400",
  },
};

const formatDate = (dateString) => {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default function EnquiryRequests() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Filters
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [entityTypeFilter, setEntityTypeFilter] = useState("");
  const [sourceFilter, setSourceFilter] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Modal State
  const [selectedEnquiry, setSelectedEnquiry] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editStatus, setEditStatus] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  // Load Enquiries
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchSalesEnquiries({
        page,
        limit,
        search,
        status: statusFilter,
        entityType: entityTypeFilter,
        source: sourceFilter,
      });

      if (res && res.success) {
        setItems(res.data || []);
        if (res.pagination) {
          setTotal(res.pagination.total || 0);
          setTotalPages(res.pagination.totalPages || 1);
        }
      } else {
        setItems([]);
      }
    } catch (err) {
      console.error("Failed to load sales enquiries:", err);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, statusFilter, entityTypeFilter, sourceFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Debounced / Enter search
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  };

  const handleClearFilters = () => {
    setSearch("");
    setSearchInput("");
    setStatusFilter("");
    setEntityTypeFilter("");
    setSourceFilter("");
    setPage(1);
  };

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (statusFilter) count++;
    if (entityTypeFilter) count++;
    if (sourceFilter) count++;
    return count;
  }, [statusFilter, entityTypeFilter, sourceFilter]);

  // Open Details Modal
  const handleOpenModal = (enquiry) => {
    setSelectedEnquiry(enquiry);
    setEditStatus(enquiry.status || "NEW");
    setEditNotes(enquiry.notes || "");
    setIsModalOpen(true);
  };

  // Save Status / Notes
  const handleSaveStatus = async () => {
    if (!selectedEnquiry) return;
    setIsUpdating(true);
    try {
      const res = await updateSalesEnquiry(selectedEnquiry._id, {
        status: editStatus,
        notes: editNotes,
      });

      if (res && res.success) {
        Swal.fire({
          icon: "success",
          title: "Updated",
          text: "Enquiry status updated successfully.",
          timer: 1600,
          showConfirmButton: false,
        });

        // Update local item
        setItems((prev) =>
          prev.map((item) =>
            item._id === selectedEnquiry._id
              ? { ...item, status: editStatus, notes: editNotes }
              : item
          )
        );
        setSelectedEnquiry((prev) => ({
          ...prev,
          status: editStatus,
          notes: editNotes,
        }));
        setIsModalOpen(false);
      }
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Update Failed",
        text: err?.response?.data?.message || err?.message || "Could not update status.",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  // Compute Stats from current items/total
  const stats = useMemo(() => {
    const newCount = items.filter((i) => i.status === "NEW").length;
    const contactedCount = items.filter(
      (i) => i.status === "CONTACTED" || i.status === "IN_DISCUSSION"
    ).length;
    const convertedCount = items.filter(
      (i) => i.status === "CONVERTED" || i.status === "DEMO_SCHEDULED"
    ).length;

    return {
      total,
      newCount,
      contactedCount,
      convertedCount,
    };
  }, [items, total]);

  // Pagination calculation
  const startIndex = (page - 1) * limit + 1;
  const endIndex = Math.min(page * limit, total);

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      {/* ─── Page Header ─── */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
            <span>Dashboard</span>
            <span className="text-slate-300">/</span>
            <span className="text-slate-600">Sales Enquiries</span>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
            Sales Enquiries
          </h1>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-slate-500">
            View, track, and process demo & enquiry requests originating from Maven Talent Cloud & Employer portal.
          </p>
        </div>
        <button
          type="button"
          onClick={() => loadData()}
          title="Refresh Data"
          className="inline-flex items-center gap-2 self-start rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-lime-300 hover:bg-lime-50 hover:text-slate-900 active:scale-95 sm:self-auto"
        >
          <LuRefreshCw className={loading ? "animate-spin" : ""} size={16} />
          <span>Refresh</span>
        </button>
      </header>

      {/* ─── Stats Grid ─── */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="flex items-center justify-between rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_12px_35px_rgba(15,23,42,0.06)] transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Enquiries</p>
            <p className="mt-2 text-3xl font-extrabold text-slate-900">{stats.total}</p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#163060] to-[#2856a6] text-white shadow-sm">
            <LuMessageSquareQuote size={22} />
          </div>
        </div>

        <div className="flex items-center justify-between rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_12px_35px_rgba(15,23,42,0.06)] transition-all duration-200 hover:-translate-y-0.5 hover:border-amber-300 hover:shadow-md">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">New Requests</p>
            <p className="mt-2 text-3xl font-extrabold text-slate-900">{stats.newCount}</p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-sm">
            <LuClock size={22} />
          </div>
        </div>

        <div className="flex items-center justify-between rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_12px_35px_rgba(15,23,42,0.06)] transition-all duration-200 hover:-translate-y-0.5 hover:border-purple-300 hover:shadow-md">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">In Discussion</p>
            <p className="mt-2 text-3xl font-extrabold text-slate-900">{stats.contactedCount}</p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 text-white shadow-sm">
            <LuPhone size={22} />
          </div>
        </div>

        <div className="flex items-center justify-between rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_12px_35px_rgba(15,23,42,0.06)] transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Converted / Demo</p>
            <p className="mt-2 text-3xl font-extrabold text-slate-900">{stats.convertedCount}</p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 text-white shadow-sm">
            <LuCircleCheck size={22} />
          </div>
        </div>
      </section>

      {/* ─── Filters Toolbar ─── */}
      <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_12px_35px_rgba(15,23,42,0.06)]">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="relative flex-1 max-w-xl">
            <LuSearch className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#163060] focus:bg-white focus:ring-2 focus:ring-[#163060]/10"
              placeholder="Search by Ref ID, Client name, Company, Phone, City..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSearchSubmit(e);
                }
              }}
            />
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              className={`inline-flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm font-semibold transition ${
                showAdvanced
                  ? "border-[#163060] bg-[#163060]/5 text-[#163060]"
                  : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
              onClick={() => setShowAdvanced(!showAdvanced)}
            >
              <LuFilter size={16} />
              <span>Advanced Filters</span>
              {activeFilterCount > 0 && (
                <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[#163060] px-1.5 text-xs font-bold text-white">
                  {activeFilterCount}
                </span>
              )}
              {showAdvanced ? <LuChevronUp size={16} /> : <LuChevronDown size={16} />}
            </button>

            {(search || statusFilter || entityTypeFilter || sourceFilter || searchInput) && (
              <button
                type="button"
                className="inline-flex items-center rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-600 transition hover:bg-rose-100 hover:text-rose-700"
                onClick={handleClearFilters}
              >
                Clear All
              </button>
            )}
          </div>
        </div>

        {showAdvanced && (
          <div className="mt-4 border-t border-slate-100 pt-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Pipeline Status
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setPage(1);
                  }}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 outline-none transition focus:border-[#163060] focus:bg-white focus:ring-2 focus:ring-[#163060]/10"
                >
                  <option value="">All Statuses</option>
                  <option value="NEW">New Request</option>
                  <option value="CONTACTED">Contacted</option>
                  <option value="IN_DISCUSSION">In Discussion</option>
                  <option value="DEMO_SCHEDULED">Demo Scheduled</option>
                  <option value="CONVERTED">Converted</option>
                  <option value="CLOSED">Closed</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Entity Type
                </label>
                <select
                  value={entityTypeFilter}
                  onChange={(e) => {
                    setEntityTypeFilter(e.target.value);
                    setPage(1);
                  }}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 outline-none transition focus:border-[#163060] focus:bg-white focus:ring-2 focus:ring-[#163060]/10"
                >
                  <option value="">All Entities</option>
                  <option value="company">Direct Company</option>
                  <option value="consultancy">Consultancy</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Enquiry Source
                </label>
                <select
                  value={sourceFilter}
                  onChange={(e) => {
                    setSourceFilter(e.target.value);
                    setPage(1);
                  }}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 outline-none transition focus:border-[#163060] focus:bg-white focus:ring-2 focus:ring-[#163060]/10"
                >
                  <option value="">All Sources</option>
                  <option value="TALENT_CLOUD">Maven Talent Cloud</option>
                  <option value="EMPLOYER_LANDING">Employer Landing</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* ─── Tabular Enquiry View ─── */}
      <section className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_12px_35px_rgba(15,23,42,0.06)]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-100/75 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th colSpan="3" className="border-r border-slate-200/80 px-4 py-2.5 text-center">
                  Client &amp; Organization
                </th>
                <th colSpan="2" className="border-r border-slate-200/80 px-4 py-2.5 text-center">
                  Contact Details
                </th>
                <th colSpan="2" className="border-r border-slate-200/80 px-4 py-2.5 text-center">
                  Requirements
                </th>
                <th rowSpan="2" className="border-r border-slate-200/80 px-4 py-2.5 text-center align-middle">
                  Status
                </th>
                <th rowSpan="2" className="px-4 py-2.5 text-center align-middle">
                  Action
                </th>
              </tr>
              <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-600">
                <th className="px-4 py-3">Received Date</th>
                <th className="px-4 py-3">Ref ID</th>
                <th className="px-4 py-3">Client &amp; Company</th>
                <th className="px-4 py-3">Phone Number</th>
                <th className="px-4 py-3">Email &amp; Location</th>
                <th className="px-4 py-3 text-center">Headcount</th>
                <th className="px-4 py-3 text-center">Source</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="9" className="px-6 py-16 text-center">
                    <div className="inline-flex items-center gap-3 text-sm font-semibold text-slate-500">
                      <LuRefreshCw className="animate-spin text-[#163060]" size={18} />
                      <span>Loading enquiry records...</span>
                    </div>
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan="9" className="px-6 py-16 text-center">
                    <p className="text-base font-bold text-slate-800">No enquiry requests found</p>
                    <p className="mt-1 text-sm text-slate-400">
                      Try adjusting your search query or filter options.
                    </p>
                  </td>
                </tr>
              ) : (
                items.map((enquiry) => {
                  const statusMeta = STATUS_CONFIG[enquiry.status] || STATUS_CONFIG.NEW;
                  return (
                    <tr
                      key={enquiry._id}
                      className="border-b border-slate-100 transition-colors hover:bg-slate-50/80"
                    >
                      {/* Received Date */}
                      <td className="whitespace-nowrap px-4 py-3.5 text-xs font-medium text-slate-500">
                        {formatDate(enquiry.createdAt)}
                      </td>

                      {/* Ref ID */}
                      <td className="px-4 py-3.5">
                        <span className="inline-block whitespace-nowrap rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1 font-mono text-xs font-bold text-blue-700">
                          {enquiry.referenceId || "ENQ-GEN"}
                        </span>
                      </td>

                      {/* Client & Organization */}
                      <td className="px-4 py-3.5">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-sm font-bold text-slate-900">{enquiry.fullName}</span>
                          <span className="text-xs text-slate-500">
                            {enquiry.designation ? `${enquiry.designation} · ` : ""}
                            <strong className="text-slate-700">{enquiry.organizationName || "Independent"}</strong>
                          </span>
                          {enquiry.entityType && (
                            <div className="mt-1">
                              <span
                                className={`inline-block rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border ${
                                  enquiry.entityType === "company"
                                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                    : "bg-purple-50 text-purple-700 border-purple-200"
                                }`}
                              >
                                {enquiry.entityType}
                              </span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Phone Number */}
                      <td className="px-4 py-3.5">
                        <a
                          href={`tel:+91${enquiry.mobile}`}
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 transition hover:text-blue-800 hover:underline"
                          title="Call phone"
                        >
                          <LuPhone size={13} />
                          <span>+91 {enquiry.mobile}</span>
                        </a>
                      </td>

                      {/* Email & Location */}
                      <td className="px-4 py-3.5">
                        <div className="flex flex-col gap-1">
                          <a
                            href={`mailto:${enquiry.email}`}
                            className="inline-flex max-w-[220px] items-center gap-1.5 truncate text-xs font-medium text-slate-600 transition hover:text-slate-900"
                            title={enquiry.email}
                          >
                            <LuMail size={13} className="shrink-0 text-slate-400" />
                            <span className="truncate">{enquiry.email}</span>
                          </a>
                          <div className="inline-flex items-center gap-1 text-[11px] text-slate-400">
                            <LuMapPin size={11} className="shrink-0" />
                            <span>{enquiry.city || "Not specified"}</span>
                          </div>
                        </div>
                      </td>

                      {/* Headcount */}
                      <td className="px-4 py-3.5 text-center">
                        <span className="inline-flex min-w-8 items-center justify-center rounded-lg bg-slate-100 px-2 py-1 text-xs font-bold text-slate-700">
                          {enquiry.employeeCount || "-"}
                        </span>
                      </td>

                      {/* Source */}
                      <td className="px-4 py-3.5 text-center">
                        <span className="inline-block whitespace-nowrap rounded-lg border border-slate-200 bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                          {enquiry.source === "EMPLOYER_LANDING" ? "Landing Page" : "Talent Cloud"}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5 text-center">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold whitespace-nowrap ${statusMeta.bg}`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${statusMeta.dot}`} />
                          {statusMeta.label}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5 text-center">
                        <div className="inline-flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            className="rounded-xl p-2 text-blue-600 transition hover:bg-blue-50 hover:text-blue-800"
                            title="View & Process"
                            onClick={() => handleOpenModal(enquiry)}
                          >
                            <LuEye size={17} />
                          </button>
                          <a
                            href={`tel:+91${enquiry.mobile}`}
                            className="rounded-xl p-2 text-emerald-600 transition hover:bg-emerald-50 hover:text-emerald-800"
                            title="Quick Call"
                          >
                            <LuPhone size={15} />
                          </a>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ─── Table Pagination Bar ─── */}
        <div className="flex flex-col items-center justify-between gap-4 border-t border-slate-200 bg-white px-6 py-4 sm:flex-row">
          <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-slate-500">
            <span>
              Showing <strong className="font-bold text-slate-900">{total > 0 ? startIndex : 0}</strong> to{" "}
              <strong className="font-bold text-slate-900">{endIndex}</strong> of{" "}
              <strong className="font-bold text-slate-900">{total}</strong> entries
            </span>

            <div className="inline-flex items-center gap-2">
              <span>Rows per page:</span>
              <select
                value={limit}
                onChange={(e) => {
                  setLimit(Number(e.target.value));
                  setPage(1);
                }}
                className="rounded-xl border border-slate-200 bg-white px-2.5 py-1 text-xs sm:text-sm font-semibold text-slate-700 outline-none transition focus:border-[#163060]"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>

          <div className="inline-flex items-center gap-1.5">
            <button
              type="button"
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-40"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || loading}
              title="Previous Page"
            >
              <LuChevronLeft size={16} />
            </button>

            {Array.from({ length: Math.min(totalPages, 7) }, (_, idx) => {
              let pageNumber = idx + 1;
              if (totalPages > 7 && page > 4) {
                pageNumber = page - 3 + idx;
                if (pageNumber > totalPages) return null;
              }

              const isActive = page === pageNumber;

              return (
                <button
                  key={pageNumber}
                  type="button"
                  className={`inline-flex h-9 min-w-9 items-center justify-center rounded-xl px-3 text-xs font-bold transition ${
                    isActive
                      ? "bg-[#163060] text-white shadow-sm"
                      : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                  onClick={() => setPage(pageNumber)}
                  disabled={loading}
                >
                  {pageNumber}
                </button>
              );
            })}

            <button
              type="button"
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-40"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages || loading}
              title="Next Page"
            >
              <LuChevronRight size={16} />
            </button>
          </div>
        </div>
      </section>

      {/* ─── Detail & Status Update Modal ─── */}
      {isModalOpen && selectedEnquiry && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-xs"
          onClick={() => setIsModalOpen(false)}
          role="presentation"
        >
          <div
            className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-[28px] border border-slate-200 bg-white p-6 md:p-8 shadow-[0_30px_90px_rgba(15,23,42,0.25)]"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            {/* Header */}
            <header className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900">Enquiry Details</h2>
                <p className="mt-0.5 font-mono text-xs text-slate-400">
                  Reference: <span className="font-semibold text-slate-600">{selectedEnquiry.referenceId}</span>
                </p>
              </div>
              <button
                type="button"
                className="rounded-2xl border border-slate-200 p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                onClick={() => setIsModalOpen(false)}
                aria-label="Close"
              >
                <LuX size={18} />
              </button>
            </header>

            <div className="mt-5 space-y-6">
              {/* Quick Actions Header Strip */}
              <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50/80 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    {selectedEnquiry.fullName}
                  </h3>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {selectedEnquiry.designation ? `${selectedEnquiry.designation} at ` : ""}
                    <strong className="text-slate-700">{selectedEnquiry.organizationName || "Independent"}</strong>
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={`tel:+91${selectedEnquiry.mobile}`}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-700"
                  >
                    <LuPhone size={14} />
                    <span>Call Client</span>
                  </a>
                  <a
                    href={`mailto:${selectedEnquiry.email}`}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-3.5 py-2 text-xs font-bold text-blue-700 transition hover:bg-blue-100"
                  >
                    <LuMail size={14} />
                    <span>Email</span>
                  </a>
                </div>
              </div>

              {/* Company Information Section */}
              <div>
                <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                  Company &amp; Organization
                </h4>
                <div className="grid grid-cols-1 gap-3 rounded-2xl border border-slate-100 bg-slate-50/50 p-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                      <LuBuilding2 size={13} /> Organization Name
                    </span>
                    <p className="mt-0.5 text-base font-extrabold text-[#163060]">
                      {selectedEnquiry.organizationName || "Independent / Direct"}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-slate-500">Entity Type</span>
                    <p className="mt-0.5 text-sm font-semibold text-slate-800 capitalize">
                      {selectedEnquiry.entityType || "Company"}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-slate-500">Headcount</span>
                    <p className="mt-0.5 text-sm font-semibold text-slate-800">
                      {selectedEnquiry.employeeCount || "Not specified"}
                    </p>
                  </div>
                  <div>
                    <span className="flex items-center gap-1 text-xs font-semibold text-slate-500">
                      <LuMapPin size={13} /> Location
                    </span>
                    <p className="mt-0.5 text-sm font-semibold text-slate-800">
                      {selectedEnquiry.city || "Not specified"}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-slate-500">Lead Source</span>
                    <p className="mt-0.5 text-sm font-semibold text-slate-800">
                      {selectedEnquiry.source === "EMPLOYER_LANDING"
                        ? "Employer Landing Page"
                        : "Maven Talent Cloud"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Contact Information Section */}
              <div>
                <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                  Contact Information
                </h4>
                <div className="grid grid-cols-1 gap-3 rounded-2xl border border-slate-100 bg-slate-50/50 p-4 sm:grid-cols-2">
                  <div>
                    <span className="text-xs font-semibold text-slate-500">Contact Person</span>
                    <p className="mt-0.5 text-sm font-semibold text-slate-900">{selectedEnquiry.fullName}</p>
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-slate-500">Designation</span>
                    <p className="mt-0.5 text-sm font-semibold text-slate-800">
                      {selectedEnquiry.designation || "Not provided"}
                    </p>
                  </div>
                  <div>
                    <span className="flex items-center gap-1 text-xs font-semibold text-slate-500">
                      <LuPhone size={13} /> Phone
                    </span>
                    <p className="mt-0.5 text-sm font-semibold text-slate-800">+91 {selectedEnquiry.mobile}</p>
                  </div>
                  <div>
                    <span className="flex items-center gap-1 text-xs font-semibold text-slate-500">
                      <LuMail size={13} /> Work Email
                    </span>
                    <p className="mt-0.5 text-sm font-semibold text-slate-800">{selectedEnquiry.email}</p>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-xs font-semibold text-slate-500">Received Date &amp; Time</span>
                    <p className="mt-0.5 text-sm font-medium text-slate-700">
                      {formatDate(selectedEnquiry.createdAt)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Status Update & Internal Notes Card */}
              <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-blue-50/30 p-5 space-y-4">
                <h4 className="flex items-center gap-2 text-sm font-bold text-[#163060]">
                  <LuSparkles size={16} className="text-amber-500" />
                  <span>Process &amp; Update Pipeline Status</span>
                </h4>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                      Pipeline Stage
                    </label>
                    <select
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none transition focus:border-[#163060] focus:ring-2 focus:ring-[#163060]/10"
                    >
                      <option value="NEW">NEW - Needs Initial Call</option>
                      <option value="CONTACTED">CONTACTED - Call Completed</option>
                      <option value="IN_DISCUSSION">IN_DISCUSSION - Requirements Review</option>
                      <option value="DEMO_SCHEDULED">DEMO_SCHEDULED - Product Demo Booked</option>
                      <option value="CONVERTED">CONVERTED - Signed Up / Account Created</option>
                      <option value="CLOSED">CLOSED - Dropped / Not Interested</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                      Internal Notes
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Add conversation updates, follow-up times..."
                      value={editNotes}
                      onChange={(e) => setEditNotes(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-800 outline-none transition focus:border-[#163060] focus:ring-2 focus:ring-[#163060]/10"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
                    onClick={() => setIsModalOpen(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={isUpdating}
                    onClick={handleSaveStatus}
                    className="inline-flex items-center gap-2 rounded-xl bg-[#163060] px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-[#20498f] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isUpdating ? "Saving..." : "Save Status & Notes"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
