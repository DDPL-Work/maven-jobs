export default function computeRelevanceScore(job, rawJob, user) {
  if (!user) return 0;
  let score = 0;

  const userSkills = (user.skills || []).map(s => String(s).toLowerCase());
  const rawSkills = (Array.isArray(rawJob?.skills) ? rawJob.skills : []);
  const jobSkills = rawSkills.map(s => String(s).toLowerCase());
  const jobTags = (job.tags || []).map(s => String(s).toLowerCase());
  const allKeywords = [...new Set([...jobSkills, ...jobTags])];

  // 1. Skills match — 40 pts
  if (userSkills.length > 0 && allKeywords.length > 0) {
    const matched = userSkills.filter(us => allKeywords.some(jk => jk.includes(us) || us.includes(jk)));
    score += (matched.length / Math.max(userSkills.length, 1)) * 40;
  }

  // 2. Title / role match — 20 pts
  const jobTitle = (job.title || '').toLowerCase();
  const titleSources = [user.currentTitle, user.headline, ...(user.preferredRoles || [])].filter(Boolean);
  const titleWords = [...new Set(titleSources.flatMap(s => String(s).toLowerCase().split(/\s+/).filter(w => w.length > 2)))];
  if (titleWords.length > 0 && jobTitle) {
    const matched = titleWords.filter(w => jobTitle.includes(w));
    score += (matched.length / titleWords.length) * 20;
  }

  // 3. Location match — 20 pts
  const jobLoc = (job.location || '').toLowerCase();
  const userLocs = [user.currentCity, ...(user.preferredLocations || [])].filter(Boolean).map(s => String(s).toLowerCase());
  if (userLocs.length > 0 && jobLoc) {
    const matched = userLocs.some(l => jobLoc.includes(l) || l.includes(jobLoc));
    if (matched) score += 20;
  }

  // 4. Experience fit — 20 pts
  const userExp = Number(user.totalExperience) || 0;
  const expMatch = job.exp ? job.exp.match(/\d+/g) : null;
  if (expMatch && userExp > 0) {
    const jobMin = Number(expMatch[0]) || 0;
    const jobMax = Number(expMatch[1]) || jobMin + 5;
    if (userExp >= jobMin && userExp <= jobMax) {
      score += 20;
    } else if (userExp >= jobMin * 0.7 && userExp <= jobMax * 1.3) {
      score += 10;
    }
  }

  return Math.round(score * 10) / 10;
}
