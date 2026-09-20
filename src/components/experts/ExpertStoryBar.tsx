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
    <div className="overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <ul className="flex min-w-min snap-x snap-mandatory gap-3 px-0.5 py-0.5">
        {experts.map((expert) => {
          const selected = selectedId === expert.id;

          return (
            <li key={expert.id} className="w-[58px] shrink-0 snap-start">
              <button
                type="button"
                onClick={() => onSelect(expert.id)}
                aria-pressed={selected}
                className="group flex w-full flex-col items-center gap-1.5 text-center"
              >
                <ExpertAvatar
                  avatarUrl={expert.avatarUrl}
                  displayName={expert.displayName}
                  size="storyCompact"
                  selected={selected}
                />
                <span
                  className={`line-clamp-2 w-full text-[10px] leading-tight transition ${
                    selected
                      ? "font-medium text-zinc-200"
                      : "text-zinc-500 group-hover:text-zinc-400"
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
  );
}
