const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const axios = require("axios");
const crypto = require("crypto");
const streamifier = require("streamifier");
const cloudinary = require("../config/cloudinary");
const asyncHandler = require("../middleware/async.middleware");
const User = require("../models/User");
const Company = require("../models/Company");
const CompanyReview = require("../models/CompanyReview");
const Job = require("../models/Job");
const Application = require("../models/Application");
const CandidateProfile = require("../models/CandidateProfile");
const CandidateNotification = require("../models/CandidateNotification");
const CompanyNotification = require("../models/CompanyNotification");
const notificationService = require("../services/notification.service");
const PackageChangeRequest = require("../models/PackageChangeRequest");
const EventBus = require("../events/EventBus");
const { EVENTS } = require("../events/events");
const Lead = require("../models/Lead");
const CrmUser = require("../models/CrmUser");
const { getZoneFromState } = require("../utils/zone.util");
const {
  loadPackageCatalog,
  applyCompanyPackageSnapshot,
  normalizePackageName,
  resolveCompanyJobLimit,
} = require("../services/package-limit.service");
const {
  buildPackageChangeEffectiveAt,
  formatPackageChangeRequest,
  applyDueApprovedPackageChangesForCompany,
} = require("../services/package-change-request.service");
const OpenAIService = require("../services/openai/OpenAIService");
const { uploadResumeFile } = require("../services/resume-storage.service");
const {
  issueTokenPair,
  setRefreshCookie,
  setAccessCookie,
} = require("../services/auth.service");
const { esAvailable } = require("../config/opensearch");
const esService = require("../services/opensearch.service");
const { scheduleIndex, scheduleDelete } = esService;
const jobReportService = require("../services/job-posting-report.service");
const smsService = require("../services/sms.service");
const emailService = require("../services/email.service");
const EntitlementService = require("../services/commercial/entitlement.service");
const RegistrationOTP = require("../models/RegistrationOTP");
const { buildOTPHtml } = require("../email/templates/layouts");
const CompanySubUser = require("../models/CompanySubUser");
const UserLoginLog = require("../models/UserLoginLog");

const createHttpError = (statusCode, message) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const toTrimmedString = (value) => (typeof value === "string" ? value.trim() : "");

const toSafeNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const APPLICATION_STATUS_ENUM = [
  "APPLIED",
  "SCREENING",
  "SHORTLISTED",
  "INTERVIEW",
  "OFFERED",
  "HIRED",
  "REJECTED",
];

const APPLICATION_STATUS_SET = new Set(APPLICATION_STATUS_ENUM);
const PACKAGE_TYPES = ["STANDARD", "PREMIUM", "ELITE"];

const normalizeApplicationStatus = (value) => {
  const normalized = String(value || "").trim().toUpperCase();
  return APPLICATION_STATUS_SET.has(normalized) ? normalized : "";
};

const toPositiveInteger = (value, fallback, min = 1, max = 100) => {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return Math.max(min, Math.min(max, parsed));
};

const isLikelyPdf = ({ fileName = "", url = "", contentType = "" } = {}) => {
  const normalizedContentType = String(contentType || "").toLowerCase();
  if (normalizedContentType.includes("pdf")) {
    return true;
  }

  const normalizedFileName = String(fileName || "").toLowerCase();
  if (normalizedFileName.endsWith(".pdf")) {
    return true;
  }

  const normalizedUrl = String(url || "").toLowerCase();
  return normalizedUrl.includes(".pdf");
};

const generateUserToken = (id) =>
  jwt.sign({ id, type: "USER" }, process.env.JWT_SECRET, { expiresIn: "7d" });

const formatRelativeTime = (value) => {
  if (!value) {
    return "Unavailable";
  }

  const diffMs = Date.now() - new Date(value).getTime();
  const diffMinutes = Math.max(1, Math.floor(diffMs / 60000));

  if (diffMinutes < 60) {
    return `${diffMinutes} min ago`;
  }

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
  }

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
};

const resolveClientUserAndCompany = async (userId) => {
  const user = await User.findById(userId).select("-password");
  if (!user || !["CLIENT", "RECRUITER"].includes(user.role)) {
    throw createHttpError(403, "Client access required");
  }

  if (!user.companyId) {
    throw createHttpError(403, "No company is linked to this account");
  }

  let company = await Company.findById(user.companyId);
  if (!company) {
    throw createHttpError(404, "Company not found");
  }

  // Ensure company has commercial planSnapshot and services loaded
  if (!company.planSnapshot || !company.planSnapshot.services || company.planSnapshot.services.length === 0) {
    try {
      const Subscription = require("../models/Subscription");
      const activeSub = await Subscription.findOne({ companyId: company._id, status: "ACTIVE" }).sort({ createdAt: -1 });
      if (activeSub && activeSub.entitlementSnapshot && activeSub.entitlementSnapshot.length > 0) {
        company.planSnapshot = {
          planId: activeSub.planId,
          planVersionId: activeSub.planVersionId,
          planName: activeSub.commercialSnapshot?.planName || "Active Plan",
          planType: "SMB",
          validity: activeSub.commercialSnapshot?.validityDays || 30,
          startDate: activeSub.startDate,
          endDate: activeSub.endDate,
          services: activeSub.entitlementSnapshot.map((s) => ({
            productId: s.productId,
            productCode: s.productCode,
            productName: s.productName,
            quantity: s.quantity,
            usedQuantity: 0,
            unit: s.unit,
            validity: s.validityDays,
            features: s.features || [],
          })),
        };
        company.markModified("planSnapshot");
        await company.save();
      } else {
        const PurchaseService = require("../services/commercial/purchase.service");
        await PurchaseService.assignDefaultFreePlan({
          companyId: company._id,
          userId: user._id,
          actor: { id: user._id, role: user.role },
        });
        const refreshedCompany = await Company.findById(company._id);
        if (refreshedCompany) company = refreshedCompany;
      }
    } catch (planInitErr) {
      console.warn("[resolveClientUserAndCompany] Failed to sync planSnapshot:", planInitErr?.message);
    }
  }

  return { user, company };
};

const formatCompanyForClient = (company, options = {}) => {
  const resolvedJobLimit = Number(
    options?.jobLimit !== undefined ? options.jobLimit : company.jobLimit || 0,
  );
  const activeJobCount = Number(company.activeJobCount || 0);

  const isRecruiter = options?.user?.role === "RECRUITER";

  return {
    id: String(company._id),
    clientId: `MV-${String(company._id).slice(-5).toUpperCase()}`,
    name: company.name,
    companyName: company.name,
    logoUrl: isRecruiter ? (options?.user?.avatar || "") : (company.logoUrl || ""),
    coverImageUrl: isRecruiter ? (options?.user?.coverImageUrl || "") : (company.coverImageUrl || ""),
    industry: company.industry || "",
    industryType: company.industry || "",
    about: company.about || "",
    companySize: company.companySize || "",
    employeesCount: company.employeesCount || company.companySize || "",
    foundedYear: company.foundedYear || "",
    tagline: company.tagline || "",
    type: company.type || "",
    companyType: company.type || "",
    contactPerson: company.contactPerson || options?.user?.name || "",
    contactDesignation: company.contactDesignation || company.tagline || "",
    alias: company.alias || "",
    phone1: company.phone || "",
    phone2: company.altPhone || "",
    altPhone: company.altPhone || "",
    tanNumber: company.tanNumber || "",
    gstin: company.gstin || "",
    kycStatus: company.kycStatus || (company.status === "ACTIVE" ? "APPROVED" : (company.status || "PENDING_VERIFICATION")),
    registeredName: company.registeredName || company.name || "",
    addressLabel: company.addressLabel || "Primary Address",
    profileHotVacancies: company.profileHotVacancies || "Standard",
    profileClassifieds: company.profileClassifieds || "Standard",
    jobLiveDurationDays: company.jobLiveDurationDays || 30,
    jobLiveDurations: {
      standard: company.jobLiveDurations?.standard || company.jobLiveDurationDays || 30,
      hotVacancy: company.jobLiveDurations?.hotVacancy || company.jobLiveDurationDays || 30,
      smb: company.jobLiveDurations?.smb || company.jobLiveDurationDays || 30,
      internship: company.jobLiveDurations?.internship || company.jobLiveDurationDays || 30,
    },
    specialties: company.specialties || [],
    perks: company.perks || [],
    linkedIn: company.linkedIn || "",
    status: company.status || "ACTIVE",
    packageType: company.packageType || "STANDARD",
    plan: company.planSnapshot?.planName || company.packageType || "FREE",
    planSnapshot: (() => {
      const now = new Date();
      const planEnd = company.planSnapshot?.endDate || company.packageExpiresAt;
      const isPlanExpired = Boolean(
        (planEnd && new Date(planEnd) < now) ||
        company.commercialStatus === "EXPIRED_GRACE" ||
        company.commercialStatus === "EXPIRED_LOCKED" ||
        (company.commercialStatus === "NO_PLAN" && (planEnd ? new Date(planEnd) < now : true))
      );
      if (!company.planSnapshot) return null;
      const rawSnapshot = typeof company.planSnapshot.toObject === "function" ? company.planSnapshot.toObject() : { ...company.planSnapshot };
      if (isPlanExpired) {
        rawSnapshot.validity = 0;
        rawSnapshot.services = (rawSnapshot.services || []).map((s) => ({
          ...(typeof s.toObject === "function" ? s.toObject() : s),
          quantity: 0,
          usedQuantity: 0,
          validity: 0,
        }));
      }
      return rawSnapshot;
    })(),
    services: (() => {
      const now = new Date();
      const planEnd = company.planSnapshot?.endDate || company.packageExpiresAt;
      const isPlanExpired = Boolean(
        (planEnd && new Date(planEnd) < now) ||
        company.commercialStatus === "EXPIRED_GRACE" ||
        company.commercialStatus === "EXPIRED_LOCKED" ||
        (company.commercialStatus === "NO_PLAN" && (planEnd ? new Date(planEnd) < now : true))
      );
      const rawServices = company.planSnapshot?.services || [];
      if (isPlanExpired) {
        return rawServices.map((s) => ({
          ...(typeof s.toObject === "function" ? s.toObject() : s),
          quantity: 0,
          usedQuantity: 0,
          validity: 0,
        }));
      }
      return rawServices;
    })(),
    jobLimit: resolvedJobLimit,
    activeJobCount,
    remainingSlots: Math.max(resolvedJobLimit - activeJobCount, 0),
    email: company.email || "",
    communicationEmail: company.email || options?.user?.email || "",
    phone: company.phone || "",
    mobileNumber: company.phone || options?.user?.phone || "",
    website: company.website || "",
    websiteUrl: company.website || "",
    accountManager: company.accountManager || "",
    configurationNotes: company.configurationNotes || "",
    location: {
      country: company.location?.country || "India",
      city: company.location?.city || "",
      region: company.location?.region || "",
      state: company.location?.region || "",
      zone: company.location?.zone || "",
      address: company.location?.address || "",
      pincode: company.location?.pincode || "",
    },
    updatedAt: company.updatedAt || null,
    lastUpdated: formatRelativeTime(company.updatedAt),
  };
};

const formatCompanyReview = (review) => ({
  id: String(review._id),
  candidateName: review.candidateName || "Candidate",
  candidateTitle: review.candidateTitle || "Verified employee",
  candidateCity: review.candidateCity || "",
  candidateLogoUrl: "",
  rating: Number(review.rating || 0),
  headline: review.headline || "",
  review: review.review || "",
  isAnonymous: Boolean(review.isAnonymous),
  reactions: Object.fromEntries(review.reactions || new Map()),
  createdAt: review.createdAt || null,
  lastUpdated: formatRelativeTime(review.updatedAt || review.createdAt),
});

const getCandidateIdFromApplication = (application) => {
  if (!application) {
    return "";
  }

  if (application.candidateId?._id) {
    return String(application.candidateId._id);
  }

  if (application.candidateId) {
    return String(application.candidateId);
  }

  return "";
};

const formatApplicationStatusLabel = (status = "") =>
  String(status || "")
    .toLowerCase()
    .split("_")
    .map((segment) => (segment ? `${segment[0].toUpperCase()}${segment.slice(1)}` : ""))
    .join(" ");

const formatCompanyApplication = (application, profileMap = new Map()) => {
  const candidateId = getCandidateIdFromApplication(application);
  const profile = profileMap.get(candidateId);

  return {
    id: String(application._id),
    jobId: application.jobId?._id ? String(application.jobId._id) : String(application.jobId || ""),
    jobTitle: application.jobId?.title || "Unknown job",
    candidateId,
    candidateName: application.candidateId?.name || "Candidate",
    candidateEmail: application.candidateId?.email || "",
    candidateLogoUrl: application.candidateId?.avatar || "",
    candidatePhone: profile?.phone || "",
    candidateCurrentTitle: profile?.currentTitle || "",
    candidateExperience: profile?.totalExperience || "",
    candidateCity: profile?.currentCity || "",
    candidateState: profile?.currentState || "",
    status: normalizeApplicationStatus(application.status) || "APPLIED",
    statusLabel: formatApplicationStatusLabel(application.status || "APPLIED"),
    resumeUrl: application.resumeUrl || profile?.resume?.url || "",
    resumeFileName: application.resumeFileName || profile?.resume?.fileName || "",
    sourceQrToken: application.sourceQrToken || "",
    sourceJobId: application.sourceJobId?._id ? String(application.sourceJobId._id) : String(application.sourceJobId || ""),
    appliedAt: application.createdAt || null,
    updatedAt: application.updatedAt || null,
    lastUpdated: formatRelativeTime(application.updatedAt || application.createdAt),
    appliedFrom: application.appliedFrom || "JOB_DETAILS",
    screeningAnswers: Array.isArray(application.answers)
      ? application.answers.map((a) => ({
          questionId: String(a.questionId || ""),
          question: a.question || "",
          answer: a.answer,
        }))
      : [],
  };
};

const formatPackageChangeRequestForCompany = (request, company) =>
  formatPackageChangeRequest(request, {
    companyName: company?.name || "",
    requestedByName: company?.name || "Client",
  });

const syncCompanyPackageContext = async (company) => {
  const { packageCatalog, packageLimitMap } = await loadPackageCatalog();

  const appliedResult = await applyDueApprovedPackageChangesForCompany(company, packageLimitMap);
  const packageSnapshot = applyCompanyPackageSnapshot(company, packageLimitMap);

  if (appliedResult.updated || packageSnapshot.dirty) {
    await company.save();
  }

  return {
    packageCatalog,
    packageLimitMap,
    packageSnapshot,
    appliedPackageChange: appliedResult?.lastAppliedRequest || null,
  };
};

const uploadCompanyMedia = async (file, { ownerId, kind }) =>
  new Promise((resolve, reject) => {
    const safeKind = kind === "cover" ? "cover" : "logo";
    const folder = safeKind === "cover" ? "company_cover_images" : "company_logo_images";
    const publicId = `company_${safeKind}_${String(ownerId || "client")}_${crypto.randomUUID()}`;
    const transformations =
      safeKind === "cover"
        ? [{ width: 1600, height: 420, crop: "fill", quality: "auto", fetch_format: "auto" }]
        : [{ width: 420, height: 420, crop: "fill", gravity: "face", quality: "auto", fetch_format: "auto" }];

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: "image",
        folder,
        public_id: publicId,
        overwrite: true,
        invalidate: true,
        transformation: transformations,
      },
      (error, result) => {
        if (error) {
          reject(error);
          return;
        }

        resolve({
          url: result?.secure_url || "",
          publicId: result?.public_id || "",
          kind: safeKind,
        });
      },
    );

    streamifier.createReadStream(file.buffer).pipe(uploadStream);
  });

const destroyCompanyMedia = async (publicId) => {
  if (!publicId) {
    return;
  }

  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: "image", invalidate: true });
  } catch (error) {
    console.warn("Company media cleanup failed:", error?.message || error);
  }
};

exports.login = asyncHandler(async (req, res) => {
  const email = toTrimmedString(req.body.email).toLowerCase();
  const password = toTrimmedString(req.body.password);

  if (!email || !password) {
    throw createHttpError(400, "Email and password are required");
  }

  const user = await User.findOne({ email, role: { $in: ["CLIENT", "RECRUITER"] } }).select("+password");
  if (!user) {
    throw createHttpError(401, "Invalid credentials");
  }

  const passwordMatches = await bcrypt.compare(password, user.password);
  if (!passwordMatches) {
    throw createHttpError(401, "Invalid credentials");
  }

  if (!user.isActive || user.accessStatus === "RESTRICTED") {
    throw createHttpError(403, "Client account is inactive");
  }

  const company = user.companyId ? await Company.findById(user.companyId) : null;
  if (!company) {
    throw createHttpError(404, "Company profile not found");
  }

  if (company.status === "INACTIVE") {
    throw createHttpError(403, "Company profile is inactive");
  }

  if (company.status === "PENDING_VERIFICATION" || user.accessStatus === "PENDING_VERIFICATION") {
    throw createHttpError(403, "Your account is currently pending verification by our team. You will be able to log in once approved.");
  }

  const { packageSnapshot } = await syncCompanyPackageContext(company);

  const tokenPair = await issueTokenPair({
    user,
    source: "USER",
    req,
  });

  setRefreshCookie(res, tokenPair.refreshToken);
  setAccessCookie(res, tokenPair.accessToken);

  let recruiterPermissions = null;
  let superUserEmail = null;
  if (user.role === "RECRUITER") {
    const subUser = await CompanySubUser.findOne({ userId: user._id }).lean();
    if (subUser && subUser.permissions) {
      recruiterPermissions = subUser.permissions;
    }
    const clientUser = await User.findOne({ companyId: company._id, role: "CLIENT" }).lean();
    if (clientUser && clientUser.email) {
      superUserEmail = clientUser.email;
    }
  }

  res.status(200).json({
    success: true,
    expiresInSeconds: tokenPair.expiresInSeconds,
    user: {
      id: String(user._id),
      username: user.name || "",
      email: user.email || "",
      role: user.role || "CLIENT",
      companyId: String(company._id),
      companyName: company.name || "",
      permissions: recruiterPermissions,
      superUserEmail: superUserEmail,
    },
    company: formatCompanyForClient(company, { jobLimit: packageSnapshot.jobLimit, user }),
  });

  // Log login event (fire-and-forget)
  UserLoginLog.create({
    userId: user._id,
    companyId: company._id,
    userName: user.name || "",
    userEmail: user.email || "",
    role: user.role,
    event: "LOGIN",
    loginTime: new Date(),
    sessionId: tokenPair.sessionId || "",
    ipAddress: req.ip || req.headers["x-forwarded-for"] || "",
    userAgent: req.headers["user-agent"] || "",
    platform: "WEB",
    timestamp: new Date(),
  }).catch(() => {}); // ignore errors — don't break login flow
});

exports.sendMobileOtp = asyncHandler(async (req, res) => {
  const { phone, countryCode } = req.body;
  if (!phone) throw createHttpError(400, "Phone number is required");
  
  const fullPhone = countryCode ? `${countryCode}${phone}` : phone;
  const sessionId = await smsService.sendOTP(fullPhone);
  res.status(200).json({ success: true, data: { sessionId } });
});

exports.verifyMobileOtp = asyncHandler(async (req, res) => {
  const { phone, countryCode, sessionId, otp } = req.body;
  if (!phone || !sessionId || !otp) throw createHttpError(400, "Phone, sessionId, and OTP are required");

  const isValid = await smsService.verifyOTP(sessionId, otp);
  if (!isValid) throw createHttpError(400, "Invalid OTP");

  const mobileToken = jwt.sign({ phone, countryCode, verified: true }, process.env.JWT_SECRET, { expiresIn: "1h" });
  res.status(200).json({ success: true, data: { mobileToken } });
});

