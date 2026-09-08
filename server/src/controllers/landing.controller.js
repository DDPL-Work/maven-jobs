const mongoose = require("mongoose");
const QRCode = require("../models/QRCode");
const Job = require("../models/Job");
const User = require("../models/User");
const Company = require("../models/Company");
const Application = require("../models/Application");
const CandidateProfile = require("../models/CandidateProfile");
const CompanyReview = require("../models/CompanyReview");

const formatCompactCount = (value = 0) => {
  const count = Number(value || 0);

  if (count >= 10000000) return `${Math.round(count / 10000000)}Cr+`;
  if (count >= 100000) return `${Math.round(count / 100000)}L+`;
  if (count >= 1000) return `${Math.round(count / 1000)}K+`;
  return String(count);
};

const deduplicateCI = (arr, max = 5) => {
  const seen = {};
  const result = [];
  for (const item of arr) {
    const key = String(item || "").toLowerCase().trim();
    if (key && !seen[key]) {
      seen[key] = true;
      result.push(item.trim());
      if (result.length >= max) break;
    }
  }
  return result;
};

const initialsFor = (name = "") =>
  String(name || "MJ")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "MJ";

const companyColors = ["#2563eb", "#059669", "#7c3aed", "#d97706", "#dc2626", "#0891b2"];

const fallbackCompanies = [
  { name: "Tata Consultancy Services", industry: "IT Services", tagline: "Enterprise technology and consulting teams hiring across India.", jobs: 124, color: "#2563eb" },
  { name: "Infosys", industry: "Technology", tagline: "Digital engineering, cloud, data, and product roles for ambitious professionals.", jobs: 96, color: "#0f766e" },
  { name: "HDFC Bank", industry: "Banking", tagline: "Customer, analytics, risk, and operations opportunities with a national brand.", jobs: 78, color: "#dc2626" },
  { name: "Zomato", industry: "Consumer Internet", tagline: "Fast-moving product, operations, growth, and supply roles.", jobs: 54, color: "#be123c" },
  { name: "Reliance Retail", industry: "Retail", tagline: "Store leadership, merchandising, logistics, and corporate hiring.", jobs: 88, color: "#d97706" },
  { name: "Cognizant", industry: "IT Services", tagline: "Consulting and engineering roles for global delivery teams.", jobs: 71, color: "#0891b2" },
  { name: "PhonePe", industry: "Fintech", tagline: "Payments, platform, security, and business roles in high-growth teams.", jobs: 42, color: "#7c3aed" },
  { name: "Larsen & Toubro", industry: "Engineering", tagline: "Infrastructure, project, design, and field engineering careers.", jobs: 63, color: "#1d4ed8" },
];

const fallbackCategories = [
  { label: "Software & IT", count: "2.4K jobs", description: "Frontend, backend, QA, cloud, DevOps, and support roles from verified employers." },
  { label: "Sales & Business Development", count: "1.1K jobs", description: "Inside sales, field sales, enterprise accounts, and channel roles." },
  { label: "Data & Analytics", count: "840 jobs", description: "Analyst, BI, data engineering, ML, and reporting opportunities." },
  { label: "Banking & Finance", count: "760 jobs", description: "Operations, risk, relationship, credit, and finance roles." },
  { label: "Marketing", count: "610 jobs", description: "Growth, performance marketing, brand, content, and social roles." },
  { label: "Operations", count: "920 jobs", description: "Supply chain, logistics, customer success, and process roles." },
];

const fallbackRoles = [
  { name: "Full Stack Developer", count: "620 jobs" },
  { name: "Business Development Executive", count: "510 jobs" },
  { name: "Data Analyst", count: "430 jobs" },
  { name: "Customer Success Manager", count: "390 jobs" },
  { name: "Digital Marketing Executive", count: "320 jobs" },
  { name: "HR Recruiter", count: "280 jobs" },
  { name: "Relationship Manager", count: "260 jobs" },
  { name: "Operations Executive", count: "245 jobs" },
];

