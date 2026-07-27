import "server-only";

import { DASHBOARD_PATH, NFC_SUSPENDED_PATH } from "@/lib/nfc/constants";
import { nfcCardValidationErrorMessage } from "@/lib/nfc/card-validation-messages";
import { getAuthProfileContext } from "@/lib/auth/require-profile.server";
import { validateNfcCardActive } from "@/lib/nfc/session.server";
import { normalizeNfcUniqueId } from "@/lib/nfc/unique-id";
import { AUTH_LOGIN_PATH } from "@/lib/nfc/constants";

function pickQueryValue(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return value[0]?.trim() || undefined;
  }
  return value?.trim() || undefined;
}

function loginPathForTag(
  uniqueId: string,
  query?: Record<string, string | string[] | undefined>
): string {
  const params = new URLSearchParams({ nfc: uniqueId });
  const module = pickQueryValue(query?.module);
  const to = pickQueryValue(query?.to);

  if (module) {
    params.set("module", module);
  }
  if (to) {
    params.set("to", to);
  }

  return `${AUTH_LOGIN_PATH}?${params.toString()}`;
}

/**
 * NFC etiketi — yalnızca yönlendirme kısayolu.
 * Oturum varsa dashboard; yoksa e-posta girişi.
 */
export async function resolveNfcTagRedirect(
  rawUniqueId: string,
  query?: Record<string, string | string[] | undefined>
): Promise<string> {
  const uniqueId = normalizeNfcUniqueId(rawUniqueId);
  const to = pickQueryValue(query?.to);

  if (!uniqueId.startsWith("at_")) {
    return loginPathForTag(uniqueId || rawUniqueId, query);
  }

  const card = await validateNfcCardActive(uniqueId);
  if (!card.ok) {
    if (card.reason === "inactive") {
      return NFC_SUSPENDED_PATH;
    }

    return loginPathForTag(
      uniqueId,
      query
    );
  }

  const authProfile = await getAuthProfileContext();
  if (authProfile) {
    return to ?? DASHBOARD_PATH;
  }

  return loginPathForTag(uniqueId, query);
}

export function nfcTagRedirectMessage(uniqueId: string): string {
  return nfcCardValidationErrorMessage("not_found");
}