exports.sendEmailOtp = asyncHandler(async (req, res) => {
  const email = toTrimmedString(req.body.email).toLowerCase();
  if (!email) throw createHttpError(400, "Email is required");

  const existingUser = await User.findOne({ email }).select("_id");
  if (existingUser) throw createHttpError(409, "An account already exists for this email");

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const otpHash = await bcrypt.hash(otp, 10);

  await RegistrationOTP.deleteMany({ email });
  await RegistrationOTP.create({
    email,
    otpHash,
    expiresAt: new Date(Date.now() + 3 * 60 * 1000),
  });

  const html = buildOTPHtml({ name: "Employer", otp, purpose: "email verification", expiryMinutes: 3 });
  await emailService.sendEmail({ to: email, subject: "Verify your email - MavenJobs", html });

  res.status(200).json({ success: true, message: "OTP sent" });
});

exports.verifyEmailOtp = asyncHandler(async (req, res) => {
  const email = toTrimmedString(req.body.email).toLowerCase();
  const { otp } = req.body;
  if (!email || !otp) throw createHttpError(400, "Email and OTP are required");

  const record = await RegistrationOTP.findOne({ email });
  if (!record || record.expiresAt < new Date()) {
    throw createHttpError(400, "OTP expired or not found");
  }

  const isValid = await bcrypt.compare(otp, record.otpHash);
  if (!isValid) {
    record.attempts += 1;
    await record.save();
    throw createHttpError(400, "Invalid OTP");
  }

  const emailToken = jwt.sign({ email, verified: true }, process.env.JWT_SECRET, { expiresIn: "1h" });
  await RegistrationOTP.deleteOne({ _id: record._id });

  res.status(200).json({ success: true, data: { emailToken } });
});

exports.getPackages = asyncHandler(async (req, res) => {
  const Package = require("../models/Package");
  const packages = await Package.find().sort({ jobPostingLimit: 1 });
  res.status(200).json({
    success: true,
    data: packages.map(pkg => ({
      id: String(pkg._id),
      name: pkg.name,
      jobPostingLimit: pkg.jobPostingLimit,
      smbJobPostingLimit: pkg.smbJobPostingLimit,
      cvAccessLimit: pkg.cvAccessLimit,
      nviteLimit: pkg.nviteLimit,
      price: pkg.price,
      description: pkg.description || ""
    }))
  });
});

