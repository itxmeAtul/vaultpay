import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "./pages/Login.jsx";
import Dashboard from "./pages/Dashboard.jsx";

import ProtectedRoute from "./components/ProtectedRoute.jsx";
import Sidebar from "./components/Sidebar.jsx";
import Transactions from "./pages/Transactions.jsx";
import Profile from "./pages/Profile.jsx";
import Navbar from "./components/Navbar.jsx";

export default function App() {
  // Define all protected routes here
  const protectedRoutes = [
    { path: "/dashboard", element: <Dashboard /> },
    { path: "/transactions", element: <Transactions /> },
    { path: "/profile", element: <Profile /> },
    // { path: "/settings", element: <Setting /> },
  ];

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Route */}
        <Route path="/" element={<Login />} />

        {/* Protected Routes Loop */}
        {protectedRoutes.map(({ path, element }) => (
          <Route
            key={path}
            path={path}
            element={
              <ProtectedRoute>
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
