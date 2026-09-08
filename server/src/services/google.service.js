const { OAuth2Client } = require("google-auth-library");

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;

const createHttpError = (statusCode, message) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const getOAuth2Client = () => {
  if (!GOOGLE_CLIENT_ID) {
    throw createHttpError(500, "Google Client ID is not configured");
  }
  return new OAuth2Client(GOOGLE_CLIENT_ID);
};

/**
 * Verify a Google ID Token and return the verified payload.
 * Never trusts the frontend — only trusts Google's server-side verification.
 */
const verifyGoogleToken = async (idToken) => {
  if (!idToken || typeof idToken !== "string") {
    throw createHttpError(400, "Google ID token is required");
  }

  const client = getOAuth2Client();

  let ticket;
  try {
    ticket = await client.verifyIdToken({
      idToken,
      audience: GOOGLE_CLIENT_ID,
    });
  } catch (error) {
    if (error.message?.includes("Token used too late") || error.message?.includes("expired")) {
      throw createHttpError(401, "Google token has expired");
    }
    if (error.message?.includes("Invalid token") || error.message?.includes("Wrong number of segments")) {
      throw createHttpError(401, "Invalid Google token");
    }
    throw createHttpError(401, "Google token verification failed");
  }

  const payload = ticket.getPayload();

  if (!payload) {
    throw createHttpError(401, "Google token verification failed");
  }

  if (payload.aud !== GOOGLE_CLIENT_ID) {
    throw createHttpError(401, "Invalid Google token audience");
  }

  if (!payload.email_verified) {
    throw createHttpError(403, "Google email is not verified");
  }

  if (!payload.email) {
    throw createHttpError(400, "Google account has no email");
  }

  return {
    googleId: payload.sub,
    email: payload.email.toLowerCase().trim(),
    name: payload.name || "",
    avatar: payload.picture || "",
    emailVerified: Boolean(payload.email_verified),
  };
};

module.exports = { verifyGoogleToken };
