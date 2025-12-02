import { createAction, createSlice } from "@reduxjs/toolkit";

export const setSessionExpired = createAction("SET_SESSION_EXPIRED");

export const setInitialSession = createAction("SET_INITIAL_SESSSION");

const intial = {
  isSessionExpired: false,
};

export const sessionSlice = createSlice({
  name: "session",
  initialState: intial,
  extraReducers: (builder) => {
    builder
      .addCase(setSessionExpired, (state) => {
        state.isSessionExpired = true;
      })
      .addCase(setInitialSession, (state) => {
        state.isSessionExpired = false;
      });
  },
});

export default sessionSlice.reducer;
