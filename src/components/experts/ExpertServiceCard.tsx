"use client";

import type { ExpertServiceRow } from "@/lib/experts/experts.server";
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
  return (
    <article className="overflow-hidden rounded-sm border border-zinc-800 bg-[#09090b]">
      <div className="flex flex-col sm:flex-row">
        <div className="relative aspect-[16/10] w-full shrink-0 bg-zinc-900 sm:aspect-auto sm:h-auto sm:w-40 sm:min-h-[140px]">
          {service.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={service.imageUrl}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full min-h-[120px] items-center justify-center p-4">
              <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-700">
                Hizmet görseli
              </p>
            </div>
          )}
        </div>

        <div className="flex min-w-0 flex-1 flex-col justify-between gap-4 p-4">
          <div>
            <h3 className="font-serif text-base text-zinc-100">{service.name}</h3>
            {service.description ? (
              <p className="mt-2 text-sm leading-relaxed text-zinc-500">
                {service.description}
              </p>
            ) : null}
            <p className="mt-3 text-xs text-zinc-600">{service.durationMinutes} dk</p>
          </div>

          <div className="flex items-end justify-between gap-3">
            <p className="font-mono text-sm text-zinc-300">
              {formatCrystalPriceLabel(service.crystalPrice)}
            </p>
            <button
              type="button"
              disabled={disabled || busy}
              onClick={onPurchase}
              className="shrink-0 rounded-sm border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-[11px] uppercase tracking-wider text-zinc-200 disabled:opacity-50"
            >
              {busy ? "…" : "Hizmeti Al"}
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
