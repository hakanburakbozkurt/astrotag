import CardVerificationEntry from "@/components/nfc/CardVerificationEntry";
import { logNfcEvent } from "@/lib/nfc/error-logger";
import { getNfcCardForAuthEntry } from "@/lib/nfc/session.server";
import { normalizeNfcUniqueId } from "@/lib/nfc/unique-id";

type PageProps = {
  params: Promise<{ unique_id: string }>;
};

/** astrotag.app/{unique_id} — kart doğrulama girişi */
export default async function RootCardEntryPage({ params }: PageProps) {
  const { unique_id: rawId } = await params;
  const uniqueId = normalizeNfcUniqueId(rawId);

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
    <CardVerificationEntry uniqueId={uniqueId} cardLookup={cardLookup} />
  );
}
