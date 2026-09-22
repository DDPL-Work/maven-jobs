export const calculateJobMatch = (user, job) => {
  if (!job) return null;
  const safeUser = user || {};

  // 1. Early Applicant
  // Check if job was posted within the last 3 days
  let isEarlyApplicant = false;
  if (job.posted) {
    const postedLower = job.posted.toLowerCase();
    if (
      postedLower.includes("today") ||
      postedLower.includes("recently") ||
      postedLower.includes("just now") ||
      postedLower.includes("hours") ||
      postedLower.includes("mins") ||
      postedLower.includes("minutes")
    ) {
      isEarlyApplicant = true;
    } else {
      const match = postedLower.match(/(\d+)\s+days?\s+ago/);
      if (match && parseInt(match[1]) <= 3) {
        isEarlyApplicant = true;
      }
    }
  } else {
    // If no posted date, assume recently for UI sake
    isEarlyApplicant = true;
  }

  // 2. Keyskills
  let isKeyskillsMatch = false;
  const userSkills = safeUser.skills?.map((s) => s.toLowerCase().trim()) || [];
  const userItSkills = safeUser.itSkills
    ? safeUser.itSkills.split(",").map((s) => s.toLowerCase().trim())
    : [];
  const allUserSkills = [...new Set([...userSkills, ...userItSkills])].filter(Boolean);

  const jobSkills = job.tags?.map((s) => s.toLowerCase().trim()) || [];

  if (jobSkills.length === 0) {
    isKeyskillsMatch = true; // No skills required
  } else if (allUserSkills.length > 0) {
    // If user has at least 30% of the required skills
    let matchCount = 0;
    jobSkills.forEach((js) => {
      if (allUserSkills.some((us) => us.includes(js) || js.includes(us))) {
        matchCount++;
      }
    });
    isKeyskillsMatch = matchCount / jobSkills.length >= 0.3; // threshold
  }

  // 3. Location
  let isLocationMatch = false;
  const userLocs = [];
  if (safeUser.currentCity) userLocs.push(safeUser.currentCity.toLowerCase().trim());
  if (safeUser.preferredLocations) {
    if (Array.isArray(safeUser.preferredLocations)) {
      userLocs.push(...safeUser.preferredLocations.map((l) => l.toLowerCase().trim()));
    } else if (typeof safeUser.preferredLocations === "string") {
      userLocs.push(
        ...safeUser.preferredLocations.split(",").map((l) => l.toLowerCase().trim())
      );
    }
  }

  const jobLoc = job.location ? job.location.toLowerCase().trim() : "";
  if (
    !jobLoc ||
    jobLoc.includes("remote") ||
    jobLoc.includes("anywhere") ||
    jobLoc.includes("pan india")
  ) {
    isLocationMatch = true;
  } else if (userLocs.length > 0) {
    isLocationMatch = userLocs.some(
      (ul) => jobLoc.includes(ul) || ul.includes(jobLoc)
    );
  }

  // 4. Work Experience
  let isExpMatch = false;
  // Parse user experience to a number
  let userExpNum = 0;
  if (safeUser.totalExperience) {
    const match = String(safeUser.totalExperience).match(/(\d+)/);
    if (match) userExpNum = parseInt(match[1]);
  } else if (safeUser.workExperiences && safeUser.workExperiences.length > 0) {
    // Estimate from work experiences length if totalExperience is missing
    userExpNum = safeUser.workExperiences.length * 1.5; // very rough estimate
  }

  const jobExp = job.exp ? String(job.exp).toLowerCase() : "";
  if (
    !jobExp ||
    jobExp.includes("not specified") ||
    jobExp.includes("any") ||
    jobExp.includes("fresher")
  ) {
    isExpMatch = true;
  } else {
    const expRangeMatch = jobExp.match(/(\d+)\s*[-–]\s*(\d+)/);
    if (expRangeMatch) {
      const min = parseInt(expRangeMatch[1]);
      const max = parseInt(expRangeMatch[2]);
      // Match if user is within the range, or has slightly more
      isExpMatch = userExpNum >= min && userExpNum <= max + 3;
    } else {
      const singleMatch = jobExp.match(/(\d+)/);
      if (singleMatch) {
        const reqExp = parseInt(singleMatch[1]);
        isExpMatch = userExpNum >= reqExp;
      } else {
        isExpMatch = true; // couldn't parse, assume match
      }
    }
  }

  return {
    earlyApplicant: isEarlyApplicant,
    keyskills: isKeyskillsMatch,
    location: isLocationMatch,
    workExperience: isExpMatch,
  };
};
