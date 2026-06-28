"use client";

import CollapsiblePanel from "@/components/ui/CollapsiblePanel";
import type { SynastryAspectLine } from "@/lib/synastry/synastry-calculation";

interface SynastryBondsDeepDiveProps {
  aspectLines: SynastryAspectLine[];
  date?: string | null;
  limit?: number;
}

export default function SynastryBondsDeepDive({
  aspectLines,
  date,
  limit = 8,
}: SynastryBondsDeepDiveProps) {
  const aspects = aspectLines.slice(0, limit);

  if (aspects.length === 0) {
    return null;
  }

  return (
    <section className="mt-5 border-t border-white/10 pt-5" aria-label="Rezonans detayları">
      <p className="text-[10px] uppercase tracking-[0.25em] text-amber-400/70">
        Rezonans Detayları
      </p>
      <p className="mt-1 text-xs text-white/40">
        Zihinsel, kimlik ve diğer rezonans katmanları
      </p>

      <div className="mt-4 space-y-2">
        {aspects.map((aspect) => (
          <CollapsiblePanel key={aspect.id} title={aspect.aspectTitle} defaultOpen={false}>
            <p className="text-sm leading-relaxed text-white/72">{aspect.planetEffect}</p>
            <p className="mt-2.5 text-[11px] leading-relaxed text-white/50">
              {aspect.aspectDetail}
            </p>
            <p className="mt-3 border-t border-white/[0.06] pt-3 font-mono text-[10px] leading-relaxed tracking-wide text-white/45">
              {aspect.orbTechnical}
            </p>
          </CollapsiblePanel>
        ))}
      </div>

      {date ? (
        <p className="mt-4 text-[10px] uppercase tracking-[0.2em] text-white/30">{date}</p>
      ) : null}
    </section>
  );
}
