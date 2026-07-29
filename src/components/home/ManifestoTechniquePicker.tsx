"use client";

import { CalendarDays, Hash, PenLine, Zap } from "lucide-react";
import {
  MANIFESTO_TECHNIQUES,
  type ManifestoTechniqueId,
} from "@/lib/manifesto/types";

const TECHNIQUE_ICONS = {
  calendar: CalendarDays,
  pen: PenLine,
  zap: Zap,
  hash: Hash,
} as const;

const ACCENT_STYLES = {
  violet: {
    ring: "ring-violet-400/40",
    border: "border-violet-400/35",
    bg: "bg-violet-500/12",
    icon: "text-violet-200",
    label: "text-violet-100",
  },
  amber: {
    ring: "ring-amber-400/40",
    border: "border-amber-400/35",
    bg: "bg-amber-500/12",
    icon: "text-amber-200",
    label: "text-amber-100",
  },
  cyan: {
    ring: "ring-cyan-400/40",
    border: "border-cyan-400/35",
    bg: "bg-cyan-500/12",
    icon: "text-cyan-200",
    label: "text-cyan-100",
  },
  rose: {
    ring: "ring-rose-400/40",
    border: "border-rose-400/35",
    bg: "bg-rose-500/12",
    icon: "text-rose-200",
    label: "text-rose-100",
  },
} as const;

type ManifestoTechniquePickerProps = {
  value: ManifestoTechniqueId;
  onChange: (value: ManifestoTechniqueId) => void;
  disabled?: boolean;
};

export default function ManifestoTechniquePicker({
  value,
  onChange,
  disabled = false,
}: ManifestoTechniquePickerProps) {
  return (
    <div
      role="radiogroup"
      aria-label="Manifesto tekniği seç"
      className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2"
    >
      {MANIFESTO_TECHNIQUES.map((technique) => {
        const Icon = TECHNIQUE_ICONS[technique.icon];
        const accent = ACCENT_STYLES[technique.accent];
        const selected = value === technique.id;

        return (
          <button
            key={technique.id}
            type="button"
            role="radio"
            aria-checked={selected}
            disabled={disabled}
            onClick={() => onChange(technique.id)}
            className={`group flex items-start gap-3 rounded-xl border p-3 text-left transition disabled:opacity-50 ${
              selected
                ? `${accent.border} ${accent.bg} ring-1 ${accent.ring}`
                : "border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]"
            }`}
          >
            <span
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border ${
                selected ? accent.border : "border-white/10"
              } ${selected ? accent.bg : "bg-white/[0.03]"}`}
            >
              <Icon
                className={`h-4 w-4 ${selected ? accent.icon : "text-white/55"}`}
                aria-hidden="true"
              />
            </span>
            <span className="min-w-0 flex-1">
              <span
                className={`block text-sm font-medium ${
                  selected ? accent.label : "text-white/90"
                }`}
              >
                {technique.label}
              </span>
              <span className="mt-0.5 block text-[11px] leading-relaxed text-white/40">
                {technique.maxDays} gün · {technique.hint}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
