import type { NatalChartViewMode } from "@/lib/astrology/types";

interface NatalChartViewToggleProps {
  mode: NatalChartViewMode;
  onChange: (mode: NatalChartViewMode) => void;
}

export default function NatalChartViewToggle({
  mode,
  onChange,
}: NatalChartViewToggleProps) {
  return (
    <div
      role="tablist"
      aria-label="Harita görünüm modu"
      className="inline-flex rounded-xl border border-white/10 bg-white/[0.04] p-1"
    >
      {(
        [
          { id: "classic" as const, label: "Classic" },
          { id: "master" as const, label: "Master" },
        ] as const
      ).map((item) => {
        const active = mode === item.id;
        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(item.id)}
            className={`min-h-9 rounded-lg px-4 py-1.5 text-xs font-medium uppercase tracking-[0.16em] transition ${
              active
                ? "bg-amber-400/20 text-amber-100 shadow-[0_0_16px_rgba(251,191,36,0.15)]"
                : "text-white/45 hover:text-white/70"
            }`}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
