const SalesEnquiryForm = require("../models/salesEnquiryForm");
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
 * Builds HTML template for Sales Enquiry confirmation email to the person who submitted the form
 */
const buildEnquiryConfirmationEmailHtml = (enquiry) => {
  return `
  <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
    <div style="background: linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%); padding: 24px; color: #ffffff; text-align: center;">
      <h1 style="margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.02em;">Maven Jobs | Talent Cloud</h1>
      <p style="margin: 6px 0 0 0; font-size: 14px; color: #93c5fd;">Thank You For Your Enquiry</p>
    </div>
    
    <div style="padding: 28px 24px;">
      <p style="font-size: 15px; color: #334155; margin: 0 0 16px 0; line-height: 1.6;">
        Dear <strong>${enquiry.fullName || "Valued Customer"}</strong>,
      </p>
      <p style="font-size: 14px; color: #475569; margin: 0 0 20px 0; line-height: 1.6;">
        Thank you for contacting Maven Jobs. We have successfully received your sales &amp; demo enquiry. Our dedicated CRM team will review your requirements and connect with you shortly.
      </p>

      <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 12px 16px; margin-bottom: 24px;">
        <strong style="color: #166534; font-size: 14px;">Your Reference ID:</strong> 
        <span style="color: #15803d; font-weight: 700; font-size: 15px; margin-left: 6px;">${enquiry.referenceId}</span>
      </div>

      <table style="width: 100%; border-collapse: collapse; font-size: 14px; color: #334155;">
        <tbody>
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 10px 0; font-weight: 600; width: 40%; color: #64748b;">Full Name</td>
            <td style="padding: 10px 0; font-weight: 700; color: #0f172a;">${enquiry.fullName}</td>
          </tr>
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 10px 0; font-weight: 600; color: #64748b;">Work Email</td>
            <td style="padding: 10px 0; color: #0f172a;">${enquiry.email}</td>
          </tr>
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 10px 0; font-weight: 600; color: #64748b;">Mobile Number</td>
            <td style="padding: 10px 0; color: #0f172a;">+91 ${enquiry.mobile}</td>
          </tr>
          ${enquiry.organizationName ? `
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 10px 0; font-weight: 600; color: #64748b;">Organization</td>
            <td style="padding: 10px 0; color: #0f172a;">${enquiry.organizationName}</td>
          </tr>` : ""}
          ${enquiry.designation ? `
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 10px 0; font-weight: 600; color: #64748b;">Designation</td>
            <td style="padding: 10px 0; color: #0f172a;">${enquiry.designation}</td>
          </tr>` : ""}
          ${enquiry.city ? `
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 10px 0; font-weight: 600; color: #64748b;">City / Location</td>
            <td style="padding: 10px 0; color: #0f172a;">${enquiry.city}</td>
          </tr>` : ""}
          <tr>
            <td style="padding: 10px 0; font-weight: 600; color: #64748b;">Submitted On</td>
            <td style="padding: 10px 0; color: #64748b;">${new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })} IST</td>
          </tr>
        </tbody>
      </table>

      <div style="margin-top: 24px; padding: 16px; background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0;">
        <p style="margin: 0; font-size: 13px; color: #475569; line-height: 1.5;">
          <strong>Need immediate assistance?</strong><br />
          Feel free to reach out directly to our team at <a href="mailto:crm@mavenjobs.in" style="color: #2563eb; text-decoration: none; font-weight: 600;">crm@mavenjobs.in</a> or <a href="mailto:info@mavenjobs.in" style="color: #2563eb; text-decoration: none; font-weight: 600;">info@mavenjobs.in</a>.
        </p>
      </div>
    </div>

    <div style="background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 16px 24px; text-align: center; font-size: 12px; color: #94a3b8;">
      &copy; ${new Date().getFullYear()} Maven Jobs. All rights reserved.
    </div>
  </div>
  `;
};

/**
 * Builds Plaintext format for enquiry confirmation email
 */
const buildEnquiryConfirmationEmailText = (enquiry) => {
  return `
Thank You For Your Enquiry - Maven Jobs
=======================================
Dear ${enquiry.fullName || "Valued Customer"},

Thank you for contacting Maven Jobs. We have successfully received your sales & demo enquiry.

Your Reference ID: ${enquiry.referenceId}

Details Submitted:
- Full Name: ${enquiry.fullName}
- Mobile: +91 ${enquiry.mobile}
- Work Email: ${enquiry.email}
- Organization: ${enquiry.organizationName || "N/A"}
- Designation: ${enquiry.designation || "N/A"}
- City / Location: ${enquiry.city || "N/A"}
- Submitted: ${new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })} IST

Our dedicated CRM team will review your requirements and reach out to you shortly.
If you need immediate assistance, please email us at crm@mavenjobs.in or info@mavenjobs.in.

Warm regards,
The Maven Jobs Team
https://mavenjobs.in
`;
};

/**
 * Sleep helper for throttled queue delay
 */
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Categorizes email delivery errors for clear audit logging
 */
const categorizeEmailError = (errMsg = "") => {
  const errLower = String(errMsg).toLowerCase();
  if (errLower.includes("circuit breaker is open")) {
    return "CIRCUIT_OPEN";
  }
  if (errLower.includes("rate limit") || errLower.includes("throttling")) {
    return "THROTTLED";
  }
  if (errLower.includes("554") || errLower.includes("not verified") || errLower.includes("failed the check")) {
    return "REJECTED_UNVERIFIED";
  }
  return "FAILED";
};

/**
 * Dispatches In-App Notification and Emails:
 * 1. Immediate In-App & Socket Notification for Admin/CRM dashboard
 * 2. Confirmation Email to the person who filled out the form (enquiry.email)
 * 3. Notification Email to the two core CRM mailboxes: "crm@mavenjobs.in" and "info@mavenjobs.in"
 * 4. Per-recipient delivery tracking & persistence to MongoDB
 */
