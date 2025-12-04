import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import Sidebar from "./components/Sidebar.jsx";
import Login from "./pages/Auth/Login.jsx";
import Dashboard from "./pages/dashboard/Dashboard.jsx";
import Profile from "./pages/profile/Profile.jsx";
import UsersListing from "./pages/users/UsersListing.jsx";
import GuestRoute from "./components/GuestRoute.jsx";
import OrdersListing from "./pages/orders/orders.jsx";
import { getFirstAccessibleRoute } from "./utils/firstRoute.js";
import KitchenDashboard from "./pages/dashboard/KitchenDashboard.jsx";
import { useDispatch } from "react-redux";
import { logoutAndClearToken } from "./redux/reducers/authSlice.js";
import { validateSession } from "./redux/actions/authActions.js";
import { Toaster } from "react-hot-toast";

export const protectedRoutes = [
  {
    path: "/dashboard",
    element: <Dashboard />,
    module: "dashboard",
    action: "read",
  },
  {
    path: "/users",
    element: <UsersListing />,
    module: "users",
    action: "read",
  },
  {
    path: "/profile",
    element: <Profile />,
    module: "profile",
    action: "read",
  },
  {
    path: "/orders",
    element: <OrdersListing />,
    module: "orders",
    action: "read",
  },
  {
    path: "/kitchen",
    element: <KitchenDashboard />,
    module: "kitchen",
    action: "read",
  },
];

export default function App() {
  // Define all protected routes here

  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(validateSession());
  }, []);

  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <Routes>
        {/* Public Route */}

        <Route
          path="/"
          element={
            <GuestRoute>
              <Login />
            </GuestRoute>
          }
        />
        <Route path="/unauthorized" element={<Unauthorized />} />
        {/* Protected Routes Loop */}
        {protectedRoutes.map(({ path, element, module, action }) => (
          <Route
            key={path}
            path={path}
            element={
              <ProtectedRoute module={module} action={action}>
                {/* <Navbar /> */}
                <Sidebar>{element}</Sidebar>
              </ProtectedRoute>
            }
          />
        ))}
      </Routes>
    </BrowserRouter>
  );
}

export function Unauthorized() {
  const firstPage = getFirstAccessibleRoute();
  const dipatch = useDispatch();
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100 text-center px-4">
      <h1 className="text-6xl font-bold text-red-600">403</h1>
      <h2 className="text-2xl font-semibold mt-4">Access Denied</h2>
      <p className="text-gray-600 mt-2 max-w-md">
        You do not have permission to access this page or perform this action.
      </p>

      <a
        href={firstPage}
        className="mt-6 px-6 py-2 bg-orange-600 text-white rounded-full hover:bg-orange-700 transition"
      >
        Land On Safe Page
      </a>

      <a
        href={"/"}
        onClick={() => dipatch(logoutAndClearToken())}
        className="mt-6 px-6 py-2 bg-orange-600 text-white rounded-full hover:bg-orange-700 transition"
      >
        Logout
      </a>
    </div>
  );
}
