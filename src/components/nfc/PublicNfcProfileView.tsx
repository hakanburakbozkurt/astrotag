"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import type { PublicNfcProfile } from "@/types/public-profile";
import { DASHBOARD_PATH } from "@/lib/nfc/constants";
import { cardEntryPathForUniqueId } from "@/lib/nfc/card-paths";

type PublicNfcProfileViewProps = {
  profile: PublicNfcProfile;
};

function formatDate(value: string | null): string | null {
  if (!value?.trim()) {
    return null;
  }
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) {
    return value;
  }
  return d.toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function PublicNfcProfileView({ profile }: PublicNfcProfileViewProps) {
  const birthDate = formatDate(profile.birthDate);
  const hasBirthDetails =
    Boolean(birthDate) ||
    Boolean(profile.birthPlace?.trim()) ||
    Boolean(profile.relationshipStatus?.trim());

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-md"
    >
      <div className="rounded-[28px] border border-white/10 bg-[#0f172a]/85 p-8 backdrop-blur-2xl">
        <p className="text-center font-mono text-[10px] uppercase tracking-[0.32em] text-amber-400/70">
          AstroTag · NFC
        </p>
        <h1 className="mt-3 text-center text-2xl font-bold tracking-tight text-white sm:text-3xl">
          {profile.name}
        </h1>

        {hasBirthDetails ? (
          <dl className="mt-8 space-y-4 text-sm">
            {birthDate && (
              <div className="flex justify-between gap-4 border-b border-white/5 pb-3">
                <dt className="text-white/40">Doğum tarihi</dt>
                <dd className="text-right text-white/80">{birthDate}</dd>
              </div>
            )}
            {profile.birthPlace?.trim() && (
              <div className="flex justify-between gap-4 border-b border-white/5 pb-3">
                <dt className="text-white/40">Doğum yeri</dt>
                <dd className="text-right text-white/80">{profile.birthPlace}</dd>
              </div>
            )}
            {profile.relationshipStatus?.trim() && (
              <div className="flex justify-between gap-4 border-b border-white/5 pb-3">
                <dt className="text-white/40">İlişki</dt>
                <dd className="text-right text-white/80">
                  {profile.relationshipStatus}
                </dd>
              </div>
            )}
          </dl>
        ) : (
          <p className="mt-6 text-center text-sm leading-relaxed text-white/45">
            Kozmik profil henüz tamamlanmamış.
          </p>
        )}

        <p className="mt-8 text-center font-mono text-xs text-amber-400/80">
          Yıldız · {profile.starPoints}
        </p>
      </div>

      <div className="mt-6 flex flex-col gap-3">
        <Link
          href={DASHBOARD_PATH}
          className="flex h-11 items-center justify-center rounded-xl border border-amber-400/35 bg-amber-500/15 text-xs font-medium uppercase tracking-widest text-amber-100 transition hover:bg-amber-500/25"
        >
          Yönetim paneli
        </Link>
        <Link
          href={cardEntryPathForUniqueId(profile.uniqueId)}
          className="flex h-11 items-center justify-center rounded-xl border border-white/15 text-xs uppercase tracking-widest text-white/55 transition hover:border-white/30"
        >
          Giriş yap / kartı bağla
        </Link>
      </div>
    </motion.div>
  );
}
