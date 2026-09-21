"use client";

import type { SimilarStoryHint } from "@/lib/similar-stories/similar-stories.shared";

type PostBelongingStripProps = {
  hint: SimilarStoryHint;
};

export default function PostBelongingStrip({ hint }: PostBelongingStripProps) {
  return (
    <div
      aria-label="Benzer hikaye yankısı"
      className="mt-2 rounded-sm border border-zinc-800/90 bg-zinc-950/40 px-2.5 py-2"
    >
      <div className="flex flex-wrap items-center gap-1.5">
        <span
          aria-hidden
          className="text-[11px] text-red-500/90 shadow-[0_0_10px_rgba(239,68,68,0.15)]"
        >
          ♥
        </span>
        <p className="text-[10px] uppercase tracking-wider text-zinc-500">
          Ortak Döngü · {hint.matchCount} yankı
        </p>
      </div>
      <p className="mt-1 text-[11px] leading-relaxed text-zinc-500">{hint.empathyLine}</p>
      {hint.topMatchExcerpt ? (
        <p className="mt-1 text-[11px] italic text-zinc-600">
          “{hint.topMatchExcerpt}”
        </p>
      ) : null}
    </div>
  );
}
