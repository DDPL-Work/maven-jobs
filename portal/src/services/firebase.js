import { initializeApp, getApps, getApp } from "firebase/app";
import { getMessaging, getToken, onMessage, isSupported } from "firebase/messaging";
import authService from "./authService";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "",
};

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
      return null;
    }

    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
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
      if (typeof onReceive === "function") {
        onReceive(payload);
      }
    });
  } catch {
    return () => {};
  }
}
