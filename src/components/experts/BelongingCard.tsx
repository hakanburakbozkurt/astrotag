"use client";

import Link from "next/link";
import type {
  SimilarStoryMatch,
  ViewerSimilarStoriesBundle,
} from "@/lib/similar-stories/similar-stories.shared";
import { feedContextTagLabel } from "@/lib/feed/feed-context-tags.shared";
import {
  SIMILAR_STORIES_GUEST_CTA_LABEL,
  emotionalStateTagLabel,
} from "@/lib/similar-stories/similar-stories.shared";

type BelongingCardProps = {
  bundle: ViewerSimilarStoriesBundle;
};

function ConnectionBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-sm border border-zinc-700/80 bg-zinc-900/60 px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-zinc-400 shadow-[0_0_12px_rgba(239,68,68,0.12)]">
      <span aria-hidden className="text-red-500/90">
        ♥
      </span>
      {label}
    </span>
  );
}

function MatchRow({ match }: { match: SimilarStoryMatch }) {
  return (
    <li className="border-t border-zinc-800/70 px-3 py-2 first:border-t-0">
      <div className="flex flex-wrap items-center gap-1.5">
        <p className="text-[10px] uppercase tracking-wider text-zinc-500">Gezgin</p>
        <ConnectionBadge label={feedContextTagLabel(match.contextTag)} />
        {match.emotionalStateTag ? (
          <span className="text-[10px] text-zinc-600">
            · {emotionalStateTagLabel(match.emotionalStateTag)}
          </span>
        ) : null}
      </div>
      <p className="mt-1 text-[12px] leading-relaxed text-zinc-400">{match.excerpt}</p>
      {match.sharedSignals.length > 0 ? (
        <p className="mt-1 text-[10px] text-zinc-600">
          {match.sharedSignals.slice(0, 2).join(" · ")}
        </p>
      ) : null}
    </li>
  );
}

export default function BelongingCard({ bundle }: BelongingCardProps) {
  return (
    <article
      aria-label="Benzer hikayeler — ortak döngü"
      className="rounded-sm border border-zinc-800 bg-[#09090b]"
    >
      <header className="border-b border-zinc-800/80 px-3 py-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="font-serif text-[13px] text-zinc-300">Ortak Döngü</p>
            <p className="text-[10px] uppercase tracking-wider text-zinc-600">
              Benzer Hikayeler
            </p>
          </div>
          {bundle.matchCount > 0 ? (
            <ConnectionBadge label={`${bundle.matchCount} yankı`} />
          ) : null}
        </div>
      </header>

      <div className="px-3 py-2.5">
        <p className="text-[12px] leading-relaxed text-zinc-400">{bundle.empathyInsight}</p>
        {bundle.isGuestTeaser ? (
          <Link
            href="/login"
            className="mt-2.5 inline-flex items-center gap-1.5 rounded-sm border border-zinc-700 px-2.5 py-1 text-[10px] uppercase tracking-wider text-zinc-300 transition hover:border-zinc-600"
          >
            <span aria-hidden className="text-red-500/90">
              ♥
            </span>
            {SIMILAR_STORIES_GUEST_CTA_LABEL}
          </Link>
        ) : null}
        {!bundle.isGuestTeaser && !bundle.viewerHasCosmicProfile ? (
          <p className="mt-2 text-[10px] text-zinc-600">
            Doğum bilgilerinizi tamamladığınızda transit eşleşmesi derinleşir.
          </p>
        ) : null}
      </div>

      {bundle.matches.length > 0 ? (
        <ul className="border-t border-zinc-800/80">
          {bundle.matches.map((match) => (
            <MatchRow key={match.postId} match={match} />
          ))}
        </ul>
      ) : null}
    </article>
  );
}