const fallbackStats = [
  { num: "12K+", label: "Active Job Listings" },
  { num: "85K+", label: "Registered Job Seekers" },
  { num: "1.2K+", label: "Companies Hiring" },
  { num: "3.5K+", label: "Offers This Month" },
];

const normalizeSearch = (value = "") => String(value || "").trim().toLowerCase();

const extractMinimumExperience = (value = "") => {
  const match = String(value || "").match(/\d+/);
  return match ? Number(match[0]) : 0;
};

const normalizeWorkMode = (value) => {
  const v = String(value || "").toLowerCase().replace(/[\s_-]+/g, " ");
  if (v.includes("remote") || v.includes("wfh") || v.includes("work from home")) return "Remote";
  if (v.includes("hybrid")) return "Hybrid";
  if (v.includes("onsite") || v.includes("on site") || v.includes("office")) return "On Site";
  return String(value || "").trim().replace(/\b\w/g, (c) => c.toUpperCase());
};

const normalizeJobType = (value) => {
  const v = String(value || "").toLowerCase().replace(/[\s_-]+/g, " ");
  if (v.includes("full time") || v === "fulltime") return "Full Time";
  if (v.includes("part time") || v === "parttime") return "Part Time";
  if (v.includes("contract")) return "Contract";
  if (v.includes("intern")) return "Internship";
  if (v.includes("freelance")) return "Freelance";
  if (v.includes("temporary") || v.includes("temp")) return "Temporary";
  return String(value || "").trim().replace(/\b\w/g, (c) => c.toUpperCase());
};

const makeFlexibleRegex = (value) => {
  const escaped = String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = escaped.replace(/[\s_-]+/g, "[\\s_-]+");
  return new RegExp(`^${pattern}$`, "i");
};

const jobMatchesSearch = (job, search = "") => {
  const terms = normalizeSearch(search)
    .split(/[\s,]+/)
    .map((term) => term.trim())
    .filter(Boolean);

  if (!terms.length) return true;

  const skills = (Array.isArray(job.skills) ? job.skills : []).map((skill) => String(skill || "").toLowerCase());
  const stackAliases = [];
  const hasSkillAny = (aliases) => aliases.some((alias) =>
    skills.some((candidateSkill) => candidateSkill.includes(alias)),
  );

  if (
    hasSkillAny(["mongodb", "mongo"]) &&
    hasSkillAny(["express", "express.js"]) &&
    hasSkillAny(["react", "react.js"]) &&
    hasSkillAny(["node", "node.js"])
  ) {
    stackAliases.push("mern", "mern stack");
  }

  if (
    hasSkillAny(["mongodb", "mongo"]) &&
    hasSkillAny(["express", "express.js"]) &&
    hasSkillAny(["angular"]) &&
    hasSkillAny(["node", "node.js"])
  ) {
    stackAliases.push("mean", "mean stack");
  }

  const haystack = [
    job.title,
    job.department,
    job.location,
    job.experience,
    job.companyId?.name,
    job.companyId?.industry,
    ...(Array.isArray(job.skills) ? job.skills : []),
    ...stackAliases,
  ]
    .join(" ")
    .toLowerCase();

  return terms.every((term) => haystack.includes(term));
};

const jobMatchesLocation = (job, location = "") => {
  const normalizedLocation = normalizeSearch(location);
  if (!normalizedLocation) return true;

  const haystack = [job.location, job.workplaceType]
    .join(" ")
    .toLowerCase();

  const terms = normalizedLocation.split(/[\s,]+/).filter(Boolean);
  return terms.every((term) => haystack.includes(term));
};

const jobMatchesExperience = (job, experience = "") => {
  const candidateExperience = extractMinimumExperience(experience);
  if (!candidateExperience) return true;

  const jobMinimumExperience = extractMinimumExperience(job.experience);
  return jobMinimumExperience <= candidateExperience;
};

