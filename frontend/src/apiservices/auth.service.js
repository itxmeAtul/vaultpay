import { api } from "../utils/api";

export const login = async (username, password) => {
  try {
    const res = await api.post("/auth/login", { username, password });

    const { access_token, refresh_token, user } = res.data;

    localStorage.setItem("token", access_token);
    localStorage.setItem("refresh_token", refresh_token);
    localStorage.setItem("user", JSON.stringify(user));

    return user;
  } catch (error) {
    console.error("Login failed:", error);
    throw error;
  }
};

export const logoutSession = () => {
  localStorage.clear();
  window.location.href = "/";
};
