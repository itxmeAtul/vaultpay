import { getFirstAccessibleRoute } from "@/utils/firstRoute";
import { hasPermission } from "@/utils/permission";
import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children, module, action = "read" }) {
  const { isLoggedIn, sessionChecking } = useSelector((s) => s.auth);

  if (sessionChecking) return null;

  // not logged in → go to login page
  if (!isLoggedIn) return <Navigate to="/" replace />;

  // Route doesn't need permissions → allow
  if (!module) return children;

  if (!hasPermission(module, action)) {
    const firstPage = getFirstAccessibleRoute();

    // Prevent infinite redirect loop
    if (location.pathname !== firstPage) {
      return <Navigate to={firstPage} replace />;
    }

    return <Navigate to="/unauthorized" replace />;
  }

  // return isLoggedIn ? children : <Navigate to="/" />;
  return children;
}
