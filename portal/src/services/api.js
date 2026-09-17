import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "https://naukri-6v4n.onrender.com/api/v1";

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

const REFRESH_ENDPOINTS = [
  "/candidate/auth/refresh",
  "/company-panel/auth/refresh",
];

const STORAGE_USER_KEY = "user";

let refreshPromise = null;

const clearStoredSession = () => {
  if (typeof window !== "undefined") {
    localStorage.clear(); sessionStorage.clear();
  }
};

const setStoredSession = (user) => {
  if (typeof window !== "undefined") {
    if (user) {
      const existingRaw = localStorage.getItem(STORAGE_USER_KEY);
      let existing = {};
      try { existing = existingRaw ? JSON.parse(existingRaw) : {}; } catch {}
      const merged = { ...existing, ...user };
      localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(merged));
    }
  }
};

const tryRefresh = async () => {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    const baseUrl = API_BASE_URL.replace(/\/+$/, "");

    for (const endpoint of REFRESH_ENDPOINTS) {
      try {
        const res = await axios.post(
          `${baseUrl}${endpoint}`,
          null,
          { withCredentials: true }
        );
        if (res.data?.success) {
          const user =
            res.data?.user ||
            (() => {
              try {
                return JSON.parse(localStorage.getItem(STORAGE_USER_KEY) || "{}");
              } catch {
                return {};
              }
            })();

          if (!endpoint.includes("company-panel")) {
            setStoredSession(res.data?.user ?? user);
          }
          return true;
        }
      } catch {
        continue;
      }
    }

    throw new Error("Unable to refresh authentication");
  })();

  try {
    return await refreshPromise;
  } finally {
    refreshPromise = null;
  }
};

api.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !originalRequest._skipAuthRefresh
    ) {
      originalRequest._retry = true;

      try {
        await tryRefresh();
        return api(originalRequest);
      } catch {
        const isEmployer = originalRequest.url?.includes("company-panel");
        if (isEmployer) {
          localStorage.clear(); sessionStorage.clear();
        } else {
          clearStoredSession();
        }
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event(isEmployer ? "employer-session-expired" : "candidate-session-expired"));
        }
      }
    }

    if (
      error.response?.status === 403 &&
      originalRequest &&
      !originalRequest._retry &&
      !originalRequest._skipAuthRefresh
    ) {
      // 403 generally means forbidden (e.g. wrong role). We no longer swap tokens here since cookies manage the session.
    }

    if (error.response?.status === 401) {
      const isEmployer = originalRequest?.url?.includes("company-panel");
      if (isEmployer) {
        localStorage.clear(); sessionStorage.clear();
      } else {
        clearStoredSession();
      }
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event(isEmployer ? "employer-session-expired" : "candidate-session-expired"));
      }
    }

    return Promise.reject(error);
  }
);

export default api;


