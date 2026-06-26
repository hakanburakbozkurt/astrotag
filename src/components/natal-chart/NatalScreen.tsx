"use client";

import type { UserData } from "@/types/user";
import NatalChart from "@/components/natal-chart/NatalChart";
import NatalChartViewToggle from "@/components/natal-chart/NatalChartViewToggle";
import NatalSectionToggle from "@/components/natal-chart/NatalSectionToggle";
import WeeklyAnalysisView from "@/components/natal-chart/WeeklyAnalysisView";
import TabPageScaffold from "@/components/navigation/TabPageScaffold";
import {
  compactSectionClass,
  compactLabelClass,
} from "@/components/navigation/compact-ui";
import { useNatalScreenPreferences } from "@/hooks/useNatalScreenPreferences";

interface NatalScreenProps {
  user: UserData;
}

export default function NatalScreen({ user }: NatalScreenProps) {
  const { ready, section, setSection, chartViewMode, setChartViewMode } =
    useNatalScreenPreferences();

  if (!ready) {
    return (
      <div className="relative mx-auto w-full max-w-xl px-3 py-10 text-center">
        <p className="text-sm text-white/45">Natal ekranı yükleniyor...</p>
      </div>
    );
  }

  const isChart = section === "chart";

  return (
    <TabPageScaffold
      eyebrow="Natal"
      title={isChart ? "Doğum Haritası" : "Haftalık Analiz"}
      description={`${user.birthDate} · ${user.birthTime} · ${user.birthPlace}`}
      headerExtra={
        <div className="mt-3 space-y-3">
          <NatalSectionToggle section={section} onChange={setSection} />
          {isChart ? (
            <div className="flex flex-wrap items-center gap-2">
              <NatalChartViewToggle mode={chartViewMode} onChange={setChartViewMode} />
              <p className={compactLabelClass}>
                {chartViewMode === "master" ? "Detaylı görünüm" : "Özet görünüm"}
              </p>
            </div>
          ) : null}
        </div>
      }
    >
      {isChart ? (
        <section className={`${compactSectionClass} min-w-0 overflow-hidden`}>
          <NatalChart userData={user} viewMode={chartViewMode} />
        </section>
      ) : (
        <WeeklyAnalysisView user={user} />
      )}
    </TabPageScaffold>
  );
}
