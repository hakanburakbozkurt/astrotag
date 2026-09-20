"use client";

import { Heart } from "lucide-react";

type FeedLikeButtonProps = {
  liked: boolean;
  likeCount: number;
  disabled?: boolean;
  onClick: () => void;
};

export default function FeedLikeButton({
  liked,
  likeCount,
  disabled = false,
  onClick,
}: FeedLikeButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      aria-pressed={liked}
      aria-label={liked ? "Beğeniyi kaldır" : "Beğen"}
      className="group inline-flex items-center gap-1.5 disabled:opacity-50"
    >
      <Heart
        className={`h-4 w-4 transition ${
          liked
            ? "fill-red-500 text-red-500"
            : "text-zinc-600 group-hover:fill-red-500/20 group-hover:text-red-500"
        }`}
        strokeWidth={liked ? 0 : 2}
      />
      <span
        className={`text-[11px] tabular-nums ${
          liked ? "text-red-400" : "text-zinc-500 group-hover:text-zinc-400"
        }`}
      >
        {likeCount}
      </span>
    </button>
  );
}
