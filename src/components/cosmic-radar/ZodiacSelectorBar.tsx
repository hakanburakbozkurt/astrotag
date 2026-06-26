"use client";

import { ZODIAC_SIGNS } from "@/lib/astrology/zodiac";
import type { ZodiacSign } from "@/lib/astrology/zodiac-signs";
import { ZODIAC_GLYPHS } from "@/lib/astrology/zodiac-signs";

interface ZodiacSelectorBarProps {
  selected: ZodiacSign;
  onSelect: (sign: ZodiacSign) => void;
}

export default function ZodiacSelectorBar({
  selected,
  onSelect,
}: ZodiacSelectorBarProps) {
  return (
    <div className="relative -mx-1">
      <div className="flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {ZODIAC_SIGNS.map((sign) => {
          const active = sign === selected;
          return (
            <button
              key={sign}
              type="button"
              aria-pressed={active}
              onClick={() => onSelect(sign)}
              className={`flex shrink-0 flex-col items-center gap-1 rounded-xl border px-2.5 py-2 transition sm:px-3 ${
                active
                  ? "border-amber-400/40 bg-amber-400/15 text-amber-100 shadow-[0_0_16px_rgba(251,191,36,0.12)]"
                  : "border-white/10 bg-white/[0.03] text-white/50 hover:border-white/20 hover:text-white/75"
              }`}
            >
              <span className="text-lg leading-none">{ZODIAC_GLYPHS[sign]}</span>
              <span className="text-[9px] uppercase tracking-[0.12em]">
                {sign}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
