import { useEffect, useState } from "react";
import { LuLink2, LuMail, LuPlus, LuQrCode, LuSend } from "react-icons/lu";
import {
  fetchFseQRCodes,
  generateFseManagedQRCode,
  getFseQrPdfDownloadUrl,
  shareFseQRCode,
} from "../api/fseApi";

const defaultCreateForm = {
  companyName: "",
  tagline: "",
  industry: "",
  email: "",
  phone: "",
  altPhone: "",
  state: "",
  city: "",
  zone: "",
  address: "",
  pincode: "",
  about: "",
  mission: "",
  vision: "",
  openings: "1",
  jobTitle: "",
  jobDepartment: "",
  jobType: "",
  jobLocation: "",
  experience: "",
  salaryMin: "",
  salaryMax: "",
  deadline: "",
  jobDescription: "",
  skills: "",
};

const formatDateTime = (value) => {
  if (!value) {
    return "-";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

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

export default function QRManagement() {
  const [qrCodes, setQrCodes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [actionError, setActionError] = useState("");
  const [successNote, setSuccessNote] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedQr, setSelectedQr] = useState(null);
  const [shareForm, setShareForm] = useState({ channel: "EMAIL", email: "" });
  const [createForm, setCreateForm] = useState(defaultCreateForm);
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreviewUrl, setLogoPreviewUrl] = useState("");

  useEffect(() => {
    loadQrCodes();
  }, []);

  useEffect(
    () => () => {
      if (logoPreviewUrl) {
        URL.revokeObjectURL(logoPreviewUrl);
      }
    },
    [logoPreviewUrl],
  );

  const resetCreateQrForm = () => {
    setCreateForm(defaultCreateForm);
    setLogoFile(null);
    setLogoPreviewUrl((currentPreviewUrl) => {
      if (currentPreviewUrl) {
        URL.revokeObjectURL(currentPreviewUrl);
      }
      return "";
    });
  };

  const closeCreateModal = () => {
    setIsCreateModalOpen(false);
    resetCreateQrForm();
  };

  const handleLogoSelection = (event) => {
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

    setLogoPreviewUrl((currentPreviewUrl) => {
      if (currentPreviewUrl) {
        URL.revokeObjectURL(currentPreviewUrl);
      }
      return URL.createObjectURL(selectedFile);
    });
    setLogoFile(selectedFile);
  };

  const clearSelectedLogo = () => {
    setLogoFile(null);
    setLogoPreviewUrl((currentPreviewUrl) => {
      if (currentPreviewUrl) {
        URL.revokeObjectURL(currentPreviewUrl);
      }
      return "";
    });
  };

  const loadQrCodes = async () => {
    setIsLoading(true);
    setPageError("");
    try {
      const data = await fetchFseQRCodes();
      setQrCodes(data);
    } catch (requestError) {
      setPageError(requestError?.response?.data?.message || "Unable to load QR management.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateQr = async (event) => {
    event.preventDefault();
    setActionError("");
    setSuccessNote("");
    setIsSubmitting(true);

    try {
      if (
        !createForm.companyName.trim() ||
        !createForm.email.trim() ||
        !createForm.phone.trim() ||
        !createForm.state.trim() ||
        !createForm.city.trim() ||
        !createForm.about.trim()
      ) {
        throw new Error("Company name, email, phone, state, city, and about are required.");
      }

      const skills = createForm.skills
        .split(",")
        .map((skill) => skill.trim())
        .filter(Boolean);

      const jobs = createForm.jobTitle.trim()
        ? [
            {
              title: createForm.jobTitle.trim(),
              department: createForm.jobDepartment.trim(),
              jobType: createForm.jobType.trim(),
              workplaceType: "",
              location: createForm.jobLocation.trim() || createForm.city.trim(),
              exp: createForm.experience.trim(),
              salaryMin: Number(createForm.salaryMin || 0),
              salaryMax: Number(createForm.salaryMax || 0),
              skills,
              deadline: createForm.deadline || "",
              description: createForm.jobDescription.trim(),
            },
          ]
        : [];

      const payload = {
        company: {
          name: createForm.companyName.trim(),
          tagline: createForm.tagline.trim(),
          industry: createForm.industry.trim(),
          size: "",
          founded: "",
          employees: "",
          headquarters: createForm.city.trim(),
          activelyHiring: true,
          openings: createForm.openings || "1",
          website: "",
          linkedIn: "",
          contact: {
            email: createForm.email.trim(),
            phone: createForm.phone.trim(),
            altPhone: createForm.altPhone.trim(),
          },
          location: {
            region: createForm.state.trim(),
            city: createForm.city.trim(),
            zone: createForm.zone.trim(),
            address: createForm.address.trim(),
            pincode: createForm.pincode.trim(),
          },
        },
        about: createForm.about.trim(),
        mission: createForm.mission.trim(),
        vision: createForm.vision.trim(),
        jobs,
        whyJoinUs: [],
      };

      const formData = new FormData();
      formData.append("payload", JSON.stringify(payload));
      if (logoFile) {
        formData.append("logo", logoFile);
      }

      const response = await generateFseManagedQRCode(formData);
      const createdCompanyName = createForm.companyName.trim();
      await loadQrCodes();
      setIsCreateModalOpen(false);
      resetCreateQrForm();
      setSuccessNote(
        `QR kit generated successfully for ${createdCompanyName}. Token: ${response.token}`,
      );
    } catch (requestError) {
      setActionError(requestError?.response?.data?.message || requestError.message || "Unable to generate QR.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleShareSave = async (event) => {
    event.preventDefault();
    if (!selectedQr?.id) {
      return;
    }
    setActionError("");
    setSuccessNote("");
    setIsSubmitting(true);

    try {
      await shareFseQRCode(selectedQr.id, shareForm);
      await loadQrCodes();
      setIsShareModalOpen(false);
      setSuccessNote("QR share record saved successfully.");
    } catch (requestError) {
      setActionError(requestError?.response?.data?.message || "Unable to save share record.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="page-section">
        <div className="data-card">Loading QR management...</div>
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
    <div className="page-section qr-management-page">
      <section className="my-leads-heading client-accounts-heading">
        <div>
          <h1>QR Management</h1>
          <p>Create/generate QR kits and manage all existing QR sharing records.</p>
        </div>
        <button
          type="button"
          className="button button-primary client-primary-btn"
          onClick={() => {
            setActionError("");
            setSuccessNote("");
            resetCreateQrForm();
            setIsCreateModalOpen(true);
          }}
        >
          <LuPlus />
          Create / Generate QR
        </button>
      </section>

      {actionError ? <div className="status-banner">{actionError}</div> : null}
      {successNote ? <div className="status-banner success-banner">{successNote}</div> : null}

      <section className="data-card">
        <div className="card-header">
          <div className="section-copy">
            <h2>Generated Assets</h2>
            <p>Review generated QR history and share details.</p>
          </div>
        </div>

        <div className="qr-records-list">
          {qrCodes.length ? (
            qrCodes.map((item) => (
              <article key={item.id} className="qr-record-card">
                <div className="qr-record-meta">
                  <div className="qr-record-title-row">
                    <h3>{item.companyName}</h3>
                    <span className="client-badge">{item.jobTitle || "Company landing"}</span>
                    <span className={`client-status-pill ${item.isActive ? "is-active" : "is-inactive"}`}>
                      {item.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <p>Token: {item.token}</p>
                  <p>
                    Shared via {(item.shareChannel || "manual").toLowerCase()} with{" "}
                    {item.sharedWithEmail || "no recipient recorded"}
                  </p>
                  <small>
                    Created {formatDateTime(item.createdAt)} | {Number(item.scans || 0)} scans
                  </small>
                </div>

                <div className="qr-record-actions">
                  <a href={item.qrImageUrl} target="_blank" rel="noreferrer">
                    <LuQrCode size={16} />
                    View QR
                  </a>
                  <a href={getFseQrPdfDownloadUrl(item.token)} target="_blank" rel="noreferrer">
                    <LuMail size={16} />
                    Download PDF
                  </a>
                  {item.pdfUrl ? (
                    <a href={item.pdfUrl} target="_blank" rel="noreferrer">
                      <LuLink2 size={16} />
                      Open PDF
                    </a>
                  ) : null}
                  <button
                    type="button"
                    className="qr-share-btn"
                    onClick={() => {
                      setSelectedQr(item);
                      setShareForm({
                        channel: item.shareChannel || "EMAIL",
                        email: item.sharedWithEmail || "",
                      });
                      setIsShareModalOpen(true);
                    }}
                  >
                    <LuSend size={16} />
                    Share Record
                  </button>
                </div>
              </article>
            ))
          ) : (
            <p className="helper-copy">No QR kits generated yet.</p>
          )}
        </div>
      </section>

      <FsePanelModal
        open={isCreateModalOpen}
        onClose={closeCreateModal}
        title="Create / Generate QR"
        maxWidthClass="fse-modal-xl"
      >
        <form className="fse-form-grid" onSubmit={handleCreateQr}>
          <label className="fse-form-field">
            <span>Company Name *</span>
            <input
              className="form-input"
              value={createForm.companyName}
              onChange={(event) =>
                setCreateForm((current) => ({ ...current, companyName: event.target.value }))
              }
              required
            />
          </label>

          <label className="fse-form-field">
            <span>Industry</span>
            <input
              className="form-input"
              value={createForm.industry}
              onChange={(event) =>
                setCreateForm((current) => ({ ...current, industry: event.target.value }))
              }
            />
          </label>

          <label className="fse-form-field fse-form-field-full">
            <span>Company Logo (optional)</span>
            <input
              className="form-input fse-logo-upload-input"
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp"
              onChange={handleLogoSelection}
            />
            <small className="fse-field-hint">
              This logo will be shown at the top of PDF/Open PDF instead of the company name. Max size: 5 MB.
            </small>
            {logoPreviewUrl ? (
              <div className="fse-logo-preview-wrap">
                <img src={logoPreviewUrl} alt="Company logo preview" className="fse-logo-preview" />
                <button type="button" className="fse-logo-clear-btn" onClick={clearSelectedLogo}>
                  Remove logo
                </button>
              </div>
            ) : null}
          </label>

          <label className="fse-form-field">
            <span>Email *</span>
            <input
              className="form-input"
              type="email"
              value={createForm.email}
              onChange={(event) =>
                setCreateForm((current) => ({ ...current, email: event.target.value }))
              }
              required
            />
          </label>

          <label className="fse-form-field">
            <span>Phone *</span>
            <input
              className="form-input"
              value={createForm.phone}
              onChange={(event) =>
                setCreateForm((current) => ({ ...current, phone: event.target.value }))
              }
              required
            />
          </label>

          <label className="fse-form-field">
            <span>State *</span>
            <input
              className="form-input"
              value={createForm.state}
              onChange={(event) =>
                setCreateForm((current) => ({ ...current, state: event.target.value }))
              }
              required
            />
          </label>

          <label className="fse-form-field">
            <span>City *</span>
            <input
              className="form-input"
              value={createForm.city}
              onChange={(event) =>
                setCreateForm((current) => ({ ...current, city: event.target.value }))
              }
              required
            />
          </label>

          <label className="fse-form-field">
            <span>Zone</span>
            <input
              className="form-input"
              value={createForm.zone}
              onChange={(event) =>
                setCreateForm((current) => ({ ...current, zone: event.target.value }))
              }
            />
          </label>

          <label className="fse-form-field">
            <span>Openings</span>
            <input
              className="form-input"
              type="number"
              min="1"
              value={createForm.openings}
              onChange={(event) =>
                setCreateForm((current) => ({ ...current, openings: event.target.value }))
              }
            />
          </label>

          <label className="fse-form-field">
            <span>Job Title (optional)</span>
            <input
              className="form-input"
              value={createForm.jobTitle}
              onChange={(event) =>
                setCreateForm((current) => ({ ...current, jobTitle: event.target.value }))
              }
            />
          </label>

          <label className="fse-form-field">
            <span>Job Department</span>
            <input
              className="form-input"
              value={createForm.jobDepartment}
              onChange={(event) =>
                setCreateForm((current) => ({ ...current, jobDepartment: event.target.value }))
              }
            />
          </label>

          <label className="fse-form-field">
            <span>Job Type</span>
            <input
              className="form-input"
              value={createForm.jobType}
              onChange={(event) =>
                setCreateForm((current) => ({ ...current, jobType: event.target.value }))
              }
              placeholder="Full-time / Contract / Internship"
            />
          </label>

          <label className="fse-form-field">
            <span>Skills (comma separated)</span>
            <input
              className="form-input"
              value={createForm.skills}
              onChange={(event) =>
                setCreateForm((current) => ({ ...current, skills: event.target.value }))
              }
            />
          </label>

          <label className="fse-form-field fse-form-field-full">
            <span>About *</span>
            <textarea
              className="form-textarea"
              value={createForm.about}
              onChange={(event) =>
                setCreateForm((current) => ({ ...current, about: event.target.value }))
              }
              required
            />
          </label>

          <div className="fse-modal-actions">
            <button type="button" className="secondary-btn" onClick={closeCreateModal}>
              Cancel
            </button>
            <button type="submit" className="primary-btn" disabled={isSubmitting}>
              {isSubmitting ? "Generating..." : "Create / Generate QR"}
            </button>
          </div>
        </form>
      </FsePanelModal>

      <FsePanelModal
        open={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        title="Share Record"
      >
        <form className="fse-form-grid" onSubmit={handleShareSave}>
          <label className="fse-form-field">
            <span>Channel</span>
            <select
              className="form-select"
              value={shareForm.channel}
              onChange={(event) =>
                setShareForm((current) => ({ ...current, channel: event.target.value }))
              }
            >
              <option value="EMAIL">Email</option>
              <option value="APP">App</option>
              <option value="MANUAL">Manual</option>
            </select>
          </label>

          <label className="fse-form-field">
            <span>Recipient Email</span>
            <input
              className="form-input"
              type="email"
              value={shareForm.email}
              onChange={(event) =>
                setShareForm((current) => ({ ...current, email: event.target.value }))
              }
              placeholder="client@example.com"
            />
          </label>

          <div className="fse-modal-actions">
            <button type="button" className="secondary-btn" onClick={() => setIsShareModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="primary-btn" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Share Record"}
            </button>
          </div>
        </form>
      </FsePanelModal>
    </div>
  );
}
