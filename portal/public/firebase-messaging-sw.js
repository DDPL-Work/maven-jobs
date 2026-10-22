/* eslint-disable no-undef */
// Service worker for Firebase Cloud Messaging background push notifications
importScripts("https://www.gstatic.com/firebasejs/10.9.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.9.0/firebase-messaging-compat.js");

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// Read Firebase credentials dynamically passed from environment via registration query params
const params = new URL(self.location).searchParams;
const firebaseConfig = {
  apiKey: params.get("apiKey") || "",
  projectId: params.get("projectId") || "",
  messagingSenderId: params.get("messagingSenderId") || "",
  appId: params.get("appId") || "",
};

try {
  if (firebaseConfig.projectId) {
    firebase.initializeApp(firebaseConfig);
    const messaging = firebase.messaging();
    console.log("[FCM SW] 🔥 Background Service Worker initialized for project:", firebaseConfig.projectId);

    messaging.onBackgroundMessage((payload) => {
      const notificationTitle = payload.notification?.title || payload.data?.title || "Maven Jobs";
      const notificationBody = payload.notification?.body || payload.data?.message || payload.data?.body || "";

      console.group(
        `%c🔔 [FCM SW:Portal] Background Push Received via Google FCM ✓%c "${notificationTitle}"`,
        "background: #0288d1; color: #fff; font-weight: bold; padding: 2px 6px; border-radius: 3px;",
        "color: #0288d1; font-weight: bold; margin-left: 6px;"
      );
      console.log("📌 Title:", notificationTitle);
      console.log("💬 Body:", notificationBody);
      console.log("🆔 Google FCM Message ID:", payload.messageId || "N/A");
      console.log("📡 Google Sender ID (from):", payload.from || "Google FCM");
      console.log("📦 Data:", payload.data);
      console.log("🔍 Full Payload:", payload);
      console.groupEnd();

      const notificationOptions = {
        body: notificationBody,
        icon: "/favicon.ico",
        badge: "/favicon.ico",
        data: {
          actionUrl: payload.data?.actionUrl || payload.fcmOptions?.link || "/dashboard",
          ...payload.data,
        },
      };

      return self.registration.showNotification(notificationTitle, notificationOptions);
    });
  }
} catch (err) {
  console.warn("[FCM SW] Service Worker initialization error:", err);
}

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.actionUrl || "/dashboard";

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((windowClients) => {
        for (const client of windowClients) {
          if (client.url.includes(self.location.origin) && "focus" in client) {
            client.navigate(targetUrl);
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow(targetUrl);
        }
      })
  );
});
