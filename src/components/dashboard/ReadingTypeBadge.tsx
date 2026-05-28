"use client";

import type { CosmicReadingType } from "@/lib/cosmic-journal/types";
import { READING_TYPE_META } from "@/lib/cosmic-journal/types";

type ReadingTypeBadgeProps = {
  type: CosmicReadingType;
  compact?: boolean;
};

export default function ReadingTypeBadge({
  type,
  compact = false,
}: ReadingTypeBadgeProps) {
  const meta = READING_TYPE_META[type];

  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1 rounded border px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.14em] ${meta.accent}`}
      aria-label={meta.label}
    >
      <span aria-hidden className="opacity-70">
        ◈
      </span>
      {compact ? meta.code : `${meta.code} · ${meta.label}`}
    </span>
  );
}
