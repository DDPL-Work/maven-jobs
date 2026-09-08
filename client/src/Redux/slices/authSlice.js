import { createSlice } from "@reduxjs/toolkit";
import { loginUser, loginWithGoogle, logoutUser } from "../thunks/authThunks";

// ------------------------------------------------------------
// INITIAL STATE
// ------------------------------------------------------------
const storedUser = sessionStorage.getItem("user");
const parsedUser = storedUser ? JSON.parse(storedUser) : null;

const initialState = {
  user: parsedUser,
  token: sessionStorage.getItem("token"),
  role: parsedUser?.role || null,
  loading: false,
  error: null,
};

// ------------------------------------------------------------
// SLICE
// ------------------------------------------------------------
const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    clearAuthState: (state) => {
      state.user = null;
      state.token = null;
      state.role = null;
      state.error = null;
      state.loading = false;
      sessionStorage.removeItem("token");
      sessionStorage.removeItem("user");
    },
  },
  extraReducers: (builder) => {
    builder
      // LOGIN
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.role = action.payload.user.role;
      })

      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // GOOGLE LOGIN
      .addCase(loginWithGoogle.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginWithGoogle.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.role = action.payload.user.role;
      })
      .addCase(loginWithGoogle.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // LOGOUT
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.role = null;
        state.error = null;
        state.loading = false;
      })
      .addCase(logoutUser.rejected, (state, action) => {
        state.error = action.payload;
      });
  },
});

export const { clearAuthState } = authSlice.actions;
export default authSlice.reducer;
