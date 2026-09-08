const streamifier = require("streamifier");
const cloudinary = require("../config/cloudinary");

const isCloudinaryConfigured = () =>
  Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET,
  );

const uploadProfileImage = async (file, { userId, role } = {}) =>
  new Promise((resolve, reject) => {
    if (!isCloudinaryConfigured()) {
      reject(new Error("Cloudinary is not configured for profile image uploads."));
      return;
    }

    const safeRole = String(role || "crm").toLowerCase();

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: "image",
        folder: "crm_profile_images",
        public_id: `crm_${safeRole}_${userId}_${Date.now()}`,
        overwrite: true,
        invalidate: true,
        transformation: [
          {
            width: 400,
            height: 400,
            crop: "fill",
            gravity: "face",
            quality: "auto",
            fetch_format: "auto",
          },
        ],
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

const deleteProfileImage = async (publicId = "") => {
  if (!publicId || !isCloudinaryConfigured()) {
    return;
  }

  try {
    await cloudinary.uploader.destroy(publicId, { invalidate: true, resource_type: "image" });
  } catch {
    // Ignore deletion failures to avoid blocking user profile update.
  }
};

exports.replaceCrmProfileImage = async (file, { userId, role, previousPublicId } = {}) => {
  const uploaded = await uploadProfileImage(file, { userId, role });

  if (previousPublicId && previousPublicId !== uploaded.publicId) {
    await deleteProfileImage(previousPublicId);
  }

  return uploaded;
};
