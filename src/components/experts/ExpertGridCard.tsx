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
      className={`flex h-full min-h-[156px] w-full flex-col rounded-sm border p-4 text-left transition ${
        selected
          ? "border-zinc-600 bg-zinc-900"
          : "border-zinc-800 bg-[#09090b] hover:border-zinc-700 hover:bg-zinc-950"
      }`}
    >
      <div className="flex min-h-[4.5rem] items-start gap-3">
        <ExpertAvatar
          avatarUrl={expert.avatarUrl}
          displayName={expert.displayName}
          size="grid"
          ring={false}
        />
        <div className="min-w-0 flex-1">
          <p className="line-clamp-2 font-serif text-sm leading-snug text-zinc-100">
            {expert.displayName}
          </p>
          <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-zinc-500">
            {expert.title}
          </p>
        </div>
      </div>

      <div className="mt-auto space-y-1 border-t border-zinc-800 pt-3">
        <p className="line-clamp-1 text-[10px] uppercase tracking-[0.18em] text-zinc-600">
          {expert.tradition}
        </p>
        <p className="text-xs text-zinc-500">
          <span className="font-mono text-zinc-400">{expert.experienceYears}</span>{" "}
          yıl deneyim
        </p>
      </div>
    </button>
  );
}
