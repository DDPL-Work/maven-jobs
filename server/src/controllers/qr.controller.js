const crypto = require("crypto");
const streamifier = require("streamifier");

const Company = require("../models/Company");
const Job = require("../models/Job");
const QRCode = require("../models/QRCode");
const cloudinary = require("../config/cloudinary");

const { generateCompanyQRPDF } = require("../services/pdf.service");

const getCandidateWebUrl = () => process.env.CANDIDATE_WEB_URL || process.env.FRONTEND_URL;

const createHttpError = (statusCode, message) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const toTrimmedString = (value) => (typeof value === "string" ? value.trim() : "");

const toSafeNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const parseJsonString = (value, fieldName) => {
  try {
    return JSON.parse(value);
  } catch {
    throw createHttpError(400, `Invalid JSON payload for "${fieldName}".`);
  }
};

const normalizeObject = (value, fieldName) => {
  if (!value) {
    return {};
  }

  if (typeof value === "object" && !Array.isArray(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = parseJsonString(value, fieldName);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw createHttpError(400, `"${fieldName}" must be an object.`);
    }
    return parsed;
  }

  throw createHttpError(400, `"${fieldName}" must be an object.`);
};

const normalizeArray = (value, fieldName) => {
  if (!value) {
    return [];
  }

  if (Array.isArray(value)) {
    return value;
  }

  if (typeof value === "string") {
    const trimmedValue = value.trim();
    if (!trimmedValue) {
      return [];
    }

    const parsed = parseJsonString(trimmedValue, fieldName);
    if (!Array.isArray(parsed)) {
      throw createHttpError(400, `"${fieldName}" must be an array.`);
    }
    return parsed;
  }

  throw createHttpError(400, `"${fieldName}" must be an array.`);
};

const resolveRequestPayload = (body = {}) => {
  if (body?.payload && typeof body.payload === "object") {
    return body.payload;
  }

  if (typeof body?.payload === "string") {
    const parsedPayload = parseJsonString(body.payload, "payload");
    if (!parsedPayload || typeof parsedPayload !== "object" || Array.isArray(parsedPayload)) {
      throw createHttpError(400, "Payload must be a JSON object.");
    }
    return parsedPayload;
  }

  return body;
};

const uploadCompanyLogo = (file, ownerId) =>
  new Promise((resolve, reject) => {
    const publicId = `logo_${String(ownerId || "crm")}_${crypto.randomUUID()}`;

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: "image",
        folder: "company_logos",
        public_id: publicId,
        overwrite: true,
      },
      (error, result) => {
        if (error) {
          reject(error);
          return;
        }

        resolve({
          logoUrl: result?.secure_url || "",
          logoPublicId: result?.public_id || "",
        });
      },
    );

    streamifier.createReadStream(file.buffer).pipe(uploadStream);
  });

const uploadPdfBuffer = (pdfBuffer, token) =>
  new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: "raw",
        folder: "qr_pdfs",
        public_id: `qr_${token}`,
        format: "pdf",
      },
      (error, result) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(result);
      },
    );

    streamifier.createReadStream(pdfBuffer).pipe(uploadStream);
  });

