import { initializeApp, getApps, getApp } from "firebase/app";
import { getMessaging, getToken, onMessage, isSupported } from "firebase/messaging";
import { getStoredToken } from "./crmApi";

const API_ROOT =
  import.meta.env.VITE_CRM_API_URL || "http://localhost:5050/api/v1/crm-panel";

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
      `%c🔥 [Firebase:CRM] Running & Initialized ✓%c Project: "${firebaseConfig.projectId}"`,
      "background: #ff9800; color: #fff; font-weight: bold; padding: 2px 8px; border-radius: 4px; font-size: 11px;",
      "color: #e65100; font-weight: bold; margin-left: 6px;"
    );
  } else {
    console.warn(
      `%c⚠️ [Firebase:CRM] Config Incomplete%c Missing VITE_FIREBASE_API_KEY or VITE_FIREBASE_PROJECT_ID in .env. Notifications inactive.`,
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
    console.info("[Firebase:CRM] Web push messaging is not supported in this browser environment.");
    return null;
  }

  if (!firebaseConfig.projectId) {
    return null;
  }

  if (!app) {
    app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    console.log(
      `%c🔥 [Firebase:CRM] App Instance Ready%c ${app.name} (${firebaseConfig.projectId})`,
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
 * Request notification permission, retrieve FCM token, and register with CRM Panel API
 */
export async function registerPushNotifications() {
  try {
    if (typeof window === "undefined" || !("Notification" in window)) {
      console.warn("[Firebase:CRM] Browser does not support Notification API.");
      return null;
    }

    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      console.warn(
        `%c⚠️ [Firebase:CRM] Push notification permission is "${permission}"%c\n` +
        `The browser has blocked notifications for this site.\n` +
        `To enable notifications and register the FCM token:\n` +
        `1. Click the 🔒 lock / tune icon in the browser address bar (left of the URL)\n` +
        `2. Change "Notifications" from "Block" to "Allow"\n` +
        `3. Reload the page.`,
        "background: #d32f2f; color: #fff; font-weight: bold; padding: 2px 6px; border-radius: 3px;",
        "color: #c62828; font-weight: bold;"
      );
      return null;
    }

    const msg = await getFirebaseMessaging();
    if (!msg) {
      console.warn("[Firebase:CRM] Firebase Messaging could not be initialized.");
      return null;
    }

    let swRegistration = null;
    if ("serviceWorker" in navigator) {
      const swUrl = `/firebase-messaging-sw.js?projectId=${encodeURIComponent(firebaseConfig.projectId || "")}&messagingSenderId=${encodeURIComponent(firebaseConfig.messagingSenderId || "")}&appId=${encodeURIComponent(firebaseConfig.appId || "")}&apiKey=${encodeURIComponent(firebaseConfig.apiKey || "")}`;
      swRegistration = await navigator.serviceWorker
        .register(swUrl, { scope: "/" })
        .catch((swErr) => {
          console.warn("[Firebase:CRM] Service worker registration warning:", swErr);
          return null;
        });

      if (swRegistration) {
        console.log(
          `%c🔥 [Firebase:CRM] Service Worker Active ✓%c /firebase-messaging-sw.js`,
          "background: #1976d2; color: #fff; font-weight: bold; padding: 2px 6px; border-radius: 3px;",
          "color: #555; margin-left: 6px;"
        );
      }
    }

    const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY || undefined;

    const currentToken = await getToken(msg, {
      serviceWorkerRegistration: swRegistration || undefined,
      vapidKey,
    }).catch((err) => {
      console.warn("[Firebase:CRM] Failed to retrieve FCM token:", err.message);
      return null;
    });

    if (currentToken) {
      console.log(
        `%c🔥 [Firebase:CRM] Push Notification Token Active ✓%c Token: ${currentToken.slice(0, 20)}...`,
        "background: #2e7d32; color: #fff; font-weight: bold; padding: 2px 6px; border-radius: 3px;",
        "color: #2e7d32; font-weight: bold; margin-left: 6px;"
      );
      const token = getStoredToken();
      if (token) {
        try {
          const res = await fetch(`${API_ROOT}/notifications/fcm-token`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ fcmToken: currentToken, device: "web" }),
          });
          const resData = await res.json();
          console.log(
            `%c🔥 [Firebase:CRM] FCM Token Synced with Backend ✓%c (${API_ROOT}/notifications/fcm-token)`,
            "background: #2e7d32; color: #fff; font-weight: bold; padding: 2px 6px; border-radius: 3px;",
            "color: #555; margin-left: 6px;",
            resData
          );
        } catch (syncErr) {
          console.warn("[Firebase:CRM] Failed to sync FCM token to backend:", syncErr?.message || syncErr);
        }
      } else {
        console.warn("[Firebase:CRM] FCM token retrieved, but no user auth token found in session. Log in to sync token with backend.");
      }
      return currentToken;
    }

    return null;
  } catch (err) {
    console.warn("[Firebase:CRM] registerPushNotifications error:", err?.message || err);
    return null;
  }
}

/**
 * Listen for incoming foreground push notifications
 */
export async function subscribeToForegroundNotifications(callback) {
  try {
    const msg = await getFirebaseMessaging();
    if (!msg) return () => {};

    return onMessage(msg, (payload) => {
      console.log(
        `%c🔔 [Firebase:CRM] Foreground Notification Received:%c`,
        "background: #7b1fa2; color: #fff; font-weight: bold; padding: 2px 6px; border-radius: 3px;",
        payload
      );
      if (typeof callback === "function") {
        callback(payload);
      }
    });
  } catch {
    return () => {};
  }
}
