import CardVerificationEntry from "@/components/nfc/CardVerificationEntry";
import { normalizeNfcUniqueId } from "@/lib/nfc/unique-id";

type PageProps = {
  params: Promise<{ unique_id: string }>;
};

/** astrotag.app/{unique_id} — kart doğrulama girişi */
export default async function RootCardEntryPage({ params }: PageProps) {
  const { unique_id: rawId } = await params;
  const uniqueId = normalizeNfcUniqueId(rawId);

  console.log("[/[unique_id]/page] Kart doğrulama sayfası render:", {
    rawId,
    uniqueId,
  });

  return <CardVerificationEntry uniqueId={uniqueId} />;
}
