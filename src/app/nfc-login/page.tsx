import Link from "next/link";
import { redirect } from "next/navigation";
import AuthMobileShell from "@/components/auth/AuthMobileShell";
import CardVerificationEntry from "@/components/nfc/CardVerificationEntry";
import NfcSmartEntryGate from "@/components/nfc/NfcSmartEntryGate";
import { HOME_PATH } from "@/lib/nfc/constants";
import { resolveSmartNfcEntryRedirect } from "@/lib/nfc/nfc-smart-entry.server";
import { getNfcCardForAuthEntry } from "@/lib/nfc/session.server";
import { normalizeNfcUniqueId } from "@/lib/nfc/unique-id";

type PageProps = {
  searchParams: Promise<{ uid?: string; idle?: string }>;
};

export default async function NfcLoginPage({ searchParams }: PageProps) {
  const { uid: rawUid, idle } = await searchParams;
  const uniqueId = rawUid ? normalizeNfcUniqueId(rawUid) : "";
  const idleExpired = idle === "1";

  if (!uniqueId) {
    return (
      <AuthMobileShell
        title="NFC Giriş"
        subtitle="Oturumunuz sona erdi. NFC kartınızı okutun veya ana sayfaya dönün."
      >
        <Link
          href={HOME_PATH}
          className="auth-glass-submit flex min-h-[3rem] items-center justify-center no-underline"
        >
          Ana Sayfa
        </Link>
      </AuthMobileShell>
    );
  }

  const smartRedirect = await resolveSmartNfcEntryRedirect(uniqueId);
  if (smartRedirect) {
    redirect(smartRedirect);
  }

  let cardLookup: Awaited<ReturnType<typeof getNfcCardForAuthEntry>> | "fetch_error";

  try {
    cardLookup = await getNfcCardForAuthEntry(uniqueId);
  } catch {
    cardLookup = "fetch_error";
  }

  return (
    <NfcSmartEntryGate uniqueId={uniqueId}>
      <CardVerificationEntry
        uniqueId={uniqueId}
        cardLookup={cardLookup}
        idleExpired={idleExpired}
      />
    </NfcSmartEntryGate>
  );
}
