"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { Award, Compass, Eye, Lock, Sparkles, Star } from "lucide-react";
import DataLoadingState from "@/components/ui/DataLoadingState";
import {
  getUserBadgeProgress,
  type BadgeProgressItem,
  type UserBadgeProgress,
} from "@/lib/actions/badges";
import type { BadgeIconId } from "@/lib/badges/badge-definitions";
import { SWR_KEYS } from "@/lib/auth/data-cache";
import { FEEDBACK_UPDATED_EVENT, BADGE_AWARDED_EVENT } from "@/lib/energy-events";
import { useQuery } from "@/hooks/useQuery";
import { compactSectionClass } from "@/components/navigation/compact-ui";

function BadgeIcon({ icon, className }: { icon: BadgeIconId; className?: string }) {
  switch (icon) {
    case "compass":
      return <Compass className={className} aria-hidden />;
    case "sparkles":
      return <Sparkles className={className} aria-hidden />;
    case "eye":
    default:
      return <Eye className={className} aria-hidden />;
  }
}

function BadgeProgressBar({
  badge,
  animate,
}: {
  badge: BadgeProgressItem;
  animate: boolean;
}) {
  return (
    <div className="mt-3 w-full">
      <div className="h-1.5 overflow-hidden rounded-sm bg-zinc-800">
        <motion.div
          initial={animate ? { width: 0 } : false}
          animate={{ width: `${badge.progressPercent}%` }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
          className={`h-full rounded-sm ${badge.earned ? "bg-stone-400" : "bg-zinc-600"}`}
        />
      </div>
      <p className="mt-2 text-center text-[10px] leading-snug text-stone-500">
            {badge.earned ? (
              <span className="text-stone-300">Kazanıldı · +{badge.starReward} yıldız</span>
            ) : (
              <>
                <span className="text-stone-300">{badge.remaining} geri bildirim</span> kaldı
              </>
            )}
      </p>
    </div>
  );
}

function BadgeGridCard({
  badge,
  index,
}: {
  badge: BadgeProgressItem;
  index: number;
}) {
  return (
    <motion.li
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.35 }}
      className={`relative flex flex-col items-center rounded-sm border px-4 py-5 text-center ${
        badge.earned
          ? "border-zinc-700 bg-zinc-900"
          : "border-zinc-800 bg-zinc-950"
      }`}
    >
      <div className="relative">
        <div
          className={`flex h-16 w-16 items-center justify-center rounded-full border ${
            badge.earned
              ? "border-zinc-600 bg-zinc-950 text-stone-300"
              : "border-zinc-800 bg-zinc-950 text-stone-600"
          }`}
        >
          {badge.earned ? (
            <BadgeIcon icon={badge.icon} className="h-7 w-7" />
          ) : (
            <div className="relative">
              <BadgeIcon icon={badge.icon} className="h-7 w-7 opacity-35 grayscale" />
              <Lock
                className="absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full bg-zinc-950 p-0.5 text-stone-500"
                aria-hidden
              />
            </div>
          )}
        </div>
      </div>

      <p
        className={`mt-4 text-sm font-medium tracking-tight ${
          badge.earned ? "text-stone-300" : "text-stone-500"
        }`}
      >
        {badge.name}
      </p>

      <p className="mt-1 line-clamp-2 min-h-[2.5rem] text-[11px] leading-relaxed text-stone-500">
        {badge.description}
      </p>

      <p className="mt-2 inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.16em] text-stone-500">
        <Star className="h-3 w-3 text-stone-300" aria-hidden />+{badge.starReward}
      </p>

      <BadgeProgressBar badge={badge} animate />
    </motion.li>
  );
}

export default function AchievementsSection() {
  const {
    data: progress,
    isPending,
    showError,
    mutate,
  } = useQuery<UserBadgeProgress | null>(SWR_KEYS.badgeProgress, getUserBadgeProgress);

  useEffect(() => {
    const refresh = () => {
      void mutate();
    };

    window.addEventListener(FEEDBACK_UPDATED_EVENT, refresh);
    window.addEventListener(BADGE_AWARDED_EVENT, refresh);
    return () => {
      window.removeEventListener(FEEDBACK_UPDATED_EVENT, refresh);
      window.removeEventListener(BADGE_AWARDED_EVENT, refresh);
    };
  }, [mutate]);

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`${compactSectionClass} w-full min-w-0 sm:p-6`}
    >
      <div className="flex w-full min-w-0 items-start justify-between gap-4">
        <div className="min-w-0 flex-1 whitespace-normal break-words">
          <p className="text-sm font-medium text-stone-300">Rozetlerim</p>
          <p className="mt-2 text-xs leading-relaxed text-stone-500">
            5, 10 ve 20. geri bildirimlerde rozet aç — milestone ödülleri yalnızca 4+ puanla.
          </p>
        </div>
        <Award className="mt-0.5 h-5 w-5 shrink-0 text-stone-400" aria-hidden />
      </div>

      {isPending ? (
        <DataLoadingState className="mt-5" />
      ) : progress ? (
        <>
          <div className="mt-5 rounded-sm border border-zinc-800 bg-zinc-950 px-4 py-3">
            <p className="text-xs text-stone-500">Kozmik İlerleme</p>
            <p className="mt-1 text-sm font-medium text-stone-300">
              {progress.feedbackCount} geri bildirim tamamlandı
            </p>
            {progress.nextBadge ? (
              <p className="mt-1.5 text-xs text-stone-300">
                {progress.nextBadge.name} rozetine{" "}
                {progress.nextBadge.remaining} geri bildirim kaldı!
              </p>
            ) : (
              <p className="mt-1.5 text-xs text-stone-300">
                Tüm rozetler açıldı — Yıldız Mimarı seviyesindesin.
              </p>
            )}
          </div>

          <ul className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {progress.badges.map((badge, index) => (
              <BadgeGridCard key={badge.id} badge={badge} index={index} />
            ))}
          </ul>
        </>
      ) : (
        <p className="mt-5 text-sm text-stone-500">
          {showError ? "Rozet bilgisi yüklenemedi." : "Rozet bilgisi bulunamadı."}
        </p>
      )}
    </motion.section>
  );
}
