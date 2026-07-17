import React from "react";
import Sidebar from "@/components/graamam/Sidebar";
import TopBar from "@/components/graamam/TopBar";

/**
 * AppShell — the standard sidebar + top-bar chrome shared by every screen.
 * Children render inside a max-width, padded main region.
 */
export default function AppShell({ children, badges, topBarTitle }) {
  return (
    <div className="min-h-screen flex bg-background dark:bg-black text-on-surface dark:text-white">
      <Sidebar badges={badges} />
      <div className="flex-1 ml-[220px] flex flex-col min-h-screen w-[calc(100%-220px)]">
        <TopBar title={topBarTitle} />
        <main className="flex-1 p-8 max-w-[1360px] w-full mx-auto">{children}</main>
      </div>
    </div>
  );
}
