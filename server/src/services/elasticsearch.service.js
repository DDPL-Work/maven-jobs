const { getClient, esAvailable, esAvailableSync } = require("../config/elasticsearch");
const Job = require("../models/Job");
require("../models/Company");

const JOBS_INDEX = process.env.ES_JOBS_INDEX || "jobs";
const CANDIDATES_INDEX = process.env.ES_CANDIDATES_INDEX || process.env.ES_INDEX || "candidates";

// ─────────────────────────────────────────────────────────
// Index Mappings
// ─────────────────────────────────────────────────────────
const CANDIDATE_MAPPING = {
  mappings: {
    properties: {
      candidateId:        { type: "keyword" },
      userId:             { type: "keyword" },
      fullName:           { type: "text", fields: { keyword: { type: "keyword" } } },
      name:               { type: "text", fields: { keyword: { type: "keyword" } } },
      email:              { type: "keyword" },
      phone:              { type: "keyword" },
      avatar:             { type: "keyword" },
      designation:        { type: "text", fields: { keyword: { type: "keyword" } } },
      currentTitle:       { type: "text", fields: { keyword: { type: "keyword" } } },
      recentCompany:      { type: "text", fields: { keyword: { type: "keyword" } } },
      currentCompany:     { type: "text", fields: { keyword: { type: "keyword" } } },
      companyNamesAll:    { type: "text" },
      headline:           { type: "text" },
      summary:            { type: "text" },
      skills:             { type: "text", fields: { keyword: { type: "keyword" } } },
      topSkills:          { type: "text" },
      location:           { type: "keyword" },
      currentCity:        { type: "text", fields: { keyword: { type: "keyword" } } },
      currentState:       { type: "keyword" },
      preferredLocations: { type: "text" },
      preferredRoles:     { type: "text" },
      noticePeriod:       { type: "keyword" },
      experience:         { type: "float" },
      totalExperience:    { type: "keyword" },
      ctcCurrent:         { type: "float" },
      ctcExpected:        { type: "float" },
      expectedSalary:     { type: "float" },
      education:          { type: "text" },
      linkedInUrl:        { type: "keyword" },
      portfolioUrl:       { type: "keyword" },
      profilePic:         { type: "keyword" },
      resume:             { type: "keyword" },
      publicShareId:      { type: "keyword" },
      profileViews:       { type: "integer" },
      recruiterActions:   { type: "integer" },
      portal:             { type: "keyword" },
      portalDate:         { type: "date" },
      applyDate:          { type: "date" },
      createdAt:          { type: "date" },
      updatedAt:          { type: "date" },
    },
  },
};

const JOB_MAPPING = {
  mappings: {
    properties: {
      title:         { type: "text", analyzer: "standard", fields: { keyword: { type: "keyword" } } },
      summary:       { type: "text" },
      description:   { type: "text" },
      department:    { type: "keyword" },
      jobType:       { type: "keyword" },
      workplaceType: { type: "keyword" },
      location:      { type: "text", fields: { keyword: { type: "keyword" } } },
      experience:    { type: "keyword" },
      experienceMin: { type: "integer" },
      salaryMin:     { type: "integer" },
      salaryMax:     { type: "integer" },
      skills:        { type: "keyword" },
      companyId:     { type: "keyword" },
      companyName:   { type: "text", fields: { keyword: { type: "keyword" } } },
      companyIndustry:{ type: "keyword" },
      isActive:      { type: "boolean" },
      approvalStatus:{ type: "keyword" },
      externalLink:  { type: "keyword" },
      createdAt:     { type: "date" },
      updatedAt:     { type: "date" },
    },
  },
};

// ─────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────

/** Extract minimum experience number from strings like "2-5 years", "3+ years", "Fresher" */
const extractExpMin = (value = "") => {
  const s = String(value || "").toLowerCase().trim();
  if (s.includes("fresher")) return 0;
  const match = s.match(/\d+/);
  return match ? parseInt(match[0], 10) : 0;
};

/** Normalise a Job mongoose doc into an ES document */
const toEsDoc = (job) => {
  const companyId = job.companyId;
  const companyName =
    typeof companyId === "object" ? companyId?.name || "" : "";
  const companyIndustry =
    typeof companyId === "object" ? companyId?.industry || "" : "";
  const companyIdStr =
    typeof companyId === "object"
      ? String(companyId?._id || companyId || "")
      : String(companyId || "");

  return {
    title:          job.title || "",
    summary:        job.summary || "",
    description:    job.description || "",
    department:     job.department || "",
    jobType:        job.jobType || "",
    workplaceType:  job.workplaceType || "",
    location:       job.location || "",
    experience:     job.experience || "",
    experienceMin:  extractExpMin(job.experience),
    salaryMin:      Number(job.salaryMin || 0),
    salaryMax:      Number(job.salaryMax || 0),
    skills:         Array.isArray(job.skills) ? job.skills : [],
    companyId:      companyIdStr,
    companyName,
    companyIndustry,
    isActive:       Boolean(job.isActive),
    approvalStatus: job.approvalStatus || "PENDING",
    externalLink:   job.externalLink || "",
    createdAt:      job.createdAt || new Date(),
    updatedAt:      job.updatedAt || new Date(),
  };
};

