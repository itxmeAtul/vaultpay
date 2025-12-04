import React, { useState, useEffect, use } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  Menu,
  X,
  LogOut,
  LayoutDashboard,
  FolderOpen,
  CreditCard,
  User,
  Settings,
  User2,
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { hasPermission } from "@/utils/permission";
import { logoutAndClearToken } from "@/redux/reducers/authSlice";

export default function Sidebar({ children }) {
  const [open, setOpen] = useState(false);
  const dispatch = useDispatch();
  const location = useLocation();

  const user = useSelector((s) => s.auth.authData.user) || {};
  const tenantName = user?.tenant;
  const initials = user?.name
    ? user.name
        .split(" ")
        .map((w) => w[0])
        .join("")
        .toUpperCase()
    : "U";

  const menu = [
    {
      label: "Dashboard",
      path: "/dashboard",
      icon: <LayoutDashboard size={18} />,
      permission: { module: "dashboard", action: "read" }, // optional
    },
    {
      label: "Users",
      path: "/users",
      icon: <User2 size={18} />,
      permission: { module: "users", action: "read" },
    },
    {
      label: "Kitchen",
      path: "/kitchen",
      icon: <FolderOpen size={18} />,
      permission: { module: "kitchen", action: "read" },
    },
    {
      label: "Orders",
      path: "/orders",
      icon: <CreditCard size={18} />,
      permission: { module: "orders", action: "read" },
    },
  ];

  useEffect(() => setOpen(false), [location.pathname]);

  const logout = () => {
    dispatch(logoutAndClearToken());
  };

  return (
    <div className="flex min-h-screen">
      {/* MOBILE TOP NAV */}
      <div className="lg:hidden fixed top-0 left-0 w-full bg-white shadow p-4 flex justify-between items-center z-40">
        <h1 className="text-2xl font-bold text-orange-600">{tenantName}</h1>
        <button
          onClick={() => setOpen(true)}
          className="text-gray-700 transform active:scale-90 transition"
        >
          <Menu size={28} />
        </button>
      </div>

      {/* DESKTOP SIDEBAR */}
      <aside className="hidden lg:flex flex-col w-64 p-4 border-r bg-white shadow fixed top-0 left-0 h-full">
        <h1 className="text-2xl font-bold text-orange-600 mb-6">
          {tenantName}
        </h1>

        {/* PROFILE */}
        <div className="flex items-center gap-3 mb-6 bg-gray-100 p-3 rounded-lg">
          <div className="bg-orange-600 text-white w-12 h-12 rounded-full flex items-center justify-center text-xl font-semibold">
            {initials}
          </div>
          <div>
            <p className="font-semibold">{user.name || "User"}</p>
            <p className="text-xs text-gray-600">{user.email}</p>
          </div>
        </div>

        {/* MENU */}
        <div className="flex-1">
          {menu
            .filter(
              (m) =>
                !m.permission ||
                hasPermission(m.permission.module, m.permission.action)
            )
            .map((m) => (
              <NavLink
                key={m.path}
                to={m.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 p-2 mb-1 rounded transition ${
                    isActive
                      ? "bg-orange-600 text-white font-semibold"
                      : "text-gray-700 hover:bg-orange-100 hover:text-orange-700"
                  }`
                }
              >
                {m.icon}
                {m.label}
              </NavLink>
            ))}
        </div>

        {/* LOGOUT */}
        <button
          onClick={logout}
          className="mt-4 flex items-center gap-2 bg-red-500 text-white p-2 rounded hover:bg-red-600 transition"
        >
          <LogOut size={18} /> Logout
        </button>
      </aside>

      {/* MOBILE SIDEBAR (ANIMATED SLIDE-IN) */}
      <div
        className={`lg:hidden fixed top-0 left-0 h-full w-64 bg-white shadow p-4 z-50 
        transform transition-all duration-300 ease-in-out
        ${open ? "translate-x-0 opacity-100" : "-translate-x-full opacity-0"}`}
      >
        {/* HEADER */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-orange-600">Menu</h1>
          <button
            onClick={() => setOpen(false)}
            className="text-gray-700 transform active:scale-90 transition"
          >
            <X size={28} />
          </button>
        </div>

        {/* PROFILE */}
        <div className="flex items-center gap-3 mb-6 bg-gray-100 p-3 rounded-lg">
          <div className="bg-orange-600 text-white w-12 h-12 rounded-full flex items-center justify-center text-xl font-semibold">
            {initials}
          </div>
          <div>
            <p className="font-semibold">{user.name || "User"}</p>
            <p className="text-xs text-gray-600">{user.email}</p>
          </div>
        </div>

        {/* MENU */}
        {menu
          .filter(
            (m) =>
              !m.permission ||
              hasPermission(m.permission.module, m.permission.action)
          )
          .map((m) => (
            <NavLink
              key={m.path}
              to={m.path}
              className={({ isActive }) =>
                `flex items-center gap-3 p-2 mb-1 rounded transition ${
                  isActive
                    ? "bg-orange-600 text-white font-semibold"
                    : "text-gray-700 hover:bg-orange-100 hover:text-orange-700"
                }`
              }
            >
              {m.icon}
              {m.label}
            </NavLink>
          ))}

        {/* LOGOUT */}
        <button
          onClick={logout}
          className="mt-6 flex items-center gap-2 bg-red-500 text-white p-2 rounded hover:bg-red-600 transition"
        >
          <LogOut size={18} /> Logout
        </button>
      </div>

      {/* BLUR BACKDROP WITH FADE ANIMATION */}
      {open && (
        <div
          className="fixed inset-0 backdrop-blur-md bg-white/20 lg:hidden z-40 
          animate-fadeIn"
          onClick={() => setOpen(false)}
        ></div>
      )}

      {/* MAIN CONTENT */}
      <main className="flex-1 p-6 lg:ml-64 mt-16 lg:mt-0 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
