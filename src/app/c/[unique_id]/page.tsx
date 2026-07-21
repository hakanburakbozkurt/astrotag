import Link from "next/link";
import { redirect } from "next/navigation";
import Starfield from "@/components/Starfield";
import { HOME_PATH, NFC_CARD_INACTIVE_MESSAGE } from "@/lib/nfc/constants";
import { nfcCardValidationErrorMessage } from "@/lib/nfc/card-validation-messages";
import {
  resolveGuestNfcScanRedirect,
  type GuestNfcScanFailureReason,
} from "@/lib/nfc/resolve-guest-nfc-scan.server";
import { normalizeNfcUniqueId } from "@/lib/nfc/unique-id";

type PageProps = {
  params: Promise<{ unique_id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function scanErrorMessage(reason: GuestNfcScanFailureReason): string {
  if (reason === "inactive") {
    return NFC_CARD_INACTIVE_MESSAGE;
  }

  if (reason === "invalid_format") {
    return "Geçersiz NFC kart kodu.";
  }

  if (reason === "config_error") {
    return "Sunucu yapılandırması eksik.";
  }

  return nfcCardValidationErrorMessage(reason);
}

/**
 * /c/{at_xxx} — misafir NFC taraması (oturum gerekmez).
 * Kart eşleşince /p/{id} veya oturum varsa dashboard hedefine yönlendirir.
 */
export default async function NfcGuestScanPage({ params, searchParams }: PageProps) {
  const { unique_id: rawId } = await params;
  const query = await searchParams;
  const uniqueId = normalizeNfcUniqueId(rawId);

  console.log("[NFC_GUEST_SCAN /c/[unique_id]]", {
    rawId,
    uniqueId,
    search: query,
  });

  const result = await resolveGuestNfcScanRedirect(uniqueId, {
    searchParams: query,
  });

  if (result.ok) {
    console.log("[NFC_GUEST_SCAN /c/[unique_id]] redirect →", {
      redirectTo: result.redirectTo,
      mode: result.mode,
    });
    redirect(result.redirectTo);
  }

  console.warn("[NFC_GUEST_SCAN /c/[unique_id]] kart reddedildi:", {
    uniqueId,
    reason: result.reason,
  });

  return (
    <main className="relative min-h-dvh overflow-hidden">
      <Starfield />
      <div className="relative flex min-h-dvh items-center justify-center px-6 py-12">
        <div className="max-w-sm text-center">
          <p className="text-[10px] uppercase tracking-[0.28em] text-amber-400/70">
            NFC Tarama
          </p>
          <p className="mt-4 text-sm text-red-300/90">{scanErrorMessage(result.reason)}</p>
          <p className="mt-3 font-mono text-[11px] text-white/30">{uniqueId || rawId}</p>
          <Link
            href={HOME_PATH}
            className="mt-8 inline-block rounded-xl border border-white/15 px-5 py-2.5 text-xs uppercase tracking-widest text-white/60"
          >
            Ana sayfa
          </Link>
        </div>
      </div>
    </main>
  );
}
