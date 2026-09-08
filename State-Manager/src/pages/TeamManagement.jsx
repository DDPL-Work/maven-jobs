import { useEffect, useMemo, useState } from "react";
import {
  LuChevronLeft,
  LuChevronRight,
  LuFileText,
  LuMail,
  LuMapPin,
  LuPencil,
  LuPhone,
  LuSearch,
  LuShield,
  LuTrash2,
  LuUserRound,
  LuUsers,
  LuTarget
} from "react-icons/lu";
import { toast } from "sonner";
import ActionConfirmModal from "../components/ActionConfirmModal";
import MemberReportModal from "../components/MemberReportModal";
import {
  deleteManagedMember,
  createManagedMember,
  fetchLeadDashboard,
  fetchManagedMemberDetail,
  fetchManagedMembers,
  updateManagedMember,
  updateMemberTargets
} from "../api/leadApi";

const PAGE_SIZE = 10;
const ROLE_TABS = [
  { key: "LEAD_GENERATOR", label: "Lead Generators" },
  { key: "FSE", label: "FSEs" },
];
const EMPTY_CREATE_FORM = {
  fullName: "",
  email: "",
  phone: "",
  password: "",
  confirmPassword: "",
};
const EMPTY_EDIT_FORM = {
  fullName: "",
  email: "",
  phone: "",
  password: "",
  confirmPassword: "",
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

const formatRole = (role = "") =>
  String(role)
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const formatRate = (value) => {
  if (value === null || value === undefined || value === "") {
    return "0%";
  }

  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      return "0%";
    }
    const normalizedValue = value <= 1 ? value * 100 : value;
    return `${Math.round(normalizedValue)}%`;
  }

  const raw = String(value).trim();
  if (!raw) {
    return "0%";
  }
  return raw.includes("%") ? raw : `${raw}%`;
};

