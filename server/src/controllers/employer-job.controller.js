const mongoose = require("mongoose");
const asyncHandler = require("../middleware/async.middleware");
const Job = require("../models/Job");
const Application = require("../models/Application");
const User = require("../models/User");
const Company = require("../models/Company");
const CandidateProfile = require("../models/CandidateProfile");
const Nvite = require("../models/Nvite");
const jobReportService = require("../services/job-posting-report.service");

const createHttpError = (statusCode, message) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const toTrimmedString = (val) => (typeof val === "string" ? val.trim() : "");
const toPositiveInteger = (val, fallback = 1, min = 1, max = 100) => {
  const parsed = parseInt(val, 10);
  return Number.isFinite(parsed) ? Math.max(min, Math.min(max, parsed)) : fallback;
};

const resolveClientUserAndCompany = async (userId) => {
  const user = await User.findById(userId).select("-password");
  if (!user || user.role !== "CLIENT") {
    throw createHttpError(403, "Client access required");
  }
  if (!user.companyId) {
    throw createHttpError(403, "No company linked to this account");
  }
  const company = await Company.findById(user.companyId);
  if (!company) {
    throw createHttpError(404, "Company not found");
  }
  return { user, company };
};

/**
 * Normalizes job category into standard display tags
 */
const resolveJobCategory = (job) => {
  const text = `${job.jobType || ""} ${job.department || ""} ${job.title || ""}`.toLowerCase();
  if (text.includes("intern")) return "Internship";
  if (text.includes("hot") || text.includes("urgent")) return "Hot Vacancy";
  if (text.includes("smb") || text.includes("management")) return "SMB Job";
  if (text.includes("private") || job.createdBySource === "CLIENT") return "Private";
  return "NVite";
};

/**
 * Format candidate card by combining Application and full CandidateProfile details
 */
const formatCandidateCard = (app, candidate = {}, profile = {}, isRecommended = false) => {
  // 1. Resolve Name
  const candidateName = candidate.fullName || candidate.name || profile.name || "Candidate";

  // 2. Resolve Avatar
  const candidateAvatar = profile.profilePic?.url || candidate.avatar || candidate.profilePic?.url || "";

  // 3. Resolve Phone & Email
  const phone = profile.phone || profile.altPhone || candidate.phone || "";
  const email = candidate.email || profile.email || "";

  // 4. Resolve Experience
  let experience = profile.totalExperience || "";
  if (experience && !/[ym]/i.test(experience)) {
    experience = `${experience} Yrs`;
  }

  // 5. Resolve Salary
  let salary = "";
  if (profile.expectedSalary) {
    salary = String(profile.expectedSalary).trim();
    if (!salary.startsWith("₹")) salary = `₹ ${salary}`;
    if (!/lacs|lac|k|pm|pa/i.test(salary)) salary = `${salary} Lacs`;
  } else if (profile.currentSalary) {
    salary = `₹ ${profile.currentSalary} Lacs`;
  }

  // 6. Resolve Notice Period
  const noticePeriod = profile.noticePeriod || "";

  // 7. Resolve Location
  const location =
    [profile.currentCity, profile.currentState].filter(Boolean).join(", ") ||
    profile.currentCountry ||
    "";

  // 8. Resolve Current Role
  const currentRole = profile.currentTitle
    ? `${profile.currentTitle}${profile.currentCompany ? ` at ${profile.currentCompany}` : ""}`
    : (profile.currentCompany ? `At ${profile.currentCompany}` : "");

  // 9. Resolve Previous Role from workExperiences JSON array or previousCompany
  let previousRole = "";
  try {
    const experiences =
      typeof profile.workExperiences === "string"
        ? JSON.parse(profile.workExperiences || "[]")
        : profile.workExperiences;
    if (Array.isArray(experiences) && experiences.length > 1) {
      const prev = experiences[1];
      const title = prev.title || prev.designation || prev.role || "";
      const company = prev.company || prev.companyName || prev.organization || "";
      if (title && company) previousRole = `${title} at ${company}`;
      else previousRole = title || company || "";
    } else if (Array.isArray(experiences) && experiences.length === 1 && !profile.currentTitle) {
      const only = experiences[0];
      const title = only.title || only.designation || "";
      const company = only.company || only.companyName || "";
      if (title && company) previousRole = `${title} at ${company}`;
    }
  } catch (_) {}
  if (!previousRole && profile.previousCompany) {
    previousRole = profile.previousTitle
      ? `${profile.previousTitle} at ${profile.previousCompany}`
      : `Former at ${profile.previousCompany}`;
  }

  // 10. Resolve Education from educations JSON array or education string
  let educationSummary = profile.education || "";
  if (!educationSummary) {
    try {
      const educations =
        typeof profile.educations === "string"
          ? JSON.parse(profile.educations || "[]")
          : profile.educations;
      if (Array.isArray(educations) && educations.length > 0) {
        const highest = educations[0];
        const degree = highest.degree || highest.course || highest.qualification || "";
        const inst =
          highest.institution || highest.college || highest.university || highest.school || "";
        const year = highest.passingYear || highest.year || highest.endYear || "";
        educationSummary = [degree, inst, year].filter(Boolean).join(" ");
      }
    } catch (_) {}
  }

  // 11. Resolve Preferred Location
  const prefLocation =
    Array.isArray(profile.preferredLocations) && profile.preferredLocations.length > 0
      ? profile.preferredLocations.join(", ")
      : (profile.preferredLocations || profile.currentCity || "");

  // 12. Resolve Key Skills
  let keySkills = "";
  if (Array.isArray(profile.skills) && profile.skills.length > 0) {
    keySkills = profile.skills.join(" | ");
  } else if (typeof profile.skills === "string") {
    keySkills = profile.skills;
  } else if (profile.itSkills) {
    keySkills = profile.itSkills;
  }

  // 13. Bio / Summary
  const bio = profile.summary || profile.headline || "";

  // 14. Resume
  const resumeUrl = app.resumeUrl || profile.resume?.url || "";
  const resumeFileName =
    app.resumeFileName || profile.resume?.fileName || profile.resume?.originalName || "";

  // 15. View / Recency Status
  const isViewed = Boolean(app.isViewed);
  const isNew =
    !isViewed ||
    (Date.now() - new Date(app.createdAt).getTime()) < 14 * 24 * 60 * 60 * 1000;

  const appliedAtFormatted = app.createdAt
    ? new Date(app.createdAt).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "";

  return {
    applicationId: String(app._id),
    candidateId: String(candidate._id || profile.userId || ""),
    name: candidateName,
    candidateName,
    isRecommended: Boolean(isRecommended || app.isRecommended || profile.isRecommended),
    avatar: candidateAvatar,
    candidateAvatar,
    designation: profile.currentTitle || currentRole,
    experience,
    salary,
    noticePeriod,
    location,
    currentRole,
    previousRole,
    education: educationSummary,
    prefLocation,
    keySkills,
    bio,
    phone,
    email,
    candidateEmail: email,
    status: app.status || "APPLIED",
    callStatus: app.callStatus || "",
    isViewed,
    isNew,
    comments: Array.isArray(app.comments) ? app.comments : [],
    appliedAt: app.createdAt,
    appliedAtFormatted: appliedAtFormatted ? `${appliedAtFormatted} from NVite` : "",
    appliedOn: appliedAtFormatted ? `Applied on : ${appliedAtFormatted} from NVite` : "",
    resumeUrl,
    resumeFileName,
    appliedFrom: app.appliedFrom || "JOB_DETAILS",
    answers: Array.isArray(app.answers) ? app.answers : [],
    publicShareId: profile.publicShareId || "",
    linkedInUrl: profile.linkedInUrl || "",
    portfolioUrl: profile.portfolioUrl || "",
    gender: profile.gender || profile.diversity || "",
    diversity: profile.diversity || profile.gender || "",
    industry: profile.industry || profile.preferredIndustry || "",
    department: profile.department || profile.preferredDepartment || "",
    company: [profile.currentCompany, profile.previousCompany].filter(Boolean).join(", "),
    institutes: (() => {
      const insts = [];
      try {
        const parsedEdu = typeof profile.educations === "string" ? JSON.parse(profile.educations || "[]") : profile.educations;
        if (Array.isArray(parsedEdu)) {
          parsedEdu.forEach((e) => {
            const inst = e.institution || e.college || e.university;
            if (inst) insts.push(inst);
          });
        }
      } catch (_) {}
      return insts;
    })(),
  };
};

