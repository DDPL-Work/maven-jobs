const mongoose = require("mongoose");
const asyncHandler = require("../middleware/async.middleware");
const CandidateProfile = require("../models/CandidateProfile");
const User = require("../models/User");
const ResdexSearch = require("../models/ResdexSearch");
const Application = require("../models/Application");
const OpenAIService = require("../services/openai/OpenAIService");
const activityService = require("../services/recruiter-activity.service");
const { esAvailable } = require("../config/elasticsearch");
const esService = require("../services/elasticsearch.service");

const SEARCH_DEFAULTS = { page: 1, limit: 20, sort: "relevance" };
const MAX_LIMIT = 100;

function toInt(val, fallback = 0) {
  const n = Number.parseInt(val, 10);
  return Number.isNaN(n) ? fallback : n;
}

function toNum(val, fallback = 0) {
  const n = Number(val);
  return Number.isNaN(n) ? fallback : n;
}

function escapeRegex(str) {
  return String(str || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function parseCommaList(val) {
  if (Array.isArray(val)) return val.filter(Boolean).map(v => String(v).trim());
  if (!val || typeof val !== "string") return [];
  return val.split(",").map(v => v.trim()).filter(Boolean);
}

function normalizeNoticePeriod(val) {
  if (Array.isArray(val)) return val.map(v => String(v).trim().toLowerCase()).filter(Boolean);
  if (!val || typeof val !== "string") return [];
  return val.split(",").map(v => v.trim().toLowerCase()).filter(Boolean);
}

function buildNoticePeriodQuery(noticePeriods) {
  if (!noticePeriods || noticePeriods.length === 0) return null;
  const conditions = [];
  for (const np of noticePeriods) {
    if (np === "immediately" || np === "available immediately") {
      conditions.push({ noticePeriod: { $regex: /immediately|immediate|0\s*day/i } });
    } else if (np === "serving" || np === "serving notice") {
      conditions.push({ noticePeriod: { $regex: /serving/i } });
    } else {
      const days = parseInt(np, 10);
      if (!Number.isNaN(days) && days > 0) {
        const next = parseInt(noticePeriods.find(n => parseInt(n, 10) > days) || "999", 10);
        conditions.push({
          noticePeriod: {
            $regex: new RegExp(`${days}\\s*(days?|d)`, "i"),
          },
        });
      }
    }
  }
  return conditions.length > 0 ? { $or: conditions } : null;
}

async function esSearchCandidates(req, res) {
  const company = req.company;
  const {
    keyword, skills, booleanQuery, currentCompany, previousCompany,
    designation, excludeKeywords, preferredSkills,
    minExperience, maxExperience,
    currentCity, preferredCity, remote, hybrid, relocation,
    currency, currentSalaryMin, currentSalaryMax,
    expectedSalaryMin, expectedSalaryMax,
    noticePeriod,
    department, role, industry, employmentType, employmentStatus,
    ug, pg, doctorate, institute, university, graduationYear, minPercentage,
    certifications,
    diversityGender, careerBreak, veterans, disabilities,
    returnship, womenHiring, campusHiring, freshers,
    minAge, maxAge, languages, workPermit, passport, visa,
    openToRemote, portfolio, github, linkedIn,
    page, limit, sort, saveSearch, searchName,
  } = req.query;

  const currentPage = Math.max(1, toInt(page, SEARCH_DEFAULTS.page));
  const currentLimit = Math.min(MAX_LIMIT, Math.max(1, toInt(limit, SEARCH_DEFAULTS.limit)));

  const searchStartTime = Date.now();
  console.log(`[ES:CandidateSearch] 🔍 Hit "/resdex/search" — keyword="${keyword || ''}" skills="${skills || ''}" location="${currentCity || ''}" expMin=${minExperience || 0} expMax=${maxExperience || 0} page=${currentPage} limit=${currentLimit}`);

  const esResult = await esService.searchCandidatesEs({
    keyword, skills, booleanQuery, currentCompany, previousCompany,
    designation, excludeKeywords, preferredSkills,
    minExperience, maxExperience,
    currentCity, preferredCity, remote, hybrid, relocation,
    currency, currentSalaryMin, currentSalaryMax,
    expectedSalaryMin, expectedSalaryMax,
    noticePeriod,
    department, role, industry, employmentType, employmentStatus,
    ug, pg, doctorate, institute, university, graduationYear, minPercentage,
    certifications,
    diversityGender, careerBreak, veterans, disabilities,
    returnship, womenHiring, campusHiring, freshers,
    minAge, maxAge, languages, workPermit, passport, visa,
    openToRemote, portfolio, github, linkedIn,
    page: currentPage, limit: currentLimit, sort,
  });

  const { candidates: esHits, total, totalPages } = esResult;

  // 1. Applications lookup for logged-in company
  const candidateIds = esHits.map((c) => c.id || c.candidateId);
  const userIds = esHits.map((c) => c.userId).filter(Boolean);
  const allCandidateKeys = [...new Set([...candidateIds, ...userIds])];

  let applicationMap = new Map();
  if (company?._id && allCandidateKeys.length > 0) {
    try {
      const apps = await Application.find({
        companyId: company._id,
        $or: [
          { candidateId: { $in: allCandidateKeys } },
          { candidateUserId: { $in: allCandidateKeys } },
        ],
      }, { candidateId: 1, candidateUserId: 1, status: 1, createdAt: 1 }).lean();

      apps.forEach((a) => {
        if (a.candidateId) applicationMap.set(String(a.candidateId), a);
        if (a.candidateUserId) applicationMap.set(String(a.candidateUserId), a);
      });
    } catch (_) {}
  }

  // 2. Enrich from MongoDB CandidateProfile (for fresh profile images, resumes, phone)
  let profileMap = new Map();
  try {
    const validOids = candidateIds.filter((id) => mongoose.isValidObjectId(id));
    const validUserOids = userIds.filter((id) => mongoose.isValidObjectId(id));
    if (validOids.length > 0 || validUserOids.length > 0) {
      const mongoProfiles = await CandidateProfile.find({
        $or: [
          ...(validOids.length > 0 ? [{ _id: { $in: validOids } }] : []),
          ...(validUserOids.length > 0 ? [{ userId: { $in: validUserOids } }] : []),
        ],
      }).populate("userId", "name email avatar phone").lean();

      mongoProfiles.forEach((p) => {
        profileMap.set(String(p._id), p);
        if (p.userId?._id) profileMap.set(String(p.userId._id), p);
      });
    }
  } catch (_) {}

  // 3. Assemble clean candidate response matching existing shape
  const formattedCandidates = esHits.map((c) => {
    const p = profileMap.get(String(c.id)) || profileMap.get(String(c.userId));
    const app = applicationMap.get(String(c.id)) || applicationMap.get(String(c.userId));

    const name = p?.userId?.name || p?.name || c.name || c.fullName || "Candidate";
    const title = p?.currentTitle || p?.headline || c.currentTitle || c.designation || "";
    const comp = p?.currentCompany || c.currentCompany || c.recentCompany || "";
    const city = p?.currentCity || c.currentCity || c.location || "";
    const exp = p?.totalExperience || c.totalExperience || (c.experience != null ? `${c.experience} years` : "0");
    const skillsList = (p?.skills?.length ? p.skills : c.skills) || [];

    return {
      id: c.id,
      _id: c.id,
      userId: c.userId || c.id,
      name,
      fullName: name,
      email: p?.userId?.email || c.email || "",
      avatar: p?.userId?.avatar || c.avatar || c.profilePic || "",
      phone: p?.phone || p?.userId?.phone || c.phone || "",
      headline: p?.headline || c.headline || "",
      summary: p?.summary || c.summary || "",
      currentTitle: title,
      designation: title,
      currentCompany: comp,
      recentCompany: comp,
      totalExperience: exp,
      experience: c.experience,
      currentCity: city,
      location: city,
      currentState: p?.currentState || c.currentState || "",
      preferredLocations: p?.preferredLocations || c.preferredLocations || [],
      preferredRoles: p?.preferredRoles || c.preferredRoles || "",
      skills: skillsList,
      noticePeriod: p?.noticePeriod || c.noticePeriod || "",
      expectedSalary: p?.expectedSalary || c.expectedSalary || c.ctcExpected || 0,
      ctcExpected: p?.expectedSalary || c.expectedSalary || c.ctcExpected || 0,
      education: p?.education || c.education || "",
      linkedInUrl: p?.linkedInUrl || c.linkedInUrl || "",
      portfolioUrl: p?.portfolioUrl || c.portfolioUrl || "",
      profilePic: p?.profilePic || c.profilePic || c.avatar || "",
      resume: p?.resume || c.resume || "",
      publicShareId: p?.publicShareId || c.publicShareId || "",
      profileViews: p?.profileViews || c.profileViews || 0,
      recruiterActions: p?.recruiterActions || c.recruiterActions || 0,
      hasApplied: Boolean(app),
      applicationStatus: app ? app.status : null,
      appliedAt: app ? app.createdAt : null,
      createdAt: p?.createdAt || c.createdAt || null,
      updatedAt: p?.updatedAt || c.updatedAt || null,
      _score: c._score,
    };
  });

  // Always log search in recent history (upsert by keyword)
  if (company?._id) {
    try {
      const kw = String(keyword || "").trim();
      const autoName = searchName ? String(searchName).trim() : (kw || "Search with filters");
      await ResdexSearch.findOneAndUpdate(
        { companyId: company._id, "filters.keyword": kw || "__all__" },
        {
          companyId: company._id,
          name: autoName,
          filters: req.query,
          resultCount: total,
          lastRunAt: new Date(),
          $setOnInsert: { isPinned: false },
        },
        { upsert: true, new: true },
      );
    } catch (_) {}
  }

  const duration = Date.now() - searchStartTime;
  console.log(`[ES:CandidateSearch] ⚡ Served via Elasticsearch in ${duration}ms (ES took: ${esResult.took}ms) | Total matches: ${total} | Page ${currentPage}/${totalPages} (${formattedCandidates.length} candidates returned)`);

  return res.status(200).json({
    success: true,
    data: {
      candidates: formattedCandidates,
      pagination: {
        page: currentPage,
        limit: currentLimit,
        total,
        totalPages,
      },
      _source: "elasticsearch",
    },
  });
}

exports.searchCandidates = asyncHandler(async (req, res) => {
  // ── Elasticsearch path ──────────────────────────────────────────
  if (await esAvailable()) {
    try {
      return await esSearchCandidates(req, res);
    } catch (esErr) {
      console.error("[ES:CandidateSearch] ⚠️ ES path failed, falling back to MongoDB:", esErr.message);
      // Fall through to MongoDB path below
    }
  }

  console.log("[ES:CandidateSearch] 📦 Served via MongoDB fallback");

  const company = req.company;
  const {
    keyword, skills, booleanQuery, currentCompany, previousCompany,
    designation, excludeKeywords, preferredSkills,
    minExperience, maxExperience,
    currentCity, preferredCity, remote, hybrid, relocation,
    currency, currentSalaryMin, currentSalaryMax,
    expectedSalaryMin, expectedSalaryMax,
    noticePeriod,
    department, role, industry, employmentType, employmentStatus,
    ug, pg, doctorate, institute, university, graduationYear, minPercentage,
    certifications,
    diversityGender, careerBreak, veterans, disabilities,
    returnship, womenHiring, campusHiring, freshers,
    minAge, maxAge, languages, workPermit, passport, visa,
    openToRemote, portfolio, github, linkedIn,
    page, limit, sort, saveSearch, searchName,
  } = req.query;

  const currentPage = Math.max(1, toInt(page, SEARCH_DEFAULTS.page));
  const currentLimit = Math.min(MAX_LIMIT, Math.max(1, toInt(limit, SEARCH_DEFAULTS.limit)));
  const skip = (currentPage - 1) * currentLimit;

  const pipeline = [];
  const matchStage = {};

  const andConditions = [];

  // Keyword search (across multiple fields)
  const kw = String(keyword || "").trim();
  if (kw) {
    const kwEscaped = escapeRegex(kw);
    andConditions.push({
      $or: [
        { headline: { $regex: kwEscaped, $options: "i" } },
        { currentTitle: { $regex: kwEscaped, $options: "i" } },
        { currentCompany: { $regex: kwEscaped, $options: "i" } },
        { summary: { $regex: kwEscaped, $options: "i" } },
        { skills: { $regex: kwEscaped, $options: "i" } },
        { preferredRoles: { $regex: kwEscaped, $options: "i" } },
      ],
    });
  }

  // Skills filter
  const skillList = parseCommaList(skills || preferredSkills);
  if (skillList.length > 0) {
    const escapedSkills = skillList.map(s => new RegExp(escapeRegex(s), "i"));
    andConditions.push({ skills: { $in: escapedSkills } });
  }

  // Boolean query (simple AND/OR parser for MongoDB)
  const bq = String(booleanQuery || "").trim();
  if (bq) {
    const terms = bq.split(/\s+(AND|OR|NOT)\s+/i);
    const boolConditions = [];
    let i = 0;
    while (i < terms.length) {
      const term = terms[i].trim().replace(/^["']|["']$/g, "");
      if (!term) { i++; continue; }
      const escaped = escapeRegex(term);
      if (i > 0 && terms[i - 1]?.toUpperCase() === "NOT") {
        boolConditions.push({ skills: { $not: { $regex: escaped, $options: "i" } } });
      } else {
        boolConditions.push({
          $or: [
            { skills: { $regex: escaped, $options: "i" } },
            { headline: { $regex: escaped, $options: "i" } },
            { currentTitle: { $regex: escaped, $options: "i" } },
            { summary: { $regex: escaped, $options: "i" } },
          ],
        });
      }
      i++;
    }
    if (boolConditions.length > 0) {
      andConditions.push({ $and: boolConditions });
    }
  }

  // Current Company
  const cc = String(currentCompany || "").trim();
  if (cc) {
    andConditions.push({ currentCompany: { $regex: escapeRegex(cc), $options: "i" } });
  }

  // Previous Company (search in workExperiences JSON string)
  const pc = String(previousCompany || "").trim();
  if (pc) {
    andConditions.push({ workExperiences: { $regex: escapeRegex(pc), $options: "i" } });
  }

  // Designation
  const desig = String(designation || "").trim();
  if (desig) {
    andConditions.push({ currentTitle: { $regex: escapeRegex(desig), $options: "i" } });
  }

  // Exclude keywords
  const excl = String(excludeKeywords || "").trim();
  if (excl) {
    const exclTerms = excl.split(",").map(s => s.trim()).filter(Boolean);
    for (const term of exclTerms) {
      andConditions.push({
        $nor: [
          { skills: { $regex: escapeRegex(term), $options: "i" } },
          { currentTitle: { $regex: escapeRegex(term), $options: "i" } },
          { headline: { $regex: escapeRegex(term), $options: "i" } },
        ],
      });
    }
  }

  // Experience range
  const expMin = toNum(minExperience);
  const expMax = toNum(maxExperience);
  if (expMin > 0 || expMax > 0) {
    const expConditions = {};
    if (expMin > 0) expConditions.$gte = String(expMin);
    if (expMax > 0) expConditions.$lte = String(expMax);
    andConditions.push({ totalExperience: expConditions });
  }

  // Location - current city
  const currentCities = parseCommaList(currentCity);
  if (currentCities.length > 0) {
    const cityRegexes = currentCities.map(c => ({ currentCity: { $regex: escapeRegex(c), $options: "i" } }));
    andConditions.push({ $or: cityRegexes });
  }

  // Location - preferred city
  const preferredCities = parseCommaList(preferredCity);
  if (preferredCities.length > 0) {
    const prefRegexes = preferredCities.map(c => ({ preferredLocations: { $regex: escapeRegex(c), $options: "i" } }));
    andConditions.push({ $or: prefRegexes });
  }

  // Remote/Hybrid/Relocation
  if (remote === "true" || remote === "1") {
    // Candidates whose preferred locations include "remote" or similar indicator
    andConditions.push({
      $or: [
        { preferredLocations: { $regex: /remote/i } },
        { currentCity: { $regex: /remote/i } },
      ],
    });
  }

  // Notice Period
  const npList = normalizeNoticePeriod(noticePeriod);
  const npQuery = buildNoticePeriodQuery(npList);
  if (npQuery) {
    andConditions.push(npQuery);
  }

  // Employment details - Department
  const dept = String(department || "").trim();
  if (dept) {
    andConditions.push({ currentTitle: { $regex: escapeRegex(dept), $options: "i" } });
  }

  // Industry
  const ind = String(industry || "").trim();
  if (ind) {
    andConditions.push({ workExperiences: { $regex: escapeRegex(ind), $options: "i" } });
  }

  // Education
  const eduUg = String(ug || "").trim();
  if (eduUg) {
    andConditions.push({ education: { $regex: escapeRegex(eduUg), $options: "i" } });
  }
  const eduPg = String(pg || "").trim();
  if (eduPg) {
    andConditions.push({ education: { $regex: escapeRegex(eduPg), $options: "i" } });
  }

  // Institute / University
  const inst = String(institute || university || "").trim();
  if (inst) {
    andConditions.push({ educations: { $regex: escapeRegex(inst), $options: "i" } });
  }

  // Certifications
  const certList = parseCommaList(certifications);
  if (certList.length > 0) {
    const certRegexes = certList.map(c => ({ itSkills: { $regex: escapeRegex(c), $options: "i" } }));
    andConditions.push({ $or: certRegexes });
  }

  // Diversity
  if (diversityGender && diversityGender.length > 0) {
    // Gender info would need a field in CandidateProfile - use profilePic/summary as heuristic
    // This is a placeholder for when gender field exists
  }
  if (freshers === "true" || freshers === "1") {
    andConditions.push({ totalExperience: { $in: ["0", "0 years", "Fresher", "fresher", ""] } });
  }
  if (careerBreak === "true" || careerBreak === "1") {
    andConditions.push({
      $or: [
        { summary: { $regex: /career\s*break/i } },
        { workExperiences: { $regex: /career\s*break/i } },
      ],
    });
  }

  // Languages
  const langList = parseCommaList(languages);
  if (langList.length > 0) {
    const langRegexes = langList.map(l => ({ itSkills: { $regex: escapeRegex(l), $options: "i" } }));
    andConditions.push({ $or: langRegexes });
  }

  // Work Permit / Passport / Visa
  if (passport === "true" || passport === "1") {
    andConditions.push({
      $or: [
        { summary: { $regex: /passport/i } },
        { linkedInUrl: { $regex: /passport/i } },
      ],
    });
  }

  // GitHub / Portfolio / LinkedIn
  const gh = String(github || "").trim();
  if (gh) {
    andConditions.push({ portfolioUrl: { $regex: escapeRegex(gh), $options: "i" } });
  }
  const pf = String(portfolio || "").trim();
  if (pf) {
    andConditions.push({ portfolioUrl: { $regex: escapeRegex(pf), $options: "i" } });
  }

  if (andConditions.length > 0) {
    matchStage.$and = andConditions;
  }

  pipeline.push({ $match: matchStage });

  // Sort
  let sortObj = {};
  switch (sort) {
    case "experience_high":
      sortObj = { totalExperience: -1 };
      break;
    case "experience_low":
      sortObj = { totalExperience: 1 };
      break;
    case "newest":
      sortObj = { createdAt: -1 };
      break;
    case "oldest":
      sortObj = { createdAt: 1 };
      break;
    case "name":
      sortObj = { "userId.name": 1 };
      break;
    default:
      sortObj = { profileViews: -1, recruiterActions: -1, createdAt: -1 };
  }
  pipeline.push({ $sort: sortObj });

  // Get total count before pagination
  const countPipeline = [...pipeline, { $count: "total" }];
  const countResult = await CandidateProfile.aggregate(countPipeline).exec();
  const total = countResult.length > 0 ? countResult[0].total : 0;

  // Pagination
  pipeline.push({ $skip: skip });
  pipeline.push({ $limit: currentLimit });

  // Lookup user details
  pipeline.push({
    $lookup: {
      from: "users",
      localField: "userId",
      foreignField: "_id",
      as: "user",
    },
  });
  pipeline.push({ $unwind: { path: "$user", preserveNullAndEmptyArrays: true } });

  pipeline.push({
    $lookup: {
      from: "applications",
      let: { candidateUserId: "$userId" },
      pipeline: [
        {
          $match: {
            $expr: {
              $and: [
                { $eq: ["$candidateId", "$$candidateUserId"] },
                { $eq: ["$companyId", company._id] },
              ],
            },
          },
        },
        { $limit: 1 },
        { $project: { _id: 1, status: 1, createdAt: 1 } },
      ],
      as: "application",
    },
  });

  pipeline.push({
    $addFields: {
      hasApplied: { $gt: [{ $size: "$application" }, 0] },
      applicationStatus: { $arrayElemAt: ["$application.status", 0] },
      appliedAt: { $arrayElemAt: ["$application.createdAt", 0] },
    },
  });

  // Project clean output
  pipeline.push({
    $project: {
      _id: 0,
      id: "$_id",
      userId: 1,
      name: "$user.name",
      email: "$user.email",
      avatar: "$user.avatar",
      phone: 1,
      headline: 1,
      summary: 1,
      currentTitle: 1,
      currentCompany: 1,
      totalExperience: 1,
      currentCity: 1,
      currentState: 1,
      preferredLocations: 1,
      preferredRoles: 1,
      skills: 1,
      noticePeriod: 1,
      expectedSalary: 1,
      education: 1,
      linkedInUrl: 1,
      portfolioUrl: 1,
      profilePic: 1,
      resume: 1,
      publicShareId: 1,
      profileViews: 1,
      recruiterActions: 1,
      hasApplied: 1,
      applicationStatus: 1,
      appliedAt: 1,
      createdAt: 1,
      updatedAt: 1,
    },
  });

  const candidates = await CandidateProfile.aggregate(pipeline).exec();

  // Always log search in recent history (upsert by keyword)
  try {
    const autoName = searchName ? String(searchName).trim() : (kw || "Search with filters");
    await ResdexSearch.findOneAndUpdate(
      { companyId: company._id, "filters.keyword": kw || "__all__" },
      { $set: {
          companyId: company._id,
          userId: req.user._id,
          name: autoName,
          filters: {
            keyword, skills: skillList, booleanQuery, currentCompany, previousCompany,
            designation, excludeKeywords, preferredSkills: skillList,
            minExperience: expMin, maxExperience: expMax,
            currentCity: currentCities, preferredCity: preferredCities,
            remote: remote === "true", hybrid: hybrid === "true", relocation: relocation === "true",
            currency, currentSalaryMin: toNum(currentSalaryMin),
            currentSalaryMax: toNum(currentSalaryMax),
            expectedSalaryMin: toNum(expectedSalaryMin),
            expectedSalaryMax: toNum(expectedSalaryMax),
            noticePeriod: npList, department: dept, role, industry: ind,
            employmentType, employmentStatus,
            ug: eduUg, pg: eduPg, doctorate, institute: inst, university: inst,
            graduationYear, minPercentage: toNum(minPercentage),
            certifications: certList,
            diversityGender: parseCommaList(diversityGender),
            careerBreak: careerBreak === "true", veterans: veterans === "true",
            disabilities: disabilities === "true", returnship: returnship === "true",
            womenHiring: womenHiring === "true", campusHiring: campusHiring === "true",
            freshers: freshers === "true",
            languages: langList, workPermit: parseCommaList(workPermit),
            passport: passport === "true", visa, openToRemote: openToRemote === "true",
            portfolio: pf, github: gh, linkedIn,
          },
          resultCount: total,
          lastRunAt: new Date(),
        },
        $inc: { runCount: 1 },
      },
      { upsert: true, returnDocument: 'after' }
    );
  } catch { /* silently fail log */ }

  // Log recruiter search activity (fire & forget)
  activityService.fireAndForget(() => {
    const label =
      String(kw || "").trim() ||
      [String(desig || "").trim(), (skillList || []).slice(0, 2).join(", "), currentCities?.[0]]
        .filter(Boolean)
        .join(" · ") ||
      "candidates";
    return activityService.logActivity({
      companyId: company._id,
      recruiter: req.user,
      action: "SEARCH",
      text: `Searched for **${label}** and found ${total} result${total === 1 ? "" : "s"}`,
      metadata: {
        resultCount: total,
        keyword: kw || "",
        saved: saveSearch === "true",
      },
    });
  });

  // Save search as pinned if requested
  if (saveSearch === "true" && searchName) {
    try {
      await ResdexSearch.create({
        companyId: company._id,
        userId: req.user._id,
        name: String(searchName).trim(),
        isPinned: true,
        filters: {
          keyword, skills: skillList, booleanQuery, currentCompany, previousCompany,
          designation, excludeKeywords, preferredSkills: skillList,
          minExperience: expMin, maxExperience: expMax,
          currentCity: currentCities, preferredCity: preferredCities,
          remote: remote === "true", hybrid: hybrid === "true", relocation: relocation === "true",
          currency, currentSalaryMin: toNum(currentSalaryMin),
          currentSalaryMax: toNum(currentSalaryMax),
          expectedSalaryMin: toNum(expectedSalaryMin),
          expectedSalaryMax: toNum(expectedSalaryMax),
          noticePeriod: npList, department: dept, role, industry: ind,
          employmentType, employmentStatus,
          ug: eduUg, pg: eduPg, doctorate, institute: inst, university: inst,
          graduationYear, minPercentage: toNum(minPercentage),
          certifications: certList,
          diversityGender: parseCommaList(diversityGender),
          careerBreak: careerBreak === "true", veterans: veterans === "true",
          disabilities: disabilities === "true", returnship: returnship === "true",
          womenHiring: womenHiring === "true", campusHiring: campusHiring === "true",
          freshers: freshers === "true",
          languages: langList, workPermit: parseCommaList(workPermit),
          passport: passport === "true", visa, openToRemote: openToRemote === "true",
          portfolio: pf, github: gh, linkedIn,
        },
        resultCount: total,
        lastRunAt: new Date(),
      });
    } catch { /* silently fail save */ }
  }

  res.json({
    success: true,
    data: {
      candidates,
      pagination: {
        page: currentPage,
        limit: currentLimit,
        total,
        totalPages: Math.ceil(total / currentLimit),
        hasPrevPage: currentPage > 1,
        hasNextPage: currentPage < Math.ceil(total / currentLimit),
      },
    },
  });
});

exports.getFilterOptions = asyncHandler(async (req, res) => {
  const [skills, cities, companies, titles, departments, industries] = await Promise.all([
    CandidateProfile.distinct("skills"),
    CandidateProfile.distinct("currentCity"),
    CandidateProfile.distinct("currentCompany"),
    CandidateProfile.distinct("currentTitle"),
    CandidateProfile.distinct("preferredRoles"),
    CandidateProfile.distinct("headline"),
  ]);

  const allSkills = [...new Set(
    (skills || []).filter(Boolean).flatMap(s => {
      if (typeof s === "string") return s.split(",").map(x => x.trim());
      return s;
    })
  )].filter(Boolean).sort();

  const groupedSkills = {
    programming: allSkills.filter(s => /javascript|python|java|go|rust|c\+\+|typescript|php|ruby|swift|kotlin|scala|perl/i.test(s)),
    frontend: allSkills.filter(s => /react|angular|vue|svelte|html|css|tailwind|bootstrap|nextjs|nuxt|remix|redux/i.test(s)),
    backend: allSkills.filter(s => /node|express|django|flask|spring|fastapi|laravel|rails|asp\.net|graphql|rest|api/i.test(s)),
    cloud: allSkills.filter(s => /aws|azure|gcp|cloud|docker|kubernetes|terraform|jenkins|ci\/cd/i.test(s)),
    ai: allSkills.filter(s => /machine learning|deep learning|ai|llm|gpt|tensorflow|pytorch|nlp|computer vision|data science/i.test(s)),
    devops: allSkills.filter(s => /devops|sre|linux|bash|ansible|puppet|chef|monitoring|prometheus|grafana|gitlab/i.test(s)),
    databases: allSkills.filter(s => /sql|mysql|postgresql|mongodb|redis|elasticsearch|cassandra|dynamodb|firebase|oracle|mssql/i.test(s)),
    soft: allSkills.filter(s => /project management|leadership|communication|agile|scrum|teamwork|problem.solving|analytical/i.test(s)),
    other: [],
  };
  groupedSkills.other = allSkills.filter(s =>
    !Object.values(groupedSkills).flat().includes(s)
  );

  res.json({
    success: true,
    data: {
      skills: allSkills,
      groupedSkills,
      cities: (cities || []).filter(Boolean).sort(),
      companies: (companies || []).filter(Boolean).sort(),
      titles: (titles || []).filter(Boolean).sort(),
      departments: (departments || []).filter(Boolean).sort(),
      industries: (industries || []).filter(Boolean).sort(),
      noticePeriods: [
        "Available Immediately", "15 Days", "30 Days",
        "45 Days", "60 Days", "90 Days", "Serving Notice",
      ],
      educationLevels: ["High School", "Diploma", "Bachelor's", "Master's", "Doctorate"],
      employmentTypes: ["Full Time", "Part Time", "Contract", "Internship", "Freelance"],
      currencies: ["INR", "USD", "EUR", "GBP", "AED", "SGD"],
      certifications: [
        "AWS Certified", "Azure Certified", "Google Cloud Certified",
        "Oracle Certified", "Cisco Certified", "PMP", "Scrum Master",
        "ISTQB", "CEH", "CISSP",
      ],
    },
  });
});

exports.listSearches = asyncHandler(async (req, res) => {
  const { pinnedOnly } = req.query;
  const query = { companyId: req.company._id, userId: req.user._id };
  if (pinnedOnly === "true") query.isPinned = true;

  const searches = await ResdexSearch.find(query)
    .sort({ isPinned: -1, updatedAt: -1 })
    .limit(50)
    .lean();

  res.json({ success: true, data: searches });
});

exports.saveSearch = asyncHandler(async (req, res) => {
  const { name, filters, isPinned } = req.body;
  if (!name || !String(name).trim()) {
    return res.status(400).json({ success: false, message: "Search name is required" });
  }

  const search = await ResdexSearch.create({
    companyId: req.company._id,
    userId: req.user._id,
    name: String(name).trim(),
    isPinned: Boolean(isPinned),
    filters: filters || {},
  });

  res.status(201).json({ success: true, data: search });
});

exports.updateSearch = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updates = {};
  const allowedFields = ["name", "filters", "isPinned", "isScheduled", "scheduleCron"];
  for (const field of allowedFields) {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  }

  const search = await ResdexSearch.findOneAndUpdate(
    { _id: id, companyId: req.company._id },
    { $set: updates },
    { new: true, runValidators: true },
  );
  if (!search) {
    return res.status(404).json({ success: false, message: "Search not found" });
  }
  res.json({ success: true, data: search });
});

exports.deleteSearch = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const search = await ResdexSearch.findOneAndDelete({ _id: id, companyId: req.company._id });
  if (!search) {
    return res.status(404).json({ success: false, message: "Search not found" });
  }
  res.json({ success: true, message: "Search deleted" });
});

