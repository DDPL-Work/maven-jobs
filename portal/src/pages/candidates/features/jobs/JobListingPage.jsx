import React, { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate, Link, useParams } from "react-router-dom";
import {
  FiSearch,
  FiMapPin,
  FiBriefcase,
  FiChevronDown,
  FiFilter,
  FiCheck,
  FiClock,
  FiBookmark,
  FiArrowRight,
  FiTrendingUp,
  FiAward,
  FiInfo,
  FiX,
  FiCheckCircle,
  FiExternalLink,
  FiAlertTriangle,
  FiShield,
} from "react-icons/fi";
import { FaRupeeSign, FaStar } from "react-icons/fa";
import { useAuth } from "../../../../AuthContext";
import LandingFooter from "../../../../components/LandingFooter";
import { TOP_CATEGORIES } from "../../../../data/jobs";
import { usePublicJobs, useLandingHome } from "../../../../hooks/useLandingQueries";
import {
  useSaveJob,
  useCreateApplication,
} from "../../../../hooks/useCandidateMutations";
import { useJobFilters } from "../../../../hooks/useJobFilters";
import authService from "../../../../services/authService";
import ApplicationModal from "../../../../components/application/ApplicationModal";
import mavenLogo from "../../../../../assets/maven-logo-BdiSsfJk.svg";
import "./JobListingPage.css";
import SkeletonPage from "../../../../components/Skeleton";
import formatRelativeTime from "../../../../utils/formatRelativeTime";
import formatCompactCount from "../../../../utils/formatCompactCount";
import computeRelevanceScore from "../../../../utils/computeRelevanceScore";
import AvatarDropdown from "../../../../components/common/AvatarDropdown";
import GlobalSearchForm from "../../../../components/common/GlobalSearchForm";
import CandidateHeader from "../../../../components/common/CandidateHeader";

// Data moved to data/jobs.js
const FILTER_CATEGORIES = [
  { id: "dept", label: "Department" },
  { id: "mode", label: "Work Mode" },
  { id: "loc", label: "Location" },
  { id: "salaryRange", label: "Salary" },
  { id: "type", label: "Company Type" },
];

const fromFilterSlug = (value = "") =>
  String(value || "")
    .replace(/-/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());

const normalizeJobType = (value) => {
  const v = String(value || "")
    .toLowerCase()
    .replace(/[\s_-]+/g, " ");
  if (v.includes("full time") || v === "fulltime") return "Full Time";
  if (v.includes("part time") || v === "parttime") return "Part Time";
  if (v.includes("contract")) return "Contract";
  if (v.includes("intern")) return "Internship";
  if (v.includes("freelance")) return "Freelance";
  if (v.includes("temporary") || v.includes("temp")) return "Temporary";
  return String(value || "")
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
};

const appendUnique = (items, value) => {
  const raw = String(value || "").trim();
  if (!raw) return items;
  const normalized = normalizeJobType(raw);
  return items.some((item) => item.toLowerCase() === normalized.toLowerCase())
    ? items
    : [...items, normalized];
};

