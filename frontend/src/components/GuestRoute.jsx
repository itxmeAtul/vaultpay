import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";

export default function GuestRoute({ children }) {
  const { isLoggedIn, sessionChecking } = useSelector((s) => s.auth);

  if (sessionChecking) return null;

  return isLoggedIn ? <Navigate to="/dashboard" /> : children;
}
