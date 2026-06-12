import "server-only";

import { INVALID_PIN_MESSAGE } from "@/lib/nfc/constants";
import { logNfcEvent } from "@/lib/nfc/error-logger";
import {
  NFC_CARD_AUTH_SELECT,
  NFC_CARD_SLUG_COLUMN,
  NFC_CARD_TABLE,
} from "@/lib/nfc/nfc-card-table";
import { resolveProfileForNfcCard } from "@/lib/nfc/nfc-profile-link.server";
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
  profile_id: string | null;
  is_active: boolean;
};

type ProfilePinRow = {
  id: string;
  nfc_uid: string | null;
  pin_code: string | null;
};

/**
 * NFC okutulduğunda:
 * 1. profiles tablosunda nfc_uid ile profil bul
 * 2. profiles.pin_code ile girilen PIN'i karşılaştır
 * 3. Doğruysa kartı profile bağla ve oturum açmaya izin ver
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

  const { data: card, error: cardError } = await admin
    .from(NFC_CARD_TABLE)
    .select(NFC_CARD_AUTH_SELECT)
    .eq(NFC_CARD_SLUG_COLUMN, slug)
    .maybeSingle();

  if (cardError) {
    logNfcEvent("error", CTX, "Kart sorgusu başarısız", {
      slug,
      code: cardError.code,
      message: cardError.message,
    });
    return { ok: false, error: INVALID_PIN_MESSAGE };
  }

  if (!card) {
    return { ok: false, error: INVALID_PIN_MESSAGE };
  }

  const cardRow = card as NfcCardRow;

  if (!cardRow.is_active) {
    return { ok: false, error: INVALID_PIN_MESSAGE };
  }

  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("id, nfc_uid, pin_code")
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

  let profileRow = profile as ProfilePinRow | null;

  if (!profileRow?.id) {
    const resolvedProfileId = await resolveProfileForNfcCard(admin, {
      nfcCardUuid: cardRow.id,
      slug,
      cardProfileId: cardRow.profile_id,
    });

    if (!resolvedProfileId) {
      return { ok: false, error: INVALID_PIN_MESSAGE };
    }

    const { data: resolved, error: resolvedError } = await admin
      .from("profiles")
      .select("id, nfc_uid, pin_code")
      .eq("id", resolvedProfileId)
      .maybeSingle();

    if (resolvedError || !resolved?.id) {
      return { ok: false, error: INVALID_PIN_MESSAGE };
    }

    profileRow = resolved as ProfilePinRow;
  }

  const profileId = profileRow.id.trim();
  const storedPin = profileRow.pin_code?.trim() ?? "";

  if (storedPin && storedPin !== normalizedPin) {
    return { ok: false, error: INVALID_PIN_MESSAGE };
  }

  if (!storedPin) {
    logNfcEvent("info", CTX, "PIN henüz atanmamış — kayıt tamamlama bekleniyor", {
      profileId,
      slug,
    });
  }

  await resolveProfileForNfcCard(admin, {
    nfcCardUuid: cardRow.id,
    slug,
    cardProfileId: profileId,
  });

  return {
    ok: true,
    nfcCardUuid: cardRow.id,
    profileId,
    slug,
  };
}