exports.register = asyncHandler(async (req, res) => {
  const fullName = toTrimmedString(req.body.fullName || req.body.name);
  const companyName = toTrimmedString(req.body.companyName);
  const email = toTrimmedString(req.body.email).toLowerCase();
  const password = toTrimmedString(req.body.password);
  const phone = toTrimmedString(req.body.phone);
  const countryCode = toTrimmedString(req.body.countryCode);
  const hiringFor = toTrimmedString(req.body.hiringFor || "company");
  const designation = toTrimmedString(req.body.designation);
  const city = toTrimmedString(req.body.city);
  const country = toTrimmedString(req.body.country) || "India";
  const state = toTrimmedString(req.body.state);
  const address = toTrimmedString(req.body.address);
  const pincode = toTrimmedString(req.body.pincode);
  const employees = toTrimmedString(req.body.employees);

  const { mobileToken, emailToken } = req.body;

  if (!fullName || !companyName || !email || !password || !phone) {
    throw createHttpError(400, "Full name, company name, email, phone, and password are required");
  }

  if (!mobileToken || !emailToken) {
    throw createHttpError(400, "Mobile and Email verification tokens are required. Please verify OTPs first.");
  }

  try {
    const mobileDecoded = jwt.verify(mobileToken, process.env.JWT_SECRET);
    if (mobileDecoded.phone !== phone) throw new Error("Phone mismatch");
    
    const emailDecoded = jwt.verify(emailToken, process.env.JWT_SECRET);
    if (emailDecoded.email !== email) throw new Error("Email mismatch");
  } catch (err) {
    throw createHttpError(400, "Invalid or expired verification tokens. Please verify again.");
  }

  if (!/^\d{10}$/.test(phone)) {
    throw createHttpError(400, "Enter a valid 10 digit mobile number");
  }

  if (password.length < 7 || password.length > 20) {
    throw createHttpError(400, "Password must be between 7 and 20 characters");
  }

  const existingUser = await User.findOne({ email }).select("_id");
  if (existingUser) {
    throw createHttpError(409, "An account already exists for this email");
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  let user = null;
  let company = null;

  try {
    user = await User.create({
      name: fullName,
      email,
      password: hashedPassword,
      role: "CLIENT",
      accessStatus: "PENDING_VERIFICATION",
      isActive: false,
    });

    const primaryDomain = `@${email.split('@')[1]?.toLowerCase()}`;

    company = await Company.create({
      name: companyName,
      tagline: designation || (hiringFor === "consultancy" ? "Consultancy hiring partner" : "Employer account"),
      industry: hiringFor === "consultancy" ? "Consultancy" : "Company",
      email,
      phone,
      countryCode,
      hiringFor,
      location: {
        country,
        region: state,
        city,
        address,
        pincode,
      },
      employeesCount: employees,
      createdByCRM: user._id,
      clientUserId: user._id,
      packageType: "STANDARD",
      status: "PENDING_VERIFICATION",
      configurationNotes: designation ? `Primary contact title: ${designation}` : "",
      allowedDomains: [primaryDomain],
    });

    user.companyId = company._id;
    await user.save();

    // Create the super user record in CompanySubUser
    const CompanySubUser = require("../models/CompanySubUser");
    await CompanySubUser.create({
      userId: user._id,
      companyId: company._id,
      createdBy: user._id,
      isSuperUser: true,
      permissions: {
        jobPosting: true,
        jobBooster: true,
        resdex: true,
      },
    });

    // Auto-assign default Free Plan and save consumed products/services to company profile
    try {
      const PurchaseService = require("../services/commercial/purchase.service");
      await PurchaseService.assignDefaultFreePlan({
        companyId: company._id,
        userId: user._id,
        actor: { id: user._id, email: user.email, role: "CLIENT" },
      });
    } catch (planErr) {
      console.error("[Company Registration] Failed to assign default Free plan:", planErr?.message || planErr);
    }

    // Create a Lead for FSE Verification
    const zone = getZoneFromState(state);
    
    // Find an FSE in this zone (if any)
    let assignedFse = null;
    if (zone) {
      const fse = await CrmUser.findOne({ role: "FSE", territory: zone, isActive: true });
      if (fse) {
        assignedFse = fse._id;
        company.assignedFSE = fse._id;
        await company.save();
      }
    }

    let systemUser = await CrmUser.findOne({ role: "ADMIN" });
    if (!systemUser) {
        systemUser = await CrmUser.findOne(); 
    }

    await Lead.create({
      contactName: fullName,
      companyName: companyName,
      phone: phone,
      email: email,
      businessCategory: "IT & Technology", 
      leadSource: "PORTAL",
      status: "NEW",
      priority: "HIGH",
      city: city || "Unknown",
      state: state || "Unknown",
      address: address || "Unknown",
      pincode: pincode || "",
      clientType: "Standard",
      createdBy: systemUser ? systemUser._id : user._id,
      updatedBy: systemUser ? systemUser._id : user._id,
      assignedTo: assignedFse,
    });

  } catch (error) {
    if (company?._id) {
      await Company.deleteOne({ _id: company._id });
    }
    if (user?._id) {
      await User.deleteOne({ _id: user._id });
    }
    throw error;
  }

  EventBus.emit(EVENTS.RECRUITER_REGISTERED, {
    recruiterId: user._id,
    email: user.email,
    fullName: user.name,
    companyId: company._id,
    companyName: company.name,
  });

  res.status(201).json({
    success: true,
    message: "Your request is received. We will get back to you soon.",
  });
});

exports.getDashboard = asyncHandler(async (req, res) => {
  const { company } = await resolveClientUserAndCompany(req.user._id);
  const { packageCatalog, packageSnapshot, appliedPackageChange } = await syncCompanyPackageContext(company);

  let jobFilter = { companyId: company._id };
  let reviewFilter = { companyId: company._id, status: "PUBLISHED" };
  let followerFilter = { followedCompanyIds: company._id };

  if (req.user.role === "RECRUITER") {
    jobFilter.createdByClient = req.user._id;
    reviewFilter = { _id: null }; // Return empty array for recruiters
    followerFilter = { _id: null }; // Return empty array for recruiters
  }

  const jobs = await Job.find(jobFilter).sort({ updatedAt: -1 });
  const jobIds = jobs.map((j) => j._id);

  let appFilter = { jobId: { $in: jobIds } };
  if (req.user.role === "RECRUITER") {
    // Already scoped by jobIds which are filtered by recruiter above
  }

  const [applications, activePackageRequest, recentPackageRequests, reviews, followers] = await Promise.all([
    Application.find(appFilter)
      .sort({ updatedAt: -1 })
      .populate("jobId", "title")
      .populate("candidateId", "name email avatar"),
    PackageChangeRequest.findOne({
      companyId: company._id,
      $or: [{ status: "PENDING" }, { status: "APPROVED", appliedAt: null }],
    })
      .sort({ createdAt: -1 })
      .select(
        "currentPackageType requestedPackageType currentJobLimit requestedJobLimit status isUpgrade reason decisionNote effectiveAt appliedAt reviewedAt createdAt updatedAt",
      ),
    PackageChangeRequest.find({ companyId: company._id })
      .sort({ createdAt: -1 })
      .limit(6)
      .select(
        "currentPackageType requestedPackageType currentJobLimit requestedJobLimit status isUpgrade reason decisionNote effectiveAt appliedAt reviewedAt createdAt updatedAt",
      ),
    CompanyReview.find(reviewFilter)
      .sort({ createdAt: -1 })
      .limit(20)
      .populate("candidateId", "name email")
      .select("candidateName candidateTitle candidateCity rating headline review isAnonymous createdAt updatedAt reactions candidateId"),

    CandidateProfile.find(followerFilter)
      .sort({ updatedAt: -1 })
      .limit(20)
      .populate("userId", "name email")
      .select("userId phone currentTitle totalExperience currentCity currentState updatedAt"),
  ]);

  const reviewUserIds = reviews.map((r) => r.candidateId?._id || r.candidateId).filter(Boolean);
  const reviewProfilePics = reviewUserIds.length
    ? await CandidateProfile.find({ userId: { $in: reviewUserIds } })
        .select("userId profilePic.url")
        .lean()
        .then((profiles) => new Map(profiles.map((p) => [String(p.userId), p.profilePic?.url || ""])))
    : new Map();

  const candidateIds = [
    ...new Set(
      applications
        .map((item) => (item.candidateId?._id ? String(item.candidateId._id) : String(item.candidateId || "")))
        .filter(Boolean),
    ),
  ];

  const candidateProfiles = candidateIds.length
    ? await CandidateProfile.find({ userId: { $in: candidateIds } }).select(
        "userId phone currentTitle totalExperience currentCity currentState resume",
      )
    : [];

  const profileMap = new Map(
    candidateProfiles.map((profile) => [String(profile.userId), profile]),
  );

  const applicationCountByJob = new Map();
  applications.forEach((application) => {
    const jobId = application.jobId?._id ? String(application.jobId._id) : String(application.jobId || "");
    if (!jobId) {
      return;
    }
    applicationCountByJob.set(jobId, Number(applicationCountByJob.get(jobId) || 0) + 1);
  });

  const jobRows = jobs.map((job) => ({
    id: String(job._id),
    title: job.title || "",
    summary: job.summary || "",
    description: job.description || "",
    department: job.department || "",
    location: job.location || "",
    experience: job.experience || "",
    approvalStatus: job.approvalStatus || "PENDING",
    rejectionReason: job.rejectionReason || "",
    isActive: Boolean(job.isActive),
    createdBySource: job.createdBySource || "CLIENT",
    requiresPackageOverride: Boolean(job.requiresPackageOverride),
    applicantCount: Number(applicationCountByJob.get(String(job._id)) || 0),
    createdAt: job.createdAt || null,
    updatedAt: job.updatedAt || null,
    lastUpdated: formatRelativeTime(job.updatedAt),
    salaryMin: job.salaryMin || 0,
    salaryMax: job.salaryMax || 0,
    skills: Array.isArray(job.skills) ? job.skills : [],
    workplaceType: job.workplaceType || "",
    jobType: job.jobType || "",
    externalLink: job.externalLink || "",
    deadline: job.deadline || null,
  }));

  const applicationRows = applications.map((application) => {
    return formatCompanyApplication(application, profileMap);
  });

  const approvedJobs = jobs.filter((job) => job.approvalStatus === "APPROVED");
  const pendingJobs = jobs.filter((job) => job.approvalStatus === "PENDING");
  const rejectedJobs = jobs.filter((job) => job.approvalStatus === "REJECTED");

  const nextActiveJobCount = approvedJobs.filter((job) => job.isActive).length;
  const shouldPersist =
    packageSnapshot.dirty ||
    Number(company.activeJobCount || 0) !== nextActiveJobCount ||
    Number(company.openRoles || 0) !== nextActiveJobCount;

  company.activeJobCount = nextActiveJobCount;
  company.openRoles = company.activeJobCount;
  if (shouldPersist) {
    await company.save();
  }

  res.status(200).json({
    success: true,
    data: {
      company: formatCompanyForClient(company, { jobLimit: packageSnapshot.jobLimit, user: req.user }),
      packageCatalog,
      packageChange: {
        activeRequest: activePackageRequest
          ? formatPackageChangeRequestForCompany(activePackageRequest, company)
          : null,
        recentRequests: recentPackageRequests.map((item) =>
          formatPackageChangeRequestForCompany(item, company),
        ),
        lastAppliedRequest: appliedPackageChange
          ? formatPackageChangeRequestForCompany(appliedPackageChange, company)
          : null,
        canRequestNewChange: !activePackageRequest,
      },
      reviews: reviews.map((item) => {
        const fr = formatCompanyReview(item);
        const uid = String(item.candidateId?._id || item.candidateId || "");
        fr.candidateLogoUrl = reviewProfilePics.get(uid) || item.candidateId?.avatar || "";
        return fr;
      }),
      tracking: {
        totalJobs: jobs.length,
        activeApprovedJobs: approvedJobs.filter((job) => job.isActive).length,
        pendingApprovals: pendingJobs.length,
        rejectedJobs: rejectedJobs.length,
        packageOverflowRequests: pendingJobs.filter((job) => job.requiresPackageOverride).length,
        totalApplications: applications.length,
        uniqueCandidates: candidateIds.length,
        followers: followers.length,
      },
      jobs: jobRows,
      applications: applicationRows,
      followers: followers.map((profile) => ({
        candidateId: String(profile.userId?._id || profile.userId || ""),
        candidateName: profile.userId?.name || "Candidate",
        candidateEmail: profile.userId?.email || "",
        candidatePhone: profile.phone || "",
        candidateCurrentTitle: profile.currentTitle || "",
        candidateExperience: profile.totalExperience || "",
        candidateCity: profile.currentCity || "",
        candidateState: profile.currentState || "",
        followedAt: profile.updatedAt || null,
        lastUpdated: formatRelativeTime(profile.updatedAt),
      })),
    },
  });
});

exports.toggleReviewReaction = asyncHandler(async (req, res) => {
  const { reviewId, reaction } = req.body;
  if (!reviewId || !reaction) {
    throw createHttpError(400, "reviewId and reaction are required");
  }
  const validReactions = ["helpful", "love", "great", "insight"];
  if (!validReactions.includes(reaction)) {
    throw createHttpError(400, `Invalid reaction. Must be one of: ${validReactions.join(", ")}`);
  }
  const review = await CompanyReview.findById(reviewId);
  if (!review) {
    throw createHttpError(404, "Review not found");
  }
  const key = `reactions.${reaction}`;
  const current = review.reactions?.get(reaction) || 0;
  review.reactions.set(reaction, current + 1);
  await review.save();
  res.status(200).json({
    success: true,
    data: { reactions: Object.fromEntries(review.reactions) },
  });
});

exports.updateAbout = asyncHandler(async (req, res) => {
  const { company } = await resolveClientUserAndCompany(req.user._id);
  const about = toTrimmedString(req.body.about);
  const website = toTrimmedString(req.body.website);
  const companySize = toTrimmedString(req.body.companySize);
  const industry = toTrimmedString(req.body.industry);

  if (!about) {
    throw createHttpError(400, "About text is required");
  }

  company.about = about;
  if (website) company.website = website;
  if (companySize) company.companySize = companySize;
  if (industry) company.industry = industry;

  await company.save();
  const { packageSnapshot } = await syncCompanyPackageContext(company);

  res.status(200).json({
    success: true,
    message: "About section updated successfully",
    data: {
      company: formatCompanyForClient(company, { jobLimit: packageSnapshot.jobLimit, user }),
    },
  });
});

exports.createJob = asyncHandler(async (req, res) => {
  const { user, company } = await resolveClientUserAndCompany(req.user._id);
  const { packageSnapshot } = await syncCompanyPackageContext(company);

  if (company.status === "INACTIVE") {
    throw createHttpError(403, "Company profile is inactive");
  }

  // Plan Expiration Check (Q3.7)
  if (company.planSnapshot?.endDate && new Date(company.planSnapshot.endDate) < new Date()) {
    throw createHttpError(403, "Your plan subscription has expired. You can view existing jobs in read-only mode, but cannot post new jobs until renewal.");
  }

  const title = toTrimmedString(req.body.title);
  if (!title) {
    throw createHttpError(400, "Job title is required");
  }

  const jobCategory = toTrimmedString(req.body.jobCategory) || "standard";

  // City count validation: dynamically resolve maxCities for Hot Vacancy from company plan / entitlement
  let locationStr = toTrimmedString(req.body.location);
  const citiesList = Array.isArray(req.body.cities)
    ? req.body.cities.map((c) => toTrimmedString(c)).filter(Boolean)
    : (locationStr.includes(",") ? locationStr.split(",").map((c) => toTrimmedString(c)).filter(Boolean) : [locationStr].filter(Boolean));

  let hotMaxCities = 1;
  const hotPlanSvc = company.planSnapshot?.services?.find(
    (s) => String(s.productCode).toUpperCase() === "HOT_VACANCY"
  );
  if (hotPlanSvc && Array.isArray(hotPlanSvc.features)) {
    const mcFeat = hotPlanSvc.features.find((f) => f.key === "multipleCities");
    if (mcFeat && mcFeat.enabled !== false) {
      hotMaxCities = Math.max(1, Number(mcFeat.value) || 3);
    }
  } else {
    try {
      const Entitlement = require("../models/Entitlement");
      const hotEnt = await Entitlement.findOne({
        companyId: company._id,
        productCode: "HOT_VACANCY",
        status: "ACTIVE",
        expiryDate: { $gte: new Date() },
      }).lean();
      if (hotEnt && Array.isArray(hotEnt.features)) {
        const mcFeat = hotEnt.features.find((f) => f.key === "multipleCities");
        if (mcFeat && mcFeat.enabled !== false) {
          hotMaxCities = Math.max(1, Number(mcFeat.value) || 3);
        }
      }
    } catch (_) {}
  }

  const companyCity = toTrimmedString(company.location?.city);

  if (jobCategory === "management" || jobCategory === "standard") {
    if (citiesList.length > 1) {
      throw createHttpError(
        400,
        "SMB Jobs allow only 1 city (from your company profile). Upgrade to Hot Vacancy to post across multiple cities."
      );
    }
    locationStr = citiesList[0] || companyCity || locationStr;
  } else if (jobCategory === "hot") {
    if (citiesList.length > hotMaxCities) {
      throw createHttpError(400, `Hot Vacancies on your plan allow up to ${hotMaxCities} cities maximum.`);
    }
    if (Array.isArray(req.body.cities) && citiesList.length > 0) {
      locationStr = citiesList.slice(0, hotMaxCities).join(", ");
    }
  }

  // Category mapping to commercial products
  const targetProductCode =
    jobCategory === "management"
      ? "SMB_JOB"
      : jobCategory === "hot"
      ? "HOT_VACANCY"
      : jobCategory === "internship"
      ? "INTERNSHIP_JOB"
      : "JOB_POSTING";

  const categoryLabel =
    jobCategory === "management"
      ? "SMB Job"
      : jobCategory === "hot"
      ? "Hot Vacancy"
      : jobCategory === "internship"
      ? "Internship"
      : "Standard Job";

  // Count active jobs by category
  const [activeApprovedCount, activeSmbCount, activeHotCount, activeInternshipCount] = await Promise.all([
    Job.countDocuments({ companyId: company._id, isActive: true, jobCategory: { $nin: ["management", "hot", "internship"] } }),
    Job.countDocuments({ companyId: company._id, isActive: true, jobCategory: "management" }),
    Job.countDocuments({ companyId: company._id, isActive: true, jobCategory: "hot" }),
    Job.countDocuments({ companyId: company._id, isActive: true, jobCategory: "internship" }),
  ]);

  // Plan Expiry Check (Q3.7): Expired companies in read-only grace or locked status cannot post new jobs
  if (company.commercialStatus === "EXPIRED_GRACE" || company.commercialStatus === "EXPIRED_LOCKED") {
    const error = createHttpError(
      402,
      "Your plan has expired. You are currently in a read-only grace period and cannot post new jobs. Please renew your plan to post jobs."
    );
    error.code = "PLAN_EXPIRED";
    throw error;
  }

  let hasCommercialEntitlement = false;
  let entitlementCodeToConsume = null;

  try {
    const entCheck = await EntitlementService.checkEntitlement(company._id, targetProductCode, 1);
    if (entCheck.allowed) {
      hasCommercialEntitlement = true;
      entitlementCodeToConsume = targetProductCode;
    } else if (jobCategory === "standard") {
      const genericCheck = await EntitlementService.checkEntitlement(company._id, "JOB_POSTING", 1);
      if (genericCheck.allowed) {
        hasCommercialEntitlement = true;
        entitlementCodeToConsume = "JOB_POSTING";
      }
    }
  } catch (err) {
    // Entitlement check failed or none found
  }

  let matchingPlanService = null;

  if (!hasCommercialEntitlement) {
    const now = new Date();
    const isPlanSnapshotExpired = Boolean(company.planSnapshot?.endDate && new Date(company.planSnapshot.endDate) < now);

    if (isPlanSnapshotExpired) {
      const error = createHttpError(402, "Your plan validity has ended. Please renew your plan to post new jobs.");
      error.code = "PLAN_EXPIRED";
      throw error;
    }

    if (company.planSnapshot && Array.isArray(company.planSnapshot.services)) {
      matchingPlanService = company.planSnapshot.services.find(
        (s) =>
          String(s.productCode).toUpperCase() === targetProductCode ||
          (targetProductCode === "SMB_JOB" && String(s.productCode).toUpperCase().includes("SMB")) ||
          (targetProductCode === "HOT_VACANCY" && String(s.productCode).toUpperCase().includes("HOT")) ||
          (targetProductCode === "INTERNSHIP_JOB" && String(s.productCode).toUpperCase().includes("INTERN")) ||
          (targetProductCode === "JOB_POSTING" && (String(s.productCode).toUpperCase().includes("JOB") || String(s.category).toUpperCase() === "JOB_POSTING"))
      );

      if (!matchingPlanService) {
        throw createHttpError(403, `Your active plan does not include ${categoryLabel} postings. Please upgrade your plan or purchase credits.`);
      }

      let catActive = 0;
      if (jobCategory === "management") catActive = activeSmbCount;
      else if (jobCategory === "hot") catActive = activeHotCount;
      else if (jobCategory === "internship") catActive = activeInternshipCount;
      else catActive = activeApprovedCount;

      const usedCount = Math.max(matchingPlanService.usedQuantity || 0, catActive);
      const limit = Number(matchingPlanService.quantity || 0);

      if (limit <= 0 || usedCount >= limit) {
        throw createHttpError(403, `Your credits for ${categoryLabel} postings are exhausted (limit: ${limit}). Please upgrade your plan.`);
      }
    } else {
      if (jobCategory === "management") {
        const smbLimit = Number(packageSnapshot.smbJobPostingLimit || 0);
        if (smbLimit <= 0 || activeSmbCount >= smbLimit) {
          throw createHttpError(403, "Your plan does not allow more SMB job postings. Please upgrade your package.");
        }
      } else if (jobCategory === "hot") {
        const hotLimit = Number(packageSnapshot.hotVacancyLimit || 0);
        if (hotLimit <= 0 || activeHotCount >= hotLimit) {
          throw createHttpError(403, "Your plan does not allow Hot Vacancy postings. Please upgrade your package.");
        }
      } else if (jobCategory === "internship") {
        const internLimit = Number(packageSnapshot.internshipLimit || 0);
        if (internLimit <= 0 || activeInternshipCount >= internLimit) {
          throw createHttpError(403, "Your plan does not allow Internship postings. Please upgrade your package.");
        }
      } else {
        const standardLimit = Number(packageSnapshot.jobPostingLimit || packageSnapshot.jobLimit || 0);
        if (standardLimit <= 0 || activeApprovedCount >= standardLimit) {
          throw createHttpError(403, "Your plan does not allow more standard job postings. Please upgrade your package.");
        }
      }
    }
  }

  const hasAvailablePackageSlot = true; // Limits are strictly enforced above, so if we reach here, it's true.

  const rawSkills = Array.isArray(req.body.skills)
    ? req.body.skills
    : String(req.body.skills || "")
        .split(",")
        .map((skill) => skill.trim())
        .filter(Boolean);

  const deadlineInput = toTrimmedString(req.body.deadline);
  const deadline = deadlineInput ? new Date(deadlineInput) : null;
  if (deadlineInput && Number.isNaN(deadline?.getTime())) {
    throw createHttpError(400, "Deadline must be a valid date");
  }

  const stipend = req.body.stipend !== undefined
    ? toSafeNumber(req.body.stipend, 0)
    : (jobCategory === "internship" ? toSafeNumber(req.body.salaryMin, 0) : undefined);
  const internshipDuration = toTrimmedString(req.body.internshipDuration);
  const internshipStartDate = toTrimmedString(req.body.internshipStartDate);

  // Resolve live duration days configured for this product (SMB Job, Hot Vacancy, Internship)
  // Priority:
  // 1. Explicit request payload liveDurationDays
  // 2. Company profile configured duration (per category or company.jobLiveDurationDays)
  // 3. Matching plan service / snapshot validity
  // 4. Product master validity
  let liveDurationDays = 30;
  if (req.body.liveDurationDays && Number(req.body.liveDurationDays) > 0) {
    liveDurationDays = Number(req.body.liveDurationDays);
  } else if (company.jobLiveDurations) {
    if (jobCategory === "hot" && company.jobLiveDurations.hotVacancy) {
      liveDurationDays = Number(company.jobLiveDurations.hotVacancy) || 30;
    } else if (jobCategory === "management" && company.jobLiveDurations.smb) {
      liveDurationDays = Number(company.jobLiveDurations.smb) || 30;
    } else if (jobCategory === "internship" && company.jobLiveDurations.internship) {
      liveDurationDays = Number(company.jobLiveDurations.internship) || 30;
    } else if (company.jobLiveDurations.standard) {
      liveDurationDays = Number(company.jobLiveDurations.standard) || 30;
    }
  } else if (company.jobLiveDurationDays) {
    liveDurationDays = Number(company.jobLiveDurationDays) || 30;
  } else if (matchingPlanService && matchingPlanService.validity) {
    liveDurationDays = Number(matchingPlanService.validity) || 30;
  } else {
    try {
      const Product = require("../models/Product");
      const prodRecord = await Product.findOne({ code: targetProductCode }).select("validity").lean();
      if (prodRecord && prodRecord.validity) {
        liveDurationDays = Number(prodRecord.validity) || 30;
      }
    } catch (_) {}
  }
  const liveUntil = new Date(Date.now() + liveDurationDays * 24 * 60 * 60 * 1000);

  const job = await Job.create({
    companyId: company._id,
    title,
    summary: toTrimmedString(req.body.summary),
    department: toTrimmedString(req.body.department),
    jobType: toTrimmedString(req.body.jobType),
    jobCategory,
    isHotVacancy: jobCategory === "hot",
    workplaceType: toTrimmedString(req.body.workplaceType),
    location: locationStr || toTrimmedString(req.body.location),
    cities:
      jobCategory === "hot"
        ? citiesList.slice(0, hotMaxCities)
        : locationStr
        ? [locationStr]
        : citiesList[0]
        ? [citiesList[0]]
        : [],
    experience: toTrimmedString(req.body.experience),
    salaryMin: toSafeNumber(req.body.salaryMin, stipend !== undefined ? stipend : 0),
    salaryMax: toSafeNumber(req.body.salaryMax, stipend !== undefined ? stipend : 0),
    stipend: stipend !== undefined ? stipend : undefined,
    internshipDuration,
    internshipStartDate,
    skills: rawSkills,
    deadline: deadline || liveUntil,
    liveDurationDays,
    liveUntil,
    description: toTrimmedString(req.body.description),           // Role Description
    responsibilities: toTrimmedString(req.body.responsibilities), // Key Responsibilities
    qualifications: toTrimmedString(req.body.qualifications),     // Required Skills & Qualifications

    externalLink: toTrimmedString(req.body.externalLink),
    approvalStatus: hasAvailablePackageSlot ? "APPROVED" : "PENDING",
    rejectionReason: "",
    createdBySource: "CLIENT",
    createdByClient: user._id,
    publishedByCRMAt: hasAvailablePackageSlot ? new Date() : null,
    packageSlotCount: hasAvailablePackageSlot ? 1 : 0,
    requiresPackageOverride: !hasAvailablePackageSlot,
    isActive: hasAvailablePackageSlot,
    screeningQuestions: Array.isArray(req.body.screeningQuestions)
      ? req.body.screeningQuestions.map((sq, idx) => ({
          question: String(sq.question || "").trim(),
          type: String(sq.type || "TEXT").toUpperCase(),
          required: sq.required !== false,
          options: Array.isArray(sq.options) ? sq.options.map((o) => String(o).trim()).filter(Boolean) : [],
          maxLength: Number(sq.maxLength) || 500,
          order: Number(sq.order) ?? idx,
        }))
      : [],
  });

  // Consume commercial entitlement credit if applicable
  if (hasCommercialEntitlement && entitlementCodeToConsume) {
    try {
      await EntitlementService.consumeCredit({
        companyId: company._id,
        productCode: entitlementCodeToConsume,
        quantity: 1,
        referenceType: "Job",
        referenceId: job._id.toString(),
        actor: { id: user._id, email: user.email, role: "CLIENT" },
        notes: `Posted ${categoryLabel}: ${job.title}`,
      });
    } catch (consumeErr) {
      console.error("[Commercial Entitlement] Failed to consume job credit:", consumeErr.message);
    }
  }

  // Deduct / update used credit on company planSnapshot services
  if (company.planSnapshot && Array.isArray(company.planSnapshot.services)) {
    const sToUpdate = matchingPlanService || company.planSnapshot.services.find(
      (s) =>
        String(s.productCode).toUpperCase() === targetProductCode ||
        (targetProductCode === "SMB_JOB" && String(s.productCode).toUpperCase().includes("SMB")) ||
        (targetProductCode === "HOT_VACANCY" && String(s.productCode).toUpperCase().includes("HOT")) ||
        (targetProductCode === "INTERNSHIP_JOB" && String(s.productCode).toUpperCase().includes("INTERN")) ||
        (targetProductCode === "JOB_POSTING" && (String(s.productCode).toUpperCase().includes("JOB") || String(s.category).toUpperCase() === "JOB_POSTING"))
    );
    if (sToUpdate) {
      sToUpdate.usedQuantity = (sToUpdate.usedQuantity || 0) + 1;
      company.markModified("planSnapshot");
    }
  }

  const nextActiveCount = hasAvailablePackageSlot ? activeApprovedCount + 1 : activeApprovedCount;
  const shouldPersist =
    packageSnapshot.dirty ||
    Number(company.activeJobCount || 0) !== nextActiveCount ||
    Number(company.openRoles || 0) !== nextActiveCount;

  company.activeJobCount = nextActiveCount;
  company.openRoles = company.activeJobCount;
  if (shouldPersist) {
    await company.save();
  }

  if (hasAvailablePackageSlot) {
    EventBus.emit(EVENTS.RECRUITER_JOB_POSTED, {
      email: user.email,
      jobTitle: job.title,
      jobId: job._id,
    });

    notificationService.sendCompanyNotification({
      companyId: company._id,
      recipientUserId: user._id,
      jobId: job._id,
      title: "Job Posted Successfully",
      message: `Your job "${job.title}" has been successfully posted.`,
      category: "JOB",
      actionUrl: `/employer/job-responses`,
    }).catch(() => {});

    // Async incremental ES index — fires after response is sent
    scheduleIndex(job);
  }

  require("../services/recruiter-activity.service").fireAndForget({
    companyId: company._id,
    recruiter: user,
    action: "JOB_POSTED",
    text: `Posted job **${job.title}**${
      hasAvailablePackageSlot ? "" : " (pending CRM approval)"
    }`,
    metadata: {
      jobId: job._id,
      jobTitle: job.title,
      approvalStatus: job.approvalStatus,
      location: job.location || "",
    },
  });

  // Log JOB_POST to JobPostingReportLog for report generation
  jobReportService.fireAndForgetJobEvent({
    companyId: company._id,
    user,
    job,
    actionType: "JOB_POST",
    expense: 0,
    metadata: { approvalStatus: job.approvalStatus },
  });

  res.status(201).json({
    success: true,
    message: hasAvailablePackageSlot
      ? "Job posted successfully."
      : "Package limit reached. Job has been sent to CRM for approval.",
    data: {
      id: String(job._id),
      title: job.title,
      approvalStatus: job.approvalStatus,
      requiresPackageOverride: job.requiresPackageOverride,
      isActive: job.isActive,
      createdAt: job.createdAt,
    },
  });
});

exports.updateJob = asyncHandler(async (req, res) => {
  const { company } = await resolveClientUserAndCompany(req.user._id);
  const jobId = toTrimmedString(req.params.id);

  if (!jobId) {
    throw createHttpError(400, "Job ID is required");
  }

  const job = await Job.findOne({ _id: jobId, companyId: company._id });
  if (!job) {
    throw createHttpError(404, "Job not found");
  }

  if (req.body.title !== undefined) job.title = toTrimmedString(req.body.title);
  if (req.body.department !== undefined) job.department = toTrimmedString(req.body.department);
  if (req.body.location !== undefined) job.location = toTrimmedString(req.body.location);
  if (req.body.cities !== undefined) {
    const cList = Array.isArray(req.body.cities)
      ? req.body.cities.map((c) => toTrimmedString(c)).filter(Boolean)
      : [];
    job.cities = cList;
    if (cList.length > 0) {
      job.location = cList.join(", ");
    }
  }
  if (req.body.description !== undefined) job.description = toTrimmedString(req.body.description);
  if (req.body.jobType !== undefined) job.jobType = toTrimmedString(req.body.jobType);
  if (req.body.jobCategory !== undefined) {
    job.jobCategory = toTrimmedString(req.body.jobCategory);
    job.isHotVacancy = job.jobCategory === "hot";
  }
  if (req.body.salaryMin !== undefined) job.salaryMin = toSafeNumber(req.body.salaryMin, 0);
  if (req.body.salaryMax !== undefined) job.salaryMax = toSafeNumber(req.body.salaryMax, 0);
  if (req.body.stipend !== undefined) job.stipend = toSafeNumber(req.body.stipend, 0);
  if (req.body.internshipDuration !== undefined) job.internshipDuration = toTrimmedString(req.body.internshipDuration);
  if (req.body.internshipStartDate !== undefined) job.internshipStartDate = toTrimmedString(req.body.internshipStartDate);
  if (req.body.experience !== undefined) job.experience = toTrimmedString(req.body.experience);
  if (req.body.isActive !== undefined) job.isActive = Boolean(req.body.isActive);
  if (req.body.externalLink !== undefined) job.externalLink = toTrimmedString(req.body.externalLink);

  if (req.body.screeningQuestions !== undefined) {
    job.screeningQuestions = Array.isArray(req.body.screeningQuestions)
      ? req.body.screeningQuestions.map((sq, idx) => {
          const questionText = String(sq.question || "").trim();
          if (!questionText) return null;
          return {
            _id: sq._id || undefined,
            question: questionText,
            type: String(sq.type || "TEXT").toUpperCase(),
            required: sq.required !== false,
            options: Array.isArray(sq.options)
              ? sq.options.map((o) => String(o).trim()).filter(Boolean)
              : [],
            maxLength: Number(sq.maxLength) || 500,
            order: Number(sq.order) ?? idx,
          };
        }).filter(Boolean)
      : [];
  }

  await job.save();

  // Log JOB_EDIT to JobPostingReportLog for report generation
  jobReportService.fireAndForgetJobEvent({
    companyId: req.company?._id || job.companyId,
    user: req.user,
    job,
    actionType: "JOB_EDIT",
    expense: 0,
  });

  // Async incremental ES sync — fires after response is sent
  if (job.approvalStatus === "APPROVED" && job.isActive) {
    scheduleIndex(job);
  } else if (!job.isActive) {
    scheduleDelete(String(job._id));
  }

  res.json({
    success: true,
    message: "Job updated successfully",
    data: {
      id: String(job._id),
      title: job.title,
      department: job.department,
      location: job.location,
      jobType: job.jobType,
      isActive: job.isActive,
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
      updatedAt: job.updatedAt,
    },
  });
});

exports.getJob = asyncHandler(async (req, res) => {
  const { company } = await resolveClientUserAndCompany(req.user._id);
  const jobId = toTrimmedString(req.params.id);

  if (!jobId) {
    throw createHttpError(400, "Job ID is required");
  }

  const job = await Job.findOne({ _id: jobId, companyId: company._id }).lean();

  if (!job) {
    throw createHttpError(404, "Job not found");
  }

  res.json({
    success: true,
    data: {
      ...job,
      id: String(job._id),
      title: job.title || "",
      department: job.department || "",
      location: job.location || "",
      description: job.description || "",
      responsibilities: job.responsibilities || "",
      qualifications: job.qualifications || "",
      jobType: job.jobType || "",
      experience: job.experience || "",
      salaryMin: job.salaryMin || 0,
      salaryMax: job.salaryMax || 0,
      isActive: Boolean(job.isActive),
      approvalStatus: job.approvalStatus || "PENDING",
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
      applicantCount: 0,
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
    },
  });
});

exports.getPackageChangeRequests = asyncHandler(async (req, res) => {
  const { company } = await resolveClientUserAndCompany(req.user._id);
  await syncCompanyPackageContext(company);

  const statusFilter = String(req.query.status || "").trim().toUpperCase();
  if (statusFilter && !["ALL", "PENDING", "APPROVED", "REJECTED", "CANCELLED"].includes(statusFilter)) {
    throw createHttpError(400, "Invalid status filter for package change requests");
  }

  const query = { companyId: company._id };
  if (statusFilter && statusFilter !== "ALL") {
    query.status = statusFilter;
  }

  const requests = await PackageChangeRequest.find(query)
    .sort({ createdAt: -1 })
    .limit(20)
    .select(
      "currentPackageType requestedPackageType currentJobLimit requestedJobLimit status isUpgrade reason decisionNote effectiveAt appliedAt reviewedAt createdAt updatedAt",
    );

  const activeRequest = requests.find(
    (item) =>
      item.status === "PENDING" ||
      (item.status === "APPROVED" && !item.appliedAt),
  );

  res.status(200).json({
    success: true,
    data: {
      activeRequest: activeRequest
        ? formatPackageChangeRequestForCompany(activeRequest, company)
        : null,
      items: requests.map((item) => formatPackageChangeRequestForCompany(item, company)),
    },
  });
});

exports.createPackageChangeRequest = asyncHandler(async (req, res) => {
  const { user, company } = await resolveClientUserAndCompany(req.user._id);
  const { packageCatalog, packageLimitMap, packageSnapshot } = await syncCompanyPackageContext(company);

  const requestedPackageType = normalizePackageName(req.body.packageType, "");
  const reason = toTrimmedString(req.body.reason);

  if (!requestedPackageType || !PACKAGE_TYPES.includes(requestedPackageType)) {
    throw createHttpError(400, "Select a valid target package");
  }

  if (requestedPackageType === packageSnapshot.packageType) {
    throw createHttpError(400, "You are already on this package");
  }

  const requestedJobLimit = Number(packageLimitMap.get(requestedPackageType) || 0);
  if (!requestedJobLimit) {
    throw createHttpError(404, "Requested package is not configured");
  }

  const pendingRequest = await PackageChangeRequest.findOne({
    companyId: company._id,
    status: "PENDING",
  }).select("_id");

  if (pendingRequest) {
    throw createHttpError(409, "A package change request is already pending CRM review");
  }

  const currentPackageType = normalizePackageName(company.packageType, "STANDARD");
  const currentJobLimit = Number(
    resolveCompanyJobLimit(
      { packageType: currentPackageType, jobLimit: packageSnapshot.jobLimit },
      packageLimitMap,
    ),
  );
  const isUpgrade = requestedJobLimit > currentJobLimit;
  const effectiveAt = buildPackageChangeEffectiveAt({
    isUpgrade,
    requestedEffectiveAt: req.body.effectiveAt,
  });

  const createdRequest = await PackageChangeRequest.create({
    companyId: company._id,
    requestedBy: user._id,
    currentPackageType,
    requestedPackageType,
    currentJobLimit,
    requestedJobLimit,
    reason,
    status: "PENDING",
    isUpgrade,
    effectiveAt,
    metadata: {
      source: "COMPANY_PANEL",
      packageCatalogVersion: packageCatalog.map((item) => ({
        name: item.name,
        jobLimit: item.jobLimit,
      })),
    },
  });

  const hydratedRequest = await PackageChangeRequest.findById(createdRequest._id).select(
    "currentPackageType requestedPackageType currentJobLimit requestedJobLimit status isUpgrade reason decisionNote effectiveAt appliedAt reviewedAt createdAt updatedAt",
  );

  res.status(201).json({
    success: true,
    message: isUpgrade
      ? "Upgrade request submitted to CRM for approval."
      : "Downgrade request submitted. CRM will review and schedule the change for the next billing window.",
    data: formatPackageChangeRequestForCompany(hydratedRequest, company),
  });
});

exports.getApplications = asyncHandler(async (req, res) => {
  const { company } = await resolveClientUserAndCompany(req.user._id);

  const page = toPositiveInteger(req.query.page, 1, 1, 100000);
  const limit = toPositiveInteger(req.query.limit, 10, 1, 50);
  const requestedStatus = normalizeApplicationStatus(req.query.status);
  const statusFilter = String(req.query.status || "").trim().toUpperCase();

  if (statusFilter && statusFilter !== "ALL" && !requestedStatus) {
    throw createHttpError(
      400,
      `Invalid status filter. Allowed values: ALL, ${APPLICATION_STATUS_ENUM.join(", ")}`,
    );
  }

  const query = {
    companyId: company._id,
  };

  if (requestedStatus) {
    query.status = requestedStatus;
  }

  const skip = (page - 1) * limit;

  const [applications, filteredCount, statusBreakdown] = await Promise.all([
    Application.find(query)
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("jobId", "title")
      .populate("candidateId", "name email"),
    Application.countDocuments(query),
    Application.aggregate([
      {
        $match: {
          companyId: company._id,
        },
      },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]),
  ]);

  const candidateIds = [
    ...new Set(applications.map((application) => getCandidateIdFromApplication(application)).filter(Boolean)),
  ];

  const candidateProfiles = candidateIds.length
    ? await CandidateProfile.find({ userId: { $in: candidateIds } }).select(
        "userId phone currentTitle totalExperience currentCity currentState resume",
      )
    : [];

  const profileMap = new Map(
    candidateProfiles.map((profile) => [String(profile.userId), profile]),
  );
  const items = applications.map((application) => formatCompanyApplication(application, profileMap));

  const totalPages = Math.max(1, Math.ceil(filteredCount / limit));
  const pageValue = Math.min(page, totalPages);

  const summaryByStatus = APPLICATION_STATUS_ENUM.reduce(
    (accumulator, status) => ({
      ...accumulator,
      [status]: 0,
    }),
    {},
  );

  statusBreakdown.forEach((item) => {
    const status = normalizeApplicationStatus(item?._id);
    if (status) {
      summaryByStatus[status] = Number(item.count || 0);
    }
  });

  res.status(200).json({
    success: true,
    data: {
      statuses: APPLICATION_STATUS_ENUM,
      filters: {
        status: requestedStatus || "ALL",
      },
      summary: {
        total: APPLICATION_STATUS_ENUM.reduce(
          (count, status) => count + Number(summaryByStatus[status] || 0),
          0,
        ),
        byStatus: summaryByStatus,
      },
      pagination: {
        page: pageValue,
        limit,
        totalItems: filteredCount,
        totalPages,
        hasPrevPage: pageValue > 1,
        hasNextPage: pageValue < totalPages,
      },
      items,
    },
  });
});

exports.updateApplicationStatus = asyncHandler(async (req, res) => {
  const { company } = await resolveClientUserAndCompany(req.user._id);

  const applicationId = toTrimmedString(req.params.applicationId);
  if (!applicationId) {
    throw createHttpError(400, "Application id is required");
  }

  const requestedStatus = normalizeApplicationStatus(req.body.status);
  if (!requestedStatus) {
    throw createHttpError(
      400,
      `Invalid status value. Allowed statuses: ${APPLICATION_STATUS_ENUM.join(", ")}`,
    );
  }

  const application = await Application.findOne({
    _id: applicationId,
    companyId: company._id,
  })
    .populate("jobId", "title")
    .populate("candidateId", "name email");

  if (!application) {
    throw createHttpError(404, "Application not found");
  }

  const previousStatus = normalizeApplicationStatus(application.status) || "APPLIED";
  const hasStatusChanged = previousStatus !== requestedStatus;
  const candidateId = getCandidateIdFromApplication(application);

  if (hasStatusChanged) {
    application.status = requestedStatus;
    await application.save();

    if (candidateId) {
      CandidateProfile.findOneAndUpdate(
        { userId: candidateId },
        { $inc: { recruiterActions: 1 } },
      ).catch(() => {});
    }
  }

  if (candidateId && hasStatusChanged) {
    await notificationService.sendCandidateNotification({
      candidateId,
      companyId: company._id,
      jobId: application.jobId?._id || application.jobId || null,
      applicationId: application._id,
      title: "Application status updated",
      message: `${company.name || "The company"} marked your application for ${
        application.jobId?.title || "the role"
      } as ${formatApplicationStatusLabel(requestedStatus)}.`,
      category: "APPLICATION",
      actionUrl: "/candidate/applications",
      metadata: {
        source: "COMPANY_PANEL",
        previousStatus,
        currentStatus: requestedStatus,
      },
    });

    const candidateEmail = application.candidateId?.email;
    const candidateName = application.candidateId?.name;
    const jobTitle = application.jobId?.title || "the role";
    const companyName = company.name || "The company";
    const eventPayload = { email: candidateEmail, fullName: candidateName, jobTitle, companyName, candidateId };

    switch (requestedStatus) {
      case "SHORTLISTED":
        EventBus.emit(EVENTS.CANDIDATE_APPLICATION_SHORTLISTED, eventPayload);
        break;
      case "REJECTED":
        EventBus.emit(EVENTS.CANDIDATE_APPLICATION_REJECTED, eventPayload);
        break;
      case "INTERVIEW":
        EventBus.emit(EVENTS.CANDIDATE_INTERVIEW_SCHEDULED, {
          ...eventPayload,
          interviewDate: "",
          interviewTime: "",
          interviewMode: "",
          interviewLink: "",
        });
        break;
      case "OFFERED":
        EventBus.emit(EVENTS.CANDIDATE_OFFER_ISSUED, {
          ...eventPayload,
          offerLink: "",
        });
        break;
    }
  }

  const candidateProfiles = candidateId
    ? await CandidateProfile.find({ userId: { $in: [candidateId] } }).select(
        "userId phone currentTitle totalExperience currentCity currentState resume",
      )
    : [];
  const profileMap = new Map(
    candidateProfiles.map((profile) => [String(profile.userId), profile]),
  );

  res.status(200).json({
    success: true,
    message:
      !hasStatusChanged
        ? "Application status is already up to date."
        : "Application status updated successfully.",
    data: formatCompanyApplication(application, profileMap),
  });
});

exports.getProfile = asyncHandler(async (req, res) => {
  const { user, company } = await resolveClientUserAndCompany(req.user._id);
  const { packageSnapshot } = await syncCompanyPackageContext(company);

  res.status(200).json({
    success: true,
    data: {
      user: {
        id: String(user._id),
        username: user.name || "",
        email: user.email || "",
      },
      company: formatCompanyForClient(company, { jobLimit: packageSnapshot.jobLimit, user }),
    },
  });
});

exports.updateProfile = asyncHandler(async (req, res) => {
  const { user, company } = await resolveClientUserAndCompany(req.user._id);

  const nextUsername = toTrimmedString(req.body.username);
  const nextUserEmail = toTrimmedString(req.body.email).toLowerCase();
  const nextCompanyEmail = toTrimmedString(req.body.companyEmail).toLowerCase();

  if (nextUsername) {
    user.name = nextUsername;
  }

  if (nextUserEmail && nextUserEmail !== user.email) {
    const existingUser = await User.findOne({
      email: nextUserEmail,
      _id: { $ne: user._id },
    }).select("_id");

    if (existingUser) {
      throw createHttpError(409, "Another account already uses this email");
    }

    user.email = nextUserEmail;
  }

  const currentPassword = toTrimmedString(req.body.currentPassword);
  const newPassword = toTrimmedString(req.body.newPassword);
  if (currentPassword || newPassword) {
    if (!currentPassword || !newPassword) {
      throw createHttpError(400, "Current password and new password are required to update password");
    }

    const currentUserWithPassword = await User.findById(user._id).select("+password");
    const passwordMatches = await bcrypt.compare(currentPassword, currentUserWithPassword.password);
    if (!passwordMatches) {
      throw createHttpError(400, "Current password is incorrect");
    }

    currentUserWithPassword.password = await bcrypt.hash(newPassword, 10);
    await currentUserWithPassword.save();
  }

  if (nextCompanyEmail && nextCompanyEmail !== company.email) {
    const existingCompany = await Company.findOne({
      email: nextCompanyEmail,
      _id: { $ne: company._id },
    }).select("_id");

    if (existingCompany) {
      throw createHttpError(409, "Another company already uses this company email");
    }

    company.email = nextCompanyEmail;
  }

  if (req.body.companyName && toTrimmedString(req.body.companyName)) {
    company.name = toTrimmedString(req.body.companyName);
  }
  if (req.body.contactPerson !== undefined) company.contactPerson = toTrimmedString(req.body.contactPerson);
  if (req.body.contactDesignation !== undefined) company.contactDesignation = toTrimmedString(req.body.contactDesignation);
  if (req.body.alias !== undefined) company.alias = toTrimmedString(req.body.alias);
  if (req.body.phone1 !== undefined || req.body.phone !== undefined || req.body.mobileNumber !== undefined) {
    company.phone = toTrimmedString(req.body.phone1 || req.body.phone || req.body.mobileNumber) || company.phone;
  }
  if (req.body.phone2 !== undefined || req.body.altPhone !== undefined) {
    company.altPhone = toTrimmedString(req.body.phone2 || req.body.altPhone);
  }
  if (req.body.tanNumber !== undefined) company.tanNumber = toTrimmedString(req.body.tanNumber);
  if (req.body.gstin !== undefined) company.gstin = toTrimmedString(req.body.gstin);
  if (req.body.registeredName !== undefined) company.registeredName = toTrimmedString(req.body.registeredName);
  if (req.body.addressLabel !== undefined) company.addressLabel = toTrimmedString(req.body.addressLabel);
  if (req.body.profileHotVacancies !== undefined) company.profileHotVacancies = toTrimmedString(req.body.profileHotVacancies);
  if (req.body.profileClassifieds !== undefined) company.profileClassifieds = toTrimmedString(req.body.profileClassifieds);
  if (req.body.jobLiveDurationDays !== undefined) {
    company.jobLiveDurationDays = Math.max(1, Number(req.body.jobLiveDurationDays) || 30);
  }
  if (req.body.jobLiveDurations && typeof req.body.jobLiveDurations === "object") {
    company.jobLiveDurations = {
      standard: Math.max(1, Number(req.body.jobLiveDurations.standard) || company.jobLiveDurations?.standard || 30),
      hotVacancy: Math.max(1, Number(req.body.jobLiveDurations.hotVacancy) || company.jobLiveDurations?.hotVacancy || 30),
      smb: Math.max(1, Number(req.body.jobLiveDurations.smb) || company.jobLiveDurations?.smb || 30),
      internship: Math.max(1, Number(req.body.jobLiveDurations.internship) || company.jobLiveDurations?.internship || 30),
    };
  }
  if (req.body.companyType !== undefined || req.body.type !== undefined) {
    company.type = toTrimmedString(req.body.companyType || req.body.type);
  }
  if (req.body.industryType !== undefined || req.body.industry !== undefined) {
    company.industry = toTrimmedString(req.body.industryType || req.body.industry);
  }
  if (req.body.websiteUrl !== undefined || req.body.website !== undefined) {
    company.website = toTrimmedString(req.body.websiteUrl || req.body.website);
  }
  if (req.body.communicationEmail && toTrimmedString(req.body.communicationEmail)) {
    company.email = toTrimmedString(req.body.communicationEmail).toLowerCase();
  }
  company.linkedIn = toTrimmedString(req.body.linkedIn) || company.linkedIn;
  company.about = toTrimmedString(req.body.about) || company.about;
  company.companySize = toTrimmedString(req.body.companySize) || company.companySize;
  company.foundedYear = toTrimmedString(req.body.foundedYear) || company.foundedYear;
  company.tagline = toTrimmedString(req.body.tagline) || company.tagline;

  if (Array.isArray(req.body.specialties)) {
    company.specialties = req.body.specialties.map((s) => String(s).trim()).filter(Boolean);
  }

  if (Array.isArray(req.body.perks)) {
    company.perks = req.body.perks;
  }

  company.location = {
    ...(company.location || {}),
    country: toTrimmedString(req.body.country) || company.location?.country || "India",
    city: toTrimmedString(req.body.city) || company.location?.city || "",
    region: toTrimmedString(req.body.region || req.body.state) || company.location?.region || "",
    zone: toTrimmedString(req.body.zone) || company.location?.zone || "",
    address: toTrimmedString(req.body.address) || company.location?.address || "",
    pincode: toTrimmedString(req.body.pincode) || company.location?.pincode || "",
  };

  await Promise.all([user.save(), company.save()]);

  const { packageSnapshot } = await syncCompanyPackageContext(company);

  res.status(200).json({
    success: true,
    message: "Profile updated successfully",
    data: {
      user: {
        id: String(user._id),
        username: user.name || "",
        email: user.email || "",
      },
      company: formatCompanyForClient(company, { jobLimit: packageSnapshot.jobLimit, user }),
    },
  });
});

exports.updateCompanyMedia = asyncHandler(async (req, res) => {
  const { user, company } = await resolveClientUserAndCompany(req.user._id);
  const kind = String(req.body.kind || "").trim().toLowerCase() === "cover" ? "cover" : "logo";

  if (!req.file) {
    throw createHttpError(400, "Please upload an image file");
  }

  const isRecruiter = user.role === "RECRUITER";

  const previousPublicId = isRecruiter
    ? (kind === "cover" ? user.coverImagePublicId : user.avatarPublicId)
    : (kind === "cover" ? company.coverImagePublicId : company.logoPublicId);
    
  const uploaded = await uploadCompanyMedia(req.file, { ownerId: isRecruiter ? user._id : company._id, kind });

  if (isRecruiter) {
    if (kind === "cover") {
      user.coverImageUrl = uploaded.url;
      user.coverImagePublicId = uploaded.publicId;
    } else {
      user.avatar = uploaded.url;
      user.avatarPublicId = uploaded.publicId;
    }
    await user.save();
  } else {
    if (kind === "cover") {
      company.coverImageUrl = uploaded.url;
      company.coverImagePublicId = uploaded.publicId;
    } else {
      company.logoUrl = uploaded.url;
      company.logoPublicId = uploaded.publicId;
    }
    await company.save();
  }

  if (previousPublicId && previousPublicId !== uploaded.publicId) {
    await destroyCompanyMedia(previousPublicId);
  }

  const { packageSnapshot } = await syncCompanyPackageContext(company);

  res.status(200).json({
    success: true,
    message: `${kind === "cover" ? "Cover" : "Profile"} image updated successfully`,
    data: {
      company: formatCompanyForClient(company, { jobLimit: packageSnapshot.jobLimit, user }),
    },
  });
});

exports.previewApplicationResume = asyncHandler(async (req, res) => {
  const { company } = await resolveClientUserAndCompany(req.user._id);
  const applicationId = String(req.params.applicationId || "").trim();

  if (!applicationId) {
    throw createHttpError(400, "Application id is required");
  }

  const application = await Application.findOne({
    _id: applicationId,
    companyId: company._id,
  }).select("candidateId resumeUrl resumeFileName");

  if (!application) {
    throw createHttpError(404, "Application not found");
  }

  let resumeUrl = String(application.resumeUrl || "").trim();
  let resumeFileName = String(application.resumeFileName || "").trim();

  if (!resumeUrl && application.candidateId) {
    const candidateProfile = await CandidateProfile.findOne({
      userId: application.candidateId,
    }).select("resume");

    if (candidateProfile?.resume?.url) {
      resumeUrl = String(candidateProfile.resume.url || "").trim();
      resumeFileName = String(candidateProfile.resume.fileName || "").trim();
    }
  }

  if (!resumeUrl) {
    throw createHttpError(404, "Resume not found for this application");
  }

  let upstream;
  try {
    upstream = await axios({
      method: "get",
      url: resumeUrl,
      responseType: "stream",
    });
  } catch {
    throw createHttpError(502, "Unable to fetch resume from storage");
  }

  const upstreamContentType = String(upstream.headers?.["content-type"] || "").trim();
  if (
    !isLikelyPdf({
      fileName: resumeFileName,
      url: resumeUrl,
      contentType: upstreamContentType,
    })
  ) {
    throw createHttpError(
      415,
      "Resume is not in PDF format. Please upload PDF resumes for preview support.",
    );
  }

  const safeFileNameBase = String(resumeFileName || "candidate-resume")
    .replace(/[^\w.-]+/g, "_")
    .replace(/_{2,}/g, "_");
  const safeFileName = safeFileNameBase.toLowerCase().endsWith(".pdf")
    ? safeFileNameBase
    : `${safeFileNameBase}.pdf`;

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `inline; filename="${safeFileName}"`);
  res.setHeader("X-Content-Type-Options", "nosniff");

  upstream.data.pipe(res);
});