// ─────────────────────────────────────────────────────────
// 1. Create Index
// ─────────────────────────────────────────────────────────
async function createJobsIndex() {
  const client = getClient();
  try {
    const exists = await client.indices.exists({ index: JOBS_INDEX });
    if (exists) {
      console.log(`[ES] Index "${JOBS_INDEX}" already exists.`);
      return;
    }
    await client.indices.create({ index: JOBS_INDEX, body: JOB_MAPPING });
    console.log(`[ES] Index "${JOBS_INDEX}" created ✓`);
  } catch (err) {
    console.error("[ES] createJobsIndex error:", err.message);
    throw err;
  }
}

// ─────────────────────────────────────────────────────────
// 2. Index / Upsert a single Job
// ─────────────────────────────────────────────────────────
async function indexJob(job) {
  if (!job?._id) return;
  const client = getClient();
  try {
    // Populate companyId if it's just an ObjectId reference
    let jobDoc = job;
    if (typeof job.companyId !== "object" || !job.companyId?.name) {
      jobDoc = await Job.findById(job._id).populate("companyId", "name industry").lean();
      if (!jobDoc) return;
    }
    await client.index({
      index: JOBS_INDEX,
      id: String(job._id),
      document: toEsDoc(jobDoc),
    });
  } catch (err) {
    console.error(`[ES] indexJob error for ${job._id}:`, err.message);
  }
}

// ─────────────────────────────────────────────────────────
// 3. Delete a Job from index
// ─────────────────────────────────────────────────────────
async function deleteJob(jobId) {
  if (!jobId) return;
  const client = getClient();
  try {
    await client.delete({ index: JOBS_INDEX, id: String(jobId) });
  } catch (err) {
    // Ignore 404 (doc already absent)
    if (err?.meta?.statusCode !== 404) {
      console.error(`[ES] deleteJob error for ${jobId}:`, err.message);
    }
  }
}

// ─────────────────────────────────────────────────────────
// 4. Search Jobs
// ─────────────────────────────────────────────────────────
const parseRange = (value) => {
  if (!value || typeof value !== "string") return null;
  const parts = value.split("-").map((v) => parseInt(v, 10)).filter((v) => !isNaN(v));
  if (parts.length === 0) return null;
  return { min: parts[0], max: parts.length > 1 ? parts[1] : null };
};

const parseArrayParam = (value, defaultSep = ",") => {
  const s = String(value || "");
  const sep = s.includes(";") ? ";" : defaultSep;
  return s.split(sep).map((v) => v.trim()).filter(Boolean);
};

