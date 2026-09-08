import { useMemo, useState } from "react";
import { LuUserPlus, LuX } from "react-icons/lu";

export default function AssignFseModal({ lead, fses = [], myZone = "", onClose, onSubmit }) {
  const [selectedManager, setSelectedManager] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const availableManagers = useMemo(() => {
    return fses.filter((fse) => {
      if (!myZone) {
        return true;
      }
      return String(fse.zone || "").toLowerCase() === String(myZone).toLowerCase();
    });
  }, [fses, myZone]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!selectedManager) {
      setError("Please select a State Manager.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      await onSubmit(lead.id, selectedManager);
    } catch (requestError) {
      setError(requestError?.response?.data?.message || requestError.message || "Failed to assign State Manager.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: "460px" }}>
        <header className="modal-header">
          <h2>Assign Lead to State Manager</h2>
          <button type="button" className="close-btn" onClick={onClose} aria-label="Close">
            <LuX />
          </button>
        </header>

        <form onSubmit={handleSubmit} style={{ padding: "20px" }}>
          <p style={{ marginBottom: "16px", color: "#475569", fontSize: "0.9rem" }}>
            Select a State Manager from <strong>{myZone || "your zone"}</strong> to assign{" "}
            <strong>{lead.companyName}</strong>.
          </p>

          <div className="form-group" style={{ marginBottom: "20px" }}>
            <label className="form-label" htmlFor="fse-select">Select State Manager</label>
            <select
              id="fse-select"
              value={selectedManager}
              onChange={(event) => setSelectedManager(event.target.value)}
              className="form-input"
              style={{ appearance: "auto" }}
            >
              <option value="" disabled>-- Select State Manager --</option>
              {availableManagers.length > 0 ? (
                availableManagers.map((fse) => (
                  <option key={fse.id} value={fse.id}>
                    {fse.fullName} ({fse.state || fse.zone || "State N/A"} | Active Leads: {fse.activeLeads || 0})
                  </option>
                ))
              ) : (
                <option value="" disabled>No active State Managers available in {myZone || "this zone"}</option>
              )}
            </select>
          </div>

          {error && (
            <div style={{ marginBottom: "16px", color: "#dc2626", fontSize: "0.85rem" }}>
              {error}
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting || availableManagers.length === 0}
              style={{ display: "flex", alignItems: "center", gap: "6px" }}
            >
              <LuUserPlus size={16} />
              {isSubmitting ? "Assigning..." : "Assign"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