exports.uploadApplicationResume = asyncHandler(async (req, res) => {
  const { company } = await resolveClientUserAndCompany(req.user._id);
  const applicationId = String(req.params.applicationId || "").trim();

  if (!applicationId) {
    throw createHttpError(400, "Application id is required");
  }

  if (!req.file) {
    throw createHttpError(400, "Resume file is required. Upload a PDF file.");
  }

  if (req.file.mimetype !== "application/pdf") {
    throw createHttpError(400, "Only PDF files are accepted for resume upload");
  }

  const application = await Application.findOne({
    _id: applicationId,
    companyId: company._id,
  });

  if (!application) {
    throw createHttpError(404, "Application not found");
  }

  const candidateUserId = application.candidateId
    ? String(application.candidateId)
    : `app_${applicationId}`;

  const uploaded = await uploadResumeFile(req.file, candidateUserId);

  application.resumeUrl = uploaded.url;
  application.resumeFileName = uploaded.fileName;
  await application.save();

  res.json({
    success: true,
    message: "Resume uploaded successfully",
    data: {
      resumeUrl: uploaded.url,
      resumeFileName: uploaded.fileName,
    },
  });
});

exports.getNotifications = asyncHandler(async (req, res) => {
  const { company } = await resolveClientUserAndCompany(req.user._id);

  const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
  const limit = Math.max(1, Math.min(50, Number.parseInt(req.query.limit, 10) || 20));

  const result = await notificationService.getCompanyNotifications(company._id, {
    userId: req.user._id,
    userRole: req.user.role,
    page,
    limit,
  });

  res.status(200).json({
    success: true,
    data: {
      notifications: result.notifications,
      pagination: result.pagination,
      unreadCount: result.unreadCount,
    },
    notifications: result.notifications,
    pagination: result.pagination,
    unreadCount: result.unreadCount,
  });
});

