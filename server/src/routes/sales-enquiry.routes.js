const express = require("express");
const router = express.Router();

const {
  submitSalesEnquiry,
  getSalesEnquiries,
  getSalesEnquiryById,
  updateSalesEnquiry,
} = require("../controllers/sales-enquiry.controller");

// Public route to submit an enquiry / request demo
router.post("/", submitSalesEnquiry);

// Routes for fetching and managing enquiries
router.get("/", getSalesEnquiries);
router.get("/:id", getSalesEnquiryById);
router.patch("/:id", updateSalesEnquiry);

module.exports = router;