/**
 * Dynamically extract and aggregate filter facets from candidate cards and their profiles
 */
const buildResponseFilters = (candidateCards = [], candidateProfiles = []) => {
  const profileMap = new Map();
  candidateProfiles.forEach((p) => profileMap.set(String(p.userId), p));

  const countFrequencies = (extractor) => {
    const map = new Map();
    candidateCards.forEach((c) => {
      const vals = extractor(c, profileMap.get(String(c.candidateId)) || {});
      const list = Array.isArray(vals) ? vals : [vals];
      list
        .filter(Boolean)
        .map((v) => String(v).trim())
        .filter(Boolean)
        .forEach((str) => {
          map.set(str, (map.get(str) || 0) + 1);
        });
    });
    return Array.from(map.entries())
      .map(([label, count]) => ({ id: label, label, count }))
      .sort((a, b) => b.count - a.count);
  };

  // 1. Locations
  const locations = countFrequencies((c, p) => {
    const locs = [];
    const locStr = c.location || p.currentCity || "";
    const m = locStr.match(/^(.*?)\s*\(([^)]+)\)/);
    if (m && m[1]) {
      locs.push(m[1].trim());
    } else if (p.currentCity) {
      locs.push(p.currentCity.trim());
    } else if (c.location) {
      locs.push(...c.location.split(",").map((x) => x.trim()));
    }
    return locs;
  });

  // 2. Localities
  const localities = countFrequencies((c, p) => {
    const locs = [];
    const locStr = c.location || p.currentCity || "";
    const m = locStr.match(/^(.*?)\s*\(([^)]+)\)/);
    if (m) {
      const city = m[1].trim();
      const sub = m[2].trim();
      locs.push(`${sub}, ${city}`);
    }
    return locs;
  });

  // 3. Experience Histogram
  const expHistogram = [
    { range: "0-6", count: 0 },
    { range: "6-12", count: 0 },
    { range: "12-18", count: 0 },
    { range: "18-24", count: 0 },
    { range: "24-30", count: 0 },
    { range: "30+", count: 0 },
  ];
  candidateCards.forEach((c) => {
    const expStr = c.experience || "";
    const numMatch = expStr.match(/(\d+(\.\d+)?)/);
    if (numMatch) {
      const yrs = parseFloat(numMatch[1]);
      if (yrs <= 6) expHistogram[0].count++;
      else if (yrs <= 12) expHistogram[1].count++;
      else if (yrs <= 18) expHistogram[2].count++;
      else if (yrs <= 24) expHistogram[3].count++;
      else if (yrs <= 30) expHistogram[4].count++;
      else expHistogram[5].count++;
    }
  });

  // 4. Notice Period - Standardized Buckets
  const noticeBuckets = [
    { id: "any", label: "Any", count: candidateCards.length },
    { id: "Currently serving", label: "Currently serving", count: 0 },
    { id: "0-15 days", label: "0-15 days", count: 0 },
    { id: "1 month", label: "1 month", count: 0 },
    { id: "2 months", label: "2 months", count: 0 },
    { id: "3 months", label: "3 months", count: 0 },
    { id: "more than 3 months", label: "more than 3 months", count: 0 },
  ];
  candidateCards.forEach((c) => {
    const np = (c.noticePeriod || "").toLowerCase();
    if (np.includes("serving")) {
      noticeBuckets[1].count++;
    } else if (np.includes("0-15") || np.includes("15") || np.includes("immediate")) {
      noticeBuckets[2].count++;
    } else if (np.includes("1m") || np.includes("1 month") || np.includes("30")) {
      noticeBuckets[3].count++;
    } else if (np.includes("2m") || np.includes("2 month") || np.includes("60")) {
      noticeBuckets[4].count++;
    } else if (np.includes("3m") || np.includes("3 month") || np.includes("90")) {
      noticeBuckets[5].count++;
    } else if (np.includes(">") || np.includes("more") || np.includes("90+")) {
      noticeBuckets[6].count++;
    }
  });

  // 5. Salary
  const salaryNotMentionedCount = candidateCards.filter(
    (c) => !c.salary || c.salary.toLowerCase().includes("not") || c.salary.trim() === "₹"
  ).length;

  // 6. Education
  const educations = countFrequencies((c, p) => {
    const list = [];
    if (p.education) list.push(p.education);
    try {
      const parsedEdu =
        typeof p.educations === "string" ? JSON.parse(p.educations || "[]") : p.educations;
      if (Array.isArray(parsedEdu)) {
        parsedEdu.forEach((e) => {
          if (e.degree || e.course) list.push(e.degree || e.course);
        });
      }
    } catch (_) {}
    if (list.length === 0 && c.education) {
      const m = c.education.match(/^(B\.A\s*-\s*Bachelor of Arts|B\.Com|B\.Tech|B\.Sc|M\.Sc|MBA|BBA|MCA|BCA|Bachelor\s+[a-zA-Z]+)/i);
      if (m) {
        list.push(m[0]);
      } else {
        const first = c.education.split(" ")[0];
        if (first && first.length > 1) list.push(first);
      }
    }
    return list;
  });

  // 7. Diversity
  const diversities = countFrequencies((c, p) => {
    const d = p.gender || p.diversity || "";
    if (/female|women/i.test(d)) return ["Women"];
    if (/male|men/i.test(d)) return ["Men"];
    return ["Men"];
  });

  // 8. Industry
  const industries = countFrequencies((c, p) => {
    if (p.industry) return [p.industry];
    if (p.preferredIndustry) return [p.preferredIndustry];
    const roleText = `${c.currentRole || ""} ${c.previousRole || ""} ${c.keySkills || ""}`.toLowerCase();
    if (
      roleText.includes("customer service") ||
      roleText.includes("concentrix") ||
      roleText.includes("bpo") ||
      roleText.includes("voice") ||
      roleText.includes("support")
    ) {
      return ["BPM / BPO"];
    }
    return [];
  });

  // 9. Designation
  const designations = countFrequencies((c, p) => {
    const list = [];
    if (p.currentTitle) list.push(p.currentTitle);
    const m = (c.currentRole || "").match(/^(.*?)\s+at\s+/i);
    if (m && m[1]) list.push(m[1].trim());
    else if (c.designation) list.push(c.designation);
    return list;
  });

  // 10. Company
  const companies = countFrequencies((c, p) => {
    const list = [];
    if (p.currentCompany) list.push(p.currentCompany);
    const m = (c.currentRole || "").match(/\bat\s+(.+)$/i);
    if (m && m[1]) list.push(m[1].trim());
    return list;
  });

  // 11. Department
  const departments = countFrequencies((c, p) => {
    const list = [];
    if (p.department) list.push(p.department);
    if (p.preferredDepartment) list.push(p.preferredDepartment);
    const text = `${c.keySkills || ""} ${c.bio || ""} ${c.currentRole || ""}`.toLowerCase();
    if (text.includes("sales") || text.includes("business development")) {
      list.push("Sales & Business Development");
    }
    if (text.includes("aviation") || text.includes("aerospace")) {
      list.push("Aviation & Aerospace");
    }
    return list;
  });

  // 12. Institute
  const institutes = countFrequencies((c, p) => {
    const list = [];
    try {
      const parsedEdu =
        typeof p.educations === "string" ? JSON.parse(p.educations || "[]") : p.educations;
      if (Array.isArray(parsedEdu)) {
        parsedEdu.forEach((e) => {
          if (e.institution || e.college || e.university) {
            list.push(e.institution || e.college || e.university);
          }
        });
      }
    } catch (_) {}
    if (list.length === 0 && c.education) {
      if (c.education.includes("Ranchi University")) list.push("Ranchi University");
      if (c.education.includes("Mahatma Jyotiba Phule Rohilkhand University")) {
        list.push("Mahatma Jyotiba Phule Rohilkhand University (MJPRS)");
      }
    }
    return list;
  });

  // 13. Skills
  const skills = countFrequencies((c, p) => {
    if (Array.isArray(p.skills)) return p.skills;
    if (c.keySkills) return c.keySkills.split("|").map((s) => s.trim());
    return [];
  });

  return {
    location: locations,
    locality: localities,
    experienceHistogram: expHistogram,
    notice: noticeBuckets,
    salaryNotMentionedCount,
    education: educations,
    diversity: diversities,
    industry: industries,
    designation: designations,
    company: companies,
    department: departments,
    institute: institutes,
    skills,
    aiRecommendationsCount: candidateCards.filter((c) => c.isRecommended).length,
  };
};

