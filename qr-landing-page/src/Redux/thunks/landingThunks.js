import { createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../services/api";

export const fetchLandingData = createAsyncThunk(
  "landing/fetchLandingData",
  async (token, { rejectWithValue }) => {
    try {
      const res = await api.get(`/landing/${token}`);
      return res.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to load company",
      );
    }
  },
);
