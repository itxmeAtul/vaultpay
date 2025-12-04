import { createAction, createAsyncThunk } from "@reduxjs/toolkit";
import api from "@/utils/api";
import { jwtDecode } from "jwt-decode";
import {
  setToken,
  setAuthData,
  getAuthData,
  setPermissionData,
} from "@/utils/cookie";

export const authenticateUser = createAsyncThunk(
  "auth/login",
  async ({ username, password, rememberMe }, { rejectWithValue }) => {
    try {
      const res = await api.post("/auth/login", { username, password });
      const { access_token, refresh_token, user } = res.data;

      const decoded = jwtDecode(access_token);
      setPermissionData(decoded.permissions);
      setToken(access_token);
      setAuthData({ user, token: access_token, refresh_token });

      if (rememberMe) {
        localStorage.setItem(
          "rememberedUser",
          JSON.stringify({ username, password })
        );
      }

      return { user, token: access_token, refresh_token };
    } catch (error) {
        console.log(error,'ell')
      return rejectWithValue({
        error: true,
        errorMessage: error?.response?.data?.message || "Something went wrong",
        statusCode: error?.response?.status || 500,
      });
    }
  }
);

export const validateSession = createAsyncThunk(
  "auth/validate",
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get("/auth/validate");
      if (!res.data.valid) return rejectWithValue();

      const authData = getAuthData();
      return authData;
    } catch {
      return rejectWithValue();
    }
  }
);

export const refreshTokenThunk = createAsyncThunk(
  "auth/refresh",
  async (_, { rejectWithValue }) => {
    try {
      const { refresh_token } = getAuthData();
      if (!refresh_token) return rejectWithValue();

      const res = await api.post("/auth/refresh", { refresh_token });
      const { access_token } = res.data;

      setToken(access_token);
      return { token: access_token };
    } catch {
      return rejectWithValue();
    }
  }
);