/**
 * Format single job with aggregated applicant stats
 */
const formatJobItem = (job, statsMap, posterMap, nviteMap, currentUser) => {
  const jobIdStr = String(job._id);
  const stats = statsMap.get(jobIdStr) || { total: 0, new: 0, shortlisted: 0 };
  const now = new Date();

  let computedStatus = "active";
  if (!job.isActive || job.approvalStatus === "REJECTED") {
    computedStatus = "closed";
  } else if (job.deadline && new Date(job.deadline) < now) {
    computedStatus = "expired";
  }

  const posterId = job.createdByClient ? String(job.createdByClient) : null;
  const poster = posterId ? posterMap.get(posterId) : null;
  const isMe = posterId && String(currentUser._id) === posterId;
  const posterEmail = poster?.email || (isMe ? currentUser.email : "");
  const posterLabel = isMe
    ? "sent by me"
    : (posterEmail ? `sent by ${posterEmail.length > 18 ? posterEmail.slice(0, 15) + "..." : posterEmail}` : "Company Admin");

  const nviteInfo = nviteMap.get(jobIdStr) || {
    recipientsCount: 0,
    lastSentDate: null,
  };

  return {
    id: jobIdStr,
    _id: jobIdStr,
    title: job.title || "Untitled Job",
    location: job.location || "Multiple Locations",
    category: resolveJobCategory(job),
    department: job.department || "General",
    jobType: job.jobType || "Full-time",
    status: computedStatus,
    approvalStatus: job.approvalStatus || "APPROVED",
    isActive: Boolean(job.isActive),
    postedBy: posterEmail,
    postedByLabel: posterLabel,
    isMe,
    date: job.createdAt
      ? new Date(job.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
      : "—",
    createdAt: job.createdAt,
    updatedAt: job.updatedAt,
    totalResponses: stats.total,
    newResponses: stats.new,
    shortlisted: stats.shortlisted,
    recipientsCount: nviteInfo.recipientsCount,
    lastSentDate: nviteInfo.lastSentDate,
  };
};

/**
 * GET /api/v1/company-panel/jobs-responses
 * List jobs with dynamic filters, pagination, search, and response statistics
 */
exports.getEmployerJobs = asyncHandler(async (req, res) => {
  const { user, company } = await resolveClientUserAndCompany(req.user._id);

  const page = toPositiveInteger(req.query.page, 1, 1, 10000);
  const limit = toPositiveInteger(req.query.limit, 20, 1, 100);
  const search = toTrimmedString(req.query.search);
  const sortBy = toTrimmedString(req.query.sortBy) || "date-desc";

  // Parse comma-separated or array filters
  const parseFilterArray = (param) => {
    if (!param) return [];
    if (Array.isArray(param)) return param.map((x) => String(x).trim()).filter(Boolean);
    return String(param)
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean);
  };

  const statuses = parseFilterArray(req.query.status);
  const categories = parseFilterArray(req.query.category);
  const posters = parseFilterArray(req.query.postedBy);

  const now = new Date();
  const query = { companyId: company._id };

  // Search by Title, Location, or Job ID
  if (search) {
    const searchRegex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    const idQuery = mongoose.Types.ObjectId.isValid(search) ? [{ _id: new mongoose.Types.ObjectId(search) }] : [];
    query.$or = [
      { title: searchRegex },
      { location: searchRegex },
      { department: searchRegex },
      ...idQuery,
    ];
  }

  // Status Filter
  if (statuses.length > 0) {
    const statusConditions = [];
    if (statuses.includes("active")) {
      statusConditions.push({
        isActive: true,
        approvalStatus: "APPROVED",
        $or: [{ deadline: null }, { deadline: { $gte: now } }],
      });
    }
    if (statuses.includes("closed")) {
      statusConditions.push({
        $or: [{ isActive: false }, { approvalStatus: "REJECTED" }],
      });
    }
    if (statuses.includes("expired")) {
      statusConditions.push({
        isActive: true,
        deadline: { $lt: now },
      });
    }

    if (statusConditions.length > 0) {
      if (query.$or) {
        query.$and = [{ $or: query.$or }, { $or: statusConditions }];
        delete query.$or;
      } else {
        query.$or = statusConditions;
      }
    }
  }

  // Category Filter
  if (categories.length > 0) {
    const catRegexes = categories.map((c) => new RegExp(c, "i"));
    const catCondition = {
      $or: [
        { jobType: { $in: catRegexes } },
        { department: { $in: catRegexes } },
      ],
    };
    if (query.$and) {
      query.$and.push(catCondition);
    } else if (query.$or) {
      query.$and = [{ $or: query.$or }, catCondition];
      delete query.$or;
    } else {
      query.$and = [catCondition];
    }
  }

  // Posted By Filter
  if (posters.length > 0) {
    const posterUserConditions = [];
    const posterEmails = [];

    posters.forEach((p) => {
      if (p.toLowerCase() === "me") {
        posterUserConditions.push({ createdByClient: user._id });
      } else {
        posterEmails.push(p.toLowerCase());
      }
    });

    if (posterEmails.length > 0) {
      const matchedUsers = await User.find({
        email: { $in: posterEmails.map((e) => new RegExp(`^${e}$`, "i")) },
      }).select("_id");
      if (matchedUsers.length > 0) {
        posterUserConditions.push({
          createdByClient: { $in: matchedUsers.map((u) => u._id) },
        });
      }
    }

    if (posterUserConditions.length > 0) {
      const posterOr = { $or: posterUserConditions };
      if (query.$and) {
        query.$and.push(posterOr);
      } else if (query.$or) {
        query.$and = [{ $or: query.$or }, posterOr];
        delete query.$or;
      } else {
        query.$and = [posterOr];
      }
    }
  }

  // Sort definition
  let sortOption = { createdAt: -1 };
  if (sortBy === "title-asc") {
    sortOption = { title: 1 };
  } else if (sortBy === "date-asc") {
    sortOption = { createdAt: 1 };
  } else if (sortBy === "date-desc") {
    sortOption = { createdAt: -1 };
  }

  // Count total matching jobs
  const totalCount = await Job.countDocuments(query);
  const totalPages = Math.max(1, Math.ceil(totalCount / limit));
  const skip = (page - 1) * limit;

  // Query jobs
  const jobs = await Job.find(query)
    .sort(sortOption)
    .skip(skip)
    .limit(limit)
    .lean();

  const jobIds = jobs.map((j) => j._id);

  // Aggregate application responses for these jobs
  const [appStats, candidateUsers, nvites] = await Promise.all([
    jobIds.length > 0
      ? Application.aggregate([
          { $match: { jobId: { $in: jobIds } } },
          {
            $group: {
              _id: "$jobId",
              total: { $sum: 1 },
              new: {
                $sum: {
                  $cond: [{ $in: ["$status", ["APPLIED", "SCREENING"]] }, 1, 0],
                },
              },
              shortlisted: {
                $sum: {
                  $cond: [{ $eq: ["$status", "SHORTLISTED"] }, 1, 0],
                },
              },
            },
          },
        ])
      : [],
    User.find({
      _id: { $in: jobs.map((j) => j.createdByClient).filter(Boolean) },
    }).select("_id name email").lean(),
    Nvite.find({
      companyId: company._id,
    })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean(),
  ]);

  const statsMap = new Map();
  appStats.forEach((s) => {
    statsMap.set(String(s._id), {
      total: s.total || 0,
      new: s.new || 0,
      shortlisted: s.shortlisted || 0,
    });
  });

  const posterMap = new Map();
  candidateUsers.forEach((u) => {
    posterMap.set(String(u._id), u);
  });

  const nviteMap = new Map();

  // Format all items
  let items = jobs.map((job) =>
    formatJobItem(job, statsMap, posterMap, nviteMap, user)
  );

  // If sorting by responses-desc
  if (sortBy === "responses-desc") {
    items.sort((a, b) => b.totalResponses - a.totalResponses);
  }

  res.status(200).json({
    success: true,
    data: {
      items,
      pagination: {
        totalCount,
        totalPages,
        currentPage: page,
        pageSize: limit,
      },
    },
  });
});