async function searchJobs(params = {}) {
  const client = getClient();
  const {
    search = "",
    location = "",
    experience = "",
    department = "",
    workMode = "",
    jobType = "",
    skills = "",
    company = "",
    salary = "",
    sort = "",
    page = 1,
    limit = 15,
  } = params;

  const mustClauses = [
    { term: { isActive: true } },
    { term: { approvalStatus: "APPROVED" } },
  ];

  const filterClauses = [];

  // Full-text search with fuzziness
  if (search && search.trim()) {
    mustClauses.push({
      multi_match: {
        query: search.trim(),
        fields: ["title^3", "skills^2", "description", "companyName", "department", "summary"],
        fuzziness: "AUTO",
        type: "best_fields",
        minimum_should_match: "75%",
      },
    });
  }

  // Location filter
  if (location) {
    const locs = parseArrayParam(location, ";");
    if (locs.length > 0) {
      filterClauses.push({
        bool: {
          should: locs.map((loc) => ({
            match: { location: { query: loc, fuzziness: "AUTO" } },
          })),
          minimum_should_match: 1,
        },
      });
    }
  }

  // Experience range filter
  if (experience) {
    const expRange = parseRange(experience);
    if (expRange) {
      const rangeClause = { range: { experienceMin: { gte: expRange.min || 0 } } };
      if (expRange.max) rangeClause.range.experienceMin.lte = expRange.max;
      filterClauses.push(rangeClause);
    } else {
      // Single number like "5"
      const expNum = parseInt(experience, 10);
      if (!isNaN(expNum)) {
        filterClauses.push({ range: { experienceMin: { lte: expNum } } });
      }
    }
  }

  // Department filter
  if (department) {
    const depts = parseArrayParam(department).filter(
      (d) => d.toLowerCase() !== "all" && d.toLowerCase() !== "all domains"
    );
    if (depts.length > 0) {
      filterClauses.push({ terms: { department: depts } });
    }
  }

  // Work mode filter
  if (workMode) {
    const modes = parseArrayParam(workMode);
    if (modes.length > 0) {
      filterClauses.push({ terms: { workplaceType: modes } });
    }
  }

  // Job type filter
  if (jobType) {
    const types = parseArrayParam(jobType);
    if (types.length > 0) {
      filterClauses.push({ terms: { jobType: types } });
    }
  }

  // Skills filter
  if (skills) {
    const skillList = parseArrayParam(skills);
    if (skillList.length > 0) {
      filterClauses.push({ terms: { skills: skillList } });
    }
  }

  // Company name filter
  if (company) {
    const companies = parseArrayParam(company);
    if (companies.length > 0) {
      filterClauses.push({
        bool: {
          should: companies.map((c) => ({
            match: { "companyName.keyword": c },
          })),
          minimum_should_match: 1,
        },
      });
    }
  }

  // Salary range filter
  if (salary) {
    const salaryRange = parseRange(salary);
    if (salaryRange) {
      if (salaryRange.min) filterClauses.push({ range: { salaryMax: { gte: salaryRange.min } } });
      if (salaryRange.max) filterClauses.push({ range: { salaryMin: { lte: salaryRange.max } } });
    }
  }

  // Sort
  let sortClause;
  if (!search) {
    // No text query → sort by date only
    sortClause = sort === "newest"
      ? [{ createdAt: { order: "desc" } }]
      : [{ updatedAt: { order: "desc" } }];
  } else {
    // With text query → relevance first, then date
    sortClause = sort === "newest"
      ? [{ createdAt: { order: "desc" } }, "_score"]
      : ["_score", { updatedAt: { order: "desc" } }];
  }

  const from = (Math.max(1, page) - 1) * limit;

  const esQuery = {
    index: JOBS_INDEX,
    body: {
      query: {
        bool: {
          must: mustClauses,
          filter: filterClauses,
        },
      },
      sort: sortClause,
      from,
      size: limit,
    },
  };

  const response = await client.search(esQuery);
  const hits = response.hits?.hits || [];
  const total = response.hits?.total?.value || 0;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  const jobs = hits.map((hit) => ({
    id: hit._id,
    ...hit._source,
    _score: hit._score,
  }));

  return { jobs, total, page: Math.max(1, page), totalPages };
}

// ─────────────────────────────────────────────────────────
// 5. Search Suggestions (keyword autocomplete)
// ─────────────────────────────────────────────────────────
async function getSuggestions(q = "") {
  if (!q || q.trim().length < 1) return [];
  const client = getClient();

  const response = await client.search({
    index: JOBS_INDEX,
    body: {
      size: 0,
      query: {
        bool: {
          must: [
            { term: { isActive: true } },
            { term: { approvalStatus: "APPROVED" } },
          ],
          should: [
            { wildcard: { "title.keyword": { value: `*${q}*`, case_insensitive: true } } },
            { wildcard: { skills: { value: `*${q}*`, case_insensitive: true } } },
            { wildcard: { "companyName.keyword": { value: `*${q}*`, case_insensitive: true } } },
          ],
          minimum_should_match: 1,
        },
      },
      aggs: {
        title_suggestions: {
          terms: { field: "title.keyword", size: 3, order: { _count: "desc" } },
        },
        skill_suggestions: {
          terms: { field: "skills", size: 3, order: { _count: "desc" } },
        },
        company_suggestions: {
          terms: { field: "companyName.keyword", size: 3, order: { _count: "desc" } },
        },
      },
    },
  });

  const titles = (response.aggregations?.title_suggestions?.buckets || []).map((b) => b.key);
  const skills = (response.aggregations?.skill_suggestions?.buckets || []).map((b) => b.key);
  const companies = (response.aggregations?.company_suggestions?.buckets || []).map((b) => b.key);

  // Merge and deduplicate, max 5
  const seen = new Set();
  const suggestions = [];
  for (const s of [...titles, ...skills, ...companies]) {
    const key = String(s || "").toLowerCase().trim();
    if (key && !seen.has(key) && suggestions.length < 5) {
      seen.add(key);
      suggestions.push(s.trim());
    }
  }
  return suggestions;
}

