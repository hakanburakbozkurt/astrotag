interface AnalysisExecutiveSummaryProps {
  summary: string;
  label?: string;
}

export default function AnalysisExecutiveSummary({
  summary,
  label = "Kozmik Mesaj",
}: AnalysisExecutiveSummaryProps) {
  return (
    <div className="rounded-2xl border border-amber-400/20 bg-gradient-to-br from-amber-400/[0.08] to-[#0f172a]/40 p-5 sm:p-6">
      <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-amber-400/75">
        {label}
      </p>
      <p className="mt-3 text-xl font-semibold leading-snug text-white sm:text-2xl sm:leading-snug">
        {summary}
      </p>
    </div>
  );
}
