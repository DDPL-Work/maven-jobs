const asyncHandler = require("../middleware/async.middleware");
const User = require("../models/User");
const Company = require("../models/Company");
const CompanySubUser = require("../models/CompanySubUser");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const notificationService = require("../services/notification.service");

const createHttpError = (statusCode, message) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const smsService = require("../services/sms.service");
const emailService = require("../services/email.service");
const LoginOTP = require("../models/LoginOTP");
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");

// --- Sub-User CRUD ---

exports.getUsers = asyncHandler(async (req, res) => {
  const companyId = req.user.companyId;

  const company = await Company.findById(companyId);
  if (!company) {
    throw createHttpError(404, "Company not found");
  }

  let subUsers = await CompanySubUser.find({ companyId }).populate(
    "userId",
    "name email role isActive"
  );

  // Migration for legacy companies: if no super user exists, create one for the clientUserId
  const hasSuperUser = subUsers.some((su) => su.isSuperUser);
  if (!hasSuperUser && company.clientUserId) {
    const existingSuperUser = await User.findById(company.clientUserId);
    if (existingSuperUser) {
      const superSubUser = await CompanySubUser.create({
        userId: existingSuperUser._id,
        companyId: company._id,
        createdBy: existingSuperUser._id,
        isSuperUser: true,
        permissions: { jobPosting: true, jobBooster: true, resdex: true },
      });
      // Re-fetch to get populated fields
      subUsers = await CompanySubUser.find({ companyId }).populate(
        "userId",
        "name email role isActive"
      );
    }
  }

  const formattedUsers = subUsers.map((su) => ({
    id: su._id,
    userId: su.userId._id,
    name: su.userId.name,
    email: su.userId.email,
    isSuperUser: su.isSuperUser,
    isRestricted: su.isRestricted,
    jobPosting: su.permissions.jobPosting,
    jobBooster: su.permissions.jobBooster,
    resdex: su.permissions.resdex,
    timeRestriction: su.timeRestriction,
    ipRestriction: su.ipRestriction,
    accountSecurity: su.accountSecurity,
    avatar: su.avatar || su.userId.name.charAt(0).toUpperCase(),
    avatarBg: su.avatarBg || "#fef3c7",
    avatarColor: su.avatarColor || "#b45309",
  })).sort((a, b) => (b.isSuperUser ? 1 : 0) - (a.isSuperUser ? 1 : 0));

  res.status(200).json({
    success: true,
    data: formattedUsers,
  });
});

exports.createUser = asyncHandler(async (req, res) => {
  const {
    name,
    email,
    jobPosting,
    jobBooster,
    resdex,
    role,
  } = req.body;

  const companyId = req.user.companyId;
  const createdBy = req.user._id;

  const company = await Company.findById(companyId);
  if (!company) {
    throw createHttpError(404, "Company not found");
  }

  // Validate allowed domains
  const domain = `@${email.split("@")[1]?.toLowerCase()}`;
  if (!company.allowedDomains.includes(domain)) {
    throw createHttpError(400, `Domain ${domain} is not allowed by your company.`);
  }

  // Check if User already exists
  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    throw createHttpError(400, "A user with this email already exists");
  }

  // Set default password for new sub-users
  const defaultPassword = "Maven@123";
  const hashedPassword = await bcrypt.hash(defaultPassword, 10);

  const newUser = await User.create({
    name,
    email: email.toLowerCase(),
    password: hashedPassword,
    role: role || "RECRUITER",
    companyId: companyId,
    isActive: true,
  });

  const newSubUser = await CompanySubUser.create({
    userId: newUser._id,
    companyId,
    createdBy,
    permissions: {
      jobPosting,
      jobBooster,
      resdex,
    },
  });

  // Notify company admin of new team member
  notificationService.sendCompanyNotification({
    companyId,
    recipientUserId: createdBy,
    title: "New Team Member Added",
    message: `${newUser.name} has been added as a Recruiter.`,
    category: "TEAM",
    actionUrl: "/user-management",
  }).catch(() => {});

  // Notify new recruiter
  notificationService.sendRecruiterNotification({
    companyId,
    recruiterUserId: newUser._id,
    title: "Welcome to the Team",
    message: "You have been added to the recruiting team on MavenJobs.",
    category: "TEAM",
    actionUrl: "/employer-dashboard",
  }).catch(() => {});

  res.status(201).json({
    success: true,
    data: {
      id: newSubUser._id,
      userId: newUser._id,
      name: newUser.name,
      email: newUser.email,
      isSuperUser: newSubUser.isSuperUser,
      isRestricted: newSubUser.isRestricted,
      jobPosting: newSubUser.permissions.jobPosting,
      jobBooster: newSubUser.permissions.jobBooster,
      resdex: newSubUser.permissions.resdex,
      timeRestriction: newSubUser.timeRestriction,
      ipRestriction: newSubUser.ipRestriction,
      accountSecurity: newSubUser.accountSecurity,
      avatar: newSubUser.avatar || newUser.name.charAt(0).toUpperCase(),
      avatarBg: newSubUser.avatarBg || "#fef3c7",
      avatarColor: newSubUser.avatarColor || "#b45309",
    },
    message: "User created successfully",
  });
});

