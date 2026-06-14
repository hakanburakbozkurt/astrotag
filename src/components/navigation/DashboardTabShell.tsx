"use client";

import type { ReactNode } from "react";
import Starfield from "@/components/Starfield";
import BottomTabBar from "./BottomTabBar";
import TabKeepAliveOutlet from "./TabKeepAliveOutlet";

interface DashboardTabShellProps {
  children: ReactNode;
}

export default function DashboardTabShell({ children }: DashboardTabShellProps) {
  return (
    <div className="relative flex min-h-dvh flex-col bg-[#070b14]">
      <Starfield />

      <div
        className="relative flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain"
        style={{
          paddingBottom: "calc(4.75rem + env(safe-area-inset-bottom, 0px))",
        }}
      >
        <TabKeepAliveOutlet>{children}</TabKeepAliveOutlet>
      </div>

      <BottomTabBar />
    </div>
  );
}
