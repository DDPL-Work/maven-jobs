const SalesEnquiryForm = require("../models/salesEnquiryForm");
const CrmUser = require("../models/CrmUser");
const User = require("../models/User");
const emailService = require("../services/email.service");
const notificationService = require("../services/notification.service");
const logger = require("../config/logger");
const asyncHandler = require("../middleware/async.middleware");

/**
 * Builds HTML template for Sales Enquiry email notifications
 */
const buildEnquiryEmailHtml = (enquiry) => {
  return `
  <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
    <div style="background: linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%); padding: 24px; color: #ffffff; text-align: center;">
      <h1 style="margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.02em;">Maven Jobs | Talent Cloud</h1>
      <p style="margin: 6px 0 0 0; font-size: 14px; color: #93c5fd;">New Sales & Demo Enquiry Received</p>
    </div>
    
    <div style="padding: 28px 24px;">
      <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 12px 16px; margin-bottom: 24px;">
        <strong style="color: #166534; font-size: 14px;">Reference ID:</strong> 
        <span style="color: #15803d; font-weight: 700; font-size: 15px; margin-left: 6px;">${enquiry.referenceId}</span>
      </div>

      <table style="width: 100%; border-collapse: collapse; font-size: 14px; color: #334155;">
        <tbody>
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 10px 0; font-weight: 600; width: 40%; color: #64748b;">Full Name</td>
            <td style="padding: 10px 0; font-weight: 700; color: #0f172a;">${enquiry.fullName}</td>
          </tr>
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 10px 0; font-weight: 600; color: #64748b;">Mobile Number</td>
            <td style="padding: 10px 0; font-weight: 700; color: #2563eb;">
              <a href="tel:+91${enquiry.mobile}" style="color: #2563eb; text-decoration: none;">+91 ${enquiry.mobile}</a>
            </td>
          </tr>
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 10px 0; font-weight: 600; color: #64748b;">Work Email</td>
            <td style="padding: 10px 0; font-weight: 700; color: #2563eb;">
              <a href="mailto:${enquiry.email}" style="color: #2563eb; text-decoration: none;">${enquiry.email}</a>
            </td>
          </tr>
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 10px 0; font-weight: 600; color: #64748b;">Hiring For</td>
            <td style="padding: 10px 0; text-transform: capitalize;">${enquiry.entityType || "N/A"}</td>
          </tr>
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 10px 0; font-weight: 600; color: #64748b;">Organization Name</td>
            <td style="padding: 10px 0; font-weight: 600;">${enquiry.organizationName || "N/A"}</td>
          </tr>
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 10px 0; font-weight: 600; color: #64748b;">Designation</td>
            <td style="padding: 10px 0;">${enquiry.designation || "N/A"}</td>
          </tr>
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 10px 0; font-weight: 600; color: #64748b;">Employee Headcount</td>
            <td style="padding: 10px 0;">${enquiry.employeeCount || "N/A"}</td>
          </tr>
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 10px 0; font-weight: 600; color: #64748b;">City / Location</td>
            <td style="padding: 10px 0;">${enquiry.city || "N/A"}</td>
          </tr>
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 10px 0; font-weight: 600; color: #64748b;">Source</td>
            <td style="padding: 10px 0;">${enquiry.source || "TALENT_CLOUD"}</td>
          </tr>
          <tr>
            <td style="padding: 10px 0; font-weight: 600; color: #64748b;">Submitted At</td>
            <td style="padding: 10px 0; color: #64748b;">${new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })} IST</td>
          </tr>
        </tbody>
      </table>

      <div style="margin-top: 28px; text-align: center;">
        <a href="tel:+91${enquiry.mobile}" style="display: inline-block; background: #2563eb; color: #ffffff; padding: 12px 24px; border-radius: 8px; font-weight: 700; text-decoration: none; font-size: 14px;">Call Client Directly</a>
      </div>
    </div>

    <div style="background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 16px 24px; text-align: center; font-size: 12px; color: #94a3b8;">
      This is an automated sales notification from Maven Jobs Enterprise Platform.
    </div>
  </div>
  `;
};

/**
 * Builds Plaintext format for email clients that do not render HTML
 */
const buildEnquiryEmailText = (enquiry) => {
  return `
NEW SALES ENQUIRY RECEIVED
===========================
Reference ID: ${enquiry.referenceId}
Full Name: ${enquiry.fullName}
Mobile: +91 ${enquiry.mobile}
Work Email: ${enquiry.email}
Hiring For: ${enquiry.entityType || "N/A"}
Organization: ${enquiry.organizationName || "N/A"}
Designation: ${enquiry.designation || "N/A"}
Employees: ${enquiry.employeeCount || "N/A"}
City: ${enquiry.city || "N/A"}
Source: ${enquiry.source || "TALENT_CLOUD"}
Submitted: ${new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })} IST
`;
};

