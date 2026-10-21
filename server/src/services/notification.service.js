const mongoose = require("mongoose");
const CandidateNotification = require("../models/CandidateNotification");
const CompanyNotification = require("../models/CompanyNotification");
const AdminNotification = require("../models/AdminNotification");
const User = require("../models/User");
const logger = require("../config/logger");

/**
 * Helper to compute human-readable relative time
 */
const formatRelativeTime = (dateInput) => {
  if (!dateInput) return "Just now";
  const date = new Date(dateInput);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return "Just now";
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays}d ago`;
  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) return `${diffInWeeks}w ago`;
  return date.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
};

/**
 * Format candidate notification for API response
 */
const formatCandidateNotification = (item) => {
  if (!item) return null;
  const doc = item._doc || item;
  const timeStr = formatRelativeTime(doc.createdAt);
  return {
    id: String(doc._id),
    _id: String(doc._id),
    candidateId: doc.candidateId ? String(doc.candidateId) : null,
    companyId: doc.companyId ? String(doc.companyId) : null,
    jobId: doc.jobId ? String(doc.jobId) : null,
    applicationId: doc.applicationId ? String(doc.applicationId) : null,
    title: doc.title || "",
    message: doc.message || "",
    desc: doc.message || "",
    category: doc.category || "SYSTEM",
    status: String(doc.status || "UNREAD").toUpperCase(),
    actionUrl: doc.actionUrl || "",
    metadata: doc.metadata || null,
    createdAt: doc.createdAt || null,
    updatedAt: doc.updatedAt || null,
    relativeTime: timeStr,
    time: timeStr,
    lastUpdated: timeStr,
  };
};

/**
 * Format company/recruiter notification for API response
 */
const formatCompanyNotification = (item) => {
  if (!item) return null;
  const doc = item._doc || item;
  const timeStr = formatRelativeTime(doc.createdAt);
  return {
    id: String(doc._id),
    _id: String(doc._id),
    companyId: doc.companyId ? String(doc.companyId) : null,
    recipientUserId: doc.recipientUserId ? String(doc.recipientUserId) : null,
    targetRole: doc.targetRole || "ALL",
    candidateId: doc.candidateId ? String(doc.candidateId) : null,
    jobId: doc.jobId ? String(doc.jobId) : null,
    applicationId: doc.applicationId ? String(doc.applicationId) : null,
    title: doc.title || "Notification",
    message: doc.message || "",
    desc: doc.message || "",
    category: doc.category || "SYSTEM",
    actionUrl: doc.actionUrl || "",
    status: String(doc.status || "UNREAD").toUpperCase(),
    metadata: doc.metadata || null,
    createdAt: doc.createdAt || null,
    updatedAt: doc.updatedAt || null,
    relativeTime: timeStr,
    time: timeStr,
    lastUpdated: timeStr,
  };
};

class NotificationService {
  /**
   * Push real-time notification to socket rooms safely
   */
  _emitSocketNotification(rooms, eventName, payload) {
    try {
      const io = global.chatSocketServer;
      if (!io) return;

      const roomList = Array.isArray(rooms) ? rooms : [rooms];
      roomList.forEach((room) => {
        if (room) {
          io.to(room).emit(eventName, payload);
        }
      });
    } catch (err) {
      logger.warn("[NotificationService] Socket emit error:", err?.message || err);
    }
  }

  /**
   * Push notification via Firebase Cloud Messaging (FCM)
   */
  async _sendFirebaseNotification(userIds, payload = {}) {
    try {
      const firebaseConfig = require("../config/firebase");
      if (!firebaseConfig.isConfigured()) return;
      const messaging = firebaseConfig.getMessaging();
      if (!messaging) return;

      const ids = (Array.isArray(userIds) ? userIds : [userIds]).filter(Boolean);
      if (!ids.length) return;

      const CrmUser = require("../models/CrmUser");
      const [users, crmUsers] = await Promise.all([
        User.find({ _id: { $in: ids } }).select("fcmTokens"),
        CrmUser.find({ _id: { $in: ids } }).select("fcmTokens"),
      ]);

      const tokens = [
        ...users.flatMap((u) => (u.fcmTokens || []).map((t) => t.token)),
        ...crmUsers.flatMap((u) => (u.fcmTokens || []).map((t) => t.token)),
      ].filter(Boolean);

      if (!tokens.length) return;

      // Deduplicate tokens
      const uniqueTokens = [...new Set(tokens)];

      const title = String(payload.title || "Maven Jobs").trim();
      const body = String(payload.message || payload.desc || "").trim();
      const actionUrl = String(payload.actionUrl || "/dashboard");

      const messagePayload = {
        tokens: uniqueTokens,
        notification: {
          title,
          body,
        },
        data: {
          id: String(payload.id || payload._id || ""),
          title,
          message: body,
          category: String(payload.category || "SYSTEM"),
          actionUrl,
          status: String(payload.status || "UNREAD"),
          time: String(payload.time || "Just now"),
        },
        webpush: {
          fcmOptions: {
            link: actionUrl,
          },
          notification: {
            icon: "/favicon.ico",
            badge: "/favicon.ico",
          },
        },
      };

      const response = await messaging.sendEachForMulticast(messagePayload);

      // Self-healing: clean up unregistered / expired tokens from DB
      if (response.failureCount > 0) {
        const invalidTokens = [];
        response.responses.forEach((resp, idx) => {
          if (!resp.success) {
            const errCode = resp.error?.code || "";
            if (
              errCode.includes("registration-token-not-registered") ||
              errCode.includes("invalid-registration-token") ||
              errCode.includes("invalid-argument")
            ) {
              invalidTokens.push(uniqueTokens[idx]);
            }
          }
        });

        if (invalidTokens.length > 0) {
          await Promise.all([
            User.updateMany(
              { "fcmTokens.token": { $in: invalidTokens } },
              { $pull: { fcmTokens: { token: { $in: invalidTokens } } } }
            ),
            CrmUser.updateMany(
              { "fcmTokens.token": { $in: invalidTokens } },
              { $pull: { fcmTokens: { token: { $in: invalidTokens } } } }
            ),
          ]).catch((e) => logger.warn("[NotificationService] Token cleanup error:", e.message));
        }
      }
    } catch (err) {
      logger.warn("[NotificationService] Firebase push error:", err?.message || err);
    }
  }

  // ==========================================
  // CANDIDATE NOTIFICATIONS (Strictly isolated)
  // ==========================================

  /**
   * Send notification to a Candidate.
   * NEVER sent to or visible in client/recruiter panels.
   */
  async sendCandidateNotification({
    candidateId,
    companyId = null,
    jobId = null,
    applicationId = null,
    title,
    message,
    category = "SYSTEM",
    actionUrl = "",
    metadata = null,
  }) {
    try {
      if (!candidateId) {
        logger.warn("[NotificationService] sendCandidateNotification called without candidateId");
        return null;
      }

      const notification = await CandidateNotification.create({
        candidateId,
        companyId: companyId || null,
        jobId: jobId || null,
        applicationId: applicationId || null,
        title: String(title || "").trim(),
        message: String(message || "").trim(),
        category,
        actionUrl: actionUrl || "",
        metadata: metadata || null,
        status: "UNREAD",
      });

      const formatted = formatCandidateNotification(notification);

      // Emit real-time socket event to candidate's room
      this._emitSocketNotification(
        [`user:${String(candidateId)}`, `candidate:${String(candidateId)}`],
        "notification:new",
        formatted
      );

      // Push via Firebase FCM
      this._sendFirebaseNotification(candidateId, formatted).catch(() => {});

      // Invalidate candidate notifications cache
      try {
        const cacheService = require("./cache/cache.service");
        cacheService.delPattern(`cache:candidate:notifications:${candidateId}*`).catch(() => {});
      } catch {}

      return notification;
    } catch (error) {
      logger.error("[NotificationService] sendCandidateNotification error:", error);
      return null;
    }
  }

  /**
   * Get notifications for a Candidate with optional pagination
   */
  async getCandidateNotifications(candidateId, { page = 1, limit = 50 } = {}) {
    const p = Math.max(1, parseInt(page, 10) || 1);
    const l = Math.max(1, Math.min(100, parseInt(limit, 10) || 50));
    const skip = (p - 1) * l;

    const query = { candidateId };

    const [notifications, total, unreadCount] = await Promise.all([
      CandidateNotification.find(query).sort({ createdAt: -1 }).skip(skip).limit(l),
      CandidateNotification.countDocuments(query),
      CandidateNotification.countDocuments({ ...query, status: "UNREAD" }),
    ]);

    return {
      notifications: notifications.map(formatCandidateNotification),
      pagination: {
        page: p,
        limit: l,
        totalItems: total,
        totalPages: Math.ceil(total / l),
      },
      unreadCount,
    };
  }

  /**
   * Mark single candidate notification as read
   */
  async markCandidateNotificationRead(candidateId, notificationId) {
    if (!mongoose.Types.ObjectId.isValid(notificationId)) {
      return null;
    }

    const notification = await CandidateNotification.findOne({
      _id: notificationId,
      candidateId,
    });

    if (!notification) {
      return null;
    }

    // Already marked as read — no need to update or write to DB again
    if (notification.status === "READ") {
      return { ...formatCandidateNotification(notification), alreadyRead: true };
    }

    notification.status = "READ";
    await notification.save();

    try {
      const cacheService = require("./cache/cache.service");
      cacheService.delPattern(`cache:candidate:notifications:${candidateId}*`).catch(() => {});
    } catch {}

    return { ...formatCandidateNotification(notification), alreadyRead: false };
  }

  /**
   * Mark all candidate notifications as read
   */
  async markAllCandidateNotificationsRead(candidateId) {
    const result = await CandidateNotification.updateMany(
      { candidateId, status: "UNREAD" },
      { $set: { status: "READ" } }
    );

    try {
      const cacheService = require("./cache/cache.service");
      cacheService.delPattern(`cache:candidate:notifications:${candidateId}*`).catch(() => {});
    } catch {}

    return {
      success: true,
      modifiedCount: result.modifiedCount || 0,
      alreadyRead: (result.modifiedCount || 0) === 0,
    };
  }

  // ==========================================
  // CLIENT / RECRUITER NOTIFICATIONS (Strictly isolated)
  // ==========================================

  /**
   * Send notification to a Client/Company or specific Recruiter.
   * NEVER sent to or visible in candidate panel.
   */
  async sendCompanyNotification({
    companyId,
    recipientUserId = null,
    targetRole = "ALL",
    candidateId = null,
    jobId = null,
    applicationId = null,
    title,
    message,
    category = "SYSTEM",
    actionUrl = "",
    metadata = null,
  }) {
    try {
      if (!companyId) {
        logger.warn("[NotificationService] sendCompanyNotification called without companyId");
        return null;
      }

      const notification = await CompanyNotification.create({
        companyId,
        recipientUserId: recipientUserId || null,
        targetRole: ["CLIENT", "RECRUITER"].includes(targetRole) ? targetRole : "ALL",
        candidateId: candidateId || null,
        jobId: jobId || null,
        applicationId: applicationId || null,
        title: String(title || "").trim(),
        message: String(message || "").trim(),
        category,
        actionUrl: actionUrl || "",
        metadata: metadata || null,
        status: "UNREAD",
      });

      const formatted = formatCompanyNotification(notification);

      // Socket rooms: notify whole company, and if specific user, their user room
      const rooms = [`company:${String(companyId)}`];
      if (recipientUserId) {
        rooms.push(`user:${String(recipientUserId)}`);
      }

      this._emitSocketNotification(rooms, "notification:new", formatted);

      // Push via Firebase FCM
      if (recipientUserId) {
        this._sendFirebaseNotification(recipientUserId, formatted).catch(() => {});
      } else {
        User.find({
          companyId,
          isActive: true,
          ...(targetRole !== "ALL" ? { role: targetRole } : {}),
        })
          .select("_id")
          .lean()
          .then((companyUsers) => {
            if (companyUsers && companyUsers.length) {
              this._sendFirebaseNotification(companyUsers.map((u) => u._id), formatted).catch(() => {});
            }
          })
          .catch(() => {});
      }

      return notification;
    } catch (error) {
      logger.error("[NotificationService] sendCompanyNotification error:", error);
      return null;
    }
  }

  /**
   * Helper to send specifically to a company recruiter user
   */
  async sendRecruiterNotification({
    companyId,
    recruiterUserId,
    candidateId = null,
    jobId = null,
    applicationId = null,
    title,
    message,
    category = "SYSTEM",
    actionUrl = "",
    metadata = null,
  }) {
    let resolvedCompanyId = companyId;
    if (!resolvedCompanyId && recruiterUserId) {
      const user = await User.findById(recruiterUserId).select("companyId");
      resolvedCompanyId = user?.companyId || null;
    }

    if (!resolvedCompanyId) {
      logger.warn("[NotificationService] sendRecruiterNotification: No companyId resolved");
      return null;
    }

    return this.sendCompanyNotification({
      companyId: resolvedCompanyId,
      recipientUserId,
      targetRole: "RECRUITER",
      candidateId,
      jobId,
      applicationId,
      title,
      message,
      category,
      actionUrl,
      metadata,
    });
  }

  /**
   * Get notifications for a Company / Recruiter
   */
  async getCompanyNotifications(companyId, { userId = null, userRole = null, page = 1, limit = 20 } = {}) {
    const p = Math.max(1, parseInt(page, 10) || 1);
    const l = Math.max(1, Math.min(100, parseInt(limit, 10) || 20));
    const skip = (p - 1) * l;

    const query = { companyId };

    // Role-specific filtering if recruiter vs client
    if (userRole === "RECRUITER" && userId) {
      query.$or = [
        { recipientUserId: userId },
        {
          recipientUserId: { $in: [null, undefined] },
          $or: [
            { targetRole: { $in: ["ALL", "RECRUITER"] } },
            { targetRole: { $exists: false } },
            { targetRole: null },
          ],
        },
      ];
    } else if (userRole === "CLIENT") {
      query.$or = [
        { recipientUserId: userId },
        {
          recipientUserId: { $in: [null, undefined] },
          $or: [
            { targetRole: { $in: ["ALL", "CLIENT"] } },
            { targetRole: { $exists: false } },
            { targetRole: null },
          ],
        },
        { targetRole: "ALL" },
      ];
    }

    const [notifications, total, unreadCount] = await Promise.all([
      CompanyNotification.find(query).sort({ createdAt: -1 }).skip(skip).limit(l),
      CompanyNotification.countDocuments(query),
      CompanyNotification.countDocuments({ ...query, status: "UNREAD" }),
    ]);

    return {
      notifications: notifications.map(formatCompanyNotification),
      pagination: {
        page: p,
        limit: l,
        totalItems: total,
        totalPages: Math.ceil(total / l),
      },
      unreadCount,
    };
  }

  /**
   * Mark single company notification as read
   */
  async markCompanyNotificationRead(companyId, notificationId, userId = null) {
    if (!mongoose.Types.ObjectId.isValid(notificationId)) {
      return null;
    }

    const query = {
      _id: notificationId,
      companyId,
    };

    const notification = await CompanyNotification.findOne(query);

    if (!notification) {
      return null;
    }

    // Already marked as read — no need to update or write to DB again
    if (notification.status === "READ") {
      return { ...formatCompanyNotification(notification), alreadyRead: true };
    }

    notification.status = "READ";
    await notification.save();

    return { ...formatCompanyNotification(notification), alreadyRead: false };
  }

  /**
   * Mark all company notifications as read
   */
  async markAllCompanyNotificationsRead(companyId, { userId = null, userRole = null } = {}) {
    const query = { companyId, status: "UNREAD" };

    if (userRole === "RECRUITER" && userId) {
      query.$or = [
        { recipientUserId: userId },
        {
          recipientUserId: { $in: [null, undefined] },
          $or: [
            { targetRole: { $in: ["ALL", "RECRUITER"] } },
            { targetRole: { $exists: false } },
            { targetRole: null },
          ],
        },
      ];
    } else if (userRole === "CLIENT") {
      query.$or = [
        { recipientUserId: userId },
        {
          recipientUserId: { $in: [null, undefined] },
          $or: [
            { targetRole: { $in: ["ALL", "CLIENT"] } },
            { targetRole: { $exists: false } },
            { targetRole: null },
          ],
        },
        { targetRole: "ALL" },
      ];
    }

    const result = await CompanyNotification.updateMany(query, { $set: { status: "READ" } });
    return {
      success: true,
      modifiedCount: result.modifiedCount || 0,
      alreadyRead: (result.modifiedCount || 0) === 0,
    };
  }

  // ==========================================
  // ADMIN NOTIFICATIONS
  // ==========================================

  async sendAdminNotification({
    title,
    message,
    type = "SYSTEM",
    severity = "INFO",
    actionUrl = "",
    metadata = {},
  }) {
    try {
      const notification = await AdminNotification.create({
        title: String(title || "").trim(),
        message: String(message || "").trim(),
        type,
        severity,
        actionUrl,
        metadata: metadata || {},
        status: "UNREAD",
      });

      this._emitSocketNotification("admin", "notification:new", notification);

      // Push via Firebase FCM to admin users
      User.find({ role: "ADMIN", isActive: true })
        .select("_id")
        .lean()
        .then((admins) => {
          if (admins && admins.length) {
            this._sendFirebaseNotification(admins.map((a) => a._id), notification).catch(() => {});
          }
        })
        .catch(() => {});

      return notification;
    } catch (err) {
      logger.error("[NotificationService] sendAdminNotification error:", err);
      return null;
    }
  }

  /**
   * Push notification to CRM / Field staff (FSE, Lead Generator, Managers, etc.)
   */
  async sendStaffNotification({
    roles = [],
    userIds = [],
    title,
    message,
    category = "SYSTEM",
    actionUrl = "",
    metadata = null,
  }) {
    try {
      const CrmUser = require("../models/CrmUser");
      const targetQuery = { isActive: true };

      if (Array.isArray(userIds) && userIds.length > 0) {
        targetQuery._id = { $in: userIds };
      } else if (Array.isArray(roles) && roles.length > 0) {
        targetQuery.$or = [
          { role: { $in: roles } },
          { designations: { $in: roles } },
        ];
      }

      const staffMembers = await CrmUser.find(targetQuery).select("_id role").lean();
      if (!staffMembers.length) return null;

      const targetIds = staffMembers.map((s) => s._id);
      const payload = {
        title,
        message,
        category,
        actionUrl,
        metadata,
      };

      // Push via Firebase FCM
      await this._sendFirebaseNotification(targetIds, payload);

      return { success: true, count: targetIds.length };
    } catch (err) {
      logger.error("[NotificationService] sendStaffNotification error:", err);
      return null;
    }
  }
}

module.exports = new NotificationService();
