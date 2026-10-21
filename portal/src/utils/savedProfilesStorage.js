/**
 * Utility for managing saved candidate profiles in LocalStorage for employers
 */
const SAVED_PROFILES_KEY = 'employer_saved_candidates';

export function resolveAvatarUrl(candidate) {
  if (!candidate) return "";
  const raw =
    (typeof candidate.avatar === "string" ? candidate.avatar : null) ||
    candidate.avatarUrl ||
    candidate.profilePic ||
    candidate.avatar ||
    candidate.photo ||
    candidate.image ||
    (candidate.userId && (candidate.userId.profilePic || candidate.userId.avatar || candidate.userId.photo)) ||
    (candidate.rawCandidate && (candidate.rawCandidate.profilePic || candidate.rawCandidate.avatar || candidate.rawCandidate.avatarUrl));

  if (!raw) return "";
  if (typeof raw === "string") {
    const trimmed = raw.trim();
    if (!trimmed || trimmed === "[object Object]" || trimmed === "undefined" || trimmed === "null") return "";
    return trimmed;
  }
  if (typeof raw === "object") {
    if (raw.url && typeof raw.url === "string") {
      const u = raw.url.trim();
      if (u && u !== "[object Object]" && u !== "undefined" && u !== "null") return u;
    }
    if (raw.path && typeof raw.path === "string") {
      const p = raw.path.trim();
      if (p && p !== "[object Object]") return p;
    }
  }
  return "";
}

export function getSavedCandidates() {
  try {
    const raw = localStorage.getItem(SAVED_PROFILES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((item) => ({
      ...item,
      avatar: resolveAvatarUrl(item),
    }));
  } catch (err) {
    console.error("Error reading saved profiles from localStorage:", err);
    return [];
  }
}

export function isCandidateSaved(candidateId) {
  if (!candidateId) return false;
  const list = getSavedCandidates();
  const searchId = String(candidateId);
  return list.some((item) => {
    const itemId = String(
      item.candidateId ||
      item._id ||
      item.id ||
      (item.userId && (item.userId._id || item.userId.id || item.userId)) ||
      ''
    );
    return itemId === searchId;
  });
}

export function saveCandidateToStorage(candidate) {
  if (!candidate) return false;
  try {
    const cId = String(
      candidate.id ||
      candidate._id ||
      (candidate.userId && (candidate.userId._id || candidate.userId.id || candidate.userId)) ||
      ''
    );
    if (!cId) return false;

    const list = getSavedCandidates();
    const existingIndex = list.findIndex((item) => {
      const itemId = String(
        item.candidateId ||
        item._id ||
        item.id ||
        (item.userId && (item.userId._id || item.userId.id || item.userId)) ||
        ''
      );
      return itemId === cId;
    });

    const name =
      candidate.name ||
      `${candidate.firstName || ''} ${candidate.lastName || ''}`.trim() ||
      "Candidate";
    const avatar = resolveAvatarUrl(candidate);
    const currentTitle = candidate.currentTitle || candidate.designation || candidate.headline || "";
    const currentCompany = candidate.currentCompany || candidate.company || "";
    const totalExperience =
      candidate.totalExperience != null
        ? candidate.totalExperience
        : (candidate.experience != null ? candidate.experience : "");
    const currentCity = candidate.currentCity || candidate.location || candidate.city || "";
    const skills = Array.isArray(candidate.skills)
      ? candidate.skills
      : typeof candidate.skills === 'string'
      ? candidate.skills.split(',').map((s) => s.trim()).filter(Boolean)
      : [];

    const newEntry = {
      candidateId: cId,
      _id: cId,
      id: cId,
      name,
      avatar,
      currentTitle,
      currentCompany,
      totalExperience,
      currentCity,
      folderName: candidate.folderName || "Saved Profiles",
      skills,
      savedAt: new Date().toISOString(),
      phone: candidate.phone || (candidate.userId && candidate.userId.phone) || "",
      email: candidate.email || (candidate.userId && candidate.userId.email) || "",
      resumeUrl: candidate.resumeUrl || (candidate.resume && candidate.resume.url) || "",
      rawCandidate: candidate,
    };

    let updatedList;
    if (existingIndex >= 0) {
      updatedList = [...list];
      updatedList[existingIndex] = { ...list[existingIndex], ...newEntry };
    } else {
      updatedList = [newEntry, ...list];
    }

    localStorage.setItem(SAVED_PROFILES_KEY, JSON.stringify(updatedList));
    window.dispatchEvent(
      new CustomEvent('employer-saved-profiles-changed', {
        detail: { action: 'save', candidateId: cId, candidate: newEntry },
      })
    );
    return true;
  } catch (err) {
    console.error("Error saving candidate to localStorage:", err);
    return false;
  }
}

export function removeSavedCandidateFromStorage(candidateId) {
  if (!candidateId) return false;
  try {
    const searchId = String(candidateId);
    const list = getSavedCandidates();
    const updatedList = list.filter((item) => {
      const itemId = String(
        item.candidateId ||
        item._id ||
        item.id ||
        (item.userId && (item.userId._id || item.userId.id || item.userId)) ||
        ''
      );
      return itemId !== searchId;
    });

    localStorage.setItem(SAVED_PROFILES_KEY, JSON.stringify(updatedList));
    window.dispatchEvent(
      new CustomEvent('employer-saved-profiles-changed', {
        detail: { action: 'remove', candidateId: searchId },
      })
    );
    return true;
  } catch (err) {
    console.error("Error removing candidate from localStorage:", err);
    return false;
  }
}

export function toggleSaveCandidateInStorage(candidate) {
  if (!candidate) return false;
  const cId = String(
    candidate.id ||
    candidate._id ||
    (candidate.userId && (candidate.userId._id || candidate.userId.id || candidate.userId)) ||
    ''
  );
  if (!cId) return false;

  if (isCandidateSaved(cId)) {
    removeSavedCandidateFromStorage(cId);
    return false;
  } else {
    saveCandidateToStorage(candidate);
    return true;
  }
}
