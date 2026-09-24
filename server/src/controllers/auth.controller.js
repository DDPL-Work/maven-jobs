const bcrypt = require("bcryptjs");
const asyncHandler = require("../middleware/async.middleware");
const User = require("../models/User");
const CrmUser = require("../models/CrmUser");
const CandidateProfile = require("../models/CandidateProfile");
const LoginOTP = require("../models/LoginOTP");
const smsService = require("../services/sms.service");
const EventBus = require("../events/EventBus");
const { EVENTS } = require("../events/events");
const {
  ACCESS_TOKEN_TTL,
  ACCESS_TOKEN_TTL_SECONDS,
  buildAuthUser,
  clearAuthCookies,
  extractAccessToken,
  extractRefreshToken,
  issueTokenPair,
  revokeSessionFromRefreshToken,
  revokeSession,
  rotateRefreshToken,
  setAccessCookie,
  setRefreshCookie,
  validateSession,
} = require("../services/auth.service");
const { verifyGoogleToken } = require("../services/google.service");
const UserLoginLog = require("../models/UserLoginLog");

const createHttpError = (statusCode, message) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const normalizeEmail = (value = "") => String(value || "").trim().toLowerCase();

const findAccountByEmail = async (email) => {
  const normalizedEmail = normalizeEmail(email);

  const [user, crmUser] = await Promise.all([
    User.findOne({ email: normalizedEmail }),
    CrmUser.findOne({ email: normalizedEmail }),
  ]);

  if (user) {
    return { doc: user, source: "USER" };
  }

  if (crmUser) {
    return { doc: crmUser, source: "CRM" };
  }

  return null;
};

const sendAuthResponse = async (req, res, { user, source, profile = null }) => {
  const tokenPair = await issueTokenPair({
    user,
    source,
    req,
  });

  setRefreshCookie(res, tokenPair.refreshToken);
  setAccessCookie(res, tokenPair.accessToken);

  return res.status(200).json({
    success: true,
    expiresInSeconds: tokenPair.expiresInSeconds,
    user: tokenPair.user,
    ...(profile ? { profile } : {}),
  });
};

exports.registerCandidate = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  const normalizedEmail = normalizeEmail(email);
  const normalizedName = String(name || "").trim();
  const normalizedPassword = String(password || "").trim();

  if (!normalizedName || !normalizedEmail || !normalizedPassword) {
    throw createHttpError(400, "Name, email, and password are required");
  }

  const existing = await User.findOne({ email: normalizedEmail });
  if (existing) {
    throw createHttpError(409, "Email already exists");
  }

  const hashed = await bcrypt.hash(normalizedPassword, 10);

  const user = await User.create({
    name: normalizedName,
    email: normalizedEmail,
    password: hashed,
    role: "CANDIDATE",
    accessStatus: "ACTIVE",
    isActive: true,
  });

  EventBus.emit(EVENTS.CANDIDATE_REGISTERED, {
    candidateId: user._id,
    email: user.email,
    fullName: user.name,
  });

  const tokenPair = await issueTokenPair({
    user,
    source: "USER",
    req,
  });

  setRefreshCookie(res, tokenPair.refreshToken);
  setAccessCookie(res, tokenPair.accessToken);

  res.status(201).json({
    success: true,
    expiresInSeconds: tokenPair.expiresInSeconds,
    user: tokenPair.user,
  });
});

exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const normalizedEmail = normalizeEmail(email);
  const normalizedPassword = String(password || "").trim();

  if (!normalizedEmail || !normalizedPassword) {
    throw createHttpError(400, "Email and password are required");
  }

  const account = await findAccountByEmail(normalizedEmail);

  if (!account) {
    throw createHttpError(401, "Invalid credentials");
  }

  // Block Google-only accounts from password login
  if (!account.doc.password) {
    throw createHttpError(
      400,
      "This account uses Google Sign-In. Please sign in with Google.",
    );
  }

  const passwordMatches = await bcrypt.compare(normalizedPassword, account.doc.password);
  if (!passwordMatches) {
    throw createHttpError(401, "Invalid credentials");
  }

  if (!account.doc.isActive || account.doc.accessStatus === "RESTRICTED") {
    throw createHttpError(403, "Account is inactive");
  }

  const shouldRestrictCandidateLogin =
    account.source === "USER" && account.doc.role !== "CANDIDATE" ? false : false;

  if (shouldRestrictCandidateLogin) {
    throw createHttpError(403, "Account is not allowed to log in here");
  }

  return sendAuthResponse(req, res, account);
});