/**
 * GET /api/v1/company-panel/jobs-responses/filters
 * Dynamic filter metadata and live counts for the current company
 */
exports.getEmployerJobFilters = asyncHandler(async (req, res) => {
  const { user, company } = await resolveClientUserAndCompany(req.user._id);
  const now = new Date();

  const [allJobs, teamUsers] = await Promise.all([
    Job.find({ companyId: company._id }).select("jobType department isActive deadline approvalStatus createdByClient").lean(),
    User.find({ companyId: company._id }).select("_id name email").lean(),
  ]);

  let activeCount = 0;
  let closedCount = 0;
  let expiredCount = 0;

  const categoryCountMap = {
    NVite: 0,
    Private: 0,
    "Hot Vacancy": 0,
    "SMB Job": 0,
    Internship: 0,
  };

  const posterCountMap = new Map();
  posterCountMap.set("me", 0);

  teamUsers.forEach((u) => {
    posterCountMap.set(u.email.toLowerCase(), 0);
  });

  allJobs.forEach((job) => {
    // Status
    if (!job.isActive || job.approvalStatus === "REJECTED") {
      closedCount += 1;
    } else if (job.deadline && new Date(job.deadline) < now) {
      expiredCount += 1;
    } else {
      activeCount += 1;
    }

    // Category
    const cat = resolveJobCategory(job);
    categoryCountMap[cat] = (categoryCountMap[cat] || 0) + 1;

    // Poster
    if (job.createdByClient) {
      const isMe = String(job.createdByClient) === String(user._id);
      if (isMe) {
        posterCountMap.set("me", (posterCountMap.get("me") || 0) + 1);
      }
      const posterUser = teamUsers.find((tu) => String(tu._id) === String(job.createdByClient));
      if (posterUser?.email) {
        const emailKey = posterUser.email.toLowerCase();
        posterCountMap.set(emailKey, (posterCountMap.get(emailKey) || 0) + 1);
      }
    }
  });

  const postersList = [
    {
      id: "me",
      label: "Me",
      email: user.email,
      count: posterCountMap.get("me") || 0,
    },
    ...teamUsers
      .filter((tu) => String(tu._id) !== String(user._id))
      .map((tu) => ({
        id: tu.email.toLowerCase(),
        label: tu.name || tu.email,
        email: tu.email,
        count: posterCountMap.get(tu.email.toLowerCase()) || 0,
      })),
  ];

  res.status(200).json({
    success: true,
    data: {
      totalJobs: allJobs.length,
      statuses: [
        { id: "active", label: "Active Jobs", count: activeCount },
        { id: "closed", label: "Closed Jobs", count: closedCount },
        { id: "expired", label: "Expired Jobs", count: expiredCount },
      ],
      categories: [
        { id: "NVite", label: "NVite", count: categoryCountMap["NVite"] || 0 },
        { id: "Private", label: "Private", count: categoryCountMap["Private"] || 0 },
        { id: "Hot Vacancy", label: "Hot Vacancy", count: categoryCountMap["Hot Vacancy"] || 0 },
        { id: "SMB Job", label: "SMB Job", count: categoryCountMap["SMB Job"] || 0 },
        { id: "Internship", label: "Internship", count: categoryCountMap["Internship"] || 0 },
      ],
      posters: postersList,
    },
  });
});

