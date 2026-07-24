"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { nfcLoginPathForUniqueId } from "@/lib/nfc/card-paths";
import { NFC_CARD_PIN_REQUIRED_MESSAGE } from "@/lib/nfc/constants";

type PublicNfcProfileViewProps = {
  uniqueId: string;
  displayName?: string;
};

/** @deprecated /p/ rotası NfcCardPinGate kullanır — geriye dönük minimal görünüm */
export default function PublicNfcProfileView({
  uniqueId,
  displayName = "AstroTag",
}: PublicNfcProfileViewProps) {
  const pinHref = nfcLoginPathForUniqueId(uniqueId);

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
          {displayName}
        </h1>
        <p className="mt-6 text-center text-sm leading-relaxed text-white/45">
          {NFC_CARD_PIN_REQUIRED_MESSAGE}
        </p>
      </div>

      <div className="mt-6 flex flex-col gap-3">
        <Link
          href={pinHref}
          className="flex h-11 items-center justify-center rounded-xl border border-amber-400/35 bg-amber-500/15 text-xs font-medium uppercase tracking-widest text-amber-100 transition hover:bg-amber-500/25"
        >
          PIN ile Giriş Yap
        </Link>
      </div>
    </motion.div>
  );
}
