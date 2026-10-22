import { initializeApp, getApps, getApp } from "firebase/app";
import { getMessaging, getToken, onMessage, isSupported } from "firebase/messaging";
import authService from "./authService";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "",
};

// Immediate log to confirm Firebase status in browser DevTools
if (typeof window !== "undefined") {
  if (firebaseConfig.apiKey && firebaseConfig.projectId) {
    console.log(
      `%c🔥 [Firebase] Running & Initialized ✓%c Project: "${firebaseConfig.projectId}"`,
      "background: #ff9800; color: #fff; font-weight: bold; padding: 2px 8px; border-radius: 4px; font-size: 11px;",
      "color: #e65100; font-weight: bold; margin-left: 6px;"
    );
  } else {
    console.warn(
      `%c⚠️ [Firebase] Config Incomplete%c Missing VITE_FIREBASE_API_KEY or VITE_FIREBASE_PROJECT_ID in .env. Notifications inactive.`,
      "background: #f44336; color: #fff; font-weight: bold; padding: 2px 8px; border-radius: 4px;",
      "color: #f44336; margin-left: 6px;"
    );
  }
}

let app = null;
let messaging = null;

export async function getFirebaseMessaging() {
  if (typeof window === "undefined") return null;

  const supported = await isSupported().catch(() => false);
  if (!supported) {
    console.info("[Firebase] Web push messaging is not supported in this browser environment.");
    return null;
  }

  if (!firebaseConfig.projectId) {
    return null;
  }

  if (!app) {
    app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    console.log(
      `%c🔥 [Firebase] App Instance Ready%c ${app.name} (${firebaseConfig.projectId})`,
      "background: #ffb74d; color: #000; font-weight: bold; padding: 2px 6px; border-radius: 3px;",
      "color: #666; margin-left: 6px;"
    );
  }

  if (!messaging) {
    messaging = getMessaging(app);
  }

  return messaging;
}

/**
 * Request notification permission from browser, retrieve FCM token, and sync with backend
 */
export async function registerPushNotifications(userRole = "CANDIDATE") {
  try {
    if (typeof window === "undefined" || !("Notification" in window)) {
      console.warn("[Firebase] Browser does not support Notification API.");
      return null;
    }

    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      console.info(`[Firebase] Push notification permission: "${permission}".`);
      return null;
    }

    const msg = await getFirebaseMessaging();
    if (!msg) return null;

    // Register service worker if supported
    let swRegistration = null;
    if ("serviceWorker" in navigator) {
      const swUrl = `/firebase-messaging-sw.js?projectId=${encodeURIComponent(firebaseConfig.projectId || "")}&messagingSenderId=${encodeURIComponent(firebaseConfig.messagingSenderId || "")}&appId=${encodeURIComponent(firebaseConfig.appId || "")}&apiKey=${encodeURIComponent(firebaseConfig.apiKey || "")}`;
      swRegistration = await navigator.serviceWorker.register(swUrl, {
        scope: "/",
      }).catch((swErr) => {
        console.warn("[Firebase] Service worker registration warning:", swErr);
        return null;
      });

      if (swRegistration) {
        console.log(
          `%c🔥 [Firebase] Service Worker Active ✓%c /firebase-messaging-sw.js`,
          "background: #1976d2; color: #fff; font-weight: bold; padding: 2px 6px; border-radius: 3px;",
          "color: #555; margin-left: 6px;"
        );
      }
    }

    const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY || undefined;

    const currentToken = await getToken(msg, {
      serviceWorkerRegistration: swRegistration || undefined,
      vapidKey,
    }).catch((tokenErr) => {
      console.warn("[Firebase] Failed to retrieve FCM token:", tokenErr.message);
      return null;
    });

    if (currentToken) {
      console.log(
        `%c🔥 [Firebase] Push Notification Token Active ✓%c Role: ${userRole} | Token: ${currentToken.slice(0, 20)}...`,
        "background: #2e7d32; color: #fff; font-weight: bold; padding: 2px 6px; border-radius: 3px;",
        "color: #2e7d32; font-weight: bold; margin-left: 6px;"
      );
      if (userRole === "CLIENT" || userRole === "RECRUITER") {
        await authService.saveEmployerFcmToken(currentToken);
      } else {
        await authService.saveCandidateFcmToken(currentToken);
      }
      return currentToken;
    }

    return null;
  } catch (err) {
    console.warn("[Firebase] registerPushNotifications error:", err?.message || err);
    return null;
  }
}

/**
 * Register foreground message listener (when web app tab is actively focused)
 */
export async function subscribeToForegroundNotifications(onReceive) {
  try {
    const msg = await getFirebaseMessaging();
    if (!msg) return () => {};

    return onMessage(msg, (payload) => {
      console.log(
        `%c🔔 [Firebase] Foreground Notification Received:%c`,
        "background: #7b1fa2; color: #fff; font-weight: bold; padding: 2px 6px; border-radius: 3px;",
        payload
      );
      if (typeof onReceive === "function") {
        onReceive(payload);
      }
    });
  } catch {
    return () => {};
  }
}