/**
 * GET /api/v1/company-panel/jobs-responses/:jobId/responses
 * Retrieve applicant candidate responses for a specific job
 */
exports.getJobResponses = asyncHandler(async (req, res) => {
  const { company } = await resolveClientUserAndCompany(req.user._id);
  const jobId = toTrimmedString(req.params.jobId);

  const job = await Job.findOne({ _id: jobId, companyId: company._id }).lean();
  if (!job) {
    throw createHttpError(404, "Job not found or does not belong to your company");
  }

  const page = toPositiveInteger(req.query.page, 1, 1, 1000);
  const limit = toPositiveInteger(req.query.limit, 20, 1, 100);
  const status = toTrimmedString(req.query.status);
  const search = toTrimmedString(req.query.search);

  const query = { jobId: job._id, companyId: company._id };
  if (status && status !== "ALL") {
    query.status = status.toUpperCase();
  }

  const totalResponses = await Application.countDocuments(query);
  const totalPages = Math.max(1, Math.ceil(totalResponses / limit));
  const skip = (page - 1) * limit;

  const applications = await Application.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate("candidateId", "name fullName email avatar phone profilePic")
    .lean();

  const candidateIds = applications
    .map((app) => app.candidateId?._id)
    .filter(Boolean);

  const candidateProfiles = candidateIds.length > 0
    ? await CandidateProfile.find({ userId: { $in: candidateIds } }).lean()
    : [];

  const profileMap = new Map();
  candidateProfiles.forEach((p) => {
    profileMap.set(String(p.userId), p);
  });

  const formattedResponses = applications.map((app, idx) => {
    const candidate = app.candidateId || {};
    const profile = profileMap.get(String(candidate._id)) || {};
    return formatCandidateCard(app, candidate, profile, idx === 0);
  });

  res.status(200).json({
    success: true,
    data: {
      job: {
        id: String(job._id),
        title: job.title,
        location: job.location,
        totalResponses,
      },
      responses: formattedResponses,
      filters: buildResponseFilters(formattedResponses, candidateProfiles),
      pagination: {
        totalCount: totalResponses,
        totalPages,
        currentPage: page,
        pageSize: limit,
      },
    },
  });
});

/**
 * PATCH /api/v1/company-panel/jobs-responses/:jobId/close
 * Close a single job
 */