exports.updateUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, email, jobPosting, jobBooster, resdex } = req.body;
  const companyId = req.user.companyId;

  const subUser = await CompanySubUser.findOne({ _id: id, companyId }).populate("userId");
  if (!subUser) {
    throw createHttpError(404, "Sub-user not found");
  }

  // Check email uniqueness if changed
  if (email && email.toLowerCase() !== subUser.userId.email) {
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      throw createHttpError(400, "A user with this email already exists");
    }
    subUser.userId.email = email.toLowerCase();
  }

  if (name) {
    subUser.userId.name = name;
  }

  await subUser.userId.save();

  if (jobPosting !== undefined) subUser.permissions.jobPosting = jobPosting;
  if (jobBooster !== undefined) subUser.permissions.jobBooster = jobBooster;
  if (resdex !== undefined) subUser.permissions.resdex = resdex;

  await subUser.save();

  res.status(200).json({
    success: true,
    message: "User updated successfully",
  });
});

exports.deleteUsers = asyncHandler(async (req, res) => {
  const { ids } = req.body;
  const companyId = req.user.companyId;

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    throw createHttpError(400, "No users provided for deletion");
  }

  const subUsers = await CompanySubUser.find({ _id: { $in: ids }, companyId, isSuperUser: false });
  const userIds = subUsers.map(su => su.userId);

  await CompanySubUser.deleteMany({ _id: { $in: ids }, companyId, isSuperUser: false });
  await User.deleteMany({ _id: { $in: userIds } });

  res.status(200).json({
    success: true,
    message: "Users deleted successfully",
  });
});

exports.changeUserPassword = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { newPassword } = req.body;
  const companyId = req.user.companyId;

  const subUser = await CompanySubUser.findOne({ _id: id, companyId }).populate("userId");
  if (!subUser) {
    throw createHttpError(404, "Sub-user not found");
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  subUser.userId.password = hashedPassword;
  await subUser.userId.save();

  res.status(200).json({
    success: true,
    message: "Password updated successfully",
  });
});

exports.updateTimeRestrictions = asyncHandler(async (req, res) => {
  const { ids, policy, weekendRestrictions, accessStartTime, accessEndTime, ipRestriction } = req.body;
  const companyId = req.user.companyId;

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    throw createHttpError(400, "No users provided");
  }

  const updateFields = {};
  if (policy !== undefined) updateFields["timeRestriction.policy"] = policy;
  if (weekendRestrictions !== undefined) updateFields["timeRestriction.weekendRestrictions"] = weekendRestrictions;
  if (accessStartTime !== undefined) updateFields["timeRestriction.accessStartTime"] = accessStartTime;
  if (accessEndTime !== undefined) updateFields["timeRestriction.accessEndTime"] = accessEndTime;
  if (ipRestriction !== undefined) updateFields.ipRestriction = ipRestriction;
  
  if (Object.keys(updateFields).length > 0) {
    updateFields.isRestricted = true;
  } else {
    updateFields.isRestricted = false;
  }

  await CompanySubUser.updateMany(
    { _id: { $in: ids }, companyId, isSuperUser: false },
    { $set: updateFields }
  );

  res.status(200).json({
    success: true,
    message: "Restrictions updated successfully",
  });
});