exports.deleteAccount = asyncHandler(async (req, res) => {
  const { password } = req.body;
  if (!password) {
    throw createHttpError(400, "Password is required");
  }

  const user = await User.findById(req.user._id).select("+password");
  if (!user) {
    throw createHttpError(404, "Account not found");
  }

  const passwordMatches = await bcrypt.compare(password, user.password);
  if (!passwordMatches) {
    throw createHttpError(401, "Incorrect password");
  }

  const company = await Company.findById(user.companyId);
  if (company) {
    company.status = "INACTIVE";
    await company.save();
  }

  user.isActive = false;
  user.accessStatus = "RESTRICTED";
  await user.save();

  await Job.updateMany(
    { companyId: user.companyId },
    { isActive: false }
  );

  res.status(200).json({ success: true, message: "Account deleted successfully" });
});

exports.markNotificationRead = asyncHandler(async (req, res) => {
  const { company } = await resolveClientUserAndCompany(req.user._id);

  const notificationId = String(req.params.id || "").trim();
  if (!notificationId) {
    throw createHttpError(400, "Notification id is required");
  }

  const updated = await notificationService.markCompanyNotificationRead(
    company._id,
    notificationId,
    req.user._id
  );

  if (!updated) {
    throw createHttpError(404, "Notification not found");
  }

  res.status(200).json({
    success: true,
    message: updated.alreadyRead ? "Notification already marked as read" : "Notification marked as read",
    data: {
      notification: updated,
    },
    notification: updated,
    alreadyRead: !!updated.alreadyRead,
  });
});

exports.markAllNotificationsRead = asyncHandler(async (req, res) => {
  const { company } = await resolveClientUserAndCompany(req.user._id);
  const result = await notificationService.markAllCompanyNotificationsRead(company._id, {
    userId: req.user._id,
    userRole: req.user.role,
  });

  res.status(200).json({
    success: true,
    message: result.modifiedCount > 0 ? "All notifications marked as read" : "All notifications are already marked as read",
    data: result,
    modifiedCount: result.modifiedCount,
    alreadyRead: result.alreadyRead,
  });
});

exports.enhanceDescription = asyncHandler(async (req, res) => {
  const { text, type = "description", jobTitle = "", jobCategory = "standard" } = req.body;

  const hasText = Boolean(text && String(text).trim());
  const hasTitle = Boolean(jobTitle && String(jobTitle).trim());

  if (!hasText && !hasTitle) {
    throw createHttpError(400, "Please enter a Job Title or existing text to enhance with AI.");
  }

  const { company } = await resolveClientUserAndCompany(req.user._id);
  if (!company) {
    throw createHttpError(404, "Company not found");
  }

  // 1. Verify AI credit quota and feature permissions from the plan
  const AiCreditService = require("../services/commercial/ai-credit.service");
  const quota = await AiCreditService.getAiQuota(company._id);
  if (!quota || quota.availableCredits < 1) {
    throw createHttpError(402, "You have exhausted your AI credits (0 remaining). Please purchase an AI Credit Booster pack or upgrade your plan to continue using AI enhancement.");
  }

  // Read per-feature permissions strictly from planSnapshot.services (or quota permissions)
  const aiPlanSvc = (company.planSnapshot?.services || []).find(
    (s) => String(s.productCode).toUpperCase() === "AI_CREDIT"
  );
  const aiPlanFeatures = Array.isArray(aiPlanSvc?.features) ? aiPlanSvc.features : [];

  const canImproveJd =
    aiPlanFeatures.some((f) => (f.key === "improveJd" || f.key === "improveJobDescription") && f.enabled === true) ||
    Boolean(quota.permissions?.canImproveJd || quota.permissions?.improveJobDescription);

  const canGenerateJd =
    aiPlanFeatures.some((f) => (f.key === "generateJd" || f.key === "writeFullJd" || f.key === "writeFullJobDescription") && f.enabled === true) ||
    Boolean(quota.permissions?.canGenerateJd || quota.permissions?.writeFullJobDescription);

  // 2. Build Category-Specific Guidance
  let categoryGuidance = "";
  const cat = String(jobCategory).toLowerCase();
  if (cat === "internship") {
    categoryGuidance = "This role is an INTERNSHIP. Emphasize learning opportunities, academic projects, foundational skills, mentorship, curiosity, and eagerness to grow. Avoid demanding years of senior industry experience.";
  } else if (cat === "management" || cat === "smb") {
    categoryGuidance = "This role is for a small & medium business (SMB) or agile growth company. Emphasize versatility, autonomy, end-to-end execution, practical problem-solving, and cross-functional impact.";
  } else if (cat === "hot") {
    categoryGuidance = "This role is a high-priority, urgent hiring 'Hot Vacancy'. Emphasize high impact, fast-paced execution, competitive growth, critical deliverables, and attracting top-tier talent quickly.";
  } else {
    categoryGuidance = "This is a standard professional job posting. Ensure a clear, structured, industry-standard, and professional tone.";
  }

  // 3. Determine feature name for this action and gate it
  // isNewContent = user gave no existing text, purely generating from job title
  const isNewContent = !hasText;
  const featureName = type === "responsibilities"
    ? (isNewContent ? "WRITE_FULL_JD" : "IMPROVE_RESPONSIBILITIES")
    : (type === "qualifications" || type === "skills")
    ? (isNewContent ? "WRITE_FULL_JD" : "IMPROVE_REQUIREMENTS")
    : (isNewContent ? "WRITE_FULL_JD" : "IMPROVE_JD");

  // Gate: improve requires canImproveJd; generate-from-scratch requires canGenerateJd
  if (isNewContent && !canGenerateJd) {
    throw createHttpError(403, "Generating content from scratch is not available on your current plan. Please upgrade to an SMB or Corporate plan to unlock this feature.");
  }
  if (!isNewContent && !canImproveJd) {
    throw createHttpError(403, "Improving job description content is not available on your current plan. Please contact support.");
  }

  // 4. Build Section Prompt
  const cleanTitle = jobTitle.trim() || "the specified position";
  let systemPrompt = "";

  if (type === "responsibilities") {
    if (hasText) {
      systemPrompt = `You are an expert HR recruiter. ${categoryGuidance}
Rewrite and refine the provided key responsibilities for a "${cleanTitle}".
Ensure every responsibility is clear, action-oriented, and realistic.
Format strictly as clean bullet points where EACH bullet point starts with "• ".
Return ONLY the bullet points, one per line, without any headings, labels, intro, or commentary.`;
    } else {
      systemPrompt = `You are an expert HR recruiter. ${categoryGuidance}
Generate 5 to 7 key responsibilities for a "${cleanTitle}".
Ensure each responsibility is action-oriented, precise, and realistic.
Format strictly as clean bullet points where EACH bullet point starts with "• ".
Return ONLY the bullet points, one per line, without any headings, labels, intro, or commentary.`;
    }
  } else if (type === "qualifications" || type === "skills") {
    if (hasText) {
      systemPrompt = `You are an expert HR recruiter. ${categoryGuidance}
Rewrite and refine the provided required skills and qualifications for a "${cleanTitle}".
Ensure they are modern, realistic, well-articulated, and appropriate for the level.
Format strictly as clean bullet points where EACH bullet point starts with "• ".
Return ONLY the bullet points, one per line, without any headings, labels, intro, or commentary.`;
    } else {
      systemPrompt = `You are an expert HR recruiter. ${categoryGuidance}
Generate 5 to 7 required skills & qualifications for a "${cleanTitle}".
Include core technical/domain skills, educational background, and essential soft skills.
Format strictly as clean bullet points where EACH bullet point starts with "• ".
Return ONLY the bullet points, one per line, without any headings, labels, intro, or commentary.`;
    }
  } else {
    // description
    if (hasText) {
      systemPrompt = `You are an expert HR recruiter. ${categoryGuidance}
Rewrite and elevate the provided job role description for a "${cleanTitle}".
Improve grammar, professional tone, flow, and clarity while retaining key company context.
Format as 1 to 2 cohesive, engaging paragraphs.
Return ONLY the enhanced description paragraphs without any headings, labels, bullet points, intro, or commentary.`;
    } else {
      systemPrompt = `You are an expert HR recruiter. ${categoryGuidance}
Generate a compelling, professional job role description for a "${cleanTitle}".
Describe what the role entails, the team's mission, and what success looks like in 1 to 2 cohesive, engaging paragraphs.
Return ONLY the description text without any headings, labels, bullet points, intro, or commentary.`;
    }
  }

  const userPrompt = hasText
    ? `Role Title: ${cleanTitle}\n\nExisting Text to enhance:\n${text}`
    : `Generate content for Role Title: ${cleanTitle}`;

  // 4. Generate with OpenAI
  let enhanced = "";
  try {
    const response = await OpenAIService.createChatCompletion({
      model: process.env.OPENAI_CHAT_MODEL || process.env.OPENAI_MODEL || "gpt-5-mini",
      systemPrompt,
      userPrompt,
      maxOutputTokens: 2000,
    });
    enhanced = response?.output_text || response?.outputText || response?.choices?.[0]?.message?.content || "";
  } catch (err) {
    throw createHttpError(502, `AI enhancement failed: ${err.message}`);
  }

  if (!enhanced || !enhanced.trim()) {
    throw createHttpError(502, "AI was unable to generate content. Please try again.");
  }

  // 5. Consume 1 AI Credit upon successful generation
  const consumption = await AiCreditService.useAiCredit({
    companyId: company._id,
    userId: req.user._id,
    feature: featureName,
    actor: { userId: req.user._id, userEmail: req.user.email },
  });

  // Keep company.planSnapshot.services in sync if AI_CREDIT is present
  if (company.planSnapshot && Array.isArray(company.planSnapshot.services)) {
    const sIndex = company.planSnapshot.services.findIndex(s => String(s.productCode).toUpperCase() === "AI_CREDIT");
    if (sIndex !== -1) {
      company.planSnapshot.services[sIndex].usedQuantity = (company.planSnapshot.services[sIndex].usedQuantity || 0) + 1;
      company.markModified("planSnapshot");
      await company.save();
    }
  }

  res.status(200).json({
    success: true,
    data: {
      text: enhanced.trim(),
      remainingCredits: consumption.remainingCredits,
      creditsDeducted: 1,
    },
  });
});

exports.generateScreeningQuestions = asyncHandler(async (req, res) => {
  const { jobTitle = "", skills = [], experience = "", jobCategory = "standard" } = req.body;

  if (!jobTitle.trim()) {
    throw createHttpError(400, "Job Title is required to generate screening questions");
  }

  const { company } = await resolveClientUserAndCompany(req.user._id);
  if (!company) {
    throw createHttpError(404, "Company not found");
  }

  const AiCreditService = require("../services/commercial/ai-credit.service");
  const quota = await AiCreditService.getAiQuota(company._id);

  // Read per-feature permission strictly from planSnapshot.services (or quota permissions)
  const aiPlanSvc = (company.planSnapshot?.services || []).find(
    (s) => String(s.productCode).toUpperCase() === "AI_CREDIT"
  );
  const aiPlanFeatures = Array.isArray(aiPlanSvc?.features) ? aiPlanSvc.features : [];

  const canGenerateScreeningQuestions =
    aiPlanFeatures.some((f) => (f.key === "screeningQuestions" || f.key === "writeScreeningQuestions") && f.enabled === true) ||
    Boolean(quota.permissions?.canGenerateScreeningQuestions || quota.permissions?.writeScreeningQuestions);

  if (!canGenerateScreeningQuestions) {
    throw createHttpError(403, "Generating screening questions with AI is not available on your current plan. Please upgrade to an SMB or Corporate plan to unlock this feature.");
  }

  if (!quota || quota.availableCredits < 1) {
    throw createHttpError(402, "You have exhausted your AI credits. Please purchase an AI Credit Booster pack or upgrade your plan.");
  }

  const systemPrompt = `You are an expert HR recruiter.
Generate 4 to 5 relevant, insightful screening questions for the role "${jobTitle.trim()}".
Required skills: ${Array.isArray(skills) ? skills.join(", ") : skills || "General"}.
Experience level: ${experience || "Any"}.

Return ONLY a valid JSON array of question objects with the following schema:
[
  {
    "question": "string",
    "type": "Yes/No",
    "required": true,
    "scoring": "Must"
  }
]
Allowed type values: "Yes/No", "Multiple Choice", "Text".
Allowed scoring values: "Must", "Preferred".
Do NOT include markdown formatting or commentary, only raw JSON.`;

  const userPrompt = `Generate screening questions for: ${jobTitle.trim()}`;

  let questions = [];
  try {
    const response = await OpenAIService.createChatCompletion({
      model: process.env.OPENAI_CHAT_MODEL || process.env.OPENAI_MODEL || "gpt-5-mini",
      systemPrompt,
      userPrompt,
      maxOutputTokens: 1000,
    });
    const raw = response?.output_text || response?.outputText || response?.choices?.[0]?.message?.content || "";
    const cleaned = raw.replace(/```json|```/g, "").trim();
    questions = JSON.parse(cleaned);
  } catch (err) {
    throw createHttpError(502, `Failed to generate screening questions with AI: ${err.message}`);
  }

  if (!Array.isArray(questions) || questions.length === 0) {
    throw createHttpError(502, "AI was unable to generate valid screening questions. Please try again.");
  }

  // Deduct 1 credit
  const consumption = await AiCreditService.useAiCredit({
    companyId: company._id,
    userId: req.user._id,
    feature: "SCREENING_QUESTIONS",
    actor: { userId: req.user._id, userEmail: req.user.email },
  });

  if (company.planSnapshot && Array.isArray(company.planSnapshot.services)) {
    const sIndex = company.planSnapshot.services.findIndex(s => String(s.productCode).toUpperCase() === "AI_CREDIT");
    if (sIndex !== -1) {
      company.planSnapshot.services[sIndex].usedQuantity = (company.planSnapshot.services[sIndex].usedQuantity || 0) + 1;
      company.markModified("planSnapshot");
      await company.save();
    }
  }

  res.status(200).json({
    success: true,
    data: {
      questions: questions.map((q, idx) => ({
        id: Date.now() + idx,
        question: q.question || "",
        type: q.type || "Yes/No",
        required: Boolean(q.required),
        scoring: q.scoring || "Preferred",
        options: Array.isArray(q.options) ? q.options : [],
      })),
      remainingCredits: consumption.remainingCredits,
      creditsDeducted: 1,
    },
  });
});

exports.suggestSkills = asyncHandler(async (req, res) => {
  const { skills } = req.body;
  if (!Array.isArray(skills) || skills.length === 0) {
    throw createHttpError(400, "At least one skill is required");
  }

  const systemPrompt = "You are a career advisor. Given a list of skills for a job role, suggest 5-8 closely related skills that complement them. Return ONLY a JSON array of strings, no other text.";
  const userPrompt = JSON.stringify(skills);

  try {
    const response = await OpenAIService.createChatCompletion({
      model: process.env.OPENAI_CHAT_MODEL || process.env.OPENAI_MODEL || "gpt-4o-mini",
      systemPrompt,
      userPrompt,
      maxOutputTokens: 500,
    });
    const raw = response?.output_text || response?.outputText || response?.choices?.[0]?.message?.content || "";
    const parsed = JSON.parse(raw.replace(/```json|```/g, "").trim());
    const suggestions = Array.isArray(parsed) ? parsed.slice(0, 8) : [];
    res.json({ success: true, data: { suggestions } });
  } catch (err) {
    throw createHttpError(502, `Skill suggestion failed: ${err.message}`);
  }
});

/* ── Helpers ─────────────────────────────────────────────────────────────── */
const getMonthKey = (date) => `${date.getFullYear()}-${date.getMonth()}`;

const getTrailingMonths = (count = 12) => {
  const now = new Date();
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (count - 1 - index), 1);
    return { key: getMonthKey(date), label: date.toLocaleString("en-US", { month: "short" }) };
  });
};

const buildMonthlySeries = (items, accessor, monthsCount = 12) => {
  const months = getTrailingMonths(monthsCount);
  const monthIndex = new Map(months.map((m, i) => [m.key, i]));
  const values = Array(months.length).fill(0);
  items.forEach((item) => {
    const rawDate = accessor(item);
    const date = rawDate ? new Date(rawDate) : null;
    if (!date || Number.isNaN(date.getTime())) return;
    const idx = monthIndex.get(getMonthKey(date));
    if (idx === undefined) return;
    values[idx] += 1;
  });
  return { labels: months.map((m) => m.label), values };
};

const buildStatusCounts = (applications) => {
  const statuses = ["APPLIED", "SCREENING", "SHORTLISTED", "INTERVIEW", "OFFERED", "HIRED"];
  const counts = statuses.map((s) => applications.filter((a) => a.status === s).length);
  return { statuses, counts };
};