exports.closeEmployerJob = asyncHandler(async (req, res) => {
  const { company } = await resolveClientUserAndCompany(req.user._id);
  const jobId = toTrimmedString(req.params.jobId);

  const job = await Job.findOne({ _id: jobId, companyId: company._id });
  if (!job) {
    throw createHttpError(404, "Job not found");
  }

  job.isActive = false;
  await job.save();

  // Log JOB_CLOSE to JobPostingReportLog
  jobReportService.fireAndForgetJobEvent({
    companyId: company._id,
    user: req.user,
    job,
    actionType: "JOB_CLOSE",
    status: "Closed",
  });

  try {
    const { scheduleDelete } = require("../services/elasticsearch.service");
    scheduleDelete(String(job._id));
  } catch (_) {}

  res.status(200).json({
    success: true,
    message: `Job "${job.title}" has been closed.`,
    data: { id: String(job._id), isActive: false },
  });
});

/**
 * POST /api/v1/company-panel/jobs-responses/bulk-close
 * Close multiple jobs
 */
exports.bulkCloseJobs = asyncHandler(async (req, res) => {
  const { company } = await resolveClientUserAndCompany(req.user._id);
  const jobIds = Array.isArray(req.body.jobIds) ? req.body.jobIds.filter(Boolean) : [];

  if (jobIds.length === 0) {
    throw createHttpError(400, "Please provide at least one job ID to close.");
  }

  const result = await Job.updateMany(
    { _id: { $in: jobIds }, companyId: company._id },
    { $set: { isActive: false } }
  );

  try {
    const { scheduleDelete } = require("../services/elasticsearch.service");
    jobIds.forEach((id) => scheduleDelete(String(id)));
  } catch (_) {}

  // Log JOB_CLOSE for each job in bulk to JobPostingReportLog
  (async () => {
    try {
      const jobs = await Job.find({ _id: { $in: jobIds }, companyId: company._id })
        .select("_id title department location")
        .lean();
      jobs.forEach((j) => {
        jobReportService.fireAndForgetJobEvent({
          companyId: company._id,
          user: req.user,
          job: j,
          actionType: "JOB_CLOSE",
          status: "Closed",
        });
      });
    } catch (_) {}
  })();

  res.status(200).json({
    success: true,
    message: `Successfully closed ${result.modifiedCount || 0} job(s).`,
    data: { closedCount: result.modifiedCount },
  });
});

/**
 * POST /api/v1/company-panel/jobs-responses/bulk-refresh
 * Touch / refresh multiple jobs
 */
exports.bulkRefreshJobs = asyncHandler(async (req, res) => {
  const { company } = await resolveClientUserAndCompany(req.user._id);
  const jobIds = Array.isArray(req.body.jobIds) ? req.body.jobIds.filter(Boolean) : [];

  if (jobIds.length === 0) {
    throw createHttpError(400, "Please provide at least one job ID to refresh.");
  }

  const result = await Job.updateMany(
    { _id: { $in: jobIds }, companyId: company._id },
    { $set: { updatedAt: new Date() } }
  );

  // Log JOB_REFRESH for each refreshed job to JobPostingReportLog
  (async () => {
    try {
      const jobs = await Job.find({ _id: { $in: jobIds }, companyId: company._id })
        .select("_id title department location isActive")
        .lean();
      jobs.forEach((j) => {
        jobReportService.fireAndForgetJobEvent({
          companyId: company._id,
          user: req.user,
          job: j,
          actionType: "JOB_REFRESH",
        });
      });
    } catch (_) {}
  })();

  res.status(200).json({
    success: true,
    message: `Successfully refreshed ${result.modifiedCount || 0} job(s).`,
    data: { refreshedCount: result.modifiedCount },
  });
});

/**
 * GET /api/v1/company-panel/jobs-responses/:jobId/detail
 * Full job details + insights + candidate responses for the dedicated tab page
 */
exports.getJobDetailWithResponses = asyncHandler(async (req, res) => {
  const { user, company } = await resolveClientUserAndCompany(req.user._id);
  const jobId = toTrimmedString(req.params.jobId);

  let job = null;
  if (mongoose.Types.ObjectId.isValid(jobId)) {
    job = await Job.findOne({ _id: jobId, companyId: company._id }).lean();
  } else if (!jobId) {
    job = await Job.findOne({ companyId: company._id }).sort({ createdAt: -1 }).lean();
  }

  if (!job) {
    throw createHttpError(404, "Job not found or does not belong to your company");
  }

  const applications = await Application.find({ jobId: job._id })
    .sort({ createdAt: -1 })
    .populate("candidateId", "name fullName email avatar phone profilePic")
    .lean();

  const candidateIds = applications.map((a) => a.candidateId?._id).filter(Boolean);
  const candidateProfiles = candidateIds.length > 0
    ? await CandidateProfile.find({ userId: { $in: candidateIds } }).lean()
    : [];

  const profileMap = new Map();
  candidateProfiles.forEach((p) => profileMap.set(String(p.userId), p));

  const candidateCards = applications.map((app, idx) => {
    const candidate = app.candidateId || {};
    const profile = profileMap.get(String(candidate._id)) || {};
    return formatCandidateCard(app, candidate, profile, idx === 0);
  });

  // Calculate insights dynamically from real database metrics
  const [openedAgg, totalRecipientsAgg] = await Promise.all([
    Nvite.aggregate([
      { $match: { companyId: new mongoose.Types.ObjectId(company._id) } },
      { $unwind: "$recipients" },
      { $match: { "recipients.status": "opened" } },
      { $count: "count" },
    ]),
    Nvite.aggregate([
      { $match: { companyId: new mongoose.Types.ObjectId(company._id) } },
      { $group: { _id: null, total: { $sum: { $ifNull: ["$totalCount", { $size: { $ifNull: ["$recipients", []] } }] } } } },
    ]),
  ]);

  const sentToCandidates = totalRecipientsAgg[0]?.total || 0;
  const openedCount = openedAgg[0]?.count || 0;
  const viewRate = sentToCandidates > 0 ? `${Math.round((openedCount / sentToCandidates) * 100)}%` : "0%";
  const responseRate = sentToCandidates > 0 ? `${Math.round((candidateCards.length / sentToCandidates) * 100)}%` : (candidateCards.length > 0 ? "100%" : "0%");

  const shortlistedCount = candidateCards.filter((c) => c.status === "SHORTLISTED").length;
  const maybeCount = candidateCards.filter((c) => c.status === "MAYBE" || c.status === "SCREENING").length;
  const rejectedCount = candidateCards.filter((c) => c.status === "REJECTED").length;
  const notViewedCount = candidateCards.filter((c) => !c.isViewed).length;
  const newResponsesCount = candidateCards.filter((c) => c.isNew || c.status === "APPLIED" || !c.isViewed).length;
  const actionPendingCount = candidateCards.filter((c) => !["SHORTLISTED", "MAYBE", "REJECTED"].includes(c.status)).length;

  res.status(200).json({
    success: true,
    data: {
      job: {
        id: String(job._id),
        title: job.title || "",
        location: job.location || "",
        isActive: Boolean(job.isActive),
        status: job.isActive ? "Active" : "Closed",
        createdAt: job.createdAt,
      },
      insights: {
        sentToCandidates,
        viewRate,
        responseRate,
      },
      inboxCounts: {
        applyInbox: candidateCards.length,
        others: 0,
      },
      tabsCount: {
        all: candidateCards.length,
        shortlisted: shortlistedCount,
        maybe: maybeCount,
        rejected: rejectedCount,
        newResponses: newResponsesCount,
        notViewed: notViewedCount,
        actionPending: actionPendingCount,
      },
      filters: buildResponseFilters(candidateCards, candidateProfiles),
      candidates: candidateCards,
    },
  });
});

