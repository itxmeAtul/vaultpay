import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";

export default function GuestRoute({ children }) {
  const { isLoggedIn } = useSelector((s) => s.auth);

  if (isLoggedIn) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