// ─────────────────────────────────────────────────────────
// 6. Bulk Re-index all jobs from MongoDB
// ─────────────────────────────────────────────────────────
async function bulkReindex() {
  const client = getClient();

  // Ensure index exists
  await createJobsIndex();

  const jobs = await Job.find({ isActive: true, approvalStatus: "APPROVED" })
    .populate("companyId", "name industry")
    .lean();

  if (!jobs.length) {
    console.log("[ES] No jobs found to index.");
    return 0;
  }

  const operations = jobs.flatMap((job) => [
    { index: { _index: JOBS_INDEX, _id: String(job._id) } },
    toEsDoc(job),
  ]);

  const bulkResponse = await client.bulk({ operations, refresh: true });

  const errors = bulkResponse.items?.filter((item) => item.index?.error);
  if (errors?.length) {
    console.error(`[ES] Bulk index had ${errors.length} errors`);
  }

  console.log(`[ES] Bulk indexed ${jobs.length} jobs (${errors?.length || 0} errors) ✓`);
  return jobs.length;
}

// ─────────────────────────────────────────────────────────────────────────────
// Fire-and-forget helpers
// These schedule work AFTER the current event-loop tick using setImmediate,
// so the API response is already sent before any ES I/O begins.
// They use the cached availability flag — no network ping in the hot path.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Schedule an incremental index/upsert for a single job.
 * Call this right before or after res.json() — it won't block the response.
 *
 * @param {Object|string} jobOrId  Mongoose job document (preferred) or just a job _id.
 */
function scheduleIndex(jobOrId) {
  if (!jobOrId) return;

  setImmediate(async () => {
    try {
      // Fast synchronous check first (no network call)
      if (!esAvailableSync()) {
        // Try an async ping in case ES just came back up
        const available = await esAvailable();
        if (!available) return;
      }
      await indexJob(jobOrId);
    } catch (err) {
      console.error("[ES:async] scheduleIndex error:", err.message);
    }
  });
}

/**
 * Schedule an incremental delete for a single job.
 * Call this right before or after res.json() — it won't block the response.
 *
 * @param {string} jobId  The job's MongoDB _id as a string.
 */
function scheduleDelete(jobId) {
  if (!jobId) return;

  setImmediate(async () => {
    try {
      if (!esAvailableSync()) {
        const available = await esAvailable();
        if (!available) return;
      }
      await deleteJob(jobId);
    } catch (err) {
      console.error("[ES:async] scheduleDelete error:", err.message);
    }
  });
}

let _reindexTimer = null;
let _isReindexing = false;

/**
 * Schedule a debounced bulk re-index in the background.
 * Multiple quick delete/change triggers collapse into a single re-index.
 *
 * @param {number} delayMs  Debounce delay in milliseconds (default 1500ms).
 */
function scheduleReindex(delayMs = 1500) {
  if (_reindexTimer) clearTimeout(_reindexTimer);

  _reindexTimer = setTimeout(async () => {
    if (_isReindexing) return;
    _isReindexing = true;
    try {
      if (!esAvailableSync()) {
        const available = await esAvailable();
        if (!available) return;
      }
      console.log("[ES:sync] Automatically re-indexing jobs in background...");
      const count = await bulkReindex();
      console.log(`[ES:sync] Automatic re-index complete (${count} jobs synced) ✓`);
    } catch (err) {
      console.error("[ES:sync] Automatic re-index error:", err.message);
    } finally {
      _isReindexing = false;
    }
  }, delayMs);

  if (_reindexTimer && typeof _reindexTimer.unref === "function") {
    _reindexTimer.unref();
  }
}

let _changeStream = null;

/**
 * Watch MongoDB Job collection for live changes (including external Compass/Atlas deletes).
 * Automatically removes deleted jobs from Elasticsearch and triggers background reindex.
 */
