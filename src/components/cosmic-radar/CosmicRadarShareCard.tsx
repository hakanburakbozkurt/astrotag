"use client";

import { forwardRef } from "react";
import { getCosmicRadarQrUrl } from "@/lib/cosmic-radar/share-content";
import type { CosmicRadarSharePayload } from "@/lib/cosmic-radar/types";
import { ZODIAC_GLYPHS } from "@/lib/astrology/zodiac-signs";

type CosmicRadarShareCardProps = {
  payload: CosmicRadarSharePayload;
};

const CosmicRadarShareCard = forwardRef<HTMLDivElement, CosmicRadarShareCardProps>(
  function CosmicRadarShareCard({ payload }, ref) {
    const glyph = ZODIAC_GLYPHS[payload.sign];

    return (
      <div
        ref={ref}
        className="relative flex h-[520px] w-[390px] flex-col overflow-hidden rounded-[24px] border border-amber-400/25 bg-[#0a0f1a] p-7 text-left"
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

        <div className="relative flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-[0.35em] text-amber-400/85">
              ASTROTAG
            </p>
            <p className="mt-1 text-[9px] uppercase tracking-[0.22em] text-white/35">
              Haftalık Analiz
            </p>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={getCosmicRadarQrUrl(72)}
            alt=""
            width={72}
            height={72}
            className="rounded-lg border border-amber-400/20"
          />
        </div>

        <p className="relative mt-5 text-[10px] uppercase tracking-[0.18em] text-white/40">
          {payload.weekLabel}
        </p>
        <p className="relative mt-2 text-xs text-amber-200/75">
          {glyph} {payload.sign}
        </p>

        <p className="relative mt-6 text-[10px] uppercase tracking-[0.22em] text-amber-400/65">
          {payload.cardTitle}
        </p>
        <p className="relative mt-3 flex-1 whitespace-pre-wrap text-sm leading-relaxed text-white/78">
          {payload.cardBody}
        </p>

        <p className="relative mt-auto pt-4 text-[9px] uppercase tracking-[0.28em] text-white/25">
          kişisel astroloji pusulası · astrotag
        </p>
      </div>
    );
  }
);

export default CosmicRadarShareCard;
