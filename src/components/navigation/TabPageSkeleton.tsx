export default function TabPageSkeleton() {
  return (
    <div className="relative mx-auto w-full max-w-xl animate-pulse px-4 pb-8 pt-6 sm:px-6 sm:pt-8">
      <div className="mb-6 space-y-3">
        <div className="h-3 w-24 rounded-full bg-white/10" />
        <div className="h-8 w-48 rounded-xl bg-white/10" />
        <div className="h-4 w-full max-w-sm rounded-lg bg-white/[0.06]" />
      </div>

      <div className="space-y-5">
        <div className="rounded-[28px] border border-white/10 bg-[#0f172a]/60 p-5 sm:p-6">
          <div className="h-3 w-32 rounded-full bg-white/10" />
          <div className="mt-5 space-y-4">
            <div className="h-12 rounded-xl bg-white/[0.06]" />
            <div className="h-12 rounded-xl bg-white/[0.06]" />
            <div className="h-12 rounded-xl bg-white/[0.06]" />
          </div>
        </div>

        <div className="rounded-[28px] border border-white/10 bg-[#0f172a]/60 p-5 sm:p-6">
          <div className="h-3 w-28 rounded-full bg-white/10" />
          <div className="mt-5 h-24 rounded-xl bg-white/[0.06]" />
        </div>
      </div>
    </div>
  );
}

export function SectionSkeleton({ title }: { title?: string }) {
  return (
    <div
      className="animate-pulse rounded-[28px] border border-white/10 bg-[#0f172a]/60 p-5 sm:p-6"
      aria-busy="true"
      aria-label={title ?? "Yükleniyor"}
    >
      <div className="h-3 w-28 rounded-full bg-white/10" />
      <div className="mt-5 space-y-3">
        <div className="h-4 w-full rounded-lg bg-white/[0.06]" />
        <div className="h-4 w-5/6 rounded-lg bg-white/[0.06]" />
        <div className="h-11 w-full rounded-xl bg-white/[0.06]" />
      </div>
    </div>
  );
}
