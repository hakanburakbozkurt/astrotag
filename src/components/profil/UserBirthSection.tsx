"use client";

import Link from "next/link";
import { memo } from "react";
import { motion } from "framer-motion";
import { PROFILE_SETUP_PATH } from "@/lib/nfc/constants";
import { Colors } from "@/lib/navigation/dashboard-colors";
import type { UserData } from "@/types/user";

interface UserBirthSectionProps {
  user: UserData;
}

function UserBirthSectionInner({ user }: UserBirthSectionProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`${Colors.card} p-5`}
    >
      <p className="text-xs text-stone-500">Doğum Bilgileriniz</p>
      <dl className="mt-4 space-y-3 text-sm">
        <div>
          <dt className="text-xs text-stone-500">Ad Soyad</dt>
          <dd className="mt-1 text-stone-300">{user.name}</dd>
        </div>
        <div>
          <dt className="text-xs text-stone-500">Doğum Tarihi</dt>
          <dd className="mt-1 text-stone-300">{user.birthDate}</dd>
        </div>
        <div>
          <dt className="text-xs text-stone-500">Doğum Saati</dt>
          <dd className="mt-1 text-stone-300">{user.birthTime}</dd>
        </div>
        <div>
          <dt className="text-xs text-stone-500">Doğum Yeri</dt>
          <dd className="mt-1 text-stone-300">{user.birthPlace}</dd>
        </div>
      </dl>
      <Link
        href={`${PROFILE_SETUP_PATH}?mode=edit`}
        className="mt-5 inline-flex min-h-10 w-full items-center justify-center rounded-sm border border-zinc-700 px-4 text-sm text-stone-300 transition hover:border-zinc-500 hover:text-white"
      >
        Bilgileri Düzenle
      </Link>
    </motion.section>
  );
}

export default memo(UserBirthSectionInner);