const jobMatchesFilter = (job, filter = "") => {
  const normalizedFilter = normalizeSearch(filter).replace(/-/g, " ");
  if (!normalizedFilter) return true;

  const aliases = {
    "it jobs": "it",
    "sales jobs": "sales",
    "marketing jobs": "marketing",
    "data science jobs": "data science",
    "hr jobs": "hr",
    "engineering jobs": "engineering",
    "fresher jobs": "fresher",
    "mnc jobs": "mnc",
    "remote jobs": "remote",
    "work from home": "remote",
    "walk in jobs": "walk in",
    "part time jobs": "part time",
  };
  const term = aliases[normalizedFilter] || normalizedFilter.replace(/\s+jobs?$/i, "");

  const haystack = [
    job.title,
    job.department,
    job.location,
    job.experience,
    job.jobType,
    job.workplaceType,
    job.companyId?.name,
    job.companyId?.industry,
    job.companyId?.packageType,
    ...(Array.isArray(job.skills) ? job.skills : []),
  ].join(" ").toLowerCase();

  return haystack.includes(term);
};

const formatPublicJob = (job, reviewMap = new Map()) => {
  const companyId = String(job.companyId?._id || job.companyId || "");
  const r = reviewMap.get(companyId) || {};
  return {
    id: String(job._id),
    companyId,
    companyName: job.companyId?.name || "Unknown company",
    companyLogoUrl: job.companyId?.logoUrl || "",
    companyCoverUrl: job.companyId?.coverImageUrl || "",
    company: job.companyId
      ? {
        id: String(job.companyId._id),
        name: job.companyId.name,
        industry: job.companyId.industry || "",
        type: job.companyId.packageType || "",
        location: job.companyId.location || {},
        logoUrl: job.companyId.logoUrl || "",
        coverImageUrl: job.companyId.coverImageUrl || "",
      }
      : null,
    title: job.title || "",
    department: job.department || "",
    jobType: normalizeJobType(job.jobType),
    workplaceType: normalizeWorkMode(job.workplaceType),
    location: job.location || "",
    experience: job.experience || "",
    salaryMin: Number(job.salaryMin || 0),
    salaryMax: Number(job.salaryMax || 0),
    summary: job.summary || "",
    description: job.description || "",
    externalLink: job.externalLink || "",
    skills: Array.isArray(job.skills) ? job.skills : [],
    deadline: job.deadline || null,
    isActive: Boolean(job.isActive),
    createdAt: job.createdAt,
    updatedAt: job.updatedAt,
    rating: r.avgRating ? Math.round(r.avgRating * 10) / 10 : null,
    reviews: r.reviewCount || 0,
    hasScreeningQuestions: Array.isArray(job.screeningQuestions) && job.screeningQuestions.length > 0,
    screeningQuestions: Array.isArray(job.screeningQuestions)
      ? job.screeningQuestions.map((sq) => ({
          _id: String(sq._id),
          question: sq.question,
          type: sq.type,
          required: sq.required,
          options: sq.options || [],
          maxLength: sq.maxLength,
          order: sq.order,
        }))
      : [],
  };
};

const parseArrayParam = (value, defaultSep = ",") => {
  const s = String(value || "");
  const sep = s.includes(";") ? ";" : defaultSep;
  return s.split(sep).map((v) => v.trim()).filter(Boolean);
};

const parseRange = (value) => {
  if (!value || typeof value !== "string") return null;
  const parts = value.split("-").map((v) => parseInt(v, 10)).filter((v) => !isNaN(v));
  if (parts.length === 0) return null;
  return { min: parts[0], max: parts.length > 1 ? parts[1] : null };
};

