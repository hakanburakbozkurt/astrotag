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
      className="dashboard-tab-bar border-b border-zinc-800 bg-zinc-950"
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
              className="group flex min-h-11 min-w-11 flex-col items-center justify-center gap-0.5 rounded-sm px-1 py-1.5 transition active:scale-[0.98]"
              aria-current={isActive ? "page" : undefined}
            >
              <span
                className={
                  isActive
                    ? "flex min-h-8 min-w-8 items-center justify-center rounded-sm border border-zinc-700 bg-zinc-900 text-stone-300"
                    : "flex min-h-8 min-w-8 items-center justify-center rounded-sm text-stone-600 transition group-hover:text-stone-400"
                }
              >
                <TabIcon tab={tab.id} className="h-4 w-4" aria-hidden />
              </span>
              <span
                className={
                  isActive
                    ? "text-[10px] font-medium leading-none tracking-wide text-stone-300"
                    : "text-[10px] leading-none tracking-wide text-stone-600 transition group-hover:text-stone-400"
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
