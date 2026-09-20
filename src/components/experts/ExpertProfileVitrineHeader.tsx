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
  >;
};

export default function ExpertProfileVitrineHeader({
  expert,
}: ExpertProfileVitrineHeaderProps) {
  return (
    <header className="rounded-sm border border-zinc-800 bg-[#09090b] p-5 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
        <ExpertAvatar
          avatarUrl={expert.avatarUrl}
          displayName={expert.displayName}
          size="profile"
          ring={false}
        />

        <div className="min-w-0 space-y-1">
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
    </header>
  );
}
