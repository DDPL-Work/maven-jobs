const roleMiddleware = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const normalizedAllowed = allowedRoles.map((role) => String(role || "").trim().toUpperCase());
    const userRoles = new Set();

    const primaryRole = String(req.user.role || "").trim().toUpperCase();
    if (primaryRole) {
      userRoles.add(primaryRole);
    }

    if (Array.isArray(req.user.designations)) {
      req.user.designations.forEach((role) => {
        const normalized = String(role || "").trim().toUpperCase();
        if (normalized) {
          userRoles.add(normalized);
        }
      });
    }

    const hasPermission = normalizedAllowed.some((role) => userRoles.has(role));

    if (!hasPermission) {
      return res.status(403).json({
        message: "Access denied: insufficient permissions",
      });
    }

    next();
  };
};

module.exports = roleMiddleware;
