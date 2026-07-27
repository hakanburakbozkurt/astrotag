import "server-only";

import { resolveNfcTagRedirect } from "@/lib/nfc/nfc-tag-redirect.server";
import { normalizeNfcUniqueId } from "@/lib/nfc/unique-id";

export type EstablishNfcTapSessionResult =
  | { ok: true; redirectTo: string }
  | { ok: false; reason: string; fallbackTo: string };

/** NFC dokunuşu — yalnızca yönlendirme kısayolu */
export async function establishNfcTapSession(
  rawUniqueId: string,
  options?: { returnTo?: string }
): Promise<EstablishNfcTapSessionResult> {
  const uniqueId = normalizeNfcUniqueId(rawUniqueId);
  const query = options?.returnTo ? { to: options.returnTo } : undefined;
  const redirectTo = await resolveNfcTagRedirect(uniqueId, query);

  return { ok: true, redirectTo };
}
