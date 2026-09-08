import { useCallback, useEffect, useMemo, useState } from "react";
import {
  LuBadgeCheck,
  LuChevronLeft,
  LuChevronRight,
  LuCircleOff,
  LuClock3,
  LuMail,
  LuMapPin,
  LuPlus,
  LuShieldAlert,
  LuTrash2,
  LuUserPlus,
  LuUsers,
  LuX,
} from "react-icons/lu";
import { toast } from "sonner";
import ActionConfirmModal from "../components/ActionConfirmModal";
import {
  createStateManagerAccount,
  deleteStateManagerAccount,
  fetchStateManagerMeta,
  fetchStateManagerRegistry,
  reviewStateManagerAccount,
} from "../api/leadApi";

const statusStyleMap = {
  ACTIVE: {
    label: "Active",
    color: "#166534",
    bg: "#ecfdf5",
    border: "#bbf7d0",
    icon: LuBadgeCheck,
  },
  PENDING_APPROVAL: {
    label: "Pending Approval",
    color: "#92400e",
    bg: "#fffbeb",
    border: "#fde68a",
    icon: LuClock3,
  },
  DENIED: {
    label: "Denied",
    color: "#b91c1c",
    bg: "#fef2f2",
    border: "#fecaca",
    icon: LuCircleOff,
  },
};

const emptyCreateForm = {
  fullName: "",
  email: "",
  state: "",
  password: "",
  confirmPassword: "",
};