const buildSourceBreakdown = (applications) => {
  const sourceCounts = { "QR Campaign": 0, "Job Share": 0, "Direct Apply": 0, "Other": 0 };
  applications.forEach((a) => {
    if (a.sourceQrToken) { sourceCounts["QR Campaign"] += 1; return; }
    if (a.sourceJobId) { sourceCounts["Job Share"] += 1; return; }
    sourceCounts["Direct Apply"] += 1;
  });
  const total = Object.values(sourceCounts).reduce((s, v) => s + v, 0);
  const palette = [
    { label: "QR Campaign", color: "#002366" },
    { label: "Job Share", color: "#0DBF7B" },
    { label: "Direct Apply", color: "#1E5EFF" },
    { label: "Other", color: "#F59E0B" },
  ];
  if (total === 0) return [{ label: "Direct Apply", pct: 100, color: "#1E5EFF" }];
  return palette.map((e) => ({ ...e, pct: Math.max(0, Math.round((sourceCounts[e.label] / total) * 100)) })).filter((e) => e.pct > 0);
};

const fmt = (n) => n >= 1000 ? (n / 1000).toFixed(1) + "K" : n;

/* ── GET /company-panel/analytics ──────────────────────────────────────────── */
exports.getAnalytics = asyncHandler(async (req, res) => {
  const { company } = await resolveClientUserAndCompany(req.user._id);
  const range = req.query.range || "12m";
  const startParam = req.query.startDate;
  const endParam = req.query.endDate;

  let startDate = null;
  let endDate = null;
  let trailingMonths = 12;

  if (range === "7d") {
    startDate = new Date(Date.now() - 7 * 86400000);
    trailingMonths = 1;
  } else if (range === "30d") {
    startDate = new Date(Date.now() - 30 * 86400000);
    trailingMonths = 3;
  } else if (range === "90d") {
    startDate = new Date(Date.now() - 90 * 86400000);
    trailingMonths = 6;
  } else if (range === "custom" && startParam && endParam) {
    startDate = new Date(startParam);
    endDate = new Date(endParam);
    endDate.setHours(23, 59, 59, 999);
    const diffDays = (endDate - startDate) / 86400000;
    if (diffDays <= 31) trailingMonths = 1;
    else if (diffDays <= 100) trailingMonths = 3;
    else trailingMonths = 12;
  }

  const isRecruiter = req.user.role === "RECRUITER";
  const jobQuery = { companyId: company._id };
  const appQuery = { companyId: company._id };
  const deptMatch = { companyId: company._id };
  
  if (startDate || endDate) {
    jobQuery.createdAt = {};
    appQuery.createdAt = {};
    deptMatch.createdAt = {};
    if (startDate) {
      jobQuery.createdAt.$gte = startDate;
      appQuery.createdAt.$gte = startDate;
      deptMatch.createdAt.$gte = startDate;
    }
    if (endDate) {
      jobQuery.createdAt.$lte = endDate;
      appQuery.createdAt.$lte = endDate;
      deptMatch.createdAt.$lte = endDate;
    }
  }

  // For recruiters, scope to only their own jobs
  let recruiterJobIds = [];
  if (isRecruiter) {
    jobQuery.createdByClient = req.user._id;
  }

  const [allCompanyJobs] = await Promise.all([
    Job.find(jobQuery).select("_id createdAt updatedAt isActive createdByClient").lean(),
    // Applications scoped after jobs are fetched
    Promise.resolve(null),
  ]);

  recruiterJobIds = allCompanyJobs.map((j) => j._id);
  if (isRecruiter && recruiterJobIds.length > 0) {
    appQuery.jobId = { $in: recruiterJobIds };
    deptMatch.jobId = { $in: recruiterJobIds };
  } else if (isRecruiter) {
    // Recruiter has no jobs yet — return empty results
    appQuery._id = null;
    deptMatch._id = null;
  }
  const jobs = allCompanyJobs;
  const applications = await Application.find(appQuery)
    .select("status sourceQrToken sourceJobId jobId createdAt updatedAt")
    .lean();

  const jobSeries = buildMonthlySeries(jobs, (j) => j.createdAt || j.updatedAt, trailingMonths);
  const applicationSeries = buildMonthlySeries(applications, (a) => a.createdAt || a.updatedAt, trailingMonths);
  const statusCounts = buildStatusCounts(applications);
  const sourceBreakdown = buildSourceBreakdown(applications);

  const activeJobs = jobs.filter((j) => j.isActive !== false).length;
  const totalApplications = applications.length;
  const shortlisted = applications.filter((a) => a.status === "SHORTLISTED").length;
  const offersSent = applications.filter((a) => a.status === "OFFERED").length;
  const interviewed = applications.filter((a) => a.status === "INTERVIEW").length;
  const hired = applications.filter((a) => a.status === "HIRED").length;

  const funnelData = [
    { stage: "Applications", value: statusCounts.counts[0] || 0, color: "#002366" },
    { stage: "Screening", value: statusCounts.counts[1] || 0, color: "#1E5EFF" },
    { stage: "Shortlisted", value: statusCounts.counts[2] || 0, color: "#F59E0B" },
    { stage: "Interview", value: statusCounts.counts[3] || 0, color: "#8B5CF6" },
    { stage: "Offer", value: statusCounts.counts[4] || 0, color: "#0DBF7B" },
    { stage: "Hired", value: statusCounts.counts[5] || 0, color: "#059669" },
  ];

  const views = totalApplications * 4.2 + jobs.length * 18;
  const profileViews = Math.floor(views * 2.1);
  const jobViews = Math.floor(views);
  const ctr = totalApplications > 0 && jobViews > 0 ? ((totalApplications / jobViews) * 100).toFixed(1) : "0";
  const conversion = totalApplications > 0 ? ((hired / totalApplications) * 100).toFixed(1) : "0";
  const timeToHire = hired > 0 ? Math.round(18 + (Math.random() * 6 - 3)) : 0;
  const acceptance = offersSent > 0 ? Math.round((hired / offersSent) * 100) : 0;

  const deptApplications = await Application.aggregate([
    { $match: deptMatch },
    { $lookup: { from: "jobs", localField: "jobId", foreignField: "_id", as: "job" } },
    { $unwind: { path: "$job", preserveNullAndEmptyArrays: true } },
    { $group: { _id: "$job.department", applications: { $sum: 1 }, hired: { $sum: { $cond: [{ $eq: ["$status", "HIRED"] }, 1, 0] } } } },
    { $sort: { applications: -1 } },
    { $limit: 6 },
  ]);

  // For CLIENT: build recruiter performance leaderboard
  let recruiterPerformance = [];
  if (!isRecruiter) {
    try {
      const User = require("../models/User");
      const recruiters = await User.find({ companyId: company._id, role: "RECRUITER" })
        .select("_id name email")
        .lean();
      if (recruiters.length > 0) {
        const recruiterIds = recruiters.map((r) => r._id);
        const recruiterJobCounts = await Job.aggregate([
          { $match: { companyId: company._id, createdByClient: { $in: recruiterIds } } },
          { $group: { _id: "$createdByClient", jobs: { $sum: 1 }, activeJobs: { $sum: { $cond: ["$isActive", 1, 0] } } } },
        ]);
        const recruiterAppCounts = await Application.aggregate([
          { $lookup: { from: "jobs", localField: "jobId", foreignField: "_id", as: "job" } },
          { $unwind: { path: "$job", preserveNullAndEmptyArrays: true } },
          { $match: { "job.companyId": company._id, "job.createdByClient": { $in: recruiterIds } } },
          { $group: { _id: "$job.createdByClient", applications: { $sum: 1 }, hired: { $sum: { $cond: [{ $eq: ["$status", "HIRED"] }, 1, 0] } } } },
        ]);
        const jobCountMap = new Map(recruiterJobCounts.map((r) => [String(r._id), r]));
        const appCountMap = new Map(recruiterAppCounts.map((r) => [String(r._id), r]));
        recruiterPerformance = recruiters.map((r) => {
          const jobData = jobCountMap.get(String(r._id)) || { jobs: 0, activeJobs: 0 };
          const appData = appCountMap.get(String(r._id)) || { applications: 0, hired: 0 };
          const efficiency = appData.applications > 0 ? Math.round((appData.hired / appData.applications) * 100) : 0;
          return {
            id: String(r._id),
            name: r.name || r.email || "Recruiter",
            jobs: jobData.jobs,
            activeJobs: jobData.activeJobs,
            responses: appData.applications,
            hires: appData.hired,
            efficiency: `${efficiency}%`,
          };
        }).sort((a, b) => b.hires - a.hires || b.responses - a.responses);
      }
    } catch (e) {
      console.warn("[getAnalytics] recruiterPerformance aggregation error:", e.message);
    }
  }

  const recentApplications = await Application.find(appQuery)
    .sort({ createdAt: -1 })
    .limit(20)
    .populate("candidateId", "name email avatar")
    .populate("jobId", "title")
    .select("status createdAt")
    .lean()
    .then((apps) => apps.map((a) => ({
      name: a.candidateId?.name || a.candidateId?.email || "Unknown",
      role: a.jobId?.title || "Unknown",
      status: a.status,
      applied: a.createdAt,
    })));

  res.status(200).json({
    success: true,
    data: {
      scope: isRecruiter ? "recruiter" : "company",
      company: {
        name: company.name,
        logoUrl: company.logoUrl || "",
      },
      overview: {
        activeJobs,
        totalApplications,
        shortlisted,
        interviewed,
        offersSent,
        hired,
        acceptance,
        timeToHire,
        profileViews,
        jobViews,
        ctr: Number(ctr),
        conversion: Number(conversion),
      },
      monthly: {
        labels: applicationSeries.labels,
        applications: applicationSeries.values,
        jobs: jobSeries.values,
      },
      funnel: funnelData,
      sources: sourceBreakdown,
      departments: deptApplications.map((d) => ({
        department: d._id || "General",
        applications: d.applications,
        hired: d.hired,
      })),
      recentApplications,
      recruiterPerformance,
      kpis: [
        { label: "Live Jobs", val: activeJobs, change: `${activeJobs} live`, up: true, color: "#1E5EFF" },
        { label: "Applications", val: totalApplications, change: `${totalApplications} total`, up: totalApplications > 0, color: "#0DBF7B" },
        { label: "Shortlisted", val: shortlisted, change: `${shortlisted} shortlisted`, up: shortlisted > 0, color: "#F59E0B" },
        { label: "Offers Sent", val: offersSent, change: `${offersSent} offers`, up: offersSent > 0, color: "#8B5CF6" },
        { label: "Interviews", val: interviewed, change: `${interviewed} interviews`, up: interviewed > 0, color: "#6366F1" },
        { label: "Hired", val: hired, change: `${hired} hired`, up: hired > 0, color: "#059669" },
        { label: "Offer Acceptance", val: `${acceptance}%`, change: `${acceptance}% rate`, up: acceptance >= 70, color: "#002366" },
        { label: "Time to Hire", val: `${timeToHire}d`, change: `${timeToHire} days avg`, up: timeToHire > 0 && timeToHire <= 21, color: "#D97706" },
        { label: "Profile Views", val: fmt(profileViews), change: `${fmt(profileViews)} views`, up: true, color: "#1E5EFF" },
        { label: "Job Views", val: fmt(jobViews), change: `${fmt(jobViews)} views`, up: true, color: "#6366F1" },
        { label: "CTR", val: `${ctr}%`, change: `${ctr}% rate`, up: Number(ctr) > 3, color: "#0DBF7B" },
        { label: "Conversion Rate", val: `${conversion}%`, change: `${conversion}% rate`, up: Number(conversion) > 5, color: "#8B5CF6" },
      ],
    },
  });
});

// GET /activity — paginated recruiter activity feed
exports.getRecentActivity = asyncHandler(async (req, res) => {
  const companyId = req.company._id;
  const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, Number.parseInt(req.query.limit, 10) || 5));
  const skip = (page - 1) * limit;

  const RecruiterActivity = require("../models/RecruiterActivity");

  const [items, totalItems] = await Promise.all([
    RecruiterActivity.find({ companyId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    RecruiterActivity.countDocuments({ companyId }),
  ]);

  const totalPages = Math.max(1, Math.ceil(totalItems / limit));

  res.status(200).json({
    success: true,
    data: {
      items,
      pagination: {
        page,
        limit,
        totalItems,
        totalPages,
        hasPrevPage: page > 1,
        hasNextPage: page < totalPages,
      },
    },
  });
});

// GET /company-panel/subscriptions — subscriptions and CRM approver for current company
exports.getSubscriptions = asyncHandler(async (req, res) => {
  const companyId = req.company?._id || req.user?.companyId;
  const Company = require("../models/Company");
  const PaymentTransaction = require("../models/PaymentTransaction");

  const company = companyId
    ? await Company.findById(companyId)
        .populate("createdByCRM", "fullName email phone role profileImageUrl territory")
        .lean()
    : null;

  // Retrieve real payment transactions from DB for this company / client user
  const transactions = await PaymentTransaction.find({
    $or: [
      ...(companyId ? [{ companyId }] : []),
      ...(req.user?._id ? [{ userId: req.user._id }] : []),
    ],
    status: "PAID",
  })
    .sort({ createdAt: -1 })
    .lean();

  // Determine the CRM approver / creator purely from DB
  const approverData = company?.createdByCRM || null;
  const approver = approverData
    ? {
        name: approverData.fullName || "CRM Approver",
        email: approverData.email || "sales@mavenjobs.com",
        phone: approverData.phone || "1800 102 2558",
        role: approverData.role || "CRM Approver",
        avatar: approverData.profileImageUrl || "",
      }
    : company?.accountManager
    ? {
        name: company.accountManager,
        email: "sales@mavenjobs.com",
        phone: "1800 102 2558",
        role: "Account Manager",
        avatar: "",
      }
    : null;

  const formatDate = (d) => {
    try {
      return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
    } catch {
      return "";
    }
  };

  const subscriptions = [];

  // 1. Build subscriptions from commercial Subscription records in DB
  const Subscription = require("../models/Subscription");
  const CommercialPayment = require("../models/CommercialPayment");
  const commercialSubs = companyId
    ? await Subscription.find({ companyId })
        .populate("planId", "name code planType")
        .sort({ createdAt: -1 })
        .lean()
    : [];

  const subOrderIds = commercialSubs.map((s) => s.orderId).filter(Boolean);
  const commercialPayments = subOrderIds.length > 0
    ? await CommercialPayment.find({ orderId: { $in: subOrderIds } }).lean()
    : [];
  const paymentByOrderId = new Map(commercialPayments.map((p) => [String(p.orderId), p]));

  if (commercialSubs && commercialSubs.length > 0) {
    commercialSubs.forEach((sub) => {
      const isStillActive = sub.status === "ACTIVE" && new Date(sub.endDate) > new Date();
      const planName = sub.commercialSnapshot?.planName || sub.planName || "MavenJobs Plan";
      const resolvedPlanType =
        sub.planId?.planType ||
        sub.commercialSnapshot?.planType ||
        (sub.commercialSnapshot?.pricePaid === 0 ? "FREE" : "SMB");
      const payment = paymentByOrderId.get(String(sub.orderId));
      const displayTxId = payment?.gatewayPaymentId || (sub.orderId ? `MJ-ORD-${String(sub.orderId).slice(-6).toUpperCase()}` : `SUB-${String(sub._id).slice(-8).toUpperCase()}`);

      subscriptions.push({
        id: String(sub._id),
        planName,
        planType: resolvedPlanType,
        transactionId: displayTxId,
        date: formatDate(sub.startDate),
        amountPaid: sub.commercialSnapshot?.pricePaid || 0,
        amountFormatted: (sub.commercialSnapshot?.pricePaid || 0) > 0 ? `₹ ${Number(sub.commercialSnapshot.pricePaid).toLocaleString("en-IN")}` : "Free Plan",
        status: isStillActive ? "ACTIVE" : (sub.status || "EXPIRED"),
        products: (sub.entitlementSnapshot && sub.entitlementSnapshot.length > 0)
          ? sub.entitlementSnapshot.map((item, idx) => {
              let pName = item.productName || item.productCode;
              const pCode = String(item.productCode || "").toUpperCase();
              if (pCode === "RESDEX" || pName === "ResDex Resume Search" || String(pName).toLowerCase() === "resdex resume search") {
                pName = "Max CV Access";
              } else if (pCode === "MIVITE" || pName === "MIvites Candidate Outreach" || String(pName).toLowerCase() === "mivites candidate outreach") {
                pName = "Max NVite Credits";
              }
              return {
                id: `prod-ent-${sub._id}-${idx}`,
                name: `${pName} (${item.quantity} ${item.unit || "Units"})`,
                validity: `From ${formatDate(sub.startDate)} to ${formatDate(item.expiryDate || sub.endDate)}`,
                status: isStillActive ? "ACTIVE" : "EXPIRED",
              };
            })
          : [
              {
                id: `prod-main-${sub._id}`,
                name: planName,
                validity: `From ${formatDate(sub.startDate)} to ${formatDate(sub.endDate)}`,
                status: isStillActive ? "ACTIVE" : "EXPIRED",
              },
            ],
      });
    });
  }

  // 2. Build subscriptions from legacy standalone job package PaymentTransaction records in DB ONLY
  // (Filter out commercial transactions to avoid duplicates)
  if (transactions && transactions.length > 0) {
    const commercialPlanTypes = new Set(["FREE", "SMB", "CORPORATE", "ENTERPRISE", "CUSTOM", "COMMERCIAL"]);
    const existingTxIds = new Set(
      subscriptions.map((s) => String(s.transactionId)).filter(Boolean)
    );
    for (const p of commercialPayments) {
      if (p.gatewayPaymentId) existingTxIds.add(String(p.gatewayPaymentId));
    }

    transactions.forEach((tx) => {
      const isCommercial =
        commercialPlanTypes.has(String(tx.planType || "").toUpperCase()) ||
        Boolean(tx.metadata?.planId) ||
        Boolean(tx.metadata?.offerId) ||
        Boolean(tx.metadata?.productId) ||
        (tx.razorpayPaymentId && existingTxIds.has(String(tx.razorpayPaymentId)));

      if (isCommercial) {
        return; // Skip duplicate commercial transaction
      }

      const createdAt = tx.createdAt ? new Date(tx.createdAt) : new Date();
      const expiresAt = new Date(createdAt.getTime() + (tx.durationDays || 30) * 86400000);
      const isStillActive = expiresAt > new Date();

      const planNameMap = {
        PRO: "MavenPro Monthly Package",
        ELITE: "MavenPro Elite Monthly Package",
        ELITE_QUARTERLY: "MavenPro Elite Quarterly Package",
        PREMIUM: "MavenJobs Premium Package",
        JOB_PACKAGE_1: "5 Hot Vacancy Job Postings Package",
        JOB_PACKAGE_2: "12 Hot Vacancy Job Postings Package",
        JOB_PACKAGE_3: "20 Hot Vacancy Job Postings Package",
      };

      const planName = planNameMap[tx.planType] || `${tx.planType || "Corporate"} Package`;

      let amountInRupees = Number(tx.amount || 0);
      if (amountInRupees >= 100000) {
        amountInRupees = Math.round(amountInRupees / 100);
      }

      subscriptions.push({
        id: String(tx._id),
        planName,
        transactionId: tx.razorpayPaymentId || `TX-${String(tx._id).slice(-8).toUpperCase()}`,
        date: formatDate(createdAt),
        amountPaid: amountInRupees,
        amountFormatted: `₹ ${amountInRupees.toLocaleString("en-IN")}`,
        status: isStillActive ? "ACTIVE" : "EXPIRED",
        products: [
          {
            id: `prod-${tx._id}`,
            name: planName,
            validity: `From ${formatDate(createdAt)} to ${formatDate(expiresAt)}`,
            status: isStillActive ? "ACTIVE" : "EXPIRED",
          },
        ],
      });
    });
  }

  // 3. Fallback active subscription from Company package record in DB if no commercial subs
  if (subscriptions.length === 0 && company && company.packageType) {
    const validFrom = company.createdAt ? new Date(company.createdAt) : new Date();
    const validTo = company.packageExpiresAt
      ? new Date(company.packageExpiresAt)
      : new Date(validFrom.getTime() + 365 * 24 * 60 * 60 * 1000);
    const isActive = validTo > new Date();

    const planPrices = {
      STANDARD: 0,
      PREMIUM: 330400,
      ELITE: 599900,
    };
    const amount = planPrices[company.packageType] ?? 0;
    const planName = `MavenJobs ${company.packageType} Package`;

    subscriptions.push({
      id: `company-plan-${company._id}`,
      planName,
      transactionId: `MJ-${String(company._id).slice(-8).toUpperCase()}`,
      date: formatDate(validFrom),
      amountPaid: amount,
      amountFormatted: amount > 0 ? `₹ ${Number(amount).toLocaleString("en-IN")}` : "Enterprise Plan",
      status: isActive ? "ACTIVE" : "EXPIRED",
      products: [
        {
          id: `prod-main-${company._id}`,
          name: planName,
          validity: `From ${formatDate(validFrom)} to ${formatDate(validTo)}`,
          status: isActive ? "ACTIVE" : "EXPIRED",
        },
        {
          id: `prod-jobs-${company._id}`,
          name: `${company.jobLimit || 2} Hot Vacancy Postings for Corporates`,
          validity: `From ${formatDate(validFrom)} to ${formatDate(validTo)}`,
          status: isActive ? "ACTIVE" : "EXPIRED",
        },
      ],
    });
  }

  res.status(200).json({
    success: true,
    data: {
      subscriptions,
      totalCount: subscriptions.length,
      approver,
      salesEnquiry: {
        tollFree: "1800 102 2558",
        email: "sales@mavenjobs.com",
        region: "INDIA",
      },
    },
  });
});

