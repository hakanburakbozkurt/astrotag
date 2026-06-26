"use server";

import { resolveSmartNfcEntryRedirect } from "@/lib/nfc/nfc-smart-entry.server";

export async function confirmSmartNfcEntryAction(
  uniqueId: string,
  clientLastLoginMs: number | null
): Promise<{ redirectTo: string } | null> {
  const redirectTo = await resolveSmartNfcEntryRedirect(uniqueId, {
    clientLastLoginMs,
  });

  if (!redirectTo) {
    return null;
  }

  return { redirectTo };
}
