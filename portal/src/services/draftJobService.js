const DRAFT_KEY = 'employerJobDrafts';

function getCurrentUserId() {
  try {
    const userStored = localStorage.getItem("employerUser") || localStorage.getItem("user");
    if (!userStored) return null;
    const user = JSON.parse(userStored);
    return user?._id || user?.id || user?.userId || null;
  } catch {
    return null;
  }
}

export function getDrafts() {
  try {
    const drafts = JSON.parse(localStorage.getItem(DRAFT_KEY) || '[]');
    const currentUserId = getCurrentUserId();
    if (!currentUserId) return [];
    return drafts.filter(d => d.userId === currentUserId);
  } catch {
    return [];
  }
}

export function saveDraft(data) {
  // Read raw drafts from local storage to not overwrite others' drafts
  let allDrafts = [];
  try {
    allDrafts = JSON.parse(localStorage.getItem(DRAFT_KEY) || '[]');
  } catch {}
  
  const currentUserId = getCurrentUserId();
  
  const existing = allDrafts.findIndex(
    (d) => d.draftId === data.draftId
  );

  const entry = {
    ...data,
    draftId: data.draftId || crypto.randomUUID(),
    savedAt: Date.now(),
    savedAtISO: new Date().toISOString(),
    userId: currentUserId,
  };

  if (existing >= 0) {
    allDrafts[existing] = { ...allDrafts[existing], ...entry };
  } else {
    allDrafts.unshift(entry);
  }

  localStorage.setItem(DRAFT_KEY, JSON.stringify(allDrafts));
  return entry;
}

export function deleteDraft(draftId) {
  let allDrafts = [];
  try {
    allDrafts = JSON.parse(localStorage.getItem(DRAFT_KEY) || '[]');
  } catch {}
  allDrafts = allDrafts.filter((d) => d.draftId !== draftId);
  localStorage.setItem(DRAFT_KEY, JSON.stringify(allDrafts));
}

export function getDraft(draftId) {
  return getDrafts().find((d) => d.draftId === draftId) || null;
}

export function autoSaveDraft(formData, existingDraftId) {
  const hasData =
    formData.companyName?.trim() ||
    formData.jobTitle?.trim() ||
    formData.industry ||
    formData.location?.trim() ||
    formData.roleDescription?.trim() ||
    (formData.requiredSkills || []).length > 0;

  if (!hasData) return null;

  return saveDraft({
    draftId: existingDraftId,
    companyName: formData.companyName || '',
    jobTitle: formData.jobTitle || '',
    industry: formData.industry || '',
    location: formData.location || '',
    jobTypes: formData.jobTypes || [],
    salaryMin: formData.salaryMin || '',
    salaryMax: formData.salaryMax || '',
    payCycle: formData.payCycle || 'Per Annum',
    hideSalary: formData.hideSalary || false,
    roleDescription: formData.roleDescription || '',
    responsibilities: formData.responsibilities || '',
    skills: formData.skills || '',
    perks: formData.perks || [],
    minExp: formData.minExp || '',
    maxExp: formData.maxExp || '',
    minEducation: formData.minEducation || '',
    noticePeriod: formData.noticePeriod || '',
    requiredSkills: formData.requiredSkills || [],
    cvEnabled: formData.cvEnabled !== false,
    maxCvs: formData.maxCvs || '',
    cvEndDate: formData.cvEndDate || '',
    requireSample: formData.requireSample || false,
    questions: formData.questions || [],
    campaignPlan: formData.campaignPlan || 'Standard',
  });
}