/**
 * Dispatches In-App Notification and Emails to FSEs of all zones + core team (crm@mavenjobs.in, info@mavenjobs.in)
 */
const dispatchSalesEnquiryNotifications = async (enquiry) => {
  try {
    // 1. Fetch all FSEs of every zone
    const [crmFseUsers, generalFseUsers] = await Promise.all([
      CrmUser.find({
        $or: [{ role: "FSE" }, { designations: "FSE" }],
        isActive: { $ne: false },
        accessStatus: { $ne: "RESTRICTED" },
      }).select("fullName email territory state"),
      User.find({
        role: "FSE",
        isActive: { $ne: false },
        accessStatus: { $ne: "RESTRICTED" },
      }).select("name email department scope"),
    ]);

    const fseEmails = new Set();
    crmFseUsers.forEach((u) => {
      if (u.email && /^\S+@\S+\.\S+$/.test(u.email)) {
        fseEmails.add(u.email.toLowerCase().trim());
      }
    });
    generalFseUsers.forEach((u) => {
      if (u.email && /^\S+@\S+\.\S+$/.test(u.email)) {
        fseEmails.add(u.email.toLowerCase().trim());
      }
    });

    // 2. Compile all email recipients: FSE of every zone + crm@mavenjobs.in, info@mavenjobs.in
    const coreTeamEmails = ["crm@mavenjobs.in", "info@mavenjobs.in"];
    const allEmailRecipients = Array.from(new Set([...fseEmails, ...coreTeamEmails]));

    logger.info(`[SalesEnquiry] Dispatching notifications for ${enquiry.referenceId} to ${allEmailRecipients.length} recipients.`);

    // 3. Send In-App Notification
    await notificationService.sendAdminNotification({
      title: `New Sales Enquiry: ${enquiry.organizationName || enquiry.fullName}`,
      message: `A new demo/sales enquiry was submitted by ${enquiry.fullName} (${enquiry.mobile}${enquiry.city ? `, ${enquiry.city}` : ""}). Reference ID: ${enquiry.referenceId}`,
      type: "ROLE",
      severity: "HIGH",
      actionUrl: `/admin/sales-enquiries?ref=${enquiry.referenceId}`,
      metadata: {
        enquiryId: enquiry._id,
        referenceId: enquiry.referenceId,
        fullName: enquiry.fullName,
        email: enquiry.email,
        mobile: enquiry.mobile,
        organizationName: enquiry.organizationName,
        city: enquiry.city,
        targetRole: "FSE",
        targetAudience: "FSE_ALL_ZONES",
      },
    });

    // Real-time socket notification to FSE, CRM, and Admin rooms
    if (global.chatSocketServer) {
      try {
        global.chatSocketServer.to(["admin", "crm", "fse"]).emit("sales-enquiry:new", {
          referenceId: enquiry.referenceId,
          fullName: enquiry.fullName,
          organizationName: enquiry.organizationName,
          mobile: enquiry.mobile,
          email: enquiry.email,
          city: enquiry.city,
          createdAt: enquiry.createdAt,
        });
      } catch (socketErr) {
        logger.warn("[SalesEnquiry] Socket emit warning:", socketErr.message);
      }
    }

    // 4. Send Emails to all recipients (FSEs of all zones + crm@mavenjobs.in + info@mavenjobs.in)
    const subject = `New Sales Enquiry: ${enquiry.organizationName || enquiry.fullName} (${enquiry.referenceId})`;
    const html = buildEnquiryEmailHtml(enquiry);
    const text = buildEnquiryEmailText(enquiry);

    const emailPromises = allEmailRecipients.map((toEmail) =>
      emailService
        .sendEmail({
          to: toEmail,
          subject,
          html,
          text,
        })
        .catch((err) => {
          logger.warn(`[SalesEnquiry] Failed sending email to ${toEmail}:`, err?.message || err);
          return null;
        })
    );

    await Promise.allSettled(emailPromises);
    logger.info(`[SalesEnquiry] Completed email dispatch for ${enquiry.referenceId}`);
  } catch (error) {
    logger.error("[SalesEnquiry] Notification dispatch error:", error);
  }
};

/**
 * @desc    Submit a new Sales / Demo Enquiry
 * @route   POST /api/v1/sales-enquiry
 * @access  Public
 */
