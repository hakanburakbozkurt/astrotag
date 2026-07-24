import { nfcLoginPathForUniqueId } from "@/lib/nfc/card-paths";
import { logNfcEvent } from "@/lib/nfc/error-logger";
import { ensureNfcCardForProfile } from "@/lib/nfc/nfc-provision.server";
import { resolveNfcScanAccess } from "@/lib/nfc/nfc-scan-access.server";
import { normalizeNfcUniqueId } from "@/lib/nfc/unique-id";
import { createServiceRoleClient } from "@/lib/supabase/service";
import { redirect } from "next/navigation";

type PageProps = {
  params: Promise<{ unique_id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function pickQueryValue(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return value[0]?.trim() || undefined;
  }

  return value?.trim() || undefined;
}

function pinRedirectFor(
  uniqueId: string,
  query?: Record<string, string | string[] | undefined>
): string {
  return nfcLoginPathForUniqueId(uniqueId, {
    module: pickQueryValue(query?.module),
    to: pickQueryValue(query?.to),
  });
}

/** astrotag.app/{unique_id} — kart doğrulama girişi */
export default async function RootCardEntryPage({ params, searchParams }: PageProps) {
  const { unique_id: rawId } = await params;
  const query = await searchParams;
  const uniqueId = normalizeNfcUniqueId(rawId);

  console.log("[NFC_ENTRY /[unique_id]]", {
    rawId,
    uniqueId,
    search: query,
  });

  const access = await resolveNfcScanAccess(uniqueId, {
    searchParams: query,
  });

  if (access.ok) {
    console.log("[NFC_ENTRY /[unique_id]] owner session →", access.redirectTo);
    redirect(access.redirectTo);
  }

  console.log("[NFC_ENTRY /[unique_id]] PIN gerekli —", {
    uniqueId,
    reason: access.reason,
    pinEntryPath: access.pinEntryPath,
  });

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

  redirect(
    access.reason === "account_suspended"
      ? access.pinEntryPath
      : pinRedirectFor(uniqueId, query)
  );
}