function initJobChangeStream() {
  if (_changeStream) return;

  try {
    const Job = require("../models/Job");
    _changeStream = Job.watch([], { fullDocument: "updateLookup" });

    _changeStream.on("change", async (change) => {
      try {
        const op = change.operationType;
        const id = change.documentKey?._id ? String(change.documentKey._id) : null;

        if (op === "delete") {
          console.log(`[ES:watch] Job ${id} removed from DB → removing from ES`);
          if (id) {
            await deleteJob(id).catch(() => {});
          }
          // Automatically re-index in background to guarantee full sync
          scheduleReindex(1500);
        } else if (op === "insert" || op === "replace" || op === "update") {
          const doc = change.fullDocument;
          if (doc) {
            if (doc.isActive && doc.approvalStatus === "APPROVED") {
              scheduleIndex(doc);
            } else if (id) {
              scheduleDelete(id);
            }
          } else if (id) {
            scheduleIndex(id);
          }
        }
      } catch (err) {
        console.error("[ES:watch] Change handler error:", err.message);
      }
    });

    _changeStream.on("error", (err) => {
      console.warn("[ES:watch] Change stream closed or encountered error:", err.message);
      _changeStream = null;
    });

    console.log("[ES:watch] MongoDB Job change stream active — live DB changes auto-sync to ES ✓");

    const CandidateProfile = require("../models/CandidateProfile");
    const candidateStream = CandidateProfile.watch([], { fullDocument: "updateLookup" });

    candidateStream.on("change", async (change) => {
      try {
        const op = change.operationType;
        const id = change.documentKey?._id ? String(change.documentKey._id) : null;

        if (op === "delete") {
          console.log(`[ES:watch] Candidate ${id} removed from DB → removing from ES`);
          if (id) {
            await deleteCandidate(id).catch(() => {});
          }
          scheduleReindexCandidates(1500);
        } else if (op === "insert" || op === "replace" || op === "update") {
          if (id) {
            scheduleIndexCandidate(id);
          }
        }
      } catch (err) {
        console.error("[ES:watch] Candidate change handler error:", err.message);
      }
    });

    candidateStream.on("error", (err) => {
      console.warn("[ES:watch] Candidate change stream error:", err.message);
    });

    console.log("[ES:watch] MongoDB Candidate change stream active — live DB changes auto-sync to ES ✓");
  } catch (err) {
    console.warn("[ES:watch] Could not initialize MongoDB change stream:", err.message);
  }
}

// ─────────────────────────────────────────────────────────
// Candidates: Index Management & Transformation
// ─────────────────────────────────────────────────────────

async function createCandidatesIndex() {
  const client = getClient();
  const exists = await client.indices.exists({ index: CANDIDATES_INDEX });
  if (!exists) {
    await client.indices.create({
      index: CANDIDATES_INDEX,
      ...CANDIDATE_MAPPING,
    });
    console.log(`[ES] Index "${CANDIDATES_INDEX}" created ✓`);
  } else {
    // Index already exists — add/verify new fields without altering existing data
    await client.indices.putMapping({
      index: CANDIDATES_INDEX,
      properties: CANDIDATE_MAPPING.mappings.properties,
    });
    console.log(`[ES] Index "${CANDIDATES_INDEX}" mapping verified ✓`);
  }
}

function toCandidateEsDoc(profile, user) {
  const userName = user?.name || profile.name || "";
  const title = profile.currentTitle || profile.headline || "";
  const company = profile.currentCompany || "";
  const expStr = String(profile.totalExperience || "0");
  const expNum = parseFloat(expStr.replace(/[^0-9.]/g, "")) || 0;
  const skills = Array.isArray(profile.skills)
    ? profile.skills
    : (typeof profile.skills === "string" ? profile.skills.split(",").map((s) => s.trim()).filter(Boolean) : []);
  const expectedSal = parseFloat(String(profile.expectedSalary || "0").replace(/[^0-9.]/g, "")) || 0;

  return {
    candidateId: String(profile._id),
    userId: profile.userId ? String(profile.userId._id || profile.userId) : String(profile._id),
    fullName: userName,
    name: userName,
    email: user?.email || profile.email || "",
    phone: profile.phone || user?.phone || "",
    avatar: user?.avatar || "",
    designation: title,
    currentTitle: title,
    recentCompany: company,
    currentCompany: company,
    companyNamesAll: company ? [company] : [],
    headline: profile.headline || "",
    summary: profile.summary || "",
    skills,
    topSkills: skills.slice(0, 5),
    location: profile.currentCity || "",
    currentCity: profile.currentCity || "",
    currentState: profile.currentState || "",
    preferredLocations: Array.isArray(profile.preferredLocations)
      ? profile.preferredLocations.join(", ")
      : String(profile.preferredLocations || ""),
    preferredRoles: Array.isArray(profile.preferredRoles)
      ? profile.preferredRoles.join(", ")
      : String(profile.preferredRoles || ""),
    noticePeriod: profile.noticePeriod || "",
    experience: expNum,
    totalExperience: expStr,
    ctcCurrent: 0,
    ctcExpected: expectedSal,
    expectedSalary: expectedSal,
    education: typeof profile.education === "string" ? profile.education : JSON.stringify(profile.education || ""),
    linkedInUrl: profile.linkedInUrl || "",
    portfolioUrl: profile.portfolioUrl || "",
    profilePic: profile.profilePic?.url || (typeof profile.profilePic === "string" ? profile.profilePic : "") || user?.avatar || "",
    resume: typeof profile.resume === "string" ? profile.resume : (profile.resume?.url || ""),
    publicShareId: profile.publicShareId || "",
    profileViews: profile.profileViews || 0,
    recruiterActions: profile.recruiterActions || 0,
    portal: "MavenJobs",
    portalDate: profile.createdAt || new Date(),
    applyDate: profile.createdAt || new Date(),
    createdAt: profile.createdAt || new Date(),
    updatedAt: profile.updatedAt || new Date(),
  };
}

