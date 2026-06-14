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
      className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-[#070b14]/72 backdrop-blur-xl backdrop-saturate-150"
      style={{
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}
    >
      <div className="mx-auto grid max-w-lg grid-cols-4 px-2 pt-2 pb-2">
        {DASHBOARD_TABS.map((tab) => {
          const isActive = activeTab === tab.id;

          return (
            <Link
              key={tab.id}
              href={tab.href}
              prefetch
              className="group flex min-h-11 flex-col items-center justify-center gap-1 rounded-2xl px-1 py-1.5 transition"
              aria-current={isActive ? "page" : undefined}
            >
              <span
                className={
                  isActive
                    ? "rounded-xl bg-amber-400/10 p-1.5 text-amber-300 shadow-[0_0_18px_rgba(251,191,36,0.35)]"
                    : "rounded-xl p-1.5 text-white/40 transition group-hover:text-white/65"
                }
              >
                <TabIcon tab={tab.id} className="h-5 w-5" />
              </span>
              <span
                className={
                  isActive
                    ? "text-[10px] font-medium tracking-wide text-amber-200/90"
                    : "text-[10px] tracking-wide text-white/35 transition group-hover:text-white/55"
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
