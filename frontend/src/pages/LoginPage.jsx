import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import Icon from "@/components/graamam/Icon";
import { useTheme } from "@/context/ThemeContext";

const API = ((typeof process !== "undefined" && process.env && process.env.REACT_APP_BACKEND_URL) || "") + "/api";

const DEMO_PWD = {
  admin: "admin123", lead: "lead123", suresh: "stock123", divya: "acc123",
  krishna: "proc123", warehouse: "wh123", production: "prod123",
};

export default function LoginPage() {
  const [users, setUsers] = useState([]);
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("admin123");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const { login, user } = useAuth();
  const { theme, toggle } = useTheme();
  const nav = useNavigate();

  useEffect(() => { if (user) nav("/dashboard", { replace: true }); }, [user, nav]);
  useEffect(() => { fetch(`${API}/graamam/auth/users`).then(r => r.json()).then(setUsers).catch(() => {}); }, []);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setErr(null);
    try {
      await login(username.trim(), password);
      nav("/dashboard", { replace: true });
    } catch (e2) {
      setErr(e2.message || "Login failed");
    } finally { setBusy(false); }
  };

  const pick = (u) => {
    setUsername(u.username);
    setPassword(DEMO_PWD[u.username] || "");
  };

  return (
    <div className="min-h-screen flex bg-background dark:bg-black text-on-surface dark:text-white">
      <div className="flex-1 hidden md:flex flex-col justify-between p-12 bg-inverse-surface dark:bg-[#0a0a0a] text-inverse-on-surface relative overflow-hidden">
        <div className="absolute -top-16 -right-16 w-72 h-72 rounded-full bg-primary-container/40 blur-3xl" />
        <div className="absolute -bottom-20 -left-16 w-80 h-80 rounded-full bg-tertiary-fixed-dim/20 blur-3xl" />
        <div className="relative flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-primary-container flex items-center justify-center"><Icon name="eco" className="text-on-primary-container text-[26px]" /></div>
          <div>
            <div className="font-display font-bold text-2xl leading-none">Graamam Connect</div>
            <div className="text-outline-variant text-body-sm mt-1">by PROTOVILLAGE Livelihood Systems</div>
          </div>
        </div>
        <div className="relative">
          <h2 className="font-headline font-bold text-3xl leading-tight">Producer operations for<br/>India’s village artisans.</h2>
          <p className="text-outline-variant text-body-md mt-4 max-w-md">Orders, warehouse, production, procurement, dispatch, store, invoicing and reports — one warm, calm cockpit for the Graamam team.</p>
          <div className="mt-8 grid grid-cols-2 gap-3 max-w-md">
            {["Modern Humanist palette", "INR + IST throughout", "Real Graamam SKUs", "Role-aware navigation"].map((f) => (
              <div key={f} className="inline-flex items-center gap-2 text-body-sm"><Icon name="check_circle" className="text-primary-fixed-dim text-[18px]" /> {f}</div>
            ))}
          </div>
        </div>
        <div className="relative text-body-sm text-outline-variant">GSTIN 37AAAAA0000A1Z5 · Sample Town, Andhra Pradesh</div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="flex items-center justify-between mb-6">
            <div className="md:hidden flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center"><Icon name="eco" className="text-on-primary-container text-[22px]" /></div>
              <span className="font-display font-bold text-lg">Graamam Connect</span>
            </div>
            <button onClick={toggle} aria-label="Toggle theme" className="ml-auto p-2 text-outline hover:text-primary-container dark:hover:text-white rounded-full"><Icon name={theme === "dark" ? "light_mode" : "dark_mode"} className="text-[22px]" /></button>
          </div>
          <h1 className="font-headline font-bold text-headline-lg text-on-surface dark:text-white">Welcome back</h1>
          <p className="text-body-md text-on-surface-variant dark:text-outline-variant mt-1 mb-6">Sign in to your Graamam workspace.</p>

          <form onSubmit={submit} className="flex flex-col gap-4">
            <label className="flex flex-col gap-1">
              <span className="font-label text-label-sm text-on-surface dark:text-outline-variant uppercase tracking-wider">Username</span>
              <input value={username} onChange={(e) => setUsername(e.target.value)} data-testid="login-username" autoFocus className="font-body text-body-md rounded-lg border border-outline-variant/70 dark:border-white/10 bg-white dark:bg-black text-on-surface dark:text-white px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary" />
            </label>
            <label className="flex flex-col gap-1">
              <span className="font-label text-label-sm text-on-surface dark:text-outline-variant uppercase tracking-wider">Password</span>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} data-testid="login-password" className="font-body text-body-md rounded-lg border border-outline-variant/70 dark:border-white/10 bg-white dark:bg-black text-on-surface dark:text-white px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary" />
            </label>
            {err ? <div className="text-body-sm text-error">{err}</div> : null}
            <button type="submit" data-testid="login-submit" disabled={busy} className="font-label font-bold text-body-md px-6 py-3 rounded-lg bg-primary-container text-on-primary shadow-warm-sm hover:shadow-warm inline-flex items-center justify-center gap-2">
              <Icon name={busy ? "progress_activity" : "login"} className={"text-[18px] " + (busy ? "animate-spin" : "")} />
              {busy ? "Signing in…" : "Sign In"}
            </button>
          </form>

          <div className="mt-8">
            <div className="text-label-sm text-outline uppercase tracking-wider mb-2">Demo users — click to fill</div>
            <div className="grid grid-cols-2 gap-2">
              {users.map((u) => (
                <button key={u.username} type="button" onClick={() => pick(u)} className="text-left rounded-lg bg-surface-container-lowest dark:bg-white/5 border border-outline-variant/60 dark:border-white/10 px-3 py-2 hover:border-primary-container transition-colors">
                  <div className="font-label font-bold text-body-sm text-on-surface dark:text-white">{u.name}</div>
                  <div className="text-body-sm text-outline">{u.username} · <span className="uppercase text-[10px] tracking-wider">{u.role}</span></div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
