import Link from "next/link";
import { motion } from "framer-motion";
import { cardEntryPathForUniqueId, nfcLoginPathForUniqueId } from "@/lib/nfc/card-paths";
import { NFC_CARD_PIN_REQUIRED_MESSAGE } from "@/lib/nfc/constants";
import type { NfcScanAccessDeniedReason } from "@/lib/nfc/nfc-scan-access.server";

type NfcCardPinGateProps = {
  uniqueId: string;
  reason?: NfcScanAccessDeniedReason;
  message?: string;
};

function reasonHint(reason?: NfcScanAccessDeniedReason): string | null {
  if (reason === "session_mismatch") {
    return "Bu tarayıcıda başka bir hesap oturumu açıktı. Kart sahibinin PIN kodu ile giriş yapın.";
  }

  if (reason === "persistence_expired") {
    return "Oturum süreniz doldu. Devam etmek için PIN kodunuzu girin.";
  }

  return null;
}

export default function NfcCardPinGate({
  uniqueId,
  reason,
  message = NFC_CARD_PIN_REQUIRED_MESSAGE,
}: NfcCardPinGateProps) {
  const pinHref = nfcLoginPathForUniqueId(uniqueId);
  const hint = reasonHint(reason);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      className="w-full max-w-md text-center"
    >
      <div className="rounded-[28px] border border-amber-400/20 bg-[#0f172a]/90 p-8 backdrop-blur-2xl">
        <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-amber-400/70">
          Erişim Korumalı
        </p>
        <p className="mt-4 text-sm leading-relaxed text-amber-100/90">{message}</p>
        {hint ? (
          <p className="mt-3 text-xs leading-relaxed text-white/45">{hint}</p>
        ) : null}
        <p className="mt-4 font-mono text-[11px] text-white/30">{uniqueId}</p>
      </div>

      <div className="mt-6 flex flex-col gap-3">
        <Link
          href={pinHref}
          className="flex h-11 items-center justify-center rounded-xl border border-amber-400/35 bg-amber-500/15 text-xs font-medium uppercase tracking-widest text-amber-100 transition hover:bg-amber-500/25"
        >
          PIN ile Giriş Yap
        </Link>
        <Link
          href={cardEntryPathForUniqueId(uniqueId)}
          className="flex h-11 items-center justify-center rounded-xl border border-white/15 text-xs uppercase tracking-widest text-white/55 transition hover:border-white/30"
        >
          Kart giriş ekranı
        </Link>
      </div>
    </motion.div>
  );
}