exports.refresh = asyncHandler(async (req, res) => {
  const refreshToken = extractRefreshToken(req);
  if (!refreshToken) {
    throw createHttpError(401, "Refresh token required");
  }

  const tokenPair = await rotateRefreshToken({
    refreshToken,
    req,
  });

  setRefreshCookie(res, tokenPair.refreshToken);
  setAccessCookie(res, tokenPair.accessToken);

  res.status(200).json({
    success: true,
    expiresInSeconds: tokenPair.expiresInSeconds,
    user: tokenPair.user,
  });
});

exports.logout = asyncHandler(async (req, res) => {
  const refreshToken = extractRefreshToken(req);
  let loggedOutUser = null;

  if (refreshToken) {
    try {
      const session = await revokeSessionFromRefreshToken({
        refreshToken,
        reason: "logout",
      });
      loggedOutUser = session?.user || null;
    } catch {
      // Intentionally ignore validation errors during logout so the cookie is still cleared.
    }
  } else {
    const accessToken = extractAccessToken(req);
    if (accessToken) {
      try {
        const session = await validateSession({ accessToken });
        loggedOutUser = session?.user || null;
        if (session?.session?.sessionId) {
          await revokeSession({
            sessionId: session.session.sessionId,
            reason: "logout",
          });
        }
      } catch {
        // Intentionally ignore validation errors during logout so the client can still clear local state.
      }
    }
  }

  // Log logout event for CLIENT/RECRUITER (fire-and-forget)
  if (loggedOutUser && ["CLIENT", "RECRUITER"].includes(loggedOutUser.role) && loggedOutUser.companyId) {
    const fullUser = await User.findById(loggedOutUser._id || loggedOutUser.id).select("name email role companyId").lean().catch(() => null);
    if (fullUser) {
      UserLoginLog.create({
        userId: fullUser._id,
        companyId: fullUser.companyId,
        userName: fullUser.name || "",
        userEmail: fullUser.email || "",
        role: fullUser.role,
        event: "LOGOUT",
        logoutTime: new Date(),
        ipAddress: req.ip || req.headers["x-forwarded-for"] || "",
        userAgent: req.headers["user-agent"] || "",
        platform: "WEB",
        timestamp: new Date(),
      }).catch(() => {}); // ignore errors — don't break logout flow
    }
  }

  clearAuthCookies(res);

  res.status(200).json({
    success: true,
    message: "Logged out successfully",
  });
});

exports.me = asyncHandler(async (req, res) => {
  const accessToken = extractAccessToken(req);

  const session = await validateSession({ accessToken });

  res.status(200).json({
    success: true,
    user: buildAuthUser(session.user, session.source),
  });
});

exports.session = asyncHandler(async (req, res) => {
  const accessToken = extractAccessToken(req);

  const session = await validateSession({ accessToken });

  res.status(200).json({
    success: true,
    data: {
      active: true,
      expiresInSeconds: ACCESS_TOKEN_TTL_SECONDS,
      user: buildAuthUser(session.user, session.source),
      sessionId: session.session.sessionId,
      source: session.source,
      tokenTtl: ACCESS_TOKEN_TTL,
    },
  });
});

exports.revoke = asyncHandler(async (req, res) => {
  const sessionId = String(req.body?.sessionId || "").trim();
  const refreshToken = extractRefreshToken(req);

  if (sessionId) {
    await revokeSession({
      sessionId,
      reason: "manual_revoke",
    });
  } else if (refreshToken) {
    await revokeSessionFromRefreshToken({
      refreshToken,
      reason: "manual_revoke",
    });
  } else {
    throw createHttpError(400, "Session ID or refresh token is required");
  }

  clearAuthCookies(res);

  res.status(200).json({
    success: true,
    message: "Session revoked successfully",
  });
});

