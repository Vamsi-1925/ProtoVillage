import React from "react";
import { NavLink } from "react-router-dom";
import Icon from "@/components/graamam/Icon";
import { GRAAMAM_ORDERS } from "@/constants/testIds";

const NAV = [
  { key: "dashboard", label: "Dashboard", icon: "dashboard", to: "/", testId: GRAAMAM_ORDERS.sidebarNavDashboard },
  { key: "inventory", label: "Inventory", icon: "inventory_2", to: "/inventory", testId: GRAAMAM_ORDERS.sidebarNavInventory },
  { key: "orders", label: "Orders", icon: "shopping_cart", to: "/orders", testId: GRAAMAM_ORDERS.sidebarNavOrders, badgeKey: "orders" },
  { key: "production", label: "Production", icon: "precision_manufacturing", to: "/production", testId: GRAAMAM_ORDERS.sidebarNavProduction },
  { key: "procurement", label: "Procurement", icon: "local_mall", to: "/procurement", testId: GRAAMAM_ORDERS.sidebarNavProcurement },
  { key: "warehouse", label: "Warehouse", icon: "warehouse", to: "/warehouse", testId: GRAAMAM_ORDERS.sidebarNavWarehouse },
  { key: "dispatch", label: "Dispatch", icon: "local_shipping", to: "/dispatch", testId: GRAAMAM_ORDERS.sidebarNavDispatch },
  { key: "producers", label: "Producers", icon: "group", to: "/producers", testId: GRAAMAM_ORDERS.sidebarNavProducers },
  { key: "store", label: "Store", icon: "storefront", to: "/store", testId: GRAAMAM_ORDERS.sidebarNavStore },
  { key: "reports", label: "Reports", icon: "bar_chart", to: "/reports", testId: GRAAMAM_ORDERS.sidebarNavReports },
];

const SETTINGS_ITEM = {
  key: "settings", label: "Settings", icon: "settings", to: "/settings",
  testId: GRAAMAM_ORDERS.sidebarNavSettings,
};

export default function Sidebar({ badges = {} }) {
  return (
    <nav
      data-testid={GRAAMAM_ORDERS.sidebar}
      className="fixed left-0 top-0 h-full w-[220px] bg-inverse-surface dark:bg-black shadow-warm z-50 flex flex-col py-6"
    >
      <div
        data-testid={GRAAMAM_ORDERS.sidebarBrand}
        className="px-6 mb-8 flex items-center gap-3"
      >
        <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center shrink-0">
          <Icon name="eco" className="text-on-primary-container text-[22px]" />
        </div>
        <div className="leading-tight">
          <h1 className="font-display font-bold text-lg text-inverse-on-surface tracking-tight leading-none">
            Graamam Connect
          </h1>
          <p className="font-body font-normal text-[11px] text-outline-variant mt-1">
            Producer Operations
          </p>
        </div>
      </div>

      <div className="flex-1 flex flex-col gap-0.5 overflow-y-auto px-2">
        {NAV.map((item) => {
          const badge = item.badgeKey ? badges[item.badgeKey] : undefined;
          return (
            <NavLink
              key={item.key}
              to={item.to}
              end={item.to === "/"}
              data-testid={item.testId}
              className={({ isActive }) => [
                "mx-1 my-0.5 rounded-lg px-4 py-2.5 flex items-center gap-3 transition-all duration-200",
                isActive
                  ? "bg-primary text-on-primary shadow-warm-sm scale-[0.98]"
                  : "text-outline-variant hover:text-inverse-on-surface hover:bg-white/5",
              ].join(" ")}
            >
              <Icon name={item.icon} className="text-[20px]" />
              <span className="font-body text-[13px] font-medium flex-1">{item.label}</span>
              {typeof badge === "number" && badge > 0 ? (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-tertiary-fixed-dim text-on-tertiary-fixed">
                  {badge}
                </span>
              ) : null}
            </NavLink>
          );
        })}
      </div>

      <div className="mt-auto px-2">
        <NavLink
          to={SETTINGS_ITEM.to}
          data-testid={SETTINGS_ITEM.testId}
          className={({ isActive }) => [
            "mx-1 my-0.5 rounded-lg px-4 py-2.5 flex items-center gap-3 transition-all duration-200",
            isActive
              ? "bg-primary text-on-primary shadow-warm-sm"
              : "text-outline-variant hover:text-inverse-on-surface hover:bg-white/5",
          ].join(" ")}
        >
          <Icon name={SETTINGS_ITEM.icon} className="text-[20px]" />
          <span className="font-body text-[13px] font-medium">{SETTINGS_ITEM.label}</span>
        </NavLink>
      </div>
    </nav>
  );
}
