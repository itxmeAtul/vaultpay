import axios from "axios";
import { store } from "@/redux/store";
import { refreshTokenThunk, forceLogout } from "@/redux/reducers/authSlice";
import { getToken } from "@/utils/cookie";

const api = axios.create({
  baseURL: "/api",
  withCredentials: true,
});

// ---------------------
// REQUEST INTERCEPTOR
// ---------------------
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ---------------------
// RESPONSE INTERCEPTOR
// ---------------------
let refreshing = false;
let queue = [];

const processQueue = (err, newToken = null) => {
  queue.forEach((p) => {
    if (err) p.reject(err);
    else p.resolve(newToken);
  });
  queue = [];
};

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;

    // Access Token Expired
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;

      if (refreshing) {
        return new Promise((resolve, reject) => {
          queue.push({ resolve, reject });
        }).then((newToken) => {
          original.headers.Authorization = `Bearer ${newToken}`;
          return api(original);
        });
      }

      refreshing = true;

      // Call RTK thunk to refresh token
      const result = await store.dispatch(refreshTokenThunk());

      if (refreshTokenThunk.rejected.match(result)) {
        refreshing = false;
        store.dispatch(forceLogout());
        return Promise.reject(error);
      }

      const newToken = result.payload.token;
      processQueue(null, newToken);
      refreshing = false;

      original.headers.Authorization = `Bearer ${newToken}`;
      return api(original);
    }

    return Promise.reject(error);
  }
);

export default api;
export { api };
