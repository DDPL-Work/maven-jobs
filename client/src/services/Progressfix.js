// ===============================
// STEP-BASED PROGRESS LOGIC (Production-Ready)
// ===============================

/**
 * Each step defines:
 *   required  – fields that MUST be non-empty for the step to count as "complete"
 *   partial   – fields that add weight even when not required
 *
 * Progress = weighted sum across all steps (required fields count 2×, partial 1×)
 * This gives a smooth, meaningful bar instead of binary jumps.
 */
const STEP_CONFIG = [
  // 0 — Company Info
  {
    required: ["companyName", "industry"],
    partial: [
      "tagline",
      "companySize",
      "foundedYear",
      "employeesCount",
      "headquarters",
      "openings",
    ],
  },
  // 1 — Contact
  {
    required: ["email", "phone"],
    partial: ["altPhone", "website", "linkedIn"],
  },
  // 2 — Location
  {
    required: ["city"],
    partial: ["country", "region", "zone", "address", "pincode"],
  },
  // 3 — About (all optional but tracked)
  {
    required: [],
    partial: ["about", "mission", "vision"],
  },
  // 4 — Jobs (at least one job with a title)
  {
    required: ["jobs"],
    partial: [],
  },
  // 5 — Why Join Us (optional but tracked)
  {
    required: [],
    partial: ["whyJoinUs"],
  },
];

/** Check if a field value is non-empty */
function isFilled(value) {
  if (value === null || value === undefined) return false;
  if (typeof value === "boolean") return true;
  if (typeof value === "string") return value.trim() !== "";
  if (typeof value === "number") return true;
  return false;
}

/** Check if a step's REQUIRED fields are all satisfied */
export function isStepComplete(stepIndex, formData) {
  const config = STEP_CONFIG[stepIndex];
  if (!config) return false;

  return config.required.every((field) => {
    if (field === "jobs") {
      return (
        Array.isArray(formData.jobs) &&
        formData.jobs.length > 0 &&
        formData.jobs[0].title.trim() !== ""
      );
    }
    return isFilled(formData[field]);
  });
}

/**
 * Calculate overall form progress as a percentage (0–100).
 *
 * Algorithm:
 *  - Each required field = 2 points max
 *  - Each partial field  = 1 point max
 *  - Sum filled points / total points × 100
 */
export function calcProgress(formData) {
  let total = 0;
  let filled = 0;

  STEP_CONFIG.forEach((config) => {
    // Required fields — weight 2
    config.required.forEach((field) => {
      total += 2;
      if (field === "jobs") {
        if (
          Array.isArray(formData.jobs) &&
          formData.jobs.length > 0 &&
          formData.jobs[0].title.trim() !== ""
        ) {
          filled += 2;
        }
      } else if (isFilled(formData[field])) {
        filled += 2;
      }
    });

    // Partial fields — weight 1
    config.partial.forEach((field) => {
      total += 1;
      if (field === "whyJoinUs") {
        if (
          Array.isArray(formData.whyJoinUs) &&
          formData.whyJoinUs.length > 0 &&
          formData.whyJoinUs[0].title.trim() !== ""
        ) {
          filled += 1;
        }
      } else if (isFilled(formData[field])) {
        filled += 1;
      }
    });
  });

  if (total === 0) return 0;
  return Math.round((filled / total) * 100);
}
