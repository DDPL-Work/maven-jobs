const express = require("express");
const router = express.Router();

const {
  submitSalesEnquiry,
  getSalesEnquiries,
  getSalesEnquiryById,
  updateSalesEnquiry,
} = require("../controllers/sales-enquiry.controller");
const { protectSalesEnquiryAccess } = require("../middleware/auth.middleware");

// Public route to submit an enquiry / request demo (stays public)
router.post("/", submitSalesEnquiry);

// Protected routes: Admin, CRM, and FSE can list, view, or modify enquiries
router.get("/", protectSalesEnquiryAccess, getSalesEnquiries);
router.get("/:id", protectSalesEnquiryAccess, getSalesEnquiryById);
router.patch("/:id", protectSalesEnquiryAccess, updateSalesEnquiry);

module.exports = router;

