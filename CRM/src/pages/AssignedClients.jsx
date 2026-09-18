import { useEffect, useMemo, useState } from "react";
import {
  LuBuilding2,
  LuBriefcaseBusiness,
  LuSearch,
  LuSettings2,
  LuUsers,
} from "react-icons/lu";
import {
  Badge,
  EmptyState,
  MetricCard,
  PageState,
  PanelCard,
  SectionHeading,
  SelectField,
  ToolbarInput,
} from "../components/Ui";
import {
  getAssignedClients,
  getPackages,
} from "../services/crmApi";
import { formatNumber, titleCase } from "../utils/formatters";

export default function AssignedClients() {
  const [clients, setClients] = useState([]);
  const [packages, setPackages] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [packageFilter, setPackageFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [isLoading, setIsLoading] = useState(true);
  const [pageError, setPageError] = useState("");


  const filteredClients = useMemo(() => {
    return clients.filter((client) => {
      const haystack = [
        client.name,
        client.industry,
        client.email,
        client.city,
        client.region,
        client.zone,
        client.accountManager,
        client.clientUser?.name,
        client.clientUser?.email,
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        !searchQuery.trim() || haystack.includes(searchQuery.trim().toLowerCase());
      const matchesPackage =
        packageFilter === "ALL" || client.packageType === packageFilter;
      const matchesStatus = statusFilter === "ALL" || client.status === statusFilter;

      return matchesSearch && matchesPackage && matchesStatus;
    });
  }, [clients, packageFilter, searchQuery, statusFilter]);

  useEffect(() => {
    loadPage();
  }, []);

  const metricCards = useMemo(() => {
    const activeClients = clients.filter((client) => client.status === "ACTIVE").length;
    const totalSlots = clients.reduce((sum, client) => sum + Number(client.jobLimit || 0), 0);
    const liveJobs = clients.reduce(
      (sum, client) => sum + Number(client.activeJobCount || 0),
      0,
    );
    const overLimitClients = clients.filter(
      (client) => Number(client.activeJobCount || 0) > Number(client.jobLimit || 0),
    ).length;

    return [
      {
        label: "Managed clients",
        value: formatNumber(clients.length),
        icon: LuBuilding2,
        tone: "blue",
      },
      {
        label: "Active accounts",
        value: formatNumber(activeClients),
        icon: LuUsers,
        tone: "lime",
      },
      {
        label: "Configured slots",
        value: formatNumber(totalSlots),
        icon: LuSettings2,
        tone: "amber",
      },
      {
        label: "Live jobs",
        value: formatNumber(liveJobs),
        icon: LuBuilding2,
        tone: "emerald",
      },
      {
        label: "Over limit",
        value: formatNumber(overLimitClients),
        icon: LuBriefcaseBusiness,
        tone: "rose",
      },
    ];
  }, [clients]);

  async function loadPage() {
    setIsLoading(true);
    setPageError("");

    try {
      const [clientsResponse, packagesResponse] = await Promise.all([
        getAssignedClients(),
        getPackages(),
      ]);

      setClients(clientsResponse.data);
      setPackages(packagesResponse.data);
    } catch (requestError) {
      setPageError(requestError.message || "Unable to load client accounts.");
    } finally {
      setIsLoading(false);
    }
  }



  if (isLoading) {
    return <PageState title="Loading client operations..." />;
  }

  if (pageError) {
    return <PageState title={pageError} error />;
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {metricCards.map((metric) => (
          <MetricCard key={metric.label} {...metric} />
        ))}
      </section>

      <PanelCard>
        <SectionHeading
          title="View all client/company accounts assigned to you"
        />

        <div className="mt-6 grid gap-3 xl:grid-cols-[1.2fr_0.8fr_0.8fr]">
          <ToolbarInput
            icon={LuSearch}
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search company, manager, geography, or client credentials"
          />
          <SelectField
            label="Package"
            value={packageFilter}
            onChange={(event) => setPackageFilter(event.target.value)}
            options={[
              { label: "All packages", value: "ALL" },
              ...packages.map((pkg) => ({
                label: titleCase(pkg.name),
                value: pkg.name,
              })),
            ]}
          />
          <SelectField
            label="Status"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            options={[
              { label: "All statuses", value: "ALL" },
              { label: "Active", value: "ACTIVE" },
              { label: "Inactive", value: "INACTIVE" },
            ]}
          />
        </div>

        <div className="mt-6 overflow-hidden rounded-[24px] border border-slate-200">
          <div className="grid grid-cols-[1.2fr_0.95fr_0.9fr_0.8fr_0.85fr] gap-3 bg-slate-50 px-5 py-4 text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
            <span>Company</span>
            <span>Geography</span>
            <span>Package</span>
            <span>Client access</span>
            <span className="text-right">Actions</span>
          </div>
          {filteredClients.length ? (
            filteredClients.map((client) => (
              <div
                key={client.id}
                className="grid grid-cols-[1.2fr_0.95fr_0.9fr_0.8fr_0.85fr] gap-3 border-t border-slate-200 px-5 py-4 text-sm text-slate-600 transition hover:bg-lime-50/30"
              >
                <div>
                  <p className="font-semibold text-slate-900">{client.name}</p>
                  <p className="mt-1 text-xs text-slate-400">{client.industry}</p>
                  <p className="mt-2 text-xs text-slate-500">{client.email}</p>
                </div>
                <div>
                  <p>{client.city || "City pending"}</p>
                  <p className="mt-1 text-xs text-slate-400">
                    {client.region || "Region pending"} {"\u2022"}{" "}
                    {client.zone || "Zone pending"}
                  </p>
                </div>
                <div>
                  <Badge tone="blue">{titleCase(client.packageType)}</Badge>
                  <p className="mt-2 text-xs text-slate-500">
                    {client.activeJobCount}/{client.jobLimit} jobs active
                  </p>
                </div>
                <div>
                  <p className="font-semibold text-slate-900">
                    {client.clientUser?.name || "Not linked"}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {client.clientUser?.email || "No credentials"}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Badge tone={client.status === "ACTIVE" ? "emerald" : "rose"}>
                    {titleCase(client.status)}
                  </Badge>
                </div>
              </div>
            ))
          ) : (
            <div className="p-6">
              <EmptyState
                title="No clients match the current filters"
                description="Adjust the search, package, or status filters to widen the portfolio view."
              />
            </div>
          )}
        </div>
      </PanelCard>


    </div>
  );
}