exports.togglePin = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const search = await ResdexSearch.findOne({ _id: id, companyId: req.company._id });
  if (!search) {
    return res.status(404).json({ success: false, message: "Search not found" });
  }
  search.isPinned = !search.isPinned;
  await search.save();
  res.json({ success: true, data: search });
});

exports.recentSearches = asyncHandler(async (req, res) => {
  const searches = await ResdexSearch.find({ companyId: req.company._id })
    .sort({ lastRunAt: -1 })
    .limit(20)
    .select("name resultCount runCount lastRunAt")
    .lean();

  res.json({ success: true, data: searches });
});

exports.aiParseQuery = asyncHandler(async (req, res) => {
  const { query } = req.body;
  if (!query || !String(query).trim()) {
    return res.status(400).json({ success: false, message: "Query is required" });
  }

  const systemPrompt = `You are an AI recruitment assistant that converts natural language into structured search filters for a resume database. Parse the user's query and return ONLY a JSON object (no markdown, no code fences) with these fields:

{
  "keyword": "main search terms",
  "skills": ["array", "of", "skills"],
  "minExperience": number or null,
  "maxExperience": number or null,
  "currentCity": ["city names"],
  "preferredCity": ["preferred cities"],
  "currentCompany": "company name or empty",
  "designation": "job title or empty",
  "noticePeriod": "notice period string or empty",
  "remote": true/false,
  "expectedSalaryMin": number or null,
  "expectedSalaryMax": number or null,
  "industry": "industry name or empty",
  "education": "education level or empty",
  "parsedQuery": "brief explanation of what was parsed"
}`;

  const userPrompt = `Parse this recruiter's search query into structured filters:\n\n"${query}"`;

  try {
    const response = await OpenAIService.createChatCompletion({
      model: process.env.OPENAI_CHAT_MODEL || "gpt-5-mini",
      systemPrompt,
      userPrompt,
      maxOutputTokens: 1000,
    });

    const rawText = response?.output_text || response?.output?.[0]?.content?.[0]?.text || "";
    const cleaned = rawText.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
    const parsed = JSON.parse(cleaned);

    res.json({ success: true, data: parsed });
  } catch (err) {
    console.error("[Resdex AI Parse] error:", err.message);
    // Fallback: simple keyword extraction
    const words = query.split(/\s+/).filter(w => w.length > 2);
    res.json({
      success: true,
      data: {
        keyword: query,
        skills: words.filter(w => /^[A-Z]/.test(w)),
        minExperience: null,
        maxExperience: null,
        currentCity: [],
        preferredCity: [],
        currentCompany: "",
        designation: "",
        noticePeriod: "",
        remote: query.toLowerCase().includes("remote"),
        expectedSalaryMin: null,
        expectedSalaryMax: null,
        industry: "",
        education: "",
        parsedQuery: "Basic keyword extraction (AI unavailable)",
      },
    });
  }
});
