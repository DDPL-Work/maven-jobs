// src/API/axiosInstance.js
import axios from "axios";

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

export default API;