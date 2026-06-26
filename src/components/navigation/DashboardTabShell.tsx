"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import Starfield from "@/components/Starfield";
import BottomTabBar from "./BottomTabBar";
import ActiveTabOutlet from "./ActiveTabOutlet";

interface DashboardTabShellProps {
  children: ReactNode;
}

export default function DashboardTabShell({ children }: DashboardTabShellProps) {
  const mainRef = useRef<HTMLElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    const main = mainRef.current;
    if (!main) {
      return;
    }

    main.scrollTop = 0;
  }, [pathname]);

  return (
    <div className="dashboard-container relative flex flex-col bg-[#070b14]">
      <Starfield />
      <BottomTabBar />

      <main ref={mainRef} className="dashboard-main relative flex flex-col">
        <ActiveTabOutlet>{children}</ActiveTabOutlet>
      </main>
    </div>
  );
}
