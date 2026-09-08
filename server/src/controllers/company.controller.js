const Company = require("../models/Company");
const User = require("../models/User");
const bcrypt = require("bcryptjs");

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

  res.status(201).json({
    message: "Company created successfully",
    company,
    temporaryPassword: password, // send via email in production
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
