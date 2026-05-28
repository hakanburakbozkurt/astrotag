"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { UserData } from "@/types/user";
import type { PlanetId } from "@/lib/astrology/types";
import { useNatalChart } from "@/hooks/useNatalChart";
import {
  splitInterpretationParagraphs,
  useNatalInterpretation,
} from "@/hooks/useNatalInterpretation";
import { resolvePlanetRadiusOffsets } from "@/lib/astrology/planet-offset";
import {
  ASPECT_LEGEND,
  CHART_VIEWBOX,
} from "./constants";
import ZodiacWheel from "./ZodiacWheel";
import AspectLines from "./AspectLines";
import PlanetMarkers from "./PlanetMarkers";

const TOOLTIP_DURATION_MS = 2000;

interface NatalChartProps {
  userData: UserData;
}

export default function NatalChart({ userData }: NatalChartProps) {
  const { status, data, error } = useNatalChart(userData);
  const {
    status: interpretationStatus,
    interpretation,
    error: interpretationError,
    requestInterpretation,
  } = useNatalInterpretation(status === "ready" ? userData : null);

  const [activePlanetId, setActivePlanetId] = useState<PlanetId | null>(null);
  const tooltipTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const radiusOffsets = useMemo(
    () => (data ? resolvePlanetRadiusOffsets(data.planets) : new Map()),
    [data]
  );

  const interpretationParagraphs = useMemo(
    () =>
      interpretation ? splitInterpretationParagraphs(interpretation) : [],
    [interpretation]
  );

  const handlePlanetTap = useCallback((planetId: PlanetId) => {
    if (tooltipTimerRef.current) {
      clearTimeout(tooltipTimerRef.current);
    }
    setActivePlanetId(planetId);
    tooltipTimerRef.current = setTimeout(() => {
      setActivePlanetId(null);
      tooltipTimerRef.current = null;
    }, TOOLTIP_DURATION_MS);
  }, []);

  useEffect(() => {
    return () => {
      if (tooltipTimerRef.current) {
        clearTimeout(tooltipTimerRef.current);
      }
    };
  }, []);

  if (status === "loading" || status === "idle") {
    return (
      <div className="flex min-h-[280px] items-center justify-center text-sm text-white/45">
        Gezegenler hizalanıyor…
      </div>
    );
  }

  if (status === "error" || !data) {
    return (
      <div className="flex min-h-[280px] items-center justify-center text-sm text-rose-300/80">
        {error ?? "Doğum haritası hesaplanamadı."}
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col items-center gap-5">
      <div
        className="relative w-full max-w-[420px] overscroll-contain"
        style={{ overscrollBehavior: "contain" }}
      >
        <div className="relative aspect-square w-full">
          <svg
            viewBox={`0 0 ${CHART_VIEWBOX} ${CHART_VIEWBOX}`}
            className="absolute inset-0 h-full w-full touch-none"
            style={{ touchAction: "none" }}
            role="img"
            aria-label={`${userData.name} doğum haritası`}
            preserveAspectRatio="xMidYMid meet"
          >
            <ZodiacWheel ascendant={data.ascendant.longitude} />
            <AspectLines
              planets={data.planets}
              aspects={data.aspects}
              ascendant={data.ascendant.longitude}
            />
          </svg>

          <PlanetMarkers
            planets={data.planets}
            ascendant={data.ascendant.longitude}
            radiusOffsets={radiusOffsets}
            activePlanetId={activePlanetId}
            onPlanetTap={handlePlanetTap}
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3 text-[10px] text-white/50">
        {ASPECT_LEGEND.map((item) => (
          <span key={item.type} className="inline-flex items-center gap-1.5">
            <span
              className="inline-block h-2 w-5 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            {item.label}
          </span>
        ))}
      </div>

      <div className="w-full max-w-md rounded-2xl border border-amber-400/15 bg-amber-400/[0.04] px-4 py-3 text-center">
        <p className="text-[10px] uppercase tracking-[0.25em] text-amber-400/60">
          Yükselen
        </p>
        <p className="mt-1 text-sm font-medium text-amber-100/90">
          {data.ascendant.label}
        </p>
      </div>

      <ul className="grid w-full max-w-md grid-cols-2 gap-2 text-xs text-white/70">
        {data.planets.map((planet) => (
          <li
            key={planet.id}
            className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2"
          >
            <span className="text-amber-200/90">{planet.symbol}</span>{" "}
            <span className="font-medium text-white/85">{planet.name}</span>
            <span className="mt-0.5 block text-[11px] text-white/45">
              {planet.cardLabel}
            </span>
          </li>
        ))}
      </ul>

      <div className="w-full max-w-md">
        {data.aspects.length > 0 && (
          <>
            <p className="mb-2 text-[10px] uppercase tracking-[0.25em] text-white/35">
              Açılar
            </p>
            <ul className="space-y-1.5 text-[11px] text-white/55">
              {data.aspects.slice(0, 8).map((aspect) => {
                const planetA = data.planets.find(
                  (p) => p.id === aspect.planetA
                );
                const planetB = data.planets.find(
                  (p) => p.id === aspect.planetB
                );
                return (
                  <li
                    key={aspect.id}
                    className="rounded-lg border border-white/8 bg-white/[0.02] px-3 py-1.5"
                  >
                    {planetA?.name} — {planetB?.name}:{" "}
                    <span className="text-white/75">{aspect.typeLabel}</span>{" "}
                    <span className="text-white/35">(orb {aspect.orb}°)</span>
                  </li>
                );
              })}
            </ul>
          </>
        )}

        <div
          className={
            data.aspects.length > 0
              ? "mt-5 border-t border-white/8 pt-5"
              : "pt-1"
          }
        >
          <p className="mb-3 text-[10px] uppercase tracking-[0.25em] text-amber-400/55">
            Açıların Kozmik Mesajı
          </p>

          {interpretationStatus === "idle" && (
            <button
              type="button"
              onClick={() => void requestInterpretation()}
              className="min-h-11 w-full rounded-xl border border-amber-400/30 bg-amber-400/10 py-2.5 text-sm font-medium text-amber-100 transition hover:bg-amber-400/20"
            >
              Analizi Başlat (−1 Enerji)
            </button>
          )}

          {interpretationStatus === "loading" && (
            <p className="text-sm leading-relaxed text-white/40">
              Yıldızlar konuşuyor…
            </p>
          )}

          {interpretationStatus === "error" && (
            <p className="text-sm leading-relaxed text-rose-300/70">
              {interpretationError ?? "Kozmik mesaj şu an ulaşmıyor."}
            </p>
          )}

          {interpretationStatus === "ready" &&
            interpretationParagraphs.map((paragraph) => (
              <p
                key={paragraph.slice(0, 48)}
                className="mb-3 text-sm leading-relaxed text-white/72 last:mb-0"
              >
                {paragraph}
              </p>
            ))}
        </div>
      </div>

      <p className="text-center text-[10px] uppercase tracking-[0.2em] text-white/30">
        {data.coordinates.displayName} · {data.ascendant.signName} ASC
      </p>
    </div>
  );
}
