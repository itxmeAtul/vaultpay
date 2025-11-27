import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "./pages/Login.jsx";
import Dashboard from "./pages/Dashboard.jsx";

import ProtectedRoute from "./components/ProtectedRoute.jsx";

export default function App() {
  // Define all protected routes here
  const protectedRoutes = [{ path: "/dashboard", element: <Dashboard /> }];

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
            element={<ProtectedRoute>{element}</ProtectedRoute>}
          />
        ))}
      </Routes>
    </BrowserRouter>
  );
}