exports.getPublicJobs = async (req, res) => {
  try {
    const search = String(req.query.search || "").trim();
    const location = String(req.query.location || "").trim();
    const experience = String(req.query.experience || "").trim();
    const filter = String(req.query.filter || "").trim();

    const department = String(req.query.department || "").trim();
    const workMode = String(req.query.workMode || "").trim();
    const jobType = String(req.query.jobType || "").trim();
    const skills = String(req.query.skills || "").trim();
    const company = String(req.query.company || "").trim();
    const salary = String(req.query.salary || "").trim();
    const sort = String(req.query.sort || "").trim();

    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);

    // 1. Build base MongoDB query
    const baseQuery = { isActive: true, approvalStatus: "APPROVED" };

    // 2. Apply $in filters for array-compatible fields
    if (department) {
      const depts = parseArrayParam(department)
        .map(d => d.trim())
        .filter(d => { const ld = d.toLowerCase(); return ld && ld !== 'all' && ld !== 'all domains'; });
      if (depts.length > 0) {
        const conditions = depts.map(d => {
          if (d.toLowerCase() === 'general') {
            return {
              $or: [
                { department: { $exists: false } },
                { department: null },
                { department: "" },
                { department: /^general$/i }
              ]
            };
          }
          const escaped = d.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          return { department: { $regex: new RegExp(`^${escaped}$`, 'i') } };
        });
        if (conditions.length === 1) {
          Object.assign(baseQuery, conditions[0]);
        } else {
          baseQuery.$or = conditions;
        }
      }
    }
    if (workMode) {
      const modes = parseArrayParam(workMode);
      if (modes.length > 0) {
        baseQuery.workplaceType = { $in: modes.map((m) => makeFlexibleRegex(m)) };
      }
    }
    if (jobType) {
      const types = parseArrayParam(jobType);
      if (types.length > 0) {
        baseQuery.jobType = { $in: types.map((t) => makeFlexibleRegex(t)) };
      }
    }

    // Skills $in (case-insensitive via regex)
    if (skills) {
      const skillList = parseArrayParam(skills);
      if (skillList.length > 0) {
        baseQuery.skills = { $in: skillList.map((s) => new RegExp(s, "i")) };
      }
    }

    // Salary range query
    if (salary) {
      const sr = parseRange(salary);
      if (sr) {
        if (sr.min) baseQuery.salaryMax = { $gte: sr.min };
        if (sr.max) baseQuery.salaryMin = { $lte: sr.max };
      }
    }

    // 3. Determine sort
    let sortObj = { updatedAt: -1 };
    if (sort === "salary_high") sortObj = { salaryMax: -1, updatedAt: -1 };
    else if (sort === "salary_low") sortObj = { salaryMax: 1, updatedAt: -1 };
    else if (sort === "newest") sortObj = { createdAt: -1 };
    else if (sort === "company_az") sortObj = { "companyId.name": 1, updatedAt: -1 };

    // 4. Fetch jobs with MongoDB query
    //    For experience, location, company name, and text search we need
    //    populated data or regex — use a two-phase approach:
    //    Phase A: apply all Mongo-compatible filters + paginate
    //    Phase B: apply text/experience/location/company filters in-memory

    const phaseAJobs = await Job.find(baseQuery)
      .sort(sortObj)
      .limit(300)
      .populate("companyId", "name industry packageType location logoUrl coverImageUrl");

    // 5. In-memory filtering for text search, location, experience, company name
    let filteredJobs = phaseAJobs;

    if (search) {
      filteredJobs = filteredJobs.filter((job) => jobMatchesSearch(job, search));
    }
    if (filter) {
      filteredJobs = filteredJobs.filter((job) => jobMatchesFilter(job, filter));
    }
    if (location) {
      const locs = parseArrayParam(location, ";");
      if (locs.length > 0) {
        filteredJobs = filteredJobs.filter((job) =>
          locs.some((loc) => jobMatchesLocation(job, loc)),
        );
      }
    }
    if (experience) {
      const expRange = parseRange(experience);
      if (expRange) {
        const minE = expRange.min || 0;
        const maxE = expRange.max || 99;
        filteredJobs = filteredJobs.filter((job) => {
          const matches = String(job.experience || "").match(/\d+/);
          const jobExp = matches ? Number(matches[0]) : 0;
          return jobExp >= minE && jobExp <= maxE;
        });
      }
    }
    if (company) {
      const companies = parseArrayParam(company);
      if (companies.length > 0) {
        filteredJobs = filteredJobs.filter((job) => {
          const cName = String(job.companyId?.name || "").toLowerCase();
          return companies.some((c) => cName.includes(c.toLowerCase()));
        });
      }
    }

    // 6. Apply final sort (in-memory sort for company name since it's populated)
    if (sort === "company_az") {
      filteredJobs.sort((a, b) => {
        const na = String(a.companyId?.name || "").toLowerCase();
        const nb = String(b.companyId?.name || "").toLowerCase();
        return na.localeCompare(nb);
      });
    }

    // 7. Build application map for authenticated users (before pagination)
    let applicationMap = new Map();
    if (req.user && filteredJobs.length > 0) {
      const jobIds = filteredJobs.map((j) => j._id);
      const applications = await Application.find({
        candidateId: req.user._id,
        jobId: { $in: jobIds },
      });
      applicationMap = new Map(applications.map((a) => [String(a.jobId), a]));
    }

    // 7b. Filter out jobs the user has already applied to
    if (req.user) {
      filteredJobs = filteredJobs.filter((j) => !applicationMap.has(String(j._id)));
    }

    // 7c. Paginate
    const total = filteredJobs.length;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const paginatedJobs = filteredJobs.slice((page - 1) * limit, page * limit);

    // 7d. Aggregate real review data per company
    const companyIds = [...new Set(paginatedJobs.map((j) => String(j.companyId?._id || j.companyId || "")).filter(Boolean))];
    let reviewMap = new Map();
    if (companyIds.length > 0) {
      const aggs = await CompanyReview.aggregate([
        { $match: { companyId: { $in: companyIds.map((id) => new mongoose.Types.ObjectId(id)) }, status: "PUBLISHED" } },
        { $group: { _id: "$companyId", avgRating: { $avg: "$rating" }, reviewCount: { $sum: 1 } } },
      ]);
      reviewMap = new Map(aggs.map((a) => [String(a._id), a]));
    }

    // 8. Extract available filter options from the full pool
    const fullPool = await Job.find({ isActive: true, approvalStatus: "APPROVED" })
      .limit(300)
      .populate("companyId", "name industry")
      .lean();

    const dedupeFilters = (arr) => {
      const seen = new Set();
      return arr.filter((v) => {
        const key = String(v || "").toLowerCase().trim();
        if (!key || seen.has(key)) return false;
        seen.add(key);
        return true;
      }).sort();
    };

    const availableFilters = {
      departments: dedupeFilters(fullPool.map((j) => j.department)).filter(d => { const ld = d.toLowerCase(); return ld !== 'all' && ld !== 'all domains'; }),
      workplaceTypes: dedupeFilters(fullPool.map((j) => normalizeWorkMode(j.workplaceType))),
      locations: dedupeFilters(fullPool.map((j) => j.location)),
      jobTypes: dedupeFilters(fullPool.map((j) => normalizeJobType(j.jobType))),
    };

    return res.json({
      success: true,
      data: {
        jobs: paginatedJobs.map((j) => {
          const jd = formatPublicJob(j, reviewMap);
          if (req.user) {
            jd.hasApplied = applicationMap.has(String(j._id));
          }
          return jd;
        }),
        availableFilters,
        total,
        page,
        totalPages,
        appliedFilters: { search, location, experience, department, workMode, jobType, sort },
      },
    });
  } catch (error) {
    console.error("Public jobs error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch jobs",
    });
  }
};

