import { redirect } from "next/navigation";
import { resolveNfcScanAccess } from "@/lib/nfc/nfc-scan-access.server";
import { normalizeNfcUniqueId } from "@/lib/nfc/unique-id";

type PageProps = {
  params: Promise<{ unique_id: string }>;
};

/** /p/{at_xxx} — oturum yoksa PIN ekranına; oturum varsa panele */
export default async function PublicNfcProfilePage({ params }: PageProps) {
  const { unique_id: rawId } = await params;
  const uniqueId = normalizeNfcUniqueId(rawId);
  const access = await resolveNfcScanAccess(uniqueId);

  if (access.ok) {
    redirect(access.redirectTo);
  }

  redirect(access.pinEntryPath);
}
