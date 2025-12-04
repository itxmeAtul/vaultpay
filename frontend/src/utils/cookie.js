const tokenKey = "x-auth-token";
const permissionKey = "x-permissions";
import Cookies from "js-cookie";

export const setToken = (token) => {
  const expirationTime = new Date();
  expirationTime.setTime(expirationTime.getTime() + 60 * 60 * 1000);
  try {
    if (!token || typeof token !== "string") {
      throw new Error("Invalid token format");
    }
    Cookies.set(tokenKey, token, {
      secure: process.env.NODE_ENV === "production",
      expires: expirationTime,
      //   httpOnly: true,
    });
  } catch (error) {
    throw Error(`Failed to set token: ${error}`);
  }
};

export const getToken = () => {
  try {
    const token = Cookies.get(tokenKey);
    return token ? token : null;
  } catch (error) {
    throw Error(`Failed to get token: ${error}`);
  }
};

export const clearToken = () => {
  try {
    Cookies.remove(tokenKey);
  } catch (error) {
    throw Error(`Failed clear the token: ${error}`);
  }
};

export const setAuthData = (authData) => {
  try {
    if (sessionStorage) {
      sessionStorage.setItem(tokenKey, JSON.stringify(authData));
    }
  } catch (error) {
    throw Error(`Failed to set authdata: ${error}`);
  }
};
export const getAuthData = () => {
  try {
    if (sessionStorage[tokenKey]) {
      return JSON.parse(sessionStorage.getItem(tokenKey));
    }
  } catch (error) {
    throw Error(`Failed to get authdata: ${error}`);
  }
};
export const clearAuthData = () => {
  try {
    if (sessionStorage[tokenKey]) {
      return sessionStorage.removeItem(tokenKey);
    }
  } catch (error) {
    throw Error(`Failed to remove authdata: ${error}`);
  }
};

export const setPermissionData = (PermissionData) => {
  try {
    if (sessionStorage) {
      sessionStorage.setItem(permissionKey, JSON.stringify(PermissionData));
    }
  } catch (error) {
    throw Error(`Failed to set Permissiondata: ${error}`);
  }
};
export const getPermissionData = () => {
  try {
    if (sessionStorage[permissionKey]) {
      return JSON.parse(sessionStorage.getItem(permissionKey));
    }
  } catch (error) {
    throw Error(`Failed to get Permissiondata: ${error}`);
  }
};
export const clearPermissionData = () => {
  try {
    if (sessionStorage[permissionKey]) {
      return sessionStorage.removeItem(permissionKey);
    }
  } catch (error) {
    throw Error(`Failed to remove Permissiondata: ${error}`);
  }
};