// ------------------------------------------------------------
// GOOGLE LOGIN
// ------------------------------------------------------------
exports.googleLogin = asyncHandler(async (req, res) => {
  const { credential } = req.body;

  if (!credential) {
    throw createHttpError(400, "Google credential is required");
  }

  const googleUser = await verifyGoogleToken(credential);

  const normalizedEmail = normalizeEmail(googleUser.email);

  // Check both User and CrmUser collections
  const existingAccount = await findAccountByEmail(normalizedEmail);

  let user;
  let source;
  let isNewUser = false;

  if (existingAccount) {
    // Account exists — link Google if not already linked, then login
    user = existingAccount.doc;
    source = existingAccount.source;

    // Always update Google fields on every login
    const updateFields = {
      provider: "google",
      googleId: googleUser.googleId,
      emailVerified: googleUser.emailVerified,
    };

    // Always keep avatar and name fresh from Google (Google may have updated them)
    if (googleUser.avatar) {
      if (source === "CRM") {
        updateFields.profileImageUrl = googleUser.avatar;
      } else {
        updateFields.avatar = googleUser.avatar;
      }
    }

    if (googleUser.name && (!user.name || user.name === normalizedEmail.split("@")[0])) {
      updateFields.name = googleUser.name;
    }

    const Model = source === "CRM" ? CrmUser : User;
    user = await Model.findByIdAndUpdate(user._id, { $set: updateFields }, { new: true });
  } else {
    // No existing account — create new user
    isNewUser = true;

    user = await User.create({
      name: googleUser.name || normalizedEmail.split("@")[0],
      email: normalizedEmail,
      password: "",
      role: "CANDIDATE",
      provider: "google",
      googleId: googleUser.googleId,
      avatar: googleUser.avatar,
      emailVerified: googleUser.emailVerified,
      accessStatus: "ACTIVE",
      isActive: true,
    });

    source = "USER";
  }

  // Check account status
  if (!user.isActive || user.accessStatus === "RESTRICTED") {
    throw createHttpError(403, "Account is inactive");
  }

  // Ensure CandidateProfile exists and propagate Google avatar if empty
  let profile = await CandidateProfile.findOne({ userId: user._id });

  if (!profile) {
    // First Google login — create profile with avatar from Google
    const profileData = { userId: user._id };
    if (user.avatar) {
      profileData.profilePic = { url: user.avatar, publicId: "" };
    }
    profile = await CandidateProfile.create(profileData);
  } else if (user.avatar && (!profile.profilePic || !profile.profilePic.url)) {
    // Profile exists but no profilePic — propagate from User.avatar
    profile.profilePic = { url: user.avatar, publicId: "" };
    await profile.save();
  }

  // Format profile for frontend consumption
  const formattedProfile = {
    id: String(profile._id),
    profilePic: profile.profilePic || { url: "", publicId: "" },
    coverPic: profile.coverPic || { url: "", publicId: "" },
    headline: profile.headline || "",
    phone: profile.phone || "",
    currentTitle: profile.currentTitle || "",
    currentCompany: profile.currentCompany || "",
    currentCity: profile.currentCity || "",
    totalExperience: profile.totalExperience || "",
    skills: profile.skills || [],
    preferredRoles: profile.preferredRoles || [],
    preferredLocations: profile.preferredLocations || [],
    education: profile.education || "",
    itSkills: profile.itSkills || "",
    projectTitle: profile.projectTitle || "",
    projectLink: profile.projectLink || "",
    projectDescription: profile.projectDescription || "",
    publicShareId: profile.publicShareId || "",
    resume: profile.resume || { fileName: "", url: "" },
    summary: profile.summary || "",
    expectedSalary: profile.expectedSalary || "",
    noticePeriod: profile.noticePeriod || "",
  };

  // Issue tokens using existing auth flow — identical to email/password login
  return sendAuthResponse(req, res, { user, source, profile: formattedProfile });
});


// ------------------------------------------------------------
// GOOGLE STATUS (optional — check if Google is configured)
// ------------------------------------------------------------
exports.googleStatus = asyncHandler(async (_req, res) => {
  const configured = Boolean(process.env.GOOGLE_CLIENT_ID);

  res.status(200).json({
    success: true,
    configured,
  });
});

// ------------------------------------------------------------
// MOBILE OTP LOGIN (candidates only)
// ------------------------------------------------------------

const MOBILE_OTP_EXPIRY_MINUTES = 3;
const MOBILE_OTP_MAX_ATTEMPTS = 5;
const MOBILE_OTP_RATE_LIMIT = 3; // max OTP requests per 10 minutes per phone
const MOBILE_REGEX = /^[6-9]\d{9}$/;

/**
 * POST /auth/mobile/send-otp
 * Body: { phone: "9876543210" }
 *
 * 1. Validate phone format
 * 2. Look up CandidateProfile by phone → get userId → get User
 * 3. Rate-limit (3 requests per 10 min per phone)
 * 4. Invalidate old unused OTPs for this phone
 * 5. Send OTP via 2Factor → store sessionId in LoginOTP doc
 */
