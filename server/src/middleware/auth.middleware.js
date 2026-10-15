const asyncHandler = require("./async.middleware");
const { extractAccessToken, validateSession } = require("../services/auth.service");

const reject = (res, statusCode, message) =>
  res.status(statusCode).json({
    success: false,
    message,
  });

const resolveSession = async (req) => {
  const accessToken = extractAccessToken(req);
  if (!accessToken) {
    return null;
  }

  return validateSession({ accessToken });
};

exports.protectUser = asyncHandler(async (req, res, next) => {
  try {
    const session = await resolveSession(req);

    if (!session) {
      return reject(res, 401, "Authentication required");
    }

    if (session.source !== "USER") {
      return reject(res, 403, "User access required");
    }

    req.user = session.user;
    req.auth = {
      sessionId: session.session?.sessionId || "",
      source: session.source,
      payload: session.payload,
    };
    next();
  } catch (error) {
    const statusCode = error.statusCode || 401;
    return reject(res, statusCode, error.message || "Unauthorized access");
  }
});

exports.protectCRM = asyncHandler(async (req, res, next) => {
  try {
    const session = await resolveSession(req);

    if (!session) {
      return reject(res, 401, "Authentication required");
    }

    if (session.source !== "CRM") {
      return reject(res, 403, "CRM access required");
    }

    req.user = session.user;
    req.auth = {
      sessionId: session.session?.sessionId || "",
      source: session.source,
      payload: session.payload,
    };
    next();
  } catch (error) {
    const statusCode = error.statusCode || 401;
    return reject(res, statusCode, error.message || "Unauthorized access");
  }
});

/**
 * Middleware restricting access to Admin, CRM, and FSE users.
 * Allows FSE, CRM agents, and Admins to list, view, and update sales enquiries,
 * while blocking anonymous visitors and non-staff roles (e.g. candidates).
 */
exports.protectSalesEnquiryAccess = asyncHandler(async (req, res, next) => {
  try {
    const sessionToken = extractAccessToken(req);

    if (sessionToken) {
      try {
        const session = await validateSession({ accessToken: sessionToken });

        // CRM team members (including FSE, Lead Gen, State/Zonal Managers, CRM Approvers, Admin)
        if (session.source === "CRM") {
          req.user = session.user;
          req.auth = {
            sessionId: session.session?.sessionId || "",
            source: session.source,
            payload: session.payload,
          };
          return next();
        }

        // Platform Admin from USER table
        if (session.source === "USER" && String(session.user?.role || "").toUpperCase() === "ADMIN") {
          req.user = session.user;
          req.auth = {
            sessionId: session.session?.sessionId || "",
            source: session.source,
            payload: session.payload,
          };
          return next();
        }

        // FSE explicitly registered on USER table if applicable
        if (session.source === "USER" && String(session.user?.role || "").toUpperCase() === "FSE") {
          req.user = session.user;
          req.auth = {
            sessionId: session.session?.sessionId || "",
            source: session.source,
            payload: session.payload,
          };
          return next();
        }

        return reject(res, 403, "Access denied: Admin, CRM, or FSE access required");
      } catch (error) {
        if (error.statusCode && error.statusCode !== 401) {
          throw error;
        }
      }
    }

    // Direct Bearer JWT token fallback (for tokens not persisted in Session collection)
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return reject(res, 401, "Authentication required");
    }

    const token = authHeader.split(" ")[1];
    const jwt = require("jsonwebtoken");
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id || decoded.userId || decoded.sub;

    const CrmUser = require("../models/CrmUser");
    const crmUser = await CrmUser.findById(userId).select("-password");
    if (crmUser) {
      if (!crmUser.isActive || crmUser.accessStatus === "RESTRICTED") {
        return reject(res, 403, "CRM account is inactive or restricted");
      }
      req.user = crmUser;
      req.auth = { source: "CRM", payload: decoded };
      return next();
    }

    const User = require("../models/User");
    const user = await User.findById(userId).select("-password");
    if (user) {
      if (!user.isActive || user.accessStatus === "RESTRICTED") {
        return reject(res, 403, "Account is inactive or restricted");
      }
      const roleUpper = String(user.role || "").toUpperCase();
      if (roleUpper === "ADMIN" || roleUpper === "FSE") {
        req.user = user;
        req.auth = { source: "USER", payload: decoded };
        return next();
      }
      return reject(res, 403, "Access denied: Admin, CRM, or FSE access required");
    }

    return reject(res, 401, "Invalid authentication token");
  } catch (error) {
    const statusCode =
      error.name === "JsonWebTokenError" || error.name === "TokenExpiredError"
        ? 401
        : error.statusCode || 401;
    return reject(res, statusCode, error.message || "Unauthorized access");
  }
});

exports.protectAdminOrCRM = exports.protectSalesEnquiryAccess;

