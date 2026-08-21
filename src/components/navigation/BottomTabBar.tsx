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
      <div className="mx-auto grid max-w-lg grid-cols-6 gap-1 px-1 py-1.5">
        {DASHBOARD_TABS.map((tab) => {
          const isActive = activeTab === tab.id;

          return (
            <Link
              key={tab.id}
              href={tab.href}
              prefetch
              className="group flex min-h-11 min-w-11 flex-col items-center justify-center gap-0.5 rounded-lg px-1 py-1.5 transition active:scale-[0.98]"
              aria-current={isActive ? "page" : undefined}
            >
              <span
                className={
                  isActive
                    ? "flex min-h-8 min-w-8 items-center justify-center rounded-md bg-amber-400/10 text-amber-300 shadow-[0_0_12px_rgba(251,191,36,0.28)]"
                    : "flex min-h-8 min-w-8 items-center justify-center rounded-md text-white/38 transition group-hover:text-white/60"
                }
              >
                <TabIcon tab={tab.id} className="h-4 w-4" aria-hidden />
              </span>
              <span
                className={
                  isActive
                    ? "text-[10px] font-medium leading-none tracking-wide text-amber-200/90"
                    : "text-[10px] leading-none tracking-wide text-white/32 transition group-hover:text-white/50"
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
