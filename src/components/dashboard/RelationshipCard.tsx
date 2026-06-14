"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import type { UserData } from "@/types/user";
import { hasPartnerFormData, partnerFormFromUserData } from "@/lib/partner-profile";
import { getPartnerProfile } from "@/lib/supabase-actions";

interface RelationshipCardProps {
  user: UserData;
}

const tapButtonClass =
  "inline-flex min-h-11 min-w-[44px] items-center justify-center rounded-xl border border-amber-400/35 bg-amber-400/10 px-5 py-3 text-sm font-medium text-amber-100 transition active:scale-[0.98] hover:bg-amber-400/20 sm:min-h-[44px]";

export default function RelationshipCard({ user }: RelationshipCardProps) {
  const initialPartner = partnerFormFromUserData(user);
  const [partnerName, setPartnerName] = useState(initialPartner.partnerName);
  const [hasPartner, setHasPartner] = useState(hasPartnerFormData(initialPartner));
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    void getPartnerProfile()
      .then((partner) => {
        if (!isMounted) return;
        setPartnerName(partner.partnerName);
        setHasPartner(hasPartnerFormData(partner));
      })
      .catch(() => {
        if (!isMounted) return;
        const fallback = partnerFormFromUserData(user);
        setPartnerName(fallback.partnerName);
        setHasPartner(hasPartnerFormData(fallback));
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [
    user.partnerName,
    user.partnerBirthDate,
    user.partnerBirthTime,
    user.partnerBirthPlace,
  ]);

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: 0.05 }}
      className="mb-6 w-full rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-xl sm:mb-8 sm:p-5"
      aria-label="Kozmik ilişki kartı"
    >
      <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-amber-400/70">
        Kozmik İlişki
      </p>

      {isLoading ? (
        <p className="mt-3 text-sm text-white/45">Partner bilgisi kontrol ediliyor...</p>
      ) : hasPartner ? (
        <div className="mt-3 flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 flex-1">
            <p className="text-base font-semibold leading-snug text-white sm:text-lg">
              Partner:{" "}
              <span className="text-amber-100">{partnerName}</span>
            </p>
            <p className="mt-1 text-xs leading-relaxed text-white/45 sm:text-sm">
              Synastry hub üzerinden günlük uyum skorunu görüntüleyin.
            </p>
          </div>

          <div className="flex w-full flex-col gap-2 sm:w-auto sm:shrink-0">
            <Link
              href="/dashboard/bonds"
              className={`${tapButtonClass} w-full text-center`}
            >
              Uyumluluk
            </Link>
            <Link
              href="/dashboard/profile"
              className={`${tapButtonClass} w-full border-white/15 bg-white/[0.03] text-center text-white/75`}
            >
              Düzenle
            </Link>
          </div>
        </div>
      ) : (
        <div className="mt-3 flex w-full flex-col gap-4">
          <p className="text-sm leading-relaxed text-white/70 sm:text-base">
            Partnerini Ekle ve Uyumluluk Analizine Başla
          </p>
          <Link
            href="/dashboard/profile"
            className={`${tapButtonClass} w-full text-center`}
          >
            Partner Ekle
          </Link>
        </div>
      )}
    </motion.section>
  );
}
