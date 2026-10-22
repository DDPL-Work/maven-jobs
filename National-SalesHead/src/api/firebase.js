import { initializeApp, getApps, getApp } from "firebase/app";
import { getMessaging, getToken, onMessage, isSupported } from "firebase/messaging";
import { getStoredCrmSession } from "./nshApi";

const API_ROOT =
  (import.meta.env.VITE_API_BASE_URL || "http://localhost:5050/api/v1").replace(/\/+$/, "") + "/crm-panel";

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
      `%c⚠️ [Firebase] Config Incomplete%c Missing VITE_FIREBASE_API_KEY or VITE_FIREBASE_PROJECT_ID in .env.`,
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

export async function registerPushNotifications() {
  try {
    if (typeof window === "undefined" || !("Notification" in window)) {
      return null;
    }

    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      return null;
    }

    const msg = await getFirebaseMessaging();
    if (!msg) return null;

    let swRegistration = null;
    if ("serviceWorker" in navigator) {
      const swUrl = `/firebase-messaging-sw.js?projectId=${encodeURIComponent(firebaseConfig.projectId || "")}&messagingSenderId=${encodeURIComponent(firebaseConfig.messagingSenderId || "")}&appId=${encodeURIComponent(firebaseConfig.appId || "")}&apiKey=${encodeURIComponent(firebaseConfig.apiKey || "")}`;
      swRegistration = await navigator.serviceWorker
        .register(swUrl, { scope: "/" })
        .catch(() => null);
    }

    const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY || undefined;

    const currentToken = await getToken(msg, {
      serviceWorkerRegistration: swRegistration || undefined,
      vapidKey,
    }).catch(() => null);

    if (currentToken) {
      const session = getStoredCrmSession();
      const token = session?.token || "";
      if (token) {
        await fetch(`${API_ROOT}/notifications/fcm-token`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ fcmToken: currentToken, device: "web" }),
        }).catch(() => {});
      }
      return currentToken;
    }

    return null;
  } catch (err) {
    return null;
  }
}

export async function subscribeToForegroundNotifications(callback) {
  try {
    const msg = await getFirebaseMessaging();
    if (!msg) return () => {};

    return onMessage(msg, (payload) => {
      if (typeof callback === "function") {
        callback(payload);
      }
    });
  } catch {
    return () => {};
  }
}