export default function TeamManagement() {
  const [activeRole, setActiveRole] = useState("LEAD_GENERATOR");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [pageByRole, setPageByRole] = useState({
    LEAD_GENERATOR: 1,
    FSE: 1,
  });

  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: PAGE_SIZE,
    total: 0,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [rolePerformance, setRolePerformance] = useState({
    fse: { summary: {}, members: [] },
    leadGenerator: { summary: {}, members: [] },
  });
  const [rolePerformanceLoading, setRolePerformanceLoading] = useState(false);
  const [rolePerformanceError, setRolePerformanceError] = useState("");

  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);

  const [memberToDelete, setMemberToDelete] = useState(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createForm, setCreateForm] = useState(EMPTY_CREATE_FORM);
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [createError, setCreateError] = useState("");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [memberToEdit, setMemberToEdit] = useState(null);
  const [editForm, setEditForm] = useState(EMPTY_EDIT_FORM);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState("");
  const [reportMember, setReportMember] = useState(null);
  const [isTargetModalOpen, setIsTargetModalOpen] = useState(false);
  const [targetMember, setTargetMember] = useState(null);
  const [targetForm, setTargetForm] = useState({ leadGeneration: 0, conversions: 0, meetings: 0 });
  const [targetSubmitting, setTargetSubmitting] = useState(false);

  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  const currentPage = pageByRole[activeRole] || 1;

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [search]);

  useEffect(() => {
    let mounted = true;

    const loadMembers = async () => {
      try {
        setLoading(true);
        const response = await fetchManagedMembers({
          role: activeRole,
          page: currentPage,
          limit: PAGE_SIZE,
          search: debouncedSearch,
        });

        if (!mounted) {
          return;
        }

        setItems(Array.isArray(response.items) ? response.items : []);
        setPagination(
          response.pagination || {
            page: currentPage,
            limit: PAGE_SIZE,
            total: 0,
            totalPages: 1,
          },
        );
        setError("");
      } catch (requestError) {
        if (!mounted) {
          return;
        }

        setItems([]);
        setPagination({
          page: currentPage,
          limit: PAGE_SIZE,
          total: 0,
          totalPages: 1,
        });
        setError(requestError?.response?.data?.message || "Unable to load team members.");
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadMembers();

    return () => {
      mounted = false;
    };
  }, [activeRole, currentPage, debouncedSearch, refreshKey]);

  useEffect(() => {
    let mounted = true;

    const loadRolePerformance = async () => {
      try {
        setRolePerformanceLoading(true);
        const response = await fetchLeadDashboard();
        if (!mounted) {
          return;
        }

        const performance = response?.rolePerformance || {};
        setRolePerformance({
          fse: {
            summary: performance?.fse?.summary || {},
            members: Array.isArray(performance?.fse?.members) ? performance.fse.members : [],
          },
          leadGenerator: {
            summary: performance?.leadGenerator?.summary || {},
            members: Array.isArray(performance?.leadGenerator?.members)
              ? performance.leadGenerator.members
              : [],
          },
        });
        setRolePerformanceError("");
      } catch (requestError) {
        if (!mounted) {
          return;
        }
        setRolePerformance({
          fse: { summary: {}, members: [] },
          leadGenerator: { summary: {}, members: [] },
        });
        setRolePerformanceError(
          requestError?.response?.data?.message || "Unable to load team performance metrics.",
        );
      } finally {
        if (mounted) {
          setRolePerformanceLoading(false);
        }
      }
    };

    loadRolePerformance();

    return () => {
      mounted = false;
    };
  }, [refreshKey]);

  const title = useMemo(
    () => (activeRole === "LEAD_GENERATOR" ? "Lead Generators" : "Field Sales Executives"),
    [activeRole],
  );
  const fseSummary = rolePerformance?.fse?.summary || {};
  const leadGeneratorSummary = rolePerformance?.leadGenerator?.summary || {};
  const fsePerformanceRows = Array.isArray(rolePerformance?.fse?.members)
    ? rolePerformance.fse.members.slice(0, 8)
    : [];
  const leadGeneratorPerformanceRows = Array.isArray(rolePerformance?.leadGenerator?.members)
    ? rolePerformance.leadGenerator.members.slice(0, 8)
    : [];

  const handleTabChange = (roleKey) => {
    setActiveRole(roleKey);
    setSearch("");
    setDebouncedSearch("");
  };

  const handlePageChange = (nextPage) => {
    setPageByRole((prev) => ({
      ...prev,
      [activeRole]: nextPage,
    }));
  };

  const handleViewReport = (member) => {
    setReportMember({
      id: member.id,
      fullName: member.name || member.fullName,
    });
    setIsReportModalOpen(true);
  };

  const openMemberDetail = async (memberId) => {
    setIsDetailModalOpen(true);
    setDetailLoading(true);

    try {
      const detail = await fetchManagedMemberDetail(memberId);
      setSelectedMember(detail);
    } catch (requestError) {
      toast.error(requestError?.response?.data?.message || "Unable to load member details.");
      setIsDetailModalOpen(false);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!memberToDelete?.id) {
      return;
    }

    try {
      setDeleteSubmitting(true);
      const response = await deleteManagedMember(memberToDelete.id, activeRole);
      toast.success(response?.message || `${formatRole(activeRole)} removed successfully.`);

      if (items.length === 1 && currentPage > 1) {
        handlePageChange(currentPage - 1);
      } else {
        setRefreshKey((prev) => prev + 1);
      }

      setMemberToDelete(null);
    } catch (requestError) {
      toast.error(requestError?.response?.data?.message || "Unable to delete member.");
    } finally {
      setDeleteSubmitting(false);
    }
  };

  const openEditModal = (member) => {
    setMemberToEdit(member);
    setEditError("");
    setEditForm({
      fullName: member?.fullName || "",
      email: member?.email || "",
      phone: member?.phone || "",
      password: "",
      confirmPassword: "",
    });
    setIsEditModalOpen(true);
  };

  const handleCreateMember = async (event) => {
    event.preventDefault();

    const payload = {
      role: activeRole,
      fullName: createForm.fullName.trim(),
      email: createForm.email.trim(),
      phone: createForm.phone.trim(),
      password: createForm.password,
      confirmPassword: createForm.confirmPassword,
    };

    if (!payload.fullName || !payload.email || !payload.password || !payload.confirmPassword) {
      setCreateError("Full name, email, password and confirm password are required.");
      return;
    }

    if (payload.password !== payload.confirmPassword) {
      setCreateError("Passwords do not match.");
      return;
    }

    try {
      setCreateSubmitting(true);
      setCreateError("");
      const response = await createManagedMember(payload);
      toast.success(
        response?.message || `${activeRole === "FSE" ? "FSE" : "Lead Generator"} account created successfully.`,
      );
      setCreateForm(EMPTY_CREATE_FORM);
      setIsCreateModalOpen(false);
      setPageByRole((prev) => ({ ...prev, [activeRole]: 1 }));
      setRefreshKey((prev) => prev + 1);
    } catch (requestError) {
      setCreateError(requestError?.response?.data?.message || "Unable to create team member.");
    } finally {
      setCreateSubmitting(false);
    }
  };

  const handleEditMember = async (event) => {
    event.preventDefault();

    if (!memberToEdit?.id) {
      return;
    }

    const payload = {
      fullName: editForm.fullName.trim(),
      email: editForm.email.trim(),
      phone: editForm.phone.trim(),
    };

    if (!payload.fullName || !payload.email) {
      setEditError("Full name and email are required.");
      return;
    }

    const nextPassword = String(editForm.password || "");
    const nextConfirmPassword = String(editForm.confirmPassword || "");

    if (nextPassword || nextConfirmPassword) {
      if (nextPassword.length < 8) {
        setEditError("Password must be at least 8 characters.");
        return;
      }

      if (nextPassword !== nextConfirmPassword) {
        setEditError("Passwords do not match.");
        return;
      }

      payload.password = nextPassword;
      payload.confirmPassword = nextConfirmPassword;
    }

    try {
      setEditSubmitting(true);
      setEditError("");
      await updateManagedMember(memberToEdit.id, payload);
      toast.success("Team member updated successfully.");
      setIsEditModalOpen(false);
      setMemberToEdit(null);
      setEditForm(EMPTY_EDIT_FORM);
      setRefreshKey((prev) => prev + 1);
    } catch (requestError) {
      setEditError(requestError?.response?.data?.message || "Unable to update team member.");
    } finally {
      setEditSubmitting(false);
    }
  };

  const openTargetModal = (member) => {
    setTargetMember(member);
    setTargetForm({
      leadGeneration: member.targets?.leadGeneration || 0,
      conversions: member.targets?.conversions || 0,
      meetings: member.targets?.meetings || 0,
    });
    setIsTargetModalOpen(true);
  };

  const handleUpdateTargets = async (e) => {
    e.preventDefault();
    try {
      setTargetSubmitting(true);
      await updateMemberTargets(targetMember.id, targetForm);
      toast.success("Targets updated successfully");
      setIsTargetModalOpen(false);
      setRefreshKey(prev => prev + 1);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update targets");
    } finally {
      setTargetSubmitting(false);
    }
  };

  return (
    <div className="page-section my-leads-page">
      <section className="my-leads-heading">
        <h1>Team Control</h1>
        <p>Manage Lead Generators and FSEs from your assigned state.</p>
      </section>

      <section className="my-leads-toolbar-card">
        <div className="my-leads-filter-chips">
          {ROLE_TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              className={`filter-chip ${activeRole === tab.key ? "is-active" : ""}`}
              onClick={() => handleTabChange(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", gap: "12px", alignItems: "center", width: "100%", justifyContent: "flex-end" }}>
          <div className="my-leads-search" style={{ maxWidth: "420px" }}>
            <LuSearch />
            <input
              type="text"
              placeholder={`Search ${title.toLowerCase()}...`}
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                handlePageChange(1);
              }}
            />
          </div>
          <button
            type="button"
            className="primary-btn"
            onClick={() => {
              setCreateError("");
              setCreateForm(EMPTY_CREATE_FORM);
              setIsCreateModalOpen(true);
            }}
          >
            Create {activeRole === "FSE" ? "FSE" : "Lead Generator"}
          </button>
        </div>
      </section>

      <section className="team-performance-grid">
        <article className="team-performance-card">
          <header className="team-performance-card-header">
            <h2>FSE performance</h2>
            <p>Track assignment load and conversion output across your FSE team.</p>
            <div className="team-performance-badges">
              <span className="team-performance-badge is-blue">
                {fseSummary.totalMembers ?? 0} total
              </span>
              <span className="team-performance-badge is-green">
                {fseSummary.activePerformers ?? 0} active performers
              </span>
              <span className="team-performance-badge is-purple">
                Conversion: {formatRate(fseSummary.conversionRate)}
              </span>
            </div>
          </header>

          <div className="team-performance-table-wrap">
            <table className="team-performance-table">
              <thead>
                <tr>
                  <th>FSE</th>
                  <th>Active</th>
                  <th>Converted</th>
                  <th>Assigned</th>
                  <th>CVR</th>
                  <th>Targets</th>
                  <th>Report</th>
                </tr>
              </thead>
              <tbody>
                {rolePerformanceLoading ? (
                  <tr>
                    <td colSpan="7" className="empty-cell">
                      Loading FSE performance...
                    </td>
                  </tr>
                ) : fsePerformanceRows.length ? (
                  fsePerformanceRows.map((member) => (
                    <tr key={`team-fse-performance-${member.id}`}>
                      <td>{member.name || "-"}</td>
                      <td>{member.activeLeads ?? 0}</td>
                      <td>{member.convertedLeads ?? 0}</td>
                      <td>{member.totalAssignedLeads ?? 0}</td>
                      <td className="team-performance-cvr">{formatRate(member.conversionRate)}</td>
                      <td style={{ padding: "8px" }}>
                        <button 
                          onClick={() => openTargetModal(member)}
                          style={{ background: '#f1f5f9', border: '1px solid #e2e8f0', color: '#64748b', padding: '6px', borderRadius: '6px', cursor: 'pointer', display: 'flex' }}
                        >
                          <LuTarget size={16} />
                        </button>
                      </td>
                      <td style={{ padding: "8px" }}>
                        <button 
                          onClick={() => handleViewReport(member)}
                          style={{ background: '#f1f5f9', border: '1px solid #e2e8f0', color: '#64748b', padding: '6px', borderRadius: '6px', cursor: 'pointer', display: 'flex' }}
                        >
                          <LuFileText size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="empty-cell">
                      {rolePerformanceError || "No FSE performance records yet."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </article>

        <article className="team-performance-card">
          <header className="team-performance-card-header">
            <h2>Lead Generator performance</h2>
            <p>Review lead production, forwarding velocity, and conversion contribution.</p>
            <div className="team-performance-badges">
              <span className="team-performance-badge is-blue">
                {leadGeneratorSummary.totalMembers ?? 0} total
              </span>
              <span className="team-performance-badge is-orange">
                {leadGeneratorSummary.totalGeneratedLeads ?? 0} generated
              </span>
              <span className="team-performance-badge is-green">
                Forwarded: {leadGeneratorSummary.forwardedLeads ?? 0}
              </span>
              <span className="team-performance-badge is-purple">
                Conversion: {formatRate(leadGeneratorSummary.conversionRate)}
              </span>
            </div>
          </header>

          <div className="team-performance-table-wrap">
            <table className="team-performance-table">
              <thead>
                <tr>
                  <th>Lead Generator</th>
                  <th>Generated</th>
                  <th>Forwarded</th>
                  <th>Converted</th>
                  <th>CVR</th>
                  <th>Targets</th>
                  <th>Report</th>
                </tr>
              </thead>
              <tbody>
                {rolePerformanceLoading ? (
                  <tr>
                    <td colSpan="7" className="empty-cell">
                      Loading Lead Generator performance...
                    </td>
                  </tr>
                ) : leadGeneratorPerformanceRows.length ? (
                  leadGeneratorPerformanceRows.map((member) => (
                    <tr key={`team-lg-performance-${member.id}`}>
                      <td>{member.name || "-"}</td>
                      <td>{member.totalGeneratedLeads ?? 0}</td>
                      <td>{member.forwardedLeads ?? 0}</td>
                      <td>{member.convertedLeads ?? 0}</td>
                      <td className="team-performance-cvr">{formatRate(member.conversionRate)}</td>
                      <td>
                        <button 
                          onClick={() => openTargetModal(member)}
                          style={{ background: '#f1f5f9', border: '1px solid #e2e8f0', color: '#64748b', padding: '6px', borderRadius: '6px', cursor: 'pointer', display: 'flex' }}
                        >
                          <LuTarget size={16} />
                        </button>
                      </td>
                      <td style={{ padding: "8px" }}>
                        <button 
                          onClick={() => handleViewReport(member)}
                          style={{ background: '#f1f5f9', border: '1px solid #e2e8f0', color: '#64748b', padding: '6px', borderRadius: '6px', cursor: 'pointer', display: 'flex' }}
                        >
                          <LuFileText size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="empty-cell">
                      {rolePerformanceError || "No Lead Generator performance records yet."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </article>
      </section>

      {isCreateModalOpen ? (
        <div className="modal-overlay" onClick={() => !createSubmitting && setIsCreateModalOpen(false)}>
          <section
            className="modal-content"
            style={{ maxWidth: "560px" }}
            role="dialog"
            aria-modal="true"
            aria-label={`Create ${activeRole === "FSE" ? "FSE" : "Lead Generator"}`}
            onClick={(event) => event.stopPropagation()}
          >
            <header className="modal-header" style={{ background: 'linear-gradient(to right, #ffffff, #f8fafc)', borderBottom: '1px solid #e2e8f0', padding: '24px' }}>
              <div className="header-info">
                <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1e3a8a' }}>Create {activeRole === "FSE" ? "FSE" : "Lead Generator"}</h2>
                <p style={{ color: '#64748b', marginTop: '4px' }}>New account setup for your assigned territory.</p>
              </div>
              <button
                type="button"
                className="close-btn"
                onClick={() => !createSubmitting && setIsCreateModalOpen(false)}
                style={{ top: '24px', right: '24px' }}
              >
                &times;
              </button>
            </header>

            <form className="modal-body" onSubmit={handleCreateMember}>
              <div style={{ display: "grid", gap: "12px" }}>
                <div>
                  <label className="form-label" htmlFor="managed-member-full-name">Full Name</label>
                  <input
                    id="managed-member-full-name"
                    className="form-input"
                    type="text"
                    value={createForm.fullName}
                    onChange={(event) => setCreateForm((current) => ({ ...current, fullName: event.target.value }))}
                    required
                  />
                </div>
                <div>
                  <label className="form-label" htmlFor="managed-member-email">Email</label>
                  <input
                    id="managed-member-email"
                    className="form-input"
                    type="email"
                    value={createForm.email}
                    onChange={(event) => setCreateForm((current) => ({ ...current, email: event.target.value }))}
                    required
                  />
                </div>
                <div>
                  <label className="form-label" htmlFor="managed-member-phone">Phone (Optional)</label>
                  <input
                    id="managed-member-phone"
                    className="form-input"
                    type="text"
                    value={createForm.phone}
                    onChange={(event) => setCreateForm((current) => ({ ...current, phone: event.target.value }))}
                  />
                </div>
                <div>
                  <label className="form-label" htmlFor="managed-member-password">Password</label>
                  <input
                    id="managed-member-password"
                    className="form-input"
                    type="password"
                    value={createForm.password}
                    onChange={(event) => setCreateForm((current) => ({ ...current, password: event.target.value }))}
                    minLength={8}
                    required
                  />
                </div>
                <div>
                  <label className="form-label" htmlFor="managed-member-confirm-password">Confirm Password</label>
                  <input
                    id="managed-member-confirm-password"
                    className="form-input"
                    type="password"
                    value={createForm.confirmPassword}
                    onChange={(event) => setCreateForm((current) => ({ ...current, confirmPassword: event.target.value }))}
                    minLength={8}
                    required
                  />
                </div>
              </div>

              {createError ? (
                <p style={{ marginTop: "12px", color: "#dc2626", fontSize: "0.875rem", fontWeight: 500 }}>
                  {createError}
                </p>
              ) : null}

              <div style={{ marginTop: "16px", display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={() => setIsCreateModalOpen(false)}
                  disabled={createSubmitting}
                >
                  Cancel
                </button>
                <button type="submit" className="primary-btn" disabled={createSubmitting}>
                  {createSubmitting ? "Creating..." : "Create Account"}
                </button>
              </div>
            </form>
          </section>
        </div>
      ) : null}

      {isEditModalOpen ? (
        <div className="modal-overlay" onClick={() => !editSubmitting && setIsEditModalOpen(false)}>
          <section
            className="modal-content"
            style={{ maxWidth: "560px" }}
            role="dialog"
            aria-modal="true"
            aria-label={`Edit ${activeRole === "FSE" ? "FSE" : "Lead Generator"}`}
            onClick={(event) => event.stopPropagation()}
          >
            <header className="modal-header" style={{ background: 'linear-gradient(to right, #ffffff, #f8fafc)', borderBottom: '1px solid #e2e8f0', padding: '24px' }}>
              <div className="header-info">
                <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1e3a8a' }}>Edit {activeRole === "FSE" ? "FSE" : "Lead Generator"}</h2>
                <p style={{ color: '#64748b', marginTop: '4px' }}>Manage account details and credentials.</p>
              </div>
              <button
                type="button"
                className="close-btn"
                onClick={() => !editSubmitting && setIsEditModalOpen(false)}
                style={{ top: '24px', right: '24px' }}
              >
                &times;
              </button>
            </header>

            <form className="modal-body" onSubmit={handleEditMember}>
              <div style={{ display: "grid", gap: "12px" }}>
                <div>
                  <label className="form-label" htmlFor="managed-member-edit-full-name">Full Name</label>
                  <input
                    id="managed-member-edit-full-name"
                    className="form-input"
                    type="text"
                    value={editForm.fullName}
                    onChange={(event) => setEditForm((current) => ({ ...current, fullName: event.target.value }))}
                    required
                  />
                </div>
                <div>
                  <label className="form-label" htmlFor="managed-member-edit-email">Email</label>
                  <input
                    id="managed-member-edit-email"
                    className="form-input"
                    type="email"
                    value={editForm.email}
                    onChange={(event) => setEditForm((current) => ({ ...current, email: event.target.value }))}
                    required
                  />
                </div>
                <div>
                  <label className="form-label" htmlFor="managed-member-edit-phone">Phone</label>
                  <input
                    id="managed-member-edit-phone"
                    className="form-input"
                    type="text"
                    value={editForm.phone}
                    onChange={(event) => setEditForm((current) => ({ ...current, phone: event.target.value }))}
                  />
                </div>
                <div>
                  <label className="form-label" htmlFor="managed-member-edit-password">Reset Password (Optional)</label>
                  <input
                    id="managed-member-edit-password"
                    className="form-input"
                    type="password"
                    value={editForm.password}
                    onChange={(event) => setEditForm((current) => ({ ...current, password: event.target.value }))}
                    minLength={8}
                    placeholder="Leave blank to keep current password"
                  />
                </div>
                <div>
                  <label className="form-label" htmlFor="managed-member-edit-confirm-password">Confirm Password</label>
                  <input
                    id="managed-member-edit-confirm-password"
                    className="form-input"
                    type="password"
                    value={editForm.confirmPassword}
                    onChange={(event) => setEditForm((current) => ({ ...current, confirmPassword: event.target.value }))}
                    minLength={8}
                  />
                </div>
              </div>

              {editError ? (
                <p style={{ marginTop: "12px", color: "#dc2626", fontSize: "0.875rem", fontWeight: 500 }}>
                  {editError}
                </p>
              ) : null}

              <div style={{ marginTop: "16px", display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={() => setIsEditModalOpen(false)}
                  disabled={editSubmitting}
                >
                  Cancel
                </button>
                <button type="submit" className="primary-btn" disabled={editSubmitting}>
                  {editSubmitting ? "Updating..." : "Update Member"}
                </button>
              </div>
            </form>
          </section>
        </div>
      ) : null}

      <section className="my-leads-table-card">
        <div className="table-wrap">
          <table className="my-leads-table">
            <thead>
              <tr>
                <th>NAME</th>
                <th>EMAIL</th>
                <th>PHONE</th>
                <th>LEADS</th>
                <th>CVR</th>
                <th>ACTIONS</th>
                <th>REPORT</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" className="empty-cell">
                    Loading {title.toLowerCase()}...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan="7" className="empty-cell">
                    {error}
                  </td>
                </tr>
              ) : items.length ? (
                items.map((member) => (
                  <tr
                    key={member.id}
                    className="clickable-row"
                    onClick={() => openMemberDetail(member.id)}
                  >
                    <td>
                      <div className="company-cell">
                        <span className="row-icon">
                          <LuUserRound />
                        </span>
                        <strong>{member.fullName}</strong>
                      </div>
                    </td>
                    <td>{member.email}</td>
                    <td>{member.phone || "-"}</td>
                    <td>{member.totalLeadsGenerated ?? 0}</td>
                    <td style={{ fontWeight: 700, color: '#1e3a8a' }}>{formatRate((member.convertedLeads / (member.totalLeadsGenerated || 1)) * 100)}</td>
                    <td onClick={(event) => event.stopPropagation()}>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          type="button"
                          className="status-action-btn"
                          title={`Edit ${formatRole(activeRole)}`}
                          onClick={() => openEditModal(member)}
                        >
                          <LuPencil />
                        </button>
                        <button
                          type="button"
                          className="status-action-btn delete"
                          title={`Delete ${formatRole(activeRole)}`}
                          onClick={() => setMemberToDelete(member)}
                        >
                          <LuTrash2 />
                        </button>
                      </div>
                    </td>
                    <td onClick={(event) => event.stopPropagation()}>
                      <button 
                        onClick={() => handleViewReport(member)}
                        style={{ background: '#f1f5f9', border: '1px solid #e2e8f0', color: '#64748b', padding: '6px', borderRadius: '6px', cursor: 'pointer', display: 'flex' }}
                        title="Full Work Report"
                      >
                        <LuFileText size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="empty-cell">
                    No {title.toLowerCase()} found.
                  </td>
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
          }}
        >
          <span style={{ color: "#64748b", fontSize: "0.85rem" }}>
            Showing {items.length} of {pagination.total || 0}
          </span>
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <button
              type="button"
              className="secondary-btn"
              style={{ padding: "7px 10px" }}
              onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
              disabled={currentPage <= 1}
            >
              <LuChevronLeft />
            </button>
            <span style={{ color: "#334155", fontWeight: 600, minWidth: "88px", textAlign: "center" }}>
              Page {pagination.page || 1} / {pagination.totalPages || 1}
            </span>
            <button
              type="button"
              className="secondary-btn"
              style={{ padding: "7px 10px" }}
              onClick={() => handlePageChange(Math.min(pagination.totalPages || 1, currentPage + 1))}
              disabled={currentPage >= (pagination.totalPages || 1)}
            >
              <LuChevronRight />
            </button>
          </div>
        </div>
      </section>

      {isDetailModalOpen ? (
        <div className="modal-overlay" onClick={() => setIsDetailModalOpen(false)}>
          <section
            className="modal-content"
            style={{ maxWidth: "620px" }}
            role="dialog"
            aria-modal="true"
            aria-label="Team member details"
            onClick={(event) => event.stopPropagation()}
          >
            <header className="modal-header">
              <div className="header-info">
                <h2>{detailLoading ? "Loading..." : selectedMember?.fullName || "Member Details"}</h2>
                <p>{detailLoading ? "" : formatRole(selectedMember?.role || "")}</p>
              </div>
              <button type="button" className="close-btn" onClick={() => setIsDetailModalOpen(false)}>
                &times;
              </button>
            </header>

            <div className="modal-body">
              {detailLoading ? (
                <p style={{ margin: 0, color: "#64748b" }}>Loading member details...</p>
              ) : selectedMember ? (
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="detail-label">
                      <LuMail />
                      Email
                    </span>
                    <p className="detail-value">{selectedMember.email || "-"}</p>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">
                      <LuPhone />
                      Phone
                    </span>
                    <p className="detail-value">{selectedMember.phone || "-"}</p>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">
                      <LuMapPin />
                      Territory
                    </span>
                    <p className="detail-value">
                      {selectedMember.state || "-"}, {selectedMember.zone || "-"} Zone
                    </p>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">
                      <LuShield />
                      Access Status
                    </span>
                    <p className="detail-value">{selectedMember.accessStatus || "-"}</p>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Designations</span>
                    <p className="detail-value">
                      {Array.isArray(selectedMember.designations) && selectedMember.designations.length
                        ? selectedMember.designations.map(formatRole).join(", ")
                        : formatRole(selectedMember.role || "")}
                    </p>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">
                      <LuUsers />
                      Total Leads Generated
                    </span>
                    <p className="detail-value">{selectedMember.totalLeadsGenerated ?? 0}</p>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">
                      <LuUsers />
                      Converted Leads
                    </span>
                    <p className="detail-value">{selectedMember.convertedLeads ?? 0}</p>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Created At</span>
                    <p className="detail-value">{formatDateTime(selectedMember.createdAt)}</p>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Updated At</span>
                    <p className="detail-value">{formatDateTime(selectedMember.updatedAt)}</p>
                  </div>
                </div>
              ) : (
                <p style={{ margin: 0, color: "#64748b" }}>Unable to load details.</p>
              )}
            </div>
          </section>
        </div>
      ) : null}

      <ActionConfirmModal
        isOpen={Boolean(memberToDelete)}
        title={`Delete ${formatRole(activeRole)}`}
        message={`Remove ${memberToDelete?.fullName || "this member"} from ${formatRole(activeRole)} in your state team? If this is their last designation, account access will be disabled immediately.`}
        confirmLabel="Yes, Delete"
        tone="danger"
        isSubmitting={deleteSubmitting}
        onClose={() => {
          if (!deleteSubmitting) {
            setMemberToDelete(null);
          }
        }}
        onConfirm={handleConfirmDelete}
      />

      <MemberReportModal 
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        member={reportMember}
      />

      {isTargetModalOpen && (
        <div className="modal-overlay" onClick={() => !targetSubmitting && setIsTargetModalOpen(false)}>
          <section className="modal-content" style={{ maxWidth: "400px" }} onClick={(e) => e.stopPropagation()}>
            <header className="modal-header">
              <div className="header-info">
                <h2>Set Performance Targets</h2>
                <p>Set monthly goals for {targetMember?.name}</p>
              </div>
              <button className="close-btn" onClick={() => setIsTargetModalOpen(false)}>&times;</button>
            </header>
            <form className="modal-body" onSubmit={handleUpdateTargets}>
              <div style={{ display: "grid", gap: "16px" }}>
                <div>
                  <label className="form-label">Lead Generation Target</label>
                  <input 
                    type="number" 
                    className="form-input"
                    value={targetForm.leadGeneration}
                    onChange={(e) => setTargetForm({ ...targetForm, leadGeneration: e.target.value })}
                  />
                </div>
                <div>
                  <label className="form-label">Conversions Target</label>
                  <input 
                    type="number" 
                    className="form-input"
                    value={targetForm.conversions}
                    onChange={(e) => setTargetForm({ ...targetForm, conversions: e.target.value })}
                  />
                </div>
                <div>
                  <label className="form-label">Meetings/Meetings Target</label>
                  <input 
                    type="number" 
                    className="form-input"
                    value={targetForm.meetings}
                    onChange={(e) => setTargetForm({ ...targetForm, meetings: e.target.value })}
                  />
                </div>
              </div>
              <div style={{ marginTop: "24px", display: "flex", justifyContent: "flex-end", gap: "12px" }}>
                <button type="button" className="secondary-btn" onClick={() => setIsTargetModalOpen(false)}>Cancel</button>
                <button type="submit" className="primary-btn" disabled={targetSubmitting}>
                  {targetSubmitting ? "Updating..." : "Save Targets"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
