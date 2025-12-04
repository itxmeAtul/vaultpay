import { refreshTokenThunk } from "../actions/authActions";
import { logoutAndClearToken } from "../reducers/authSlice";

export async function handleTokenRefresh(error, originalRequest, store) {
  const result = await store.dispatch(refreshTokenThunk());

  if (result.meta.requestStatus === "rejected") {
    store.dispatch(logoutAndClearToken());
    return Promise.reject(error);
  }

  originalRequest.headers.Authorization = `Bearer ${result.payload.token}`;
  return api(originalRequest);
}