exports.createCompanyAndGenerateQR = async (req, res) => {
  let uploadedLogo = null;
  let companyPersisted = false;

  try {
    const payload = resolveRequestPayload(req.body);
    const company = normalizeObject(payload.company, "company");
    const jobs = normalizeArray(payload.jobs, "jobs");
    const whyJoinUs = normalizeArray(payload.whyJoinUs, "whyJoinUs");

    const companyName = toTrimmedString(company.name);
    const email = toTrimmedString(company.contact?.email).toLowerCase();

    if (!companyName) {
      throw createHttpError(400, "Company name is required.");
    }

    if (!email) {
      throw createHttpError(400, "Company email is required.");
    }

    if (req.file) {
      uploadedLogo = await uploadCompanyLogo(req.file, req.user?._id);
    }

    const newCompany = await Company.create({
      name: companyName,
      tagline: toTrimmedString(company.tagline),
      industry: toTrimmedString(company.industry),
      companySize: toTrimmedString(company.size),
      foundedYear: toTrimmedString(company.founded),
      employeesCount: toTrimmedString(company.employees),
      headquarters: toTrimmedString(company.headquarters),
      activelyHiring: typeof company.activelyHiring === "boolean" ? company.activelyHiring : true,
      openRoles: toSafeNumber(company.openings, 0),
      email,
      phone: toTrimmedString(company.contact?.phone),
      altPhone: toTrimmedString(company.contact?.altPhone),
      website: toTrimmedString(company.website),
      linkedIn: toTrimmedString(company.linkedIn),
      logoUrl: uploadedLogo?.logoUrl || "",
      logoPublicId: uploadedLogo?.logoPublicId || "",
      location: {
        country: toTrimmedString(company.location?.country),
        region: toTrimmedString(company.location?.region),
        city: toTrimmedString(company.location?.city),
        zone: toTrimmedString(company.location?.zone),
        address: toTrimmedString(company.location?.address),
        pincode: toTrimmedString(company.location?.pincode),
      },
      about: toTrimmedString(payload.about),
      mission: toTrimmedString(payload.mission),
      vision: toTrimmedString(payload.vision),
      whyJoinUs: Array.isArray(whyJoinUs) ? whyJoinUs : [],
      createdByCRM: req.user._id,
      status: "ACTIVE",
    });
    companyPersisted = true;

    if (jobs.length) {
      await Job.insertMany(
        jobs.map((job = {}) => ({
          companyId: newCompany._id,
          title: toTrimmedString(job.title),
          department: toTrimmedString(job.department),
          jobType: toTrimmedString(job.jobType),
          workplaceType: toTrimmedString(job.workplaceType),
          location: toTrimmedString(job.location),
          experience: toTrimmedString(job.exp),
          salaryMin: toSafeNumber(job.salaryMin, 0),
          salaryMax: toSafeNumber(job.salaryMax, 0),
          skills: Array.isArray(job.skills)
            ? job.skills.map((skill) => toTrimmedString(skill)).filter(Boolean)
            : [],
          deadline: toTrimmedString(job.deadline),
          description: toTrimmedString(job.description),
        })),
      );

      newCompany.activeJobCount = jobs.length;
      await newCompany.save();
    }

    const token = crypto.randomUUID();
    const redirectUrl = `${getCandidateWebUrl()}/landing/${token}`;
    const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
      redirectUrl,
    )}`;

    const companyJobs = await Job.find({ companyId: newCompany._id });

    const pdfBuffer = await generateCompanyQRPDF({
      company: newCompany,
      jobs: companyJobs,
      qrImageUrl,
    });

    const uploadedPdf = await uploadPdfBuffer(pdfBuffer, token);

    await QRCode.create({
      companyId: newCompany._id,
      token,
      qrImageUrl,
      pdfUrl: uploadedPdf.secure_url,
      pdfPublicId: uploadedPdf.public_id,
      createdByCRM: req.user._id,
      isActive: true,
    });

    return res.status(201).json({
      success: true,
      token,
      redirectUrl,
      qrImage: qrImageUrl,
      pdfUrl: uploadedPdf.secure_url,
      companyLogoUrl: newCompany.logoUrl || "",
    });
  } catch (error) {
    if (uploadedLogo?.logoPublicId && !companyPersisted) {
      try {
        await cloudinary.uploader.destroy(uploadedLogo.logoPublicId, { resource_type: "image" });
      } catch (cleanupError) {
        console.warn("Logo cleanup failed:", cleanupError?.message || cleanupError);
      }
    }

    console.error("QR Create Error:", error);

    const statusCode = error.statusCode || 500;
    const message = statusCode === 500 ? "Failed to generate QR" : error.message;

    return res.status(statusCode).json({
      success: false,
      message,
    });
  }
};

exports.downloadQRPDF = async (req, res) => {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: "Token is required",
      });
    }

    const qr = await QRCode.findOne({
      token,
      isActive: true,
    }).populate("companyId");

    if (!qr || !qr.pdfUrl) {
      return res.status(404).json({
        success: false,
        message: "QR PDF not found",
      });
    }

    return res.redirect(qr.pdfUrl);
  } catch (error) {
    console.error("Download QR Error:", error);

    return res.status(500).json({
      success: false,
      message: "Download failed",
    });
  }
};
