"use server";

import { resolveAuthCallbackDestination } from "@/lib/auth/resolve-callback-destination.server";
import { withNfcAction } from "@/lib/nfc/with-nfc-action.server";

/** E-posta doğrulama callback sonrası hedef rota (server action) */
export async function resolveAuthCallbackDestinationAction(
  explicitNext?: string | null
): Promise<string> {
  return withNfcAction("resolveAuthCallbackDestinationAction", async () =>
    resolveAuthCallbackDestination(explicitNext)
  );
}
