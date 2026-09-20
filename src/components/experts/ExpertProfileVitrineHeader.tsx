"use client";

import ExpertAvatar from "@/components/experts/ExpertAvatar";
import type { ExpertPublicProfile } from "@/lib/experts/experts.server";

type ExpertProfileVitrineHeaderProps = {
  expert: Pick<
    ExpertPublicProfile,
    | "displayName"
    | "title"
    | "tradition"
    | "experienceYears"
    | "avatarUrl"
    | "coverUrl"
  >;
};

export default function ExpertProfileVitrineHeader({
  expert,
}: ExpertProfileVitrineHeaderProps) {
  return (
    <header className="overflow-hidden rounded-sm border border-zinc-800 bg-[#09090b]">
      <div className="relative h-28 w-full sm:h-32">
        {expert.coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={expert.coverUrl}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="h-full w-full bg-zinc-900/80" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#09090b] via-[#09090b]/30 to-transparent" />
      </div>

      <div className="px-4 pb-5 sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:gap-5">
          <div className="-mt-10 shrink-0 sm:-mt-12">
            <div className="rounded-full border-4 border-[#09090b] bg-[#09090b]">
              <ExpertAvatar
                avatarUrl={expert.avatarUrl}
                displayName={expert.displayName}
                size="profile"
                ring={false}
              />
            </div>
          </div>

          <div className="min-w-0 flex-1 space-y-1 sm:pb-0.5">
            <p className="text-[10px] uppercase tracking-[0.28em] text-zinc-600">
              {expert.tradition}
            </p>
            <h2 className="font-serif text-xl text-zinc-100 sm:text-2xl">
              {expert.displayName}
            </h2>
            <p className="text-sm text-zinc-500">{expert.title}</p>
            <p className="text-xs text-zinc-600">
              {expert.experienceYears} yıl deneyim
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
