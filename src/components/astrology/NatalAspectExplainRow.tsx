"use client";

import { memo, useMemo } from "react";
import AstrologyExplainButton from "@/components/astrology/AstrologyExplainButton";
import { explainNatalAspect } from "@/lib/astrology/plain-language-caution";

interface NatalAspectExplainRowProps {
  planetA: string;
  planetB: string;
  aspectType: string;
  orb: number;
}

function NatalAspectExplainRowInner({
  planetA,
  planetB,
  aspectType,
  orb,
}: NatalAspectExplainRowProps) {
  const explanation = useMemo(
    () => explainNatalAspect(planetA, planetB, aspectType, orb),
    [aspectType, orb, planetA, planetB]
  );

  return (
    <li className="flex items-center justify-between gap-2 rounded-lg border border-white/8 bg-white/[0.02] px-3 py-1.5">
      <span className="min-w-0 flex-1 text-[11px] text-white/55">
        {planetA} — {planetB}:{" "}
        <span className="text-white/75">{aspectType}</span>{" "}
        <span className="text-white/35">(orb {orb}°)</span>
      </span>
      <AstrologyExplainButton
        explanation={explanation}
        label={`${planetA} ${aspectType} ${planetB} açıklaması`}
      />
    </li>
  );
}

export default memo(NatalAspectExplainRowInner);
