const path = require("path");
const streamifier = require("streamifier");
const cloudinary = require("../config/cloudinary");

let S3Client = null;
let PutObjectCommand = null;

try {
  ({ S3Client, PutObjectCommand } = require("@aws-sdk/client-s3"));
} catch {
  S3Client = null;
  PutObjectCommand = null;
}

const sanitizeName = (value = "") =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9.-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

const getAwsClient = () => {
  if (!S3Client || !PutObjectCommand) {
    return null;
  }

  if (!process.env.AWS_S3_REGION || !process.env.AWS_S3_BUCKET) {
    return null;
  }

  return new S3Client({
    region: process.env.AWS_S3_REGION,
    credentials:
      process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
        ? {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
          }
        : undefined,
  });
};

const uploadToAws = async (file, userId) => {
  const s3Client = getAwsClient();

  if (!s3Client) {
    return null;
  }

  const extension = path.extname(file.originalname || "") || ".pdf";
  const key = `candidate-resumes/${userId}/${Date.now()}-${sanitizeName(
    path.basename(file.originalname || "resume", extension),
  )}${extension}`;

  await s3Client.send(
    new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    }),
  );

  return {
    fileName: file.originalname,
    publicId: key,
    url: `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_S3_REGION}.amazonaws.com/${key}`,
    storageProvider: "AWS_S3",
    sizeBytes: file.size,
    mimeType: file.mimetype,
  };
};

const uploadToCloudinary = async (file, userId) =>
  new Promise((resolve, reject) => {
    if (
      !process.env.CLOUDINARY_CLOUD_NAME ||
      !process.env.CLOUDINARY_API_KEY ||
      !process.env.CLOUDINARY_API_SECRET
    ) {
      reject(new Error("Resume storage is not configured"));
      return;
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: "raw",
        folder: "candidate_resumes",
        public_id: `candidate_resume_${userId}_${Date.now()}`,
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
          storageProvider: "CLOUDINARY",
          sizeBytes: file.size,
          mimeType: file.mimetype,
        });
      },
    );

    streamifier.createReadStream(file.buffer).pipe(uploadStream);
  });

exports.uploadResumeFile = async (file, userId) => {
  return uploadToCloudinary(file, userId);
};

const deleteFromCloudinary = async (publicId = "") => {
  if (!publicId) return;
  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) return;
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: "raw", invalidate: true });
  } catch {
    // Ignore deletion failures
  }
};

exports.deleteResumeFile = async (publicId = "") => {
  await deleteFromCloudinary(publicId);
};
