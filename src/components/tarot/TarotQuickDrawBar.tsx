"use client";

import { memo } from "react";
import { TAROT_SPREAD_SIZE } from "@/lib/constants/cosmic";
import { noirPrimaryButtonClass, noirSecondaryButtonClass } from "@/lib/theme/noir-tokens";

interface TarotQuickDrawBarProps {
  onQuickDraw: () => void;
  onToggleManual: () => void;
  manualOpen: boolean;
  disabled: boolean;
  busy: boolean;
}

function TarotQuickDrawBarInner({
  onQuickDraw,
  onToggleManual,
  manualOpen,
  disabled,
  busy,
}: TarotQuickDrawBarProps) {
  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={onQuickDraw}
        disabled={disabled || busy}
        className={`${noirPrimaryButtonClass} border-zinc-600 text-base font-medium`}
      >
        {busy ? "Kozmik enerji hizalanıyor…" : "Kozmik Rastgele Çek"}
      </button>
      <p className="text-center text-[11px] text-stone-500">
        Anlık çekim — deste senin yerine {TAROT_SPREAD_SIZE} kart seçer ve yorumu başlatır.
      </p>
      <button
        type="button"
        onClick={onToggleManual}
        disabled={busy}
        className={`${noirSecondaryButtonClass} text-xs`}
      >
        {manualOpen ? "Manuel seçimi gizle" : "Manuel kart seçimi"}
      </button>
    </div>
  );
}

export default memo(TarotQuickDrawBarInner);
