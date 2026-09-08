import React, { useState, useRef, useCallback, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FiChevronRight,
  FiHome,
  FiFileText,
  FiUpload,
  FiTrash2,
  FiDownload,
  FiLoader,
  FiAlertCircle,
  FiBell,
  FiChevronDown,
  FiMenu,
  FiX,
} from "react-icons/fi";
import { useAuth } from "../../../../AuthContext";
import "./ResumeViewer.css";
import "../dashboard/ProfileDashboard.css";
import authService from "../../../../services/authService";
import api from "../../../../services/api";
import CandidateHeader from "../../../../components/common/CandidateHeader";
import LandingFooter from "../../../../components/LandingFooter";

const formatBytes = (bytes) => {
  if (!bytes || bytes === 0) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const formatDate = (d) => {
  if (!d) return "";
  const date = new Date(d);
  if (isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const ResumeViewer = () => {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [blobUrl, setBlobUrl] = useState("");
  const [loadingBlob, setLoadingBlob] = useState(false);
  const fileRef = useRef(null);
  const blobUrlRef = useRef("");

  const resume = user?.resume;
  const hasResume = resume?.url;

  useEffect(() => {
    if (!hasResume) {
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = "";
        setBlobUrl("");
      }
      return;
    }
    let cancelled = false;
    setLoadingBlob(true);
    api
      .get("/candidate/profile/resume", { responseType: "blob" })
      .then((res) => {
        if (cancelled) return;
        const pdfBlob = new Blob([res.data], { type: "application/pdf" });
        const url = URL.createObjectURL(pdfBlob);
        blobUrlRef.current = url;
        setBlobUrl(url);
      })
      .catch(() => {
        if (!cancelled) setError("Could not load resume preview.");
      })
      .finally(() => {
        if (!cancelled) setLoadingBlob(false);
      });
    return () => {
      cancelled = true;
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = "";
      }
    };
  }, [hasResume]);

  const handleUpload = useCallback(
    async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const maxSize = 10 * 1024 * 1024;
      if (file.size > maxSize) {
        setError("File size must be under 10MB");
        return;
      }
      const allowed = [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/rtf",
        "text/rtf",
      ];
      if (!allowed.includes(file.type)) {
        setError("Please upload a doc, docx, rtf, or pdf file");
        return;
      }
      setError("");
      setUploading(true);
      try {
        const result = await authService.uploadResume(file);
        if (result.success || result.data) {
          const updated = result.data || result;
          if (updated?.resume && updateUser) {
            updateUser({ ...user, resume: updated.resume });
          }
        }
      } catch (err) {
        setError("Upload failed. Please try again.");
      } finally {
        setUploading(false);
      }
    },
    [user, updateUser],
  );

  const handleDownload = useCallback(async () => {
    if (!hasResume) return;
    if (blobUrl) {
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = resume.fileName || "resume.pdf";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      return;
    }
    try {
      const res = await api.get("/candidate/profile/resume", {
        responseType: "blob",
      });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement("a");
      a.href = url;
      a.download = resume.fileName || "resume.pdf";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch {
      setError("Download failed. Please try again.");
    }
  }, [hasResume, blobUrl, resume?.fileName]);

  const handleDelete = useCallback(async () => {
    if (!hasResume) return;
    if (!window.confirm("Are you sure you want to delete your resume?")) return;
    setError("");
    setDeleting(true);
    try {
      const result = await authService.deleteResume();
      if (result.success && updateUser) {
        updateUser({
          ...user,
          resume: {
            fileName: "",
            url: "",
            publicId: "",
            storageProvider: "",
            sizeBytes: 0,
            mimeType: "",
            uploadedAt: null,
          },
        });
      }
    } catch (err) {
      setError("Delete failed. Please try again.");
    } finally {
      setDeleting(false);
    }
  }, [hasResume, user, updateUser]);

  return (
    <div className="rv-page">
      <CandidateHeader />

      <div className="rv-container">
        {/* Breadcrumbs */}
        <nav className="rv-breadcrumb">
          <button className="rv-bc-link" onClick={() => navigate("/profile")}>
            <FiHome size={14} /> Profile
          </button>
          <FiChevronRight size={14} className="rv-bc-sep" />
          <span className="rv-bc-current">
            <FiFileText size={14} /> Resume
          </span>
        </nav>

        {/* Header */}
        <div className="rv-header">
          <div className="rv-header-left">
            <h1 className="rv-title">Resume</h1>
            {hasResume && (
              <p className="rv-subtitle">
                {resume.fileName}
                {resume.sizeBytes > 0 && (
                  <span className="rv-meta">
                    {" "}
                    &middot; {formatBytes(resume.sizeBytes)}
                  </span>
                )}
                {resume.uploadedAt && (
                  <span className="rv-meta">
                    {" "}
                    &middot; Uploaded {formatDate(resume.uploadedAt)}
                  </span>
                )}
              </p>
            )}
          </div>
          <div className="rv-header-actions">
            <button
              className="rv-btn rv-btn-outline"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
            >
              <FiUpload size={14} />{" "}
              <span className="rv-btn-text">
                {hasResume ? "Upload New" : "Upload Resume"}
              </span>
            </button>
            {hasResume && (
              <>
                <button
                  className="rv-btn rv-btn-outline"
                  onClick={handleDownload}
                >
                  <FiDownload size={14} />{" "}
                  <span className="rv-btn-text">Download</span>
                </button>
                <button
                  className="rv-btn rv-btn-danger"
                  onClick={handleDelete}
                  disabled={deleting}
                >
                  {deleting ? (
                    <FiLoader size={14} className="rv-spin" />
                  ) : (
                    <FiTrash2 size={14} />
                  )}{" "}
                  <span className="rv-btn-text">Delete</span>
                </button>
              </>
            )}
            <input
              ref={fileRef}
              type="file"
              style={{ display: "none" }}
              accept=".doc,.docx,.rtf,.pdf,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/rtf,text/rtf"
              onChange={handleUpload}
              disabled={uploading}
            />
          </div>
        </div>

        {error && (
          <div className="rv-alert">
            <FiAlertCircle size={14} />
            <span>{error}</span>
            <button className="rv-alert-close" onClick={() => setError("")}>
              &times;
            </button>
          </div>
        )}

        {/* Upload Progress */}
        {uploading && (
          <div className="rv-upload-progress">
            <FiLoader size={18} className="rv-spin" />
            <span>Uploading resume…</span>
          </div>
        )}

        {/* Resume Viewer */}
        <div className="rv-viewer">
          {hasResume ? (
            loadingBlob ? (
              <div className="rv-loading">
                <FiLoader size={32} className="rv-spin" />
                <p>Loading resume…</p>
              </div>
            ) : resume.mimeType === "application/pdf" ||
              resume.url?.endsWith(".pdf") ? (
              blobUrl ? (
                <iframe src={blobUrl} title="Resume" className="rv-iframe" />
              ) : (
                <div className="rv-nonpdf">
                  <FiAlertCircle size={48} />
                  <h3>Preview unavailable</h3>
                  <p>Could not load resume preview.</p>
                  <button
                    className="rv-btn rv-btn-primary"
                    onClick={handleDownload}
                  >
                    <FiDownload size={14} /> Download to view
                  </button>
                </div>
              )
            ) : (
              <div className="rv-nonpdf">
                <FiFileText size={48} />
                <h3>{resume.fileName}</h3>
                <p>This file type cannot be previewed inline.</p>
                <button
                  className="rv-btn rv-btn-primary"
                  onClick={handleDownload}
                >
                  <FiDownload size={14} /> Download to view
                </button>
              </div>
            )
          ) : (
            <div className="rv-empty">
              <FiFileText size={48} />
              <h3>No resume uploaded</h3>
              <p>Upload your resume to let recruiters find you.</p>
              <button
                className="rv-btn rv-btn-primary"
                onClick={() => fileRef.current?.click()}
              >
                <FiUpload size={14} /> Upload Resume
              </button>
            </div>
          )}
        </div>
      </div>

      {/* <LandingFooter /> */}
    </div>
  );
};

export default ResumeViewer;
