const { initializeApp, cert, getApps, getApp } = require("firebase-admin/app");
const { getMessaging } = require("firebase-admin/messaging");
const logger = require("./logger");

let app = null;
let messaging = null;

function initFirebase() {
  if (app && messaging) {
    return { app, messaging };
  }

  const apps = getApps();
  if (apps.length > 0) {
    app = apps[0];
    messaging = getMessaging(app);
    return { app, messaging };
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    logger.warn("[Firebase] Firebase credentials are missing in environment variables. Push notifications will be disabled.");
    return { app: null, messaging: null };
  }

  try {
    // Replace literal escaped \n with actual newlines if stored as a single-line string
    privateKey = privateKey.replace(/\\n/g, "\n");

    app = initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });

    messaging = getMessaging(app);
    logger.info(`[Firebase] Firebase Admin initialized successfully for project: ${projectId}`);
    return { app, messaging };
  } catch (error) {
    logger.error("[Firebase] Failed to initialize Firebase Admin:", error.message);
    return { app: null, messaging: null };
  }
}

// Initialize on load
initFirebase();

module.exports = {
  getApp: () => app,
  getMessaging: () => messaging || (initFirebase().messaging),
  isConfigured: () => Boolean(app && messaging),
};
