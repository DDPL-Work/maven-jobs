const Company = require("../models/Company");
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const emailService = require("../services/email.service");

// FSE creates client company
exports.createCompany = async (req, res) => {
  const { name, email, phone } = req.body;

  const company = await Company.create({
    name,
    email,
    phone,
    createdByFSE: req.user._id,
  });

  // Create CLIENT user
  const password = Math.random().toString(36).slice(-8);
  const hashed = await bcrypt.hash(password, 10);

  await User.create({
    name,
    email,
    password: hashed,
    role: "CLIENT",
    companyId: company._id,
  });

  // Send credentials email to the new client user
  emailService.sendNewUserCredentialsEmail({
    to: email,
    name,
    password,
    companyName: name,
    role: "CLIENT",
  }).catch((err) => {
    console.error(`[CompanyController] Failed to send credentials email to ${email}:`, err);
  });

  res.status(201).json({
    message: "Company created successfully. Credentials sent to email.",
    company,
    temporaryPassword: password,
  });
};

// CRM updates package
exports.updatePackage = async (req, res) => {
  const { packageType, jobLimit } = req.body;

  const company = await Company.findById(req.params.id);
  if (!company) {
    return res.status(404).json({ message: "Company not found" });
  }

  company.packageType = packageType;
  company.jobLimit = jobLimit;
  await company.save();

  res.json({ message: "Package updated", company });
};
