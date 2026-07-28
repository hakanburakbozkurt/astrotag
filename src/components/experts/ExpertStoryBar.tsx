"use client";

import ExpertAvatar from "@/components/experts/ExpertAvatar";
import type { ExpertListItem } from "@/components/experts/experts.types";

interface ExpertStoryBarProps {
  experts: ExpertListItem[];
  selectedId: string | null;
  onSelect: (expertId: string) => void;
}

export default function ExpertStoryBar({
  experts,
  selectedId,
  onSelect,
}: ExpertStoryBarProps) {
  return (
    <div className="relative -mx-1">
      <div className="overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <ul className="flex min-w-min gap-4 px-1 snap-x snap-mandatory">
          {experts.map((expert) => {
            const selected = selectedId === expert.id;

            return (
              <li key={expert.id} className="w-[76px] shrink-0 snap-start">
                <button
                  type="button"
                  onClick={() => onSelect(expert.id)}
                  aria-pressed={selected}
                  className="group flex w-full flex-col items-center gap-2 text-center"
                >
                  <ExpertAvatar
                    avatarUrl={expert.avatarUrl}
                    displayName={expert.displayName}
                    size="story"
                    selected={selected}
                  />
                  <span
                    className={`line-clamp-2 w-full text-[11px] leading-tight transition ${
                      selected
                        ? "font-semibold text-white"
                        : "text-white/65 group-hover:text-white/85"
                    }`}
                  >
                    {expert.displayName}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