exports.submitSalesEnquiry = asyncHandler(async (req, res) => {
  const {
    fullName,
    mobile,
    email,
    entityType,
    designation,
    organizationName,
    employeeCount,
    city,
    source,
    notes,
  } = req.body;

  // Basic Validation
  if (!fullName || !fullName.trim()) {
    return res.status(400).json({
      success: false,
      message: "Full name is required",
    });
  }

  const cleanMobile = String(mobile || "").replace(/\D/g, "");
  if (!cleanMobile || cleanMobile.length < 10) {
    return res.status(400).json({
      success: false,
      message: "A valid 10-digit mobile number is required",
    });
  }

  if (!email || !/^\S+@\S+\.\S+$/.test(email.trim())) {
    return res.status(400).json({
      success: false,
      message: "A valid official email is required",
    });
  }

  // Extract client metadata
  const sourceIp =
    (req.headers["x-forwarded-for"] || "").split(",")[0].trim() ||
    req.socket?.remoteAddress ||
    req.ip ||
    "";
  const sourceUserAgent = req.headers["user-agent"] || "";

  // Create Enquiry record
  const enquiry = await SalesEnquiryForm.create({
    fullName: fullName.trim(),
    mobile: cleanMobile.slice(-10),
    email: email.trim().toLowerCase(),
    entityType: entityType ? entityType.trim().toLowerCase() : "",
    designation: designation ? designation.trim() : "",
    organizationName: organizationName ? organizationName.trim() : "",
    employeeCount: employeeCount ? employeeCount.trim() : "",
    city: city ? city.trim() : "",
    source: source ? source.trim() : "TALENT_CLOUD",
    notes: notes ? notes.trim() : "",
    sourceIp,
    sourceUserAgent,
  });

  // Asynchronously dispatch In-App Notification and Emails to FSEs and CRM team
  dispatchSalesEnquiryNotifications(enquiry).catch((err) => {
    logger.error("[SalesEnquiry] Background notification error:", err);
  });

  return res.status(201).json({
    success: true,
    message: "Thank you! Our team will get in touch with you soon.",
    referenceId: enquiry.referenceId,
    data: {
      id: enquiry._id,
      referenceId: enquiry.referenceId,
      fullName: enquiry.fullName,
      email: enquiry.email,
      mobile: enquiry.mobile,
      organizationName: enquiry.organizationName,
      status: enquiry.status,
      createdAt: enquiry.createdAt,
    },
  });
});

/**
 * @desc    Get all Sales Enquiries (with search, filter & pagination)
 * @route   GET /api/v1/sales-enquiry
 * @access  Private (Admin / CRM)
 */
exports.getSalesEnquiries = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
  const skip = (page - 1) * limit;

  const { status, entityType, source, search } = req.query;
  const filter = {};

  if (status) {
    filter.status = status.toUpperCase();
  }
  if (entityType) {
    filter.entityType = entityType.toLowerCase();
  }
  if (source) {
    filter.source = source;
  }

  if (search && search.trim()) {
    const s = search.trim();
    const regex = new RegExp(s, "i");
    filter.$or = [
      { fullName: regex },
      { email: regex },
      { mobile: regex },
      { organizationName: regex },
      { city: regex },
      { referenceId: regex },
    ];
  }

  const [items, total] = await Promise.all([
    SalesEnquiryForm.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("assignedTo", "name email"),
    SalesEnquiryForm.countDocuments(filter),
  ]);

  return res.status(200).json({
    success: true,
    data: items,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    },
  });
});

/**
 * @desc    Get Sales Enquiry by ID or Reference ID
 * @route   GET /api/v1/sales-enquiry/:id
 * @access  Private (Admin / CRM)
 */
exports.getSalesEnquiryById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const query = id.startsWith("ENQ-") ? { referenceId: id } : { _id: id };

  const enquiry = await SalesEnquiryForm.findOne(query).populate(
    "assignedTo",
    "name email"
  );

  if (!enquiry) {
    return res.status(404).json({
      success: false,
      message: "Sales enquiry not found",
    });
  }

  return res.status(200).json({
    success: true,
    data: enquiry,
  });
});

/**
 * @desc    Update Sales Enquiry status, notes, or assigned agent
 * @route   PATCH /api/v1/sales-enquiry/:id
 * @access  Private (Admin / CRM)
 */
exports.updateSalesEnquiry = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, notes, assignedTo } = req.body;

  const enquiry = await SalesEnquiryForm.findById(id);
  if (!enquiry) {
    return res.status(404).json({
      success: false,
      message: "Sales enquiry not found",
    });
  }

  if (status) {
    enquiry.status = status.toUpperCase();
  }
  if (notes !== undefined) {
    enquiry.notes = notes;
  }
  if (assignedTo !== undefined) {
    enquiry.assignedTo = assignedTo || null;
  }

  await enquiry.save();

  return res.status(200).json({
    success: true,
    message: "Sales enquiry updated successfully",
    data: enquiry,
  });
});
