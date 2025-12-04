import { createAsyncThunk } from "@reduxjs/toolkit";
import api from "@/utils/api";

/* ================================
   1. GET USERS (LIST)
================================ */
export const getUsers = createAsyncThunk(
  "users/getUsers",
  async ({ page = 1, limit = 10, search = "" }, { rejectWithValue }) => {
    try {
      const res = await api.get(
        `/users?page=${page}&limit=${limit}`
      );

      return res.data; // expect: { items:[], total: number }
    } catch (err) {
      return rejectWithValue({
        error: true,
        message: err.response?.data?.message || "Failed to fetch users",
      });
    }
  }
);

/* ================================
   2. CREATE USER
================================ */
export const createUser = createAsyncThunk(
  "users/createUser",
  async (userData, { rejectWithValue }) => {
    try {
      const res = await api.post("/users", userData);
      return res.data;
    } catch (err) {
      return rejectWithValue({
        error: true,
        message: err.response?.data?.message || "Failed to create user",
      });
    }
  }
);

/* ================================
   3. UPDATE USER
================================ */
export const updateUser = createAsyncThunk(
  "users/updateUser",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const res = await api.put(`/users/${id}`, data);
      return res.data;
    } catch (err) {
      return rejectWithValue({
        error: true,
        message: err.response?.data?.message || "Failed to update user",
      });
    }
  }
);

/* ================================
   4. DELETE USER
================================ */
export const deleteUser = createAsyncThunk(
  "users/deleteUser",
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/users/${id}`);
      return id;
    } catch (err) {
      return rejectWithValue({
        error: true,
        message: err.response?.data?.message || "Failed to delete user",
      });
    }
  }
);
