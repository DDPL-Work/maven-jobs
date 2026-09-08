// src/API/axiosInstance.js
import axios from "axios";
import { logoutUser } from "../Redux/thunks/authThunks"; 

// create API instance (no direct store import)
const API = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "/api",
  headers: {
  },
});

// attach request interceptor (this doesn't need the store)
API.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// export a function to set up response interceptor using the store
export const setupAxiosInterceptors = (store) => {
  // remove any existing response interceptors if needed (optional)
  API.interceptors.response.handlers = [];

  API.interceptors.response.use(
    (response) => response,
    (error) => {
      const { status } = error.response || {};

      if (status === 401) {
        // clear session and dispatch logout
        sessionStorage.removeItem("token");
        sessionStorage.removeItem("user");

        if (store && typeof store.dispatch === "function") {
          store.dispatch(logoutUser());
        }

        // redirect user to login
        window.location.href = "/login";
      }

      return Promise.reject(error);
    }
  );
};

export default API;