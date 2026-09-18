"use client";

import { memo, useCallback, useState } from "react";
import dynamic from "next/dynamic";
import { SectionSkeleton } from "@/components/navigation/TabPageSkeleton";
import { Colors } from "@/lib/navigation/dashboard-colors";

const CosmicJournal = dynamic(
  () => import("@/components/dashboard/CosmicJournal"),
  { loading: () => <SectionSkeleton title="Okuma arşivi" /> }
);

const ManifestoHistorySection = dynamic(
  () => import("@/components/profile/ManifestoHistorySection"),
  { loading: () => <SectionSkeleton title="Manifesto geçmişi" /> }
);

type JournalTab = "readings" | "manifesto";

const TABS: { id: JournalTab; label: string }[] = [
  { id: "readings", label: "Okuma Arşivi" },
  { id: "manifesto", label: "Kozmik Manifesto" },
];

function JournalTabsInner() {
  const [activeTab, setActiveTab] = useState<JournalTab>("readings");

  const selectReadings = useCallback(() => setActiveTab("readings"), []);
  const selectManifesto = useCallback(() => setActiveTab("manifesto"), []);

  return (
    <div className="w-full min-w-0 space-y-4">
      <div className={`flex w-full min-w-0 gap-2 rounded-sm border border-zinc-800 p-1 ${Colors.shell}`}>
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          const onClick = tab.id === "readings" ? selectReadings : selectManifesto;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={onClick}
              className={`flex-1 rounded-sm px-3 py-2 text-xs transition ${
                isActive
                  ? "bg-zinc-800 text-stone-300"
                  : "text-stone-500 hover:text-stone-400"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
      {activeTab === "readings" ? (
        <div className="w-full min-w-0 [&_section]:mt-0">
          <CosmicJournal />
        </div>
      ) : (
        <div className="w-full min-w-0">
          <ManifestoHistorySection />
        </div>
      )}
    </div>
  );
}

export default memo(JournalTabsInner);
