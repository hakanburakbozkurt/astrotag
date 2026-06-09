import Link from "next/link";
import AuthMobileShell from "@/components/auth/AuthMobileShell";
import CardVerificationForm from "@/components/nfc/CardVerificationForm";
import { nfcCardValidationErrorMessage } from "@/lib/nfc/card-validation-messages";
import { HOME_PATH, NFC_CARD_INACTIVE_MESSAGE } from "@/lib/nfc/constants";
import { logNfcEvent } from "@/lib/nfc/error-logger";
import { resolveNfcCardForAuth } from "@/lib/nfc/session.server";

type CardVerificationEntryProps = {
  uniqueId: string;
};

/** Kart varlığı / aktiflik kontrolü — uyarılar bu katmanda gösterilir. */
export default async function CardVerificationEntry({
  uniqueId,
}: CardVerificationEntryProps) {
  let card;

  try {
    card = await resolveNfcCardForAuth(uniqueId);
  } catch (error) {
    logNfcEvent(
      "error",
      { layer: "action", handler: "CardVerificationEntry" },
      "resolveNfcCardForAuth başarısız",
      {
        uniqueId,
        message: error instanceof Error ? error.message : String(error),
      }
    );

    return (
      <AuthMobileShell
        title="Bağlantı hatası"
        subtitle="Kart bilgisi alınamadı. Lütfen bir süre sonra tekrar deneyin."
      >
        <Link
          href={HOME_PATH}
          className="flex min-h-[48px] w-full items-center justify-center rounded-2xl border border-white/15 text-xs uppercase tracking-widest text-white/60"
        >
          Ana sayfa
        </Link>
      </AuthMobileShell>
    );
  }

  if (!card.ok) {
    return (
      <AuthMobileShell
        title="Kart bulunamadı"
        subtitle={nfcCardValidationErrorMessage(card.reason)}
      >
        <Link
          href={HOME_PATH}
          className="flex min-h-[48px] w-full items-center justify-center rounded-2xl border border-white/15 text-xs uppercase tracking-widest text-white/60"
        >
          Ana sayfa
        </Link>
      </AuthMobileShell>
    );
  }

  if (!card.isActive) {
    return (
      <AuthMobileShell
        title="Kart Aktif Değil"
        subtitle={NFC_CARD_INACTIVE_MESSAGE}
      >
        <Link
          href={HOME_PATH}
          className="flex min-h-[48px] w-full items-center justify-center rounded-2xl border border-white/15 text-xs uppercase tracking-widest text-white/60"
        >
          Ana sayfa
        </Link>
      </AuthMobileShell>
    );
  }

  return (
    <AuthMobileShell
      title="Doğrulama"
      subtitle="Devam etmek için PIN kodunuzu girin."
    >
      <div className="rounded-[28px] border border-white/10 bg-[#0f172a]/90 p-6 backdrop-blur-xl sm:p-8">
        <CardVerificationForm uniqueId={uniqueId} />
      </div>
    </AuthMobileShell>
  );
}
