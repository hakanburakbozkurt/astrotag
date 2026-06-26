"use client";

import { memo } from "react";
import type { UserData } from "@/types/user";
import { compactSectionClass } from "@/components/navigation/compact-ui";
import { useWeeklyAnalysis } from "@/hooks/useWeeklyAnalysis";
import ZodiacSelectorBar from "@/components/cosmic-radar/ZodiacSelectorBar";
import WeeklyAnalysisChart from "@/components/natal-chart/WeeklyAnalysisChart";
import WeeklyAnalysisContentPanel from "@/components/natal-chart/WeeklyAnalysisContentPanel";

interface WeeklyAnalysisViewProps {
  user: UserData;
}

function WeeklyAnalysisView({ user }: WeeklyAnalysisViewProps) {
  const {
    status,
    content,
    natalChart,
    transits,
    selectedSign,
    setSelectedSign,
    error,
  } = useWeeklyAnalysis(user);

  const chartReady = status === "ready" && natalChart;

  return (
    <div className="min-w-0">
      {/* Harita — full-width kare, statik, kutu yok */}
      <div className="-mx-3 w-[calc(100%+1.5rem)] sm:-mx-5 sm:w-[calc(100%+2.5rem)]">
        {chartReady ? (
          <div className="mb-20 w-full">
            <WeeklyAnalysisChart
              natalChart={natalChart}
              transits={transits}
              selectedSign={selectedSign}
            />
          </div>
        ) : (
          <div className="mb-20 flex aspect-square w-full items-center justify-center">
            <p className="px-4 text-sm text-white/45">
              {status === "error" ? error : "Harita ve transitler hesaplanıyor..."}
            </p>
          </div>
        )}
      </div>

      {/* Burç barı — haritanın altında, scroll ile birlikte */}
      <section className="border-b border-white/10 pb-3">
        <div className="min-w-0 touch-pan-x overflow-x-auto scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <ZodiacSelectorBar selected={selectedSign} onSelect={setSelectedSign} />
        </div>
      </section>

      {/* İçerik — tek sayfa scroll akışı, nested scroll yok */}
      <section className="pt-4">
        {status === "ready" && content ? (
          <WeeklyAnalysisContentPanel content={content} selectedSign={selectedSign} />
        ) : status === "error" ? (
          <div className={`${compactSectionClass} text-center`}>
            <p className="text-sm text-red-200/80">{error}</p>
          </div>
        ) : (
          <div className={`${compactSectionClass} py-8 text-center`}>
            <p className="text-sm text-white/45">Analiz metinleri hazırlanıyor...</p>
          </div>
        )}
      </section>
    </div>
  );
}

export default memo(WeeklyAnalysisView);
