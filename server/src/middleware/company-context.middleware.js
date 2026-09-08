const Company = require("../models/Company");

const resolveCompanyContext = async (req, res, next) => {
  try {
    if (!req.user || !req.user.companyId) {
      return res.status(403).json({ success: false, message: "No company associated with this user" });
    }
    const company = await Company.findById(req.user.companyId);
    if (!company || company.status !== "ACTIVE") {
      return res.status(403).json({ success: false, message: "Company not found or inactive" });
    }
    req.company = company;
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = { resolveCompanyContext };
