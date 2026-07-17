import React from "react";
import Icon from "@/components/graamam/Icon";
import { useTheme } from "@/context/ThemeContext";
import { GRAAMAM_ORDERS } from "@/constants/testIds";

/**
 * TopBar — sticky top-right controls.
 * Right side: dark-mode toggle + user avatar (per Stitch reference).
 * Optional `title` prop supports the dark-theme header variant ("Orders Management").
 */
export default function TopBar({ title, avatarUrl }) {
  const { theme, toggle } = useTheme();
  const iconName = theme === "dark" ? "light_mode" : "dark_mode";
  const label = theme === "dark" ? "Switch to light mode" : "Switch to dark mode";
  return (
    <header
      data-testid={GRAAMAM_ORDERS.topBar}
      className="sticky top-0 z-40 w-full bg-background dark:bg-black flex justify-between items-center h-16 px-8 border-b border-transparent dark:border-white/5"
    >
      <div className="flex-1">
        {title ? (
          <h2 className="font-headline font-semibold text-xl text-on-surface dark:text-white">
            {title}
          </h2>
        ) : null}
      </div>
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={toggle}
          aria-label={label}
          title={label}
          data-testid={GRAAMAM_ORDERS.themeToggle}
          className="p-2 text-on-surface-variant dark:text-outline-variant hover:text-primary dark:hover:text-white transition-colors rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <Icon name={iconName} className="text-[22px]" />
        </button>
        <div
          data-testid={GRAAMAM_ORDERS.userAvatar}
          className="w-10 h-10 rounded-full bg-surface-container overflow-hidden border border-outline-variant cursor-pointer"
        >
          <img
            alt="User avatar"
            className="w-full h-full object-cover"
            src={
              avatarUrl ||
              "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=200&h=200&fit=crop&crop=faces"
            }
          />
        </div>
      </div>
    </header>
  );
}
