import { createSlice } from "@reduxjs/toolkit";
import {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
} from "../actions/userActions";

const userSlice = createSlice({
  name: "users",
  initialState: {
    items: [],
    total: 0,
    isLoading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    /* -------- GET USERS -------- */
    builder
      .addCase(getUsers.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getUsers.fulfilled, (state, action) => {
        state.isLoading = false;
        state.items = action.payload.data || action.payload.data || [];
        state.total = action.payload.meta.total ?? action.payload.count ?? 0;
      })
      .addCase(getUsers.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    /* -------- CREATE USER -------- */
    builder.addCase(createUser.fulfilled, (state, action) => {
      state.items.unshift(action.payload);
      state.total += 1;
    });

    /* -------- UPDATE USER -------- */
    builder.addCase(updateUser.fulfilled, (state, action) => {
      const updated = action.payload;
      state.items = state.items.map((u) =>
        u._id === updated._id ? updated : u
      );
    });

    /* -------- DELETE USER -------- */
    builder.addCase(deleteUser.fulfilled, (state, action) => {
      state.items = state.items.filter((u) => u._id !== action.payload);
      state.total -= 1;
    });
  },
});

export default userSlice.reducer;
