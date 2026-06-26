"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { DASHBOARD_TABS, resolveDashboardTab } from "./dashboard-tabs";
import { TabIcon } from "./TabIcons";

export default function BottomTabBar() {
  const pathname = usePathname();
  const activeTab = resolveDashboardTab(pathname);

  return (
    <nav
      aria-label="Ana navigasyon"
      className="dashboard-tab-bar border-b border-white/10 bg-[#070b14]/88 backdrop-blur-xl backdrop-saturate-150"
      style={{
        paddingTop: "env(safe-area-inset-top, 0px)",
      }}
    >
      <div className="mx-auto grid max-w-lg grid-cols-5 gap-0.5 px-1 py-1">
        {DASHBOARD_TABS.map((tab) => {
          const isActive = activeTab === tab.id;

          return (
            <Link
              key={tab.id}
              href={tab.href}
              prefetch
              className="group flex min-h-9 flex-col items-center justify-center gap-0.5 rounded-lg px-0.5 py-1 transition"
              aria-current={isActive ? "page" : undefined}
            >
              <span
                className={
                  isActive
                    ? "rounded-md bg-amber-400/10 p-1 text-amber-300 shadow-[0_0_12px_rgba(251,191,36,0.28)]"
                    : "rounded-md p-1 text-white/38 transition group-hover:text-white/60"
                }
              >
                <TabIcon tab={tab.id} className="h-4 w-4" />
              </span>
              <span
                className={
                  isActive
                    ? "text-[9px] font-medium tracking-wide text-amber-200/90"
                    : "text-[9px] tracking-wide text-white/32 transition group-hover:text-white/50"
                }
              >
                {tab.shortLabel}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
