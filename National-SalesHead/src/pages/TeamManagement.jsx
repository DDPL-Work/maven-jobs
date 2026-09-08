import { useCallback, useEffect, useMemo, useState } from "react";
import {
  LuChevronLeft,
  LuChevronRight,
  LuMail,
  LuMapPin,
  LuSearch,
  LuTrash2,
  LuUserPlus,
  LuUsers,
  LuX,
} from "react-icons/lu";
import { toast } from "sonner";
import {
  createZonalManager,
  deleteZonalManager,
  fetchStateManagersOverview,
  fetchZonalManagers,
} from "../api/nshApi";

const PAGE_SIZE = 10;
const FULL_NAME_PATTERN = /^[A-Za-z][A-Za-z .'-]*$/;
const INITIAL_CREATE_FORM = {
  fullName: "",
  email: "",
  zone: "",
  password: "",
  confirmPassword: "",
};
const DEFAULT_OVERVIEW_SUMMARY = {
  totalStateManagers: 0,
  activeStateManagers: 0,
  pendingApprovals: 0,
  deniedStateManagers: 0,
  totalAssignedLeads: 0,
  totalConvertedLeads: 0,
  conversionRate: 0,
};

const STATUS_STYLES = {
  ACTIVE: { label: "Active", text: "#166534", background: "#ecfdf5", border: "#bbf7d0" },
  PENDING_APPROVAL: { label: "Pending", text: "#92400e", background: "#fffbeb", border: "#fde68a" },
  DENIED: { label: "Denied", text: "#b91c1c", background: "#fef2f2", border: "#fecaca" },
};

const formatDateTime = (value) => {
  if (!value) {
    return "-";
  }

  return new Date(value).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const statusStyle = (status) => STATUS_STYLES[status] || STATUS_STYLES.ACTIVE;

export default function TeamManagement() {
  const [zonalData, setZonalData] = useState({
    totalSlots: 4,
    usedSlots: 0,
    availableSlots: 4,
    zones: [],
    items: [],
  });
  const [overview, setOverview] = useState({
    summary: DEFAULT_OVERVIEW_SUMMARY,
    items: [],
    pagination: {
      page: 1,
      limit: PAGE_SIZE,
      total: 0,
      totalPages: 0,
    },
  });

  const [zonalLoading, setZonalLoading] = useState(true);
  const [overviewLoading, setOverviewLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [zoneFilter, setZoneFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [page, setPage] = useState(1);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createForm, setCreateForm] = useState(INITIAL_CREATE_FORM);
  const [isCreateSubmitting, setIsCreateSubmitting] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleteSubmitting, setIsDeleteSubmitting] = useState(false);

  const loadZonalManagers = useCallback(async () => {
    try {
      setZonalLoading(true);
      const response = await fetchZonalManagers();
      setZonalData({
        totalSlots: response?.totalSlots || 4,
        usedSlots: response?.usedSlots || 0,
        availableSlots: response?.availableSlots || 0,
        zones: Array.isArray(response?.zones) ? response.zones : [],
        items: Array.isArray(response?.items) ? response.items : [],
      });
    } catch (requestError) {
      toast.error(requestError?.response?.data?.message || "Unable to load zonal managers.");
      setZonalData((prev) => ({ ...prev, zones: [], items: [] }));
    } finally {
      setZonalLoading(false);
    }
  }, []);

  const loadStateManagersOverview = useCallback(async () => {
    try {
      setOverviewLoading(true);
      const response = await fetchStateManagersOverview({
        page,
        limit: PAGE_SIZE,
        search: debouncedSearch || undefined,
        zone: zoneFilter === "ALL" ? undefined : zoneFilter,
        status: statusFilter,
      });

      setOverview({
        summary: response?.summary || DEFAULT_OVERVIEW_SUMMARY,
        items: Array.isArray(response?.items) ? response.items : [],
        pagination:
          response?.pagination || {
            page,
            limit: PAGE_SIZE,
            total: 0,
            totalPages: 0,
          },
      });
    } catch (requestError) {
      toast.error(requestError?.response?.data?.message || "Unable to load State Manager overview.");
      setOverview((prev) => ({
        ...prev,
        items: [],
        pagination: {
          page,
          limit: PAGE_SIZE,
          total: 0,
          totalPages: 0,
        },
      }));
    } finally {
      setOverviewLoading(false);
    }
  }, [debouncedSearch, page, statusFilter, zoneFilter]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 300);

    return () => clearTimeout(timeout);
  }, [search]);

  useEffect(() => {
    loadZonalManagers();
  }, [loadZonalManagers]);

  useEffect(() => {
    loadStateManagersOverview();
  }, [loadStateManagersOverview]);

  const availableZonesForCreate = useMemo(
    () => (zonalData.zones || []).filter((item) => !item.occupied).map((item) => item.zone),
    [zonalData.zones],
  );

  const openCreateModal = () => {
    if (!availableZonesForCreate.length) {
      toast.error("All 4 zonal manager slots are occupied. Delete one zonal manager first.");
      return;
    }

    setCreateForm({
      ...INITIAL_CREATE_FORM,
      zone: availableZonesForCreate[0],
    });
    setIsCreateModalOpen(true);
  };

  const handleCreateSubmit = async (event) => {
    event.preventDefault();

    const fullName = createForm.fullName.trim().replace(/\s+/g, " ");
    const email = createForm.email.trim().toLowerCase();

    if (!fullName || !email || !createForm.zone || !createForm.password || !createForm.confirmPassword) {
      toast.error("All fields are required.");
      return;
    }

    if (!FULL_NAME_PATTERN.test(fullName)) {
      toast.error("Full name can only contain letters, spaces, apostrophes, hyphens, and periods.");
      return;
    }

    if (createForm.password.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }

    if (createForm.password !== createForm.confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    try {
      setIsCreateSubmitting(true);
      await createZonalManager({
        fullName,
        email,
        zone: createForm.zone,
        password: createForm.password,
        confirmPassword: createForm.confirmPassword,
      });
      toast.success(`${createForm.zone} Zone Manager created successfully.`);
      setIsCreateModalOpen(false);
      await Promise.all([loadZonalManagers(), loadStateManagersOverview()]);
    } catch (requestError) {
      toast.error(requestError?.response?.data?.message || "Unable to create zonal manager.");
    } finally {
      setIsCreateSubmitting(false);
    }
  };

  const handleDeleteZonalManager = async () => {
    if (!deleteTarget?.id) {
      return;
    }

    try {
      setIsDeleteSubmitting(true);
      await deleteZonalManager(deleteTarget.id);
      toast.success("Zonal Manager deleted successfully.");
      setDeleteTarget(null);
      await Promise.all([loadZonalManagers(), loadStateManagersOverview()]);
    } catch (requestError) {
      toast.error(requestError?.response?.data?.message || "Unable to delete zonal manager.");
    } finally {
      setIsDeleteSubmitting(false);
    }
  };

  const handleFilterChange = (setter, value) => {
    setter(value);
    setPage(1);
  };

  const summary = overview.summary || {};

  return (
    <div className="page-section my-leads-page">
      <section className="my-leads-heading">
        <h1>National Team Control</h1>
        <p>Create or delete zonal managers and monitor the full State Manager network.</p>
      </section>

      <section className="my-leads-toolbar-card">
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
          <SummaryBadge label="Zonal Slots Used" value={`${zonalData.usedSlots}/${zonalData.totalSlots}`} />
          <SummaryBadge label="State Managers" value={summary.totalStateManagers || 0} />
          <SummaryBadge label="Pending SM Approvals" value={summary.pendingApprovals || 0} />
        </div>
        <button type="button" className="button button-primary" onClick={openCreateModal}>
          <LuUserPlus size={16} />
          Create Zonal Manager
        </button>
      </section>

      <section className="my-leads-table-card" style={{ paddingBottom: "8px" }}>
        <div style={{ padding: "16px 18px 8px", color: "#1e3a8a", fontWeight: 700 }}>Zonal Managers</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "10px", padding: "0 18px 14px" }}>
          {(zonalData.zones || []).map((zoneSlot) => (
            <div
              key={zoneSlot.zone}
              style={{
                border: "1px solid #dbe5f2",
                borderRadius: "12px",
                padding: "10px 12px",
                background: zoneSlot.occupied ? "#eff6ff" : "#f8fafc",
              }}
            >
              <p style={{ margin: 0, fontWeight: 700, color: "#18458a" }}>{zoneSlot.zone} Zone</p>
              <p style={{ margin: "4px 0 0", fontSize: "0.82rem", color: "#5c7396" }}>
                {zoneSlot.occupied ? zoneSlot.manager?.fullName || "Assigned" : "Slot Available"}
              </p>
            </div>
          ))}
        </div>
        <div className="table-wrap">
          <table className="my-leads-table">
            <thead>
              <tr>
                <th>ZONE</th>
                <th>NAME</th>
                <th>EMAIL</th>
                <th>STATUS</th>
                <th>CREATED</th>
                <th>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {zonalLoading ? (
                <tr>
                  <td colSpan="6" className="empty-cell">Loading zonal managers...</td>
                </tr>
              ) : (zonalData.items || []).length ? (
                zonalData.items.map((item) => {
                  const style = statusStyle(item.accountStatus);
                  return (
                    <tr key={item.id}>
                      <td>
                        <span className="location-cell">
                          <LuMapPin size={14} />
                          {item.zone} Zone
                        </span>
                      </td>
                      <td>{item.fullName}</td>
                      <td>{item.email}</td>
                      <td>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            padding: "5px 10px",
                            borderRadius: "999px",
                            fontSize: "0.75rem",
                            fontWeight: 700,
                            color: style.text,
                            background: style.background,
                            border: `1px solid ${style.border}`,
                          }}
                        >
                          {style.label}
                        </span>
                      </td>
                      <td>{formatDateTime(item.createdAt)}</td>
                      <td>
                        <button
                          type="button"
                          className="secondary-btn"
                          style={{ padding: "6px 10px", color: "#b91c1c", borderColor: "#fecaca" }}
                          onClick={() => setDeleteTarget(item)}
                        >
                          <LuTrash2 size={13} />
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="6" className="empty-cell">No zonal managers found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="my-leads-toolbar-card">
        <div className="my-leads-search" style={{ maxWidth: "420px" }}>
          <LuSearch />
          <input
            type="text"
            value={search}
            placeholder="Search state managers by name, email, state..."
            onChange={(event) => handleFilterChange(setSearch, event.target.value)}
          />
        </div>

        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <select
            className="input"
            style={{ minWidth: "150px", height: "44px" }}
            value={zoneFilter}
            onChange={(event) => handleFilterChange(setZoneFilter, event.target.value)}
          >
            <option value="ALL">All Zones</option>
            <option value="North">North</option>
            <option value="South">South</option>
            <option value="East">East</option>
            <option value="West">West</option>
          </select>

          <select
            className="input"
            style={{ minWidth: "190px", height: "44px" }}
            value={statusFilter}
            onChange={(event) => handleFilterChange(setStatusFilter, event.target.value)}
          >
            <option value="ALL">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="PENDING_APPROVAL">Pending Approval</option>
            <option value="DENIED">Denied</option>
          </select>
        </div>
      </section>

      <section className="my-leads-toolbar-card" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "10px" }}>
        <SummaryBadge label="Total SM" value={summary.totalStateManagers || 0} />
        <SummaryBadge label="Active SM" value={summary.activeStateManagers || 0} />
        <SummaryBadge label="Denied SM" value={summary.deniedStateManagers || 0} />
        <SummaryBadge label="Assigned Leads" value={summary.totalAssignedLeads || 0} />
        <SummaryBadge label="Converted Leads" value={summary.totalConvertedLeads || 0} />
        <SummaryBadge label="Conversion Rate" value={`${summary.conversionRate || 0}%`} />
      </section>

      <section className="my-leads-table-card">
        <div style={{ padding: "16px 18px 6px", color: "#1e3a8a", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: "8px" }}>
          <LuUsers size={16} />
          State Manager Overview
        </div>
        <div className="table-wrap">
          <table className="my-leads-table">
            <thead>
              <tr>
                <th>NAME</th>
                <th>ZONE</th>
                <th>STATE</th>
                <th>STATUS</th>
                <th>TOTAL LEADS</th>
                <th>CONVERTED</th>
                <th>RATE</th>
                <th>EMAIL</th>
              </tr>
            </thead>
            <tbody>
              {overviewLoading ? (
                <tr>
                  <td colSpan="8" className="empty-cell">Loading state manager overview...</td>
                </tr>
              ) : (overview.items || []).length ? (
                overview.items.map((item) => {
                  const style = statusStyle(item.accountStatus);
                  return (
                    <tr key={item.id}>
                      <td>{item.fullName}</td>
                      <td>{item.zone} Zone</td>
                      <td>{item.state || "-"}</td>
                      <td>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            padding: "5px 10px",
                            borderRadius: "999px",
                            fontSize: "0.75rem",
                            fontWeight: 700,
                            color: style.text,
                            background: style.background,
                            border: `1px solid ${style.border}`,
                          }}
                        >
                          {style.label}
                        </span>
                      </td>
                      <td>{item.totalAssignedLeads ?? 0}</td>
                      <td>{item.convertedLeads ?? 0}</td>
                      <td>{item.conversionRate ?? 0}%</td>
                      <td>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                          <LuMail size={13} />
                          {item.email}
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="8" className="empty-cell">No state managers found for selected filters.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "12px 18px",
            borderTop: "1px solid #e2e8f0",
            background: "#f8fafc",
            gap: "10px",
            flexWrap: "wrap",
          }}
        >
          <span style={{ color: "#64748b", fontSize: "0.85rem" }}>
            Showing {(overview.items || []).length} of {overview.pagination.total || 0}
          </span>
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <button
              type="button"
              className="secondary-btn"
              style={{ padding: "7px 10px" }}
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              disabled={(overview.pagination.page || 1) <= 1}
            >
              <LuChevronLeft />
            </button>
            <span style={{ color: "#334155", fontWeight: 600, minWidth: "90px", textAlign: "center" }}>
              Page {overview.pagination.page || 1} / {overview.pagination.totalPages || 1}
            </span>
            <button
              type="button"
              className="secondary-btn"
              style={{ padding: "7px 10px" }}
              onClick={() =>
                setPage((prev) => Math.min(overview.pagination.totalPages || 1, prev + 1))
              }
              disabled={(overview.pagination.page || 1) >= (overview.pagination.totalPages || 1)}
            >
              <LuChevronRight />
            </button>
          </div>
        </div>
      </section>

      {isCreateModalOpen ? (
        <div className="modal-overlay" onClick={() => !isCreateSubmitting && setIsCreateModalOpen(false)}>
          <section
            className="modal-content"
            role="dialog"
            aria-modal="true"
            aria-label="Create zonal manager"
            style={{ maxWidth: "540px" }}
            onClick={(event) => event.stopPropagation()}
          >
            <header className="modal-header">
              <div className="header-info">
                <h2>Create Zonal Manager</h2>
                <p>Only one manager is allowed per zone, with a maximum of 4 total.</p>
              </div>
              <button
                type="button"
                className="close-btn"
                onClick={() => setIsCreateModalOpen(false)}
                disabled={isCreateSubmitting}
              >
                <LuX />
              </button>
            </header>

            <form className="modal-form" onSubmit={handleCreateSubmit}>
              <div className="form-group">
                <label className="form-label" htmlFor="zonal-manager-name">Full Name</label>
                <input
                  id="zonal-manager-name"
                  className="form-input"
                  value={createForm.fullName}
                  onChange={(event) => setCreateForm((prev) => ({ ...prev, fullName: event.target.value }))}
                  placeholder="Enter full name"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="zonal-manager-email">Email</label>
                <input
                  id="zonal-manager-email"
                  type="email"
                  className="form-input"
                  value={createForm.email}
                  onChange={(event) => setCreateForm((prev) => ({ ...prev, email: event.target.value }))}
                  placeholder="manager@mavenjobs.com"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="zonal-manager-zone">Zone</label>
                <select
                  id="zonal-manager-zone"
                  className="form-select"
                  value={createForm.zone}
                  onChange={(event) => setCreateForm((prev) => ({ ...prev, zone: event.target.value }))}
                  required
                >
                  {availableZonesForCreate.map((zoneOption) => (
                    <option key={zoneOption} value={zoneOption}>
                      {zoneOption} Zone
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="zonal-manager-password">Password</label>
                <input
                  id="zonal-manager-password"
                  type="password"
                  className="form-input"
                  value={createForm.password}
                  onChange={(event) => setCreateForm((prev) => ({ ...prev, password: event.target.value }))}
                  placeholder="Minimum 8 characters"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="zonal-manager-confirm-password">Confirm Password</label>
                <input
                  id="zonal-manager-confirm-password"
                  type="password"
                  className="form-input"
                  value={createForm.confirmPassword}
                  onChange={(event) => setCreateForm((prev) => ({ ...prev, confirmPassword: event.target.value }))}
                  placeholder="Re-enter password"
                  required
                />
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={() => setIsCreateModalOpen(false)}
                  disabled={isCreateSubmitting}
                >
                  Cancel
                </button>
                <button type="submit" className="primary-btn" disabled={isCreateSubmitting}>
                  {isCreateSubmitting ? "Creating..." : "Create Account"}
                </button>
              </div>
            </form>
          </section>
        </div>
      ) : null}

      {deleteTarget ? (
        <div className="modal-overlay" onClick={() => !isDeleteSubmitting && setDeleteTarget(null)}>
          <section
            className="modal-content"
            role="dialog"
            aria-modal="true"
            aria-label="Delete zonal manager"
            style={{ maxWidth: "480px" }}
            onClick={(event) => event.stopPropagation()}
          >
            <header className="modal-header">
              <div className="header-info">
                <h2>Delete Zonal Manager</h2>
                <p>
                  Delete {deleteTarget.fullName} ({deleteTarget.zone} Zone)?
                </p>
              </div>
              <button
                type="button"
                className="close-btn"
                onClick={() => setDeleteTarget(null)}
                disabled={isDeleteSubmitting}
              >
                <LuX />
              </button>
            </header>
            <div className="modal-body">
              <p style={{ margin: 0, color: "#475569", lineHeight: 1.6 }}>
                This action removes the zonal manager account permanently and frees that zone slot for new creation.
              </p>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="secondary-btn"
                onClick={() => setDeleteTarget(null)}
                disabled={isDeleteSubmitting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="primary-btn"
                style={{ background: "#dc2626", color: "#fff" }}
                onClick={handleDeleteZonalManager}
                disabled={isDeleteSubmitting}
              >
                {isDeleteSubmitting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}

function SummaryBadge({ label, value }) {
  return (
    <div
      style={{
        border: "1px solid #dbe5f2",
        background: "#f8fbff",
        borderRadius: "12px",
        padding: "9px 12px",
        minWidth: "120px",
      }}
    >
      <p style={{ margin: 0, fontSize: "0.72rem", color: "#64748b", textTransform: "uppercase", fontWeight: 700 }}>
        {label}
      </p>
      <p style={{ margin: "4px 0 0", color: "#18458a", fontSize: "1.1rem", fontWeight: 700 }}>{value}</p>
    </div>
  );
}
