import { useEffect, useMemo, useState } from "react";
import { LuBellRing, LuMail, LuSend } from "react-icons/lu";
import {
  Badge,
  EmptyState,
  MetricCard,
  PageState,
  PanelCard,
  SectionHeading,
  SelectField,
  TextAreaField,
  TextField,
} from "../components/Ui";
import { createNotification, getNotifications } from "../services/crmApi";
import { formatDateTime, formatNumber, titleCase } from "../utils/formatters";

const defaultForm = {
  title: "",
  message: "",
  audience: "CLIENTS",
  channel: "EMAIL",
};

export default function NotificationsPage() {
  const [campaigns, setCampaigns] = useState([]);
  const [formState, setFormState] = useState(defaultForm);
  const [isLoading, setIsLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [actionError, setActionError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const metrics = useMemo(() => {
    const emailCampaigns = campaigns.filter((item) => item.channel === "EMAIL").length;
    const appCampaigns = campaigns.filter((item) => item.channel === "APP").length;

    return [
      {
        label: "Campaigns sent",
        value: formatNumber(campaigns.length),
        icon: LuBellRing,
        tone: "blue",
      },
      {
        label: "Email campaigns",
        value: formatNumber(emailCampaigns),
        icon: LuMail,
        tone: "lime",
      },
      {
        label: "App campaigns",
        value: formatNumber(appCampaigns),
        icon: LuSend,
        tone: "amber",
      },
    ];
  }, [campaigns]);

  useEffect(() => {
    loadCampaigns();
  }, []);

  async function loadCampaigns() {
    setIsLoading(true);
    setPageError("");

    try {
      const response = await getNotifications();
      setCampaigns(response.data);
    } catch (requestError) {
      setPageError(requestError.message || "Unable to load notifications.");
    } finally {
      setIsLoading(false);
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSaving(true);
    setActionError("");

    try {
      await createNotification(formState);
      setFormState(defaultForm);
      await loadCampaigns();
    } catch (requestError) {
      setActionError(requestError.message || "Unable to send campaign.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <PageState title="Loading CRM campaigns..." />;
  }

  if (pageError) {
    return <PageState title={pageError} error />;
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <section className="grid gap-4 md:grid-cols-3">
        {metrics.map((metric) => (
          <MetricCard key={metric.label} {...metric} />
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <PanelCard>
          <SectionHeading
            title="Send bulk promotions and job alerts"
          />

          {actionError ? (
            <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
              {actionError}
            </div>
          ) : null}

          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            <TextField
              label="Campaign title"
              value={formState.title}
              onChange={(event) =>
                setFormState((current) => ({ ...current, title: event.target.value }))
              }
              required
            />
            <div className="grid gap-5 md:grid-cols-2">
              <SelectField
                label="Audience"
                value={formState.audience}
                onChange={(event) =>
                  setFormState((current) => ({
                    ...current,
                    audience: event.target.value,
                  }))
                }
                options={[
                  { label: "Clients", value: "CLIENTS" },
                  { label: "Candidates", value: "CANDIDATES" },
                ]}
              />
              <SelectField
                label="Channel"
                value={formState.channel}
                onChange={(event) =>
                  setFormState((current) => ({
                    ...current,
                    channel: event.target.value,
                  }))
                }
                options={[
                  { label: "Email", value: "EMAIL" },
                  { label: "App notification", value: "APP" },
                ]}
              />
            </div>
            <TextAreaField
              label="Message"
              value={formState.message}
              onChange={(event) =>
                setFormState((current) => ({
                  ...current,
                  message: event.target.value,
                }))
              }
              placeholder="Describe the campaign, job alert, or promotion message."
              required
            />
            <button
              type="submit"
              disabled={isSaving}
              className="w-full rounded-2xl bg-[#163060] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#20498f] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSaving ? "Sending..." : "Send campaign"}
            </button>
          </form>
        </PanelCard>

        <PanelCard>
          <SectionHeading
            title="Recent bulk communication"
          />

          <div className="mt-6 space-y-4">
            {campaigns.length ? (
              campaigns.map((campaign) => (
                <div
                  key={campaign.id}
                  className="rounded-[24px] border border-slate-200 p-5 transition hover:border-lime-300 hover:bg-lime-50/30"
                >
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="text-lg font-bold text-slate-900">
                      {campaign.title}
                    </h3>
                    <Badge tone="blue">{titleCase(campaign.channel)}</Badge>
                    <Badge tone="lime">{titleCase(campaign.audience)}</Badge>
                    <Badge tone="emerald">{titleCase(campaign.status)}</Badge>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-slate-500">
                    {campaign.message}
                  </p>
                  <p className="mt-4 text-sm text-slate-500">
                    Delivered to {formatNumber(campaign.sentCount)} recipients
                  </p>
                  <p className="mt-2 text-xs text-slate-400">
                    {formatDateTime(campaign.createdAt)}
                  </p>
                </div>
              ))
            ) : (
              <EmptyState
                title="No campaigns sent yet"
                description="Sent CRM promotions and job alerts will appear here."
              />
            )}
          </div>
        </PanelCard>
      </section>
    </div>
  );
}
