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
      <div className="relative aspect-[3/1] min-h-[132px] max-h-[220px] w-full bg-zinc-900">
        {expert.coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={expert.coverUrl}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-end p-4">
            <p className="text-[10px] uppercase tracking-[0.24em] text-zinc-700">
              Kapak görseli
            </p>
          </div>
        )}
      </div>

      <div className="relative px-4 pb-5 sm:px-6">
        <div className="absolute -top-12 left-4 sm:-top-14 sm:left-6">
          <div className="rounded-full border-4 border-[#09090b] bg-[#09090b]">
            <ExpertAvatar
              avatarUrl={expert.avatarUrl}
              displayName={expert.displayName}
              size="profile"
              ring={false}
            />
          </div>
        </div>

        <div className="pt-14 sm:pt-16">
          <p className="text-[10px] uppercase tracking-[0.28em] text-zinc-600">
            {expert.tradition}
          </p>
          <h2 className="mt-2 font-serif text-xl text-zinc-100 sm:text-2xl">
            {expert.displayName}
          </h2>
          <p className="mt-1 text-sm text-zinc-500">{expert.title}</p>
          <p className="mt-2 text-xs text-zinc-600">
            {expert.experienceYears} yıl deneyim
          </p>
        </div>
      </div>
    </header>
  );
}
