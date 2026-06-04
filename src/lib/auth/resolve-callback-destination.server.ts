import "server-only";

import { getAuthPendingCookie } from "@/lib/auth/auth-pending-cookie.server";
import { cardEntryPathForUniqueId } from "@/lib/nfc/card-paths";
import { HOME_PATH } from "@/lib/nfc/constants";

function sanitizeNextPath(next: string | null | undefined): string | null {
  if (!next?.trim()) {
    return null;
  }

  const value = next.trim();
  if (!value.startsWith("/") || value.startsWith("//")) {
    return null;
  }

  return value;
}

/** E-posta / PKCE callback sonrası hedef rota (sunucu). */
export async function resolveAuthCallbackDestination(
  explicitNext?: string | null
): Promise<string> {
  const safeNext = sanitizeNextPath(explicitNext);
  if (safeNext) {
    return safeNext;
  }

  const pending = await getAuthPendingCookie();
  if (pending?.nfcId) {
    return cardEntryPathForUniqueId(pending.nfcId);
  }

  return HOME_PATH;
}
