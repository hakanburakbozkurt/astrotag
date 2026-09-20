"use client";

import {
  sessionTypeLabel,
  type ExpertFeedSessionOutput,
} from "@/lib/experts/feed.shared";

type ExpertFeedSessionCardProps = {
  output: ExpertFeedSessionOutput;
};

export default function ExpertFeedSessionCard({
  output,
}: ExpertFeedSessionCardProps) {
  const label = output.serviceName?.trim() || sessionTypeLabel(output.sessionType);

  return (
    <div className="rounded-sm border border-zinc-800 bg-zinc-950/60 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-serif text-sm text-zinc-200">{label}</p>
          {output.subjectName ? (
            <p className="mt-1 text-xs text-zinc-500">{output.subjectName}</p>
          ) : null}
        </div>
        {typeof output.score === "number" ? (
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-sm border border-zinc-800 bg-zinc-900">
            <span className="font-serif text-base text-zinc-300">
              {output.score}
            </span>
          </div>
        ) : null}
      </div>

      {output.scoreLabel && typeof output.score === "number" ? (
        <p className="mt-2 text-[10px] uppercase tracking-[0.2em] text-zinc-600">
          {output.scoreLabel}
        </p>
      ) : null}

      {output.cards && output.cards.length > 0 ? (
        <ul className="mt-4 space-y-2">
          {output.cards.map((card) => (
            <li
              key={`${card.position ?? "card"}-${card.name}`}
              className="rounded-sm border border-zinc-800/80 px-3 py-2 text-xs text-zinc-400"
            >
              {card.position ? (
                <span className="text-zinc-500">{card.position}</span>
              ) : null}
              {card.position ? " · " : null}
              {card.name}
            </li>
          ))}
        </ul>
      ) : null}

      {output.summary ? (
        <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-zinc-400">
          {output.summary}
        </p>
      ) : null}

      {output.expertResponse ? (
        <div className="mt-4 border-t border-zinc-800/80 pt-4">
          <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-600">
            Uzman yorumu
          </p>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-zinc-400">
            {output.expertResponse}
          </p>
        </div>
      ) : null}
    </div>
  );
}
