"use client";

import type { ExpertServiceRow } from "@/lib/experts/experts.server";

type ExpertServiceCardProps = {
  service: ExpertServiceRow;
  disabled?: boolean;
  busy?: boolean;
  onPurchase: () => void;
};

export default function ExpertServiceCard({
  service,
  disabled,
  busy,
  onPurchase,
}: ExpertServiceCardProps) {
  return (
    <article className="rounded-sm border border-zinc-800 bg-[#09090b] p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h3 className="font-serif text-base text-zinc-100">{service.name}</h3>
          {service.description ? (
            <p className="mt-2 text-sm leading-relaxed text-zinc-500">
              {service.description}
            </p>
          ) : null}
          <p className="mt-3 text-xs text-zinc-600">{service.durationMinutes} dk</p>
        </div>
        <div className="shrink-0 text-right">
          <p className="font-mono text-sm text-zinc-300">
            {service.crystalPrice}
            <span className="ml-1 text-zinc-600">kristal</span>
          </p>
          <button
            type="button"
            disabled={disabled || busy}
            onClick={onPurchase}
            className="mt-3 rounded-sm border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-[11px] uppercase tracking-wider text-zinc-200 disabled:opacity-50"
          >
            {busy ? "…" : "Hizmeti Al"}
          </button>
        </div>
      </div>
    </article>
  );
}
