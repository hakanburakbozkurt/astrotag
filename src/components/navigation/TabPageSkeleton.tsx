export default function TabPageSkeleton() {
  return (
    <div
      className="relative mx-auto flex w-full max-w-xl animate-pulse flex-col px-3 pb-6 pt-4 sm:px-5 sm:pt-5 touch-pan-y"
      aria-busy="true"
      aria-label="Kozmik Terminal yükleniyor"
    >
      <div className="mb-5 flex flex-col items-center gap-2 text-center">
        <div className="h-7 w-7 rounded-full border-2 border-amber-400/15 border-t-amber-400/70" />
        <p className="text-xs font-medium tracking-wide text-amber-200/80">
          Kozmik Terminal yükleniyor...
        </p>
      </div>

      <div className="mb-4 space-y-2">
        <div className="h-2.5 w-20 rounded-full bg-white/10" />
        <div className="h-6 w-40 rounded-lg bg-white/10" />
        <div className="h-3 w-full max-w-xs rounded-md bg-white/[0.06]" />
      </div>

      <div className="space-y-4">
        <div className="rounded-[20px] border border-white/10 bg-[#0f172a]/60 p-3 sm:p-4">
          <div className="h-2.5 w-28 rounded-full bg-white/10" />
          <div className="mt-3 space-y-3">
            <div className="h-10 rounded-lg bg-white/[0.06]" />
            <div className="h-10 rounded-lg bg-white/[0.06]" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function CosmicTerminalSkeleton() {
  return <TabPageSkeleton />;
}

export function SectionSkeleton({ title }: { title?: string }) {
  return (
    <div
      className="animate-pulse rounded-[20px] border border-white/10 bg-[#0f172a]/60 p-3 sm:p-4 touch-pan-y"
      aria-busy="true"
      aria-label={title ?? "Kozmik Terminal yükleniyor"}
    >
      <div className="mb-3 flex items-center gap-1.5">
        <div className="h-1.5 w-1.5 rounded-full bg-amber-400/50" />
        <p className="text-[9px] uppercase tracking-[0.2em] text-amber-200/60">
          Kozmik Terminal yükleniyor...
        </p>
      </div>
      <div className="h-2.5 w-24 rounded-full bg-white/10" />
      <div className="mt-3 space-y-2">
        <div className="h-3 w-full rounded-md bg-white/[0.06]" />
        <div className="h-9 w-full rounded-lg bg-white/[0.06]" />
      </div>
    </div>
  );
}