exports.sendMobileOtp = asyncHandler(async (req, res) => {
  const phone = String(req.body?.phone || "").trim().replace(/\D/g, "");

  if (!MOBILE_REGEX.test(phone)) {
    throw createHttpError(400, "Please enter a valid 10-digit mobile number.");
  }

  // Find candidate profile with this phone number
  // CandidateProfile.phone may be stored as "9876543210" or "+919876543210"
  // We check both forms to be safe
  const profile = await CandidateProfile.findOne({
    $or: [
      { phone: phone },
      { phone: `+91${phone}` },
      { phone: `91${phone}` },
    ],
  }).lean();

  if (!profile) {
    throw createHttpError(404, "No candidate account found with this mobile number.");
  }

  // Load the user and check status
  const user = await User.findById(profile.userId);
  if (!user) {
    throw createHttpError(404, "No candidate account found with this mobile number.");
  }

  if (!user.isActive || user.accessStatus === "RESTRICTED") {
    throw createHttpError(403, "This account has been restricted. Please contact support.");
  }

  if (user.role !== "CANDIDATE") {
    throw createHttpError(403, "Mobile OTP login is only available for candidate accounts.");
  }

  // Rate limit: count OTP requests in the last 10 minutes for this phone
  const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
  const recentCount = await LoginOTP.countDocuments({
    phone,
    createdAt: { $gte: tenMinutesAgo },
  });

  if (recentCount >= MOBILE_OTP_RATE_LIMIT) {
    throw createHttpError(429, "Too many OTP requests. Please wait a few minutes and try again.");
  }

  // Invalidate all previous unused OTPs for this phone
  await LoginOTP.updateMany(
    { phone, used: false },
    { $set: { used: true } }
  );

  // Send OTP via 2Factor SMS API → returns a sessionId
  let sessionId;
  try {
    sessionId = await smsService.sendOTP(phone);
  } catch (smsErr) {
    throw createHttpError(503, "Failed to send OTP. Please try again later.");
  }

  // Persist OTP session
  const expiresAt = new Date(Date.now() + MOBILE_OTP_EXPIRY_MINUTES * 60 * 1000);
  await LoginOTP.create({
    phone,
    userId: user._id,
    sessionId,
    expiresAt,
    ipAddress: req.ip || req.connection?.remoteAddress || "",
    userAgent: req.get("User-Agent") || "",
  });

  return res.status(200).json({
    success: true,
    message: "OTP sent successfully.",
    expiresIn: MOBILE_OTP_EXPIRY_MINUTES * 60,
  });
});

/**
 * POST /auth/mobile/verify-otp
 * Body: { phone: "9876543210", otp: "123456" }
 *
 * 1. Validate phone + OTP format
 * 2. Find the latest unused LoginOTP for this phone
 * 3. Check not expired / not used / attempts not exceeded
 * 4. Call 2Factor verify API → boolean
 * 5. On success → mark used, issue auth tokens
 */
exports.verifyMobileOtp = asyncHandler(async (req, res) => {
  const phone = String(req.body?.phone || "").trim().replace(/\D/g, "");
  const otp = String(req.body?.otp || "").trim();

  if (!MOBILE_REGEX.test(phone)) {
    throw createHttpError(400, "Please enter a valid 10-digit mobile number.");
  }

  if (!otp || !/^\d{6}$/.test(otp)) {
    throw createHttpError(400, "Please enter a valid 6-digit OTP.");
  }

  // Find the most recent unused OTP doc for this phone
  const otpDoc = await LoginOTP.findOne({ phone, used: false }).sort({ createdAt: -1 });

  if (!otpDoc) {
    throw createHttpError(400, "No active OTP found. Please request a new OTP.");
  }

  if (new Date() > otpDoc.expiresAt) {
    throw createHttpError(400, "OTP has expired. Please request a new one.");
  }

  if (otpDoc.attempts >= MOBILE_OTP_MAX_ATTEMPTS) {
    throw createHttpError(400, "Too many failed attempts. Please request a new OTP.");
  }

  // Verify with 2Factor API
  const isValid = await smsService.verifyOTP(otpDoc.sessionId, otp);

  if (!isValid) {
    otpDoc.attempts += 1;
    await otpDoc.save();

    const remaining = MOBILE_OTP_MAX_ATTEMPTS - otpDoc.attempts;
    if (remaining <= 0) {
      throw createHttpError(400, "Invalid OTP. No attempts remaining. Please request a new OTP.");
    }
    throw createHttpError(400, `Invalid OTP. ${remaining} attempt${remaining === 1 ? "" : "s"} remaining.`);
  }

  // Mark OTP as used
  otpDoc.used = true;
  await otpDoc.save();

  // Load user and issue auth tokens (identical to email/password login)
  const user = await User.findById(otpDoc.userId);
  if (!user) {
    throw createHttpError(404, "Account not found.");
  }

  if (!user.isActive || user.accessStatus === "RESTRICTED") {
    throw createHttpError(403, "This account has been restricted. Please contact support.");
  }

  return sendAuthResponse(req, res, { user, source: "USER" });
});
