const streamifier = require("streamifier");
const cloudinary = require("../config/cloudinary");

const isCloudinaryConfigured = () =>
  Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET,
  );

const uploadImage = async (file, { userId, type = "profile" } = {}) =>
  new Promise((resolve, reject) => {
    if (!isCloudinaryConfigured()) {
      reject(new Error("Cloudinary is not configured."));
      return;
    }

    const folder = type === "cover" ? "candidate_cover_images" : "candidate_profile_images";
    const publicId = `candidate_${type}_${userId}_${Date.now()}`;

    const transformation = type === "cover" 
      ? [
          { width: 1200, height: 400, crop: "fill", quality: "auto", fetch_format: "auto" }
        ]
      : [
          { width: 400, height: 400, crop: "fill", gravity: "face", quality: "auto", fetch_format: "auto" }
        ];

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: "image",
        folder,
        public_id: publicId,
        overwrite: true,
        invalidate: true,
        transformation,
      },
      (error, result) => {
        if (error) {
          reject(error);
          return;
        }

        resolve({
          url: result.secure_url,
          publicId: result.public_id,
        });
      },
    );

    streamifier.createReadStream(file.buffer).pipe(uploadStream);
  });

const deleteImage = async (publicId = "") => {
  if (!publicId || !isCloudinaryConfigured()) {
    return;
  }

  try {
    await cloudinary.uploader.destroy(publicId, { invalidate: true, resource_type: "image" });
  } catch {
    // Ignore deletion failures
  }
};

exports.replaceCandidateImage = async (file, { userId, type, previousPublicId } = {}) => {
  const uploaded = await uploadImage(file, { userId, type });

  if (previousPublicId && previousPublicId !== uploaded.publicId) {
    await deleteImage(previousPublicId);
  }

  return uploaded;
};
