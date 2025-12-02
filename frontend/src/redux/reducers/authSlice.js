import { createAction, createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import {
  setToken,
  getToken,
  clearToken,
  setAuthData,
  getAuthData,
  clearAuthData,
} from "@/utils/cookie"; // your Cookies.js file
import api from "@/utils/api";

export const setAuthDetailsByLocalStorage = createAction("SET_AUTH_DETAILS");
export const logoutAndClearToken = createAction("LOGOUT_AND_CLEAR_TOKEN");

// ------------------------------------------------------
// THUNK: Authenticate User
// ------------------------------------------------------
export const authenticateUser = createAsyncThunk(
  "auth/authenticateUser",
  async (credentials, { rejectWithValue }) => {
    try {
      const { username, password, rememberMe } = credentials;

      // Step 1 → Backend authentication
      const res = await api.post("/auth/login", {
        username,
        password,
      });

      const { access_token, refresh_token, user } = res.data;

      // Step 2 → Save tokens in Cookies + User in sessionStorage
      setToken(access_token);
      setAuthData({
        user,
        refresh_token,
        token: access_token,
      });

      // Step 3 → Remember user (optional)
      if (rememberMe) {
        localStorage.setItem(
          "rememberedUser",
          JSON.stringify({ username, password })
        );
      } else {
        localStorage.removeItem("rememberedUser");
      }

      return {
        user,
        token: access_token,
        refresh_token,
      };
    } catch (error) {
      const msg =
        error?.response?.data?.errorMessage ||
        error?.response?.data?.message ||
        "Something went wrong";

      return rejectWithValue({
        error: true,
        errorMessage: msg,
        statusCode: error?.response?.status || 500,
      });
    }
  }
);

export const validateSession = createAsyncThunk(
  "auth/validate",
  async (_, { rejectWithValue }) => {
    try {
      const token = getToken();
      if (!token) return rejectWithValue("NO_TOKEN");

      const res = await api.get("/auth/validate");

      if (res.data.valid) {
        const authData = getAuthData();
        return {
          token,
          user: authData.user,
        };
      }

      return rejectWithValue("INVALID");
    } catch {
      return rejectWithValue("INVALID");
    }
  }
);

export const refreshTokenThunk = createAsyncThunk(
  "auth/refresh",
  async (_, { rejectWithValue }) => {
    try {
      const authData = getAuthData();
      const refresh_token = authData?.refresh_token;

      if (!refresh_token) return rejectWithValue("NO_REFRESH");

      const res = await api.post("/auth/refresh", { refresh_token });

      const { access_token } = res.data;

      setToken(access_token); // update cookie

      return { token: access_token };
    } catch (err) {
      return rejectWithValue("REFRESH_FAILED");
    }
  }
);

export const forceLogout = createAction("auth/forceLogout");

// ------------------------------------------------------
// INITIAL STATE
// ------------------------------------------------------
const initialState = {
  isLoading: false,
  isLoggedIn: !!getToken(),
  authData: getAuthData() || {
    user: null,
    token: null,
  },
  isError: false,
  errorContainer: {
    error: false,
    errorMessage: "",
    statusCode: 0,
  },
};

export const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // ----------------------------------------------------
      // LOGOUT
      // ----------------------------------------------------
      .addCase(logoutAndClearToken, (state) => {
        // clearToken();
        // clearAuthData();
        // localStorage.clear();
        // state.isLoggedIn = false;
        state.authData = { user: null, token: null };
        clearToken();
        clearAuthData();
        state.isLoggedIn = false;
        window.location.href = "/";
      })

      // ----------------------------------------------------
      // SET AUTH FROM STORAGE
      // ----------------------------------------------------
      .addCase(setAuthDetailsByLocalStorage, (state, action) => {
        state.isLoggedIn = true;
        state.authData = {
          ...action.payload,
        };
      })

      // ----------------------------------------------------
      // LOGIN -> LOADING
      // ----------------------------------------------------
      .addCase(authenticateUser.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
        state.errorContainer = {
          error: false,
          errorMessage: "",
          statusCode: 0,
        };
      })

      // ----------------------------------------------------
      // LOGIN -> SUCCESS
      // ----------------------------------------------------
      .addCase(authenticateUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isLoggedIn = true;

        const { user, token, refresh_token } = action.payload;

        state.authData = {
          user,
          token,
          refresh_token,
        };
      })

      // ----------------------------------------------------
      // LOGIN -> FAILED
      // ----------------------------------------------------
      .addCase(authenticateUser.rejected, (state, action) => {
        state.isLoading = false;
        state.isLoggedIn = false;
        state.isError = true;
        state.errorContainer = {
          ...action.payload,
        };
      })
      .addCase(validateSession.pending, (state) => {
        state.sessionChecking = true;
      })
      .addCase(validateSession.fulfilled, (state, action) => {
        state.isLoggedIn = true;
        state.sessionChecking = false;
        state.authData = {
          token: action.payload.token,
          user: action.payload.user,
        };
      })
      .addCase(validateSession.rejected, (state) => {
        state.isLoggedIn = false;
        state.sessionChecking = false;
        clearToken();
        clearAuthData();
      })

      // Refresh token
      .addCase(refreshTokenThunk.fulfilled, (state, action) => {
        state.authData.token = action.payload.token;
      })
      .addCase(forceLogout, (state) => {
        clearToken();
        clearAuthData();
        state.isLoggedIn = false;
        window.location.href = "/";
      });
  },
});

export default authSlice.reducer;
