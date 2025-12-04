import { getPermissionData } from "./cookie";

export const getPermissions = () => {
  return getPermissionData() || {};
};

export const hasPermission = (module, action) => {
  const perms = getPermissions();
  return perms?.[module]?.[action] === true;
};
