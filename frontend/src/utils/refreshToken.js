import { api } from "./api";

export const refreshAccessToken = async () => {
  const refreshToken = localStorage.getItem("refresh_token");

  if (!refreshToken) return null;

  try {
    const res = await api.post("auth/refresh", {
      refresh_token: refreshToken,
    });

    const newAccess = res.data.access_token;
    const newRefresh = res.data.refresh_token;

    localStorage.setItem("token", newAccess);
    localStorage.setItem("refresh_token", newRefresh);

    return newAccess;
  } catch (err) {
    return null;
  }
};
