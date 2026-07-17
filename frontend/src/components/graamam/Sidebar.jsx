import React from "react";
import Icon from "@/components/graamam/Icon";
import { GRAAMAM_ORDERS } from "@/constants/testIds";

const NAV_ITEMS = [
  { key: "dashboard", label: "Dashboard", icon: "dashboard", testId: GRAAMAM_ORDERS.sidebarNavDashboard },
  { key: "inventory", label: "Inventory", icon: "inventory_2", testId: GRAAMAM_ORDERS.sidebarNavInventory },
  { key: "orders", label: "Orders", icon: "shopping_cart", testId: GRAAMAM_ORDERS.sidebarNavOrders, badge: 12 },
  { key: "producers", label: "Producers", icon: "group", testId: GRAAMAM_ORDERS.sidebarNavProducers },
];

const SETTINGS_ITEM = {
  key: "settings",
  label: "Settings",
  icon: "settings",
  testId: GRAAMAM_ORDERS.sidebarNavSettings,
};

/**
 * Sidebar — fixed 220px navigation.
 * Matches Stitch reference: dark inverse-surface bg (light theme), OLED black (dark),
 * brand lockup, nav items with active teal state + tertiary count badge.
 */
export default function Sidebar({ activeKey = "orders", ordersBadgeCount }) {
  return (
    <nav
      data-testid={GRAAMAM_ORDERS.sidebar}
      className="fixed left-0 top-0 h-full w-[220px] bg-inverse-surface dark:bg-black shadow-warm z-50 flex flex-col py-6"
    >
      {/* Brand lockup */}
      <div
        data-testid={GRAAMAM_ORDERS.sidebarBrand}
        className="px-6 mb-10 flex items-center gap-3"
      >
        <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center shrink-0">
          <Icon name="eco" className="text-on-primary-container text-[22px]" />
        </div>
        <div className="leading-tight">
          <h1 className="font-display font-bold text-xl text-inverse-on-surface tracking-tight leading-none">
            Graamam Connect
          </h1>
          <p className="font-body font-normal text-label-sm text-outline-variant mt-1">
            Producer Operations
          </p>
        </div>
      </div>

      {/* Nav items */}
      <div className="flex-1 flex flex-col gap-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const isActive = item.key === activeKey;
          const badge = item.key === "orders" && typeof ordersBadgeCount === "number" ? ordersBadgeCount : item.badge;
          return (
            <a
              key={item.key}
              href="#"
              data-testid={item.testId}
              aria-current={isActive ? "page" : undefined}
              onClick={(e) => e.preventDefault()}
              className={[
                "mx-2 my-1 rounded-lg px-4 py-3 flex items-center gap-3 transition-all duration-200",
                isActive
                  ? "bg-primary text-on-primary shadow-warm-sm scale-[0.98]"
                  : "text-outline-variant hover:text-inverse-on-surface hover:bg-white/5",
              ].join(" ")}
            >
              <Icon name={item.icon} className="text-[22px]" />
              <span className="font-body text-label-md flex-1">{item.label}</span>
              {typeof badge === "number" && badge > 0 ? (
                <span
                  className={[
                    "text-[10px] font-bold px-2 py-0.5 rounded-full",
                    isActive
                      ? "bg-tertiary-fixed-dim text-on-tertiary-fixed"
                      : "bg-tertiary-fixed-dim text-on-tertiary-fixed",
                  ].join(" ")}
                >
                  {badge}
                </span>
              ) : null}
            </a>
          );
        })}
      </div>

      {/* Settings pinned bottom */}
      <div className="mt-auto">
        <a
          href="#"
          data-testid={SETTINGS_ITEM.testId}
          onClick={(e) => e.preventDefault()}
          className="mx-2 my-1 rounded-lg px-4 py-3 flex items-center gap-3 text-outline-variant hover:text-inverse-on-surface hover:bg-white/5 transition-all duration-200"
        >
          <Icon name={SETTINGS_ITEM.icon} className="text-[22px]" />
          <span className="font-body text-label-md">{SETTINGS_ITEM.label}</span>
        </a>
      </div>
    </nav>
  );
}
