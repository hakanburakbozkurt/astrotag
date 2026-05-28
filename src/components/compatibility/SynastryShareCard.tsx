"use client";

import { forwardRef } from "react";

export interface SynastryShareCardData {
  userName: string;
  partnerName: string;
  score: number;
  summary: string;
  date: string;
  question?: string;
  analysisExcerpt?: string;
}

type SynastryShareCardProps = {
  data: SynastryShareCardData;
};

const SynastryShareCard = forwardRef<HTMLDivElement, SynastryShareCardProps>(
  function SynastryShareCard({ data }, ref) {
    return (
      <div
        ref={ref}
        className="relative flex h-[540px] w-[405px] flex-col overflow-hidden rounded-[24px] border border-amber-400/25 bg-[#0a0f1a] p-8 text-left"
        style={{
          fontFamily:
            'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace',
        }}
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-30"
          aria-hidden
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />
        <div
          className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-amber-400/10 blur-3xl"
          aria-hidden
        />

        <p className="relative text-[10px] uppercase tracking-[0.35em] text-amber-400/80">
          ASTROTAG · Synastry
        </p>
        <p className="relative mt-6 text-xs uppercase tracking-[0.2em] text-white/45">
          {data.date}
        </p>

        <div className="relative mt-8 flex items-center gap-4">
          <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full border-2 border-amber-400/40 bg-amber-400/10">
            <span className="text-3xl font-bold text-amber-100">{data.score}</span>
          </div>
          <div>
            <p className="text-sm text-white/90">{data.userName}</p>
            <p className="text-[10px] text-white/40">×</p>
            <p className="text-sm text-white/90">{data.partnerName}</p>
          </div>
        </div>

        <p className="relative mt-6 text-[10px] uppercase tracking-[0.22em] text-amber-400/60">
          Günlük Uyum
        </p>
        <p className="relative mt-2 text-sm leading-relaxed text-white/80">
          {data.summary}
        </p>

        {data.question ? (
          <>
            <p className="relative mt-5 text-[10px] uppercase tracking-[0.22em] text-white/35">
              Soru
            </p>
            <p className="relative mt-1 text-xs leading-relaxed text-white/65">
              {data.question}
            </p>
          </>
        ) : null}

        {data.analysisExcerpt ? (
          <>
            <p className="relative mt-4 text-[10px] uppercase tracking-[0.22em] text-white/35">
              Kozmik Not
            </p>
            <p className="relative mt-1 line-clamp-4 text-xs leading-relaxed text-white/55">
              {data.analysisExcerpt}
            </p>
          </>
        ) : null}

        <p className="relative mt-auto pt-6 text-[9px] uppercase tracking-[0.3em] text-white/25">
          kozmik danışman · astrotag
        </p>
      </div>
    );
  }
);

export default SynastryShareCard;
