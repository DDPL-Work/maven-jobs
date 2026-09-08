//../thunks/crmThunks.js


import { createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../services/api";

// ------------------------------------------------------------
// GET MY PROFILE (CRM)
// ------------------------------------------------------------
export const getMyProfile = createAsyncThunk(
  "profile/getMyProfile",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get("/crm/me");

      return data.user;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch profile"
      );
    }
  }
);
