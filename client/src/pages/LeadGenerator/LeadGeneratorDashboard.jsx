import { startTransition, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  LuArrowUpRight,
  LuBadgeCheck,
  LuCalendarClock,
  LuCircleDot,
  LuNotebookTabs,
  LuPhoneCall,
  LuPlus,
  LuSparkles,
} from "react-icons/lu";
import { getLeadGeneratorDashboard } from "../../services/leadGeneratorApi";

const statusToneMap = {
  NEW: "bg-sky-100 text-sky-700",
  CONTACTED: "bg-amber-100 text-amber-700",
  QUALIFIED: "bg-violet-100 text-violet-700",
  FOLLOW_UP: "bg-orange-100 text-orange-700",
  WON: "bg-emerald-100 text-emerald-700",
  LOST: "bg-rose-100 text-rose-700",
};

const formatDate = (value) => {
  if (!value) {
    return "Not scheduled";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
};

const formatStatusLabel = (value = "") =>
  value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const StatCard = ({ title, value, note, icon, accent }) => {
  const IconComponent = icon;

  return (
    <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_22px_60px_-38px_rgba(15,23,42,0.45)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <h3 className="mt-3 text-3xl font-semibold text-slate-900">{value}</h3>
          <p className="mt-2 text-sm text-slate-500">{note}</p>
        </div>

        <div className={`rounded-2xl p-3 ${accent}`}>
          <IconComponent className="text-2xl" />
        </div>
      </div>
    </div>
  );
};

export default function LeadGeneratorDashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    const loadDashboard = async () => {
      try {
        setLoading(true);
        const data = await getLeadGeneratorDashboard();

        if (!active) {
          return;
        }

        startTransition(() => {
          setDashboard(data);
          setError("");
        });
      } catch (requestError) {
        if (!active) {
          return;
        }

        setError(
          requestError.response?.data?.message || "Unable to load lead dashboard right now.",
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadDashboard();

    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="rounded-[32px] bg-white p-8 shadow-sm">
          <div className="h-8 w-64 animate-pulse rounded-full bg-slate-200" />
          <div className="mt-4 h-4 w-96 animate-pulse rounded-full bg-slate-100" />
        </div>
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {[...Array(4)].map((_, index) => (
            <div
              key={index}
              className="h-40 animate-pulse rounded-[28px] bg-white shadow-sm"
            />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-[28px] border border-rose-200 bg-rose-50 p-6 text-rose-700">
        <p className="text-lg font-semibold">Lead dashboard unavailable</p>
        <p className="mt-2 text-sm">{error}</p>
      </div>
    );
  }

  const summary = dashboard?.summary || {};
  const recentLeads = dashboard?.recentLeads || [];
  const pipeline = dashboard?.pipeline || [];
  const sourceBreakdown = dashboard?.sourceBreakdown || [];
  const upcomingFollowUps = dashboard?.upcomingFollowUps || [];

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-[32px] bg-[#0f2f63] p-8 text-white shadow-[0_30px_90px_-35px_rgba(15,47,99,0.7)]">
        <div className="absolute right-0 top-0 h-44 w-44 rounded-full bg-lime-300/20 blur-2xl" />
        <div className="absolute bottom-0 right-16 h-28 w-28 rounded-full bg-sky-300/20 blur-2xl" />

        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-medium">
              <LuSparkles />
              Lead Generator Workspace
            </div>

            <h1 className="mt-5 text-3xl font-semibold md:text-4xl">
              Capture every business lead from one clean dashboard.
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-6 text-slate-200 md:text-base">
              Track fresh enquiries, follow-up commitments, and the strongest lead
              sources without switching screens.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              to="/lead-generator/add-lead"
              className="inline-flex items-center gap-2 rounded-2xl bg-lime-300 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-lime-200"
            >
              <LuPlus />
              Add New Lead
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total Leads"
          value={summary.totalLeads || 0}
          note={`${summary.leadsThisMonth || 0} added this month`}
          icon={LuNotebookTabs}
          accent="bg-sky-100 text-sky-700"
        />
        <StatCard
          title="Fresh Leads"
          value={summary.newLeads || 0}
          note="Need first outreach"
          icon={LuCircleDot}
          accent="bg-violet-100 text-violet-700"
        />
        <StatCard
          title="Follow Ups Today"
          value={summary.followUpsToday || 0}
          note="Scheduled for action today"
          icon={LuCalendarClock}
          accent="bg-amber-100 text-amber-700"
        />
        <StatCard
          title="Converted Leads"
          value={summary.wonLeads || 0}
          note={`${summary.contactedLeads || 0} already contacted`}
          icon={LuBadgeCheck}
          accent="bg-emerald-100 text-emerald-700"
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <div className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-[0_22px_60px_-38px_rgba(15,23,42,0.45)]">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Recent Leads</h2>
              <p className="mt-1 text-sm text-slate-500">
                Newest submissions reaching the lead generator queue.
              </p>
            </div>
            <Link
              to="/lead-generator/add-lead"
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
            >
              <LuArrowUpRight />
              Add Lead
            </Link>
          </div>

          <div className="mt-6 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="text-slate-500">
                <tr className="border-b border-slate-100">
                  <th className="pb-3 font-medium">Lead</th>
                  <th className="pb-3 font-medium">Category</th>
                  <th className="pb-3 font-medium">Source</th>
                  <th className="pb-3 font-medium">Location</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium">Follow Up</th>
                </tr>
              </thead>
              <tbody>
                {recentLeads.length ? (
                  recentLeads.map((lead) => (
                    <tr key={lead.id} className="border-b border-slate-100 last:border-b-0">
                      <td className="py-4">
                        <div>
                          <p className="font-semibold text-slate-900">{lead.contactName}</p>
                          <p className="text-xs text-slate-500">{lead.companyName}</p>
                          <p className="mt-1 text-xs text-slate-400">{lead.leadCode}</p>
                        </div>
                      </td>
                      <td className="py-4 text-slate-600">{lead.businessCategory}</td>
                      <td className="py-4 text-slate-600">{lead.leadSource}</td>
                      <td className="py-4 text-slate-600">
                        {lead.city}, {lead.state}
                      </td>
                      <td className="py-4">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                            statusToneMap[lead.status] || "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {formatStatusLabel(lead.status)}
                        </span>
                      </td>
                      <td className="py-4 text-slate-600">{formatDate(lead.nextFollowUpAt)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="py-10 text-center text-sm text-slate-500">
                      No leads found yet. Add your first lead to populate the dashboard.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-[0_22px_60px_-38px_rgba(15,23,42,0.45)]">
            <h2 className="text-xl font-semibold text-slate-900">Pipeline Snapshot</h2>
            <div className="mt-5 space-y-4">
              {pipeline.length ? (
                pipeline.map((item) => (
                  <div key={item.label}>
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span className="font-medium text-slate-700">
                        {formatStatusLabel(item.label)}
                      </span>
                      <span className="text-slate-500">{item.value}</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100">
                      <div
                        className="h-2 rounded-full bg-[#103C7F]"
                        style={{
                          width: `${Math.max(
                            12,
                            summary.totalLeads
                              ? Math.round((item.value / summary.totalLeads) * 100)
                              : 0,
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500">Pipeline data will appear once leads are added.</p>
              )}
            </div>
          </div>

          <div className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-[0_22px_60px_-38px_rgba(15,23,42,0.45)]">
            <h2 className="text-xl font-semibold text-slate-900">Lead Sources</h2>
            <div className="mt-5 space-y-3">
              {sourceBreakdown.length ? (
                sourceBreakdown.map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3"
                  >
                    <span className="text-sm font-medium text-slate-700">{item.label}</span>
                    <span className="text-sm font-semibold text-slate-900">{item.value}</span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500">Source distribution will appear here.</p>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <div className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-[0_22px_60px_-38px_rgba(15,23,42,0.45)]">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-emerald-100 p-3 text-emerald-700">
              <LuPhoneCall className="text-xl" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Upcoming Follow Ups</h2>
              <p className="text-sm text-slate-500">Closest follow-up commitments.</p>
            </div>
          </div>

          <div className="mt-5 space-y-4">
            {upcomingFollowUps.length ? (
              upcomingFollowUps.map((lead) => (
                <div
                  key={lead.id}
                  className="rounded-2xl border border-slate-100 bg-slate-50 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-900">{lead.contactName}</p>
                      <p className="text-sm text-slate-500">{lead.companyName}</p>
                    </div>
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700">
                      {formatDate(lead.nextFollowUpAt)}
                    </span>
                  </div>
                  <p className="mt-3 text-sm text-slate-600">
                    {lead.city}, {lead.state} • {lead.phone}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500">No follow-ups scheduled yet.</p>
            )}
          </div>
        </div>

        <div className="rounded-[30px] border border-slate-200 bg-white p-6 shadow-[0_22px_60px_-38px_rgba(15,23,42,0.45)]">
          <h2 className="text-xl font-semibold text-slate-900">Lead Generator Workflow</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {[
              {
                title: "Capture",
                text: "Add the enquiry once, with source, business category, and follow-up date.",
              },
              {
                title: "Qualify",
                text: "Track whether the lead is new, contacted, qualified, or waiting on the next action.",
              },
              {
                title: "Handover",
                text: "State Managers can pick up state-specific leads from the same backend dataset later.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-[24px] bg-gradient-to-b from-slate-50 to-white p-5 ring-1 ring-slate-100"
              >
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#103C7F]">
                  {item.title}
                </p>
                <p className="mt-3 text-sm leading-6 text-slate-600">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
