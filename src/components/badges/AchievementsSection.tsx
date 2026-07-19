"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Award, Compass, Eye, Lock, Sparkles } from "lucide-react";
import {
  getUserBadgeProgress,
  type BadgeIconId,
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
            Analiz geri bildirimleriyle kozmik rozetler ve hediye yıldızlar kazan.
          </p>
        </div>
        <Award className="h-5 w-5 shrink-0 text-amber-400/60" aria-hidden />
      </div>

      {isLoading ? (
        <div className="mt-5 space-y-3">
          <div className="h-16 animate-pulse rounded-xl bg-white/[0.04]" />
          <div className="h-16 animate-pulse rounded-xl bg-white/[0.04]" />
        </div>
      ) : progress ? (
        <>
          <div className="mt-5 rounded-xl border border-amber-400/15 bg-amber-400/[0.05] px-4 py-3">
            <p className="text-[10px] uppercase tracking-[0.2em] text-amber-400/60">
              Geri Bildirim İlerlemesi
            </p>
            <p className="mt-1 text-sm font-medium text-white/85">
              {progress.feedbackCount} analiz geri bildirimi
            </p>
            {progress.nextBadge ? (
              <p className="mt-2 text-xs text-amber-200/75">
                <span className="font-medium">{progress.nextBadge.name}</span> rozetine{" "}
                {progress.nextBadge.remaining} analiz kaldı!
              </p>
            ) : (
              <p className="mt-2 text-xs text-emerald-300/75">
                Tüm rozetleri tamamladın — Bilge seviyesindesin.
              </p>
            )}
          </div>

          <ul className="mt-4 space-y-3">
            {progress.badges.map((badge) => (
              <li
                key={badge.id}
                className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${
                  badge.earned
                    ? "border-amber-400/25 bg-amber-400/[0.06]"
                    : "border-white/[0.08] bg-white/[0.02]"
                }`}
              >
                <div
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full border ${
                    badge.earned
                      ? "border-amber-400/30 bg-amber-400/10 text-amber-200"
                      : "border-white/10 bg-white/[0.03] text-white/30"
                  }`}
                >
                  {badge.earned ? (
                    <BadgeIcon icon={badge.icon} className="h-5 w-5" />
                  ) : (
                    <Lock className="h-4 w-4" aria-hidden />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium text-white/88">{badge.name}</p>
                    <span className="shrink-0 text-[10px] uppercase tracking-wider text-white/35">
                      {badge.threshold} fb
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs leading-relaxed text-white/45">
                    {badge.description}
                  </p>
                  {!badge.earned && badge.remaining !== undefined ? (
                    <p className="mt-1 text-[11px] text-amber-200/65">
                      {badge.remaining} analiz kaldı · +{badge.starReward} yıldız
                    </p>
                  ) : badge.earned ? (
                    <p className="mt-1 text-[11px] text-emerald-300/70">
                      Kazanıldı · +{badge.starReward} yıldız
                    </p>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <p className="mt-5 text-sm text-white/45">Rozet bilgisi yüklenemedi.</p>
      )}
    </motion.section>
  );
}
