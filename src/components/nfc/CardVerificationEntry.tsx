import Link from "next/link";
import AuthMobileShell from "@/components/auth/AuthMobileShell";
import CardVerificationForm from "@/components/nfc/CardVerificationForm";
import { nfcCardValidationErrorMessage } from "@/lib/nfc/card-validation-messages";
import { HOME_PATH, NFC_CARD_INACTIVE_MESSAGE } from "@/lib/nfc/constants";
import { validateNfcCardActive } from "@/lib/nfc/session.server";

type CardVerificationEntryProps = {
  uniqueId: string;
};

/** Kart aktif mi kontrol eder; aktifse doğum tarihi + PIN formunu gösterir. */
export default async function CardVerificationEntry({
  uniqueId,
}: CardVerificationEntryProps) {
  const card = await validateNfcCardActive(uniqueId);

  if (!card.ok) {
    const subtitle =
      card.reason === "inactive"
        ? NFC_CARD_INACTIVE_MESSAGE
        : nfcCardValidationErrorMessage(card.reason);

    return (
      <AuthMobileShell title="Erişim engellendi" subtitle={subtitle}>
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
      subtitle="Devam etmek için doğum tarihinizi ve PIN kodunuzu girin."
    >
      <div className="rounded-[28px] border border-white/10 bg-[#0f172a]/90 p-6 backdrop-blur-xl sm:p-8">
        <CardVerificationForm uniqueId={uniqueId} />
      </div>
    </AuthMobileShell>
  );
}
