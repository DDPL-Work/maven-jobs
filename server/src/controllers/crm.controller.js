// controllers/crm.controller.js

const CrmUser = require("../models/CrmUser");
const bcrypt = require("bcryptjs");
const {
  normalizeZoneInput,
  normalizeIndianStateInput,
  isValidStateForZone,
  buildZoneRegex,
} = require("../utils/zone.util");

const ALLOWED_CRM_ROLES = [
  "LEAD_GENERATOR",
  "STATE_MANAGER",
  "ZONAL_MANAGER",
  "FSE",
  "APPROVER",
  "ADMIN",
  "NATIONAL_SALES_HEAD",
];

// REGISTER CRM USER
exports.registerCrmUser = async (req, res) => {
  try {
    const { fullName, email, password, phone, role, territory, state } = req.body;
    const normalizedRole = String(role || "").trim().toUpperCase();
    const normalizedEmail = String(email || "").trim().toLowerCase();

    // Basic validation
    if (!fullName || !normalizedEmail || !password || !normalizedRole) {
      return res.status(400).json({
        success: false,
        message: "Full Name, Email, Password and Role are required",
      });
    }

    if (!ALLOWED_CRM_ROLES.includes(normalizedRole)) {
      return res.status(400).json({
        success: false,
        message: "Invalid CRM role provided.",
      });
    }

    // Check existing user
    const existingUser = await CrmUser.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "CRM user already exists with this email",
      });
    }

    let normalizedTerritory = String(territory || "").trim();

    if (normalizedRole === "NATIONAL_SALES_HEAD") {
      const existingNsh = await CrmUser.findOne({ role: "NATIONAL_SALES_HEAD" }).select("_id");
      if (existingNsh) {
        return res.status(409).json({
          success: false,
          message: "Only one National Sales Head account is allowed.",
        });
      }
    }

    if (normalizedRole === "ZONAL_MANAGER") {
      const normalizedZone = normalizeZoneInput(territory);
      if (!normalizedZone) {
        return res.status(400).json({
          success: false,
          message: "Valid zone is required for Zonal Manager (North, South, East, West).",
        });
      }

      const zoneRegex = buildZoneRegex(normalizedZone);
      const [existingZoneManager, zonalManagerCount] = await Promise.all([
        CrmUser.findOne({
          role: "ZONAL_MANAGER",
          territory: { $regex: zoneRegex },
        }).select("_id"),
        CrmUser.countDocuments({ role: "ZONAL_MANAGER" }),
      ]);

      if (existingZoneManager) {
        return res.status(409).json({
          success: false,
          message: `${normalizedZone} Zone already has a Zonal Manager.`,
        });
      }

      if (zonalManagerCount >= 4) {
        return res.status(409).json({
          success: false,
          message: "Only four Zonal Managers are allowed (North, South, East, West).",
        });
      }

      normalizedTerritory = normalizedZone;
    }

    let normalizedState = String(state || "").trim();
    if (normalizedRole === "STATE_MANAGER") {
      const normalizedZone = normalizeZoneInput(territory);
      const normalizedManagerState = normalizeIndianStateInput(state);

      if (!normalizedZone) {
        return res.status(400).json({
          success: false,
          message: "Valid zone is required for State Manager (North, South, East, West).",
        });
      }

      if (!normalizedManagerState || !isValidStateForZone(normalizedManagerState, normalizedZone)) {
        return res.status(400).json({
          success: false,
          message: "Valid state is required for the selected zone.",
        });
      }

      const existingStateManager = await CrmUser.findOne({
        role: "STATE_MANAGER",
        ...{ territory: { $regex: buildZoneRegex(normalizedZone) } },
        state: normalizedManagerState,
        accessStatus: { $in: ["ACTIVE", "PENDING_INVITE"] },
      }).select("_id");

      if (existingStateManager) {
        return res.status(409).json({
          success: false,
          message: `${normalizedManagerState} already has an active or pending State Manager.`,
        });
      }

      normalizedTerritory = normalizedZone;
      normalizedState = normalizedManagerState;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await CrmUser.create({
      fullName,
      email: normalizedEmail,
      password: hashedPassword,
      phone,
      role: normalizedRole,
      territory: normalizedTerritory,
      state: normalizedState,
    });

    return res.status(201).json({
      success: true,
      message: "CRM User registered successfully",
      data: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("CRM Register Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

exports.getMyProfile = async (req, res) => {
  try {
    const user = req.user; // coming from protectCRM middleware

    return res.status(200).json({
      success: true,
      data: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        territory: user.territory,
        state: user.state,
        isActive: user.isActive,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch profile",
    });
  }
};
