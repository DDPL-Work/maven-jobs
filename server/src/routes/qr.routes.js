const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth.middleware");
const uploadQrLogo = require("../middleware/qr-logo-upload.middleware");

const { createCompanyAndGenerateQR, downloadQRPDF } = require("../controllers/qr.controller");

// CRM generates QR
router.post("/generate", auth.protectCRM, uploadQrLogo, createCompanyAndGenerateQR);
router.get("/download/:token", downloadQRPDF);

module.exports = router;
