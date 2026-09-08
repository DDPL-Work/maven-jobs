const DRAFT_KEY = 'employerJobDrafts';

export function getDrafts() {
  try {
    return JSON.parse(localStorage.getItem(DRAFT_KEY) || '[]');
  } catch {
    return [];
  }
}

export function saveDraft(data) {
  const drafts = getDrafts();
  const existing = drafts.findIndex(
    (d) => d.draftId === data.draftId
  );

  const entry = {
    ...data,
    draftId: data.draftId || crypto.randomUUID(),
    savedAt: Date.now(),
    savedAtISO: new Date().toISOString(),
  };

  if (existing >= 0) {
    drafts[existing] = entry;
  } else {
    drafts.unshift(entry);
  }

  localStorage.setItem(DRAFT_KEY, JSON.stringify(drafts));
  return entry;
}

export function deleteDraft(draftId) {
  const drafts = getDrafts().filter((d) => d.draftId !== draftId);
  localStorage.setItem(DRAFT_KEY, JSON.stringify(drafts));
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