exports.getPublicCompanyDetail = async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);

    if (!company || company.status !== "ACTIVE") {
      return res.status(404).json({
        success: false,
        message: "Company not found",
      });
    }

    const [jobs, followersCount, reviews] = await Promise.all([
      Job.find({
      companyId: company._id,
      isActive: true,
      approvalStatus: "APPROVED",
      }).sort({ createdAt: -1 }),
      CandidateProfile.countDocuments({ followedCompanyIds: company._id }),
      CompanyReview.find({ companyId: company._id, status: "PUBLISHED" })
        .populate("candidateId", "name")
        .sort({ createdAt: -1 }),
    ]);

    const totalRatings = reviews.reduce((sum, r) => sum + Number(r.rating || 0), 0);
    const avgRating = reviews.length > 0 ? Math.round((totalRatings / reviews.length) * 10) / 10 : 0;

    return res.json({
      success: true,
      data: {
        company: {
          id: String(company._id),
          name: company.name,
          fullName: company.tagline || company.name,
          industry: company.industry || "General",
          type: company.packageType || "Private",
          size: company.companySize || company.employeesCount || "",
          founded: company.foundedYear || "",
          website: company.website || "",
          linkedIn: company.linkedIn || "",
          location: company.location?.city || company.headquarters || "",
          locationFull: [company.location?.city, company.location?.region].filter(Boolean).join(", ") || "",
          activelyHiring: company.activelyHiring !== false,
          activeJobCount: jobs.length,
          followersCount,
          rating: avgRating,
          reviews: reviews.length,
          isFollowing: false,
          logo: initialsFor(company.name),
          logoUrl: company.logoUrl || "",
          coverImageUrl: company.coverImageUrl || "",
          about: company.about || "",
          mission: company.mission || "",
          vision: company.vision || "",
          whyJoinUs: Array.isArray(company.whyJoinUs) ? company.whyJoinUs : [],
          perks: Array.isArray(company.perks) ? company.perks : [],
        },
        jobs: jobs.map((job) => ({
          id: String(job._id),
          title: job.title,
          department: job.department || "General",
          experience: job.experience || "",
          location: job.location || company.location?.city || "",
          salaryMin: job.salaryMin || 0,
          salaryMax: job.salaryMax || 0,
          salary: job.salaryMin && job.salaryMax
            ? `${(job.salaryMin / 100000).toFixed(0)}-${(job.salaryMax / 100000).toFixed(0)} Lakhs PA`
            : "Not disclosed",
          skills: Array.isArray(job.skills) ? job.skills : [],
          jobType: job.jobType || "Full-time",
          workplaceType: job.workplaceType || "",
          summary: job.summary || "",
          description: job.description || "",
          externalLink: job.externalLink || "",
          postedAt: job.createdAt,
          deadline: job.deadline || null,
          hasApplied: false,
        })),
        reviews: reviews.map((r) => ({
          id: String(r._id),
          candidateName: r.candidateName || r.candidateId?.name || "Anonymous",
          candidateTitle: r.candidateTitle || "",
          rating: r.rating,
          headline: r.headline || "",
          review: r.review || "",
          createdAt: r.createdAt,
        })),
      },
    });
  } catch (error) {
    console.error("Public company detail error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch company profile",
    });
  }
};