export default function StateManagers() {
  const [registry, setRegistry] = useState([]);
  const [loading, setLoading] = useState(true);
  const [zone, setZone] = useState("");
  const [createMeta, setCreateMeta] = useState({ zone: "", availableStates: [] });

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createForm, setCreateForm] = useState(emptyCreateForm);
  const [isCreateSubmitting, setIsCreateSubmitting] = useState(false);

  const [reviewTarget, setReviewTarget] = useState(null);
  const [reviewDecision, setReviewDecision] = useState("APPROVE");
  const [reviewState, setReviewState] = useState("");
  const [reviewStateOptions, setReviewStateOptions] = useState([]);
  const [isReviewConfirmOpen, setIsReviewConfirmOpen] = useState(false);
  const [isReviewSubmitting, setIsReviewSubmitting] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleteSubmitting, setIsDeleteSubmitting] = useState(false);

  const pendingCount = useMemo(
    () => registry.filter((item) => item.accountStatus === "PENDING_APPROVAL").length,
    [registry],
  );

  const totalPages = Math.ceil(registry.length / itemsPerPage);
  const paginatedRegistry = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return registry.slice(start, start + itemsPerPage);
  }, [registry, currentPage]);

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [registry.length, totalPages, currentPage]);

  const loadRegistry = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchStateManagerRegistry();
      const list = Array.isArray(data) ? data : [];
      setRegistry(list);
      setZone((prev) => prev || list[0]?.zone || "");
    } catch (requestError) {
      toast.error(requestError?.response?.data?.message || "Unable to load state manager registry.");
      setRegistry([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadCreateMeta = useCallback(async (params = {}) => {
    const data = await fetchStateManagerMeta(params);
    setCreateMeta({
      zone: data?.zone || "",
      availableStates: Array.isArray(data?.availableStates) ? data.availableStates : [],
    });
    setZone((prev) => prev || data?.zone || "");
    return data;
  }, []);

  useEffect(() => {
    let mounted = true;

    const initialize = async () => {
      try {
        await Promise.all([loadRegistry(), loadCreateMeta()]);
      } catch (requestError) {
        if (mounted) {
          toast.error(requestError?.message || "Unable to load page.");
        }
      }
    };

    initialize();
    return () => {
      mounted = false;
    };
  }, [loadCreateMeta, loadRegistry]);

  const resetCreateForm = () => {
    setCreateForm(emptyCreateForm);
  };

  const openCreateModal = async () => {
    try {
      await loadCreateMeta();
      resetCreateForm();
      setIsCreateModalOpen(true);
    } catch (requestError) {
      toast.error(requestError?.response?.data?.message || requestError?.message || "Unable to load state options.");
    }
  };

  const handleCreateSubmit = async (event) => {
    event.preventDefault();

    const normalizedFullName = createForm.fullName.trim().replace(/\s+/g, " ");
    const fullNamePattern = /^[A-Za-z][A-Za-z .'-]*$/;

    if (!normalizedFullName || !createForm.email.trim() || !createForm.state || !createForm.password || !createForm.confirmPassword) {
      toast.error("All fields are required.");
      return;
    }

    if (!fullNamePattern.test(normalizedFullName)) {
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
      await createStateManagerAccount({
        fullName: normalizedFullName,
        email: createForm.email.trim(),
        state: createForm.state,
        password: createForm.password,
        confirmPassword: createForm.confirmPassword,
      });
      toast.success("State Manager account created successfully.");
      setIsCreateModalOpen(false);
      resetCreateForm();
      await Promise.all([loadRegistry(), loadCreateMeta()]);
    } catch (requestError) {
      toast.error(requestError?.response?.data?.message || "Unable to create State Manager.");
    } finally {
      setIsCreateSubmitting(false);
    }
  };

  const openReviewModal = async (item, decision) => {
    try {
      const data = await loadCreateMeta({
        excludeUserId: item.id,
        currentState: item.state || "",
      });
      const states = Array.isArray(data?.availableStates) ? data.availableStates : [];
      setReviewTarget(item);
      setReviewDecision(decision);
      setReviewState(item.state || states[0] || "");
      setReviewStateOptions(states);
    } catch (requestError) {
      toast.error(requestError?.response?.data?.message || "Unable to load state options.");
    }
  };

  const closeReviewModal = () => {
    setIsReviewConfirmOpen(false);
    setReviewTarget(null);
    setReviewState("");
    setReviewStateOptions([]);
  };

  const openReviewConfirm = () => {
    if (!reviewState) {
      toast.error("Please select a state before proceeding.");
      return;
    }

    setIsReviewConfirmOpen(true);
  };

  const submitReview = async () => {
    if (!reviewTarget?.id || !reviewState) {
      toast.error("Please select a state before proceeding.");
      return;
    }

    try {
      setIsReviewSubmitting(true);
      await reviewStateManagerAccount(reviewTarget.id, {
        decision: reviewDecision,
        state: reviewState,
      });
      toast.success(
        reviewDecision === "APPROVE"
          ? "State Manager approved successfully."
          : "State Manager denied successfully.",
      );
      setIsReviewConfirmOpen(false);
      closeReviewModal();
      await Promise.all([loadRegistry(), loadCreateMeta()]);
    } catch (requestError) {
      toast.error(requestError?.response?.data?.message || "Unable to complete this action.");
    } finally {
      setIsReviewSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget?.id) {
      return;
    }

    try {
      setIsDeleteSubmitting(true);
      await deleteStateManagerAccount(deleteTarget.id);
      toast.success("State Manager account deleted permanently.");
      setDeleteTarget(null);
      await Promise.all([loadRegistry(), loadCreateMeta()]);
    } catch (requestError) {
      toast.error(requestError?.response?.data?.message || "Unable to delete State Manager.");
    } finally {
      setIsDeleteSubmitting(false);
    }
  };

  return (
    <div className="page-section my-leads-page">
      <section className="my-leads-heading">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: "16px" }}>
          <div>
            <h1>State Managers</h1>
            <p>
              {zone ? `${zone} Zone` : "Your Zone"} approvals, account creation, and lifecycle management.
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                backgroundColor: "#fffbeb",
                border: "1px solid #fde68a",
                color: "#92400e",
                padding: "8px 12px",
                borderRadius: "12px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                fontSize: "0.85rem",
                fontWeight: "700",
              }}
            >
              <LuShieldAlert size={16} />
              {pendingCount} Pending
            </div>
            <button
              type="button"
              className="button button-primary"
              onClick={openCreateModal}
              style={{ height: "40px" }}
            >
              <LuUserPlus size={16} />
              Create Account
            </button>
          </div>
        </div>
      </section>

      <section className="my-leads-table-card">
        {loading ? (
          <div style={{ padding: "40px 24px", color: "#64748b" }}>Loading state managers...</div>
        ) : !registry.length ? (
          <div style={{ padding: "48px 24px", color: "#64748b", textAlign: "center" }}>
            No state manager accounts found in your zone.
          </div>
        ) : (
          <div className="table-wrap">
            <table className="my-leads-table">
              <thead>
                <tr>
                  <th>STATE MANAGER</th>
                  <th>STATE</th>
                  <th>STATUS</th>
                  <th>ACTIVE LEADS</th>
                  <th>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {paginatedRegistry.map((item) => {
                  const styleConfig = statusStyleMap[item.accountStatus] || statusStyleMap.ACTIVE;
                  const StatusIcon = styleConfig.icon;

                  return (
                    <tr key={item.id}>
                      <td>
                        <div className="contact-cell">
                          <span className="contact-name">
                            <LuUsers size={16} />
                            {item.fullName}
                          </span>
                          <small style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                            <LuMail size={12} />
                            {item.email}
                          </small>
                        </div>
                      </td>
                      <td>
                        <span className="location-cell">
                          <LuMapPin size={14} />
                          {item.state || "-"}
                        </span>
                      </td>
                      <td>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px",
                            padding: "5px 10px",
                            borderRadius: "999px",
                            fontSize: "0.75rem",
                            fontWeight: "700",
                            color: styleConfig.color,
                            backgroundColor: styleConfig.bg,
                            border: `1px solid ${styleConfig.border}`,
                          }}
                        >
                          <StatusIcon size={13} />
                          {styleConfig.label}
                        </span>
                      </td>
                      <td>{item.activeLeads || 0}</td>
                      <td>
                        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                          {item.accountStatus !== "ACTIVE" ? (
                            <button
                              type="button"
                              className="secondary-btn"
                              style={{ padding: "6px 10px", fontSize: "0.75rem" }}
                              onClick={() => openReviewModal(item, "APPROVE")}
                            >
                              Approve
                            </button>
                          ) : null}
                          {item.accountStatus !== "DENIED" ? (
                            <button
                              type="button"
                              className="secondary-btn"
                              style={{ padding: "6px 10px", fontSize: "0.75rem" }}
                              onClick={() => openReviewModal(item, "DENY")}
                            >
                              Deny
                            </button>
                          ) : null}
                          <button
                            type="button"
                            className="secondary-btn"
                            style={{ padding: "6px 10px", fontSize: "0.75rem", color: "#b91c1c", borderColor: "#fecaca" }}
                            onClick={() => setDeleteTarget(item)}
                          >
                            <LuTrash2 size={12} />
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {totalPages > 1 && (
              <div className="pagination-wrap">
                <div className="pagination-info">
                  Showing <strong>{(currentPage - 1) * itemsPerPage + 1}</strong> to{" "}
                  <strong>{Math.min(currentPage * itemsPerPage, registry.length)}</strong> of{" "}
                  <strong>{registry.length}</strong> state managers
                </div>
                <div className="pagination-actions">
                  <button
                    type="button"
                    className="pagination-btn"
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                  >
                    <LuChevronLeft size={16} />
                    Previous
                  </button>
                  <button
                    type="button"
                    className="pagination-btn"
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                    <LuChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      {isCreateModalOpen ? (
        <div className="modal-overlay" onClick={() => !isCreateSubmitting && setIsCreateModalOpen(false)}>
          <section
            className="modal-content"
            style={{ maxWidth: "560px" }}
            role="dialog"
            aria-modal="true"
            aria-label="Create State Manager"
            onClick={(event) => event.stopPropagation()}
          >
            <header className="modal-header">
              <div className="header-info">
                <h2>Create State Manager Account</h2>
                <p>Creates an active account directly in your zone.</p>
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
                <label className="form-label" htmlFor="create-sm-name">Full Name</label>
                <input
                  id="create-sm-name"
                  className="form-input"
                  value={createForm.fullName}
                  onChange={(event) => setCreateForm((prev) => ({ ...prev, fullName: event.target.value }))}
                  placeholder="Enter full name"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="create-sm-email">Email</label>
                <input
                  id="create-sm-email"
                  type="email"
                  className="form-input"
                  value={createForm.email}
                  onChange={(event) => setCreateForm((prev) => ({ ...prev, email: event.target.value }))}
                  placeholder="name@mavenjobs.com"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Zone</label>
                <input className="form-input" value={`${createMeta.zone || zone} Zone`} disabled />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="create-sm-state">State</label>
                <select
                  id="create-sm-state"
                  className="form-select"
                  value={createForm.state}
                  onChange={(event) => setCreateForm((prev) => ({ ...prev, state: event.target.value }))}
                  required
                >
                  <option value="" disabled>Select state</option>
                  {(createMeta.availableStates || []).map((stateOption) => (
                    <option key={stateOption} value={stateOption}>
                      {stateOption}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="create-sm-password">Password</label>
                <input
                  id="create-sm-password"
                  type="password"
                  className="form-input"
                  value={createForm.password}
                  onChange={(event) => setCreateForm((prev) => ({ ...prev, password: event.target.value }))}
                  placeholder="Minimum 8 characters"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="create-sm-confirm">Confirm Password</label>
                <input
                  id="create-sm-confirm"
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

      {reviewTarget ? (
        <div className="modal-overlay" onClick={() => !isReviewSubmitting && closeReviewModal()}>
          <section
            className="modal-content"
            style={{ maxWidth: "520px" }}
            role="dialog"
            aria-modal="true"
            aria-label="Review state manager request"
            onClick={(event) => event.stopPropagation()}
          >
            <header className="modal-header">
              <div className="header-info">
                <h2>{reviewDecision === "APPROVE" ? "Approve State Manager" : "Deny State Manager"}</h2>
                <p>{reviewTarget.fullName} ({reviewTarget.email})</p>
              </div>
              <button type="button" className="close-btn" onClick={closeReviewModal} disabled={isReviewSubmitting}>
                <LuX />
              </button>
            </header>

            <div className="modal-form">
              <div className="form-group">
                <label className="form-label" htmlFor="review-state">State</label>
                <select
                  id="review-state"
                  className="form-select"
                  value={reviewState}
                  onChange={(event) => setReviewState(event.target.value)}
                >
                  <option value="" disabled>Select state</option>
                  {reviewStateOptions.map((stateOption) => (
                    <option key={stateOption} value={stateOption}>
                      {stateOption}
                    </option>
                  ))}
                </select>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={closeReviewModal}
                  disabled={isReviewSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="primary-btn"
                  style={
                    reviewDecision === "DENY"
                      ? { background: "#dc2626", color: "#ffffff" }
                      : undefined
                  }
                  onClick={openReviewConfirm}
                  disabled={isReviewSubmitting}
                >
                  {isReviewSubmitting
                    ? "Saving..."
                    : reviewDecision === "APPROVE"
                      ? "Review Approval"
                      : "Review Denial"}
                </button>
              </div>
            </div>
          </section>
        </div>
      ) : null}

      <ActionConfirmModal
        isOpen={isReviewConfirmOpen && Boolean(reviewTarget)}
        title={reviewDecision === "APPROVE" ? "Confirm Approval" : "Confirm Denial"}
        tone={reviewDecision === "DENY" ? "danger" : "primary"}
        message={
          reviewDecision === "APPROVE"
            ? `Approve ${reviewTarget?.email || "this account"} for ${reviewState || "selected"} state?`
            : `Deny ${reviewTarget?.email || "this account"} for ${reviewState || "selected"} state?`
        }
        confirmLabel={reviewDecision === "APPROVE" ? "Yes, Approve" : "Yes, Deny"}
        isSubmitting={isReviewSubmitting}
        onClose={() => {
          if (!isReviewSubmitting) {
            setIsReviewConfirmOpen(false);
          }
        }}
        onConfirm={submitReview}
      />

      <ActionConfirmModal
        isOpen={Boolean(deleteTarget)}
        title="Delete State Manager"
        tone="danger"
        message={`Delete ${deleteTarget?.email || "this account"} permanently? This action cannot be undone.`}
        confirmLabel="Delete Permanently"
        isSubmitting={isDeleteSubmitting}
        onClose={() => {
          if (!isDeleteSubmitting) {
            setDeleteTarget(null);
          }
        }}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
