import { redirect } from "next/navigation";
import { resolveNfcTagRedirect } from "@/lib/nfc/nfc-tag-redirect.server";
import { normalizeNfcUniqueId } from "@/lib/nfc/unique-id";

type PageProps = {
  params: Promise<{ unique_id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/** /c/{at_xxx} — NFC etiket kısayolu (misafir tarama) */
export default async function NfcGuestScanPage({ params, searchParams }: PageProps) {
  const { unique_id: rawId } = await params;
  const query = await searchParams;
  const uniqueId = normalizeNfcUniqueId(rawId);

  redirect(await resolveNfcTagRedirect(uniqueId, query));
}
