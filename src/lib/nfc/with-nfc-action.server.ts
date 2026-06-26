import "server-only";

import { logNfcActionCriticalCatch } from "@/lib/auth/nfc-auth-debug";
import { logNfcError } from "@/lib/nfc/error-logger";

/**
 * Server action'ları try/catch ile sarar; hatayı terminale detaylı basar.
 */
export async function withNfcAction<T>(
  handler: string,
  fn: () => Promise<T>
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    logNfcActionCriticalCatch(`${handler}/withNfcAction`, error);
    logNfcError({ layer: "action", handler }, error);
    console.error(`[NFC:action:${handler}] ── server action exception (rethrow)`);
    throw error;
  }
}
