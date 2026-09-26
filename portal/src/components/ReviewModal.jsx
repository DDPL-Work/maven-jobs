import React, { useState } from "react";
import { FiX, FiStar } from "react-icons/fi";
import { FaStar } from "react-icons/fa";
import authService from "../services/authService";

const ratingLabel = {
  1: "Poor",
  2: "Fair",
  3: "Good",
  4: "Very Good",
  5: "Excellent",
};

export default function ReviewModal({ companyId, companyName, onClose, onSuccess }) {
  const [hoverRating, setHoverRating] = useState(0);
  const [selectedRating, setSelectedRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!selectedRating) return;
    setReviewSubmitting(true);
    try {
      const savedUser = (() => {
        try {
          return JSON.parse(localStorage.getItem("user") || "{}");
        } catch {
          return {};
        }
      })();
      const res = await authService.submitCompanyReview(companyId, {
        rating: selectedRating,
        review: reviewText,
        headline: "",
        isAnonymous: false,
        candidateName:
          savedUser.name ||
          savedUser.fullName ||
          savedUser.email ||
          "Candidate",
        candidateTitle: savedUser.headline || savedUser.title || "Candidate",
      });
      const nextReview = res?.data?.review || null;
      if (onSuccess && nextReview) {
        onSuccess(nextReview);
      } else {
        onClose();
      }
    } catch (error) {
      alert(error?.message || "Failed to submit review");
    } finally {
      setReviewSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: "100vw",
        height: "100vh",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        background: "rgba(10,22,40,0.5)",
        backdropFilter: "blur(8px)",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "white",
          borderRadius: 24,
          width: "100%",
          maxWidth: 480,
          overflow: "hidden",
          boxShadow: "0 24px 64px rgba(10,22,40,0.2)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          style={{
            background: "#002366",
            padding: "28px 32px",
            position: "relative",
          }}
        >
          <button
            onClick={onClose}
            style={{
              position: "absolute",
              top: 20,
              right: 20,
              width: 36,
              height: 36,
              borderRadius: 10,
              background: "rgba(255,255,255,0.12)",
              border: "1px solid rgba(255,255,255,0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              cursor: "pointer",
            }}
          >
            <FiX size={16} />
          </button>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: "rgba(255,255,255,0.12)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 12,
            }}
          >
            <FiStar size={20} color="white" />
          </div>
          <h2
            style={{
              fontFamily: "'Sora', sans-serif",
              fontWeight: 800,
              fontSize: "1.3rem",
              color: "white",
              marginBottom: 4,
            }}
          >
            Write a Review
          </h2>
          <p
            style={{
              fontSize: "0.85rem",
              color: "rgba(255,255,255,0.6)",
              fontWeight: 500,
            }}
          >
            Share your experience at {companyName || "the company"}
          </p>
        </div>

        {/* Modal Body */}
        <div style={{ padding: "28px 32px" }}>
          {/* Star Picker */}
          <div style={{ textAlign: "center", marginBottom: 28 }}>
            <p
              style={{
                fontSize: "0.68rem",
                fontWeight: 800,
                color: "#94A3B8",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                marginBottom: 16,
              }}
            >
              Overall Rating
            </p>
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                gap: 8,
                marginBottom: 10,
              }}
            >
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setSelectedRating(star)}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: 4,
                    transition: "transform 0.15s",
                  }}
                  onMouseDown={(e) => {
                    e.currentTarget.style.transform = "scale(0.9)";
                  }}
                  onMouseUp={(e) => {
                    e.currentTarget.style.transform = "scale(1.15)";
                  }}
                >
                  <FaStar
                    size={32}
                    color={
                      (hoverRating || selectedRating) >= star
                        ? "#F59E0B"
                        : "#E2E8F0"
                    }
                  />
                </button>
              ))}
            </div>
            <div
              style={{
                height: 20,
                fontSize: "0.8rem",
                fontWeight: 800,
                color: "#F59E0B",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
              }}
            >
              {selectedRating ? ratingLabel[selectedRating] : ""}
            </div>
          </div>

          {/* Textarea */}
          <div style={{ marginBottom: 24 }}>
            <label
              style={{
                display: "block",
                fontSize: "0.68rem",
                fontWeight: 800,
                color: "#94A3B8",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                marginBottom: 8,
              }}
            >
              Share more details{" "}
              <span style={{ color: "#CBD5E1", fontWeight: 600 }}>
                (Optional)
              </span>
            </label>
            <textarea
              rows={4}
              placeholder="What's it like working here? Describe culture, growth, work-life balance..."
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              style={{
                width: "100%",
                background: "#F8FAFC",
                border: "1.5px solid #E2E8F0",
                borderRadius: 14,
                padding: "14px 16px",
                fontFamily: "'DM Sans', sans-serif",
                fontSize: "0.875rem",
                color: "#334155",
                fontWeight: 500,
                resize: "none",
                outline: "none",
                transition: "all 0.18s",
                lineHeight: 1.6,
                boxSizing: "border-box",
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "#1E5EFF";
                e.currentTarget.style.background = "white";
                e.currentTarget.style.boxShadow =
                  "0 0 0 3px rgba(30,94,255,0.1)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "#E2E8F0";
                e.currentTarget.style.background = "#F8FAFC";
                e.currentTarget.style.boxShadow = "none";
              }}
            />
          </div>

          {/* Buttons */}
          <div style={{ display: "flex", gap: 12 }}>
            <button
              onClick={onClose}
              style={{
                flex: 1,
                padding: "12px",
                borderRadius: 12,
                border: "1.5px solid #E2E8F0",
                background: "white",
                color: "#64748B",
                fontFamily: "'Sora', sans-serif",
                fontWeight: 800,
                fontSize: "0.85rem",
                cursor: "pointer",
                transition: "all 0.18s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#F8FAFC";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "white";
              }}
            >
              Cancel
            </button>
            <button
              disabled={!selectedRating || reviewSubmitting}
              onClick={handleSubmit}
              style={{
                flex: 2,
                padding: "12px",
                borderRadius: 12,
                border: "none",
                background:
                  selectedRating && !reviewSubmitting
                    ? "#002366"
                    : "#F1F5F9",
                color:
                  selectedRating && !reviewSubmitting ? "white" : "#94A3B8",
                fontFamily: "'Sora', sans-serif",
                fontWeight: 800,
                fontSize: "0.85rem",
                cursor:
                  selectedRating && !reviewSubmitting
                    ? "pointer"
                    : "not-allowed",
                transition: "all 0.18s",
                boxShadow:
                  selectedRating && !reviewSubmitting
                    ? "0 4px 16px rgba(0,35,102,0.25)"
                    : "none",
              }}
              onMouseEnter={(e) => {
                if (selectedRating && !reviewSubmitting)
                  e.currentTarget.style.background = "#1E3A8A";
              }}
              onMouseLeave={(e) => {
                if (selectedRating && !reviewSubmitting)
                  e.currentTarget.style.background = "#002366";
              }}
            >
              {reviewSubmitting ? "Submitting..." : "Submit Review"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
