"use client";

import ExpertAvatar from "@/components/experts/ExpertAvatar";
import type { ExpertListItem } from "@/components/experts/experts.types";

interface ExpertGridCardProps {
  expert: ExpertListItem;
  selected?: boolean;
  onSelect: (expertId: string) => void;
}

export default function ExpertGridCard({
  expert,
  selected = false,
  onSelect,
}: ExpertGridCardProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(expert.id)}
      aria-pressed={selected}
      className={`group flex h-full flex-col rounded-[22px] border p-3.5 text-left transition ${
        selected
          ? "border-violet-400/35 bg-violet-500/[0.08] shadow-[0_0_24px_rgba(139,92,246,0.12)]"
          : "border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.05]"
      }`}
    >
      <div className="flex items-start gap-3">
        <ExpertAvatar
          avatarUrl={expert.avatarUrl}
          displayName={expert.displayName}
          size="grid"
          ring={false}
        />
        <div className="min-w-0 flex-1">
          <p className="line-clamp-2 text-sm font-semibold leading-snug text-white/95">
            {expert.displayName}
          </p>
          <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-amber-200/75">
            {expert.title}
          </p>
        </div>
      </div>

      <div className="mt-3 space-y-1.5 border-t border-white/[0.06] pt-3">
        <p className="line-clamp-1 text-[10px] uppercase tracking-[0.18em] text-violet-200/55">
          {expert.tradition}
        </p>
        <p className="text-xs text-white/45">
          <span className="font-mono text-white/70">{expert.experienceYears}</span>{" "}
          yıl deneyim
        </p>
      </div>
    </button>
  );
}
