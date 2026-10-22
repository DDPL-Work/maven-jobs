const express = require("express");
const authController = require("../controllers/auth.controller");
const { protectAdmin } = require("../middleware/admin.middleware");
const adminController = require("../controllers/admin.controller");
const { cacheRoute, invalidateCache } = require("../middleware/cache.middleware");

const router = express.Router();

router.post("/auth/login", adminController.login);
router.post("/auth/refresh", authController.refresh);
router.post("/auth/logout", authController.logout);
router.get("/auth/me", protectAdmin, adminController.me);

router.get(
  "/dashboard",
  protectAdmin,
  cacheRoute({
    key: () => "cache:admin:dashboard",
    ttl: 300,
  }),
  adminController.getDashboard
);
router.get(
  "/sections/:sectionKey",
  protectAdmin,
  cacheRoute({
    key: (req) => `cache:admin:sections:${req.params.sectionKey}`,
    ttl: 300,
  }),
  adminController.getSection
);

router.get(
  "/users",
  protectAdmin,
  cacheRoute({
    key: () => "cache:admin:users",
    ttl: 180,
  }),
  adminController.getUsers
);
router.post(
  "/users",
  protectAdmin,
  invalidateCache(["cache:admin:*"]),
  adminController.createUser
);
router.put(
  "/users/:source/:id",
  protectAdmin,
  invalidateCache(["cache:admin:*"]),
  adminController.updateUser
);
router.delete(
  "/users/:source/:id",
  protectAdmin,
  invalidateCache(["cache:admin:*"]),
  adminController.deleteUser
);

router.get(
  "/roles",
  protectAdmin,
  cacheRoute({
    key: () => "cache:admin:roles",
    ttl: 300,
  }),
  adminController.getRoles
);
router.post(
  "/roles",
  protectAdmin,
  invalidateCache(["cache:admin:*"]),
  adminController.createRole
);
router.patch(
  "/roles/:id/permissions",
  protectAdmin,
  invalidateCache(["cache:admin:*"]),
  adminController.updateRolePermissions,
);
router.post(
  "/roles/:id/assign",
  protectAdmin,
  invalidateCache(["cache:admin:*"]),
  adminController.assignRole
);

router.get("/payments", protectAdmin, adminController.getPayments);

router.get("/notifications", protectAdmin, adminController.getNotifications);
router.patch(
  "/notifications/:id/read",
  protectAdmin,
  adminController.markNotificationRead,
);
router.patch(
  "/notifications/read-all",
  protectAdmin,
  adminController.markAllNotificationsRead,
);

router.post(
  "/notifications/fcm-token",
  protectAdmin,
  adminController.saveFcmToken,
);
router.delete(
  "/notifications/fcm-token",
  protectAdmin,
  adminController.removeFcmToken,
);

module.exports = router;
