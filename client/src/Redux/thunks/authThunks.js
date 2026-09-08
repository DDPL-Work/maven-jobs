import { createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../services/api";

// ------------------------------------------------------------
// LOGIN
// ------------------------------------------------------------
export const loginUser = createAsyncThunk(
  "auth/loginUser",
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const { data } = await api.post("/auth/login", {
        email,
        password,
      });

      sessionStorage.setItem("token", data.token);
      sessionStorage.setItem("user", JSON.stringify(data.user));

      return {
        user: data.user,
        token: data.token,
      };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Login failed");
    }
  },
);

// ------------------------------------------------------------
// GOOGLE LOGIN
// ------------------------------------------------------------
export const loginWithGoogle = createAsyncThunk(
  "auth/loginWithGoogle",
  async (credential, { rejectWithValue }) => {
    try {
      const { data } = await api.post(
        "/auth/google",
        { credential },
        { withCredentials: true },
      );

      sessionStorage.setItem("token", data.accessToken);
      sessionStorage.setItem("user", JSON.stringify(data.user));

      return {
        user: data.user,
        token: data.accessToken,
      };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Google login failed",
      );
    }
  },
);

// ------------------------------------------------------------
// LOGOUT
// ------------------------------------------------------------
export const logoutUser = createAsyncThunk(
  "auth/logoutUser",
  async (_, { rejectWithValue }) => {
    try {
      sessionStorage.removeItem("token");
      sessionStorage.removeItem("user");

      return true;
    } catch {
      return rejectWithValue("Logout failed");
    }
  },
);
