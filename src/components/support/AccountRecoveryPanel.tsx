"use client";

import WhatsAppRecoveryLink from "@/components/support/WhatsAppRecoveryLink";

type AccountRecoveryPanelProps = {
  uniqueId?: string;
  expertCode?: string;
};

/** E-posta şifre sıfırlama kaldırıldı — yalnızca WhatsApp destek hattı */
export default function AccountRecoveryPanel({
  uniqueId,
  expertCode,
}: AccountRecoveryPanelProps) {
  const context = expertCode
    ? { kind: "expert" as const, expertCode }
    : uniqueId
      ? { kind: "nfc" as const, uniqueId }
      : null;

  return (
    <div className="rounded-xl border border-emerald-400/20 bg-emerald-950/20 px-4 py-4">
      <p className="text-[10px] uppercase tracking-[0.2em] text-emerald-300/80">
        PIN / Şifre Sıfırlama
      </p>
      <p className="mt-2 text-sm leading-relaxed text-white/55">
        Hesap kurtarma e-posta ile yapılmaz. Admin WhatsApp hattına yönlendirilirsiniz.
      </p>
      {context ? (
        <div className="mt-4">
          <WhatsAppRecoveryLink
            context={context}
            label="WhatsApp ile Sıfırlama Talebi Gönder"
            className="inline-flex min-h-10 w-full items-center justify-center rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-4 text-xs font-medium uppercase tracking-[0.14em] text-emerald-100 transition hover:bg-emerald-500/15"
          />
        </div>
      ) : (
        <p className="mt-3 text-xs text-white/35">
          NFC kartınızı okutun veya uzman giriş ekranından talep gönderin.
        </p>
      )}
    </div>
  );
}
