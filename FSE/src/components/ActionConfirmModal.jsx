import { LuCircleAlert, LuX } from "react-icons/lu";

export default function ActionConfirmModal({
  isOpen,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  tone = "primary",
  isSubmitting = false,
  onConfirm,
  onClose,
}) {
  if (!isOpen) {
    return null;
  }

  const confirmButtonStyle =
    tone === "forward"
      ? { background: "#2563eb", color: "#ffffff" }
      : tone === "danger"
        ? { background: "#dc2626", color: "#ffffff" }
        : undefined;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        style={{ maxWidth: "420px" }}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(event) => event.stopPropagation()}
      >
        <header className="modal-header">
          <div className="header-info">
            <h2>{title}</h2>
          </div>
          <button type="button" className="close-btn" onClick={onClose} disabled={isSubmitting}>
            <LuX />
          </button>
        </header>

        <div className="modal-body" style={{ paddingTop: "10px", paddingBottom: "18px" }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
            <LuCircleAlert style={{ color: "#1e3a8a", fontSize: "1.1rem", marginTop: "1px" }} />
            <p style={{ margin: 0, color: "#475569", lineHeight: 1.6 }}>{message}</p>
          </div>
        </div>

        <footer className="modal-footer">
          <button type="button" className="secondary-btn" onClick={onClose} disabled={isSubmitting}>
            {cancelLabel}
          </button>
          <button
            type="button"
            className="primary-btn"
            style={confirmButtonStyle}
            onClick={onConfirm}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Please wait..." : confirmLabel}
          </button>
        </footer>
      </div>
    </div>
  );
}
