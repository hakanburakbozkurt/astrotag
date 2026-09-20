"use client";

import type { ExpertServiceRow } from "@/lib/experts/experts.server";
import { resolveServiceDisplayImage } from "@/lib/experts/service-display.shared";
import { formatCrystalPriceLabel } from "@/lib/payments/commission.shared";

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
  const displayImage = resolveServiceDisplayImage(service);

  return (
    <article className="relative aspect-[9/16] overflow-hidden rounded-sm border border-zinc-800 bg-[#09090b]">
      {displayImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={displayImage}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 bg-zinc-900" />
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-[#09090b] via-[#09090b]/75 to-[#09090b]/20" />

      <div className="relative flex h-full flex-col justify-end p-4">
        {service.categoryTitle ? (
          <p className="text-[10px] uppercase tracking-[0.22em] text-zinc-500">
            {service.categoryTitle}
          </p>
        ) : null}

        <h3 className="mt-2 font-serif text-lg leading-tight text-zinc-100">
          {service.name}
        </h3>

        {service.description ? (
          <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-zinc-400">
            {service.description}
          </p>
        ) : null}

        <p className="mt-3 text-xs text-zinc-500">{service.durationMinutes} dk</p>

        <div className="mt-4 flex items-end justify-between gap-3 border-t border-zinc-800/80 pt-3">
          <p className="font-mono text-sm text-zinc-200">
            {formatCrystalPriceLabel(service.crystalPrice)}
          </p>
          <button
            type="button"
            disabled={disabled || busy}
            onClick={onPurchase}
            className="shrink-0 rounded-sm border border-zinc-700 bg-zinc-900/90 px-3 py-1.5 text-[11px] uppercase tracking-wider text-zinc-200 disabled:opacity-50"
          >
            {busy ? "…" : "Hizmeti Al"}
          </button>
        </div>
      </div>
    </article>
  );
}
