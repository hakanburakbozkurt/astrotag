import "server-only";

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
    logNfcError({ layer: "action", handler }, error);
    throw error;
  }
}
