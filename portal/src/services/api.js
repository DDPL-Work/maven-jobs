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

const CANDIDATE_TOKEN_KEY = "candidateToken";
const EMPLOYER_TOKEN_KEY = "employerToken";
const STORAGE_USER_KEY = "user";

let refreshPromise = null;

const getStoredToken = () => {
  if (typeof window === "undefined") return null;
  const newKey = localStorage.getItem(CANDIDATE_TOKEN_KEY);
  if (newKey) return newKey;
  const oldKey = localStorage.getItem("token");
  if (oldKey) {
    localStorage.setItem(CANDIDATE_TOKEN_KEY, oldKey);
    localStorage.removeItem("token");
    return oldKey;
  }
  return null;
};

const clearStoredSession = () => {
  if (typeof window !== "undefined") {
    localStorage.removeItem(CANDIDATE_TOKEN_KEY);
    localStorage.removeItem("token");
    localStorage.removeItem(STORAGE_USER_KEY);
  }
};

const setStoredSession = (token, user) => {
  if (typeof window !== "undefined") {
    if (token) localStorage.setItem(CANDIDATE_TOKEN_KEY, token);
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
        const token = res.data?.accessToken || res.data?.token;
        if (token) {
          const user =
            res.data?.user ||
            (() => {
              try {
                return JSON.parse(localStorage.getItem(STORAGE_USER_KEY) || "{}");
              } catch {
                return {};
              }
            })();

          if (endpoint.includes("company-panel")) {
            localStorage.setItem("employerToken", token);
          } else {
            setStoredSession(token, res.data?.user ?? user);
          }
          return token;
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
    const isEmployerEndpoint = config.url?.includes("company-panel");
    let token;
    if (isEmployerEndpoint) {
      token = localStorage.getItem(EMPLOYER_TOKEN_KEY);
    } else {
      token = localStorage.getItem(CANDIDATE_TOKEN_KEY);
      if (!token) {
        token = localStorage.getItem("token");
        if (token) {
          localStorage.setItem(CANDIDATE_TOKEN_KEY, token);
          localStorage.removeItem("token");
        }
      }
    }
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

const swapToEmployerToken = () => {
  const empToken = localStorage.getItem(EMPLOYER_TOKEN_KEY);
  const currentToken = localStorage.getItem(CANDIDATE_TOKEN_KEY);
  if (empToken && empToken !== currentToken) {
    localStorage.setItem(CANDIDATE_TOKEN_KEY, empToken);
    return empToken;
  }
  return null;
};

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
        const newToken = await tryRefresh();
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch {
        const isEmployer = originalRequest.url?.includes("company-panel");
        if (isEmployer) {
          localStorage.removeItem(EMPLOYER_TOKEN_KEY);
          localStorage.removeItem("employerUser");
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
      const swapped = swapToEmployerToken();
      if (swapped) {
        originalRequest._retry = true;
        originalRequest.headers.Authorization = `Bearer ${swapped}`;
        return api(originalRequest);
      }
    }

    if (error.response?.status === 401) {
      const isEmployer = originalRequest?.url?.includes("company-panel");
      if (isEmployer) {
        localStorage.removeItem(EMPLOYER_TOKEN_KEY);
        localStorage.removeItem("employerUser");
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
