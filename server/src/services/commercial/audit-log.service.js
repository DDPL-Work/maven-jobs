const CommercialAuditLog = require("../../models/CommercialAuditLog");

/**
 * Service to record all commercial configuration changes and transactions
 */
class CommercialAuditLogService {
  static async log({
    action,
    targetType,
    targetId = "",
    targetName = "",
    performedBy = { id: "", email: "", role: "SYSTEM" },
    beforeSnapshot = null,
    afterSnapshot = null,
    reason = "",
    ipAddress = "",
  }) {
    try {
      return await CommercialAuditLog.create({
        action,
        targetType,
        targetId: String(targetId),
        targetName: String(targetName),
        performedBy: {
          id: String(performedBy?.id || performedBy?._id || ""),
          email: String(performedBy?.email || ""),
          role: String(performedBy?.role || "ADMIN"),
        },
        beforeSnapshot,
        afterSnapshot,
        reason: String(reason || ""),
        ipAddress: String(ipAddress || ""),
      });
    } catch (err) {
      console.error("[CommercialAuditLog] Failed to log action:", err);
      return null;
    }
  }

  static async listLogs({
    page = 1,
    limit = 20,
    targetType,
    action,
    search,
  } = {}) {
    const query = {};
    if (targetType) query.targetType = targetType;
    if (action) query.action = action;
    if (search) {
      query.$or = [
        { targetName: { $regex: search, $options: "i" } },
        { action: { $regex: search, $options: "i" } },
        { "performedBy.email": { $regex: search, $options: "i" } },
      ];
    }

    const skip = (Math.max(1, Number(page)) - 1) * Math.min(100, Math.max(1, Number(limit)));
    const pageLimit = Math.min(100, Math.max(1, Number(limit)));

    const [logs, total] = await Promise.all([
      CommercialAuditLog.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pageLimit)
        .lean(),
      CommercialAuditLog.countDocuments(query),
    ]);

    return {
      logs,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / pageLimit),
    };
  }
}

module.exports = CommercialAuditLogService;
