import type { WeeklyTransitRow } from "@/lib/cosmic-radar/types";

interface WeeklyTransitGridProps {
  rows: WeeklyTransitRow[];
  perspectiveSign: string;
}

export default function WeeklyTransitGrid({
  rows,
  perspectiveSign,
}: WeeklyTransitGridProps) {
  return (
    <div className="overflow-hidden rounded-lg border border-white/8 bg-white/[0.02]">
      <div className="grid grid-cols-[auto_1fr_auto] gap-x-3 gap-y-0 border-b border-white/8 px-3 py-2 text-[9px] uppercase tracking-[0.18em] text-white/35">
        <span>Gezegen</span>
        <span>Konum</span>
        <span className="text-right">Ev</span>
      </div>
      <ul className="divide-y divide-white/6">
        {rows.map((row) => (
          <li
            key={row.id}
            className={`grid grid-cols-[auto_1fr_auto] items-center gap-x-3 px-3 py-2.5 text-xs ${
              row.inSelectedSign ? "bg-cyan-400/[0.06]" : ""
            }`}
          >
            <span className="flex items-center gap-1.5 font-medium text-amber-100/90">
              <span className="text-sm">{row.symbol}</span>
              {row.name}
            </span>
            <span className="text-white/65">{row.positionLabel}</span>
            <span className="text-right text-white/50">
              {row.houseLabel}
              <span className="mt-0.5 block text-[9px] text-white/30">
                {perspectiveSign} ASC
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
