import { useEffect, useMemo, useState } from "react";
import {
  LuBellRing,
  LuBriefcaseBusiness,
  LuBuilding2,
  LuQrCode,
  LuShieldCheck,
  LuUsers,
} from "react-icons/lu";
import {
  Badge,
  EmptyState,
  MetricCard,
  PageState,
  PanelCard,
  SectionHeading,
  ModalShell,
} from "../components/Ui";
import { 
  getDashboardData, 
  getClients, 
  getJobs, 
  getJobApprovals, 
  getQRCodes 
} from "../services/crmApi";
import { formatDateTime, formatNumber, titleCase } from "../utils/formatters";

const metricConfig = [
  {
    label: "Client accounts",
    key: "totalClients",
    detail: "Managed client and company records across the CRM workspace.",
    icon: LuBuilding2,
    tone: "blue",
  },
  {
    label: "Job postings",
    key: "totalJobs",
    detail: "Published and client-submitted roles visible to CRM operations.",
    icon: LuBriefcaseBusiness,
    tone: "lime",
  },
  {
    label: "Pending approvals",
    key: "pendingApprovals",
    detail: "Client-created openings waiting for CRM review and release.",
    icon: LuShieldCheck,
    tone: "amber",
  },
  {
    label: "QR-enabled clients",
    key: "qrCodes",
    detail: "Distinct client companies with at least one active QR kit configured.",
    icon: LuQrCode,
    tone: "emerald",
  },
];

const PLATFORM_TABS = [
  { label: "Client", value: "client" },
  { label: "Candidate", value: "candidate" },
];

const CLIENT_PACKAGE_TABS = [
  { label: "Standard", value: "STANDARD" },
  { label: "Premium", value: "PREMIUM" },
  { label: "Elite", value: "ELITE" },
];

const normalizePackageType = (value = "") =>
  String(value || "").trim().toUpperCase() || "STANDARD";

const normalizeAudience = (value = "") => String(value || "").trim().toUpperCase();

