import "server-only";

import { ACCOUNT_SUSPENDED_MESSAGE, INVALID_PIN_MESSAGE } from "@/lib/nfc/constants";
import { logNfcEvent } from "@/lib/nfc/error-logger";
import {
  NFC_CARD_AUTH_SELECT,
  NFC_CARD_SLUG_COLUMN,
  NFC_CARD_TABLE,
} from "@/lib/nfc/nfc-card-table";
import { ensureNfcCardForProfile } from "@/lib/nfc/nfc-provision.server";
import { normalizePinInput } from "@/lib/nfc/pin-input";
import { normalizeNfcUniqueId } from "@/lib/nfc/unique-id";
import { createServiceRoleClient } from "@/lib/supabase/service";

const CTX = { layer: "action" as const, handler: "checkCardPin" };

export type CheckCardPinSuccess = {
  ok: true;
  nfcCardUuid: string;
  profileId: string;
  slug: string;
};

export type CheckCardPinResult = CheckCardPinSuccess | { ok: false; error: string };

type NfcCardRow = {
  id: string;
  is_active: boolean;
};

type ProfileAuthRow = {
  id: string;
  pin_code: string | null;
  is_active: boolean;
};

/**
 * NFC + PIN doğrulama (profiles merkezli):
 * 1. profiles.nfc_uid ile profil bul
 * 2. profiles.pin_code eşleşmesi — yanlışsa "Hatalı şifre"
 * 3. nfc_user_data kartını profile bağla (oturum FK)
 */
export async function checkCardPin(
  uniqueId: string,
  pinCode: string
): Promise<CheckCardPinResult> {
  const slug = normalizeNfcUniqueId(uniqueId);
  const normalizedPin = normalizePinInput(pinCode).trim();

  if (!slug || normalizedPin.length < 4) {
    return { ok: false, error: INVALID_PIN_MESSAGE };
  }

  const admin = createServiceRoleClient();

  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("id, pin_code, is_active")
    .eq("nfc_uid", slug)
    .maybeSingle();

  if (profileError) {
    logNfcEvent("error", CTX, "profiles.nfc_uid sorgusu başarısız", {
      slug,
      code: profileError.code,
      message: profileError.message,
    });
    return { ok: false, error: INVALID_PIN_MESSAGE };
  }

  if (!profile?.id) {
    logNfcEvent("warn", CTX, "nfc_uid ile profil bulunamadı", { slug });
    return { ok: false, error: INVALID_PIN_MESSAGE };
  }

  const profileRow = profile as ProfileAuthRow;
  const profileId = profileRow.id.trim();
  const storedPin = profileRow.pin_code?.trim() ?? "";

  if (profileRow.is_active === false) {
    return { ok: false, error: ACCOUNT_SUSPENDED_MESSAGE };
  }

  if (!storedPin || storedPin !== normalizedPin) {
    return { ok: false, error: INVALID_PIN_MESSAGE };
  }

  const cardLink = await ensureNfcCardForProfile(slug, profileId, admin);

  if (!cardLink?.nfcCardUuid) {
    logNfcEvent("error", CTX, "Kart profile bağlanamadı", { slug, profileId });
    return { ok: false, error: INVALID_PIN_MESSAGE };
  }

  const { data: card, error: cardError } = await admin
    .from(NFC_CARD_TABLE)
    .select(NFC_CARD_AUTH_SELECT)
    .eq("id", cardLink.nfcCardUuid)
    .maybeSingle();

  if (cardError || !card) {
    return { ok: false, error: INVALID_PIN_MESSAGE };
  }

  const cardRow = card as NfcCardRow;

  if (!cardRow.is_active) {
    return { ok: false, error: ACCOUNT_SUSPENDED_MESSAGE };
  }

  return {
    ok: true,
    nfcCardUuid: cardLink.nfcCardUuid,
    profileId,
    slug,
  };
}
