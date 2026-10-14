import { useEffect, useState } from "react";
import {
  LuSparkles,
  LuChevronLeft,
  LuChevronRight,
  LuChevronsLeft,
  LuChevronsRight,
} from "react-icons/lu";
import { useLocation } from "react-router-dom";
import { getSectionData } from "../services/adminApi";

export default function AdminSection() {
  const { pathname } = useLocation();
  const sectionKey = pathname.split("/").filter(Boolean).at(-1);
  const [section, setSection] = useState(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    setCurrentPage(1);
    let isMounted = true;

    const loadSection = async () => {
      setIsLoading(true);
      setError("");

      try {
        const response = await getSectionData(sectionKey);

        if (isMounted) {
          setSection(response.data);
        }
      } catch (requestError) {
        if (isMounted) {
          setError(requestError.message || "Unable to load this Admin section.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadSection();

    return () => {
      isMounted = false;
    };
  }, [sectionKey]);

  if (isLoading) {
    return <PageState title="Loading section..." />;
  }

  if (error || !section) {
    return <PageState title={error || "Section not found."} error />;
  }

  // Pagination calculations
  const tableRows = section?.tableRows || [];
  const totalEntries = tableRows.length;
  const totalPages = Math.max(1, Math.ceil(totalEntries / pageSize));
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);
  const startIndex = (safeCurrentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalEntries);
  const paginatedRows = tableRows.slice(startIndex, endIndex);

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

  return (
    <div className="mx-auto w-full max-w-7xl">
      <section className="grid gap-4 md:grid-cols-3">
        {section.metrics.map((item) => (
          <article
            key={item.label}
            className="group flex min-h-[170px] flex-col justify-between rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_12px_35px_rgba(15,23,42,0.06)] transition-all duration-200 hover:-translate-y-1 hover:border-lime-300 hover:shadow-[0_22px_55px_rgba(132,204,22,0.14)]"
          >
            <p className="text-sm font-semibold text-slate-500">{item.label}</p>
            <p className="mt-4 text-3xl font-bold text-slate-900">
              {item.value}
            </p>
          </article>
        ))}
      </section>

      <section className="mt-6">
        <article className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_12px_35px_rgba(15,23,42,0.06)]">
          <div className="flex items-center gap-2">
            <LuSparkles size={16} className="text-lime-500" />
            <h2 className="text-lg font-bold text-slate-900">Focus areas</h2>
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {section.cards.map((card) => (
              <div
                key={card.title}
                className="group flex min-h-[185px] flex-col justify-between rounded-[22px] border border-slate-200 bg-slate-50 p-5 transition-all duration-200 hover:border-lime-300 hover:bg-lime-50/40"
              >
                <p className="text-sm font-semibold text-slate-500">
                  {card.title}
                </p>
                <p className="mt-4 text-xl font-bold text-slate-900">
                  {card.value}
                </p>
                <p className="mt-4 text-sm leading-6 text-slate-600">
                  {card.note}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-6 overflow-hidden rounded-[22px] border border-slate-200">
            <div
              className="grid min-h-[56px] items-center gap-3 bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400"
              style={{
                gridTemplateColumns: `repeat(${section.tableColumns.length}, minmax(0, 1fr))`,
              }}
            >
              {section.tableColumns.map((column) => (
                <span key={column}>{column}</span>
              ))}
            </div>
            <div className="divide-y divide-slate-200">
              {paginatedRows.length === 0 ? (
                <div className="py-12 text-center text-sm text-slate-400">
                  No records found.
                </div>
              ) : (
                paginatedRows.map((row, rowIndex) => (
                  <div
                    key={`${row.join("-")}-${rowIndex}`}
                    className="grid min-h-[74px] items-center gap-3 px-4 py-4 text-sm text-slate-700 transition-colors duration-200 hover:bg-lime-50/40"
                    style={{
                      gridTemplateColumns: `repeat(${section.tableColumns.length}, minmax(0, 1fr))`,
                    }}
                  >
                    {row.map((cell, index) => (
                      <span
                        key={`${cell}-${index}`}
                        className={`leading-6 ${
                          index === 0
                            ? "font-semibold text-slate-900"
                            : "font-medium text-slate-600"
                        }`}
                      >
                        {cell}
                      </span>
                    ))}
                  </div>
                ))
              )}
            </div>

            {/* Table Pagination Footer */}
            {tableRows.length > 0 && (
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
        </article>
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
          Admin Section
        </p>
        <p className="mt-3 text-lg font-semibold text-slate-900">{title}</p>
      </div>
    </div>
  );
}