const dispatchSalesEnquiryNotifications = async (enquiry) => {
  try {
    // 1. Only send CRM emails to the two specified mailboxes
    const crmRecipients = ["crm@mavenjobs.in", "info@mavenjobs.in"];

    // 2. Send In-App Notification for Admin/CRM Dashboard
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

    // 3. Send Confirmation Email to the Person Who Filled Out the Form (enquiry.email)
    let enquirerResult = null;
    const enquirerEmail = (enquiry.email || "").toLowerCase().trim();
    if (enquirerEmail && /^\S+@\S+\.\S+$/.test(enquirerEmail)) {
      const confirmSubject = `Thank you for your enquiry - Maven Jobs (${enquiry.referenceId})`;
      const confirmHtml = buildEnquiryConfirmationEmailHtml(enquiry);
      const confirmText = buildEnquiryConfirmationEmailText(enquiry);

      try {
        const sendRes = await emailService.sendEmail({
          to: enquirerEmail,
          subject: confirmSubject,
          html: confirmHtml,
          text: confirmText,
        });

        if (sendRes && sendRes.success) {
          enquirerResult = {
            email: enquirerEmail,
            status: "SENT",
            messageId: sendRes.messageId || null,
            timestamp: new Date(),
          };
          logger.info(`[SalesEnquiry:Enquirer] Confirmation email sent successfully to ${enquirerEmail} (MessageID: ${sendRes.messageId})`);
        } else {
          const errorMsg = sendRes?.error || "Unknown delivery failure";
          const status = categorizeEmailError(errorMsg);
          enquirerResult = {
            email: enquirerEmail,
            status,
            error: errorMsg,
            timestamp: new Date(),
          };
          logger.warn(`[SalesEnquiry:Enquirer] Delivery failed for ${enquirerEmail}: [${status}] ${errorMsg}`);
        }
      } catch (err) {
        const errorMsg = err?.message || String(err);
        const status = categorizeEmailError(errorMsg);
        enquirerResult = {
          email: enquirerEmail,
          status,
          error: errorMsg,
          timestamp: new Date(),
        };
        logger.warn(`[SalesEnquiry:Enquirer] Exception sending confirmation to ${enquirerEmail}: [${status}] ${errorMsg}`);
      }
    }

    // Brief pause before sending CRM notifications to ensure clean sequencing
    await sleep(800);

    // 4. Send Notification Emails to CRM Team ("crm@mavenjobs.in", "info@mavenjobs.in")
    const crmSubject = `New Sales Enquiry: ${enquiry.organizationName || enquiry.fullName} (${enquiry.referenceId})`;
    const crmHtml = buildEnquiryEmailHtml(enquiry);
    const crmText = buildEnquiryEmailText(enquiry);

    const crmDeliveryResults = [];

    for (let i = 0; i < crmRecipients.length; i++) {
      const toEmail = crmRecipients[i];

      try {
        const sendRes = await emailService.sendEmail({
          to: toEmail,
          subject: crmSubject,
          html: crmHtml,
          text: crmText,
        });

        if (sendRes && sendRes.success) {
          crmDeliveryResults.push({
            email: toEmail,
            status: "SENT",
            messageId: sendRes.messageId || null,
            timestamp: new Date(),
          });
          logger.info(`[SalesEnquiry:CRM:Delivery] [${i + 1}/${crmRecipients.length}] Delivered to ${toEmail} (MessageID: ${sendRes.messageId})`);
        } else {
          const errorMsg = sendRes?.error || "Unknown delivery error";
          const status = categorizeEmailError(errorMsg);
          crmDeliveryResults.push({
            email: toEmail,
            status,
            error: errorMsg,
            timestamp: new Date(),
          });
          logger.warn(`[SalesEnquiry:CRM:Delivery] [${i + 1}/${crmRecipients.length}] Delivery failed for ${toEmail}: [${status}] ${errorMsg}`);
        }
      } catch (err) {
        const errorMsg = err?.message || String(err);
        const status = categorizeEmailError(errorMsg);
        crmDeliveryResults.push({
          email: toEmail,
          status,
          error: errorMsg,
          timestamp: new Date(),
        });
        logger.warn(`[SalesEnquiry:CRM:Delivery] [${i + 1}/${crmRecipients.length}] Exception for ${toEmail}: [${status}] ${errorMsg}`);
      }

      // Safe pause between the two CRM emails
      if (i < crmRecipients.length - 1) {
        await sleep(800);
      }
    }

    // 5. Delivery Summary Logging
    const sentCount = crmDeliveryResults.filter((r) => r.status === "SENT").length;
    const failedCount = crmDeliveryResults.filter((r) => r.status !== "SENT").length;

    logger.info(
      `[SalesEnquiry:DeliverySummary] Reference ID: ${enquiry.referenceId} | ` +
      `Enquirer Confirmation: [${enquirerResult?.status || "NOT_PROVIDED"}] | ` +
      `CRM Recipients: Total ${crmRecipients.length} | Sent: ${sentCount} | Failed: ${failedCount}`
    );

    // 6. Persist delivery audit report on Enquiry document in MongoDB
    await SalesEnquiryForm.findByIdAndUpdate(enquiry._id, {
      $set: {
        deliveryReport: {
          enquirer: enquirerResult,
          crmSummary: {
            total: crmRecipients.length,
            sentCount,
            failedCount,
            completedAt: new Date(),
          },
          crmResults: crmDeliveryResults,
        },
      },
    }).catch((dbErr) => {
      logger.warn(`[SalesEnquiry] Failed saving delivery report to DB: ${dbErr.message}`);
    });
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
