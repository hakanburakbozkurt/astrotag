import "server-only";

import { cookies } from "next/headers";
import { PENDING_NFC_COOKIE } from "@/lib/nfc/constants";
import { normalizeNfcUniqueId } from "@/lib/nfc/unique-id";

/** Auth sayfaları — query veya httpOnly çerezden ilk NFC kimliği */
export async function resolveInitialNfcId(queryNfc?: string): Promise<string> {
  const fromQuery = queryNfc?.trim();
  if (fromQuery) {
    return normalizeNfcUniqueId(fromQuery);
  }

  const cookieStore = await cookies();
  const pending = cookieStore.get(PENDING_NFC_COOKIE)?.value?.trim();
  if (pending) {
    return normalizeNfcUniqueId(pending);
  }

  return "";
}