/**
 * PATCH /api/v1/company-panel/jobs-responses/:jobId/applications/:applicationId/status
 */
exports.updateCandidateJobStatus = asyncHandler(async (req, res) => {
  const { company } = await resolveClientUserAndCompany(req.user._id);
  const { applicationId } = req.params;
  const { status, callStatus } = req.body;

  const updateFields = {};
  if (status) updateFields.status = String(status).toUpperCase();
  if (callStatus) updateFields.callStatus = String(callStatus);

  if (mongoose.Types.ObjectId.isValid(applicationId) && Object.keys(updateFields).length > 0) {
    await Application.findByIdAndUpdate(applicationId, updateFields);
  }

  res.status(200).json({
    success: true,
    message: callStatus ? `Applicant call status updated to ${callStatus}` : `Applicant status updated to ${status}`,
    data: { applicationId, status, callStatus },
  });
});

/**
 * POST /api/v1/company-panel/jobs-responses/:jobId/applications/:applicationId/comments
 */
exports.addCandidateComment = asyncHandler(async (req, res) => {
  const { user } = await resolveClientUserAndCompany(req.user._id);
  const { applicationId } = req.params;
  const { text } = req.body;

  if (!text || !text.trim()) {
    return res.status(400).json({ success: false, message: "Comment text cannot be empty" });
  }

  const commentData = {
    text: text.trim(),
    authorId: user?._id || null,
    authorName: user?.fullName || user?.name || "Recruiter",
    createdAt: new Date(),
  };

  let savedComment = commentData;

  if (mongoose.Types.ObjectId.isValid(applicationId)) {
    const app = await Application.findById(applicationId);
    if (app) {
      if (!Array.isArray(app.comments)) {
        app.comments = [];
      }
      app.comments.push(commentData);
      await app.save();
      savedComment = app.comments[app.comments.length - 1];
    }
  }

  res.status(201).json({
    success: true,
    message: "Comment added successfully",
    data: savedComment,
  });
});

/**
 * GET /api/v1/company-panel/candidates/:candidateId/full-profile
 * Fetches the complete profile of a candidate for employer viewing
 */