function DashboardTabButton({ label, active = false, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center rounded-full border px-4 py-2 text-sm font-semibold transition ${
        active
          ? "border-[#163060] bg-[#163060] text-white shadow-[0_12px_30px_rgba(22,48,96,0.18)]"
          : "border-slate-200 bg-white text-slate-600 hover:border-lime-300 hover:bg-lime-50 hover:text-slate-900"
      }`}
    >
      {label}
    </button>
  );
}

export default function CrmDashboard() {
  const dashboardVisibleRows = 5;
  const [platformTab, setPlatformTab] = useState("client");
  const [clientPackageTab, setClientPackageTab] = useState("STANDARD");
  const [dashboard, setDashboard] = useState(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMetric, setSelectedMetric] = useState(null);
  const [modalData, setModalData] = useState([]);
  const [isModalLoading, setIsModalLoading] = useState(false);

  useEffect(() => {
    if (!selectedMetric) {
      setModalData([]);
      return;
    }

    let isMounted = true;
    (async () => {
      setIsModalLoading(true);
      try {
        let reqFn;
        if (selectedMetric.key === "totalClients") {
          reqFn = getClients;
        } else if (selectedMetric.key === "totalJobs") {
          reqFn = getJobs;
        } else if (selectedMetric.key === "pendingApprovals") {
          reqFn = getJobApprovals;
        } else if (selectedMetric.key === "qrCodes") {
          reqFn = getQRCodes;
        }
        
        if (reqFn) {
           const res = await reqFn();
           if (isMounted) setModalData(Array.isArray(res?.data) ? res.data : []);
        }
      } catch (err) {
        console.error("Failed to load metric details", err);
      } finally {
        if (isMounted) setIsModalLoading(false);
      }
    })();

    return () => { isMounted = false; };
  }, [selectedMetric]);

  useEffect(() => {
    let isMounted = true;

    const loadDashboard = async () => {
      setIsLoading(true);
      setError("");

      try {
        const response = await getDashboardData();

        if (isMounted) {
          setDashboard(response.data);
        }
      } catch (requestError) {
        if (isMounted) {
          setError(requestError.message || "Unable to load CRM dashboard.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadDashboard();

    return () => {
      isMounted = false;
    };
  }, []);

  const jobApprovals = dashboard?.jobApprovals || [];
  const applicationFeed = dashboard?.applicationFeed || [];
  const clientOverview = dashboard?.clientOverview || [];
  const qrOverview = dashboard?.qrOverview || [];
  const campaignFeed = dashboard?.campaignFeed || [];
  const hasApplicationFeedOverflow = applicationFeed.length > dashboardVisibleRows;

  const clientPackageLookup = useMemo(
    () =>
      new Map(
        clientOverview.map((client) => [
          String(client?.name || "").trim().toLowerCase(),
          normalizePackageType(client?.packageType),
        ]),
      ),
    [clientOverview],
  );

  const filteredClientOverview = useMemo(
    () =>
      clientOverview.filter(
        (client) => normalizePackageType(client?.packageType) === clientPackageTab,
      ),
    [clientOverview, clientPackageTab],
  );

  const matchesSelectedClientPackage = (companyName) =>
    clientPackageLookup.get(String(companyName || "").trim().toLowerCase()) === clientPackageTab;

  const filteredJobApprovals = useMemo(
    () => jobApprovals.filter((job) => matchesSelectedClientPackage(job.companyName)),
    [jobApprovals, clientPackageLookup, clientPackageTab],
  );

  const filteredQrOverview = useMemo(
    () => qrOverview.filter((item) => matchesSelectedClientPackage(item.companyName)),
    [qrOverview, clientPackageLookup, clientPackageTab],
  );

  const filteredApplicationFeedForClient = useMemo(
    () => applicationFeed.filter((item) => matchesSelectedClientPackage(item.companyName)),
    [applicationFeed, clientPackageLookup, clientPackageTab],
  );

  const clientCampaignFeed = useMemo(
    () => campaignFeed.filter((item) => normalizeAudience(item.audience) === "CLIENTS"),
    [campaignFeed],
  );

  const candidateCampaignFeed = useMemo(
    () => campaignFeed.filter((item) => normalizeAudience(item.audience) === "CANDIDATES"),
    [campaignFeed],
  );

  const filteredQrClientCount = useMemo(
    () => new Set(filteredQrOverview.map((item) => String(item.companyName || "").trim())).size,
    [filteredQrOverview],
  );

  const candidateCompanyReach = useMemo(() => {
    const companyMap = new Map();

    applicationFeed.forEach((application) => {
      const companyName = String(application.companyName || "Unknown company").trim();
      const existing = companyMap.get(companyName) || {
        companyName,
        applications: 0,
        roles: new Set(),
      };
      existing.applications += 1;
      if (application.jobTitle) {
        existing.roles.add(String(application.jobTitle).trim());
      }
      companyMap.set(companyName, existing);
    });

    return Array.from(companyMap.values())
      .map((item) => ({
        companyName: item.companyName,
        applications: item.applications,
        roleCount: item.roles.size,
      }))
      .sort((left, right) => right.applications - left.applications)
      .slice(0, 5);
  }, [applicationFeed]);

  const clientMetrics = useMemo(
    () => [
      {
        ...metricConfig[0],
        value: formatNumber(filteredClientOverview.length),
        detail: `${titleCase(clientPackageTab)} accounts in the selected client package.`,
      },
      {
        ...metricConfig[1],
        value: formatNumber(
          filteredClientOverview.reduce(
            (total, client) => total + Number(client.activeJobCount || 0),
            0,
          ),
        ),
        detail: `${titleCase(clientPackageTab)} live roles currently mapped to CRM operations.`,
      },
      {
        ...metricConfig[2],
        value: formatNumber(filteredJobApprovals.length),
        detail: `${titleCase(clientPackageTab)} client openings awaiting CRM review.`,
      },
      {
        ...metricConfig[3],
        value: formatNumber(filteredQrClientCount),
        detail: `${titleCase(clientPackageTab)} clients with active QR delivery coverage.`,
      },
    ],
    [clientPackageTab, filteredClientOverview, filteredJobApprovals.length, filteredQrClientCount],
  );

  const candidateMetrics = useMemo(() => {
    const uniqueCompanies = new Set(
      applicationFeed.map((item) => String(item.companyName || "").trim()).filter(Boolean),
    );
    const uniqueRoles = new Set(
      applicationFeed.map((item) => String(item.jobTitle || "").trim()).filter(Boolean),
    );

    return [
      {
        label: "Candidate applications",
        value: formatNumber(applicationFeed.length),
        detail: "Candidate-side pipeline movement visible from the CRM workspace.",
        icon: LuUsers,
        tone: "blue",
      },
      {
        label: "Hiring companies",
        value: formatNumber(uniqueCompanies.size),
        detail: "Client companies currently receiving candidate-side visibility.",
        icon: LuBuilding2,
        tone: "lime",
      },
      {
        label: "Candidate campaigns",
        value: formatNumber(candidateCampaignFeed.length),
        detail: "Outbound candidate-facing campaigns issued from CRM notifications.",
        icon: LuBellRing,
        tone: "amber",
      },
      {
        label: "Live roles touched",
        value: formatNumber(uniqueRoles.size),
        detail: "Distinct openings currently appearing in candidate-side activity.",
        icon: LuBriefcaseBusiness,
        tone: "emerald",
      },
    ];
  }, [applicationFeed, candidateCampaignFeed.length]);

  const visibleMetrics = platformTab === "client" ? clientMetrics : candidateMetrics;

  useEffect(() => {
    setSelectedMetric(null);
  }, [platformTab, clientPackageTab]);

  if (isLoading) {
    return <PageState title="Loading CRM dashboard..." />;
  }

  if (error) {
    return <PageState title={error} error />;
  }

  const renderModalContent = () => {
    if (!selectedMetric || !dashboard) return null;

    const key = selectedMetric.key;

    if (key === "totalClients") {
      const filteredClients =
        platformTab === "client"
          ? modalData.filter(
              (client) => normalizePackageType(client.packageType) === clientPackageTab,
            )
          : modalData;

      return (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px] border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <th className="px-5 py-4">Company Name</th>
                <th className="px-5 py-4">Package</th>
                <th className="px-5 py-4">Jobs Used</th>
                <th className="px-5 py-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {isModalLoading ? (
                <tr>
                  <td colSpan={4} className="px-5 py-8 text-center text-sm text-slate-500">Loading data...</td>
                </tr>
              ) : filteredClients.length ? (
                filteredClients.map((client) => (
                  <tr key={client.name || client.id} className="border-b border-slate-100 transition hover:bg-slate-50">
                    <td className="px-5 py-4 text-sm font-medium text-slate-900">{client.name}</td>
                    <td className="px-5 py-4 text-sm text-slate-500">{titleCase(client.packageType || "STANDARD")}</td>
                    <td className="px-5 py-4 text-sm text-slate-500">{client.activeJobCount || 0} / {client.jobLimit || 0}</td>
                    <td className="px-5 py-4">
                      <Badge tone={client.status === "ACTIVE" ? "emerald" : "rose"}>
                        {titleCase(client.status || "ACTIVE")}
                      </Badge>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-5 py-8 text-center text-sm text-slate-500">No client data available.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      );
    }

    if (key === "pendingApprovals" || key === "totalJobs") {
      let dataSet =
        key === "pendingApprovals"
          ? modalData.filter((job) => job.approvalStatus === "PENDING")
          : modalData;

      if (platformTab === "client") {
        dataSet = dataSet.filter((job) => matchesSelectedClientPackage(job.companyName));
      }

      return (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px] border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <th className="px-5 py-4">Job Role</th>
                <th className="px-5 py-4">Company & Dept</th>
                <th className="px-5 py-4">Details</th>
                <th className="px-5 py-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {isModalLoading ? (
                <tr>
                  <td colSpan={4} className="px-5 py-8 text-center text-sm text-slate-500">Loading data...</td>
                </tr>
              ) : dataSet.length ? (
                dataSet.map((job) => (
                  <tr key={job.id} className="border-b border-slate-100 transition hover:bg-slate-50">
                    <td className="px-5 py-4 text-sm font-medium text-slate-900">{job.title}</td>
                    <td className="px-5 py-4 text-sm text-slate-500">
                      {job.companyName}<br/><span className="text-xs text-slate-400">{job.department || "General"}</span>
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-500">
                      {job.workplaceType || "Flexible"} &bull; {job.location || "Pending"}
                    </td>
                    <td className="px-5 py-4">
                      <Badge tone={job.approvalStatus === "PENDING" ? "amber" : "emerald"}>
                        {titleCase(job.approvalStatus || "ACTIVE")}
                      </Badge>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-5 py-8 text-center text-sm text-slate-500">No job data available.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      );
    }

    if (key === "qrCodes") {
      const filteredQrData =
        platformTab === "client"
          ? modalData.filter((item) => matchesSelectedClientPackage(item.companyName))
          : modalData;

      return (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px] border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <th className="px-5 py-4">Company</th>
                <th className="px-5 py-4">Position</th>
                <th className="px-5 py-4">Scans</th>
              </tr>
            </thead>
            <tbody>
              {isModalLoading ? (
                <tr>
                  <td colSpan={3} className="px-5 py-8 text-center text-sm text-slate-500">Loading data...</td>
                </tr>
              ) : filteredQrData.length ? (
                filteredQrData.map((item) => (
                  <tr key={item.id} className="border-b border-slate-100 transition hover:bg-slate-50">
                    <td className="px-5 py-4 text-sm font-medium text-slate-900">{item.companyName}</td>
                    <td className="px-5 py-4 text-sm text-slate-500">{item.jobTitle || "Landing Page"}</td>
                    <td className="px-5 py-4">
                      <Badge tone="blue">{formatNumber(item.scans || 0)}</Badge>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="px-5 py-8 text-center text-sm text-slate-500">No QR data available.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center justify-center py-4 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#163060]/10 text-[#163060]">
          {selectedMetric?.icon ? <selectedMetric.icon size={28} /> : null}
        </div>
        <p className="text-3xl font-bold text-slate-900">{selectedMetric?.value}</p>
      </div>
    );
  };

  return (
    <div className="mx-auto grid w-full max-w-[1600px] gap-8 xl:grid-cols-[minmax(0,1080px)_1fr]">
      <div className="w-full space-y-6">
        <PanelCard className="p-5">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                CRM visibility
              </p>
              <h1 className="mt-2 text-3xl font-bold text-slate-900">
                Platform and package ad review
              </h1>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Switch between client and candidate views, and narrow client operations by package tier while keeping the right side open for ad inventory.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {PLATFORM_TABS.map((tab) => (
                <DashboardTabButton
                  key={tab.value}
                  label={tab.label}
                  active={platformTab === tab.value}
                  onClick={() => setPlatformTab(tab.value)}
                />
              ))}
            </div>
          </div>

          {platformTab === "client" ? (
            <div className="mt-5 flex flex-wrap gap-2">
              {CLIENT_PACKAGE_TABS.map((tab) => (
                <DashboardTabButton
                  key={tab.value}
                  label={tab.label}
                  active={clientPackageTab === tab.value}
                  onClick={() => setClientPackageTab(tab.value)}
                />
              ))}
            </div>
          ) : (
            <div className="mt-5 rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
              Candidate view separates candidate-facing activity and candidate campaigns so CRM can review that platform independently from client package controls.
            </div>
          )}
        </PanelCard>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {visibleMetrics.map((metric) => {
            const isClientMetric =
              platformTab === "client" &&
              ["totalClients", "totalJobs", "pendingApprovals", "qrCodes"].includes(metric.key);

            return (
              <MetricCard
                key={metric.key || metric.label}
                {...metric}
                onClick={isClientMetric ? () => setSelectedMetric(metric) : undefined}
              />
            );
          })}
        </section>

        {platformTab === "client" ? (
          <>
            <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
              <PanelCard>
                <SectionHeading
                  eyebrow="Operational readiness"
                  title={`${titleCase(clientPackageTab)} client delivery posture`}
                  description="Review package commitments, live capacity, and company-level readiness for the selected client package."
                />

                <div className="mt-6 overflow-hidden rounded-[24px] border border-slate-200">
                  <div className="grid grid-cols-[1.2fr_0.8fr_0.8fr_0.6fr] gap-3 bg-slate-50 px-5 py-4 text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                    <span>Client company</span>
                    <span>Package</span>
                    <span>Jobs</span>
                    <span>Status</span>
                  </div>
                  {filteredClientOverview.length ? (
                    filteredClientOverview.map((client) => (
                      <div
                        key={client.name}
                        className="grid grid-cols-[1.2fr_0.8fr_0.8fr_0.6fr] gap-3 border-t border-slate-200 px-5 py-4 text-sm text-slate-600 transition hover:bg-lime-50/30"
                      >
                        <div className="font-semibold text-slate-900">{client.name}</div>
                        <div>{titleCase(client.packageType)}</div>
                        <div>
                          {client.activeJobCount}/{client.jobLimit} live
                        </div>
                        <div>
                          <Badge tone={client.status === "ACTIVE" ? "emerald" : "rose"}>
                            {titleCase(client.status)}
                          </Badge>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-6">
                      <EmptyState
                        title={`No ${titleCase(clientPackageTab)} clients yet`}
                        description="Once CRM assigns companies to this package tier, package coverage and job usage will appear here."
                      />
                    </div>
                  )}
                </div>
              </PanelCard>

              <PanelCard>
                <SectionHeading
                  eyebrow="Client-side outputs"
                  title="Campaign and QR activity"
                  description="Client platform campaigns stay visible here, while the package filter narrows QR and delivery posture to the selected plan."
                />

                <div className="mt-6 space-y-4">
                  <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-500">
                          Client campaigns sent
                        </p>
                        <p className="mt-2 text-3xl font-bold text-slate-900">
                          {formatNumber(clientCampaignFeed.length)}
                        </p>
                      </div>
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#163060] to-[#2856a6] text-white">
                        <LuBellRing size={20} />
                      </div>
                    </div>
                  </div>

                  <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-500">
                          QR records in {titleCase(clientPackageTab)}
                        </p>
                        <p className="mt-2 text-3xl font-bold text-slate-900">
                          {formatNumber(filteredQrOverview.length)}
                        </p>
                      </div>
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-600 to-lime-500 text-white">
                        <LuQrCode size={20} />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {filteredQrOverview.length ? (
                      filteredQrOverview.slice(0, 3).map((item) => (
                        <div
                          key={item.id}
                          className="rounded-[20px] border border-slate-200 p-4 transition hover:border-lime-300 hover:bg-lime-50/30"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="font-semibold text-slate-900">
                                {item.companyName}
                              </p>
                              <p className="mt-1 text-sm text-slate-500">
                                {item.jobTitle || "Landing Page"}
                              </p>
                            </div>
                            <Badge tone="blue">{formatNumber(item.scans)} scans</Badge>
                          </div>
                        </div>
                      ))
                    ) : (
                      <EmptyState
                        title={`No QR activity for ${titleCase(clientPackageTab)}`}
                        description="QR records mapped to the selected package will appear here once CRM generates or shares them."
                      />
                    )}
                  </div>

                  <div className="space-y-3">
                    {clientCampaignFeed.length ? (
                      clientCampaignFeed.slice(0, 3).map((item) => (
                        <div
                          key={item.id}
                          className="rounded-[20px] border border-slate-200 p-4 transition hover:border-lime-300 hover:bg-lime-50/30"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <p className="font-semibold text-slate-900">{item.title}</p>
                            <Badge tone="lime">{titleCase(item.channel)}</Badge>
                          </div>
                          <p className="mt-2 text-sm text-slate-500">
                            {titleCase(item.audience)} reached: {formatNumber(item.sentCount)}
                          </p>
                          <p className="mt-2 text-xs text-slate-400">
                            {formatDateTime(item.createdAt)}
                          </p>
                        </div>
                      ))
                    ) : (
                      <EmptyState
                        title="No client campaigns sent yet"
                        description="Client-facing outbound campaigns from CRM notifications will appear here."
                      />
                    )}
                  </div>
                </div>
              </PanelCard>
            </section>

            <section className="grid gap-6 xl:grid-cols-2">
              <PanelCard>
                <SectionHeading
                  eyebrow="Approval queue"
                  title={`${titleCase(clientPackageTab)} jobs awaiting CRM review`}
                  description="Review package-specific client approvals before these roles go live."
                />

                <div
                  className={`mt-6 space-y-3 ${
                    filteredJobApprovals.length > dashboardVisibleRows
                      ? "crm-scroll-panel max-h-[33rem] overflow-y-auto pr-2"
                      : ""
                  }`}
                >
                  {filteredJobApprovals.length ? (
                    filteredJobApprovals.map((job) => (
                      <div
                        key={job.id}
                        className="rounded-[20px] border border-slate-200 p-4 transition hover:border-lime-300 hover:bg-lime-50/30"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="font-semibold text-slate-900">{job.title}</p>
                            <p className="mt-1 text-sm text-slate-500">
                              {job.companyName} {"\u2022"} {job.department || "General"}
                            </p>
                          </div>
                          <Badge tone={job.approvalStatus === "PENDING" ? "amber" : "rose"}>
                            {titleCase(job.approvalStatus)}
                          </Badge>
                        </div>
                        <p className="mt-3 text-sm text-slate-500">
                          {job.jobType || "Role"} {"\u2022"} {job.workplaceType || "Flexible"} {"\u2022"}{" "}
                          {job.location || "Location pending"}
                        </p>
                      </div>
                    ))
                  ) : (
                    <EmptyState
                      title={`Approval queue is clear for ${titleCase(clientPackageTab)}`}
                      description="Client-submitted openings in the selected package will appear here when they need CRM review."
                    />
                  )}
                </div>
              </PanelCard>

              <PanelCard>
                <SectionHeading
                  eyebrow="Application flow"
                  title={`Candidate activity for ${titleCase(clientPackageTab)} clients`}
                  description="This view tracks candidate-side movement only for companies currently mapped to the selected client package."
                />

                <div
                  className={`mt-6 space-y-3 ${
                    filteredApplicationFeedForClient.length > dashboardVisibleRows
                      ? "crm-scroll-panel max-h-[33rem] overflow-y-auto pr-2"
                      : ""
                  }`}
                >
                  {filteredApplicationFeedForClient.length ? (
                    filteredApplicationFeedForClient.map((application) => (
                      <div
                        key={application.id}
                        className="rounded-[20px] border border-slate-200 p-4 transition hover:border-lime-300 hover:bg-lime-50/30"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="font-semibold text-slate-900">
                              {application.candidateName}
                            </p>
                            <p className="mt-1 text-sm text-slate-500">
                              {application.companyName} {"\u2022"} {application.jobTitle}
                            </p>
                          </div>
                          <Badge tone="blue">{titleCase(application.status)}</Badge>
                        </div>
                        <p className="mt-3 text-xs text-slate-400">
                          Updated {formatDateTime(application.updatedAt)}
                        </p>
                      </div>
                    ))
                  ) : (
                    <EmptyState
                      title={`No candidate movement for ${titleCase(clientPackageTab)}`}
                      description="Candidate activity from companies on the selected package will appear here."
                    />
                  )}
                </div>
              </PanelCard>
            </section>
          </>
        ) : (
          <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
            <PanelCard>
              <SectionHeading
                eyebrow="Candidate-side visibility"
                title="Recent candidate activity"
                description="CRM can review current candidate movement independently from client package controls."
              />

              <div
                className={`mt-6 space-y-3 ${
                  hasApplicationFeedOverflow
                    ? "crm-scroll-panel max-h-[45rem] overflow-y-auto pr-2"
                    : ""
                }`}
              >
                {applicationFeed.length ? (
                  applicationFeed.map((application) => (
                    <div
                      key={application.id}
                      className="rounded-[20px] border border-slate-200 p-4 transition hover:border-lime-300 hover:bg-lime-50/30"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-semibold text-slate-900">
                            {application.candidateName}
                          </p>
                          <p className="mt-1 text-sm text-slate-500">
                            {application.companyName} {"\u2022"} {application.jobTitle}
                          </p>
                        </div>
                        <Badge tone="blue">{titleCase(application.status)}</Badge>
                      </div>
                      <p className="mt-3 text-xs text-slate-400">
                        Updated {formatDateTime(application.updatedAt)}
                      </p>
                    </div>
                  ))
                ) : (
                  <EmptyState
                    title="No candidate activity available"
                    description="Candidate-side applications and status movement will appear here once the platform starts receiving submissions."
                  />
                )}
              </div>
            </PanelCard>

            <div className="space-y-6">
              <PanelCard>
                <SectionHeading
                  eyebrow="Candidate campaigns"
                  title="Candidate platform campaigns"
                  description="Candidate-facing outbound campaigns are separated here from client-side promotion activity."
                />

                <div className="mt-6 space-y-4">
                  <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-500">
                          Candidate campaigns sent
                        </p>
                        <p className="mt-2 text-3xl font-bold text-slate-900">
                          {formatNumber(candidateCampaignFeed.length)}
                        </p>
                      </div>
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#163060] to-[#2856a6] text-white">
                        <LuBellRing size={20} />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {candidateCampaignFeed.length ? (
                      candidateCampaignFeed.slice(0, 4).map((item) => (
                        <div
                          key={item.id}
                          className="rounded-[20px] border border-slate-200 p-4 transition hover:border-lime-300 hover:bg-lime-50/30"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <p className="font-semibold text-slate-900">{item.title}</p>
                            <Badge tone="lime">{titleCase(item.channel)}</Badge>
                          </div>
                          <p className="mt-2 text-sm text-slate-500">
                            {titleCase(item.audience)} reached: {formatNumber(item.sentCount)}
                          </p>
                          <p className="mt-2 text-xs text-slate-400">
                            {formatDateTime(item.createdAt)}
                          </p>
                        </div>
                      ))
                    ) : (
                      <EmptyState
                        title="No candidate campaigns sent yet"
                        description="Candidate-facing promotions from CRM notifications will appear here."
                      />
                    )}
                  </div>
                </div>
              </PanelCard>

              <PanelCard>
                <SectionHeading
                  eyebrow="Platform reach"
                  title="Top client reach on candidate side"
                  description="A quick snapshot of which client companies are currently drawing the most candidate activity."
                />

                <div className="mt-6 space-y-3">
                  {candidateCompanyReach.length ? (
                    candidateCompanyReach.map((item) => (
                      <div
                        key={item.companyName}
                        className="flex items-center justify-between rounded-[20px] border border-slate-200 p-4 transition hover:border-lime-300 hover:bg-lime-50/30"
                      >
                        <div>
                          <p className="font-semibold text-slate-900">{item.companyName}</p>
                          <p className="mt-1 text-sm text-slate-500">
                            {formatNumber(item.roleCount)} active roles in flow
                          </p>
                        </div>
                        <Badge tone="blue">{formatNumber(item.applications)} applications</Badge>
                      </div>
                    ))
                  ) : (
                    <EmptyState
                      title="No candidate reach data yet"
                      description="Once candidate-side applications start flowing, the most active client companies will surface here."
                    />
                  )}
                </div>
              </PanelCard>
            </div>
          </section>
        )}

        <ModalShell
          open={Boolean(selectedMetric)}
          title={selectedMetric?.label || ""}
          description={selectedMetric?.detail || ""}
          onClose={() => setSelectedMetric(null)}
          width="max-w-4xl"
        >
          {renderModalContent()}
        </ModalShell>
      </div>

      <div className="hidden xl:block" aria-hidden="true" />
    </div>
  );
}