exports.getEmployerLandingData = async (req, res) => {
  try {
    const [candidateCount, companyCount, activeJobs, hiredOrOffered, partners] = await Promise.all([
      User.countDocuments({ role: "CANDIDATE", isActive: true }),
      Company.countDocuments({ status: "ACTIVE" }),
      Job.countDocuments({ isActive: true, approvalStatus: "APPROVED" }),
      Application.countDocuments({ status: { $in: ["OFFERED", "HIRED"] } }),
      Company.find({ status: "ACTIVE" })
        .sort({ activeJobCount: -1, updatedAt: -1 })
        .limit(8)
        .select("name logoUrl industry"),
    ]);

    const successRate = activeJobs > 0
      ? Math.min(99, Math.round((hiredOrOffered / activeJobs) * 100))
      : 0;

    return res.json({
      success: true,
      data: {
        stats: [
          { value: formatCompactCount(candidateCount), label: "Registered jobseekers" },
          { value: formatCompactCount(companyCount), label: "Companies trust us" },
          { value: `${successRate}%`, label: "Offer conversion signal" },
          { value: formatCompactCount(activeJobs), label: "Active openings" },
        ],
        partners: partners.map((company) => ({
          id: String(company._id),
          name: company.name,
          logoUrl: company.logoUrl || "",
          industry: company.industry || "",
        })),
      },
    });
  } catch (error) {
    console.error("Employer landing error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch employer landing data",
    });
  }
};

