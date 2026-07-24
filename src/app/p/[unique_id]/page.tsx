import { redirect } from "next/navigation";
import Starfield from "@/components/Starfield";
import NfcCardPinGate from "@/components/nfc/NfcCardPinGate";
import { resolveNfcScanAccess } from "@/lib/nfc/nfc-scan-access.server";
import { normalizeNfcUniqueId } from "@/lib/nfc/unique-id";

type PageProps = {
  params: Promise<{ unique_id: string }>;
};

/** /p/{at_xxx} — profil verisi yalnızca kart sahibi oturumu doğrulanınca; aksi halde PIN kapısı */
export default async function PublicNfcProfilePage({ params }: PageProps) {
  const { unique_id: rawId } = await params;
  const uniqueId = normalizeNfcUniqueId(rawId);
  const access = await resolveNfcScanAccess(uniqueId);

  if (access.ok) {
    redirect(access.redirectTo);
  }

  if (access.reason === "account_suspended") {
    redirect(access.pinEntryPath);
  }

  return (
    <main className="relative min-h-dvh overflow-hidden">
      <Starfield />

      <div className="relative flex min-h-dvh items-center justify-center px-6 py-12">
        <NfcCardPinGate
          uniqueId={uniqueId || rawId}
          reason={access.reason}
          message={
            access.reason === "inactive" ? access.message : access.message
          }
        />
      </div>
    </main>
  );
}
