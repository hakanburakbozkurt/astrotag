import CardVerificationEntry from "@/components/nfc/CardVerificationEntry";
import NfcSmartEntryGate from "@/components/nfc/NfcSmartEntryGate";
import { logNfcEvent } from "@/lib/nfc/error-logger";
import { ensureNfcCardForProfile } from "@/lib/nfc/nfc-provision.server";
import { resolveSmartNfcEntryRedirect } from "@/lib/nfc/nfc-smart-entry.server";
import { getNfcCardForAuthEntry } from "@/lib/nfc/session.server";
import { normalizeNfcUniqueId } from "@/lib/nfc/unique-id";
import { createServiceRoleClient } from "@/lib/supabase/service";
import { redirect } from "next/navigation";

type PageProps = {
  params: Promise<{ unique_id: string }>;
};

/** astrotag.app/{unique_id} — kart doğrulama girişi */
export default async function RootCardEntryPage({ params }: PageProps) {
  const { unique_id: rawId } = await params;
  const uniqueId = normalizeNfcUniqueId(rawId);

  const smartRedirect = await resolveSmartNfcEntryRedirect(uniqueId);
  if (smartRedirect) {
    redirect(smartRedirect);
  }

  try {
    const admin = createServiceRoleClient();
    const { data: profile } = await admin
      .from("profiles")
      .select("id")
      .eq("nfc_uid", uniqueId)
      .maybeSingle();

    if (profile?.id) {
      const link = await ensureNfcCardForProfile(uniqueId, profile.id, admin);

      if (link) {
        logNfcEvent(
          "info",
          { layer: "action", handler: "RootCardEntryPage/provision" },
          "NFC okuma — kart profile bağlandı",
          {
            uniqueId,
            profileId: profile.id,
            nfcCardUuid: link.nfcCardUuid,
          }
        );
      }
    }
  } catch (error) {
    logNfcEvent(
      "warn",
      { layer: "action", handler: "RootCardEntryPage/provision" },
      "Kart bağlama atlandı",
      {
        uniqueId,
        message: error instanceof Error ? error.message : String(error),
      }
    );
  }

  let cardLookup: Awaited<ReturnType<typeof getNfcCardForAuthEntry>> | "fetch_error";

  try {
    cardLookup = await getNfcCardForAuthEntry(uniqueId);
  } catch (error) {
    logNfcEvent(
      "error",
      { layer: "action", handler: "RootCardEntryPage" },
      "resolveNfcCardForAuth başarısız",
      {
        uniqueId,
        message: error instanceof Error ? error.message : String(error),
      }
    );
    cardLookup = "fetch_error";
  }

  return (
    <NfcSmartEntryGate uniqueId={uniqueId}>
      <CardVerificationEntry uniqueId={uniqueId} cardLookup={cardLookup} />
    </NfcSmartEntryGate>
  );
}
