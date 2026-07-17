import React from "react";
import Icon from "@/components/graamam/Icon";
import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { GRAAMAM_ORDERS } from "@/constants/testIds";

export default function TopBar({ title }) {
  const { theme, toggle } = useTheme();
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const iconName = theme === "dark" ? "light_mode" : "dark_mode";
  const label = theme === "dark" ? "Switch to light mode" : "Switch to dark mode";
  const initials = (user?.name || "?").split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase();

  return (
    <header
      data-testid={GRAAMAM_ORDERS.topBar}
      className="sticky top-0 z-40 w-full bg-background dark:bg-black flex justify-between items-center h-16 px-8 border-b border-transparent dark:border-white/5"
    >
      <div className="flex-1">
        {title ? <h2 className="font-headline font-semibold text-xl text-on-surface dark:text-white">{title}</h2> : null}
      </div>
      <div className="flex items-center gap-3">
        <button type="button" onClick={toggle} aria-label={label} title={label} data-testid={GRAAMAM_ORDERS.themeToggle}
          className="p-2 text-on-surface-variant dark:text-outline-variant hover:text-primary dark:hover:text-white transition-colors rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-primary">
          <Icon name={iconName} className="text-[22px]" />
        </button>

        {user ? (
          <div className="flex items-center gap-2 rounded-full bg-surface-container-lowest dark:bg-white/5 border border-outline-variant/70 dark:border-white/10 pl-1 pr-3 py-1">
            <div className="w-8 h-8 rounded-full bg-primary-container text-on-primary flex items-center justify-center text-body-sm font-bold">{initials}</div>
            <div className="hidden sm:block leading-tight">
              <div className="font-label font-bold text-body-sm text-on-surface dark:text-white">{user.name}</div>
              <div className="text-[10px] uppercase tracking-wider text-outline">{user.role}</div>
            </div>
            <button onClick={() => { logout(); nav("/login", { replace: true }); }} title="Sign out" data-testid="topbar-logout"
              className="ml-1 text-outline hover:text-terracotta-error p-1.5 rounded-full"><Icon name="logout" className="text-[18px]" /></button>
          </div>
        ) : (
          <a href="/login" className="font-label text-body-sm text-primary-container underline">Sign in</a>
        )}
      </div>
    </header>
  );
}
