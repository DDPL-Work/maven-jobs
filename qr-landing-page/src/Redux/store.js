// src/features/store.js
import { configureStore } from "@reduxjs/toolkit";
import landingReducer from "./slices/landingSlice.js";

export const store = configureStore({
  reducer: {
   landing: landingReducer,
  },
});


export default store;
