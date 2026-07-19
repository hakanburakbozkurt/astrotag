"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Award, Compass, Eye, Lock, Sparkles, Star } from "lucide-react";
import {
  getUserBadgeProgress,
  type BadgeIconId,
  type BadgeProgressItem,
  type UserBadgeProgress,
} from "@/lib/actions/badges";

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
      <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.08]">
        <motion.div
          initial={animate ? { width: 0 } : false}
          animate={{ width: `${badge.progressPercent}%` }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
          className={`h-full rounded-full ${
            badge.earned
              ? "bg-gradient-to-r from-amber-500 via-amber-300 to-amber-100"
              : "bg-gradient-to-r from-amber-600/70 to-amber-400/50"
          }`}
        />
      </div>
      <p className="mt-2 text-center text-[10px] leading-snug text-white/45">
        {badge.earned ? (
          <span className="text-emerald-300/80">Kazanıldı · +{badge.starReward} yıldız</span>
        ) : (
          <>
            <span className="text-amber-200/75">{badge.remaining} analiz</span> kaldı
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
      className={`relative flex flex-col items-center rounded-2xl border px-4 py-5 text-center ${
        badge.earned
          ? "border-amber-400/30 bg-gradient-to-b from-amber-400/[0.12] to-[#0f172a]/40 shadow-[0_0_32px_rgba(251,191,36,0.12)]"
          : "border-white/[0.08] bg-white/[0.02]"
      }`}
    >
      {badge.earned ? (
        <motion.span
          aria-hidden
          animate={{ opacity: [0.35, 0.7, 0.35] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
          className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-amber-400/20"
        />
      ) : null}

      <div className="relative">
        <motion.div
          animate={
            badge.earned
              ? {
                  boxShadow: [
                    "0 0 18px rgba(251,191,36,0.25)",
                    "0 0 28px rgba(251,191,36,0.45)",
                    "0 0 18px rgba(251,191,36,0.25)",
                  ],
                }
              : { boxShadow: "0 0 0 rgba(0,0,0,0)" }
          }
          transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
          className={`flex h-16 w-16 items-center justify-center rounded-full border ${
            badge.earned
              ? "border-amber-400/40 bg-amber-400/15 text-amber-100"
              : "border-white/10 bg-white/[0.03] text-white/25"
          }`}
        >
          {badge.earned ? (
            <BadgeIcon icon={badge.icon} className="h-7 w-7" />
          ) : (
            <div className="relative">
              <BadgeIcon icon={badge.icon} className="h-7 w-7 opacity-35 grayscale" />
              <Lock
                className="absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full bg-[#0f172a] p-0.5 text-white/45"
                aria-hidden
              />
            </div>
          )}
        </motion.div>
      </div>

      <p
        className={`mt-4 text-sm font-semibold tracking-tight ${
          badge.earned ? "text-amber-50" : "text-white/55"
        }`}
      >
        {badge.name}
      </p>

      <p className="mt-1 line-clamp-2 min-h-[2.5rem] text-[11px] leading-relaxed text-white/40">
        {badge.description}
      </p>

      <p className="mt-2 inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.16em] text-white/30">
        <Star className="h-3 w-3 text-amber-400/50" aria-hidden />+{badge.starReward}
      </p>

      <BadgeProgressBar badge={badge} animate />
    </motion.li>
  );
}

export default function AchievementsSection() {
  const [progress, setProgress] = useState<UserBadgeProgress | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadProgress = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getUserBadgeProgress();
      setProgress(data);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProgress();
  }, [loadProgress]);

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-[28px] border border-white/10 bg-[#0f172a]/80 p-5 backdrop-blur-2xl sm:p-6"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-[0.3em] text-amber-400/70">
            Rozetlerim
          </p>
          <p className="mt-2 text-xs leading-relaxed text-white/45">
            Geri bildirimlerinle kozmik rozetleri aç, hediye yıldızlar kazan.
          </p>
        </div>
        <Award className="h-5 w-5 shrink-0 text-amber-400/60" aria-hidden />
      </div>

      {isLoading ? (
        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="h-52 animate-pulse rounded-2xl bg-white/[0.04]"
            />
          ))}
        </div>
      ) : progress ? (
        <>
          <div className="mt-5 rounded-xl border border-amber-400/15 bg-gradient-to-r from-amber-400/[0.06] to-transparent px-4 py-3">
            <p className="text-[10px] uppercase tracking-[0.2em] text-amber-400/60">
              Kozmik İlerleme
            </p>
            <p className="mt-1 text-sm font-medium text-white/88">
              {progress.feedbackCount} geri bildirim tamamlandı
            </p>
            {progress.nextBadge ? (
              <p className="mt-1.5 text-xs text-amber-200/75">
                <span className="font-medium">{progress.nextBadge.name}</span> rozetine{" "}
                {progress.nextBadge.remaining} analiz kaldı!
              </p>
            ) : (
              <p className="mt-1.5 text-xs text-emerald-300/75">
                Tüm rozetler açıldı — Bilge seviyesindesin.
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
        <p className="mt-5 text-sm text-white/45">Rozet bilgisi yüklenemedi.</p>
      )}
    </motion.section>
  );
}
