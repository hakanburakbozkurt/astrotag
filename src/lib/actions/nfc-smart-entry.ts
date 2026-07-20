"use server";

import { resolveSmartNfcEntryRedirect } from "@/lib/nfc/nfc-smart-entry.server";

export async function confirmSmartNfcEntryAction(
  uniqueId: string,
  clientLastLoginMs: number | null,
  searchParams?: Record<string, string | string[] | undefined>
): Promise<{ redirectTo: string } | null> {
  console.log("[NFC_SMART_ENTRY/action]", {
    uniqueId,
    clientLastLoginMs,
    searchParams: searchParams ?? null,
  });

  const redirectTo = await resolveSmartNfcEntryRedirect(uniqueId, {
    clientLastLoginMs,
    searchParams,
  });

  if (!redirectTo) {
    console.log("[NFC_SMART_ENTRY/action] PIN ekranına düşülecek", { uniqueId });
    return null;
  }

  console.log("[NFC_SMART_ENTRY/action] client redirect →", redirectTo);
  return { redirectTo };
}
