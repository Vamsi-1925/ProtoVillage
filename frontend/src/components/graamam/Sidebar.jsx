import React from "react";
import { NavLink } from "react-router-dom";
import Icon from "@/components/graamam/Icon";
import { GRAAMAM_ORDERS } from "@/constants/testIds";

// Full v2 nav (14 items). Order matches the sidebar screenshot from graamam_v2.html.
const NAV = [
  { key: "dashboard",  label: "Dashboard",   icon: "dashboard",                to: "/",             testId: GRAAMAM_ORDERS.sidebarNavDashboard },
  { key: "orders",     label: "Orders",      icon: "shopping_cart",            to: "/orders",       testId: GRAAMAM_ORDERS.sidebarNavOrders, badgeKey: "orders" },
  { key: "warehouse",  label: "Warehouse",   icon: "warehouse",                to: "/warehouse",    testId: GRAAMAM_ORDERS.sidebarNavWarehouse },
  { key: "dispatch",   label: "Dispatch",    icon: "local_shipping",           to: "/dispatch",     testId: GRAAMAM_ORDERS.sidebarNavDispatch },
  { key: "production", label: "Production",  icon: "precision_manufacturing",  to: "/production",   testId: GRAAMAM_ORDERS.sidebarNavProduction },
  { key: "procurement",label: "Procurement", icon: "local_mall",               to: "/procurement",  testId: GRAAMAM_ORDERS.sidebarNavProcurement },
  { key: "inventory",  label: "Inventory",   icon: "inventory_2",              to: "/inventory",    testId: GRAAMAM_ORDERS.sidebarNavInventory },
  { key: "store",      label: "Store",       icon: "storefront",               to: "/store",        testId: GRAAMAM_ORDERS.sidebarNavStore },
  { key: "accounts",   label: "Accounts",    icon: "account_balance_wallet",   to: "/accounts",     testId: "graamam-sidebar-nav-accounts", tag: "NEW" },
  { key: "reports",    label: "Reports",     icon: "bar_chart",                to: "/reports",      testId: GRAAMAM_ORDERS.sidebarNavReports },
  { key: "approvals",  label: "Approvals",   icon: "verified",                 to: "/approvals",    testId: "graamam-sidebar-nav-approvals", tag: "NEW" },
  { key: "discussions",label: "Discussions", icon: "forum",                    to: "/discussions",  testId: "graamam-sidebar-nav-discussions", tag: "NEW" },
  { key: "masterdata", label: "Master Data", icon: "folder_special",           to: "/master-data",  testId: "graamam-sidebar-nav-masterdata", tag: "NEW" },
  { key: "admin",      label: "Admin Panel", icon: "admin_panel_settings",     to: "/admin",        testId: "graamam-sidebar-nav-admin", tag: "NEW" },
];

export default function Sidebar({ badges = {} }) {
  return (
    <nav
      data-testid={GRAAMAM_ORDERS.sidebar}
      className="fixed left-0 top-0 h-full w-[220px] bg-inverse-surface dark:bg-black shadow-warm z-50 flex flex-col py-6"
    >
      <div className="px-6 mb-6 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center shrink-0">
          <Icon name="eco" className="text-on-primary-container text-[22px]" />
        </div>
        <div className="leading-tight">
          <h1 className="font-display font-bold text-lg text-inverse-on-surface tracking-tight leading-none">Graamam Connect</h1>
          <p className="font-body font-normal text-[11px] text-outline-variant mt-1">by ProtoVillage</p>
        </div>
      </div>

      <div className="flex-1 flex flex-col gap-0.5 overflow-y-auto px-2 pb-4">
        {NAV.map((item) => {
          const badge = item.badgeKey ? badges[item.badgeKey] : undefined;
          return (
            <NavLink
              key={item.key}
              to={item.to}
              end={item.to === "/"}
              data-testid={item.testId}
              className={({ isActive }) => [
                "mx-1 my-0.5 rounded-lg px-3.5 py-2 flex items-center gap-3 transition-all duration-200",
                isActive
                  ? "bg-primary text-on-primary shadow-warm-sm scale-[0.98]"
                  : "text-outline-variant hover:text-inverse-on-surface hover:bg-white/5",
              ].join(" ")}
            >
              <Icon name={item.icon} className="text-[19px]" />
              <span className="font-body text-[13px] font-medium flex-1">{item.label}</span>
              {typeof badge === "number" && badge > 0 ? (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-tertiary-fixed-dim text-on-tertiary-fixed">{badge}</span>
              ) : item.tag ? (
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-tertiary-fixed-dim text-on-tertiary-fixed uppercase tracking-wider">{item.tag}</span>
              ) : null}
            </NavLink>
          );
        })}
      </div>

      <div className="px-4 pt-3 border-t border-white/10">
        <NavLink to="/settings" className={({ isActive }) => [
          "rounded-lg px-3.5 py-2 flex items-center gap-3 transition-all",
          isActive ? "bg-primary text-on-primary" : "text-outline-variant hover:text-inverse-on-surface hover:bg-white/5",
        ].join(" ")}
        data-testid={GRAAMAM_ORDERS.sidebarNavSettings}>
          <Icon name="settings" className="text-[19px]" />
          <span className="font-body text-[13px] font-medium">Settings</span>
        </NavLink>
      </div>
    </nav>
  );
}