const fetchHomeLandingData = async () => {
  const [activeJobs, candidates, activeCompanies, monthlyOffers, companies, categoryRows, roleRows] =
    await Promise.all([
      Job.countDocuments({ isActive: true, approvalStatus: "APPROVED" }),
      User.countDocuments({ role: "CANDIDATE", isActive: true }),
      Company.countDocuments({ status: "ACTIVE", activelyHiring: true }),
      Application.countDocuments({
        status: { $in: ["OFFERED", "HIRED"] },
        updatedAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      }),
      Company.find({ status: "ACTIVE", activelyHiring: true })
        .sort({ activeJobCount: -1, openRoles: -1, updatedAt: -1 })
        .limit(100)
        .select("name tagline industry activeJobCount openRoles logoUrl"),
      Job.aggregate([
        { $match: { isActive: true, approvalStatus: "APPROVED" } },
        {
          $group: {
            _id: {
              $toLower: { $trim: { input: { $ifNull: ["$department", "__general__"] } } }
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
        { $limit: 50 },
      ]),
      Job.aggregate([
        { $match: { isActive: true, approvalStatus: "APPROVED" } },
        {
          $group: {
            _id: "$title",
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
        { $limit: 12 },
      ]),
    ]);

  const industryRows = await Job.aggregate([
    { $match: { isActive: true, approvalStatus: "APPROVED" } },
    {
      $lookup: {
        from: "companies",
        localField: "companyId",
        foreignField: "_id",
        as: "company",
      },
    },
    { $unwind: "$company" },
    {
      $group: {
        _id: { $ifNull: ["$company.industry", "General"] },
        jobs: { $sum: 1 },
      },
    },
    { $sort: { jobs: -1 } },
    { $limit: 6 },
  ]);

  return {
    stats: activeJobs || candidates || activeCompanies || monthlyOffers ? [
      { num: formatCompactCount(activeJobs), label: "Active Job Listings" },
      { num: formatCompactCount(candidates), label: "Registered Job Seekers" },
      { num: formatCompactCount(activeCompanies), label: "Companies Hiring" },
      { num: formatCompactCount(monthlyOffers), label: "Offers This Month" },
    ] : fallbackStats,
    topCategories: industryRows.length
      ? ["All", ...industryRows.map((item) => item._id).filter(Boolean)]
      : ["All", "IT Services", "Technology", "Banking", "Consumer Internet", "Retail", "Engineering", "Fintech"],
    companies: companies.length ? companies.map((company, index) => ({
      id: String(company._id),
      name: company.name,
      logo: initialsFor(company.name),
      logoUrl: company.logoUrl || "",
      color: companyColors[index % companyColors.length],
      rating: 4 + ((index % 6) / 10),
      reviews: formatCompactCount(Math.max(25, Number(company.activeJobCount || company.openRoles || 0) * 31)),
      desc: company.tagline || `${company.industry || "Growing"} company hiring on MavenJobs.`,
      jobs: Number(company.activeJobCount || company.openRoles || 0),
      category: company.industry || "General",
    })) : fallbackCompanies.map((company, index) => ({
      id: "",
      name: company.name,
      logo: initialsFor(company.name),
      logoUrl: "",
      color: company.color || companyColors[index % companyColors.length],
      rating: 4 + ((index % 6) / 10),
      reviews: formatCompactCount(Math.max(80, company.jobs * 18)),
      desc: company.tagline,
      jobs: company.jobs,
      category: company.industry,
    })),
    categories: categoryRows.length ? [
      {
        label: "All Jobs",
        count: `${formatCompactCount(activeJobs)} jobs`,
        description: "Browse every active opening across all departments on Maven Jobs.",
      },
      ...categoryRows
        .filter((item) => item._id !== "__general__")
        .map((item) => {
          let label = item._id;
          label = label.replace(/\b\w/g, (c) => c.toUpperCase());
          return { label, count: `${formatCompactCount(item.count)} jobs`, description: `Explore active ${label} openings from verified employers.` };
        })
        .filter((cat) => !["Fff", "Asda"].includes(cat.label)),
    ] : fallbackCategories,
    popularSearches: roleRows.length ? roleRows.map((item) => item._id).filter(Boolean) : fallbackRoles.map((role) => role.name),
    jobRoles: roleRows.length ? roleRows.map((item) => ({
      name: item._id || "Open Role",
      count: `${formatCompactCount(item.count)} jobs`,
    })) : fallbackRoles,
    trustedBrands: companies.length ? companies.slice(0, 5).map((company) => company.name) : fallbackCompanies.slice(0, 5).map((company) => company.name),
  };
};

exports.getHomeLandingData = async (req, res) => {
  try {
    const data = await fetchHomeLandingData();
    return res.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("Home landing error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch landing data",
    });
  }
};

exports.fetchHomeLandingData = fetchHomeLandingData;

exports.getLandingPageData = async (req, res) => {
  try {
    const { token } = req.params;

    const qr = await QRCode.findOne({
      token,
      isActive: true,
    }).populate("companyId");

    if (!qr) {
      return res.status(404).json({
        success: false,
        message: "Invalid or expired QR",
      });
    }

    // 🚨 IMPORTANT FIX
    if (!qr.companyId) {
      return res.status(404).json({
        success: false,
        message: "Company not found for this QR",
      });
    }

    const company = qr.companyId;

    const jobs = await Job.find({
      companyId: company._id,
      isActive: true,
    });

    qr.scans += 1;
    await qr.save();

    return res.json({
      success: true,
      data: {
        candidateWebUrl: process.env.CANDIDATE_WEB_URL || process.env.FRONTEND_URL || "",
        company: {
          ...company.toObject(),
          jobs,
        },
        scans: qr.scans,
      },
    });
  } catch (error) {
    console.error("Landing error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch landing data",
    });
  }
};

exports.getSearchSuggestions = async (req, res) => {
  try {
    const q = String(req.query.q || "").trim().toLowerCase();
    if (!q) {
      return res.json({ success: true, data: { suggestions: [] } });
    }

    const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp("^" + escaped, "i");

    const [titles, skills, companyNames] = await Promise.all([
      Job.distinct("title", { isActive: true, approvalStatus: "APPROVED", title: regex }).then(r => r.filter(Boolean).slice(0, 5)),
      Job.distinct("skills", { isActive: true, approvalStatus: "APPROVED", skills: regex }).then(r => r.filter(Boolean).slice(0, 5)),
      Company.distinct("name", { status: "ACTIVE", name: regex }).then(r => r.filter(Boolean).slice(0, 5)),
    ]);

    const merged = deduplicateCI([...titles, ...skills, ...companyNames], 5);

    return res.json({ success: true, data: { suggestions: merged } });
  } catch (error) {
    console.error("Search suggestions error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch suggestions" });
  }
};

exports.getLocationSuggestions = async (req, res) => {
  try {
    const q = String(req.query.q || "").trim().toLowerCase();
    if (!q) {
      return res.json({ success: true, data: { suggestions: [] } });
    }

    const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp("^" + escaped, "i");

    const [jobLocations, companyCities] = await Promise.all([
      Job.distinct("location", { isActive: true, approvalStatus: "APPROVED", location: regex }),
      Company.distinct("location.city", { status: "ACTIVE", "location.city": regex }),
    ]);

    const merged = deduplicateCI([...jobLocations, ...companyCities], 5);

    return res.json({ success: true, data: { suggestions: merged } });
  } catch (error) {
    console.error("Location suggestions error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch location suggestions" });
  }
};
