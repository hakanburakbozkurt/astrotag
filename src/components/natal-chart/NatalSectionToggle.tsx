import type { NatalScreenSection } from "@/lib/natal/natal-screen-preferences.client";

interface NatalSectionToggleProps {
  section: NatalScreenSection;
  onChange: (section: NatalScreenSection) => void;
}

export default function NatalSectionToggle({
  section,
  onChange,
}: NatalSectionToggleProps) {
  return (
    <div
      role="tablist"
      aria-label="Natal ekran modu"
      className="inline-flex w-full max-w-md rounded-xl border border-white/10 bg-white/[0.04] p-1 sm:w-auto"
    >
      {(
        [
          { id: "chart" as const, label: "Natal Harita" },
          { id: "weekly" as const, label: "Haftalık Analiz" },
        ] as const
      ).map((item) => {
        const active = section === item.id;
        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(item.id)}
            className={`min-h-9 flex-1 rounded-lg px-3 py-1.5 text-xs font-medium tracking-wide transition sm:flex-none sm:px-4 ${
              active
                ? "bg-amber-400/20 text-amber-100 shadow-[0_0_16px_rgba(251,191,36,0.12)]"
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