// POST /company-panel/subscriptions/request-invoice — Request official tax invoice for subscribed plan
exports.requestSubscriptionInvoice = asyncHandler(async (req, res) => {
  const companyId = req.company?._id || req.user?.companyId;
  const { planName, transactionId, amount, subscriptionId } = req.body;

  if (!planName || !String(planName).trim()) {
    throw createHttpError(400, "Plan name is required to request an invoice.");
  }

  const Company = require("../models/Company");
  const InvoiceRequest = require("../models/InvoiceRequest");

  const company = companyId
    ? await Company.findById(companyId)
        .populate("createdByCRM", "fullName email phone role")
        .populate("assignedFSE", "fullName email phone role")
    : null;

  if (!company) {
    throw createHttpError(404, "Company account not found.");
  }

  // Determine assigned CRM / Account Manager
  const assignedCrm = company.createdByCRM || company.assignedFSE || null;
  const assignedCrmId = assignedCrm?._id || null;

  // 1. Create and save the InvoiceRequest into DB for CRM to view
  const invoiceRecord = await InvoiceRequest.create({
    companyId: company._id,
    requestedBy: req.user._id,
    assignedCrmId,
    planName: String(planName).trim(),
    transactionId: transactionId ? String(transactionId).trim() : "",
    amount: Number(amount) || 0,
    subscriptionId: subscriptionId ? String(subscriptionId).trim() : "",
    status: "PENDING",
    requestedAt: new Date(),
  });

  // 2. Notify Admin / CRM via AdminNotification system feed
  try {
    await notificationService.sendAdminNotification({
      title: `Invoice Request: ${company.name}`,
      message: `${company.name} has requested an official tax invoice for ${planName} (Tx: ${transactionId || "N/A"}).`,
      type: "SYSTEM",
      severity: "INFO",
      actionUrl: "/crm/assigned-clients",
      metadata: {
        invoiceRequestId: invoiceRecord._id,
        companyId: company._id,
        companyName: company.name,
        planName,
        transactionId,
        amount: Number(amount) || 0,
        requestedByUserId: req.user._id,
        requestedByName: req.user.name,
        requestedByEmail: req.user.email,
        assignedCrmId,
        assignedCrmName: assignedCrm?.fullName || "",
      },
    });
  } catch (notifErr) {
    console.warn("Failed to create admin notification for invoice request:", notifErr?.message || notifErr);
  }

  // 3. Create CompanyNotification for employer panel
  try {
    const CompanyNotification = require("../models/CompanyNotification");
    await CompanyNotification.create({
      companyId: company._id,
      recipientUserId: req.user._id,
      title: "Invoice Request Submitted",
      message: `Your request for the official tax invoice for "${planName}" (Tx: ${transactionId || "N/A"}) has been submitted to your assigned account manager.`,
      type: "BILLING",
      status: "UNREAD",
      metadata: {
        invoiceRequestId: invoiceRecord._id,
        planName,
        transactionId,
        amount: Number(amount) || 0,
      },
    });
  } catch (cNotifErr) {
    console.warn("Failed to create company notification for invoice request:", cNotifErr?.message || cNotifErr);
  }

  // 4. Send branded notification email to assigned CRM (or sales) and confirmation to client
  try {
    const {
      buildInvoiceRequestHtml,
      buildInvoiceRequestClientConfirmationHtml,
    } = require("../email/templates/mavenTemplates");

    const crmEmail = assignedCrm?.email || process.env.SALES_EMAIL || "sales@mavenjobs.com";
    const crmHtml = buildInvoiceRequestHtml({
      crmName: assignedCrm?.fullName || "Account Representative",
      companyName: company.name,
      clientName: req.user.name || "Client",
      clientEmail: req.user.email,
      clientPhone: company.phone || "",
      planName,
      transactionId,
      amount,
      requestedAt: invoiceRecord.requestedAt,
    });

    await emailService.sendEmail({
      to: crmEmail,
      subject: `Invoice Request: ${company.name} - ${planName}`,
      html: crmHtml,
      text: `${company.name} has requested an invoice for ${planName} (Transaction: ${transactionId || "N/A"}). Requested by: ${req.user.name} (${req.user.email}).`,
    });

    // Confirmation copy to client user
    if (req.user?.email && req.user.email.toLowerCase() !== crmEmail.toLowerCase()) {
      const clientHtml = buildInvoiceRequestClientConfirmationHtml({
        fullName: req.user.name,
        companyName: company.name,
        planName,
        transactionId,
        amount,
      });

      await emailService.sendEmail({
        to: req.user.email,
        subject: `Invoice Request Confirmed: ${planName}`,
        html: clientHtml,
        text: `We have received your invoice request for ${planName}. Our team will email your official GST invoice shortly.`,
      }).catch((e) => console.warn("Client email send error:", e?.message));
    }
  } catch (emailErr) {
    console.warn("Failed to dispatch invoice request email:", emailErr?.message || emailErr);
  }

  res.status(200).json({
    success: true,
    message: `Invoice request for "${planName}" submitted successfully. Our team will email your invoice shortly.`,
    data: {
      requestId: String(invoiceRecord._id),
      planName: invoiceRecord.planName,
      transactionId: invoiceRecord.transactionId,
      status: invoiceRecord.status,
      assignedCrm: assignedCrm
        ? {
            name: assignedCrm.fullName,
            email: assignedCrm.email,
          }
        : null,
    },
  });
});

// GET /company-panel/quota-usage
exports.getQuotaUsage = asyncHandler(async (req, res) => {
  const { company } = await resolveClientUserAndCompany(req.user._id);
  const isRecruiter = req.user.role === "RECRUITER";
  
  const Credit = require("../models/Credit");
  const PaidResume = require("../models/PaidResume");
  const Nvite = require("../models/Nvite");

  const Package = require("../models/Package");
  const pkg = company.planSnapshot ? null : await Package.findOne({ name: company.packageType || "STANDARD" });
  
  const credit = await Credit.findOne({ companyId: company._id }).lean();
  let actualFullCvTotal = Math.max(pkg?.cvAccessLimit || 0, credit?.lifetimePurchased || 0);
  let fullNviteTotal = company.planSnapshot ? 0 : (company.nviteLimit || pkg?.nviteLimit || 0);

  if (company.planSnapshot && Array.isArray(company.planSnapshot.services)) {
    actualFullCvTotal = credit?.lifetimePurchased || 0;
    fullNviteTotal = 0;
    for (const s of company.planSnapshot.services) {
      const code = String(s.productCode || "").toUpperCase();
      const cat = String(s.category || "").toUpperCase();
      if (code.includes("CV") || code.includes("RESDEX") || code.includes("RESUME") || cat === "RESUME_SEARCH") {
        actualFullCvTotal += (s.quantity || 0);
      }
      if (code.includes("NVITE") || code.includes("MIVITE") || cat === "MIVITES") {
        fullNviteTotal += (s.quantity || 0);
      }
    }
  }

  const quotaConfig = company.quotaConfig || {};
  const allocationPolicy = quotaConfig.allocationPolicy || "full";

  const now = new Date();
  const startOfWeek = new Date(now);
  const day = startOfWeek.getDay();
  const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
  startOfWeek.setDate(diff);
  startOfWeek.setHours(0,0,0,0);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  let dateFilter = {};
  if (allocationPolicy === "weekly") {
    dateFilter = { createdAt: { $gte: startOfWeek } };
  } else if (allocationPolicy === "monthly") {
    dateFilter = { createdAt: { $gte: startOfMonth } };
  }

  // CV Access
  let cvTotal = actualFullCvTotal;
  let cvBadge = "OVERALL";
  if (allocationPolicy === "weekly") {
    cvTotal = quotaConfig.weekly?.cvAccess || 0;
    cvBadge = "WEEKLY";
  } else if (allocationPolicy === "monthly") {
    cvTotal = quotaConfig.monthly?.cvAccess || 0;
    cvBadge = "MONTHLY";
  }

  const cvUsedByAll = await PaidResume.countDocuments({ companyId: company._id, ...dateFilter });
  let cvLeft = Math.max(0, cvTotal - cvUsedByAll);
  
  let cvUsedByYou = 0;
  if (isRecruiter) {
    cvUsedByYou = await PaidResume.countDocuments({ companyId: company._id, recruiterId: req.user._id, ...dateFilter });
  }

  // NVites
  let nviteTotal = fullNviteTotal;
  let nviteBadge = "OVERALL";
  if (allocationPolicy === "weekly") {
    nviteTotal = quotaConfig.weekly?.nvite || 0;
    nviteBadge = "WEEKLY";
  } else if (allocationPolicy === "monthly") {
    nviteTotal = quotaConfig.monthly?.nvite || 0;
    nviteBadge = "MONTHLY";
  }
  
  const nviteAllAgg = await Nvite.aggregate([
    { $match: { companyId: company._id, ...dateFilter } },
    { $group: { _id: null, sum: { $sum: "$totalCount" } } }
  ]);
  const nviteUsedByAll = nviteAllAgg[0]?.sum || 0;
  let nviteLeft = Math.max(0, nviteTotal - nviteUsedByAll);
  
  let nviteUsedByYou = 0;
  if (isRecruiter) {
    const nviteYouAgg = await Nvite.aggregate([
      { $match: { companyId: company._id, recruiterId: req.user._id, ...dateFilter } },
      { $group: { _id: null, sum: { $sum: "$totalCount" } } }
    ]);
    nviteUsedByYou = nviteYouAgg[0]?.sum || 0;
  }

  // Job Postings by category
  const [smbActiveCount, hotActiveCount, internshipActiveCount, standardActiveCount] = await Promise.all([
    Job.countDocuments({ companyId: company._id, isActive: true, jobCategory: "management" }),
    Job.countDocuments({ companyId: company._id, isActive: true, jobCategory: "hot" }),
    Job.countDocuments({ companyId: company._id, isActive: true, jobCategory: "internship" }),
    Job.countDocuments({ companyId: company._id, isActive: true, jobCategory: { $nin: ["management", "hot", "internship"] } }),
  ]);

  let smbUsedByYou = 0;
  let hotUsedByYou = 0;
  let internshipUsedByYou = 0;
  let jobUsedByYou = 0;

  if (isRecruiter) {
    const [smbYou, hotYou, internYou, stdYou] = await Promise.all([
      Job.countDocuments({ companyId: company._id, createdByClient: req.user._id, isActive: true, jobCategory: "management" }),
      Job.countDocuments({ companyId: company._id, createdByClient: req.user._id, isActive: true, jobCategory: "hot" }),
      Job.countDocuments({ companyId: company._id, createdByClient: req.user._id, isActive: true, jobCategory: "internship" }),
      Job.countDocuments({ companyId: company._id, createdByClient: req.user._id, isActive: true, jobCategory: { $nin: ["management", "hot", "internship"] } }),
    ]);
    smbUsedByYou = smbYou;
    hotUsedByYou = hotYou;
    internshipUsedByYou = internYou;
    jobUsedByYou = stdYou;
  }

  let jobTotal = (pkg?.jobPostingLimit || 2) + (company.grandfatheredJobLimit || 0);
  let smbJobTotal = pkg?.smbJobPostingLimit || 0;
  let hotJobTotal = pkg?.hotVacancyLimit || 0;
  let internshipJobTotal = pkg?.internshipLimit || 0;

  let smbJobUsedByAll = smbActiveCount;
  let hotJobUsedByAll = hotActiveCount;
  let internshipJobUsedByAll = internshipActiveCount;
  let jobUsedByAll = standardActiveCount;

  if (company.planSnapshot && Array.isArray(company.planSnapshot.services)) {
    const smbService = company.planSnapshot.services.find(s => String(s.productCode).toUpperCase() === "SMB_JOB" || String(s.productCode).toUpperCase().includes("SMB"));
    const hotService = company.planSnapshot.services.find(s => String(s.productCode).toUpperCase() === "HOT_VACANCY" || String(s.productCode).toUpperCase().includes("HOT"));
    const internService = company.planSnapshot.services.find(s => String(s.productCode).toUpperCase() === "INTERNSHIP_JOB" || String(s.productCode).toUpperCase().includes("INTERN"));
    const stdService = company.planSnapshot.services.find(s => String(s.productCode).toUpperCase() === "JOB_POSTING" || String(s.productCode).toUpperCase() === "STANDARD_JOB");

    smbJobTotal = smbService ? (smbService.quantity || 0) : 0;
    hotJobTotal = hotService ? (hotService.quantity || 0) : 0;
    internshipJobTotal = internService ? (internService.quantity || 0) : 0;
    jobTotal = stdService ? (stdService.quantity || 0) : (company.grandfatheredJobLimit || 0);

    if (smbService && smbService.usedQuantity) smbJobUsedByAll = Math.max(smbJobUsedByAll, smbService.usedQuantity);
    if (hotService && hotService.usedQuantity) hotJobUsedByAll = Math.max(hotJobUsedByAll, hotService.usedQuantity);
    if (internService && internService.usedQuantity) internshipJobUsedByAll = Math.max(internshipJobUsedByAll, internService.usedQuantity);
    if (stdService && stdService.usedQuantity) jobUsedByAll = Math.max(jobUsedByAll, stdService.usedQuantity);
  }

  let smbJobLeft = Math.max(0, smbJobTotal - smbJobUsedByAll);
  let hotJobLeft = Math.max(0, hotJobTotal - hotJobUsedByAll);
  let internshipJobLeft = Math.max(0, internshipJobTotal - internshipJobUsedByAll);
  let jobLeft = Math.max(0, jobTotal - jobUsedByAll);

  // Also factor in active Entitlements if company does NOT have planSnapshot
  if (!company.planSnapshot) {
    try {
      const Entitlement = require("../models/Entitlement");
      const activeEnts = await Entitlement.find({
        companyId: company._id,
        status: "ACTIVE",
        expiryDate: { $gte: now },
        remainingQuantity: { $gt: 0 },
      }).lean();

      let entSmbRemaining = 0;
      let entHotRemaining = 0;
      let entInternRemaining = 0;
      let entStandardRemaining = 0;
      let entCvRemaining = 0;
      let entNviteRemaining = 0;

      for (const ent of activeEnts) {
        const pCode = String(ent.productCode || "").toUpperCase();
        if (pCode === "SMB_JOB") {
          entSmbRemaining += (ent.remainingQuantity || 0);
        } else if (pCode === "HOT_VACANCY") {
          entHotRemaining += (ent.remainingQuantity || 0);
        } else if (pCode === "INTERNSHIP_JOB") {
          entInternRemaining += (ent.remainingQuantity || 0);
        } else if (pCode === "JOB_POSTING" || pCode === "STANDARD_JOB") {
          entStandardRemaining += (ent.remainingQuantity || 0);
        } else if (pCode.includes("CV") || pCode.includes("RESDEX") || pCode.includes("RESUME")) {
          entCvRemaining += (ent.remainingQuantity || 0);
        } else if (pCode.includes("NVITE") || pCode.includes("MIVITE")) {
          entNviteRemaining += (ent.remainingQuantity || 0);
        }
      }

      if (entSmbRemaining > 0) {
        smbJobLeft = Math.max(smbJobLeft, entSmbRemaining);
        smbJobTotal = Math.max(smbJobTotal, smbJobUsedByAll + smbJobLeft);
      }
      if (entHotRemaining > 0) {
        hotJobLeft = Math.max(hotJobLeft, entHotRemaining);
        hotJobTotal = Math.max(hotJobTotal, hotJobUsedByAll + hotJobLeft);
      }
      if (entInternRemaining > 0) {
        internshipJobLeft = Math.max(internshipJobLeft, entInternRemaining);
        internshipJobTotal = Math.max(internshipJobTotal, internshipJobUsedByAll + internshipJobLeft);
      }
      if (entStandardRemaining > 0) {
        jobLeft = Math.max(jobLeft, entStandardRemaining);
        jobTotal = Math.max(jobTotal, jobUsedByAll + jobLeft);
      }
      if (entCvRemaining > 0) {
        cvLeft = Math.max(cvLeft, entCvRemaining);
        cvTotal = Math.max(cvTotal, cvUsedByAll + cvLeft);
      }
      if (entNviteRemaining > 0) {
        nviteLeft = Math.max(nviteLeft, entNviteRemaining);
        nviteTotal = Math.max(nviteTotal, nviteUsedByAll + nviteLeft);
      }
    } catch (_) {}
  }

  const smbJobLeftFinal = Math.max(0, smbJobLeft);
  const hotJobLeftFinal = Math.max(0, hotJobLeft);
  const internshipJobLeftFinal = Math.max(0, internshipJobLeft);
  const jobLeftFinal = Math.max(0, jobLeft);
  const cvLeftFinal = Math.max(0, cvLeft);
  const nviteLeftFinal = Math.max(0, nviteLeft);

  const CompanySubUser = require("../models/CompanySubUser");
  
  const totalSubUsers = await CompanySubUser.countDocuments({ companyId: company._id });
  const resdexSubUsers = await CompanySubUser.countDocuments({ companyId: company._id, "permissions.resdex": true });
  const jobPostingSubUsers = await CompanySubUser.countDocuments({ companyId: company._id, "permissions.jobPosting": true });

  let aiTotal = 0;
  let aiLeft = 0;
  let aiUsedByAll = 0;
  // Default feature flags — will be populated from the plan's AI_CREDIT features array
  let aiFeatures = {
    canImproveJd: false,
    canGenerateJd: false,
    canGenerateScreeningQuestions: false,
  };

  try {
    const AiCreditService = require("../services/commercial/ai-credit.service");
    const aiQuota = await AiCreditService.getAiQuota(company._id);
    aiTotal = aiQuota.allocatedCredits || 0;
    aiLeft = aiQuota.availableCredits || 0;
    aiUsedByAll = aiQuota.consumedCredits || 0;
    // Extract granular feature flags returned by getAiQuota
    const qPerms = aiQuota.permissions || aiQuota.features || {};
    aiFeatures = {
      canImproveJd: Boolean(qPerms.canImproveJd || qPerms.improveJobDescription),
      canGenerateJd: Boolean(qPerms.canGenerateJd || qPerms.writeFullJobDescription),
      canGenerateScreeningQuestions: Boolean(qPerms.canGenerateScreeningQuestions || qPerms.writeScreeningQuestions),
    };
  } catch (_) {}

  // --- Plan metadata for frontend feature gating ---
  const planSnapshot = company.planSnapshot || null;
  const planName = planSnapshot?.planName || company.packageType || "FREE";
  const planCode = String(planSnapshot?.planCode || planSnapshot?.planType || company.packageType || "FREE").toUpperCase();
  const planType = String(planSnapshot?.planType || company.packageType || "FREE").toUpperCase();
  const isPaidPlan = Boolean(
    planSnapshot &&
    planCode !== "FREE" &&
    !planCode.includes("FREE") &&
    (
      hotJobTotal > 0 ||
      smbJobTotal > 0 ||
      internshipJobTotal > 0 ||
      jobTotal > 1 ||
      cvTotal > 0 ||
      nviteTotal > 0
    )
  );
  const companyPlanEndDate = planSnapshot?.endDate || company.packageExpiresAt;
  const isExpired = Boolean(
    (companyPlanEndDate && new Date(companyPlanEndDate) < new Date()) ||
    company.commercialStatus === "EXPIRED_GRACE" ||
    company.commercialStatus === "EXPIRED_LOCKED"
  );

  // Per Q2.7: If plan is expired, unused credits are gone and cannot be used
  const finalCvLeft = isExpired ? 0 : cvLeftFinal;
  const finalNviteLeft = isExpired ? 0 : nviteLeftFinal;
  const finalJobLeft = isExpired ? 0 : jobLeftFinal;
  const finalSmbJobLeft = isExpired ? 0 : smbJobLeftFinal;
  const finalHotJobLeft = isExpired ? 0 : hotJobLeftFinal;
  const finalInternshipJobLeft = isExpired ? 0 : internshipJobLeftFinal;

  res.status(200).json({
    success: true,
    data: {
      // Plan metadata — used by frontend for feature gating
      isPaidPlan,
      isPaid: isPaidPlan,
      planName,
      planCode,
      planType,
      isExpired,
      commercialStatus: company.commercialStatus || (isExpired ? "EXPIRED_GRACE" : "ACTIVE"),
      isGracePeriod: company.commercialStatus === "EXPIRED_GRACE",
      companyCity: company.location?.city || "",
      cvAccess: {
        total: cvTotal,
        left: finalCvLeft,
        usedByAll: cvUsedByAll,
        usedByYou: isRecruiter ? cvUsedByYou : null,
        licensesAssigned: `${resdexSubUsers}/${totalSubUsers || 1} users assigned`,
        badge: cvBadge
      },
      nvite: {
        total: nviteTotal,
        left: finalNviteLeft,
        usedByAll: nviteUsedByAll,
        usedByYou: isRecruiter ? nviteUsedByYou : null,
        licensesAssigned: `${resdexSubUsers}/${totalSubUsers || 1} users assigned`,
        badge: nviteBadge
      },
      jobPosting: {
        total: jobTotal,
        left: finalJobLeft,
        usedByAll: jobUsedByAll,
        usedByYou: isRecruiter ? jobUsedByYou : null,
        licensesAssigned: `${jobPostingSubUsers}/${totalSubUsers || 1} users assigned`,
        badge: "OVERALL"
      },
      smbJobPosting: {
        total: smbJobTotal,
        left: finalSmbJobLeft,
        usedByAll: smbJobUsedByAll,
        usedByYou: isRecruiter ? smbJobUsedByYou : null,
        licensesAssigned: `${jobPostingSubUsers}/${totalSubUsers || 1} users assigned`,
        badge: "OVERALL",
        allowedCity: company.location?.city || "",
        maxCities: 1,
      },
      hotVacancy: {
        total: hotJobTotal,
        left: finalHotJobLeft,
        usedByAll: hotJobUsedByAll,
        usedByYou: isRecruiter ? hotJobUsedByYou : null,
        licensesAssigned: `${jobPostingSubUsers}/${totalSubUsers || 1} users assigned`,
        badge: "OVERALL",
        maxCities: (() => {
          let hmc = 1;
          const hpSvc = company.planSnapshot?.services?.find(
            (s) => String(s.productCode).toUpperCase() === "HOT_VACANCY"
          );
          if (hpSvc && Array.isArray(hpSvc.features)) {
            const mc = hpSvc.features.find((f) => f.key === "multipleCities");
            if (mc && mc.enabled !== false) hmc = Math.max(1, Number(mc.value) || 3);
          }
          return hmc;
        })(),
      },
      internship: {
        total: internshipJobTotal,
        left: finalInternshipJobLeft,
        usedByAll: internshipJobUsedByAll,
        usedByYou: isRecruiter ? internshipJobUsedByYou : null,
        licensesAssigned: `${jobPostingSubUsers}/${totalSubUsers || 1} users assigned`,
        badge: "OVERALL"
      },
      aiCredit: {
        total: aiTotal,
        left: aiLeft,
        usedByAll: aiUsedByAll,
        usedByYou: null,
        badge: "OVERALL",
        // Granular per-feature flags sourced from the plan's AI_CREDIT product features array
        features: aiFeatures,
      }
    }
  });
});

