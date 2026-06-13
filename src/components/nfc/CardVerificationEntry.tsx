import Link from "next/link";
import AuthMobileShell from "@/components/auth/AuthMobileShell";
import CardVerificationForm from "@/components/nfc/CardVerificationForm";
import { nfcCardValidationErrorMessage } from "@/lib/nfc/card-validation-messages";
import { HOME_PATH, NFC_CARD_INACTIVE_MESSAGE } from "@/lib/nfc/constants";
import type { NfcCardAuthLookupResult } from "@/lib/nfc/session.server";

type CardVerificationEntryProps = {
  uniqueId: string;
  cardLookup: NfcCardAuthLookupResult | "fetch_error";
  idleExpired?: boolean;
};

/** Kart varlığı / aktiflik kontrolü — uyarılar bu katmanda gösterilir. */
export default function CardVerificationEntry({
  uniqueId,
  cardLookup,
  idleExpired = false,
}: CardVerificationEntryProps) {
  if (cardLookup === "fetch_error") {
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

  const card = cardLookup;

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
      title="Şifreni Gir"
      subtitle={
        idleExpired
          ? "20 dakika hareketsiz kaldınız. Devam etmek için PIN kodunuzu girin."
          : "Devam etmek için PIN kodunuzu girin."
      }
    >
      <section className="auth-glass-card w-full p-6 sm:p-8">
        <CardVerificationForm uniqueId={uniqueId} />
      </section>
    </AuthMobileShell>
  );
}
