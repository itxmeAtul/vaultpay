import { configureStore } from "@reduxjs/toolkit";
import reducers from "./reducers";
import { setSessionExpired } from "./reducers/sessionSlice";
import api, { injectStore } from "@/utils/api";
import { getToken } from "@/utils/cookie"; // you forgot this

const devMode = process.env.NODE_ENV === "development";

// ----------------------
// Custom Token Middleware
// ----------------------
const tokenMiddleware = (store) => (next) => (action) => {
  const token = getToken();

  const isNotAuth = !action?.type?.startsWith("auth");
  const isNotRegistration = !action?.type?.startsWith("registration");
  const isTokenExists = !!token;

  if (isNotAuth && isNotRegistration && isTokenExists) {
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  }

  if (
    action.error &&
    action?.payload?.errorMessage &&
    action.payload.errorMessage.toString().includes("JWT")
  ) {
    store.dispatch(setSessionExpired());
  }

  return next(action);
};

// ----------------------
// STORE (FINAL)
// ----------------------
export const store = configureStore({
  reducer: reducers,
  devTools: devMode,

  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActionPaths: ["payload.headers"],
      },
    }).concat(tokenMiddleware),
});
injectStore(store);
