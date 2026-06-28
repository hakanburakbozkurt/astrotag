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
      <CollapsiblePanel title="Rezonans Detaylarını İncele" defaultOpen={false}>
        <ul className="space-y-3">
          {aspects.map((aspect) => (
            <li
              key={aspect.id}
              className="rounded-xl border border-white/8 bg-white/[0.02] px-4 py-4"
            >
              <h4 className="text-sm font-semibold leading-snug tracking-tight text-amber-50">
                {aspect.aspectTitle}
              </h4>
              <p className="mt-2 text-sm leading-relaxed text-white/72">{aspect.planetEffect}</p>
              <p className="mt-2.5 text-[11px] leading-relaxed text-white/50">
                {aspect.aspectDetail}
              </p>
              <p className="mt-3 border-t border-white/[0.06] pt-3 font-mono text-[10px] leading-relaxed tracking-wide text-white/45">
                {aspect.orbTechnical}
              </p>
            </li>
          ))}
        </ul>

        {date ? (
          <p className="mt-4 text-[10px] uppercase tracking-[0.2em] text-white/30">{date}</p>
        ) : null}
      </CollapsiblePanel>
    </section>
  );
}
