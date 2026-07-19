type DataLoadingStateProps = {
  label?: string;
  compact?: boolean;
  className?: string;
};

export default function DataLoadingState({
  label = "Yükleniyor...",
  compact = false,
  className = "",
}: DataLoadingStateProps) {
  return (
    <div
      className={`flex items-center justify-center gap-2.5 text-amber-200/75 ${
        compact ? "py-4 text-xs" : "py-8 text-sm"
      } ${className}`}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <span
        className={`inline-block animate-spin rounded-full border-2 border-amber-400/20 border-t-amber-400/85 ${
          compact ? "h-4 w-4" : "h-5 w-5"
        }`}
        aria-hidden
      />
      <span>{label}</span>
    </div>
  );
}