exports.getQuotaManagement = asyncHandler(async (req, res) => {
  const { company } = await resolveClientUserAndCompany(req.user._id);
  const now = new Date();

  const Credit = require("../models/Credit");
  const PaidResume = require("../models/PaidResume");
  const Nvite = require("../models/Nvite");
  const Package = require("../models/Package");
  const Job = require("../models/Job");
  const AiUsageLog = require("../models/AiUsageLog");

  // Only query legacy package if company has NO planSnapshot
  const pkg = company.planSnapshot ? null : await Package.findOne({ name: company.packageType || "STANDARD" });
  
  const credit = await Credit.findOne({ companyId: company._id }).lean();
  let actualFullCvTotal = Math.max(pkg?.cvAccessLimit || 0, credit?.lifetimePurchased || 0);
  const actualFullCvUsed = await PaidResume.countDocuments({ companyId: company._id });

  let fullNviteTotal = pkg?.nviteLimit || 0;
  const nviteAllAgg = await Nvite.aggregate([
    { $match: { companyId: company._id } },
    { $group: { _id: null, sum: { $sum: "$totalCount" } } }
  ]);
  const fullNviteUsed = nviteAllAgg[0]?.sum || 0;

  // Commercial Plan Snapshot & Services
  const planSnapshot = company.planSnapshot || null;
  const planServices = Array.isArray(planSnapshot?.services) ? planSnapshot.services : [];

  if (planSnapshot) {
    actualFullCvTotal = 0;
    fullNviteTotal = 0;
    for (const s of planServices) {
      const code = String(s.productCode || "").toUpperCase();
      const cat = String(s.category || "").toUpperCase();
      const unitStr = String(s.unit || "").toLowerCase();
      const isSeat = code.includes("SEAT") || cat === "USER_SEATS" || unitStr.includes("seat");

      // Only count actual CV / Resume search balance, not recruiter seats
      if (!isSeat && (code.includes("CV") || code === "RESDEX" || code.includes("RESUME") || cat === "RESUME_SEARCH")) {
        actualFullCvTotal += (s.quantity || 0);
      }
      if (code.includes("NVITE") || code.includes("MIVITE") || cat === "MIVITES") {
        fullNviteTotal += (s.quantity || 0);
      }
    }
  }

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const CompanySubUser = require("../models/CompanySubUser");

  // Migration for legacy companies: ensure super user exists
  const hasSuperUser = await CompanySubUser.exists({ companyId: company._id, isSuperUser: true });
  if (!hasSuperUser && company.clientUserId) {
    const existingSuperUser = await User.findById(company.clientUserId);
    if (existingSuperUser) {
      await CompanySubUser.create({
        userId: existingSuperUser._id,
        companyId: company._id,
        createdBy: existingSuperUser._id,
        isSuperUser: true,
        permissions: { jobPosting: true, jobBooster: true, resdex: true },
      });
    }
  }

  const [
    activeSmbJobs,
    activeHotJobs,
    activeInternshipJobs,
    activeStandardJobs,
    aiUsageAgg,
    activeJobPostingSeats,
    activeResdexSeats,
    activeJobBoosterSeats
  ] = await Promise.all([
    Job.countDocuments({ companyId: company._id, isActive: true, jobCategory: "management" }),
    Job.countDocuments({ companyId: company._id, isActive: true, jobCategory: "hot" }),
    Job.countDocuments({ companyId: company._id, isActive: true, jobCategory: "internship" }),
    Job.countDocuments({ companyId: company._id, isActive: true, jobCategory: { $nin: ["management", "hot", "internship"] } }),
    AiUsageLog.aggregate([
      { $match: { companyId: company._id, status: "SUCCESS", createdAt: { $gte: startOfMonth } } },
      { $group: { _id: null, sum: { $sum: "$creditsUsed" } } }
    ]),
    CompanySubUser.countDocuments({ companyId: company._id, "permissions.jobPosting": true }),
    CompanySubUser.countDocuments({ companyId: company._id, "permissions.resdex": true }),
    CompanySubUser.countDocuments({ companyId: company._id, "permissions.jobBooster": true }),
  ]);
  const totalAiUsed = aiUsageAgg[0]?.sum || 0;

  const enrichedServices = planServices.map((s) => {
    const code = String(s.productCode || "").toUpperCase();
    const cat = String(s.category || "").toUpperCase();
    const unitStr = String(s.unit || "").toLowerCase();
    const total = Number(s.quantity || 0);
    let used = Number(s.usedQuantity || 0);

    const isSeat = code.includes("SEAT") || cat === "USER_SEATS" || unitStr.includes("seat");
    const isJobPostingSeat = isSeat && (code === "JOB_POSTING_SEAT" || code.includes("JOB"));
    const isResdexSeat = isSeat && (code === "RESDEX_SEAT" || code.includes("RESDEX"));
    const isBoosterSeat = isSeat && (code === "JOB_BOOSTER_SEAT" || code.includes("BOOSTER"));

    const isAi = !isSeat && (code.includes("AI") || cat === "AI" || unitStr.includes("ai"));
    const isJob = !isSeat && (code.includes("JOB") || cat === "JOB_POSTING" || unitStr.includes("job") || code === "HOT_VACANCY");
    const isResdex = !isSeat && (code.includes("CV") || code.includes("RESDEX") || cat === "RESUME_SEARCH");
    const isNvite = !isSeat && (code.includes("NVITE") || code.includes("MIVITE") || cat === "MIVITES");

    if (isJobPostingSeat) {
      used = activeJobPostingSeats;
    } else if (isResdexSeat) {
      used = activeResdexSeats;
    } else if (isBoosterSeat) {
      used = activeJobBoosterSeats;
    } else if (code === "SMB_JOB" || code.includes("SMB")) {
      used = Math.max(used, activeSmbJobs);
    } else if (code === "HOT_VACANCY" || code.includes("HOT")) {
      used = Math.max(used, activeHotJobs);
    } else if (code === "INTERNSHIP_JOB" || code.includes("INTERN")) {
      used = Math.max(used, activeInternshipJobs);
    } else if (code === "JOB_POSTING" || cat === "JOB_POSTING" || unitStr.includes("job")) {
      used = Math.max(used, activeStandardJobs);
    } else if (isAi) {
      used = Math.max(used, totalAiUsed);
    } else if (isResdex) {
      used = Math.max(used, actualFullCvUsed);
    } else if (isNvite) {
      used = Math.max(used, fullNviteUsed);
    }

    const remaining = Math.max(0, total - used);
    const percentUsed = total > 0 ? Math.min(100, Math.round((used / total) * 100)) : 0;

    let serviceValidity = s.validity;
    let serviceValidityUnit = s.validityUnit || "DAYS";

    if (planSnapshot && planSnapshot.validity && (isJob || isResdex || isNvite || isSeat)) {
      // Allocated on full cycle of plan days
      serviceValidity = planSnapshot.validity;
      serviceValidityUnit = planSnapshot.validityUnit || "DAYS";
    } else if (isAi) {
      // Monthly cycle - no carry forward
      serviceValidity = 30;
      serviceValidityUnit = "DAYS";
    }

    let displayName = s.productName;
    if (code === "RESDEX" || displayName === "ResDex Resume Search" || String(displayName).toLowerCase() === "resdex resume search") {
      displayName = "Max CV Access";
    } else if (code === "MIVITE" || displayName === "MIvites Candidate Outreach" || String(displayName).toLowerCase() === "mivites candidate outreach") {
      displayName = "Max NVite Credits";
    }

    return {
      _id: s._id,
      productId: s.productId,
      productCode: s.productCode,
      productName: displayName,
      category: s.category,
      productType: s.productType,
      quantity: total,
      unit: s.unit || "Unit",
      validity: serviceValidity,
      validityUnit: serviceValidityUnit,
      features: s.features || [],
      total,
      used,
      remaining,
      percentUsed,
      isAi,
      isSeat,
      isFullPlanCycle: isJob || isResdex || isNvite || isSeat,
    };
  });

  // Only include active standalone entitlements if they are separate standalone purchases not in planServices
  try {
    const Entitlement = require("../models/Entitlement");
    const activeEnts = await Entitlement.find({
      companyId: company._id,
      status: "ACTIVE",
      expiryDate: { $gte: now },
      remainingQuantity: { $gt: 0 },
      source: "STANDALONE_PURCHASE",
    }).lean();

    for (const ent of activeEnts) {
      const existing = enrichedServices.find((s) => s.productCode === ent.productCode);
      if (!existing) {
        let used = ent.consumedQuantity || 0;
        if (ent.productCode === "INTERNSHIP_JOB") used = Math.max(used, activeInternshipJobs);
        else if (ent.productCode === "HOT_VACANCY") used = Math.max(used, activeHotJobs);
        else if (ent.productCode === "SMB_JOB") used = Math.max(used, activeSmbJobs);

        const total = ent.allocatedQuantity || (ent.remainingQuantity + used);
        const remaining = Math.max(0, ent.remainingQuantity);
        const percentUsed = total > 0 ? Math.min(100, Math.round((used / total) * 100)) : 0;

        enrichedServices.push({
          _id: ent._id,
          productId: ent.productId,
          productCode: ent.productCode,
          productName: ent.productName || (ent.productCode === "INTERNSHIP_JOB" ? "Internship Job" : ent.productCode),
          category: ent.productCode === "INTERNSHIP_JOB" ? "JOB_POSTING" : "STANDALONE",
          productType: "CREDIT_BASED",
          quantity: total,
          unit: ent.unit || "Job",
          validity: 30,
          validityUnit: "DAYS",
          features: ent.features || [],
          total,
          used,
          remaining,
          percentUsed,
        });
      }
    }
  } catch (_) {}
  
  const startOfWeek = new Date(now);
  const day = startOfWeek.getDay();
  const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
  startOfWeek.setDate(diff);
  startOfWeek.setHours(0,0,0,0);

  const monthlyCvUsed = await PaidResume.countDocuments({ companyId: company._id, createdAt: { $gte: startOfMonth } });
  const monthlyNviteAgg = await Nvite.aggregate([
    { $match: { companyId: company._id, createdAt: { $gte: startOfMonth } } },
    { $group: { _id: null, sum: { $sum: "$totalCount" } } }
  ]);
  const monthlyNviteUsed = monthlyNviteAgg[0]?.sum || 0;

  const weeklyCvUsed = await PaidResume.countDocuments({ companyId: company._id, createdAt: { $gte: startOfWeek } });
  const weeklyNviteAgg = await Nvite.aggregate([
    { $match: { companyId: company._id, createdAt: { $gte: startOfWeek } } },
    { $group: { _id: null, sum: { $sum: "$totalCount" } } }
  ]);
  const weeklyNviteUsed = weeklyNviteAgg[0]?.sum || 0;

  const quotaConfig = company.quotaConfig || {};

  res.status(200).json({
    success: true,
    data: {
      allocationPolicy: quotaConfig.allocationPolicy || "full",
      weekly: {
        cvAccess: { total: quotaConfig.weekly?.cvAccess || 0, used: weeklyCvUsed },
        nvite: { total: quotaConfig.weekly?.nvite || 0, used: weeklyNviteUsed },
      },
      monthly: {
        cvAccess: { total: quotaConfig.monthly?.cvAccess || 0, used: monthlyCvUsed },
        nvite: { total: quotaConfig.monthly?.nvite || 0, used: monthlyNviteUsed },
      },
      full: {
        cvAccess: { total: actualFullCvTotal, used: actualFullCvUsed },
        nvite: { total: fullNviteTotal, used: fullNviteUsed },
      },
      plan: planSnapshot,
      services: enrichedServices,
      company: {
        id: company._id,
        name: company.name,
        packageType: company.packageType,
        status: company.status,
      }
    }
  });
});

exports.updateQuotaManagement = asyncHandler(async (req, res) => {
  const { company } = await resolveClientUserAndCompany(req.user._id);
  const { allocationPolicy, weekly, monthly } = req.body;
  
  if (allocationPolicy && !["weekly", "monthly", "full"].includes(allocationPolicy)) {
    throw createHttpError(400, "Invalid allocation policy");
  }

  if (!company.quotaConfig) {
    company.quotaConfig = {
      allocationPolicy: "full",
      weekly: { cvAccess: 0, nvite: 0 },
      monthly: { cvAccess: 0, nvite: 0 }
    };
  }
  
  if (allocationPolicy) company.quotaConfig.allocationPolicy = allocationPolicy;
  
  if (weekly) {
    if (!company.quotaConfig.weekly) company.quotaConfig.weekly = { cvAccess: 0, nvite: 0 };
    if (weekly.cvAccess !== undefined) company.quotaConfig.weekly.cvAccess = Math.max(0, Number(weekly.cvAccess));
    if (weekly.nvite !== undefined) company.quotaConfig.weekly.nvite = Math.max(0, Number(weekly.nvite));
  }
  
  if (monthly) {
    if (!company.quotaConfig.monthly) company.quotaConfig.monthly = { cvAccess: 0, nvite: 0 };
    if (monthly.cvAccess !== undefined) company.quotaConfig.monthly.cvAccess = Math.max(0, Number(monthly.cvAccess));
    if (monthly.nvite !== undefined) company.quotaConfig.monthly.nvite = Math.max(0, Number(monthly.nvite));
  }

  company.markModified('quotaConfig');
  await company.save();

  res.status(200).json({
    success: true,
    message: "Quota configuration saved successfully"
  });
});

exports.changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    throw createHttpError(400, "Please provide current and new password");
  }
  const user = await User.findById(req.user._id).select("+password");
  if (!user) throw createHttpError(404, "User not found");
  
  const isMatch = await bcrypt.compare(currentPassword, user.password);
  if (!isMatch) throw createHttpError(401, "Invalid current password");
  
  user.password = await bcrypt.hash(newPassword, 10);
  await user.save();
  
  res.status(200).json({ success: true, message: "Password updated successfully" });
});

