import { createSlice, createAction } from "@reduxjs/toolkit";
import {
  authenticateUser,
  validateSession,
  refreshTokenThunk,
} from "../actions/authActions";
import {
  clearAuthData,
  clearToken,
  clearPermissionData,
  getAuthData,
  getToken,
} from "@/utils/cookie";

const initialState = {
  isLoading: false,
  isLoggedIn: !!getToken(),
  authData: getAuthData() || { user: null, token: null },
  isError: false,
  errorContainer: {},
};

export const logoutAndClearToken = createAction("auth/logout");

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(logoutAndClearToken, (state) => {
        clearToken();
        clearAuthData();
        clearPermissionData();
        state.isLoggedIn = false;
      })
      .addCase(authenticateUser.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(authenticateUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isLoggedIn = true;
        state.authData = action.payload;
      })
      .addCase(authenticateUser.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.errorContainer = action.payload;
      })
      .addCase(validateSession.fulfilled, (state, action) => {
        state.isLoggedIn = true;
        state.authData = action.payload;
      })
      .addCase(validateSession.rejected, (state) => {
        state.isLoggedIn = false;
      })
      .addCase(refreshTokenThunk.fulfilled, (state, action) => {
        state.authData.token = action.payload.token;
      });
  },
});

export default authSlice.reducer;
