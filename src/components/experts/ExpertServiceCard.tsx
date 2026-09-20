"use client";

import type { ExpertServiceRow } from "@/lib/experts/experts.server";
import { resolveServiceDisplayImage } from "@/lib/experts/service-display.shared";
import { formatCrystalPriceLabel } from "@/lib/payments/commission.shared";

type ExpertServiceCardProps = {
  service: ExpertServiceRow;
  disabled?: boolean;
  busy?: boolean;
  className?: string;
  onPurchase: () => void;
};

export default function ExpertServiceCard({
  service,
  disabled,
  busy,
  className = "",
  onPurchase,
}: ExpertServiceCardProps) {
  const displayImage = resolveServiceDisplayImage(service);

  return (
    <article
      className={`relative w-full overflow-hidden rounded-sm border border-zinc-800 bg-[#09090b] ${className}`}
      style={{ aspectRatio: "9 / 16" }}
    >
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

      <div className="absolute inset-0 bg-gradient-to-t from-[#09090b] via-[#09090b]/80 to-[#09090b]/25" />

      <div className="relative flex h-full min-h-0 flex-col justify-end p-3.5 sm:p-4">
        {service.categoryTitle ? (
          <p className="text-[10px] uppercase tracking-[0.22em] text-zinc-500">
            {service.categoryTitle}
          </p>
        ) : null}

        <h3 className="mt-1.5 font-serif text-base leading-tight text-zinc-100 sm:text-lg">
          {service.name}
        </h3>

        {service.description ? (
          <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-zinc-400 sm:line-clamp-3 sm:text-sm">
            {service.description}
          </p>
        ) : null}

        <p className="mt-2 text-[11px] text-zinc-600">{service.durationMinutes} dk</p>

        <div className="mt-3 flex items-end justify-between gap-2 border-t border-zinc-800/80 pt-3">
          <p className="min-w-0 font-mono text-[11px] leading-snug text-zinc-200 sm:text-xs">
            {formatCrystalPriceLabel(service.crystalPrice)}
          </p>
          <button
            type="button"
            disabled={disabled || busy}
            onClick={onPurchase}
            className="shrink-0 rounded-sm border border-zinc-700 bg-zinc-900/95 px-2.5 py-1.5 text-[10px] uppercase tracking-wider text-zinc-200 disabled:opacity-50 sm:px-3 sm:text-[11px]"
          >
            {busy ? "…" : "Hizmeti Al"}
          </button>
        </div>
      </div>
    </article>
  );
}
