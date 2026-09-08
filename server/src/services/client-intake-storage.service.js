const streamifier = require("streamifier");
const cloudinary = require("../config/cloudinary");

const sanitizeName = (value = "") =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9.-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

const uploadClientJdFile = async (file, intakeRef = "") =>
  new Promise((resolve, reject) => {
    if (
      !process.env.CLOUDINARY_CLOUD_NAME ||
      !process.env.CLOUDINARY_API_KEY ||
      !process.env.CLOUDINARY_API_SECRET
    ) {
      reject(new Error("Client JD storage is not configured"));
      return;
    }

    const baseName = sanitizeName(file.originalname || "jd-file") || "jd-file";
    const ref = sanitizeName(intakeRef || String(Date.now()));

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: "raw",
        folder: "client_jd_uploads",
        public_id: `client_jd_${ref}_${Date.now()}_${baseName}`,
        use_filename: false,
      },
      (error, result) => {
        if (error) {
          reject(error);
          return;
        }

        resolve({
          fileName: file.originalname,
          publicId: result.public_id,
          url: result.secure_url,
          sizeBytes: Number(file.size || 0),
          mimeType: file.mimetype || "",
          uploadedAt: new Date(),
        });
      },
    );

    streamifier.createReadStream(file.buffer).pipe(uploadStream);
  });

module.exports = {
  uploadClientJdFile,
};
