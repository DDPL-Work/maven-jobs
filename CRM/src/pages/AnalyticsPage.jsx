import { useEffect, useState } from "react";
import { LuChartColumnIncreasing, LuMapPinned } from "react-icons/lu";
import { PageState, PanelCard, SectionHeading } from "../components/Ui";
import { getAnalytics } from "../services/crmApi";
import { formatNumber } from "../utils/formatters";

function AnalyticsTable({ title, rows }) {
  return (
    <PanelCard>
      <SectionHeading title={title} />
      <div className="mt-6 overflow-hidden rounded-[24px] border border-slate-200">
        <div className="grid grid-cols-[1.1fr_0.7fr_0.7fr] gap-3 bg-slate-50 px-5 py-4 text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
          <span>Area</span>
          <span>Clients</span>
          <span>Open roles</span>
        </div>
        {rows.map((row) => (
          <div
            key={row.location}
            className="grid grid-cols-[1.1fr_0.7fr_0.7fr] gap-3 border-t border-slate-200 px-5 py-4 text-sm text-slate-600 transition hover:bg-lime-50/30"
          >
            <span className="font-semibold text-slate-900">{row.location}</span>
            <span>{formatNumber(row.clients)}</span>
            <span>{formatNumber(row.openRoles)}</span>
          </div>
        ))}
      </div>
    </PanelCard>
  );
}

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pageError, setPageError] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadAnalytics = async () => {
      setIsLoading(true);
      setPageError("");

      try {
        const response = await getAnalytics();
        if (isMounted) {
          setAnalytics(response.data);
        }
      } catch (requestError) {
        if (isMounted) {
          setPageError(requestError.message || "Unable to load analytics.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadAnalytics();

    return () => {
      isMounted = false;
    };
  }, []);

  if (isLoading) {
    return <PageState title="Loading analytics..." />;
  }

  if (pageError) {
    return <PageState title={pageError} error />;
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <section className="grid gap-4 md:grid-cols-2">
        <div className="flex items-center gap-4 rounded-[24px] border border-slate-200 bg-white p-5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#163060] to-[#2856a6] text-white">
            <LuChartColumnIncreasing size={18} />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-500">Regions tracked</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">
              {formatNumber(analytics.regions.length)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4 rounded-[24px] border border-slate-200 bg-white p-5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#7fd000] to-[#b2f114] text-slate-900">
            <LuMapPinned size={18} />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-500">Cities tracked</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">
              {formatNumber(analytics.cities.length)}
            </p>
          </div>
        </div>
      </section>

      <AnalyticsTable title="Region Performance" rows={analytics.regions} />
      <AnalyticsTable title="City Performance" rows={analytics.cities} />
      <AnalyticsTable title="Zone Performance" rows={analytics.zones} />
    </div>
  );
}
