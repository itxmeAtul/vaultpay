import { hasPermission } from "./permission";
import { protectedRoutes } from "@/App";

export const getFirstAccessibleRoute = () => {
  for (const route of protectedRoutes) {
    if (!route.module) return route.path; // route without permission
    if (hasPermission(route.module, route.action)) {
      return route.path;
    }
  }
  return "/unauthorized"; // fallback
};
