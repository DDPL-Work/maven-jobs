import { useMemo, useState } from "react";
import { LuUserPlus, LuX } from "react-icons/lu";

export default function AssignFseModal({ lead, fses = [], myZone = "", onClose, onSubmit }) {
  const [selectedFse, setSelectedFse] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const availableFses = useMemo(() => {
    return fses.filter((fse) => {
      if (!myZone) {
        return true;
      }
      return String(fse.zone || "").toLowerCase() === String(myZone).toLowerCase();
    });
  }, [fses, myZone]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!selectedFse) {
      setError("Please select an FSE.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      await onSubmit(lead.id, selectedFse);
    } catch (requestError) {
      setError(requestError.message || "Failed to assign FSE.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: "460px" }}>
        <header className="modal-header">
          <h2>Assign Lead to FSE</h2>
          <button type="button" className="close-btn" onClick={onClose} aria-label="Close">
            <LuX />
          </button>
        </header>

        <form onSubmit={handleSubmit} style={{ padding: "20px" }}>
          <p style={{ marginBottom: "16px", color: "#475569", fontSize: "0.9rem" }}>
            Select a Field Sales Executive from <strong>{myZone || "your zone"}</strong> to assign{" "}
            <strong>{lead.companyName}</strong>.
          </p>

          <div className="form-group" style={{ marginBottom: "20px" }}>
            <label className="form-label" htmlFor="fse-select">Select FSE</label>
            <select
              id="fse-select"
              value={selectedFse}
              onChange={(event) => setSelectedFse(event.target.value)}
              className="form-input"
              style={{ appearance: "auto" }}
            >
              <option value="" disabled>-- Select FSE --</option>
              {availableFses.length > 0 ? (
                availableFses.map((fse) => (
                  <option key={fse.id} value={fse.id}>
                    {fse.fullName} ({fse.zone} Zone | Active Leads: {fse.activeLeads || 0})
                  </option>
                ))
              ) : (
                <option value="" disabled>No active FSEs available in {myZone || "this zone"}</option>
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
              disabled={isSubmitting || availableFses.length === 0}
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