// --- Domains ---

exports.getCompanyDomains = asyncHandler(async (req, res) => {
  const companyId = req.user.companyId;
  const company = await Company.findById(companyId);
  if (!company) throw createHttpError(404, "Company not found");

  // Migration for legacy companies: if allowedDomains is empty, seed it with the user's domain
  if (!company.allowedDomains || company.allowedDomains.length === 0) {
    const primaryDomain = `@${req.user.email.split("@")[1]?.toLowerCase()}`;
    if (primaryDomain && primaryDomain !== "@undefined") {
      company.allowedDomains = [primaryDomain];
      await company.save();
    }
  }

  res.status(200).json({
    success: true,
    data: company.allowedDomains || [],
  });
});

exports.addCompanyDomain = asyncHandler(async (req, res) => {
  const { domain, domainToken } = req.body;
  const companyId = req.user.companyId;

  if (!domainToken) {
    throw createHttpError(400, "Missing domain verification token");
  }

  try {
    const decoded = jwt.verify(domainToken, process.env.JWT_SECRET);
    if (!decoded.verified || !["add_domain", "manage_domain"].includes(decoded.action) || decoded.companyId !== String(companyId)) {
      throw new Error("Invalid token payload");
    }
  } catch (err) {
    throw createHttpError(400, "Invalid or expired verification token. Please verify OTP again.");
  }

  const company = await Company.findById(companyId);
  if (!company) throw createHttpError(404, "Company not found");

  if (!company.allowedDomains) {
    company.allowedDomains = [];
  }

  const cleanDomain = domain.toLowerCase().trim();
  if (!company.allowedDomains.includes(cleanDomain)) {
    company.allowedDomains.push(cleanDomain);
    await company.save();
  }

  res.status(200).json({
    success: true,
    message: "Domain added successfully",
    data: company.allowedDomains,
  });
});

exports.editCompanyDomain = asyncHandler(async (req, res) => {
  const { oldDomain, newDomain, domainToken } = req.body;
  const companyId = req.user.companyId;

  if (!domainToken) throw createHttpError(400, "Missing domain verification token");

  try {
    const decoded = jwt.verify(domainToken, process.env.JWT_SECRET);
    if (!decoded.verified || decoded.action !== "manage_domain" || decoded.companyId !== String(companyId)) {
      throw new Error("Invalid token payload");
    }
  } catch (err) {
    throw createHttpError(400, "Invalid or expired verification token. Please verify OTP again.");
  }

  const company = await Company.findById(companyId);
  if (!company) throw createHttpError(404, "Company not found");

  if (!company.allowedDomains) company.allowedDomains = [];

  const cleanOld = oldDomain.toLowerCase().trim();
  const cleanNew = newDomain.toLowerCase().trim();

  const idx = company.allowedDomains.indexOf(cleanOld);
  if (idx === -1) {
    throw createHttpError(404, "Domain not found in allowed list");
  }

  if (cleanOld !== cleanNew && company.allowedDomains.includes(cleanNew)) {
    throw createHttpError(400, `Domain ${cleanNew} is already in the allowed domains list`);
  }

  company.allowedDomains[idx] = cleanNew;
  await company.save();

  res.status(200).json({
    success: true,
    message: "Domain updated successfully",
    data: company.allowedDomains,
  });
});

exports.deleteCompanyDomain = asyncHandler(async (req, res) => {
  const { domain, domainToken } = req.query;
  const companyId = req.user.companyId;

  if (!domainToken) throw createHttpError(400, "Missing domain verification token");

  try {
    const decoded = jwt.verify(domainToken, process.env.JWT_SECRET);
    if (!decoded.verified || decoded.action !== "manage_domain" || decoded.companyId !== String(companyId)) {
      throw new Error("Invalid token payload");
    }
  } catch (err) {
    throw createHttpError(400, "Invalid or expired verification token. Please verify OTP again.");
  }

  const company = await Company.findById(companyId);
  if (!company) throw createHttpError(404, "Company not found");

  if (!company.allowedDomains) company.allowedDomains = [];

  const cleanDomain = domain.toLowerCase().trim();
  company.allowedDomains = company.allowedDomains.filter(d => d !== cleanDomain);
  await company.save();

  res.status(200).json({
    success: true,
    message: "Domain deleted successfully",
    data: company.allowedDomains,
  });
});

