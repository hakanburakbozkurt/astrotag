import { redirect } from "next/navigation";
import { cardEntryPathForUniqueId } from "@/lib/nfc/card-paths";
import { normalizeNfcUniqueId } from "@/lib/nfc/unique-id";

type PageProps = {
  params: Promise<{ unique_id: string }>;
};

/** Eski /c/{unique_id} rotası → /{unique_id} */
export default async function LegacyNfcCardEntryPage({ params }: PageProps) {
  const { unique_id: rawId } = await params;
  const uniqueId = normalizeNfcUniqueId(rawId);
  const targetPath = cardEntryPathForUniqueId(uniqueId);

  console.log("[/c/[unique_id]/page] Rota tetiklendi:", {
    rawId,
    uniqueId,
    targetPath,
  });

  redirect(targetPath);
}
