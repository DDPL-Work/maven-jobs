import { useEffect, useMemo, useRef, useState } from "react";
import { LuBuilding2, LuKeyRound, LuPlus, LuSearch } from "react-icons/lu";
import {
  createFseClientAccount,
  fetchFseClientAccounts,
  fetchFsePackages,
  updateFseClientAccount,
  updateFseClientAccountCredentials,
} from "../api/fseApi";

const industryOptions = [
  "IT Services",
  "Software / SaaS",
  "Healthcare",
  "Education",
  "Retail",
  "E-commerce",
  "Finance",
  "Manufacturing",
  "Logistics",
  "Hospitality",
  "Real Estate",
  "Media",
];

const defaultClientForm = {
  name: "",
  industry: "",
  email: "",
  phone: "",
  city: "",
  region: "",
  zone: "",
  packageType: "STANDARD",
  configurationNotes: "",
  accountManager: "",
  clientName: "",
  clientEmail: "",
  clientPassword: "",
  status: "ACTIVE",
};

const defaultCredentialForm = {
  clientName: "",
  clientEmail: "",
  clientPassword: "",
};

const toTitleCase = (value = "") =>
  String(value || "")
    .toLowerCase()
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(" ");

function FsePanelModal({ open, title, onClose, children, maxWidthClass = "fse-modal-medium" }) {
  if (!open) {
    return null;
  }

  return (
    <div className="modal-overlay" onClick={onClose} role="presentation">
      <div
        className={`modal-content fse-modal-content ${maxWidthClass}`}
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="modal-header">
          <div className="header-info">
            <h2>{title}</h2>
          </div>
          <button type="button" className="close-btn" onClick={onClose} aria-label="Close modal">
            x
          </button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}

export default function ClientAccounts() {
  const [clients, setClients] = useState([]);
  const [packages, setPackages] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [packageFilter, setPackageFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [isLoading, setIsLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [actionError, setActionError] = useState("");
  const [successNote, setSuccessNote] = useState("");
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [isCredentialsModalOpen, setIsCredentialsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [credentialsTarget, setCredentialsTarget] = useState(null);
  const [clientForm, setClientForm] = useState(defaultClientForm);
  const [credentialsForm, setCredentialsForm] = useState(defaultCredentialForm);
  const [isSaving, setIsSaving] = useState(false);
  const [clientLogoFile, setClientLogoFile] = useState(null);
  const [clientLogoPreviewUrl, setClientLogoPreviewUrl] = useState("");
  const clientLogoObjectUrlRef = useRef("");

  const filteredClients = useMemo(
    () =>
      clients.filter((client) => {
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
      }),
    [clients, packageFilter, searchQuery, statusFilter],
  );

  useEffect(() => {
    loadPage();
  }, []);

  useEffect(
    () => () => {
      if (clientLogoObjectUrlRef.current) {
        URL.revokeObjectURL(clientLogoObjectUrlRef.current);
        clientLogoObjectUrlRef.current = "";
      }
    },
    [],
  );

  const resetClientLogo = (nextPreviewUrl = "") => {
    if (clientLogoObjectUrlRef.current) {
      URL.revokeObjectURL(clientLogoObjectUrlRef.current);
      clientLogoObjectUrlRef.current = "";
    }

    setClientLogoFile(null);
    setClientLogoPreviewUrl(nextPreviewUrl);
  };

  const closeClientModal = () => {
    setIsClientModalOpen(false);
    resetClientLogo("");
  };

  const toClientFormData = (payload) => {
    const formData = new FormData();

    Object.entries(payload).forEach(([key, value]) => {
      formData.append(key, value == null ? "" : String(value));
    });

    if (clientLogoFile) {
      formData.append("logo", clientLogoFile);
    }

    return formData;
  };

  const handleClientLogoSelection = (event) => {
    const selectedFile = event.target.files?.[0] || null;
    event.target.value = "";
    setActionError("");

    if (!selectedFile) {
      return;
    }

    const allowedMimeTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
    if (!allowedMimeTypes.includes(selectedFile.type)) {
      setActionError("Please upload a valid logo image (JPG, PNG, or WEBP).");
      return;
    }

    const maxSizeInBytes = 5 * 1024 * 1024;
    if (selectedFile.size > maxSizeInBytes) {
      setActionError("Logo size must be 5 MB or less.");
      return;
    }

    if (clientLogoObjectUrlRef.current) {
      URL.revokeObjectURL(clientLogoObjectUrlRef.current);
    }

    const nextPreviewUrl = URL.createObjectURL(selectedFile);
    clientLogoObjectUrlRef.current = nextPreviewUrl;

    setClientLogoFile(selectedFile);
    setClientLogoPreviewUrl(nextPreviewUrl);
  };

  const loadPage = async () => {
    setIsLoading(true);
    setPageError("");

    try {
      const [clientsData, packageData] = await Promise.all([
        fetchFseClientAccounts(),
        fetchFsePackages(),
      ]);
      setClients(clientsData);
      setPackages(packageData);
    } catch (requestError) {
      setPageError(requestError?.response?.data?.message || "Unable to load client accounts.");
    } finally {
      setIsLoading(false);
    }
  };

  const openCreateClient = () => {
    setEditingClient(null);
    setClientForm({
      ...defaultClientForm,
      packageType: packages[0]?.name || "STANDARD",
    });
    resetClientLogo("");
    setActionError("");
    setSuccessNote("");
    setIsClientModalOpen(true);
  };

  const openEditClient = (client) => {
    setEditingClient(client);
    setClientForm({
      name: client.name || "",
      industry: client.industry || "",
      email: client.email || "",
      phone: client.phone || "",
      city: client.city || "",
      region: client.region || "",
      zone: client.zone || "",
      packageType: client.packageType || "STANDARD",
      configurationNotes: client.configurationNotes || "",
      accountManager: client.accountManager || "",
      clientName: "",
      clientEmail: "",
      clientPassword: "",
      status: client.status || "ACTIVE",
    });
    resetClientLogo(client.logoUrl || "");
    setActionError("");
    setSuccessNote("");
    setIsClientModalOpen(true);
  };

  const openCredentialsModal = (client) => {
    setCredentialsTarget(client);
    setCredentialsForm({
      clientName: client.clientUser?.name || "",
      clientEmail: client.clientUser?.email || "",
      clientPassword: "",
    });
    setActionError("");
    setSuccessNote("");
    setIsCredentialsModalOpen(true);
  };

  const handleClientSubmit = async (event) => {
    event.preventDefault();
    setIsSaving(true);
    setActionError("");
    setSuccessNote("");

    try {
      const payload = { ...clientForm };
      const requestPayload = clientLogoFile ? toClientFormData(payload) : payload;

      if (editingClient) {
        await updateFseClientAccount(editingClient.id, requestPayload);
        setSuccessNote("Client account updated successfully.");
      } else {
        const response = await createFseClientAccount(requestPayload);
        const passwordNote = response?.temporaryPassword
          ? ` Temporary password: ${response.temporaryPassword}`
          : "";
        const qrNote = response?.qrGenerationError
          ? ` QR kit note: ${response.qrGenerationError}`
          : "";
        setSuccessNote(`Client account created successfully.${passwordNote}${qrNote}`);
      }

      await loadPage();
      closeClientModal();
    } catch (requestError) {
      setActionError(requestError?.response?.data?.message || "Unable to save client account.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCredentialsSubmit = async (event) => {
    event.preventDefault();
    setIsSaving(true);
    setActionError("");
    setSuccessNote("");

    try {
      if (!credentialsTarget?.id) {
        throw new Error("Client account not selected.");
      }
      await updateFseClientAccountCredentials(credentialsTarget.id, credentialsForm);
      await loadPage();
      setSuccessNote("Client credentials updated successfully.");
      setIsCredentialsModalOpen(false);
    } catch (requestError) {
      setActionError(requestError?.response?.data?.message || "Unable to update credentials.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="page-section">
        <div className="data-card">Loading client accounts...</div>
      </div>
    );
  }

  if (pageError) {
    return (
      <div className="page-section">
        <div className="status-banner">{pageError}</div>
      </div>
    );
  }

  return (
    <div className="page-section client-accounts-page">
      <section className="my-leads-heading client-accounts-heading">
        <div>
          <h1>Client Accounts</h1>
          <p>Manage and configure company/client accounts with CRM-grade data flow.</p>
        </div>
        <button type="button" className="button button-primary client-primary-btn" onClick={openCreateClient}>
          <LuPlus />
          Add Client
        </button>
      </section>

      {actionError ? <div className="status-banner">{actionError}</div> : null}
      {successNote ? <div className="status-banner success-banner">{successNote}</div> : null}

      <section className="my-leads-toolbar-card">
        <div className="my-leads-search">
          <LuSearch />
          <input
            type="text"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search company, manager, geography, or client credentials..."
          />
        </div>

        <div className="my-leads-zone-time-row">
          <label className="my-leads-select-field">
            <span className="my-leads-filter-label">Package:</span>
            <select
              className="my-leads-select-input"
              value={packageFilter}
              onChange={(event) => setPackageFilter(event.target.value)}
            >
              <option value="ALL">All packages</option>
              {packages.map((pkg) => (
                <option key={pkg.name} value={pkg.name}>
                  {toTitleCase(pkg.name)}
                </option>
              ))}
            </select>
          </label>

          <label className="my-leads-select-field">
            <span className="my-leads-filter-label">Status:</span>
            <select
              className="my-leads-select-input"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
            >
              <option value="ALL">All statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </label>
        </div>
      </section>

      <section className="my-leads-table-card">
        <div className="table-wrap">
          <table className="my-leads-table client-accounts-table">
            <thead>
              <tr>
                <th>COMPANY</th>
                <th>GEOGRAPHY</th>
                <th>PACKAGE</th>
                <th>CLIENT ACCESS</th>
                <th>ACCOUNT MANAGER</th>
                <th aria-label="Row actions" />
              </tr>
            </thead>
            <tbody>
              {filteredClients.length ? (
                filteredClients.map((client) => (
                  <tr key={client.id}>
                    <td>
                      <div className="company-cell">
                        <span className="row-icon">
                          <LuBuilding2 />
                        </span>
                        <div className="client-company-stack">
                          <strong>{client.name || "-"}</strong>
                          <small>{client.industry || "-"}</small>
                          <small>{client.email || "-"}</small>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="client-geo-stack">
                        <span>{client.city || "City pending"}</span>
                        <small>
                          {(client.region || "Region pending")} | {(client.zone || "Zone pending")}
                        </small>
                      </div>
                    </td>
                    <td>
                      <div className="client-package-stack">
                        <span className="client-badge">{toTitleCase(client.packageType)}</span>
                        <small>
                          {Number(client.activeJobCount || 0)}/{Number(client.jobLimit || 0)} jobs active
                        </small>
                      </div>
                    </td>
                    <td>
                      <div className="client-access-stack">
                        <strong>{client.clientUser?.name || "Not linked"}</strong>
                        <small>{client.clientUser?.email || "No credentials"}</small>
                      </div>
                    </td>
                    <td>
                      <div className="client-manager-stack">
                        <span>{client.accountManager || "Unassigned"}</span>
                        <small>{client.lastUpdated || "-"}</small>
                      </div>
                    </td>
                    <td>
                      <div className="client-action-stack">
                        <span className={`client-status-pill ${client.status === "ACTIVE" ? "is-active" : "is-inactive"}`}>
                          {toTitleCase(client.status)}
                        </span>
                        <div className="client-inline-actions">
                          <button type="button" onClick={() => openEditClient(client)}>
                            Edit
                          </button>
                          <button type="button" onClick={() => openCredentialsModal(client)}>
                            Credentials
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="empty-cell">
                    No clients match the current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <FsePanelModal
        open={isClientModalOpen}
        onClose={closeClientModal}
        title={editingClient ? "Edit Client Account" : "Create Client Account"}
        maxWidthClass="fse-modal-large"
      >
        <form className="fse-form-grid" onSubmit={handleClientSubmit}>
          <label className="fse-form-field">
            <span>Company Name *</span>
            <input
              className="form-input"
              value={clientForm.name}
              onChange={(event) => setClientForm((current) => ({ ...current, name: event.target.value }))}
              required
            />
          </label>

          <label className="fse-form-field">
            <span>Industry</span>
            <select
              className="form-select"
              value={clientForm.industry}
              onChange={(event) => setClientForm((current) => ({ ...current, industry: event.target.value }))}
            >
              <option value="">Select industry</option>
              {industryOptions.map((industry) => (
                <option key={industry} value={industry}>
                  {industry}
                </option>
              ))}
            </select>
          </label>

          <label className="fse-form-field fse-form-field-full">
            <span>Company Logo (optional)</span>
            <input
              className="form-input fse-logo-upload-input"
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp"
              onChange={handleClientLogoSelection}
            />
            <small className="fse-field-hint">
              This logo will be used in generated QR PDFs for this client. Max size: 5 MB.
            </small>
            {clientLogoPreviewUrl ? (
              <div className="fse-logo-preview-wrap">
                <img src={clientLogoPreviewUrl} alt="Company logo preview" className="fse-logo-preview" />
                <button type="button" className="fse-logo-clear-btn" onClick={() => resetClientLogo("")}>
                  Remove logo
                </button>
              </div>
            ) : null}
          </label>

          <label className="fse-form-field">
            <span>Company Email *</span>
            <input
              className="form-input"
              type="email"
              value={clientForm.email}
              onChange={(event) => setClientForm((current) => ({ ...current, email: event.target.value }))}
              required
            />
          </label>

          <label className="fse-form-field">
            <span>Phone</span>
            <input
              className="form-input"
              value={clientForm.phone}
              onChange={(event) => setClientForm((current) => ({ ...current, phone: event.target.value }))}
            />
          </label>

          <label className="fse-form-field">
            <span>State</span>
            <input
              className="form-input"
              value={clientForm.region}
              onChange={(event) => setClientForm((current) => ({ ...current, region: event.target.value }))}
            />
          </label>

          <label className="fse-form-field">
            <span>City</span>
            <input
              className="form-input"
              value={clientForm.city}
              onChange={(event) => setClientForm((current) => ({ ...current, city: event.target.value }))}
            />
          </label>

          <label className="fse-form-field">
            <span>Zone</span>
            <input
              className="form-input"
              value={clientForm.zone}
              onChange={(event) => setClientForm((current) => ({ ...current, zone: event.target.value }))}
            />
          </label>

          <label className="fse-form-field">
            <span>Package</span>
            <select
              className="form-select"
              value={clientForm.packageType}
              onChange={(event) => setClientForm((current) => ({ ...current, packageType: event.target.value }))}
            >
              {packages.map((pkg) => (
                <option key={pkg.name} value={pkg.name}>
                  {toTitleCase(pkg.name)} ({pkg.jobLimit} posts)
                </option>
              ))}
            </select>
          </label>

          <label className="fse-form-field">
            <span>Account Manager</span>
            <input
              className="form-input"
              value={clientForm.accountManager}
              onChange={(event) => setClientForm((current) => ({ ...current, accountManager: event.target.value }))}
            />
          </label>

          <label className="fse-form-field">
            <span>Status</span>
            <select
              className="form-select"
              value={clientForm.status}
              onChange={(event) => setClientForm((current) => ({ ...current, status: event.target.value }))}
            >
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </label>

          {!editingClient ? (
            <>
              <label className="fse-form-field">
                <span>Client User Name *</span>
                <input
                  className="form-input"
                  value={clientForm.clientName}
                  onChange={(event) => setClientForm((current) => ({ ...current, clientName: event.target.value }))}
                  required
                />
              </label>

              <label className="fse-form-field">
                <span>Client User Email *</span>
                <input
                  className="form-input"
                  type="email"
                  value={clientForm.clientEmail}
                  onChange={(event) => setClientForm((current) => ({ ...current, clientEmail: event.target.value }))}
                  required
                />
              </label>

              <label className="fse-form-field">
                <span>Client Password</span>
                <input
                  className="form-input"
                  value={clientForm.clientPassword}
                  onChange={(event) => setClientForm((current) => ({ ...current, clientPassword: event.target.value }))}
                  placeholder="Leave empty to auto-generate"
                />
              </label>
            </>
          ) : null}

          <label className="fse-form-field fse-form-field-full">
            <span>Configuration Notes</span>
            <textarea
              className="form-textarea"
              value={clientForm.configurationNotes}
              onChange={(event) =>
                setClientForm((current) => ({ ...current, configurationNotes: event.target.value }))
              }
            />
          </label>

          <div className="fse-modal-actions">
            <button type="button" className="secondary-btn" onClick={closeClientModal}>
              Cancel
            </button>
            <button type="submit" className="primary-btn" disabled={isSaving}>
              {isSaving ? "Saving..." : editingClient ? "Update Client" : "Create Client"}
            </button>
          </div>
        </form>
      </FsePanelModal>

      <FsePanelModal
        open={isCredentialsModalOpen}
        onClose={() => setIsCredentialsModalOpen(false)}
        title="Edit Client Credentials"
      >
        <form className="fse-form-grid" onSubmit={handleCredentialsSubmit}>
          <label className="fse-form-field">
            <span>Client User Name *</span>
            <input
              className="form-input"
              value={credentialsForm.clientName}
              onChange={(event) =>
                setCredentialsForm((current) => ({ ...current, clientName: event.target.value }))
              }
              required
            />
          </label>

          <label className="fse-form-field">
            <span>Client User Email *</span>
            <input
              className="form-input"
              type="email"
              value={credentialsForm.clientEmail}
              onChange={(event) =>
                setCredentialsForm((current) => ({ ...current, clientEmail: event.target.value }))
              }
              required
            />
          </label>

          <label className="fse-form-field">
            <span>Reset Password</span>
            <input
              className="form-input"
              value={credentialsForm.clientPassword}
              onChange={(event) =>
                setCredentialsForm((current) => ({ ...current, clientPassword: event.target.value }))
              }
              placeholder="Leave empty to keep current password"
            />
          </label>

          <div className="fse-credentials-note">
            <LuKeyRound size={16} />
            Use this panel to update client login identity or rotate access password.
          </div>

          <div className="fse-modal-actions">
            <button type="button" className="secondary-btn" onClick={() => setIsCredentialsModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="primary-btn" disabled={isSaving}>
              {isSaving ? "Updating..." : "Update Credentials"}
            </button>
          </div>
        </form>
      </FsePanelModal>
    </div>
  );
}
