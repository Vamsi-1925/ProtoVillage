import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth, canAccess } from "@/context/AuthContext";

// Route → nav key mapping for role-based gating.
const ROUTE_KEY = {
  "/dashboard": "dashboard",
  "/orders": "orders",
  "/warehouse": "warehouse",
  "/dispatch": "dispatch",
  "/production": "production",
  "/procurement": "procurement",
  "/inventory": "inventory",
  "/store": "store",
  "/accounts": "accounts",
  "/reports": "reports",
  "/approvals": "approvals",
  "/discussions": "discussions",
  "/master-data": "masterdata",
  "/admin": "admin",
  "/settings": "settings",
  "/producers": "producers",
};

export default function RequireAuth({ children }) {
  const { user } = useAuth();
  const loc = useLocation();

  if (!user) return <Navigate to="/login" replace state={{ from: loc.pathname }} />;

  // Invoice print is available to any authenticated user.
  if (loc.pathname.startsWith("/invoice/")) return children;

  const key = ROUTE_KEY[loc.pathname];
  if (key && !canAccess(user.role, key)) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}