exports.sendDomainOtp = asyncHandler(async (req, res) => {
  const { method = 'mobile' } = req.body; // 'mobile' | 'email'
  const companyId = req.user.companyId;
  const company = await Company.findById(companyId);

  if (!company) {
    throw createHttpError(404, "Company not found");
  }

  // If security settings enforce mobile only, override the method.
  const isMobileOnly = company.securitySettings?.receiveOtpOnlyOnMobile;
  const actualMethod = isMobileOnly ? 'mobile' : method;

  if (actualMethod === 'email') {
    if (!company.email) {
      throw createHttpError(400, "Super-user email not found");
    }
    
    // Mask email (e.g. hello@gmail.com -> he***@g****.com)
    const emailParts = company.email.split('@');
    let maskedEmail = company.email;
    if (emailParts.length === 2) {
      const name = emailParts[0];
      const domain = emailParts[1];
      const maskedName = name.length > 2 ? name.substring(0, 2) + '*'.repeat(name.length - 2) : name;
      const maskedDomain = domain.length > 1 ? domain.substring(0, 1) + '*'.repeat(domain.length - 1) : domain;
      maskedEmail = `${maskedName}@${maskedDomain}`;
    }

    // Generate 6 digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const sessionId = "email_" + uuidv4();

    // Send email using email service
    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
        <h2 style="color: #0284c7;">Domain Verification OTP</h2>
        <p>You requested to add a new allowed domain to your Maven company profile.</p>
        <p>Your one-time password is:</p>
        <h1 style="font-size: 32px; letter-spacing: 4px; background: #f0f9ff; padding: 16px; text-align: center; border-radius: 8px;">${otp}</h1>
        <p style="font-size: 12px; color: #64748b; margin-top: 24px;">If you did not request this, please ignore this email.</p>
      </div>
    `;

    const emailResult = await emailService.sendEmail({
      to: company.email,
      subject: "Your Domain Verification OTP",
      html,
    });

    if (!emailResult.success) {
      throw createHttpError(500, "Failed to send OTP email");
    }

    // Save OTP to DB for 10 minutes
    await LoginOTP.create({
      phone: company.email, // reusing the phone field for contact destination
      userId: req.user._id,
      sessionId,
      otpCode: otp,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
    });

    return res.status(200).json({
      success: true,
      message: "OTP sent to registered email",
      data: {
        sessionId,
        maskedPhone: maskedEmail,
        expiresInSeconds: 600
      }
    });
  }

  // Mobile fallback or default
  if (!company.phone) {
    throw createHttpError(400, "Super-user phone number not found");
  }

  const phone = company.countryCode ? `${company.countryCode}${company.phone}` : company.phone;
  
  // Mask phone (e.g., 919876543210 -> 91******10)
  let maskedPhone = phone;
  if (phone.length >= 8) {
    maskedPhone = phone.substring(0, 2) + "*".repeat(phone.length - 4) + phone.substring(phone.length - 2);
  }

  const sessionId = await smsService.sendOTP(phone);

  res.status(200).json({
    success: true,
    message: "OTP sent to registered mobile number",
    data: {
      sessionId,
      maskedPhone,
      expiresInSeconds: 600
    }
  });
});

exports.verifyDomainOtp = asyncHandler(async (req, res) => {
  const { sessionId, otp } = req.body;
  if (!sessionId || !otp) {
    throw createHttpError(400, "SessionId and OTP are required");
  }

  let isValid = false;

  if (sessionId.startsWith("email_")) {
    const loginOtp = await LoginOTP.findOne({ sessionId, used: false });
    if (!loginOtp) {
      throw createHttpError(400, "Invalid or expired OTP session");
    }

    if (loginOtp.attempts >= loginOtp.maxAttempts) {
      throw createHttpError(400, "Maximum verification attempts exceeded. Request a new OTP.");
    }

    if (loginOtp.otpCode !== otp) {
      loginOtp.attempts += 1;
      await loginOtp.save();
      throw createHttpError(400, "Invalid OTP");
    }

    loginOtp.used = true;
    await loginOtp.save();
    isValid = true;
  } else {
    isValid = await smsService.verifyOTP(sessionId, otp);
  }

  if (!isValid) {
    throw createHttpError(400, "Invalid OTP");
  }

  // Issue a short-lived token to prove verification in the next step
  const domainToken = jwt.sign(
    { verified: true, action: "manage_domain", companyId: String(req.user.companyId) },
    process.env.JWT_SECRET,
    { expiresIn: "5m" }
  );

  res.status(200).json({
    success: true,
    message: "OTP verified successfully",
    data: { domainToken }
  });
});

exports.getSecuritySettings = asyncHandler(async (req, res) => {
  const company = await Company.findById(req.user.companyId);
  if (!company) throw createHttpError(404, "Company not found");

  res.status(200).json({
    success: true,
    data: company.securitySettings || {
      notifyPasswordChange: true,
      receiveOtpOnlyOnMobile: false,
      useOtpOnPatternChange: false
    }
  });
});

exports.updateSecuritySettings = asyncHandler(async (req, res) => {
  const { notifyPasswordChange, receiveOtpOnlyOnMobile, useOtpOnPatternChange } = req.body;
  
  const company = await Company.findById(req.user.companyId);
  if (!company) throw createHttpError(404, "Company not found");

  company.securitySettings = {
    ...company.securitySettings,
    ...(notifyPasswordChange !== undefined && { notifyPasswordChange }),
    ...(receiveOtpOnlyOnMobile !== undefined && { receiveOtpOnlyOnMobile }),
    ...(useOtpOnPatternChange !== undefined && { useOtpOnPatternChange }),
  };

  await company.save();

  res.status(200).json({
    success: true,
    message: "Security settings updated successfully",
    data: company.securitySettings
  });
});

exports.getProductSettings = asyncHandler(async (req, res) => {
  const company = await Company.findById(req.user.companyId);
  if (!company) throw createHttpError(404, "Company not found");

  res.status(200).json({
    success: true,
    data: company.productSettings || {
      resdex: {
        allowSubuserResetLogin: true,
        displayAvailableUsernames: true,
      },
      jobPosting: {
        photos: [],
        presentations: [],
        videoUrls: [],
        addresses: [],
        emailIds: [],
      },
    },
  });
});

exports.updateProductSettings = asyncHandler(async (req, res) => {
  const company = await Company.findById(req.user.companyId);
  if (!company) throw createHttpError(404, "Company not found");

  const { resdex, jobPosting } = req.body;

  if (!company.productSettings) {
    company.productSettings = {
      resdex: {
        allowSubuserResetLogin: true,
        displayAvailableUsernames: true,
      },
      jobPosting: {
        photos: [],
        presentations: [],
        videoUrls: [],
        addresses: [],
        emailIds: [],
      },
    };
  }

  if (resdex) {
    company.productSettings.resdex = {
      ...company.productSettings.resdex,
      ...resdex,
    };
  }

  if (jobPosting) {
    company.productSettings.jobPosting = {
      ...company.productSettings.jobPosting,
      ...jobPosting,
    };
  }

  company.markModified("productSettings");
  await company.save();

  res.status(200).json({
    success: true,
    message: "Product settings saved successfully",
    data: company.productSettings,
  });
});

exports.resetSubusersResdexLogin = asyncHandler(async (req, res) => {
  const companyId = req.user.companyId;
  const company = await Company.findById(companyId);
  if (!company) throw createHttpError(404, "Company not found");

  const User = require("../models/User");
  const subusers = await User.find({
    companyId,
    role: { $in: ["RECRUITER", "CLIENT"] },
  });

  const UserLoginLog = require("../models/UserLoginLog");
  await UserLoginLog.updateMany(
    { companyId, event: "LOGIN", logoutTime: null },
    { $set: { logoutTime: new Date(), logoutReason: "ADMIN_RESDEX_RESET" } }
  );

  res.status(200).json({
    success: true,
    message: "Subuser(s) logged in Resdex have been reset successfully.",
    data: {
      affectedCount: subusers.length,
    },
  });
});

