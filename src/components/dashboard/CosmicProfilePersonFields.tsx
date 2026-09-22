"use client";

import { noirLabelClass } from "@/lib/theme/noir-tokens";
import type { CosmicProfilePersonInput } from "@/lib/cosmic-profile/types";

const FIELD_INPUT_CLASS =
  "mt-1 w-full rounded-sm border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-stone-300 outline-none transition placeholder:text-stone-500 focus:border-zinc-600";

interface CosmicProfilePersonFieldsProps {
  title: string;
  hint?: string;
  value: CosmicProfilePersonInput;
  onChange: (next: CosmicProfilePersonInput) => void;
  idPrefix: string;
  autoFocusName?: boolean;
}

export default function CosmicProfilePersonFields({
  title,
  hint,
  value,
  onChange,
  idPrefix,
  autoFocusName = false,
}: CosmicProfilePersonFieldsProps) {
  return (
    <div className="rounded-sm border border-zinc-800 bg-zinc-950 p-3 sm:p-4">
      <div className="mb-3">
        <p className="text-sm font-medium text-stone-300">{title}</p>
        {hint ? <p className="mt-0.5 text-xs text-stone-500">{hint}</p> : null}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label htmlFor={`${idPrefix}-name`} className="block sm:col-span-2">
          <span className={noirLabelClass}>Ad</span>
          <input
            id={`${idPrefix}-name`}
            type="text"
            value={value.name}
            onChange={(event) => onChange({ ...value, name: event.target.value })}
            autoComplete="name"
            autoFocus={autoFocusName}
            className={FIELD_INPUT_CLASS}
          />
        </label>

        <label htmlFor={`${idPrefix}-birth-date`} className="block">
          <span className={noirLabelClass}>Doğum Tarihi</span>
          <input
            id={`${idPrefix}-birth-date`}
            type="date"
            value={value.birthDate}
            onChange={(event) => onChange({ ...value, birthDate: event.target.value })}
            className={FIELD_INPUT_CLASS}
          />
        </label>

        <label htmlFor={`${idPrefix}-birth-time`} className="block">
          <span className={noirLabelClass}>Doğum Saati</span>
          <input
            id={`${idPrefix}-birth-time`}
            type="time"
            value={value.birthTime}
            onChange={(event) => onChange({ ...value, birthTime: event.target.value })}
            className={FIELD_INPUT_CLASS}
          />
        </label>

        <label htmlFor={`${idPrefix}-birth-place`} className="block sm:col-span-2">
          <span className={noirLabelClass}>Doğum Yeri</span>
          <input
            id={`${idPrefix}-birth-place`}
            type="text"
            value={value.birthPlace}
            onChange={(event) => onChange({ ...value, birthPlace: event.target.value })}
            placeholder="Örn: İstanbul, Türkiye"
            className={FIELD_INPUT_CLASS}
          />
        </label>
      </div>
    </div>
  );
}
