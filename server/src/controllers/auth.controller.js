const bcrypt = require("bcryptjs");
const asyncHandler = require("../middleware/async.middleware");
const User = require("../models/User");
const CrmUser = require("../models/CrmUser");
const CandidateProfile = require("../models/CandidateProfile");
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
    token: tokenPair.accessToken,
    accessToken: tokenPair.accessToken,
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
    accessToken: tokenPair.accessToken,
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
    accessToken: tokenPair.accessToken,
    expiresInSeconds: tokenPair.expiresInSeconds,
    user: tokenPair.user,
  });
});

exports.logout = asyncHandler(async (req, res) => {
  const refreshToken = extractRefreshToken(req);

  if (refreshToken) {
    try {
      await revokeSessionFromRefreshToken({
        refreshToken,
        reason: "logout",
      });
    } catch {
      // Intentionally ignore validation errors during logout so the cookie is still cleared.
    }
  } else {
    const accessToken = extractAccessToken(req);
    if (accessToken) {
      try {
        const session = await validateSession({ accessToken });
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