exports.getCandidateFullProfile = asyncHandler(async (req, res) => {
  // Verify caller is a valid employer
  await resolveClientUserAndCompany(req.user._id);

  const { candidateId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(candidateId)) {
    return res.status(400).json({ success: false, message: "Invalid candidate ID" });
  }

  // Fetch the candidate user record
  const candidate = await User.findById(candidateId).select("-password");
  if (!candidate) {
    return res.status(404).json({ success: false, message: "Candidate not found" });
  }

  // Fetch the candidate profile
  const profile = await CandidateProfile.findOne({ userId: candidateId });

  // Fetch all applications for this candidate (for job history context)
  const applications = await Application.find({ candidateId })
    .populate("jobId", "title location department companyId")
    .sort({ createdAt: -1 })
    .limit(20)
    .lean();

  // Parse JSON fields safely
  const parseJsonField = (val, fallback = []) => {
    if (Array.isArray(val)) return val;
    if (typeof val === "string") {
      try { return JSON.parse(val) || fallback; } catch (_) { return fallback; }
    }
    return fallback;
  };

  const workExperiences = parseJsonField(profile?.workExperiences);
  const educations = parseJsonField(profile?.educations);
  const certifications = parseJsonField(profile?.certifications);
  const languages = parseJsonField(profile?.languages);
  const projects = parseJsonField(profile?.projects);

  // Identify the active application for status & comment actions
  const { applicationId, jobId } = req.query;
  let activeApp = null;
  if (applicationId && mongoose.Types.ObjectId.isValid(applicationId)) {
    activeApp = applications.find((a) => String(a._id) === String(applicationId));
  }
  if (!activeApp && jobId && mongoose.Types.ObjectId.isValid(jobId)) {
    activeApp = applications.find((a) => String(a.jobId?._id || a.jobId) === String(jobId));
  }
  if (!activeApp && applications.length > 0) {
    activeApp = applications[0];
  }

  // Build full profile response
  const parsedItSkills = parseJsonField(profile?.itSkills);
  const skillsArray = Array.isArray(profile?.skills)
    ? profile.skills
    : (typeof profile?.skills === "string"
      ? profile.skills.split(/[,|]/).map((s) => s.trim()).filter(Boolean)
      : []);

  const fullProfile = {
    candidateId: String(candidate._id),
    applicationId: activeApp ? String(activeApp._id) : "",
    jobId: activeApp?.jobId?._id ? String(activeApp.jobId._id) : (activeApp?.jobId ? String(activeApp.jobId) : (jobId || "")),
    jobTitle: activeApp?.jobId?.title || "",
    status: activeApp?.status || "APPLIED",
    callStatus: activeApp?.callStatus || "",
    comments: activeApp?.comments || [],
    name: candidate.fullName || candidate.name || profile?.name || "Candidate",
    email: candidate.email || profile?.email || "",
    phone: profile?.phone || profile?.altPhone || candidate.phone || "",
    avatar: profile?.profilePic?.url || candidate.avatar || candidate.profilePic?.url || "",
    headline: profile?.headline || profile?.currentTitle || "",
    summary: profile?.summary || profile?.bio || "",

    // Location
    currentCity: profile?.currentCity || "",
    currentState: profile?.currentState || "",
    currentCountry: profile?.currentCountry || "",
    location: [profile?.currentCity, profile?.currentState].filter(Boolean).join(", ") || profile?.currentCountry || "",

    // Professional
    totalExperience: profile?.totalExperience || "",
    currentTitle: profile?.currentTitle || "",
    currentCompany: profile?.currentCompany || "",
    currentSalary: profile?.currentSalary || "",
    expectedSalary: profile?.expectedSalary || "",
    noticePeriod: profile?.noticePeriod || "",
    availableToJoin: profile?.noticePeriod || profile?.availableToJoin || "",
    preferredLocations: Array.isArray(profile?.preferredLocations)
      ? profile.preferredLocations
      : (profile?.preferredLocations ? [profile.preferredLocations] : []),
    industry: profile?.industry || profile?.preferredIndustry || "",
    department: profile?.department || profile?.preferredDepartment || "",
    functionalArea: profile?.functionalArea || "",
    role: profile?.currentTitle || profile?.preferredRoles?.[0] || candidate.department || "",
    highestDegree: educations?.[0]?.degree || profile?.education || "",

    // Skills
    skills: skillsArray,
    itSkills: profile?.itSkills || "",
    keySkills: skillsArray.length > 0
      ? skillsArray.join(", ")
      : (typeof profile?.itSkills === "string" ? profile.itSkills : ""),

    // Structured IT Skills table (only if real structured IT skills exist)
    itSkillsList: Array.isArray(parsedItSkills) && parsedItSkills.length > 0
      ? parsedItSkills.map((sk) => ({
          skillName: sk.skillName || sk.name || sk.skill || "",
          version: sk.version || "",
          lastUsed: sk.lastUsed || sk.year || "",
          experience: sk.experience || sk.duration || "",
        }))
      : [],

    // Social / Links
    linkedInUrl: profile?.linkedInUrl || "",
    portfolioUrl: profile?.portfolioUrl || "",
    githubUrl: profile?.githubUrl || "",
    publicShareId: profile?.publicShareId || "",

    // Personal / Other Details
    gender: profile?.gender || profile?.diversity || "",
    diversity: profile?.diversity || profile?.gender || "",
    dateOfBirth: profile?.dateOfBirth || "",
    maritalStatus: profile?.maritalStatus || "",
    hometown: profile?.hometown || profile?.currentCity || "",
    desiredJobType: profile?.desiredJobType || "",
    employmentStatus: profile?.employmentStatus || "",
    usWorkStatus: profile?.usWorkStatus || "",
    countries: profile?.countries || profile?.country || profile?.currentCountry || "",
    category: profile?.category || "",
    physicallyChallenged: profile?.physicallyChallenged || "",

    // Work Experience (full history)
    workExperiences: workExperiences.map((exp, i) => ({
      id: exp._id || exp.id || i,
      title: exp.title || exp.designation || exp.role || "",
      company: exp.company || exp.companyName || exp.organization || "",
      location: exp.location || "",
      startDate: exp.startDate || exp.from || "",
      endDate: exp.endDate || exp.to || "",
      isCurrent: Boolean(exp.isCurrent || exp.currentlyWorking),
      description: exp.description || exp.responsibilities || "",
      duration: exp.duration || "",
    })),

    // Education (full history)
    educations: educations.map((edu, i) => ({
      id: edu._id || edu.id || i,
      degree: edu.degree || edu.course || edu.qualification || "",
      institution: edu.institution || edu.college || edu.university || edu.school || "",
      fieldOfStudy: edu.fieldOfStudy || edu.specialization || edu.stream || "",
      passingYear: edu.passingYear || edu.year || edu.endYear || "",
      grade: edu.grade || edu.percentage || edu.cgpa || "",
      duration: edu.duration || "",
    })),

    // Certifications
    certifications: certifications.map((cert, i) => ({
      id: cert._id || cert.id || i,
      name: cert.name || cert.title || cert.course || "",
      issuer: cert.issuer || cert.issuingOrganization || cert.organization || "",
      year: cert.year || cert.date || "",
      credentialId: cert.credentialId || "",
    })),

    // Languages (only if real languages exist)
    languages: Array.isArray(languages)
      ? languages.map((lang) =>
          typeof lang === "string"
            ? { name: lang, proficiency: "", read: null, write: null, speak: null }
            : {
                name: lang.name || lang.language || "",
                proficiency: lang.proficiency || lang.level || "",
                read: typeof lang.read === "boolean" ? lang.read : null,
                write: typeof lang.write === "boolean" ? lang.write : null,
                speak: typeof lang.speak === "boolean" ? lang.speak : null,
              }
        )
      : [],

    // Projects
    projects: projects.map((proj, i) => ({
      id: proj._id || proj.id || i,
      title: proj.title || proj.name || "",
      description: proj.description || "",
      technologies: proj.technologies || proj.techStack || "",
      url: proj.url || proj.link || "",
      year: proj.year || "",
    })),

    // Resume
    resumeUrl: profile?.resume?.url || "",
    resumeFileName: profile?.resume?.fileName || profile?.resume?.originalName || "",

    // Application details
    appliedAt: activeApp?.createdAt || null,
    appliedAtFormatted: activeApp?.createdAt
      ? new Date(activeApp.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "2-digit" })
      : "",

    // Application history (jobs applied to)
    applicationHistory: applications.map((app) => ({
      applicationId: String(app._id),
      jobTitle: app.jobId?.title || "",
      jobLocation: app.jobId?.location || "",
      jobDepartment: app.jobId?.department || "",
      status: app.status || "APPLIED",
      appliedAt: app.createdAt,
      appliedAtFormatted: app.createdAt
        ? new Date(app.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
        : "",
    })),
  };

  res.status(200).json({
    success: true,
    data: fullProfile,
  });
});

