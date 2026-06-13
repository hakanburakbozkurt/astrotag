import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import AuthMobileShell from "@/components/auth/AuthMobileShell";
import CardVerificationEntry from "@/components/nfc/CardVerificationEntry";
import { HOME_PATH, NFC_SESSION_COOKIE } from "@/lib/nfc/constants";
import { trySmartNfcSessionEntry } from "@/lib/nfc/smart-session.server";
import { getNfcCardForAuthEntry } from "@/lib/nfc/session.server";
import { normalizeNfcUniqueId } from "@/lib/nfc/unique-id";
import { createServiceRoleClient } from "@/lib/supabase/service";

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

  const cookieStore = await cookies();
  const sessionId = cookieStore.get(NFC_SESSION_COOKIE)?.value?.trim() ?? "";

  if (sessionId) {
    const admin = createServiceRoleClient();
    const resumeTo = await trySmartNfcSessionEntry(admin, uniqueId, sessionId);
    if (resumeTo) {
      redirect(resumeTo);
    }
  }

  let cardLookup: Awaited<ReturnType<typeof getNfcCardForAuthEntry>> | "fetch_error";

  try {
    cardLookup = await getNfcCardForAuthEntry(uniqueId);
  } catch {
    cardLookup = "fetch_error";
  }

  return (
    <CardVerificationEntry
      uniqueId={uniqueId}
      cardLookup={cardLookup}
      idleExpired={idleExpired}
    />
  );
}