async function indexCandidate(profileOrId) {
  try {
    const client = getClient();
    let profile = profileOrId;
    if (typeof profileOrId === "string" || !profileOrId?.userId) {
      const CandidateProfile = require("../models/CandidateProfile");
      profile = await CandidateProfile.findById(profileOrId?._id || profileOrId)
        .populate("userId", "name email avatar phone accessStatus isActive")
        .lean();
    }
    if (!profile) return;

    const doc = toCandidateEsDoc(profile, profile.userId);
    await client.index({
      index: CANDIDATES_INDEX,
      id: String(profile._id),
      document: doc,
    });
    console.log(`[ES] Candidate indexed: ${profile._id} (${doc.name || doc.currentTitle}) ✓`);
  } catch (err) {
    console.error(`[ES] indexCandidate error for ${profileOrId?._id || profileOrId}:`, err.message);
  }
}

async function deleteCandidate(candidateId) {
  try {
    const client = getClient();
    await client.delete({
      index: CANDIDATES_INDEX,
      id: String(candidateId),
    });
    console.log(`[ES] Candidate deleted from index: ${candidateId} ✓`);
  } catch (err) {
    if (err.meta?.statusCode === 404) return;
    console.error(`[ES] deleteCandidate error for ${candidateId}:`, err.message);
  }
}

