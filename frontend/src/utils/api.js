// import axios from "axios";

// export const api = axios.create({
//   baseURL: "/api",
//   headers: {
//     "Content-Type": "application/json",
//   },
// });

// // Attach token automatically on every request
// api.interceptors.request.use((config) => {
//   const token = localStorage.getItem("token");
//   if (token) {
//     config.headers.Authorization = `Bearer ${token}`;
//   }
//   return config;
// });

import axios from "axios";
import { refreshAccessToken } from "./refreshToken";
import toast from "react-hot-toast";

export const api = axios.create({
  baseURL: "/api",
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

// ---------------------------
// REQUEST INTERCEPTOR
// ---------------------------
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// --------------------------------
// RESPONSE INTERCEPTOR (AUTO REFRESH)
// --------------------------------
let refreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((p) => {
    if (token) p.resolve(token);
    else p.reject(error);
  });

  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    // If unauthorized (token expired)
    if (error.response?.status === 401 && !original._retry) {
      if (refreshing) {
        return new Promise(function (resolve, reject) {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            original.headers.Authorization = "Bearer " + token;
            return api(original);
          })
          .catch((err) => Promise.reject(err));
      }

      original._retry = true;
      refreshing = true;

      const newToken = await refreshAccessToken();

      if (!newToken && window.location.pathname !== "/") {
        refreshing = false;
        localStorage.clear();
        window.location.href = "/";
        return Promise.reject(error);
      }

      processQueue(null, newToken);
      refreshing = false;

      original.headers.Authorization = `Bearer ${newToken}`;
      return api(original);
    }

    // Optional global error toast
    if (window.location.pathname !== "/")
      toast.error(error.response?.data?.message || "Something went wrong");

    return Promise.reject(error);
  }
);
