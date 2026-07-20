import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

const KEY = "protovillage.auth";
const API = ((typeof process !== "undefined" && process.env && process.env.REACT_APP_BACKEND_URL) || "") + "/api";
const AuthContext = createContext({ user: null, login: async () => {}, logout: () => {} });

function readSaved() {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readSaved);

  useEffect(() => {
    try {
      if (user) window.localStorage.setItem(KEY, JSON.stringify(user));
      else window.localStorage.removeItem(KEY);
    } catch { /* ignore */ }
  }, [user]);

  const login = useCallback(async (username, password) => {
    const res = await fetch(`${API}/graamam/auth/login`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    if (!res.ok) {
      const t = await res.text();
      let msg = "Login failed";
      try { msg = JSON.parse(t).detail || msg; } catch { /* keep default */ }
      throw new Error(msg);
    }
    const data = await res.json();
    setUser(data);
    return data;
  }, []);

  const logout = useCallback(() => { setUser(null); }, []);

  // Guest/demo entry point for the landing page's "Try the app now" — no
  // credentials, full Admin-level access, lands on populated example data
  // (the backend already seeds orders/inventory/production idempotently
  // on every startup, so there's nothing extra to seed here).
  const guestLogin = useCallback(() => {
    const demoUser = { username: "guest", name: "Guest", role: "admin", guest: true };
    setUser(demoUser);
    return demoUser;
  }, []);

  const value = useMemo(() => ({ user, login, logout, guestLogin }), [user, login, logout, guestLogin]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}

export const ROLE_NAV = {
  admin:       ["dashboard", "orders", "warehouse", "dispatch", "production", "procurement", "inventory", "store", "accounts", "reports", "approvals", "discussions", "masterdata", "admin", "settings"],
  lead:        ["dashboard", "approvals", "discussions", "settings"],
  warehouse:   ["dashboard", "orders", "warehouse", "dispatch", "store", "discussions", "settings"],
  production:  ["dashboard", "production", "discussions", "settings"],
  stock:       ["dashboard", "inventory", "store", "discussions", "settings"],
  accounts:    ["dashboard", "accounts", "reports", "discussions", "settings"],
  procurement: ["dashboard", "procurement", "inventory", "discussions", "settings"],
};

export function canAccess(role, key) {
  const allowed = ROLE_NAV[role] || ROLE_NAV.admin;
  return allowed.includes(key);
}
