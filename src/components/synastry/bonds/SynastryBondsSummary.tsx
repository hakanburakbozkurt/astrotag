"use client";

interface SynastryBondsSummaryProps {
  summary: string | null | undefined;
}

export default function SynastryBondsSummary({ summary }: SynastryBondsSummaryProps) {
  if (!summary?.trim()) {
    return null;
  }

  return (
    <section
      className="mt-5 border-t border-white/10 pt-5"
      aria-label="Ana synastry yorumu"
    >
      <p className="text-[10px] uppercase tracking-[0.25em] text-amber-400/70">
        Ana Yorum
      </p>
      <p className="mt-3 text-sm leading-relaxed text-white/80">{summary}</p>
    </section>
  );
}