export default function JobListingPage() {
  const navigate = useNavigate();
  const { filter: routeFilter = "" } = useParams();
  const [scrolled, setScrolled] = useState(false);
  const [showSort, setShowSort] = useState(false);
  const [backendJobs, setBackendJobs] = useState([]);
  const [backendCompanies, setBackendCompanies] = useState([]);
  const [savedJobs, setSavedJobs] = useState({});
  const [savingJobId, setSavingJobId] = useState("");
  const [activeModal, setActiveModal] = useState(null);
  const [appliedJobs, setAppliedJobs] = useState(() => {
    try {
      const saved = sessionStorage.getItem("appliedJobs");
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });
  const [applyingJobId, setApplyingJobId] = useState("");
  const [quickApplyJob, setQuickApplyJob] = useState(null);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [qaAnswers, setQaAnswers] = useState({});
  const [qaErrors, setQaErrors] = useState({});
  const [qaSubmitting, setQaSubmitting] = useState(false);
  const [showExternalLinkModal, setShowExternalLinkModal] = useState(false);
  const [externalLinkUrl, setExternalLinkUrl] = useState("");
  const [showFollowUpModal, setShowFollowUpModal] = useState(false);
  const [followUpJob, setFollowUpJob] = useState(null);
  const followUpTimerRef = useRef(null);
  const [qaSuccess, setQaSuccess] = useState(false);
  const [draftFilters, setDraftFilters] = useState({});
  const [modalSearch, setModalSearch] = useState("");
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  const {
    filters,
    keyword,
    mergeParams,
    toggleFilter,
    setKeyword,
    clearAll,
    hasActiveFilters,
  } = useJobFilters();

  const currentPage = Number(filters.page) || 1;
  const sortBy = filters.sort || "relevance";
  const JOBS_PER_PAGE = 15;
  const { user, openLogin, openRegister } = useAuth();

  // Build API params from URL search params
  const apiParams = useMemo(() => {
    const params = {};
    if (keyword) params.search = keyword;
    const loc = filters.location;
    if (loc && loc.length > 0) params.location = loc.join(";");
    if (filters.department && filters.department.length > 0) {
      const cleaned = filters.department.filter((d) => {
        const ld = d.toLowerCase();
        return ld !== "all" && ld !== "all domains";
      });
      if (cleaned.length > 0) params.department = cleaned.join(",");
    }
    if (filters.workMode && filters.workMode.length > 0)
      params.workMode = filters.workMode.join(",");
    if (filters.jobType && filters.jobType.length > 0)
      params.jobType = filters.jobType.join(",");
    if (filters.company && filters.company.length > 0)
      params.company = filters.company.join(",");
    if (filters.skills && filters.skills.length > 0)
      params.skills = filters.skills.join(",");
    if (filters.experience && filters.experience.length > 0) {
      let minExp = Infinity,
        maxExp = -Infinity;
      for (const e of filters.experience) {
        const parts = e.split("-").map(Number);
        if (parts.length === 1 || (parts.length === 2 && isNaN(parts[1]))) {
          minExp = Math.min(minExp, parts[0]);
          maxExp = 99;
        } else if (parts.length === 2) {
          minExp = Math.min(minExp, parts[0]);
          maxExp = Math.max(maxExp, parts[1]);
        }
      }
      if (minExp !== Infinity) {
        params.experience =
          maxExp >= 99 ? String(minExp) : `${minExp}-${maxExp}`;
      }
    }
    if (filters.salary) params.salary = filters.salary;
    if (sortBy === "newest") params.sort = sortBy;
    params.page = currentPage;
    params.limit = JOBS_PER_PAGE;
    if (routeFilter && !keyword) params.filter = routeFilter;
    return params;
  }, [keyword, filters, sortBy, currentPage, routeFilter, JOBS_PER_PAGE]);

  const { data: jobsData, isLoading: loadingBackend } =
    usePublicJobs(apiParams);
  const { data: landingData } = useLandingHome();
  const { mutateAsync: saveJobMutation } = useSaveJob(user?._id || user?.id);
  const { mutateAsync: createAppMutation } = useCreateApplication(
    user?._id || user?.id,
  );

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Populate companies — extract from jobs (preserves recency order), merge profile data from landing API
  useEffect(() => {
    const rawJobs = jobsData?.jobs;
    if (!rawJobs?.length) {
      setBackendCompanies([]);
      return;
    }
    // Build a profile lookup from landing API (full company data)
    const profileMap = {};
    if (landingData?.companies?.length) {
      landingData.companies.forEach((c) => {
        const key = (c.name || "").toLowerCase().trim();
        if (key)
          profileMap[key] = {
            id: c._id || c.id,
            logoUrl: c.logoUrl || "",
            color: c.color || "#002366",
            rating: c.rating || 4.0,
            reviews: c.reviews || 0,
          };
      });
    }
    // Extract unique companies from jobs (preserving job order = recency)
    const seen = new Set();
    const companies = [];
    rawJobs.forEach((j) => {
      const companyObj = j.company || j.companyId || {};
      const name =
        typeof companyObj === "object"
          ? companyObj.name || ""
          : j.companyName || j.company || "";
      if (!name || seen.has(name.toLowerCase().trim())) return;
      seen.add(name.toLowerCase().trim());
      const key = name.toLowerCase().trim();
      const profile = profileMap[key] || {};
      companies.push({
        id:
          profile.id ||
          (typeof companyObj === "object"
            ? companyObj._id || companyObj.id
            : null),
        name,
        logoUrl:
          profile.logoUrl ||
          (typeof companyObj === "object"
            ? companyObj.logoUrl || ""
            : j.companyLogoUrl || j.logoUrl || ""),
        logo: name[0],
        color: profile.color || "#002366",
        rating: profile.rating || j.rating || 4.0,
        reviews: profile.reviews || j.reviews || 0,
        activeJobCount: 0,
      });
    });
    // Count jobs per company
    rawJobs.forEach((j) => {
      const companyObj = j.company || j.companyId || {};
      const name =
        typeof companyObj === "object"
          ? companyObj.name || ""
          : j.companyName || j.company || "";
      if (!name) return;
      const found = companies.find(
        (c) => c.name.toLowerCase().trim() === name.toLowerCase().trim(),
      );
      if (found) found.activeJobCount = (found.activeJobCount || 0) + 1;
    });
    setBackendCompanies(companies.slice(0, 8));
  }, [jobsData, landingData]);

  // Sync raw API jobs data into formatted UI state
  useEffect(() => {
    if (!jobsData) {
      setBackendJobs({ jobs: [], total: 0, totalPages: 0 });
      return;
    }
    // Build profile lookup from landing API for logo enrichment
    const profileMap = {};
    if (landingData?.companies?.length) {
      landingData.companies.forEach((c) => {
        const key = (c.name || "").toLowerCase().trim();
        if (key)
          profileMap[key] = {
            logoUrl: c.logoUrl || "",
            color: c.color || "#002366",
          };
      });
    }
    const rawJobs = jobsData.jobs || [];
    const availableFilters = jobsData.availableFilters || null;
    const total = jobsData.total || rawJobs.length;
    const totalPages = jobsData.totalPages || 1;
    const formatted = rawJobs.map((j, i) => {
      const title = j.title || "Senior Engineer";
      const companyObj = j.company || j.companyId || {};
      const company =
        companyObj.name || j.companyName || j.company || "Enterprise Partner";
      const companyLogoUrl =
        companyObj.logoUrl || j.companyLogoUrl || j.logoUrl || "";
      // Enrich with profile data from landing API if available
      const profile = profileMap[company.toLowerCase().trim()] || {};
      const minSal = j.salaryMin || 0;
      const maxSal = j.salaryMax || 0;
      const salStr =
        minSal && maxSal
          ? `${(minSal / 100000).toFixed(0)}–${(maxSal / 100000).toFixed(0)} Lakhs PA`
          : j.salary || "18–28 Lakhs PA";
      const salCat =
        minSal >= 5000000
          ? "50+ Lakhs"
          : minSal >= 2500000
            ? "25+ Lakhs"
            : minSal >= 1500000
              ? "15+ Lakhs"
              : minSal >= 1000000
                ? "10–15 Lakhs"
                : minSal >= 600000
                  ? "6–10 Lakhs"
                  : minSal >= 300000
                    ? "3–6 Lakhs"
                    : "0–3 Lakhs";

      const skills = Array.isArray(j.skills) ? j.skills : [];
      const normalizedSkills = skills.map((skill) =>
        String(skill || "").toLowerCase(),
      );
      const hasSkillAny = (aliases) =>
        aliases.some((alias) =>
          normalizedSkills.some((skill) => skill.includes(alias)),
        );
      const stackTags = [];

      if (
        hasSkillAny(["mongodb", "mongo"]) &&
        hasSkillAny(["express", "express.js"]) &&
        hasSkillAny(["react", "react.js"]) &&
        hasSkillAny(["node", "node.js"])
      ) {
        stackTags.push("MERN Stack");
      }

      if (
        hasSkillAny(["mongodb", "mongo"]) &&
        hasSkillAny(["express", "express.js"]) &&
        hasSkillAny(["angular"]) &&
        hasSkillAny(["node", "node.js"])
      ) {
        stackTags.push("MEAN Stack");
      }

      return {
        id: j._id || j.id || i,
        title,
        company,
        rating: j.rating,
        reviews: j.reviews,
        exp: j.experience || j.exp || "1–4 Yrs",
        salary: salStr,
        salaryMin: j.salaryMin || 0,
        salaryMax: j.salaryMax || 0,
        location: j.location || "Bengaluru",
        posted: formatRelativeTime(j.updatedAt || j.createdAt) || "Recently",
        desc: j.description || j.desc || "No description provided.",
        tags:
          skills.length > 0
            ? [...stackTags, ...skills]
            : ["Full-Time", j.department || "Engineering"],
        logo: j.companyLogo || company[0],
        logoUrl: profile.logoUrl || companyLogoUrl,
        coverUrl: j.companyCoverUrl || companyObj.coverImageUrl || "",
        logoColor: profile.color || "#002366",
        featured: i < 3,
        hasSaved: Boolean(j.hasSaved),
        hasScreeningQuestions: Boolean(j.hasScreeningQuestions),
        screeningQuestions: Array.isArray(j.screeningQuestions)
          ? j.screeningQuestions
          : [],
        hasApplied: Boolean(j.hasApplied),
        dept: j.department || "Engineering",
        mode: j.workplaceType || "Remote",
        loc: j.location || "Bengaluru",
        salaryRange: salCat,
        type: companyObj.type || companyObj.industry || "Corporate",
        date: new Date(j.createdAt || Date.now()).getTime(),
        externalLink: j.externalLink || "",
      };
    });

    if (sortBy === "relevance" && user) {
      formatted.forEach((job, idx) => {
        job._score = computeRelevanceScore(job, rawJobs[idx], user);
      });
      formatted.sort((a, b) => b._score - a._score);
    } else if (sortBy === "top_paid") {
      formatted.forEach((job) => {
        let eff = job.salaryMax || job.salaryMin || 0;
        if (eff === 0) {
          const m = String(job.salary || "").match(/[\d,.]+/g);
          if (m)
            eff =
              Math.max(...m.map((n) => Number(n.replace(/,/g, "")))) * 100000;
        }
        job._effSal = eff;
      });
      formatted.sort((a, b) => b._effSal - a._effSal);
    } else if (sortBy === "newest") {
      formatted.sort((a, b) => b.date - a.date);
    }

    setBackendJobs({ jobs: formatted, total, totalPages });

    // Cache available filters for the sidebar
    if (availableFilters) {
      if (typeof window.__jobListingFilters === "undefined") {
        window.__jobListingFilters = availableFilters;
      }
    }
  }, [jobsData, landingData, sortBy, user]);

  useEffect(() => {
    const arr = Array.isArray(backendJobs?.jobs) ? backendJobs.jobs : [];
    const nextSaved = {};
    arr.forEach((job) => {
      if (job.hasSaved) nextSaved[job.id] = true;
    });
    setSavedJobs(nextSaved);
  }, [backendJobs]);

  const handleClearAll = () => {
    clearAll();
  };

  const openFilterModal = (catId) => {
    const mapped = {};
    FILTER_CATEGORIES.forEach((c) => {
      const urlKey = CATEGORY_URL_MAP[c.id];
      const vals = filters[urlKey];
      if (vals && vals.length > 0) mapped[catId] = [...vals];
    });
    setDraftFilters({ [catId]: [...(filters[CATEGORY_URL_MAP[catId]] || [])] });
    setModalSearch("");
    setActiveModal(catId);
  };

  const toggleDraftFilter = (catId, option) => {
    setDraftFilters((prev) => {
      const cur = prev[catId] || [];
      const updated = cur.includes(option)
        ? cur.filter((o) => o !== option)
        : [...cur, option];
      return { ...prev, [catId]: updated };
    });
  };

  const applyModalFilters = () => {
    if (activeModal && draftFilters[activeModal]) {
      const urlKey = CATEGORY_URL_MAP[activeModal];
      mergeParams({ [urlKey]: draftFilters[activeModal], page: null });
    }
    setActiveModal(null);
    setModalSearch("");
  };

  const clearDraftFilters = () => {
    setDraftFilters({ ...draftFilters, [activeModal]: [] });
  };

  useEffect(() => {
    if (activeModal) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
      setModalSearch("");
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [activeModal]);

  const jobs = Array.isArray(backendJobs?.jobs) ? backendJobs.jobs : [];
  const totalJobs = backendJobs?.total || 0;
  const totalPages = backendJobs?.totalPages || 0;

  // Merge backend hasApplied with user-initiated appliedJobs for zero-flicker rendering
  const computedAppliedJobs = useMemo(() => {
    const result = { ...appliedJobs };
    jobs.forEach((job) => {
      if (job.hasApplied) result[job.id] = true;
    });
    return result;
  }, [appliedJobs, jobs]);

  const displayTopCategories = useMemo(() => {
    const dynamic = [
      ...new Set(
        jobs
          .map((job) => job.dept)
          .filter((d) => {
            if (!d) return false;
            const ld = d.toLowerCase();
            return ld !== "all" && ld !== "all domains";
          }),
      ),
    ]
      .slice(0, 10)
      .map((dept) => `${dept} Jobs`);
    return dynamic.length > 0 ? dynamic : TOP_CATEGORIES;
  }, [jobs]);

  const toCanonicalWorkMode = (mode) => {
    const m = String(mode || "")
      .toLowerCase()
      .trim();
    if (m.includes("remote")) return "Remote";
    if (m.includes("hybrid")) return "Hybrid";
    if (
      m.includes("office") ||
      m.includes("on-site") ||
      m.includes("onsite") ||
      m.includes("on site")
    )
      return "On Site";
    return String(mode || "")
      .trim()
      .replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const toCanonicalLocation = (loc) => {
    if (!loc) return "";
    return String(loc)
      .trim()
      .replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const dedupeLocations = (locs) => {
    const result = [];
    for (const loc of locs) {
      const idx = result.findIndex(
        (r) =>
          (loc.startsWith(r + ",") && loc.length > r.length) ||
          (r.startsWith(loc + ",") && r.length > loc.length),
      );
      if (idx >= 0) {
        if (loc.length > result[idx].length) result[idx] = loc;
      } else {
        result.push(loc);
      }
    }
    return result;
  };

  const availableFilters = jobsData?.availableFilters || null;

  const filterCategories = FILTER_CATEGORIES.map((category) => {
    let options;
    const fromApi = availableFilters;
    if (category.id === "dept") {
      const rawOptions = (
        fromApi?.departments ||
        jobs.reduce((acc, job) => appendUnique(acc, job.dept), [])
      ).filter((d) => {
        const ld = d.toLowerCase();
        return ld !== "all" && ld !== "all domains";
      });
      options = ["All", ...rawOptions];
    } else if (category.id === "mode") {
      options =
        fromApi?.workplaceTypes ||
        jobs.reduce(
          (acc, job) => appendUnique(acc, toCanonicalWorkMode(job.mode)),
          [],
        );
    } else if (category.id === "loc") {
      options = dedupeLocations(
        fromApi?.locations ||
          jobs.reduce(
            (acc, job) =>
              appendUnique(acc, toCanonicalLocation(job.loc || job.location)),
            [],
          ),
      );
    } else if (category.id === "salaryRange") {
      options = jobs.reduce(
        (acc, job) => appendUnique(acc, job.salaryRange),
        [],
      );
    } else if (category.id === "type") {
      options = (
        fromApi?.jobTypes ||
        jobs.reduce((acc, job) => appendUnique(acc, job.type), [])
      ).map(normalizeJobType);
    } else {
      options = [];
    }
    return { ...category, options };
  });

  // Map frontend category IDs to URL param keys
  const CATEGORY_URL_MAP = {
    dept: "department",
    mode: "workMode",
    loc: "location",
    salaryRange: "salary",
    type: "jobType",
  };

  const handleCategoryClick = (cat) => {
    const term = cat.replace(/\s+Jobs$/i, "");
    setKeyword(term);
  };

  const handlePageChange = (page) => {
    mergeParams({ page: String(page) });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSortChange = (value) => {
    mergeParams({ sort: value, page: null });
    setShowSort(false);
  };

  const handleSaveJob = async (job) => {
    if (!user) {
      openLogin();
      return;
    }

    const nextValue = !savedJobs[job.id];
    setSavingJobId(job.id);
    setSavedJobs((current) => ({ ...current, [job.id]: nextValue }));

    try {
      await saveJobMutation({ jobId: job.id, save: nextValue });
    } catch {
      setSavedJobs((current) => ({ ...current, [job.id]: !nextValue }));
    } finally {
      setSavingJobId("");
    }
  };

  useEffect(() => {
    if (Object.keys(appliedJobs).length > 0) {
      sessionStorage.setItem("appliedJobs", JSON.stringify(appliedJobs));
    }
  }, [appliedJobs]);

  const handleQuickApply = async (job) => {
    if (!user) {
      openLogin();
      return;
    }

    if (computedAppliedJobs[job.id]) return;

    const questions = job.screeningQuestions || [];
    if (questions.length > 0) {
      const fullJob = {
        id: job.id,
        title: job.title,
        companyName: job.company,
        companyLogoUrl: job.logoUrl,
        location: job.location,
        screeningQuestions: questions,
      };
      setQuickApplyJob(fullJob);
      setQaAnswers({});
      setQaErrors({});
      setQaSuccess(false);
      setShowApplyModal(true);
      return;
    }

    setApplyingJobId(job.id);
    try {
      const res = await authService.getJobDetail(job.id);
      const remoteQuestions = res?.data?.job?.screeningQuestions || [];
      if (remoteQuestions.length > 0) {
        const fullJob = {
          ...res.data.job,
          companyName: res.data.job.companyName || job.company,
          companyLogoUrl: res.data.job.companyLogoUrl || job.logoUrl,
          location: res.data.job.location || job.location,
          screeningQuestions: remoteQuestions,
        };
        setQuickApplyJob(fullJob);
        setQaAnswers({});
        setQaErrors({});
        setQaSuccess(false);
        setShowApplyModal(true);
        return;
      }
    } catch {
      // fall through to direct submit
    }

    try {
      await createAppMutation({ jobId: job.id, appliedFrom: "QUICK_APPLY" });
      setAppliedJobs((prev) => ({ ...prev, [job.id]: true }));
    } catch (err) {
      const msg =
        typeof err === "string" ? err : err?.message || err?.error || "";
      if (msg.toLowerCase().includes("already applied")) {
        setAppliedJobs((prev) => ({ ...prev, [job.id]: true }));
      }
    } finally {
      setApplyingJobId("");
    }
  };

  const handleQaChange = (qId, value) => {
    setQaAnswers((prev) => ({ ...prev, [qId]: value }));
    if (qaErrors[qId]) {
      setQaErrors((prev) => {
        const next = { ...prev };
        delete next[qId];
        return next;
      });
    }
  };

  const handleQaSubmit = async (e) => {
    e.preventDefault();
    if (!quickApplyJob) return;

    const questions = quickApplyJob.screeningQuestions || [];

    if (questions.length > 0) {
      let isValid = true;
      const newErrors = {};
      questions.forEach((q) => {
        const qid = q._id || q.id;
        const val = qaAnswers[qid];
        if (q.required && (val === undefined || val === null || val === "")) {
          newErrors[qid] = "This question is required";
          isValid = false;
        }
      });
      if (!isValid) {
        setQaErrors(newErrors);
        return;
      }
    }

    setQaSubmitting(true);
    try {
      const answers = questions.map((q) => {
        const qid = q._id || q.id;
        return {
          questionId: qid,
          question: q.question || "",
          answer: qaAnswers[qid] !== undefined ? qaAnswers[qid] : "",
        };
      });

      await createAppMutation({
        jobId: quickApplyJob.id,
        answers,
        appliedFrom: "QUICK_APPLY",
      });

      setAppliedJobs((prev) => ({ ...prev, [quickApplyJob.id]: true }));
      setQaSuccess(true);
      setTimeout(() => {
        setShowApplyModal(false);
        setQuickApplyJob(null);
        setQaSuccess(false);
      }, 2500);
    } catch (err) {
      const msg =
        typeof err === "string" ? err : err?.message || err?.error || "";
      if (msg.toLowerCase().includes("already applied")) {
        setAppliedJobs((prev) => ({ ...prev, [quickApplyJob.id]: true }));
        setQaSuccess(true);
        setTimeout(() => {
          setShowApplyModal(false);
          setQuickApplyJob(null);
        }, 1500);
      }
    } finally {
      setQaSubmitting(false);
    }
  };

  const handleProceedExternal = () => {
    window.open(externalLinkUrl, "_blank", "noopener,noreferrer");
    setShowExternalLinkModal(false);
    if (followUpTimerRef.current) clearTimeout(followUpTimerRef.current);
    followUpTimerRef.current = setTimeout(() => {
      setShowFollowUpModal(true);
    }, 5000);
  };

  const handleAppliedYes = async () => {
    setShowFollowUpModal(false);
    if (followUpJob) {
      setAppliedJobs((prev) => ({ ...prev, [followUpJob.id]: true }));
      try {
        await authService.createApplication({ jobId: followUpJob.id });
      } catch {
        /* already tracked */
      }
    }
  };

  const handleAppliedNo = () => {
    setShowFollowUpModal(false);
    setFollowUpJob(null);
  };

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (followUpTimerRef.current) clearTimeout(followUpTimerRef.current);
    };
  }, []);

  // Popular filter chips for the mobile filter bar (Naukri-style)
  const mobilePopularChips = [
    { section: "jlp-filter-mobile-dept", label: "Department" },
    { section: "jlp-filter-mobile-mode", label: "Work Mode" },
    { section: "jlp-filter-mobile-salaryRange", label: "Salary" },
    { section: "jlp-filter-mobile-loc", label: "Location" },
    { section: "jlp-filter-mobile-experience", label: "Experience" },
  ];
  const chipCounts = {
    "jlp-filter-mobile-dept": (filters.department || []).length,
    "jlp-filter-mobile-mode": (filters.workMode || []).length,
    "jlp-filter-mobile-salaryRange": filters.salary
      ? Array.isArray(filters.salary)
        ? filters.salary.length
        : 1
      : 0,
    "jlp-filter-mobile-loc": (filters.location || []).length,
    "jlp-filter-mobile-experience": (filters.experience || []).length,
  };
  const activeFilterCount =
    Object.values(chipCounts).reduce((sum, n) => sum + n, 0) +
    (filters.jobType || []).length +
    (filters.company || []).length +
    (filters.skills || []).length;

  const openMobileFilters = (section = "") => {
    setIsMobileFiltersOpen(true);
    setTimeout(() => {
      const drawer = document.querySelector(".jlp-sidebar.open");
      const card = drawer?.querySelector(".jlp-filter-card");
      if (drawer) drawer.scrollTop = 0;
      if (card) card.scrollTop = 0;
      if (section) {
        const el = document.getElementById(section);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 200);
  };

  const closeMobileFilters = () => setIsMobileFiltersOpen(false);

  // Lock page scroll while the mobile filter drawer is open
  useEffect(() => {
    if (isMobileFiltersOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isMobileFiltersOpen]);

  return (
    <div className="jlp-root">
      {/* ── Header ── */}
      {/* <header className={`jlp-header${scrolled ? " scrolled" : ""}`}>
        <div className="jlp-header-inner">
          <div className="jlp-header-left">
            <Link to="/">
              <img src={mavenLogo} alt="Maven Jobs" className="jlp-logo" />
            </Link>
          </div>
          <GlobalSearchForm
            variant="header"
            initialKeyword={keyword}
            raised
          />

          <div className="jlp-header-actions">
            <Link
              to="/info"
              state={{ from: "/jobs" }}
              className="jlp-info-btn"
              title="How this page works"
            >
              <FiInfo size={20} strokeWidth={2.5} />
            </Link>
            {user ? (
              <AvatarDropdown />
            ) : (
              <>
                <button className="jlp-btn-login" onClick={openLogin}>
                  Login
                </button>
                <button className="jlp-btn-register" onClick={openRegister}>
                  Register
                </button>
              </>
            )}
          </div>
        </div>
      </header> */}
      <CandidateHeader />

      {/* ── Top Categories Scroll ── */}
      <div className="jlp-top-categories-wrapper">
        <div className="jlp-top-categories-inner">
          <button
            className="jlp-cat-nav jlp-cat-nav--prev"
            onClick={() => {
              const el = document.getElementById("jlp-cat-track");
              if (el) el.scrollBy({ left: -220, behavior: "smooth" });
            }}
            aria-label="Scroll left"
          >
            &#8249;
          </button>

          <div className="jlp-cat-track" id="jlp-cat-track">
            {displayTopCategories.map((cat, idx) => (
              <button
                key={idx}
                className="jlp-top-category-chip"
                onClick={() => handleCategoryClick(cat)}
              >
                {cat}
              </button>
            ))}
          </div>

          <button
            className="jlp-cat-nav jlp-cat-nav--next"
            onClick={() => {
              const el = document.getElementById("jlp-cat-track");
              if (el) el.scrollBy({ left: 220, behavior: "smooth" });
            }}
            aria-label="Scroll right"
          >
            &#8250;
          </button>
        </div>
      </div>

      {/* ── Mobile Filter Bar (Naukri-style) ── */}
      <div className="jlp-mobile-filter-bar">
        <button
          className={`jlp-mobile-filter-btn jlp-mobile-filter-btn--primary${activeFilterCount > 0 ? " active" : ""}`}
          onClick={() => openMobileFilters("")}
        >
          <FiFilter size={14} style={{ flexShrink: 0 }} /> All Filters
          {activeFilterCount > 0 && (
            <span className="jlp-mobile-filter-count">{activeFilterCount}</span>
          )}
        </button>
        {mobilePopularChips.map((chip) => (
          <button
            key={chip.section}
            className={`jlp-mobile-filter-btn${chipCounts[chip.section] > 0 ? " active" : ""}`}
            onClick={() => openMobileFilters(chip.section)}
          >
            {chip.label}
            {chipCounts[chip.section] > 0 && (
              <span className="jlp-mobile-filter-count">
                {chipCounts[chip.section]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Body ── */}
      <div className="jlp-body">
        {/* Left: Filters */}
        <aside className={`jlp-sidebar${isMobileFiltersOpen ? " open" : ""}`}>
          <div className="jlp-filter-card">
            <div className="jlp-filter-header">
              <div className="jlp-filter-title">
                <FiFilter size={16} /> All Filters
              </div>
              <div className="jlp-filter-header-actions">
                {hasActiveFilters && (
                  <button className="jlp-clear-btn" onClick={handleClearAll}>
                    Clear All
                  </button>
                )}
                <button
                  className="jlp-sidebar-close"
                  onClick={closeMobileFilters}
                  aria-label="Close filters"
                >
                  <FiX size={16} />
                </button>
              </div>
            </div>

            {/* Experience — multi-select ranges */}
            <div
              className="jlp-filter-group"
              id="jlp-filter-mobile-experience"
            >
              <div className="jlp-filter-group-label">Experience</div>
              <div className="jlp-filter-options">
                {["0-1", "1-2", "2-5", "5-8", "8-12", "12+"].map((exp) => {
                  const selected = filters.experience || [];
                  const isChecked = selected.includes(exp);
                  return (
                    <div
                      key={exp}
                      className="jlp-filter-option"
                      onClick={() => toggleFilter("experience", exp)}
                    >
                      <div
                        className={`jlp-checkbox${isChecked ? " checked" : ""}`}
                      >
                        {isChecked && <FiCheck strokeWidth={3} size={10} />}
                      </div>
                      <span
                        className={`jlp-option-label${isChecked ? " active" : ""}`}
                      >
                        {exp} {exp === "12+" ? "yrs" : "yr"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {filterCategories.map((cat) => {
              const urlKey = CATEGORY_URL_MAP[cat.id];
              const displayOptions = cat.options.slice(0, 5);
              const hasMore = cat.options.length > 5;
              const selected = filters[urlKey] || [];
              return (
                <div
                  className="jlp-filter-group"
                  key={cat.id}
                  id={`jlp-filter-mobile-${cat.id}`}
                >
                  <div className="jlp-filter-group-label">{cat.label}</div>
                  <div className="jlp-filter-options">
                    {displayOptions.map((opt) => {
                      const isAll = opt === "All" || opt === "All Domain";
                        const isChecked = isAll
                          ? selected.length === 0
                          : selected.some(s => {
                              const S = s.toLowerCase();
                              const O = opt.toLowerCase();
                              if (O === S) return true;
                              if (urlKey === "location" && O.includes(S)) return true;
                              if (urlKey === "jobType" && O.includes(S)) return true;
                              if (urlKey === "department" && O.includes(S)) return true;
                              return false;
                            });
                      return (
                        <div
                          key={opt}
                          className="jlp-filter-option"
                          onClick={() => {
                            if (isAll) {
                              mergeParams({ [urlKey]: [], page: null });
                            } else {
                              toggleFilter(urlKey, opt);
                            }
                          }}
                        >
                          <div
                            className={`jlp-checkbox${isChecked ? " checked" : ""}`}
                          >
                            {isChecked && <FiCheck strokeWidth={3} size={10} />}
                          </div>
                          <span
                            className={`jlp-option-label${isChecked ? " active" : ""}`}
                          >
                            {opt}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  {hasMore && (
                    <button
                      className="jlp-view-more-btn"
                      onClick={() => openFilterModal(cat.id)}
                    >
                      View More
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </aside>
        <div
          className={`jlp-sidebar-overlay${isMobileFiltersOpen ? " open" : ""}`}
          onClick={closeMobileFilters}
        />

        {/* Center: Job Listings */}
        <section className="jlp-center">
          <div className="jlp-results-bar">
            <div>
              <div className="jlp-results-title">
                {loadingBackend ? (
                  <span>Loading Jobs...</span>
                ) : totalJobs > 0 ? (
                  <>
                    {totalJobs} {totalJobs === 1 ? "Job" : "Jobs"} Found
                  </>
                ) : (
                  <span>No Jobs Found</span>
                )}
              </div>
              <div className="jlp-results-sub">
                Recommended based on your preferences
              </div>
            </div>
            <div className="jlp-sort-row">
              <span className="jlp-sort-label">Sort by:</span>
              <div className="jlp-sort-wrapper">
                <button
                  className="jlp-sort-btn"
                  onClick={() => setShowSort(!showSort)}
                >
                  {sortBy === "relevance"
                    ? "Relevance"
                    : sortBy === "newest"
                      ? "Recent"
                      : sortBy === "top_paid"
                        ? "Top Paid"
                        : "Relevance"}{" "}
                  <FiChevronDown size={14} />
                </button>
                {showSort && (
                  <div className="jlp-sort-dropdown">
                    <div onClick={() => handleSortChange("relevance")}>
                      Relevance
                    </div>
                    <div onClick={() => handleSortChange("newest")}>Recent</div>
                    <div onClick={() => handleSortChange("top_paid")}>
                      Top Paid
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {loadingBackend ? (
            <SkeletonPage variant="list" />
          ) : jobs.length > 0 ? (
            jobs.map((job) => (
              <div
                key={job.id}
                className={`jlp-job-card${job.featured ? " featured" : ""}`}
              >
                {job.coverUrl ? (
                  <div
                    className="jlp-card-cover"
                    style={{ backgroundImage: `url(${job.coverUrl})` }}
                  />
                ) : null}
                {job.featured && (
                  <div className="jlp-featured-badge">
                    <FaStar size={12} className="inline mr-1" /> Featured
                  </div>
                )}

                <div className="jlp-card-top">
                  <div
                    className={`jlp-company-logo ${job.logoUrl ? "has-image" : ""}`}
                    style={
                      !job.logoUrl
                        ? {
                            background: job.logoColor || "#002366",
                            color: "#fff",
                          }
                        : undefined
                    }
                  >
                    {job.logoUrl ? (
                      <img src={job.logoUrl} alt={`${job.company} logo`} />
                    ) : (
                      job.logo || job.company[0].toUpperCase()
                    )}
                  </div>
                  <div className="jlp-card-meta">
                    <div className="jlp-job-title">{job.title}</div>
                    <div className="jlp-company-row">
                      <span className="jlp-company-name">{job.company}</span>
                      {job.reviews > 0 && job.rating != null ? (
                        <>
                          <div className="jlp-rating-badge">
                            {job.rating} <FaStar size={9} />
                          </div>
                          <span className="jlp-reviews">
                            {formatCompactCount(job.reviews)} Reviews
                          </span>
                        </>
                      ) : (
                        <span className="jlp-reviews">0 Reviews</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="jlp-card-details">
                  <div className="jlp-detail-item">
                    <div className="jlp-detail-icon">
                      <FiBriefcase size={15} />
                    </div>
                    <span className="jlp-detail-text">{job.exp}</span>
                  </div>
                  <div className="jlp-detail-item">
                    <div className="jlp-detail-icon">
                      <FaRupeeSign size={13} />
                    </div>
                    <span className="jlp-detail-text">{job.salary}</span>
                  </div>
                  <div className="jlp-detail-item">
                    <div className="jlp-detail-icon">
                      <FiMapPin size={15} />
                    </div>
                    <span className="jlp-detail-text">{job.location}</span>
                  </div>
                  <div className="jlp-detail-item">
                    <div className="jlp-detail-icon">
                      <FiClock size={15} />
                    </div>
                    <span className="jlp-detail-text">{job.posted}</span>
                  </div>
                </div>

                <p className="jlp-card-desc">{job.desc}</p>

                <div className="jlp-card-footer">
                  <div className="jlp-tags">
                    {job.tags.map((tag) => (
                      <span key={tag} className="jlp-tag">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <div className="jlp-card-actions">
                    {user ? (
                      <>
                        <button
                          className="jlp-save-btn"
                          aria-label="Save job"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSaveJob(job);
                          }}
                        >
                          <FiBookmark
                            size={17}
                            fill={savedJobs[job.id] ? "currentColor" : "none"}
                          />
                        </button>
                        <div className="jlp-action-buttons">
                          <button
                            className="jlp-view-details-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/job/${job.id}`);
                            }}
                          >
                            View Details
                          </button>
                          {job.externalLink ? (
                            <button
                              className="jlp-quick-apply-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                setExternalLinkUrl(job.externalLink);
                                setFollowUpJob(job);
                                setShowExternalLinkModal(true);
                              }}
                            >
                              <FiExternalLink size={14} /> Company Site
                            </button>
                          ) : (
                            <button
                              className={`jlp-quick-apply-btn${computedAppliedJobs[job.id] ? " applied" : ""}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleQuickApply(job);
                              }}
                              disabled={
                                applyingJobId === job.id ||
                                computedAppliedJobs[job.id]
                              }
                            >
                              {computedAppliedJobs[job.id] ? (
                                <>
                                  <FiCheckCircle size={14} /> Applied
                                </>
                              ) : applyingJobId === job.id ? (
                                "Applying..."
                              ) : (
                                "Quick Apply"
                              )}
                            </button>
                          )}
                        </div>
                      </>
                    ) : (
                      <div
                        className="jlp-action-buttons"
                        style={{ width: "100%" }}
                      >
                        <button
                          className="jlp-view-details-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/job/${job.id}`);
                          }}
                        >
                          View Details
                        </button>
                        {job.externalLink ? (
                          <button
                            className="jlp-quick-apply-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              openLogin();
                            }}
                          >
                            <FiExternalLink size={14} /> Company Site
                          </button>
                        ) : (
                          <button
                            className="jlp-quick-apply-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              openLogin();
                            }}
                          >
                            Login to Apply
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div
              style={{
                textAlign: "center",
                padding: "60px 20px",
                background: "white",
                borderRadius: 20,
                border: "1px solid #E2E8F0",
                color: "#64748B",
              }}
            >
              <FiBriefcase
                size={40}
                style={{ marginBottom: 12, color: "#94A3B8" }}
              />
              <h3
                style={{
                  fontSize: "1.1rem",
                  fontWeight: 700,
                  color: "#0A1628",
                  marginBottom: 6,
                }}
              >
                No matching jobs found
              </h3>
              <p style={{ fontSize: "0.85rem" }}>
                Try adjusting your search terms or clearing the active filters.
              </p>
            </div>
          )}

          {/* Pagination */}
          {!loadingBackend && totalPages > 1 && (
            <div className="jlp-pagination">
              <button
                className="jlp-page-btn nav-btn"
                disabled={currentPage <= 1}
                onClick={() => handlePageChange(currentPage - 1)}
              >
                Previous
              </button>
              <div className="jlp-page-numbers">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (num) => (
                    <button
                      key={num}
                      className={`jlp-page-btn num-btn${currentPage === num ? " active" : ""}`}
                      onClick={() => handlePageChange(num)}
                    >
                      {num}
                    </button>
                  ),
                )}
              </div>
              <button
                className="jlp-page-btn nav-btn"
                disabled={currentPage >= totalPages}
                onClick={() => handlePageChange(currentPage + 1)}
              >
                Next
              </button>
            </div>
          )}
        </section>

        {/* Right: Companies & Trending */}
        <aside className="jlp-right-sidebar">
          <div className="jlp-right-card">
            <div className="jlp-right-card-title">Top Companies Hiring</div>
            <div className="jlp-company-list">
              {backendCompanies.length > 0 ? (
                backendCompanies.slice(0, 3).map((c) => (
                  <div
                    key={c.id || c.name}
                    className="jlp-company-item"
                    onClick={() => c.id && navigate(`/company/${c.id}`)}
                    style={{ cursor: "pointer" }}
                  >
                    <div className="jlp-company-item-left">
                      <div
                        className={`jlp-company-item-logo ${c.logoUrl ? "has-image" : ""}`}
                        style={
                          !c.logoUrl
                            ? {
                                background: c.color || "#002366",
                                color: "white",
                              }
                            : undefined
                        }
                      >
                        {c.logoUrl ? (
                          <img src={c.logoUrl} alt={`${c.name} logo`} />
                        ) : (
                          c.logo || c.name[0].toUpperCase()
                        )}
                      </div>
                      <div>
                        <div className="jlp-company-item-name">{c.name}</div>
                        <div className="jlp-company-item-jobs">
                          {c.activeJobCount || 0} Open Roles
                        </div>
                      </div>
                    </div>
                    <div className="jlp-company-item-arrow">
                      <FiArrowRight size={14} />
                    </div>
                  </div>
                ))
              ) : (
                <div
                  style={{
                    padding: "20px 0",
                    textAlign: "center",
                    color: "#64748B",
                    fontSize: "0.85rem",
                  }}
                >
                  No companies found
                </div>
              )}
            </div>
            <button
              className="jlp-view-all-btn"
              onClick={() => navigate("/companies")}
            >
              View All Companies
            </button>
          </div>

          <div className="jlp-trending-card">
            <div className="jlp-trending-icon">
              <FiTrendingUp />
            </div>
            <div className="jlp-trending-title">Trending Career Paths</div>
            <div className="jlp-trending-desc">
              Roles seeing 40%+ more hiring this quarter.
            </div>
            <div className="jlp-trending-paths">
              {[
                "Data Engineering",
                "Cloud Architecture",
                "Product Operations",
                "AI / ML Engineering",
              ].map((p) => (
                <div
                  key={p}
                  className="jlp-trending-path"
                  onClick={() => setKeyword(p)}
                  style={{ cursor: "pointer" }}
                >
                  <div className="jlp-trending-dot" />
                  {p}
                </div>
              ))}
            </div>
            <div
              style={{
                marginTop: 20,
                paddingTop: 16,
                borderTop: "1px solid var(--border)",
              }}
            >
              <div
                style={{
                  fontSize: "0.82rem",
                  fontWeight: 700,
                  color: "var(--text-primary)",
                  marginBottom: 10,
                }}
              >
                Top 3 Tips While Applying
              </div>
              {[
                { tip: "Tailor your resume to match job keywords", icon: "📄" },
                {
                  tip: "Research the company before the interview",
                  icon: "🔍",
                },
                { tip: "Follow up within 48 hours of applying", icon: "⏰" },
              ].map(({ tip, icon }) => (
                <div
                  key={tip}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 8,
                    marginBottom: 8,
                    fontSize: "0.78rem",
                    color: "var(--text-muted)",
                    lineHeight: 1.5,
                  }}
                >
                  <span style={{ flexShrink: 0 }}>{icon}</span>
                  <span>{tip}</span>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>

      {/* ── Footer ── */}
      <LandingFooter />

      {/* ── Filter Modal ── */}
      {activeModal &&
        (() => {
          const cat = filterCategories.find((c) => c.id === activeModal);
          if (!cat) return null;
          const urlKey = CATEGORY_URL_MAP[cat.id];
          const allOptions = cat.options;
          const selectedSet = new Set(draftFilters[activeModal] || []);
          const filteredOptions = modalSearch
            ? allOptions.filter((opt) =>
                opt.toLowerCase().includes(modalSearch.toLowerCase()),
              )
            : allOptions;
          const selectedCount = selectedSet.size;
          const showSearch = allOptions.length > 8;
          return (
            <div
              className="jlp-modal-overlay"
              onClick={() => {
                setActiveModal(null);
                setModalSearch("");
              }}
            >
              <div
                className="jlp-modal-content"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="jlp-modal-header">
                  <div className="jlp-modal-header-left">
                    <h3 className="jlp-modal-title">{cat.label}</h3>
                    {selectedCount > 0 && (
                      <span className="jlp-modal-selected-badge">
                        {selectedCount} selected
                      </span>
                    )}
                  </div>
                  <div className="jlp-modal-header-right">
                    {selectedCount > 0 && (
                      <button
                        className="jlp-modal-clear-btn"
                        onClick={clearDraftFilters}
                      >
                        Clear
                      </button>
                    )}
                    <button
                      className="jlp-modal-close"
                      onClick={() => {
                        setActiveModal(null);
                        setModalSearch("");
                      }}
                    >
                      ✕
                    </button>
                  </div>
                </div>

                {showSearch && (
                  <div className="jlp-modal-search-wrap">
                    <FiSearch size={15} className="jlp-modal-search-icon" />
                    <input
                      type="text"
                      className="jlp-modal-search"
                      placeholder={`Search ${cat.label.toLowerCase()}...`}
                      value={modalSearch}
                      onChange={(e) => setModalSearch(e.target.value)}
                      autoFocus
                    />
                    {modalSearch && (
                      <button
                        className="jlp-modal-search-clear"
                        onClick={() => setModalSearch("")}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                )}

                <div className="jlp-modal-body">
                  {filteredOptions.length > 0 ? (
                    <div className="jlp-modal-grid">
                      {filteredOptions.map((opt) => {
                        const isAll = opt === "All" || opt === "All Domain";
                          const isChecked = isAll
                            ? (draftFilters[activeModal] || []).length === 0
                            : [...selectedSet].some(s => {
                                const S = s.toLowerCase();
                                const O = opt.toLowerCase();
                                if (O === S) return true;
                                if (activeModal === "loc" && O.includes(S)) return true;
                                if (activeModal === "type" && O.includes(S)) return true;
                                if (activeModal === "dept" && O.includes(S)) return true;
                                return false;
                              });
                        return (
                          <div
                            key={opt}
                            className={`jlp-modal-option${isChecked ? " selected" : ""}`}
                            onClick={() => {
                              if (isAll) {
                                setDraftFilters((prev) => ({
                                  ...prev,
                                  [activeModal]: [],
                                }));
                              } else {
                                toggleDraftFilter(activeModal, opt);
                              }
                            }}
                          >
                            <div
                              className={`jlp-modal-checkbox${isChecked ? " checked" : ""}`}
                            >
                              {isChecked && (
                                <FiCheck strokeWidth={3} size={11} />
                              )}
                            </div>
                            <span
                              className={`jlp-modal-option-label${isChecked ? " active" : ""}`}
                            >
                              {opt}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="jlp-modal-empty">
                      <FiSearch size={28} />
                      <p>
                        No {cat.label.toLowerCase()} match "
                        <strong>{modalSearch}</strong>"
                      </p>
                    </div>
                  )}
                </div>

                <div className="jlp-modal-footer">
                  <div className="jlp-modal-footer-left">
                    {selectedCount > 0 && (
                      <span className="jlp-modal-footer-count">
                        {selectedCount} option{selectedCount > 1 ? "s" : ""}{" "}
                        selected
                      </span>
                    )}
                  </div>
                  <div className="jlp-modal-footer-right">
                    <button
                      className="jlp-modal-cancel-btn"
                      onClick={() => {
                        setActiveModal(null);
                        setModalSearch("");
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      className="jlp-modal-apply-btn"
                      onClick={applyModalFilters}
                    >
                      Apply{selectedCount > 0 ? ` (${selectedCount})` : ""}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

      {/* ── External Link Fraud Warning Modal ── */}
      {showExternalLinkModal && (
        <div
          className="fixed inset-0 z-[10002] flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(6px)" }}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: 20,
              maxWidth: 480,
              width: "90%",
              padding: "36px 32px 28px",
              boxShadow: "0 24px 80px rgba(0,0,0,0.25)",
              fontFamily: "'DM Sans', system-ui, sans-serif",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: 4,
                background: "linear-gradient(90deg, #dc2626, #f59e0b, #dc2626)",
              }}
            />
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 16,
                marginBottom: 20,
              }}
            >
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 16,
                  background: "#fef2f2",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <FiAlertTriangle size={26} color="#dc2626" />
              </div>
              <div>
                <h3
                  style={{
                    fontSize: 18,
                    fontWeight: 800,
                    color: "#0f172a",
                    margin: 0,
                  }}
                >
                  You're leaving MavenJobs
                </h3>
                <p
                  style={{ fontSize: 13, color: "#64748b", margin: "4px 0 0" }}
                >
                  This job posting contains an external link
                </p>
              </div>
            </div>
            <div
              style={{
                background: "#fffbeb",
                border: "1px solid #fde68a",
                borderRadius: 14,
                padding: "16px 18px",
                marginBottom: 24,
              }}
            >
              <div
                style={{ display: "flex", gap: 10, alignItems: "flex-start" }}
              >
                <FiShield
                  size={18}
                  color="#d97706"
                  style={{ flexShrink: 0, marginTop: 1 }}
                />
                <div
                  style={{ fontSize: 13, lineHeight: 1.7, color: "#78350f" }}
                >
                  <strong>Stay safe —</strong> MavenJobs does not verify
                  external job listings. Never share your personal information
                  (bank details, OTPs, passwords) with anyone you don't trust.
                  If something feels off, <strong>close this page</strong> and
                  report the listing to our support team.
                </div>
              </div>
            </div>
            <div
              style={{
                fontSize: 13,
                color: "#475569",
                lineHeight: 1.7,
                marginBottom: 24,
                padding: "0 2px",
              }}
            >
              Click <strong>"Proceed"</strong> to visit{" "}
              <span
                style={{
                  color: "#002366",
                  fontWeight: 600,
                  wordBreak: "break-all",
                  fontSize: 12.5,
                }}
              >
                {externalLinkUrl}
              </span>
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <button
                onClick={() => setShowExternalLinkModal(false)}
                style={{
                  flex: 1,
                  padding: "13px 0",
                  borderRadius: 12,
                  border: "1.5px solid #e2e8f0",
                  background: "#fff",
                  color: "#475569",
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: "pointer",
                  fontFamily: "'DM Sans', system-ui, sans-serif",
                }}
              >
                ← Back
              </button>
              <button
                onClick={handleProceedExternal}
                style={{
                  flex: 1,
                  padding: "13px 0",
                  borderRadius: 12,
                  border: "none",
                  background: "linear-gradient(135deg, #002366, #1a3a6e)",
                  color: "#fff",
                  fontSize: 14,
                  fontWeight: 800,
                  cursor: "pointer",
                  fontFamily: "'DM Sans', system-ui, sans-serif",
                  boxShadow: "0 4px 14px rgba(0,35,102,0.25)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                }}
              >
                Proceed
                <FiExternalLink
                  size={14}
                  style={{ verticalAlign: "middle" }}
                />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Follow-up: Have you applied? ── */}
      {showFollowUpModal && (
        <div
          className="fixed inset-0 z-[10003] flex items-center justify-center"
          style={{
            background: "rgba(0,0,0,0.45)",
            backdropFilter: "blur(4px)",
          }}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: 20,
              maxWidth: 400,
              width: "90%",
              padding: "32px 28px 24px",
              textAlign: "center",
              boxShadow: "0 24px 80px rgba(0,0,0,0.2)",
              fontFamily: "'DM Sans', system-ui, sans-serif",
            }}
          >
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: "50%",
                background: "#ecfdf5",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 16px",
              }}
            >
              <FiCheckCircle size={24} color="#10b981" />
            </div>
            <h3
              style={{
                fontSize: 17,
                fontWeight: 800,
                color: "#0f172a",
                margin: "0 0 6px",
              }}
            >
              Have you applied for this job?
            </h3>
            <p
              style={{
                fontSize: 13,
                color: "#64748b",
                lineHeight: 1.6,
                margin: "0 0 24px",
              }}
            >
              Did you successfully submit your application on the company's
              website?
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={handleAppliedNo}
                style={{
                  flex: 1,
                  padding: "12px",
                  borderRadius: 12,
                  border: "1.5px solid #e2e8f0",
                  background: "#fff",
                  color: "#475569",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                  fontFamily: "'DM Sans', system-ui, sans-serif",
                }}
              >
                No
              </button>
              <button
                onClick={handleAppliedYes}
                style={{
                  flex: 1,
                  padding: "12px",
                  borderRadius: 12,
                  border: "none",
                  background: "#002366",
                  color: "#fff",
                  fontSize: 13,
                  fontWeight: 800,
                  cursor: "pointer",
                  fontFamily: "'DM Sans', system-ui, sans-serif",
                }}
              >
                Yes, I applied
              </button>
            </div>
          </div>
        </div>
      )}

      <ApplicationModal
        isOpen={showApplyModal}
        onClose={() => {
          setShowApplyModal(false);
          setQuickApplyJob(null);
          setQaSuccess(false);
        }}
        job={quickApplyJob}
        user={user}
        answers={qaAnswers}
        errors={qaErrors}
        isSubmitting={qaSubmitting}
        isSuccess={qaSuccess}
        onChange={handleQaChange}
        onSubmit={handleQaSubmit}
      />
    </div>
  );
}
