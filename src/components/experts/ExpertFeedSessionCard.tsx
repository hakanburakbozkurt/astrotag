"use client";

import {
  sessionTypeLabel,
  type ExpertFeedSessionOutput,
} from "@/lib/experts/feed.shared";

type ExpertFeedSessionCardProps = {
  output: ExpertFeedSessionOutput;
  compact?: boolean;
};

export default function ExpertFeedSessionCard({
  output,
  compact = false,
}: ExpertFeedSessionCardProps) {
  const label = output.serviceName?.trim() || sessionTypeLabel(output.sessionType);

  return (
    <div
      className={`rounded-sm border border-zinc-800 bg-zinc-950/60 ${
        compact ? "p-2.5" : "p-4"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className={`font-serif text-zinc-200 ${compact ? "text-[12px]" : "text-sm"}`}>
            {label}
          </p>
          {output.subjectName ? (
            <p className={`text-zinc-500 ${compact ? "mt-0.5 text-[10px]" : "mt-1 text-xs"}`}>
              {output.subjectName}
            </p>
          ) : null}
        </div>
        {typeof output.score === "number" ? (
          <div
            className={`flex shrink-0 items-center justify-center rounded-sm border border-zinc-800 bg-zinc-900 ${
              compact ? "h-9 w-9" : "h-12 w-12"
            }`}
          >
            <span className={`font-serif text-zinc-300 ${compact ? "text-sm" : "text-base"}`}>
              {output.score}
            </span>
          </div>
        ) : null}
      </div>

      {output.scoreLabel && typeof output.score === "number" ? (
        <p className="mt-1.5 text-[9px] uppercase tracking-[0.18em] text-zinc-600">
          {output.scoreLabel}
        </p>
      ) : null}

      {output.cards && output.cards.length > 0 ? (
        <ul className={`space-y-1 ${compact ? "mt-2" : "mt-4"}`}>
          {output.cards.map((card) => (
            <li
              key={`${card.position ?? "card"}-${card.name}`}
              className={`rounded-sm border border-zinc-800/80 text-zinc-400 ${
                compact ? "px-2 py-1 text-[11px]" : "px-3 py-2 text-xs"
              }`}
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
        <p
          className={`whitespace-pre-wrap leading-relaxed text-zinc-400 ${
            compact ? "mt-2 text-[12px]" : "mt-4 text-sm"
          }`}
        >
          {output.summary}
        </p>
      ) : null}

      {output.expertResponse ? (
        <div className={`border-t border-zinc-800/80 ${compact ? "mt-2 pt-2" : "mt-4 pt-4"}`}>
          <p className="text-[9px] uppercase tracking-[0.18em] text-zinc-600">
            Uzman yorumu
          </p>
          <p
            className={`whitespace-pre-wrap leading-relaxed text-zinc-400 ${
              compact ? "mt-1 text-[12px]" : "mt-2 text-sm"
            }`}
          >
            {output.expertResponse}
          </p>
        </div>
      ) : null}
    </div>
  );
}