async function searchCandidatesEs(params = {}) {
  const client = getClient();
  const index = CANDIDATES_INDEX;

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
    page = 1, limit = 10, sort,
  } = params;

  const currentPage = Math.max(1, parseInt(page, 10) || 1);
  const currentLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
  const from = (currentPage - 1) * currentLimit;

  const must = [];
  const should = [];
  const filter = [];
  const must_not = [];

  // 1. Keyword search (fuzzy multi-match)
  const kw = String(keyword || "").trim();
  if (kw) {
    must.push({
      multi_match: {
        query: kw,
        fields: [
          "fullName^3", "name^3",
          "designation^2.5", "currentTitle^2.5",
          "skills^2", "topSkills^2",
          "headline^1.5", "summary^1.5",
          "recentCompany", "currentCompany", "companyNamesAll",
          "preferredRoles", "preferredLocations", "location", "currentCity"
        ],
        fuzziness: "AUTO",
        type: "best_fields",
        minimum_should_match: "70%",
      },
    });
  }

  // 2. Skills filter
  const rawSkills = skills || preferredSkills;
  if (rawSkills) {
    const skillList = (Array.isArray(rawSkills) ? rawSkills : String(rawSkills).split(","))
      .map((s) => s.trim())
      .filter(Boolean);
    for (const skill of skillList) {
      should.push({
        multi_match: {
          query: skill,
          fields: ["skills^2", "topSkills^2", "designation", "currentTitle", "summary"],
          fuzziness: "AUTO",
        },
      });
    }
  }

  // 3. Boolean query
  const bq = String(booleanQuery || "").trim();
  if (bq) {
    must.push({
      query_string: {
        query: bq,
        fields: ["skills", "topSkills", "fullName", "name", "designation", "currentTitle", "summary", "headline"],
        default_operator: "AND",
      },
    });
  }

  // 4. Company filters
  const cc = String(currentCompany || "").trim();
  if (cc) {
    must.push({
      multi_match: {
        query: cc,
        fields: ["currentCompany^2", "recentCompany^2", "companyNamesAll"],
        fuzziness: "AUTO",
      },
    });
  }
  const pc = String(previousCompany || "").trim();
  if (pc) {
    must.push({
      multi_match: {
        query: pc,
        fields: ["companyNamesAll", "recentCompany"],
        fuzziness: "AUTO",
      },
    });
  }

  // 5. Designation filter
  const desig = String(designation || role || department || "").trim();
  if (desig) {
    must.push({
      multi_match: {
        query: desig,
        fields: ["designation^2", "currentTitle^2", "preferredRoles"],
        fuzziness: "AUTO",
      },
    });
  }

  // 6. Exclude keywords
  const excl = String(excludeKeywords || "").trim();
  if (excl) {
    const exclList = excl.split(",").map((s) => s.trim()).filter(Boolean);
    for (const term of exclList) {
      must_not.push({
        multi_match: {
          query: term,
          fields: ["fullName", "name", "designation", "currentTitle", "skills", "topSkills", "headline", "summary"],
        },
      });
    }
  }

  // 7. Experience filter
  const expMin = parseFloat(minExperience) || 0;
  const expMax = parseFloat(maxExperience) || 0;
  if (expMin > 0 || expMax > 0) {
    const expRange = {};
    if (expMin > 0) expRange.gte = expMin;
    if (expMax > 0) expRange.lte = expMax;
    filter.push({ range: { experience: expRange } });
  }

  // 8. Location filter (currentCity / preferredCity)
  const cityRaw = currentCity || preferredCity;
  if (cityRaw) {
    const cities = (Array.isArray(cityRaw) ? cityRaw : String(cityRaw).split(","))
      .map((c) => c.trim())
      .filter(Boolean);
    if (cities.length > 0) {
      const cityQueries = cities.map((c) => ({
        multi_match: {
          query: c,
          fields: ["currentCity^2", "location^2", "preferredLocations", "currentState"],
          fuzziness: "AUTO",
        },
      }));
      should.push(...cityQueries);
    }
  }

  // 9. Remote / Hybrid
  if (remote === "true" || remote === true || remote === "1" || openToRemote === "true") {
    should.push({
      multi_match: {
        query: "remote",
        fields: ["preferredLocations", "currentCity", "location", "summary"],
      },
    });
  }

  // 10. Notice Period
  if (noticePeriod) {
    const npList = (Array.isArray(noticePeriod) ? noticePeriod : String(noticePeriod).split(","))
      .map((n) => n.trim())
      .filter(Boolean);
    if (npList.length > 0) {
      const npQueries = npList.map((n) => ({
        match: { noticePeriod: n },
      }));
      should.push(...npQueries);
    }
  }

  // 11. Freshers
  if (freshers === "true" || freshers === true || freshers === "1") {
    filter.push({ range: { experience: { lte: 0 } } });
  }

  // Assemble bool query
  const boolQuery = {};
  if (must.length) boolQuery.must = must;
  if (filter.length) boolQuery.filter = filter;
  if (must_not.length) boolQuery.must_not = must_not;
  if (should.length) {
    boolQuery.should = should;
    if (!must.length) {
      boolQuery.minimum_should_match = 1;
    }
  }

  const query = Object.keys(boolQuery).length > 0 ? { bool: boolQuery } : { match_all: {} };

  // Sort
  let sortClause;
  switch (sort) {
    case "experience_high":
      sortClause = [{ experience: { order: "desc" } }];
      break;
    case "experience_low":
      sortClause = [{ experience: { order: "asc" } }];
      break;
    case "newest":
      sortClause = [{ createdAt: { order: "desc", unmapped_type: "date" } }];
      break;
    case "oldest":
      sortClause = [{ createdAt: { order: "asc", unmapped_type: "date" } }];
      break;
    case "name":
      sortClause = [{ "name.keyword": { order: "asc", unmapped_type: "keyword" } }];
      break;
    default:
      sortClause = ["_score", { createdAt: { order: "desc", unmapped_type: "date" } }];
  }

  const searchResponse = await client.search({
    index,
    query,
    sort: sortClause,
    from,
    size: currentLimit,
  });

  const total = typeof searchResponse.hits.total === "number"
    ? searchResponse.hits.total
    : (searchResponse.hits.total?.value || 0);

  const totalPages = Math.ceil(total / currentLimit);

  const candidates = (searchResponse.hits.hits || []).map((hit) => {
    const s = hit._source;
    const cid = s.candidateId || hit._id;
    const uid = s.userId || s.candidateId || hit._id;
    const name = s.name || s.fullName || "Candidate";
    const title = s.currentTitle || s.designation || "";
    const comp = s.currentCompany || s.recentCompany || "";
    const loc = s.currentCity || s.location || "";
    const exp = s.totalExperience || (s.experience != null ? `${s.experience} years` : "0");
    const skills = Array.isArray(s.skills)
      ? s.skills
      : (typeof s.skills === "string" ? s.skills.split(",").map((x) => x.trim()).filter(Boolean) : []);

    return {
      id: cid,
      _id: cid,
      userId: uid,
      name,
      fullName: name,
      email: s.email || "",
      avatar: s.avatar || s.profilePic || "",
      phone: s.phone || "",
      headline: s.headline || "",
      summary: s.summary || "",
      currentTitle: title,
      designation: title,
      currentCompany: comp,
      recentCompany: comp,
      totalExperience: exp,
      experience: s.experience || 0,
      currentCity: loc,
      location: loc,
      currentState: s.currentState || "",
      preferredLocations: Array.isArray(s.preferredLocations) ? s.preferredLocations : (s.preferredLocations ? [s.preferredLocations] : []),
      preferredRoles: s.preferredRoles || "",
      skills,
      noticePeriod: s.noticePeriod || "",
      expectedSalary: s.expectedSalary || s.ctcExpected || 0,
      ctcExpected: s.expectedSalary || s.ctcExpected || 0,
      education: s.education || "",
      linkedInUrl: s.linkedInUrl || "",
      portfolioUrl: s.portfolioUrl || "",
      profilePic: s.profilePic || s.avatar || "",
      resume: s.resume || "",
      publicShareId: s.publicShareId || "",
      profileViews: s.profileViews || 0,
      recruiterActions: s.recruiterActions || 0,
      hasApplied: false,
      applicationStatus: null,
      appliedAt: null,
      createdAt: s.createdAt || null,
      updatedAt: s.updatedAt || null,
      _score: hit._score,
    };
  });

  return {
    candidates,
    total,
    totalPages,
    took: searchResponse.took,
  };
}

async function bulkReindexCandidates() {
  const client = getClient();
  await createCandidatesIndex();

  const CandidateProfile = require("../models/CandidateProfile");
  require("../models/User");

  const profiles = await CandidateProfile.find({})
    .populate("userId", "name email avatar phone accessStatus isActive")
    .lean();

  if (!profiles.length) {
    console.log("[ES:Candidates] No candidate profiles found in MongoDB.");
    return 0;
  }

  const operations = profiles.flatMap((p) => [
    { index: { _index: CANDIDATES_INDEX, _id: String(p._id) } },
    toCandidateEsDoc(p, p.userId),
  ]);

  const bulkResponse = await client.bulk({ operations, refresh: true });
  const errors = bulkResponse.items?.filter((item) => item.index?.error);
  if (errors?.length) {
    console.error(`[ES:Candidates] Bulk reindex had ${errors.length} errors`);
  }

  console.log(`[ES:Candidates] Bulk indexed ${profiles.length} candidate profiles (${errors?.length || 0} errors) ✓`);
  return profiles.length;
}

function scheduleIndexCandidate(profileOrId) {
  if (!profileOrId) return;
  setImmediate(async () => {
    try {
      if (!esAvailableSync()) {
        const available = await esAvailable();
        if (!available) return;
      }
      await indexCandidate(profileOrId);
    } catch (err) {
      console.error("[ES:async] scheduleIndexCandidate error:", err.message);
    }
  });
}

function scheduleDeleteCandidate(candidateId) {
  if (!candidateId) return;
  setImmediate(async () => {
    try {
      if (!esAvailableSync()) {
        const available = await esAvailable();
        if (!available) return;
      }
      await deleteCandidate(candidateId);
    } catch (err) {
      console.error("[ES:async] scheduleDeleteCandidate error:", err.message);
    }
  });
}

let _candidateReindexTimer = null;
let _isCandidateReindexing = false;

function scheduleReindexCandidates(delayMs = 1500) {
  if (_candidateReindexTimer) clearTimeout(_candidateReindexTimer);

  _candidateReindexTimer = setTimeout(async () => {
    if (_isCandidateReindexing) return;
    _isCandidateReindexing = true;
    try {
      if (!esAvailableSync()) {
        const available = await esAvailable();
        if (!available) return;
      }
      console.log("[ES:sync] Automatically re-indexing candidates in background...");
      const count = await bulkReindexCandidates();
      console.log(`[ES:sync] Automatic candidates re-index complete (${count} candidates synced) ✓`);
    } catch (err) {
      console.error("[ES:sync] Automatic candidates re-index error:", err.message);
    } finally {
      _isCandidateReindexing = false;
    }
  }, delayMs);

  if (_candidateReindexTimer && typeof _candidateReindexTimer.unref === "function") {
    _candidateReindexTimer.unref();
  }
}

module.exports = {
  createJobsIndex,
  indexJob,
  deleteJob,
  searchJobs,
  getSuggestions,
  bulkReindex,
  scheduleIndex,
  scheduleDelete,
  scheduleReindex,
  initJobChangeStream,
  JOBS_INDEX,
  createCandidatesIndex,
  toCandidateEsDoc,
  indexCandidate,
  deleteCandidate,
  searchCandidatesEs,
  bulkReindexCandidates,
  scheduleIndexCandidate,
  scheduleDeleteCandidate,
  scheduleReindexCandidates,
  CANDIDATES_INDEX,
};


